// Centralized product/price definitions for Stripe checkout
// These map to the pricing tiers displayed on the homepage

export const PRODUCTS = {
  community_plus: {
    name: "Komunita+",
    description: "HD přístup ke všem videím, early access, hlasování o obsahu, fotogalerie, prioritní podpora",
    priceMonthly: 499, // in cents ($4.99)
    priceYearly: 4790, // in cents ($47.90 = $3.99/mo)
    originalPrice: 999, // in cents ($9.99)
    tier: "supporter" as const,
    features: [
      "Vše z Fanouška",
      "HD přístup ke všem videím",
      "Early access k novinkám",
      "Hlasování o obsahu",
      "Přístup k fotogalerii",
      "Prioritní podpora",
    ],
  },
  vip_insider: {
    name: "VIP Insider",
    description: "4K video, vlastní požadavky, přímý kontakt s tvůrci, behind-the-scenes, AI nástroje, 30% affiliate bonus",
    priceMonthly: 999, // in cents ($9.99)
    priceYearly: 9590, // in cents ($95.90 = $7.99/mo)
    originalPrice: 1999, // in cents ($19.99)
    tier: "vip" as const,
    features: [
      "Vše z Komunita+",
      "4K video kvalita",
      "Vlastní požadavky na obsah",
      "Přímý kontakt s tvůrci",
      "Behind-the-scenes přístup",
      "Exkluzivní AI nástroje",
      "Affiliate bonus 30%",
    ],
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
