import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Zap,
  Store,
  Activity,
  BarChart3,
  ShoppingCart,
  Settings2,
  Moon,
  Sun,
  LogOut,
  X,
  ChevronLeft,
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  Layers,
  BadgePercent
} from 'lucide-react';
import { AppTab } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  networkName: string;
  distributorName?: string;
  distributorPhone?: string;
  totalShopsCount?: number;
  stagnantCount?: number;
  isPurchasesEnabled?: boolean;
  isDark: boolean;
  toggleDark: () => void;
  onExit: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  networkName,
  distributorName,
  distributorPhone,
  totalShopsCount = 0,
  stagnantCount = 0,
  isPurchasesEnabled = true,
  isDark,
  toggleDark,
  onExit,
}) => {
  // Real-time online/offline detector
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    onClose();
  };

  const sectionsList = [
    {
      group: 'المبيعات والحسابات اليومية',
      items: [
        {
          id: 'regular' as AppTab,
          label: 'حاسبة مبيعات الكروت',
          subLabel: 'الفئات العادية وحساب الإجمالي والفواتير',
          icon: Calculator,
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-500/30',
          badge: 'رئيسي'
        },
        {
          id: 'pro' as AppTab,
          label: 'حاسبة فئة برو (Pro)',
          subLabel: 'الفئة السريعة واحتساب كميات كروت برو (فارق سعر)',
          icon: Zap,
          color: 'text-red-500 bg-red-500/10 border-red-500/20',
          activeBg: 'bg-red-500/15 border-red-500/40 text-red-900 dark:text-red-300 ring-1 ring-red-500/30',
          badge: 'برو ⚡ فارق سعر'
        },
        {
          id: 'shops' as AppTab,
          label: 'حسابات البقالات والعملاء',
          subLabel: 'الأرصدة، السندات، الديون وكشوفات الحساب',
          icon: Store,
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
          activeBg: 'bg-blue-500/15 border-blue-500/40 text-blue-900 dark:text-blue-300 ring-1 ring-blue-500/30',
          badge: totalShopsCount > 0 ? `${totalShopsCount} بقالة` : undefined
        },
      ]
    },
    {
      group: 'المتابعة والتقارير والرقابة',
      items: [
        {
          id: 'followup' as AppTab,
          label: 'المتابعة والركود',
          subLabel: 'البقالات الأكثر نشاطاً ورصد المتأخرات',
          icon: Activity,
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
          activeBg: 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-300 ring-1 ring-purple-500/30',
          badge: stagnantCount > 0 ? `${stagnantCount} راكدة` : 'تتبع ⏱️'
        },
        {
          id: 'reports' as AppTab,
          label: 'التقرير الحسابي والمالي',
          subLabel: 'إحصائيات المبيعات، الأرباح والرسوم البيانية',
          icon: BarChart3,
          color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
          activeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-900 dark:text-sky-300 ring-1 ring-sky-500/30',
          badge: 'تقارير 📊'
        },
        {
          id: 'margin' as AppTab,
          label: 'قسم الهامش المالي',
          subLabel: 'هامش عمولة فئة Pro وبونص كروت الجملة',
          icon: BadgePercent,
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          activeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-300 ring-1 ring-rose-500/30',
          badge: 'أرباح ⚡'
        },
        ...(isPurchasesEnabled ? [{
          id: 'purchases' as AppTab,
          label: 'حسابات المشتريات والوكلاء',
          subLabel: 'كروت الشراء وفواتير الموردين والمستحقات',
          icon: ShoppingCart,
          color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
          activeBg: 'bg-teal-500/15 border-teal-500/40 text-teal-900 dark:text-teal-300 ring-1 ring-teal-500/30',
          badge: 'مشتريات'
        }] : [])
      ]
    },
    {
      group: 'إعدادات النظام والبيانات',
      items: [
        {
          id: 'about' as AppTab,
          label: 'إعدادات التطبيق والأسعار',
          subLabel: 'تعديل أسعار الكروت، النسخ الاحتياطي وإدارة البيانات',
          icon: Settings2,
          color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
          activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-500/30',
          badge: 'إعدادات ⚙️'
        }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex justify-end"
          style={{ direction: 'rtl' }}
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Side Menu Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-xs sm:max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-900 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                    <Layers size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                      أقسام النظام
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                      {networkName || 'نظام إدارة كروت الشبكة'}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  aria-label="إغلاق القائمة"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-150/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-all cursor-pointer active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Bar inside drawer */}
              <div className="flex items-center justify-between text-[11px] font-bold px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Database size={13} />
                  <span>تخزين محلي آلي 100%</span>
                </div>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Wifi size={13} />
                      <span>متصل</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <WifiOff size={13} />
                      <span>أوفلاين ⚡</span>
                    </span>
                  )}
                </div>
              </div>

              {distributorName && (
                <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                  <span>الموزع: {distributorName}</span>
                  {distributorPhone && (
                    <span className="font-mono text-slate-400">{distributorPhone}</span>
                  )}
                </div>
              )}
            </div>

            {/* Sections Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4">
              {sectionsList.map((sectionGroup, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5">
                    {sectionGroup.group}
                  </div>

                  <div className="space-y-1">
                    {sectionGroup.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full text-right p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer border ${
                            isActive
                              ? `${item.activeBg} font-black shadow-sm`
                              : 'bg-white hover:bg-slate-100/80 dark:bg-slate-900 hover:dark:bg-slate-800/70 border-transparent text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                isActive ? 'bg-white dark:bg-slate-800 shadow-xs' : item.color
                              }`}
                            >
                              <IconComponent size={18} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs sm:text-[13px] font-black leading-tight ${isActive ? 'text-slate-950 dark:text-white' : ''}`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isActive 
                                      ? 'bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                                {item.subLabel}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isActive ? (
                              <CheckCircle2 size={16} className="text-emerald-500 animate-in zoom-in-75" />
                            ) : (
                              <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Side Menu Footer Controls */}
            <div className="p-3 sm:p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Dark Mode Toggle Button */}
                <button
                  onClick={toggleDark}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  {isDark ? (
                    <>
                      <Sun size={15} className="text-amber-500" />
                      <span>نهاري</span>
                    </>
                  ) : (
                    <>
                      <Moon size={15} className="text-indigo-500" />
                      <span>ليلي</span>
                    </>
                  )}
                </button>

                {/* Exit App Button */}
                <button
                  onClick={() => {
                    onClose();
                    onExit();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <LogOut size={15} />
                  <span>خروج</span>
                </button>
              </div>

              {/* Version & Offline Status */}
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1 pt-1">
                <span>تطبيق مبيعات الكروت الذكي</span>
                <span>إصدار 2.5 المستقر</span>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
