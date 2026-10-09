import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Calendar,
  CalendarDays,
  Printer,
  Download,
  Share2,
  X,
  Layers,
  ListFilter,
  CheckCircle2,
  Coins,
  ChevronLeft,
  ArrowRightLeft,
  Clock,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { AgentAccount } from '../types';
import {
  StatementType,
  aggregateDetailedAgentStatement,
  aggregateSummaryAgentStatement,
  downloadAgentStatementPDF,
  printAgentStatement,
  downloadAgentStatementExcel,
  shareAgentStatementWhatsApp
} from '../utils/agentStatementHelpers';

interface AgentStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentAccount | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgentStatementModal: React.FC<AgentStatementModalProps> = ({
  isOpen,
  onClose,
  agent,
  showToast
}) => {
  if (!isOpen || !agent) return null;

  // Time filter quick selection helper
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Quick week calculation: start of week (Saturday) to end of week (Friday)
  const currentWeekRange = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sun, 6 is Sat
    const diffToSat = (day + 1) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToSat);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, []);

  // Quick month calculation: 1st of month to end of month
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return { start, end };
  }, []);

  // Earliest date from agent transactions for "All time"
  const allTimeStart = useMemo(() => {
    if (!agent.transactions || agent.transactions.length === 0) return today;
    const sorted = agent.transactions.map(t => t.date).sort();
    return sorted[0] || today;
  }, [agent, today]);

  // Selected Options
  const [statementType, setStatementType] = useState<StatementType>('summary');
  const [quickFilter, setQuickFilter] = useState<'thisWeek' | 'thisMonth' | 'allTime' | 'custom'>('thisMonth');
  const [startDate, setStartDate] = useState<string>(currentMonthRange.start);
  const [endDate, setEndDate] = useState<string>(currentMonthRange.end);

  // Handle quick filters
  const applyQuickFilter = (filter: 'thisWeek' | 'thisMonth' | 'allTime' | 'custom') => {
    setQuickFilter(filter);
    if (filter === 'thisWeek') {
      setStartDate(currentWeekRange.start);
      setEndDate(currentWeekRange.end);
    } else if (filter === 'thisMonth') {
      setStartDate(currentMonthRange.start);
      setEndDate(currentMonthRange.end);
    } else if (filter === 'allTime') {
      setStartDate(allTimeStart);
      setEndDate(today);
    }
  };

  // Live aggregated data based on selections
  const detailedData = useMemo(() => {
    return aggregateDetailedAgentStatement(agent, startDate, endDate);
  }, [agent, startDate, endDate]);

  const summaryData = useMemo(() => {
    return aggregateSummaryAgentStatement(agent, startDate, endDate);
  }, [agent, startDate, endDate]);

  // Handlers for Exports
  const handleDownloadPDF = () => {
    try {
      downloadAgentStatementPDF(agent, statementType, startDate, endDate);
      showToast('✅ تم تنزيل كشف الحساب كملف PDF رسمي بنجاح!', 'success');
    } catch (e) {
      console.error(e);
      showToast('⚠️ حدث خطأ أثناء تجهيز ملف PDF', 'error');
    }
  };

  const handlePrint = () => {
    try {
      printAgentStatement(agent, statementType, startDate, endDate);
    } catch (e) {
      console.error(e);
      showToast('⚠️ حدث خطأ أثناء إرسال أمر الطباعة', 'error');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadAgentStatementExcel(agent, statementType, startDate, endDate);
      showToast('📊 تم تنزيل كشف الحساب بصيغة Excel بنجاح!', 'success');
    } catch (e) {
      console.error(e);
      showToast('⚠️ حدث خطأ أثناء تصدير ملف الإكسل', 'error');
    }
  };

  const handleShareWhatsApp = () => {
    try {
      shareAgentStatementWhatsApp(agent, statementType, startDate, endDate);
    } catch (e) {
      console.error(e);
      showToast('⚠️ تعذر إرسال التقرير عبر واتساب', 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 z-10 max-h-[92vh] flex flex-col justify-between overflow-hidden"
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-150 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText size={22} />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    كشف حساب المشتريات والوكلاء
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    الوكيل المورد: <strong className="text-slate-900 dark:text-slate-200">{agent.name}</strong>
                    {agent.phone ? ` • هاتف: ${agent.phone}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body / Scrollable Content */}
          <div className="overflow-y-auto py-4 space-y-6 pr-1 pl-1">
            
            {/* SELECTION 1: STATEMENT TYPE (نوع كشف الحساب) */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers size={16} className="text-blue-500" />
                <span>اختر نوع كشف الحساب المطلوب:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Detailed Statement */}
                <div
                  onClick={() => setStatementType('detailed')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    statementType === 'detailed'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      <ListFilter size={17} className={statementType === 'detailed' ? 'text-blue-600' : 'text-slate-400'} />
                      كشف حساب تفصيلي (Option A)
                    </span>
                    {statementType === 'detailed' && (
                      <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    يعرض سجلاً زمنياً متسلسلاً لكافة الحركات مع اختصار الكروت بصيغة مدمجة (مثل: <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold text-[11px]">280 × 100</code>).
                  </p>
                </div>

                {/* Option B: Summary Statement */}
                <div
                  onClick={() => setStatementType('summary')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    statementType === 'summary'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      <Coins size={17} className={statementType === 'summary' ? 'text-emerald-600' : 'text-slate-400'} />
                      كشف حساب إجمالي (Option B)
                    </span>
                    {statementType === 'summary' && (
                      <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    يجمع كافة مشتريات الكروت حسب الفئة في جدول موحد: [الكمية الإجمالية | فئة الكرت | السعر الإجمالي] مع الإجماليات الثلاثة بالأسفل.
                  </p>
                </div>
              </div>
            </div>

            {/* SELECTION 2: TIME FILTER (الفترة الزمنية) */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarDays size={16} className="text-blue-500" />
                <span>الفترة الزمنية لكشف الحساب:</span>
              </label>

              {/* Quick Selectors */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyQuickFilter('thisWeek')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quickFilter === 'thisWeek'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  هذا الأسبوع
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('thisMonth')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quickFilter === 'thisMonth'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  هذا الشهر
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('allTime')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quickFilter === 'allTime'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  كافة الحركات المسجلة
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter('custom')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quickFilter === 'custom'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  تاريخ مخصص
                </button>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="block mb-1 font-bold text-slate-500">من تاريخ (Start Date):</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <span className="block mb-1 font-bold text-slate-500">إلى تاريخ (End Date):</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW & FINANCIAL AGGREGATION DISPLAY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>معاينة حية لبيانات كشف الحساب ({statementType === 'detailed' ? 'التفصيلي' : 'الإجمالي'}):</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  الفترة: {startDate} إلى {endDate}
                </span>
              </div>

              {/* Financial Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                    1. إجمالي المشتريات
                  </span>
                  <div className="text-base sm:text-lg font-black text-blue-900 dark:text-blue-100 mt-0.5">
                    {summaryData.totalPurchasesAmount.toLocaleString()} <span className="text-[10px] font-normal">ريال</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                    2. الواصل (المسدد)
                  </span>
                  <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
                    {summaryData.totalReceiptsAmount.toLocaleString()} <span className="text-[10px] font-normal">ريال</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                    3. رصيد الحساب الكلي
                  </span>
                  <div className="text-base sm:text-lg font-black text-purple-900 dark:text-purple-100 mt-0.5">
                    {summaryData.accountBalance.toLocaleString()} <span className="text-[10px] font-normal">ريال</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">
                    إجمالي الكروت المشترة
                  </span>
                  <div className="text-base sm:text-lg font-black text-rose-900 dark:text-rose-100 mt-0.5">
                    {summaryData.totalCardsCount.toLocaleString()} <span className="text-[10px] font-normal">كرت</span>
                  </div>
                </div>
              </div>

              {/* TABLE PREVIEW ACCORDING TO OPTION */}
              {statementType === 'detailed' ? (
                /* OPTION A PREVIEW: DETAILED ROWS */
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>جدول الحركات التفصيلي ({detailedData.rows.length} حركة)</span>
                    <span className="text-[11px] text-slate-400">صيغة الكروت مدمجة ومختصرة</span>
                  </div>

                  {detailedData.rows.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      لا توجد حركات مسجلة للوكيل في الفترة المحددة ({startDate} إلى {endDate})
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold sticky top-0">
                          <tr>
                            <th className="py-2 px-3">التاريخ</th>
                            <th className="py-2 px-3">نوع الحركة</th>
                            <th className="py-2 px-3">تفاصيل الكروت (مدمجة)</th>
                            <th className="py-2 px-3 text-center">المبلغ</th>
                            <th className="py-2 px-3 text-left">الرصيد التراكمي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {detailedData.rows.map(r => (
                            <tr key={r.index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.date}</td>
                              <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{r.typeLabel}</td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {r.compactDetails}
                              </td>
                              <td className="py-2 px-3 text-center font-black">
                                {r.amount.toLocaleString()} ريال
                              </td>
                              <td className="py-2 px-3 text-left font-bold text-rose-600">
                                {r.cumulativeBalance.toLocaleString()} ريال
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* OPTION B PREVIEW: SUMMARY CATEGORIES TABLE */
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>جدول إجمالي فئات الكروت المشترة للفترة</span>
                    <span className="text-[11px] text-slate-400">[الكمية الإجمالية | فئة الكرت | السعر الإجمالي]</span>
                  </div>

                  {summaryData.categoryRows.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      لا توجد فواتير كروت مشتراة في هذه الفترة ({startDate} إلى {endDate})
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-center text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black sticky top-0">
                          <tr>
                            <th className="py-2.5 px-4">الكمية الإجمالية</th>
                            <th className="py-2.5 px-4">فئة الكرت</th>
                            <th className="py-2.5 px-4">السعر الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                          {summaryData.categoryRows.map(c => (
                            <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                                {c.totalQuantity.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-blue-600 dark:text-blue-400 font-black text-sm">
                                {c.categoryLabel}
                              </td>
                              <td className="py-2.5 px-4 font-black text-slate-900 dark:text-slate-100 text-sm">
                                {c.totalPrice.toLocaleString()} ريال
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100/70 dark:bg-slate-800/80 font-black border-t border-slate-200 dark:border-slate-700">
                          <tr>
                            <td className="py-2.5 px-4 text-blue-600 dark:text-blue-400 text-sm">
                              {summaryData.totalCardsCount.toLocaleString()} كرت
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                              الإجمالي الكلي:
                            </td>
                            <td className="py-2.5 px-4 text-slate-900 dark:text-white text-sm">
                              {summaryData.totalPurchasesAmount.toLocaleString()} ريال
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Summary Section Footer Explanation */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-150 dark:border-slate-800 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>
                      1. الإجمالي: <strong className="text-blue-600">{summaryData.totalPurchasesAmount.toLocaleString()} ر.ي</strong>
                    </span>
                    <span>
                      2. الواصل: <strong className="text-emerald-600">{summaryData.totalReceiptsAmount.toLocaleString()} ر.ي</strong>
                    </span>
                    <span>
                      3. رصيد الحساب: <strong className="text-purple-600">{summaryData.accountBalance.toLocaleString()} ر.ي</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black transition-colors"
              >
                إلغاء
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-colors"
                title="طباعة كشف الحساب فوراً"
              >
                <Printer size={15} />
                <span>طباعة</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-sm"
                title="تصدير كشف الحساب كملف Excel"
              >
                <Download size={15} />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-black transition-colors shadow-sm"
                title="إرسال كشف الحساب عبر واتساب"
              >
                <Share2 size={15} />
                <span>واتساب</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                <Download size={16} />
                <span>توليد وتنزيل PDF A4</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
