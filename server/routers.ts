import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin procedure - only for admin users
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Creator procedure - for creators and admins
const creatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'creator' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Creator access required' });
  }
  return next({ ctx });
});

// Age verified procedure - requires age verification
const ageVerifiedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.isAgeVerified) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Age verification required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User management
  user: router({
    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        // Return public profile data only
        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          subscriptionPrice: user.subscriptionPrice,
          createdAt: user.createdAt,
        };
      }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
        subscriptionPrice: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    becomeCreator: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.isAgeVerified) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Age verification required to become a creator' });
      }
      await db.setUserRole(ctx.user.id, 'creator');
      return { success: true };
    }),
    
    getCreators: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getCreators(input.limit, input.offset);
      }),
    
    getAffiliateCode: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return { code: user?.affiliateCode };
    }),
  }),

  // Video management
  video: router({
    create: creatorProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        isPremium: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const videoId = await db.createVideo({
          ...input,
          creatorId: ctx.user.id,
          status: 'pending',
          isPublished: false,
        });
        return { videoId };
      }),
    
    update: creatorProcedure
      .input(z.object({
        videoId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        isPremium: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const video = await db.getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: 'NOT_FOUND' });
        if (video.creatorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const { videoId, ...data } = input;
        await db.updateVideo(videoId, data);
        return { success: true };
      }),
    
    get: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const video = await db.getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Check if user can view premium content
        let canView = !video.isPremium;
        if (ctx.user && video.isPremium) {
          if (video.creatorId === ctx.user.id || ctx.user.role === 'admin') {
            canView = true;
          } else {
            const subscription = await db.getActiveSubscription(ctx.user.id, video.creatorId);
            canView = !!subscription;
          }
        }
        
        // Increment view count
        await db.incrementVideoViews(input.videoId);
        
        // Check if user liked
        const hasLiked = ctx.user ? await db.hasUserLikedVideo(input.videoId, ctx.user.id) : false;
        
        return { ...video, canView, hasLiked };
      }),
    
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getPublishedVideos(input.limit, input.offset);
      }),
    
    listByCreator: publicProcedure
      .input(z.object({ creatorId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getVideosByCreator(input.creatorId, input.limit, input.offset);
      }),
    
    myVideos: creatorProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getVideosByCreator(ctx.user.id, input.limit, input.offset);
      }),
    
    like: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.toggleVideoLike(input.videoId, ctx.user.id);
        return { liked };
      }),
    
    flag: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        reason: z.enum(["illegal_content", "underage", "violence", "copyright", "spam", "other"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createModerationFlag({
          videoId: input.videoId,
          flaggedBy: ctx.user.id,
          reason: input.reason,
          description: input.description,
        });
        return { success: true };
      }),
    
    // Upload presigned URL generation
    getUploadUrl: creatorProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileKey = `videos/${ctx.user.id}/${nanoid()}-${input.filename}`;
        // For now, return the key - actual upload will be handled client-side
        return { fileKey, uploadUrl: `/api/upload/${fileKey}` };
      }),
  }),

  // Subscription management
  subscription: router({
    subscribe: ageVerifiedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.creatorId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot subscribe to yourself' });
        }
        
        const existing = await db.getActiveSubscription(ctx.user.id, input.creatorId);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Already subscribed' });
        }
        
        const creator = await db.getUserById(input.creatorId);
        if (!creator || creator.role !== 'creator') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Creator not found' });
        }
        
        // Create subscription (in real app, this would integrate with payment provider)
        const subscriptionId = await db.createSubscription({
          subscriberId: ctx.user.id,
          creatorId: input.creatorId,
          priceAtPurchase: creator.subscriptionPrice || "9.99",
          status: 'active',
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        
        // Create transaction record
        await db.createTransaction({
          userId: input.creatorId,
          type: 'subscription_payment',
          amount: creator.subscriptionPrice || "9.99",
          status: 'completed',
          relatedSubscriptionId: subscriptionId,
          description: `Subscription from user ${ctx.user.id}`,
        });
        
        // Handle multi-tier affiliate commissions
        const price = parseFloat(creator.subscriptionPrice || "9.99");
        await db.processMultiTierAffiliateCommissions(ctx.user.id, subscriptionId!, price);
        
        return { subscriptionId };
      }),
    
    cancel: protectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const subs = await db.getUserSubscriptions(ctx.user.id);
        const sub = subs.find(s => s.id === input.subscriptionId);
        if (!sub) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.cancelSubscription(input.subscriptionId);
        return { success: true };
      }),
    
    mySubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscriptions(ctx.user.id);
    }),
    
    mySubscribers: creatorProcedure.query(async ({ ctx }) => {
      return db.getCreatorSubscribers(ctx.user.id);
    }),
    
    checkAccess: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.id === input.creatorId || ctx.user.role === 'admin') {
          return { hasAccess: true };
        }
        const sub = await db.getActiveSubscription(ctx.user.id, input.creatorId);
        return { hasAccess: !!sub };
      }),
  }),

  // Affiliate program (Multi-tier MLM system)
  affiliate: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const earnings = await db.getAffiliateEarnings(ctx.user.id);
      const total = await db.getAffiliateTotalEarnings(ctx.user.id);
      const earningsByTier = await db.getAffiliateEarningsByTier(ctx.user.id);
      const networkStats = await db.getReferralNetworkStats(ctx.user.id);
      const user = await db.getUserById(ctx.user.id);
      return {
        affiliateCode: user?.affiliateCode,
        totalEarnings: total,
        recentEarnings: earnings.slice(0, 10),
        referralCount: earnings.length,
        earningsByTier,
        networkStats,
        tiers: db.AFFILIATE_TIERS,
      };
    }),
    
    getNetworkStats: protectedProcedure.query(async ({ ctx }) => {
      return db.getReferralNetworkStats(ctx.user.id);
    }),
    
    getEarningsByTier: protectedProcedure.query(async ({ ctx }) => {
      return db.getAffiliateEarningsByTier(ctx.user.id);
    }),
    
    registerReferral: publicProcedure
      .input(z.object({ affiliateCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          // Store in session/cookie for later
          return { stored: true };
        }
        
        const affiliate = await db.getUserByAffiliateCode(input.affiliateCode);
        if (!affiliate || affiliate.id === ctx.user.id) {
          return { success: false };
        }
        
        // Update user's referredBy if not already set
        const currentUser = await db.getUserById(ctx.user.id);
        if (!currentUser?.referredBy) {
          await db.updateUserProfile(ctx.user.id, { referredBy: affiliate.id });
        }
        
        return { success: true };
      }),
    
    // Leaderboard
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getAffiliateLeaderboard(input.limit);
      }),
    
    getMyPosition: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLeaderboardPosition(ctx.user.id);
    }),
    
    // Direct referrals with stats
    getDirectReferrals: protectedProcedure.query(async ({ ctx }) => {
      return db.getDirectReferrals(ctx.user.id);
    }),
    
    // Badges
    getAllBadges: publicProcedure.query(async () => {
      return db.getAllBadges();
    }),
    
    getMyBadges: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBadges(ctx.user.id);
    }),
    
    checkBadges: protectedProcedure.mutation(async ({ ctx }) => {
      const newBadges = await db.checkAndAwardBadges(ctx.user.id);
      return { newBadges };
    }),
  }),

  // Age verification
  ageVerification: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const verification = await db.getUserAgeVerification(ctx.user.id);
      return {
        isVerified: ctx.user.isAgeVerified,
        verification,
      };
    }),
    
    submit: protectedProcedure
      .input(z.object({
        method: z.enum(["id_document", "credit_card", "third_party"]),
        provider: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // In real app, this would integrate with verification provider
        const verificationId = await db.createAgeVerification({
          userId: ctx.user.id,
          verificationMethod: input.method,
          verificationProvider: input.provider,
          status: 'pending',
        });
        
        // For demo, auto-verify
        await db.updateAgeVerificationStatus(verificationId!, 'verified');
        await db.updateUserProfile(ctx.user.id, { isAgeVerified: true });
        
        return { verificationId, status: 'verified' };
      }),
  }),

  // Creator analytics
  analytics: router({
    creatorStats: creatorProcedure.query(async ({ ctx }) => {
      return db.getCreatorStats(ctx.user.id);
    }),
    
    transactions: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.getUserTransactions(ctx.user.id, input.limit);
      }),
  }),

  // Admin/Moderation
  admin: router({
    pendingVideos: adminProcedure.query(async () => {
      return db.getPendingVideos();
    }),
    
    approveVideo: adminProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateVideo(input.videoId, { status: 'approved', isPublished: true });
        return { success: true };
      }),
    
    rejectVideo: adminProcedure
      .input(z.object({ videoId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.updateVideo(input.videoId, { status: 'rejected' });
        return { success: true };
      }),
    
    pendingFlags: adminProcedure.query(async () => {
      return db.getPendingModerationFlags();
    }),
    
    resolveFlag: adminProcedure
      .input(z.object({
        flagId: z.number(),
        action: z.enum(["dismiss", "action_taken"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const status = input.action === 'dismiss' ? 'dismissed' : 'action_taken';
        await db.updateModerationFlag(input.flagId, status, ctx.user.id);
        return { success: true };
      }),
    
    setUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "creator"]),
      }))
      .mutation(async ({ input }) => {
        await db.setUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
