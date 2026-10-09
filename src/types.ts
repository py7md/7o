export enum CalculatorType {
  REGULAR = 'REGULAR',
  PRO = 'PRO'
}

export interface CardCategory {
  id: number;
  label: string;
  price: number;
}

export interface SaleRecord {
  date: string;
  type: CalculatorType;
  category: number;
  quantity: number;
  total: number;
  shopName?: string;
  paymentType?: 'نقد' | 'آجل';
  receivedAmount?: number;
  remainingAmount?: number;
  invoiceId?: string;
  totalInvoiceAmount?: number;
}

export interface ShopTransaction {
  id: string;
  date: string;
  type: 'sale' | 'payment';
  amount: number;
  notes: string;
  invoiceId?: string;
  items?: {
    label: string;
    category: number;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export interface ShopZone {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface ShopAccount {
  id: string;
  name: string;
  phone?: string;
  emoji?: string;
  isPro?: boolean;
  zoneId?: string;
  zoneName?: string;
  totalSales: number;
  totalPayments: number;
  currentBalance: number; // outstanding amount they owe (totalSales - totalPayments)
  createdAt: string;
  transactions: ShopTransaction[];
  reminderDays?: number;
  reminderDueDate?: string;
  reminderNotes?: string;
  showDebtAlert?: boolean;
  lastReminderSent?: string;
}

export interface DailySummary {
  [key: string]: {
    [CalculatorType.REGULAR]: { [category: number]: number };
    [CalculatorType.PRO]: { [category: number]: number };
    totalAmount: number;
  }
}

export interface AgentTransaction {
  id: string;
  date: string;
  type: 'purchase' | 'payment';
  amount: number;
  notes: string;
  invoiceNum?: string;
  items?: {
    label: string;
    category: number;
    quantity: number;
    price: number;
    total: number;
  }[];
  bonusCards?: {
    category: number;
    quantity: number;
    unitValue?: number;
    totalValue?: number;
  }[];
}

export interface WholesaleBonusRecord {
  id: string;
  date: string;
  agentId?: string;
  agentName: string;
  invoiceNum?: string;
  category: number;
  quantity: number;
  unitValue: number;
  totalValue: number;
  notes?: string;
  createdAt: string;
}

export interface AgentAccount {
  id: string;
  name: string;
  phone?: string;
  description?: string;
  totalPurchases: number;
  totalPayments: number;
  currentBalance: number; // amount we owe the agent
  createdAt: string;
  transactions: AgentTransaction[];
}

export type AppTab = 'regular' | 'pro' | 'shops' | 'purchases' | 'reports' | 'margin' | 'followup' | 'about';

