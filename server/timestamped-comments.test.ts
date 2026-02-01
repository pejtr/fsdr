import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { TrpcContext } from './_core/context';

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

describe('Timestamped Comments API', () => {
  let testUserId: number;
  let testVideoId: number;
  let testCommentId: number;

  beforeAll(async () => {
    // Create test user
    testUserId = await db.createUser({
      openId: 'test-user-timestamped-comments',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });

    // Create test video
    testVideoId = await db.createVideo({
      creatorId: testUserId,
      title: 'Test Video for Timestamped Comments',
      description: 'Test video',
      videoUrl: 'https://example.com/test.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 300, // 5 minutes
      visibility: 'public',
      status: 'published',
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testCommentId) {
      await db.deleteComment(testCommentId);
    }
    if (testVideoId) {
      await db.deleteVideo(testVideoId);
    }
    if (testUserId) {
      await db.deleteUser(testUserId);
    }
  });

  it('should create timestamped comment', async () => {
    const caller = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    const result = await caller.feed.createComment({
      videoId: testVideoId,
      content: 'Great moment at this timestamp!',
      timestamp: 120, // 2:00
    });

    expect(result.commentId).toBeDefined();
    testCommentId = result.commentId;
  });

  it('should get timestamped comments for video', async () => {
    const caller = createCaller({ user: null });

    const comments = await caller.feed.getTimestampedComments({
      videoId: testVideoId,
    });

    expect(comments).toBeDefined();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0].timestamp).toBe(120);
    expect(comments[0].content).toBe('Great moment at this timestamp!');
  });

  it('should get comments by timestamp range', async () => {
    const caller = createCaller({ user: null });

    // Create additional comments at different timestamps
    const caller2 = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    await caller2.feed.createComment({
      videoId: testVideoId,
      content: 'Comment at 1 minute',
      timestamp: 60,
    });

    await caller2.feed.createComment({
      videoId: testVideoId,
      content: 'Comment at 3 minutes',
      timestamp: 180,
    });

    // Query range 1:00 - 2:30 (60-150 seconds)
    const comments = await caller.feed.getCommentsByTimestamp({
      videoId: testVideoId,
      startTime: 60,
      endTime: 150,
    });

    expect(comments).toBeDefined();
    expect(comments.length).toBeGreaterThanOrEqual(2);
    
    // All comments should be within range
    comments.forEach((comment: any) => {
      expect(comment.timestamp).toBeGreaterThanOrEqual(60);
      expect(comment.timestamp).toBeLessThanOrEqual(150);
    });
  });

  it('should sort timestamped comments by timestamp', async () => {
    const caller = createCaller({ user: null });

    const comments = await caller.feed.getTimestampedComments({
      videoId: testVideoId,
    });

    // Verify comments are sorted by timestamp
    for (let i = 1; i < comments.length; i++) {
      expect(comments[i].timestamp).toBeGreaterThanOrEqual(comments[i - 1].timestamp);
    }
  });

  it('should reject comment without videoId or postId', async () => {
    const caller = createCaller({
      user: { id: testUserId, openId: 'test-user', name: 'Test User', role: 'user' },
    });

    await expect(
      caller.feed.createComment({
        content: 'Invalid comment',
        timestamp: 100,
      } as any)
    ).rejects.toThrow();
  });
});
