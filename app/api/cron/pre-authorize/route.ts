import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties, subscriptions, customers } from "@/db/schemas";
import { eq, and, isNull, gte, lt } from "drizzle-orm"; // Import gte and lt
import { PricingService } from "@/lib/services/pricing.service";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const pricingService = new PricingService();

export async function POST(req: NextRequest) {
  const authToken = (req.headers.get("authorization") || "").split("Bearer ")[1];
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(now.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const dayAfterTomorrowStart = new Date(tomorrowStart);
  dayAfterTomorrowStart.setDate(tomorrowStart.getDate() + 1);
  

  try {
    const jobsToProcess = await db
      .select({
        jobId: jobs.id,
        propertyData: properties,
        stripeCustomerId: customers.stripeCustomerId,
      })
      .from(jobs)
      .innerJoin(subscriptions, eq(jobs.subscriptionId, subscriptions.id))
      .innerJoin(properties, eq(subscriptions.propertyId, properties.id))
      .innerJoin(customers, eq(subscriptions.customerId, customers.id))
      .where(
        and(
          gte(jobs.checkOutTime, tomorrowStart),
          lt(jobs.checkOutTime, dayAfterTomorrowStart),
          isNull(jobs.paymentIntentId)
        )
      );

    if (jobsToProcess.length === 0) {
      return NextResponse.json({ message: "No jobs to process for tomorrow." });
    }

    const processingPromises = jobsToProcess.map(async (job) => {
      try {
        if (!job.stripeCustomerId) {
          throw new Error(`Job ${job.jobId} is missing a Stripe Customer ID.`);
        }
        
        const priceDetails = await pricingService.calculatePrice(job.propertyData as any);
        const amountInCents = Math.round(priceDetails.totalPerClean * 100);

        const paymentMethods = await stripe.paymentMethods.list({
            customer: job.stripeCustomerId,
            type: 'card',
        });
        
        if (paymentMethods.data.length === 0) {
            throw new Error(`No saved payment method found for customer ${job.stripeCustomerId}`);
        }
        const paymentMethodId = paymentMethods.data[0].id;
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          customer: job.stripeCustomerId,
          payment_method: paymentMethodId,
          capture_method: "manual",
          confirm: true,
        });

        await db
          .update(jobs)
          .set({ 
              paymentIntentId: paymentIntent.id, 
              paymentStatus: 'authorized' 
            })
          .where(eq(jobs.id, job.jobId));

        return { jobId: job.jobId, status: "success" };

      } catch (error: any) {
        console.error(`Failed to process job ${job.jobId}:`, error.message);
        await db
          .update(jobs)
          .set({ 
              paymentStatus: 'failed', 
              notes: error.message 
            })
          .where(eq(jobs.id, job.jobId));
        return { jobId: job.jobId, status: "failed", error: error.message };
      }
    });

    const results = await Promise.all(processingPromises);
    
    return NextResponse.json({
      message: "Pre-authorization process completed.",
      processedCount: results.length,
      results,
    });

  } catch (error: any) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}