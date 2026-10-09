import { CalculatorType, CardCategory } from './types';

export const INITIAL_PRICES: Record<CalculatorType, CardCategory[]> = {
  [CalculatorType.REGULAR]: [
    { id: 100, label: 'فئة 100', price: 85 },
    { id: 200, label: 'فئة 200', price: 170 },
    { id: 250, label: 'فئة 250', price: 210 },
    { id: 300, label: 'فئة 300', price: 260 },
    { id: 500, label: 'فئة 500', price: 420 },
  ],
  [CalculatorType.PRO]: [
    { id: 100, label: 'فئة 100', price: 85 },
    { id: 200, label: 'فئة 200', price: 180 },
    { id: 250, label: 'فئة 250', price: 230 },
    { id: 300, label: 'فئة 300', price: 270 },
    { id: 500, label: 'فئة 500', price: 450 },
  ],
};
