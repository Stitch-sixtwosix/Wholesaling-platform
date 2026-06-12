// Core wholesaling deal math.

export interface AnalyzerInput {
  arv: number; // After Repair Value
  repairEstimate: number;
  desiredAssignmentFee: number;
  rule: number; // e.g. 0.70 for the 70% rule
  holdingCosts?: number;
  closingCosts?: number;
  agentCommission?: number; // percent of resale (for the end buyer's flip math)
}

export interface AnalyzerResult {
  // What an end-buyer (flipper) would pay at the chosen rule
  buyerMao: number;
  // The most we can offer the seller while still hitting our assignment fee
  sellerMao: number;
  // Our spread / projected profit at sellerMao
  assignmentFee: number;
  // Rough flipper profit estimate at buyerMao
  estimatedFlipProfit: number;
  // Quick health flag
  isViable: boolean;
}

/**
 * Maximum Allowable Offer math.
 *
 * Buyer MAO (what a flipper pays)        = ARV * rule - repairs
 * Seller MAO (what we offer the seller)  = Buyer MAO - our assignment fee
 */
export function analyzeDeal(input: AnalyzerInput): AnalyzerResult {
  const {
    arv,
    repairEstimate,
    desiredAssignmentFee,
    rule,
    holdingCosts = 0,
    closingCosts = 0,
    agentCommission = 0,
  } = input;

  const buyerMao = Math.max(0, arv * rule - repairEstimate);
  const sellerMao = Math.max(0, buyerMao - desiredAssignmentFee);

  // Flipper's rough net if they buy at buyerMao, rehab, and resell at ARV.
  const commission = arv * (agentCommission / 100);
  const estimatedFlipProfit =
    arv - buyerMao - repairEstimate - holdingCosts - closingCosts - commission;

  return {
    buyerMao,
    sellerMao,
    assignmentFee: buyerMao - sellerMao,
    estimatedFlipProfit,
    isViable: sellerMao > 0 && desiredAssignmentFee > 0,
  };
}

/** Estimate ARV from comparable sales using $/sqft of subject. */
export function arvFromComps(
  subjectSqft: number,
  comps: { salePrice: number; sqft?: number | null }[]
): { arv: number | null; pricePerSqft: number | null } {
  const valid = comps.filter((c) => c.sqft && c.sqft > 0 && c.salePrice > 0);
  if (valid.length === 0 || !subjectSqft) return { arv: null, pricePerSqft: null };
  const avgPpsf =
    valid.reduce((sum, c) => sum + c.salePrice / (c.sqft as number), 0) / valid.length;
  return { arv: Math.round(avgPpsf * subjectSqft), pricePerSqft: Math.round(avgPpsf) };
}

// Quick repair estimator: cost per sqft tiers (light/medium/heavy/gut rehab).
export const REHAB_TIERS = [
  { value: "light", label: "Light (cosmetic)", perSqft: 15 },
  { value: "medium", label: "Medium (paint, floors, kitchen)", perSqft: 30 },
  { value: "heavy", label: "Heavy (systems + cosmetic)", perSqft: 50 },
  { value: "gut", label: "Full gut rehab", perSqft: 75 },
];

export function estimateRehab(sqft: number, tier: string): number {
  const t = REHAB_TIERS.find((x) => x.value === tier) ?? REHAB_TIERS[1];
  return Math.round(sqft * t.perSqft);
}

// ---------------------------------------------------------------------------
// Deal Finder — stale-listing analysis
// ---------------------------------------------------------------------------

export function daysOnMarket(listDate: Date | string): number {
  const start = new Date(listDate).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

// Seller-motivation discount tiers by days on market. The longer a listing
// sits, the more negotiating room — these are starting-offer heuristics.
export const DOM_TIERS = [
  { minDays: 180, discount: 0.2, label: "180+ days — very stale" },
  { minDays: 120, discount: 0.15, label: "120+ days — stale" },
  { minDays: 90, discount: 0.1, label: "90+ days — aging" },
  { minDays: 60, discount: 0.05, label: "60+ days — watch" },
  { minDays: 0, discount: 0, label: "fresh" },
] as const;

export interface SuggestedOffer {
  suggested: number;
  discountPct: number; // motivation discount applied to list price
  dom: number;
  basis: "mao" | "discounted_list"; // which method produced the number
  isStale: boolean; // 60+ days on market
}

/**
 * Suggested contract price for an on-market listing.
 *
 * 1. Discount the list price by a motivation tier based on days on market.
 * 2. If ARV + repairs are known, also compute the seller MAO (70% rule less a
 *    $10k assignment fee) and take the LOWER of the two — never offer above
 *    what the deal math supports.
 */
export function suggestContractPrice(listing: {
  listPrice: number;
  listDate: Date | string;
  arv?: number | null;
  repairEstimate?: number | null;
}): SuggestedOffer {
  const dom = daysOnMarket(listing.listDate);
  const tier = DOM_TIERS.find((t) => dom >= t.minDays) ?? DOM_TIERS[DOM_TIERS.length - 1];
  const discountedList = listing.listPrice * (1 - tier.discount);

  let suggested = discountedList;
  let basis: SuggestedOffer["basis"] = "discounted_list";

  if (listing.arv && listing.arv > 0) {
    const { sellerMao } = analyzeDeal({
      arv: listing.arv,
      repairEstimate: listing.repairEstimate ?? 0,
      desiredAssignmentFee: 10_000,
      rule: 0.7,
    });
    if (sellerMao > 0 && sellerMao < suggested) {
      suggested = sellerMao;
      basis = "mao";
    }
  }

  return {
    suggested: Math.round(suggested),
    discountPct: tier.discount * 100,
    dom,
    basis,
    isStale: dom >= 60,
  };
}

/** Score how well a deal matches a buyer's buy box (0-100). */
export function buyerMatchScore(
  deal: { price: number; propertyType?: string | null; market?: string | null; rehab?: number | null; beds?: number | null },
  buyer: {
    minPrice?: number | null;
    maxPrice?: number | null;
    propertyTypes?: string | null;
    markets?: string | null;
    maxRehab?: number | null;
    minBeds?: number | null;
  }
): number {
  let score = 0;
  let checks = 0;

  // Price range
  checks++;
  if (
    (buyer.minPrice == null || deal.price >= buyer.minPrice) &&
    (buyer.maxPrice == null || deal.price <= buyer.maxPrice)
  ) {
    score++;
  }

  // Property type
  if (buyer.propertyTypes && deal.propertyType) {
    checks++;
    const types = buyer.propertyTypes.toLowerCase().split(",").map((s) => s.trim());
    if (types.some((t) => deal.propertyType!.toLowerCase().includes(t) || t.includes(deal.propertyType!.toLowerCase()))) {
      score++;
    }
  }

  // Market
  if (buyer.markets && deal.market) {
    checks++;
    const markets = buyer.markets.toLowerCase().split(",").map((s) => s.trim());
    if (markets.some((m) => deal.market!.toLowerCase().includes(m) || m.includes(deal.market!.toLowerCase()))) {
      score++;
    }
  }

  // Rehab budget
  if (buyer.maxRehab != null && deal.rehab != null) {
    checks++;
    if (deal.rehab <= buyer.maxRehab) score++;
  }

  // Beds
  if (buyer.minBeds != null && deal.beds != null) {
    checks++;
    if (deal.beds >= buyer.minBeds) score++;
  }

  if (checks === 0) return 50; // no criteria to match against
  return Math.round((score / checks) * 100);
}
