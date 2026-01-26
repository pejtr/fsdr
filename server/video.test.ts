import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getVideoById: vi.fn(),
  getPublishedVideos: vi.fn(),
  createVideo: vi.fn(),
  incrementVideoViews: vi.fn(),
  hasUserLikedVideo: vi.fn(),
  getActiveSubscription: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    avatarUrl: null,
    bio: null,
    subscriptionPrice: "9.99",
    isAgeVerified: true,
    affiliateCode: "TEST123",
    referredBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: user ? { ...defaultUser, ...user } : null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("video.list", () => {
  it("returns empty array when no videos exist", async () => {
    const { getPublishedVideos } = await import("./db");
    vi.mocked(getPublishedVideos).mockResolvedValue([]);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.video.list({ limit: 20, offset: 0 });

    expect(result).toEqual([]);
    expect(getPublishedVideos).toHaveBeenCalledWith(20, 0);
  });

  it("returns videos when they exist", async () => {
    const mockVideos = [
      {
        id: 1,
        creatorId: 1,
        title: "Test Video",
        description: "Test description",
        thumbnailUrl: "https://example.com/thumb.jpg",
        videoUrl: "https://example.com/video.mp4",
        duration: 120,
        isPremium: true,
        isPublished: true,
        viewCount: 100,
        likeCount: 10,
        status: "approved" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { getPublishedVideos } = await import("./db");
    vi.mocked(getPublishedVideos).mockResolvedValue(mockVideos);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.video.list({ limit: 20, offset: 0 });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Video");
  });
});

describe("video.get", () => {
  it("throws NOT_FOUND when video does not exist", async () => {
    const { getVideoById } = await import("./db");
    vi.mocked(getVideoById).mockResolvedValue(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.video.get({ videoId: 999 })).rejects.toThrow("NOT_FOUND");
  });

  it("returns video with canView=true for free content", async () => {
    const mockVideo = {
      id: 1,
      creatorId: 2,
      title: "Free Video",
      description: "Free content",
      thumbnailUrl: null,
      videoUrl: "https://example.com/video.mp4",
      duration: 60,
      isPremium: false,
      isPublished: true,
      viewCount: 50,
      likeCount: 5,
      status: "approved" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { getVideoById, incrementVideoViews, hasUserLikedVideo } = await import("./db");
    vi.mocked(getVideoById).mockResolvedValue(mockVideo);
    vi.mocked(incrementVideoViews).mockResolvedValue(undefined);
    vi.mocked(hasUserLikedVideo).mockResolvedValue(false);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.video.get({ videoId: 1 });

    expect(result.canView).toBe(true);
    expect(result.title).toBe("Free Video");
    expect(incrementVideoViews).toHaveBeenCalledWith(1);
  });

  it("returns video with canView=false for premium content without subscription", async () => {
    const mockVideo = {
      id: 1,
      creatorId: 2,
      title: "Premium Video",
      description: "Premium content",
      thumbnailUrl: null,
      videoUrl: "https://example.com/video.mp4",
      duration: 60,
      isPremium: true,
      isPublished: true,
      viewCount: 50,
      likeCount: 5,
      status: "approved" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { getVideoById, incrementVideoViews, hasUserLikedVideo, getActiveSubscription } = await import("./db");
    vi.mocked(getVideoById).mockResolvedValue(mockVideo);
    vi.mocked(incrementVideoViews).mockResolvedValue(undefined);
    vi.mocked(hasUserLikedVideo).mockResolvedValue(false);
    vi.mocked(getActiveSubscription).mockResolvedValue(undefined);

    const ctx = createMockContext({ id: 3 }); // Different user than creator
    const caller = appRouter.createCaller(ctx);

    const result = await caller.video.get({ videoId: 1 });

    expect(result.canView).toBe(false);
    expect(result.title).toBe("Premium Video");
  });
});

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("returns user when authenticated", async () => {
    const ctx = createMockContext({ id: 1, name: "Test User" });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
  });
});
