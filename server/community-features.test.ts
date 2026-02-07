import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Profile Router", () => {
  it("getMy returns profile for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Should not throw - returns null or profile
    const result = await caller.profile.getMy();
    // Result can be null if no profile exists yet
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it("getPublic returns profile for any user", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.profile.getPublic({ userId: 1 });
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it("update requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.profile.update({
        displayName: "Test Name",
        pronouns: "they/them",
      })
    ).rejects.toThrow();
  });

  it("update profile succeeds for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.profile.update({
      displayName: "Updated Name",
      pronouns: "she/her",
      identityType: "crossdresser",
      experienceLevel: "beginner",
      location: "Prague, CZ",
      interests: ["Fashion", "Makeup"],
      isPublic: true,
    });
    
    expect(result).toEqual({ success: true });
  });

  it("getTransformations returns array", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.profile.getTransformations({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Photo Gallery Router", () => {
  it("getPhotos returns paginated results", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.photoGallery.getPhotos({ limit: 10 });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });

  it("getPhotos filters by category", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.photoGallery.getPhotos({ 
      category: "transformation",
      limit: 10 
    });
    expect(result).toHaveProperty('items');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("upload requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.photoGallery.upload({
        imageUrl: "https://example.com/photo.jpg",
        category: "other",
      })
    ).rejects.toThrow();
  });

  it("toggleLike requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.photoGallery.toggleLike({ photoId: 1 })
    ).rejects.toThrow();
  });

  it("addComment requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.photoGallery.addComment({ photoId: 1, content: "Nice photo!" })
    ).rejects.toThrow();
  });
});

describe("Forum Router", () => {
  it("getCategories returns array", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.forum.getCategories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getTopics returns paginated results", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.forum.getTopics({ limit: 10 });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("createTopic requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.forum.createTopic({
        title: "Test Topic",
        content: "This is a test topic with enough content.",
        categoryId: 1,
      })
    ).rejects.toThrow();
  });

  it("createReply requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.forum.createReply({
        topicId: 1,
        content: "Test reply",
      })
    ).rejects.toThrow();
  });

  it("vote requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.forum.vote({
        replyId: 1,
        voteType: "upvote",
      })
    ).rejects.toThrow();
  });
});
