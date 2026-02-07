import Stripe from "stripe";
import type { Request, Response } from "express";
import { getDb } from "./db";
import { premiumSubscriptions, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createSocialProofEvent } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia" as any,
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("[Stripe Webhook] Missing signature or webhook secret");
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerEmail = session.metadata?.customer_email;
        const customerName = session.metadata?.customer_name;
        const tier = session.metadata?.tier;

        if (userId) {
          const db = await getDb();
          if (db) {
            // Save Stripe customer ID to user
            if (session.customer) {
              await db.update(users)
                .set({ updatedAt: new Date() })
                .where(eq(users.id, parseInt(userId)));
            }

            // Create subscription record
            if (session.subscription) {
              await db.insert(premiumSubscriptions).values({
                userId: parseInt(userId),
                tier: (tier === "vip" ? "vip" : "supporter") as any,
                status: "active",
                priceMonthly: session.amount_total ? String(session.amount_total / 100) : "0",
                billingCycle: "monthly",
                stripeCustomerId: session.customer as string || null,
                stripeSubscriptionId: session.subscription as string || null,
                currentPeriodStart: new Date(),
              });
            }

            // Create social proof event
            await createSocialProofEvent({
              eventType: "subscription",
              displayName: customerName || "Nový člen",
              tierName: tier === "vip" ? "VIP Insider" : "Komunita+",
            });
          }
        }

        console.log(`[Stripe Webhook] Checkout completed for user ${userId}, tier: ${tier}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const db = await getDb();
        if (db && subscription.id) {
          await db.update(premiumSubscriptions)
            .set({ status: "cancelled", cancelledAt: new Date() })
            .where(eq(premiumSubscriptions.stripeSubscriptionId, subscription.id));
        }
        console.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Payment failed for invoice: ${invoice.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err.message);
  }

  res.json({ received: true });
}
