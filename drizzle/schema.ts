import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

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
  onboardingCompleted: boolean("onboardingCompleted").default(false),
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
  // YouTube integration
  youtubeVideoId: varchar("youtubeVideoId", { length: 32 }),
  youtubeChannelId: varchar("youtubeChannelId", { length: 64 }),
  youtubePublishedAt: timestamp("youtubePublishedAt"),
  youtubeViewCount: int("youtubeViewCount"),
  youtubeLikeCount: int("youtubeLikeCount"),
  youtubeCommentCount: int("youtubeCommentCount"),
  lastYoutubeSync: timestamp("lastYoutubeSync"),
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


// Posts (newsfeed)
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  content: text("content"),
  imageUrl: text("imageUrl"),
  videoId: int("videoId"), // optional link to video
  isPinned: boolean("isPinned").default(false),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  visibility: mysqlEnum("visibility", ["public", "subscribers", "private"]).default("public"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// Post likes
export const postLikes = mysqlTable("postLikes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;

// Comments (for posts and videos)
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  postId: int("postId"), // null if comment on video
  videoId: int("videoId"), // null if comment on post
  parentId: int("parentId"), // for replies
  content: text("content").notNull(),
  timestamp: int("timestamp"), // video timestamp in seconds (null for non-timestamped comments)
  likeCount: int("likeCount").default(0),
  isEdited: boolean("isEdited").default(false),
  // YouTube integration
  youtubeCommentId: varchar("youtubeCommentId", { length: 128 }),
  youtubeAuthorName: varchar("youtubeAuthorName", { length: 255 }),
  youtubeAuthorChannelId: varchar("youtubeAuthorChannelId", { length: 64 }),
  youtubePublishedAt: timestamp("youtubePublishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Comment likes
export const commentLikes = mysqlTable("commentLikes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = typeof commentLikes.$inferInsert;

// Follows (user follows creator)
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

// Direct messages conversations
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  participant1Id: int("participant1Id").notNull(),
  participant2Id: int("participant2Id").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  lastMessagePreview: varchar("lastMessagePreview", { length: 255 }),
  unreadCount1: int("unreadCount1").default(0), // unread for participant1
  unreadCount2: int("unreadCount2").default(0), // unread for participant2
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// Direct messages
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content"),
  imageUrl: text("imageUrl"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// AI chatbot conversations
export const chatbotConversations = mysqlTable("chatbotConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  context: mysqlEnum("context", ["general", "content_tips", "thumbnail_generation", "analytics", "marketing"]).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

// AI chatbot messages
export const chatbotMessages = mysqlTable("chatbotMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON with additional data (e.g., generated images)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = typeof chatbotMessages.$inferInsert;

// Notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["new_follower", "new_subscriber", "new_message", "new_comment", "new_like", "payout", "badge", "system", "forum_reply", "forum_mention", "verification_approved", "verification_rejected", "rank_up", "new_badge", "welcome", "password_reset"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  linkUrl: varchar("linkUrl", { length: 512 }),
  relatedUserId: int("relatedUserId"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


// ============ VIDEO RECREATE SYSTEM ============

// Video projects for AI recreation/extension
export const videoProjects = mysqlTable("videoProjects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Source video info
  sourceType: mysqlEnum("sourceType", ["upload", "url", "youtube"]).notNull(),
  sourceUrl: text("sourceUrl"),
  sourceVideoId: int("sourceVideoId"), // FK to videos table if from platform
  originalDuration: int("originalDuration"), // in seconds
  // Project type
  projectType: mysqlEnum("projectType", ["remake", "sequel", "extend_scene"]).default("extend_scene"),
  // AI analysis results
  analysisStatus: mysqlEnum("analysisStatus", ["pending", "processing", "completed", "failed"]).default("pending"),
  analysisResult: text("analysisResult"), // JSON with scene breakdown, prompts, etc.
  // Generation settings
  targetModel: mysqlEnum("targetModel", ["hailuo_ai", "veo_3", "wan_2_6"]).default("wan_2_6"),
  generateNude: boolean("generateNude").default(false),
  generateAudio: boolean("generateAudio").default(true),
  // Output
  outputVideoUrl: text("outputVideoUrl"),
  outputDuration: int("outputDuration"),
  status: mysqlEnum("status", ["draft", "analyzing", "generating", "completed", "failed"]).default("draft"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;

// Detected scenes from video analysis
export const videoScenes = mysqlTable("videoScenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // FK to videoProjects
  sceneNumber: int("sceneNumber").notNull(),
  startTime: int("startTime").notNull(), // in milliseconds
  endTime: int("endTime").notNull(), // in milliseconds
  duration: int("duration").notNull(), // in milliseconds
  // Scene classification
  sceneType: mysqlEnum("sceneType", ["dialogue", "action", "romantic", "kiss", "intimate", "transition", "other"]).default("other"),
  isKeyScene: boolean("isKeyScene").default(false), // Marked for potential extension
  // AI-generated content
  description: text("description"), // AI description of the scene
  prompt: text("prompt"), // Generated prompt for text-to-video
  characters: text("characters"), // JSON array of detected characters
  emotions: text("emotions"), // JSON array of detected emotions
  // Extension options
  canExtend: boolean("canExtend").default(false),
  extensionSuggestion: text("extensionSuggestion"), // AI suggestion for how to extend
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoScene = typeof videoScenes.$inferSelect;
export type InsertVideoScene = typeof videoScenes.$inferInsert;

// Screenshots/frames from scenes for user selection
export const sceneScreenshots = mysqlTable("sceneScreenshots", {
  id: int("id").autoincrement().primaryKey(),
  sceneId: int("sceneId").notNull(), // FK to videoScenes
  projectId: int("projectId").notNull(), // FK to videoProjects
  frameNumber: int("frameNumber").notNull(), // 1-4 typically
  timestamp: int("timestamp").notNull(), // in milliseconds
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  isSelected: boolean("isSelected").default(false), // User selected this frame
  // AI analysis of frame
  description: text("description"),
  suggestedPrompt: text("suggestedPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SceneScreenshot = typeof sceneScreenshots.$inferSelect;
export type InsertSceneScreenshot = typeof sceneScreenshots.$inferInsert;

// Generated video segments
export const generatedSegments = mysqlTable("generatedSegments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // FK to videoProjects
  sceneId: int("sceneId"), // FK to videoScenes (if extending specific scene)
  segmentNumber: int("segmentNumber").notNull(),
  // Generation input
  prompt: text("prompt").notNull(),
  referenceImageUrl: text("referenceImageUrl"), // Screenshot used as reference
  model: mysqlEnum("model", ["hailuo_ai", "veo_3", "wan_2_6"]).notNull(),
  // Generation settings
  duration: int("duration").default(6000), // in milliseconds, default 6 seconds
  includeNude: boolean("includeNude").default(false),
  includeAudio: boolean("includeAudio").default(true),
  // Output
  videoUrl: text("videoUrl"),
  audioUrl: text("audioUrl"),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  // Quality metrics
  qualityScore: decimal("qualityScore", { precision: 3, scale: 2 }), // 0.00 - 1.00
  userRating: int("userRating"), // 1-5 stars
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type GeneratedSegment = typeof generatedSegments.$inferSelect;
export type InsertGeneratedSegment = typeof generatedSegments.$inferInsert;

// Video generation queue/jobs
export const videoGenerationJobs = mysqlTable("videoGenerationJobs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  segmentId: int("segmentId"),
  jobType: mysqlEnum("jobType", ["analysis", "screenshot", "generation", "merge"]).notNull(),
  // External API tracking
  externalJobId: varchar("externalJobId", { length: 128 }),
  provider: mysqlEnum("provider", ["hailuo_ai", "veo_3", "wan_2_6", "internal"]).notNull(),
  // Status
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "cancelled"]).default("queued"),
  progress: int("progress").default(0), // 0-100
  errorMessage: text("errorMessage"),
  // Timing
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  // Cost tracking
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 4 }),
  actualCost: decimal("actualCost", { precision: 10, scale: 4 }),
});

export type VideoGenerationJob = typeof videoGenerationJobs.$inferSelect;
export type InsertVideoGenerationJob = typeof videoGenerationJobs.$inferInsert;

// ============================================
// GALLERY VIDEOS
// ============================================
export const galleryVideos = mysqlTable("galleryVideos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // seconds
  category: mysqlEnum("category", ["tgtf", "body_swap", "transformation", "romance", "fantasy", "other"]),
  tags: json("tags").$type<string[]>(),
  // Stats
  viewCount: int("viewCount").default(0),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: int("ratingCount").default(0),
  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryVideo = typeof galleryVideos.$inferSelect;
export type InsertGalleryVideo = typeof galleryVideos.$inferInsert;

// Gallery video likes
export const galleryLikes = mysqlTable("galleryLikes", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryLike = typeof galleryLikes.$inferSelect;

// Gallery video ratings
export const galleryRatings = mysqlTable("galleryRatings", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryRating = typeof galleryRatings.$inferSelect;

// Gallery video comments
export const galleryComments = mysqlTable("galleryComments", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  parentId: int("parentId"), // for nested replies
  likeCount: int("likeCount").default(0),
  isEdited: boolean("isEdited").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryComment = typeof galleryComments.$inferSelect;
export type InsertGalleryComment = typeof galleryComments.$inferInsert;

// ============================================
// CHATBOT WITH MEMORY & RAG
// ============================================

// Chat conversations (persistent memory)
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  context: mysqlEnum("context", ["content", "thumbnails", "analytics", "marketing", "general"]).default("general"),
  messageCount: int("messageCount").default(0),
  lastMessageAt: timestamp("lastMessageAt"),
  isClosed: boolean("isClosed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Chat messages
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  // RAG metadata
  sourceDocuments: json("sourceDocuments").$type<string[]>(), // RAG document titles used
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  // Feedback
  wasHelpful: boolean("wasHelpful"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// RAG knowledge base documents
export const ragDocuments = mysqlTable("ragDocuments", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["faq", "tutorial", "policy", "feature", "tip", "best_practice"]).notNull(),
  tags: json("tags").$type<string[]>(),
  // Usage stats
  useCount: int("useCount").default(0),
  helpfulCount: int("helpfulCount").default(0),
  // Status
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RagDocument = typeof ragDocuments.$inferSelect;
export type InsertRagDocument = typeof ragDocuments.$inferInsert;

// Video reactions (emoji reactions at specific timestamps)
export const videoReactions = mysqlTable("videoReactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  reactionType: mysqlEnum("reactionType", ["love", "laugh", "wow", "sad", "fire", "clap", "thinking", "heart_eyes"]).notNull(),
  timestamp: int("timestamp").notNull(), // video timestamp in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoReaction = typeof videoReactions.$inferSelect;
export type InsertVideoReaction = typeof videoReactions.$inferInsert;


// Content Categories for expanded platform
export const contentCategories = mysqlTable("content_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  parentId: int("parentId"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentCategory = typeof contentCategories.$inferSelect;

// User Profiles Extended for Dating/Community
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 100 }),
  pronouns: varchar("pronouns", { length: 50 }),
  identityType: mysqlEnum("identityType", [
    "crossdresser", "femboy", "transgender", "non_binary", "questioning", "ally", "other"
  ]),
  lookingFor: json("lookingFor"), // ["friendship", "dating", "community", "mentorship"]
  interests: json("interests"), // ["fashion", "makeup", "transformation", "stories", "videos"]
  location: varchar("location", { length: 100 }),
  showLocation: boolean("showLocation").default(false),
  ageRange: varchar("ageRange", { length: 20 }), // "18-25", "26-35", etc.
  relationshipStatus: mysqlEnum("relationshipStatus", [
    "single", "in_relationship", "married", "its_complicated", "prefer_not_say"
  ]),
  experienceLevel: mysqlEnum("experienceLevel", [
    "curious", "beginner", "intermediate", "experienced", "mentor"
  ]),
  galleryImages: json("galleryImages"), // Array of image URLs
  socialLinks: json("socialLinks"), // { twitter, instagram, tiktok, etc. }
  isPublic: boolean("isPublic").default(true),
  isVerified: boolean("isVerified").default(false),
  lastActive: timestamp("lastActive").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;

// Dating Matches
export const datingMatches = mysqlTable("dating_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetUserId: int("targetUserId").notNull(),
  action: mysqlEnum("action", ["like", "super_like", "pass"]).notNull(),
  isMatch: boolean("isMatch").default(false),
  matchedAt: timestamp("matchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DatingMatch = typeof datingMatches.$inferSelect;

// Dating Messages
export const datingMessages = mysqlTable("dating_messages", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DatingMessage = typeof datingMessages.$inferSelect;

// Style Guides / Tutorials
export const styleGuides = mysqlTable("style_guides", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("coverImage"),
  categoryId: int("categoryId"),
  tags: json("tags"),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]),
  readTime: int("readTime"), // minutes
  viewCount: int("viewCount").default(0),
  likeCount: int("likeCount").default(0),
  isPremium: boolean("isPremium").default(false),
  isPublished: boolean("isPublished").default(false),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StyleGuide = typeof styleGuides.$inferSelect;

// Affiliate Products
export const affiliateProducts = mysqlTable("affiliate_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  affiliateUrl: text("affiliateUrl").notNull(),
  categoryId: int("categoryId"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  commission: decimal("commission", { precision: 5, scale: 2 }), // percentage
  merchant: varchar("merchant", { length: 100 }),
  isActive: boolean("isActive").default(true),
  clickCount: int("clickCount").default(0),
  conversionCount: int("conversionCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateProduct = typeof affiliateProducts.$inferSelect;

// Premium Subscriptions
export const premiumSubscriptions = mysqlTable("premium_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", ["supporter", "premium", "vip", "creator"]).notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "paused"]).default("active"),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PremiumSubscription = typeof premiumSubscriptions.$inferSelect;

// Community Forums
export const forumCategories = mysqlTable("forum_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const forumTopics = mysqlTable("forum_topics", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false),
  isLocked: boolean("isLocked").default(false),
  viewCount: int("viewCount").default(0),
  replyCount: int("replyCount").default(0),
  lastReplyAt: timestamp("lastReplyAt"),
  lastReplyBy: int("lastReplyBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const forumReplies = mysqlTable("forum_replies", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumCategory = typeof forumCategories.$inferSelect;
export type ForumTopic = typeof forumTopics.$inferSelect;
export type ForumReply = typeof forumReplies.$inferSelect;


// Photo Gallery
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: mysqlEnum("category", [
    "transformation", "fashion", "makeup", "lifestyle", "before_after", "cosplay", "other"
  ]).default("other"),
  tags: json("tags"),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  viewCount: int("viewCount").default(0),
  isPublic: boolean("isPublic").default(true),
  isPremium: boolean("isPremium").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// Photo Likes
export const photoLikes = mysqlTable("photo_likes", {
  id: int("id").autoincrement().primaryKey(),
  photoId: int("photoId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Photo Comments
export const photoComments = mysqlTable("photo_comments", {
  id: int("id").autoincrement().primaryKey(),
  photoId: int("photoId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  parentId: int("parentId"),
  likeCount: int("likeCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhotoComment = typeof photoComments.$inferSelect;

// Forum Topic Votes (upvote/downvote)
export const forumVotes = mysqlTable("forum_votes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topicId: int("topicId"),
  replyId: int("replyId"),
  voteType: mysqlEnum("voteType", ["upvote", "downvote"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Transformation Showcase (before/after pairs)
export const transformationShowcase = mysqlTable("transformation_showcase", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  beforeImageUrl: text("beforeImageUrl").notNull(),
  afterImageUrl: text("afterImageUrl").notNull(),
  category: mysqlEnum("category", [
    "mtf", "ftm", "crossdress", "makeup", "fashion", "cosplay", "other"
  ]).default("other"),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  isPublic: boolean("isPublic").default(true),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TransformationShowcase = typeof transformationShowcase.$inferSelect;


// ============ CONTENT REPORTS ============
export const contentReports = mysqlTable("contentReports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  contentType: mysqlEnum("contentType", ["forum_topic", "forum_reply", "photo", "comment", "video", "profile"]).notNull(),
  contentId: int("contentId").notNull(),
  reason: mysqlEnum("reason", ["spam", "harassment", "inappropriate", "misinformation", "copyright", "other"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ContentReport = typeof contentReports.$inferSelect;

// ============ USER REPUTATION & GAMIFICATION ============
export const userReputation = mysqlTable("userReputation", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  points: int("points").default(0).notNull(),
  rank: mysqlEnum("rank", ["newcomer", "member", "contributor", "expert", "legend"]).default("newcomer").notNull(),
  postsCount: int("postsCount").default(0).notNull(),
  repliesCount: int("repliesCount").default(0).notNull(),
  upvotesReceived: int("upvotesReceived").default(0).notNull(),
  likesReceived: int("likesReceived").default(0).notNull(),
  photosUploaded: int("photosUploaded").default(0).notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserReputation = typeof userReputation.$inferSelect;

export const badgeDefinitions = mysqlTable("badgeDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: mysqlEnum("category", ["milestone", "community", "content", "special"]).notNull(),
  requirement: varchar("requirement", { length: 255 }).notNull(),
  requiredValue: int("requiredValue").default(1).notNull(),
  pointsReward: int("pointsReward").default(10).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;


// ============ A/B TESTING FOR CTA BUTTONS ============
export const ctaTests = mysqlTable("ctaTests", {
  id: int("id").autoincrement().primaryKey(),
  testName: varchar("testName", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(), // e.g., "hero", "pricing", "exit_popup"
  isActive: boolean("isActive").default(true).notNull(),
  winnerVariantId: int("winnerVariantId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CtaTest = typeof ctaTests.$inferSelect;

export const ctaVariants = mysqlTable("ctaVariants", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  variantName: varchar("variantName", { length: 50 }).notNull(), // "A", "B", "C"
  buttonText: varchar("buttonText", { length: 100 }).notNull(),
  buttonColor: varchar("buttonColor", { length: 50 }), // tailwind class or hex
  subText: varchar("subText", { length: 200 }),
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CtaVariant = typeof ctaVariants.$inferSelect;

// ============ SOCIAL PROOF EVENTS ============
export const socialProofEvents = mysqlTable("socialProofEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", ["signup", "subscription", "purchase"]).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }),
  tierName: varchar("tierName", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SocialProofEvent = typeof socialProofEvents.$inferSelect;

// ============ ONBOARDING EVENTS (analytics) ============
export const onboardingEvents = mysqlTable("onboardingEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stepId: varchar("stepId", { length: 50 }).notNull(),
  action: mysqlEnum("action", ["view", "skip", "complete"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OnboardingEvent = typeof onboardingEvents.$inferSelect;
