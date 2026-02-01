import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { TrpcContext } from './_core/context';

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

describe('Video Reactions API', () => {
  let testUserId: number;
  let testVideoId: number;
  let testReactionId: number;

  beforeAll(async () => {
    // Create test user
    testUserId = await db.createUser({
      openId: 'test-user-reactions',
      name: 'Test User Reactions',
      email: 'reactions@example.com',
      role: 'user',
    });

    // Create test video
    testVideoId = await db.createVideo({
      creatorId: testUserId,
      title: 'Test Video for Reactions',
      description: 'Test video',
      videoUrl: 'https://example.com/test.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 300,
      visibility: 'public',
      status: 'published',
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testReactionId) {
      await db.deleteVideoReaction(testReactionId, testUserId);
    }
    if (testVideoId) {
      await db.deleteVideo(testVideoId);
    }
    if (testUserId) {
      await db.deleteUser(testUserId);
    }
  });

  it('should add reaction at timestamp', async () => {
    const caller = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    const result = await caller.videoReactions.addReaction({
      videoId: testVideoId,
      reactionType: 'love',
      timestamp: 120,
    });

    expect(result.reactionId).toBeDefined();
    testReactionId = result.reactionId;
  });

  it('should get all reactions for video', async () => {
    const caller = createCaller({ user: null });

    const reactions = await caller.videoReactions.getReactions({
      videoId: testVideoId,
    });

    expect(reactions).toBeDefined();
    expect(Array.isArray(reactions)).toBe(true);
    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions[0].reactionType).toBe('love');
    expect(reactions[0].timestamp).toBe(120);
  });

  it('should get reactions by timestamp range', async () => {
    const caller = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    // Add reactions at different timestamps
    await caller.videoReactions.addReaction({
      videoId: testVideoId,
      reactionType: 'fire',
      timestamp: 60,
    });

    await caller.videoReactions.addReaction({
      videoId: testVideoId,
      reactionType: 'clap',
      timestamp: 180,
    });

    // Query range 1:00 - 2:30
    const caller2 = createCaller({ user: null });
    const reactions = await caller2.videoReactions.getReactionsByTimestamp({
      videoId: testVideoId,
      startTime: 60,
      endTime: 150,
    });

    expect(reactions).toBeDefined();
    expect(reactions.length).toBeGreaterThanOrEqual(2);

    // All reactions should be within range
    reactions.forEach((reaction: any) => {
      expect(reaction.timestamp).toBeGreaterThanOrEqual(60);
      expect(reaction.timestamp).toBeLessThanOrEqual(150);
    });
  });

  it('should get reaction heatmap', async () => {
    const caller = createCaller({ user: null });

    const heatmap = await caller.videoReactions.getReactionHeatmap({
      videoId: testVideoId,
    });

    expect(heatmap).toBeDefined();
    expect(Array.isArray(heatmap)).toBe(true);
    
    if (heatmap.length > 0) {
      expect(heatmap[0]).toHaveProperty('timestamp');
      expect(heatmap[0]).toHaveProperty('reactionType');
      expect(heatmap[0]).toHaveProperty('count');
    }
  });

  it('should validate reaction types', async () => {
    const caller = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    // Valid reaction types
    const validTypes = ['love', 'laugh', 'wow', 'sad', 'fire', 'clap', 'thinking', 'heart_eyes'];
    
    for (const type of validTypes) {
      const result = await caller.videoReactions.addReaction({
        videoId: testVideoId,
        reactionType: type as any,
        timestamp: 100,
      });
      expect(result.reactionId).toBeDefined();
    }

    // Invalid reaction type should fail
    await expect(
      caller.videoReactions.addReaction({
        videoId: testVideoId,
        reactionType: 'invalid_type' as any,
        timestamp: 100,
      })
    ).rejects.toThrow();
  });

  it('should remove reaction', async () => {
    const caller = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    // Add reaction
    const result = await caller.videoReactions.addReaction({
      videoId: testVideoId,
      reactionType: 'wow',
      timestamp: 200,
    });

    // Remove reaction
    const removeResult = await caller.videoReactions.removeReaction({
      reactionId: result.reactionId,
    });

    expect(removeResult.success).toBe(true);
  });

  it('should sort reactions by timestamp', async () => {
    const caller = createCaller({ user: null });

    const reactions = await caller.videoReactions.getReactions({
      videoId: testVideoId,
    });

    // Verify reactions are sorted by timestamp
    for (let i = 1; i < reactions.length; i++) {
      expect(reactions[i].timestamp).toBeGreaterThanOrEqual(reactions[i - 1].timestamp);
    }
  });
});
