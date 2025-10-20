"use server";

import { db } from "@/db";
import { createPublicFormClient } from "@/lib/supabase/server";
import {
  customers,
  properties,
  subscriptions,
  checklistFiles,
} from "@/db/schema";
import { SignupFormData, signupFormSchema } from "../validations/bookng-modal";
import Stripe from 'stripe';
import { ICalService } from "../services/iCal/ical.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

async function geocodeAddress(address: string): Promise<{ latitude: string; longitude: string } | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
      };
    }

    console.warn('Geocoding failed during onboarding:', data.status, address);
    return null;
  } catch (error) {
    console.error('Geocoding error during onboarding:', error);
    return null;
  }
}

export async function completeOnboarding(
  formData: SignupFormData,
  paymentIntentId: string
) {
  try {
    
    const validatedData = signupFormSchema.parse(formData);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const stripeCustomerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null;

    if (!stripeCustomerId) {
      throw new Error("Critical: Could not find a Stripe Customer ID associated with this payment.");
    }

    const {
      name,
      email,
      phoneNumber,
      address,
      sqft,
      bedrooms,
      bathrooms,
      hasHotTub,
      laundryService,
      laundryLoads,
      hotTubService,
      hotTubDrain,
      hotTubDrainCadence,
      subscriptionMonths,
      checklistFile,
      useDefaultChecklist,
      iCalUrl,
      firstCleanDate,
    } = validatedData;

    // ✅ Geocode the address
    const coordinates = await geocodeAddress(address);

    const result = await db.transaction(async (tx) => {
      
      const [customer] = await tx
        .insert(customers)
        .values({ 
          name, 
          email, 
          phone: phoneNumber,
          stripeCustomerId
        })
        .onConflictDoUpdate({
          target: customers.email,
          set: { 
            name, 
            phone: phoneNumber, 
            stripeCustomerId, 
            updatedAt: new Date() 
          },
        })
        .returning();

      // ✅ Build property values with geocoded data
      const propertyValues: any = {
        customerId: customer.id,
        address,
        sqFt: sqft,
        bedCount: bedrooms,
        bathCount: String(bathrooms),
        hasHotTub,
        laundryType: laundryService,
        laundryLoads,
        hotTubServiceLevel: hotTubService,
        hotTubDrain: hotTubDrain,
        hotTubDrainCadence,
        useDefaultChecklist: useDefaultChecklist,
        iCalUrl,
      };

      // ✅ Add geocoded coordinates if available
      if (coordinates) {
        propertyValues.latitude = coordinates.latitude;
        propertyValues.longitude = coordinates.longitude;
        propertyValues.geocodedAt = new Date();
      }

      const [property] = await tx
        .insert(properties)
        .values(propertyValues)
        .returning()
        .catch((err) => {
    console.error('DETAILED INSERT ERROR:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      constraint: err.constraint,
      table: err.table,
      column: err.column,
      dataType: err.dataType,
      values: propertyValues
    });
    throw err;
  });

      if (checklistFile && checklistFile.length > 0) {
        for (const file of checklistFile) {
          const storagePath = `checklists/${property.id}/${file.name}`;
          const supabase = await createPublicFormClient();
          const { error: uploadError } = await supabase.storage
            .from("checklists")
            .upload(storagePath, file);

          if (uploadError) {
            throw new Error(
              `Failed to upload checklist: ${uploadError.message}`
            );
          }

          await tx.insert(checklistFiles).values({
            propertyId: property.id,
            fileName: file.name,
            storagePath: storagePath,
            fileSize: file.size,
          });
        }
      }

      const startDate = new Date(firstCleanDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + subscriptionMonths);

      const [subscription] = await tx
        .insert(subscriptions)
        .values({
          customerId: customer.id,
          propertyId: property.id,
          stripeSubscriptionId: null,
          durationMonths: subscriptionMonths,
          firstCleanPaymentId: paymentIntentId,
          isFirstCleanPrepaid: true,
          status: "active",
          startDate: firstCleanDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .returning();

      return { customer, property, subscription };
    });

    if (result.subscription && iCalUrl) {
      console.log(`Onboarding successful. Triggering initial calendar sync for subscription: ${result.subscription.id}`);
      try {
        const icalService = new ICalService(db);
        await icalService.syncCalendar({ subscriptionId: result.subscription.id });
        console.log("Initial calendar sync completed successfully.");
      } catch (syncError) {
        console.error(
          `CRITICAL: Initial calendar sync failed for new subscription ${result.subscription.id}`,
          syncError
        );
      }
    }

    console.log("Successfully saved to database:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("CRITICAL: Onboarding failed after successful payment.", {
      paymentIntentId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      formData,
    });

    return {
      success: false,
      error: "Failed to save subscription details. Please contact support.",
    };
  }
}