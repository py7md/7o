import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Search, 
  Phone, 
  MessageCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Eye, 
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { ShopAccount, ShopZone, SaleRecord } from '../types';
import { getNetworkName, getDistributorName, getDistributorPhone, openWhatsAppDirect } from '../utils/invoiceHelpers';

interface FollowupPageProps {
  shops: ShopAccount[];
  zones: ShopZone[];
  salesHistory: SaleRecord[];
  networkName?: string;
  setSelectedShopId: (id: string) => void;
  openAddInvoiceForShop: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToShops?: () => void;
}

export const FollowupPage: React.FC<FollowupPageProps> = ({
  shops,
  zones,
  salesHistory,
  networkName,
  setSelectedShopId,
  openAddInvoiceForShop,
  showToast,
  onNavigateToShops
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delayed' | 'active'>('all');
  const [activeMetricFilter, setActiveMetricFilter] = useState<'all' | 'sales' | 'payments'>('all');
  const [showAllActiveShops, setShowAllActiveShops] = useState(false);

  // Weekly Date Range (Saturday to Friday)
  const weeklyRange = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
    const daysSinceSaturday = (currentDay + 1) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() - daysSinceSaturday);
    saturday.setHours(0, 0, 0, 0);

    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);
    friday.setHours(23, 59, 59, 999);

    const saturdayStr = saturday.toISOString().split('T')[0];
    const fridayStr = friday.toISOString().split('T')[0];

    return { saturday, friday, saturdayStr, fridayStr };
  }, []);

  // Most active shops calculated weekly (Saturday to Friday) based on card sales and money delivery
  const weeklyActiveShops = useMemo(() => {
    const { saturdayStr, fridayStr } = weeklyRange;

    return shops.map(shop => {
      // 1. Weekly Card Sales
      let weeklySalesAmount = 0;
      let weeklyCardsCount = 0;
      const weeklyInvoiceIds = new Set<string>();

      salesHistory.forEach(sale => {
        if (sale.shopName === shop.name && sale.date >= saturdayStr && sale.date <= fridayStr) {
          weeklySalesAmount += (sale.total || 0);
          weeklyCardsCount += (sale.quantity || 0);
          if (sale.invoiceId) {
            weeklyInvoiceIds.add(sale.invoiceId);
          } else {
            weeklyInvoiceIds.add(`${sale.date}-${sale.total}`);
          }
        }
      });
      const weeklyInvoicesCount = weeklyInvoiceIds.size;

      // 2. Weekly Money Delivery (سداد وتوريد المبالغ)
      let weeklyPaymentsAmount = 0;
      let weeklyPaymentsCount = 0;

      if (shop.transactions && Array.isArray(shop.transactions)) {
        shop.transactions.forEach(tx => {
          if (tx.type === 'payment' && tx.date >= saturdayStr && tx.date <= fridayStr) {
            weeklyPaymentsAmount += (tx.amount || 0);
            weeklyPaymentsCount += 1;
          }
        });
      }

      salesHistory.forEach(sale => {
        if (sale.shopName === shop.name && sale.date >= saturdayStr && sale.date <= fridayStr) {
          if (sale.receivedAmount && sale.receivedAmount > 0) {
            const alreadyLogged = shop.transactions?.some(tx => 
              tx.type === 'payment' && 
              tx.date === sale.date && 
              tx.amount === sale.receivedAmount
            );
            if (!alreadyLogged) {
              weeklyPaymentsAmount += sale.receivedAmount;
            }
          }
        }
      });

      const totalScore = weeklySalesAmount + weeklyPaymentsAmount;

      return {
        ...shop,
        weeklySalesAmount,
        weeklyCardsCount,
        weeklyInvoicesCount,
        weeklyPaymentsAmount,
        weeklyPaymentsCount,
        totalScore
      };
    })
    .filter(s => s.weeklySalesAmount > 0 || s.weeklyPaymentsAmount > 0)
    .sort((a, b) => {
      if (activeMetricFilter === 'sales') {
        return b.weeklySalesAmount - a.weeklySalesAmount;
      }
      if (activeMetricFilter === 'payments') {
        return b.weeklyPaymentsAmount - a.weeklyPaymentsAmount;
      }
      return b.totalScore - a.totalScore;
    });
  }, [shops, salesHistory, weeklyRange, activeMetricFilter]);

  // Compute activity information for each shop
  const shopsWithActivity = useMemo(() => {
    const now = new Date();
    // Normalize today's date to midnight for day comparison
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return shops.map(shop => {
      // Find latest date from shop transactions
      let latestDate: Date | null = null;
      let latestTxType: 'sale' | 'payment' | null = null;

      if (shop.transactions && shop.transactions.length > 0) {
        shop.transactions.forEach(tx => {
          if (tx.date) {
            const d = new Date(tx.date);
            if (!isNaN(d.getTime())) {
              if (!latestDate || d.getTime() > latestDate.getTime()) {
                latestDate = d;
                latestTxType = tx.type;
              }
            }
          }
        });
      }

      // Also check salesHistory if not found or older
      const matchedSales = salesHistory.filter(s => s.shopName && s.shopName.toLowerCase() === shop.name.toLowerCase());
      matchedSales.forEach(s => {
        if (s.date) {
          const d = new Date(s.date);
          if (!isNaN(d.getTime())) {
            if (!latestDate || d.getTime() > latestDate.getTime()) {
              latestDate = d;
              latestTxType = 'sale';
            }
          }
        }
      });

      let daysSince = 9999; // Default very large if no transactions
      let lastDateFormatted = 'لا توجد معاملات مسجلة بعد';

      if (latestDate) {
        const txMidnight = new Date(
          (latestDate as Date).getFullYear(), 
          (latestDate as Date).getMonth(), 
          (latestDate as Date).getDate()
        ).getTime();
        daysSince = Math.max(0, Math.floor((todayMidnight - txMidnight) / (1000 * 60 * 60 * 24)));
        lastDateFormatted = (latestDate as Date).toLocaleDateString('ar-YE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } else if (shop.createdAt) {
        const createDate = new Date(shop.createdAt);
        if (!isNaN(createDate.getTime())) {
          const cMidnight = new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate()).getTime();
          daysSince = Math.max(0, Math.floor((todayMidnight - cMidnight) / (1000 * 60 * 60 * 24)));
          lastDateFormatted = `تم التسجيل في ${createDate.toLocaleDateString('ar-YE')}`;
        }
      }

      const isDelayed = daysSince >= 5;

      return {
        ...shop,
        daysSince,
        latestDate,
        latestTxType,
        lastDateFormatted,
        isDelayed
      };
    });
  }, [shops, salesHistory]);

  // Sort: Shops with the highest daysSince (longest inactivity) appear FIRST at the TOP!
  // Recent shops appear at the bottom!
  const sortedShops = useMemo(() => {
    return [...shopsWithActivity].sort((a, b) => {
      // Longest inactivity (highest daysSince) first
      if (b.daysSince !== a.daysSince) {
        return b.daysSince - a.daysSince;
      }
      // If equal, sort by balance descending
      return b.currentBalance - a.currentBalance;
    });
  }, [shopsWithActivity]);

  // Filter based on search query, zone, and status
  const filteredShops = useMemo(() => {
    return sortedShops.filter(shop => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = shop.name.toLowerCase().includes(q);
        const matchZone = shop.zoneName?.toLowerCase().includes(q);
        const matchPhone = shop.phone?.includes(q);
        if (!matchName && !matchZone && !matchPhone) return false;
      }

      if (selectedZoneFilter !== 'all') {
        if (selectedZoneFilter === 'unassigned') {
          if (shop.zoneId || shop.zoneName) return false;
        } else {
          if (shop.zoneId !== selectedZoneFilter && shop.zoneName !== selectedZoneFilter) return false;
        }
      }

      if (statusFilter === 'delayed' && !shop.isDelayed) return false;
      if (statusFilter === 'active' && shop.isDelayed) return false;

      return true;
    });
  }, [sortedShops, searchQuery, selectedZoneFilter, statusFilter]);

  // Metrics
  const totalDelayed = useMemo(() => shopsWithActivity.filter(s => s.isDelayed).length, [shopsWithActivity]);
  const totalActive = useMemo(() => shopsWithActivity.filter(s => !s.isDelayed).length, [shopsWithActivity]);

  // Handler to send follow-up WhatsApp message
  const handleSendFollowupWhatsApp = (shop: typeof shopsWithActivity[0]) => {
    const netName = networkName || getNetworkName() || 'شبكة الدحشة';
    const distName = getDistributorName();
    const distPhone = getDistributorPhone();

    let msg = `*السلام عليكم ورحمة الله وبركاته*\n`;
    msg += `الأخوة الكرام في *${shop.name}* المحترمين 🏪\n`;
    if (shop.zoneName) {
      msg += `📍 *المربع / الحارة:* ${shop.zoneName}\n`;
    }
    msg += `••••••••••••••••••••\n`;
    msg += `نأمل أن تكونوا بخير وعافية.\n\n`;
    
    if (shop.daysSince === 9999) {
      msg += `نود الاستفسار والاطمئنان عن حركة الكروت لديكم، ويسعدنا تزويدكم بدفعة كروت من شبكة *${netName}* بجميع الفئات (100، 200، 250، 300، 500) لتلبية طلبات الزبائن الكرام.\n\n`;
    } else {
      msg += `نود الاستفسار والاطمئنان عن حركة الكروت لديكم، حيث لاحظنا مرور *${shop.daysSince} أيام* منذ آخر طلبية.\n`;
      msg += `هل تحتاجون لتزويدكم بدفعة كروت جديدة لشبكة *${netName}*؟\n`;
      msg += `(الفئات متوفرة: 100، 200، 250، 300، 500).\n\n`;
    }

    if (shop.currentBalance > 0) {
      msg += `📌 _للمعلومية: الرصيد السابق المقيد على حسابكم: ${shop.currentBalance.toLocaleString('ar-YE')} ريال._\n\n`;
    }

    msg += `نحن بخدمتكم في أي وقت لنوفر لكم الكروت فوراً 🤝\n`;
    msg += `الموزع المعتمد: *${distName}*\n`;
    msg += `هاتف التواصل: 📞 *${distPhone}*\n`;
    msg += `نسأل الله لكم دوام التوفيق والرزق المبارك ✨`;

    const destPhone = shop.phone?.trim() ? shop.phone.trim() : '';
    openWhatsAppDirect(destPhone, msg);
    showToast(`تم فتح واتساب لمتابعة بقالة ${shop.name} 💬`, 'success');
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto text-right" style={{ direction: 'rtl' }}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white p-5 rounded-3xl border border-slate-750/70 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-black flex items-center gap-2 text-white">
              <Activity className="text-amber-400" size={20} />
              <span>قسم المتابعة الذكية وركود البقالات</span>
            </h2>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              ترتيب البقالات تلقائياً حسب آخر حركة: الأكثر تأخراً تظهر أولاً لمعرفة من لم يطلب كروت أو ينفذ عمليات ومتابعتهم مباشرة.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToShops && (
              <button
                type="button"
                onClick={onNavigateToShops}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-colors cursor-pointer border border-white/20"
                title="الرجوع إلى خانة حسابات البقالات والديون"
              >
                <span>← خانة البقالات</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
              <Clock size={14} />
              <span>تنبيه الركود: 5 أيام فأكثر</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="bg-slate-800/80 dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">البقالات المتأخرة</span>
            <div className="text-lg font-black text-amber-400 font-sans flex items-center justify-center gap-1">
              <span>{totalDelayed}</span>
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
            <span className="text-[9px] text-slate-400">تجاوزت 5 أيام</span>
          </div>

          <div className="bg-slate-800/80 dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">البقالات النشطة</span>
            <div className="text-lg font-black text-emerald-400 font-sans flex items-center justify-center gap-1">
              <span>{totalActive}</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <span className="text-[9px] text-slate-400">خلال آخر 4 أيام</span>
          </div>

          <div className="bg-slate-800/80 dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">إجمالي البقالات</span>
            <div className="text-lg font-black text-blue-400 font-sans">
              {shops.length}
            </div>
            <span className="text-[9px] text-slate-400">تحت المتابعة</span>
          </div>
        </div>
      </div>

      {/* Most Active Shops Section (Weekly: Saturday to Friday) */}
      {shops.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-right"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
                ⭐
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>البقالات الأكثر نشاطاً هذا الأسبوع</span>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-sans px-2 py-0.5 rounded-md font-bold">
                    {weeklyActiveShops.length} نشطة
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  حساب أسبوعي (من السبت إلى الجمعة) بناءً على مبيعات الكروت وتوريد المبالغ
                </p>
              </div>
            </div>

            <div className="text-[10px] font-sans font-bold text-slate-500 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
              📅 {weeklyRange.saturdayStr} ⬅️ {weeklyRange.fridayStr}
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveMetricFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
                activeMetricFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              النشاط الشامل (كروت + توريد)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricFilter('sales')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
                activeMetricFilter === 'sales'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              الأعلى مبيعات كروت 📦
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricFilter('payments')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
                activeMetricFilter === 'payments'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              الأعلى توريد وسداد 💵
            </button>
          </div>

          {/* Shops Cards List */}
          {weeklyActiveShops.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              لم تُسجل مبيعات أو مبالغ موردة خلال هذا الأسبوع (السبت - الجمعة) حتى الآن. ستظهر البقالات النشطة هنا تلقائياً عند إجراء أي عملية.
            </div>
          ) : (
            <div className="space-y-2.5">
              {(showAllActiveShops ? weeklyActiveShops : weeklyActiveShops.slice(0, 3)).map((activeShop, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = index < 3 ? medals[index] : `#${index + 1}`;

                return (
                  <div
                    key={activeShop.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none">{medal}</span>
                        <span className="text-sm select-none">{activeShop.emoji || '🏪'}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-black text-slate-900 dark:text-white">
                              {activeShop.name}
                            </h5>
                            {activeShop.zoneName && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md">
                                {activeShop.zoneName}
                              </span>
                            )}
                          </div>
                          {activeShop.phone && (
                            <span className="text-[9px] text-slate-400 font-sans">{activeShop.phone}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedShopId(activeShop.id)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all shadow-xs"
                      >
                        عرض الحساب 📂
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-right pt-1 border-t border-slate-200/50 dark:border-slate-800/60 text-[10px]">
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold block text-[9px]">مبيعات الكروت الأسبوعية:</span>
                        <span className="font-black font-sans text-indigo-600 dark:text-indigo-400 text-xs">
                          {activeShop.weeklySalesAmount.toLocaleString('ar-YE')} ر.ي
                        </span>
                        <span className="text-[8px] text-slate-400 block font-bold">
                          ({activeShop.weeklyCardsCount} كرت - {activeShop.weeklyInvoicesCount} فواتير)
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold block text-[9px]">المبالغ المسلمة (كاش):</span>
                        <span className="font-black font-sans text-emerald-600 dark:text-emerald-400 text-xs">
                          {activeShop.weeklyPaymentsAmount.toLocaleString('ar-YE')} ر.ي
                        </span>
                        <span className="text-[8px] text-emerald-500 block font-bold">
                          ({activeShop.weeklyPaymentsCount} دفعات مسددة)
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 font-bold block text-[9px]">الرصيد المتبقي حالياً:</span>
                        <span className={`font-black font-sans text-xs ${activeShop.currentBalance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {activeShop.currentBalance.toLocaleString('ar-YE')} ر.ي
                        </span>
                        <span className="text-[8px] text-slate-400 block font-bold">
                          {activeShop.currentBalance > 0 ? 'مديونية مستحقة' : 'حساب مصفى'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {weeklyActiveShops.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllActiveShops(!showAllActiveShops)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {showAllActiveShops 
                    ? 'إخفاء باقي البقالات 🔼' 
                    : `عرض باقي البقالات النشطة (${weeklyActiveShops.length - 3} بقالات أخرى) 🔽`
                  }
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 بحث سريع عن بقالة أو مربع أو رقم هاتف..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-right"
          />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              الكل ({shopsWithActivity.length})
            </button>
            <button
              onClick={() => setStatusFilter('delayed')}
              className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'delayed'
                  ? 'bg-[#475569] text-white shadow-sm ring-2 ring-[#64748b]'
                  : 'bg-stone-100 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <AlertTriangle size={12} className="text-amber-400" />
              <span>متأخرة 5+ أيام ({totalDelayed})</span>
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>نشطة ({totalActive})</span>
            </button>
          </div>

          {/* Zone Selector */}
          {zones.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                <MapPin size={12} />
                <span>المربع:</span>
              </span>
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="all">جميع المربعات</option>
                {zones.map(z => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
                <option value="unassigned">بدون مربع محدد</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* List of Groceries Sorted by Inactivity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-400 font-bold">
            مرتبة تنازلياً: الأكثر تأخراً في البداية ⬇️ ({filteredShops.length} بقالة)
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-bold">
            <ArrowUpDown size={12} />
            <span>ترتيب آلي حسب أيام الركود</span>
          </span>
        </div>

        {filteredShops.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-2">
            <p className="text-slate-400 text-sm font-bold">لا توجد بقالات تطابق التصفية الحالية.</p>
          </div>
        ) : (
          filteredShops.map((shop) => (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 bg-white dark:bg-slate-900 rounded-3xl border transition-all space-y-3 ${
                shop.isDelayed
                  ? 'border-slate-400/40 dark:border-slate-700 shadow-md shadow-slate-900/5'
                  : 'border-slate-150 dark:border-slate-800 shadow-sm'
              }`}
            >
              {/* Distinctive Dusty ("أغبر وليس فاتح") Alert Badge for shops inactive 5 days or more */}
              {shop.isDelayed && (
                <div className="bg-[#475569] dark:bg-[#334155] text-slate-100 px-3.5 py-2 rounded-2xl border border-[#334155] dark:border-[#475569] flex items-center justify-between flex-wrap gap-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                      <AlertTriangle size={15} />
                    </span>
                    <span className="text-xs font-black tracking-wide">
                      {shop.daysSince === 9999 
                        ? 'تنبيه ركود: لم تسجل أي حركة أو طلب كروت حتى الآن!'
                        : `تنبيه ركود: متأخرة منذ ${shop.daysSince} أيام دون أي معاملة أو طلب كروت!`}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#1e293b] px-2 py-0.5 rounded-lg text-slate-200">
                    بحاجة للتواصل والمتابعة ⚠️
                  </span>
                </div>
              )}

              {/* Shop Main Info */}
              <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                {/* Right side: Name, Zone, Details */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg select-none">{shop.emoji || '🔴'}</span>
                    <h3 
                      onClick={() => setSelectedShopId(shop.id)}
                      className="text-base font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {shop.name}
                    </h3>
                    {shop.isPro && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-[9px] font-black text-amber-700 dark:text-amber-400">
                        PRO ✨
                      </span>
                    )}
                    {shop.zoneName && (
                      <span className="px-2 py-0.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 text-[10px] font-black flex items-center gap-1">
                        <MapPin size={10} />
                        <span>مربع: {shop.zoneName}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock size={12} className="text-slate-400" />
                      <span>آخر معاملة: {shop.lastDateFormatted}</span>
                    </span>

                    <span>•</span>

                    <span className={`font-sans font-black ${
                      shop.currentBalance > 0 
                        ? 'text-red-500 dark:text-red-400' 
                        : shop.currentBalance < 0 
                        ? 'text-emerald-500 dark:text-emerald-400' 
                        : 'text-slate-400'
                    }`}>
                      {shop.currentBalance > 0 
                        ? `الرصيد: ${shop.currentBalance.toLocaleString('ar-YE')} ريال (آجل)` 
                        : shop.currentBalance < 0 
                        ? `الرصيد: ${Math.abs(shop.currentBalance).toLocaleString('ar-YE')} ريال (له)` 
                        : 'الرصيد: مسدد بالكامل'}
                    </span>
                  </div>
                </div>

                {/* Left side: Days Counter Badge */}
                <div className="shrink-0 text-left">
                  <div className={`px-3 py-1.5 rounded-2xl text-center border font-sans ${
                    shop.isDelayed
                      ? 'bg-slate-800 text-slate-100 border-slate-700'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <span className="text-xs font-black block">
                      {shop.daysSince === 9999 ? 'بدون حركة' : `${shop.daysSince} يوم`}
                    </span>
                    <span className="text-[9px] font-bold opacity-80 block">
                      {shop.daysSince === 0 ? 'اليوم' : 'مدة الركود'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* WhatsApp Follow-up Message */}
                  <button
                    onClick={() => handleSendFollowupWhatsApp(shop)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-green-600/10 cursor-pointer"
                    title="إرسال رسالة استفسار ومتابعة عبر واتساب"
                  >
                    <MessageCircle size={13} />
                    <span>متابعة واتساب 💬</span>
                  </button>

                  {/* Direct Call */}
                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl transition-colors flex items-center gap-1"
                      title="اتصال هاتفي مباشر"
                    >
                      <Phone size={12} />
                      <span className="font-sans">{shop.phone}</span>
                    </a>
                  )}

                  {/* Quick New Invoice */}
                  <button
                    onClick={() => openAddInvoiceForShop(shop.id)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="إضافة فاتورة كروت جديدة للبقالة"
                  >
                    <Plus size={13} />
                    <span>فاتورة جديدة 🧾</span>
                  </button>
                </div>

                {/* Open Account Details */}
                <button
                  onClick={() => setSelectedShopId(shop.id)}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>كشف الحساب</span>
                  <Eye size={13} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
};
