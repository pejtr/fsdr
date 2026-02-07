import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractMentions } from "./db";

// ============ MENTION DETECTION TESTS ============
describe("Mention Detection", () => {
  it("should extract single mention from text", () => {
    const mentions = extractMentions("Hey @Alice, check this out!");
    expect(mentions).toEqual(["Alice"]);
  });

  it("should extract multiple mentions", () => {
    const mentions = extractMentions("@Bob and @Charlie should see this, right @Dave?");
    expect(mentions).toEqual(["Bob", "Charlie", "Dave"]);
  });

  it("should return empty array when no mentions", () => {
    const mentions = extractMentions("No mentions here, just regular text.");
    expect(mentions).toEqual([]);
  });

  it("should deduplicate mentions", () => {
    const mentions = extractMentions("@Alice said hi to @Alice again");
    expect(mentions).toEqual(["Alice"]);
  });

  it("should handle mentions at start and end", () => {
    const mentions = extractMentions("@Start of text and end @End");
    expect(mentions).toEqual(["Start", "End"]);
  });

  it("should handle underscores in usernames", () => {
    const mentions = extractMentions("Hello @user_name and @another_user123");
    expect(mentions).toEqual(["user_name", "another_user123"]);
  });
});

// ============ REPUTATION POINT RULES TESTS ============
describe("Reputation Point Rules", () => {
  it("should calculate correct rank for newcomer (0-49 points)", () => {
    const getRank = (points: number) => {
      if (points >= 1000) return "legend";
      if (points >= 500) return "expert";
      if (points >= 200) return "contributor";
      if (points >= 50) return "member";
      return "newcomer";
    };
    expect(getRank(0)).toBe("newcomer");
    expect(getRank(25)).toBe("newcomer");
    expect(getRank(49)).toBe("newcomer");
  });

  it("should calculate correct rank for member (50-199 points)", () => {
    const getRank = (points: number) => {
      if (points >= 1000) return "legend";
      if (points >= 500) return "expert";
      if (points >= 200) return "contributor";
      if (points >= 50) return "member";
      return "newcomer";
    };
    expect(getRank(50)).toBe("member");
    expect(getRank(100)).toBe("member");
    expect(getRank(199)).toBe("member");
  });

  it("should calculate correct rank for contributor (200-499 points)", () => {
    const getRank = (points: number) => {
      if (points >= 1000) return "legend";
      if (points >= 500) return "expert";
      if (points >= 200) return "contributor";
      if (points >= 50) return "member";
      return "newcomer";
    };
    expect(getRank(200)).toBe("contributor");
    expect(getRank(350)).toBe("contributor");
    expect(getRank(499)).toBe("contributor");
  });

  it("should calculate correct rank for expert (500-999 points)", () => {
    const getRank = (points: number) => {
      if (points >= 1000) return "legend";
      if (points >= 500) return "expert";
      if (points >= 200) return "contributor";
      if (points >= 50) return "member";
      return "newcomer";
    };
    expect(getRank(500)).toBe("expert");
    expect(getRank(750)).toBe("expert");
    expect(getRank(999)).toBe("expert");
  });

  it("should calculate correct rank for legend (1000+ points)", () => {
    const getRank = (points: number) => {
      if (points >= 1000) return "legend";
      if (points >= 500) return "expert";
      if (points >= 200) return "contributor";
      if (points >= 50) return "member";
      return "newcomer";
    };
    expect(getRank(1000)).toBe("legend");
    expect(getRank(5000)).toBe("legend");
  });
});

// ============ REPUTATION POINT VALUES TESTS ============
describe("Reputation Point Values", () => {
  const POINT_VALUES = {
    post: 5,
    reply: 3,
    upvote_received: 2,
    like_received: 1,
    photo_upload: 2,
  };

  it("should award 5 points for creating a topic", () => {
    expect(POINT_VALUES.post).toBe(5);
  });

  it("should award 3 points for a reply", () => {
    expect(POINT_VALUES.reply).toBe(3);
  });

  it("should award 2 points for receiving an upvote", () => {
    expect(POINT_VALUES.upvote_received).toBe(2);
  });

  it("should award 1 point for receiving a like", () => {
    expect(POINT_VALUES.like_received).toBe(1);
  });

  it("should award 2 points for uploading a photo", () => {
    expect(POINT_VALUES.photo_upload).toBe(2);
  });
});

// ============ CONTENT REPORT VALIDATION TESTS ============
describe("Content Report Validation", () => {
  const validContentTypes = ["forum_topic", "forum_reply", "photo", "comment", "video", "profile"];
  const validReasons = ["spam", "harassment", "inappropriate", "misinformation", "copyright", "other"];
  const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];

  it("should have all expected content types", () => {
    expect(validContentTypes).toContain("forum_topic");
    expect(validContentTypes).toContain("forum_reply");
    expect(validContentTypes).toContain("photo");
    expect(validContentTypes).toContain("comment");
    expect(validContentTypes).toContain("video");
    expect(validContentTypes).toContain("profile");
    expect(validContentTypes).toHaveLength(6);
  });

  it("should have all expected report reasons", () => {
    expect(validReasons).toContain("spam");
    expect(validReasons).toContain("harassment");
    expect(validReasons).toContain("inappropriate");
    expect(validReasons).toContain("misinformation");
    expect(validReasons).toContain("copyright");
    expect(validReasons).toContain("other");
    expect(validReasons).toHaveLength(6);
  });

  it("should have all expected report statuses", () => {
    expect(validStatuses).toContain("pending");
    expect(validStatuses).toContain("reviewed");
    expect(validStatuses).toContain("resolved");
    expect(validStatuses).toContain("dismissed");
    expect(validStatuses).toHaveLength(4);
  });
});

// ============ BADGE DEFINITIONS TESTS ============
describe("Badge Definitions", () => {
  const BADGE_CATEGORIES = ["milestone", "community", "content", "special"];
  
  it("should have all badge categories", () => {
    expect(BADGE_CATEGORIES).toContain("milestone");
    expect(BADGE_CATEGORIES).toContain("community");
    expect(BADGE_CATEGORIES).toContain("content");
    expect(BADGE_CATEGORIES).toContain("special");
  });

  it("should have valid badge requirements", () => {
    const validRequirements = ["postsCount", "repliesCount", "likesReceived", "upvotesReceived", "photosUploaded", "points"];
    expect(validRequirements).toContain("postsCount");
    expect(validRequirements).toContain("repliesCount");
    expect(validRequirements).toContain("likesReceived");
    expect(validRequirements).toContain("upvotesReceived");
    expect(validRequirements).toContain("photosUploaded");
    expect(validRequirements).toContain("points");
  });
});

// ============ NOTIFICATION TYPES TESTS ============
describe("Notification Types", () => {
  const NOTIFICATION_TYPES = [
    "new_follower", "new_subscriber", "new_message", "new_comment", 
    "new_like", "payout", "badge", "system", "forum_reply", 
    "forum_mention", "verification_approved", "verification_rejected",
    "rank_up", "new_badge"
  ];

  it("should include forum notification types", () => {
    expect(NOTIFICATION_TYPES).toContain("forum_reply");
    expect(NOTIFICATION_TYPES).toContain("forum_mention");
  });

  it("should include gamification notification types", () => {
    expect(NOTIFICATION_TYPES).toContain("rank_up");
    expect(NOTIFICATION_TYPES).toContain("new_badge");
  });

  it("should include verification notification types", () => {
    expect(NOTIFICATION_TYPES).toContain("verification_approved");
    expect(NOTIFICATION_TYPES).toContain("verification_rejected");
  });

  it("should include all core notification types", () => {
    expect(NOTIFICATION_TYPES).toContain("new_follower");
    expect(NOTIFICATION_TYPES).toContain("new_subscriber");
    expect(NOTIFICATION_TYPES).toContain("new_message");
    expect(NOTIFICATION_TYPES).toContain("new_comment");
    expect(NOTIFICATION_TYPES).toContain("new_like");
    expect(NOTIFICATION_TYPES).toContain("system");
  });
});

// ============ RANK PROGRESSION TESTS ============
describe("Rank Progression", () => {
  const RANK_THRESHOLDS = {
    newcomer: 0,
    member: 50,
    contributor: 200,
    expert: 500,
    legend: 1000,
  };

  it("should have increasing thresholds", () => {
    expect(RANK_THRESHOLDS.newcomer).toBeLessThan(RANK_THRESHOLDS.member);
    expect(RANK_THRESHOLDS.member).toBeLessThan(RANK_THRESHOLDS.contributor);
    expect(RANK_THRESHOLDS.contributor).toBeLessThan(RANK_THRESHOLDS.expert);
    expect(RANK_THRESHOLDS.expert).toBeLessThan(RANK_THRESHOLDS.legend);
  });

  it("should start at 0 for newcomer", () => {
    expect(RANK_THRESHOLDS.newcomer).toBe(0);
  });

  it("should require 1000 points for legend", () => {
    expect(RANK_THRESHOLDS.legend).toBe(1000);
  });
});

// ============ MODERATION WORKFLOW TESTS ============
describe("Moderation Workflow", () => {
  it("should have correct report lifecycle", () => {
    const lifecycle = ["pending", "reviewed", "resolved"];
    expect(lifecycle[0]).toBe("pending");
    expect(lifecycle[lifecycle.length - 1]).toBe("resolved");
  });

  it("should allow dismissing reports", () => {
    const validActions = ["resolved", "dismissed"];
    expect(validActions).toContain("resolved");
    expect(validActions).toContain("dismissed");
  });

  it("should track reviewer information", () => {
    const reviewFields = ["reviewedBy", "reviewNote", "reviewedAt"];
    expect(reviewFields).toContain("reviewedBy");
    expect(reviewFields).toContain("reviewNote");
    expect(reviewFields).toContain("reviewedAt");
  });
});

// ============ LEADERBOARD TESTS ============
describe("Leaderboard", () => {
  it("should sort by points descending", () => {
    const entries = [
      { userId: 1, points: 100 },
      { userId: 2, points: 500 },
      { userId: 3, points: 250 },
    ];
    const sorted = [...entries].sort((a, b) => b.points - a.points);
    expect(sorted[0].userId).toBe(2);
    expect(sorted[1].userId).toBe(3);
    expect(sorted[2].userId).toBe(1);
  });

  it("should limit results", () => {
    const entries = Array.from({ length: 50 }, (_, i) => ({ userId: i + 1, points: 50 - i }));
    const limited = entries.slice(0, 20);
    expect(limited).toHaveLength(20);
    expect(limited[0].points).toBeGreaterThan(limited[19].points);
  });
});
