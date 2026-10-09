import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { AgentAccount, AgentTransaction } from '../types';
import {
  getNetworkName,
  getDistributorName,
  getDistributorPhone,
  getInvoiceFooterNote,
  PDF_THEME,
  openWhatsAppDirect
} from './invoiceHelpers';

// Typography: Forced IBM Plex Sans Arabic and Cairo as strictly instructed
export const AGENT_STATEMENT_FONT_FAMILY = "'IBM Plex Sans Arabic', 'Cairo', 'Amiri', 'Noto Sans Arabic', Tahoma, sans-serif";

export type StatementType = 'detailed' | 'summary';

export interface DetailedTransactionRow {
  index: number;
  date: string;
  typeLabel: string;
  isPurchase: boolean;
  compactDetails: string;
  amount: number;
  cumulativeBalance: number;
  notes: string;
  invoiceNum?: string;
}

export interface DetailedStatementData {
  agent: AgentAccount;
  startDate: string;
  endDate: string;
  periodLabel: string;
  rows: DetailedTransactionRow[];
  totalPurchases: number;
  totalPayments: number;
  periodBalance: number;
  openingBalance: number;
  closingBalance: number;
  totalCardsCount: number;
}

export interface SummaryCategoryRow {
  category: number;
  categoryLabel: string; // e.g. "أبو 100"
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SummaryStatementData {
  agent: AgentAccount;
  startDate: string;
  endDate: string;
  periodLabel: string;
  categoryRows: SummaryCategoryRow[];
  totalCardsCount: number;
  totalPurchasesAmount: number; // الإجمالي: sum of all card purchases
  totalReceiptsAmount: number;  // الواصل: total payments
  accountBalance: number;       // رصيد الحساب الكلي: totalPurchasesAmount - totalReceiptsAmount
  openingBalance: number;
  closingBalance: number;
  totalInvoicesCount: number;
  totalPaymentsCount: number;
}

/**
 * Compact card details formatter
 * Strictly formats items as "280 × 100 | 560 × 200" to save space
 */
export const formatCompactCardDetails = (items?: { category: number; quantity: number }[]): string => {
  if (!items || items.length === 0) return '—';
  return items
    .filter(i => (i.quantity || 0) > 0)
    .map(i => `${i.quantity} × ${i.category}`)
    .join(' | ');
};

/**
 * Data Aggregation Logic for Option A: Detailed Statement (التفصيلي)
 */
export const aggregateDetailedAgentStatement = (
  agent: AgentAccount,
  startDate: string,
  endDate: string
): DetailedStatementData => {
  const allTxs = (agent.transactions || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  // Compute opening balance before startDate
  let runningBalance = 0;
  allTxs.forEach(tx => {
    if (tx.date < startDate) {
      if (tx.type === 'purchase') {
        runningBalance += tx.amount || 0;
      } else {
        runningBalance -= tx.amount || 0;
      }
    }
  });

  const openingBalance = runningBalance;
  let totalPurchases = 0;
  let totalPayments = 0;
  let totalCardsCount = 0;

  const filteredTxs = allTxs.filter(tx => tx.date >= startDate && tx.date <= endDate);

  const rows: DetailedTransactionRow[] = filteredTxs.map((tx, idx) => {
    const isPurchase = tx.type === 'purchase';
    if (isPurchase) {
      totalPurchases += tx.amount || 0;
      runningBalance += tx.amount || 0;
      if (tx.items) {
        tx.items.forEach(it => {
          totalCardsCount += it.quantity || 0;
        });
      }
    } else {
      totalPayments += tx.amount || 0;
      runningBalance -= tx.amount || 0;
    }

    const compactDetails = isPurchase
      ? formatCompactCardDetails(tx.items)
      : (tx.notes || 'سند سداد وصرف نقدي للوكيل');

    const typeLabel = isPurchase
      ? (tx.invoiceNum ? `فاتورة شراء #${tx.invoiceNum}` : 'فاتورة مشتريات')
      : 'سند سداد / واصل';

    return {
      index: idx + 1,
      date: tx.date,
      typeLabel,
      isPurchase,
      compactDetails,
      amount: tx.amount || 0,
      cumulativeBalance: runningBalance,
      notes: tx.notes || '',
      invoiceNum: tx.invoiceNum
    };
  });

  const closingBalance = runningBalance;
  const periodBalance = totalPurchases - totalPayments;

  const periodLabel = startDate === endDate
    ? `يوم ${startDate}`
    : `من ${startDate} إلى ${endDate}`;

  return {
    agent,
    startDate,
    endDate,
    periodLabel,
    rows,
    totalPurchases,
    totalPayments,
    periodBalance,
    openingBalance,
    closingBalance,
    totalCardsCount
  };
};

/**
 * Data Aggregation Logic for Option B: Summary Statement (الإجمالي)
 */
export const aggregateSummaryAgentStatement = (
  agent: AgentAccount,
  startDate: string,
  endDate: string
): SummaryStatementData => {
  const allTxs = (agent.transactions || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  allTxs.forEach(tx => {
    if (tx.date < startDate) {
      if (tx.type === 'purchase') {
        runningBalance += tx.amount || 0;
      } else {
        runningBalance -= tx.amount || 0;
      }
    }
  });

  const openingBalance = runningBalance;
  const filteredTxs = allTxs.filter(tx => tx.date >= startDate && tx.date <= endDate);

  // Group cards by category
  const categoryMap = new Map<number, { quantity: number; totalPrice: number }>();
  let totalPurchasesAmount = 0;
  let totalReceiptsAmount = 0;
  let totalInvoicesCount = 0;
  let totalPaymentsCount = 0;

  filteredTxs.forEach(tx => {
    if (tx.type === 'purchase') {
      totalInvoicesCount++;
      totalPurchasesAmount += tx.amount || 0;
      runningBalance += tx.amount || 0;

      if (tx.items && tx.items.length > 0) {
        tx.items.forEach(it => {
          const cat = it.category || 200;
          const qty = it.quantity || 0;
          const cost = it.total || (qty * (it.price || cat));

          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { quantity: 0, totalPrice: 0 });
          }
          const curr = categoryMap.get(cat)!;
          curr.quantity += qty;
          curr.totalPrice += cost;
        });
      }
    } else {
      totalPaymentsCount++;
      totalReceiptsAmount += tx.amount || 0;
      runningBalance -= tx.amount || 0;
    }
  });

  // Ensure common categories are represented or sorted
  const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) => a - b);
  let totalCardsCount = 0;

  const categoryRows: SummaryCategoryRow[] = sortedCategories.map(cat => {
    const data = categoryMap.get(cat)!;
    totalCardsCount += data.quantity;
    const unitPrice = data.quantity > 0 ? Math.round(data.totalPrice / data.quantity) : 0;
    return {
      category: cat,
      categoryLabel: `أبو ${cat}`,
      totalQuantity: data.quantity,
      unitPrice,
      totalPrice: data.totalPrice
    };
  });

  const periodLabel = startDate === endDate
    ? `يوم ${startDate}`
    : `من ${startDate} إلى ${endDate}`;

  const accountBalance = totalPurchasesAmount - totalReceiptsAmount;
  const closingBalance = runningBalance;

  return {
    agent,
    startDate,
    endDate,
    periodLabel,
    categoryRows,
    totalCardsCount,
    totalPurchasesAmount,
    totalReceiptsAmount,
    accountBalance,
    openingBalance,
    closingBalance,
    totalInvoicesCount,
    totalPaymentsCount
  };
};

/**
 * Creates true A4 Canvas (900 x 1273) with luxury double border layout
 */
const createA4Canvas = (canvasWidth = 900, canvasHeight = 1273) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Luxury outer double-frame with 40px margins
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);

    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
  }
  return { canvas, ctx, canvasWidth, canvasHeight };
};

/**
 * Draws standard page header matching Grocery Account Statements
 */
const drawHeader = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  title: string,
  agentName: string,
  periodLabel: string,
  pageNum: number,
  totalPages: number
) => {
  // Header Banner Highlight with Top Navy Accent Bar
  ctx.fillStyle = PDF_THEME.headerBg;
  ctx.fillRect(45, 45, canvasWidth - 90, 95);
  ctx.fillStyle = PDF_THEME.headerAccent;
  ctx.fillRect(45, 45, canvasWidth - 90, 4);

  // Network Name
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 24px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(getNetworkName(), canvasWidth / 2, 75);

  // Document Title
  ctx.font = `bold 20px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.fillText(title, canvasWidth / 2, 106);

  // Metadata Subtitle
  ctx.font = `17px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  ctx.fillText(
    `الوكيل: ${agentName}  |  الفترة: ${periodLabel}  |  صفحة ${pageNum} من ${totalPages}`,
    canvasWidth / 2,
    136
  );

  // Divider
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 150);
  ctx.lineTo(canvasWidth - 50, 150);
  ctx.stroke();
};

/**
 * Draws page footer with signatures matching the Grocery Account Statements
 */
const drawFooter = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
  const signY = canvasHeight - 145;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 18px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`توقيع وختم الوكيل المعتمد / الموزع:`, canvasWidth - 70, signY);
  ctx.textAlign = 'left';
  ctx.fillText('توقيع وختم الشركة الموردة / الوكيل:', 70, signY);

  // Signature lines
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvasWidth - 70, signY + 28);
  ctx.lineTo(canvasWidth - 340, signY + 28);
  ctx.moveTo(70, signY + 28);
  ctx.lineTo(340, signY + 28);
  ctx.stroke();

  // Branding Contact footnote
  ctx.font = `16px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(
    `${getNetworkName()} • نظام مخزني المتكامل للمشتريات والوكلاء • هاتف: ${getDistributorPhone() || '—'}`,
    canvasWidth / 2,
    canvasHeight - 65
  );

  if (getInvoiceFooterNote()) {
    ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, canvasHeight - 42);
  }
};

/**
 * Generates true A4 PDF for Option A: Detailed Statement (التفصيلي)
 */
export const drawDetailedStatementCanvasPages = (data: DetailedStatementData): HTMLCanvasElement[] => {
  const { canvasWidth, canvasHeight } = createA4Canvas();
  const rowsPerPage = 14;
  const totalPages = Math.max(1, Math.ceil(data.rows.length / rowsPerPage));
  const pages: HTMLCanvasElement[] = [];

  const tableX = 50;
  const tableW = canvasWidth - 100; // 800

  // Column definitions matching specification:
  // [م] | [تاريخ الفاتورة / الحركة] | [نوع الحركة] | [تفاصيل الكروت المدمجة Compact] | [المبلغ الإجمالي] | [الرصيد التراكمي]
  const cols = [
    { name: 'م', width: 45, align: 'center' },
    { name: 'التاريخ', width: 125, align: 'center' },
    { name: 'نوع الحركة', width: 135, align: 'center' },
    { name: 'تفاصيل الكروت (مدمجة)', width: 235, align: 'right' },
    { name: 'المبلغ (ريال)', width: 130, align: 'center' },
    { name: 'الرصيد المستحق', width: 130, align: 'center' }
  ];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createA4Canvas();
    if (!ctx) continue;

    drawHeader(
      ctx,
      canvasWidth,
      'كشف حساب المشتريات والوكلاء (تفصيلي)',
      data.agent.name,
      data.periodLabel,
      p + 1,
      totalPages
    );

    let currentY = 165;

    // Agent Info & Account Balance Quick Card (on first page)
    if (p === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(tableX, currentY, tableW, 60);
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, currentY, tableW, 60);

      // Metadata items
      ctx.fillStyle = PDF_THEME.textPrimary;
      ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText(`الوكيل المورد: ${data.agent.name}`, tableX + tableW - 20, currentY + 22);
      ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.fillText(`رقم الهاتف: ${data.agent.phone || 'غير مسجل'}`, tableX + tableW - 20, currentY + 45);

      // Summary mini cards
      ctx.textAlign = 'center';
      ctx.font = `14px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = PDF_THEME.textMuted;
      ctx.fillText('مشتريات الفترة', tableX + 340, currentY + 20);
      ctx.fillText('مسدد الفترة (واصل)', tableX + 200, currentY + 20);
      ctx.fillText('صافي رصيد الوكيل', tableX + 65, currentY + 20);

      ctx.font = `bold 17px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = '#2563eb';
      ctx.fillText(`${data.totalPurchases.toLocaleString()} ريال`, tableX + 340, currentY + 43);

      ctx.fillStyle = '#16a34a';
      ctx.fillText(`${data.totalPayments.toLocaleString()} ريال`, tableX + 200, currentY + 43);

      ctx.fillStyle = data.closingBalance > 0 ? '#dc2626' : '#16a34a';
      ctx.fillText(`${data.closingBalance.toLocaleString()} ريال`, tableX + 65, currentY + 43);

      currentY += 75;
    }

    // Table Header
    const rowH = 40;
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, currentY, tableW, rowH);

    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 17px ${AGENT_STATEMENT_FONT_FAMILY}`;

    let colX = tableX + tableW;
    cols.forEach(col => {
      colX -= col.width;
      let textX = colX + col.width / 2;
      if (col.align === 'right') textX = colX + col.width - 15;
      if (col.align === 'left') textX = colX + 15;
      ctx.textAlign = col.align as CanvasTextAlign;
      ctx.fillText(col.name, textX, currentY + rowH / 2);
    });

    currentY += rowH;

    // Table Rows
    const pageRows = data.rows.slice(p * rowsPerPage, (p + 1) * rowsPerPage);

    pageRows.forEach((r, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
      ctx.fillRect(tableX, currentY, tableW, rowH);

      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.6;
      ctx.strokeRect(tableX, currentY, tableW, rowH);

      let cellX = tableX + tableW;
      cols.forEach((col, cIdx) => {
        cellX -= col.width;
        let tX = cellX + col.width / 2;
        if (col.align === 'right') tX = cellX + col.width - 12;
        if (col.align === 'left') tX = cellX + 12;
        ctx.textAlign = col.align as CanvasTextAlign;

        if (cIdx === 0) {
          ctx.fillStyle = PDF_THEME.textMuted;
          ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
          ctx.fillText(String(r.index), tX, currentY + rowH / 2);
        } else if (cIdx === 1) {
          ctx.fillStyle = PDF_THEME.textPrimary;
          ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
          ctx.fillText(r.date, tX, currentY + rowH / 2);
        } else if (cIdx === 2) {
          ctx.font = `bold 15px ${AGENT_STATEMENT_FONT_FAMILY}`;
          ctx.fillStyle = r.isPurchase ? '#1e3a8a' : '#059669';
          ctx.fillText(r.typeLabel, tX, currentY + rowH / 2);
        } else if (cIdx === 3) {
          // Strictly compact card format (e.g. 280 × 100)
          ctx.font = `bold 15px ${AGENT_STATEMENT_FONT_FAMILY}`;
          ctx.fillStyle = r.isPurchase ? '#0f172a' : '#059669';
          ctx.fillText(r.compactDetails, tX, currentY + rowH / 2);
        } else if (cIdx === 4) {
          ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
          ctx.fillStyle = r.isPurchase ? '#1e3a8a' : '#059669';
          const prefix = r.isPurchase ? '+' : '-';
          ctx.fillText(`${prefix}${r.amount.toLocaleString()} ريال`, tX, currentY + rowH / 2);
        } else if (cIdx === 5) {
          ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
          ctx.fillStyle = r.cumulativeBalance > 0 ? '#b91c1c' : '#059669';
          ctx.fillText(`${r.cumulativeBalance.toLocaleString()} ريال`, tX, currentY + rowH / 2);
        }
      });

      currentY += rowH;
    });

    // Final Grand Summary Box on the last page
    if (p === totalPages - 1) {
      currentY += 15;
      const sumH = 85;
      ctx.fillStyle = PDF_THEME.totalHighlightBg;
      ctx.fillRect(tableX, currentY, tableW, sumH);
      ctx.strokeStyle = PDF_THEME.totalBorder;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(tableX, currentY, tableW, sumH);

      const boxW = tableW / 4;

      // 1. Total Purchases
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('1. إجمالي المشتريات', tableX + boxW * 3 + boxW / 2, currentY + 28);
      ctx.font = `bold 20px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText(`${data.totalPurchases.toLocaleString()} ريال`, tableX + boxW * 3 + boxW / 2, currentY + 58);

      // 2. Total Receipts (الواصل)
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillText('2. إجمالي الواصل (المسدد)', tableX + boxW * 2 + boxW / 2, currentY + 28);
      ctx.font = `bold 20px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = '#059669';
      ctx.fillText(`${data.totalPayments.toLocaleString()} ريال`, tableX + boxW * 2 + boxW / 2, currentY + 58);

      // 3. Period Difference
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillText('3. صافي حركة الفترة', tableX + boxW + boxW / 2, currentY + 28);
      ctx.font = `bold 20px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = data.periodBalance >= 0 ? '#b91c1c' : '#059669';
      ctx.fillText(`${data.periodBalance.toLocaleString()} ريال`, tableX + boxW + boxW / 2, currentY + 58);

      // 4. Final Cumulative Balance (رصيد الحساب الكلي المستحق)
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillText('4. رصيد الحساب الكلي المتبقي', tableX + boxW / 2, currentY + 28);
      ctx.font = `bold 22px ${AGENT_STATEMENT_FONT_FAMILY}`;
      ctx.fillStyle = data.closingBalance > 0 ? '#b91c1c' : '#059669';
      ctx.fillText(`${data.closingBalance.toLocaleString()} ريال`, tableX + boxW / 2, currentY + 58);
    }

    drawFooter(ctx, canvasWidth, canvasHeight);
    pages.push(canvas);
  }

  return pages;
};

/**
 * Generates true A4 PDF for Option B: Summary Statement (الإجمالي)
 * Exactly implements the layout:
 * [الكمية الإجمالية] | [فئة الكرت] | [السعر الإجمالي]
 * 1120 | أبو 100 | 95200
 * 1120 | أبو 200 | 190400
 * 880  | أبو 250 | 184800
 * 560  | أبو 300 | 145600
 * 280  | أبو 500 | 117600
 * Bottom Section:
 * 1. الإجمالي (Sum of all card purchases)
 * 2. الواصل (Total receipts / payments)
 * 3. رصيد الحساب الكلي (Total Purchases - Total Receipts)
 */
export const drawSummaryStatementCanvasPages = (data: SummaryStatementData): HTMLCanvasElement[] => {
  const { canvas, ctx, canvasWidth, canvasHeight } = createA4Canvas();
  if (!ctx) return [];

  drawHeader(
    ctx,
    canvasWidth,
    'كشف حساب المشتريات والوكلاء (إجمالي الفئات)',
    data.agent.name,
    data.periodLabel,
    1,
    1
  );

  const tableX = 50;
  const tableW = canvasWidth - 100; // 800
  let currentY = 165;

  // Agent Info & Overview Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tableX, currentY, tableW, 65);
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, currentY, tableW, 65);

  ctx.fillStyle = PDF_THEME.textPrimary;
  ctx.font = `bold 17px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`الوكيل المورد: ${data.agent.name}`, tableX + tableW - 20, currentY + 24);
  ctx.font = `15px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.fillText(
    `رقم الهاتف: ${data.agent.phone || 'غير مسجل'}  •  الفترة الزمنية: ${data.periodLabel}`,
    tableX + tableW - 20,
    currentY + 48
  );

  ctx.textAlign = 'left';
  ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.headerAccent;
  ctx.fillText(`عدد فواتير الشراء: ${data.totalInvoicesCount}  |  عدد السندات: ${data.totalPaymentsCount}`, tableX + 20, currentY + 36);

  currentY += 80;

  // Table Specification strictly required:
  // [الكمية الإجمالية] | [فئة الكرت] | [السعر الإجمالي]
  const cols = [
    { name: 'م', width: 60, align: 'center' },
    { name: 'الكمية الإجمالية (عدد الكروت)', width: 260, align: 'center' },
    { name: 'فئة الكرت', width: 220, align: 'center' },
    { name: 'السعر الإجمالي (ريال)', width: 260, align: 'center' }
  ];

  const rowH = 46;

  // Table Header
  ctx.fillStyle = PDF_THEME.tableHeaderBg;
  ctx.fillRect(tableX, currentY, tableW, rowH);

  ctx.fillStyle = PDF_THEME.tableHeaderColor;
  ctx.font = `bold 18px ${AGENT_STATEMENT_FONT_FAMILY}`;

  let colX = tableX + tableW;
  cols.forEach(col => {
    colX -= col.width;
    ctx.textAlign = col.align as CanvasTextAlign;
    ctx.fillText(col.name, colX + col.width / 2, currentY + rowH / 2);
  });

  currentY += rowH;

  // Table Rows (Categories breakdown)
  data.categoryRows.forEach((row, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
    ctx.fillRect(tableX, currentY, tableW, rowH);

    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(tableX, currentY, tableW, rowH);

    let cellX = tableX + tableW;
    cols.forEach((col, cIdx) => {
      cellX -= col.width;
      ctx.textAlign = col.align as CanvasTextAlign;
      const tX = cellX + col.width / 2;

      if (cIdx === 0) {
        ctx.fillStyle = PDF_THEME.textMuted;
        ctx.font = `16px ${AGENT_STATEMENT_FONT_FAMILY}`;
        ctx.fillText(String(idx + 1), tX, currentY + rowH / 2);
      } else if (cIdx === 1) {
        // [الكمية الإجمالية]
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `bold 20px ${AGENT_STATEMENT_FONT_FAMILY}`;
        ctx.fillText(`${row.totalQuantity.toLocaleString()} كرت`, tX, currentY + rowH / 2);
      } else if (cIdx === 2) {
        // [فئة الكرت] e.g. "أبو 100"
        ctx.fillStyle = '#1e3a8a';
        ctx.font = `bold 21px ${AGENT_STATEMENT_FONT_FAMILY}`;
        ctx.fillText(row.categoryLabel, tX, currentY + rowH / 2);
      } else if (cIdx === 3) {
        // [السعر الإجمالي]
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold 21px ${AGENT_STATEMENT_FONT_FAMILY}`;
        ctx.fillText(`${row.totalPrice.toLocaleString()} ريال`, tX, currentY + rowH / 2);
      }
    });

    currentY += rowH;
  });

  // Table Total Row
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(tableX, currentY, tableW, rowH);
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, currentY, tableW, rowH);

  ctx.textAlign = 'center';
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 19px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillText('المجموع الإجمالي للكروت:', tableX + tableW - 160, currentY + rowH / 2);

  ctx.font = `bold 22px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(`${data.totalCardsCount.toLocaleString()} كرت`, tableX + 390, currentY + rowH / 2);

  ctx.fillText(`${data.totalPurchasesAmount.toLocaleString()} ريال`, tableX + 130, currentY + rowH / 2);

  currentY += rowH + 25;

  // -------------------------------------------------------------
  // Financial Summaries (Bottom Section) as strictly required:
  // 1. الإجمالي: The sum of all card purchases during the period (e.g., 733600).
  // 2. الواصل: Total receipts (sum of cash invoices + separate financial receipt vouchers) during the period.
  // 3. رصيد الحساب الكلي: The final balance (Total Purchases - Total Receipts) for the selected period.
  // -------------------------------------------------------------

  const cardW = tableW;
  const cardH = 150;

  ctx.fillStyle = PDF_THEME.totalHighlightBg;
  ctx.fillRect(tableX, currentY, cardW, cardH);
  ctx.strokeStyle = PDF_THEME.totalBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tableX, currentY, cardW, cardH);

  // Section Header inside card
  ctx.fillStyle = PDF_THEME.headerBg;
  ctx.fillRect(tableX, currentY, cardW, 36);
  ctx.fillStyle = PDF_THEME.headerAccent;
  ctx.fillRect(tableX, currentY, cardW, 3);

  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 17px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('الملخص المالي ومطابقة الحساب النهائي للفترة المحددة', tableX + cardW / 2, currentY + 19);

  const colWidth3 = cardW / 3;
  const metricsY = currentY + 50;

  // 1. الإجمالي: The sum of all card purchases during the period
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('1. الإجمالي (مشتريات الكروت)', tableX + colWidth3 * 2 + colWidth3 / 2, metricsY + 16);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = `bold 25px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillText(
    `${data.totalPurchasesAmount.toLocaleString()} ريال`,
    tableX + colWidth3 * 2 + colWidth3 / 2,
    metricsY + 52
  );

  // 2. الواصل: Total receipts (sum of cash invoices + receipt vouchers)
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillText('2. الواصل (إجمالي المدفوعات المسددة)', tableX + colWidth3 + colWidth3 / 2, metricsY + 16);

  ctx.fillStyle = '#059669';
  ctx.font = `bold 25px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillText(
    `${data.totalReceiptsAmount.toLocaleString()} ريال`,
    tableX + colWidth3 + colWidth3 / 2,
    metricsY + 52
  );

  // 3. رصيد الحساب الكلي: The final balance (Total Purchases - Total Receipts)
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillText('3. رصيد الحساب الكلي للفترة', tableX + colWidth3 / 2, metricsY + 16);

  ctx.fillStyle = data.accountBalance >= 0 ? '#b91c1c' : '#059669';
  ctx.font = `bold 27px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillText(
    `${data.accountBalance.toLocaleString()} ريال`,
    tableX + colWidth3 / 2,
    metricsY + 52
  );

  // Additional note on cumulative ledger balance
  currentY += cardH + 15;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tableX, currentY, cardW, 40);
  ctx.strokeStyle = PDF_THEME.borderLight;
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, currentY, cardW, 40);

  ctx.fillStyle = PDF_THEME.textPrimary;
  ctx.font = `bold 16px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(
    `الرصيد التراكمي الإجمالي المستحق للوكيل حتى تاريخه:`,
    tableX + cardW - 20,
    currentY + 20
  );

  ctx.textAlign = 'left';
  ctx.font = `bold 20px ${AGENT_STATEMENT_FONT_FAMILY}`;
  ctx.fillStyle = data.closingBalance > 0 ? '#b91c1c' : '#059669';
  ctx.fillText(`${data.closingBalance.toLocaleString()} ريال`, tableX + 20, currentY + 20);

  drawFooter(ctx, canvasWidth, canvasHeight);

  return [canvas];
};

/**
 * Downloads the generated Agent Statement as a high-quality PDF
 */
export const downloadAgentStatementPDF = (
  agent: AgentAccount,
  statementType: StatementType,
  startDate: string,
  endDate: string
) => {
  let pages: HTMLCanvasElement[] = [];

  if (statementType === 'detailed') {
    const data = aggregateDetailedAgentStatement(agent, startDate, endDate);
    pages = drawDetailedStatementCanvasPages(data);
  } else {
    const data = aggregateSummaryAgentStatement(agent, startDate, endDate);
    pages = drawSummaryStatementCanvasPages(data);
  }

  if (pages.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pdfHeight = 297;

  pages.forEach((pageCanvas, i) => {
    if (i > 0) pdf.addPage();
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  });

  const typeSlug = statementType === 'detailed' ? 'تفصيلي' : 'إجمالي';
  const fileName = `كشف_حساب_مشتريات_${agent.name}_${typeSlug}_${startDate}_إلى_${endDate}.pdf`;
  pdf.save(fileName);
};

/**
 * Direct Print handler for Agent Statement (A4 formatted)
 */
export const printAgentStatement = (
  agent: AgentAccount,
  statementType: StatementType,
  startDate: string,
  endDate: string
) => {
  let pages: HTMLCanvasElement[] = [];

  if (statementType === 'detailed') {
    const data = aggregateDetailedAgentStatement(agent, startDate, endDate);
    pages = drawDetailedStatementCanvasPages(data);
  } else {
    const data = aggregateSummaryAgentStatement(agent, startDate, endDate);
    pages = drawSummaryStatementCanvasPages(data);
  }

  if (pages.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  let imagesHtml = '';
  pages.forEach((pageCanvas) => {
    const dataUrl = pageCanvas.toDataURL('image/png');
    imagesHtml += `
      <div class="page">
        <img src="${dataUrl}" style="width: 100%; height: auto; display: block;" />
      </div>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة كشف حساب المشتريات - ${agent.name}</title>
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; background: #fff; }
        .page { width: 100%; page-break-after: always; }
        .page:last-child { page-break-after: avoid; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${imagesHtml}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Downloads Excel spreadsheet for Agent Statement
 */
export const downloadAgentStatementExcel = async (
  agent: AgentAccount,
  statementType: StatementType,
  startDate: string,
  endDate: string
) => {
  const workbook = new ExcelJS.Workbook();
  const netName = getNetworkName();

  if (statementType === 'detailed') {
    const data = aggregateDetailedAgentStatement(agent, startDate, endDate);
    const worksheet = workbook.addWorksheet('كشف حساب تفصيلي', {
      views: [{ rightToLeft: true }]
    });

    // Branding Title
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = netName;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    worksheet.getRow(1).height = 36;

    // Subtitle
    worksheet.mergeCells('A2:F2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `كشف حساب مشتريات تفصيلي • الوكيل: ${agent.name} • ${data.periodLabel}`;
    subCell.font = { name: 'Arial', size: 12, bold: true };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    worksheet.addRow([]);

    // Header Table
    const headerRow = worksheet.addRow([
      'م',
      'التاريخ',
      'نوع الحركة',
      'تفاصيل الكروت (مدمجة)',
      'المبلغ (ريال)',
      'الرصيد التراكمي'
    ]);
    headerRow.height = 24;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    data.rows.forEach(r => {
      const row = worksheet.addRow([
        r.index,
        r.date,
        r.typeLabel,
        r.compactDetails,
        r.amount,
        r.cumulativeBalance
      ]);
      row.height = 22;
      row.eachCell((cell, colIdx) => {
        cell.alignment = { horizontal: colIdx === 4 ? 'right' : 'center', vertical: 'middle' };
        if (colIdx >= 5) cell.numFmt = '#,##0" ريال"';
      });
    });

    // Totals
    worksheet.addRow([]);
    const totPurchases = worksheet.addRow(['إجمالي المشتريات:', '', '', '', data.totalPurchases, '']);
    totPurchases.font = { bold: true };
    const totPayments = worksheet.addRow(['إجمالي الواصل المسدد:', '', '', '', data.totalPayments, '']);
    totPayments.font = { bold: true };
    const totClosing = worksheet.addRow(['الرصيد النهائي المستحق للوكيل:', '', '', '', data.closingBalance, '']);
    totClosing.font = { bold: true, size: 13 };
  } else {
    const data = aggregateSummaryAgentStatement(agent, startDate, endDate);
    const worksheet = workbook.addWorksheet('كشف حساب إجمالي', {
      views: [{ rightToLeft: true }]
    });

    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = netName;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    worksheet.getRow(1).height = 36;

    worksheet.mergeCells('A2:C2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `كشف حساب مشتريات إجمالي (تجميع فئات الكروت) • الوكيل: ${agent.name} • ${data.periodLabel}`;
    subCell.font = { name: 'Arial', size: 12, bold: true };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    worksheet.addRow([]);

    // Table specification: [الكمية الإجمالية] | [فئة الكرت] | [السعر الإجمالي]
    const headerRow = worksheet.addRow(['الكمية الإجمالية', 'فئة الكرت', 'السعر الإجمالي (ريال)']);
    headerRow.height = 26;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    data.categoryRows.forEach(r => {
      const row = worksheet.addRow([r.totalQuantity, r.categoryLabel, r.totalPrice]);
      row.height = 24;
      row.eachCell((cell, colIdx) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (colIdx === 3) cell.numFmt = '#,##0" ريال"';
      });
    });

    worksheet.addRow([]);
    worksheet.addRow(['1. إجمالي مشتريات الكروت:', '', data.totalPurchasesAmount]);
    worksheet.addRow(['2. إجمالي الواصل (المسدد):', '', data.totalReceiptsAmount]);
    worksheet.addRow(['3. رصيد الحساب الكلي للفترة:', '', data.accountBalance]);
    worksheet.addRow(['الرصيد التراكمي المتبقي للوكيل:', '', data.closingBalance]);
  }

  // Auto-fit
  workbook.worksheets.forEach(ws => {
    ws.columns.forEach(col => {
      col.width = 22;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `كشف_حساب_الوكيل_${agent.name}_${statementType === 'detailed' ? 'تفصيلي' : 'إجمالي'}_${startDate}_إلى_${endDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * WhatsApp share builder
 */
export const shareAgentStatementWhatsApp = (
  agent: AgentAccount,
  statementType: StatementType,
  startDate: string,
  endDate: string
) => {
  const netName = getNetworkName();
  let text = '';

  if (statementType === 'detailed') {
    const data = aggregateDetailedAgentStatement(agent, startDate, endDate);
    text = `📋 *كشف حساب مشتريات تفصيلي*\n` +
      `🌐 *${netName}*\n` +
      `👤 *الوكيل المورد:* ${agent.name}\n` +
      `📅 *الفترة:* ${data.periodLabel}\n\n` +
      `🛒 *إجمالي المشتريات:* ${data.totalPurchases.toLocaleString()} ريال\n` +
      `💵 *إجمالي الواصل المسدد:* ${data.totalPayments.toLocaleString()} ريال\n` +
      `⚖️ *صافي حركة الفترة:* ${data.periodBalance.toLocaleString()} ريال\n` +
      `🔴 *الرصيد الإجمالي المستحق له:* ${data.closingBalance.toLocaleString()} ريال\n\n` +
      `🎴 *إجمالي عدد الكروت المشترة:* ${data.totalCardsCount.toLocaleString()} كرت\n` +
      `🔢 *عدد العمليات المسجلة:* ${data.rows.length} عملية\n`;
  } else {
    const data = aggregateSummaryAgentStatement(agent, startDate, endDate);
    text = `📊 *كشف حساب مشتريات إجمالي (تجميع الفئات)*\n` +
      `🌐 *${netName}*\n` +
      `👤 *الوكيل المورد:* ${agent.name}\n` +
      `📅 *الفترة:* ${data.periodLabel}\n\n` +
      `🎴 *تفصيل كميات الكروت:*\n`;

    data.categoryRows.forEach(c => {
      text += `▪️ ${c.categoryLabel}: ${c.totalQuantity.toLocaleString()} كرت = ${c.totalPrice.toLocaleString()} ريال\n`;
    });

    text += `\n` +
      `1️⃣ *إجمالي المشتريات:* ${data.totalPurchasesAmount.toLocaleString()} ريال (${data.totalCardsCount.toLocaleString()} كرت)\n` +
      `2️⃣ *إجمالي الواصل المسدد:* ${data.totalReceiptsAmount.toLocaleString()} ريال\n` +
      `3️⃣ *رصيد الحساب الكلي للفترة:* ${data.accountBalance.toLocaleString()} ريال\n` +
      `🔴 *الرصيد التراكمي الإجمالي:* ${data.closingBalance.toLocaleString()} ريال\n`;
  }

  openWhatsAppDirect(agent.phone || '', text);
};
