import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  CalendarDays, 
  Download, 
  Share2, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Zap, 
  ArrowRightLeft,
  MessageCircle,
  MessageSquare,
  MapPin,
  X,
  Copy,
  Bell,
  Clock,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';
import { CalculatorType, SaleRecord, ShopAccount, CardCategory, AgentAccount, ShopZone } from '../types';
import { INITIAL_PRICES } from '../constants';
import { 
  downloadDetailedDailyReportPDF, 
  handleWhatsAppReportShare,
  downloadPeriodReportPDF,
  getDistributorName,
  getNetworkName,
  generateRegionalReport,
  downloadInvoicePDF,
  buildWhatsAppInvoiceText,
  buildSMSInvoiceText,
  buildScheduledReminderWhatsAppText,
  openWhatsAppDirect
} from '../utils/invoiceHelpers';
import { downloadPeriodReportExcel } from '../utils/excelHelpers';

interface ReportsPageProps {
  salesHistory: SaleRecord[];
  shops: ShopAccount[];
  zones?: ShopZone[];
  reportDate: string;
  setReportDate: React.Dispatch<React.SetStateAction<string>>;
  isDark: boolean;
  balanceLimit: number;
  handleLimitChange: (val: number) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
  prices: Record<CalculatorType, CardCategory[]>;
  agents?: AgentAccount[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  salesHistory,
  shops,
  zones = [],
  reportDate,
  setReportDate,
  isDark,
  balanceLimit,
  handleLimitChange,
  showToast,
  prices,
  agents
}) => {
  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any | null>(null);
  const [chartLimit, setChartLimit] = useState<number>(10);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [shopRegions, setShopRegions] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('dahshah_shop_regions');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const updateShopRegion = (shopId: string, region: string) => {
    const updated = { ...shopRegions, [shopId]: region };
    setShopRegions(updated);
    localStorage.setItem('dahshah_shop_regions', JSON.stringify(updated));
    showToast('تم تحديث منطقة البقالة بنجاح', 'success');
  };

  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  const handleShareZoneToWhatsApp = (zoneItem: typeof zoneFinancialBreakdown.zonesList[0]) => {
    let msg = `*📍 تقرير مالي لمربع: ${zoneItem.name} 📍*\n`;
    if (zoneItem.description) {
      msg += `📝 الوصف: ${zoneItem.description}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `💰 *إجمالي المديونية القائمة:* ${zoneItem.totalDebt.toLocaleString('ar-YE')} ريال\n`;
    msg += `📊 *نسبة المديونية من الشبكة:* ${zoneItem.debtPercent.toFixed(1)}%\n`;
    msg += `🏪 *عدد البقالات في المربع:* ${zoneItem.shopsCount} (منها ${zoneItem.debtorsCount} بقالة عليها ديون)\n`;
    msg += `📦 *مبيعات اليوم:* ${zoneItem.todaySales.toLocaleString('ar-YE')} ريال (${zoneItem.todayCards} كرت)\n`;
    msg += `💵 *إجمالي المبالغ المحصلة كاش:* ${zoneItem.cashCollected.toLocaleString('ar-YE')} ريال\n`;
    msg += `------------------------------------\n`;
    if (zoneItem.shops.length > 0) {
      msg += `🏪 *قائمة البقالات في ${zoneItem.name}:*\n`;
      zoneItem.shops.forEach((s, idx) => {
        msg += `${idx + 1}. *${s.name}*: رصيد مطلوب ${s.currentBalance.toLocaleString('ar-YE')} ريال`;
        if (s.phone) msg += ` (📞 ${s.phone})`;
        msg += `\n`;
      });
    }
    msg += `\n📅 تاريخ التقرير: ${reportDate}`;
    openWhatsAppDirect(undefined, msg);
  };

  const handleShareDebtDistributionToWhatsApp = () => {
    const activeDebtors = shops.filter(s => s.currentBalance > 0);
    const totalDebt = activeDebtors.reduce((sum, s) => sum + s.currentBalance, 0);
    const totalDebtorsCount = activeDebtors.length;
    
    const top5 = [...activeDebtors]
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 5);

    if (activeDebtors.length === 0) {
      showToast('لا توجد بقالات قائمة بمديونية حالياً لمشاركتها.', 'info');
      return;
    }

    let msg = `*📊 تقرير إحصائي لتوزيع مديونيات البقالات 📊*\n\n`;
    msg += `📌 *إجمالي المديونية القائمة:* *${totalDebt.toLocaleString('ar-YE')} ريال*\n`;
    msg += `👥 *عدد العملاء المدينين الكلي:* *${totalDebtorsCount} بقالة/عميل*\n`;
    msg += `ــــــــــــــــــــــــــــــــــــــــــــــــ\n\n`;
    msg += `🏆 *أعلى 5 عملاء ذوي مديونية حالية (المدينون الأوائل):*\n\n`;
    
    top5.forEach((shop, index) => {
      const med = shop.currentBalance.toLocaleString('ar-YE');
      const ph = shop.phone ? ` (هاتف: 967${shop.phone.trim()})` : '';
      msg += ` *${index + 1}. ${shop.name}* \n 👈 الرصيد المستحق: *${med} ريال* ${ph}\n\n`;
    });
    
    msg += `ــــــــــــــــــــــــــــــــــــــــــــــــ\n`;
    msg += `⏳ *تاريخ إصدار التقرير:* _${new Date().toLocaleDateString('ar-YE')}_\n`;
    msg += `💡 _يرجى المتابعة والتحصيل والجدولة مع العملاء لتوفير السيولة للشبكة._`;

    openWhatsAppDirect(undefined, msg);
    showToast('تم فتح تطبيق واتساب (الأخضر العادي) لمشاركة تقرير مديونيات توب 5 💬', 'success');
  };

  // 1. Daily Summary Memo (Same logic as DailyReport)
  const dailyReport = useMemo(() => {
    const targetDate = reportDate;
    const dateSales = salesHistory.filter(s => s.date === targetDate);
    
    const summary = {
      [CalculatorType.REGULAR]: { 
        100: { quantity: 0, amount: 0 }, 
        200: { quantity: 0, amount: 0 }, 
        250: { quantity: 0, amount: 0 }, 
        300: { quantity: 0, amount: 0 }, 
        500: { quantity: 0, amount: 0 } 
      },
      [CalculatorType.PRO]: { 
        100: { quantity: 0, amount: 0 }, 
        200: { quantity: 0, amount: 0 }, 
        250: { quantity: 0, amount: 0 }, 
        300: { quantity: 0, amount: 0 }, 
        500: { quantity: 0, amount: 0 } 
      },
      totalAmount: 0,
      totalCardsQuantity: 0,
      shopsWhoBought: [] as string[],
      totalReceivedAmount: 0,
      totalDebtIncreased: 0
    };

    dateSales.forEach(s => {
      // @ts-ignore
      if (summary[s.type]?.[s.category]) {
        // @ts-ignore
        summary[s.type][s.category].quantity += s.quantity;
        // @ts-ignore
        summary[s.type][s.category].amount += s.total;
      }
      summary.totalAmount += s.total;
      summary.totalCardsQuantity += s.quantity;
      if (s.shopName && s.shopName !== 'بقالة عامة' && !summary.shopsWhoBought.includes(s.shopName)) {
        summary.shopsWhoBought.push(s.shopName);
      }
    });

    // Invoices cash vs debt calculations
    const invoicesMap: Record<string, { total: number; received: number; remaining: number }> = {};
    dateSales.forEach(s => {
      const invId = s.invoiceId || (s.date + '-' + (s.shopName || 'بقالة عامة'));
      if (!invoicesMap[invId]) {
        invoicesMap[invId] = {
          total: s.totalInvoiceAmount || s.total,
          received: s.receivedAmount !== undefined ? s.receivedAmount : s.total,
          remaining: s.remainingAmount !== undefined ? s.remainingAmount : 0
        };
      }
    });
    
    const invoiceCash = Object.values(invoicesMap).reduce((sum, inv) => sum + inv.received, 0);
    const invoiceDebt = Object.values(invoicesMap).reduce((sum, inv) => sum + inv.remaining, 0);

    // Direct payments from shops on targetDate
    const directPayments = shops.reduce((sum, s) => {
      const shopPaymentsOnDate = (s.transactions || []).filter(t => t.type === 'payment' && t.date === targetDate);
      return sum + shopPaymentsOnDate.reduce((pSum, t) => pSum + t.amount, 0);
    }, 0);

    summary.totalReceivedAmount = invoiceCash + directPayments;
    summary.totalDebtIncreased = invoiceDebt;

    return summary;
  }, [salesHistory, reportDate, shops]);

  // 2. Today Invoices List
  const todayInvoices = useMemo(() => {
    const targetDate = reportDate;
    const dateSales = salesHistory.filter(s => s.date === targetDate);
    
    const invoicesMap: { [invoiceId: string]: {
      invoiceId: string;
      shopName: string;
      totalInvoiceAmount: number;
      receivedAmount: number;
      remainingAmount: number;
      paymentType: 'نقد' | 'آجل';
      itemsSummary: string;
      items: { label: string; category: number; quantity: number; price: number; total: number }[];
      type: CalculatorType;
      date: string;
    }} = {};

    dateSales.forEach(s => {
      const invId = s.invoiceId || (s.date + '-' + (s.shopName || 'بقالة عامة'));
      
      const categoryObj = prices[s.type]?.find(p => p.id === s.category);
      const catLabel = categoryObj ? categoryObj.label : `فئة ${s.category}`;
      const itemObj = {
        label: catLabel,
        category: s.category,
        quantity: s.quantity,
        price: categoryObj ? categoryObj.price : s.total / s.quantity,
        total: s.total
      };

      if (!invoicesMap[invId]) {
        invoicesMap[invId] = {
          invoiceId: invId,
          shopName: s.shopName || 'بقالة عامة',
          totalInvoiceAmount: s.totalInvoiceAmount || s.total,
          receivedAmount: s.receivedAmount !== undefined ? s.receivedAmount : s.total,
          remainingAmount: s.remainingAmount !== undefined ? s.remainingAmount : 0,
          paymentType: s.paymentType || 'نقد',
          itemsSummary: `${s.quantity}x ${catLabel}`,
          items: [itemObj],
          type: s.type,
          date: s.date
        };
      } else {
        invoicesMap[invId].itemsSummary += `، ${s.quantity}x ${catLabel}`;
        invoicesMap[invId].items.push(itemObj);
        if (!s.invoiceId) {
          invoicesMap[invId].totalInvoiceAmount += s.total;
          invoicesMap[invId].receivedAmount += s.total;
        }
      }
    });

    return Object.values(invoicesMap);
  }, [salesHistory, prices, reportDate]);

  // 2.5. Card Categories quantities sold today
  const todayCategoryQuantities = useMemo(() => {
    const targetDate = reportDate;
    const dateSales = salesHistory.filter(s => s.date === targetDate);
    
    // Default categories to display in standard order
    const catMap: Record<number, { id: number; label: string; quantity: number; amount: number }> = {
      100: { id: 100, label: 'فئة 100', quantity: 0, amount: 0 },
      200: { id: 200, label: 'فئة 200', quantity: 0, amount: 0 },
      250: { id: 250, label: 'فئة 250', quantity: 0, amount: 0 },
      300: { id: 300, label: 'فئة 300', quantity: 0, amount: 0 },
      500: { id: 500, label: 'فئة 500', quantity: 0, amount: 0 }
    };

    dateSales.forEach(s => {
      const cat = s.category;
      if (!catMap[cat]) {
        const catObj = prices[s.type]?.find(p => p.id === cat);
        catMap[cat] = {
          id: cat,
          label: catObj?.label || `فئة ${cat}`,
          quantity: 0,
          amount: 0
        };
      }
      catMap[cat].quantity += (s.quantity || 0);
      catMap[cat].amount += (s.total || 0);
    });

    return Object.values(catMap).sort((a, b) => a.id - b.id);
  }, [salesHistory, reportDate, prices]);

  // 2.6. District/Zone Financial Tracking (تحليل المبيعات والمديونيات حسب المربع والحارة)
  const zoneFinancialBreakdown = useMemo(() => {
    const totalNetworkDebt = shops.reduce((sum, s) => sum + Math.max(0, s.currentBalance || 0), 0);
    const totalNetworkSalesToday = salesHistory.filter(s => s.date === reportDate).reduce((sum, s) => sum + (s.total || 0), 0);

    const zoneMap: Record<string, {
      id: string;
      name: string;
      description?: string;
      shops: ShopAccount[];
      shopsCount: number;
      debtorsCount: number;
      totalDebt: number;
      todaySales: number;
      todayCards: number;
      allTimeSales: number;
      cashCollected: number;
      debtPercent: number;
    }> = {};

    zones.forEach(z => {
      zoneMap[z.id] = {
        id: z.id,
        name: z.name,
        description: z.description,
        shops: [],
        shopsCount: 0,
        debtorsCount: 0,
        totalDebt: 0,
        todaySales: 0,
        todayCards: 0,
        allTimeSales: 0,
        cashCollected: 0,
        debtPercent: 0
      };
    });

    const unassignedZone: typeof zoneMap[string] = {
      id: 'unassigned',
      name: 'بدون مربع (غير مصنف / عام)',
      description: 'بقالات وعملاء لم يتم إلحاقهم بمربع جغرافي محدد',
      shops: [],
      shopsCount: 0,
      debtorsCount: 0,
      totalDebt: 0,
      todaySales: 0,
      todayCards: 0,
      allTimeSales: 0,
      cashCollected: 0,
      debtPercent: 0
    };

    shops.forEach(shop => {
      let target: typeof zoneMap[string] | undefined = undefined;
      if (shop.zoneId && zoneMap[shop.zoneId]) {
        target = zoneMap[shop.zoneId];
      } else if (shop.zoneName) {
        target = Object.values(zoneMap).find(zm => zm.name.trim() === shop.zoneName?.trim());
      }
      if (!target) {
        target = unassignedZone;
      }

      target.shops.push(shop);
      target.shopsCount += 1;
      const debt = Math.max(0, shop.currentBalance || 0);
      target.totalDebt += debt;
      if (debt > 0) {
        target.debtorsCount += 1;
      }

      const directPay = (shop.transactions || [])
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      target.cashCollected += directPay;
    });

    salesHistory.forEach(s => {
      const shop = shops.find(sh => sh.name === s.shopName || sh.id === (s as any).shopId);
      let target: typeof zoneMap[string] | undefined = undefined;
      if (shop) {
        if (shop.zoneId && zoneMap[shop.zoneId]) {
          target = zoneMap[shop.zoneId];
        } else if (shop.zoneName) {
          target = Object.values(zoneMap).find(zm => zm.name.trim() === shop.zoneName?.trim());
        }
      }
      if (!target) {
        target = unassignedZone;
      }

      target.allTimeSales += (s.total || 0);
      if (s.date === reportDate) {
        target.todaySales += (s.total || 0);
        target.todayCards += (s.quantity || 0);
      }
      if (s.receivedAmount) {
        target.cashCollected += s.receivedAmount;
      }
    });

    const resultList: typeof zoneMap[string][] = [];
    Object.values(zoneMap).forEach(z => {
      z.debtPercent = totalNetworkDebt > 0 ? (z.totalDebt / totalNetworkDebt) * 100 : 0;
      resultList.push(z);
    });

    if (unassignedZone.shopsCount > 0 || unassignedZone.todaySales > 0 || unassignedZone.totalDebt > 0) {
      unassignedZone.debtPercent = totalNetworkDebt > 0 ? (unassignedZone.totalDebt / totalNetworkDebt) * 100 : 0;
      resultList.push(unassignedZone);
    }

    resultList.sort((a, b) => {
      if (b.totalDebt !== a.totalDebt) {
        return b.totalDebt - a.totalDebt;
      }
      return b.allTimeSales - a.allTimeSales;
    });

    return {
      zonesList: resultList,
      totalNetworkDebt,
      totalNetworkSalesToday
    };
  }, [zones, shops, salesHistory, reportDate]);

  // 3. Category Data for Bar Chart
  const categoryData = useMemo(() => {
    const targetDate = reportDate;
    const todaySales = salesHistory.filter(s => s.date === targetDate);
    
    return [
      { name: '100', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 100)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 100)?.quantity || 0 },
      { name: '200', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 200)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 200)?.quantity || 0 },
      { name: '250', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 250)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 250)?.quantity || 0 },
      { name: '300', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 300)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 300)?.quantity || 0 },
      { name: '500', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 500)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 500)?.quantity || 0 },
    ];
  }, [salesHistory, reportDate]);

  // 4. Trend Data for line chart
  const trends = useMemo(() => {
    const dates = [...new Set(salesHistory.map(s => s.date))].sort() as string[];
    const last7Days = dates.slice(-7);
    const last30Days = dates.slice(-30);

    const getTrendData = (targetDates: string[]) => {
      return targetDates.map(date => {
        const daySales = salesHistory.filter(s => s.date === date);
        const regularTotal = daySales.filter(s => s.type === CalculatorType.REGULAR).reduce((sum, s) => sum + s.total, 0);
        const proTotal = daySales.filter(s => s.type === CalculatorType.PRO).reduce((sum, s) => sum + s.total, 0);
        return {
          date: date.split('-').slice(1).join('/'), // MM/DD
          العادية: regularTotal,
          Pro: proTotal,
          إجمالي: regularTotal + proTotal
        };
      });
    };

    return {
      weekly: getTrendData(last7Days),
      monthly: getTrendData(last30Days)
    };
  }, [salesHistory]);

  // 5. Debtors / Overdue Shops Alert
  const overdueShops = useMemo(() => {
    return shops.filter(shop => shop.currentBalance > balanceLimit);
  }, [shops, balanceLimit]);

  // 6. Shop Debt Distribution (Recharts)
  const debtChartData = useMemo(() => {
    const sorted = [...shops]
      .filter(s => s.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
    
    return chartLimit === 0 ? sorted : sorted.slice(0, chartLimit);
  }, [shops, chartLimit]);

  // 7. Date filtered report table calculations (Shops state + status)
  const shopsTodayDetails = useMemo(() => {
    const targetDate = reportDate;
    return shops.map(shop => {
      const txsOnDate = (shop.transactions || []).filter(t => t.date === targetDate);
      if (txsOnDate.length === 0) return null;
      
      const sales = txsOnDate.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
      const payments = txsOnDate.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
      
      const net = sales - payments;
      let status = 'نقداً';
      if (net > 0) {
        status = 'رصيد موجب'; // They owe us (debt)
      } else if (net < 0) {
        status = 'رصيد سالب'; // We owe them / surplus credit
      }
      
      return {
        name: shop.name,
        sales,
        payments,
        net,
        status
      };
    }).filter(Boolean) as { name: string; sales: number; payments: number; net: number; status: string }[];
  }, [shops, reportDate]);

  // Calculate: "إجمالي المبالغ الواصلة بدون مديونية" (Total Cash fully received)
  const totalCashNoDebt = useMemo(() => {
    const targetDate = reportDate;
    const dateSales = salesHistory.filter(s => s.date === targetDate);
    
    const invoicesMap: Record<string, { total: number; received: number; remaining: number }> = {};
    dateSales.forEach(s => {
      const invId = s.invoiceId || (s.date + '-' + (s.shopName || 'بقالة عامة'));
      if (!invoicesMap[invId]) {
        invoicesMap[invId] = {
          total: s.totalInvoiceAmount || s.total,
          received: s.receivedAmount !== undefined ? s.receivedAmount : s.total,
          remaining: s.remainingAmount !== undefined ? s.remainingAmount : 0
        };
      }
    });

    return Object.values(invoicesMap)
      .filter(inv => inv.remaining === 0)
      .reduce((sum, inv) => sum + inv.received, 0);
  }, [salesHistory, reportDate]);

  const handleShareDebtDistribution = () => {
    const activeDebts = shops.filter(s => s.currentBalance > 0);
    const totalDebt = activeDebts.reduce((sum, s) => sum + s.currentBalance, 0);
    const totalDebtorsCount = activeDebts.length;
    
    const topDebtors = [...shops]
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .filter(s => s.currentBalance > 0)
      .slice(0, 5);

    let msg = `*📋 تقرير المديونيات الإجمالي للبقالات 📋*\n`;
    msg += `------------------------------------\n`;
    msg += `💰 *إجمالي الديون القائمة:* *${totalDebt.toLocaleString('ar-YE')} ريال*\n`;
    msg += `🏪 *عدد البقالات المديونة:* ${totalDebtorsCount} بقالة\n`;
    msg += `------------------------------------\n`;
    msg += `⚠️ *أعلى 5 مديونيات مطلوبة حالياً:* \n`;
    
    topDebtors.forEach((shop, index) => {
      msg += `*${index + 1}.* *${shop.name}* : ${shop.currentBalance.toLocaleString('ar-YE')} ريال\n`;
      if (shop.phone) {
        msg += `   📞 هاتف: ${shop.phone}\n`;
      }
    });
    
    msg += `------------------------------------\n`;
    msg += `💡 _يرجى التواصل مع البقالات المذكورة أعلاه لجدولة السداد وتصفية الحسابات._`;

    const option = confirm("هل تريد مشاركة تقرير المديونيات عبر الواتساب؟ (إلغاء للمشاركة عبر رسالة SMS)");
    if (option) {
      openWhatsAppDirect(undefined, msg);
    } else {
      const enc = encodeURIComponent(msg);
      window.open(`sms:?body=${enc}`, '_blank');
    }
  };

  const handleDownloadDetailedPDF = () => {
    // Generate regular items array for the date
    const regularItems = INITIAL_PRICES[CalculatorType.REGULAR].map(p => ({
      label: p.label,
      quantity: dailyReport[CalculatorType.REGULAR][p.id]?.quantity || 0,
      amount: dailyReport[CalculatorType.REGULAR][p.id]?.amount || 0
    })).filter(item => item.quantity > 0);

    // Generate pro items array for the date
    const proItems = INITIAL_PRICES[CalculatorType.PRO].map(p => ({
      label: p.label,
      quantity: dailyReport[CalculatorType.PRO][p.id]?.quantity || 0,
      amount: dailyReport[CalculatorType.PRO][p.id]?.amount || 0
    })).filter(item => item.quantity > 0);

    downloadDetailedDailyReportPDF(
      reportDate,
      dailyReport.totalCardsQuantity,
      dailyReport.totalDebtIncreased,
      dailyReport.totalReceivedAmount,
      totalCashNoDebt,
      shopsTodayDetails,
      regularItems,
      proItems
    );
    showToast('تم تصدير وتحميل تقرير الأداء والحسابات التفصيلي بنجاح! 📁', 'success');
  };

  const handleGeneratePeriodPDF = async (type: 'weekly' | 'monthly') => {
    try {
      const end = new Date(reportDate);
      const start = new Date(end);
      if (type === 'weekly') {
        start.setDate(end.getDate() - 6);
      } else {
        start.setDate(end.getDate() - 29);
      }
      const startDate = start.toISOString().split('T')[0];
      const endDate = reportDate;

      const periodSales = salesHistory.filter(s => s.date >= startDate && s.date <= endDate);

      const categoriesList = [100, 200, 250, 300, 500];
      const cardSales = categoriesList.map(cat => {
        const catSales = periodSales.filter(s => Number(s.category) === cat);
        const totalQty = catSales.reduce((sum, s) => sum + s.quantity, 0);
        const totalAmount = catSales.reduce((sum, s) => sum + s.total, 0);
        
        let label = `فئة ${cat}`;
        const regObj = prices?.REGULAR?.find(p => p.id === cat);
        const proObj = prices?.PRO?.find(p => p.id === cat);
        if (regObj) label = regObj.label;
        else if (proObj) label = proObj.label;
        
        return {
          label,
          quantity: totalQty,
          total: totalAmount
        };
      });

      const groceriesPerformance = shops.map(shop => {
        const shopSales = periodSales.filter(s => s.shopName === shop.name);
        const q100 = shopSales.filter(s => Number(s.category) === 100).reduce((sum, s) => sum + s.quantity, 0);
        const q200 = shopSales.filter(s => Number(s.category) === 200).reduce((sum, s) => sum + s.quantity, 0);
        const q250 = shopSales.filter(s => Number(s.category) === 250).reduce((sum, s) => sum + s.quantity, 0);
        const q300 = shopSales.filter(s => Number(s.category) === 300).reduce((sum, s) => sum + s.quantity, 0);
        const q500 = shopSales.filter(s => Number(s.category) === 500).reduce((sum, s) => sum + s.quantity, 0);
        const total = shopSales.reduce((sum, s) => sum + s.total, 0);
        return {
          name: shop.name,
          isPro: !!shop.isPro,
          q100,
          q200,
          q250,
          q300,
          q500,
          total
        };
      });

      // Sort descending by total sales
      groceriesPerformance.sort((a, b) => b.total - a.total);

      // New shops in this period
      const newGroceries = shops
        .filter(s => s.createdAt && s.createdAt >= startDate && s.createdAt <= endDate)
        .map(s => s.name);

      // Inactive shops in this period (no sales and no payment transaction in last 5 days)
      const inactiveGroceries = shops.map(shop => {
        const dates: Date[] = [new Date(shop.createdAt)];
        
        const shopSalesAll = salesHistory.filter(s => s.shopName === shop.name);
        shopSalesAll.forEach(s => {
          if (s.date) dates.push(new Date(s.date));
        });
        
        (shop.transactions || []).forEach(t => {
          if (t.date) dates.push(new Date(t.date));
        });
        
        const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const endDay = new Date(reportDate);
        const diffTime = endDay.getTime() - latestDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          name: shop.name,
          days: diffDays,
          latestDateStr: latestDate.toISOString().split('T')[0]
        };
      })
      .filter(item => item.days >= 5)
      .map(item => `${item.name} (خامل منذ ${item.days} أيام - آخر حركة: ${item.latestDateStr})`);

      // Financials
      const totalSales = periodSales.reduce((sum, s) => sum + s.total, 0);
      
      const invoicesMap: Record<string, { total: number; received: number }> = {};
      periodSales.forEach(s => {
        const invId = s.invoiceId || (s.date + '-' + (s.shopName || 'بقالة عامة'));
        if (!invoicesMap[invId]) {
          invoicesMap[invId] = {
            total: s.totalInvoiceAmount || s.total,
            received: s.receivedAmount !== undefined ? s.receivedAmount : s.total
          };
        }
      });
      const salesCashCollected = Object.values(invoicesMap).reduce((sum, inv) => sum + inv.received, 0);

      const directPayments = shops.reduce((sum, s) => {
        const shopPayments = (s.transactions || []).filter(
          t => t.type === 'payment' && t.date >= startDate && t.date <= endDate
        );
        return sum + shopPayments.reduce((pSum, t) => pSum + t.amount, 0);
      }, 0);

      const totalCollected = salesCashCollected + directPayments;
      const totalDebt = totalSales - totalCollected;

      showToast(`جاري إنشاء وتحميل التقرير الموحد... ⏳`, 'info');

      const result = await downloadPeriodReportPDF({
        reportType: type,
        startDate,
        endDate,
        distributorName: getDistributorName() || "الموزع المعتمد",
        networkName: getNetworkName() || "اسم الشبكة",
        cardSales,
        groceriesPerformance,
        newGroceries,
        inactiveGroceries,
        financials: {
          totalSales,
          totalCollected,
          totalDebt
        }
      });

      if (result.success) {
        showToast(`تم تصدير وتحميل تقرير الفترة الموحد بنجاح! 📁 (${result.fileName})`, 'success');
      } else {
        showToast('فشل في تصدير تقرير الفترة الموحد.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`حدث خطأ أثناء تصدير التقرير: ${err.message || err}`, 'error');
    }
  };

  const handleGeneratePeriodExcel = async (type: 'weekly' | 'monthly' | 'custom') => {
    try {
      let startDate = '';
      let endDate = '';

      if (type === 'weekly') {
        const end = new Date(reportDate);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        startDate = start.toISOString().split('T')[0];
        endDate = reportDate;
      } else if (type === 'monthly') {
        const end = new Date(reportDate);
        const start = new Date(end);
        start.setDate(end.getDate() - 29);
        startDate = start.toISOString().split('T')[0];
        endDate = reportDate;
      } else {
        if (!customStartDate || !customEndDate) {
          showToast('يرجى تحديد تاريخ البدء وتاريخ الانتهاء للتقرير الاختياري ⚠️', 'error');
          return;
        }
        startDate = customStartDate;
        endDate = customEndDate;
      }

      showToast('جاري توليد التقرير المالي بصيغة Excel... ⏳', 'info');
      await downloadPeriodReportExcel({
        startDate,
        endDate,
        salesHistory,
        shops,
        reportType: type,
        agents
      });
      showToast('تم تحميل التقرير المالي (Excel) بنجاح! 🟢', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`حدث خطأ أثناء تصدير ملف Excel: ${err.message || err}`, 'error');
    }
  };

  return (
    <div className="p-4 space-y-6 text-right pb-16" style={{ direction: 'rtl' }}>
      
      {/* 1. بطاقة إجمالي دخل ومعاملات اليوم */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 rounded-[2.2rem] text-white shadow-xl shadow-blue-500/15 text-right space-y-3 relative overflow-hidden"
      >
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between flex-wrap gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-200" />
            </div>
            <h3 className="font-extrabold text-white text-sm">إجمالي دخل ومعاملات اليوم</h3>
          </div>
          <span className="text-[10px] font-bold bg-white/15 text-blue-100 border border-white/20 px-2.5 py-0.5 rounded-lg">
            كافة الفواتير (نقداً + آجلاً)
          </span>
        </div>

        <div className="space-y-1 relative z-10">
          <div className="text-3xl sm:text-4xl font-black font-sans leading-tight flex items-baseline gap-1.5 text-white">
            {dailyReport.totalAmount.toLocaleString('ar-YE')}
            <span className="text-xs font-normal opacity-85 text-blue-200">ريال يمني</span>
          </div>
          <p className="text-[11px] text-blue-200/80 font-bold">
            حاصل جمع القيمة الإجمالية لجميع فواتير المبيعات المدخلة اليوم (سواء كانت نقداً أو آجلاً).
          </p>
        </div>
      </motion.div>

      {/* 2. بطاقة المبلغ المستلم (كاش) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="p-5 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-[2.2rem] text-white shadow-xl shadow-emerald-500/15 text-right space-y-3 relative overflow-hidden"
      >
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between flex-wrap gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Zap size={18} className="text-emerald-200" />
            </div>
            <h3 className="font-extrabold text-white text-sm">المبلغ المستلم (كاش)</h3>
          </div>
          <span className="text-[10px] font-bold bg-emerald-400/25 text-emerald-100 border border-emerald-300/30 px-2.5 py-0.5 rounded-lg">
            السيولة النقدية الفعلية بالصندوق
          </span>
        </div>

        <div className="space-y-1 relative z-10">
          <div className="text-3xl sm:text-4xl font-black font-sans leading-tight flex items-baseline gap-1.5 text-emerald-100">
            {dailyReport.totalReceivedAmount.toLocaleString('ar-YE')}
            <span className="text-xs font-normal opacity-85 text-emerald-200">ريال يمني</span>
          </div>
          <div className="pt-2 border-t border-white/15 flex items-center justify-between flex-wrap gap-1 text-[10.5px] text-emerald-100/90 font-bold">
            <span>يشمل: فواتير نقدية كاملة + واصل الفواتير المختلطة + سندات القبض والتحصيلات</span>
          </div>
        </div>
      </motion.div>

      {/* 3. بطاقة عدد الكروت المباعة والتفصيل الداخلي */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="p-5 bg-white dark:bg-slate-900 rounded-[2.2rem] border border-slate-150 dark:border-slate-800 shadow-sm text-right space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">عدد الكروت المباعة</h3>
          </div>
          <span className="text-[11px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-0.5 rounded-xl font-sans">
            إجمالي {dailyReport.totalCardsQuantity.toLocaleString('ar-YE')} كرت
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-3xl sm:text-4xl font-black font-sans text-slate-900 dark:text-white">
            {dailyReport.totalCardsQuantity.toLocaleString('ar-YE')}
            <span className="text-xs font-normal text-slate-400 mr-1.5">كرت مباع اليوم</span>
          </div>
        </div>

        {/* التفصيل الداخلي: 5 مربعات صغيرة جداً متجاورة في صف واحد */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 font-extrabold block">
            تفصيل الكميات المباعة حسب الفئة:
          </span>
          <div className="flex flex-row items-stretch gap-1.5 sm:gap-2.5 w-full overflow-x-auto pb-1">
            {[100, 200, 250, 300, 500].map((catId) => {
              const catData = todayCategoryQuantities.find(c => c.id === catId) || { id: catId, label: `فئة ${catId}`, quantity: 0, amount: 0 };
              return (
                <div 
                  key={catId} 
                  className="flex-1 min-w-[58px] sm:min-w-0 p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center flex flex-col justify-between items-center transition-all hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap block">
                    فئة {catId}
                  </span>
                  <div className="text-base sm:text-lg font-black font-sans text-slate-900 dark:text-white leading-tight my-0.5">
                    {catData.quantity.toLocaleString('ar-YE')}
                  </div>
                  <span className="text-[8.5px] font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {catData.quantity > 0 ? `${catData.amount.toLocaleString('ar-YE')} ر.ي` : '0 كرت'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 4. بطاقة المديونية المرتفعة (الآجل الجديد) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-rose-500/10 dark:from-amber-950/30 dark:to-rose-950/20 rounded-[2.2rem] border border-amber-300/60 dark:border-amber-700/40 shadow-sm text-right space-y-3"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              المديونية المرتفعة (الآجل الجديد)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-lg">
            ديون اليوم فقط من الفواتير
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div className="text-2xl sm:text-3xl font-black font-sans text-amber-700 dark:text-amber-400">
            {dailyReport.totalDebtIncreased.toLocaleString('ar-YE')}
            <span className="text-xs font-normal text-slate-500 mr-1.5">ريال يمني</span>
          </div>
          <div className="text-[11px] font-bold text-slate-400">
            قيمة فواتير الآجل بالكامل + المتبقي غير المسدد من الفواتير المختلطة لليوم.
          </div>
        </div>
      </motion.div>

      {/* ومن ثم تحته: البقالات التي ابتاعت كروت (وتحتوي على البقالات التي أخذت كروت بفواتير اليوم) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-right"
      >
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="text-blue-600 dark:text-blue-400" size={19} />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              البقالات التي ابتاعت كروت
            </h3>
          </div>
          <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-lg font-sans">
            {todayInvoices.length} بقالة / فاتورة اليوم
          </span>
        </div>

        {todayInvoices.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            لم يتم تسجيل أي فواتير بيع كروت للبقالات في هذا اليوم ({reportDate}).
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {todayInvoices.map((inv, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedInvoiceDetail(inv)}
                className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/70 shadow-xs hover:border-blue-300 transition-all cursor-pointer active:scale-[0.99] space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 dark:text-white text-xs">{inv.shopName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                    inv.paymentType === 'آجل' 
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}>
                    {inv.paymentType === 'آجل' ? 'فاتورة آجل (دين)' : 'فاتورة نقدية (خالصة)'}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  الكروت المشتراة: {inv.itemsSummary}
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-200/50 dark:border-slate-800/50 font-sans">
                  <span className="text-slate-500 font-bold">
                    إجمالي الفاتورة: <strong className="text-slate-900 dark:text-white font-black">{inv.totalInvoiceAmount.toLocaleString('ar-YE')} ر.ي</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    الواصل كاش: <strong className="font-black">{inv.receivedAmount.toLocaleString('ar-YE')} ر.ي</strong>
                  </span>
                  <span className={inv.remainingAmount > 0 ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                    المتبقي آجل: <strong className="font-black">{inv.remainingAmount.toLocaleString('ar-YE')} ر.ي</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 2. تنبيه مديونيات البقالات المتجاوزة للحد (تنبيهات مرئية بارزة) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">البقالات المتجاوزة لحد المديونية</h3>
          </div>
          <span className="text-[10px] font-black bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-lg font-sans">
            الحد الحالي: {balanceLimit.toLocaleString('ar-YE')} ريال
          </span>
        </div>

        {/* Limit Slider Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleLimitChange(Math.max(1000, balanceLimit - 1000))}
              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-sm flex items-center justify-center cursor-pointer active:scale-90 select-none transition-transform"
            >
              -
            </button>
            <input 
              type="number"
              value={balanceLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value) || 0)}
              className="w-20 h-8 text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-sans font-black outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleLimitChange(balanceLimit + 1000)}
              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-sm flex items-center justify-center cursor-pointer active:scale-90 select-none transition-transform"
            >
              +
            </button>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">تعديل حد الأمان للمديونية:</span>
        </div>

        {overdueShops.length === 0 ? (
          <div className="text-center py-4 bg-emerald-50/30 dark:bg-emerald-950/5 rounded-2xl border border-dashed border-emerald-100 dark:border-emerald-900/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            🎉 ممتاز كلياً! جميع البقالات ملتزمة ومستمرة بحد مديونية آمن.
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {overdueShops.map(shop => (
              <div 
                key={shop.id} 
                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100/50 dark:border-red-950/20 flex items-center justify-between text-right gap-3 shadow-sm hover:border-red-200 transition-colors"
              >
                <button
                  onClick={() => {
                    let msg = `*🔄 تذكير مستعجل بسداد المديونية المتراكمة 🔄*\n\n`;
                    msg += `الأخوة الكرام في *${shop.name}* محترمين،\n`;
                    msg += `نود إحاطتكم وتذكيركم بأن مديونيتكم المتراكمة قد تجاوزت حد الأمان المسموح وبلغت حالياً:\n`;
                    msg += `🚨 *${shop.currentBalance.toLocaleString('ar-YE')} ريال يمني*\n\n`;
                    msg += `يرجى التفضل بالمبادرة بسداد الحساب أو دفعة منه لتحديث حساباتكم واستمرار المعاملات وتوريد كروت الشبكة بشكل طبيعي.\n`;
                    msg += `------------------------------------\n`;
                    msg += `شكراً جزيلاً لتعاونكم وثقتكم بنا! ✨`;
                    
                    const destPhone = shop.phone?.trim() ? shop.phone.trim() : '';
                    openWhatsAppDirect(destPhone, msg);
                    showToast(`تم فتح واتساب لتنبيه بقالة ${shop.name}`, 'success');
                  }}
                  className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1 shrink-0 font-sans"
                >
                  تنبيه سريع 💬
                </button>

                <div className="space-y-1">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">{shop.name}</h5>
                  <div className="flex items-center gap-2 justify-end text-[10px] font-sans font-bold">
                    <span className="text-red-500 font-extrabold">{shop.currentBalance.toLocaleString('ar-YE')} ريال مستحق</span>
                    {shop.phone && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-400 font-bold">{shop.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* تنبيهات المديونيات المجدولة (واتساب) */}
      {(() => {
        const today = new Date().toISOString().split('T')[0];
        const dueReminders = shops.filter(s => {
          if (s.currentBalance <= 0) return false;
          if (s.showDebtAlert && s.reminderDueDate) {
            return true;
          }
          if (s.reminderDueDate && s.reminderDueDate <= today) {
            return true;
          }
          return s.showDebtAlert === true;
        });

        if (dueReminders.length === 0) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-amber-500/10 dark:bg-amber-500/5 rounded-[2.2rem] border border-amber-500/30 space-y-4 text-right shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bell className="text-amber-500 animate-pulse" size={20} />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  🔔 تنبيهات تذكيرات المديونيات المجدولة (واتساب)
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm">
                {dueReminders.length} بقالة تستحق المتابعة
              </span>
            </div>

            <div className="space-y-2.5">
              {dueReminders.map(shop => {
                const isDue = !shop.reminderDueDate || shop.reminderDueDate <= today;
                return (
                  <div 
                    key={shop.id}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 justify-end sm:justify-start">
                        <span className="text-base">{shop.emoji || '🔴'}</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{shop.name}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isDue 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40'
                        }`}>
                          {isDue ? '🚨 مستحق التذكير' : `⏳ موعد التذكير: ${shop.reminderDueDate}`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 justify-end sm:justify-start">
                        <span>الرصيد المستحق: <strong className="text-rose-600 font-sans font-black">{shop.currentBalance.toLocaleString('ar-YE')} ريال</strong></span>
                        {shop.phone && <span>الهاتف: <strong className="font-sans font-bold">{shop.phone}</strong></span>}
                      </div>
                      {shop.reminderNotes && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          📝 {shop.reminderNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        onClick={() => {
                          const msg = buildScheduledReminderWhatsAppText({
                            shopName: shop.name,
                            currentBalance: shop.currentBalance,
                            dueDate: shop.reminderDueDate,
                            reminderDays: shop.reminderDays,
                            notes: shop.reminderNotes
                          });
                          openWhatsAppDirect(shop.phone, msg);
                          showToast('تم فتح واتساب لإرسال رسالة التذكير 💬', 'success');
                        }}
                        className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        <MessageCircle size={14} />
                        <span>تذكير واتس 💬</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* 3. توزيع أرصدة مديونيات البقالات */}
      {shops.length > 0 && (
        <motion.div 
          id="debt-distribution-chart-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-right"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-50 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="text-indigo-500" size={20} />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">توزيع أرصدة مديونيات البقالات</h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareDebtDistributionToWhatsApp}
                title="مشاركة تقرير المديونيات وأعلى 5 مدينين عبر واتساب الأخضر"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-sm transition-all"
              >
                <MessageCircle size={14} className="text-white" />
                <span>مشاركة المديونيات (توب 5) 💬</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
                {[5, 10, 0].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setChartLimit(limit)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      chartLimit === limit
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {limit === 0 ? 'الكل' : `${limit} الأكثر`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {debtChartData.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold leading-normal">
              لا توجد حسابات قائمة بمديونية حالياً لعرض مخطط التوزيع.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64 w-full" style={{ direction: 'ltr' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={debtChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#020617' : '#ffffff', 
                        borderRadius: '16px', 
                        border: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                        textAlign: 'right'
                      }}
                    />
                    <Bar dataKey="currentBalance" name="الرصيد المستحق" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleShareDebtDistribution}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-black cursor-pointer shadow-sm"
                >
                  <Share2 size={14} />
                  <span>تصدير ومشاركة تقرير المديونيات الموزعة 📱</span>
                </button>

                <button
                  onClick={() => {
                    const activeDebts = shops.filter(s => s.currentBalance > 0);
                    const totalDebt = activeDebts.reduce((sum, s) => sum + s.currentBalance, 0);
                    const totalDebtorsCount = activeDebts.length;
                    
                    const topDebtors = [...shops]
                      .sort((a, b) => b.currentBalance - a.currentBalance)
                      .filter(s => s.currentBalance > 0)
                      .slice(0, 5);

                    let msg = `*📋 تقرير المديونيات الإجمالي للبقالات 📋*\n`;
                    msg += `------------------------------------\n`;
                    msg += `💰 *إجمالي الديون القائمة:* *${totalDebt.toLocaleString('ar-YE')} ريال*\n`;
                    msg += `🏪 *عدد البقالات المديونة:* ${totalDebtorsCount} بقالة\n`;
                    msg += `------------------------------------\n`;
                    msg += `⚠️ *أعلى 5 مديونيات مطلوبة حالياً:* \n`;
                    
                    topDebtors.forEach((shop, index) => {
                      msg += `*${index + 1}.* *${shop.name}* : ${shop.currentBalance.toLocaleString('ar-YE')} ريال\n`;
                      if (shop.phone) {
                        msg += `   📞 هاتف: ${shop.phone}\n`;
                      }
                    });
                    
                    msg += `------------------------------------\n`;
                    msg += `💡 _يرجى التواصل مع البقالات المذكورة أعلاه لجدولة السداد وتصفية الحسابات._`;

                    openWhatsAppDirect(undefined, msg);
                    showToast('تم فتح واتساب لمشاركة التقرير 💬', 'success');
                  }}
                  className="w-full py-3 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950 text-green-600 dark:text-green-400 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-black cursor-pointer shadow-sm border border-green-200/50 dark:border-green-900/30"
                >
                  <MessageCircle size={15} className="text-green-600 dark:text-green-400" />
                  <span>مشاركة التقرير عبر الواتساب مباشرة 💬</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 3.5. تحليل وتوزيع المبيعات والمديونيات حسب المربعات والحارات (District-wise Financial Tracking) */}
      <motion.div 
        id="district-wise-tracking-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-right"
      >
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="text-amber-500" size={20} />
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                توزيع المبيعات والمديونيات حسب المربع والحارة
              </h4>
              <p className="text-[10px] text-slate-400 font-bold">
                تتبع مالي جغرافي دقيق للمربعات (District-wise Financial Tracking)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-lg">
            {zoneFinancialBreakdown.zonesList.length} مربعات مسجلة
          </span>
        </div>

        {/* High level KPI Row for Districts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي ديون المربعات:</span>
            <span className="text-base font-black font-sans text-red-500">
              {zoneFinancialBreakdown.totalNetworkDebt.toLocaleString('ar-YE')} ر.ي
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 block">مبيعات اليوم بالمربعات:</span>
            <span className="text-base font-black font-sans text-indigo-600 dark:text-indigo-400">
              {zoneFinancialBreakdown.totalNetworkSalesToday.toLocaleString('ar-YE')} ر.ي
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي عدد البقالات:</span>
            <span className="text-base font-black font-sans text-slate-900 dark:text-white">
              {shops.length} بقالة
            </span>
          </div>
        </div>

        {/* List of Zones */}
        <div className="space-y-3 pt-1">
          {zoneFinancialBreakdown.zonesList.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              لا توجد مربعات مضافة حالياً. يمكنك إضافة مربعات وربط البقالات بها من شاشة البقالات.
            </div>
          ) : (
            zoneFinancialBreakdown.zonesList.map((z) => {
              const isExpanded = expandedZoneId === z.id;
              return (
                <div 
                  key={z.id}
                  className="bg-slate-50/80 dark:bg-slate-950/70 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-3.5 space-y-3 transition-all"
                >
                  {/* Zone Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-black">
                        📍
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {z.name}
                          </h5>
                          <span className="text-[9px] font-bold px-2 py-0.2 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                            {z.shopsCount} بقالة
                          </span>
                        </div>
                        {z.description && (
                          <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{z.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleShareZoneToWhatsApp(z)}
                        title="مشاركة تقرير هذا المربع عبر الواتساب"
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-xs flex items-center gap-1 transition-all"
                      >
                        <MessageCircle size={12} />
                        <span>مشاركة واتساب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedZoneId(isExpanded ? null : z.id)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs transition-all"
                      >
                        {isExpanded ? 'إخفاء البقالات 🔼' : 'عرض البقالات 🔽'}
                      </button>
                    </div>
                  </div>

                  {/* Zone Financial Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-right">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">إجمالي الديون القائمة:</span>
                      <span className="text-xs font-black font-sans text-red-500 block mt-0.5">
                        {z.totalDebt.toLocaleString('ar-YE')} ر.ي
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        ({z.debtPercent.toFixed(1)}% من ديون الشبكة)
                      </span>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">مبيعات اليوم:</span>
                      <span className="text-xs font-black font-sans text-indigo-600 dark:text-indigo-400 block mt-0.5">
                        {z.todaySales.toLocaleString('ar-YE')} ر.ي
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        ({z.todayCards} كرت اليوم)
                      </span>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">إجمالي المبيعات التراكمية:</span>
                      <span className="text-xs font-black font-sans text-slate-800 dark:text-slate-200 block mt-0.5">
                        {z.allTimeSales.toLocaleString('ar-YE')} ر.ي
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        كافة العمليات
                      </span>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">المبالغ المحصلة كاش:</span>
                      <span className="text-xs font-black font-sans text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        {z.cashCollected.toLocaleString('ar-YE')} ر.ي
                      </span>
                      <span className="text-[8px] font-bold text-emerald-500">
                        واصل ونقد مستلم
                      </span>
                    </div>
                  </div>

                  {/* Visual Debt Share Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>حصة المربع من إجمالي ديون الشبكة:</span>
                      <span className="font-sans font-black text-slate-700 dark:text-slate-300">{z.debtPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          z.debtPercent > 40 ? 'bg-red-500' : z.debtPercent > 20 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, z.debtPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Expandable Shops List for this Zone */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 block">
                        البقالات التابعة لـ ({z.name}):
                      </span>
                      {z.shops.length === 0 ? (
                        <p className="text-[10px] text-slate-400 py-1">لا توجد بقالات مضافة لهذا المربع بعد.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {z.shops.map((shop) => (
                            <div 
                              key={shop.id}
                              className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-right"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">{shop.emoji || '🏪'}</span>
                                <div>
                                  <span className="text-[11px] font-black text-slate-900 dark:text-white block">
                                    {shop.name}
                                  </span>
                                  {shop.phone && (
                                    <span className="text-[9px] text-slate-400 font-sans block">{shop.phone}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-left font-sans">
                                <span className={`text-[11px] font-black block ${shop.currentBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {shop.currentBalance.toLocaleString('ar-YE')} ر.ي
                                </span>
                                <span className="text-[8px] text-slate-400">
                                  {shop.currentBalance > 0 ? 'مستحق' : 'خالص'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action button to export full regional PDF report */}
        <button
          onClick={async () => {
            const reportData = shops.map(shop => {
              let regionName = shop.zoneName;
              if (!regionName && shop.zoneId) {
                const matchedZone = zones.find(z => z.id === shop.zoneId);
                if (matchedZone) regionName = matchedZone.name;
              }
              if (!regionName && shopRegions[shop.id]) {
                regionName = shopRegions[shop.id];
              }
              return {
                name: shop.name,
                debt: shop.currentBalance,
                region: (regionName || 'المربع العام / بدون تصنيف').trim()
              };
            });
            
            showToast('جاري تحضير وتصدير تقرير المربعات بـ PDF...', 'info');
            const res = await generateRegionalReport(reportData);
            if (res && res.success) {
              showToast(`🎉 تم تصدير تقرير المربعات بنجاح بملف: ${res.fileName}`, 'success');
            } else {
              showToast('عذراً، فشل تصدير التقرير المالي.', 'error');
            }
          }}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>توليد وتصدير تقرير المربعات والديون الموزعة (PDF) 📃</span>
        </button>
      </motion.div>

      {/* 4. فلترة بالتاريخ لتنزيل التقرير */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-right"
      >
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-blue-500" size={20} />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">فلترة بالتاريخ وتصدير التقارير</h4>
          </div>
          <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-sans">{reportDate}</span>
        </div>

        {/* Date Selector input */}
        <input 
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-sans font-black outline-none focus:border-blue-500 transition-colors text-right"
        />

        {/* Dynamic visual preview of the filtered report data table */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center text-xs font-extrabold text-slate-500 pb-2 border-b border-slate-200/50 dark:border-slate-800">
            <span>بيانات ومعاملات تاريخ: {reportDate}</span>
            <span className="text-blue-600 dark:text-blue-400 font-sans">{shopsTodayDetails.length} حركة مسجلة</span>
          </div>

          {/* Simple Bento stats inside date filter */}
          <div className="grid grid-cols-2 gap-2 text-right">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-bold">عدد الكروت المباعة</span>
              <span className="text-md font-black font-sans text-slate-800 dark:text-white">{dailyReport.totalCardsQuantity} كرت</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-bold">إجمالي المديونية (الآجل)</span>
              <span className="text-md font-black font-sans text-amber-500">{dailyReport.totalDebtIncreased.toLocaleString('ar-YE')} ريال</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-bold">إجمالي التسديدات والواصل</span>
              <span className="text-md font-black font-sans text-green-500">{dailyReport.totalReceivedAmount.toLocaleString('ar-YE')} ريال</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-bold">المبالغ الواصلة نقداً بالكامل</span>
              <span className="text-md font-black font-sans text-blue-500">{totalCashNoDebt.toLocaleString('ar-YE')} ريال</span>
            </div>
          </div>

          {/* Shops transactions status table as requested */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-500 block">تفاصيل حركة حسابات البقالات (رصيد سالب، رصيد موجب، نقداً):</span>
            
            {shopsTodayDetails.length === 0 ? (
              <div className="text-center py-4 bg-white/50 dark:bg-slate-900/40 text-xs font-bold text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                لا توجد معاملات حسابية للبقالات في هذا التاريخ.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {shopsTodayDetails.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center text-xs">
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white">{item.name}</span>
                      <div className="flex gap-2 text-[9px] font-bold text-slate-400 font-sans">
                        <span>مبيعات: {item.sales}</span>
                        <span>واصل: {item.payments}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${
                        item.status === 'رصيد موجب' 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                          : item.status === 'رصيد سالب' 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                      <span className="font-black font-sans text-slate-700 dark:text-slate-300">
                        {item.net !== 0 ? `${Math.abs(item.net)} ريال` : 'خالص'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleDownloadDetailedPDF}
            className="w-full mt-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>تنزيل التقرير المالي والحسابي التفصيلي الموحد (PDF) 📁</span>
          </button>

          {/* Excel Reports Section */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>📊 تقارير مبيعات وحسابات البقالات (Excel)</span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              تنزيل تقارير مبيعات وحسابات الفترات منسقة بالألوان والخطوط مع تفاصيل مبيعات الفئات (100، 200، 250، 300، 500) واصل الحساب وصافي المتبقي لكل بقالة.
            </p>

            {/* Standard Period Reports */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => handleGeneratePeriodExcel('weekly')}
                className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
              >
                <CalendarDays size={13} />
                <span>تنزيل التقرير الأسبوعي (Excel) 🟢</span>
              </button>
              <button
                onClick={() => handleGeneratePeriodExcel('monthly')}
                className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 active:scale-95 transition-all cursor-pointer"
              >
                <CalendarDays size={13} />
                <span>تنزيل التقرير الشهري (Excel) 🟢</span>
              </button>
            </div>

            {/* Custom Selective Report Section */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80 mt-3 space-y-4 text-right shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">تخصيص حر وفوري للفترة الزمنية</span>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>📅 التقرير المالي للفترة المخصصة (Excel)</span>
                </span>
              </div>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                حدد البداية والنهاية لأي فترة زمنية وسيقوم النظام بتجميع ومطابقة مبيعات الكروت، إجمالي الدفعات، الدين المتبقي، وإحصائيات الكمية لكل بقالة بدقة وتوليد ملف مالي جاهز.
              </p>

              {/* Quick Period Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    setCustomStartDate(start.toISOString().split('T')[0]);
                    setCustomEndDate(end.toISOString().split('T')[0]);
                    showToast('تم ضبط الفترة على آخر 30 يوماً 📅', 'info');
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-100/40 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-[10px] font-black rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                >
                  آخر 30 يوم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 14);
                    setCustomStartDate(start.toISOString().split('T')[0]);
                    setCustomEndDate(end.toISOString().split('T')[0]);
                    showToast('تم ضبط الفترة على آخر أسبوعين 📅', 'info');
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-100/40 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-[10px] font-black rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                >
                  آخر 14 يوم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 7);
                    setCustomStartDate(start.toISOString().split('T')[0]);
                    setCustomEndDate(end.toISOString().split('T')[0]);
                    showToast('تم ضبط الفترة على آخر 7 أيام 📅', 'info');
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-100/40 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-[10px] font-black rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                >
                  آخر 7 أيام
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    setCustomStartDate(start.toISOString().split('T')[0]);
                    setCustomEndDate(end.toISOString().split('T')[0]);
                    showToast('تم ضبط الفترة على اليوم الحالي 📅', 'info');
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-100/40 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-[10px] font-black rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                >
                  اليوم
                </button>
                <span className="text-[10px] text-slate-400 font-bold select-none">فترات سريعة:</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] text-slate-500 font-black">📅 تاريخ البدء:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-center font-bold font-sans outline-none focus:border-indigo-500 transition-colors shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] text-slate-500 font-black">📅 تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-center font-bold font-sans outline-none focus:border-indigo-500 transition-colors shadow-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => handleGeneratePeriodExcel('custom')}
                className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>تصدير فوري إلى Excel منسق وملون 📊 🟢</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoiceDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoiceDetail(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5 overflow-hidden text-right flex flex-col justify-between max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSelectedInvoiceDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                    تفاصيل الفاتورة
                  </span>
                  <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 font-sans text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 relative overflow-hidden">
                  <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800"></div>

                  <div className="text-center space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-[13px]">{selectedInvoiceDetail.shopName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">رقم الفاتورة: {selectedInvoiceDetail.invoiceId}</p>
                    <p className="text-[10px] text-slate-400">التاريخ: {selectedInvoiceDetail.date}</p>
                    
                    <div className="pt-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        selectedInvoiceDetail.paymentType === 'آجل' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {selectedInvoiceDetail.paymentType === 'آجل' ? '🧾 فاتورة آجل (دين)' : '💵 فاتورة نقدية (خالصة)'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                    <h5 className="font-extrabold text-slate-400 text-[10px] mb-1.5 text-right">محتويات الفاتورة:</h5>
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 font-bold text-[10px] text-slate-400 border-b border-slate-200/50 dark:border-slate-800/50 pb-1 text-center" style={{ direction: 'rtl' }}>
                        <span className="text-right pr-1">الفئة</span>
                        <span>الكمية</span>
                        <span>السعر</span>
                        <span>الإجمالي</span>
                      </div>
                      {(selectedInvoiceDetail.items || []).map((it: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-4 items-center text-slate-600 dark:text-slate-300 font-extrabold text-[11px] text-center py-1 border-b border-slate-100/50 dark:border-slate-800/30" style={{ direction: 'rtl' }}>
                          <span className="text-right text-indigo-600 dark:text-indigo-400 font-bold pr-1">{it.label}</span>
                          <span className="font-sans text-slate-800 dark:text-slate-200">{it.quantity}</span>
                          <span className="font-sans text-slate-500 dark:text-slate-400">{it.price.toLocaleString('ar-YE')}</span>
                          <span className="font-sans text-slate-900 dark:text-slate-100 font-bold">{it.total.toLocaleString('ar-YE')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 text-xs font-extrabold" style={{ direction: 'rtl' }}>
                    <div className="flex justify-between items-center text-slate-900 dark:text-white">
                      <span>إجمالي الفاتورة:</span>
                      <span className="font-sans font-black">{selectedInvoiceDetail.totalInvoiceAmount.toLocaleString('ar-YE')} ريال</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                      <span>المبلغ المدفوع كاش:</span>
                      <span className="font-sans font-black">{selectedInvoiceDetail.receivedAmount.toLocaleString('ar-YE')} ريال</span>
                    </div>
                    <div className="flex justify-between items-center text-red-500">
                      <span>المتبقي في الحساب:</span>
                      <span className="font-sans font-black">{selectedInvoiceDetail.remainingAmount.toLocaleString('ar-YE')} ريال</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer - 5 Functional Buttons */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Row 1: WhatsApp Share & SMS Share */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const msg = buildWhatsAppInvoiceText({
                        items: selectedInvoiceDetail.items,
                        totalAmount: selectedInvoiceDetail.totalInvoiceAmount,
                        receivedAmount: selectedInvoiceDetail.receivedAmount,
                        date: selectedInvoiceDetail.date,
                        shopName: selectedInvoiceDetail.shopName,
                        type: selectedInvoiceDetail.type
                      });
                      
                      const matchedShop = shops.find(s => s.name === selectedInvoiceDetail.shopName);
                      const destPhone = matchedShop?.phone ? matchedShop.phone.replace('+', '') : '';
                      openWhatsAppDirect(destPhone, msg);
                      showToast('تم فتح واتساب لمشاركة الفاتورة 💬', 'success');
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                  >
                    <MessageCircle size={14} />
                    <span>مشاركة واتساب</span>
                  </button>

                  <button
                    onClick={() => {
                      const smsText = buildSMSInvoiceText({
                        items: selectedInvoiceDetail.items,
                        totalAmount: selectedInvoiceDetail.totalInvoiceAmount,
                        receivedAmount: selectedInvoiceDetail.receivedAmount,
                        shopName: selectedInvoiceDetail.shopName
                      });
                      const matchedShop = shops.find(s => s.name === selectedInvoiceDetail.shopName);
                      const phone = matchedShop?.phone?.trim() || '';
                      const enc = encodeURIComponent(smsText);
                      const smsUrl = phone ? `sms:${phone}?body=${enc}` : `sms:?body=${enc}`;
                      window.open(smsUrl, '_blank');
                      showToast('تم فتح تطبيق الرسائل النصية SMS ✉️', 'info');
                    }}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-indigo-500/10"
                  >
                    <MessageSquare size={14} />
                    <span>مشاركة SMS</span>
                  </button>
                </div>

                {/* Row 2: PDF Export & Copy Text */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const docSummary = {
                        items: selectedInvoiceDetail.items,
                        totalAmount: selectedInvoiceDetail.totalInvoiceAmount,
                        receivedAmount: selectedInvoiceDetail.receivedAmount,
                        remainingAmount: selectedInvoiceDetail.remainingAmount,
                        type: selectedInvoiceDetail.type,
                        date: selectedInvoiceDetail.date,
                        shopName: selectedInvoiceDetail.shopName,
                        previousBalance: 0,
                        transactionId: selectedInvoiceDetail.invoiceId
                      };
                      downloadInvoicePDF(docSummary, false);
                      showToast('تم تحميل الفاتورة PDF بنجاح 📄', 'success');
                    }}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-red-500/10"
                  >
                    <Download size={14} />
                    <span>تحميل PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = buildWhatsAppInvoiceText({
                        items: selectedInvoiceDetail.items,
                        totalAmount: selectedInvoiceDetail.totalInvoiceAmount,
                        receivedAmount: selectedInvoiceDetail.receivedAmount,
                        date: selectedInvoiceDetail.date,
                        shopName: selectedInvoiceDetail.shopName,
                        type: selectedInvoiceDetail.type
                      });
                      
                      navigator.clipboard.writeText(msg);
                      showToast('📋 تم نسخ نص الفاتورة للحافظة!', 'success');
                    }}
                    className="py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    <Copy size={14} />
                    <span>نسخ النص</span>
                  </button>
                </div>

                {/* Row 3: Close Button */}
                <button
                  onClick={() => setSelectedInvoiceDetail(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-slate-200/60 dark:border-slate-700/60"
                >
                  <X size={15} />
                  <span>إغلاق النافذة</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
