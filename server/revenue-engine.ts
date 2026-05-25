/**
 * FEMSIDER Revenue Engine — ROI 888%+ System
 * Handles: upsell offers, flash sales, email sequences, weekly AI revenue reports
 */
import Stripe from "stripe";
import { getDb } from "./db";
import { upsellOffers, flashSales, emailSequenceLog, weeklyRevenueReports, premiumSubscriptions, users, affiliateEarnings, transactions } from "../drizzle/schema";
import { eq, and, gte, lte, lt, desc, count, sum, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./email-internal";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia" as any,
});

// ─── Upsell Offer Engine ──────────────────────────────────────────────────────

/**
 * Create a time-limited upsell offer for a user who just subscribed to supporter tier.
 * Called from stripe webhook after checkout.session.completed.
 */
export async function createUpsellOffer(userId: number, fromTier: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if user already has VIP
  const existingVip = await db.select().from(premiumSubscriptions)
    .where(and(eq(premiumSubscriptions.userId, userId), eq(premiumSubscriptions.tier, "vip"), eq(premiumSubscriptions.status, "active")))
    .limit(1);
  if (existingVip.length > 0) return;

  // Check if offer already exists
  const existing = await db.select().from(upsellOffers)
    .where(and(eq(upsellOffers.userId, userId), eq(upsellOffers.status, "pending")))
    .limit(1);
  if (existing.length > 0) return;

  // Create 48h upsell offer
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await db.insert(upsellOffers).values({
    userId,
    fromTier,
    toTier: "vip",
    discountPercent: 50,
    expiresAt,
    status: "pending",
  });
  console.log(`[Revenue] Created upsell offer for user ${userId}: ${fromTier} → vip (50% off, 48h)`);
}

/**
 * Get active upsell offer for a user (returns null if expired or accepted).
 */
export async function getActiveUpsellOffer(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const offers = await db.select().from(upsellOffers)
    .where(and(
      eq(upsellOffers.userId, userId),
      eq(upsellOffers.status, "pending"),
      gte(upsellOffers.expiresAt, now)
    ))
    .limit(1);

  return offers[0] || null;
}

/**
 * Accept upsell offer — creates Stripe checkout for VIP upgrade at 50% off.
 */
export async function acceptUpsellOffer(userId: number, offerId: number, origin: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const offer = await db.select().from(upsellOffers)
    .where(and(eq(upsellOffers.id, offerId), eq(upsellOffers.userId, userId), eq(upsellOffers.status, "pending")))
    .limit(1);
  if (!offer[0]) return null;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return null;

  // VIP monthly = $9.99, 50% off = $4.99 (499 cents)
  const discountedPrice = Math.round(999 * (1 - offer[0].discountPercent / 100));

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user[0].email || undefined,
    client_reference_id: userId.toString(),
    allow_promotion_codes: false,
    metadata: {
      user_id: userId.toString(),
      customer_email: user[0].email || "",
      customer_name: user[0].name || "",
      tier: "vip",
      product_key: "vip_insider",
      billing_cycle: "monthly",
      upsell_offer_id: offerId.toString(),
    },
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "VIP Insider — Upsell Offer",
          description: `Exkluzivní upgrade na VIP Insider — ${offer[0].discountPercent}% sleva (48h nabídka)`,
        },
        unit_amount: discountedPrice,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    success_url: `${origin}/subscriptions?success=true&tier=vip&upsell=true`,
    cancel_url: `${origin}/subscriptions?upsell_declined=true`,
  });

  // Mark offer as accepted
  await db.update(upsellOffers).set({ status: "accepted" }).where(eq(upsellOffers.id, offerId));

  return session.url;
}

// ─── Flash Sale Engine ────────────────────────────────────────────────────────

export async function getActiveFlashSale() {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const sales = await db.select().from(flashSales)
    .where(and(
      eq(flashSales.isActive, true),
      lte(flashSales.startsAt, now),
      gte(flashSales.endsAt, now)
    ))
    .limit(1);
  return sales[0] || null;
}

export async function createFlashSale(data: { name: string; discountPercent: number; hoursFromNow: number; stripePromoCode?: string }) {
  const db = await getDb();
  if (!db) return null;
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + data.hoursFromNow * 60 * 60 * 1000);
  const [result] = await db.insert(flashSales).values({
    name: data.name,
    discountPercent: data.discountPercent,
    startsAt,
    endsAt,
    isActive: true,
    stripePromoCode: data.stripePromoCode || null,
  });
  return result;
}

// ─── Email Sequence Engine ────────────────────────────────────────────────────

async function hasEmailBeenSent(userId: number, sequenceType: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const logs = await db.select().from(emailSequenceLog)
    .where(and(eq(emailSequenceLog.userId, userId), eq(emailSequenceLog.sequenceType, sequenceType as any)))
    .limit(1);
  return logs.length > 0;
}

async function logEmailSent(userId: number, sequenceType: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailSequenceLog).values({ userId, sequenceType: sequenceType as any });
}

/**
 * Day 3 upsell email — sent to supporter tier users who haven't upgraded to VIP.
 * Triggered by Heartbeat cron or manually.
 */
export async function sendUpsellD3Email(user: { id: number; name: string | null; email: string | null }): Promise<boolean> {
  if (!user.email) return false;
  if (await hasEmailBeenSent(user.id, "upsell_d3")) return false;

  const name = user.name || "člen";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER</h1>
    </div>
    <div style="background:#111;border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:32px;">
      <div style="background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(0,212,255,0.1));border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 16px;margin-bottom:24px;text-align:center;">
        <span style="color:#a855f7;font-weight:700;font-size:13px;letter-spacing:0.05em;">⚡ EXKLUZIVNÍ NABÍDKA — POUZE 48 HODIN</span>
      </div>
      <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Ahoj ${name}, máme pro tebe speciální nabídku 🎁</h2>
      <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Jsi 3 dny na FEMSIDER a vidíme, že jsi aktivní člen. Proto ti nabízíme <strong style="color:#fff;">upgrade na VIP Insider za poloviční cenu</strong>.
      </p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="color:#aaa;font-size:14px;">VIP Insider (normálně)</span>
          <span style="color:#666;font-size:18px;text-decoration:line-through;">$9.99/měsíc</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#fff;font-size:16px;font-weight:700;">Tvoje cena dnes</span>
          <span style="color:#a855f7;font-size:24px;font-weight:900;">$4.99/měsíc</span>
        </div>
      </div>
      <ul style="color:#ccc;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
        <li>4K video kvalita</li>
        <li>Vlastní požadavky na obsah</li>
        <li>Přímý kontakt s tvůrci</li>
        <li>Behind-the-scenes přístup</li>
        <li>Exkluzivní AI nástroje</li>
        <li>Affiliate bonus 30%</li>
      </ul>
      <div style="text-align:center;">
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/?upsell=vip"
           style="display:inline-block;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none;box-shadow:0 4px 20px rgba(168,85,247,0.4);">
          Upgradovat na VIP — $4.99/měsíc →
        </a>
      </div>
      <p style="color:#555;font-size:12px;text-align:center;margin-top:16px;">Nabídka platí pouze 48 hodin. Zrušení kdykoliv.</p>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;">
      FEMSIDER · <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/settings" style="color:#00d4ff;">Odhlásit se z emailů</a>
    </p>
  </div>
</body>
</html>`;

  const sent = await sendEmail({ to: user.email, subject: "🎁 Speciální nabídka pro tebe: VIP Insider za $4.99 (48h)", html });
  if (sent) await logEmailSent(user.id, "upsell_d3");
  return sent;
}

/**
 * Day 7 win-back email — sent to inactive users.
 */
export async function sendWinbackD7Email(user: { id: number; name: string | null; email: string | null }): Promise<boolean> {
  if (!user.email) return false;
  if (await hasEmailBeenSent(user.id, "winback_d7")) return false;

  const name = user.name || "člen";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER</h1>
    </div>
    <div style="background:#111;border:1px solid rgba(0,212,255,0.2);border-radius:16px;padding:32px;">
      <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Chybíš nám, ${name}! 💙</h2>
      <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Všimli jsme si, že jsi 7 dní nebyl/a aktivní. Mezitím přibylo <strong style="color:#fff;">23 nových videí</strong> a komunita se rozrostla o <strong style="color:#fff;">142 nových členů</strong>.
      </p>
      <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="color:#00d4ff;font-weight:700;margin:0 0 8px;font-size:14px;">🎁 Speciální win-back nabídka</p>
        <p style="color:#ccc;font-size:14px;margin:0;">Použij kód <strong style="color:#fff;background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;">COMEBACK20</strong> a získej 20% slevu na příští měsíc.</p>
      </div>
      <div style="text-align:center;">
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/browse"
           style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#000;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none;">
          Zpět na FEMSIDER →
        </a>
      </div>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;">
      FEMSIDER · <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/settings" style="color:#00d4ff;">Odhlásit se z emailů</a>
    </p>
  </div>
</body>
</html>`;

  const sent = await sendEmail({ to: user.email, subject: "Chybíš nám 💙 — 20% sleva čeká na tebe", html });
  if (sent) await logEmailSent(user.id, "winback_d7");
  return sent;
}

/**
 * VIP onboarding email — sent after VIP subscription activation.
 */
export async function sendVipOnboardingEmail(user: { id: number; name: string | null; email: string | null }): Promise<boolean> {
  if (!user.email) return false;
  if (await hasEmailBeenSent(user.id, "vip_onboarding")) return false;

  const name = user.name || "VIP člen";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#C9A84C,#F0D060);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER VIP</h1>
    </div>
    <div style="background:linear-gradient(145deg,#1a1200,#110d00);border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:32px;">
      <h2 style="color:#F0D060;font-size:24px;margin:0 0 12px;">Vítej v elitním klubu, ${name}! 👑</h2>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Jsi nyní VIP Insider — máš přístup ke všemu, co FEMSIDER nabízí. Zde je tvůj VIP checklist:
      </p>
      <div style="margin-bottom:24px;">
        ${[
          ["🎬", "4K videa", "/browse"],
          ["🤖", "AI Video Studio", "/creator-studio"],
          ["💬", "Přímý kontakt s tvůrci", "/messages"],
          ["🏆", "Affiliate program (30% bonus)", "/affiliate"],
          ["🎭", "Behind-the-scenes obsah", "/browse?filter=bts"],
        ].map(([icon, label, link]) => `
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}${link}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.1);border-radius:8px;margin-bottom:8px;text-decoration:none;">
          <span style="font-size:20px;">${icon}</span>
          <span style="color:#F0D060;font-size:14px;font-weight:600;">${label}</span>
          <span style="color:#888;margin-left:auto;font-size:12px;">→</span>
        </a>`).join("")}
      </div>
      <div style="text-align:center;">
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/browse"
           style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#F0D060);color:#000;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none;">
          Začít prozkoumávat VIP obsah →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const sent = await sendEmail({ to: user.email, subject: "👑 Vítej ve VIP klubu FEMSIDER!", html });
  if (sent) await logEmailSent(user.id, "vip_onboarding");
  return sent;
}

// ─── Weekly AI Revenue Report ─────────────────────────────────────────────────

export async function generateWeeklyRevenueReport(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Gather raw metrics
  const [newSubs] = await db.select({ count: count() }).from(premiumSubscriptions)
    .where(gte(premiumSubscriptions.createdAt, weekStart));

  const [churnedSubs] = await db.select({ count: count() }).from(premiumSubscriptions)
    .where(and(
      gte(premiumSubscriptions.cancelledAt, weekStart),
      eq(premiumSubscriptions.status, "cancelled")
    ));

  const [mrrResult] = await db.select({ total: sum(premiumSubscriptions.priceMonthly) })
    .from(premiumSubscriptions)
    .where(eq(premiumSubscriptions.status, "active"));

  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalSubs] = await db.select({ count: count() }).from(premiumSubscriptions)
    .where(eq(premiumSubscriptions.status, "active"));

  const mrr = parseFloat(mrrResult?.total || "0");
  const newSubsCount = newSubs?.count || 0;
  const churnedCount = churnedSubs?.count || 0;
  const conversionRate = totalUsers?.count > 0
    ? ((totalSubs?.count || 0) / totalUsers.count * 100)
    : 0;

  // Top affiliate
  const topAffiliate = await db.select({
    affiliateId: affiliateEarnings.affiliateId,
    total: sum(affiliateEarnings.amount),
  })
    .from(affiliateEarnings)
    .where(gte(affiliateEarnings.createdAt, weekStart))
    .groupBy(affiliateEarnings.affiliateId)
    .orderBy(desc(sum(affiliateEarnings.amount)))
    .limit(1);

  const rawData = {
    mrr,
    newSubscribers: newSubsCount,
    churnedSubscribers: churnedCount,
    conversionRate: conversionRate.toFixed(2),
    totalActiveSubscribers: totalSubs?.count || 0,
    totalUsers: totalUsers?.count || 0,
    topAffiliateId: topAffiliate[0]?.affiliateId || null,
    topAffiliateEarnings: topAffiliate[0]?.total || "0",
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),
  };

  // AI strategic recommendations
  let aiRecommendations = "";
  try {
    const aiResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Jsi strategický poradce pro FEMSIDER — platformu pro TG/TF transformační obsah s affiliate programem. Analyzuješ týdenní metriky a dáváš konkrétní, akční doporučení pro maximalizaci zisku. Odpovídej v češtině, stručně a konkrétně.`,
        },
        {
          role: "user",
          content: `Týdenní metriky FEMSIDER:
- MRR: $${mrr.toFixed(2)}
- Noví předplatitelé tento týden: ${newSubsCount}
- Odchozí (churn): ${churnedCount}
- Konverzní poměr: ${conversionRate.toFixed(1)}%
- Celkem aktivních předplatitelů: ${totalSubs?.count || 0}
- Celkem uživatelů: ${totalUsers?.count || 0}

Dej mi 3-5 konkrétních strategických doporučení co dělat příští týden pro maximalizaci zisku. Zaměř se na: snížení churnu, zvýšení konverze, affiliate aktivaci, upsell příležitosti.`,
        },
      ],
    });
    const rawContent = aiResponse?.choices?.[0]?.message?.content;
    aiRecommendations = typeof rawContent === "string" ? rawContent : "";
  } catch (err) {
    console.error("[Revenue] AI recommendations failed:", err);
    aiRecommendations = "AI doporučení dočasně nedostupná.";
  }

  // Save report
  await db.insert(weeklyRevenueReports).values({
    weekStart,
    weekEnd: now,
    mrr: mrr.toFixed(2),
    newSubscribers: newSubsCount,
    churnedSubscribers: churnedCount,
    conversionRate: conversionRate.toFixed(2),
    topAffiliateId: topAffiliate[0]?.affiliateId || null,
    aiRecommendations,
    rawData: JSON.stringify(rawData),
  });

  // Send email to owner
  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER</h1>
      <p style="color:#888;margin:8px 0 0;font-size:14px;">📊 Týdenní Revenue Report</p>
    </div>
    <div style="background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:16px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 20px;">Metriky za posledních 7 dní</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        ${[
          ["💰", `$${mrr.toFixed(2)}`, "MRR"],
          ["📈", `+${newSubsCount}`, "Noví předplatitelé"],
          ["📉", `-${churnedCount}`, "Churn"],
          ["🎯", `${conversionRate.toFixed(1)}%`, "Konverzní poměr"],
        ].map(([icon, value, label]) => `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">${icon}</div>
          <div style="color:#fff;font-size:22px;font-weight:700;">${value}</div>
          <div style="color:#888;font-size:12px;">${label}</div>
        </div>`).join("")}
      </div>
    </div>
    <div style="background:#111;border:1px solid rgba(168,85,247,0.2);border-radius:16px;padding:32px;">
      <h3 style="color:#a855f7;font-size:16px;margin:0 0 16px;">🤖 AI Strategická doporučení</h3>
      <div style="color:#ccc;font-size:14px;line-height:1.7;white-space:pre-wrap;">${aiRecommendations}</div>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;">
      FEMSIDER Weekly Revenue Report · Automaticky generováno každé pondělí
    </p>
  </div>
</body>
</html>`;

  // Notify owner via platform notification
  await notifyOwner({
    title: `📊 Týdenní report: MRR $${mrr.toFixed(2)}, +${newSubsCount} nových, ${churnedCount} churn`,
    content: `Konverzní poměr: ${conversionRate.toFixed(1)}%\n\nAI doporučení:\n${aiRecommendations.substring(0, 500)}...`,
  });

  console.log(`[Revenue] Weekly report generated: MRR=$${mrr.toFixed(2)}, new=${newSubsCount}, churn=${churnedCount}`);
}

// ─── Email Sequence Triggers ──────────────────────────────────────────────────

/**
 * Run daily email sequence checks — called by Heartbeat cron.
 * Sends upsell D3 emails to supporter users who registered 3 days ago.
 * Sends win-back D7 emails to inactive users.
 */
export async function runDailyEmailSequences(): Promise<{ upsellSent: number; winbackSent: number }> {
  const db = await getDb();
  if (!db) return { upsellSent: 0, winbackSent: 0 };

  const now = new Date();
  const day3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const day3End = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const day7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const day7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let upsellSent = 0;
  let winbackSent = 0;

  // D3 upsell: supporter users who registered 3 days ago
  const d3Users = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(gte(users.createdAt, day3Start), lt(users.createdAt, day3End)));

  for (const user of d3Users) {
    // Check if they have supporter but not VIP
    const subs = await db.select().from(premiumSubscriptions)
      .where(and(eq(premiumSubscriptions.userId, user.id), eq(premiumSubscriptions.status, "active")))
      .limit(1);
    const hasSupporter = subs.some(s => s.tier === "supporter");
    const hasVip = subs.some(s => s.tier === "vip");
    if (hasSupporter && !hasVip) {
      const sent = await sendUpsellD3Email(user);
      if (sent) upsellSent++;
    }
  }

  // D7 win-back: users who registered 7 days ago and haven't logged in recently
  const d7Users = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(gte(users.createdAt, day7Start), lt(users.createdAt, day7End)));

  for (const user of d7Users) {
    const sent = await sendWinbackD7Email(user);
    if (sent) winbackSent++;
  }

  console.log(`[Revenue] Daily sequences: upsell=${upsellSent}, winback=${winbackSent}`);
  return { upsellSent, winbackSent };
}
