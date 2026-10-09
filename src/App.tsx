import React, { useState, useEffect, useMemo, ReactNode, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Zap, 
  Info, 
  History, 
  Moon, 
  Sun, 
  Plus, 
  Minus, 
  CheckCircle2,
  Phone,
  Settings2,
  Trash2,
  ArrowRightLeft,
  ArrowRight,
  ChevronRight,
  Download,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Volume2,
  VolumeX,
  Share2,
  FileText,
  Menu,
  Check,
  RotateCcw,
  Upload,
  DownloadCloud,
  FileImage,
  Sparkles,
  Printer,
  Pencil,
  Copy,
  Send,
  X,
  Eye,
  Database,
  Server,
  Search,
  Contact,
  MessageCircle,
  LogOut,
  Users,
  ShoppingCart,
  Clock,
  Bell,
  Briefcase,
  MapPin,
  Activity,
  Star,
  AlertTriangle
} from 'lucide-react';
import { ContactPickerModal } from './components/ContactPickerModal';
import { ReportsPage } from './components/ReportsPage';
import { PurchasesPage } from './components/PurchasesPage';
import { FollowupPage } from './components/FollowupPage';
import { MarginPage } from './components/MarginPage';
import { SideMenu } from './components/SideMenu';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell, 
  Legend
} from 'recharts';
import { CalculatorType, CardCategory, SaleRecord, DailySummary, ShopAccount, ShopTransaction, AgentAccount, AgentTransaction, ShopZone, AppTab } from './types';
import { INITIAL_PRICES } from './constants';
import {
  testFirestoreConnection,
  activateAndRecover,
  pushLocalBackup,
  VALID_SERIALS,
  verifySerialFormat
} from './utils/localDB';
import { 
  playSuccessSound, 
  downloadInvoicePDF, 
  downloadInvoicePNG, 
  downloadDailyReportPDF, 
  handleWhatsAppSingleShare, 
  handleSMSSingleShare, 
  handleWhatsAppTextSingleShare,
  handleWhatsAppReportShare, 
  handleSMSReportShare,
  downloadShopStatementPDF,
  downloadAllShopsSummaryPDF,
  getNetworkName,
  getDistributorName,
  getDistributorPhone,
  getInvoiceFooterNote,
  getCustomLogoImage,
  buildWhatsAppInvoiceText,
  buildSMSInvoiceText,
  buildPaymentReceiptWhatsAppText,
  buildScheduledReminderWhatsAppText,
  openWhatsAppDirect,
  formatPhoneForWhatsApp
} from './utils/invoiceHelpers';
import { downloadFinancialStatementExcel } from './utils/excelHelpers';
import { FolderDown, Folder } from 'lucide-react';
import { saveFileToKrotFolder } from './utils/filesystemHelpers';

// --- Phone Number Helper ---
const formatYemeniPhone = (phone: string): string => {
  let trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  
  if (trimmed.startsWith('+967')) {
    return trimmed;
  }
  if (trimmed.startsWith('00967')) {
    return '+967' + trimmed.slice(5);
  }
  if (trimmed.startsWith('967')) {
    return '+' + trimmed;
  }
  if (trimmed.startsWith('07') && trimmed.length === 10) {
    return '+967' + trimmed.slice(1);
  }
  if (trimmed.startsWith('7') && trimmed.length === 9) {
    return '+967' + trimmed;
  }
  if (/^\d{9}$/.test(trimmed)) {
    return '+967' + trimmed;
  }
  return trimmed;
};

// --- Sub Components ---

const Header = ({ 
  title, 
  toggleDark, 
  isDark, 
  onExit,
  onOpenSideMenu,
  isPro = false
}: { 
  title: string; 
  toggleDark: () => void; 
  isDark: boolean; 
  onExit: () => void;
  onOpenSideMenu: () => void;
  isPro?: boolean;
}) => {
  return (
    <header className={`sticky top-0 z-30 w-full backdrop-blur-md border-b px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2 transition-colors ${
      isPro
        ? 'bg-rose-50/95 dark:bg-slate-950/95 border-rose-200/90 dark:border-rose-950/70 shadow-xs'
        : 'bg-white/85 dark:bg-slate-950/85 border-slate-150 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between w-full relative">
        {/* Side Menu Drawer Button (Opens all sections) */}
        <button 
          onClick={onOpenSideMenu}
          title="فتح قائمة الأقسام (القائمة الجانبية)"
          className={`py-1.5 px-3 rounded-xl border active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black shrink-0 shadow-2xs ${
            isPro
              ? 'bg-red-100/80 hover:bg-red-200/80 dark:bg-red-950/40 dark:hover:bg-red-900/50 border-red-300/80 dark:border-red-800/80 text-red-700 dark:text-red-300'
              : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400'
          }`}
        >
          <Menu size={16} />
          <span>الأقسام</span>
        </button>
        
        {/* Centered Page Title */}
        <div className="flex items-center justify-center gap-1.5 flex-1 mx-2 min-w-0">
          <h1 className={`text-xs sm:text-sm md:text-base font-black font-sans text-center truncate ${
            isPro ? 'text-red-950 dark:text-red-100' : 'text-slate-950 dark:text-white'
          }`}>
            {title}
          </h1>
          {isPro && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-red-600 text-white shrink-0 shadow-2xs animate-pulse">
              PRO ⚡
            </span>
          )}
        </div>
        
        {/* Controls: Storage, Dark Theme, Exit */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div 
            title="نظام التخزين المحلي الآلي 100%"
            className="hidden sm:flex px-2.5 py-1.5 rounded-full text-[10px] font-black items-center gap-1 border bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40 select-none shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>تخزين محلي 💾</span>
          </div>

          <button 
            onClick={toggleDark}
            title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-90 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/80"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button 
            onClick={onExit}
            title="خروج من التطبيق"
            className="p-2 py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-150 dark:border-red-900/40 text-red-600 dark:text-red-400 active:scale-90 transition-all cursor-pointer flex items-center gap-1 text-xs font-black shrink-0"
          >
            <LogOut size={14} />
            <span className="hidden xs:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const CardItem = ({ 
  category, 
  quantity, 
  updateQuantity,
  isPro = false 
}: { 
  category: CardCategory; 
  quantity: number; 
  updateQuantity: (id: number, delta: number) => void;
  isPro?: boolean;
  key?: number;
}) => {
  const isFilled = quantity > 0;

  // Color classes depending on whether it's PRO (Red) or Regular (Green)
  const filledCardBg = isPro 
    ? 'bg-red-500/10 dark:bg-red-500/20 border-red-500/50 dark:border-red-500/60 shadow-md shadow-red-500/15 ring-2 ring-red-500/40 scale-[1.01]'
    : 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 dark:border-emerald-500/60 shadow-md shadow-emerald-500/15 ring-2 ring-emerald-500/40 scale-[1.01]';

  const dotColor = isPro ? 'bg-red-500' : 'bg-emerald-500';

  const titleTextColor = isFilled 
    ? (isPro ? 'text-red-950 dark:text-red-200' : 'text-emerald-950 dark:text-emerald-200')
    : 'text-slate-950 dark:text-white';

  const subTextColor = isFilled 
    ? (isPro ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400')
    : 'text-slate-500 dark:text-slate-400';

  const totalBadgeBg = isPro
    ? 'bg-red-600 text-white dark:bg-red-500 dark:text-slate-950'
    : 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950';

  const minusBtnFilled = isPro
    ? 'bg-red-100/90 hover:bg-rose-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 hover:text-rose-600 dark:hover:text-rose-400'
    : 'bg-emerald-100/90 hover:bg-rose-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 hover:text-rose-600 dark:hover:text-rose-400';

  const inputTextColor = isFilled
    ? (isPro ? 'text-red-700 dark:text-red-300 font-extrabold' : 'text-emerald-700 dark:text-emerald-300 font-extrabold')
    : 'text-slate-900 dark:text-white';

  const plusBtnFilled = isPro
    ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/30 scale-105'
    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/30 scale-105';

  return (
    <div 
      className={`flex items-center justify-between py-2 px-4 rounded-2xl border transition-all duration-300 mb-2 select-none ${
        isFilled 
          ? filledCardBg 
          : (isPro 
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400/80 shadow-2xs' 
              : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
            )
      }`}
    >
      <div className="flex flex-col text-right">
        <div className="flex items-center gap-1.5">
          {isFilled && (
            <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse shrink-0`}></span>
          )}
          <span className={`font-black text-sm tracking-tight ${titleTextColor}`}>
            {category.label}
          </span>
          {isPro && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 shadow-2xs">
              PRO
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[11px] font-bold ${subTextColor}`}>
            السعر: {category.price} ريال
          </span>
          {isFilled && (
            <span className={`text-[10px] font-black font-sans px-2 py-0.2 rounded-full shadow-sm animate-fade-in ${totalBadgeBg}`}>
              المجموع: {(category.price * quantity).toLocaleString('ar-YE')} ريال
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          type="button"
          onClick={() => updateQuantity(category.id, -1)}
          className={`w-8 h-8 flex items-center justify-center rounded-xl active:scale-90 cursor-pointer transition-all ${
            isFilled 
              ? minusBtnFilled 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/20 active:text-red-500'
          }`}
        >
          <Minus size={15} />
        </button>

        <input 
          type="number"
          value={quantity === 0 ? '' : quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            updateQuantity(category.id, val - quantity);
          }}
          placeholder="0"
          className={`w-10 text-center text-base font-black bg-transparent outline-none transition-colors font-sans ${inputTextColor}`}
        />

        <button 
          type="button"
          onClick={() => updateQuantity(category.id, 1)}
          className={`w-8 h-8 flex items-center justify-center rounded-xl active:scale-90 cursor-pointer transition-all ${
            isFilled 
              ? plusBtnFilled 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-950/20 active:text-green-500'
          }`}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
};

const AboutPage = ({ networkName }: { networkName: string }) => (
  <div className="p-6 flex flex-col items-center text-center space-y-6">
    <div className="w-24 h-24 bg-blue-500/10 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-500 shadow-inner">
      <Sparkles size={52} strokeWidth={1.5} />
    </div>
    <div className="space-y-1">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">تطبيق {networkName}</h2>
      <p className="text-sm font-bold text-slate-400">حساب مبيعات الكروت وتنظيم الأرباح المعتمد</p>
      <p className="text-xs text-slate-500">الإصدار 1.2.0 • 2026</p>
    </div>
    
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm text-slate-400 font-bold">برمجةوتطوير</span>
        <span className="text-lg font-black text-slate-900 dark:text-white">أحمد المنتصر</span>
      </div>
      <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
      <a 
        href="tel:773086403"
        className="flex items-center justify-center gap-3 w-full p-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-2xl active:scale-95 transition-transform font-bold"
      >
        <Phone size={20} />
        <span className="font-sans font-black">773086403</span>
      </a>
    </div>
  </div>
);

const ShopsPage = ({
  shops,
  setShops,
  zones = [],
  setZones,
  showToast,
  salesHistory,
  setSalesHistory,
  onOpenContactPicker,
  balanceLimit,
  handleLimitChange,
  selectedShopId,
  setSelectedShopId,
  lastSaleSummary,
  setLastSaleSummary,
  setShowSuccessModal,
  isThermalMode = false,
  setIsThermalMode,
  prices,
  setActiveTab
}: {
  shops: ShopAccount[];
  setShops: React.Dispatch<React.SetStateAction<ShopAccount[]>>;
  zones?: ShopZone[];
  setZones?: React.Dispatch<React.SetStateAction<ShopZone[]>>;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
  salesHistory: SaleRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  onOpenContactPicker: (onPick: (name: string, phone: string) => void) => void;
  balanceLimit: number;
  handleLimitChange: (val: number) => void;
  selectedShopId: string | null;
  setSelectedShopId: (id: string | null) => void;
  lastSaleSummary?: SaleRecord | null;
  setLastSaleSummary?: (val: SaleRecord | null) => void;
  setShowSuccessModal?: (val: boolean) => void;
  isThermalMode?: boolean;
  setIsThermalMode?: (val: boolean) => void;
  prices?: Record<CalculatorType, CardCategory[]>;
  setActiveTab?: (tab: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);
  const [subTab, setSubTab] = useState<'list' | 'add'>('list');
  const [newShopName, setNewShopName] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopInitialBalance, setNewShopInitialBalance] = useState('');
  const [newShopIsPro, setNewShopIsPro] = useState(false);
  const [newShopEmoji, setNewShopEmoji] = useState('🔴');
  const [newShopZoneId, setNewShopZoneId] = useState('');

  // Zone Management States
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShopZone | null>(null);
  const [zoneNameInput, setZoneNameInput] = useState('');
  const [zoneDescInput, setZoneDescInput] = useState('');

  // Editing Shop Zone State
  const [editShopZoneId, setEditShopZoneId] = useState('');
  
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [lastPaymentSummary, setLastPaymentSummary] = useState<{
    txId?: string;
    shopName: string;
    amount: number;
    previousBalance: number;
    remainingBalance: number;
    date: string;
    notes: string;
    phone?: string;
  } | null>(null);

  // States for Quick Payment Modal (إضافة واصل مالي فوري)
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [quickPaymentShopId, setQuickPaymentShopId] = useState<string>('');
  const [quickPaymentAmount, setQuickPaymentAmount] = useState<number | string>('');
  const [quickPaymentNotes, setQuickPaymentNotes] = useState('');
  const [quickPaymentSearch, setQuickPaymentSearch] = useState('');

  // States for Editing Shop Details (Name, Phone, Emoji)
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [editShopName, setEditShopName] = useState('');
  const [editShopPhone, setEditShopPhone] = useState('');
  const [editShopEmoji, setEditShopEmoji] = useState('🔴');

  // States for Scheduled Reminders
  const [reminderDaysInput, setReminderDaysInput] = useState<number | string>(7);
  const [reminderNotesInput, setReminderNotesInput] = useState('');
  const [showDebtAlertInput, setShowDebtAlertInput] = useState(true);

  useEffect(() => {
    if (selectedShopId) {
      const s = shops.find(shop => shop.id === selectedShopId);
      if (s) {
        setReminderDaysInput(s.reminderDays || 7);
        setReminderNotesInput(s.reminderNotes || '');
        setShowDebtAlertInput(s.showDebtAlert !== false);
      }
    }
  }, [selectedShopId, shops]);

  const handleSaveZone = () => {
    const name = zoneNameInput.trim();
    if (!name) {
      showToast('يرجى كتابة اسم المربع أو الحارة!', 'error');
      return;
    }

    if (editingZone) {
      const updatedZones = zones.map(z => z.id === editingZone.id ? { ...z, name, description: zoneDescInput.trim() || undefined } : z);
      setZones?.(updatedZones);
      setShops(prev => prev.map(s => s.zoneId === editingZone.id ? { ...s, zoneName: name } : s));
      showToast(`تم تعديل بيانات المربع إلى (${name}) بنجاح ✏️`, 'success');
    } else {
      if (zones.some(z => z.name.toLowerCase() === name.toLowerCase())) {
        showToast('يوجد مربع آخر مسجل بنفس هذا الاسم مسبقاً! ⚠️', 'error');
        return;
      }
      const newZone: ShopZone = {
        id: 'ZONE-' + Date.now().toString(36).substring(4).toUpperCase(),
        name,
        description: zoneDescInput.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      setZones?.(prev => [...prev, newZone]);
      showToast(`تمت إضافة مربع (${name}) بنجاح 🏘️`, 'success');
    }

    setShowZoneModal(false);
    setEditingZone(null);
    setZoneNameInput('');
    setZoneDescInput('');
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones?.(prev => prev.filter(z => z.id !== zoneId));
    setShops(prev => prev.map(s => s.zoneId === zoneId ? { ...s, zoneId: undefined, zoneName: undefined } : s));
    if (selectedZoneFilter === zoneId) {
      setSelectedZoneFilter('all');
    }
    showToast('تم حذف المربع بنجاح وتم تحويل بقالاته إلى عامة 🗑️', 'info');
  };

  const handleSaveShopDetails = () => {
    if (!selectedShopId) return;
    const currentShop = shops.find(s => s.id === selectedShopId);
    if (!currentShop) return;

    const newName = editShopName.trim();
    if (!newName) {
      showToast('يرجى كتابة اسم البقالة ⚠️', 'error');
      return;
    }

    const oldName = currentShop.name;
    const isNameChanged = newName.toLowerCase() !== oldName.toLowerCase();

    if (isNameChanged) {
      const exists = shops.some(s => s.id !== currentShop.id && s.name.toLowerCase() === newName.toLowerCase());
      if (exists) {
        showToast('يوجد حساب بقالة آخر مسجل بنفس هذا الاسم مسبقاً! ⚠️', 'error');
        return;
      }
    }

    const formattedPhone = editShopPhone.trim() ? formatYemeniPhone(editShopPhone.trim()) : undefined;
    const matchedZone = zones.find(z => z.id === editShopZoneId);

    setShops(prev => prev.map(s => {
      if (s.id === currentShop.id) {
        return {
          ...s,
          name: newName,
          phone: formattedPhone,
          emoji: editShopEmoji,
          zoneId: matchedZone ? matchedZone.id : undefined,
          zoneName: matchedZone ? matchedZone.name : undefined
        };
      }
      return s;
    }));

    if (isNameChanged) {
      setSalesHistory(prev => prev.map(rec => {
        if (rec.shopName && rec.shopName.toLowerCase() === oldName.toLowerCase()) {
          return { ...rec, shopName: newName };
        }
        return rec;
      }));

      if (localStorage.getItem('last_shop_name')?.toLowerCase() === oldName.toLowerCase()) {
        localStorage.setItem('last_shop_name', newName);
      }
    }

    setShowEditShopModal(false);
    showToast(`تم تعديل بيانات البقالة (${newName}) بنجاح ✏️`, 'success');
  };

  const handleSaveReminderSchedule = (shopId: string) => {
    const days = Math.max(1, Number(reminderDaysInput) || 7);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    setShops(prev => prev.map(s => {
      if (s.id === shopId) {
        return {
          ...s,
          reminderDays: days,
          reminderDueDate: dueDateStr,
          reminderNotes: reminderNotesInput.trim() || undefined,
          showDebtAlert: showDebtAlertInput
        };
      }
      return s;
    }));

    showToast(`تم جدولة التذكير بنجاح بعد ${days} أيام (الاستحقاق: ${dueDateStr}) ⏰`, 'success');
  };

  // States for Add Invoice Modal inside Grocery Accounts
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [addInvoiceShopId, setAddInvoiceShopId] = useState<string>('');
  const [addInvoiceType, setAddInvoiceType] = useState<CalculatorType>(CalculatorType.REGULAR);
  const [addInvoiceQuantities, setAddInvoiceQuantities] = useState<Record<number, number>>({
    100: 0, 200: 0, 250: 0, 300: 0, 500: 0
  });
  const [addInvoiceReceived, setAddInvoiceReceived] = useState<string>('');
  const [addInvoicePaymentType, setAddInvoicePaymentType] = useState<'آجل' | 'نقد'>('آجل');
  const [addInvoiceNotes, setAddInvoiceNotes] = useState<string>('');

  const openAddInvoiceForShop = (targetShopId?: string) => {
    const shopToSelect = targetShopId || selectedShopId || (shops[0]?.id || '');
    setAddInvoiceShopId(shopToSelect);
    setAddInvoiceType(CalculatorType.REGULAR);
    setAddInvoiceQuantities({ 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 });
    setAddInvoiceReceived('');
    setAddInvoicePaymentType('آجل');
    setAddInvoiceNotes('');
    setShowAddInvoiceModal(true);
  };

  const activePrices = (prices && prices[addInvoiceType]) || INITIAL_PRICES[addInvoiceType];
  const invoiceTotalAmount = useMemo(() => {
    return activePrices.reduce((sum, p) => {
      const q = addInvoiceQuantities[p.id] || 0;
      return sum + (q * p.price);
    }, 0);
  }, [activePrices, addInvoiceQuantities]);

  const handleConfirmAddInvoice = () => {
    const targetShop = shops.find(s => s.id === addInvoiceShopId);
    if (!targetShop) {
      showToast('يرجى اختيار البقالة أولاً ⚠️', 'error');
      return;
    }

    if (invoiceTotalAmount <= 0) {
      showToast('يرجى تحديد كمية الكروت أولاً (المبلغ الإجمالي صفر)! ⚠️', 'error');
      return;
    }

    const soldItems = activePrices
      .filter(p => (addInvoiceQuantities[p.id] || 0) > 0)
      .map(p => ({
        label: p.label,
        category: p.id,
        quantity: addInvoiceQuantities[p.id],
        price: p.price,
        total: (addInvoiceQuantities[p.id] || 0) * p.price
      }));

    let recAmount = Number(addInvoiceReceived) || 0;
    if (recAmount > invoiceTotalAmount) recAmount = invoiceTotalAmount;

    let isCredit = addInvoicePaymentType === 'آجل';
    if (recAmount > 0 && recAmount < invoiceTotalAmount) {
      isCredit = true;
    }
    const paymentTypeSelected: 'نقد' | 'آجل' = isCredit ? 'آجل' : 'نقد';
    if (paymentTypeSelected === 'نقد' && recAmount === 0) {
      recAmount = invoiceTotalAmount;
    }

    const invoiceIdGenerated = 'INV-' + Date.now().toString(36).substring(4).toUpperCase();
    const today = new Date().toISOString().split('T')[0];

    // 1. Add records to salesHistory (daily sales)
    const newRecords: SaleRecord[] = soldItems.map(item => ({
      date: today,
      type: addInvoiceType,
      category: item.category,
      quantity: item.quantity,
      total: item.total,
      shopName: targetShop.name,
      paymentType: paymentTypeSelected,
      receivedAmount: recAmount,
      remainingAmount: invoiceTotalAmount - recAmount,
      invoiceId: invoiceIdGenerated,
      totalInvoiceAmount: invoiceTotalAmount
    }));

    setSalesHistory(prev => [...prev, ...newRecords]);

    // 2. Add transaction to shop in shops state
    const newTx: ShopTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      date: today,
      type: 'sale',
      amount: invoiceTotalAmount,
      notes: addInvoiceNotes.trim() || `فاتورة كروت مبيعات (${paymentTypeSelected === 'آجل' ? 'آجل' : 'نقداً'}) بقيمة ${invoiceTotalAmount} ريال`,
      invoiceId: invoiceIdGenerated,
      items: soldItems
    };

    const paymentTx: ShopTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      date: today,
      type: 'payment',
      amount: recAmount,
      notes: `سداد واصل كاش من الفاتورة بقيمة ${recAmount} ريال`,
      invoiceId: invoiceIdGenerated
    };

    const prevBal = targetShop.currentBalance;

    setShops(prev => prev.map(s => {
      if (s.id === targetShop.id) {
        const updatedTx = [...(s.transactions || []), newTx];
        if (recAmount > 0) {
          updatedTx.push(paymentTx);
        }
        const updatedSales = s.totalSales + invoiceTotalAmount;
        const updatedPayments = s.totalPayments + recAmount;
        return {
          ...s,
          totalSales: updatedSales,
          totalPayments: updatedPayments,
          currentBalance: updatedSales - updatedPayments,
          transactions: updatedTx
        };
      }
      return s;
    }));

    // 3. Set summary for invoice popup receipt
    const summary: SaleRecord = {
      items: soldItems,
      totalAmount: invoiceTotalAmount,
      receivedAmount: recAmount,
      remainingAmount: invoiceTotalAmount - recAmount,
      type: addInvoiceType,
      date: today,
      shopName: targetShop.name,
      zoneName: targetShop.zoneName,
      shopZone: targetShop.zoneName,
      previousBalance: prevBal,
      invoiceId: invoiceIdGenerated,
      paymentType: paymentTypeSelected
    } as any;

    if (setLastSaleSummary) {
      setLastSaleSummary(summary);
      setShowSuccessModal?.(true);
    }

    setShowAddInvoiceModal(false);
    showToast(`تم اعتماد الفاتورة بنجاح لبقالة ${targetShop.name} وحفظها في المبيعات! 🧾⚡`, 'success');
  };

  // States for Editing & Deleting Transactions inside Shops
  const [editingTx, setEditingTx] = useState<ShopTransaction | null>(null);
  const [editTxAmount, setEditTxAmount] = useState<number | string>('');
  const [editTxNotes, setEditTxNotes] = useState('');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxItems, setEditTxItems] = useState<{
    label: string;
    category: number;
    quantity: number;
    price: number;
    total: number;
  }[]>([]);
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [viewingTxDetails, setViewingTxDetails] = useState<ShopTransaction | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShopsForShare, setSelectedShopsForShare] = useState<Record<string, boolean>>({});

  const handleShareDebtDistribution = () => {
    // Total Debt Metrics
    const activeDebts = shops.filter(s => s.currentBalance > 0);
    const totalDebt = activeDebts.reduce((sum, s) => sum + s.currentBalance, 0);
    const totalDebtorsCount = activeDebts.length;
    
    // Top 5 Debtors
    const topDebtors = [...shops]
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .filter(s => s.currentBalance > 0)
      .slice(0, 5);

    let msg = `*📋 تقرير المديونيات الإجمالي - ${getNetworkName()} 📋*\n`;
    msg += `------------------------------------\n`;
    msg += `💰 *إجمالي الديون القائمة:* *${totalDebt} ريال*\n`;
    msg += `🏪 *عدد البقالات المديونة:* ${totalDebtorsCount} بقالة\n`;
    msg += `------------------------------------\n`;
    msg += `⚠️ *أعلى 5 مديونيات مطلوبة حالياً:* \n`;
    
    topDebtors.forEach((shop, index) => {
      msg += `*${index + 1}.* *${shop.name}* : ${shop.currentBalance} ريال\n`;
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

  const [chartLimit, setChartLimit] = useState<number>(10);
  const [chartSelectedShop, setChartSelectedShop] = useState<ShopAccount | null>(null);
  const [chartOnlyExceeding, setChartOnlyExceeding] = useState<boolean>(false);

  const debtShopsData = useMemo(() => {
    let list = shops
      .filter(s => s.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
    if (chartOnlyExceeding) {
      list = list.filter(s => s.currentBalance > balanceLimit);
    }
    if (chartLimit > 0) {
      return list.slice(0, chartLimit);
    }
    return list;
  }, [shops, chartLimit, chartOnlyExceeding, balanceLimit]);

  const debtMetrics = useMemo(() => {
    const activeDebts = shops.filter(s => s.currentBalance > 0);
    const totalDebt = activeDebts.reduce((sum, s) => sum + s.currentBalance, 0);
    const maxDebt = activeDebts.length > 0 ? Math.max(...activeDebts.map(s => s.currentBalance)) : 0;
    const avgDebt = activeDebts.length > 0 ? Math.round(totalDebt / activeDebts.length) : 0;
    return {
      totalDebt,
      maxDebt,
      avgDebt,
      count: activeDebts.length
    };
  }, [shops]);

  const handleShareDebt = (platform: 'whatsapp' | 'sms') => {
    const list = shops
      .filter(s => s.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
      
    if (list.length === 0) {
      showToast('لا توجد مديونيات قائمة لمشاركتها! 🎉', 'info');
      return;
    }

    const totalDebt = list.reduce((sum, s) => sum + s.currentBalance, 0);
    const topDebtors = list.slice(0, 5);

    let message = `📊 *تقرير مديونيات البقالات - حاسبتي*\n\n`;
    message += `💰 *إجمالي المديونيات القائمة:* ${totalDebt.toLocaleString('ar-YE')} ريال يمني\n`;
    message += `🏪 *عدد البقالات المدينة:* ${list.length} بقالة\n\n`;
    message += `⚠️ *البقالات الأكثر مديونية:*\n`;

    topDebtors.forEach((shop, index) => {
      message += `${index + 1}. ${shop.name}: ${shop.currentBalance.toLocaleString('ar-YE')} ريال`;
      if (shop.phone) {
        message += ` (تلفون: ${shop.phone})`;
      }
      message += `\n`;
    });

    if (list.length > 5) {
      message += `... وتوجد مديونيات أخرى لبقية البقالات المسجلة.\n`;
    }

    message += `\nتم تصدير هذا التقرير من تطبيق *حاسبتي* 📱`;

    if (platform === 'whatsapp') {
      openWhatsAppDirect(undefined, message);
    } else {
      const cleanMsg = message.replace(/\*/g, '');
      const smsUrl = `sms:?&body=${encodeURIComponent(cleanMsg)}`;
      window.open(smsUrl, '_blank');
    }
  };

  const overdueShops = useMemo(() => {
    return shops.filter(s => s.currentBalance > balanceLimit);
  }, [shops, balanceLimit]);

  const getTxItems = (tx: ShopTransaction) => {
    // 1. If items are directly attached to the transaction, use them!
    if (tx.items && tx.items.length > 0) {
      return tx.items;
    }
    
    // 2. Otherwise, look up in salesHistory
    try {
      const salesHistory = JSON.parse(localStorage.getItem('sales_history') || '[]');
      if (tx.invoiceId) {
        const matched = salesHistory.filter((r: any) => r.invoiceId === tx.invoiceId);
        if (matched.length > 0) {
          return matched.map((r: any) => ({
            label: `فئة ${r.category} ريال`,
            category: r.category,
            quantity: r.quantity,
            price: r.total / r.quantity,
            total: r.total
          }));
        }
      }
      
      // 3. Fallback to matching by date & shopName & total amount
      const currentSelectedShopName = shops.find(s => s.id === selectedShopId)?.name;
      if (currentSelectedShopName) {
        const dateMatched = salesHistory.filter((r: any) => 
          r.shopName?.toLowerCase() === currentSelectedShopName.toLowerCase() && 
          r.date === tx.date
        );
        if (dateMatched.length > 0) {
          // Check if there are matches where the sum or elements match the tx.amount
          // If we group by invoiceId, can we find one that matches?
          const groupedByInvoice: Record<string, any[]> = {};
          dateMatched.forEach((r: any) => {
            const key = r.invoiceId || 'unknown';
            if (!groupedByInvoice[key]) groupedByInvoice[key] = [];
            groupedByInvoice[key].push(r);
          });

          for (const key of Object.keys(groupedByInvoice)) {
            const group = groupedByInvoice[key];
            const sum = group.reduce((s, r) => s + r.total, 0);
            if (sum === tx.amount) {
              return group.map((r: any) => ({
                label: `فئة ${r.category} ريال`,
                category: r.category,
                quantity: r.quantity,
                price: r.total / r.quantity,
                total: r.total
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error('Error matching sales history items:', e);
    }
    return null;
  };

  const handleOpenOrCreate = () => {
    const name = newShopName.trim();
    if (!name) {
      showToast('يرجى كتابة اسم البقالة أولاً!', 'error');
      return;
    }

    const existing = shops.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedShopId(existing.id);
      setNewShopName('');
      setNewShopPhone('');
      setNewShopInitialBalance('');
      setNewShopIsPro(false);
      showToast(`تم فتح حساب بقالة ${existing.name} بنجاح`, 'success');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const initBal = Number(newShopInitialBalance) || 0;
      const matchedZone = zones.find(z => z.id === newShopZoneId);
      const newAcc: ShopAccount = {
        id: 'ACC-' + Math.floor(1000 + Math.random() * 9000),
        name,
        phone: newShopPhone.trim() ? formatYemeniPhone(newShopPhone) : undefined,
        emoji: newShopEmoji,
        isPro: newShopIsPro,
        zoneId: matchedZone ? matchedZone.id : undefined,
        zoneName: matchedZone ? matchedZone.name : undefined,
        totalSales: initBal,
        totalPayments: 0,
        currentBalance: initBal,
        createdAt: today,
        transactions: initBal > 0 ? [{
          id: 'INIT-' + Math.random().toString(36).substring(2, 9),
          date: today,
          type: 'sale',
          amount: initBal,
          notes: 'رصيد افتتاحي (مديونية سابقة)'
        }] : []
      };
      setShops(prev => [...prev, newAcc]);
      setSelectedShopId(newAcc.id);
      setNewShopName('');
      setNewShopPhone('');
      setNewShopInitialBalance('');
      setNewShopIsPro(false);
      setNewShopEmoji('🔴');
      setNewShopZoneId('');
      showToast(`تم إنشاء حساب جديد بنجاح لبقالة ${name}`, 'success');
    }
  };

  const handleRecordPayment = () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر', 'error');
      return;
    }

    if (!selectedShopId) return;

    const targetShop = shops.find(s => s.id === selectedShopId);
    const paymentTxId = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    if (targetShop) {
      const today = new Date().toISOString().split('T')[0];
      const prevBal = targetShop.currentBalance;
      const remBal = prevBal - amount;
      const notesVal = paymentNotes.trim() || 'سداد نقدي مستلم من العميل';

      // Set payment summary for success modal & WhatsApp sharing
      setLastPaymentSummary({
        txId: paymentTxId,
        shopName: targetShop.name,
        amount: amount,
        previousBalance: prevBal,
        remainingBalance: remBal,
        date: today,
        notes: notesVal,
        phone: targetShop.phone
      });

      const paymentSummary = {
        items: [],
        totalAmount: 0,
        receivedAmount: amount,
        remainingAmount: remBal,
        type: CalculatorType.REGULAR,
        date: today,
        shopName: targetShop.name,
        previousBalance: prevBal,
        transactionId: paymentTxId
      };

      // Set global sale summary for thermal print rendering in App
      setLastSaleSummary?.(paymentSummary as any);

      // Auto-download the PDF using active thermal mode preference
      downloadInvoicePDF(paymentSummary, isThermalMode);
    }

    setShops(prev => {
      return prev.map(s => {
        if (s.id === selectedShopId) {
          const today = new Date().toISOString().split('T')[0];
          const newTx: ShopTransaction = {
            id: paymentTxId,
            date: today,
            type: 'payment',
            amount: amount,
            notes: paymentNotes.trim() || 'سداد نقدي مستلم من العميل'
          };
          const updatedPayments = s.totalPayments + amount;
          return {
            ...s,
            totalPayments: updatedPayments,
            currentBalance: s.totalSales - updatedPayments,
            transactions: [...(s.transactions || []), newTx]
          };
        }
        return s;
      });
    });

    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentModal(false);
    setShowPaymentSuccessModal(true);
    showToast('تم تسجيل الدفعة المسددة بنجاح وتحميل سند واصل تلقائياً 💵', 'success');
  };

  const handleSaveQuickPayment = () => {
    const amount = Number(quickPaymentAmount);
    if (!amount || amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر ⚠️', 'error');
      return;
    }

    if (!quickPaymentShopId) {
      showToast('يرجى اختيار العميل أو البقالة أولاً ⚠️', 'error');
      return;
    }

    const targetShop = shops.find(s => s.id === quickPaymentShopId);
    const paymentTxId = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    if (targetShop) {
      const today = new Date().toISOString().split('T')[0];
      const prevBal = targetShop.currentBalance;
      const remBal = prevBal - amount;
      const notesVal = quickPaymentNotes.trim() || 'سداد نقدي مستلم من العميل';

      // Set payment summary for success modal & WhatsApp sharing
      setLastPaymentSummary({
        txId: paymentTxId,
        shopName: targetShop.name,
        amount: amount,
        previousBalance: prevBal,
        remainingBalance: remBal,
        date: today,
        notes: notesVal,
        phone: targetShop.phone
      });

      const paymentSummary = {
        items: [],
        totalAmount: 0,
        receivedAmount: amount,
        remainingAmount: remBal,
        type: CalculatorType.REGULAR,
        date: today,
        shopName: targetShop.name,
        previousBalance: prevBal,
        transactionId: paymentTxId
      };

      // Set global sale summary for thermal print rendering in App
      setLastSaleSummary?.(paymentSummary as any);

      // Auto-download the PDF using active thermal mode preference
      downloadInvoicePDF(paymentSummary, isThermalMode);
    }

    setShops(prev => {
      return prev.map(s => {
        if (s.id === quickPaymentShopId) {
          const today = new Date().toISOString().split('T')[0];
          const newTx: ShopTransaction = {
            id: paymentTxId,
            date: today,
            type: 'payment',
            amount: amount,
            notes: quickPaymentNotes.trim() || 'سداد نقدي مستلم من العميل'
          };
          const updatedPayments = s.totalPayments + amount;
          return {
            ...s,
            totalPayments: updatedPayments,
            currentBalance: s.totalSales - updatedPayments,
            transactions: [...(s.transactions || []), newTx]
          };
        }
        return s;
      });
    });

    setQuickPaymentAmount('');
    setQuickPaymentNotes('');
    setQuickPaymentShopId('');
    setQuickPaymentSearch('');
    setShowQuickPaymentModal(false);
    setShowPaymentSuccessModal(true);
    showToast('تم تسجيل الدفعة المسددة بنجاح وتحميل سند واصل تلقائياً 💵', 'success');
  };

  const handleUpdateTransaction = () => {
    if (!selectedShopId || !editingTx) return;
    const amountNum = Number(editTxAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر', 'error');
      return;
    }

    setShops(prev => {
      return prev.map(s => {
        if (s.id === selectedShopId) {
          const updatedTxs = (s.transactions || []).map(t => {
            if (t.id === editingTx.id) {
              return {
                ...t,
                amount: amountNum,
                notes: editTxNotes.trim() || 'تعديل عملية تفصيلية',
                date: editTxDate || t.date,
                items: editingTx.type === 'sale' ? editTxItems : undefined
              };
            }
            return t;
          });

          // Recalculate totalSales, totalPayments and currentBalance
          const newSales = updatedTxs.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
          const newPayments = updatedTxs.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

          return {
            ...s,
            totalSales: newSales,
            totalPayments: newPayments,
            currentBalance: newSales - newPayments,
            transactions: updatedTxs
          };
        }
        return s;
      });
    });

    // Sync with salesHistory for invoices/sales
    if (editingTx.type === 'sale') {
      const targetShopName = shops.find(s => s.id === selectedShopId)?.name || 'بقالة عامة';
      setSalesHistory(prev => {
        // Remove all previous records linked to this transaction/invoice
        const cleanPrev = editingTx.invoiceId 
          ? prev.filter(rec => rec.invoiceId !== editingTx.invoiceId)
          : prev.filter(rec => !(rec.shopName === targetShopName && rec.date === editingTx.date && rec.totalInvoiceAmount === editingTx.amount));

        // Recreate new SaleRecords from editTxItems
        const generatedRecords: SaleRecord[] = editTxItems.map(item => {
          const isPro = item.label?.toLowerCase().includes('pro');
          return {
            date: editTxDate || editingTx.date,
            type: isPro ? CalculatorType.PRO : CalculatorType.REGULAR,
            category: item.category,
            quantity: item.quantity,
            total: item.total,
            shopName: targetShopName,
            paymentType: 'آجل',
            receivedAmount: 0,
            remainingAmount: amountNum,
            invoiceId: editingTx.invoiceId || 'INV-UPD-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            totalInvoiceAmount: amountNum
          };
        });

        // Fallback if there are no items
        if (generatedRecords.length === 0) {
          generatedRecords.push({
            date: editTxDate || editingTx.date,
            type: CalculatorType.REGULAR,
            category: amountNum,
            quantity: 1,
            total: amountNum,
            shopName: targetShopName,
            paymentType: 'آجل',
            receivedAmount: 0,
            remainingAmount: amountNum,
            invoiceId: editingTx.invoiceId || 'INV-UPD-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            totalInvoiceAmount: amountNum
          });
        }

        return [...cleanPrev, ...generatedRecords];
      });
    }

    setShowEditTxModal(false);
    setIsEditingDetails(false);
    setEditingTx(null);
    setViewingTxDetails(null);
    showToast('تم تعديل العملية الحسابية وتحديث الرصيد الإجمالي بنجاح ✏️', 'success');
  };

  const handleDeleteTransaction = (txId: string) => {
    if (!selectedShopId) return;
    const targetShop = shops.find(s => s.id === selectedShopId);
    const txToDelete = targetShop?.transactions?.find(t => t.id === txId);

    setShops(prev => {
      return prev.map(s => {
        if (s.id === selectedShopId) {
          const updatedTxs = (s.transactions || []).filter(t => t.id !== txId);

          // Recalculate totalSales, totalPayments and currentBalance
          const newSales = updatedTxs.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
          const newPayments = updatedTxs.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

          return {
            ...s,
            totalSales: newSales,
            totalPayments: newPayments,
            currentBalance: newSales - newPayments,
            transactions: updatedTxs
          };
        }
        return s;
      });
    });

    // Sync deletion with salesHistory
    if (txToDelete && txToDelete.type === 'sale') {
      setSalesHistory(prev => {
        return prev.filter(rec => {
          const isMatch = (txToDelete.invoiceId && rec.invoiceId === txToDelete.invoiceId) ||
            (!txToDelete.invoiceId && rec.shopName === targetShop?.name && rec.date === txToDelete.date && rec.totalInvoiceAmount === txToDelete.amount);
          return !isMatch;
        });
      });
    }

    setDeletingTxId(null);
    showToast('تم حذف العملية الحسابية وتحديث الرصيد الإجمالي بنجاح 🗑️', 'success');
  };

  const handleDeleteShop = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف حساب "${name}" بالكامل؟ سيتم مسح المعاملات المسجلة له.`)) {
      setShops(prev => prev.filter(s => s.id !== id));
      if (selectedShopId === id) setSelectedShopId(null);
      showToast(`تم حذف حساب ${name} بنجاح`, 'info');
    }
  };

  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = [...shops];

    // Sort by latest transaction or activity first (latest date string first)
    result.sort((a, b) => {
      const getLatestDate = (shop: ShopAccount) => {
        if (shop.transactions && shop.transactions.length > 0) {
          const dates = shop.transactions.map(t => t.date).filter(Boolean);
          if (dates.length > 0) {
            return dates.reduce((latest, current) => current > latest ? current : latest);
          }
        }
        return shop.createdAt || '1970-01-01';
      };

      const dateA = getLatestDate(a);
      const dateB = getLatestDate(b);

      if (dateA !== dateB) {
        return dateB.localeCompare(dateA); // Descending order (latest first)
      }

      // If dates are equal, put the shop with the higher balance first
      if (b.currentBalance !== a.currentBalance) {
        return b.currentBalance - a.currentBalance;
      }
      return b.name.localeCompare(a.name);
    });

    if (q) {
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (showOnlyDebtors) {
      result = result.filter(s => s.currentBalance > 0);
    }
    if (selectedZoneFilter !== 'all') {
      if (selectedZoneFilter === 'unassigned') {
        result = result.filter(s => !s.zoneId && !s.zoneName);
      } else {
        result = result.filter(s => s.zoneId === selectedZoneFilter || s.zoneName === selectedZoneFilter);
      }
    }
    return result;
  }, [shops, searchQuery, showOnlyDebtors, selectedZoneFilter]);

  const [shopTxFilter, setShopTxFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const selectedShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  const filteredShopTxs = useMemo(() => {
    if (!selectedShop || !selectedShop.transactions) return [];
    if (shopTxFilter === 'all') return selectedShop.transactions;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return selectedShop.transactions.filter(tx => {
      if (!tx.date) return false;
      const txDateStr = tx.date.split('T')[0].trim();
      
      if (shopTxFilter === 'today') {
        return txDateStr === todayStr;
      }

      const d = new Date(txDateStr);
      if (isNaN(d.getTime())) return true;

      if (shopTxFilter === 'week') {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      if (shopTxFilter === 'month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }

      return true;
    });
  }, [selectedShop, shopTxFilter]);

  return (
    <div className="p-4 space-y-4">
      {/* Show tab controls only if no shop is actively selected for detail view */}
      {!selectedShop && (
        <div className="bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl flex items-center justify-between gap-1 w-full border border-slate-200/20 shadow-inner select-none mb-1">
          <button
            onClick={() => setSubTab('list')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'list'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>الحسابات والديون</span>
          </button>
          <button
            onClick={() => setSubTab('add')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'add'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus size={14} />
            <span>تسجيل بقالة</span>
          </button>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('followup')}
              className="flex-1 py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer text-amber-600 dark:text-amber-400 hover:bg-white/60 dark:hover:bg-slate-950/60"
              title="الانتقال إلى قسم المتابعة والركود والبقالات الأكثر نشاطاً"
            >
              <Activity size={14} className="text-amber-500" />
              <span>المتابعة والركود ⏱️</span>
            </button>
          )}
        </div>
      )}

      {/* Adding a shop is restricted ONLY to the subTab === 'add' view */}
      {!selectedShop && subTab === 'add' && (
        <motion.div
          key="add-shop-tab"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-4"
        >
          {/* Smart Bento Registration Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-5.5 border border-slate-150/80 dark:border-slate-800 shadow-md space-y-5 text-right">
            
            {/* Header Section */}
            <div className="flex items-start gap-3.5 flex-row-reverse">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
                <Users size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">تسجيل حساب بقالة جديد</h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-extrabold leading-relaxed">
                  أنشئ حساباً مخصصاً لتسجيل وسحب مبيعات الكروت بالآجل ومتابعة المديونيات بشكل تلقائي وذكي.
                </p>
              </div>
            </div>

            {/* Smart Status Badge */}
            {(() => {
              const name = newShopName.trim();
              if (!name) {
                return (
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center text-[10px] font-extrabold text-slate-400 leading-relaxed">
                    💡 اكتب اسم البقالة بالأسفل للتحقق من التوفر
                  </div>
                );
              }
              const exists = shops.some(s => s.name.toLowerCase() === name.toLowerCase());
              if (exists) {
                return (
                  <div 
                    onClick={() => {
                      const shopObj = shops.find(s => s.name.toLowerCase() === name.toLowerCase());
                      if (shopObj) {
                        setSelectedShopId(shopObj.id);
                        setSubTab('list');
                        setNewShopName('');
                        showToast(`تم الانتقال لحساب بقالة ${shopObj.name}`, 'info');
                      }
                    }}
                    className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center text-[10.5px] font-black text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-100/80 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>⚠️ هذا الاسم مسجل مسبقاً! انقر هنا لفتح ملف حسابه الحالي مباشرة</span>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center text-[10.5px] font-black text-emerald-700 dark:text-emerald-400">
                  ✨ الاسم متاح ومثالي لتسجيل حساب جديد ومستقل
                </div>
              );
            })()}

            {/* Inputs Form */}
            <div className="space-y-4">
              
              {/* Shop Name Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <button
                    type="button"
                    onClick={() => onOpenContactPicker((name, phone) => {
                      setNewShopName(name);
                      setNewShopPhone(phone);
                    })}
                    className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    <Contact size={12} />
                    <span>اختر من جهات الاتصال</span>
                  </button>
                  <label className="text-xs font-black text-slate-550 dark:text-slate-400">اسم البقالة / العميل <span className="text-red-500">*</span></label>
                </div>
                <input 
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="مثال: بقالة النور والبركة"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-colors text-right"
                />
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Initial Balance */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 block mb-0.5">الرصيد الافتتاحي (دين سابق)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={newShopInitialBalance}
                      onChange={(e) => setNewShopInitialBalance(e.target.value)}
                      placeholder="0 (اختياري)"
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black outline-none focus:border-blue-500 transition-colors text-right font-sans"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400">ريال</span>
                  </div>
                </div>

                {/* Phone number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 block mb-0.5">رقم هاتف البقالة (واتساب)</label>
                  <input 
                    type="text"
                    value={newShopPhone}
                    onChange={(e) => setNewShopPhone(e.target.value)}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val.trim()) {
                        setNewShopPhone(formatYemeniPhone(val));
                      }
                    }}
                    placeholder="773086403 (اختياري)"
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black outline-none focus:border-blue-500 transition-colors text-right font-sans"
                  />
                </div>

              </div>

              {/* Zone / Neighborhood Selection */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] text-slate-400 font-bold">لتحديد وتجميع البقالات حسب الحارات</span>
                  <label className="text-[11px] font-black text-slate-800 dark:text-white flex items-center gap-1">
                    <span>المربع / الحارة 📍</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingZone(null);
                      setZoneNameInput('');
                      setZoneDescInput('');
                      setShowZoneModal(true);
                    }}
                    className="px-3 py-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 rounded-2xl text-xs font-black hover:bg-blue-100 cursor-pointer shrink-0 active:scale-95 transition-all flex items-center gap-1"
                    title="إضافة مربع جديد الآن"
                  >
                    <Plus size={13} />
                    <span>مربع جديد</span>
                  </button>
                  <select
                    value={newShopZoneId}
                    onChange={(e) => setNewShopZoneId(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-right cursor-pointer"
                  >
                    <option value="">-- بدون تحديد مربع (عام) --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>📍 {z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emoji/Color Selection */}
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-extrabold">اختر لون الرمز التعريفي للبقالة</span>
                  <label className="text-[11px] font-black text-slate-800 dark:text-white">رمز/لون البقالة 🔴</label>
                </div>
                <div className="flex flex-wrap justify-end gap-2.5">
                  {['🔴', '🟠', '⚪', '⚫', '🟤', '🟣', '🔵', '🟢', '🟡'].map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setNewShopEmoji(em)}
                      className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                        newShopEmoji === em
                          ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500 scale-110'
                          : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pro Status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl cursor-pointer" onClick={() => setNewShopIsPro(!newShopIsPro)}>
                <input 
                  type="checkbox"
                  checked={newShopIsPro}
                  onChange={(e) => setNewShopIsPro(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-right flex flex-col">
                  <span className="text-[11px] font-black text-slate-800 dark:text-white">حساب بقالة متميز (PRO) ✨</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-0.5">يضيف شارة مميزة بجانب البقالة ويظهرها بشكل فريد في كشوفات الحساب والتقارير.</span>
                </div>
              </div>

            </div>

            {/* Submit Action Button */}
            <button
              onClick={() => {
                const name = newShopName.trim();
                if (!name) {
                  showToast('يرجى كتابة اسم البقالة أولاً!', 'error');
                  return;
                }
                handleOpenOrCreate();
                // If created successfully, go back to list
                setSubTab('list');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all shadow-md"
            >
              <Plus size={14} />
              <span>إتمام تسجيل حساب البقالة</span>
            </button>

          </div>

          {/* Quick Guide Bento Card */}
          <div className="bg-slate-100/50 dark:bg-slate-900/30 p-5 rounded-3xl border border-slate-200/40 dark:border-slate-800/80 text-right space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1.5">
              <span>💡 دليل سريع للاستخدام الذكي للبقالات</span>
            </h4>
            <ul className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-500 font-extrabold list-disc pr-4 leading-relaxed">
              <li>الرصيد الافتتاحي هو أي مديونيات أو مبالغ مستحقة على البقالة <strong>قبل</strong> تشغيل التطبيق.</li>
              <li>تسجيل رقم الهاتف الصحيح يساعدك على إرسال فواتير فورية أو كشوفات كاش عبر واتساب بضغطة زر واحدة.</li>
              <li>بعد التسجيل، ستظهر البقالة تلقائياً كخيار آجل متاح في حاسبة الكروت عند إتمام أي عملية بيع.</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Show search query only if in list tab */}
      {!selectedShop && subTab === 'list' && shops.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 بحث سريع عن حساب بقالة بالاسم..."
              className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none text-slate-950 dark:text-white placeholder:text-slate-400 focus:border-slate-300 transition-colors text-right"
            />
          </div>
          
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100/60 dark:border-slate-800/40 select-none">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-extrabold">تصفية حسابات البقالات:</span>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                إظهار الديون المستحقة فقط (رصيد متبقي أكبر من صفر)
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={showOnlyDebtors} 
                  onChange={(e) => setShowOnlyDebtors(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-650 peer-checked:bg-red-500"></div>
              </div>
            </label>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedShop ? (
          <motion.div
            key={selectedShop.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5"
          >
            {/* زر الرجوع المخصص البارز للعودة إلى قائمة البقالات */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setSelectedShopId(null)}
                className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-slate-750 dark:hover:to-slate-800 text-blue-700 dark:text-blue-300 border-2 border-blue-400/50 dark:border-blue-500/40 hover:border-blue-600 dark:hover:border-blue-400 rounded-2xl text-xs font-black shadow-sm hover:shadow active:scale-95 active:bg-blue-200/60 dark:active:bg-slate-700 transition-all duration-150 cursor-pointer select-none"
              >
                <div className="w-6 h-6 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center group-hover:-translate-x-0.5 transition-transform shadow-xs">
                  <ArrowRight size={14} className="stroke-[3]" />
                </div>
                <span>العودة إلى قائمة البقالات</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span>حساب تفصيلي</span>
                <span className="text-sm select-none">{selectedShop.emoji || '🔴'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-3">
              <div className="space-y-1.5 text-right flex-1 min-w-[200px]">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">البصمة المالية للبقالة</span>
                <div className="flex items-center justify-end gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditShopName(selectedShop.name);
                      setEditShopPhone(selectedShop.phone || '');
                      setEditShopEmoji(selectedShop.emoji || '🔴');
                      setEditShopZoneId(selectedShop.zoneId || '');
                      setShowEditShopModal(true);
                    }}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs font-black hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                    title="تعديل اسم البقالة ورقم الهاتف والمربع"
                  >
                    <Pencil size={12} />
                    <span>تعديل ✏️</span>
                  </button>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedShop.name}</h3>
                  <span className="text-xl select-none" title="رمز البقالة">{selectedShop.emoji || '🔴'}</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                  {selectedShop.zoneName && (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 text-[10px] font-black flex items-center gap-1">
                      <MapPin size={10} />
                      <span>{selectedShop.zoneName}</span>
                    </span>
                  )}
                  <span>رقم الحساب: {selectedShop.id}</span>
                </div>
                
                {/* تعديل المربع / الحارة من داخل البقالة */}
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <select
                    value={selectedShop.zoneId || ''}
                    onChange={(e) => {
                      const zId = e.target.value;
                      const matchedZ = zones.find(z => z.id === zId);
                      setShops(prev => prev.map(s => s.id === selectedShop.id ? {
                        ...s,
                        zoneId: matchedZ ? matchedZ.id : undefined,
                        zoneName: matchedZ ? matchedZ.name : undefined
                      } : s));
                      showToast(matchedZ ? `تم تعيين المربع إلى (${matchedZ.name}) بنجاح 📍` : 'تم إلغاء تحديد المربع', 'success');
                    }}
                    className="px-3 py-1.5 bg-slate-55 dark:bg-slate-950 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-bold w-48 text-right cursor-pointer"
                  >
                    <option value="">-- بدون مربع محدد (عام) --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>📍 {z.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-450 font-extrabold select-none">المربع / الحارة:</span>
                </div>

                {/* تعديل الهاتف */}
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <input 
                    type="text"
                    value={selectedShop.phone || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, phone: val || undefined } : s));
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val.trim()) {
                        const formatted = formatYemeniPhone(val);
                        setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, phone: formatted || undefined } : s));
                      }
                    }}
                    placeholder="الهاتف (مثال: 774474046)"
                    className="px-3 py-1.5 bg-slate-55 dark:bg-slate-950 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-sans w-40 text-center"
                  />
                  <span className="text-xs text-slate-450 font-extrabold select-none">رقم الواتساب:</span>
                </div>

                {/* تعديل الأيموجي */}
                <div className="flex items-center gap-1.5 mt-2.5 justify-end flex-wrap">
                  <div className="flex gap-1 flex-row-reverse">
                    {['🔴', '🟠', '⚪', '⚫', '🟤', '🟣', '🔵', '🟢', '🟡'].map(em => (
                      <button
                        key={em}
                        onClick={() => {
                          setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, emoji: em } : s));
                          showToast(`تم تغيير رمز البقالة إلى ${em} بنجاح`, 'success');
                        }}
                        className={`w-6 h-6 text-xs flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-90 transition-all ${selectedShop.emoji === em || (!selectedShop.emoji && em === '🔴') ? 'bg-slate-200 dark:bg-slate-800 scale-110 ring-1 ring-blue-500' : ''}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-450 font-extrabold select-none">تعديل الرمز:</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button 
                  onClick={() => window.history.back()}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-xl text-xs font-black transition-colors cursor-pointer text-center"
                >
                  رجوع للقائمة
                </button>
                <button
                  onClick={() => {
                    // Share individual statement via custom generator
                    const timestamp = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
                    const today = new Date().toISOString().split('T')[0];
                    let msg = `*📄 كشف حساب مالي - ${getNetworkName()} 📄*\n`;
                    msg += `*العميل / البقالة:* ${selectedShop.name}\n`;
                    msg += `*التاريخ:* ${today} - *الوقت:* ${timestamp}\n`;
                    msg += `*رقم الحساب:* \`${selectedShop.id}\`\n`;
                    msg += `------------------------------------\n`;
                    msg += `💵 *إجمالي المسحوبات:* *${selectedShop.totalSales} ريال*\n`;
                    msg += `📥 *إجمالي المدفوعات:* *${selectedShop.totalPayments} ريال*\n`;
                    msg += `------------------------------------\n`;
                    if (selectedShop.currentBalance > 0) {
                      msg += `🚨 *الرصيد المتبقي المستحق (عليه):* *${selectedShop.currentBalance} ريال*\n`;
                    } else if (selectedShop.currentBalance < 0) {
                      msg += `🚨 *الرصيد الزائد له (له متبقي):* *${Math.abs(selectedShop.currentBalance)} ريال*\n`;
                    } else {
                      msg += `✅ *رصيد الحساب:* خالص ومسدد بالكامل\n`;
                    }
                    msg += `------------------------------------\n`;
                    msg += `📜 *[ لسنا الوحيدون ولكننا الافضل ]*`;
                    
                    const destPhone = selectedShop.phone?.trim() ? selectedShop.phone.trim() : '';
                    openWhatsAppDirect(destPhone, msg);
                    showToast('تم فتح واتساب لإرسال كشف الحساب 💬', 'success');
                  }}
                  className="px-3.5 py-2 bg-green-550 hover:bg-green-600 dark:bg-green-600 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 size={13} />
                  <span>مشاركة الحساب 💬</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-right">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-extrabold mb-1">المبيعات</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-sans">{selectedShop.totalSales}</span>
                <span className="text-[9px] text-slate-400 mt-0.5">ريال</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-extrabold mb-1">المدفوعات</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-sans">{selectedShop.totalPayments}</span>
                <span className="text-[9px] text-emerald-500 font-bold mt-0.5">تم السداد</span>
              </div>
              <div className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border transition-all ${
                selectedShop.currentBalance > 0 
                  ? 'bg-red-50/50 dark:bg-red-950/10 border-red-100/50 dark:border-red-950/20' 
                  : selectedShop.currentBalance < 0 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-950/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'
              }`}>
                <span className={`text-[10px] font-extrabold mb-1 ${
                  selectedShop.currentBalance > 0 ? 'text-red-500/80' : selectedShop.currentBalance < 0 ? 'text-emerald-500/80' : 'text-slate-400'
                }`}>
                  {selectedShop.currentBalance > 0 ? 'الرصيد المتبقي' : selectedShop.currentBalance < 0 ? 'الرصيد الزائد له' : 'رصيد الحساب'}
                </span>
                <span className={`text-sm font-black font-sans ${
                  selectedShop.currentBalance > 0 ? 'text-red-600 dark:text-red-400' : selectedShop.currentBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {Math.abs(selectedShop.currentBalance)}
                </span>
                <span className={`text-[9px] font-bold uppercase mt-0.5 ${
                  selectedShop.currentBalance > 0 ? 'text-red-500/80' : selectedShop.currentBalance < 0 ? 'text-emerald-500/80' : 'text-slate-400'
                }`}>
                  {selectedShop.currentBalance > 0 ? 'مستحق' : selectedShop.currentBalance < 0 ? 'رصيد زائد له' : 'خالص / مسدد'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => openAddInvoiceForShop(selectedShop.id)}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/10"
              >
                <Plus size={16} />
                <span>إضافة فاتورة جديدة 🧾</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-500/10"
              >
                <ArrowRightLeft size={15} />
                <span>تسجيل دفعة مستلمة 💵</span>
              </button>
              <button
                onClick={() => downloadShopStatementPDF(selectedShop)}
                className="py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-red-500/10"
              >
                <FileText size={15} />
                <span>تحميل كشف PDF 📄</span>
              </button>
            </div>

            {/* قسم جدولة التذكير الآلي (واتساب) ومتابعة السداد */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3.5 text-right">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    جدولة تذكير آلي (واتساب) ومتابعة سداد المديونية
                  </h4>
                </div>
                {selectedShop.reminderDueDate && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    ⏳ الاستحقاق الحالي: {selectedShop.reminderDueDate}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. عدد الأيام */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    إرسال التذكير بعد مرور (أيام):
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[3, 7, 15, 30].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setReminderDaysInput(d)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-xl border cursor-pointer active:scale-95 transition-all ${
                          Number(reminderDaysInput) === d
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {d} أيام
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={reminderDaysInput}
                      onChange={(e) => setReminderDaysInput(e.target.value)}
                      placeholder="مخصص"
                      className="w-16 px-2 py-1 text-xs text-center font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                </div>

                {/* 2. خيار إظهار تنبيه في صفحة المديونيات */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    تنبيهات المديونية:
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDebtAlertInput}
                      onChange={(e) => setShowDebtAlertInput(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      إظهار تنبيه في صفحة المديونيات عند الاستحقاق
                    </span>
                  </label>
                </div>
              </div>

              {/* 3. ملاحظات التذكير */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  ملاحظات أو نص إضافي في رسالة التذكير (اختياري):
                </label>
                <input
                  type="text"
                  value={reminderNotesInput}
                  onChange={(e) => setReminderNotesInput(e.target.value)}
                  placeholder="مثال: يرجى تصفية الحساب لتجديد رصيد الكروت"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 text-right"
                />
              </div>

              {/* 4. أزرار الحفظ والإرسال المباشر */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSaveReminderSchedule(selectedShop.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Clock size={14} />
                  <span>حفظ وتفعيل الجدولة ⏰</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const msg = buildScheduledReminderWhatsAppText({
                      shopName: selectedShop.name,
                      currentBalance: selectedShop.currentBalance,
                      dueDate: selectedShop.reminderDueDate,
                      reminderDays: Number(reminderDaysInput) || selectedShop.reminderDays,
                      notes: reminderNotesInput || selectedShop.reminderNotes
                    });
                    openWhatsAppDirect(selectedShop.phone, msg);
                    showToast('تم فتح واتساب الأخضر العادي لإرسال رسالة التذكير 💬', 'success');
                  }}
                  className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle size={14} />
                  <span>تذكير عبر واتساب 💬</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">سجل وحركة العمليات التفصيلية</h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-sans">
                    ({filteredShopTxs.length})
                  </span>
                </div>

                {/* Time filter controls */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShopTxFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      shopTxFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setShopTxFilter('today')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      shopTxFilter === 'today'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    اليوم 📅
                  </button>
                  <button
                    type="button"
                    onClick={() => setShopTxFilter('week')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      shopTxFilter === 'week'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    الأسبوع 🗓️
                  </button>
                  <button
                    type="button"
                    onClick={() => setShopTxFilter('month')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      shopTxFilter === 'month'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    الشهر 📆
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredShopTxs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800">
                    {shopTxFilter === 'all'
                      ? 'لم تسجل أي عمليات أو دفعات بعد لهذا الحساب.'
                      : 'لا توجد عمليات مسجلة خلال هذه الفترة المحددة.'}
                  </div>
                ) : (
                  [...filteredShopTxs].reverse().map((tx) => (
                    <div 
                      key={tx.id} 
                      onClick={() => setViewingTxDetails(tx)}
                      className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl flex justify-between items-center text-xs group cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Calculate the historical balance right before this transaction
                            let prevBal = 0;
                            const txIndex = selectedShop.transactions.findIndex(t => t.id === tx.id);
                            if (txIndex !== -1) {
                              const precedingTxs = selectedShop.transactions.slice(0, txIndex);
                              const totalPrecedingSales = precedingTxs.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
                              const totalPrecedingPayments = precedingTxs.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
                              prevBal = totalPrecedingSales - totalPrecedingPayments;
                            }

                            const resolvedItems = getTxItems(tx);
                            const docSummary = {
                              items: tx.type === 'sale' ? (resolvedItems || [{
                                label: 'مبيعات كروت ' + getNetworkName(),
                                category: tx.amount,
                                quantity: 1,
                                price: tx.amount,
                                total: tx.amount
                              }]) : [],
                              totalAmount: tx.type === 'sale' ? tx.amount : 0,
                              receivedAmount: tx.type === 'payment' ? tx.amount : 0,
                              remainingAmount: tx.type === 'sale' ? tx.amount : 0,
                              type: CalculatorType.REGULAR,
                              date: tx.date,
                              shopName: selectedShop.name,
                              previousBalance: prevBal,
                              transactionId: tx.id
                            };
                            downloadInvoicePDF(docSummary, false);
                            showToast(tx.type === 'sale' ? 'تم تنزيل الفاتورة بنجاح 📄' : 'تم تنزيل واصل المسدد بنجاح 💵', 'success');
                          }}
                          title="تحميل كـ PDF"
                          className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                        >
                          <Download size={13} />
                        </button>
 
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTx(tx);
                            setEditTxAmount(tx.amount);
                            setEditTxNotes(tx.notes);
                            setEditTxDate(tx.date);
                            setEditTxItems(getTxItems(tx) || []);
                            setShowEditTxModal(true);
                          }}
                          title="تعديل العملية"
                          className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                        >
                          <Pencil size={11} />
                        </button>
 
                        {deletingTxId === tx.id ? (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-red-100 dark:bg-red-950/40 p-0.5 rounded-lg shrink-0"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTransaction(tx.id);
                              }}
                              className="px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[9px] rounded cursor-pointer transition-colors"
                            >
                              تأكيد
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingTxId(null);
                              }}
                              className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[9px] rounded cursor-pointer transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTxId(tx.id);
                            }}
                            title="حذف العملية"
                            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                        
                        <span className={`text-xs font-sans font-black select-none shrink-0 border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-1 ${tx.type === 'sale' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {tx.type === 'sale' ? '+' : '-'}{tx.amount} ريال
                        </span>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] text-slate-400 font-bold font-sans">{tx.date}</span>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${tx.type === 'sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {tx.type === 'sale' ? 'فاتورة بيع' : 'دفعة مسددة'}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-600 dark:text-slate-400 max-w-[190px] truncate">{tx.notes}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            {/* قسم إدارة وفلترة المربعات / الحارات */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 text-right">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingZone(null);
                    setZoneNameInput('');
                    setZoneDescInput('');
                    setShowZoneModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>إضافة مربع / حارة ➕</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-end gap-1.5">
                      <span>تقسيم المربعات والحارات</span>
                      <MapPin size={15} className="text-blue-500" />
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      اضغط على أي مربع لعرض البقالات التابعة له مباشرة
                    </p>
                  </div>
                </div>
              </div>

              {/* أزرار ومربعات الحارات */}
              <div className="flex flex-wrap gap-2 pt-1 justify-end items-center">
                {/* زر الكل */}
                <button
                  type="button"
                  onClick={() => setSelectedZoneFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedZoneFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>كافة البقالات</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedZoneFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {shops.length}
                  </span>
                </button>

                {/* كل مربع مع عدد البقالات وأزرار التعديل والحذف */}
                {zones.map((zone) => {
                  const zoneShopsCount = shops.filter(s => s.zoneId === zone.id || s.zoneName === zone.name).length;
                  const isSelected = selectedZoneFilter === zone.id || selectedZoneFilter === zone.name;

                  return (
                    <div
                      key={zone.id}
                      className={`group flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedZoneFilter(isSelected ? 'all' : zone.id)}
                        className="flex items-center gap-1.5 cursor-pointer"
                        title={zone.description || `عرض بقالات ${zone.name}`}
                      >
                        <MapPin size={12} className={isSelected ? 'text-white' : 'text-blue-500'} />
                        <span>{zone.name}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        }`}>
                          {zoneShopsCount}
                        </span>
                      </button>

                      {/* أزرار تعديل وحذف المربع */}
                      <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-700 pr-1 mr-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingZone(zone);
                            setZoneNameInput(zone.name);
                            setZoneDescInput(zone.description || '');
                            setShowZoneModal(true);
                          }}
                          className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors ${
                            isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-blue-500'
                          }`}
                          title="تعديل اسم المربع"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت متأكد من حذف مربع "${zone.name}"؟`)) {
                              handleDeleteZone(zone.id);
                            }
                          }}
                          className={`p-1 rounded hover:bg-red-500/20 cursor-pointer transition-colors ${
                            isSelected ? 'text-white/80 hover:text-red-200' : 'text-slate-400 hover:text-red-500'
                          }`}
                          title="حذف المربع"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* بقالات بدون مربع (إذا وجد) */}
                {shops.some(s => !s.zoneId && !s.zoneName) && (
                  <button
                    type="button"
                    onClick={() => setSelectedZoneFilter(selectedZoneFilter === 'unassigned' ? 'all' : 'unassigned')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedZoneFilter === 'unassigned'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>بدون مربع (عام)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {shops.filter(s => !s.zoneId && !s.zoneName).length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-1 gap-2 flex-wrap sm:flex-nowrap" style={{ direction: 'rtl' }}>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    if (shops.length === 0) {
                      showToast('لا توجد بقالات مسجلة لتصدير كشف حسابها ⚠️', 'info');
                      return;
                    }
                    showToast('جاري توليد كشف الأرصدة الموحد بصيغة Excel... 📊', 'info');
                    try {
                      await downloadFinancialStatementExcel(shops);
                      showToast('تم تنزيل كشف الحساب المالي (Excel) بنجاح! 🟢', 'success');
                    } catch (err: any) {
                      console.error(err);
                      showToast('فشل في تصدير كشف الحساب المالي بصيغة Excel ⚠️', 'error');
                    }
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 active:scale-95 transition-all text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 hover:shadow-green-500/20 cursor-pointer font-sans"
                >
                  <Download size={13} />
                  <span>تنزيل الكشف المالي (Excel) 🟢</span>
                </button>
                <button
                  onClick={async () => {
                    if (shops.length === 0) {
                      showToast('لا توجد بقالات مسجلة لتصدير كشف حسابها ⚠️', 'info');
                      return;
                    }
                    const shopsData = shops.map(s => {
                      const totalSales = s.transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
                      const totalPayments = s.transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
                      return {
                        name: s.name,
                        balance: totalSales - totalPayments
                      };
                    });
                    showToast('جاري توليد كشف الأرصدة الموحد... 📄', 'info');
                    const res = await downloadAllShopsSummaryPDF(shopsData);
                    if (res.success) {
                      showToast(res.native 
                        ? `تم حفظ كشف الحساب في التنزيلات بنجاح! 📂\n${res.fileName}` 
                        : 'تم تنزيل كشف الحساب الموحد بنجاح! 📄', 
                        'success'
                      );
                    } else {
                      showToast('فشل في تصدير كشف الحساب الموحد ⚠️', 'error');
                    }
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 active:scale-95 transition-all text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 hover:shadow-cyan-500/20 cursor-pointer font-sans"
                >
                  <Download size={13} />
                  <span>تنزيل الكشف المالي (PDF) 📁</span>
                </button>
                <button
                  onClick={() => {
                    const initialSelected: Record<string, boolean> = {};
                    shops.forEach(s => {
                      initialSelected[s.id] = true;
                    });
                    setSelectedShopsForShare(initialSelected);
                    setShowShareModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-95 transition-all text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-indigo-500/20 cursor-pointer font-sans"
                >
                  <Share2 size={13} />
                  <span>مشاركة كشف حساب جماعي 💬</span>
                </button>
                <button
                  onClick={() => {
                    if (shops.length === 0) {
                      showToast('لا توجد بقالات مسجلة لإضافة فاتورة لها ⚠️', 'info');
                      return;
                    }
                    openAddInvoiceForShop(shops[0]?.id || '');
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-95 transition-all text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-indigo-500/20 cursor-pointer font-sans"
                >
                  <Plus size={13} />
                  <span>إضافة فاتورة للبقالة 🧾</span>
                </button>
                <button
                  onClick={() => {
                    if (shops.length === 0) {
                      showToast('لا توجد بقالات مسجلة لتسجيل دفعة عليها ⚠️', 'info');
                      return;
                    }
                    setQuickPaymentShopId(shops[0]?.id || '');
                    setQuickPaymentAmount('');
                    setQuickPaymentNotes('');
                    setQuickPaymentSearch('');
                    setShowQuickPaymentModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 active:scale-95 transition-all text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 hover:shadow-orange-500/20 cursor-pointer font-sans"
                >
                  <Plus size={13} />
                  <span>تسجيل سند واصل (قبض دفعة) 💵</span>
                </button>
              </div>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 select-none text-right font-sans">قائمة حسابات البقالات والعملاء ({filteredShops.length})</h3>
            </div>

            {filteredShops.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-2">
                <p className="text-slate-400 text-sm font-bold">لا توجد حسابات مسجلة حالياً تطابق البحث.</p>
                <p className="text-slate-500 text-xs">اكتب اسم البقالة في الحقل للتصفح والفتح التلقائي.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredShops.map(shop => (
                  <div 
                    key={shop.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddInvoiceForShop(shop.id);
                        }}
                        className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center gap-1 font-extrabold text-[10.5px]"
                        title="إضافة فاتورة جديدة لهذا الحساب"
                      >
                        <Plus size={13} />
                        <span>فاتورة 🧾</span>
                      </button>
                      <button
                        onClick={() => handleDeleteShop(shop.id, shop.name)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all cursor-pointer active:scale-90"
                        title="حذف الحساب"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setShops(prev => prev.map(s => s.id === shop.id ? { ...s, isPro: !s.isPro } : s));
                          showToast(`تم ${shop.isPro ? 'إلغاء تفعيل' : 'تفعيل'} شارة الحساب المتميز لبقالة ${shop.name} ✨`, 'success');
                        }}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer active:scale-90 ${
                          shop.isPro 
                            ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400' 
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 text-slate-400'
                        }`}
                        title={shop.isPro ? "إلغاء التمييز (PRO)" : "تمييز كحساب PRO"}
                      >
                        <Star size={15} fill={shop.isPro ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date().toLocaleDateString('ar-YE');
                          const network = getNetworkName();
                          let msg = `*🔄 تذكير راقٍ بسداد رصيد الحساب - ${network} 🔄*\n\n`;
                          msg += `الأخوة الأعزاء في *${shop.name}* المحترمين،\n`;
                          msg += `نرجو أن تكونوا بأتم الصحة والعافية.\n\n`;
                          msg += `نود إحاطتكم بلطف ببيان رصيد حسابكم الحالي لدينا المقيد بتاريخ ${today} لغرض المطابقة والسداد:\n`;
                          if (shop.currentBalance > 0) {
                            msg += `🚨 *الرصيد المستحق (الدين المتبقي):* *${shop.currentBalance.toLocaleString('ar-YE')} ريال يمني*\n`;
                          } else if (shop.currentBalance < 0) {
                            msg += `✅ *الرصيد الزائد لكم (له رصيد):* *${Math.abs(shop.currentBalance).toLocaleString('ar-YE')} ريال يمني*\n`;
                          } else {
                            msg += `✅ *حالة الحساب المالي:* خالص ومسدد بالكامل (الرصيد: صفر).\n`;
                          }
                          msg += `------------------------------------\n`;
                          msg += `🤝 نحن نقدر شراكتكم المتميزة وثقتكم الغالية، ونسأل الله أن يبارك في عملكم ورزقكم.\n\n`;
                          msg += `الموزع المسؤول: *${getDistributorName()}*\n`;
                          msg += `للتواصل والاستعلام المباشر: 📞 *${getDistributorPhone()}*\n\n`;
                          msg += `دمتم في رعاية الله وحفظه، وشكراً لتعاونكم! ✨`;

                          const destPhone = shop.phone?.trim() ? shop.phone.trim() : '';
                          openWhatsAppDirect(destPhone, msg);
                          showToast(`تم فتح واتساب لتذكير ${shop.name} بالمديونية 💬`, 'success');
                        }}
                        className="p-2.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl transition-all cursor-pointer active:scale-90"
                        title="تذكير مالي سريع بالواتساب"
                      >
                        <MessageCircle size={15} />
                      </button>
                    </div>

                    <div 
                      onClick={() => setSelectedShopId(shop.id)}
                      className="flex-1 pr-4 text-right cursor-pointer"
                    >
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {shop.zoneName && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[9px] font-black text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 flex items-center gap-1 select-none">
                            <MapPin size={9} />
                            <span>{shop.zoneName}</span>
                          </span>
                        )}
                        {shop.isPro && (
                          <span className="px-1.5 py-0.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 text-[9px] font-black text-amber-700 dark:text-amber-400 flex items-center gap-0.5 select-none">
                            <Star size={8} fill="currentColor" />
                            <span>متميز (PRO)</span>
                          </span>
                        )}
                        <h4 className="text-sm font-black text-slate-950 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{shop.name}</h4>
                      </div>
                      <div className="flex justify-end gap-3 text-[10px] text-slate-400 font-bold font-sans mt-0.5">
                        <span className={
                          shop.currentBalance > 0 
                            ? 'text-red-500 dark:text-red-400 font-extrabold' 
                            : shop.currentBalance < 0 
                            ? 'text-emerald-500 dark:text-emerald-400 font-extrabold' 
                            : 'text-slate-400'
                        }>
                          {shop.currentBalance > 0 
                            ? `الرصيد (آجل): ${shop.currentBalance} ريال` 
                            : shop.currentBalance < 0 
                            ? `الرصيد (له): ${Math.abs(shop.currentBalance)} ريال` 
                            : 'الرصيد: خالص (مسدد)'}
                        </span>
                        <span>•</span>
                        <span>مبيعات: {shop.totalSales} ريال</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outstanding Balances Alerts & Customizer */}
            {shops.length > 0 && (
              <div className="bg-red-50/45 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 rounded-[2.2rem] p-5 space-y-4 text-right mt-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 bg-red-100/60 dark:bg-red-950/30 px-3 py-1.5 rounded-2xl select-none">
                    <span className="text-[11px] font-sans font-black text-red-700 dark:text-red-300">
                      {overdueShops.length} عملاء متجاوزين
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-red-950 dark:text-red-200">⚠️ تنبيه مديونيات البقالات المتجاوزة للحد</h4>
                    <p className="text-[10.5px] text-red-700/80 dark:text-red-400">تابع البقالات التي تجاوزت سقف الدين المحدد لإرسال تذكير سريع بضغطة زر</p>
                  </div>
                </div>

                {/* Limit Customizer */}
                <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-red-100/50 dark:border-red-900/15 flex items-center justify-between gap-3 flex-wrap">
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
                      className="w-20 h-8 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-sans font-black outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => handleLimitChange(balanceLimit + 1000)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-sm flex items-center justify-center cursor-pointer active:scale-90 select-none transition-transform"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">حد التنبيه والمديونية الأقصى المسموح (ريال):</span>
                </div>

                {overdueShops.length === 0 ? (
                  <div className="text-center py-3 bg-white/30 dark:bg-slate-950/10 rounded-2xl border border-dashed border-red-100/40 text-xs font-bold text-slate-500">
                    🎉 ممتاز! لا توجد حسابات تتجاوز الحد الأقصى للمديونية حالياً ({balanceLimit} ريال).
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {overdueShops.map(shop => (
                      <div 
                        key={shop.id} 
                        className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-red-100/45 dark:border-red-950/35 flex items-center justify-between text-right gap-3"
                      >
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const network = getNetworkName();
                            let msg = `*🔄 تذكير مستعجل بسداد المديونية - ${network} 🔄*\n\n`;
                            msg += `الأخوة الأعزاء في *${shop.name}* المحترمين،\n`;
                            msg += `نود إحاطتكم وتذكيركم بلطف بأن رصيدكم المستحق (الآجل المتأخر) لدينا قد تجاوز الحد المسموح وحالياً يبلغ:\n`;
                            msg += `🚨 *${shop.currentBalance.toLocaleString('ar-YE')} ريال يمني*\n\n`;
                            msg += `يرجى التفضل بالمبادرة بسداد هذا المبلغ في أقرب وقت لتحديث حسابكم واستمرار استلام الفاتورة وتوريد كروت الشبكة بشكل طبيعي.\n`;
                            msg += `------------------------------------\n`;
                            msg += `بإدارة الموزع: *${getDistributorName()}*\n`;
                            msg += `لالتواصل والاستعلام: 📞 *${getDistributorPhone()}*\n\n`;
                            msg += `دمتم وعملكم الطيب مستمر، وشكراً جزيلاً لتعاونكم وثقتكم بنا! ✨`;
                            
                            const destPhone = shop.phone?.trim() ? shop.phone.trim() : '';
                            openWhatsAppDirect(destPhone, msg);
                            showToast(`تم فتح واتساب للتذكير العاجل لبقالة ${shop.name}`, 'success');
                          }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10.5px] font-black cursor-pointer shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1 shrink-0"
                        >
                          <span className="font-sans font-black">واتساب سريع 💬</span>
                        </button>

                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">{shop.name}</h5>
                          <div className="flex items-center gap-2 justify-end text-[10px] font-sans font-bold">
                            <span className="text-red-500 font-extrabold">{shop.currentBalance} ريال مستحق</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-400 font-bold">{shop.phone || 'بدون هاتف'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && selectedShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4"
            >
              <div className="text-right">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">تسجيل دفعة مسددة</h3>
                <p className="text-xs text-slate-400 mt-1">تنزيل الرصيد المستحق للبقالة: {selectedShop.name}</p>
              </div>

              <div className="space-y-3 pt-2 text-right">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 block mb-1">قيمة المبلغ المسدد (ريال)</label>
                  <input 
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="مثال: 5000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-sans font-black outline-none focus:border-emerald-500 transition-colors text-right"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 block mb-1">تفاصيل أو ملاحظة (اختياري)</label>
                  <input 
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="مثال: سداد نقدي مستلم كاش"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors text-right"
                  />
                </div>

                {/* Real-time preview of the receipt calculations */}
                {(() => {
                  const prevBalance = selectedShop.currentBalance;
                  const payAmount = Number(paymentAmount) || 0;
                  const remaining = prevBalance - payAmount;
                  return (
                    <div className="mt-3 p-4 bg-emerald-50/40 dark:bg-slate-950 border border-emerald-100/30 dark:border-slate-800 rounded-2xl space-y-2 text-xs font-sans text-right" style={{ direction: 'rtl' }}>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>الرصيد السابق:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{prevBalance.toLocaleString('ar-YE')} ريال</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-extrabold border-t border-dashed border-emerald-200/50 dark:border-emerald-900/30 pt-2">
                        <span>الواصل (المبلغ المسدد):</span>
                        <span>{payAmount.toLocaleString('ar-YE')} ريال</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-dashed border-slate-200/50 dark:border-slate-800 pt-2">
                        <span className="font-black text-slate-800 dark:text-slate-200">المتبقي من الحساب بعد الواصل:</span>
                        <span className={`font-sans font-black text-sm ${remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {remaining.toLocaleString('ar-YE')} ريال 
                          {remaining < 0 ? ' (دائن زائد للعميل)' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={handleRecordPayment}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                >
                  حفظ الدفعة
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-200"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Payment Modal (سند واصل فوري) */}
      <AnimatePresence>
        {showQuickPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickPaymentModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4 text-right"
              style={{ direction: 'rtl' }}
            >
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">إضافة سند واصل / مالي فوري 💵</h3>
                <p className="text-xs text-slate-400 mt-1">تسجيل دفعة قبض لحساب العميل أو البقالة مباشرة ومشاركتها</p>
              </div>

              <div className="space-y-3 pt-2 text-right">
                {/* Search Shop */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-400 block">ابحث بـاسم العميل أو البقالة</label>
                  <input 
                    type="text"
                    value={quickPaymentSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickPaymentSearch(val);
                      // Auto-select first matching shop
                      const match = shops.find(s => s.name.toLowerCase().includes(val.toLowerCase()));
                      if (match) {
                        setQuickPaymentShopId(match.id);
                      }
                    }}
                    placeholder="ابحث عن البقالة..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-amber-500 transition-colors text-right"
                  />
                </div>

                {/* Dropdown Select Shop */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-400 block">اختر البقالة</label>
                  <select 
                    value={quickPaymentShopId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickPaymentShopId(val);
                      const shop = shops.find(s => s.id === val);
                      if (shop) {
                        setQuickPaymentSearch(shop.name);
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-amber-500 transition-colors text-right"
                  >
                    <option value="" disabled>-- اختر العميل / البقالة --</option>
                    {shops
                      .filter(s => s.name.toLowerCase().includes(quickPaymentSearch.toLowerCase()))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (المستحق: {s.currentBalance.toLocaleString('ar-YE')} ريال)
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-400 block">المبلغ الواصل (ريال)</label>
                  <input 
                    type="number"
                    value={quickPaymentAmount}
                    onChange={(e) => setQuickPaymentAmount(e.target.value)}
                    placeholder="مثال: 15000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-sans font-black outline-none focus:border-amber-500 transition-colors text-right"
                  />
                </div>

                {/* Notes input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-400 block">بيان الدفعة أو ملاحظة (اختياري)</label>
                  <input 
                    type="text"
                    value={quickPaymentNotes}
                    onChange={(e) => setQuickPaymentNotes(e.target.value)}
                    placeholder="مثال: دفعة من الحساب كاش"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-amber-500 transition-colors text-right"
                  />
                </div>

                {/* Dynamic Preview Box */}
                {(() => {
                  const chosenShop = shops.find(s => s.id === quickPaymentShopId);
                  if (!chosenShop) return null;
                  const prevBalance = chosenShop.currentBalance;
                  const payAmount = Number(quickPaymentAmount) || 0;
                  const remaining = prevBalance - payAmount;
                  return (
                    <div className="mt-3 p-4 bg-amber-50/40 dark:bg-slate-950 border border-amber-100/30 dark:border-slate-800 rounded-2xl space-y-2 text-xs font-sans text-right" style={{ direction: 'rtl' }}>
                      <div className="flex justify-between items-center text-slate-500">
                        <span className="font-bold">البقالة المحددة:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{chosenShop.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>الرصيد السابق:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{prevBalance.toLocaleString('ar-YE')} ريال</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-extrabold border-t border-dashed border-amber-200/50 dark:border-amber-900/30 pt-2">
                        <span>الواصل (المبلغ المسدد):</span>
                        <span>{payAmount.toLocaleString('ar-YE')} ريال</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-dashed border-slate-200/50 dark:border-slate-800 pt-2">
                        <span className="font-black text-slate-800 dark:text-slate-200">المتبقي من الحساب بعد الواصل:</span>
                        <span className={`font-sans font-black text-sm ${remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {remaining.toLocaleString('ar-YE')} ريال 
                          {remaining < 0 ? ' (دائن زائد للعميل)' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={handleSaveQuickPayment}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                >
                  اعتماد السند 💾
                </button>
                <button
                  onClick={() => setShowQuickPaymentModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Success and Sharing Modal */}
      <AnimatePresence>
        {showPaymentSuccessModal && lastPaymentSummary && (
          <div className="fixed inset-0 z-50 flex flex-col pt-10 text-right">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentSuccessModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative mt-auto w-full bg-white dark:bg-slate-950 rounded-t-[3rem] p-6 max-h-[90vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5 cursor-pointer" onClick={() => setShowPaymentSuccessModal(false)}></div>
              
              <div className="flex flex-col items-center text-center space-y-2 mb-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">تم تسجيل الدفعة المسددة بنجاح!</h2>
                <p className="text-xs text-slate-400 font-bold">بإمكانك تنزيل سند واصل مالي أو مشاركته الفورية الآن</p>
              </div>

              {/* Virtual Payment Receipt Preview Container */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-900 shadow-inner font-sans space-y-3 text-right">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2.5">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">سند واصل مالي - {getNetworkName()}</span>
                  <span className="font-bold">{lastPaymentSummary.date}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                  <span>العميل / البقالة:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">{lastPaymentSummary.shopName}</span>
                </div>

                <div className="space-y-2 py-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-extrabold text-slate-600 dark:text-slate-400">المبلغ المدفوع (الواصل):</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-sans text-md">{lastPaymentSummary.amount.toLocaleString('ar-YE')} ريال</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>بيان الدفعة:</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-300">{lastPaymentSummary.notes}</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans pt-1">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>المديونية السابقة:</span>
                    <span className="font-sans font-bold">{lastPaymentSummary.previousBalance.toLocaleString('ar-YE')} ريال</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2">
                    <span className="font-black text-slate-800 dark:text-slate-300">الرصيد المتبقي الجديد:</span>
                    <span className={`font-sans font-black text-sm ${lastPaymentSummary.remainingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {lastPaymentSummary.remainingBalance.toLocaleString('ar-YE')} ريال
                      {lastPaymentSummary.remainingBalance < 0 ? ' (دائن زائد للعميل)' : ''}
                    </span>
                  </div>
                  <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-extrabold border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 pb-0">
                    [ شكراً لتعاونكم ومبادرتكم الطيبة ]
                  </div>
                </div>
              </div>

              {/* Quick Thermal toggle switch inside receipt popup */}
              <div className="mt-3.5 flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/85">
                <div className="flex items-center gap-2">
                  <Printer size={18} className={isThermalMode ? "text-amber-500 animate-pulse" : "text-slate-400"} />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-300">نمط الفاتورة الحرارية (أبيض وأسود)</span>
                </div>
                <button
                  onClick={() => setIsThermalMode?.(!isThermalMode)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${isThermalMode ? 'bg-amber-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm inline-block" />
                </button>
              </div>

              {/* Sharing Layout Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => {
                    const paymentSummary = {
                      items: [],
                      totalAmount: 0,
                      receivedAmount: lastPaymentSummary.amount,
                      remainingAmount: lastPaymentSummary.remainingBalance,
                      type: CalculatorType.REGULAR,
                      date: lastPaymentSummary.date,
                      shopName: lastPaymentSummary.shopName,
                      previousBalance: lastPaymentSummary.previousBalance,
                      transactionId: lastPaymentSummary.txId
                    };
                    downloadInvoicePDF(paymentSummary, isThermalMode);

                    const todayStr = new Date().toLocaleDateString('ar-YE');
                    const network = getNetworkName();
                    let msg = `*📄 سند قبض / واصل مالي - ${network} 📄*\n\n`;
                    msg += `الأخوة الأعزاء في *${lastPaymentSummary.shopName}* المحترمين،\n`;
                    msg += `تم استلام وقيد دفعتكم المالية بنجاح شاكرين تعاونكم:\n\n`;
                    msg += `💵 *المبلغ الواصل:* *${lastPaymentSummary.amount.toLocaleString('ar-YE')} ريال يمني*\n`;
                    msg += `📝 *البيان:* ${lastPaymentSummary.notes}\n`;
                    msg += `📅 *تاريخ القيد:* ${todayStr}\n\n`;
                    msg += `------------------------------------\n`;
                    msg += `📊 *الوضعية المالية الحالية للعميل:*\n`;
                    msg += `📉 *الرصيد السابق (المستحق):* *${lastPaymentSummary.previousBalance.toLocaleString('ar-YE')} ريال*\n`;
                    if (lastPaymentSummary.remainingBalance > 0) {
                      msg += `🚨 *الرصيد المتبقي المستحق الجديد:* *${lastPaymentSummary.remainingBalance.toLocaleString('ar-YE')} ريال يمني*\n\n`;
                    } else if (lastPaymentSummary.remainingBalance < 0) {
                      msg += `✅ *الرصيد المتبقي الزائد لكم (له):* *${Math.abs(lastPaymentSummary.remainingBalance).toLocaleString('ar-YE')} ريال يمني*\n\n`;
                    } else {
                      msg += `✅ *صافي الرصيد الحالي:* خالص مسدد تماماً (صفر)\n\n`;
                    }
                    msg += `الموزع المسؤول: *${getDistributorName()}*\n`;
                    msg += `للتواصل والاستعلام: 📞 *${getDistributorPhone()}*\n\n`;
                    msg += `دمتم وعملكم الطيب مستمر، وشكراً لتعاونكم! ✨`;

                    const destPhone = lastPaymentSummary.phone?.trim() ? lastPaymentSummary.phone.trim() : '';
                    openWhatsAppDirect(destPhone, msg);
                    showToast(`تم مشاركة السند عبر واتساب لبقالة ${lastPaymentSummary.shopName} 💬`, 'success');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex flex-col items-center gap-1.5 text-xs font-black transition-colors active:scale-95 cursor-pointer"
                >
                  <Share2 size={20} className="text-green-500" />
                  مشاركة عبر الواتساب
                </button>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      const todayStr = new Date().toLocaleDateString('ar-YE');
                      const network = getNetworkName();
                      let msg = `سند قبض مالي - ${network}\n`;
                      msg += `العميل: ${lastPaymentSummary.shopName}\n`;
                      msg += `الواصل: ${lastPaymentSummary.amount.toLocaleString('ar-YE')} ريال\n`;
                      msg += `البيان: ${lastPaymentSummary.notes}\n`;
                      msg += `التاريخ: ${todayStr}\n`;
                      msg += `الرصيد المتبقي: ${lastPaymentSummary.remainingBalance.toLocaleString('ar-YE')} ريال\n`;
                      msg += `الموزع: ${getDistributorName()} للتواصل: ${getDistributorPhone()}`;

                      const enc = encodeURIComponent(msg);
                      const smsUrl = `sms:?&body=${enc}`;
                      window.open(smsUrl, '_blank');
                      showToast(`تم فتح تطبيق الرسائل لإرسال السند النصي 📱`, 'success');
                    }}
                    className="flex-1 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors active:scale-95 cursor-pointer min-h-[44px]"
                  >
                    <FileText size={16} className="text-blue-500" />
                    <span>رسالة نصية (SMS)</span>
                  </button>
                  <button 
                    onClick={() => {
                      const todayStr = new Date().toLocaleDateString('ar-YE');
                      const network = getNetworkName();
                      let msg = `*📄 سند قبض / واصل مالي - ${network} 📄*\n\n`;
                      msg += `الأخوة الأعزاء في *${lastPaymentSummary.shopName}* المحترمين،\n`;
                      msg += `تم استلام دفعتكم المالية بقيمة: *${lastPaymentSummary.amount.toLocaleString('ar-YE')} ريال*\n`;
                      msg += `الرصيد المتبقي المستحق الجديد: *${lastPaymentSummary.remainingBalance.toLocaleString('ar-YE')} ريال*\n`;
                      msg += `شاكرين تعاونكم ومبادرتكم الطيبة. ✨`;

                      const destPhone = lastPaymentSummary.phone?.trim() ? lastPaymentSummary.phone.trim() : '';
                      openWhatsAppDirect(destPhone, msg);
                      showToast(`تم إرسال السند النصي عبر واتساب 💬`, 'success');
                    }}
                    className="flex-1 p-2 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors active:scale-95 cursor-pointer min-h-[44px] shadow-sm shadow-green-600/10"
                  >
                    <MessageCircle size={16} className="text-white" />
                    <span>نصية عبر واتساب 💬</span>
                  </button>
                </div>

                <button 
                  onClick={() => {
                    const paymentSummary = {
                      items: [],
                      totalAmount: 0,
                      receivedAmount: lastPaymentSummary.amount,
                      remainingAmount: lastPaymentSummary.remainingBalance,
                      type: CalculatorType.REGULAR,
                      date: lastPaymentSummary.date,
                      shopName: lastPaymentSummary.shopName,
                      previousBalance: lastPaymentSummary.previousBalance,
                      transactionId: lastPaymentSummary.txId
                    };
                    downloadInvoicePDF(paymentSummary, isThermalMode);
                    showToast('تم تحميل سند واصل الـ PDF بنجاح 📁', 'success');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex flex-col items-center justify-center gap-1.5 text-xs font-black transition-colors active:scale-95 cursor-pointer"
                >
                  <Download size={20} className="text-amber-500" />
                  تنزيل سند واصل (PDF)
                </button>

                <button 
                  onClick={() => {
                    window.print();
                    showToast('جاري بدء الطباعة الحرارية المباشرة للسند... 🖨️', 'success');
                  }}
                  className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 border border-amber-600/50 text-white flex flex-col items-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/10"
                >
                  <Printer size={20} className="text-white" />
                  طباعة حرارية مباشرة
                </button>
              </div>

              {/* Bottom Actions matching invoice flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => {
                    if (!lastPaymentSummary || !lastPaymentSummary.txId) {
                      showToast('عذراً، لا توجد دفعة حديثة للتراجع عنها.', 'error');
                      return;
                    }

                    if (!confirm('هل أنت متأكد من إلغاء وتراجع هذه الدفعة المسددة بالكامل؟ سيتم إعادة المديونيات إلى وضعها السابق.')) {
                      return;
                    }

                    const { txId, shopName } = lastPaymentSummary;

                    setShops(prev => {
                      return prev.map(s => {
                        if (s.name.toLowerCase() === shopName.toLowerCase()) {
                          const updatedTx = (s.transactions || []).filter(tx => tx.id !== txId);
                          let updatedSales = 0;
                          let updatedPayments = 0;
                          updatedTx.forEach(tx => {
                            if (tx.type === 'sale') updatedSales += tx.amount;
                            else if (tx.type === 'payment') updatedPayments += tx.amount;
                          });
                          return {
                            ...s,
                            totalPayments: updatedPayments,
                            currentBalance: s.totalSales - updatedPayments,
                            transactions: updatedTx
                          };
                        }
                        return s;
                      });
                    });

                    setLastPaymentSummary(null);
                    setLastSaleSummary?.(null);
                    setShowPaymentSuccessModal(false);
                    showToast('↩️ تم التراجع وإلغاء قيد الدفعة المالية بنجاح.', 'success');
                  }}
                  className="py-4.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black rounded-2xl border border-rose-200/60 dark:border-rose-900/40 active:scale-95 transition-transform text-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>↩️ تراجع وإلغاء السند</span>
                </button>
                <button 
                  onClick={() => {
                    setShowPaymentSuccessModal(false);
                    showToast('متابعة العمل بنجاح 👍', 'info');
                  }}
                  className="py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl active:scale-95 transition-transform text-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>سند جديد ومتابعة العمل</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Shop Details Modal (اسم البقالة ورقم الهاتف) */}
      <AnimatePresence>
        {showEditShopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditShopModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4 text-right"
            >
              <div className="text-right border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-1.5 justify-end">
                  <span>تعديل بيانات البقالة</span>
                  <Pencil size={18} className="text-blue-500" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">تعديل اسم البقالة ورقم هاتف الواتساب والرمز</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    اسم البقالة:
                  </label>
                  <input 
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    placeholder="مثال: بقالة الخير والبركة"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-right"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    رقم هاتف الواتساب:
                  </label>
                  <input 
                    type="tel"
                    value={editShopPhone}
                    onChange={(e) => setEditShopPhone(e.target.value)}
                    placeholder="مثال: 774474046"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-center font-sans"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    يستخدم للمشاركة المباشرة عبر واتساب وواتساب الأعمال والرسائل النصية.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                    الرمز التعبيري للبقالة:
                  </label>
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    {['🔴', '🟠', '⚪', '⚫', '🟤', '🟣', '🔵', '🟢', '🟡', '🏪', '🛒', '📦'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEditShopEmoji(em)}
                        className={`w-8 h-8 text-sm flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-90 transition-all ${editShopEmoji === em ? 'bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500 scale-110' : 'bg-slate-50 dark:bg-slate-950'}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    المربع / الحارة:
                  </label>
                  <select
                    value={editShopZoneId}
                    onChange={(e) => setEditShopZoneId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-right cursor-pointer"
                  >
                    <option value="">-- بدون مربع محدد (عام) --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>📍 {z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  onClick={handleSaveShopDetails}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/10"
                >
                  حفظ التعديلات 💾
                </button>
                <button
                  onClick={() => setShowEditShopModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zone Modal (إضافة وتعديل مربع / حارة) */}
      <AnimatePresence>
        {showZoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowZoneModal(false);
                setEditingZone(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4 text-right"
            >
              <div className="text-right border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-1.5 justify-end">
                  <span>{editingZone ? 'تعديل بيانات المربع / الحارة' : 'إضافة مربع / حارة جديدة'}</span>
                  <MapPin size={18} className="text-blue-500" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {editingZone ? 'تحديث اسم وتفاصيل المربع' : 'أنشئ مربعاً أو حارة لتجميع البقالات وتسهيل توزيع الكروت والمتابعة'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    اسم المربع أو الحارة:
                  </label>
                  <input 
                    type="text"
                    value={zoneNameInput}
                    onChange={(e) => setZoneNameInput(e.target.value)}
                    placeholder="مثال: مربع حارة السلام، حارة النصر..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-right"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    وصف أو ملاحظات (اختياري):
                  </label>
                  <input 
                    type="text"
                    value={zoneDescInput}
                    onChange={(e) => setZoneDescInput(e.target.value)}
                    placeholder="مثال: البقالات من مدخل الحارة حتى الجامع"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors text-right"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveZone}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all text-center"
                >
                  {editingZone ? 'حفظ التعديل 💾' : 'إضافة المربع 🏘️'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowZoneModal(false);
                    setEditingZone(null);
                  }}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditTxModal && editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditTxModal(false);
                setEditingTx(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4"
            >
              <div className="text-right">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-1.5 justify-end">
                  <span>تعديل العملية التفصيلية</span>
                  <Pencil size={18} className="text-blue-500" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">تحديث معلومات وتفاصيل العملية في حساب: {selectedShop?.name}</p>
              </div>

              <div className="space-y-3 pt-2 text-right">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 block mb-1">المبلغ (ريال)</label>
                  <input 
                    type="number"
                    value={editTxAmount}
                    onChange={(e) => setEditTxAmount(e.target.value)}
                    placeholder="مثال: 5000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-sans font-black outline-none focus:border-blue-500 transition-colors text-right"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 block mb-1">الملاحظة أو التفاصيل</label>
                  <input 
                    type="text"
                    value={editTxNotes}
                    onChange={(e) => setEditTxNotes(e.target.value)}
                    placeholder="مثال: مبيعات كروت..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-colors text-right"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 block mb-1">التاريخ</label>
                  <input 
                    type="date"
                    value={editTxDate}
                    onChange={(e) => setEditTxDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-sans font-black outline-none focus:border-blue-500 transition-colors text-right"
                  />
                </div>

                {editingTx.type === 'sale' && editTxItems.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-right">
                    <label className="text-[11px] font-extrabold text-slate-400 block mb-1">تفاصيل الفئات والكميات بالفاتورة</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {editTxItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800/65" style={{ direction: 'rtl' }}>
                          <div className="text-right flex-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">{item.label}</span>
                            <span className="text-[10px] text-slate-400 font-sans">سعر الحبة: {item.price} ريال</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = Math.max(0, item.quantity - 1);
                                const updated = [...editTxItems];
                                updated[idx] = {
                                  ...item,
                                  quantity: newQty,
                                  total: newQty * item.price
                                };
                                const filtered = updated.filter(it => it.quantity > 0);
                                setEditTxItems(filtered);
                                const newSum = filtered.reduce((sum, it) => sum + it.total, 0);
                                setEditTxAmount(newSum);
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-300 active:scale-90 transition-all shrink-0 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-sans font-black w-6 text-center text-slate-800 dark:text-slate-200 shrink-0">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = item.quantity + 1;
                                const updated = [...editTxItems];
                                updated[idx] = {
                                  ...item,
                                  quantity: newQty,
                                  total: newQty * item.price
                                };
                                setEditTxItems(updated);
                                const newSum = updated.reduce((sum, it) => sum + it.total, 0);
                                setEditTxAmount(newSum);
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-300 active:scale-90 transition-all shrink-0 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={handleUpdateTransaction}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/10 text-center"
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => {
                    setShowEditTxModal(false);
                    setEditingTx(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-200 text-center"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingTxDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setViewingTxDetails(null);
                setIsEditingDetails(false);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5 overflow-hidden text-right flex flex-col justify-between max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setViewingTxDetails(null);
                    setIsEditingDetails(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                    {isEditingDetails ? 'تعديل الفاتورة والعملية' : 'تفاصيل العملية'}
                  </span>
                  <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 font-sans text-xs">
                {/* Receipt Card Style */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 relative overflow-hidden">
                  {/* Decorative receipt notch circle */}
                  <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800"></div>

                  <div className="text-center space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-[13px]">{shops.find(s => s.id === selectedShopId)?.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">رقم العملية: {viewingTxDetails.invoiceId || viewingTxDetails.id}</p>
                    
                    {isEditingDetails ? (
                      <div className="flex items-center gap-2 justify-center mt-2" style={{ direction: 'rtl' }}>
                        <span className="text-[10px] text-slate-400 font-extrabold shrink-0">التاريخ:</span>
                        <input
                          type="date"
                          value={editTxDate}
                          onChange={(e) => setEditTxDate(e.target.value)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-center outline-none focus:border-blue-500 font-sans text-slate-950 dark:text-white font-black"
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">التاريخ: {viewingTxDetails.date}</p>
                    )}

                    <div className="pt-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        viewingTxDetails.type === 'sale' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {viewingTxDetails.type === 'sale' ? '🧾 فاتورة بيع كروت' : '💵 سند قبض مستلم'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                    {viewingTxDetails.type === 'sale' ? (
                      <>
                        <h5 className="font-extrabold text-slate-400 text-[10px] mb-1.5 text-right">تفاصيل محتويات الفاتورة:</h5>
                        {(() => {
                          const items = isEditingDetails ? editTxItems : (getTxItems(viewingTxDetails) || []);
                          if (items && items.length > 0) {
                            return (
                              <div className="space-y-2">
                                <div className="grid grid-cols-4 font-bold text-[10px] text-slate-400 border-b border-slate-200/50 dark:border-slate-800/50 pb-1 text-center" style={{ direction: 'rtl' }}>
                                  <span className="text-right pr-1">الفئة</span>
                                  <span>الكمية</span>
                                  <span>السعر</span>
                                  <span>الإجمالي</span>
                                </div>
                                {items.map((it, idx) => (
                                  <div key={idx} className="grid grid-cols-4 items-center text-slate-600 dark:text-slate-300 font-extrabold text-[11px] text-center py-1 border-b border-slate-100/50 dark:border-slate-800/30" style={{ direction: 'rtl' }}>
                                    <span className="text-right text-indigo-600 dark:text-indigo-400 font-bold pr-1">{it.label}</span>
                                    
                                    {isEditingDetails ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newQty = Math.max(0, it.quantity - 1);
                                            const updated = [...editTxItems];
                                            updated[idx] = {
                                              ...it,
                                              quantity: newQty,
                                              total: newQty * it.price
                                            };
                                            const filtered = updated.filter(item => item.quantity > 0);
                                            setEditTxItems(filtered);
                                            const newSum = filtered.reduce((sum, item) => sum + item.total, 0);
                                            setEditTxAmount(newSum);
                                          }}
                                          className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-300"
                                        >
                                          -
                                        </button>
                                        <span className="font-sans text-slate-800 dark:text-slate-200 w-4 text-center">{it.quantity}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newQty = it.quantity + 1;
                                            const updated = [...editTxItems];
                                            updated[idx] = {
                                              ...it,
                                              quantity: newQty,
                                              total: newQty * it.price
                                            };
                                            setEditTxItems(updated);
                                            const newSum = updated.reduce((sum, item) => sum + item.total, 0);
                                            setEditTxAmount(newSum);
                                          }}
                                          className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-300"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="font-sans">{it.quantity}</span>
                                    )}

                                    {isEditingDetails ? (
                                      <input
                                        type="number"
                                        value={it.price}
                                        onChange={(e) => {
                                          const newPrice = Number(e.target.value);
                                          const updated = [...editTxItems];
                                          updated[idx] = {
                                            ...it,
                                            price: newPrice,
                                            total: it.quantity * newPrice
                                          };
                                          setEditTxItems(updated);
                                          const newSum = updated.reduce((sum, item) => sum + item.total, 0);
                                          setEditTxAmount(newSum);
                                        }}
                                        className="w-12 px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-[10px] font-sans font-bold outline-none text-slate-950 dark:text-white"
                                      />
                                    ) : (
                                      <span className="font-sans text-slate-400">{it.price}</span>
                                    )}

                                    <span className="font-sans text-slate-950 dark:text-white">{it.total}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return (
                              <p className="text-center py-2 text-slate-400 font-bold italic">
                                مبيعات كروت بقيمة إجمالية قدرها {viewingTxDetails.amount} ريال
                              </p>
                            );
                          }
                        })()}
                      </>
                    ) : (
                      <div className="space-y-2 py-1">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-right">
                          <span className="text-[10px] text-slate-400 font-extrabold block">نوع المستند:</span>
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">سند قبض نقدي (واصل كاش)</span>
                          <span className="text-[10px] text-slate-400 font-extrabold block mt-2">ملاحظات القبض:</span>
                          
                          {isEditingDetails ? (
                            <input
                              type="text"
                              value={editTxNotes}
                              onChange={(e) => setEditTxNotes(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right font-bold outline-none"
                              placeholder="تفاصيل القبض"
                            />
                          ) : (
                            <p className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 leading-relaxed">
                              {viewingTxDetails.notes || 'سداد دفعة من الحساب'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing / Notes summary box */}
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center font-sans" style={{ direction: 'rtl' }}>
                    <span className="text-[10px] font-extrabold text-slate-400">إجمالي قيمة العملية</span>
                    {isEditingDetails ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400">ريال</span>
                        <input
                          type="number"
                          value={editTxAmount}
                          onChange={(e) => setEditTxAmount(e.target.value)}
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-sans font-black text-center outline-none text-slate-950 dark:text-white focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-black text-slate-900 dark:text-white">{viewingTxDetails.amount} ريال</span>
                    )}
                  </div>

                  {viewingTxDetails.type === 'sale' && (
                    isEditingDetails ? (
                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold text-right space-y-1">
                        <span className="text-slate-400 block mb-0.5">البيان/الملاحظات:</span>
                        <input 
                          type="text" 
                          value={editTxNotes} 
                          onChange={(e) => setEditTxNotes(e.target.value)} 
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right outline-none focus:border-blue-500 text-slate-950 dark:text-white font-bold" 
                          placeholder="مثال: مبيعات كروت..."
                        />
                      </div>
                    ) : (
                      viewingTxDetails.notes && (
                        <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold text-right">
                          <span className="text-slate-400 block mb-0.5">البيان:</span>
                          <p className="leading-relaxed bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">{viewingTxDetails.notes}</p>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Action footer */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isEditingDetails ? (
                  <>
                    <button
                      onClick={handleUpdateTransaction}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-blue-500/10"
                    >
                      <span>حفظ التعديلات</span>
                    </button>
                    <button
                      onClick={() => setIsEditingDetails(false)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black rounded-xl cursor-pointer hover:bg-slate-200 text-center"
                    >
                      <span>إلغاء</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        // Calculate the historical balance right before this transaction
                        let prevBal = 0;
                        const selectedShop = shops.find(s => s.id === selectedShopId);
                        if (selectedShop) {
                          const txIndex = selectedShop.transactions.findIndex(t => t.id === viewingTxDetails.id);
                          if (txIndex !== -1) {
                            const precedingTxs = selectedShop.transactions.slice(0, txIndex);
                            const totalPrecedingSales = precedingTxs.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
                            const totalPrecedingPayments = precedingTxs.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
                            prevBal = totalPrecedingSales - totalPrecedingPayments;
                          }
                        }

                        const resolvedItems = getTxItems(viewingTxDetails);
                        const docSummary = {
                          items: viewingTxDetails.type === 'sale' ? (resolvedItems || [{
                            label: 'مبيعات كروت ' + getNetworkName(),
                            category: viewingTxDetails.amount,
                            quantity: 1,
                            price: viewingTxDetails.amount,
                            total: viewingTxDetails.amount
                          }]) : [],
                          totalAmount: viewingTxDetails.type === 'sale' ? viewingTxDetails.amount : 0,
                          receivedAmount: viewingTxDetails.type === 'payment' ? viewingTxDetails.amount : 0,
                          remainingAmount: viewingTxDetails.type === 'sale' ? viewingTxDetails.amount : 0,
                          type: CalculatorType.REGULAR,
                          date: viewingTxDetails.date,
                          shopName: selectedShop?.name,
                          previousBalance: prevBal,
                          transactionId: viewingTxDetails.id
                        };
                        downloadInvoicePDF(docSummary, false);
                        showToast(viewingTxDetails.type === 'sale' ? 'تم تنزيل الفاتورة بنجاح 📄' : 'تم تنزيل واصل المسدد بنجاح 💵', 'success');
                      }}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-red-500/10"
                    >
                      <Download size={13} />
                      <span>تحميل PDF</span>
                    </button>

                    {/* مشاركة واتساب العادي (نص) */}
                    <button
                      onClick={() => {
                        const selectedShop = shops.find(s => s.id === selectedShopId);
                        const shopName = selectedShop ? selectedShop.name : 'بقالة';
                        const isSale = viewingTxDetails.type === 'sale';
                        
                        let msg = '';
                        if (isSale) {
                          const items = getTxItems(viewingTxDetails) || [];
                          msg = buildWhatsAppInvoiceText({
                            items: items.length > 0 ? items : [{
                              label: 'مبيعات كروت ' + getNetworkName(),
                              category: viewingTxDetails.amount,
                              quantity: 1,
                              price: viewingTxDetails.amount,
                              total: viewingTxDetails.amount
                            }],
                            totalAmount: viewingTxDetails.amount,
                            receivedAmount: 0,
                            type: CalculatorType.REGULAR,
                            date: viewingTxDetails.date,
                            shopName: shopName
                          }, getNetworkName());
                        } else {
                          msg = buildPaymentReceiptWhatsAppText({
                            shopName: shopName,
                            amount: viewingTxDetails.amount,
                            date: viewingTxDetails.date,
                            receiptId: viewingTxDetails.invoiceId || viewingTxDetails.id,
                            notes: viewingTxDetails.notes
                          });
                        }
                        openWhatsAppDirect(selectedShop?.phone, msg);
                        showToast('تم فتح واتساب لمشاركة السند/الفاتورة 💬', 'success');
                      }}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-green-600/10"
                    >
                      <MessageCircle size={13} />
                      <span>مشاركة واتساب 💬</span>
                    </button>

                    {/* رسالة نصية SMS */}
                    <button
                      onClick={() => {
                        const selectedShop = shops.find(s => s.id === selectedShopId);
                        const shopName = selectedShop ? selectedShop.name : 'بقالة';
                        const isSale = viewingTxDetails.type === 'sale';
                        let smsMsg = '';
                        if (isSale) {
                          const items = getTxItems(viewingTxDetails) || [];
                          smsMsg = buildSMSInvoiceText({
                            items: items,
                            totalAmount: viewingTxDetails.amount,
                            receivedAmount: 0,
                            shopName: shopName
                          }, getNetworkName());
                        } else {
                          smsMsg = `سند واصل ${getNetworkName()}\nالبقالة: ${shopName}\nالمبلغ المستلم: ${viewingTxDetails.amount} ريال\nالتاريخ: ${viewingTxDetails.date}`;
                        }
                        const destPhone = selectedShop?.phone ? selectedShop.phone.replace('+', '') : '';
                        const smsUrl = destPhone ? `sms:${destPhone}?&body=${encodeURIComponent(smsMsg)}` : `sms:?&body=${encodeURIComponent(smsMsg)}`;
                        window.open(smsUrl, '_blank');
                      }}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-blue-500/10"
                    >
                      <FileText size={13} />
                      <span>رسالة SMS 📱</span>
                    </button>

                    <button
                      onClick={() => {
                        const tx = viewingTxDetails;
                        setEditingTx(tx);
                        setEditTxAmount(tx.amount);
                        setEditTxNotes(tx.notes);
                        setEditTxDate(tx.date);
                        setEditTxItems(getTxItems(tx) || []);
                        setIsEditingDetails(true);
                      }}
                      className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-amber-500/10"
                    >
                      <Pencil size={13} />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewingTxDetails(null);
                        setIsEditingDetails(false);
                      }}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black rounded-xl cursor-pointer hover:bg-slate-200 text-center"
                    >
                      إغلاق
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col justify-between max-h-[85vh] text-right"
            >
              <div className="pb-2 border-b border-slate-50 dark:border-slate-800 shrink-0">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center justify-end gap-1.5 font-sans">
                  <span>مشاركة كشف حساب جماعي</span>
                  <Share2 size={18} className="text-blue-500" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">حدد البقالات لتوليد كشوفاتها وإرسالها عبر واتساب</p>
              </div>

              {/* التحكم في التحديد */}
              <div className="my-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl shrink-0">
                <span className="text-[11px] text-slate-400 font-bold select-none">التحكم في التحديد:</span>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      const allSelected: Record<string, boolean> = {};
                      shops.forEach(s => { allSelected[s.id] = true; });
                      setSelectedShopsForShare(allSelected);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-350 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    تحديد الكل
                  </button>
                  <button
                    onClick={() => {
                      setSelectedShopsForShare({});
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-350 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* قائمة البقالات */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2" style={{ maxHeight: '280px' }}>
                {shops.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 font-bold">ليست هناك بقالات مسجلة لتوليد كشف لها</p>
                ) : (
                  shops.map(shop => {
                    const isSelected = !!selectedShopsForShare[shop.id];
                    return (
                      <div 
                        key={shop.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-blue-50/45 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/35' 
                            : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800/80 hover:border-slate-100'
                        }`}
                      >
                        {/* تعديل رقم الحساب والإرسال الفردي السريع */}
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={shop.phone || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setShops(prev => prev.map(p => p.id === shop.id ? { ...p, phone: val || undefined } : p));
                            }}
                            placeholder="77XXXXXXX"
                            className="w-24 px-2 py-1 text-[11px] font-bold text-center border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-400 font-sans"
                            title="تعديل الهاتف"
                          />
                          <button
                            disabled={!isSelected}
                            onClick={() => {
                              const timestamp = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
                              const today = new Date().toISOString().split('T')[0];
                              let msg = `*📄 كشف حساب مالي - ${getNetworkName()} 📄*\n`;
                              msg += `*العميل / البقالة:* ${shop.name}\n`;
                              msg += `*التاريخ:* ${today} - *الوقت:* ${timestamp}\n`;
                              msg += `*رقم الحساب:* \`${shop.id}\`\n`;
                              msg += `------------------------------------\n`;
                              msg += `💵 *إجمالي المسحوبات:* *${shop.totalSales} ريال*\n`;
                              msg += `📥 *إجمالي المدفوعات:* *${shop.totalPayments} ريال*\n`;
                              msg += `------------------------------------\n`;
                              if (shop.currentBalance > 0) {
                                msg += `🚨 *الرصيد المتبقي المستحق (عليه):* *${shop.currentBalance} ريال*\n`;
                              } else if (shop.currentBalance < 0) {
                                msg += `🚨 *الرصيد الزائد له (له متبقي):* *${Math.abs(shop.currentBalance)} ريال*\n`;
                              } else {
                                msg += `✅ *رصيد الحساب المالي:* خالص مسدد تماماً\n`;
                              }
                              msg += `------------------------------------\n`;
                              msg += `📜 *[ لسنا الوحيدون ولكننا الافضل ]*`;
                              
                              const phoneNum = shop.phone?.trim() ? shop.phone.trim() : '';
                              openWhatsAppDirect(phoneNum, msg);
                              showToast(`تم فتح واتساب لـ ${shop.name} لإرسال الكشف 💬`, 'success');
                            }}
                            className={`p-2 rounded-xl text-white transition-all cursor-pointer text-center flex items-center justify-center shrink-0 ${isSelected ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                            title="إرسال عبر واتساب"
                          >
                            <Phone size={13} />
                          </button>
                        </div>

                        {/* معلومات البقالة والاختيار */}
                        <div className="flex items-center gap-3 text-right">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{shop.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold font-sans">
                              المتبقي: <span className={shop.currentBalance > 0 ? "text-red-500 font-extrabold" : shop.currentBalance < 0 ? "text-emerald-500 font-extrabold" : "text-slate-400 font-extrabold"}>
                                {shop.currentBalance} ريال
                              </span>
                            </p>
                          </div>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedShopsForShare(prev => ({
                                ...prev,
                                [shop.id]: !prev[shop.id]
                              }));
                            }}
                            className="w-4 h-4 rounded-md accent-blue-600 dark:accent-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* إغلاق */}
              <div className="pt-3 shrink-0 border-t border-slate-50 dark:border-slate-800">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer text-center"
                >
                  الرجوع وإغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chartSelectedShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChartSelectedShop(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.2rem] border border-slate-150 dark:border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4 text-right"
              style={{ direction: 'rtl' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                    <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
                    <span>ملخص حساب: {chartSelectedShop.name}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-extrabold">آخر 3 عمليات مضافة للبقالة وسجل المديونية السريع</p>
                </div>
                <button
                  onClick={() => setChartSelectedShop(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status & Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center select-none pt-1">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 font-extrabold block mb-0.5">المشتريات</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-sans">
                    {chartSelectedShop.totalSales.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5 font-sans">ريال</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 font-extrabold block mb-0.5">المدفوعات</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-sans">
                    {chartSelectedShop.totalPayments.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5 font-sans">ريال</span>
                </div>
                <div className="bg-rose-50/55 dark:bg-rose-950/15 p-2.5 rounded-2xl border border-rose-100/30 dark:border-rose-900/15">
                  <span className="text-[9px] text-rose-500 dark:text-rose-400 font-extrabold block mb-0.5">الدين المستحق</span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-sans">
                    {chartSelectedShop.currentBalance.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[8px] text-rose-400 block mt-0.5 font-sans">ريال</span>
                </div>
              </div>

              {/* Last 3 Transactions Timeline */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">أحدث 3 عمليات حسابية:</h4>
                
                {(!chartSelectedShop.transactions || chartSelectedShop.transactions.length === 0) ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800">
                    لا توجد عمليات مضافة مسبقاً لهذا الحساب.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...chartSelectedShop.transactions].reverse().slice(0, 3).map((tx, idx) => {
                      const isSale = tx.type === 'sale';
                      return (
                        <div 
                          key={tx.id || idx}
                          className={`p-3 rounded-xl border flex items-center justify-between text-right transition-all ${
                            isSale 
                              ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-100/30 dark:border-rose-900/10' 
                              : 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/30 dark:border-emerald-900/10'
                          }`}
                        >
                          <div className="space-y-0.5 text-right">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isSale 
                                ? 'bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400' 
                                : 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            }`}>
                              {isSale ? 'شراء آجل' : 'دفعة مسددة'}
                            </span>
                            <span className="text-[10px] font-sans font-black text-slate-400 dark:text-slate-500 mr-2">{tx.date}</span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                              {tx.notes || (isSale ? 'مبيعات كروت غير مصنفة' : 'دفعة حساب بقالة')}
                            </p>
                          </div>
                          <div className="text-left">
                            <span className={`text-xs font-black font-sans ${isSale ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isSale ? '-' : '+'}{tx.amount.toLocaleString('ar-YE')} ريال
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSelectedShopId(chartSelectedShop.id);
                    setChartSelectedShop(null);
                    showToast(`تم الانتقال للحساب الكامل لبقالة (${chartSelectedShop.name}) 📂`, 'success');
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} />
                  <span>انتقال إلى الحساب الكامل</span>
                </button>
                <button
                  onClick={() => setChartSelectedShop(null)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-xs font-black rounded-xl cursor-pointer transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Adding Invoice inside Grocery Accounts (إضافة فاتورة للبقالة) */}
      <AnimatePresence>
        {showAddInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddInvoiceModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl text-right z-10 space-y-5 max-h-[90vh] overflow-y-auto"
              style={{ direction: 'rtl' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">إضافة فاتورة مبيعات للبقالة 🧾</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold">تضاف الفاتورة مباشرة لحساب البقالة وفي مبيعات اليوم</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Shop Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">البقالة / العميل المستهدف:</label>
                {selectedShop ? (
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 font-sans">{selectedShop.name}</span>
                    <span className="text-sm select-none">{selectedShop.emoji || '🔴'}</span>
                  </div>
                ) : (
                  <select
                    value={addInvoiceShopId}
                    onChange={(e) => setAddInvoiceShopId(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (الرصيد المتبقي: {s.currentBalance.toLocaleString('ar-YE')} ريال)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Network / Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">فئة الكروت / الشبكة:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAddInvoiceType(CalculatorType.REGULAR);
                      setAddInvoiceQuantities({ 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 });
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      addInvoiceType === CalculatorType.REGULAR
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    الكروت العادية 💳
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddInvoiceType(CalculatorType.PRO);
                      setAddInvoiceQuantities({ 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 });
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      addInvoiceType === CalculatorType.PRO
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    كروت فئة PRO ✨
                  </button>
                </div>
              </div>

              {/* Quantities Per Category */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">حدد كمية الكروت المباعة للفاتورة:</label>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {activePrices.map(cat => {
                    const q = addInvoiceQuantities[cat.id] || 0;
                    return (
                      <div 
                        key={cat.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white">{cat.label}</span>
                          <span className="text-[10px] text-slate-400 font-bold font-sans">السعر: {cat.price} ريال</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAddInvoiceQuantities(prev => ({
                                ...prev,
                                [cat.id]: Math.max(0, (prev[cat.id] || 0) - 1)
                              }));
                            }}
                            className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-md flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            value={q === 0 ? '' : q}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setAddInvoiceQuantities(prev => ({ ...prev, [cat.id]: val }));
                            }}
                            placeholder="0"
                            className="w-14 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs font-black font-sans text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setAddInvoiceQuantities(prev => ({
                                ...prev,
                                [cat.id]: (prev[cat.id] || 0) + 1
                              }));
                            }}
                            className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-md flex items-center justify-center hover:bg-blue-700 transition-colors active:scale-95 cursor-pointer shadow-sm shadow-blue-500/20"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="bg-slate-100/80 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-600 dark:text-slate-400">إجمالي المبلغ للفاتورة:</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400 font-sans">{invoiceTotalAmount.toLocaleString('ar-YE')} ريال</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">الواصل كاش (كم وصل):</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAddInvoiceReceived('0')}
                        className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                      >
                        دين بالكامل (0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddInvoiceReceived(String(invoiceTotalAmount))}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-200 cursor-pointer"
                      >
                        كاش بالكامل ({invoiceTotalAmount})
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      value={addInvoiceReceived}
                      onChange={(e) => setAddInvoiceReceived(e.target.value)}
                      placeholder="0 (أو أدخل الواصل)..."
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black outline-none focus:border-blue-500 text-right font-sans text-slate-900 dark:text-white"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">ريال</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="font-extrabold text-slate-600 dark:text-slate-400">المتبقي دين من الفاتورة:</span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-sans">
                    {Math.max(0, invoiceTotalAmount - (Number(addInvoiceReceived) || 0)).toLocaleString('ar-YE')} ريال
                  </span>
                </div>

                {/* Payment Type Selector */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">نوع الفاتورة:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddInvoicePaymentType('آجل')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        addInvoicePaymentType === 'آجل'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      آجل (دين)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddInvoicePaymentType('نقد')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        addInvoicePaymentType === 'نقد'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      نقداً (كاش)
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">ملاحظات الفاتورة (اختياري):</label>
                <input
                  type="text"
                  value={addInvoiceNotes}
                  onChange={(e) => setAddInvoiceNotes(e.target.value)}
                  placeholder="مثال: تسليم كروت مبيعات الوردية..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 text-right"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAddInvoice}
                  className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/20 col-span-2 sm:col-span-1"
                >
                  <CheckCircle2 size={18} />
                  <span>اعتماد الفاتورة وإدخالها ⚡</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all col-span-2 sm:col-span-1"
                >
                  <span>إلغاء</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [networkName, setNetworkName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('network_name');
      if (!saved) {
        localStorage.setItem('network_name', 'شبكة الدحشة اللاسلكية');
        return 'شبكة الدحشة اللاسلكية';
      }
      return saved;
    }
    return 'شبكة الدحشة اللاسلكية';
  });

  const [isActivated, setIsActivated] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('is_activated') !== 'true') {
        localStorage.setItem('is_activated', 'true');
      }
      return true;
    }
    return true;
  });

  const [activeSerial, setActiveSerial] = useState(() => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('activated_serial');
      if (!saved) {
        const randomIndex = Math.floor(Math.random() * VALID_SERIALS.length);
        saved = VALID_SERIALS[randomIndex];
        localStorage.setItem('activated_serial', saved);
      }
      return saved;
    }
    return '';
  });

  const [isActivating, setIsActivating] = useState(false);

  const [distributorName, setDistributorName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('distributor_name') || 'أحمد المنتصر';
    }
    return 'أحمد المنتصر';
  });

  const [distributorPhone, setDistributorPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('distributor_phone') || '773086403';
    }
    return '773086403';
  });

  const [pdfFooterNote, setPdfFooterNote] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pdf_footer_note') || 'شعارنا: [ لسنا الوحيدون ولكننا الافضل ]';
    }
    return 'شعارنا: [ لسنا الوحيدون ولكننا الافضل ]';
  });

  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('custom_pdf_logo');
    }
    return null;
  });

  // Preload custom logo image so canvas rendering has it loaded synchronously
  useEffect(() => {
    getCustomLogoImage();
  }, [customLogoUrl]);

  const [serialInput, setSerialInput] = useState('');
  const [tempNetworkName, setTempNetworkName] = useState('');

  const [activeTab, setActiveTab] = useState<AppTab>('regular');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [balanceLimit, setBalanceLimit] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('balance_limit');
      return saved ? Number(saved) : 5000;
    }
    return 5000;
  });

  const handleLimitChange = (val: number) => {
    setBalanceLimit(val);
    localStorage.setItem('balance_limit', String(val));
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isExited, setIsExited] = useState(false);

  // Purchases module toggle state
  const [isPurchasesEnabled, setIsPurchasesEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('is_purchases_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Reset Accounts password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  // Local offline mode state (100% offline local storage)


  // Listen to Krot folder files saving
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Krot file saved listener
    const handleKrotSaved = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.success) {
        showToast(`📁 تم حفظ المستند في مجلد الهاتف (Krot) باسم:\n${detail.filename}`, 'success');
      }
    };

    window.addEventListener('krot-file-saved', handleKrotSaved);

    return () => {
      window.removeEventListener('krot-file-saved', handleKrotSaved);
    };
  }, []);



  // Location ref to track current view for bulletproof Hardware Back Button handling
  const currentLocationRef = useRef<{ activeTab: AppTab; selectedShopId: string | null }>({
    activeTab: 'regular',
    selectedShopId: null
  });

  useEffect(() => {
    currentLocationRef.current = { activeTab, selectedShopId };
  }, [activeTab, selectedShopId]);

  // Refs to manage history synchronization without infinite loops
  const isPopStateRef = useRef(false);
  const lastPushedState = useRef<{ tab: string; shopId: string | null } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial State Setup
    // Push the very first "Anchor" state to trap back button exit on the home tab
    window.history.replaceState({ isAnchor: true }, '');
    
    const initialState = { tab: 'regular', shopId: null };
    window.history.pushState(initialState, '');
    lastPushedState.current = initialState;

    // 2. PopState Event Listener (Hardware Back Button / BackHandler)
    const handlePopState = (event: PopStateEvent) => {
      isPopStateRef.current = true;

      // CRITICAL: If user is inside a specific grocery details screen, Hardware Back Button MUST return to grocery list!
      if (currentLocationRef.current.selectedShopId !== null) {
        setSelectedShopId(null);
        setActiveTab('shops');
        const restoredState = { tab: 'shops', shopId: null };
        window.history.replaceState(restoredState, '');
        lastPushedState.current = restoredState;
        return;
      }

      if (event.state) {
        if (event.state.isAnchor) {
          // User pressed back from the home screen! Show exit confirmation dialog!
          setShowExitConfirm(true);

          // Restore the active screen in the browser history stack
          const restoredState = { tab: 'regular', shopId: null };
          window.history.pushState(restoredState, '');
          lastPushedState.current = restoredState;

          // Make sure we are on the regular tab
          setActiveTab('regular');
          setSelectedShopId(null);
        } else {
          // Normal state pop within our stack
          const { tab, shopId } = event.state;
          setActiveTab(tab);
          setSelectedShopId(shopId);
          lastPushedState.current = { tab, shopId };
        }
      } else {
        // Fallback: if state is completely empty, it means we went past everything
        setShowExitConfirm(true);
        const restoredState = { tab: 'regular', shopId: null };
        window.history.pushState(restoredState, '');
        lastPushedState.current = restoredState;
        
        setActiveTab('regular');
        setSelectedShopId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 3. Keep Browser History in Sync with React State Changes (from user interaction)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If the state is exactly what was last pushed, do nothing
    if (
      lastPushedState.current &&
      lastPushedState.current.tab === activeTab &&
      lastPushedState.current.shopId === selectedShopId
    ) {
      return;
    }

    // If the state change is from a back/popstate event, just consume it and don't push
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      lastPushedState.current = { tab: activeTab, shopId: selectedShopId };
      return;
    }

    // Otherwise, user clicked a button or tab manually. Push state to history stack!
    const newState = { tab: activeTab, shopId: selectedShopId };
    lastPushedState.current = newState;
    window.history.pushState(newState, '');
  }, [activeTab, selectedShopId]);
  
  // Custom prices storage
  const [prices, setPrices] = useState<Record<CalculatorType, CardCategory[]>>(() => {
    const saved = localStorage.getItem('custom_prices');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  const [quantities, setQuantities] = useState<Record<number, number>>({
    100: 0, 200: 0, 250: 0, 300: 0, 500: 0
  });

  const [pricesEditType, setPricesEditType] = useState<CalculatorType>(CalculatorType.REGULAR);
  const [receivedAmount, setReceivedAmount] = useState<number | string>('');
  const [shopName, setShopName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last_shop_name') || '';
    }
    return '';
  });
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [serialSearchQuery, setSerialSearchQuery] = useState('');

  // Success Overlay / Invoice sharing state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleSummary, setLastSaleSummary] = useState<{
    items: { label: string; category: number; quantity: number; price: number; total: number }[];
    totalAmount: number;
    receivedAmount: number;
    remainingAmount: number;
    type: CalculatorType;
    date: string;
    shopName?: string;
  } | null>(null);

  // Toast banner state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sound Config
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sound_enabled');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  // Thermal Print Mode Config
  const [isThermalMode, setIsThermalMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('thermal_mode_enabled');
      return saved === 'true';
    }
    return false;
  });

  const [isAutoDownloadEnabled, setIsAutoDownloadEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auto_download_backup') === 'true';
    }
    return false;
  });

  const [autoCheckpoints, setAutoCheckpoints] = useState<{ id: string; timestamp: string; label: string; backup: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dahsha_auto_backups');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('auto_download_backup', String(isAutoDownloadEnabled));
  }, [isAutoDownloadEnabled]);

  useEffect(() => {
    localStorage.setItem('dahsha_auto_backups', JSON.stringify(autoCheckpoints));
  }, [autoCheckpoints]);

  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [restoreCodeInput, setRestoreCodeInput] = useState('');

  const [isAutoSendWhatsApp, setIsAutoSendWhatsApp] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auto_send_whatsapp');
      if (saved !== null) return saved === 'true';
    }
    return true; // Default enabled by default
  });

  const [isAutoSendSMS, setIsAutoSendSMS] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auto_send_sms') === 'true';
    }
    return false;
  });

  const [autoShareChannel, setAutoShareChannel] = useState<'whatsapp' | 'sms' | 'none'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auto_share_channel');
      if (saved === 'whatsapp' || saved === 'sms' || saved === 'none') {
        return saved;
      }
      if (saved === 'whatsapp_business') return 'whatsapp';
      if (localStorage.getItem('auto_send_sms') === 'true') return 'sms';
      if (localStorage.getItem('auto_send_whatsapp') === 'false') return 'none';
    }
    return 'whatsapp';
  });

  const handleSetAutoShareChannel = (ch: 'whatsapp' | 'sms' | 'none') => {
    setAutoShareChannel(ch);
    localStorage.setItem('auto_share_channel', ch);
    setIsAutoSendWhatsApp(ch === 'whatsapp');
    setIsAutoSendSMS(ch === 'sms');
  };

  const [shopPhone, setShopPhone] = useState('');
  const [shopInitialBalance, setShopInitialBalance] = useState('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [onContactPicked, setOnContactPicked] = useState<((name: string, phone: string) => void) | null>(null);

  // Backup Element reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence for Reports
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('sales_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Shops Database State
  const [shops, setShops] = useState<ShopAccount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grocery_accounts');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Stagnant shops count for badges and side menu
  const stagnantShopsCount = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return shops.filter(shop => {
      let latestDate: Date | null = null;
      if (shop.transactions && shop.transactions.length > 0) {
        shop.transactions.forEach(tx => {
          if (tx.date) {
            const d = new Date(tx.date);
            if (!isNaN(d.getTime()) && (!latestDate || d.getTime() > latestDate.getTime())) {
              latestDate = d;
            }
          }
        });
      }
      if (!latestDate) return true;
      const diffDays = Math.floor((todayMidnight - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 5;
    }).length;
  }, [shops]);

  // Agents / Purchases State
  const [agents, setAgents] = useState<AgentAccount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agent_accounts');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Zones / Neighborhoods State
  const [zones, setZones] = useState<ShopZone[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shop_zones');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing shop_zones:', e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('shop_zones', JSON.stringify(zones));
    } catch (e) {
      console.error('Error saving shop_zones to localStorage:', e);
    }
  }, [zones]);

  // Daily backup checker (saves daily backup automatically as JSON in Documents/Krot folder)
  useEffect(() => {
    if (!isActivated) return;
    
    const runDailyBackupCheck = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastBackupDate = localStorage.getItem('last_daily_backup_date');
      
      if (lastBackupDate !== todayStr) {
        try {
          const dateStr = todayStr.replace(/-/g, '_');
          const backupFilename = `نسخة_احتياطية_تلقائية_${dateStr}.json`;
          
          const backupPayload = {
            app: 'dahshah_calculator',
            backupDate: new Date().toISOString(),
            networkName,
            activeSerial,
            prices,
            salesHistory,
            shops,
            distributorName,
            distributorPhone,
            pdfFooterNote,
            theme: isDark ? 'dark' : 'light'
          };

          const jsonText = JSON.stringify(backupPayload, null, 2);
          const result = await saveFileToKrotFolder(backupFilename, jsonText, false, true);
          
          if (result.success) {
            localStorage.setItem('last_daily_backup_date', todayStr);
            console.log(`[AutoBackup] Saved daily checkpoint to Documents/Krot/${backupFilename}`);
          }
        } catch (err) {
          console.error('[AutoBackup] Error during auto daily backup:', err);
        }
      }
    };

    const timer = setTimeout(runDailyBackupCheck, 3000);
    return () => clearTimeout(timer);
  }, [isActivated, networkName, activeSerial, prices, salesHistory, shops, distributorName, distributorPhone, pdfFooterNote, isDark]);

  // Manual backup creator function
  const triggerManualBackupToKrot = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
      const backupFilename = `نسخة_يدوية_${todayStr}_${Date.now().toString().slice(-4)}.json`;
      
      const backupPayload = {
        app: 'dahshah_calculator',
        backupDate: new Date().toISOString(),
        networkName,
        activeSerial,
        prices,
        salesHistory,
        shops,
        distributorName,
        distributorPhone,
        pdfFooterNote,
        theme: isDark ? 'dark' : 'light'
      };

      const jsonText = JSON.stringify(backupPayload, null, 2);
      const result = await saveFileToKrotFolder(backupFilename, jsonText, false);
      
      if (result.success) {
        showToast(`✅ تم حفظ النسخة الاحتياطية في مجلد الهاتف Krot بنجاح!`, 'success');
      } else {
        showToast(`❌ فشل حفظ النسخة الاحتياطية: ${result.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`❌ خطأ أثناء النسخ الاحتياطي: ${err.message || err}`, 'error');
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem('sales_history', JSON.stringify(salesHistory));
    } catch (e) {
      console.error('Error saving sales_history to localStorage:', e);
    }
  }, [salesHistory]);

  useEffect(() => {
    if (isActivated) {
      document.title = activeTab === 'regular' 
        ? `حاسبة مبيعات كروت ${networkName}` 
        : activeTab === 'pro' 
        ? `حاسبة فئة برو Pro | ${networkName}` 
        : activeTab === 'shops'
        ? `حسابات البقالات والعملاء | ${networkName}`
        : activeTab === 'purchases'
        ? `حسابات المشتريات والوكلاء | ${networkName}`
        : activeTab === 'reports'
        ? `التقرير الحسابي والمالي | ${networkName}`
        : activeTab === 'followup'
        ? `المتابعة وركود البقالات | ${networkName}`
        : `حول تطبيق ${networkName}`;
    } else {
      document.title = "تفعيل التطبيق والشبكة";
    }
  }, [activeTab, networkName, isActivated]);

  useEffect(() => {
    try {
      localStorage.setItem('grocery_accounts', JSON.stringify(shops));
    } catch (e) {
      console.error('Error saving grocery_accounts to localStorage:', e);
    }
  }, [shops]);

  useEffect(() => {
    try {
      localStorage.setItem('agent_accounts', JSON.stringify(agents));
    } catch (e) {
      console.error('Error saving agent_accounts to localStorage:', e);
    }
  }, [agents]);

  useEffect(() => {
    try {
      localStorage.setItem('custom_prices', JSON.stringify(prices));
    } catch (e) {
      console.error('Error saving custom_prices to localStorage:', e);
    }
  }, [prices]);

  useEffect(() => {
    localStorage.setItem('sound_enabled', String(isSoundEnabled));
  }, [isSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('thermal_mode_enabled', String(isThermalMode));
  }, [isThermalMode]);

  // Synchronize state with local storage database automatically whenever core state mutates
  useEffect(() => {
    if (isActivated && activeSerial && networkName) {
      const delayDebt = setTimeout(() => {
        pushLocalBackup({
          serial: activeSerial,
          networkName,
          salesHistory,
          shops,
          prices,
          isSoundEnabled,
          distributorName,
          distributorPhone,
          pdfFooterNote
        }).then(ok => {
          if (ok) {
            console.log('💾 [Dahsha Sync] Backup auto-saved locally!');
          }
        });
      }, 500);
      return () => clearTimeout(delayDebt);
    }
  }, [
    isActivated,
    activeSerial,
    networkName,
    salesHistory,
    shops,
    prices,
    isSoundEnabled,
    distributorName,
    distributorPhone,
    pdfFooterNote
  ]);

  const currentType = activeTab === 'pro' ? CalculatorType.PRO : CalculatorType.REGULAR;
  const currentPrices = prices[currentType];

  const totalAmount = useMemo(() => {
    return currentPrices.reduce((sum, cat) => sum + (quantities[cat.id] || 0) * cat.price, 0);
  }, [quantities, currentPrices]);

  const existingShop = useMemo(() => {
    const active = shopName.trim();
    if (!active) return null;
    return shops.find(s => s.name.toLowerCase() === active.toLowerCase()) || null;
  }, [shopName, shops]);

  const previousBalance = useMemo(() => {
    return existingShop ? existingShop.currentBalance : 0;
  }, [existingShop]);

  const remainingAmount = useMemo(() => {
    const received = Number(receivedAmount) || 0;
    return totalAmount - received;
  }, [receivedAmount, totalAmount]);

  const isConfirmEnabled = totalAmount > 0;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerAutoBackup = (nextSales: SaleRecord[], nextShops: ShopAccount[], invoiceLabel: string) => {
    const backupObj = {
      salesHistory: nextSales,
      shops: nextShops,
      prices,
      isSoundEnabled,
      version: '1.2.0',
      exportDate: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('dahsha_recent_autobackup', JSON.stringify(backupObj));

      const newCheckpoint = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        label: invoiceLabel || 'إدخال عملية فاتورة وتحديث أرصدة',
        backup: JSON.stringify(backupObj)
      };

      setAutoCheckpoints(prev => [newCheckpoint, ...prev].slice(0, 10));

      if (isAutoDownloadEnabled) {
        try {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
          const link = document.createElement('a');
          link.setAttribute("href", dataStr);
          link.setAttribute("download", `auto_dahsha_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('تم حفظ وتحميل ملف النسخة الاحتياطية التلقائية بنجاح 📁', 'success');
        } catch (err) {
          console.error('Auto download failed', err);
        }
      }
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  /**
   * معالجة وحفظ الفاتورة (إدخال الفاتورة):
   * تحتسب هذه الدالة المبلغ الواصل وتضيفه لحساب العميل.
   * - إذا سدد العميل بالكامل، تضاف الفاتورة كمحاسبة.
   * - إذا نقص العميل من المبلغ، يتم تسجيل المتبقي كدين (آجل) في حسابه.
   * - إذا دفع العميل مبلغ فائق (زيد فلوس)، يتم إيداع الفائض كرصيد له في حسابه.
   */
  const handleConfirm = (isCreditInput?: boolean) => {
    if (!isConfirmEnabled) return;

    const today = saleDate;
    
    // Process items elements
    const soldItems = currentPrices
      .filter(p => (quantities[p.id] || 0) > 0)
      .map(p => ({
        label: p.label,
        category: p.id,
        quantity: quantities[p.id],
        price: p.price,
        total: (quantities[p.id] || 0) * p.price
      }));

    const activeShop = shopName.trim();
    const currentPrevBalance = previousBalance;
    let recAmount = Number(receivedAmount) || 0;
    
    // تحديد ما إذا كانت الفاتورة بالآجل (دين)
    let isCredit = false;
    if (isCreditInput === true) {
      isCredit = true;
    } else if (isCreditInput === false) {
      // إذا نقر المستخدم على "إدخال الفاتورة" ولكن المبلغ المدفوع أقل من الإجمالي، تُعتبر آجل تلقائياً
      if (recAmount > 0 && recAmount < totalAmount) {
        isCredit = true;
      } else {
        isCredit = false;
      }
    } else {
      isCredit = recAmount < totalAmount;
    }

    const paymentTypeSelected: 'نقد' | 'آجل' = isCredit ? 'آجل' : 'نقد';

    if (paymentTypeSelected === 'نقد' && recAmount === 0) {
      recAmount = totalAmount;
    }

    // Restrict "آجل" (debt) to only registered shops. Do not allow general credit.
    if (paymentTypeSelected === 'آجل' && !activeShop) {
      showToast('⚠️ لا يمكن تسجيل فاتورة "آجل" لزبون عام! يرجى اختيار اسم البقالة من القائمة المنسدلة أو فتح حساب جديد من قسم البقالات أولاً.', 'error');
      return;
    }

    const invoiceIdGenerated = 'INV-' + Date.now().toString(36).substring(4).toUpperCase();

    const newRecords: SaleRecord[] = soldItems.map(item => ({
      date: today,
      type: currentType,
      category: item.category,
      quantity: item.quantity,
      total: item.total,
      shopName: activeShop || 'زبون نقدي عام',
      paymentType: paymentTypeSelected,
      receivedAmount: recAmount,
      remainingAmount: totalAmount - recAmount,
      invoiceId: invoiceIdGenerated,
      totalInvoiceAmount: totalAmount
    }));

    const nextSalesHistory = [...salesHistory, ...newRecords];
    setSalesHistory(nextSalesHistory);

    let nextShops = shops;
    if (activeShop) {
      localStorage.setItem('last_shop_name', activeShop);
      
      const existingIdx = shops.findIndex(s => s.name.toLowerCase() === activeShop.toLowerCase());
      const timestamp = saleDate;
      
      const newTx: ShopTransaction = {
        id: Math.random().toString(36).substring(2, 9),
        date: timestamp,
        type: 'sale',
        amount: totalAmount,
        notes: `فاتورة كروت مبيعات (${paymentTypeSelected === 'آجل' ? 'آجل' : 'نقداً'}) بقيمة ${totalAmount} ريال`,
        invoiceId: invoiceIdGenerated,
        items: soldItems
      };

      const paymentTx: ShopTransaction = {
        id: Math.random().toString(36).substring(2, 9),
        date: timestamp,
        type: 'payment',
        amount: recAmount,
        notes: `سداد واصل كاش من الفاتورة بقيمة ${recAmount} ريال`,
        invoiceId: invoiceIdGenerated
      };
      
      if (existingIdx > -1) {
        const updated = [...shops];
        const oldAccount = updated[existingIdx];
        const updatedTx = [...(oldAccount.transactions || []), newTx];
        if (recAmount > 0) {
          updatedTx.push(paymentTx);
        }
        const updatedSales = oldAccount.totalSales + totalAmount;
        const updatedPayments = oldAccount.totalPayments + recAmount;
        
        updated[existingIdx] = {
          ...oldAccount,
          totalSales: updatedSales,
          totalPayments: updatedPayments,
          currentBalance: updatedSales - updatedPayments,
          transactions: updatedTx
        };
        nextShops = updated;
      } else {
        // Automatically create a new shop account if it does not exist yet
        const initialTx: ShopTransaction[] = [newTx];
        if (recAmount > 0) {
          initialTx.push(paymentTx);
        }
        const newShopAccount: ShopAccount = {
          id: Math.random().toString(36).substring(2, 9),
          name: activeShop,
          currentBalance: totalAmount - recAmount,
          totalSales: totalAmount,
          totalPayments: recAmount,
          createdAt: timestamp,
          transactions: initialTx,
          isPro: false
        };
        nextShops = [...shops, newShopAccount];
      }
      setShops(nextShops);
    }

    // Construct invoice summary state
    const summary = {
      items: soldItems,
      totalAmount,
      receivedAmount: recAmount,
      remainingAmount: totalAmount - recAmount,
      type: currentType,
      date: today,
      shopName: activeShop || 'بقالة عامة',
      previousBalance: currentPrevBalance,
      invoiceId: invoiceIdGenerated,
      paymentType: paymentTypeSelected
    };

    setLastSaleSummary(summary);
    setShowSuccessModal(true);

    // Audio beep confirmation
    playSuccessSound(isSoundEnabled);

    // Reset quantities
    setQuantities({ 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 });
    setReceivedAmount('');
    setShopPhone('');
    setShopInitialBalance('');
    setSaleDate(new Date().toISOString().split('T')[0]);

    // Auto send triggers
    setTimeout(() => {
      let destPhone = shopPhone.trim();
      if (!destPhone && activeShop) {
        const match = nextShops.find(s => s.name.toLowerCase() === activeShop.toLowerCase());
        if (match && match.phone) {
          destPhone = match.phone.trim();
        }
      }

      let formattedPhone = destPhone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (formattedPhone.length === 9 && !formattedPhone.startsWith('967')) {
        formattedPhone = '967' + formattedPhone;
      }

      if (autoShareChannel === 'whatsapp') {
        const msg = buildWhatsAppInvoiceText({
          items: soldItems,
          totalAmount,
          receivedAmount: recAmount,
          type: currentType,
          date: today,
          shopName: activeShop || 'بقالة عامة',
          previousBalance: currentPrevBalance
        }, networkName, pdfFooterNote);

        openWhatsAppDirect(destPhone, msg);
        showToast('تم توجيه الفاتورة تلقائياً للواتساب الأخضر العادي 💬', 'success');
      } else if (autoShareChannel === 'sms') {
        const smsMsg = buildSMSInvoiceText({
          items: soldItems,
          totalAmount,
          receivedAmount: recAmount,
          shopName: activeShop || 'بقالة عامة',
          previousBalance: currentPrevBalance
        }, networkName);

        const finalSmsUrl = destPhone 
          ? `sms:${destPhone}?&body=${encodeURIComponent(smsMsg)}`
          : `sms:?&body=${encodeURIComponent(smsMsg)}`;
        window.open(finalSmsUrl, '_blank');
        showToast('تم توجيه الفاتورة للرسائل النصية SMS 📱', 'success');
      }
    }, 600);

    // Trigger auto backup natively!
    const itemsLabel = soldItems.map(i => `${i.quantity}x ${i.category}`).join('، ');
    const invoiceLabel = `فاتورة ${invoiceIdGenerated} على ${activeShop || 'بقالة عامة'} بقيمة ${totalAmount} ريال (${itemsLabel})`;
    triggerAutoBackup(nextSalesHistory, nextShops, invoiceLabel);
  };

  const handleCopyInvoiceText = (summary: any) => {
    if (!summary) return;
    const msg = buildWhatsAppInvoiceText(summary, networkName, pdfFooterNote);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        showToast('تم نسخ نص الفاتورة للحافظة بنجاح 📋', 'success');
      }).catch(() => {
        showToast('تعذر نسخ النص تلقائياً', 'error');
      });
    } else {
      showToast('خاصية النسخ غير مدعومة في متصفحك', 'error');
    }
  };

  const handleUndoInvoice = () => {
    if (!lastSaleSummary || !lastSaleSummary.invoiceId) {
      showToast('عذراً، لا توجد فاتورة حديثة للتراجع عنها.', 'error');
      return;
    }

    if (lastSaleSummary.paymentType === 'نقد') {
      showToast('عذراً، الفواتير النقدية معتمدة نهائياً ولا يمكن التراجع عنها!', 'error');
      return;
    }

    if (!confirm('هل أنت متأكد من التراجع عن هذه الفاتورة الآجلة بالكامل وإلغاء تسجيل مبيعاتها وأثرها المالي على حساب العميل؟')) {
      return;
    }

    const targetInvoiceId = lastSaleSummary.invoiceId;
    const targetShopName = lastSaleSummary.shopName;

    // 1. Revert sales history
    const revertedSalesHistory = salesHistory.filter(rec => rec.invoiceId !== targetInvoiceId);
    setSalesHistory(revertedSalesHistory);

    // 2. Revert shop balance & transactions (if registered shop)
    let revertedShops = shops;
    if (targetShopName && targetShopName !== 'بقالة عامة' && targetShopName !== 'زبون نقدي عام') {
      const existingIdx = shops.findIndex(s => s.name.toLowerCase() === targetShopName.toLowerCase());
      if (existingIdx > -1) {
        const updated = [...shops];
        const oldAccount = updated[existingIdx];
        
        // Remove transactions matching this invoiceId
        const updatedTx = (oldAccount.transactions || []).filter(tx => tx.invoiceId !== targetInvoiceId);
        
        // Recalculate totals and current balance based on remaining transactions
        let updatedSales = 0;
        let updatedPayments = 0;
        updatedTx.forEach(tx => {
          if (tx.type === 'sale') {
            updatedSales += tx.amount;
          } else if (tx.type === 'payment') {
            updatedPayments += tx.amount;
          }
        });

        updated[existingIdx] = {
          ...oldAccount,
          totalSales: updatedSales,
          totalPayments: updatedPayments,
          currentBalance: updatedSales - updatedPayments,
          transactions: updatedTx
        };
        revertedShops = updated;
        setShops(revertedShops);
      }
    }

    // 3. Clear modal state
    setShowSuccessModal(false);
    showToast('تم التراجع عن الفاتورة وإلغاء قيدها المالي بالكامل ↩️', 'success');

    // 4. Trigger auto-backup
    triggerAutoBackup(revertedSalesHistory, revertedShops, `تراجع عن الفاتورة ${targetInvoiceId} وإلغاء مبيعاتها`);
  };

  const handlePriceChange = (id: number, newPrice: number) => {
    setPrices(prev => ({
      ...prev,
      [pricesEditType]: prev[pricesEditType].map(p => p.id === id ? { ...p, price: newPrice } : p)
    }));
  };

  const handleResetPrices = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الأسعار إلى الافتراضية؟')) {
      setPrices(INITIAL_PRICES);
      showToast('تمت إعادة تعيين الأسعار للافتراضية', 'info');
    }
  };

  const handleResetAccounts = () => {
    if (resetPasswordInput.trim() === 'montaseer') {
      // 1. Clear sales history
      setSalesHistory([]);
      localStorage.removeItem('dahsha_sales_history');

      // 2. Clear shop debt balances and transactions
      setShops(prevShops => prevShops.map(s => ({
        ...s,
        currentBalance: 0,
        totalBillsAmount: 0,
        totalPaidAmount: 0,
        transactions: [],
        invoices: []
      })));
      localStorage.removeItem('dahsha_shops');

      // 3. Clear agent balances and invoices
      setAgents(prevAgents => prevAgents.map(a => ({
        ...a,
        balance: 0,
        invoices: []
      })));
      localStorage.removeItem('dahsha_agents');

      // 4. Reset last sale summary
      setLastSaleSummary(null);

      setShowResetModal(false);
      setResetPasswordInput('');
      showToast('تم تصفير جميع الحسابات والفواتير والسندات بنجاح! 🧹✨', 'success');
    } else {
      showToast('رمز الحماية غير صحيح! ❌ الرمز المطلوب هو montaseer', 'error');
    }
  };

  const clearHistory = () => {
    setShowResetModal(true);
    setResetPasswordInput('');
  };

  const handleBackupExport = () => {
    const backupObj = {
      salesHistory,
      shops,
      prices,
      isSoundEnabled,
      version: '1.2.0',
      exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `dahsha_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف النسخة الاحتياطية بنجاح!', 'success');
  };

  const handleBackupImport = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const target = e.target;
          if (!target || !target.result) return;
          const parsed = JSON.parse(target.result as string);
          
          if (parsed.salesHistory && Array.isArray(parsed.salesHistory)) {
            setSalesHistory(parsed.salesHistory);
            if (parsed.shops && Array.isArray(parsed.shops)) {
              setShops(parsed.shops);
            }
            if (parsed.prices) {
              setPrices(parsed.prices);
            }
            if (parsed.isSoundEnabled !== undefined) {
              setIsSoundEnabled(parsed.isSoundEnabled);
            }
            showToast('تم استيراد واستعادة النسخة الاحتياطية بنجاح!', 'success');
            setShowSettingsModal(false);
          } else {
            showToast('ملف النسخ الاحتياطي غير صالح!', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ أثناء قراءة وفحص ملف البيانات.', 'error');
        }
      };
    }
  };

  const handleMobileShare = async () => {
    const backupObj = {
      salesHistory,
      shops,
      prices,
      isSoundEnabled,
      version: '1.2.0',
      exportDate: new Date().toISOString()
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `dahsha_backup_${todayStr}.json`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const file = new File([jsonStr], fileName, { type: 'application/json' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'نسخة احتياطية - شبكة الدحشة اللاسلكية',
            text: `النسخة الاحتياطية وسجل المبيعات والعملاء لليوم ${todayStr}.`
          });
          showToast('تمت مشاركة الملف بنجاح مع الهاتف 📱', 'success');
          return;
        }
        
        // Fallback for direct browser share sheet with text links
        await navigator.share({
          title: 'نسخة احتياطية - شبكة الدحشة اللاسلكية',
          text: `النسخة الماليَّة لليوم ${todayStr}. يرجى تنزيل الملف وحفظه.`,
          url: window.location.href
        });
        showToast('تم تشغيل قائمة المشاركة بالنظام 📱', 'info');
      } else {
        // Fallback to normal download
        handleBackupExport();
      }
    } catch (err) {
      console.warn('Share sheets cancelled', err);
      handleBackupExport();
    }
  };

  const handleCopyBackupCode = () => {
    const backupObj = {
      salesHistory,
      shops,
      prices,
      isSoundEnabled,
      version: '1.2.0',
      exportDate: new Date().toISOString()
    };

    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(backupObj))));
      navigator.clipboard.writeText(b64);
      setCopyCodeSuccess(true);
      showToast('تم نسخ كود النسخ الاحتياطي بأمان! 📋', 'success');
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    } catch (err) {
      showToast('عذراً، لم نتمكن من نسخ الكود تلقائياً.', 'error');
    }
  };

  const handleRestoreFromCode = () => {
    const trimmed = restoreCodeInput.trim();
    if (!trimmed) {
      showToast('يرجى لصق الكود أولاً للبدء بالاستعادة.', 'error');
      return;
    }

    try {
      const decoded = decodeURIComponent(escape(atob(trimmed)));
      const parsed = JSON.parse(decoded);

      if (parsed.salesHistory && Array.isArray(parsed.salesHistory)) {
        setSalesHistory(parsed.salesHistory);
        if (parsed.shops && Array.isArray(parsed.shops)) {
          setShops(parsed.shops);
        }
        if (parsed.prices) {
          setPrices(parsed.prices);
        }
        if (parsed.isSoundEnabled !== undefined) {
          setIsSoundEnabled(parsed.isSoundEnabled);
        }
        showToast('تم استيراد واستعادة البيانات من كود التحوط المالي بنجاح! 📂', 'success');
        setRestoreCodeInput('');
        setShowSettingsModal(false);
      } else {
        showToast('الكود المدخل لا يحتوي على صيغة صالحة لشبكة الدحشة!', 'error');
      }
    } catch (err) {
      showToast('الرمز المدخل تالف أو لم يتم نسخه بالكامل!', 'error');
    }
  };

  const handleRestoreFromCheckpoint = (checkpoint: { id: string; timestamp: string; label: string; backup: string }) => {
    if (confirm(`هل تلغي التغييرات وتستعيد نسخة اللحظة: ${checkpoint.timestamp}؟\n[ ${checkpoint.label} ]`)) {
      try {
        const parsed = JSON.parse(checkpoint.backup);
        if (parsed.salesHistory && Array.isArray(parsed.salesHistory)) {
          setSalesHistory(parsed.salesHistory);
          if (parsed.shops && Array.isArray(parsed.shops)) {
            setShops(parsed.shops);
          }
          if (parsed.prices) {
            setPrices(parsed.prices);
          }
          if (parsed.isSoundEnabled !== undefined) {
            setIsSoundEnabled(parsed.isSoundEnabled);
          }
          showToast('تمت استعادة حالة كشف الحسابات ومبيعات تلك اللحظة! ↩️', 'success');
          setShowSettingsModal(false);
        } else {
          showToast('عذراً، نقطة النسخ الاحتياطي التلقائي معطوبة.', 'error');
        }
      } catch (err) {
        showToast('النسخة الاحتياطية التلقائية تالفة وغير قادرة على الاستجابة.', 'error');
      }
    }
  };

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
      if (summary[s.type][s.category]) {
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
      rawItems: { label: string; qty: number; total: number }[];
    }} = {};

    dateSales.forEach(s => {
      const invId = s.invoiceId || (s.date + '-' + (s.shopName || 'بقالة عامة'));
      
      const categoryObj = prices[s.type]?.find(p => p.id === s.category);
      const catLabel = categoryObj ? categoryObj.label : `فئة ${s.category}`;

      if (!invoicesMap[invId]) {
        invoicesMap[invId] = {
          invoiceId: invId,
          shopName: s.shopName || 'بقالة عامة',
          totalInvoiceAmount: s.totalInvoiceAmount || s.total,
          receivedAmount: s.receivedAmount !== undefined ? s.receivedAmount : s.total,
          remainingAmount: s.remainingAmount !== undefined ? s.remainingAmount : 0,
          paymentType: s.paymentType || 'نقد',
          itemsSummary: `${s.quantity}x ${catLabel}`,
          rawItems: [{ label: catLabel, qty: s.quantity, total: s.total }]
        };
      } else {
        invoicesMap[invId].itemsSummary += `، ${s.quantity}x ${catLabel}`;
        invoicesMap[invId].rawItems.push({ label: catLabel, qty: s.quantity, total: s.total });
        if (!s.invoiceId) {
          invoicesMap[invId].totalInvoiceAmount += s.total;
          invoicesMap[invId].receivedAmount += s.total;
        }
      }
    });

    return Object.values(invoicesMap);
  }, [salesHistory, prices, reportDate]);

  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly');

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

  const categoryData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesHistory.filter(s => s.date === today);
    
    return [
      { name: '100', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 100)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 100)?.quantity || 0 },
      { name: '200', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 200)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 200)?.quantity || 0 },
      { name: '250', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 250)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 250)?.quantity || 0 },
      { name: '300', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 300)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 300)?.quantity || 0 },
      { name: '500', العادية: todaySales.find(s => s.type === CalculatorType.REGULAR && s.category === 500)?.quantity || 0, PRO: todaySales.find(s => s.type === CalculatorType.PRO && s.category === 500)?.quantity || 0 },
    ];
  }, [salesHistory]);

  if (isExited) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center select-none" style={{ direction: 'rtl' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-slate-950 p-8 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-red-950/50 border border-red-900/50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-black mb-3 text-white">تم إغلاق البرنامج بنجاح</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
            تم حفظ جميع كشوفات المبيعات وحسابات البقالات والتعديلات الحالية بشكل آمن وتلقائي في جهازك.
          </p>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-normal mb-6 font-semibold">
            💡 يمكنك الآن إغلاق هذه الصفحة أو علامة التبويب في متصفحك بأمان.
          </div>
          <button
            onClick={() => {
              setIsExited(false);
              if (typeof window !== 'undefined') {
                window.history.pushState({ exitGuard: true }, '');
              }
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            إعادة الدخول للتطبيق 🚀
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isActivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors font-sans animate-fade-in text-right" style={{ direction: 'rtl' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10 text-right">
            {/* Header / Logo */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-blue-500/15 dark:bg-blue-500/25 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Sparkles size={45} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">إعداد وتفعيل التطبيق</h1>
                <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-xs mx-auto">
                  يرجى إدخال اسم شبكتك وسيريل التفعيل للبدء في استخدام التطبيق بكامل طاقته الاحترافية
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block mb-1.5 font-sans">اسم شبكتك اللاسلكية</label>
                <input 
                  type="text" 
                  value={tempNetworkName}
                  onChange={(e) => setTempNetworkName(e.target.value)}
                  placeholder="مثال: شبكة البركة اللاسلكية"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-right"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block mb-1.5 font-sans">سيريل التفعيل</label>
                <input 
                  type="text" 
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="اكتب السيريل"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-center tracking-widest uppercase"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={isActivating}
              onClick={() => {
                const trimmedName = tempNetworkName.trim();
                const trimmedSerial = serialInput.trim().toUpperCase();

                const finalSerial = trimmedSerial || 'DAH-NETWORK-APP';

                if (!trimmedName) {
                  showToast('يرجى كتابة اسم الشبكة أولاً للبدء!', 'error');
                  return;
                }

                setIsActivating(true);
                activateAndRecover({ serial: finalSerial, networkName: trimmedName })
                  .then(res => {
                    setIsActivating(false);
                    if (res.success) {
                      localStorage.setItem('network_name', trimmedName);
                      localStorage.setItem('activated_serial', trimmedSerial);
                      localStorage.setItem('is_activated', 'true');
                      
                      setNetworkName(trimmedName);
                      setActiveSerial(trimmedSerial);
                      setIsActivated(true);

                      if (res.restoredData) {
                        const d = res.restoredData;
                        setSalesHistory(d.salesHistory || []);
                        setShops(d.shops || []);
                        if (d.prices) setPrices(d.prices);
                        if (d.distributorName) {
                          setDistributorName(d.distributorName);
                          localStorage.setItem('distributor_name', d.distributorName);
                        }
                        if (d.distributorPhone) {
                          setDistributorPhone(d.distributorPhone);
                          localStorage.setItem('distributor_phone', d.distributorPhone);
                        }
                        if (d.pdfFooterNote) {
                          setPdfFooterNote(d.pdfFooterNote);
                          localStorage.setItem('pdf_footer_note', d.pdfFooterNote);
                        }
                        if (d.isSoundEnabled !== undefined) {
                          setIsSoundEnabled(d.isSoundEnabled);
                        }
                      }
                      showToast(res.message, 'success');
                    } else {
                      showToast(res.message, 'error');
                    }
                  })
                  .catch(err => {
                    setIsActivating(false);
                    showToast('حدث خطأ غير متوقع أثناء تفعيل السيريال وسجل الشبكة.', 'error');
                    console.error(err);
                  });
              }}
              className={`w-full py-4 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all ${
                isActivating ? 'opacity-80 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
              }`}
            >
              {isActivating ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري التحقق والاسترداد سحابياً...</span>
                </div>
              ) : (
                <span>تحقق وتفعيل وتنزيل البيانات المفقودة 🚀</span>
              )}
            </button>
          </div>

          {/* Contact / Help info */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 relative z-10 text-center">
            <span className="text-xs font-black text-slate-400">لطلب التفعيل تواصل معانا</span>
            
            <div className="flex gap-2.5 w-full">
              <a 
                href="https://wa.me/967773086403" 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-3 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors font-sans"
              >
                <span>واتساب</span>
                <span className="font-mono font-bold">773086403</span>
              </a>
              <a 
                href="tel:773086403"
                className="flex-1 py-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors font-sans"
              >
                <span>اتصال مباشر</span>
              </a>
            </div>
          </div>
        </motion.div>
        
        {toast && (
          <div className="fixed bottom-5 right-5 left-5 z-[100] flex justify-center pointer-events-none">
            <div className={`px-4 py-3 rounded-2xl shadow-xl text-white font-bold text-xs flex items-center gap-2 animate-bounce ${
              toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-16 transition-colors ${
      activeTab === 'pro' 
        ? 'bg-gradient-to-b from-rose-50/90 via-red-50/40 to-slate-50 dark:from-slate-950 dark:via-red-950/25 dark:to-slate-950' 
        : 'bg-slate-50 dark:bg-slate-950'
    }`}>
      <div id="main-app-content" className="print:hidden">
        <Header 
          title={
            activeTab === 'regular' 
              ? 'حاسبة مبيعات الكروت' 
              : activeTab === 'pro' 
              ? 'حاسبة فئة برو Pro' 
              : activeTab === 'shops'
              ? 'حسابات البقالات والعملاء'
              : activeTab === 'purchases'
              ? 'حسابات المشتريات والوكلاء'
              : activeTab === 'reports'
              ? 'التقرير الحسابي والمالي'
              : activeTab === 'followup'
              ? 'المتابعة والركود'
              : activeTab === 'margin'
              ? 'قسم الهامش المالي'
              : 'إعدادات التطبيق'
          } 
          toggleDark={() => setIsDark(!isDark)}
          isDark={isDark}
          onExit={() => setShowExitConfirm(true)}
          onOpenSideMenu={() => setIsSideMenuOpen(true)}
          isPro={activeTab === 'pro'}
        />

        {/* Global Side Menu for Sections Navigation */}
        <SideMenu
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          networkName={networkName}
          distributorName={distributorName}
          distributorPhone={distributorPhone}
          totalShopsCount={shops.length}
          stagnantCount={stagnantShopsCount}
          isPurchasesEnabled={isPurchasesEnabled}
          isDark={isDark}
          toggleDark={() => setIsDark(!isDark)}
          onExit={() => setShowExitConfirm(true)}
        />

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'about' ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 space-y-6 text-right"
              style={{ direction: 'rtl' }}
            >
              {/* Hidden file input for import */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleBackupImport} 
                accept=".json" 
                className="hidden" 
              />

              {/* 0. Network Name Settings Customizer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-right">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">اسم شبكتك اللاسلكية</h3>
                  <p className="text-xs text-slate-400 mt-0.5">اسم الشبكة اللاسلكية الخاص بك والذي سيظهر في الفواتير والتقارير</p>
                </div>
                <input 
                  type="text" 
                  value={networkName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNetworkName(val);
                    localStorage.setItem('network_name', val);
                  }}
                  placeholder="شبكة الدحشة اللاسلكية"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none text-right focus:border-indigo-500 transition-all"
                />

              </div>

              {/* 0.1 PDF Invoice Footer Customizer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="text-right">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">تخصيص ملاحظات أسفل الفاتورة (PDF)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تعديل معلومات وتوقيع أسفل كل فاتورة PDF يتم إنشاؤها وتعديل الشعار أو الملاحظة والمستوى الثابت</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">اسم الموزع / الوكيل المعتمد</label>
                    <input 
                      type="text" 
                      value={distributorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDistributorName(val);
                        localStorage.setItem('distributor_name', val);
                      }}
                      placeholder="أحمد المنتصر"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-colors text-right"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">رقم هاتف مبيعات الجوال / التواصل</label>
                    <input 
                      type="text" 
                      value={distributorPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDistributorPhone(val);
                        localStorage.setItem('distributor_phone', val);
                      }}
                      placeholder="773086403"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-sans font-bold outline-none focus:border-blue-500 transition-colors text-center"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الشعار أو الملاحظة الثابتة تظهر أسفل الفواتير</label>
                    <input 
                      type="text" 
                      value={pdfFooterNote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPdfFooterNote(val);
                        localStorage.setItem('pdf_footer_note', val);
                      }}
                      placeholder="شعارنا: [ لسنا الوحيدون ولكننا الافضل ]"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-colors text-right"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">شعار مخصص للموزع أو البقالة (رأس ملفات PDF)</label>
                    <div className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right">
                      {customLogoUrl ? (
                        <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg" style={{ direction: 'rtl' }}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={customLogoUrl} 
                              alt="شعار مخصص" 
                              className="w-12 h-12 rounded object-contain border border-slate-200 dark:border-slate-800 bg-white"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-700 dark:text-slate-300">تم اختيار شعار مخصص</p>
                              <p className="text-[10px] text-slate-400">سيظهر في رأس ملفات PDF المصدرة</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLogoUrl(null);
                              localStorage.removeItem('custom_pdf_logo');
                              showToast('تم حذف الشعار المخصص والرجوع للشعار الافتراضي.', 'info');
                            }}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 active:scale-95 transition-all cursor-pointer"
                            title="حذف الشعار"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-[11px] text-slate-400 mb-2 font-semibold">لم يتم اختيار شعار مخصص بعد. سيتم استخدام الشعار التلقائي للشبكة.</p>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/80 rounded-lg text-xs font-black cursor-pointer transition-colors">
                            <Upload size={12} />
                            <span>تحميل شعار مخصص (PNG/JPG)</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64 = ev.target?.result as string;
                                  setCustomLogoUrl(base64);
                                  localStorage.setItem('custom_pdf_logo', base64);
                                  showToast('تم تحميل وحفظ الشعار المخصص بنجاح! 🎉', 'success');
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Alert Chime Chaffer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isSoundEnabled ? <Volume2 className="text-green-500" size={20} /> : <VolumeX className="text-slate-400" size={20} />}
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm text-right">صوت التنبيه للبيع</h3>
                      <p className="text-xs text-slate-400 mt-0.5 text-right">تشغيل رنين كاش عند إتمام كل بيع ناجح</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const nextState = !isSoundEnabled;
                      setIsSoundEnabled(nextState);
                      playSuccessSound(nextState);
                      showToast(nextState ? 'تم تفعيل منبّه البيع 🔊' : 'تم كتم منبّه البيع 🔇', 'info');
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${isSoundEnabled ? 'bg-green-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white mx-0.5 shadow-sm" />
                  </button>
                </div>
              </div>

              {/* 2. Thermal Printer Toggle Switch */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Printer className={isThermalMode ? "text-amber-500" : "text-slate-400"} size={20} />
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm text-right">وضع الطابعة الحرارية (أبيض وأسود)</h3>
                      <p className="text-xs text-slate-400 mt-0.5 text-right">تبديل نمط تصميم كشف الـ PDF لصورة حرارية عالية التباين وموفرة للحبر والورق</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const nextState = !isThermalMode;
                      setIsThermalMode(nextState);
                      showToast(nextState ? 'تم تفعيل وضع الطباعة الحرارية 🖨️' : 'تم العودة للطباعة الملونة الفاخرة 🎨', 'info');
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${isThermalMode ? 'bg-amber-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white mx-0.5 shadow-sm" />
                  </button>
                </div>
              </div>

              {/* 2.1 Auto-Send Options Selector */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="text-right border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 justify-end">
                    <span>المشاركة التلقائية عند إدخال الفاتورة (نقداً أو آجل)</span>
                    <Share2 size={16} className="text-blue-500" />
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">اختر التطبيق المفضل لمشاركة الفاتورة تلقائياً بمجرد إدخالها واعتمادها لحساب البقالة.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleSetAutoShareChannel('whatsapp');
                      showToast('تم ضبط المشاركة التلقائية عبر واتساب الأخضر العادي 💬', 'success');
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center ${
                      autoShareChannel === 'whatsapp'
                        ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-green-400'
                    }`}
                  >
                    <MessageCircle size={20} className={autoShareChannel === 'whatsapp' ? 'text-white' : 'text-green-500'} />
                    <span className="text-xs font-black">واتساب الأخضر</span>
                    <span className="text-[9px] opacity-75">العادي الرسمي 💬</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSetAutoShareChannel('sms');
                      showToast('تم ضبط المشاركة التلقائية عبر الرسائل النصية SMS 📱', 'success');
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center ${
                      autoShareChannel === 'sms'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <FileText size={20} className={autoShareChannel === 'sms' ? 'text-white' : 'text-blue-500'} />
                    <span className="text-xs font-black">رسائل نصية</span>
                    <span className="text-[9px] opacity-75">SMS 📱</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSetAutoShareChannel('none');
                      showToast('تم إيقاف المشاركة التلقائية (مشاركة يدوية فقط) 🔕', 'info');
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center ${
                      autoShareChannel === 'none'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <X size={20} className={autoShareChannel === 'none' ? 'text-white' : 'text-slate-400'} />
                    <span className="text-xs font-black">إيقاف التلقائي</span>
                    <span className="text-[9px] opacity-75">يدوي فقط 🔕</span>
                  </button>
                </div>
              </div>

              {/* مجلد Krot والنسخ الاحتياطي للهاتف */}
              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/10 space-y-4 text-right">
                <div className="border-b border-emerald-500/20 pb-2">
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm flex items-center gap-1.5 justify-end">
                    <span>مجلد الهاتف المخصص (Krot)</span>
                    <FolderDown size={16} className="text-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">تصدير وحفظ الفواتير والنسخ الاحتياطي التلقائي واليدوي مباشرة في مجلد الهاتف باسم Krot</p>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black shrink-0">
                    <CheckCircle2 size={15} />
                    <span>تخزين محلي 💾</span>
                  </div>
                  <div className="text-right pr-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">نظام التخزين المحلي الآلي (100% أوفلاين)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">يتم حفظ جميع الفواتير والمبيعات والحسابات آلياً ومباشرة في الذاكرة المحلية لجهازك دون الحاجة للإنترنت.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={triggerManualBackupToKrot}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    <Database size={14} />
                    إنشاء نسخة احتياطية فورية في مجلد Krot 💾
                  </button>
                  <p className="text-[9px] text-slate-500 text-center leading-normal">
                    💡 في الأجهزة المحمولة، يتم الحفظ في مجلد المستندات الرئيسي للموبايل: <strong className="text-emerald-600 font-bold">Documents/Krot</strong> لتصل إليها في أي وقت وتتمكن من نقلها أو أرشفتها.
                  </p>
                </div>
              </div>

              {/* 3. File Database backup actions */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-5">
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
                    <span>النسخ الاحتياطي واستيراد/تصدير البيانات</span>
                    <Database size={18} className="text-blue-500" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">تصدير واستيراد قاعدة بيانات المبيعات والحسابات بصيغة ملفات لضمان سلامتها.</p>
                </div>

                {/* Auto-Download Backup Toggle */}
                <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-center justify-between">
                  <button 
                    onClick={() => {
                      const nextState = !isAutoDownloadEnabled;
                      setIsAutoDownloadEnabled(nextState);
                      showToast(nextState ? 'تم تفعيل التنزيل التلقائي لملفات الفواتير 📂' : 'تم إلغاء التنزيل التلقائي 🔕', 'info');
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center shrink-0 ${isAutoDownloadEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white mx-0.5 shadow-sm" />
                  </button>
                  <div className="text-right pr-3.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">تنزيل مِلَفّ احتياطي تلقائي</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">تحميل مِلَفّ JSON بالخلفية فور حفظ وتأكيد أي فاتورة بيع جديدة</p>
                  </div>
                </div>

                {/* Core Device and Multi-app Cloud sharing option */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl space-y-3">
                  <div className="text-right">
                    <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5 justify-end">
                      <span>مشاركة سحابية فورية (تيليجرام / درايف / الهاتف)</span>
                      <Share2 size={13} />
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">أرسل نسخة الحسابات والمبيعات كاملة إلى حسابك بتيليجرام، أو مجلد درايف، أو كشف الهاتف الخاص بالواتس بجستة واحدة.</p>
                  </div>

                  <button
                    onClick={handleMobileShare}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-600/10 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    <Share2 size={14} />
                    تصدير ومشاركة للتلجرام وجوجل درايف 📱
                  </button>
                </div>

                {/* Standard file Export Import buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button 
                    onClick={handleBackupExport}
                    className="py-3 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download size={13} />
                    تنزيل مِلَفّ JSON
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Upload size={13} />
                    استيراد مِلف JSON
                  </button>
                </div>
              </div>

              {/* 3. Pricing Tarif Tariffs list editor */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings2 size={16} className="text-indigo-500" />
                    تعديل تسعيرة الفئات الحالية
                  </h3>
                  <button 
                    onClick={handleResetPrices}
                    className="text-[10px] text-red-500 font-extrabold active:scale-95 animate-pulse"
                  >
                    إعادة افتراضي
                  </button>
                </div>

                {/* Switch active tariff prices edit list */}
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setPricesEditType(CalculatorType.REGULAR)}
                    className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${pricesEditType === CalculatorType.REGULAR ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    دليل فئات عادية
                  </button>
                  <button
                    onClick={() => setPricesEditType(CalculatorType.PRO)}
                    className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${pricesEditType === CalculatorType.PRO ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    دليل فئات Pro
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  {prices[pricesEditType].map(p => (
                    <div key={p.id} className="flex flex-col gap-1 p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <label className="text-[10px] font-black text-slate-400 pr-1">{p.label}</label>
                      <input 
                        type="number"
                        value={p.price}
                        onChange={(e) => handlePriceChange(p.id, parseInt(e.target.value) || 0)}
                        className="bg-transparent text-slate-900 dark:text-white font-extrabold text-sm px-1.5 focus:outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchases Toggle Switch */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className={isPurchasesEnabled ? "text-emerald-500" : "text-slate-400"} size={20} />
                    <div className="text-right">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">قسم المشتريات والوكلاء</h3>
                      <p className="text-xs text-slate-400 mt-0.5">تشغيل أو إيقاف قسم المشتريات بالكامل دون أي ارتباط خارجي</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const nextState = !isPurchasesEnabled;
                      setIsPurchasesEnabled(nextState);
                      localStorage.setItem('is_purchases_enabled', String(nextState));
                      if (!nextState && activeTab === 'purchases') {
                        setActiveTab('regular');
                      }
                      showToast(nextState ? 'تم تشغيل قسم المشتريات 🛒' : 'تم إيقاف قسم المشتريات 📴', 'info');
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center cursor-pointer ${isPurchasesEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white mx-0.5 shadow-sm" />
                  </button>
                </div>
              </div>

              {/* 4. Flush and wipe database - Reset Accounts */}
              <div className="p-4 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <h3 className="font-extrabold text-red-600 dark:text-red-400 text-sm">تصفير الحسابات والفواتير</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">مسح جميع الفواتير والسندات وتصفير الديون نهائياً (يتطلب رمز الحماية montaseer)</p>
                  </div>
                  <button 
                    onClick={clearHistory}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md shadow-red-600/10 cursor-pointer shrink-0"
                  >
                    تصفير الحسابات 🧹
                  </button>
                </div>
              </div>

              {/* About Section (حول) - placed at the end of the settings page, below Format and Clear Data */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-6 mt-4">
                <AboutPage networkName={networkName} />
              </div>
            </motion.div>
          ) : activeTab === 'shops' ? (
            <motion.div
              key="shops"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ShopsPage 
                shops={shops}
                setShops={setShops}
                zones={zones}
                setZones={setZones}
                showToast={showToast}
                salesHistory={salesHistory}
                setSalesHistory={setSalesHistory}
                balanceLimit={balanceLimit}
                handleLimitChange={handleLimitChange}
                selectedShopId={selectedShopId}
                setSelectedShopId={setSelectedShopId}
                onOpenContactPicker={(onPick) => {
                  setOnContactPicked(() => onPick);
                  setShowContactPicker(true);
                }}
                lastSaleSummary={lastSaleSummary}
                setLastSaleSummary={setLastSaleSummary}
                setShowSuccessModal={setShowSuccessModal}
                isThermalMode={isThermalMode}
                setIsThermalMode={setIsThermalMode}
                prices={prices}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          ) : activeTab === 'followup' ? (
            <motion.div
              key="followup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FollowupPage 
                shops={shops}
                zones={zones}
                salesHistory={salesHistory}
                networkName={networkName}
                onNavigateToShops={() => setActiveTab('shops')}
                setSelectedShopId={(id) => {
                  setSelectedShopId(id);
                  setActiveTab('shops');
                }}
                openAddInvoiceForShop={(id) => {
                  setSelectedShopId(id);
                  setActiveTab('shops');
                }}
                showToast={showToast}
              />
            </motion.div>
          ) : activeTab === 'purchases' ? (
            <motion.div
              key="purchases"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PurchasesPage 
                agents={agents}
                setAgents={setAgents}
                salesHistory={salesHistory}
                showToast={showToast}
              />
            </motion.div>
          ) : activeTab === 'reports' ? (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ReportsPage 
                salesHistory={salesHistory}
                shops={shops}
                zones={zones}
                reportDate={reportDate}
                setReportDate={setReportDate}
                isDark={isDark}
                balanceLimit={balanceLimit}
                handleLimitChange={handleLimitChange}
                showToast={showToast}
                prices={prices}
                agents={agents}
              />
            </motion.div>
          ) : activeTab === 'margin' ? (
            <motion.div
              key="margin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MarginPage 
                salesHistory={salesHistory}
                shops={shops}
                agents={agents}
                showToast={showToast}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'pro' ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'pro' ? 50 : -50 }}
              className="p-4"
            >
              {/* Pro Mode Special Warning & Notice Banner */}
              {activeTab === 'pro' && (
                <div className="mb-3.5 p-3 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-300/80 dark:border-red-900/60 flex items-center justify-between shadow-2xs animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-600 dark:bg-red-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Zap size={17} className="animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-red-950 dark:text-red-200 flex items-center gap-1.5">
                        <span>حاسبة فئة برو (Pro)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-red-600 text-white font-bold">فارق سعر</span>
                      </div>
                      <p className="text-[10.5px] font-bold text-red-700 dark:text-red-300 mt-0.5">
                        أنت الآن في فئة برو بأسعارها الخاصة وليست الحاسبة العادية ⚡
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-red-600 dark:text-red-300 bg-white/90 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-red-200 dark:border-red-900/60 shrink-0">
                    فئة PRO
                  </span>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex gap-2.5 mb-4">
                <button 
                  onClick={() => setShowReport(true)}
                  className={`flex-1 py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-center gap-2 text-slate-800 dark:text-slate-200 font-extrabold active:scale-95 transition-all shadow-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    activeTab === 'pro' ? 'border-red-200/80 dark:border-red-900/60' : 'border-slate-200/50 dark:border-slate-800'
                  }`}
                >
                  <History size={18} className={activeTab === 'pro' ? 'text-red-500' : 'text-blue-500'} />
                  <span>عرض التقرير المالي</span>
                </button>
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`p-3.5 rounded-2xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm ${
                    activeTab === 'pro' ? 'border-red-200/80 dark:border-red-900/60' : 'border-slate-200/50 dark:border-slate-800'
                  }`}
                  title="إعدادات التطبيق"
                >
                  <Settings2 size={20} className={activeTab === 'pro' ? 'text-red-500' : 'text-indigo-500'} />
                </button>
              </div>

              {/* Card List of prices categories */}
              <div className="space-y-4">
                {currentPrices.map(cat => (
                  <CardItem 
                    key={cat.id} 
                    category={cat} 
                    quantity={quantities[cat.id] || 0} 
                    updateQuantity={updateQuantity} 
                    isPro={activeTab === 'pro'}
                  />
                ))}
              </div>

              {/* Calculation Summary Card */}
              <div className={`mt-6 p-6 rounded-[2.5rem] text-white shadow-xl transition-all duration-300 ${
                activeTab === 'pro' 
                  ? 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700 shadow-red-500/30 ring-2 ring-red-400/50' 
                  : 'bg-blue-600 shadow-blue-500/20'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className={`text-md font-bold ${activeTab === 'pro' ? 'text-red-100' : 'text-blue-100'}`}>
                      المجموع الإجمالي
                    </span>
                    {activeTab === 'pro' && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                        فئة برو ⚡
                      </span>
                    )}
                  </div>
                  <span className="text-3xl font-black font-sans">{totalAmount} <span className="text-sm font-normal">ريال</span></span>
                </div>
                
                <div className="space-y-4">
                  {shops.length > 0 ? (
                    <div className="space-y-2 relative z-30">
                      {/* Invisible backdrop to close the dropdown */}
                      {isShopDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-40 bg-transparent" 
                          onClick={() => setIsShopDropdownOpen(false)} 
                        />
                      )}

                      <div className="relative animate-fade-in z-50">
                        <span className="absolute right-4 top-2 text-[10px] text-blue-200 font-extrabold block pointer-events-none select-none">تقييد الفاتورة لحساب بقالة مسجلة</span>
                        
                        {/* Autocomplete Text Input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={shopName}
                            onChange={(e) => {
                              setShopName(e.target.value);
                              setIsShopDropdownOpen(true);
                            }}
                            onFocus={() => setIsShopDropdownOpen(true)}
                            placeholder="👤 اكتب اسم البقالة للبحث والتقييد..."
                            className="w-full pt-6 pb-2 pr-4 pl-12 bg-white/10 border border-white/20 rounded-2xl outline-none hover:bg-white/15 focus:bg-white/15 focus:border-white/40 transition-all font-bold text-sm text-right text-white placeholder-slate-400/80 cursor-text"
                            style={{ direction: 'rtl' }}
                          />
                          
                          {/* Left Action Buttons inside input */}
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10" style={{ top: '60%' }}>
                            {shopName && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShopName('');
                                  localStorage.removeItem('last_shop_name');
                                  setIsShopDropdownOpen(false);
                                }}
                                className="p-1 hover:bg-white/10 rounded-full text-blue-200 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                                title="تصفية التحديد"
                              >
                                <X size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsShopDropdownOpen(!isShopDropdownOpen);
                              }}
                              className="p-1 hover:bg-white/10 rounded-full text-blue-200 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                            >
                              <span className="text-xs select-none">▼</span>
                            </button>
                          </div>
                        </div>

                        {/* Suggestions List Panel */}
                        {isShopDropdownOpen && (
                          <div className="absolute right-0 left-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-right text-slate-100 p-2 space-y-1 max-w-full animate-fade-in">
                            {/* Options Scroll Container */}
                            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 text-right">
                              {/* Option 1: Cash general customer */}
                              <div
                                onClick={() => {
                                  setShopName('');
                                  setIsShopDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${!shopName ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-200'}`}
                              >
                                <span className="text-xs truncate">👤 زبون نقدي عام (بدون تقييد حساب)</span>
                                <span className="text-sm select-none">👤</span>
                              </div>

                              {/* Filtered Shops suggestions */}
                              {(() => {
                                const filtered = shops.filter(s =>
                                  s.name.toLowerCase().includes(shopName.toLowerCase())
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-center py-4 text-[10px] text-slate-400 font-bold select-none">
                                      لا توجد بقالات تطابق الاسم المكتوب ⚠️
                                    </div>
                                  );
                                }

                                return filtered.map((s) => {
                                  const isSelected = s.name === shopName;
                                  const sEmoji = s.emoji || '🔴';
                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => {
                                        setShopName(s.name);
                                        localStorage.setItem('last_shop_name', s.name);
                                        setIsShopDropdownOpen(false);
                                      }}
                                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${isSelected ? 'bg-blue-600 text-white font-black' : 'hover:bg-slate-800 text-slate-200'}`}
                                    >
                                      <div className="flex flex-col text-right truncate">
                                        <span className="truncate">{s.name}</span>
                                        <span className={`text-[9px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400 font-sans'}`}>
                                          الرصيد المستحق: {s.currentBalance} ريال
                                        </span>
                                      </div>
                                      <span className="text-sm select-none">{sEmoji}</span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-blue-100/95 font-semibold text-right leading-relaxed px-1">
                        💡 لتسجيل الفاتورة بالآجل، يرجى كتابة اسم البقالة للبحث والوصول السريع، أو اختيارها من القائمة.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-white/10 border border-white/20 rounded-2xl text-right text-xs text-white leading-relaxed space-y-1 animate-fade-in">
                      <p className="font-extrabold flex items-center justify-end gap-1.5">
                        <span>لا توجد بقالات مسجلة بالنظام حالياً</span>
                        <span>⚠️</span>
                      </p>
                      <p className="text-blue-100 text-[10px] font-bold">
                        سيتم قيد المبيعات كـ (زبون نقدي عام) افتراضياً. لتقييد فواتير آجلة لعملاء مخصصين، يرجى فتح حساب بقالة أولاً من قسم <strong>"البقالات"</strong> بالأسفل.
                      </p>
                    </div>
                  )}

                  {/* Dynamic Date and Time is set automatically behind the scenes */}

                  <div className="relative">
                    <span className="absolute right-4 top-3 text-[10px] text-blue-200 font-black">المبلغ المقبوض للزبون</span>
                    <input 
                      type="number" 
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="رياض..."
                      className="w-full pt-7 pb-3 pr-4 pl-12 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-colors placeholder:text-blue-300 font-black text-lg font-sans text-right"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-200 mt-2">ريال</span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-white/10 rounded-2xl border border-white/5 text-right">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-100 font-bold">حالة الدفعة والبيان:</span>
                      <span className="font-black px-2.5 py-1 rounded-full bg-white/20 text-white">
                        {(() => {
                          const rec = Number(receivedAmount) || 0;
                          if (rec === 0) return 'بيع مقيد (دين كامل)';
                          if (rec < totalAmount) return 'بيع مقيد جزئي (باقي دين)';
                          if (rec === totalAmount) return 'مسدد بالكامل (خالص)';
                          return 'مسدد مع فائض (باقي للعميل)';
                        })()}
                      </span>
                    </div>
                    {/* 1. اجمالي الفاتورة */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                      <span className="text-blue-100 font-bold">اجمالي الفاتورة:</span>
                      <span className="font-extrabold font-sans text-white text-sm">{totalAmount} ريال</span>
                    </div>

                    {/* 2. الواصل من الفاتورة */}
                    <div className="flex justify-between items-center pt-1.5 text-xs">
                      <span className="text-blue-100 font-bold">الواصل من الفاتورة:</span>
                      <span className="font-extrabold font-sans text-emerald-400 text-sm">{(Number(receivedAmount) || 0)} ريال</span>
                    </div>

                    {/* 3. الباقي من الفاتورة */}
                    <div className="flex justify-between items-center pt-1.5 text-xs">
                      <span className="text-blue-100 font-bold">الباقي من الفاتورة:</span>
                      <span className="font-extrabold font-sans text-amber-300 text-sm">
                        {(() => {
                          const rec = Number(receivedAmount) || 0;
                          const netDue = totalAmount - rec;
                          return netDue >= 0 ? `${netDue} ريال` : `0 ريال (باقي له ${-netDue} ريال)`;
                        })()}
                      </span>
                    </div>

                    {/* 4. الرصيد السابق */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                      <span className="text-blue-100 font-bold">الرصيد السابق:</span>
                      <span className="font-extrabold font-sans text-amber-200 text-sm">{previousBalance} ريال</span>
                    </div>

                    {/* 5. الإجمالي الكلي عليكم */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm text-rose-300 font-extrabold">
                      <span>
                        {(() => {
                          const rec = Number(receivedAmount) || 0;
                          const netDue = totalAmount - rec;
                          const grandTotal = previousBalance + netDue;
                          if (grandTotal > 0) return 'الإجمالي الكلي عليكم:';
                          if (grandTotal < 0) return 'الإجمالي الكلي لكم (له):';
                          return 'الإجمالي الكلي (مسدد بالكامل):';
                        })()}
                      </span>
                      <span className="font-sans text-lg font-black">
                        {(() => {
                          const rec = Number(receivedAmount) || 0;
                          const netDue = totalAmount - rec;
                          const grandTotal = previousBalance + netDue;
                          return grandTotal === 0 ? 'خالص مسدد' : `${Math.abs(grandTotal)} ريال`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* خيار المشاركة التلقائية فور الاعتماد */}
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] text-white/90 font-bold px-1">
                      <span>المشاركة التلقائية فور الاعتماد:</span>
                      <span className="text-[10px] text-white/70">
                        {autoShareChannel === 'whatsapp' ? 'واتساب العادي 💬' :
                         autoShareChannel === 'sms' ? 'رسالة SMS 📱' : 'بدون مشاركة 🔕'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-black/25 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => handleSetAutoShareChannel('whatsapp')}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          autoShareChannel === 'whatsapp' 
                            ? 'bg-green-500 text-white shadow-sm' 
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <MessageCircle size={12} />
                        <span>واتس</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAutoShareChannel('sms')}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          autoShareChannel === 'sms' 
                            ? 'bg-blue-500 text-white shadow-sm' 
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <FileText size={12} />
                        <span>SMS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAutoShareChannel('none')}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          autoShareChannel === 'none' 
                            ? 'bg-white/30 text-white shadow-sm' 
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <span>إيقاف</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-3">
                    <button 
                      disabled={!isConfirmEnabled}
                      onClick={() => handleConfirm(false)}
                      className={`flex-1 py-4 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-all ${
                        isConfirmEnabled 
                        ? 'bg-white text-blue-600 shadow-lg shadow-white/10 active:scale-[0.98] cursor-pointer hover:bg-slate-100 font-sans' 
                        : 'bg-white/20 text-white/40 cursor-not-allowed'
                      }`}
                      title="تسجيل الفاتورة نقدية كاش معتمدة"
                    >
                      <CheckCircle2 size={18} />
                      <span>إدخال الفاتورة (نقداً)</span>
                    </button>

                    <button 
                      disabled={!isConfirmEnabled}
                      onClick={() => handleConfirm(true)}
                      className={`flex-1 py-4 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-all ${
                        isConfirmEnabled 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-[0.98] cursor-pointer font-sans' 
                        : 'bg-red-950/20 text-red-500/40 cursor-not-allowed'
                      }`}
                      title="إدخال الفاتورة آجل واعتمادها فوراً على حساب البقالة"
                    >
                      <Zap size={18} />
                      <span>إدخال الفاتورة (آجل)</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Success and Sharing Modal */}
      <AnimatePresence>
        {showSuccessModal && lastSaleSummary && (
          <div className="fixed inset-0 z-50 flex flex-col pt-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative mt-auto w-full bg-white dark:bg-slate-950 rounded-t-[3rem] p-6 max-h-[90vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5 cursor-pointer" onClick={() => setShowSuccessModal(false)}></div>
              
              <div className="flex flex-col items-center text-center space-y-2 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${
                  lastSaleSummary.paymentType === 'نقد'
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-500'
                }`}>
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {lastSaleSummary.paymentType === 'نقد'
                    ? 'تم اعتماد الفاتورة النقدية بنجاح! ⚡'
                    : lastSaleSummary.totalAmount === 0 
                    ? 'تم تسجيل السند المالي بنجاح!' 
                    : 'تم إدخال الفاتورة وحفظ الحساب!'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {lastSaleSummary.paymentType === 'نقد'
                    ? 'الفاتورة معتمدة نهائياً كاش. بإمكانك مشاركتها نصياً، واتساب، أو PDF'
                    : 'بإمكانك مشاركة الكشف أو تنزيله فوراً الآن'}
                </p>
              </div>

              {/* Virtual Receipt Preview Container */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-900 shadow-inner font-sans space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2.5">
                  <span className="font-extrabold text-blue-500">{networkName || 'شـبـكـة الـدحـشـة الـلاسـلـكـيـة'}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      lastSaleSummary.paymentType === 'نقد'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40'
                    }`}>
                      {lastSaleSummary.paymentType === 'نقد' ? '💵 فاتورة نقدية' : '📌 فاتورة آجل'}
                    </span>
                    <span className="font-bold">{lastSaleSummary.date}</span>
                  </div>
                </div>

                {lastSaleSummary.shopName && (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                    <span>العميل / البقالة:</span>
                    <div className="flex items-center gap-1.5">
                      {(lastSaleSummary.zoneName || (lastSaleSummary as any).shopZone) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 font-bold">
                          📍 {lastSaleSummary.zoneName || (lastSaleSummary as any).shopZone}
                        </span>
                      )}
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{lastSaleSummary.shopName}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 py-1.5">
                  {(lastSaleSummary.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-extrabold text-slate-900 dark:text-white">{item.quantity} أبو {item.category}</span>
                      <span className="font-black text-slate-800 dark:text-slate-300 font-sans">{item.total} ريال</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 font-sans">
                  {/* 1. اجمالي الفاتورة */}
                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-slate-900 dark:text-white">إجمالي الفاتورة:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-sans">{lastSaleSummary.totalAmount} ريال</span>
                  </div>
                  
                  {/* 2. الواصل من الفاتورة */}
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>الواصل من الفاتورة:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">{lastSaleSummary.receivedAmount} ريال</span>
                  </div>

                  {/* 3. الباقي من الفاتورة */}
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pb-1">
                    <span>الباقي من الفاتورة:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 font-sans">
                      {(() => {
                        const rem = lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount;
                        return rem >= 0 ? `${rem} ريال` : `0 ريال (باقي له ${-rem} ريال)`;
                      })()}
                    </span>
                  </div>

                  {/* 4. الرصيد السابق */}
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 pb-1">
                    <span>الرصيد السابق:</span>
                    <span className="font-sans font-bold">{lastSaleSummary.previousBalance ?? 0} ريال</span>
                  </div>

                  {/* 5. الإجمالي الكلي عليكم */}
                  {
                    <div className="flex justify-between items-center text-xs text-rose-500 dark:text-rose-400 font-black border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 pb-0.5">
                      <span>
                        {(() => {
                          const netDue = lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount;
                          const prev = lastSaleSummary.previousBalance ?? 0;
                          const combined = prev + netDue;
                          if (combined > 0) return 'الإجمالي الكلي عليكم:';
                          if (combined < 0) return 'الإجمالي الكلي لكم (له):';
                          return 'الإجمالي الكلي (مسدد بالكامل):';
                        })()}
                      </span>
                      <span className="font-sans text-sm font-black">
                        {(() => {
                          const netDue = lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount;
                          const prev = lastSaleSummary.previousBalance ?? 0;
                          const combined = prev + netDue;
                          return combined === 0 ? 'خالص مسدد' : `${Math.abs(combined)} ريال`;
                        })()}
                      </span>
                    </div>
                  }
                  <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-extrabold border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 pb-0">
                    [ لسنا الوحيدون ولكننا الافضل ]
                  </div>
                </div>
              </div>

              {/* Quick Thermal toggle switch inside receipt popup */}
              <div className="mt-3.5 flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/85">
                <div className="flex items-center gap-2">
                  <Printer size={18} className={isThermalMode ? "text-amber-500 animate-pulse" : "text-slate-400"} />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-300">نمط الفاتورة الحرارية (أبيض وأسود)</span>
                </div>
                <button
                  onClick={() => setIsThermalMode(!isThermalMode)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${isThermalMode ? 'bg-amber-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm inline-block" />
                </button>
              </div>

              {/* Sharing Layout Buttons - Text, WhatsApp, PDF, Print */}
              <div className="space-y-2 mt-5">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1">خيارات مشاركة وتصدير الفاتورة:</span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. WhatsApp Normal Text Share */}
                  <button 
                    onClick={() => {
                      const targetShop = shops.find(s => s.name.toLowerCase() === (lastSaleSummary.shopName || '').toLowerCase());
                      const destPhone = lastSaleSummary.phone || targetShop?.phone || '';
                      handleWhatsAppTextSingleShare({ ...lastSaleSummary, phone: destPhone });
                    }}
                    className="p-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm shadow-green-600/20"
                  >
                    <MessageCircle size={18} className="text-white" />
                    <span>مشاركة واتساب (نص) 💬</span>
                  </button>

                  {/* 2. WhatsApp Image Share */}
                  <button 
                    onClick={() => handleWhatsAppSingleShare(lastSaleSummary, isThermalMode)}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Share2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span>واتساب (صورة) 🖼️</span>
                  </button>

                  {/* 4. SMS Text Share */}
                  <button 
                    onClick={() => handleSMSSingleShare(lastSaleSummary)}
                    className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText size={18} className="text-blue-500" />
                    <span>رسالة SMS 📱</span>
                  </button>

                  {/* 5. Download PDF */}
                  <button 
                    onClick={() => {
                      downloadInvoicePDF(lastSaleSummary, isThermalMode);
                      showToast('تم تحميل كشف الـ PDF بنجاح 📁', 'success');
                    }}
                    className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    <Download size={18} className="text-amber-600 dark:text-amber-400" />
                    <span>تنزيل PDF 📄</span>
                  </button>

                  {/* 6. Copy Invoice Text */}
                  <button 
                    onClick={() => handleCopyInvoiceText(lastSaleSummary)}
                    className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    <Copy size={18} className="text-indigo-500" />
                    <span>نسخ النص 📋</span>
                  </button>

                  {/* 7. Thermal Direct Print */}
                  <button 
                    onClick={() => {
                      window.print();
                      showToast('جاري بدء الطباعة الحرارية المباشرة... 🖨️', 'success');
                    }}
                    className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm col-span-2 sm:col-span-1"
                  >
                    <Printer size={18} className="text-amber-400" />
                    <span>طباعة حرارية 🖨️</span>
                  </button>

                  {/* 8. سند واصل مستلم (إذا كان هناك واصل في الفاتورة) */}
                  {lastSaleSummary.receivedAmount > 0 && (
                    <button 
                      onClick={() => {
                        const targetShop = shops.find(s => s.name.toLowerCase() === (lastSaleSummary.shopName || '').toLowerCase());
                        const destPhone = lastSaleSummary.phone || targetShop?.phone || '';
                        const msg = buildPaymentReceiptWhatsAppText({
                          shopName: lastSaleSummary.shopName || 'العميل',
                          amount: lastSaleSummary.receivedAmount,
                          date: lastSaleSummary.date,
                          receiptId: lastSaleSummary.invoiceId || lastSaleSummary.id,
                          previousBalance: lastSaleSummary.previousBalance,
                          remainingBalance: (lastSaleSummary.previousBalance || 0) + (lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount),
                          notes: 'دفعة واصلة مقبوضة مع الفاتورة'
                        });
                        openWhatsAppDirect(destPhone, msg, 'whatsapp');
                        showToast('تم فتح واتساب لمشاركة سند الواصل 🧾', 'success');
                      }}
                      className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm shadow-teal-600/20 col-span-2 sm:col-span-1"
                    >
                      <CheckCircle2 size={18} className="text-white" />
                      <span>سند واصل (واتس) 🧾</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions based on Payment Type (Cash vs Credit) */}
              <div className="mt-6 space-y-3">
                {lastSaleSummary.paymentType === 'نقد' ? (
                  <>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-3 text-center text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>الفاتورة النقدية معتمدة فوراً بالكامل ولا يمكن التراجع عنها</span>
                    </div>
                    <button 
                      onClick={() => setShowSuccessModal(false)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl active:scale-95 transition-transform text-sm cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                    >
                      <span>+ فاتورة جديدة ومتابعة العمل</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={handleUndoInvoice}
                      className="py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black rounded-2xl border border-rose-200/60 dark:border-rose-900/40 active:scale-95 transition-transform text-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>↩️ تراجع وإلغاء الفاتورة</span>
                    </button>
                    <button 
                      onClick={() => setShowSuccessModal(false)}
                      className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl active:scale-95 transition-transform text-sm cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
                    >
                      <span>فاتورة جديدة ومتابعة العمل</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 p-4 rounded-3xl shadow-lg border flex items-center gap-3 font-bold transition-all text-xs ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white border-green-600 shadow-green-500/10' 
                : toast.type === 'error'
                ? 'bg-red-500 text-white border-red-600 shadow-red-500/10'
                : 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-600/10'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <Info size={16} className="shrink-0" />}
            <span className="flex-1 leading-normal">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-50 flex flex-col pt-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReport(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative mt-auto w-full bg-white dark:bg-slate-950 rounded-t-[3rem] p-6 max-h-[85vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowReport(false)}></div>
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <History size={26} className="text-blue-500" />
                  تقرير اليوم المالي
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      downloadDailyReportPDF(dailyReport, salesHistory, reportDate);
                      showToast('تم حفظ تقرير PDF المالي الشامل للتحميل! 📁', 'success');
                    }}
                    className="p-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-500 rounded-2xl active:scale-95 transition-all outline-none"
                    title="تنزيل تقرير PDF المالي الشامل لليوم"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => handleWhatsAppReportShare(dailyReport, salesHistory, reportDate)}
                    className="p-3.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-500 rounded-2xl active:scale-95 transition-all outline-none"
                    title="مشاركة تقرير المبيعات يومية ع الواتساب"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Date Selector */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-blue-500" />
                    <span>تاريخ عرض التقرير:</span>
                  </span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-sans">{reportDate}</span>
                </div>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-sans font-black outline-none focus:border-blue-500 transition-colors text-right"
                />
              </div>

              <div className="space-y-8">
                {/* Total Summary Header metrics card */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-xl shadow-blue-500/20">
                  <span className="text-blue-100 text-xs font-bold">إجمالي دخل ومعاملات اليوم</span>
                  <div className="text-5xl font-black mt-1 flex items-baseline gap-2 font-sans">
                    {dailyReport.totalAmount}
                    <span className="text-sm font-normal opacity-60 font-sans">ريال يمني</span>
                  </div>
                </div>

                {/* Bento Detailed Metrics requested by User */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-right">
                    <span className="text-[10px] font-bold text-slate-400 block">عدد الكروت المباعة</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white font-sans">{dailyReport.totalCardsQuantity} كرت</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-right">
                    <span className="text-[10px] font-bold text-slate-400 block">المبلغ المتسلم (كاش)</span>
                    <span className="text-xl font-black text-green-600 dark:text-green-400 font-sans">{dailyReport.totalReceivedAmount} <span className="text-[10px]">ريال</span></span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-right col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block">المديونية المرتفعة (الآجل الجديد)</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-sans">{dailyReport.totalDebtIncreased} <span className="text-[10px]">ريال يمني</span></span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-right col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">البقالات التي ابتاعت كروت</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {dailyReport.shopsWhoBought.length > 0 ? (
                        dailyReport.shopsWhoBought.map((shop, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                            {shop}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">لا يوجد مبيعات لبقالات مسجلة اليوم</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">توزيع مبيعات اليوم (بالكمية)</h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b" }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#020617' : '#ffffff', 
                            borderRadius: '16px', 
                            border: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                          }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="العادية" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="PRO" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {trends[trendView].length > 0 && (
                    <>
                      <div className="flex flex-col gap-4 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-500" />
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">حركة المبيعات الإجمالية</h3>
                          </div>
                          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                            <button 
                              onClick={() => setTrendView('weekly')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${trendView === 'weekly' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                              أسبوعي
                            </button>
                            <button 
                              onClick={() => setTrendView('monthly')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${trendView === 'monthly' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                              شهري
                            </button>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends[trendView]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDark ? '#020617' : '#ffffff', 
                                  borderRadius: '16px', 
                                  border: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                                  textAlign: 'right'
                                }}
                              />
                               <Line type="monotone" dataKey="إجمالي" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                               <Line type="monotone" dataKey="العادية" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                               <Line type="monotone" dataKey="Pro" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Section Details list */}
                {[
                  { type: CalculatorType.REGULAR, label: 'الكروت العادية', color: 'bg-green-500' },
                  { type: CalculatorType.PRO, label: 'كروت فئة Pro', color: 'bg-purple-500' }
                ].map(section => (
                  <div key={section.type} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-4.5 rounded-full ${section.color}`}></div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{section.label}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {prices[section.type].map(p => {
                        // @ts-ignore
                        const stats = dailyReport[section.type][p.id];
                        if (!stats || stats.quantity === 0) return null;
                        return (
                          <div key={p.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white">{p.label}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">باع {stats.quantity} كروت</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-sans">{stats.amount}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">ريال</span>
                            </div>
                          </div>
                        );
                      })}
                      {Object.values(dailyReport[section.type] as Record<number, { quantity: number; amount: number }>).every(v => v.quantity === 0) && (
                        <div className="text-center py-6 text-slate-400 text-xs font-bold leading-normal bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          لم يتم تسجيل بيع كروت من هذه الفئة اليوم
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* تفاصيل فواتير اليوم */}
                <div className="space-y-3.5 pt-4">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">تفاصيل فواتير اليوم وتتبع الديون</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {todayInvoices.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs font-bold leading-normal bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        لم يتم تسجيل أي فواتير بيع كروت اليوم
                      </div>
                    ) : (
                      todayInvoices.map((inv, idx) => (
                        <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-sans text-[10px] font-bold text-slate-400">{inv.invoiceId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${inv.paymentType === 'آجل' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'}`}>
                              {inv.paymentType === 'آجل' ? 'فاتورة آجل (دين)' : 'فاتورة نقدية (خالصة)'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{inv.shopName}</span>
                            <span className="font-black text-slate-950 dark:text-white font-sans text-md">{inv.totalInvoiceAmount} ريال</span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold">{inv.itemsSummary}</p>
                          
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-50 dark:border-slate-800 pt-2 font-sans text-slate-400">
                            <span>الواصل: <strong className="text-slate-700 dark:text-slate-300">{inv.receivedAmount} ريال</strong></span>
                            <span>المتبقي عليه: <strong className={inv.remainingAmount > 0 ? "text-red-500 font-extrabold" : "text-emerald-500 font-extrabold"}>{inv.remainingAmount} ريال</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowReport(false)}
                className="w-full mt-8 py-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black rounded-2xl active:scale-95 transition-transform cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                إغلاق التقرير اليومي
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContactPickerModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelect={(name, phone) => {
          if (onContactPicked) onContactPicked(name, phone);
        }}
        showToast={showToast}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-t border-slate-150 dark:border-slate-800 px-3 sm:px-6 py-1.5 flex items-center justify-around shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.12)] transition-colors h-14">
        {/* Right Button: Regular Calculator */}
        <div className="flex-1 flex justify-center">
          <NavButton 
            active={activeTab === 'regular'} 
            onClick={() => setActiveTab('regular')} 
            icon={<Calculator size={18} />} 
            label="العادية"
          />
        </div>

        {/* Pro Mode */}
        <div className="flex-1 flex justify-center">
          <NavButton 
            active={activeTab === 'pro'} 
            onClick={() => setActiveTab('pro')} 
            icon={<Zap size={18} />} 
            label="برو"
            activeColor="red"
          />
        </div>

        {/* Center Button: Shops (Beautiful Circular Button) */}
        <div className="relative -top-1.5 flex flex-col items-center">
          <button 
            onClick={() => setActiveTab('shops')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
              activeTab === 'shops'
                ? 'bg-blue-600 text-white shadow-blue-500/30 scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'
            }`}
          >
            <History size={18} />
          </button>
          <span className={`text-[9px] font-black mt-0.5 transition-all ${activeTab === 'shops' ? 'text-blue-500' : 'text-slate-400 dark:text-slate-550'}`}>البقالات</span>
        </div>

        {/* Side Menu Drawer Button */}
        <div className="flex-1 flex justify-center">
          <NavButton 
            active={isSideMenuOpen || ['reports', 'followup', 'purchases', 'margin', 'about'].includes(activeTab)} 
            onClick={() => setIsSideMenuOpen(true)} 
            icon={<Menu size={18} />} 
            label="الأقسام"
          />
        </div>
      </nav>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-800 shadow-2xl text-right z-10"
              style={{ direction: 'rtl' }}
            >
              <div className="flex items-center gap-3 justify-start border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
                  <LogOut size={16} />
                </div>
                <h3 className="text-md font-black text-slate-900 dark:text-white">تأكيد الخروج</h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-350 text-xs font-semibold leading-relaxed mb-6">
                هل أنت متأكد من رغبتك في إغلاق البرنامج والخروج؟ جميع الحسابات الحالية والمبيعات محفوظة تلقائياً في جهازك.
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setIsExited(true);
                    try {
                      window.close();
                    } catch (e) {
                      console.log('window.close is blocked');
                    }
                  }}
                  className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer active:scale-95"
                >
                  نعم، الخروج
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-colors cursor-pointer active:scale-95"
                >
                  إلغاء التراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Accounts Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowResetModal(false);
                setResetPasswordInput('');
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-right z-10"
              style={{ direction: 'rtl' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={24} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white text-base">تصفير الحسابات والسجلات</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  تنبيه: سيتم مسح جميع الفواتير والمبيعات والسندات وتصفير الديون نهائياً. أدخل رمز الحماية للمتابعة:
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 text-right">رمز الحماية:</label>
                <input 
                  type="password"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleResetAccounts();
                  }}
                  placeholder="أدخل رمز الحماية هنا..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none text-center focus:border-red-500 transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleResetAccounts}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  تأكيد التصفير 🧹
                </button>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPasswordInput('');
                  }}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* High-Precision POS Thermal Print Component */}
      {lastSaleSummary && (() => {
        const items = lastSaleSummary.items || [];
        const isPaymentOnly = lastSaleSummary.totalAmount === 0 || (items.length === 0 && lastSaleSummary.receivedAmount > 0);
        return (
          <div id="thermal-print-section" className="hidden print:block font-sans text-black bg-white w-full max-w-[80mm] mx-auto text-right text-xs leading-normal pb-4" style={{ direction: 'rtl' }}>
            {/* Header */}
            <div className="text-center font-bold pb-2 border-b border-dashed border-black mb-2">
              <h2 className="text-[13px] font-black tracking-wider m-0">{networkName}</h2>
              <p className="text-[9px] m-0 font-normal">للإنترنت والخدمات والاتصالات</p>
              {isPaymentOnly && (
                <div className="mt-1">
                  <span className="border border-black px-2 py-0.5 text-[9px] rounded font-black inline-block">سند قبض مالي وإشعار استلام نقدي</span>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-black mb-2">
              <div><span className="font-bold">اسم العميل:</span> {lastSaleSummary.shopName || 'بقالة عامة'}{(lastSaleSummary.zoneName || (lastSaleSummary as any).shopZone) ? ` [${lastSaleSummary.zoneName || (lastSaleSummary as any).shopZone}]` : ''}</div>
              <div><span className="font-bold">التاريخ:</span> {lastSaleSummary.date}</div>
              <div><span className="font-bold">الوقت:</span> {new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</div>
              {isPaymentOnly ? (
                <div><span className="font-bold">رقم العملية:</span> {lastSaleSummary.transactionId || 'TX-' + Math.floor(100000 + Math.random() * 900000)}</div>
              ) : (
                <div><span className="font-bold">الحساب:</span> {lastSaleSummary.type === CalculatorType.PRO ? 'فئة برو (PRO)' : 'فئة عادية'}</div>
              )}
            </div>
            
            {/* Table */}
            {isPaymentOnly ? (
              <div className="py-2.5 text-center text-[10.5px] font-black border-b border-dotted border-black/30 mb-2">
                سند قبض مالي وإشعار استلام نقدي
                <p className="mt-1">تم استلام مبلغ وقدره: <span className="font-sans font-black">{lastSaleSummary.receivedAmount} ريال يمني</span></p>
                <p className="text-[9px] font-normal text-slate-700 mt-1">مسددة كدفعة كاش لحساب العميل لشبكتنا الكبيرة</p>
              </div>
            ) : (
              <table className="w-full text-right text-[10px] border-collapse mb-2">
                <thead>
                  <tr className="border-b border-black">
                    <th className="pb-1 font-bold">الكرت والفئة</th>
                    <th className="pb-1 text-left font-bold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-dotted border-black/30">
                      <td className="py-1">
                        {item.quantity} أبو {item.category}
                      </td>
                      <td className="py-1 text-left font-sans">{item.total} ريال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Totals */}
            <div className="space-y-1 text-[10px] pt-1">
              {!isPaymentOnly ? (
                <>
                  <div className="flex justify-between">
                    <span>إجمالي الفاتورة:</span>
                    <span className="font-bold font-sans">{lastSaleSummary.totalAmount} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الواصل من الفاتورة:</span>
                    <span className="font-bold font-sans">{lastSaleSummary.receivedAmount} ريال</span>
                  </div>
                  
                  <div className="flex justify-between border-t border-dotted border-black pt-1">
                    <span>الباقي من الفاتورة:</span>
                    <span className="font-bold font-sans">
                      {(() => {
                        const rem = lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount;
                        return rem >= 0 ? `${rem} ريال` : `0 ريال (باقي له ${-rem} ريال)`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t border-dotted border-black pt-1">
                    <span>الرصيد السابق:</span>
                    <span className="font-bold font-sans">{lastSaleSummary.previousBalance ?? 0} ريال</span>
                  </div>
                  
                  <div className="flex justify-between font-extrabold text-[11px] border-t border-black pt-1">
                    <span>
                      {(() => {
                        const netDue = lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount;
                        const prev = lastSaleSummary.previousBalance ?? 0;
                        const combined = prev + netDue;
                        if (combined > 0) return 'الإجمالي الكلي عليكم:';
                        if (combined < 0) return 'الإجمالي الكلي لكم (له):';
                        return 'الإجمالي الكلي:';
                      })()}
                    </span>
                    <span className="font-sans">
                      {(() => {
                        const netDue = lastSaleSummary.totalAmount - lastSaleSummary.receivedAmount;
                        const prev = lastSaleSummary.previousBalance ?? 0;
                        const combined = prev + netDue;
                        return combined === 0 ? 'خالص مسدد بالكامل' : `${Math.abs(combined)} ريال`;
                      })()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>المبلغ المقبوض (الواصل الكاش):</span>
                    <span className="font-sans">{lastSaleSummary.receivedAmount} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الرصيد المستحق السابق:</span>
                    <span className="font-bold font-sans">{lastSaleSummary.previousBalance || 0} ريال</span>
                  </div>
                  <div className="flex justify-between border-t border-black pt-1 font-extrabold text-[11px]">
                    <span>صافي الحساب المتبقي الكلي المستمر:</span>
                    <span className="font-sans">{(lastSaleSummary.previousBalance || 0) - lastSaleSummary.receivedAmount} ريال</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-center text-[9px] font-bold border-t border-dashed border-black mt-4 pt-2">
              <p className="m-0">[ لسنا الوحيدون ولكننا الافضل ]</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  activeColor = 'blue' 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: ReactNode; 
  label: string; 
  activeColor?: 'blue' | 'red';
}) {
  const activeTextClass = activeColor === 'red' ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-blue-500';
  const activeBgClass = activeColor === 'red' ? 'bg-red-100/90 dark:bg-red-950/50 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20';
  const dotBgClass = activeColor === 'red' ? 'bg-red-600' : 'bg-blue-500';

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 transition-all duration-300 relative cursor-pointer ${active ? activeTextClass : 'text-slate-400 dark:text-slate-600'}`}
    >
      <div className={`p-1.5 rounded-xl transition-colors ${active ? activeBgClass : ''}`}>
        {icon}
      </div>
      <span className={`text-[9.5px] font-black ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-dot"
          className={`absolute -top-1 w-1 h-1 ${dotBgClass} rounded-full`}
        />
      )}
    </button>
  );
}
