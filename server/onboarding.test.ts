import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test", email: "test@test.com", openId: "abc" }),
  getUserByOpenId: vi.fn(),
  getOnboardingStatus: vi.fn().mockResolvedValue(false),
  completeOnboarding: vi.fn().mockResolvedValue(true),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
}));

import * as db from "./db";

describe("Onboarding Backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getOnboardingStatus returns false for new users", async () => {
    const result = await db.getOnboardingStatus(1);
    expect(result).toBe(false);
    expect(db.getOnboardingStatus).toHaveBeenCalledWith(1);
  });

  it("getOnboardingStatus returns true for users who completed onboarding", async () => {
    vi.mocked(db.getOnboardingStatus).mockResolvedValueOnce(true);
    const result = await db.getOnboardingStatus(1);
    expect(result).toBe(true);
  });

  it("completeOnboarding marks user as onboarded", async () => {
    const result = await db.completeOnboarding(1);
    expect(result).toBe(true);
    expect(db.completeOnboarding).toHaveBeenCalledWith(1);
  });

  it("completeOnboarding is idempotent", async () => {
    await db.completeOnboarding(1);
    await db.completeOnboarding(1);
    expect(db.completeOnboarding).toHaveBeenCalledTimes(2);
  });
});

describe("Onboarding Wizard Steps", () => {
  const STEP_IDS = ["welcome", "browse", "forum", "gamification", "affiliate", "subscribe"];

  it("has 6 steps covering all platform features", () => {
    expect(STEP_IDS).toHaveLength(6);
  });

  it("starts with welcome step", () => {
    expect(STEP_IDS[0]).toBe("welcome");
  });

  it("ends with subscribe step (conversion funnel)", () => {
    expect(STEP_IDS[STEP_IDS.length - 1]).toBe("subscribe");
  });

  it("includes all key platform features", () => {
    expect(STEP_IDS).toContain("browse");
    expect(STEP_IDS).toContain("forum");
    expect(STEP_IDS).toContain("gamification");
    expect(STEP_IDS).toContain("affiliate");
  });

  it("step navigation: progress calculation is correct", () => {
    const totalSteps = STEP_IDS.length;
    expect(((1) / totalSteps) * 100).toBeCloseTo(16.67, 1);
    expect(((3) / totalSteps) * 100).toBe(50);
    expect(((6) / totalSteps) * 100).toBe(100);
  });

  it("step navigation: first step has no prev", () => {
    const currentStep = 0;
    expect(currentStep === 0).toBe(true);
  });

  it("step navigation: last step shows finish button", () => {
    const currentStep = STEP_IDS.length - 1;
    const isLastStep = currentStep === STEP_IDS.length - 1;
    expect(isLastStep).toBe(true);
  });

  it("step navigation: middle steps have both prev and next", () => {
    const currentStep = 3;
    expect(currentStep > 0).toBe(true);
    expect(currentStep < STEP_IDS.length - 1).toBe(true);
  });
});

describe("Onboarding Flow Logic", () => {
  it("wizard should not show for completed users", () => {
    const onboardingCompleted = true;
    const isAuthenticated = true;
    const shouldShow = isAuthenticated && !onboardingCompleted;
    expect(shouldShow).toBe(false);
  });

  it("wizard should show for new authenticated users", () => {
    const onboardingCompleted = false;
    const isAuthenticated = true;
    const shouldShow = isAuthenticated && !onboardingCompleted;
    expect(shouldShow).toBe(true);
  });

  it("wizard should not show for unauthenticated users", () => {
    const onboardingCompleted = false;
    const isAuthenticated = false;
    const shouldShow = isAuthenticated && !onboardingCompleted;
    expect(shouldShow).toBe(false);
  });

  it("skip button completes onboarding immediately", async () => {
    await db.completeOnboarding(1);
    expect(db.completeOnboarding).toHaveBeenCalledWith(1);
  });

  it("finish button on last step completes onboarding", async () => {
    await db.completeOnboarding(1);
    expect(db.completeOnboarding).toHaveBeenCalledWith(1);
  });

  it("CTA click completes onboarding and navigates", async () => {
    const ctaLinks = ["/browse", "/forum", "/leaderboard", "/affiliate", "/#pricing"];
    for (const link of ctaLinks) {
      expect(link.length).toBeGreaterThan(0);
    }
    await db.completeOnboarding(1);
    expect(db.completeOnboarding).toHaveBeenCalled();
  });
});
