import { schema } from "@/db";
import { jobs } from "@/db/schemas";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as webcal from "node-ical";
import { VEvent } from "node-ical";
import { fromZonedTime } from 'date-fns-tz';

type NewJob = typeof jobs.$inferInsert;
type DrizzleDb = NodePgDatabase<typeof schema>;

const IANA_TIMEZONE = "America/New_York";
const DEFAULT_CHECKIN_TIME = "T16:00:00"; // 4:00 PM
const DEFAULT_CHECKOUT_TIME = "T09:00:00"; // 9:00 AM
const isDateOnly = (event: VEvent): boolean => {
  // Use node-ical's datetype property to definitively detect date-only events
  // 'date' = date-only (VALUE=DATE in iCal, use default times)
  // 'date-time' = timed event (use actual times from calendar)
  return event.datetype === 'date';
};

const createFloridaDate = (date: Date, timeStr: string): Date => {
  // node-ical parses VALUE=DATE fields with system timezone offset
  // We need to normalize to the actual calendar date first
  // If the time has an offset (like 06:00:00Z from UTC-6 system), adjust it
  const offsetHours = date.getUTCHours();

  let normalizedDate = date;
  if (offsetHours > 0 && offsetHours <= 14) {
    // Subtract the offset to get back to the actual calendar date at midnight
    normalizedDate = new Date(date.getTime() - (offsetHours * 60 * 60 * 1000));
  }

  const year = normalizedDate.getUTCFullYear();
  const month = normalizedDate.getUTCMonth() + 1;
  const day = normalizedDate.getUTCDate();

  const dateOnlyStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  const localTimeStr = `${dateOnlyStr}${timeStr}`; // e.g., "2025-11-08T16:00:00"

  // Convert from Florida time to UTC
  const utcDate = fromZonedTime(localTimeStr, IANA_TIMEZONE);

  return utcDate;
};

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

    // Filter out events that start less than 7 days from today
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 7);
    cutoffDate.setHours(0, 0, 0, 0);

    const filteredEvents = sortedEvents.filter((event) => {
      const eventStartDate = new Date(event.start);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() >= cutoffDate.getTime();
    });

    const allJobsToInsert: NewJob[] = filteredEvents.map((event, index) => {
      // Check if event is date-only (uses datetype property from node-ical)
      const isEndDateOnly = isDateOnly(event);

      // For date-only events, use default Florida times (9am checkout, 4pm checkin)
      // For timed events, use the actual times from the calendar
      const jobStartTime: Date = isEndDateOnly
        ? createFloridaDate(event.end, DEFAULT_CHECKOUT_TIME) // 9:00 AM
        : event.end;

      const nextEvent = filteredEvents[index + 1];

      // Process cleaning deadline (next guest checkin or 4 PM same day)
      let jobDeadline: Date;
      if (nextEvent) {
        const isNextStartDateOnly = isDateOnly(nextEvent);
        jobDeadline = isNextStartDateOnly
          ? createFloridaDate(nextEvent.start, DEFAULT_CHECKIN_TIME)
          : nextEvent.start;
      } else {
        jobDeadline = createFloridaDate(event.end, DEFAULT_CHECKIN_TIME);
      }

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
