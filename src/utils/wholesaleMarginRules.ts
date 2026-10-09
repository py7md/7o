import { WholesaleBonusRecord } from '../types';
import { DEFAULT_CARD_MARKET_VALUE } from '../components/PurchasesPage';

export interface BonusCardItem {
  category: number;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

/**
 * Calculates wholesale bonus cards based on the purchase specification:
 * 1. Full batch (560 cards):
 *    - 560 of any category -> +15 bonus cards of the same category.
 * 2. Half batch (280 cards):
 *    - 280 cards cat 100 -> +7 cards cat 100.
 *    - 280 cards cat 200 -> +7 cards cat 200, AND +1 card cat 100.
 *    - 280 cards cat 250 -> +7 cards cat 250, AND +1 card cat 100.
 *    - 280 cards cat 300 -> +7 cards cat 300, AND +1 card cat 100.
 *    - 280 cards cat 500 -> +7 cards cat 500, AND +1 card cat 250.
 * 3. Proportional rule (multiples of 40):
 *    - For any other quantity, 1 bonus card of the same category for every 40 cards bought (Math.floor(quantity / 40)).
 *
 * NOTE: These bonus cards are kept ONLY for wholesale margin profit accounting and are NOT added to sale inventory stock.
 */
export function calculateWholesaleBonusCards(
  items: { category: number; quantity: number }[]
): BonusCardItem[] {
  const bonusCountMap: Record<number, number> = {};

  const addBonus = (cat: number, count: number) => {
    if (count <= 0) return;
    bonusCountMap[cat] = (bonusCountMap[cat] || 0) + count;
  };

  items.forEach(item => {
    let remQty = item.quantity;
    const cat = item.category;

    if (remQty <= 0) return;

    // 1. Full batches of 560: 15 bonus cards of same category
    const fullBatches = Math.floor(remQty / 560);
    if (fullBatches > 0) {
      addBonus(cat, fullBatches * 15);
      remQty %= 560;
    }

    // 2. Half batches of 280
    const halfBatches = Math.floor(remQty / 280);
    if (halfBatches > 0) {
      // 7 of same category
      addBonus(cat, halfBatches * 7);

      // Category specific companion bonus:
      if (cat === 200 || cat === 250 || cat === 300) {
        addBonus(100, halfBatches * 1);
      } else if (cat === 500) {
        addBonus(250, halfBatches * 1);
      }
      remQty %= 280;
    }

    // 3. Multiples of 40 for remaining cards
    const step40 = Math.floor(remQty / 40);
    if (step40 > 0) {
      addBonus(cat, step40 * 1);
    }
  });

  return Object.entries(bonusCountMap)
    .filter(([_, qty]) => qty > 0)
    .map(([catStr, qty]) => {
      const category = Number(catStr);
      const unitValue = DEFAULT_CARD_MARKET_VALUE[category] || category;
      return {
        category,
        quantity: qty,
        unitValue,
        totalValue: qty * unitValue
      };
    });
}

/**
 * Creates wholesale bonus records ready for localStorage and reports
 */
export function buildWholesaleBonusRecords(
  txId: string,
  purchaseDate: string,
  agentId: string,
  agentName: string,
  invoiceNum: string,
  bonusCards: BonusCardItem[]
): WholesaleBonusRecord[] {
  return bonusCards.map(b => ({
    id: `WBONUS-AUTO-${txId}-${b.category}`,
    date: purchaseDate,
    agentId,
    agentName,
    invoiceNum: invoiceNum || txId,
    category: b.category,
    quantity: b.quantity,
    unitValue: b.unitValue,
    totalValue: b.totalValue,
    notes: `بونص أرباح جملة تلقائي (${b.quantity} كرت فئة ${b.category})`,
    createdAt: new Date().toISOString()
  }));
}
