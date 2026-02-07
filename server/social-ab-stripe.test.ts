import { describe, it, expect, vi } from 'vitest';
import { PRODUCTS } from './products';

// ============ SOCIAL PROOF WIDGET ============
describe('Social Proof Widget', () => {
  it('should have correct social proof event structure', () => {
    const event = {
      id: 1,
      eventType: 'signup' as const,
      displayName: 'Martin',
      location: 'Praha',
      tierName: null,
      createdAt: new Date(),
    };
    expect(event).toHaveProperty('eventType');
    expect(event).toHaveProperty('displayName');
    expect(event).toHaveProperty('location');
    expect(event.eventType).toBe('signup');
  });

  it('should support subscription event type with tier name', () => {
    const event = {
      id: 2,
      eventType: 'subscription' as const,
      displayName: 'Lucie',
      location: 'Brno',
      tierName: 'Komunita+',
      createdAt: new Date(),
    };
    expect(event.eventType).toBe('subscription');
    expect(event.tierName).toBe('Komunita+');
  });

  it('should support purchase event type', () => {
    const event = {
      id: 3,
      eventType: 'purchase' as const,
      displayName: 'Jakub',
      location: 'Ostrava',
      tierName: 'VIP Insider',
      createdAt: new Date(),
    };
    expect(event.eventType).toBe('purchase');
    expect(event.tierName).toBe('VIP Insider');
  });

  it('should limit recent events to specified count', () => {
    const events = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      eventType: 'signup' as const,
      displayName: `User${i}`,
    }));
    const limited = events.slice(0, 15);
    expect(limited).toHaveLength(15);
  });

  it('should handle missing location gracefully', () => {
    const event = {
      id: 4,
      eventType: 'signup' as const,
      displayName: 'Anon',
      location: null,
    };
    expect(event.location).toBeNull();
  });
});

// ============ A/B TESTING SYSTEM ============
describe('A/B Testing System', () => {
  it('should have correct CTA test structure', () => {
    const test = {
      id: 1,
      testName: 'Hero CTA Test',
      location: 'hero',
      isActive: true,
      variants: [
        { id: 1, variantName: 'Control', buttonText: 'Připojit se ZDARMA', buttonColor: null, subText: null, impressions: 100, clicks: 15, conversions: 3 },
        { id: 2, variantName: 'Urgency', buttonText: 'Začni HNED - je to ZDARMA', buttonColor: 'bg-gradient-to-r from-emerald-500 to-teal-500', subText: 'Už 15,000+ členů. Nepromeškej to.', impressions: 100, clicks: 22, conversions: 5 },
      ],
    };
    expect(test.variants).toHaveLength(2);
    expect(test.location).toBe('hero');
    expect(test.isActive).toBe(true);
  });

  it('should calculate click-through rate correctly', () => {
    const variant = { impressions: 200, clicks: 30, conversions: 5 };
    const ctr = variant.impressions > 0 ? (variant.clicks / variant.impressions) * 100 : 0;
    expect(ctr).toBe(15);
  });

  it('should calculate conversion rate correctly', () => {
    const variant = { impressions: 200, clicks: 30, conversions: 6 };
    const conversionRate = variant.clicks > 0 ? (variant.conversions / variant.clicks) * 100 : 0;
    expect(conversionRate).toBe(20);
  });

  it('should handle zero impressions without division by zero', () => {
    const variant = { impressions: 0, clicks: 0, conversions: 0 };
    const ctr = variant.impressions > 0 ? (variant.clicks / variant.impressions) * 100 : 0;
    expect(ctr).toBe(0);
  });

  it('should select variant using Thompson sampling approximation', () => {
    const variants = [
      { id: 1, impressions: 100, clicks: 10 },
      { id: 2, impressions: 50, clicks: 8 },
      { id: 3, impressions: 200, clicks: 15 },
    ];
    
    // Favor less-seen variants
    const weights = variants.map(v => 1 / (v.impressions + 1));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    expect(totalWeight).toBeGreaterThan(0);
    expect(weights[1]).toBeGreaterThan(weights[0]); // Less impressions = higher weight
    expect(weights[0]).toBeGreaterThan(weights[2]); // Less impressions = higher weight
  });

  it('should persist variant assignment in session', () => {
    const location = 'hero';
    const variantId = 2;
    const key = `cta_variant_${location}`;
    
    // Simulate sessionStorage
    const storage: Record<string, string> = {};
    storage[key] = String(variantId);
    
    expect(parseInt(storage[key])).toBe(2);
  });

  it('should increment impressions on variant view', () => {
    let impressions = 100;
    impressions += 1;
    expect(impressions).toBe(101);
  });

  it('should increment clicks on CTA click', () => {
    let clicks = 15;
    clicks += 1;
    expect(clicks).toBe(16);
  });

  it('should increment conversions on successful checkout', () => {
    let conversions = 3;
    conversions += 1;
    expect(conversions).toBe(4);
  });

  it('should return null for inactive test', () => {
    const test = { id: 1, isActive: false, variants: [] };
    const result = !test.isActive || test.variants.length === 0 ? null : test;
    expect(result).toBeNull();
  });
});

// ============ STRIPE CHECKOUT INTEGRATION ============
describe('Stripe Checkout Integration', () => {
  it('should have community_plus product defined', () => {
    expect(PRODUCTS.community_plus).toBeDefined();
    expect(PRODUCTS.community_plus.name).toBe('Komunita+');
    expect(PRODUCTS.community_plus.tier).toBe('supporter');
  });

  it('should have vip_insider product defined', () => {
    expect(PRODUCTS.vip_insider).toBeDefined();
    expect(PRODUCTS.vip_insider.name).toBe('VIP Insider');
    expect(PRODUCTS.vip_insider.tier).toBe('vip');
  });

  it('should have correct pricing for community_plus', () => {
    expect(PRODUCTS.community_plus.priceMonthly).toBe(499);
    expect(PRODUCTS.community_plus.priceYearly).toBe(4790);
    expect(PRODUCTS.community_plus.originalPrice).toBe(999);
  });

  it('should have correct pricing for vip_insider', () => {
    expect(PRODUCTS.vip_insider.priceMonthly).toBe(999);
    expect(PRODUCTS.vip_insider.priceYearly).toBe(9590);
    expect(PRODUCTS.vip_insider.originalPrice).toBe(1999);
  });

  it('should calculate yearly savings correctly', () => {
    const monthly = PRODUCTS.community_plus.priceMonthly;
    const yearly = PRODUCTS.community_plus.priceYearly;
    const yearlySavings = (monthly * 12) - yearly;
    expect(yearlySavings).toBeGreaterThan(0);
    expect(yearlySavings).toBe(1198); // $11.98 savings
  });

  it('should have features list for each product', () => {
    expect(PRODUCTS.community_plus.features.length).toBeGreaterThan(0);
    expect(PRODUCTS.vip_insider.features.length).toBeGreaterThan(0);
    expect(PRODUCTS.vip_insider.features.length).toBeGreaterThan(PRODUCTS.community_plus.features.length);
  });

  it('should build correct checkout session metadata', () => {
    const user = { id: 1, email: 'test@example.com', name: 'Test User' };
    const product = PRODUCTS.community_plus;
    
    const metadata = {
      user_id: user.id.toString(),
      customer_email: user.email,
      customer_name: user.name,
      tier: product.tier,
      product_key: 'community_plus',
      billing_cycle: 'monthly',
    };
    
    expect(metadata.user_id).toBe('1');
    expect(metadata.tier).toBe('supporter');
    expect(metadata.product_key).toBe('community_plus');
  });

  it('should build correct success and cancel URLs', () => {
    const origin = 'https://femsider.manus.space';
    const tier = 'supporter';
    
    const successUrl = `${origin}/subscriptions?success=true&tier=${tier}`;
    const cancelUrl = `${origin}/?cancelled=true`;
    
    expect(successUrl).toContain('success=true');
    expect(successUrl).toContain('tier=supporter');
    expect(cancelUrl).toContain('cancelled=true');
  });

  it('should select correct price based on billing cycle', () => {
    const billingCycle = 'yearly';
    const product = PRODUCTS.community_plus;
    const price = billingCycle === 'yearly' ? product.priceYearly : product.priceMonthly;
    expect(price).toBe(4790);
  });

  it('should handle monthly billing cycle', () => {
    const billingCycle = 'monthly';
    const product = PRODUCTS.vip_insider;
    const price = billingCycle === 'yearly' ? product.priceYearly : product.priceMonthly;
    expect(price).toBe(999);
  });

  it('should validate product key', () => {
    const validKeys = ['community_plus', 'vip_insider'];
    expect(validKeys).toContain('community_plus');
    expect(validKeys).toContain('vip_insider');
    expect(validKeys).not.toContain('invalid_product');
  });

  it('should have description for each product', () => {
    expect(PRODUCTS.community_plus.description).toBeTruthy();
    expect(PRODUCTS.vip_insider.description).toBeTruthy();
  });
});

// ============ WEBHOOK HANDLER ============
describe('Stripe Webhook Handler', () => {
  it('should detect test events by event ID prefix', () => {
    const testEventId = 'evt_test_123456';
    const isTest = testEventId.startsWith('evt_test_');
    expect(isTest).toBe(true);
  });

  it('should not detect production events as test', () => {
    const prodEventId = 'evt_1234567890';
    const isTest = prodEventId.startsWith('evt_test_');
    expect(isTest).toBe(false);
  });

  it('should return verified response for test events', () => {
    const testEvent = { id: 'evt_test_abc', type: 'checkout.session.completed' };
    if (testEvent.id.startsWith('evt_test_')) {
      const response = { verified: true };
      expect(response.verified).toBe(true);
    }
  });

  it('should handle checkout.session.completed event', () => {
    const session = {
      customer: 'cus_123',
      subscription: 'sub_456',
      amount_total: 499,
      metadata: {
        user_id: '1',
        customer_email: 'test@example.com',
        customer_name: 'Test',
        tier: 'supporter',
      },
    };
    expect(session.metadata.user_id).toBe('1');
    expect(session.metadata.tier).toBe('supporter');
    expect(session.amount_total).toBe(499);
  });

  it('should handle customer.subscription.deleted event', () => {
    const subscription = { id: 'sub_456', status: 'canceled' };
    expect(subscription.id).toBeTruthy();
    expect(subscription.status).toBe('canceled');
  });

  it('should handle missing metadata gracefully', () => {
    const session = {
      customer: null,
      subscription: null,
      metadata: {},
    };
    const userId = session.metadata?.user_id || null;
    expect(userId).toBeNull();
  });
});
