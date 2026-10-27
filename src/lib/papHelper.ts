export interface PapInfo {
  hasPap: boolean;
  buyQty: number;
  freeQty: number;
  rawOffer: string;
}

/**
 * Parses promotional Patient Assistance Program (PAP) offer text
 * E.g.:
 * - "Pap Offer: Buy 3, Get 1 Free. Contact Us For Latest Updates." -> buy: 3, get: 1
 * - "Pap Offer: Buy 5, Get 1 Free." -> buy: 5, get: 1
 * - "Pap Offer: Buy 12 Capsules, Get 48 Capsules Free" -> buy: 12, get: 48
 * - "Pap Offer: Buy For 3 Cycles, Get The 4Th Cycle Free" -> buy: 3, get: 1
 */
export function parsePapOffer(offerText?: string | null): PapInfo | null {
  if (!offerText || typeof offerText !== 'string') return null;
  const clean = offerText.trim();
  if (
    !clean ||
    clean.toLowerCase() === 'pap offer:' ||
    (clean.toLowerCase().includes('contact us for latest updates') && !clean.toLowerCase().includes('buy'))
  ) {
    return null;
  }

  // Regex pattern matching: Buy (number) ... Get (number) ... Free
  const match = clean.match(
    /buy\s+(?:for\s+)?(\d+)\s*(?:capsules|tablets|cycles|vials|bottles|packs|strips)?.*?(?:get|the)\s+(?:the\s+)?(\d+)(?:th|st|nd|rd)?\s*(?:capsules|tablets|cycles|vials|bottles|packs|strips)?\s+free/i
  );

  if (match) {
    const buyQty = parseInt(match[1], 10);
    let freeQty = parseInt(match[2], 10);
    // When text states "Buy for 3 cycles, get the 4th cycle free", the free portion is 1 unit
    if (clean.toLowerCase().includes('cycle free') && freeQty >= buyQty) {
      freeQty = 1;
    }
    if (buyQty > 0 && freeQty > 0) {
      return {
        hasPap: true,
        buyQty,
        freeQty,
        rawOffer: clean
      };
    }
  }

  // Fallback for general PAP phrasing mentioning Buy and Free
  if (clean.toLowerCase().includes('buy') && clean.toLowerCase().includes('free')) {
    const nums = clean.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const b = parseInt(nums[0], 10);
      const f = parseInt(nums[1], 10);
      if (b > 0 && f > 0) {
        return {
          hasPap: true,
          buyQty: b,
          freeQty: f,
          rawOffer: clean
        };
      }
    }
    return {
      hasPap: true,
      buyQty: 3,
      freeQty: 1,
      rawOffer: clean
    };
  }

  return null;
}

/**
 * Calculates free units earned from an item's PAP offer based on ordered quantity
 */
export function calculatePapBenefit(quantity: number, offerText?: string | null) {
  const pap = parsePapOffer(offerText);
  if (!pap) {
    return {
      isEligible: false,
      pap: null,
      freeUnits: 0,
      neededForNext: 0
    };
  }

  const isEligible = quantity >= pap.buyQty;
  const freeUnits = isEligible ? Math.floor(quantity / pap.buyQty) * pap.freeQty : 0;
  const remainder = quantity % pap.buyQty;
  const neededForNext = remainder === 0 ? pap.buyQty : pap.buyQty - remainder;

  return {
    isEligible,
    pap,
    freeUnits,
    neededForNext: isEligible ? neededForNext : (pap.buyQty - quantity)
  };
}
