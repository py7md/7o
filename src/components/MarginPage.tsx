import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Percent,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Printer,
  Download,
  Share2,
  Search,
  Plus,
  Trash2,
  Store,
  Truck,
  Sparkles,
  FileText,
  BadgePercent,
  Coins,
  CheckCircle2,
  X,
  ExternalLink,
  MessageCircle,
  Clock,
  Layers
} from 'lucide-react';
import {
  SaleRecord,
  ShopAccount,
  AgentAccount,
  CalculatorType,
  WholesaleBonusRecord
} from '../types';
import {
  getNetworkName,
  getDistributorName,
  getDistributorPhone,
  drawDahshahLogo,
  openWhatsAppDirect
} from '../utils/invoiceHelpers';
import { downloadMarginReportExcel, MarginExcelItem } from '../utils/excelHelpers';

// Pricing baseline & Pro commission profit margins per card category:
// فئة 200: السعر العادي 170 -> يباع للـ Pro بـ 180 (الربح = 10)
// فئة 250: السعر العادي 210 -> يباع للـ Pro بـ 230 (الربح = 20)
// فئة 300: السعر العادي 260 -> يباع للـ Pro بـ 270 (الربح = 10)
// فئة 500: السعر العادي 420 -> يباع للـ Pro بـ 450 (الربح = 30)
// فئة 100: السعر العادي 85 -> يباع للـ Pro بـ 90 (الربح = 5)
export const DEFAULT_PRO_COMMISSION_PER_CARD: Record<number, number> = {
  100: 5,
  200: 10,
  250: 20,
  300: 10,
  500: 30
};

// Default regular price (السعر العادي للكروت) for wholesale bonus free cards:
// فئة 100: 85, فئة 200: 170, فئة 250: 210, فئة 300: 260, فئة 500: 420
export const DEFAULT_CARD_MARKET_VALUE: Record<number, number> = {
  100: 85,
  200: 170,
  250: 210,
  300: 260,
  500: 420
};

interface MarginPageProps {
  salesHistory: SaleRecord[];
  shops: ShopAccount[];
  agents: AgentAccount[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export interface ProInvoiceSummary {
  invoiceId: string;
  date: string;
  shopName: string;
  totalCards: number;
  totalAmount: number;
  commissionMargin: number;
  items: { category: number; quantity: number; unitMargin: number; totalMargin: number }[];
  paymentType?: string;
}

export const MarginPage: React.FC<MarginPageProps> = ({
  salesHistory,
  shops,
  agents,
  showToast
}) => {
  // Main Sub-tabs: 'commission' (هامش العمولة) | 'wholesale' (هامش الجملة)
  const [activeMarginTab, setActiveMarginTab] = useState<'commission' | 'wholesale'>('commission');

  // Time filter mode: 'daily' | 'weekly' | 'monthly' | 'custom'
  const [filterMode, setFilterMode] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');

  // Selected date for daily mode (defaults to today)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected month for monthly mode (defaults to current YYYY-MM)
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Selected custom range
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Wholesale Bonus Cards persistent state
  const [wholesaleBonuses, setWholesaleBonuses] = useState<WholesaleBonusRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wholesale_bonus_records');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Error loading wholesale bonuses:', e);
      }
    }
    return [];
  });

  // Modal for adding a Wholesale Bonus record
  const [showAddBonusModal, setShowAddBonusModal] = useState<boolean>(false);
  const [bonusAgentName, setBonusAgentName] = useState<string>('');
  const [bonusInvoiceNum, setBonusInvoiceNum] = useState<string>('');
  const [bonusCategory, setBonusCategory] = useState<number>(200);
  const [bonusQuantity, setBonusQuantity] = useState<number>(5);
  const [bonusUnitValue, setBonusUnitValue] = useState<number>(170);
  const [bonusDate, setBonusDate] = useState<string>(todayStr);
  const [bonusNotes, setBonusNotes] = useState<string>('');

  // Detail Modal
  const [viewingInvoice, setViewingInvoice] = useState<ProInvoiceSummary | null>(null);

  // Save wholesale bonuses to localStorage whenever changed
  const saveWholesaleBonuses = (bonuses: WholesaleBonusRecord[]) => {
    setWholesaleBonuses(bonuses);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wholesale_bonus_records', JSON.stringify(bonuses));
      } catch (e) {
        console.error('Failed to save wholesale bonuses:', e);
      }
    }
  };

  // Quick day navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleTodayClick = () => {
    setSelectedDate(todayStr);
  };

  // Determine current active date range
  const { rangeStart, rangeEnd, periodLabel } = useMemo(() => {
    if (filterMode === 'daily') {
      return {
        rangeStart: selectedDate,
        rangeEnd: selectedDate,
        periodLabel: `يوم ${selectedDate}`
      };
    } else if (filterMode === 'weekly') {
      // Calculate current week (start 6 days ago or from beginning of week)
      const baseDate = new Date(selectedDate);
      const dayOfWeek = baseDate.getDay(); // 0 is Sunday, 6 is Saturday
      // Let's set Saturday as first day of week in Arabic Gulf/Middle East
      const diffToSaturday = (dayOfWeek + 1) % 7;
      const startOfWeek = new Date(baseDate);
      startOfWeek.setDate(baseDate.getDate() - diffToSaturday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const s = startOfWeek.toISOString().split('T')[0];
      const e = endOfWeek.toISOString().split('T')[0];
      return {
        rangeStart: s,
        rangeEnd: e,
        periodLabel: `أسبوعياً (من ${s} إلى ${e})`
      };
    } else if (filterMode === 'monthly') {
      const year = parseInt(selectedMonth.split('-')[0], 10);
      const month = parseInt(selectedMonth.split('-')[1], 10);
      const lastDay = new Date(year, month, 0).getDate();
      const s = `${selectedMonth}-01`;
      const e = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      return {
        rangeStart: s,
        rangeEnd: e,
        periodLabel: `شهرياً (${selectedMonth})`
      };
    } else {
      return {
        rangeStart: customStartDate,
        rangeEnd: customEndDate,
        periodLabel: `فترة مخصصة (من ${customStartDate} إلى ${customEndDate})`
      };
    }
  }, [filterMode, selectedDate, selectedMonth, customStartDate, customEndDate]);

  // -------------------------------------------------------------
  // SECTION 1: COMMISSION MARGIN (هامش العمولة لفئة Pro)
  // -------------------------------------------------------------

  // Group Pro sales into complete invoices
  const proInvoices = useMemo<ProInvoiceSummary[]>(() => {
    const map = new Map<string, ProInvoiceSummary>();

    // 1. Process salesHistory records where type is PRO
    salesHistory.forEach((rec, idx) => {
      if (rec.type !== CalculatorType.PRO) return;

      const recDate = rec.date;
      const invId = rec.invoiceId || `PRO-${recDate}-${rec.shopName || 'نقدي'}-${idx}`;
      const qty = rec.quantity || 0;
      const cat = rec.category || 0;
      const unitMargin = DEFAULT_PRO_COMMISSION_PER_CARD[cat] || 0;
      const itemMargin = qty * unitMargin;

      if (!map.has(invId)) {
        map.set(invId, {
          invoiceId: rec.invoiceId || invId,
          date: recDate,
          shopName: rec.shopName || 'عميل / زبون نقدي',
          totalCards: 0,
          totalAmount: 0,
          commissionMargin: 0,
          items: [],
          paymentType: rec.paymentType || 'نقد'
        });
      }

      const inv = map.get(invId)!;
      inv.totalCards += qty;
      inv.totalAmount += rec.total || 0;
      inv.commissionMargin += itemMargin;

      const existingItem = inv.items.find(i => i.category === cat);
      if (existingItem) {
        existingItem.quantity += qty;
        existingItem.totalMargin += itemMargin;
      } else {
        inv.items.push({
          category: cat,
          quantity: qty,
          unitMargin,
          totalMargin: itemMargin
        });
      }
    });

    // 2. Also check shops transactions for Pro sales that might not be in salesHistory
    shops.forEach(shop => {
      (shop.transactions || []).forEach(tx => {
        if (tx.type !== 'sale') return;
        const isProTx = shop.isPro || tx.notes?.includes('برو') || tx.notes?.includes('Pro');
        if (!isProTx) return;

        const invId = tx.invoiceId || `TX-${tx.id}`;
        // If already recorded via salesHistory, don't duplicate
        if (map.has(invId)) return;

        let totalMargin = 0;
        let totalCards = 0;
        const itemsSummary: { category: number; quantity: number; unitMargin: number; totalMargin: number }[] = [];

        if (tx.items && tx.items.length > 0) {
          tx.items.forEach(it => {
            const cat = it.category || 200;
            const qty = it.quantity || 0;
            const unitMargin = DEFAULT_PRO_COMMISSION_PER_CARD[cat] || 0;
            const margin = qty * unitMargin;
            totalCards += qty;
            totalMargin += margin;
            itemsSummary.push({
              category: cat,
              quantity: qty,
              unitMargin,
              totalMargin: margin
            });
          });
        }

        if (totalCards > 0 || totalMargin > 0) {
          map.set(invId, {
            invoiceId: invId,
            date: tx.date,
            shopName: shop.name,
            totalCards,
            totalAmount: tx.amount,
            commissionMargin: totalMargin,
            items: itemsSummary,
            paymentType: 'آجل'
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort chronologically descending
      return b.date.localeCompare(a.date);
    });
  }, [salesHistory, shops]);

  // Filter commission invoices by selected date range and search query
  const filteredCommissionInvoices = useMemo(() => {
    return proInvoices.filter(inv => {
      const inDateRange = inv.date >= rangeStart && inv.date <= rangeEnd;
      if (!inDateRange) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = inv.shopName.toLowerCase().includes(q);
        const matchId = inv.invoiceId.toLowerCase().includes(q);
        return matchName || matchId;
      }
      return true;
    });
  }, [proInvoices, rangeStart, rangeEnd, searchQuery]);

  // Commission Metrics
  const commissionMetrics = useMemo(() => {
    let totalMargin = 0;
    let totalCards = 0;
    let totalSalesAmount = 0;

    const catCounts: Record<number, number> = { 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 };
    const catMargins: Record<number, number> = { 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 };

    filteredCommissionInvoices.forEach(inv => {
      totalMargin += inv.commissionMargin;
      totalCards += inv.totalCards;
      totalSalesAmount += inv.totalAmount;

      inv.items.forEach(item => {
        catCounts[item.category] = (catCounts[item.category] || 0) + item.quantity;
        catMargins[item.category] = (catMargins[item.category] || 0) + item.totalMargin;
      });
    });

    const categoryBreakdown = Object.keys(DEFAULT_PRO_COMMISSION_PER_CARD).map(catStr => {
      const cat = parseInt(catStr, 10);
      return {
        category: cat,
        quantity: catCounts[cat] || 0,
        unitMargin: DEFAULT_PRO_COMMISSION_PER_CARD[cat] || 0,
        totalMargin: catMargins[cat] || 0
      };
    });

    return {
      totalMargin,
      totalCards,
      totalSalesAmount,
      catCounts,
      catMargins,
      categoryBreakdown
    };
  }, [filteredCommissionInvoices]);

  // -------------------------------------------------------------
  // SECTION 2: WHOLESALE MARGIN (هامش الجملة - كروت إضافية مجانية بونص)
  // -------------------------------------------------------------

  // Combine wholesale bonuses from agents transactions and manual records without duplication
  const allWholesaleRecords = useMemo<WholesaleBonusRecord[]>(() => {
    const list: WholesaleBonusRecord[] = [];
    const seenIds = new Set<string>();

    // 1. Primary Source: Agent transactions bonusCards (recorded automatically with invoices)
    agents.forEach(agent => {
      (agent.transactions || []).forEach(tx => {
        if (tx.bonusCards && tx.bonusCards.length > 0) {
          tx.bonusCards.forEach((b, idx) => {
            const uniqueId = `WBONUS-AUTO-${tx.id}-${b.category}`;
            const unitVal = b.unitValue || DEFAULT_CARD_MARKET_VALUE[b.category] || b.category;
            const totalVal = b.totalValue || (b.quantity * unitVal);
            seenIds.add(uniqueId);
            list.push({
              id: uniqueId,
              date: tx.date,
              agentId: agent.id,
              agentName: agent.name,
              invoiceNum: tx.invoiceNum || tx.id,
              category: b.category,
              quantity: b.quantity,
              unitValue: unitVal,
              totalValue: totalVal,
              notes: tx.notes || `بونص أرباح جملة (${b.quantity} كرت فئة ${b.category})`,
              createdAt: tx.date
            });
          });
        }
      });
    });

    // 2. Secondary Source: Any additional manual or standalone records stored in state
    wholesaleBonuses.forEach(rec => {
      if (!seenIds.has(rec.id)) {
        seenIds.add(rec.id);
        list.push(rec);
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [wholesaleBonuses, agents]);

  // Filter wholesale records by date range and search query
  const filteredWholesaleRecords = useMemo(() => {
    return allWholesaleRecords.filter(rec => {
      const inDateRange = rec.date >= rangeStart && rec.date <= rangeEnd;
      if (!inDateRange) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAgent = rec.agentName.toLowerCase().includes(q);
        const matchInv = (rec.invoiceNum || '').toLowerCase().includes(q);
        const matchNotes = (rec.notes || '').toLowerCase().includes(q);
        return matchAgent || matchInv || matchNotes;
      }
      return true;
    });
  }, [allWholesaleRecords, rangeStart, rangeEnd, searchQuery]);

  // Wholesale Metrics
  const wholesaleMetrics = useMemo(() => {
    let totalMargin = 0;
    let totalCards = 0;

    const catCounts: Record<number, number> = { 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 };
    const catValues: Record<number, number> = { 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 };

    filteredWholesaleRecords.forEach(rec => {
      totalMargin += rec.totalValue;
      totalCards += rec.quantity;

      catCounts[rec.category] = (catCounts[rec.category] || 0) + rec.quantity;
      catValues[rec.category] = (catValues[rec.category] || 0) + rec.totalValue;
    });

    const categoryBreakdown = Object.keys(DEFAULT_CARD_MARKET_VALUE).map(catStr => {
      const cat = parseInt(catStr, 10);
      return {
        category: cat,
        quantity: catCounts[cat] || 0,
        unitMargin: DEFAULT_CARD_MARKET_VALUE[cat] || cat,
        totalMargin: catValues[cat] || 0
      };
    });

    return {
      totalMargin,
      totalCards,
      catCounts,
      catValues,
      categoryBreakdown
    };
  }, [filteredWholesaleRecords]);

  // Handle Add Wholesale Bonus Record
  const handleSaveBonusRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusAgentName.trim()) {
      showToast('⚠️ يرجى تحديد اسم الوكيل أو المورد!', 'error');
      return;
    }
    if (bonusQuantity <= 0) {
      showToast('⚠️ يرجى إدخال عدد كروت بونص صحيح أكبر من صفر!', 'error');
      return;
    }

    const unitVal = bonusUnitValue > 0 ? bonusUnitValue : (DEFAULT_CARD_MARKET_VALUE[bonusCategory] || bonusCategory);
    const totalVal = bonusQuantity * unitVal;

    const newRecord: WholesaleBonusRecord = {
      id: 'WBONUS-' + Date.now().toString(36).toUpperCase(),
      date: bonusDate,
      agentName: bonusAgentName.trim(),
      invoiceNum: bonusInvoiceNum.trim() || undefined,
      category: bonusCategory,
      quantity: bonusQuantity,
      unitValue: unitVal,
      totalValue: totalVal,
      notes: bonusNotes.trim() || `كروت إضافية مجانية بونص جملة (فئة ${bonusCategory})`,
      createdAt: new Date().toISOString()
    };

    saveWholesaleBonuses([newRecord, ...wholesaleBonuses]);
    showToast(`✅ تم إضافة ${bonusQuantity} كرت بونص مجاني بقيمة ${totalVal} ريال بنجاح!`, 'success');

    // Reset Form
    setBonusInvoiceNum('');
    setBonusQuantity(5);
    setBonusNotes('');
    setShowAddBonusModal(false);
  };

  // Delete Wholesale Bonus
  const handleDeleteBonusRecord = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل من هامش الجملة؟')) {
      const next = wholesaleBonuses.filter(b => b.id !== id);
      saveWholesaleBonuses(next);
      showToast('🗑️ تم حذف السجل بنجاح', 'info');
    }
  };

  // -------------------------------------------------------------
  // EXPORT & PRINT HANDLERS
  // -------------------------------------------------------------

  // Excel Export
  const handleExportExcel = async () => {
    try {
      if (activeMarginTab === 'commission') {
        const excelItems: MarginExcelItem[] = filteredCommissionInvoices.map(inv => ({
          invoiceId: inv.invoiceId,
          date: inv.date,
          name: inv.shopName,
          cardSummary: inv.items.map(i => `${i.quantity} كرت فئة ${i.category}`).join('، '),
          cardsCount: inv.totalCards,
          totalInvoiceAmount: inv.totalAmount,
          marginAmount: inv.commissionMargin
        }));

        await downloadMarginReportExcel({
          title: 'تقرير هامش عمولة مبيعات برو',
          periodLabel,
          marginType: 'commission',
          totalMargin: commissionMetrics.totalMargin,
          totalCards: commissionMetrics.totalCards,
          categoryBreakdown: commissionMetrics.categoryBreakdown,
          items: excelItems
        });
        showToast('📊 تم تصدير تقرير هامش العمولة إلى Excel بنجاح!', 'success');
      } else {
        const excelItems: MarginExcelItem[] = filteredWholesaleRecords.map(rec => ({
          invoiceId: rec.invoiceNum || rec.id,
          date: rec.date,
          name: rec.agentName,
          cardSummary: `${rec.quantity} كرت بونص فئة ${rec.category} ريال`,
          cardsCount: rec.quantity,
          totalInvoiceAmount: rec.totalValue,
          marginAmount: rec.totalValue
        }));

        await downloadMarginReportExcel({
          title: 'تقرير هامش الجملة (كروت البونص المجانية)',
          periodLabel,
          marginType: 'wholesale',
          totalMargin: wholesaleMetrics.totalMargin,
          totalCards: wholesaleMetrics.totalCards,
          categoryBreakdown: wholesaleMetrics.categoryBreakdown,
          items: excelItems
        });
        showToast('📊 تم تصدير تقرير هامش الجملة إلى Excel بنجاح!', 'success');
      }
    } catch (err) {
      console.error('Failed to export excel:', err);
      showToast('⚠️ حدث خطأ أثناء تصدير ملف الإكسل!', 'error');
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const netName = getNetworkName();
    let text = '';

    if (activeMarginTab === 'commission') {
      text = `📊 *تقرير هامش العمولة (فئة Pro)*\n` +
        `🌐 *${netName}*\n` +
        `📅 *الفترة:* ${periodLabel}\n\n` +
        `💰 *إجمالي هامش العمولة:* ${commissionMetrics.totalMargin.toLocaleString()} ريال\n` +
        `🎴 *إجمالي عدد الكروت المباعة:* ${commissionMetrics.totalCards.toLocaleString()} كرت\n\n` +
        `🔍 *تفاصيل الكروت والأرباح:*\n`;

      commissionMetrics.categoryBreakdown
        .filter(c => c.quantity > 0)
        .forEach(c => {
          text += `▪️ فئة ${c.category} ريال: ${c.quantity} كرت (الربح: ${c.totalMargin} ريال)\n`;
        });

      text += `\n📋 *عدد الفواتير المسجلة:* ${filteredCommissionInvoices.length} فاتورة`;
    } else {
      text = `📦 *تقرير هامش الجملة (الكروت المجانية / البونص)*\n` +
        `🌐 *${netName}*\n` +
        `📅 *الفترة:* ${periodLabel}\n\n` +
        `💰 *إجمالي قيمة هامش الجملة:* ${wholesaleMetrics.totalMargin.toLocaleString()} ريال\n` +
        `🎁 *إجمالي عدد الكروت المجانية:* ${wholesaleMetrics.totalCards.toLocaleString()} كرت\n\n` +
        `🔍 *تفاصيل كروت البونص:*\n`;

      wholesaleMetrics.categoryBreakdown
        .filter(c => c.quantity > 0)
        .forEach(c => {
          text += `▪️ فئة ${c.category} ريال: ${c.quantity} كرت مجاني (بقيمة: ${c.totalMargin} ريال)\n`;
        });

      text += `\n📋 *عدد العمليات المسجلة:* ${filteredWholesaleRecords.length} عملية`;
    }

    openWhatsAppDirect('', text);
  };

  // Direct HTML Print for report (Thermal / Standard A4)
  const handlePrintReport = (isThermal: boolean = false) => {
    const netName = getNetworkName();
    const distName = getDistributorName();
    const distPhone = getDistributorPhone();

    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    const titleText = activeMarginTab === 'commission' ? 'تقرير هامش عمولة مبيعات برو' : 'تقرير هامش الجملة (كروت البونص المجانية)';
    const totalMargin = activeMarginTab === 'commission' ? commissionMetrics.totalMargin : wholesaleMetrics.totalMargin;
    const totalCards = activeMarginTab === 'commission' ? commissionMetrics.totalCards : wholesaleMetrics.totalCards;
    const breakdown = activeMarginTab === 'commission' ? commissionMetrics.categoryBreakdown : wholesaleMetrics.categoryBreakdown;

    let rowsHtml = '';
    if (activeMarginTab === 'commission') {
      filteredCommissionInvoices.forEach((inv, i) => {
        const cardDetails = inv.items.map(it => `${it.quantity} كرت فئة ${it.category}`).join('، ');
        rowsHtml += `
          <tr>
            <td>${i + 1}</td>
            <td>${inv.invoiceId}</td>
            <td>${inv.date}</td>
            <td style="font-weight: bold;">${inv.shopName}</td>
            <td>${cardDetails}</td>
            <td>${inv.totalCards}</td>
            <td style="font-weight: bold; color: #b91c1c;">${inv.commissionMargin.toLocaleString()} ريال</td>
          </tr>
        `;
      });
    } else {
      filteredWholesaleRecords.forEach((rec, i) => {
        rowsHtml += `
          <tr>
            <td>${i + 1}</td>
            <td>${rec.invoiceNum || rec.id}</td>
            <td>${rec.date}</td>
            <td style="font-weight: bold;">${rec.agentName}</td>
            <td>${rec.quantity} كرت فئة ${rec.category} ريال</td>
            <td>${rec.quantity}</td>
            <td style="font-weight: bold; color: #0d9488;">${rec.totalValue.toLocaleString()} ريال</td>
          </tr>
        `;
      });
    }

    let catRowsHtml = '';
    breakdown.filter(c => c.quantity > 0).forEach(c => {
      catRowsHtml += `
        <tr>
          <td>فئة ${c.category} ريال</td>
          <td style="font-weight: bold;">${c.quantity}</td>
          <td>${c.unitMargin} ريال</td>
          <td style="font-weight: bold;">${c.totalMargin.toLocaleString()} ريال</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${titleText}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            direction: rtl;
            padding: ${isThermal ? '10px' : '25px'};
            margin: 0;
            background: #fff;
            color: #111;
            font-size: ${isThermal ? '12px' : '14px'};
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          .title { font-size: 18px; font-weight: bold; margin: 4px 0; }
          .subtitle { font-size: 13px; color: #444; }
          .metrics-box {
            display: flex;
            justify-content: space-around;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
            text-align: center;
          }
          .metric-item strong { display: block; font-size: 16px; margin-top: 4px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            text-align: center;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
          }
          th { background: #f1f5f9; font-weight: bold; }
          .grand-total {
            background: #e2e8f0;
            font-weight: bold;
            font-size: 15px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 20px; font-weight: bold;">${netName}</div>
          <div class="title">${titleText}</div>
          <div class="subtitle">الفترة: ${periodLabel} • تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
          ${distName ? `<div style="font-size: 12px; margin-top: 2px;">الموزع: ${distName} ${distPhone ? `(${distPhone})` : ''}</div>` : ''}
        </div>

        <div class="metrics-box">
          <div class="metric-item">
            <span>${activeMarginTab === 'commission' ? 'إجمالي هامش العمولة' : 'إجمالي هامش الجملة'}</span>
            <strong style="color: ${activeMarginTab === 'commission' ? '#b91c1c' : '#0d9488'};">
              ${totalMargin.toLocaleString()} ريال
            </strong>
          </div>
          <div class="metric-item">
            <span>إجمالي الكروت</span>
            <strong>${totalCards.toLocaleString()} كرت</strong>
          </div>
        </div>

        <h4 style="margin: 8px 0;">تفاصيل الكروت والفوارق الربحية:</h4>
        <table>
          <thead>
            <tr>
              <th>فئة الكرت</th>
              <th>الكمية</th>
              <th>${activeMarginTab === 'commission' ? 'فارق ربح الكرت' : 'قيمة الكرت البونص'}</th>
              <th>إجمالي مبلغ الهامش</th>
            </tr>
          </thead>
          <tbody>
            ${catRowsHtml || '<tr><td colspan="4">لا توجد تفاصيل</td></tr>'}
          </tbody>
        </table>

        <h4 style="margin: 8px 0;">جدول الفواتير والعمليات:</h4>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>رمز الفاتورة</th>
              <th>التاريخ</th>
              <th>${activeMarginTab === 'commission' ? 'اسم البقالة / العميل' : 'اسم الوكيل / المورد'}</th>
              <th>تفاصيل الكروت</th>
              <th>عدد الكروت</th>
              <th>مبلغ الهامش</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7">لا توجد فواتير مسجلة في هذه الفترة</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="grand-total">
              <td colspan="5" style="text-align: right; padding-right: 15px;">الإجمالي النهائي:</td>
              <td>${totalCards.toLocaleString()}</td>
              <td style="color: ${activeMarginTab === 'commission' ? '#b91c1c' : '#0d9488'};">
                ${totalMargin.toLocaleString()} ريال
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          تم استخراج هذا التقرير آلياً عبر نظام حاسبتي • جميع الحسابات مدققة
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-20">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-7 shadow-xl border border-slate-700/60">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40">
                <BadgePercent size={24} />
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/30">
                إدارة الأرباح والهوامش
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              قسم الهامش المالي
              <span className="text-sm font-normal text-slate-300 hidden sm:inline">
                (فوارق كروت برو وبونص الجملة)
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تتبع الأرباح الناتجة عن بيع كروت فئة Pro مقارنة بالعادية، واحتساب الكروت الإضافية المجانية المكتسبة من فواتير الجملة.
            </p>
          </div>

          {/* Quick Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePrintReport(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shadow-xs border border-white/15"
              title="طباعة التقرير"
            >
              <Printer size={15} />
              <span>طباعة</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs border border-emerald-500/30"
              title="تصدير إكسل"
            >
              <Download size={15} />
              <span>Excel</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-xs border border-green-400/30"
              title="مشاركة واتساب"
            >
              <Share2 size={15} />
              <span>واتساب</span>
            </button>
          </div>
        </div>

        {/* Sub Tabs Selection (Commission vs Wholesale) */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-700/60">
          <button
            onClick={() => setActiveMarginTab('commission')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer ${
              activeMarginTab === 'commission'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/50 scale-[1.02]'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            <Percent size={18} />
            <span>هامش العمولة (فئة Pro)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-black/25">
              {commissionMetrics.totalMargin.toLocaleString()} ر.ي
            </span>
          </button>

          <button
            onClick={() => setActiveMarginTab('wholesale')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer ${
              activeMarginTab === 'wholesale'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-400/50 scale-[1.02]'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            <Coins size={18} />
            <span>هامش الجملة (كروت مجانية)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-black/25">
              {wholesaleMetrics.totalMargin.toLocaleString()} ر.ي
            </span>
          </button>
        </div>
      </div>

      {/* Time Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
          <button
            onClick={() => setFilterMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'daily'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            يومي (Daily)
          </button>
          <button
            onClick={() => setFilterMode('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            أسبوعي (Weekly)
          </button>
          <button
            onClick={() => setFilterMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            شهري (Monthly)
          </button>
          <button
            onClick={() => setFilterMode('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'custom'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            مخصص (Custom)
          </button>
        </div>

        {/* Date Pickers & Day Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {filterMode === 'daily' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="اليوم السابق"
              >
                <ChevronRight size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 px-2 cursor-pointer"
              />
              <button
                onClick={handleNextDay}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="اليوم التالي"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleTodayClick}
                className="px-2 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors"
              >
                اليوم
              </button>
            </div>
          )}

          {filterMode === 'monthly' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <CalendarDays size={16} className="text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer"
              />
            </div>
          )}

          {filterMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500">من:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 border-none outline-none"
              />
              <span className="text-slate-500">إلى:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 border-none outline-none"
              />
            </div>
          )}

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeMarginTab === 'commission' ? 'بحث بالبقالة أو الرمز...' : 'بحث بالوكيل أو الفاتورة...'}
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: COMMISSION MARGIN CONTENT */}
      {activeMarginTab === 'commission' && (
        <div className="space-y-6">
          {/* Hero Commission Metric Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-red-500/5 to-rose-500/15 dark:from-rose-950/30 dark:via-red-950/20 dark:to-rose-900/30 border border-rose-200/80 dark:border-rose-900/50 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                    إجمالي صافي هامش العمولة (فئة Pro)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-rose-700 dark:text-rose-300 mt-1 flex items-baseline gap-2">
                    {commissionMetrics.totalMargin.toLocaleString()}
                    <span className="text-lg font-bold text-rose-600/80 dark:text-rose-400/80">ريال</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    {commissionMetrics.totalCards > 0 ? (
                      <>
                        نتجت هذه العمولة عن بيع{' '}
                        <strong className="text-rose-700 dark:text-rose-300">{commissionMetrics.totalCards}</strong> كرت برو{' '}
                        (
                        {commissionMetrics.categoryBreakdown
                          .filter(c => c.quantity > 0)
                          .map(c => `${c.quantity} كرت فئة ${c.category}`)
                          .join('، ')}
                        ) خلال {periodLabel}.
                      </>
                    ) : (
                      'لا توجد مبيعات كروت برو مسجلة في هذه الفترة لتوليد عمولة.'
                    )}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-r border-rose-200/60 dark:border-rose-900/40 pt-3 sm:pt-0 sm:pr-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">إجمالي الكروت المباعة</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {commissionMetrics.totalCards.toLocaleString()} كرت
                    </div>
                  </div>
                  <div className="text-right sm:mt-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">عدد الفواتير</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {filteredCommissionInvoices.length} فاتورة
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Pricing Formula Reference Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Sparkles size={14} className="text-rose-500" />
                  جدول تسعيرة الكروت وفارق الربح المعتمد:
                </h3>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800">
                    <span>فئة 200: (170 عادي ← 180 برو)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+10 ريال</strong>
                  </li>
                  <li className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800">
                    <span>فئة 250: (210 عادي ← 230 برو)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+20 ريال</strong>
                  </li>
                  <li className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800">
                    <span>فئة 300: (260 عادي ← 270 برو)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+10 ريال</strong>
                  </li>
                  <li className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800">
                    <span>فئة 500: (420 عادي ← 450 برو)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+30 ريال</strong>
                  </li>
                  <li className="flex justify-between items-center py-0.5">
                    <span>فئة 100: (85 عادي ← 90 برو)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+5 ريال</strong>
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-slate-400 text-center">
                يتم تسجيل واحتساب الفارق الربحي تلقائياً عند كل فاتورة برو.
              </div>
            </div>
          </div>

          {/* Cards Breakdown Grid - 5 Equal Cards in a Single Row */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Layers size={16} className="text-rose-500" />
              تفصيل كميات الكروت وهوامش الربح حسب الفئة للفترة:
            </h3>
            <div className="flex flex-row items-stretch gap-2 sm:gap-3 w-full overflow-x-auto pb-1">
              {commissionMetrics.categoryBreakdown.map(cat => (
                <div
                  key={cat.category}
                  className="flex-1 min-w-[120px] sm:min-w-0 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 flex-wrap gap-1">
                      <span className="font-bold whitespace-nowrap">فئة {cat.category}</span>
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                        +{cat.unitMargin} ر.ي/كرت
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                      {cat.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">كرت</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between flex-wrap gap-1">
                    <span className="text-slate-400 font-normal">إجمالي الربح:</span>
                    <span className="font-black">{cat.totalMargin.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-rose-500" />
                  قائمة فواتير مبيعات برو المسجلة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  مرتبة زمنياً وتحتوي على اسم البقالة، تفاصيل الكروت، وهامش العمولة
                </p>
              </div>
              <div className="text-xs font-bold text-slate-500">
                إجمالي: {filteredCommissionInvoices.length} فاتورة
              </div>
            </div>

            {filteredCommissionInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <BadgePercent size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600 stroke-1" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  لا توجد فواتير مبيعات برو في هذه الفترة ({periodLabel})
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  عند إصدار أي فاتورة من تبويب "برو Pro" أو للبقالات المصنفة كـ Pro، ستظهر هنا فوراً.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">رمز الفاتورة</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">اسم البقالة / العميل</th>
                      <th className="py-3 px-4">تفاصيل الكروت</th>
                      <th className="py-3 px-4 text-center">عدد الكروت</th>
                      <th className="py-3 px-4 text-center">إجمالي الفاتورة</th>
                      <th className="py-3 px-4 text-left font-black text-rose-600 dark:text-rose-400">
                        هامش العمولة
                      </th>
                      <th className="py-3 px-4 text-center">معاينة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCommissionInvoices.map((inv, idx) => (
                      <tr
                        key={inv.invoiceId + idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {inv.invoiceId}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{inv.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Store size={14} className="text-slate-400" />
                            {inv.shopName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {inv.items.map(it => `${it.quantity} كرت فئة ${it.category}`).join('، ')}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {inv.totalCards}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                          {inv.totalAmount.toLocaleString()} ر.ي
                        </td>
                        <td className="py-3 px-4 text-left font-black text-rose-600 dark:text-rose-400 text-sm">
                          +{inv.commissionMargin.toLocaleString()} ر.ي
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors"
                            title="عرض تفاصيل الفاتورة"
                          >
                            <ExternalLink size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={5} className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200 font-black">
                        الإجمالي النهائي للفترة:
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-900 dark:text-white">
                        {commissionMetrics.totalCards.toLocaleString()} كرت
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-900 dark:text-white">
                        {commissionMetrics.totalSalesAmount.toLocaleString()} ر.ي
                      </td>
                      <td className="py-3.5 px-4 text-left font-black text-rose-600 dark:text-rose-400 text-base">
                        {commissionMetrics.totalMargin.toLocaleString()} ر.ي
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WHOLESALE MARGIN CONTENT */}
      {activeMarginTab === 'wholesale' && (
        <div className="space-y-6">
          {/* Hero Wholesale Metric Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/15 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-teal-900/30 border border-teal-200/80 dark:border-teal-900/50 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wider">
                    إجمالي قيمة هامش الجملة (كروت مجانية بونص)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-teal-700 dark:text-teal-300 mt-1 flex items-baseline gap-2">
                    {wholesaleMetrics.totalMargin.toLocaleString()}
                    <span className="text-lg font-bold text-teal-600/80 dark:text-teal-400/80">ريال</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    {wholesaleMetrics.totalCards > 0 ? (
                      <>
                        تم اكتساب ما مجموعه{' '}
                        <strong className="text-teal-700 dark:text-teal-300">{wholesaleMetrics.totalCards}</strong> كرت إضافي مجاني{' '}
                        (
                        {wholesaleMetrics.categoryBreakdown
                          .filter(c => c.quantity > 0)
                          .map(c => `${c.quantity} كرت بونص فئة ${c.category}`)
                          .join('، ')}
                        ) عند شراء كميات الجملة من الوكلاء خلال {periodLabel}.
                      </>
                    ) : (
                      'لا توجد كروت بونص جملة مسجلة في هذه الفترة.'
                    )}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-r border-teal-200/60 dark:border-teal-900/40 pt-3 sm:pt-0 sm:pr-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">إجمالي الكروت المجانية</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {wholesaleMetrics.totalCards.toLocaleString()} كرت
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddBonusModal(true)}
                    className="mt-2 sm:mt-4 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20"
                  >
                    <Plus size={16} />
                    <span>تسجيل كروت بونص</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Wholesale Margin Concept Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Coins size={14} className="text-teal-500" />
                  آلية عمل هامش الجملة:
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  يُحتسب هذا الهامش ككروت إضافية مجانية (بونص) تُكتسب عند تسجيل فواتير شراء الجملة من الوكلاء والموردين.
                  تُضاف هذه الكروت كربح صافٍ 100%، وتُقيّم بسعر السوق وتُمكّنك من متابعة مردود الشراء بالجملة.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">عدد العمليات:</span>
                <strong className="text-slate-900 dark:text-white">{filteredWholesaleRecords.length} عملية</strong>
              </div>
            </div>
          </div>

          {/* Wholesale Bonus Cards by Category - 5 Equal Cards in a Single Row */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Layers size={16} className="text-teal-500" />
              تفصيل كروت البونص المجانية المكتسبة حسب الفئة:
            </h3>
            <div className="flex flex-row items-stretch gap-2 sm:gap-3 w-full overflow-x-auto pb-1">
              {wholesaleMetrics.categoryBreakdown.map(cat => (
                <div
                  key={cat.category}
                  className="flex-1 min-w-[120px] sm:min-w-0 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 flex-wrap gap-1">
                      <span className="font-bold whitespace-nowrap">فئة {cat.category}</span>
                      <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                        بونص مجاني
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                      {cat.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">كرت</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center justify-between flex-wrap gap-1">
                    <span className="text-slate-400 font-normal">القيمة الإجمالية:</span>
                    <span className="font-black">{cat.totalMargin.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wholesale Bonus Invoices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck size={18} className="text-teal-500" />
                  قائمة فواتير مشتريات الجملة والبونص المكتسب
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  الكروت المجانية المكتسبة من الوكلاء والشركات الموردة
                </p>
              </div>
              <button
                onClick={() => setShowAddBonusModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold transition-all border border-teal-500/20"
              >
                <Plus size={14} />
                <span>إضافة بونص جديد</span>
              </button>
            </div>

            {filteredWholesaleRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Coins size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600 stroke-1" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  لا توجد كروت مجانية مسجلة في هذه الفترة ({periodLabel})
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  يمكنك تسجيل كروت بونص مجانية مكتسبة من أي وكيل بالنقر على "تسجيل كروت بونص".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">رمز / رقم الفاتورة</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">اسم الوكيل / المورد</th>
                      <th className="py-3 px-4">فئة الكرت البونص</th>
                      <th className="py-3 px-4 text-center">الكمية المجانية</th>
                      <th className="py-3 px-4 text-center">سعر الكرت</th>
                      <th className="py-3 px-4 text-left font-black text-teal-600 dark:text-teal-400">
                        هامش الجملة (الربح المكتسب)
                      </th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredWholesaleRecords.map((rec, idx) => (
                      <tr
                        key={rec.id + idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {rec.invoiceNum || rec.id}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Truck size={14} className="text-slate-400" />
                            {rec.agentName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                          فئة {rec.category} ريال
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-teal-600 dark:text-teal-400">
                          {rec.quantity} كرت
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                          {rec.unitValue} ر.ي
                        </td>
                        <td className="py-3 px-4 text-left font-black text-teal-600 dark:text-teal-400 text-sm">
                          +{rec.totalValue.toLocaleString()} ر.ي
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rec.id.startsWith('WBONUS-') && (
                            <button
                              onClick={() => handleDeleteBonusRecord(rec.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="حذف هذا السجل"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={5} className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200 font-black">
                        الإجمالي النهائي للفترة:
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-teal-600 dark:text-teal-400">
                        {wholesaleMetrics.totalCards.toLocaleString()} كرت
                      </td>
                      <td></td>
                      <td className="py-3.5 px-4 text-left font-black text-teal-600 dark:text-teal-400 text-base">
                        {wholesaleMetrics.totalMargin.toLocaleString()} ر.ي
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD WHOLESALE BONUS RECORD */}
      <AnimatePresence>
        {showAddBonusModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddBonusModal(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10"
              style={{ direction: 'rtl' }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-lg">
                  <Coins size={22} />
                  <span>تسجيل كروت بونص جملة مجانية</span>
                </div>
                <button
                  onClick={() => setShowAddBonusModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBonusRecord} className="mt-4 space-y-4 text-xs">
                {/* Agent Selection / Input */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الوكيل أو المورد *
                  </label>
                  {agents.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={bonusAgentName}
                        onChange={e => setBonusAgentName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/30 font-bold"
                      >
                        <option value="">-- اختر من قائمة الوكلاء أو اكتب أدناه --</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="أو اكتب اسم المورد مباشرة إذا لم يكن مسجلاً..."
                        value={bonusAgentName}
                        onChange={e => setBonusAgentName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/30"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="اسم الوكيل / الشركة الموردة..."
                      value={bonusAgentName}
                      onChange={e => setBonusAgentName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/30 font-bold"
                    />
                  )}
                </div>

                {/* Date & Invoice Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تاريخ الفاتورة
                    </label>
                    <input
                      type="date"
                      value={bonusDate}
                      onChange={e => setBonusDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رقم / رمز الفاتورة (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: PUR-9812"
                      value={bonusInvoiceNum}
                      onChange={e => setBonusInvoiceNum(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Category & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      فئة الكرت
                    </label>
                    <select
                      value={bonusCategory}
                      onChange={e => {
                        const cat = Number(e.target.value);
                        setBonusCategory(cat);
                        setBonusUnitValue(DEFAULT_CARD_MARKET_VALUE[cat] || cat);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value={100}>فئة 100 ريال</option>
                      <option value={200}>فئة 200 ريال</option>
                      <option value={250}>فئة 250 ريال</option>
                      <option value={300}>فئة 300 ريال</option>
                      <option value={500}>فئة 500 ريال</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      عدد الكروت المجانية (البونص)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={bonusQuantity}
                      onChange={e => setBonusQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-teal-600 dark:text-teal-400"
                    />
                  </div>
                </div>

                {/* Calculated Profit Display */}
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-teal-800 dark:text-teal-300 font-bold">
                      قيمة هامش الجملة المكتسب:
                    </span>
                    <div className="text-lg font-black text-teal-700 dark:text-teal-300">
                      {(bonusQuantity * bonusUnitValue).toLocaleString()} ريال
                    </div>
                  </div>
                  <span className="text-[10px] bg-teal-500/20 text-teal-800 dark:text-teal-200 px-2 py-1 rounded-full font-bold">
                    ربح إضافي 100%
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات أو بيان
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: بونص شراء 100 كرت من الوكيل..."
                    value={bonusNotes}
                    onChange={e => setBonusNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddBonusModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-600/30"
                  >
                    حفظ وإضافة للهامش
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VIEW PRO INVOICE DETAILS */}
      <AnimatePresence>
        {viewingInvoice && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingInvoice(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10"
              style={{ direction: 'rtl' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-base">
                  <FileText size={20} />
                  <span>تفاصيل فاتورة مبيعات برو</span>
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">رمز الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{viewingInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">التاريخ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingInvoice.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">البقالة / العميل:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingInvoice.shopName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">طريقة الدفع:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingInvoice.paymentType || 'نقد'}</span>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">تفصيل الكروت والفوارق:</h4>
                  <div className="space-y-1.5">
                    {viewingInvoice.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800"
                      >
                        <div>
                          <span className="font-bold">فئة {it.category} ريال</span>
                          <span className="text-[11px] text-slate-400 mr-2">({it.quantity} كرت)</span>
                        </div>
                        <div className="text-rose-600 dark:text-rose-400 font-bold">
                          +{it.totalMargin.toLocaleString()} ر.ي
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 text-[11px]">هامش عمولة الفاتورة:</span>
                    <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                      +{viewingInvoice.commissionMargin.toLocaleString()} ريال
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px]">إجمالي الفاتورة:</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {viewingInvoice.totalAmount.toLocaleString()} ريال
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
