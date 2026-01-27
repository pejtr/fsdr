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
    
    // Add comment
    addComment: protectedProcedure
      .input(z.object({
        postId: z.number().optional(),
        videoId: z.number().optional(),
        parentId: z.number().optional(),
        content: z.string().min(1),
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
});

export type AppRouter = typeof appRouter;
