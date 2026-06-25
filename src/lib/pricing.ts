/**
 * Dynamic Pricing Engine for Gift Card Resale Platform
 * Calculates payout rates and offer amounts based on brand popularity, face value, and user trust score.
 */

export interface BrandTier {
  name: string;
  baseRate: number; // e.g., 0.80 for 80%
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'NICHE';
  description: string;
}

export const BRAND_TIERS: Record<string, BrandTier> = {
  "Amazon": { name: "Amazon", baseRate: 0.85, tier: "TIER_1", description: "Top popularity and high demand" },
  "Target": { name: "Target", baseRate: 0.80, tier: "TIER_1", description: "High popularity and stable retail demand" },
  "Walmart": { name: "Walmart", baseRate: 0.80, tier: "TIER_1", description: "High popularity and stable retail demand" },
  "Best Buy": { name: "Best Buy", baseRate: 0.75, tier: "TIER_2", description: "Consumer electronics preference" },
  "Apple": { name: "Apple", baseRate: 0.75, tier: "TIER_2", description: "Steady tech ecosystem demand" },
  "Starbucks": { name: "Starbucks", baseRate: 0.70, tier: "TIER_2", description: "Steady food and beverage demand" },
  "Nike": { name: "Nike", baseRate: 0.65, tier: "TIER_3", description: "Apparel and lifestyle market demand" },
  "Sephora": { name: "Sephora", baseRate: 0.65, tier: "TIER_3", description: "Beauty products high-retail trade" },
  "Home Depot": { name: "Home Depot", baseRate: 0.70, tier: "TIER_2", description: "Home improvement demand" },
  "Steam": { name: "Steam", baseRate: 0.60, tier: "TIER_3", description: "Gaming platform niche trade" },
};

export const NICHE_BRAND_TIER: BrandTier = {
  name: "Niche Brand",
  baseRate: 0.50,
  tier: "NICHE",
  description: "Lower secondary market liquidity"
};

/**
 * Gets the brand tier configuration based on brand name (case-insensitive)
 */
export function getBrandTier(brandName: string): BrandTier {
  const normalized = brandName.trim();
  const foundKey = Object.keys(BRAND_TIERS).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
  if (foundKey) {
    return BRAND_TIERS[foundKey];
  }
  return {
    ...NICHE_BRAND_TIER,
    name: brandName,
  };
}

export interface ValuationResult {
  brand: string;
  initialBalance: number;
  baseRate: number;
  finalRate: number;
  trustScore: number;
  trustPenaltyApplied: boolean;
  offerAmount: number;
  tier: string;
  isPro: boolean;
  proBonusRate: number;
  processingSpeed: 'STANDARD' | 'FAST' | 'INSTANT';
  processingFee: number;
  finalPayout: number;
}

/**
 * Calculates the direct buyout offer amount for a gift card
 * @param brandName Name of the gift card brand
 * @param balance The face value/initial balance of the gift card
 * @param trustScore The user's trust score (0 - 100)
 * @param isPro Whether the user has a VIP Pro Seller subscription
 * @param processingSpeed Selected settlement speed
 */
export function calculatePayout(
  brandName: string,
  balance: number,
  trustScore: number = 80,
  isPro: boolean = false,
  processingSpeed: 'STANDARD' | 'FAST' | 'INSTANT' = 'STANDARD'
): ValuationResult {
  const brandTier = getBrandTier(brandName);
  const baseRate = brandTier.baseRate;
  
  const proBonusRate = isPro ? 0.03 : 0.00;
  // Drop the rate by 5% (0.05) if the user's trustScore is below 60
  const trustPenaltyApplied = trustScore < 60;
  const penaltyRate = (trustPenaltyApplied && !isPro) ? 0.05 : 0.00;
  
  const finalRate = parseFloat((baseRate + proBonusRate - penaltyRate).toFixed(2));
  const grossOffer = parseFloat((balance * finalRate).toFixed(2));
  
  // Monetization platform fees
  let processingFee = 0;
  if (processingSpeed === "FAST") {
    processingFee = 1.99; // Priority Verification Fee
  } else if (processingSpeed === "INSTANT") {
    processingFee = parseFloat((2.99 + grossOffer * 0.015).toFixed(2)); // Instant payout priority fee: $2.99 + 1.5%
  }

  const offerAmount = parseFloat(Math.max(0, grossOffer - processingFee).toFixed(2));

  return {
    brand: brandTier.name,
    initialBalance: balance,
    baseRate,
    finalRate,
    trustScore,
    trustPenaltyApplied: trustPenaltyApplied && !isPro,
    offerAmount, // Net payout to user
    tier: brandTier.tier,
    isPro,
    proBonusRate,
    processingSpeed,
    processingFee,
    finalPayout: offerAmount
  };
}
