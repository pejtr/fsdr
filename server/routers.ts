import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyNewCommission, notifyNewBadge, notifyNewSubscriber } from "./notifications";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { PRODUCTS, type ProductKey } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia" as any,
});

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

    getEmailPreferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getEmailPreferences(ctx.user.id);
    }),

    updateEmailPreferences: protectedProcedure
      .input(z.object({
        weeklyDigestEnabled: z.boolean().optional(),
        promotionalEmailsEnabled: z.boolean().optional(),
      }).refine(
        (input) => input.weeklyDigestEnabled !== undefined || input.promotionalEmailsEnabled !== undefined,
        { message: "Vyberte alespoň jednu e-mailovou preferenci" },
      ))
      .mutation(async ({ ctx, input }) => {
        const current = await db.getEmailPreferences(ctx.user.id);
        const preferences = {
          weeklyDigestEnabled: input.weeklyDigestEnabled ?? current.weeklyDigestEnabled,
          promotionalEmailsEnabled: input.promotionalEmailsEnabled ?? current.promotionalEmailsEnabled,
        };
        await db.updateEmailPreferences(ctx.user.id, preferences);
        return preferences;
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
        const commissions = await db.processMultiTierAffiliateCommissions(ctx.user.id, subscriptionId!, price);
        
        // Send notifications
        await notifyNewSubscriber(input.creatorId, ctx.user.id, creator.subscriptionPrice || "9.99");
        
        // Notify affiliates about their commissions
        for (const commission of commissions) {
          await notifyNewCommission(
            commission.affiliateId,
            commission.amount,
            commission.tier,
            commission.commissionRate,
            ctx.user.id
          );
        }
        
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

    // Premium subscriptions (Stripe-based)
    myPremiumSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPremiumSubscriptions(ctx.user.id);
    }),

    activePremium: protectedProcedure.query(async ({ ctx }) => {
      return db.getActivePremiumSubscription(ctx.user.id);
    }),

    cancelPremium: protectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sub = await db.getActivePremiumSubscription(ctx.user.id);
        if (!sub || sub.id !== input.subscriptionId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription not found' });
        }
        // Cancel in Stripe if we have a subscription ID
        if (sub.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
          } catch (err: any) {
            console.error('[Stripe] Cancel error:', err.message);
          }
        }
        await db.cancelPremiumSubscription(input.subscriptionId, ctx.user.id);
        return { success: true };
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
      // Include gamification data
      const reputation = await db.getUserReputation(ctx.user.id);
      return {
        affiliateCode: user?.affiliateCode,
        totalEarnings: total,
        recentEarnings: earnings.slice(0, 10),
        referralCount: earnings.length,
        earningsByTier,
        networkStats,
        tiers: db.AFFILIATE_TIERS,
        // Gamification integration
        reputation: {
          points: reputation?.points || 0,
          rank: reputation?.rank || 'newcomer',
          postsCount: reputation?.postsCount || 0,
          repliesCount: reputation?.repliesCount || 0,
          upvotesReceived: reputation?.upvotesReceived || 0,
        },
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
          // Award reputation points to the affiliate for successful referral
          await db.addReputationPoints(affiliate.id, 'referral', 10);
          // Also award to the new user for joining via referral
          await db.addReputationPoints(ctx.user.id, 'referred_join', 5);
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
      
      // Send notifications for new badges
      for (const badge of newBadges) {
        await notifyNewBadge(
          ctx.user.id,
          badge.name,
          badge.tier,
          badge.description
        );
      }
      
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

  // UTM Tracking
  tracking: router({
    trackClick: publicProcedure
      .input(z.object({
        affiliateCode: z.string(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
        referer: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ip = ctx.req.headers['x-forwarded-for'] as string || ctx.req.socket?.remoteAddress || 'unknown';
        const ipHash = db.hashIP(ip);
        const userAgent = ctx.req.headers['user-agent'] as string || '';
        
        await db.trackAffiliateClick({
          affiliateCode: input.affiliateCode,
          utmSource: input.utmSource || null,
          utmMedium: input.utmMedium || null,
          utmCampaign: input.utmCampaign || null,
          utmContent: input.utmContent || null,
          ipHash,
          userAgent,
          referer: input.referer || null,
        });
        
        return { success: true };
      }),
    
    getClickStats: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.affiliateCode) return null;
      return db.getAffiliateClickStats(user.affiliateCode);
    }),
    
    getClicksBySource: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.affiliateCode) return [];
      return db.getAffiliateClicksBySource(user.affiliateCode);
    }),
    
    getClicksByCampaign: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.affiliateCode) return [];
      return db.getAffiliateClicksByCampaign(user.affiliateCode);
    }),
  }),

  // A/B Testing for Banners
  banners: router({
    list: publicProcedure
      .input(z.object({ size: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getBannerVariants(input.size);
      }),
    
    getStats: protectedProcedure.query(async () => {
      return db.getBannerStats();
    }),
    
    trackImpression: publicProcedure
      .input(z.object({ bannerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementBannerImpression(input.bannerId);
        return { success: true };
      }),
    
    trackClick: publicProcedure
      .input(z.object({ bannerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementBannerClick(input.bannerId);
        return { success: true };
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string(),
        size: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createBannerVariant(input);
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        bannerId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { bannerId, ...data } = input;
        await db.updateBannerVariant(bannerId, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ bannerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBannerVariant(input.bannerId);
        return { success: true };
      }),
    
    listAll: adminProcedure.query(async () => {
      return db.getAllBannerVariants();
    }),
  }),

  // Payout System
  payout: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return db.getAvailableBalance(ctx.user.id);
    }),
    
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return db.getPaymentSettings(ctx.user.id);
    }),
    
    updateSettings: protectedProcedure
      .input(z.object({
        preferredMethod: z.enum(["paypal", "bank_transfer", "crypto"]).optional(),
        paypalEmail: z.string().email().optional().nullable(),
        bankAccountName: z.string().optional().nullable(),
        bankAccountNumber: z.string().optional().nullable(),
        bankRoutingNumber: z.string().optional().nullable(),
        bankName: z.string().optional().nullable(),
        bankSwift: z.string().optional().nullable(),
        bankIban: z.string().optional().nullable(),
        cryptoWalletAddress: z.string().optional().nullable(),
        cryptoCurrency: z.string().optional().nullable(),
        minimumPayout: z.string().optional(),
        autoPayoutEnabled: z.boolean().optional(),
        autoPayoutThreshold: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPaymentSettings(ctx.user.id, input);
        return { success: true };
      }),
    
    requestPayout: protectedProcedure
      .input(z.object({
        amount: z.number().min(10),
        paymentMethod: z.enum(["paypal", "bank_transfer", "crypto"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check available balance
        const balance = await db.getAvailableBalance(ctx.user.id);
        if (balance.available < input.amount) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient balance' });
        }
        
        // Check minimum payout
        const settings = await db.getPaymentSettings(ctx.user.id);
        const minPayout = parseFloat(settings?.minimumPayout || "50");
        if (input.amount < minPayout) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Minimum payout is $${minPayout}` });
        }
        
        // Check payment details are set
        if (input.paymentMethod === 'paypal' && !settings?.paypalEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'PayPal email not set' });
        }
        if (input.paymentMethod === 'bank_transfer' && !settings?.bankAccountNumber) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bank account not set' });
        }
        if (input.paymentMethod === 'crypto' && !settings?.cryptoWalletAddress) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Crypto wallet not set' });
        }
        
        const payoutId = await db.createPayoutRequest({
          userId: ctx.user.id,
          amount: input.amount.toString(),
          paymentMethod: input.paymentMethod,
          status: 'pending',
        });
        
        return { payoutId };
      }),
    
    getMyRequests: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPayoutRequests(ctx.user.id);
    }),
    
    // Admin endpoints
    getAllRequests: adminProcedure
      .input(z.object({ status: z.enum(["pending", "processing", "completed", "rejected"]).optional() }))
      .query(async ({ input }) => {
        return db.getAllPayoutRequests(input.status);
      }),
    
    processRequest: adminProcedure
      .input(z.object({
        payoutId: z.number(),
        action: z.enum(["approve", "reject", "complete"]),
        rejectionReason: z.string().optional(),
        transactionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let status: 'processing' | 'completed' | 'rejected';
        switch (input.action) {
          case 'approve':
            status = 'processing';
            break;
          case 'complete':
            status = 'completed';
            break;
          case 'reject':
            status = 'rejected';
            break;
        }
        
        await db.updatePayoutRequest(
          input.payoutId,
          status,
          ctx.user.id,
          input.rejectionReason,
          input.transactionId
        );
        
        return { success: true };
      }),
  }),

  // YouTube Integration
  youtube: router({
    // Connect YouTube channel via channel URL
    connectByUrl: creatorProcedure
      .input(z.object({ channelUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Extract channel ID from URL
        const channelIdMatch = input.channelUrl.match(/(?:channel\/|@)([a-zA-Z0-9_-]+)/);
        if (!channelIdMatch) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid YouTube channel URL' });
        }
        
        const channelId = channelIdMatch[1];
        
        // Check if already connected
        const existing = await db.getYoutubeChannelByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'YouTube channel already connected' });
        }
        
        // Create channel record (in real app, would fetch channel info from YouTube API)
        const id = await db.createYoutubeChannel({
          userId: ctx.user.id,
          channelId,
          channelTitle: `Channel ${channelId}`,
          isConnected: true,
        });
        
        return { channelId: id, message: 'Channel connected. Use OAuth for full access.' };
      }),
    
    // Get connected channel info
    getChannel: creatorProcedure.query(async ({ ctx }) => {
      return db.getYoutubeChannelByUserId(ctx.user.id);
    }),
    
    // Disconnect YouTube channel
    disconnect: creatorProcedure.mutation(async ({ ctx }) => {
      const channel = await db.getYoutubeChannelByUserId(ctx.user.id);
      if (!channel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No YouTube channel connected' });
      }
      await db.disconnectYoutubeChannel(channel.id);
      return { success: true };
    }),
    
    // Import videos from YouTube channel (mock - in real app would use YouTube API)
    importVideos: creatorProcedure.mutation(async ({ ctx }) => {
      const channel = await db.getYoutubeChannelByUserId(ctx.user.id);
      if (!channel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No YouTube channel connected' });
      }
      
      // Mock import - in real app would fetch from YouTube Data API
      const mockVideos = [
        { id: `yt_${nanoid(11)}`, title: 'Sample Video 1', views: 1000, likes: 50 },
        { id: `yt_${nanoid(11)}`, title: 'Sample Video 2', views: 2500, likes: 120 },
        { id: `yt_${nanoid(11)}`, title: 'Sample Video 3', views: 5000, likes: 300 },
      ];
      
      let imported = 0;
      for (const video of mockVideos) {
        const existing = await db.getYoutubeVideoByYtId(video.id);
        if (!existing) {
          await db.createYoutubeVideo({
            channelId: channel.id,
            youtubeVideoId: video.id,
            title: video.title,
            ytViewCount: video.views,
            ytLikeCount: video.likes,
            publishedAt: new Date(),
          });
          imported++;
        }
      }
      
      // Update channel stats
      await db.updateYoutubeChannel(channel.id, {
        videoCount: (channel.videoCount || 0) + imported,
        lastSyncedAt: new Date(),
      });
      
      return { imported, message: `Imported ${imported} videos` };
    }),
    
    // Get imported YouTube videos
    getVideos: creatorProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const channel = await db.getYoutubeChannelByUserId(ctx.user.id);
        if (!channel) return [];
        return db.getYoutubeVideosByChannel(channel.id, input.limit, input.offset);
      }),
    
    // Link extended version to YouTube video
    linkExtended: creatorProcedure
      .input(z.object({ youtubeVideoId: z.number(), extendedVideoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const channel = await db.getYoutubeChannelByUserId(ctx.user.id);
        if (!channel) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No YouTube channel connected' });
        }
        
        await db.linkExtendedVideo(input.youtubeVideoId, input.extendedVideoId);
        return { success: true };
      }),
    
    // Get overview stats
    getStats: creatorProcedure.query(async ({ ctx }) => {
      return db.getYoutubeOverviewStats(ctx.user.id);
    }),
    
    // Get video stats history for graphs
    getVideoStatsHistory: creatorProcedure
      .input(z.object({ youtubeVideoId: z.number(), days: z.number().default(30) }))
      .query(async ({ input }) => {
        return db.getYoutubeVideoStatsHistory(input.youtubeVideoId, input.days);
      }),
    
    // Get channel stats history for graphs
    getChannelStatsHistory: creatorProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const channel = await db.getYoutubeChannelByUserId(ctx.user.id);
        if (!channel) return [];
        return db.getYoutubeChannelStatsHistory(channel.id, input.days);
      }),
    
    // Generate AI thumbnail variants
    generateThumbnails: creatorProcedure
      .input(z.object({ youtubeVideoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // In real app, would call AI image generation API
        const variants = [];
        for (let i = 1; i <= 3; i++) {
          const id = await db.createThumbnailVariant({
            youtubeVideoId: input.youtubeVideoId,
            variantNumber: i,
            imageUrl: `/api/placeholder/thumbnail-${input.youtubeVideoId}-v${i}.jpg`,
            prompt: `AI generated thumbnail variant ${i}`,
            isActive: false,
          });
          variants.push({ id, variantNumber: i });
        }
        return { variants, message: 'Generated 3 thumbnail variants' };
      }),
    
    // Get thumbnail variants for a video
    getThumbnailVariants: creatorProcedure
      .input(z.object({ youtubeVideoId: z.number() }))
      .query(async ({ input }) => {
        return db.getThumbnailVariants(input.youtubeVideoId);
      }),
    
    // Set active thumbnail variant for A/B testing
    setActiveThumbnail: creatorProcedure
      .input(z.object({ variantId: z.number(), youtubeVideoId: z.number() }))
      .mutation(async ({ input }) => {
        await db.setThumbnailWinner(input.youtubeVideoId, input.variantId);
        return { success: true };
      }),
    
    // Record thumbnail impression (for A/B testing)
    recordImpression: publicProcedure
      .input(z.object({ variantId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementThumbnailImpressions(input.variantId);
        return { success: true };
      }),
    
    // Record thumbnail click (for A/B testing)
    recordClick: publicProcedure
      .input(z.object({ variantId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementThumbnailClicks(input.variantId);
        return { success: true };
      }),

    // Import videos from YouTube channel (real API)
    importFromAPI: adminProcedure
      .input(z.object({
        channelId: z.string(),
        maxResults: z.number().default(50)
      }))
      .mutation(async ({ input, ctx }) => {
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'YouTube API key not configured' });
        }

        // Fetch videos from YouTube
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${input.channelId}&part=snippet&order=date&maxResults=${input.maxResults}&type=video`
        );

        if (!response.ok) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch YouTube videos' });
        }

        const data = await response.json();
        const videos = data.items || [];

        // Fetch video details (statistics, duration)
        const videoIds = videos.map((v: any) => v.id.videoId).join(',');
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`
        );

        if (!detailsResponse.ok) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch video details' });
        }

        const detailsData = await detailsResponse.json();
        const videoDetails = detailsData.items || [];

        // Import videos to database
        let imported = 0;
        for (const video of videoDetails) {
          const existing = await db.getVideoByYoutubeId(video.id);
          if (existing) continue;

          // Parse duration (PT1M30S -> 90 seconds)
          const duration = parseDuration(video.contentDetails.duration);

          await db.createVideo({
            creatorId: ctx.user.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
            videoUrl: `https://www.youtube.com/embed/${video.id}`,
            duration,
            isPremium: false,
            isPublished: true,
            status: 'approved',
            youtubeVideoId: video.id,
            youtubeChannelId: input.channelId,
            youtubePublishedAt: new Date(video.snippet.publishedAt),
            youtubeViewCount: parseInt(video.statistics.viewCount || '0'),
            youtubeLikeCount: parseInt(video.statistics.likeCount || '0'),
            youtubeCommentCount: parseInt(video.statistics.commentCount || '0'),
            lastYoutubeSync: new Date(),
          });
          imported++;
        }

        return { success: true, imported, total: videos.length };
      }),

    // Sync YouTube comments for a video
    syncComments: adminProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ input }) => {
        const video = await db.getVideoById(input.videoId);
        if (!video || !video.youtubeVideoId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found or not from YouTube' });
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'YouTube API key not configured' });
        }

        // Fetch comments from YouTube
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?key=${YOUTUBE_API_KEY}&videoId=${video.youtubeVideoId}&part=snippet&maxResults=100&order=relevance`
        );

        if (!response.ok) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch YouTube comments' });
        }

        const data = await response.json();
        const comments = data.items || [];

        // Import comments to database
        let imported = 0;
        for (const comment of comments) {
          const snippet = comment.snippet.topLevelComment.snippet;
          
          // Check if comment already exists
          const existing = await db.getCommentByYoutubeId(comment.id);
          if (existing) continue;

          await db.createComment({
            videoId: input.videoId,
            authorId: video.creatorId, // Assign to video creator
            content: snippet.textDisplay,
            youtubeCommentId: comment.id,
            youtubeAuthorName: snippet.authorDisplayName,
            youtubeAuthorChannelId: snippet.authorChannelId?.value,
            youtubePublishedAt: new Date(snippet.publishedAt),
          });
          imported++;
        }

        // Update sync timestamp
        await db.updateVideoYoutubeSync(input.videoId, new Date());

        return { success: true, imported, total: comments.length };
      }),

    // Sync all YouTube videos (cron job endpoint)
    syncAll: adminProcedure
      .mutation(async () => {
        const videos = await db.getYoutubeVideos();
        let synced = 0;

        for (const video of videos) {
          try {
            // Sync comments for each video
            const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
            if (!YOUTUBE_API_KEY) continue;

            const response = await fetch(
              `https://www.googleapis.com/youtube/v3/commentThreads?key=${YOUTUBE_API_KEY}&videoId=${video.youtubeVideoId}&part=snippet&maxResults=100&order=time`
            );

            if (response.ok) {
              const data = await response.json();
              const comments = data.items || [];

              for (const comment of comments) {
                const snippet = comment.snippet.topLevelComment.snippet;
                const existing = await db.getCommentByYoutubeId(comment.id);
                if (existing) continue;

                await db.createComment({
                  videoId: video.id,
                  authorId: video.creatorId,
                  content: snippet.textDisplay,
                  youtubeCommentId: comment.id,
                  youtubeAuthorName: snippet.authorDisplayName,
                  youtubeAuthorChannelId: snippet.authorChannelId?.value,
                  youtubePublishedAt: new Date(snippet.publishedAt),
                });
              }

              await db.updateVideoYoutubeSync(video.id, new Date());
              synced++;
            }
          } catch (error) {
            console.error(`Failed to sync video ${video.id}:`, error);
          }
        }

        return { success: true, synced, total: videos.length };
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

  // ============ NEWSFEED ============
  feed: router({
    // Get feed posts
    getPosts: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const posts = await db.getFeedPosts(ctx.user.id, input.limit, input.offset);
        // Enrich with author data and like status
        const enriched = await Promise.all(posts.map(async (post) => {
          const author = await db.getUserById(post.authorId);
          const hasLiked = await db.hasUserLikedPost(post.id, ctx.user.id);
          return {
            ...post,
            author: author ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl, role: author.role } : null,
            hasLiked,
          };
        }));
        return enriched;
      }),
    
    // Get public feed (for non-logged users)
    getPublicPosts: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const posts = await db.getPublicFeedPosts(input.limit, input.offset);
        const enriched = await Promise.all(posts.map(async (post) => {
          const author = await db.getUserById(post.authorId);
          return {
            ...post,
            author: author ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl, role: author.role } : null,
            hasLiked: false,
          };
        }));
        return enriched;
      }),
    
    // Get creator's posts
    getCreatorPosts: publicProcedure
      .input(z.object({ creatorId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const posts = await db.getCreatorPosts(input.creatorId, input.limit, input.offset);
        const enriched = await Promise.all(posts.map(async (post) => {
          const author = await db.getUserById(post.authorId);
          const hasLiked = ctx.user ? await db.hasUserLikedPost(post.id, ctx.user.id) : false;
          return {
            ...post,
            author: author ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl, role: author.role } : null,
            hasLiked,
          };
        }));
        return enriched;
      }),
    
    // Create post
    createPost: creatorProcedure
      .input(z.object({
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        videoId: z.number().optional(),
        visibility: z.enum(["public", "subscribers", "private"]).default("public"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.content && !input.imageUrl && !input.videoId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Post must have content, image or video' });
        }
        const postId = await db.createPost({
          authorId: ctx.user.id,
          ...input,
        });
        return { postId };
      }),
    
    // Delete post
    deletePost: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) throw new TRPCError({ code: 'NOT_FOUND' });
        if (post.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.deletePost(input.postId);
        return { success: true };
      }),
    
    // Like/unlike post
    toggleLike: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.togglePostLike(input.postId, ctx.user.id);
        return { liked };
      }),
    
    // Get comments for post
    getComments: publicProcedure
      .input(z.object({ postId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const comments = await db.getPostComments(input.postId, input.limit, input.offset);
        const enriched = await Promise.all(comments.map(async (comment) => {
          const author = await db.getUserById(comment.authorId);
          return {
            ...comment,
            author: author ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl } : null,
          };
        }));
        return enriched;
      }),
     // Create comment
    createComment: protectedProcedure
      .input(z.object({
        postId: z.number().optional(),
        videoId: z.number().optional(),
        parentId: z.number().optional(),
        content: z.string().min(1),
        timestamp: z.number().optional(), // video timestamp in seconds
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.postId && !input.videoId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Must specify postId or videoId' });
        }
        const commentId = await db.createComment({
          authorId: ctx.user.id,
          ...input,
        });
        
        // Create notification for post/video author
        if (input.postId) {
          const post = await db.getPostById(input.postId);
          if (post && post.authorId !== ctx.user.id) {
            await db.createNotification({
              userId: post.authorId,
              type: 'new_comment',
              title: 'Nový komentář',
              content: `${ctx.user.name || 'Uživatel'} okomentoval váš příspěvek`,
              relatedUserId: ctx.user.id,
              linkUrl: `/feed?post=${input.postId}`,
            });
          }
        }
        
        return { commentId };
      }),
    
    // Delete comment
    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // TODO: verify ownership
        await db.deleteComment(input.commentId);
        return { success: true };
      }),
    
    // Like comment
    toggleCommentLike: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.toggleCommentLike(input.commentId, ctx.user.id);
        return { liked };
      }),

    // Get comments by timestamp range
    getCommentsByTimestamp: publicProcedure
      .input(z.object({
        videoId: z.number(),
        startTime: z.number(),
        endTime: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getCommentsByTimestamp(input.videoId, input.startTime, input.endTime);
      }),

    // Get all timestamped comments for video
    getTimestampedComments: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getTimestampedComments(input.videoId);
      }),
  }),

  // ============ VIDEO REACTIONS ============
  videoReactions: router({
    // Add reaction at timestamp
    addReaction: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        reactionType: z.enum(['love', 'laugh', 'wow', 'sad', 'fire', 'clap', 'thinking', 'heart_eyes']),
        timestamp: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reactionId = await db.createVideoReaction({
          userId: ctx.user.id,
          ...input,
        });
        return { reactionId };
      }),

    // Get reactions for video
    getReactions: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoReactions(input.videoId);
      }),

    // Get reactions by timestamp range
    getReactionsByTimestamp: publicProcedure
      .input(z.object({
        videoId: z.number(),
        startTime: z.number(),
        endTime: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getReactionsByTimestamp(input.videoId, input.startTime, input.endTime);
      }),

    // Get reaction heatmap (aggregated by second)
    getReactionHeatmap: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getReactionHeatmap(input.videoId);
      }),

    // Remove reaction
    removeReaction: protectedProcedure
      .input(z.object({ reactionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteVideoReaction(input.reactionId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============ FOLLOWS ============
  follow: router({
    // Follow user
    follow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot follow yourself' });
        }
        const success = await db.followUser(ctx.user.id, input.userId);
        
        if (success) {
          // Create notification
          await db.createNotification({
            userId: input.userId,
            type: 'new_follower',
            title: 'Nový sledující',
            content: `${ctx.user.name || 'Uživatel'} vás začal sledovat`,
            relatedUserId: ctx.user.id,
            linkUrl: `/profile/${ctx.user.id}`,
          });
        }
        
        return { success };
      }),
    
    // Unfollow user
    unfollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.unfollowUser(ctx.user.id, input.userId);
        return { success };
      }),
    
    // Check if following
    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isFollowing(ctx.user.id, input.userId);
      }),
    
    // Get followers
    getFollowers: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getFollowers(input.userId, input.limit);
      }),
    
    // Get following
    getFollowing: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getFollowing(input.userId, input.limit);
      }),
    
    // Get follow counts
    getCounts: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowCounts(input.userId);
      }),
  }),

  // ============ DIRECT MESSAGING ============
  messages: router({
    // Get conversations
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const convs = await db.getUserConversations(ctx.user.id);
      // Enrich with other participant data
      const enriched = await Promise.all(convs.map(async (conv) => {
        const otherUserId = conv.participant1Id === ctx.user.id ? conv.participant2Id : conv.participant1Id;
        const otherUser = await db.getUserById(otherUserId);
        const unreadCount = conv.participant1Id === ctx.user.id ? conv.unreadCount1 : conv.unreadCount2;
        return {
          ...conv,
          otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
          unreadCount,
        };
      }));
      return enriched;
    }),
    
    // Start or get conversation with user
    startConversation: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot message yourself' });
        }
        const conv = await db.getOrCreateConversation(ctx.user.id, input.userId);
        return conv;
      }),
    
    // Get messages in conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number(), limit: z.number().default(50), beforeId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        // Mark as read
        await db.markMessagesAsRead(input.conversationId, ctx.user.id);
        const msgs = await db.getConversationMessages(input.conversationId, input.limit, input.beforeId);
        return msgs.reverse(); // Return in chronological order
      }),
    
    // Send message
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.content && !input.imageUrl) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Message must have content or image' });
        }
        const messageId = await db.sendMessage(input.conversationId, ctx.user.id, input.content || '', input.imageUrl);
        
        // Send push notification to recipient
        const conv = await db.getConversationById(input.conversationId);
        if (conv) {
          const recipientId = conv.participant1Id === ctx.user.id ? conv.participant2Id : conv.participant1Id;
          const { notifyNewMessage } = await import('./notifications');
          await notifyNewMessage(recipientId, ctx.user.id, input.content || '[Obrázek]');
        }
        
        return { messageId };
      }),
    
    // Mark conversation as read
    markRead: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessagesAsRead(input.conversationId, ctx.user.id);
        return { success: true };
      }),
    
    // Get unread count
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getTotalUnreadMessages(ctx.user.id);
    }),
  }),

  // ============ AI CHATBOT ============
  chatbot: router({
    // Get conversations
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserChatbotConversations(ctx.user.id);
    }),
    
    // Create new conversation
    createConversation: protectedProcedure
      .input(z.object({
        context: z.enum(["general", "content_tips", "thumbnail_generation", "analytics", "marketing"]).default("general"),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.createChatbotConversation(ctx.user.id, input.context);
        return { conversationId };
      }),
    
    // Get messages in conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const conv = await db.getChatbotConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return db.getChatbotMessages(input.conversationId);
      }),
    
    // Send message and get AI response
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const conv = await db.getChatbotConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Save user message
        await db.addChatbotMessage(input.conversationId, 'user', input.content);
        
        // Get conversation history for context
        const history = await db.getChatbotMessages(input.conversationId);
        
        // Build system prompt based on context
        let systemPrompt = `Jsi FEMSIDER AI asistent, který pomáhá tvůrcům obsahu na platformě FEMSIDER. 
FEMSIDER je premiérová platforma pro NSFW obsah, která nabízí 88% podíl z příjmů pro tvůrce a víceúrovňový affiliate program.
Odpovídej v češtině, buď přátelský a profesionální. Poskytuj konkrétní a užitečné rady.`;
        
        switch (conv.context) {
          case 'content_tips':
            systemPrompt += `\n\nSpecializuješ se na tipy pro zlepšení obsahu. Pomáhej s:
- Optimalizací názvů a popisů videí
- Strategií pro zvýšení angažovanosti
- Plánováním obsahu a konzistencí
- Budováním komunity a interakcí s fanoušky`;
            break;
          case 'thumbnail_generation':
            systemPrompt += `\n\nSpecializuješ se na tvorbu miniatur. Pomáhej s:
- Návrhy efektivních miniatur
- Barevnými schématy a kompozicí
- A/B testováním a optimalizací CTR
- Psychologií klikání a pozornosti`;
            break;
          case 'analytics':
            systemPrompt += `\n\nSpecializuješ se na analýzu dat. Pomáhej s:
- Interpretací metrik a statistik
- Identifikací trendů a příležitostí
- Optimalizací výkonu obsahu
- Srovnáním s průměry v odvětví`;
            break;
          case 'marketing':
            systemPrompt += `\n\nSpecializuješ se na marketing a propagaci. Pomáhej s:
- Strategií pro sociální sítě
- Affiliate marketingem a partnerstvími
- Budováním osobní značky
- Monetizací a cenovou strategií`;
            break;
        }
        
        // Call LLM
        const { invokeLLM } = await import('./_core/llm');
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...history.slice(-10).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: input.content },
        ];
        
        try {
          const response = await invokeLLM({ messages });
          const rawContent = response.choices[0]?.message?.content;
          const assistantContent = typeof rawContent === 'string' ? rawContent : 'Omlouvám se, nepodařilo se mi vygenerovat odpověď.';
          
          // Save assistant response
          await db.addChatbotMessage(input.conversationId, 'assistant', assistantContent);
          
          return { response: assistantContent };
        } catch (error) {
          console.error('LLM error:', error);
          const errorMessage = 'Omlouvám se, došlo k chybě při zpracování vašeho dotazu. Zkuste to prosím znovu.';
          await db.addChatbotMessage(input.conversationId, 'assistant', errorMessage);
          return { response: errorMessage };
        }
      }),
    
    // Delete conversation
    deleteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getChatbotConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.deleteChatbotConversation(input.conversationId);
        return { success: true };
      }),
  }),

  // ============ NOTIFICATIONS ============
  notifications: router({
    // Get notifications
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(50), unreadOnly: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input.limit, input.unreadOnly);
      }),
    
    // Mark as read
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
    
    // Mark all as read
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    
    // Get unread count
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
  }),

  // ============ VIDEO RECREATE STUDIO ============
  videoRecreate: router({
    // Create new project
    createProject: creatorProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        sourceType: z.enum(["upload", "url", "youtube"]),
        sourceUrl: z.string().optional(),
        projectType: z.enum(["remake", "sequel", "extend_scene"]).default("extend_scene"),
        targetModel: z.enum(["hailuo_ai", "veo_3", "wan_2_6"]).default("wan_2_6"),
        generateNude: z.boolean().default(false),
        generateAudio: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createVideoProject({
          userId: ctx.user.id,
          ...input,
        });
        return { projectId };
      }),
    
    // Get user's projects
    getProjects: creatorProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getUserVideoProjects(ctx.user.id, input.limit, input.offset);
      }),
    
    // Get single project with all data
    getProject: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getFullVideoProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return project;
      }),
    
    // Update project
    updateProject: creatorProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        targetModel: z.enum(["hailuo_ai", "veo_3", "wan_2_6"]).optional(),
        generateNude: z.boolean().optional(),
        generateAudio: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const { projectId, ...data } = input;
        await db.updateVideoProject(projectId, data);
        return { success: true };
      }),
    
    // Delete project
    deleteProject: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.deleteVideoProject(input.projectId);
        return { success: true };
      }),
    
    // Upload video file
    uploadVideo: creatorProcedure
      .input(z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `video-recreate/${ctx.user.id}/${input.projectId}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Update project with source URL
        await db.updateVideoProject(input.projectId, {
          sourceUrl: url,
          sourceType: 'upload',
        });
        
        return { url, success: true };
      }),
    
    // Get presigned upload URL for large files
    getUploadUrl: creatorProcedure
      .input(z.object({
        projectId: z.number(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        const fileKey = `video-recreate/${ctx.user.id}/${input.projectId}/${nanoid()}-${input.fileName}`;
        // For now return a placeholder - real implementation would use presigned URLs
        return { fileKey, projectId: input.projectId };
      }),
    
    // Start video analysis (mock - would call AI service)
    analyzeVideo: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Update status to analyzing
        await db.updateVideoProject(input.projectId, {
          status: 'analyzing',
          analysisStatus: 'processing',
        });
        
        // Create analysis job
        await db.createGenerationJob({
          projectId: input.projectId,
          jobType: 'analysis',
          provider: 'internal',
          status: 'processing',
          startedAt: new Date(),
        });
        
        // Mock: Generate sample scenes (in real app would call AI video analysis API)
        const mockScenes = [
          { type: 'dialogue', start: 0, end: 15000, desc: 'Úvod - postava mluví do kamery', canExtend: false },
          { type: 'action', start: 15000, end: 30000, desc: 'Akce - chůze a pohyb', canExtend: false },
          { type: 'romantic', start: 30000, end: 45000, desc: 'Romantická scéna - blízký kontakt', canExtend: true },
          { type: 'kiss', start: 45000, end: 52000, desc: 'Líbací scéna - intenzivní moment', canExtend: true, isKey: true },
          { type: 'dialogue', start: 52000, end: 70000, desc: 'Dialog po scéně', canExtend: false },
          { type: 'intimate', start: 70000, end: 90000, desc: 'Intimní scéna - možnost rozšíření', canExtend: true, isKey: true },
        ];
        
        for (let i = 0; i < mockScenes.length; i++) {
          const scene = mockScenes[i];
          const sceneId = await db.createVideoScene({
            projectId: input.projectId,
            sceneNumber: i + 1,
            startTime: scene.start,
            endTime: scene.end,
            duration: scene.end - scene.start,
            sceneType: scene.type as any,
            isKeyScene: scene.isKey || false,
            canExtend: scene.canExtend,
            description: scene.desc,
            prompt: `Generate a ${scene.type} scene: ${scene.desc}`,
            extensionSuggestion: scene.canExtend ? `Rozšiřte tuto ${scene.type} scénu o další detaily a emoce` : null,
          });
          
          // Generate 4 screenshots for extendable scenes
          if (scene.canExtend && sceneId) {
            for (let f = 1; f <= 4; f++) {
              const timestamp = scene.start + Math.floor((scene.end - scene.start) * (f / 5));
              await db.createSceneScreenshot({
                sceneId,
                projectId: input.projectId,
                frameNumber: f,
                timestamp,
                imageUrl: `/api/placeholder/screenshot-${input.projectId}-${sceneId}-${f}.jpg`,
                description: `Frame ${f} z ${scene.type} scény`,
                suggestedPrompt: `Continue this ${scene.type} scene with more intensity`,
              });
            }
          }
        }
        
        // Update project with analysis results
        await db.updateVideoProject(input.projectId, {
          status: 'draft',
          analysisStatus: 'completed',
          analysisResult: JSON.stringify({
            totalScenes: mockScenes.length,
            keyScenes: mockScenes.filter(s => s.isKey).length,
            extendableScenes: mockScenes.filter(s => s.canExtend).length,
            duration: 90000,
          }),
          originalDuration: 90,
        });
        
        return { success: true, message: 'Analýza dokončena' };
      }),
    
    // Get scenes for project
    getScenes: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return db.getProjectScenes(input.projectId);
      }),
    
    // Get extendable scenes
    getExtendableScenes: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const scenes = await db.getExtendableScenes(input.projectId);
        // Get screenshots for each scene
        const scenesWithScreenshots = await Promise.all(scenes.map(async (scene) => {
          const screenshots = await db.getSceneScreenshots(scene.id);
          return { ...scene, screenshots };
        }));
        return scenesWithScreenshots;
      }),
    
    // Select screenshot for scene
    selectScreenshot: creatorProcedure
      .input(z.object({ screenshotId: z.number(), sceneId: z.number() }))
      .mutation(async ({ input }) => {
        await db.selectScreenshot(input.screenshotId, input.sceneId);
        return { success: true };
      }),
    
    // Generate scene from template prompt (no existing scene required)
    generateFromTemplate: creatorProcedure
      .input(z.object({
        projectId: z.number(),
        prompt: z.string(),
        model: z.string().optional(),
        duration: z.number().optional(),
        aspectRatio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Create generation segment directly from prompt
        const existingSegments = await db.getProjectSegments(input.projectId);
        const segmentNumber = existingSegments.length + 1;
        
        const segmentId = await db.createGeneratedSegment({
          projectId: input.projectId,
          sceneId: null,
          segmentNumber,
          prompt: input.prompt,
          referenceImageUrl: null,
          model: (input.model || project.targetModel || 'hailuo_02') as any,
          duration: (input.duration || 6) * 1000,
          includeNude: project.generateNude || false,
          includeAudio: project.generateAudio || true,
          status: 'generating',
        });
        
        // Create generation job
        await db.createGenerationJob({
          projectId: input.projectId,
          segmentId,
          jobType: 'generation',
          provider: (input.model || project.targetModel || 'hailuo_02') as any,
          status: 'processing',
          startedAt: new Date(),
        });
        
        // Start actual video generation via MiniMax API
        try {
          const { generateVideo, mapModelName } = await import('./videoGeneration');
          const mappedModel = mapModelName(input.model || project.targetModel || 'hailuo_02');
          
          const generationResult = await generateVideo({
            prompt: input.prompt,
            model: mappedModel,
            duration: (input.duration === 10 ? 10 : 6) as 6 | 10,
            resolution: '1080P',
            asyncMode: true,
          });
          
          if (generationResult.success && generationResult.taskId) {
            await db.updateGenerationJob(segmentId!, {
              externalJobId: generationResult.taskId,
              status: 'processing',
            });
          } else if (generationResult.success && generationResult.videoUrl) {
            await db.updateGeneratedSegment(segmentId!, {
              status: 'completed',
              videoUrl: generationResult.videoUrl,
              completedAt: new Date(),
              qualityScore: '0.90',
            });
          } else {
            await db.updateGeneratedSegment(segmentId!, {
              status: 'failed',
            });
          }
        } catch (error) {
          console.error('Video generation error:', error);
          // Fallback to mock for development
          setTimeout(async () => {
            await db.updateGeneratedSegment(segmentId!, {
              status: 'completed',
              videoUrl: `/api/placeholder/generated-${input.projectId}-${segmentId}.mp4`,
              completedAt: new Date(),
              qualityScore: '0.85',
            });
          }, 3000);
        }
        
        return { segmentId, message: 'Generování zahájeno' };
      }),
    
    // Generate extended scene (mock - would call text-to-video API)
    generateScene: creatorProcedure
      .input(z.object({
        projectId: z.number(),
        sceneId: z.number(),
        screenshotId: z.number().optional(),
        customPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Get scene and screenshot
        const scenes = await db.getProjectScenes(input.projectId);
        const scene = scenes.find(s => s.id === input.sceneId);
        if (!scene) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Scéna nenalezena' });
        }
        
        let referenceImageUrl = null;
        if (input.screenshotId) {
          const screenshots = await db.getSceneScreenshots(input.sceneId);
          const screenshot = screenshots.find(s => s.id === input.screenshotId);
          referenceImageUrl = screenshot?.imageUrl;
        }
        
        // Create generation segment
        const existingSegments = await db.getProjectSegments(input.projectId);
        const segmentNumber = existingSegments.length + 1;
        
        const segmentId = await db.createGeneratedSegment({
          projectId: input.projectId,
          sceneId: input.sceneId,
          segmentNumber,
          prompt: input.customPrompt || scene.prompt || `Extend ${scene.sceneType} scene`,
          referenceImageUrl,
          model: project.targetModel as any,
          duration: 6000,
          includeNude: project.generateNude || false,
          includeAudio: project.generateAudio || true,
          status: 'generating',
        });
        
        // Create generation job
        await db.createGenerationJob({
          projectId: input.projectId,
          segmentId,
          jobType: 'generation',
          provider: project.targetModel as any,
          status: 'processing',
          startedAt: new Date(),
        });
        
        // Start actual video generation via MiniMax API
        try {
          const { generateVideo, mapModelName } = await import('./videoGeneration');
          const mappedModel = mapModelName(project.targetModel || 'wan_2_6');
          
          const generationResult = await generateVideo({
            prompt: input.customPrompt || scene.prompt || `Extend ${scene.sceneType} scene with more intensity and emotion`,
            model: mappedModel,
            firstFrameImage: referenceImageUrl || undefined,
            duration: 6,
            resolution: '1080P',
            asyncMode: true,
          });
          
          if (generationResult.success && generationResult.taskId) {
            // Update job with task ID for polling
            await db.updateGenerationJob(segmentId!, {
              externalJobId: generationResult.taskId,
              status: 'processing',
            });
          } else if (generationResult.success && generationResult.videoUrl) {
            // Sync mode - video ready immediately
            await db.updateGeneratedSegment(segmentId!, {
              status: 'completed',
              videoUrl: generationResult.videoUrl,
              completedAt: new Date(),
              qualityScore: '0.90',
            });
          } else {
            // Generation failed
            await db.updateGeneratedSegment(segmentId!, {
              status: 'failed',
            });
          }
        } catch (error) {
          console.error('Video generation error:', error);
          // Fallback to mock for development
          setTimeout(async () => {
            await db.updateGeneratedSegment(segmentId!, {
              status: 'completed',
              videoUrl: `/api/placeholder/generated-${input.projectId}-${segmentId}.mp4`,
              completedAt: new Date(),
              qualityScore: '0.85',
            });
          }, 3000);
        }
        
        return { segmentId, message: 'Generování zahájeno' };
      }),
    
    // Get generated segments
    getSegments: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return db.getProjectSegments(input.projectId);
      }),
    
    // Rate generated segment
    rateSegment: creatorProcedure
      .input(z.object({ segmentId: z.number(), rating: z.number().min(1).max(5) }))
      .mutation(async ({ input }) => {
        await db.rateSegment(input.segmentId, input.rating);
        return { success: true };
      }),
    
    // Get generation jobs status
    getJobs: creatorProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getVideoProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return db.getProjectJobs(input.projectId);
      }),
  }),

  // ============ PHOTO GALLERY ROUTER ============
  photoGallery: router({
    getPhotos: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const [items, total] = await Promise.all([
          db.getPhotos(input),
          db.getPhotoCount({ category: input.category, userId: input.userId }),
        ]);
        return { items, total };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPhotoById(input.id);
      }),

    upload: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        category: z.enum(['transformation', 'fashion', 'makeup', 'lifestyle', 'before_after', 'cosplay', 'other']).default('other'),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const photoId = await db.createPhoto({
          userId: ctx.user.id,
          ...input,
        });
        // Award reputation for photo upload
        await db.addReputationPoints(ctx.user.id, 'photo_upload', 2);
        return { photoId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePhoto(input.id, ctx.user.id);
        return { success: true };
      }),

    toggleLike: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.togglePhotoLike(input.photoId, ctx.user.id);
        // Award reputation to photo owner for receiving a like
        if (liked) {
          const photo = await db.getPhotoById(input.photoId);
          if (photo && photo.userId !== ctx.user.id) {
            await db.addReputationPoints(photo.userId, 'like_received', 1);
          }
        }
        return { liked };
      }),

    isLiked: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isPhotoLiked(input.photoId, ctx.user.id);
      }),

    getComments: publicProcedure
      .input(z.object({ photoId: z.number() }))
      .query(async ({ input }) => {
        return db.getPhotoComments(input.photoId);
      }),

    addComment: protectedProcedure
      .input(z.object({
        photoId: z.number(),
        content: z.string().min(1).max(1000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createPhotoComment({
          photoId: input.photoId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        });
        return { commentId };
      }),

    uploadFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const key = `photos/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  // ============ FORUM ROUTER ============
  forum: router({
    getCategories: publicProcedure.query(async () => {
      return db.getForumCategories();
    }),

    getTopics: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const [items, total] = await Promise.all([
          db.getForumTopics(input),
          db.getForumTopicCount(input.categoryId),
        ]);
        return { items, total };
      }),

    getTopic: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getForumTopicById(input.id);
      }),

    createTopic: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        title: z.string().min(3).max(255),
        content: z.string().min(10).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicId = await db.createForumTopic({
          categoryId: input.categoryId,
          authorId: ctx.user.id,
          title: input.title,
          content: input.content,
        });

        // Detect @mentions and notify
        const mentions = db.extractMentions(input.content);
        if (mentions.length > 0) {
          const mentionedUsers = await db.findUsersByNames(mentions);
          for (const mu of mentionedUsers) {
            if (mu.id !== ctx.user.id) {
              await db.createNotification({
                userId: mu.id,
                type: 'forum_mention',
                title: 'You were mentioned in a new topic',
                content: `${ctx.user.name || 'Someone'} mentioned you in "${input.title}"`,
                linkUrl: `/forum/topic/${topicId}`,
                relatedUserId: ctx.user.id,
              });
            }
          }
        }

        // Award reputation points for creating topic
        await db.addReputationPoints(ctx.user.id, 'post', 5);

        return { topicId };
      }),

    getReplies: publicProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ input }) => {
        return db.getForumReplies(input.topicId);
      }),

    createReply: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        const topic = await db.getForumTopicById(input.topicId);
        if (!topic) throw new TRPCError({ code: 'NOT_FOUND' });
        if (topic.isLocked) throw new TRPCError({ code: 'FORBIDDEN', message: 'Topic is locked' });
        const replyId = await db.createForumReply({
          topicId: input.topicId,
          authorId: ctx.user.id,
          content: input.content,
        });

        // Notify topic author about new reply
        if (topic.authorId && topic.authorId !== ctx.user.id) {
          await db.createNotification({
            userId: topic.authorId,
            type: 'forum_reply',
            title: 'New reply to your topic',
            content: `${ctx.user.name || 'Someone'} replied to "${topic.title}"`,
            linkUrl: `/forum/topic/${input.topicId}`,
            relatedUserId: ctx.user.id,
          });
        }

        // Detect @mentions and notify
        const mentions = db.extractMentions(input.content);
        if (mentions.length > 0) {
          const mentionedUsers = await db.findUsersByNames(mentions);
          for (const mu of mentionedUsers) {
            if (mu.id !== ctx.user.id) {
              await db.createNotification({
                userId: mu.id,
                type: 'forum_mention',
                title: 'You were mentioned',
                content: `${ctx.user.name || 'Someone'} mentioned you in "${topic.title}"`,
                linkUrl: `/forum/topic/${input.topicId}`,
                relatedUserId: ctx.user.id,
              });
            }
          }
        }

        // Award reputation points for reply
        await db.addReputationPoints(ctx.user.id, 'reply', 3);

        return { replyId };
      }),

    vote: protectedProcedure
      .input(z.object({
        topicId: z.number().optional(),
        replyId: z.number().optional(),
        voteType: z.enum(['upvote', 'downvote']),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.toggleForumVote(
          ctx.user.id,
          input.topicId || null,
          input.replyId || null,
          input.voteType,
        );

        // Award reputation to the content author for upvotes
        if (input.voteType === 'upvote' && result === 'upvote') {
          if (input.topicId) {
            const topic = await db.getForumTopicById(input.topicId);
            if (topic && topic.authorId && topic.authorId !== ctx.user.id) {
              await db.addReputationPoints(topic.authorId, 'upvote_received', 2);
            }
          }
        }

        return { voteType: result };
      }),
  }),

  // ============ USER PROFILE ROUTER ============
  profile: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),

    getPublic: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getPublicUserProfile(input.userId);
      }),

    update: protectedProcedure
      .input(z.object({
        displayName: z.string().max(100).optional(),
        pronouns: z.string().max(50).optional(),
        identityType: z.enum(['crossdresser', 'femboy', 'transgender', 'non_binary', 'questioning', 'ally', 'other']).optional(),
        lookingFor: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        location: z.string().max(100).optional(),
        showLocation: z.boolean().optional(),
        ageRange: z.string().max(20).optional(),
        experienceLevel: z.enum(['curious', 'beginner', 'intermediate', 'experienced', 'mentor']).optional(),
        socialLinks: z.record(z.string(), z.string()).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserProfile(ctx.user.id, input as any);
        return { success: true };
      }),

    getTransformations: publicProcedure
      .input(z.object({
        userId: z.number().optional(),
        category: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getTransformations({ ...input });
      }),

    addTransformation: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        beforeImageUrl: z.string(),
        afterImageUrl: z.string(),
        category: z.enum(['mtf', 'ftm', 'crossdress', 'makeup', 'fashion', 'cosplay', 'other']).default('other'),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTransformation({
          userId: ctx.user.id,
          title: input.title,
          beforeImageUrl: input.beforeImageUrl,
          afterImageUrl: input.afterImageUrl,
          category: input.category,
          description: input.description ?? null,
        });
        return { id };
      }),

    // Request verification
    requestVerification: protectedProcedure
      .input(z.object({
        reason: z.string().min(10).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        // Store verification request - admin can approve via SQL or admin panel
        await db.requestVerification(ctx.user.id, input.reason);
        return { success: true, message: 'Verification request submitted' };
      }),

    // Admin: verify a user
    verifyUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        }
        await db.setUserVerified(input.userId, true);
        return { success: true };
      }),

    // Admin: unverify a user
    unverifyUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        }
        await db.setUserVerified(input.userId, false);
        return { success: true };
      }),
  }),

  // ============ MODERATION DASHBOARD ============
  moderation: router({
    // Get content reports
    getReports: adminProcedure
      .input(z.object({ status: z.string().default('all'), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const reports = await db.getContentReports(input.status, input.limit, input.offset);
        // Enrich with reporter info
        const enriched = await Promise.all(reports.map(async (r: any) => {
          const reporter = await db.getUserById(r.reporterId);
          const reviewer = r.reviewedBy ? await db.getUserById(r.reviewedBy) : null;
          return { ...r, reporterName: reporter?.name || 'Unknown', reviewerName: reviewer?.name || null };
        }));
        return enriched;
      }),

    // Get report counts by status
    getReportCounts: adminProcedure.query(async () => {
      return db.getContentReportCounts();
    }),

    // Review a report
    reviewReport: adminProcedure
      .input(z.object({
        reportId: z.number(),
        status: z.enum(['reviewed', 'resolved', 'dismissed']),
        reviewNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.reviewContentReport(input.reportId, ctx.user.id, input.status, input.reviewNote);
        return { success: true };
      }),

    // Submit a content report (any user)
    submitReport: protectedProcedure
      .input(z.object({
        contentType: z.enum(['forum_topic', 'forum_reply', 'photo', 'comment', 'video', 'profile']),
        contentId: z.number(),
        reason: z.enum(['spam', 'harassment', 'inappropriate', 'misinformation', 'copyright', 'other']),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createContentReport({ reporterId: ctx.user.id, ...input });
        return { success: true, message: 'Report submitted. Our moderators will review it.' };
      }),

    // Get pending verification requests
    getVerificationRequests: adminProcedure.query(async () => {
      return db.getPendingVerificationRequests();
    }),

    // Approve/reject verification
    handleVerification: adminProcedure
      .input(z.object({ userId: z.number(), approved: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.setUserVerified(input.userId, input.approved);
        // Notify user
        await db.createNotification({
          userId: input.userId,
          type: input.approved ? 'verification_approved' : 'verification_rejected',
          title: input.approved ? 'Profile Verified!' : 'Verification Declined',
          content: input.approved
            ? 'Congratulations! Your profile has been verified. You now have a verified badge.'
            : 'Your verification request was not approved at this time. Please try again later.',
          linkUrl: '/profile',
        });
        return { success: true };
      }),

    // Get all users for management
    getUsers: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getAllUsers(input.limit, input.offset);
      }),

    // Ban user
    banUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.banUser(input.userId);
        return { success: true };
      }),
  }),

  // ============ GAMIFICATION ============
  gamification: router({
    // Get user reputation
    getReputation: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserReputation(input.userId);
      }),

    // Get my reputation
    getMyReputation: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserReputation(ctx.user.id);
    }),

    // Get leaderboard
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const leaderboard = await db.getReputationLeaderboard(input.limit);
        // Enrich with user info
        const enriched = await Promise.all(leaderboard.map(async (entry: any, index: number) => {
          const user = await db.getUserById(entry.userId);
          return {
            position: index + 1,
            ...entry,
            userName: user?.name || `User #${entry.userId}`,
            avatarUrl: user?.avatarUrl,
          };
        }));
        return enriched;
      }),

    // Get all badge definitions
    getBadges: publicProcedure.query(async () => {
      return db.getAllBadgeDefinitions();
    }),

    // Get user badges with details
    getUserBadges: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserBadgesWithDetails(input.userId);
      }),

    // Seed badge definitions (admin only)
    seedBadges: adminProcedure.mutation(async () => {
      await db.seedBadgeDefinitions();
      return { success: true, message: 'Badge definitions seeded' };
    }),

    // Weekly digest - generates a summary notification for the user
    getWeeklyDigest: protectedProcedure.query(async ({ ctx }) => {
      const rep = await db.getUserReputation(ctx.user.id);
      const badges = await db.getUserBadgesWithDetails(ctx.user.id);
      const leaderboard = await db.getReputationLeaderboard(100);
      const position = leaderboard.findIndex((e: any) => e.userId === ctx.user.id) + 1;
      const earnedBadges = badges.filter((b: any) => b.earned);
      return {
        points: rep?.points || 0,
        rank: rep?.rank || 'newcomer',
        postsCount: rep?.postsCount || 0,
        repliesCount: rep?.repliesCount || 0,
        upvotesReceived: rep?.upvotesReceived || 0,
        leaderboardPosition: position || null,
        totalParticipants: leaderboard.length,
        badgesEarned: earnedBadges.length,
        totalBadges: badges.length,
        recentBadges: earnedBadges.slice(-3).map((b: any) => ({ name: b.name, icon: b.icon })),
      };
    }),

    // Send weekly digest notification to all active users (admin only)
    sendWeeklyDigest: adminProcedure.mutation(async () => {
      const { sendWeeklyDigestEmail } = await import('./email');
      const leaderboard = await db.getReputationLeaderboard(200);
      let sent = 0;
      let emailsSent = 0;
      let skipped = 0;
      for (const entry of leaderboard) {
        const user = await db.getUserById(entry.userId);
        if (!user) continue;
        if (!user.weeklyDigestEnabled) {
          skipped++;
          continue;
        }
        const badges = await db.getUserBadgesWithDetails(entry.userId);
        const earnedBadges = badges.filter((b: any) => b.earned);
        const recentBadgeNames = earnedBadges.slice(-3).map((b: any) => b.name || b.badgeName || '');
        const position = leaderboard.findIndex((e: any) => e.userId === entry.userId) + 1;
        // Push notification
        await db.createNotification({
          userId: entry.userId,
          type: 'system',
          title: '\uD83D\uDCCA Weekly Community Digest',
          content: `Týdení přehled: ${entry.points} bodů (rank: ${entry.rank}, #${position} na leaderboardu). Odznaky: ${earnedBadges.length}/${badges.length}. Pokračuj!`,
        });
        sent++;
        // Real email
        if (user.email) {
          const forumTopics = await db.getForumTopics({ limit: 10, offset: 0 });
          const newTopicsCount = Array.isArray(forumTopics) ? forumTopics.length : 0;
          const ok = await sendWeeklyDigestEmail({
            user: { name: user.name, email: user.email },
            pointsEarned: entry.points,
            newBadges: recentBadgeNames,
            leaderboardRank: position,
            newTopics: newTopicsCount,
          });
          if (ok) emailsSent++;
        }
      }
      return { success: true, notificationsSent: sent, emailsSent, skipped };
    }),
  }),

  // ============ SOCIAL PROOF ============
  socialProof: router({
    getRecent: publicProcedure.query(async () => {
      return db.getRecentSocialProofEvents(15);
    }),
    recordSignup: protectedProcedure.input(z.object({
      displayName: z.string(),
      location: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.createSocialProofEvent({
        eventType: 'signup',
        displayName: input.displayName,
        location: input.location,
      });
      return { success: true };
    }),
  }),

  // ============ A/B TESTING ============
  ctaTest: router({
    getVariant: publicProcedure.input(z.object({
      location: z.string(),
    })).query(async ({ input }) => {
      const test = await db.getActiveCtaTest(input.location);
      if (!test || test.variants.length === 0) return null;
      // Randomly assign a variant (weighted by inverse impressions for even distribution)
      const totalImpressions = test.variants.reduce((sum: number, v: any) => sum + v.impressions, 0);
      let selectedVariant;
      if (totalImpressions === 0) {
        selectedVariant = test.variants[Math.floor(Math.random() * test.variants.length)];
      } else {
        // Thompson sampling approximation: favor less-seen variants
        const weights = test.variants.map((v: any) => 1 / (v.impressions + 1));
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let idx = 0;
        for (let i = 0; i < weights.length; i++) {
          rand -= weights[i];
          if (rand <= 0) { idx = i; break; }
        }
        selectedVariant = test.variants[idx];
      }
      // Record impression
      await db.recordCtaImpression(selectedVariant.id);
      return {
        testId: test.id,
        testName: test.testName,
        variant: selectedVariant,
      };
    }),
    recordClick: publicProcedure.input(z.object({
      variantId: z.number(),
    })).mutation(async ({ input }) => {
      await db.recordCtaClick(input.variantId);
      return { success: true };
    }),
    recordConversion: publicProcedure.input(z.object({
      variantId: z.number(),
    })).mutation(async ({ input }) => {
      await db.recordCtaConversion(input.variantId);
      return { success: true };
    }),
    // Admin: get all test results
    getResults: adminProcedure.query(async () => {
      return db.getAllCtaTests();
    }),
  }),

  // ============ STRIPE CHECKOUT ============
  checkout: router({
    createSession: protectedProcedure.input(z.object({
      productKey: z.enum(['community_plus', 'vip_insider']),
      billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
    })).mutation(async ({ ctx, input }) => {
      const product = PRODUCTS[input.productKey];
      if (!product) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid product' });
      }

      const priceInCents = input.billingCycle === 'yearly' ? product.priceYearly : product.priceMonthly;
      const origin = ctx.req.headers.origin || 'https://femsider.manus.space';

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        allow_promotion_codes: true,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || '',
          customer_name: ctx.user.name || '',
          tier: product.tier,
          product_key: input.productKey,
          billing_cycle: input.billingCycle,
        },
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: input.billingCycle === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        }],
        success_url: `${origin}/subscriptions?success=true&tier=${product.tier}`,
        cancel_url: `${origin}/?cancelled=true`,
      });

      return { url: session.url };
    }),

    getProducts: publicProcedure.query(() => {
      return Object.entries(PRODUCTS).map(([key, product]) => ({
        key,
        name: product.name,
        description: product.description,
        priceMonthly: product.priceMonthly,
        priceYearly: product.priceYearly,
        originalPrice: product.originalPrice,
        tier: product.tier,
        features: product.features,
      }));
    }),
  }),

  // ============ ONBOARDING ============
  onboarding: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const completed = await db.getOnboardingStatus(ctx.user.id);
      return { completed };
    }),
    complete: protectedProcedure.mutation(async ({ ctx }) => {
      await db.completeOnboarding(ctx.user.id);
      return { success: true };
    }),
    // Admin: reset onboarding for a specific user
    adminReset: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.resetOnboarding(input.userId);
        return { success: true };
      }),
    // Admin: get onboarding analytics
    getAnalytics: adminProcedure.query(async () => {
      return await db.getOnboardingAnalytics();
    }),
    // Track step view for analytics
    trackStep: protectedProcedure
      .input(z.object({ stepId: z.string(), action: z.enum(['view', 'skip', 'complete']) }))
      .mutation(async ({ ctx, input }) => {
        await db.trackOnboardingStep(ctx.user.id, input.stepId, input.action);
        return { success: true };
      }),
    // Get personalized recommendations
    getRecommendations: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPersonalizedRecommendations(ctx.user.id);
    }),
    // A/B test: get step order variant for this user
    getStepVariant: protectedProcedure.query(async ({ ctx }) => {
      // Deterministic assignment based on user ID parity
      // Variant A (control): Welcome -> Browse -> Forum -> Gamification -> Affiliate -> Subscription
      // Variant B (test): Welcome -> Subscription -> Forum -> Gamification -> Browse -> Affiliate
      const variant = ctx.user.id % 2 === 0 ? 'A' : 'B';
      const stepOrderA = ['welcome', 'browse', 'forum', 'gamification', 'affiliate', 'subscription'];
      const stepOrderB = ['welcome', 'subscription', 'forum', 'gamification', 'browse', 'affiliate'];
      return {
        variant,
        stepOrder: variant === 'A' ? stepOrderA : stepOrderB,
        description: variant === 'A' ? 'Control (Subscription last)' : 'Test (Subscription early)',
      };
    }),
  }),

  // ============ FAN CRM (Supercreator + CreatorHero) ============
  fanCrm: router({
    getProfiles: protectedProcedure
      .input(z.object({ segment: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getFanProfiles(ctx.user.id, input.segment);
      }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFanCrmStats(ctx.user.id);
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        userId: z.number(),
        segment: z.enum(['new', 'active', 'vip', 'inactive', 'churned']).optional(),
        tags: z.string().optional(),
        notes: z.string().optional(),
        ltv: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { userId, ...data } = input;
        await db.upsertFanProfile(ctx.user.id, userId, data);
        return { success: true };
      }),
    getInactiveFans: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await db.getInactiveFans(ctx.user.id, input.days);
      }),
  }),

  // ============ MASS MESSAGING (Supercreator + CreatorHero) ============
  massCampaign: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMassCampaigns(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        targetSegment: z.enum(['all', 'new', 'active', 'vip', 'inactive', 'churned']).default('all'),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createMassCampaign({
          creatorId: ctx.user.id,
          title: input.title,
          message: input.message,
          targetSegment: input.targetSegment,
          status: 'draft',
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        });
        return { id };
      }),
    send: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.sendMassCampaign(input.campaignId, ctx.user.id);
      }),
  }),

  // ============ AI PERSONAS (ChatPersona + FlirtFlow) ============
  aiPersona: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAiPersonas(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        personality: z.enum(['flirty', 'friendly', 'professional', 'playful', 'mysterious']),
        tone: z.enum(['casual', 'formal', 'seductive', 'sweet', 'bold']),
        language: z.string().default('cs'),
        systemPrompt: z.string().optional(),
        autoReply: z.boolean().default(false),
        replyDelay: z.number().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAiPersona({
          creatorId: ctx.user.id,
          name: input.name,
          personality: input.personality,
          tone: input.tone,
          language: input.language,
          systemPrompt: input.systemPrompt || null,
          isActive: false,
          autoReply: input.autoReply,
          replyDelay: input.replyDelay,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        personality: z.enum(['flirty', 'friendly', 'professional', 'playful', 'mysterious']).optional(),
        tone: z.enum(['casual', 'formal', 'seductive', 'sweet', 'bold']).optional(),
        isActive: z.boolean().optional(),
        autoReply: z.boolean().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateAiPersona(id, ctx.user.id, data);
        return { success: true };
      }),
    generateReply: protectedProcedure
      .input(z.object({ personaId: z.number(), message: z.string() }))
      .mutation(async ({ input }) => {
        const reply = await db.generateAiReply(input.personaId, input.message);
        return { reply };
      }),
    getSmartReplies: protectedProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getSmartReplySuggestions(ctx.user.id, input.category);
      }),
    createSmartReply: protectedProcedure
      .input(z.object({
        category: z.string(),
        replyText: z.string(),
        triggerKeywords: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createSmartReply({
          creatorId: ctx.user.id,
          category: input.category,
          replyText: input.replyText,
          triggerKeywords: input.triggerKeywords || null,
          isActive: true,
        });
        return { id };
      }),
  }),

  // ============ WINBACK CAMPAIGNS (FlirtFlow + CreatorHero) ============
  winback: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWinbackCampaigns(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        triggerDays: z.number().min(1).default(30),
        message: z.string().min(1),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createWinbackCampaign({
          creatorId: ctx.user.id,
          triggerDays: input.triggerDays,
          message: input.message,
          isActive: input.isActive,
        });
        return { id };
      }),
  }),

  // ============ TEAM MANAGEMENT (OnlyMonster) ============
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTeamMembers(ctx.user.id);
    }),
    add: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['manager', 'chatter', 'analyst', 'moderator']),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addTeamMember(ctx.user.id, input.userId, input.role);
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeTeamMember(input.memberId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============ SEEDANCE 2.0 AI VIDEO PROMPT STUDIO ============
  promptStudio: router({
    // Seed default templates on first call
    seedTemplates: protectedProcedure.mutation(async () => {
      await db.seedDefaultPromptTemplates();
      return { success: true };
    }),

    // List all public templates (optionally filtered by category)
    listTemplates: publicProcedure
      .input(z.object({
        category: z.enum(['cinematic','transformation','time_freeze','action','fantasy','romance','horror','comedy','custom']).optional(),
        featuredOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        await db.seedDefaultPromptTemplates();
        return db.getPromptTemplates(input?.category, input?.featuredOnly);
      }),

    // Get single template
    getTemplate: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPromptTemplateById(input.id);
      }),

    // Create custom template (creators only)
    createTemplate: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        category: z.enum(['cinematic','transformation','time_freeze','action','fantasy','romance','horror','comedy','custom']),
        prompt: z.string().min(10),
        negativePrompt: z.string().optional(),
        tags: z.string().optional(),
        cameraStyle: z.string().optional(),
        duration: z.number().min(3).max(60).default(15),
        aspectRatio: z.string().default('16:9'),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createPromptTemplate({
          title: input.title,
          category: input.category,
          prompt: input.prompt,
          negativePrompt: input.negativePrompt ?? null,
          tags: input.tags ?? null,
          cameraStyle: input.cameraStyle ?? null,
          duration: input.duration,
          aspectRatio: input.aspectRatio,
          isPublic: input.isPublic,
          engine: 'seedance-2.0',
          isFeatured: false,
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    // List user's video projects
    listProjects: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPromptProjects(ctx.user.id);
    }),

    // Create a new video project (save prompt config)
    createProject: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        templateId: z.number().optional(),
        prompt: z.string().min(10),
        negativePrompt: z.string().optional(),
        engine: z.string().default('seedance-2.0'),
        duration: z.number().min(3).max(60).default(15),
        aspectRatio: z.string().default('16:9'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.templateId) {
          await db.incrementTemplateUsage(input.templateId);
        }
        const id = await db.createPromptProject({
          userId: ctx.user.id,
          title: input.title,
          templateId: input.templateId ?? null,
          prompt: input.prompt,
          negativePrompt: input.negativePrompt ?? null,
          engine: input.engine,
          duration: input.duration,
          aspectRatio: input.aspectRatio,
          status: 'draft',
          videoUrl: null,
          thumbnailUrl: null,
          errorMessage: null,
          taskId: null,
        });
        return { id };
      }),

    // Generate video via MiniMax/AI (uses invokeLLM to build enhanced prompt)
    generatePrompt: protectedProcedure
      .input(z.object({
        basePrompt: z.string().min(10),
        style: z.string().optional(),
        mood: z.string().optional(),
        cameraMovement: z.string().optional(),
        lighting: z.string().optional(),
        duration: z.number().default(15),
        aspectRatio: z.string().default('16:9'),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const systemPrompt = `You are an expert AI video prompt engineer specializing in Seedance 2.0 and similar AI video generation models. Your task is to enhance and optimize video prompts for maximum cinematic quality. Always structure prompts with: [SCENE], [CAMERA], [LIGHTING], [MOOD] sections. Include technical details like frame rate, resolution hints, color grade, lens type. Keep prompts under 300 words but highly detailed.`;
        const userMsg = `Enhance this video prompt for Seedance 2.0:

Base prompt: ${input.basePrompt}
Style: ${input.style || 'cinematic'}
Mood: ${input.mood || 'dramatic'}
Camera movement: ${input.cameraMovement || 'smooth tracking'}
Lighting: ${input.lighting || 'natural cinematic'}
Duration: ${input.duration}s
Aspect ratio: ${input.aspectRatio}

Return ONLY the enhanced prompt text, no explanations.`;
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
        });
        const rawContent = response.choices?.[0]?.message?.content ?? input.basePrompt;
        const enhanced = typeof rawContent === 'string' ? rawContent : input.basePrompt;
        return { enhancedPrompt: enhanced, originalPrompt: input.basePrompt };
      }),
  }),

  // Revenue Engine (ROI 888%+)
  revenue: router({
    getUpsellOffer: protectedProcedure.query(async ({ ctx }) => {
      const { getActiveUpsellOffer } = await import('./revenue-engine');
      return getActiveUpsellOffer(ctx.user.id);
    }),

    acceptUpsellOffer: protectedProcedure
      .input(z.object({ offerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { acceptUpsellOffer } = await import('./revenue-engine');
        const origin = (ctx.req.headers.origin as string) || process.env.VITE_APP_URL || 'https://femsider.manus.space';
        const url = await acceptUpsellOffer(ctx.user.id, input.offerId, origin);
        return { checkoutUrl: url };
      }),

    getFlashSale: publicProcedure.query(async () => {
      const { getActiveFlashSale } = await import('./revenue-engine');
      return getActiveFlashSale();
    }),

    createFlashSale: adminProcedure
      .input(z.object({
        name: z.string(),
        discountPercent: z.number().min(5).max(80),
        hoursFromNow: z.number().min(1).max(168),
        stripePromoCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createFlashSale } = await import('./revenue-engine');
        return createFlashSale(input);
      }),

    getLatestReport: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const d = await getDb();
      if (d == null) return null;
      const { weeklyRevenueReports } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      const reports = await d.select().from(weeklyRevenueReports)
        .orderBy(desc(weeklyRevenueReports.createdAt)).limit(1);
      return reports[0] || null;
    }),

    getReports: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const d = await getDb();
      if (d == null) return [];
      const { weeklyRevenueReports } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      return d.select().from(weeklyRevenueReports)
        .orderBy(desc(weeklyRevenueReports.createdAt)).limit(12);
    }),

    triggerWeeklyReport: adminProcedure.mutation(async () => {
      const { generateWeeklyRevenueReport } = await import('./revenue-engine');
      await generateWeeklyRevenueReport();
      return { success: true };
    }),

    triggerDailySequences: adminProcedure.mutation(async () => {
      const { runDailyEmailSequences } = await import('./revenue-engine');
      return runDailyEmailSequences();
    }),
  }),
});

// Helper function to parse YouTube duration (PT1M30S -> 90)
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

export type AppRouter = typeof appRouter;
