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
