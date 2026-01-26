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

// Process multi-tier affiliate commissions for a subscription payment
export async function processMultiTierAffiliateCommissions(
  subscriberId: number,
  subscriptionId: number,
  paymentAmount: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
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
  }
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
