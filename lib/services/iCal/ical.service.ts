import { schema } from "@/db";
import { jobs } from "@/db/schemas";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as webcal from "node-ical";
import { VEvent } from "node-ical";

type NewJob = typeof jobs.$inferInsert;
type DrizzleDb = NodePgDatabase<typeof schema>;

const BATCH_SIZE = 100;

type SyncInput = {
  subscriptionId?: string;
  propertyId?: string;
};

type SyncContext = {
  subscriptionId: string;
  propertyId: string;
  iCalUrl: string;
};

type PropertyDetails = {
  bedCount: number;
  bathCount: string;
  sqFt: number | null;
  laundryType: string;
  laundryLoads: number | null;
  hotTubServiceLevel: boolean;
  hotTubDrainCadence: string | null;
};

export class ICalService {
  private db: DrizzleDb;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  public async syncCalendar(args: SyncInput) {
    console.log(`Starting calendar sync with args:`, args);

    const contextResult = await this._getContext(args);
    if (!contextResult.success || !contextResult.data) {
      return { success: false, message: contextResult.message };
    }

    const { subscriptionId, propertyId, iCalUrl } = contextResult.data;

    const events = await this._fetchAndParseCalendar(iCalUrl);
    if (!events) {
      return { success: false, message: "Failed to fetch or parse calendar." };
    }

    console.log(`Found ${events.length} events in the calendar.`);
    if (events.length === 0) {
      return {
        success: true,
        message: "Calendar is empty, nothing to sync.",
        totalSynced: 0,
      };
    }

    // Get property details for calculating expected hours
    const property = await this.db.query.properties.findFirst({
      where: eq(schema.properties.id, propertyId),
    });

    if (!property) {
      return { success: false, message: "Property not found." };
    }

    const result = await this._processAndSaveEventsInBatches(
      events,
      {
        subscriptionId,
        propertyId,
      },
      property
    );

    console.log(`Sync complete. Total jobs synced: ${result.totalSynced}`);
    return { success: true, ...result };
  }

  private async _getContext(
    args: SyncInput
  ): Promise<{ success: boolean; data?: SyncContext; message?: string }> {
    const { subscriptionId, propertyId } = args;

    if (subscriptionId) {
      const subscription = await this.db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.id, subscriptionId),
        with: { property: true },
      });
      if (!subscription)
        return { success: false, message: "Subscription not found." };
      if (!subscription.property?.iCalUrl)
        return {
          success: false,
          message: "No iCal URL found for the subscription's property.",
        };

      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          propertyId: subscription.propertyId,
          iCalUrl: subscription.property.iCalUrl,
        },
      };
    }

    if (propertyId) {
      const property = await this.db.query.properties.findFirst({
        where: eq(schema.properties.id, propertyId),
      });
      if (!property) return { success: false, message: "Property not found." };
      if (!property.iCalUrl)
        return {
          success: false,
          message: "No iCal URL found for this property.",
        };

      const activeSubscription = await this.db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.propertyId, propertyId),
          eq(schema.subscriptions.status, "active")
        ),
      });

      if (!activeSubscription)
        return {
          success: false,
          message: "No active subscription found for this property.",
        };

      return {
        success: true,
        data: {
          subscriptionId: activeSubscription.id,
          propertyId: property.id,
          iCalUrl: property.iCalUrl,
        },
      };
    }

    return {
      success: false,
      message: "Either subscriptionId or propertyId must be provided.",
    };
  }

  private async _fetchAndParseCalendar(url: string): Promise<VEvent[] | null> {
    try {
      const icsData = await fetch(url).then((res) => res.text());
      const calendarData = await webcal.async.parseICS(icsData);
      return Object.values(calendarData).filter(
        (e) => e.type === "VEVENT"
      ) as VEvent[];
    } catch (error) {
      console.error("Error fetching or parsing calendar:", error);
      return null;
    }
  }

  private _calculateExpectedHours(property: PropertyDetails): number {
    const { bedCount, bathCount, sqFt, laundryType, hotTubServiceLevel } =
      property;

    // Base time formula from spec
    const bathCountNum = Number(bathCount);
    let baseTime = -0.585 + 0.95 * bedCount + 0.62 * bathCountNum;
    if (sqFt) {
      baseTime += 0.1905 * (sqFt / 250);
    }

    // Determine job size
    let jobSize: "small" | "medium" | "large";
    if (bedCount <= 2) jobSize = "small";
    else if (bedCount <= 4) jobSize = "medium";
    else jobSize = "large";

    if (laundryType === "off_site") {
      if (jobSize === "small") baseTime += 1.25;
      else if (jobSize === "medium") baseTime += 1.75;
      else baseTime += 2.25;
    }

    // Add hot tub time
    if (hotTubServiceLevel === true) {
      baseTime += 0.333;
    }

    // Round to 2 decimals
    return Math.round(baseTime * 100) / 100;
  }

  private async _processAndSaveEventsInBatches(
    events: VEvent[],
    context: { subscriptionId: string; propertyId: string },
    property: PropertyDetails
  ) {
    const expectedHours = this._calculateExpectedHours(property);

    // Sort events by start time to determine next guest check-in times
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const allJobsToInsert: NewJob[] = sortedEvents.map((event, index) => {
      const jobStartTime = event.end;
      const nextEvent = sortedEvents[index + 1];
      const jobDeadline =
        nextEvent?.start || new Date(new Date(event.end).setHours(16, 0, 0, 0)); // Default 4 PM same day

      return {
        ...context,
        checkInTime: jobStartTime,
        checkOutTime: jobDeadline,
        calendarEventUid: event.uid,
        status: "unassigned" as const,
        expectedHours: expectedHours.toString(),
        addonsSnapshot: {
          laundryType: property.laundryType,
          laundryLoads: property.laundryLoads,
          hotTubServiceLevel: property.hotTubServiceLevel ? "basic" : "none",
          hotTubDrainCadence: property.hotTubDrainCadence,
        },
      };
    });

    let totalSynced = 0;

    for (let i = 0; i < allJobsToInsert.length; i += BATCH_SIZE) {
      const batch = allJobsToInsert.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

      try {
        const result = await this.db
          .insert(jobs)
          .values(batch)
          .onConflictDoUpdate({
            target: jobs.calendarEventUid,
            set: {
              checkInTime: jobs.checkInTime,
              checkOutTime: jobs.checkOutTime,
              expectedHours: jobs.expectedHours,
              addonsSnapshot: jobs.addonsSnapshot,
            },
          })
          .returning({ id: jobs.id });

        totalSynced += result.length;
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
      }
    }

    return {
      message: `Successfully synced ${totalSynced} of ${allJobsToInsert.length} total events.`,
      totalSynced,
    };
  }
}
