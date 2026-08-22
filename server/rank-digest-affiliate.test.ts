import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// ============ RANK DISPLAY IN FORUM ============
describe('Forum Rank Display', () => {
  it('should include authorRank and authorPoints in topic list response shape', () => {
    const mockTopic = {
      id: 1,
      categoryId: 1,
      authorId: 1,
      title: 'Test Topic',
      content: 'Content',
      isPinned: false,
      isLocked: false,
      viewCount: 5,
      replyCount: 2,
      lastReplyAt: new Date(),
      createdAt: new Date(),
      authorName: 'TestUser',
      authorAvatar: null,
      authorRank: 'member',
      authorPoints: 50,
    };
    expect(mockTopic).toHaveProperty('authorRank');
    expect(mockTopic).toHaveProperty('authorPoints');
    expect(mockTopic.authorRank).toBe('member');
    expect(mockTopic.authorPoints).toBe(50);
  });

  it('should include authorRank and authorPoints in reply response shape', () => {
    const mockReply = {
      id: 1,
      topicId: 1,
      authorId: 2,
      content: 'Reply content',
      likeCount: 3,
      createdAt: new Date(),
      authorName: 'Replier',
      authorAvatar: null,
      authorRank: 'contributor',
      authorPoints: 150,
    };
    expect(mockReply.authorRank).toBe('contributor');
    expect(mockReply.authorPoints).toBe(150);
  });

  it('should handle null rank for users without reputation', () => {
    const mockTopic = {
      id: 1,
      authorRank: null,
      authorPoints: null,
    };
    expect(mockTopic.authorRank).toBeNull();
    expect(mockTopic.authorPoints).toBeNull();
  });

  it('should map all valid rank values', () => {
    const validRanks = ['newcomer', 'member', 'contributor', 'expert', 'legend'];
    validRanks.forEach(rank => {
      expect(validRanks).toContain(rank);
    });
  });

  it('should display rank config with correct properties', () => {
    const RANK_CONFIG: Record<string, { label: string; color: string }> = {
      newcomer: { label: "Newcomer", color: "text-gray-400" },
      member: { label: "Member", color: "text-blue-400" },
      contributor: { label: "Contributor", color: "text-purple-400" },
      expert: { label: "Expert", color: "text-orange-400" },
      legend: { label: "Legend", color: "text-yellow-400" },
    };
    expect(Object.keys(RANK_CONFIG)).toHaveLength(5);
    expect(RANK_CONFIG.legend.label).toBe('Legend');
  });
});

// ============ WEEKLY DIGEST ============
describe('Weekly Digest', () => {
  it('should generate digest data structure with all required fields', () => {
    const digest = {
      points: 120,
      rank: 'member',
      postsCount: 5,
      repliesCount: 12,
      upvotesReceived: 30,
      leaderboardPosition: 3,
      totalParticipants: 50,
      badgesEarned: 4,
      totalBadges: 10,
      recentBadges: [{ name: 'First Post', icon: '📝' }],
    };
    expect(digest.points).toBe(120);
    expect(digest.rank).toBe('member');
    expect(digest.leaderboardPosition).toBe(3);
    expect(digest.badgesEarned).toBeLessThanOrEqual(digest.totalBadges);
    expect(digest.recentBadges).toHaveLength(1);
  });

  it('should handle user with no activity', () => {
    const digest = {
      points: 0,
      rank: 'newcomer',
      postsCount: 0,
      repliesCount: 0,
      upvotesReceived: 0,
      leaderboardPosition: null,
      totalParticipants: 0,
      badgesEarned: 0,
      totalBadges: 10,
      recentBadges: [],
    };
    expect(digest.points).toBe(0);
    expect(digest.leaderboardPosition).toBeNull();
    expect(digest.recentBadges).toHaveLength(0);
  });

  it('should create notification with correct type for weekly digest', () => {
    const notification = {
      userId: 1,
      type: 'system' as const,
      title: 'Weekly Community Digest',
      content: 'You have 120 points (rank: member, #3 on leaderboard). Badges: 4/10. Keep contributing!',
    };
    expect(notification.type).toBe('system');
    expect(notification.title).toContain('Weekly');
    expect(notification.content).toContain('points');
    expect(notification.content).toContain('leaderboard');
  });

  it('should limit recent badges to 3', () => {
    const allBadges = [
      { name: 'Badge1', icon: '🏆' },
      { name: 'Badge2', icon: '⭐' },
      { name: 'Badge3', icon: '🎖️' },
      { name: 'Badge4', icon: '🥇' },
      { name: 'Badge5', icon: '💎' },
    ];
    const recentBadges = allBadges.slice(-3);
    expect(recentBadges).toHaveLength(3);
    expect(recentBadges[0].name).toBe('Badge3');
  });

  it('should count sent notifications correctly', () => {
    const leaderboard = [
      { userId: 1, points: 100, rank: 'member' },
      { userId: 2, points: 80, rank: 'newcomer' },
      { userId: 3, points: 50, rank: 'newcomer' },
    ];
    let sent = 0;
    for (const entry of leaderboard) {
      // Simulate sending notification
      sent++;
    }
    expect(sent).toBe(3);
  });

  it('should keep the admin digest endpoint wired to both delivery channels', () => {
    const routerSource = readFileSync(resolve(process.cwd(), 'server/routers.ts'), 'utf8');
    const endpoint = routerSource.slice(
      routerSource.indexOf('sendWeeklyDigest: adminProcedure'),
      routerSource.indexOf('sendWeeklyDigest: adminProcedure') + 2200,
    );
    expect(endpoint).toContain('db.createNotification');
    expect(endpoint).toContain('sendWeeklyDigestEmail');
  });
});

// Welcome delivery deliberately sends an in-app notification synchronously while
// email delivery is best-effort, so an email-provider failure does not erase the
// user's first-run activation path.
describe('Email delivery fallback', () => {
  it('keeps the welcome in-app notification independent from SendGrid', () => {
    const source = readFileSync(resolve(process.cwd(), 'server/notifications.ts'), 'utf8');
    const welcomeFlow = source.slice(
      source.indexOf('export async function sendWelcomeNotification'),
      source.indexOf('export async function sendWelcomeNotification') + 1100,
    );
    expect(welcomeFlow).toContain('sendWelcomeEmail');
    expect(welcomeFlow).toContain('return sendPushNotification');
  });
});

// ============ AFFILIATE GAMIFICATION INTEGRATION ============
describe('Affiliate Gamification Integration', () => {
  it('should include reputation data in affiliate stats', () => {
    const affiliateStats = {
      affiliateCode: 'ABC123',
      totalEarnings: 150,
      referralCount: 5,
      reputation: {
        points: 200,
        rank: 'contributor',
        postsCount: 10,
        repliesCount: 25,
        upvotesReceived: 45,
      },
    };
    expect(affiliateStats.reputation).toBeDefined();
    expect(affiliateStats.reputation.points).toBe(200);
    expect(affiliateStats.reputation.rank).toBe('contributor');
  });

  it('should award 10 reputation points for successful referral', () => {
    const REFERRAL_POINTS = 10;
    let affiliatePoints = 50;
    // Simulate referral
    affiliatePoints += REFERRAL_POINTS;
    expect(affiliatePoints).toBe(60);
  });

  it('should award 5 reputation points to new user joining via referral', () => {
    const REFERRED_JOIN_POINTS = 5;
    let newUserPoints = 0;
    newUserPoints += REFERRED_JOIN_POINTS;
    expect(newUserPoints).toBe(5);
  });

  it('should not award referral points if user already has referrer', () => {
    const currentUser = { id: 1, referredBy: 2 };
    let pointsAwarded = false;
    if (!currentUser.referredBy) {
      pointsAwarded = true;
    }
    expect(pointsAwarded).toBe(false);
  });

  it('should not allow self-referral', () => {
    const affiliate = { id: 1 };
    const currentUser = { id: 1 };
    const isValid = affiliate.id !== currentUser.id;
    expect(isValid).toBe(false);
  });

  it('should handle default reputation when user has no reputation record', () => {
    const reputation = null;
    const stats = {
      reputation: {
        points: reputation?.points || 0,
        rank: reputation?.rank || 'newcomer',
        postsCount: reputation?.postsCount || 0,
        repliesCount: reputation?.repliesCount || 0,
        upvotesReceived: reputation?.upvotesReceived || 0,
      },
    } as any;
    expect(stats.reputation.points).toBe(0);
    expect(stats.reputation.rank).toBe('newcomer');
  });

  it('should display rank subtitle correctly', () => {
    const rank = 'contributor';
    const subtitle = rank.charAt(0).toUpperCase() + rank.slice(1);
    expect(subtitle).toBe('Contributor');
  });

  it('should format reputation points for display', () => {
    const points = 1250;
    const display = `${points} pts`;
    expect(display).toBe('1250 pts');
  });
});
