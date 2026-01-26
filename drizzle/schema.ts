import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

// Users table with roles (admin, creator, subscriber)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "creator"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  subscriptionPrice: decimal("subscriptionPrice", { precision: 10, scale: 2 }).default("9.99"),
  isAgeVerified: boolean("isAgeVerified").default(false),
  affiliateCode: varchar("affiliateCode", { length: 32 }).unique(),
  referredBy: int("referredBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Videos table
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  videoUrl: text("videoUrl").notNull(),
  duration: int("duration"), // in seconds
  isPremium: boolean("isPremium").default(true),
  isPublished: boolean("isPublished").default(false),
  viewCount: int("viewCount").default(0),
  likeCount: int("likeCount").default(0),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "flagged"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

// Subscriptions table
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  subscriberId: int("subscriberId").notNull(),
  creatorId: int("creatorId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active"),
  priceAtPurchase: decimal("priceAtPurchase", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  renewsAt: timestamp("renewsAt"),
  paymentProvider: varchar("paymentProvider", { length: 32 }), // ccbill, segpay
  externalSubscriptionId: varchar("externalSubscriptionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Affiliate tracking table
export const affiliateEarnings = mysqlTable("affiliateEarnings", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(), // user who referred
  referredUserId: int("referredUserId").notNull(), // user who was referred
  subscriptionId: int("subscriptionId"), // related subscription
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(), // e.g., 25.00 for 25%
  tier: int("tier").default(1), // 1 = direct, 2 = second tier
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateEarning = typeof affiliateEarnings.$inferSelect;
export type InsertAffiliateEarning = typeof affiliateEarnings.$inferInsert;

// Transactions/Earnings table
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["subscription_payment", "affiliate_commission", "payout", "refund"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  description: text("description"),
  relatedSubscriptionId: int("relatedSubscriptionId"),
  externalTransactionId: varchar("externalTransactionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Age verification records
export const ageVerifications = mysqlTable("ageVerifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  verificationMethod: mysqlEnum("verificationMethod", ["id_document", "credit_card", "third_party"]).notNull(),
  verificationProvider: varchar("verificationProvider", { length: 64 }),
  externalVerificationId: varchar("externalVerificationId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "verified", "rejected", "expired"]).default("pending"),
  verifiedAt: timestamp("verifiedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgeVerification = typeof ageVerifications.$inferSelect;
export type InsertAgeVerification = typeof ageVerifications.$inferInsert;

// Video likes
export const videoLikes = mysqlTable("videoLikes", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertVideoLike = typeof videoLikes.$inferInsert;

// Content moderation flags
export const moderationFlags = mysqlTable("moderationFlags", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  flaggedBy: int("flaggedBy"), // null if AI flagged
  reason: mysqlEnum("reason", ["illegal_content", "underage", "violence", "copyright", "spam", "other"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewed", "dismissed", "action_taken"]).default("pending"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModerationFlag = typeof moderationFlags.$inferSelect;
export type InsertModerationFlag = typeof moderationFlags.$inferInsert;


// Affiliate badges/achievements
export const affiliateBadges = mysqlTable("affiliateBadges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 32 }), // lucide icon name
  color: varchar("color", { length: 32 }), // tailwind color class
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "diamond"]).default("bronze"),
  requirement: mysqlEnum("requirement", ["referrals", "earnings", "network_size", "streak", "special"]).notNull(),
  threshold: int("threshold").notNull(), // e.g., 10 referrals, $1000 earnings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateBadge = typeof affiliateBadges.$inferSelect;
export type InsertAffiliateBadge = typeof affiliateBadges.$inferInsert;

// User badges (earned badges)
export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;
