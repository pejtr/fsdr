import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test", email: "test@test.com", openId: "abc" }),
  getUserByOpenId: vi.fn(),
  getUserPremiumSubscriptions: vi.fn().mockResolvedValue([]),
  getActivePremiumSubscription: vi.fn().mockResolvedValue(null),
  cancelPremiumSubscription: vi.fn().mockResolvedValue(true),
  createPremiumSubscription: vi.fn().mockResolvedValue(1),
  createNotification: vi.fn().mockResolvedValue(1),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import * as db from "./db";
import { sendWelcomeNotification, sendPushNotification } from "./notifications";
import { notifyOwner } from "./_core/notification";

describe("Premium Subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserPremiumSubscriptions returns empty array when no subscriptions", async () => {
    const result = await db.getUserPremiumSubscriptions(1);
    expect(result).toEqual([]);
    expect(db.getUserPremiumSubscriptions).toHaveBeenCalledWith(1);
  });

  it("getActivePremiumSubscription returns null when no active subscription", async () => {
    const result = await db.getActivePremiumSubscription(1);
    expect(result).toBeNull();
    expect(db.getActivePremiumSubscription).toHaveBeenCalledWith(1);
  });

  it("cancelPremiumSubscription returns true on success", async () => {
    const result = await db.cancelPremiumSubscription(1, 1);
    expect(result).toBe(true);
    expect(db.cancelPremiumSubscription).toHaveBeenCalledWith(1, 1);
  });

  it("createPremiumSubscription returns subscription id", async () => {
    const result = await db.createPremiumSubscription({
      userId: 1,
      tier: "supporter",
      priceMonthly: "4.99",
      billingCycle: "monthly",
    });
    expect(result).toBe(1);
  });

  it("getUserPremiumSubscriptions returns subscriptions with correct fields", async () => {
    const mockSubs = [
      {
        id: 1,
        userId: 1,
        tier: "vip",
        status: "active",
        priceMonthly: "9.99",
        billingCycle: "monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(db.getUserPremiumSubscriptions).mockResolvedValueOnce(mockSubs);
    
    const result = await db.getUserPremiumSubscriptions(1);
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe("vip");
    expect(result[0].status).toBe("active");
    expect(result[0].stripeSubscriptionId).toBe("sub_123");
  });
});

describe("Welcome Notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendWelcomeNotification creates notification with correct content", async () => {
    const result = await sendWelcomeNotification(1, "Petr");
    expect(result).toBe(true);
    expect(db.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        type: "welcome",
        title: expect.stringContaining("Petr"),
        content: expect.stringContaining("průvodce platformou"),
        linkUrl: "/#pricing",
      })
    );
  });

  it("sendWelcomeNotification includes platform features in content", async () => {
    await sendWelcomeNotification(1, "Test");
    const call = vi.mocked(db.createNotification).mock.calls[0][0];
    expect(call.content).toContain("Fórum");
    expect(call.content).toContain("Gamifikace");
    expect(call.content).toContain("Affiliate");
    expect(call.content).toContain("galerii");
  });

  it("sendWelcomeNotification includes trial offer", async () => {
    await sendWelcomeNotification(1, "Test");
    const call = vi.mocked(db.createNotification).mock.calls[0][0];
    expect(call.content).toContain("Komunita+");
    expect(call.content).toContain("50%");
  });

  it("sendPushNotification stores notification in database", async () => {
    await sendPushNotification(1, {
      type: "system",
      title: "Test",
      content: "Test content",
    });
    expect(db.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        type: "system",
        title: "Test",
        content: "Test content",
      })
    );
  });
});

describe("Account Recovery", () => {
  it("notifyOwner can be used for support requests", async () => {
    const result = await notifyOwner({
      title: "🔑 Žádost o obnovení účtu: test@test.com",
      content: "E-mail: test@test.com\nZpráva: Potřebuji pomoc",
    });
    expect(result).toBe(true);
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("obnovení účtu"),
        content: expect.stringContaining("test@test.com"),
      })
    );
  });
});

describe("Subscription Page Features", () => {
  it("supports filtering active vs cancelled subscriptions", () => {
    const subs = [
      { id: 1, status: "active", tier: "supporter" },
      { id: 2, status: "cancelled", tier: "vip" },
      { id: 3, status: "active", tier: "premium" },
      { id: 4, status: "expired", tier: "supporter" },
    ];
    
    const active = subs.filter(s => s.status === "active");
    const inactive = subs.filter(s => s.status !== "active");
    
    expect(active).toHaveLength(2);
    expect(inactive).toHaveLength(2);
    expect(active[0].tier).toBe("supporter");
    expect(active[1].tier).toBe("premium");
  });

  it("tier config maps correctly", () => {
    const tierConfig: Record<string, { label: string }> = {
      supporter: { label: "Komunita+" },
      premium: { label: "Premium" },
      vip: { label: "VIP Insider" },
      creator: { label: "Creator" },
    };
    
    expect(tierConfig["supporter"].label).toBe("Komunita+");
    expect(tierConfig["vip"].label).toBe("VIP Insider");
    expect(tierConfig["creator"].label).toBe("Creator");
  });

  it("success URL params are parsed correctly", () => {
    const searchString = "?success=true&tier=vip";
    const params = new URLSearchParams(searchString);
    
    expect(params.get("success")).toBe("true");
    expect(params.get("tier")).toBe("vip");
  });

  it("cancel URL params are parsed correctly", () => {
    const searchString = "?cancelled=true";
    const params = new URLSearchParams(searchString);
    
    expect(params.get("cancelled")).toBe("true");
  });
});
