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


// UTM tracking for affiliate links
export const affiliateClicks = mysqlTable("affiliateClicks", {
  id: int("id").autoincrement().primaryKey(),
  affiliateCode: varchar("affiliateCode", { length: 32 }).notNull(),
  utmSource: varchar("utmSource", { length: 64 }), // e.g., twitter, facebook, instagram
  utmMedium: varchar("utmMedium", { length: 64 }), // e.g., social, banner, qr
  utmCampaign: varchar("utmCampaign", { length: 128 }), // e.g., summer_promo
  utmContent: varchar("utmContent", { length: 128 }), // e.g., banner_v1, banner_v2
  ipHash: varchar("ipHash", { length: 64 }), // hashed IP for unique visitor tracking
  userAgent: text("userAgent"),
  referer: text("referer"),
  convertedToSignup: boolean("convertedToSignup").default(false),
  convertedToSubscription: boolean("convertedToSubscription").default(false),
  convertedUserId: int("convertedUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = typeof affiliateClicks.$inferInsert;

// A/B testing for banners
export const bannerVariants = mysqlTable("bannerVariants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  size: varchar("size", { length: 32 }).notNull(), // e.g., 728x90, 300x250
  isActive: boolean("isActive").default(true),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BannerVariant = typeof bannerVariants.$inferSelect;
export type InsertBannerVariant = typeof bannerVariants.$inferInsert;

// Payout requests
export const payoutRequests = mysqlTable("payoutRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  paymentMethod: mysqlEnum("paymentMethod", ["paypal", "bank_transfer", "crypto"]).notNull(),
  paymentDetails: text("paymentDetails"), // JSON with payment info (encrypted)
  status: mysqlEnum("status", ["pending", "processing", "completed", "rejected"]).default("pending"),
  processedAt: timestamp("processedAt"),
  processedBy: int("processedBy"),
  rejectionReason: text("rejectionReason"),
  transactionId: varchar("transactionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type InsertPayoutRequest = typeof payoutRequests.$inferInsert;

// User payment settings
export const paymentSettings = mysqlTable("paymentSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  preferredMethod: mysqlEnum("preferredMethod", ["paypal", "bank_transfer", "crypto"]).default("paypal"),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  bankAccountName: varchar("bankAccountName", { length: 128 }),
  bankAccountNumber: varchar("bankAccountNumber", { length: 64 }),
  bankRoutingNumber: varchar("bankRoutingNumber", { length: 32 }),
  bankName: varchar("bankName", { length: 128 }),
  bankSwift: varchar("bankSwift", { length: 16 }),
  bankIban: varchar("bankIban", { length: 64 }),
  cryptoWalletAddress: varchar("cryptoWalletAddress", { length: 128 }),
  cryptoCurrency: varchar("cryptoCurrency", { length: 16 }), // BTC, ETH, USDT
  minimumPayout: decimal("minimumPayout", { precision: 10, scale: 2 }).default("50.00"),
  autoPayoutEnabled: boolean("autoPayoutEnabled").default(false),
  autoPayoutThreshold: decimal("autoPayoutThreshold", { precision: 10, scale: 2 }).default("100.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type InsertPaymentSetting = typeof paymentSettings.$inferInsert;


// YouTube channels linked to creators
export const youtubeChannels = mysqlTable("youtubeChannels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  channelId: varchar("channelId", { length: 64 }).notNull().unique(), // YouTube channel ID
  channelTitle: varchar("channelTitle", { length: 255 }),
  channelDescription: text("channelDescription"),
  channelThumbnail: text("channelThumbnail"),
  subscriberCount: int("subscriberCount").default(0),
  videoCount: int("videoCount").default(0),
  viewCount: int("viewCount").default(0),
  accessToken: text("accessToken"), // encrypted OAuth token
  refreshToken: text("refreshToken"), // encrypted refresh token
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  isConnected: boolean("isConnected").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type YoutubeChannel = typeof youtubeChannels.$inferSelect;
export type InsertYoutubeChannel = typeof youtubeChannels.$inferInsert;

// YouTube videos imported
export const youtubeVideos = mysqlTable("youtubeVideos", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(), // FK to youtubeChannels
  youtubeVideoId: varchar("youtubeVideoId", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // in seconds
  publishedAt: timestamp("publishedAt"),
  // YouTube stats
  ytViewCount: int("ytViewCount").default(0),
  ytLikeCount: int("ytLikeCount").default(0),
  ytCommentCount: int("ytCommentCount").default(0),
  // FEMSIDER extended version link
  extendedVideoId: int("extendedVideoId"), // FK to videos table (extended/uncensored version)
  // Thumbnail A/B testing
  currentThumbnailVariant: int("currentThumbnailVariant").default(0), // 0 = original, 1-3 = AI variants
  // Status
  isImported: boolean("isImported").default(true),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type YoutubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYoutubeVideo = typeof youtubeVideos.$inferInsert;

// YouTube video stats history (for graphs)
export const youtubeVideoStats = mysqlTable("youtubeVideoStats", {
  id: int("id").autoincrement().primaryKey(),
  youtubeVideoId: int("youtubeVideoId").notNull(), // FK to youtubeVideos
  viewCount: int("viewCount").default(0),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  // CTR and engagement metrics
  impressions: int("impressions").default(0),
  ctr: decimal("ctr", { precision: 5, scale: 2 }), // Click-through rate
  avgViewDuration: int("avgViewDuration"), // in seconds
  avgViewPercentage: decimal("avgViewPercentage", { precision: 5, scale: 2 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type YoutubeVideoStat = typeof youtubeVideoStats.$inferSelect;
export type InsertYoutubeVideoStat = typeof youtubeVideoStats.$inferInsert;

// AI-generated thumbnail variants for A/B testing
export const thumbnailVariants = mysqlTable("thumbnailVariants", {
  id: int("id").autoincrement().primaryKey(),
  youtubeVideoId: int("youtubeVideoId").notNull(), // FK to youtubeVideos
  variantNumber: int("variantNumber").notNull(), // 1, 2, 3
  imageUrl: text("imageUrl").notNull(),
  prompt: text("prompt"), // AI prompt used to generate
  // A/B test stats
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  ctr: decimal("ctr", { precision: 5, scale: 2 }), // calculated CTR
  isActive: boolean("isActive").default(false),
  isWinner: boolean("isWinner").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThumbnailVariant = typeof thumbnailVariants.$inferSelect;
export type InsertThumbnailVariant = typeof thumbnailVariants.$inferInsert;

// YouTube channel stats history (for graphs)
export const youtubeChannelStats = mysqlTable("youtubeChannelStats", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(), // FK to youtubeChannels
  subscriberCount: int("subscriberCount").default(0),
  videoCount: int("videoCount").default(0),
  viewCount: int("viewCount").default(0),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type YoutubeChannelStat = typeof youtubeChannelStats.$inferSelect;
export type InsertYoutubeChannelStat = typeof youtubeChannelStats.$inferInsert;
