import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  videos, InsertVideo, Video,
  subscriptions, InsertSubscription,
  affiliateEarnings, InsertAffiliateEarning,
  transactions, InsertTransaction,
  ageVerifications, InsertAgeVerification,
  videoLikes, InsertVideoLike,
  moderationFlags, InsertModerationFlag
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      affiliateCode: nanoid(8),
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatarUrl", "bio"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByAffiliateCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.affiliateCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getCreators(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "creator")).limit(limit).offset(offset);
}

export async function setUserRole(userId: number, role: "user" | "admin" | "creator") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============ VIDEO FUNCTIONS ============

export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(videos).values(video);
  return result[0].insertId;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideosByCreator(creatorId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(eq(videos.creatorId, creatorId))
    .orderBy(desc(videos.createdAt))
    .limit(limit).offset(offset);
}

export async function getPublishedVideos(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(and(eq(videos.isPublished, true), eq(videos.status, "approved")))
    .orderBy(desc(videos.createdAt))
    .limit(limit).offset(offset);
}

export async function updateVideo(videoId: number, data: Partial<InsertVideo>) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set({ ...data, updatedAt: new Date() }).where(eq(videos.id, videoId));
}

export async function incrementVideoViews(videoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set({ viewCount: sql`${videos.viewCount} + 1` }).where(eq(videos.id, videoId));
}

export async function getPendingVideos(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.status, "pending")).orderBy(videos.createdAt).limit(limit);
}

// ============ SUBSCRIPTION FUNCTIONS ============

export async function createSubscription(sub: InsertSubscription) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(subscriptions).values(sub);
  return result[0].insertId;
}

export async function getActiveSubscription(subscriberId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.subscriberId, subscriberId),
      eq(subscriptions.creatorId, creatorId),
      eq(subscriptions.status, "active")
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions)
    .where(eq(subscriptions.subscriberId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function getCreatorSubscribers(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions)
    .where(and(eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active")));
}

export async function cancelSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set({ status: "cancelled", updatedAt: new Date() }).where(eq(subscriptions.id, subscriptionId));
}

// ============ AFFILIATE FUNCTIONS ============

// Multi-tier affiliate commission rates
export const AFFILIATE_TIERS = {
  1: 0.25,  // 25% for direct referrals
  2: 0.10,  // 10% for tier 2
  3: 0.05,  // 5% for tier 3
  4: 0.02,  // 2% for tier 4
};

export const MAX_AFFILIATE_TIER = 4;

export async function createAffiliateEarning(earning: InsertAffiliateEarning) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(affiliateEarnings).values(earning);
  return result[0].insertId;
}

export async function getAffiliateEarnings(affiliateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliateEarnings)
    .where(eq(affiliateEarnings.affiliateId, affiliateId))
    .orderBy(desc(affiliateEarnings.createdAt));
}

export async function getAffiliateTotalEarnings(affiliateId: number) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: sql<string>`COALESCE(SUM(${affiliateEarnings.amount}), 0)` })
    .from(affiliateEarnings)
    .where(and(eq(affiliateEarnings.affiliateId, affiliateId), eq(affiliateEarnings.status, "approved")));
  return result[0]?.total ?? "0";
}

// Get affiliate earnings by tier
export async function getAffiliateEarningsByTier(affiliateId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    tier: affiliateEarnings.tier,
    total: sql<string>`COALESCE(SUM(${affiliateEarnings.amount}), 0)`,
    count: sql<number>`COUNT(*)`
  })
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.affiliateId, affiliateId))
    .groupBy(affiliateEarnings.tier);
  return result;
}

// Get the full referral chain for a user (up to MAX_AFFILIATE_TIER levels)
export async function getReferralChain(userId: number): Promise<Array<{ userId: number; tier: number }>> {
  const db = await getDb();
  if (!db) return [];
  
  const chain: Array<{ userId: number; tier: number }> = [];
  let currentUserId = userId;
  let tier = 1;
  
  while (tier <= MAX_AFFILIATE_TIER) {
    const user = await db.select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);
    
    if (!user[0]?.referredBy) break;
    
    chain.push({ userId: user[0].referredBy, tier });
    currentUserId = user[0].referredBy;
    tier++;
  }
  
  return chain;
}

// Commission result type for notifications
export interface CommissionResult {
  affiliateId: number;
  amount: string;
  tier: number;
  commissionRate: string;
}

// Process multi-tier affiliate commissions for a subscription payment
export async function processMultiTierAffiliateCommissions(
  subscriberId: number,
  subscriptionId: number,
  paymentAmount: number
): Promise<CommissionResult[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results: CommissionResult[] = [];
  
  // Get the referral chain
  const referralChain = await getReferralChain(subscriberId);
  
  for (const { userId: affiliateId, tier } of referralChain) {
    const commissionRate = AFFILIATE_TIERS[tier as keyof typeof AFFILIATE_TIERS];
    if (!commissionRate) continue;
    
    const commissionAmount = paymentAmount * commissionRate;
    
    // Create affiliate earning record
    await createAffiliateEarning({
      affiliateId,
      referredUserId: subscriberId,
      subscriptionId,
      amount: commissionAmount.toFixed(2),
      commissionRate: (commissionRate * 100).toFixed(2),
      tier,
      status: "pending",
    });
    
    // Create transaction record for the affiliate
    await createTransaction({
      userId: affiliateId,
      type: "affiliate_commission",
      amount: commissionAmount.toFixed(2),
      status: "pending",
      description: `Tier ${tier} affiliate commission (${(commissionRate * 100).toFixed(0)}%) from subscription #${subscriptionId}`,
      relatedSubscriptionId: subscriptionId,
    });
    
    // Add to results for notifications
    results.push({
      affiliateId,
      amount: commissionAmount.toFixed(2),
      tier,
      commissionRate: (commissionRate * 100).toFixed(2),
    });
  }
  
  return results;
}

// Get referral network stats (how many users at each tier)
export async function getReferralNetworkStats(userId: number) {
  const db = await getDb();
  if (!db) return { tier1: 0, tier2: 0, tier3: 0, tier4: 0, total: 0 };
  
  // Tier 1: Direct referrals
  const tier1 = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.referredBy, userId));
  
  // Get tier 1 user IDs for tier 2 lookup
  const tier1Users = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.referredBy, userId));
  const tier1Ids = tier1Users.map(u => u.id);
  
  let tier2Count = 0;
  let tier3Count = 0;
  let tier4Count = 0;
  let tier2Ids: number[] = [];
  let tier3Ids: number[] = [];
  
  if (tier1Ids.length > 0) {
    // Tier 2: Referrals of tier 1
    const tier2Users = await db.select({ id: users.id })
      .from(users)
      .where(sql`${users.referredBy} IN (${tier1Ids.join(',')})`);
    tier2Count = tier2Users.length;
    tier2Ids = tier2Users.map(u => u.id);
    
    if (tier2Ids.length > 0) {
      // Tier 3: Referrals of tier 2
      const tier3Users = await db.select({ id: users.id })
        .from(users)
        .where(sql`${users.referredBy} IN (${tier2Ids.join(',')})`);
      tier3Count = tier3Users.length;
      tier3Ids = tier3Users.map(u => u.id);
      
      if (tier3Ids.length > 0) {
        // Tier 4: Referrals of tier 3
        const tier4Users = await db.select({ count: sql<number>`COUNT(*)` })
          .from(users)
          .where(sql`${users.referredBy} IN (${tier3Ids.join(',')})`);
        tier4Count = tier4Users[0]?.count ?? 0;
      }
    }
  }
  
  const tier1Count = tier1[0]?.count ?? 0;
  
  return {
    tier1: tier1Count,
    tier2: tier2Count,
    tier3: tier3Count,
    tier4: tier4Count,
    total: tier1Count + tier2Count + tier3Count + tier4Count,
  };
}

// ============ TRANSACTION FUNCTIONS ============

export async function createTransaction(tx: InsertTransaction) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(transactions).values(tx);
  return result[0].insertId;
}

export async function getUserTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getCreatorTotalEarnings(creatorId: number) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.userId, creatorId),
      eq(transactions.type, "subscription_payment"),
      eq(transactions.status, "completed")
    ));
  return result[0]?.total ?? "0";
}

// ============ AGE VERIFICATION FUNCTIONS ============

export async function createAgeVerification(verification: InsertAgeVerification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ageVerifications).values(verification);
  return result[0].insertId;
}

export async function getUserAgeVerification(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ageVerifications)
    .where(eq(ageVerifications.userId, userId))
    .orderBy(desc(ageVerifications.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAgeVerificationStatus(verificationId: number, status: "pending" | "verified" | "rejected" | "expired") {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, unknown> = { status };
  if (status === "verified") {
    updates.verifiedAt = new Date();
  }
  await db.update(ageVerifications).set(updates).where(eq(ageVerifications.id, verificationId));
}

// ============ VIDEO LIKES FUNCTIONS ============

export async function toggleVideoLike(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const existing = await db.select().from(videoLikes)
    .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.userId, userId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.delete(videoLikes).where(eq(videoLikes.id, existing[0].id));
    await db.update(videos).set({ likeCount: sql`${videos.likeCount} - 1` }).where(eq(videos.id, videoId));
    return false;
  } else {
    await db.insert(videoLikes).values({ videoId, userId });
    await db.update(videos).set({ likeCount: sql`${videos.likeCount} + 1` }).where(eq(videos.id, videoId));
    return true;
  }
}

export async function hasUserLikedVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(videoLikes)
    .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.userId, userId)))
    .limit(1);
  return result.length > 0;
}

// ============ MODERATION FUNCTIONS ============

export async function createModerationFlag(flag: InsertModerationFlag) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(moderationFlags).values(flag);
  return result[0].insertId;
}

export async function getPendingModerationFlags(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moderationFlags)
    .where(eq(moderationFlags.status, "pending"))
    .orderBy(moderationFlags.createdAt)
    .limit(limit);
}

export async function updateModerationFlag(flagId: number, status: "pending" | "reviewed" | "dismissed" | "action_taken", reviewedBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(moderationFlags).set({ status, reviewedBy, reviewedAt: new Date() }).where(eq(moderationFlags.id, flagId));
}

// ============ ANALYTICS FUNCTIONS ============

export async function getCreatorStats(creatorId: number) {
  const db = await getDb();
  if (!db) return { totalVideos: 0, totalViews: 0, totalLikes: 0, totalSubscribers: 0, totalEarnings: "0" };
  
  const videoStats = await db.select({
    totalVideos: sql<number>`COUNT(*)`,
    totalViews: sql<number>`COALESCE(SUM(${videos.viewCount}), 0)`,
    totalLikes: sql<number>`COALESCE(SUM(${videos.likeCount}), 0)`,
  }).from(videos).where(eq(videos.creatorId, creatorId));
  
  const subscriberCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(subscriptions)
    .where(and(eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active")));
  
  const earnings = await getCreatorTotalEarnings(creatorId);
  
  return {
    totalVideos: videoStats[0]?.totalVideos ?? 0,
    totalViews: videoStats[0]?.totalViews ?? 0,
    totalLikes: videoStats[0]?.totalLikes ?? 0,
    totalSubscribers: subscriberCount[0]?.count ?? 0,
    totalEarnings: earnings,
  };
}


// ============ BADGE FUNCTIONS ============

import { affiliateBadges, userBadges, InsertAffiliateBadge, InsertUserBadge } from "../drizzle/schema";

// Default badges to seed
export const DEFAULT_BADGES: InsertAffiliateBadge[] = [
  // Referral count badges
  { code: "first_referral", name: "První krok", description: "Přiveď svého prvního uživatele", icon: "UserPlus", color: "text-emerald-500", tier: "bronze", requirement: "referrals", threshold: 1 },
  { code: "referral_5", name: "Networker", description: "Přiveď 5 uživatelů", icon: "Users", color: "text-blue-500", tier: "silver", requirement: "referrals", threshold: 5 },
  { code: "referral_25", name: "Influencer", description: "Přiveď 25 uživatelů", icon: "Star", color: "text-yellow-500", tier: "gold", requirement: "referrals", threshold: 25 },
  { code: "referral_100", name: "Ambasador", description: "Přiveď 100 uživatelů", icon: "Crown", color: "text-purple-500", tier: "platinum", requirement: "referrals", threshold: 100 },
  { code: "referral_500", name: "Legenda", description: "Přiveď 500 uživatelů", icon: "Gem", color: "text-pink-500", tier: "diamond", requirement: "referrals", threshold: 500 },
  
  // Earnings badges
  { code: "earnings_100", name: "První stovka", description: "Vydělej $100 na provizích", icon: "DollarSign", color: "text-emerald-500", tier: "bronze", requirement: "earnings", threshold: 100 },
  { code: "earnings_500", name: "Půl tisíce", description: "Vydělej $500 na provizích", icon: "Banknote", color: "text-blue-500", tier: "silver", requirement: "earnings", threshold: 500 },
  { code: "earnings_1000", name: "Tisícovka", description: "Vydělej $1,000 na provizích", icon: "Wallet", color: "text-yellow-500", tier: "gold", requirement: "earnings", threshold: 1000 },
  { code: "earnings_5000", name: "High Roller", description: "Vydělej $5,000 na provizích", icon: "TrendingUp", color: "text-purple-500", tier: "platinum", requirement: "earnings", threshold: 5000 },
  { code: "earnings_10000", name: "Magnát", description: "Vydělej $10,000 na provizích", icon: "Trophy", color: "text-pink-500", tier: "diamond", requirement: "earnings", threshold: 10000 },
  
  // Network size badges (total network including all tiers)
  { code: "network_10", name: "Malá síť", description: "Vybuduj síť 10 uživatelů", icon: "Network", color: "text-emerald-500", tier: "bronze", requirement: "network_size", threshold: 10 },
  { code: "network_50", name: "Rostoucí síť", description: "Vybuduj síť 50 uživatelů", icon: "GitBranch", color: "text-blue-500", tier: "silver", requirement: "network_size", threshold: 50 },
  { code: "network_200", name: "Velká síť", description: "Vybuduj síť 200 uživatelů", icon: "Share2", color: "text-yellow-500", tier: "gold", requirement: "network_size", threshold: 200 },
  { code: "network_1000", name: "Impérium", description: "Vybuduj síť 1,000 uživatelů", icon: "Globe", color: "text-purple-500", tier: "platinum", requirement: "network_size", threshold: 1000 },
];

export async function seedBadges() {
  const db = await getDb();
  if (!db) return;
  
  for (const badge of DEFAULT_BADGES) {
    try {
      await db.insert(affiliateBadges).values(badge).onDuplicateKeyUpdate({ set: { name: badge.name } });
    } catch (e) {
      // Ignore duplicate errors
    }
  }
}

export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliateBadges).orderBy(affiliateBadges.threshold);
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: userBadges.id,
    earnedAt: userBadges.earnedAt,
    badge: affiliateBadges,
  })
    .from(userBadges)
    .innerJoin(affiliateBadges, eq(userBadges.badgeId, affiliateBadges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));
}

export async function awardBadge(userId: number, badgeId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if user already has this badge
  const existing = await db.select().from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
    .limit(1);
  
  if (existing.length > 0) return null;
  
  const result = await db.insert(userBadges).values({ userId, badgeId });
  return result[0].insertId;
}

export async function checkAndAwardBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const newBadges: Array<{ code: string; name: string; tier: string; description: string }> = [];
  
  // Get user's current stats
  const networkStats = await getReferralNetworkStats(userId);
  const totalEarnings = parseFloat(await getAffiliateTotalEarnings(userId));
  const directReferrals = networkStats.tier1;
  const totalNetwork = networkStats.total;
  
  // Get all badges
  const allBadges = await getAllBadges();
  
  // Get user's current badges
  const currentBadges = await getUserBadges(userId);
  const currentBadgeIds = new Set(currentBadges.map(b => b.badge.id));
  
  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue;
    
    let qualifies = false;
    
    switch (badge.requirement) {
      case "referrals":
        qualifies = directReferrals >= badge.threshold;
        break;
      case "earnings":
        qualifies = totalEarnings >= badge.threshold;
        break;
      case "network_size":
        qualifies = totalNetwork >= badge.threshold;
        break;
    }
    
    if (qualifies) {
      await awardBadge(userId, badge.id);
      newBadges.push({ 
        code: badge.code, 
        name: badge.name,
        tier: badge.tier || 'bronze',
        description: badge.description || '',
      });
    }
  }
  
  return newBadges;
}

// ============ LEADERBOARD FUNCTIONS ============

export async function getAffiliateLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    userId: affiliateEarnings.affiliateId,
    totalEarnings: sql<string>`COALESCE(SUM(${affiliateEarnings.amount}), 0)`,
    referralCount: sql<number>`COUNT(DISTINCT ${affiliateEarnings.referredUserId})`,
  })
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.status, "approved"))
    .groupBy(affiliateEarnings.affiliateId)
    .orderBy(desc(sql`SUM(${affiliateEarnings.amount})`))
    .limit(limit);
  
  // Enrich with user data
  const enriched = await Promise.all(result.map(async (entry, index) => {
    const user = await getUserById(entry.userId);
    return {
      rank: index + 1,
      userId: entry.userId,
      name: user?.name || `Uživatel #${entry.userId}`,
      avatarUrl: user?.avatarUrl,
      totalEarnings: entry.totalEarnings,
      referralCount: entry.referralCount,
    };
  }));
  
  return enriched;
}

export async function getUserLeaderboardPosition(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const leaderboard = await getAffiliateLeaderboard(1000);
  const position = leaderboard.findIndex(entry => entry.userId === userId);
  
  if (position === -1) return null;
  
  const entry = leaderboard[position];
  return {
    ...entry,
    rank: position + 1,
  };
}

// Get direct referrals with their stats
export async function getDirectReferrals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const referrals = await db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    createdAt: users.createdAt,
  })
    .from(users)
    .where(eq(users.referredBy, userId))
    .orderBy(desc(users.createdAt));
  
  // Enrich with earnings from this referral
  const enriched = await Promise.all(referrals.map(async (referral) => {
    const earnings = await db.select({
      total: sql<string>`COALESCE(SUM(${affiliateEarnings.amount}), 0)`,
    })
      .from(affiliateEarnings)
      .where(and(
        eq(affiliateEarnings.affiliateId, userId),
        eq(affiliateEarnings.referredUserId, referral.id)
      ));
    
    // Get their network size (how many they referred)
    const theirReferrals = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.referredBy, referral.id));
    
    return {
      ...referral,
      earningsFromReferral: earnings[0]?.total ?? "0",
      theirReferralCount: theirReferrals[0]?.count ?? 0,
    };
  }));
  
  return enriched;
}


// ============ UTM TRACKING FUNCTIONS ============

import { affiliateClicks, bannerVariants, payoutRequests, paymentSettings, InsertAffiliateClick, InsertBannerVariant, InsertPayoutRequest, InsertPaymentSetting } from "../drizzle/schema";
import crypto from 'crypto';

export async function trackAffiliateClick(data: InsertAffiliateClick) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(affiliateClicks).values(data);
  return result[0].insertId;
}

export async function getAffiliateClickStats(affiliateCode: string) {
  const db = await getDb();
  if (!db) return { totalClicks: 0, uniqueClicks: 0, signups: 0, subscriptions: 0 };
  
  const stats = await db.select({
    totalClicks: sql<number>`COUNT(*)`,
    uniqueClicks: sql<number>`COUNT(DISTINCT ${affiliateClicks.ipHash})`,
    signups: sql<number>`SUM(CASE WHEN ${affiliateClicks.convertedToSignup} = true THEN 1 ELSE 0 END)`,
    subscriptions: sql<number>`SUM(CASE WHEN ${affiliateClicks.convertedToSubscription} = true THEN 1 ELSE 0 END)`,
  })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.affiliateCode, affiliateCode));
  
  return {
    totalClicks: stats[0]?.totalClicks ?? 0,
    uniqueClicks: stats[0]?.uniqueClicks ?? 0,
    signups: stats[0]?.signups ?? 0,
    subscriptions: stats[0]?.subscriptions ?? 0,
  };
}

export async function getAffiliateClicksBySource(affiliateCode: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    source: affiliateClicks.utmSource,
    medium: affiliateClicks.utmMedium,
    clicks: sql<number>`COUNT(*)`,
    uniqueClicks: sql<number>`COUNT(DISTINCT ${affiliateClicks.ipHash})`,
    signups: sql<number>`SUM(CASE WHEN ${affiliateClicks.convertedToSignup} = true THEN 1 ELSE 0 END)`,
    subscriptions: sql<number>`SUM(CASE WHEN ${affiliateClicks.convertedToSubscription} = true THEN 1 ELSE 0 END)`,
  })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.affiliateCode, affiliateCode))
    .groupBy(affiliateClicks.utmSource, affiliateClicks.utmMedium)
    .orderBy(desc(sql`COUNT(*)`));
}

export async function getAffiliateClicksByCampaign(affiliateCode: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    campaign: affiliateClicks.utmCampaign,
    content: affiliateClicks.utmContent,
    clicks: sql<number>`COUNT(*)`,
    uniqueClicks: sql<number>`COUNT(DISTINCT ${affiliateClicks.ipHash})`,
    signups: sql<number>`SUM(CASE WHEN ${affiliateClicks.convertedToSignup} = true THEN 1 ELSE 0 END)`,
    subscriptions: sql<number>`SUM(CASE WHEN ${affiliateClicks.convertedToSubscription} = true THEN 1 ELSE 0 END)`,
  })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.affiliateCode, affiliateCode))
    .groupBy(affiliateClicks.utmCampaign, affiliateClicks.utmContent)
    .orderBy(desc(sql`COUNT(*)`));
}

export async function markClickAsConverted(affiliateCode: string, ipHash: string, type: 'signup' | 'subscription', userId?: number) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertAffiliateClick> = type === 'signup' 
    ? { convertedToSignup: true, convertedUserId: userId }
    : { convertedToSubscription: true };
  
  await db.update(affiliateClicks)
    .set(updateData)
    .where(and(
      eq(affiliateClicks.affiliateCode, affiliateCode),
      eq(affiliateClicks.ipHash, ipHash)
    ));
}

export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'femsider_salt').digest('hex').substring(0, 32);
}

// ============ A/B TESTING FUNCTIONS ============

export async function createBannerVariant(banner: InsertBannerVariant) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bannerVariants).values(banner);
  return result[0].insertId;
}

export async function getBannerVariants(size?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (size) {
    return db.select().from(bannerVariants)
      .where(and(eq(bannerVariants.size, size), eq(bannerVariants.isActive, true)))
      .orderBy(desc(bannerVariants.createdAt));
  }
  
  return db.select().from(bannerVariants)
    .where(eq(bannerVariants.isActive, true))
    .orderBy(desc(bannerVariants.createdAt));
}

export async function getAllBannerVariants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bannerVariants).orderBy(desc(bannerVariants.createdAt));
}

export async function incrementBannerImpression(bannerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bannerVariants)
    .set({ impressions: sql`${bannerVariants.impressions} + 1` })
    .where(eq(bannerVariants.id, bannerId));
}

export async function incrementBannerClick(bannerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bannerVariants)
    .set({ clicks: sql`${bannerVariants.clicks} + 1` })
    .where(eq(bannerVariants.id, bannerId));
}

export async function incrementBannerConversion(bannerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bannerVariants)
    .set({ conversions: sql`${bannerVariants.conversions} + 1` })
    .where(eq(bannerVariants.id, bannerId));
}

export async function getBannerStats() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: bannerVariants.id,
    name: bannerVariants.name,
    size: bannerVariants.size,
    imageUrl: bannerVariants.imageUrl,
    impressions: bannerVariants.impressions,
    clicks: bannerVariants.clicks,
    conversions: bannerVariants.conversions,
    ctr: sql<string>`CASE WHEN ${bannerVariants.impressions} > 0 THEN ROUND(${bannerVariants.clicks} * 100.0 / ${bannerVariants.impressions}, 2) ELSE 0 END`,
    conversionRate: sql<string>`CASE WHEN ${bannerVariants.clicks} > 0 THEN ROUND(${bannerVariants.conversions} * 100.0 / ${bannerVariants.clicks}, 2) ELSE 0 END`,
  })
    .from(bannerVariants)
    .orderBy(desc(bannerVariants.clicks));
}

export async function updateBannerVariant(bannerId: number, data: Partial<InsertBannerVariant>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bannerVariants).set({ ...data, updatedAt: new Date() }).where(eq(bannerVariants.id, bannerId));
}

export async function deleteBannerVariant(bannerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bannerVariants).where(eq(bannerVariants.id, bannerId));
}

// ============ PAYOUT FUNCTIONS ============

export async function createPayoutRequest(payout: InsertPayoutRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(payoutRequests).values(payout);
  return result[0].insertId;
}

export async function getUserPayoutRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payoutRequests)
    .where(eq(payoutRequests.userId, userId))
    .orderBy(desc(payoutRequests.createdAt));
}

export async function getAllPayoutRequests(status?: 'pending' | 'processing' | 'completed' | 'rejected') {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(payoutRequests)
      .where(eq(payoutRequests.status, status))
      .orderBy(desc(payoutRequests.createdAt));
  }
  
  return db.select().from(payoutRequests).orderBy(desc(payoutRequests.createdAt));
}

export async function updatePayoutRequest(
  payoutId: number, 
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  processedBy?: number,
  rejectionReason?: string,
  transactionId?: string
) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertPayoutRequest> = {
    status,
    processedBy,
    processedAt: status === 'completed' || status === 'rejected' ? new Date() : undefined,
    rejectionReason,
    transactionId,
  };
  
  await db.update(payoutRequests).set(updateData).where(eq(payoutRequests.id, payoutId));
}

export async function getUserPendingPayoutTotal(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  
  const result = await db.select({
    total: sql<string>`COALESCE(SUM(${payoutRequests.amount}), 0)`
  })
    .from(payoutRequests)
    .where(and(
      eq(payoutRequests.userId, userId),
      sql`${payoutRequests.status} IN ('pending', 'processing')`
    ));
  
  return result[0]?.total ?? "0";
}

export async function getUserPaidOutTotal(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  
  const result = await db.select({
    total: sql<string>`COALESCE(SUM(${payoutRequests.amount}), 0)`
  })
    .from(payoutRequests)
    .where(and(
      eq(payoutRequests.userId, userId),
      eq(payoutRequests.status, 'completed')
    ));
  
  return result[0]?.total ?? "0";
}

// ============ PAYMENT SETTINGS FUNCTIONS ============

export async function getPaymentSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(paymentSettings)
    .where(eq(paymentSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertPaymentSettings(userId: number, settings: Partial<InsertPaymentSetting>) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getPaymentSettings(userId);
  
  if (existing) {
    await db.update(paymentSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(paymentSettings.userId, userId));
  } else {
    await db.insert(paymentSettings).values({ userId, ...settings });
  }
}

export async function getAvailableBalance(userId: number) {
  const totalEarnings = parseFloat(await getAffiliateTotalEarnings(userId));
  const pendingPayouts = parseFloat(await getUserPendingPayoutTotal(userId));
  const paidOut = parseFloat(await getUserPaidOutTotal(userId));
  
  return {
    totalEarnings,
    pendingPayouts,
    paidOut,
    available: totalEarnings - pendingPayouts - paidOut,
  };
}
