import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculatorType, SaleRecord } from '../types';
import { INITIAL_PRICES } from '../constants';
import { saveFileToKrotFolder } from './filesystemHelpers';
import { LocalContacts } from './localContactsPlugin';

let cachedCustomLogo: HTMLImageElement | null = null;

export const getCustomLogoImage = (): HTMLImageElement | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('custom_pdf_logo');
  if (!stored) {
    cachedCustomLogo = null;
    return null;
  }
  if (cachedCustomLogo && cachedCustomLogo.src === stored) {
    return cachedCustomLogo;
  }
  const img = new Image();
  img.src = stored;
  cachedCustomLogo = img;
  return img;
};

export const getNetworkName = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('network_name') || 'شبكة الدحشة اللاسلكية';
  }
  return 'شبكة الدحشة اللاسلكية';
};

export const getDistributorName = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('distributor_name') || 'أحمد المنتصر';
  }
  return 'أحمد المنتصر';
};

export const getDistributorPhone = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('distributor_phone') || '773086403';
  }
  return '773086403';
};

export const getInvoiceFooterNote = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pdf_footer_note') || 'شعارنا: [ لسنا الوحيدون ولكننا الافضل ]';
  }
  return 'شعارنا: [ لسنا الوحيدون ولكننا الافضل ]';
};

// --- Sound Chime System (Web Audio API) ---
export const playSuccessSound = (isSoundEnabled: boolean) => {
  if (!isSoundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    
    const playBeep = (freq: number, duration: number, delayRef: number) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delayRef);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delayRef);
      gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + delayRef + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delayRef + duration);
      
      osc.start(audioCtx.currentTime + delayRef);
      osc.stop(audioCtx.currentTime + delayRef + duration);
    };
    
    // Satisfying cash register double chime:
    playBeep(587.33, 0.15, 0);       // D5
    playBeep(880.00, 0.22, 0.08);     // A5
  } catch (e) {
    console.warn("Audio Context feedback failed:", e);
  }
};

// --- Official Vector Logo drawing function ---
export const drawDahshahLogo = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  isThermal: boolean = false
) => {
  ctx.save();

  const customImg = getCustomLogoImage();
  if (customImg && customImg.complete && customImg.naturalWidth > 0) {
    ctx.drawImage(customImg, x, y, width, height);
    ctx.restore();
    return;
  }
  
  if (isThermal) {
    // Monochrome, crisp line-art representation for thermal printing
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    
    // Outline box (instead of solid heavy dark fill to conserve printer ink)
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    
    const parts = getNetworkName().split(' ');
    let topWord = 'شبكة';
    let mainName = 'الدحشة اللاسلكية';
    if (parts.length > 1) {
      topWord = parts[0];
      mainName = parts.slice(1).join(' ');
    } else if (parts.length === 1) {
      topWord = '';
      mainName = parts[0];
    }

    // Draw top word
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(topWord, x + width / 2 + 15, y + 20);
    
    // Draw mainName
    const fontSize = mainName.length > 12 ? '14px' : mainName.length > 8 ? '17px' : '20px';
    ctx.font = `bold ${fontSize} sans-serif`;
    ctx.fillText(mainName, x + width / 2 + 15, y + 43);
    
    // Draw wifi waves on left
    const centerX = x + 35;
    const centerY = y + 36;
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 11, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    
    // Core dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Arrows
    // Down Arrow (left of dot)
    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY + 8);
    ctx.lineTo(centerX - 8, centerY + 18);
    ctx.stroke();
    // arrow head down
    ctx.beginPath();
    ctx.moveTo(centerX - 11, centerY + 14);
    ctx.lineTo(centerX - 8, centerY + 18);
    ctx.lineTo(centerX - 5, centerY + 14);
    ctx.stroke();
    
    // Up Arrow (right of dot)
    ctx.beginPath();
    ctx.moveTo(centerX + 8, centerY + 18);
    ctx.lineTo(centerX + 8, centerY + 8);
    ctx.stroke();
    // arrow head up
    ctx.beginPath();
    ctx.moveTo(centerX + 5, centerY + 12);
    ctx.lineTo(centerX + 8, centerY + 8);
    ctx.lineTo(centerX + 11, centerY + 12);
    ctx.stroke();

    // Subtitle
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(getNetworkName().toUpperCase(), x + width / 2, y + 71);
    
  } else {
    // --- Premium Full color, styled visual brand banner ---
    
    // Rounded charcoal BG box
    const r = 12; // corner radius
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    
    // Create elegant dark gradient background
    const bgGrad = ctx.createLinearGradient(x, y, x, y + height);
    bgGrad.addColorStop(0, '#2d2e2f');
    bgGrad.addColorStop(1, '#1e2021');
    ctx.fillStyle = bgGrad;
    ctx.fill();
    
    // Draw decorative corner gold visual elements matching original logo style
    // Top-left gold splash
    ctx.beginPath();
    ctx.moveTo(x, y + 25);
    ctx.bezierCurveTo(x + 10, y + 20, x + 20, y + 10, x + 25, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = '#facc15';
    ctx.fill();
    
    // Bottom-right gold splash
    ctx.beginPath();
    ctx.moveTo(x + width, y + height - 25);
    ctx.bezierCurveTo(x + width - 10, y + height - 20, x + width - 20, y + height - 10, x + width - 25, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fillStyle = '#facc15';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    
    // Split network name dynamically for high-fidelity vector logo representation
    const parts = getNetworkName().split(' ');
    let topWord = 'شبكة';
    let mainName = 'الدحشة اللاسلكية';
    if (parts.length > 1) {
      topWord = parts[0];
      mainName = parts.slice(1).join(' ');
    } else if (parts.length === 1) {
      topWord = '';
      mainName = parts[0];
    }

    // Draw top word in shining gold/yellow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(topWord, x + width / 2 + 15, y + 20);
    
    // Draw mainName in premium white with clean outlines
    ctx.fillStyle = '#ffffff';
    const fontSize = mainName.length > 12 ? '15px' : mainName.length > 8 ? '18px' : '21px';
    ctx.font = `bold ${fontSize} sans-serif`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.strokeText(mainName, x + width / 2 + 15, y + 43);
    ctx.fillText(mainName, x + width / 2 + 15, y + 43);
    
    // 3 small golden square accent dots (mimicking accents)
    ctx.shadowBlur = 0; // reset shadow
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + width / 2 + 3, y + 27, 3, 3);
    ctx.fillRect(x + width / 2 + 9, y + 27, 3, 3);
    
    // Draw Wifi network wave concentric circles (on left)
    const centerX = x + 35;
    const centerY = y + 36;
    
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#facc15'; // gold wave color
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 13, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 19, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    
    // Core dot
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Standard white/silver down arrow and gold up arrow
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY + 8);
    ctx.lineTo(centerX - 8, centerY + 18);
    ctx.stroke();
    
    // Down Arrowhead icon shape
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(centerX - 11, centerY + 14);
    ctx.lineTo(centerX - 8, centerY + 18);
    ctx.lineTo(centerX - 5, centerY + 14);
    ctx.fill();
    
    // Gold up arrow icon shape
    ctx.strokeStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(centerX + 8, centerY + 18);
    ctx.lineTo(centerX + 8, centerY + 8);
    ctx.stroke();
    
    // Up Arrowhead shape
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(centerX + 5, centerY + 12);
    ctx.lineTo(centerX + 8, centerY + 8);
    ctx.lineTo(centerX + 11, centerY + 12);
    ctx.fill();

    // Subtitle text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(getNetworkName().toUpperCase(), x + width / 2, y + 71);
  }
  
  ctx.restore();
};

const A4_FONT_FAMILY = "'Cairo', 'IBM Plex Sans Arabic', 'Amiri', 'Noto Sans Arabic', Tahoma, sans-serif";

// --- Luxury Corporate PDF Palette & Styling System ---
export const PDF_THEME = {
  primaryNavy: '#0f172a',      // Deep Corporate Slate Navy
  headerBg: '#f8fafc',         // Refined Soft Slate Highlight
  headerAccent: '#1e3a8a',     // Elegant Royal Navy Accent Bar
  borderDark: '#0f172a',       // Crisp Outer Frame Border
  borderSoft: '#cbd5e1',       // Soft Dividing Borders
  borderLight: '#e2e8f0',      // Table Grid Dividing Lines
  tableHeaderBg: '#1e293b',    // Solid Dark Executive Slate Table Header
  tableHeaderColor: '#ffffff', // Crisp High-Contrast White Text for Table Header
  tableRowEven: '#ffffff',     // Pure White Zebra Row
  tableRowOdd: '#f8fafc',      // Soft Slate Tint Zebra Row
  totalHighlightBg: '#eff6ff', // Ice Blue Highlight for Grand Totals
  totalBorder: '#3b82f6',      // Blue Accent Border for Totals
  debtRoseBg: '#fff1f2',       // Soft Rose Tint for Due Balances
  debtRoseBorder: '#f43f5e',
  settledEmeraldBg: '#ecfdf5', // Soft Mint Emerald for Settled Zero Balances
  settledEmeraldBorder: '#10b981',
  textPrimary: '#0f172a',      // WCAG AA Dark Charcoal for Primary Text
  textSecondary: '#475569',    // Slate Gray for Labels and Subtitles
  textMuted: '#64748b'         // Light Muted Slate for Footnotes
};

// --- Single Invoice Receipt Canvas Drawing & PDF Conversion ---
export const drawInvoiceOnCanvas = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  type: CalculatorType;
  date: string;
  shopName?: string;
  previousBalance?: number;
}, isThermal: boolean = false): HTMLCanvasElement | null => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const items = summary.items;
  const headerHeight = 165;
  const itemRowHeight = 42;
  const footerHeight = 225;
  
  // Standard A4 aspect ratio (210 x 297mm) for Document PDF mode
  const canvasWidth = isThermal ? 500 : 900;
  const canvasHeight = isThermal 
    ? (headerHeight + (items.length * itemRowHeight) + footerHeight)
    : 1273; // 900 * 297 / 210 = 1272.85 ≈ 1273
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  if (isThermal) {
    // --- POS Thermal Printer Mode: Pure monochrome high-contrast, no heavy black fills ---
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
    
    const drawDashLine = (y: number) => {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(canvasWidth - 15, y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw monochrome black/white network logo
    drawDahshahLogo(ctx, 22, 23, 140, 72, true);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    
    const isPaymentOnly = summary.totalAmount === 0 || (items.length === 0 && summary.receivedAmount > 0);
    const opNumber = (summary as any).transactionId || 'TX-' + Math.floor(100000 + Math.random() * 900000);
    
    ctx.textAlign = 'right';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(getNetworkName(), canvasWidth - 30, 46);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(isPaymentOnly ? 'سند قبض مالي وإشعار استلام نقدي' : 'فاتورة مبيعات كروت اتصالات وموزعين', canvasWidth - 30, 73);
    
    drawDashLine(100);
    
    // Meta details with shop name custom
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    if (isPaymentOnly) {
      ctx.fillText(`تاريخ العملية: ${summary.date}  |  رقم العملية: ${opNumber}`, canvasWidth - 30, 118);
    } else {
      ctx.fillText(`التاريخ: ${summary.date}  |  ${summary.type === CalculatorType.PRO ? 'فئة برو Pro' : 'فئة عادية'}`, canvasWidth - 30, 118);
    }
    
    const zone = (summary as any).zoneName || (summary as any).shopZone;
    const shopLabel = zone ? `${summary.shopName || 'بقالة عامة'} (${zone})` : (summary.shopName || 'بقالة عامة');
    ctx.textAlign = 'left';
    ctx.fillText(`العميل / البقالة: ${shopLabel}`, 30, 118);
    
    drawDashLine(135);
    
    let currentY = 158;
    if (isPaymentOnly) {
      // Custom payment-only receipt layout for thermal mode
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('سند قبض مالي وإشعار استلام نقدي', canvasWidth / 2, currentY);
      
      currentY += 28;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`رقم العملية: ${opNumber}`, canvasWidth / 2, currentY);
      
      currentY += 25;
      ctx.font = 'bold 11.5px sans-serif';
      ctx.fillText(`تم استلام مبلغ وقدره: ${summary.receivedAmount} ريال يمني`, canvasWidth / 2, currentY);
      
      currentY += 25;
      ctx.fillText('من الإخوة عملاء وموزعي الشبكة الكرام', canvasWidth / 2, currentY);
      currentY += 20;
      
      drawDashLine(currentY);
      currentY += 25;
      
      ctx.font = 'bold 11.5px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('المبلغ الواصل (الكاش):', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${summary.receivedAmount} ريال`, 40, currentY);
      
      currentY += 25;
      
      const prevBal = summary.previousBalance ?? 0;
      ctx.textAlign = 'right';
      ctx.fillText(prevBal > 0 ? 'الرصيد السابق المستحق عليهم:' : 'رصيدكم الدائن مسبقاً (لكم):', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.abs(prevBal)} ريال`, 40, currentY);
      
      const netRemaining = prevBal - summary.receivedAmount;
      currentY += 25;
      ctx.textAlign = 'right';
      ctx.fillText(netRemaining > 0 ? 'صافي الحساب الكلي المطلوب:' : netRemaining < 0 ? 'صافي رصيدكم الحالي (لكم):' : 'صافي الحساب الكلي:', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(netRemaining === 0 ? 'خالص مسدد' : `${Math.abs(netRemaining)} ريال`, 40, currentY);
      
      currentY += 15;
    } else {
      // Table Headers
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('الرقم', 450, currentY);
      ctx.fillText('أسم المنتج', 320, currentY);
      ctx.fillText('السعر', 205, currentY);
      ctx.fillText('الكمية', 135, currentY);
      ctx.fillText('اجمالي', 65, currentY);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(25, 172);
      ctx.lineTo(canvasWidth - 25, 172);
      ctx.stroke();
      
      // Table Rows
      currentY = 195;
      items.forEach((item, idx) => {
        ctx.textAlign = 'center';
        ctx.fillText(String(idx + 1), 450, currentY);
        ctx.fillText(item.label, 320, currentY);
        ctx.fillText(`${item.price} ريال`, 205, currentY);
        ctx.fillText(String(item.quantity), 135, currentY);
        ctx.fillText(`${item.total} ريال`, 65, currentY);
        
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(25, currentY + 15);
        ctx.lineTo(canvasWidth - 25, currentY + 15);
        ctx.stroke();
        
        currentY += itemRowHeight;
      });
      
      // Total summaries
      drawDashLine(currentY - 5);
      currentY += 20;
      
      ctx.font = 'bold 12.5px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('إجمالي الفاتورة:', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${summary.totalAmount} ريال`, 40, currentY);
      
      currentY += 25;
      ctx.textAlign = 'right';
      ctx.fillText('الواصل من الفاتورة:', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${summary.receivedAmount} ريال`, 40, currentY);
      
      const invoiceRemaining = summary.totalAmount - summary.receivedAmount;
      currentY += 25;
      ctx.textAlign = 'right';
      ctx.fillText('الباقي من الفاتورة:', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.abs(invoiceRemaining)} ريال`, 40, currentY);

      const prevBal = summary.previousBalance ?? 0;
      currentY += 25;
      ctx.textAlign = 'right';
      ctx.fillText('الرصيد السابق:', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${prevBal} ريال`, 40, currentY);

      const grandTotalBalance = prevBal + invoiceRemaining;
      currentY += 25;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(grandTotalBalance > 0 ? 'الإجمالي الكلي عليكم:' : grandTotalBalance < 0 ? 'الإجمالي الكلي لكم (له):' : 'الإجمالي الكلي (مسدد):', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(grandTotalBalance === 0 ? 'خالص مسدد' : `${Math.abs(grandTotalBalance)} ريال`, 40, currentY);
      
      currentY += 20;
    }
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    drawDashLine(currentY);
    currentY += 28;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('الموزع والوكيل: ' + getDistributorName() + ' - هاتف: ' + getDistributorPhone(), canvasWidth / 2, currentY);
    currentY += 20;
    ctx.font = '10px sans-serif';
    ctx.fillText('نشكر ثقتكم بنا - ' + getNetworkName(), canvasWidth / 2, currentY);
    if (getInvoiceFooterNote()) {
      currentY += 18;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, currentY);
    }
    
  } else {
    // --- True A4 Corporate Standard Layout: Pure White Background, Formal Accounting Formatting ---
    const isPaymentOnly = summary.totalAmount === 0 || (items.length === 0 && summary.receivedAmount > 0);
    const opNumber = (summary as any).transactionId || 'TX-' + Math.floor(100000 + Math.random() * 900000);
    
    // Luxury outer framing borders (Margins = 40px, guaranteeing no printer clipping)
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);
    
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    
    // Header Banner Highlight & Luxury Top Accent Bar
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(45, 45, canvasWidth - 90, 95);
    ctx.fillStyle = PDF_THEME.headerAccent;
    ctx.fillRect(45, 45, canvasWidth - 90, 4);
    
    // Main Title: Strictly font size 25
    ctx.textAlign = 'center';
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
    ctx.fillText(isPaymentOnly ? 'سند قبض مالي وإشعار استلام نقدي' : 'فاتورة مبيعات كروت اتصالات وموزعين', canvasWidth / 2, 75);
    
    // Subheading: strictly between 18 and 22 (size 21)
    ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText(getNetworkName(), canvasWidth / 2, 110);
    
    // Clean horizontal divider line
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 140);
    ctx.lineTo(canvasWidth - 50, 140);
    ctx.stroke();
    
    // Structured Metadata Accounting Box with Subtle Tint
    const metaY = 152;
    const metaH = 86;
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(50, metaY, canvasWidth - 100, metaH);
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(50, metaY, canvasWidth - 100, metaH);
    
    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.beginPath();
    ctx.moveTo(50, metaY + (metaH / 2));
    ctx.lineTo(canvasWidth - 50, metaY + (metaH / 2));
    ctx.stroke();
    
    // Metadata Row 1 (y = metaY + 22)
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.fillText(`رقم العملية: ${opNumber}`, canvasWidth - 70, metaY + 22);
    ctx.textAlign = 'center';
    ctx.font = `19px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText(`التاريخ: ${summary.date}`, canvasWidth / 2, metaY + 22);
    ctx.textAlign = 'left';
    ctx.fillText(isPaymentOnly ? 'نوع العملية: سند قبض نقدي' : (summary.type === CalculatorType.PRO ? 'فئة الحساب: كروت برو Pro' : 'فئة الحساب: كروت عادية'), 70, metaY + 22);
    
    // Metadata Row 2 (y = metaY + 64)
    const stdZone = (summary as any).zoneName || (summary as any).shopZone;
    const stdShopLabel = stdZone ? `${summary.shopName || 'بقالة عامة'} (${stdZone})` : (summary.shopName || 'بقالة عامة');
    ctx.textAlign = 'right';
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.fillText(`العميل / البقالة: ${stdShopLabel}`, canvasWidth - 70, metaY + 64);
    ctx.textAlign = 'left';
    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText(`الموزع المعتمد: ${getDistributorName()} (هاتف: ${getDistributorPhone()})`, 70, metaY + 64);
    
    let currentY = 265;
    
    if (isPaymentOnly) {
      // --- Formal Payment Voucher Structured Table with Zebra Striping & Totals Highlight ---
      const prevBal = summary.previousBalance ?? 0;
      const netRemaining = prevBal - summary.receivedAmount;
      
      const voucherRows = [
        { label: 'رقم السند المالي:', value: opNumber, isBold: true },
        { label: 'تاريخ الاستلام والقبض:', value: summary.date, isBold: false },
        { label: 'استلمنا من الأخ / البقالة:', value: stdShopLabel, isBold: true },
        { label: 'المبلغ المقبوض الواصل (كاش):', value: `${summary.receivedAmount.toLocaleString('en-US')} ريال يمني`, isBold: true },
        { label: 'بيان المعاملة المالية:', value: 'دفعة نقدية مسددة مقبوضة لحساب كروت الشبكة', isBold: false },
        { label: 'الرصيد السابق المستحق:', value: `${Math.abs(prevBal).toLocaleString('en-US')} ريال يمني`, isBold: false },
        { 
          label: netRemaining > 0 ? 'صافي الحساب المتبقي المطلوب بعد السداد:' : (netRemaining < 0 ? 'صافي الرصيد الدائن لكم مسبقاً (له):' : 'صافي الحساب بعد السداد:'), 
          value: netRemaining === 0 ? 'خالص مسدد بالكامل' : `${Math.abs(netRemaining).toLocaleString('en-US')} ريال يمني`, 
          isBold: true 
        }
      ];
      
      const rowHeight = 48;
      voucherRows.forEach((r, idx) => {
        const y = currentY + (idx * rowHeight);
        const isLastRow = idx === voucherRows.length - 1;
        
        // Zebra Striping & Highlight for Net Remaining Balance
        if (isLastRow) {
          ctx.fillStyle = netRemaining === 0 ? PDF_THEME.settledEmeraldBg : PDF_THEME.totalHighlightBg;
        } else {
          ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        }
        ctx.fillRect(50, y, canvasWidth - 100, rowHeight);
        
        ctx.strokeStyle = isLastRow ? (netRemaining === 0 ? PDF_THEME.settledEmeraldBorder : PDF_THEME.totalBorder) : PDF_THEME.borderSoft;
        ctx.lineWidth = isLastRow ? 1.2 : 0.8;
        ctx.strokeRect(50, y, canvasWidth - 100, rowHeight);
        
        // Vertical divider between label and value
        ctx.strokeStyle = isLastRow ? (netRemaining === 0 ? PDF_THEME.settledEmeraldBorder : PDF_THEME.totalBorder) : PDF_THEME.borderLight;
        ctx.beginPath();
        ctx.moveTo(canvasWidth - 360, y);
        ctx.lineTo(canvasWidth - 360, y + rowHeight);
        ctx.stroke();
        
        ctx.fillStyle = isLastRow ? PDF_THEME.primaryNavy : PDF_THEME.textSecondary;
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText(r.label, canvasWidth - 70, y + (rowHeight / 2));
        
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.textAlign = 'left';
        ctx.font = r.isBold ? `bold 20px ${A4_FONT_FAMILY}` : `19px ${A4_FONT_FAMILY}`;
        ctx.fillText(r.value, 70, y + (rowHeight / 2));
      });
      
    } else {
      // --- Formal Sales Invoice Items Table with Luxury Dark Header & Zebra Striping ---
      const tableX = 50;
      const tableW = canvasWidth - 100;
      const colM = 60;
      const colPrice = 130;
      const colQty = 110;
      const colTotal = 170;
      const colName = tableW - (colM + colPrice + colQty + colTotal); // 800 - 470 = 330
      
      // Table Header Highlight
      const headerH = 44;
      ctx.fillStyle = PDF_THEME.tableHeaderBg;
      ctx.fillRect(tableX, currentY, tableW, headerH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, currentY, tableW, headerH);
      
      // Vertical dividers for header
      const divX1 = tableX + colTotal;
      const divX2 = divX1 + colQty;
      const divX3 = divX2 + colPrice;
      const divX4 = divX3 + colName;
      
      ctx.strokeStyle = '#475569';
      [divX1, divX2, divX3, divX4].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, currentY);
        ctx.lineTo(x, currentY + headerH);
        ctx.stroke();
      });
      
      ctx.fillStyle = PDF_THEME.tableHeaderColor;
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('م', divX4 + (colM / 2), currentY + (headerH / 2));
      ctx.textAlign = 'right';
      ctx.fillText('أسم المنتج / الفئة', divX4 - 15, currentY + (headerH / 2));
      ctx.textAlign = 'center';
      ctx.fillText('السعر (ريال)', divX2 + (colPrice / 2), currentY + (headerH / 2));
      ctx.fillText('الكمية', divX1 + (colQty / 2), currentY + (headerH / 2));
      ctx.fillText('الاجمالي (ريال)', tableX + (colTotal / 2), currentY + (headerH / 2));
      
      currentY += headerH;
      
      // Table Rows with Subtle Zebra Striping
      const rowHeight = 42;
      items.forEach((item, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        ctx.fillRect(tableX, currentY, tableW, rowHeight);
        
        ctx.strokeStyle = PDF_THEME.borderLight;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tableX, currentY, tableW, rowHeight);
        
        [divX1, divX2, divX3, divX4].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(x, currentY);
          ctx.lineTo(x, currentY + rowHeight);
          ctx.stroke();
        });
        
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `19px ${A4_FONT_FAMILY}`;
        
        // Index
        ctx.textAlign = 'center';
        ctx.fillText(String(idx + 1), divX4 + (colM / 2), currentY + (rowHeight / 2));
        
        // Item label
        ctx.textAlign = 'right';
        ctx.fillText(item.label, divX4 - 15, currentY + (rowHeight / 2));
        
        // Price
        ctx.textAlign = 'center';
        ctx.fillText(`${item.price.toLocaleString('en-US')}`, divX2 + (colPrice / 2), currentY + (rowHeight / 2));
        
        // Quantity
        ctx.fillText(String(item.quantity), divX1 + (colQty / 2), currentY + (rowHeight / 2));
        
        // Total
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.fillText(`${item.total.toLocaleString('en-US')}`, tableX + (colTotal / 2), currentY + (rowHeight / 2));
        
        currentY += rowHeight;
      });
      
      // Summary Accounting Totals Box with Corporate Highlights
      currentY += 25;
      const invoiceRemaining = summary.totalAmount - summary.receivedAmount;
      const prevBal = summary.previousBalance ?? 0;
      const grandTotalBalance = prevBal + invoiceRemaining;
      
      const summaryRows = [
        { label: 'إجمالي مبلغ الفاتورة:', value: `${summary.totalAmount.toLocaleString('en-US')} ريال`, bold: true },
        { label: 'المبلغ الواصل نقداً من الفاتورة:', value: `${summary.receivedAmount.toLocaleString('en-US')} ريال`, bold: false },
        { label: 'المتبقي الآجل من الفاتورة:', value: `${invoiceRemaining.toLocaleString('en-US')} ريال`, bold: false },
        { label: 'الرصيد السابق المستحق:', value: `${prevBal.toLocaleString('en-US')} ريال`, bold: false },
        { 
          label: grandTotalBalance > 0 ? 'صافي الحساب الكلي المستحق عليكم:' : (grandTotalBalance < 0 ? 'صافي الحساب الكلي المستحق لكم (له):' : 'صافي الحساب الكلي (مسدد):'), 
          value: grandTotalBalance === 0 ? 'خالص مسدد بالكامل' : `${Math.abs(grandTotalBalance).toLocaleString('en-US')} ريال`, 
          bold: true 
        }
      ];
      
      const sumRowH = 42;
      summaryRows.forEach((sr, idx) => {
        const y = currentY + (idx * sumRowH);
        const isGrandTotal = idx === summaryRows.length - 1;
        
        if (isGrandTotal) {
          ctx.fillStyle = grandTotalBalance === 0 ? PDF_THEME.settledEmeraldBg : PDF_THEME.totalHighlightBg;
        } else {
          ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        }
        ctx.fillRect(tableX, y, tableW, sumRowH);
        
        ctx.strokeStyle = isGrandTotal ? (grandTotalBalance === 0 ? PDF_THEME.settledEmeraldBorder : PDF_THEME.totalBorder) : PDF_THEME.borderSoft;
        ctx.lineWidth = isGrandTotal ? 1.4 : 0.8;
        ctx.strokeRect(tableX, y, tableW, sumRowH);
        
        ctx.beginPath();
        ctx.moveTo(canvasWidth - 360, y);
        ctx.lineTo(canvasWidth - 360, y + sumRowH);
        ctx.stroke();
        
        ctx.fillStyle = isGrandTotal ? PDF_THEME.primaryNavy : PDF_THEME.textSecondary;
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText(sr.label, canvasWidth - 70, y + (sumRowH / 2));
        
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.textAlign = 'left';
        ctx.font = sr.bold ? (isGrandTotal ? `bold 21px ${A4_FONT_FAMILY}` : `bold 20px ${A4_FONT_FAMILY}`) : `19px ${A4_FONT_FAMILY}`;
        ctx.fillText(sr.value, 70, y + (sumRowH / 2));
      });
    }
    
    // Bottom Signatures Section
    const signY = 1110;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText('توقيع المستلم / العميل:', canvasWidth - 70, signY);
    ctx.textAlign = 'left';
    ctx.fillText('توقيع وختم المحاسب / الموزع المعتمد:', 70, signY);
    
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 70, signY + 30);
    ctx.lineTo(canvasWidth - 300, signY + 30);
    ctx.moveTo(70, signY + 30);
    ctx.lineTo(300, signY + 30);
    ctx.stroke();
    
    // Footer Details
    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, 1195);
    ctx.fillText(`الموزع والوكيل المعتمد: ${getDistributorName()}  |  هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1225);
  }
  
  return canvas;
};

// PDF filename builder utility
export const generateDocFilename = (summary: {
  totalAmount: number;
  receivedAmount: number;
  items: any[];
  shopName?: string;
  date?: string;
  transactionId?: string;
}, defaultValue: string = 'فاتورة', extension: string = 'pdf') => {
  const isPaymentOnly = summary.totalAmount === 0 || (summary.items.length === 0 && summary.receivedAmount > 0);
  const docType = isPaymentOnly ? 'واصل' : defaultValue;
  const shop = (summary.shopName || 'بقالة عامة').trim();
  
  const now = new Date();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let hour = now.getHours();
  
  if (summary.date) {
    const parts = summary.date.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  }
  
  return `${shop} ${docType} ${month}\\${day} ${hour}.${extension}`;
};

// PDF Exporter for Single Invoice
export const downloadInvoicePDF = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  type: CalculatorType;
  date: string;
  shopName?: string;
  previousBalance?: number;
  transactionId?: string;
}, isThermal: boolean = false) => {
  // Formal PDF document uses standard A4 canvas
  const canvas = drawInvoiceOnCanvas(summary, false);
  if (!canvas) return;
  
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Standard A4 dimensions 210mm x 297mm
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  
  const fileName = generateDocFilename(summary, 'فاتورة', 'pdf');
  pdf.save(fileName);

  // Auto-save to native Krot directory on phone
  const pdfDataUri = pdf.output('datauristring');
  saveFileToKrotFolder(fileName, pdfDataUri, true, true);
};

// Image (PNG) Exporter for Single Invoice
export const downloadInvoicePNG = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  type: CalculatorType;
  date: string;
  shopName?: string;
  previousBalance?: number;
  transactionId?: string;
}, isThermal: boolean = false) => {
  const canvas = drawInvoiceOnCanvas(summary, isThermal);
  if (!canvas) return;
  
  const imgData = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.setAttribute('href', imgData);
  
  const fileName = generateDocFilename(summary, 'فاتورة', 'png');
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Daily Financial Summary Canvas PDF Drawing ---
export const downloadDailyReportPDF = (report: any, history: SaleRecord[], customDate?: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const today = customDate || new Date().toISOString().split('T')[0];
  
  // Collect actual sales segments
  const regularItems = INITIAL_PRICES[CalculatorType.REGULAR].map(p => ({
    label: p.label,
    quantity: report[CalculatorType.REGULAR][p.id]?.quantity || 0,
    amount: report[CalculatorType.REGULAR][p.id]?.amount || 0
  })).filter(item => item.quantity > 0);

  const proItems = INITIAL_PRICES[CalculatorType.PRO].map(p => ({
    label: p.label,
    quantity: report[CalculatorType.PRO][p.id]?.quantity || 0,
    amount: report[CalculatorType.PRO][p.id]?.amount || 0
  })).filter(item => item.quantity > 0);

  const totalSalesCount = history.filter(s => s.date === today).reduce((sum, s) => sum + s.quantity, 0);

  // True A4 Standard Dimensions (210 x 297mm)
  const canvasWidth = 900;
  const canvasHeight = 1273;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // Fill pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Luxury outer framing borders (Margins = 40px)
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
  ctx.strokeStyle = PDF_THEME.borderLight;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);
  
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  
  // Header Banner Highlight & Luxury Top Accent Bar
  ctx.fillStyle = PDF_THEME.headerBg;
  ctx.fillRect(45, 45, canvasWidth - 90, 105);
  ctx.fillStyle = PDF_THEME.headerAccent;
  ctx.fillRect(45, 45, canvasWidth - 90, 4);
  
  // Title: strictly font size 25
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(getNetworkName(), canvasWidth / 2, 75);

  // Subtitle: strictly between 18 and 22 (size 21)
  ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.fillText('التقرير الحسابي والمالي اليومي الموحد', canvasWidth / 2, 110);
  
  ctx.font = `19px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  ctx.fillText(`تاريخ التقرير اليومي: ${today}`, canvasWidth / 2, 138);
  
  // Simple thin divider
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 155);
  ctx.lineTo(canvasWidth - 50, 155);
  ctx.stroke();
  
  let currentY = 175;
  const tableX = 50;
  const tableW = canvasWidth - 100; // 800
  
  const drawSectionHeader = (y: number, title: string) => {
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, y, tableW, 44);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, y, tableW, 44);
    
    // Vertical dividers
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(tableX + 220, y);
    ctx.lineTo(tableX + 220, y + 44);
    ctx.moveTo(canvasWidth - 360, y);
    ctx.lineTo(canvasWidth - 360, y + 44);
    ctx.stroke();
    
    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`  ${title}`, canvasWidth - 70, y + 22);
    ctx.textAlign = 'center';
    ctx.fillText('الكمية المباعة', (tableX + 220 + canvasWidth - 360) / 2, y + 22);
    ctx.fillText('إجمالي المبلغ (ريال)', tableX + 110, y + 22);
  };
  
  // Draw Regular Section with Zebra Striping
  if (regularItems.length > 0) {
    drawSectionHeader(currentY, 'قسم كروت الفئات العادية');
    currentY += 44;
    
    regularItems.forEach((item, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
      ctx.fillRect(tableX, currentY, tableW, 42);
      
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, 42);
      
      ctx.beginPath();
      ctx.moveTo(tableX + 220, currentY);
      ctx.lineTo(tableX + 220, currentY + 42);
      ctx.moveTo(canvasWidth - 360, currentY);
      ctx.lineTo(canvasWidth - 360, currentY + 42);
      ctx.stroke();
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `19px ${A4_FONT_FAMILY}`;
      
      ctx.textAlign = 'right';
      ctx.fillText(item.label, canvasWidth - 70, currentY + 21);
      
      ctx.textAlign = 'center';
      ctx.fillText(`${item.quantity} كرت`, (tableX + 220 + canvasWidth - 360) / 2, currentY + 21);
      
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${item.amount.toLocaleString('en-US')} ريال`, tableX + 110, currentY + 21);
      
      currentY += 42;
    });
    currentY += 20;
  }
  
  // Draw Pro Section with Zebra Striping
  if (proItems.length > 0) {
    drawSectionHeader(currentY, 'قسم كروت فئة برو Pro');
    currentY += 44;
    
    proItems.forEach((item, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
      ctx.fillRect(tableX, currentY, tableW, 42);
      
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, 42);
      
      ctx.beginPath();
      ctx.moveTo(tableX + 220, currentY);
      ctx.lineTo(tableX + 220, currentY + 42);
      ctx.moveTo(canvasWidth - 360, currentY);
      ctx.lineTo(canvasWidth - 360, currentY + 42);
      ctx.stroke();
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `19px ${A4_FONT_FAMILY}`;
      
      ctx.textAlign = 'right';
      ctx.fillText(item.label, canvasWidth - 70, currentY + 21);
      
      ctx.textAlign = 'center';
      ctx.fillText(`${item.quantity} كرت`, (tableX + 220 + canvasWidth - 360) / 2, currentY + 21);
      
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${item.amount.toLocaleString('en-US')} ريال`, tableX + 110, currentY + 21);
      
      currentY += 42;
    });
    currentY += 20;
  }
  
  // Statistics Section (Structured Accounting Box with Corporate Highlight)
  currentY += 10;
  const statsRows = [
    { label: 'إجمالي المبيعات والمدخول المالي الكلي لليوم:', value: `${report.totalAmount.toLocaleString('en-US')} ريال يمني كامل` },
    { label: 'حجم الكروت الكلية المباعة اليوم ككل:', value: `${totalSalesCount.toLocaleString('en-US')} كرت` }
  ];
  
  statsRows.forEach((sr, idx) => {
    const y = currentY + (idx * 48);
    const isMainTotal = idx === 0;
    
    ctx.fillStyle = isMainTotal ? PDF_THEME.totalHighlightBg : PDF_THEME.headerBg;
    ctx.fillRect(tableX, y, tableW, 48);
    
    ctx.strokeStyle = isMainTotal ? PDF_THEME.totalBorder : PDF_THEME.borderSoft;
    ctx.lineWidth = isMainTotal ? 1.4 : 0.8;
    ctx.strokeRect(tableX, y, tableW, 48);
    
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 450, y);
    ctx.lineTo(canvasWidth - 450, y + 48);
    ctx.stroke();
    
    ctx.fillStyle = isMainTotal ? PDF_THEME.primaryNavy : PDF_THEME.textSecondary;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(sr.label, canvasWidth - 70, y + 24);
    
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.textAlign = 'left';
    ctx.font = isMainTotal ? `bold 22px ${A4_FONT_FAMILY}` : `bold 20px ${A4_FONT_FAMILY}`;
    ctx.fillText(sr.value, 70, y + 24);
  });
  
  currentY += (statsRows.length * 48) + 40;
  
  // Signatures block at bottom
  const signY = 1110;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText('توقيع المحاسب / الموزع المسؤول:', canvasWidth - 70, signY);
  ctx.textAlign = 'left';
  ctx.fillText('توقيع وإمضاء الوكيل المعتمد بالشبكة:', 70, signY);
  
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvasWidth - 70, signY + 30);
  ctx.lineTo(canvasWidth - 300, signY + 30);
  ctx.moveTo(70, signY + 30);
  ctx.lineTo(300, signY + 30);
  ctx.stroke();
  
  // Footer Details
  ctx.font = `18px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(`هذا كشف مالي رسمي مبسط ملخص لعمل ${getNetworkName()} - ${getDistributorName()} (${getDistributorPhone()})`, canvasWidth / 2, 1195);
  if (getInvoiceFooterNote()) {
    ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, 1225);
  }
  
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Standard A4 dimensions (210 x 297mm)
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  
  const now = new Date();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  const hour = now.getHours();
  
  if (today) {
    const parts = today.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  }
  
  const reportFileName = `تقرير يومي ${month}_${day} ${hour}.pdf`;
  pdf.save(reportFileName);

  // Auto-save to phone's Krot folder
  const pdfDataUri = pdf.output('datauristring');
  saveFileToKrotFolder(reportFileName, pdfDataUri, true, true);
};

// --- Custom Detailed Daily Report PDF for Date Filtered Report (True Standard A4) ---
export const downloadDetailedDailyReportPDF = (
  reportDate: string,
  totalCardsQuantity: number,
  totalDebtIncreased: number,
  totalPayments: number,
  totalCashNoDebt: number,
  shopsDetails: { name: string; sales: number; payments: number; net: number; status: string }[],
  regularItems: any[],
  proItems: any[]
) => {
  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4
  
  const createA4Canvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Luxury outer framing borders (Margins = 40px)
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);
      
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';
    }
    return { canvas, ctx };
  };

  const drawPageHeader = (ctx: CanvasRenderingContext2D, pageNum: number, totalPages: number) => {
    // Header Banner Highlight & Luxury Top Accent Bar
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(45, 45, canvasWidth - 90, 105);
    ctx.fillStyle = PDF_THEME.headerAccent;
    ctx.fillRect(45, 45, canvasWidth - 90, 4);
    
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(getNetworkName(), canvasWidth / 2, 75);
    
    ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText('التقرير المالي والحسابي التفصيلي الموحد لليوم', canvasWidth / 2, 110);
    
    ctx.font = `19px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.fillText(`تاريخ التقرير: ${reportDate}  |  الموزع: ${getDistributorName()}  |  صفحة ${pageNum} من ${totalPages}`, canvasWidth / 2, 138);
    
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 155);
    ctx.lineTo(canvasWidth - 50, 155);
    ctx.stroke();
  };

  const drawPageFooter = (ctx: CanvasRenderingContext2D) => {
    const signY = 1120;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText('توقيع المحاسب / الموزع المسؤول:', canvasWidth - 70, signY);
    ctx.textAlign = 'left';
    ctx.fillText('توقيع وإمضاء الوكيل المعتمد بالشبكة:', 70, signY);
    
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 70, signY + 30);
    ctx.lineTo(canvasWidth - 300, signY + 30);
    ctx.moveTo(70, signY + 30);
    ctx.lineTo(300, signY + 30);
    ctx.stroke();
    
    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(`هذا كشف رسمي تفصيلي ومطابقة مالية لعمل شبكة: ${getNetworkName()} - بإشراف الموزع: ${getDistributorName()}`, canvasWidth / 2, 1195);
    if (getInvoiceFooterNote()) {
      ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, 1225);
    }
  };

  // Determine pagination: if many shops or items, split across 2 pages
  const needsTwoPages = shopsDetails.length > 8 || (regularItems.length + proItems.length) > 6;
  const totalPages = needsTwoPages ? 2 : 1;

  const pages: HTMLCanvasElement[] = [];

  // --- Page 1 ---
  const p1 = createA4Canvas();
  if (p1.ctx) {
    const ctx = p1.ctx;
    drawPageHeader(ctx, 1, totalPages);
    
    let currentY = 175;
    
    // Summary Cards (2x2 grid with soft tint backgrounds and elegant borders)
    const tableX = 50;
    const tableW = canvasWidth - 100; // 800
    const cardW = 390;
    const cardH = 56;
    
    const drawCard = (x: number, y: number, title: string, val: string, isAccent = false) => {
      ctx.fillStyle = isAccent ? PDF_THEME.totalHighlightBg : PDF_THEME.headerBg;
      ctx.fillRect(x, y, cardW, cardH);
      
      ctx.strokeStyle = isAccent ? PDF_THEME.totalBorder : PDF_THEME.borderSoft;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cardW, cardH);
      
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText(title, x + cardW - 15, y + 20);
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.fillText(val, x + 15, y + 42);
    };
    
    // Row 1
    drawCard(tableX + cardW + 20, currentY, 'عدد الكروت المباعة لليوم ككل', `${totalCardsQuantity} كرت`);
    drawCard(tableX, currentY, 'إجمالي المديونية (الآجل الجديد)', `${totalDebtIncreased.toLocaleString('en-US')} ريال`);
    
    currentY += cardH + 12;
    // Row 2
    drawCard(tableX + cardW + 20, currentY, 'إجمالي التسديدات والمقبوضات', `${totalPayments.toLocaleString('en-US')} ريال`);
    drawCard(tableX, currentY, 'إجمالي المبالغ الواصلة نقداً', `${totalCashNoDebt.toLocaleString('en-US')} ريال`, true);
    
    currentY += cardH + 25;
    
    // Section Header: Shops Table
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText('كشف حركة حسابات البقالات والعملاء اليومية تفصيلياً:', canvasWidth - 50, currentY);
    
    currentY += 20;
    
    // Table Header with Corporate Slate Fill
    const colW = { shop: 260, sales: 135, payments: 135, net: 135, status: 135 };
    const hY = currentY;
    const rowH = 40;
    
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, hY, tableW, rowH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, hY, tableW, rowH);
    
    // Dividers
    ctx.strokeStyle = '#475569';
    let divX = tableX + colW.status;
    ctx.beginPath();
    ctx.moveTo(divX, hY); ctx.lineTo(divX, hY + rowH);
    divX += colW.net;
    ctx.moveTo(divX, hY); ctx.lineTo(divX, hY + rowH);
    divX += colW.payments;
    ctx.moveTo(divX, hY); ctx.lineTo(divX, hY + rowH);
    divX += colW.sales;
    ctx.moveTo(divX, hY); ctx.lineTo(divX, hY + rowH);
    ctx.stroke();
    
    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText('البقالة / العميل', canvasWidth - 65, hY + (rowH / 2));
    ctx.textAlign = 'center';
    ctx.fillText('مبيعات اليوم', tableX + colW.status + colW.net + colW.payments + (colW.sales / 2), hY + (rowH / 2));
    ctx.fillText('الواصل / التسديد', tableX + colW.status + colW.net + (colW.payments / 2), hY + (rowH / 2));
    ctx.fillText('صافي الفاتورة', tableX + colW.status + (colW.net / 2), hY + (rowH / 2));
    ctx.fillText('حالة الرصيد', tableX + (colW.status / 2), hY + (rowH / 2));
    
    currentY += rowH;
    
    const shopsForPage1 = needsTwoPages ? shopsDetails.slice(0, 10) : shopsDetails;
    
    if (shopsForPage1.length === 0) {
      ctx.fillStyle = PDF_THEME.tableRowEven;
      ctx.fillRect(tableX, currentY, tableW, rowH);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, rowH);
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `19px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('لا توجد معاملات مالية أو حركة للبقالات في هذا اليوم المختار.', canvasWidth / 2, currentY + (rowH / 2));
      currentY += rowH;
    } else {
      shopsForPage1.forEach((s, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        ctx.fillRect(tableX, currentY, tableW, rowH);
        
        ctx.strokeStyle = PDF_THEME.borderLight;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tableX, currentY, tableW, rowH);
        
        let rDivX = tableX + colW.status;
        ctx.beginPath();
        ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
        rDivX += colW.net;
        ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
        rDivX += colW.payments;
        ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
        rDivX += colW.sales;
        ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
        ctx.stroke();
        
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `19px ${A4_FONT_FAMILY}`;
        
        // Name
        ctx.textAlign = 'right';
        ctx.fillText(s.name, canvasWidth - 65, currentY + (rowH / 2));
        
        // Sales
        ctx.textAlign = 'center';
        ctx.fillText(`${s.sales.toLocaleString('en-US')}`, tableX + colW.status + colW.net + colW.payments + (colW.sales / 2), currentY + (rowH / 2));
        
        // Payments
        ctx.fillText(`${s.payments.toLocaleString('en-US')}`, tableX + colW.status + colW.net + (colW.payments / 2), currentY + (rowH / 2));
        
        // Net
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.fillText(`${s.net.toLocaleString('en-US')}`, tableX + colW.status + (colW.net / 2), currentY + (rowH / 2));
        
        // Status
        ctx.font = `18px ${A4_FONT_FAMILY}`;
        ctx.fillText(s.status, tableX + (colW.status / 2), currentY + (rowH / 2));
        
        currentY += rowH;
      });
    }
    
    // Category items on Page 1 if not paginated
    if (!needsTwoPages && (regularItems.length > 0 || proItems.length > 0)) {
      currentY += 20;
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText('توزيع مبيعات فئات الكروت لليوم تفصيلياً:', canvasWidth - 50, currentY);
      currentY += 20;
      
      const drawCategoryTable = (items: any[], catTitle: string) => {
        ctx.fillStyle = PDF_THEME.tableHeaderBg;
        ctx.fillRect(tableX, currentY, tableW, 38);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(tableX, currentY, tableW, 38);
        ctx.fillStyle = PDF_THEME.tableHeaderColor;
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText(`  ${catTitle}`, canvasWidth - 65, currentY + 19);
        ctx.textAlign = 'center';
        ctx.fillText('الكمية المباعة', tableX + 380, currentY + 19);
        ctx.textAlign = 'left';
        ctx.fillText('إجمالي المدخول المالي  ', tableX + 30, currentY + 19);
        currentY += 38;
        
        items.forEach((item, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
          ctx.fillRect(tableX, currentY, tableW, 36);
          ctx.strokeStyle = PDF_THEME.borderLight;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(tableX, currentY, tableW, 36);
          ctx.fillStyle = PDF_THEME.primaryNavy;
          ctx.font = `18px ${A4_FONT_FAMILY}`;
          ctx.textAlign = 'right';
          ctx.fillText(item.label, canvasWidth - 65, currentY + 18);
          ctx.textAlign = 'center';
          ctx.fillText(`${item.quantity} كرت`, tableX + 380, currentY + 18);
          ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
          ctx.textAlign = 'left';
          ctx.fillText(`${item.amount.toLocaleString('en-US')} ريال  `, tableX + 30, currentY + 18);
          currentY += 36;
        });
        currentY += 10;
      };
      
      if (regularItems.length > 0) drawCategoryTable(regularItems, 'الكروت الفئات العادية للشبكة');
      if (proItems.length > 0) drawCategoryTable(proItems, 'كروت فئة برو Pro للشبكة والموزعين');
    }
    
    drawPageFooter(ctx);
    pages.push(p1.canvas);
  }

  // --- Page 2 (if paginated) ---
  if (needsTwoPages) {
    const p2 = createA4Canvas();
    if (p2.ctx) {
      const ctx = p2.ctx;
      drawPageHeader(ctx, 2, totalPages);
      
      let currentY = 180;
      const tableX = 50;
      const tableW = canvasWidth - 100;
      
      // Remaining shops
      const remainingShops = shopsDetails.slice(10);
      if (remainingShops.length > 0) {
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText('بقية كشف حركة البقالات والعملاء:', canvasWidth - 50, currentY);
        currentY += 20;
        
        const colW = { shop: 260, sales: 135, payments: 135, net: 135, status: 135 };
        const rowH = 40;
        
        remainingShops.forEach((s, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
          ctx.fillRect(tableX, currentY, tableW, rowH);
          ctx.strokeStyle = PDF_THEME.borderLight;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(tableX, currentY, tableW, rowH);
          
          let rDivX = tableX + colW.status;
          ctx.beginPath();
          ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
          rDivX += colW.net;
          ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
          rDivX += colW.payments;
          ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
          rDivX += colW.sales;
          ctx.moveTo(rDivX, currentY); ctx.lineTo(rDivX, currentY + rowH);
          ctx.stroke();
          
          ctx.fillStyle = PDF_THEME.primaryNavy;
          ctx.font = `19px ${A4_FONT_FAMILY}`;
          ctx.textAlign = 'right';
          ctx.fillText(s.name, canvasWidth - 65, currentY + (rowH / 2));
          ctx.textAlign = 'center';
          ctx.fillText(`${s.sales.toLocaleString('en-US')}`, tableX + colW.status + colW.net + colW.payments + (colW.sales / 2), currentY + (rowH / 2));
          ctx.fillText(`${s.payments.toLocaleString('en-US')}`, tableX + colW.status + colW.net + (colW.payments / 2), currentY + (rowH / 2));
          ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
          ctx.fillText(`${s.net.toLocaleString('en-US')}`, tableX + colW.status + (colW.net / 2), currentY + (rowH / 2));
          ctx.font = `18px ${A4_FONT_FAMILY}`;
          ctx.fillText(s.status, tableX + (colW.status / 2), currentY + (rowH / 2));
          currentY += rowH;
        });
        currentY += 20;
      }
      
      // Category Breakdown on Page 2
      if (regularItems.length > 0 || proItems.length > 0) {
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText('توزيع مبيعات فئات الكروت لليوم تفصيلياً:', canvasWidth - 50, currentY);
        currentY += 20;
        
        const drawCategoryTable = (items: any[], catTitle: string) => {
          ctx.fillStyle = PDF_THEME.tableHeaderBg;
          ctx.fillRect(tableX, currentY, tableW, 38);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(tableX, currentY, tableW, 38);
          ctx.fillStyle = PDF_THEME.tableHeaderColor;
          ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
          ctx.textAlign = 'right';
          ctx.fillText(`  ${catTitle}`, canvasWidth - 65, currentY + 19);
          ctx.textAlign = 'center';
          ctx.fillText('الكمية المباعة', tableX + 380, currentY + 19);
          ctx.textAlign = 'left';
          ctx.fillText('إجمالي المدخول المالي  ', tableX + 30, currentY + 19);
          currentY += 38;
          
          items.forEach((item, idx) => {
            ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
            ctx.fillRect(tableX, currentY, tableW, 36);
            ctx.strokeStyle = PDF_THEME.borderLight;
            ctx.lineWidth = 0.8;
            ctx.strokeRect(tableX, currentY, tableW, 36);
            ctx.fillStyle = PDF_THEME.primaryNavy;
            ctx.font = `18px ${A4_FONT_FAMILY}`;
            ctx.textAlign = 'right';
            ctx.fillText(item.label, canvasWidth - 65, currentY + 18);
            ctx.textAlign = 'center';
            ctx.fillText(`${item.quantity} كرت`, tableX + 380, currentY + 18);
            ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
            ctx.textAlign = 'left';
            ctx.fillText(`${item.amount.toLocaleString('en-US')} ريال  `, tableX + 30, currentY + 18);
            currentY += 36;
          });
          currentY += 10;
        };
        
        if (regularItems.length > 0) drawCategoryTable(regularItems, 'الكروت الفئات العادية للشبكة');
        if (proItems.length > 0) drawCategoryTable(proItems, 'كروت فئة برو Pro للشبكة والموزعين');
      }
      
      drawPageFooter(ctx);
      pages.push(p2.canvas);
    }
  }

  // Export to True A4 PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  pages.forEach((pageCanvas, idx) => {
    if (idx > 0) {
      pdf.addPage('a4', 'p');
    }
    const imgData = pageCanvas.toDataURL('image/jpeg', 1.0);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });
  
  const now = new Date();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  
  if (reportDate) {
    const parts = reportDate.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  }
  
  const detailReportName = `تقرير حسابي تفصيلي ${month}_${day}.pdf`;
  pdf.save(detailReportName);

  // Auto-save to phone's Krot folder
  const pdfDataUri = pdf.output('datauristring');
  saveFileToKrotFolder(detailReportName, pdfDataUri, true, true);
};

// --- Detailed Grocery Accounts Statement PDF Rendering & Download Helpers ---
export interface ShopAccountDetail {
  id: string;
  name: string;
  totalSales: number;
  totalPayments: number;
  currentBalance: number;
  createdAt: string;
  transactions: { id: string; date: string; type: 'sale' | 'payment'; amount: number; notes: string }[];
}

export const drawShopStatementOnCanvas = (account: ShopAccountDetail): HTMLCanvasElement | null => {
  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const transactions = account.transactions || [];
  
  // Fill pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Luxury double-border official layout frame (Margins = 40px)
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
  ctx.strokeStyle = PDF_THEME.borderLight;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);
  
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  
  // Header Banner Highlight & Luxury Top Accent Bar
  ctx.fillStyle = PDF_THEME.headerBg;
  ctx.fillRect(45, 45, canvasWidth - 90, 85);
  ctx.fillStyle = PDF_THEME.headerAccent;
  ctx.fillRect(45, 45, canvasWidth - 90, 4);
  
  // Center Title: strictly font size 25
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(getNetworkName(), canvasWidth / 2, 75);
  
  // Subtitle: strictly between 18 and 22 (size 21)
  ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.fillText('كشف حساب ومطابقة حسابات البقالات والعملاء المعتمدين', canvasWidth / 2, 108);
  
  // Title Parallel Divider line
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 132);
  ctx.lineTo(canvasWidth - 50, 132);
  ctx.stroke();
  
  // --- Beautiful Metadata Box Grid (Bookkeeping Style with soft corporate background) ---
  const metaY = 145;
  const metaHeight = 76;
  const tableX = 50;
  const tableW = canvasWidth - 100; // 800
  
  // Draw metadata bounding box with subtle background
  ctx.fillStyle = PDF_THEME.headerBg;
  ctx.fillRect(tableX, metaY, tableW, metaHeight);
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, metaY, tableW, metaHeight);
  
  // Draw vertical dividers inside metadata box
  ctx.strokeStyle = PDF_THEME.borderLight;
  ctx.beginPath();
  ctx.moveTo(tableX + 270, metaY);
  ctx.lineTo(tableX + 270, metaY + metaHeight);
  ctx.moveTo(tableX + 540, metaY);
  ctx.lineTo(tableX + 540, metaY + metaHeight);
  // Horizontal divider
  ctx.moveTo(tableX, metaY + 34);
  ctx.lineTo(tableX + tableW, metaY + 34);
  ctx.stroke();
  
  // Titles inside metadata cells (18px)
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('العميل المستعلم وحساب البقالة', tableX + 670, metaY + 17);
  ctx.fillText('تاريخ كشف الحساب والمسؤول', tableX + 405, metaY + 17);
  ctx.fillText('الرصيد والمستحقات الكلية', tableX + 135, metaY + 17);
  
  // Values inside metadata cells (19-20px)
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
  ctx.fillText(account.name, tableX + 670, metaY + 54);
  
  ctx.font = `18px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.fillText(`${new Date().toISOString().split('T')[0]} - ${getDistributorName()}`, tableX + 405, metaY + 54);
  
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
  ctx.fillText(`${account.currentBalance.toLocaleString('en-US')} ريال`, tableX + 135, metaY + 54);
  
  // --- Authentic Accounting Ledger Sheet Grid ---
  let currentY = 240;
  const rowHeight = 40;
  
  // Column definitions (RTL order: No, Date, Type, Description, Amount, Running Balance)
  const cols = [
    { name: 'م', width: 45, align: 'center' },
    { name: 'التاريخ واليوم', width: 130, align: 'center' },
    { name: 'نوع العملية', width: 140, align: 'center' },
    { name: 'تفاصيل الحركة والبيان', width: 225, align: 'right' },
    { name: 'المبلغ (ريال)', width: 130, align: 'center' },
    { name: 'الرصيد التراكمي', width: 130, align: 'center' }
  ];
  
  // Table Header with Slate fill
  ctx.fillStyle = PDF_THEME.tableHeaderBg;
  ctx.fillRect(tableX, currentY, tableW, 44);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, currentY, tableW, 44);
  
  ctx.strokeStyle = '#475569';
  let curColX = tableX;
  for (let i = 0; i < cols.length - 1; i++) {
    curColX += cols[i].width;
    ctx.beginPath();
    ctx.moveTo(curColX, currentY);
    ctx.lineTo(curColX, currentY + 44);
    ctx.stroke();
  }
  
  ctx.fillStyle = PDF_THEME.tableHeaderColor;
  ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
  
  let headerTextX = tableX;
  cols.forEach(col => {
    ctx.textAlign = col.align as CanvasTextAlign;
    const tX = col.align === 'center' ? headerTextX + col.width / 2 : headerTextX + col.width - 15;
    ctx.fillText(col.name, tX, currentY + 22);
    headerTextX += col.width;
  });
  
  currentY += 44;
  
  let tempRunning = 0;
  
  // Display transactions (up to 14 rows fit with summary and signatures on single page)
  const displayTxs = transactions.slice(0, 14);
  
  if (displayTxs.length === 0) {
    ctx.fillStyle = PDF_THEME.tableRowEven;
    ctx.fillRect(tableX, currentY, tableW, rowHeight);
    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(tableX, currentY, tableW, rowHeight);
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('لا توجد حركات أو معاملات سابقة مسجلة في هذا الحساب.', canvasWidth / 2, currentY + 20);
    currentY += rowHeight;
  } else {
    displayTxs.forEach((tx, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
      ctx.fillRect(tableX, currentY, tableW, rowHeight);
      
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, rowHeight);
      
      let rowDivX = tableX;
      for (let i = 0; i < cols.length - 1; i++) {
        rowDivX += cols[i].width;
        ctx.beginPath();
        ctx.moveTo(rowDivX, currentY);
        ctx.lineTo(rowDivX, currentY + rowHeight);
        ctx.stroke();
      }
      
      if (tx.type === 'sale') {
        tempRunning += tx.amount;
      } else {
        tempRunning -= tx.amount;
      }
      
      const opLabel = tx.type === 'sale' ? 'فاتورة مبيعات' : 'سداد نقد مستلم';
      const numSign = tx.type === 'sale' ? '+' : '-';
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      
      let rX = tableX;
      // Col 0: No
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1), rX + cols[0].width / 2, currentY + 20);
      rX += cols[0].width;
      
      // Col 1: Date
      ctx.fillText(tx.date, rX + cols[1].width / 2, currentY + 20);
      rX += cols[1].width;
      
      // Col 2: Op
      ctx.fillText(opLabel, rX + cols[2].width / 2, currentY + 20);
      rX += cols[2].width;
      
      // Col 3: Description
      ctx.textAlign = 'right';
      ctx.fillText(tx.notes || '-', rX + cols[3].width - 15, currentY + 20);
      rX += cols[3].width;
      
      // Col 4: Amount
      ctx.textAlign = 'center';
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${numSign}${tx.amount.toLocaleString('en-US')}`, rX + cols[4].width / 2, currentY + 20);
      rX += cols[4].width;
      
      // Col 5: Running Balance
      ctx.fillText(`${tempRunning.toLocaleString('en-US')}`, rX + cols[5].width / 2, currentY + 20);
      
      currentY += rowHeight;
    });
  }
  
  // Balance Summary Box (Bookkeeping Totals with luxury blue highlight)
  currentY += 25;
  ctx.fillStyle = PDF_THEME.totalHighlightBg;
  ctx.fillRect(tableX, currentY, tableW, 52);
  
  ctx.strokeStyle = PDF_THEME.totalBorder;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(tableX, currentY, tableW, 52);
  
  ctx.beginPath();
  ctx.moveTo(canvasWidth - 450, currentY);
  ctx.lineTo(canvasWidth - 450, currentY + 52);
  ctx.stroke();
  
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText('بصمة رصيد حساب البقالة النهائي المطالب بتصفيته:', canvasWidth - 70, currentY + 26);
  
  ctx.textAlign = 'left';
  ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
  ctx.fillText(`${account.currentBalance.toLocaleString('en-US')} ريال يمني مستحق للشبكة`, 70, currentY + 26);
  
  // Signatures segment at bottom
  const signY = 1110;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`توقيع وختم الوكيل المعتمد (${getDistributorName()}):`, canvasWidth - 70, signY);
  ctx.textAlign = 'left';
  ctx.fillText('توقيع وختم العميل / صاحب البقالة:', 70, signY);
  
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvasWidth - 70, signY + 30);
  ctx.lineTo(canvasWidth - 320, signY + 30);
  ctx.moveTo(70, signY + 30);
  ctx.lineTo(320, signY + 30);
  ctx.stroke();
  
  // Footer
  ctx.font = `18px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(`${getNetworkName()} - خدمة متميزة وعمل مستمر هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1195);
  if (getInvoiceFooterNote()) {
    ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, 1225);
  }
  
  return canvas;
};

export const downloadShopStatementPDF = (account: ShopAccountDetail) => {
  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4
  
  const createA4Canvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Luxury double-border official layout frame (Margins = 40px)
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);
      
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';
    }
    return { canvas, ctx };
  };

  const drawPageHeader = (ctx: CanvasRenderingContext2D, pageNum: number, totalPages: number) => {
    // Header Banner Highlight & Luxury Top Accent Bar
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(45, 45, canvasWidth - 90, 85);
    ctx.fillStyle = PDF_THEME.headerAccent;
    ctx.fillRect(45, 45, canvasWidth - 90, 4);
    
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(getNetworkName(), canvasWidth / 2, 75);
    
    ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText('كشف حساب ومطابقة حسابات البقالات والعملاء المعتمدين', canvasWidth / 2, 108);
    
    ctx.font = `19px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.fillText(`العميل: ${account.name}  |  الموزع: ${getDistributorName()}  |  صفحة ${pageNum} من ${totalPages}`, canvasWidth / 2, 138);
    
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 155);
    ctx.lineTo(canvasWidth - 50, 155);
    ctx.stroke();
  };

  const drawPageFooter = (ctx: CanvasRenderingContext2D) => {
    const signY = 1120;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`توقيع وختم الوكيل المعتمد (${getDistributorName()}):`, canvasWidth - 70, signY);
    ctx.textAlign = 'left';
    ctx.fillText('توقيع وختم العميل / صاحب البقالة:', 70, signY);
    
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 70, signY + 30);
    ctx.lineTo(canvasWidth - 320, signY + 30);
    ctx.moveTo(70, signY + 30);
    ctx.lineTo(320, signY + 30);
    ctx.stroke();
    
    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(`${getNetworkName()} - خدمة متميزة وعمل مستمر هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1195);
    if (getInvoiceFooterNote()) {
      ctx.fillText(getInvoiceFooterNote(), canvasWidth / 2, 1225);
    }
  };

  const transactions = account.transactions || [];
  const rowsPerPage = 14;
  const totalPages = Math.max(1, Math.ceil(transactions.length / rowsPerPage));
  const pages: HTMLCanvasElement[] = [];

  const tableX = 50;
  const tableW = canvasWidth - 100; // 800
  const cols = [
    { name: 'م', width: 45, align: 'center' },
    { name: 'التاريخ واليوم', width: 130, align: 'center' },
    { name: 'نوع العملية', width: 140, align: 'center' },
    { name: 'تفاصيل الحركة والبيان', width: 225, align: 'right' },
    { name: 'المبلغ (ريال)', width: 130, align: 'center' },
    { name: 'الرصيد التراكمي', width: 130, align: 'center' }
  ];

  let cumulativeBalance = 0;

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createA4Canvas();
    if (!ctx) continue;

    drawPageHeader(ctx, p + 1, totalPages);
    let currentY = 170;

    // On Page 1, draw metadata box
    if (p === 0) {
      const metaHeight = 76;
      ctx.fillStyle = PDF_THEME.headerBg;
      ctx.fillRect(tableX, currentY, tableW, metaHeight);
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, currentY, tableW, metaHeight);
      
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.beginPath();
      ctx.moveTo(tableX + 270, currentY);
      ctx.lineTo(tableX + 270, currentY + metaHeight);
      ctx.moveTo(tableX + 540, currentY);
      ctx.lineTo(tableX + 540, currentY + metaHeight);
      ctx.moveTo(tableX, currentY + 34);
      ctx.lineTo(tableX + tableW, currentY + 34);
      ctx.stroke();
      
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('العميل المستعلم وحساب البقالة', tableX + 670, currentY + 17);
      ctx.fillText('تاريخ كشف الحساب والمسؤول', tableX + 405, currentY + 17);
      ctx.fillText('الرصيد والمستحقات الكلية', tableX + 135, currentY + 17);
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.fillText(account.name, tableX + 670, currentY + 54);
      
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.fillText(`${new Date().toISOString().split('T')[0]} - ${getDistributorName()}`, tableX + 405, currentY + 54);
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${account.currentBalance.toLocaleString('en-US')} ريال`, tableX + 135, currentY + 54);
      
      currentY += metaHeight + 20;
    }

    // Ledger table header
    const rowH = 40;
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, currentY, tableW, 44);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, currentY, tableW, 44);
    
    ctx.strokeStyle = '#475569';
    let curColX = tableX;
    for (let i = 0; i < cols.length - 1; i++) {
      curColX += cols[i].width;
      ctx.beginPath();
      ctx.moveTo(curColX, currentY);
      ctx.lineTo(curColX, currentY + 44);
      ctx.stroke();
    }
    
    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    let headerTextX = tableX;
    cols.forEach(col => {
      ctx.textAlign = col.align as CanvasTextAlign;
      const tX = col.align === 'center' ? headerTextX + col.width / 2 : headerTextX + col.width - 15;
      ctx.fillText(col.name, tX, currentY + 22);
      headerTextX += col.width;
    });
    
    currentY += 44;

    const pageTxs = transactions.slice(p * rowsPerPage, (p + 1) * rowsPerPage);

    if (pageTxs.length === 0 && p === 0) {
      ctx.fillStyle = PDF_THEME.tableRowEven;
      ctx.fillRect(tableX, currentY, tableW, rowH);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, rowH);
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `19px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('لا توجد حركات أو معاملات سابقة مسجلة في هذا الحساب.', canvasWidth / 2, currentY + 20);
      currentY += rowH;
    } else {
      pageTxs.forEach((tx, idx) => {
        const globalIdx = p * rowsPerPage + idx;
        ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        ctx.fillRect(tableX, currentY, tableW, rowH);
        
        ctx.strokeStyle = PDF_THEME.borderLight;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tableX, currentY, tableW, rowH);
        
        let rowDivX = tableX;
        for (let i = 0; i < cols.length - 1; i++) {
          rowDivX += cols[i].width;
          ctx.beginPath();
          ctx.moveTo(rowDivX, currentY);
          ctx.lineTo(rowDivX, currentY + rowH);
          ctx.stroke();
        }
        
        if (tx.type === 'sale') {
          cumulativeBalance += tx.amount;
        } else {
          cumulativeBalance -= tx.amount;
        }
        
        const opLabel = tx.type === 'sale' ? 'فاتورة مبيعات' : 'سداد نقد مستلم';
        const numSign = tx.type === 'sale' ? '+' : '-';
        
        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `18px ${A4_FONT_FAMILY}`;
        
        let rX = tableX;
        // Col 0: No
        ctx.textAlign = 'center';
        ctx.fillText(String(globalIdx + 1), rX + cols[0].width / 2, currentY + 20);
        rX += cols[0].width;
        
        // Col 1: Date
        ctx.fillText(tx.date, rX + cols[1].width / 2, currentY + 20);
        rX += cols[1].width;
        
        // Col 2: Op
        ctx.fillText(opLabel, rX + cols[2].width / 2, currentY + 20);
        rX += cols[2].width;
        
        // Col 3: Description
        ctx.textAlign = 'right';
        ctx.fillText(tx.notes || '-', rX + cols[3].width - 15, currentY + 20);
        rX += cols[3].width;
        
        // Col 4: Amount
        ctx.textAlign = 'center';
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.fillText(`${numSign}${tx.amount.toLocaleString('en-US')}`, rX + cols[4].width / 2, currentY + 20);
        rX += cols[4].width;
        
        // Col 5: Running Balance
        ctx.fillText(`${cumulativeBalance.toLocaleString('en-US')}`, rX + cols[5].width / 2, currentY + 20);
        
        currentY += rowH;
      });
    }

    // On the last page, draw the balance summary box
    if (p === totalPages - 1) {
      currentY += 25;
      ctx.fillStyle = PDF_THEME.totalHighlightBg;
      ctx.fillRect(tableX, currentY, tableW, 52);
      
      ctx.strokeStyle = PDF_THEME.totalBorder;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(tableX, currentY, tableW, 52);
      
      ctx.beginPath();
      ctx.moveTo(canvasWidth - 450, currentY);
      ctx.lineTo(canvasWidth - 450, currentY + 52);
      ctx.stroke();
      
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText('بصمة رصيد حساب البقالة النهائي المطالب بتصفيته:', canvasWidth - 70, currentY + 26);
      
      ctx.textAlign = 'left';
      ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${account.currentBalance.toLocaleString('en-US')} ريال يمني مستحق للشبكة`, 70, currentY + 26);
    }

    drawPageFooter(ctx);
    pages.push(canvas);
  }

  // Generate true A4 PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  pages.forEach((pageCanvas, idx) => {
    if (idx > 0) pdf.addPage('a4', 'p');
    const imgData = pageCanvas.toDataURL('image/jpeg', 1.0);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  
  const statementFileName = `${account.name} كشف حساب ${month}_${day} ${hour}.pdf`;
  pdf.save(statementFileName);

  // Auto-save to phone's Krot folder
  const pdfDataUri = pdf.output('datauristring');
  saveFileToKrotFolder(statementFileName, pdfDataUri, true, true);
};

// --- formatted Text sharing generators ---
export const buildWhatsAppInvoiceText = (summary: {
  items: { category: number; quantity: number; total: number }[];
  totalAmount: number;
  receivedAmount?: number;
  type?: any;
  date?: string;
  time?: string;
  shopName?: string;
  zoneName?: string;
  shopZone?: string;
  previousBalance?: number;
}, overrideNetworkName?: string, overridePdfFooterNote?: string) => {
  const netName = overrideNetworkName || getNetworkName() || 'شبكة الدحشة';
  const rawFooter = overridePdfFooterNote || getInvoiceFooterNote();
  const footerNote = rawFooter.replace(/^شعارنا:\s*\[\s*/, '').replace(/\s*\]$/, '') || 'لسنا الوحيدون ولكننا الافضل';
  const rec = summary.receivedAmount ?? 0;
  const netDue = summary.totalAmount - rec;
  const prevBal = summary.previousBalance ?? 0;
  const today = summary.date || new Date().toISOString().split('T')[0];
  const timeStr = summary.time || new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  const typeText = (summary.type === 'pro' || summary.type === CalculatorType.PRO) ? 'كروت برو PRO🚀' : 'كروت عادية🔹';
  const zone = summary.zoneName || summary.shopZone;

  let msg = `*📄 فاتورة مبيعات ${netName}  📄*\n`;
  msg += `••••••••••••••••••••\n`;
  msg += `* البقالة:* ${summary.shopName || 'بقالة عامة'}\n`;
  if (zone) {
    msg += `*المربع / الحارة:* 📍 ${zone}\n`;
  }
  msg += `*التاريخ:* ${today} \n`;
  msg += `- *الوقت:* ${timeStr}\n`;
  msg += `*نوع الحساب:* ${typeText}\n`;
  msg += `------------------------------------\n`;

  (summary.items || []).forEach(item => {
    msg += `🔹 *${item.quantity} أبو ${item.category}* = ${item.total} ريال\n`;
  });

  msg += `------------------------------------\n`;
  msg += `💵 *الإجمالي الفاتورة:* *${summary.totalAmount} ريال*\n`;
  msg += `📥 *المستلم (الواصل):* *${rec} ريال*\n`;
  if (netDue >= 0) {
    msg += `🔄 *المتبقي عليه (دين):* *${netDue} ريال*\n`;
  } else {
    msg += `🔄 *الباقي للزبون (فائض):* *${-netDue} ريال*\n`;
  }

  if (prevBal !== 0) {
    msg += `📌 *الرصيد السابق:* *${prevBal} ريال*\n`;
    const combined = prevBal + netDue;
    msg += `💰 *الإجمالي الكلي:* *${combined} ريال*\n`;
  }

  msg += `------------------------------------\n`;
  msg += `📜 *[ شعارنا: [ ${footerNote} ] ]*\n`;
  msg += `——————————————————\n`;
  msg += `📌 _تم إرسال الفاتورة تلقائياً من نظام ${netName}._`;

  return msg;
};

export const buildSMSInvoiceText = (summary: {
  items: { category: number; quantity: number; total: number }[];
  totalAmount: number;
  receivedAmount?: number;
  shopName?: string;
  zoneName?: string;
  shopZone?: string;
  previousBalance?: number;
}, overrideNetworkName?: string) => {
  const netName = overrideNetworkName || getNetworkName() || 'شبكة الدحشة';
  const rec = summary.receivedAmount ?? 0;
  const netDue = summary.totalAmount - rec;
  const prevBal = summary.previousBalance ?? 0;
  const zone = summary.zoneName || summary.shopZone;

  let smsMsg = `${netName}\n`;
  smsMsg += `بقالة: ${summary.shopName || 'بقالة عامة'}${zone ? ` (${zone})` : ''}\n`;
  (summary.items || []).forEach(item => {
    smsMsg += `${item.quantity} أبو ${item.category} = ${item.total}\n`;
  });
  smsMsg += `……\n`;
  smsMsg += `إجمالي : ${summary.totalAmount}\n`;
  smsMsg += `الواصل : ${rec}\n`;
  smsMsg += `الباقي : ${netDue}\n`;

  if (prevBal !== 0) {
    smsMsg += `الرصيد السابق: ${prevBal}\n`;
    const combined = prevBal + netDue;
    smsMsg += `الإجمالي الكلي : ${combined}\n`;
  }
  smsMsg += `……`;

  return smsMsg;
};

/**
 * بناء نص سند قبض أو استلام واصل لمشاركته عبر واتساب
 */
export const buildPaymentReceiptWhatsAppText = (data: {
  shopName: string;
  zoneName?: string;
  shopZone?: string;
  amount: number;
  date?: string;
  notes?: string;
  invoiceId?: string;
  receiptId?: string;
  previousBalance?: number;
  remainingBalance?: number;
}, overrideNetworkName?: string) => {
  const netName = overrideNetworkName || getNetworkName() || 'شبكة الدحشة';
  const today = data.date || new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  const idToDisplay = data.invoiceId || data.receiptId;
  const zone = data.zoneName || data.shopZone;
  
  let msg = `*🧾 سند قبض واستلام واصل - ${netName} 🧾*\n`;
  msg += `••••••••••••••••••••\n`;
  msg += `*العميل / البقالة:* ${data.shopName}\n`;
  if (zone) {
    msg += `*المربع / الحارة:* 📍 ${zone}\n`;
  }
  msg += `*التاريخ:* ${today} - *الوقت:* ${timeStr}\n`;
  if (idToDisplay) {
    msg += `*رقم السند/الفاتورة:* \`${idToDisplay}\`\n`;
  }
  msg += `------------------------------------\n`;
  msg += `💵 *المبلغ المستلم (الواصل):* *${data.amount.toLocaleString('ar-YE')} ريال*\n`;
  if (data.notes) {
    msg += `📝 *البيان:* ${data.notes}\n`;
  }
  if (data.previousBalance !== undefined) {
    msg += `📌 *الرصيد قبل الدفعة:* ${data.previousBalance.toLocaleString('ar-YE')} ريال\n`;
  }
  if (data.remainingBalance !== undefined) {
    if (data.remainingBalance > 0) {
      msg += `🚨 *المتبقي المستحق عليكم:* *${data.remainingBalance.toLocaleString('ar-YE')} ريال*\n`;
    } else if (data.remainingBalance < 0) {
      msg += `🟢 *رصيد زائد وفائض لكم:* *${Math.abs(data.remainingBalance).toLocaleString('ar-YE')} ريال*\n`;
    } else {
      msg += `✅ *حالة الحساب:* خالص ومسدد بالكامل\n`;
    }
  }
  msg += `------------------------------------\n`;
  msg += `الموزع المسؤول: *${getDistributorName()}* 📞 *${getDistributorPhone()}*\n`;
  msg += `✨ _شاكرين لكم حسن تعاملكم والتزامكم_`;
  return msg;
};

/**
 * بناء نص تذكير مجدول آلي للمديونية
 */
export const buildScheduledReminderWhatsAppText = (data: {
  shopName: string;
  currentBalance: number;
  dueDate?: string;
  reminderDays?: number;
  notes?: string;
}, overrideNetworkName?: string) => {
  const netName = overrideNetworkName || getNetworkName() || 'شبكة الدحشة';
  let msg = `*⏰ تذكير بموعد سداد الحساب - ${netName} ⏰*\n`;
  msg += `••••••••••••••••••••\n`;
  msg += `الأخوة الأعزاء في *${data.shopName}* المحترمين،\n`;
  msg += `تحية طيبة وبعد،،\n\n`;
  msg += `نود إحاطتكم وتذكيركم بلطف بموعد سداد الرصيد المستحق لحساب كروت الشبكة.\n`;
  msg += `💰 *المبلغ المستحق حالياً:* *${data.currentBalance.toLocaleString('ar-YE')} ريال*\n`;
  if (data.dueDate) {
    msg += `📅 *الموعد المجدول للتذكير:* ${data.dueDate}\n`;
  }
  if (data.notes) {
    msg += `📝 *ملاحظة:* ${data.notes}\n`;
  }
  msg += `\nيرجى التكرم بالمبادرة بسداد الرصيد لتسوية الحساب واستمرار تزويدكم بكروت الشبكة بانتظام.\n`;
  msg += `------------------------------------\n`;
  msg += `الموزع المعتمد: *${getDistributorName()}*\n`;
  msg += `📞 هاتف التواصل: *${getDistributorPhone()}*\n`;
  msg += `شاكرين ومقدرين تعاونكم الدائم معنا 🌹`;
  return msg;
};

/**
 * تنظيف وتنسيق رقم الهاتف اليمني لإرسال واتساب
 */
export const formatPhoneForWhatsApp = (phone?: string): string => {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('00')) clean = clean.substring(2);
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (clean.length === 9 && !clean.startsWith('967')) {
    clean = '967' + clean;
  }
  return clean;
};

/**
 * فتح تطبيق واتساب الأخضر العادي حصراً وإرسال الرسالة النصية
 * يوجه الطلب بشكل صريح إلى حزمة تطبيق الواتساب الأخضر الرسمي com.whatsapp على أندرويد
 * لمنع التحويل تلقائياً لواتساب الأعمال
 */
export const openWhatsAppDirect = (phoneOrText?: string, textArg: string = '', _legacyChannel?: string) => {
  let phone = '';
  let text = '';

  if (textArg) {
    phone = phoneOrText || '';
    text = textArg;
  } else {
    const candidate = (phoneOrText || '').trim();
    // إذا تم تمرير معامل واحد فقط، نتحقق هل هو رقم هاتف أم نص رسالة
    if (/^[+0-9\s-]{6,16}$/.test(candidate)) {
      phone = candidate;
      text = '';
    } else {
      phone = '';
      text = candidate;
    }
  }

  const cleanPhone = formatPhoneForWhatsApp(phone);
  const enc = encodeURIComponent(text);

  // التحقق هل الجهاز نظام أندرويد
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');

  if (isAndroid) {
    // تحديد الحزمة الرسمية لواتساب الأخضر com.whatsapp بدقة لمنع فتح واتساب الأعمال com.whatsapp.w4b نهائياً
    const intentUrl = cleanPhone 
      ? `intent://send?phone=${cleanPhone}&text=${enc}#Intent;package=com.whatsapp;scheme=whatsapp;end`
      : `intent://send?text=${enc}#Intent;package=com.whatsapp;scheme=whatsapp;end`;

    try {
      const link = document.createElement('a');
      link.href = intentUrl;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 300);
      return;
    } catch {
      window.location.href = intentUrl;
      return;
    }
  }

  // في نظام iOS أو متصفحات سطح المكتب:
  // بروتوكول whatsapp:// يفتح تطبيق واتساب الأخضر الرسمي
  const regUrl = cleanPhone 
    ? `whatsapp://send?phone=${cleanPhone}&text=${enc}`
    : `whatsapp://send?text=${enc}`;

  try {
    const w = window.open(regUrl, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
      const webUrl = cleanPhone 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${enc}`
        : `https://api.whatsapp.com/send?text=${enc}`;
      window.open(webUrl, '_blank');
    }
  } catch {
    const webUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${enc}`
      : `https://api.whatsapp.com/send?text=${enc}`;
    window.open(webUrl, '_blank');
  }
};

export const handleWhatsAppSingleShare = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  type: CalculatorType;
  date: string;
  shopName?: string;
  previousBalance?: number;
  phone?: string;
}, isThermal: boolean = false) => {
  // 1. Download PDF in parallel
  downloadInvoicePDF(summary, isThermal);
  
  // 2. إرسال النص حصراً عبر واتساب الأخضر العادي
  const msg = buildWhatsAppInvoiceText(summary);
  openWhatsAppDirect(summary.phone, msg);
};

export const handleSMSSingleShare = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  receivedAmount?: number;
  shopName?: string;
  previousBalance?: number;
}) => {
  const text = buildSMSInvoiceText(summary);
  const enc = encodeURIComponent(text);
  window.open(`sms:?body=${enc}`, '_blank');
};

export const handleWhatsAppTextSingleShare = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  receivedAmount?: number;
  shopName?: string;
  previousBalance?: number;
  type?: any;
  date?: string;
  phone?: string;
}) => {
  const text = buildWhatsAppInvoiceText(summary);
  // إرسال النص حصراً عبر واتساب الأخضر العادي
  openWhatsAppDirect(summary.phone, text);
};

// Share WhatsApp full day report
export const handleWhatsAppReportShare = (report: any, history: SaleRecord[], customDate?: string) => {
  const today = customDate || new Date().toISOString().split('T')[0];
  const totalSalesCount = history.filter(s => s.date === today).reduce((sum, s) => sum + s.quantity, 0);
  
  let msg = `*📊 تقرير حركة المبيعات اليومي - ${getNetworkName()} 📊*\n`;
  msg += `*اليوم:* ${today}\n`;
  msg += `------------------------------------\n`;
  
  // Regular
  let hasReg = false;
  let regStr = `*💸 الكروت العادية:* \n`;
  INITIAL_PRICES[CalculatorType.REGULAR].forEach(p => {
    const stats = report[CalculatorType.REGULAR][p.id];
    if (stats && stats.quantity > 0) {
      regStr += `  ▫️ *فئة ${p.id}:* باع ${stats.quantity} | إجمالي ${stats.amount} ريال\n`;
      hasReg = true;
    }
  });
  if (hasReg) msg += regStr + `\n`;
  
  // Pro
  let hasPro = false;
  let proStr = `*⚡ كروت Pro:* \n`;
  INITIAL_PRICES[CalculatorType.PRO].forEach(p => {
    const stats = report[CalculatorType.PRO][p.id];
    if (stats && stats.quantity > 0) {
      proStr += `  ▫️ *فئة ${p.id}:* باع ${stats.quantity} | إجمالي ${stats.amount} ريال\n`;
      hasPro = true;
    }
  });
  if (hasPro) msg += proStr + `\n`;
  
  msg += `------------------------------------\n`;
  msg += `📦 *إجمالي الكروت المباعة:* ${totalSalesCount} كرت\n`;
  msg += `💵 *المبلغ المتسلم (كاش اليوم):* *${report.totalReceivedAmount || 0} ريال*\n`;
  msg += `📈 *المديونية المرتفعة (الآجل الجديد):* *${report.totalDebtIncreased || 0} ريال*\n`;
  
  if (report.shopsWhoBought && report.shopsWhoBought.length > 0) {
    msg += `🏪 *البقالات التي ابتاعت كروت:* \n`;
    report.shopsWhoBought.forEach((shopName: string) => {
      msg += `  ▫️ ${shopName}\n`;
    });
  }
  
  msg += `💰 *إجمالي قيمة مبيعات اليوم:* *${report.totalAmount} ريال يمني*\n`;
  msg += `------------------------------------\n`;
  msg += `📥 _تم استخراج ملف PDF مالي تفصيلي لحساب اليوم المجموع على جهازك!_`;

  downloadDailyReportPDF(report, history, today);
  
  // توجيه مشاركة تقرير اليوم لواتساب الأخضر العادي حصراً
  openWhatsAppDirect(undefined, msg);
};

// Share SMS full day report
export const handleSMSReportShare = (report: any, history: SaleRecord[]) => {
  const today = new Date().toISOString().split('T')[0];
  const totalSalesCount = history.filter(s => s.date === today).reduce((sum, s) => sum + s.quantity, 0);
  
  let text = `كشف اليوم مبيعات ${getNetworkName()} ${today}\n`;
  text += `إجمالي المبيعات: ${report.totalAmount} ريال\n`;
  text += `حجم الكروت: ${totalSalesCount} كروت\n`;
  
  const enc = encodeURIComponent(text);
  window.open(`sms:?body=${enc}`, '_blank');
};

export const drawAllShopsSummaryOnCanvas = (shopsData: { name: string; balance: number }[]): HTMLCanvasElement | null => {
  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4 Standard
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Luxury double thin border frame (Margins = 40px)
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
  ctx.strokeStyle = PDF_THEME.borderLight;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);

  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';

  // Header Banner Highlight & Luxury Top Accent Bar
  ctx.fillStyle = PDF_THEME.headerBg;
  ctx.fillRect(45, 45, canvasWidth - 90, 105);
  ctx.fillStyle = PDF_THEME.headerAccent;
  ctx.fillRect(45, 45, canvasWidth - 90, 4);

  // Title: strictly font size 25
  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(getNetworkName(), canvasWidth / 2, 75);

  // Subtitle: strictly 21
  ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.fillText('كشف الحساب الإجمالي وأرصدة البقالات والعملاء المعتمدين', canvasWidth / 2, 110);

  // Export Date & Metadata: 18-19
  ctx.font = `18px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  const nowStr = new Date().toLocaleString('ar-YE', { hour12: false });
  ctx.fillText(`تاريخ التصدير: ${nowStr}  |  الموزع: ${getDistributorName()}`, canvasWidth / 2, 138);

  // Separator Line
  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 155);
  ctx.lineTo(canvasWidth - 50, 155);
  ctx.stroke();

  // Table Coordinates
  const tableX = 50;
  const tableW = canvasWidth - 100; // 800
  let currentY = 175;
  const rowHeight = 40;

  // Header
  ctx.fillStyle = PDF_THEME.tableHeaderBg;
  ctx.fillRect(tableX, currentY, tableW, 44);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, currentY, tableW, 44);

  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(tableX + 60, currentY);
  ctx.lineTo(tableX + 60, currentY + 44);
  ctx.moveTo(tableX + 540, currentY);
  ctx.lineTo(tableX + 540, currentY + 44);
  ctx.stroke();

  ctx.fillStyle = PDF_THEME.tableHeaderColor;
  ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('م', tableX + 30, currentY + 22);
  ctx.textAlign = 'right';
  ctx.fillText('اسم البقالة / العميل', tableX + tableW - 20, currentY + 22);
  ctx.textAlign = 'center';
  ctx.fillText('الرصيد المتبقي (ريال يمني)', tableX + 300, currentY + 22);

  currentY += 44;
  let totalSum = 0;

  // Up to 18 rows on canvas
  const displayShops = shopsData.slice(0, 18);

  displayShops.forEach((shop, index) => {
    totalSum += shop.balance;

    ctx.fillStyle = index % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
    ctx.fillRect(tableX, currentY, tableW, rowHeight);

    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(tableX, currentY, tableW, rowHeight);

    ctx.beginPath();
    ctx.moveTo(tableX + 60, currentY);
    ctx.lineTo(tableX + 60, currentY + rowHeight);
    ctx.moveTo(tableX + 540, currentY);
    ctx.lineTo(tableX + 540, currentY + rowHeight);
    ctx.stroke();

    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `18px ${A4_FONT_FAMILY}`;

    // Index
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 1), tableX + 30, currentY + rowHeight / 2);

    // Name
    ctx.textAlign = 'right';
    ctx.fillText(shop.name, tableX + tableW - 20, currentY + rowHeight / 2);

    // Balance
    ctx.textAlign = 'center';
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    const balanceText = `${shop.balance.toLocaleString('en-US')} ريال`;
    ctx.fillText(balanceText, tableX + 300, currentY + rowHeight / 2);

    currentY += rowHeight;
  });

  // Total Summary Row
  currentY += 15;
  ctx.fillStyle = PDF_THEME.totalHighlightBg;
  ctx.fillRect(tableX, currentY, tableW, 48);

  ctx.strokeStyle = PDF_THEME.totalBorder;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(tableX, currentY, tableW, 48);

  ctx.beginPath();
  ctx.moveTo(tableX + 450, currentY);
  ctx.lineTo(tableX + 450, currentY + 48);
  ctx.stroke();

  ctx.fillStyle = PDF_THEME.primaryNavy;
  ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText('إجمالي الأرصدة والمديونية المستحقة:', tableX + tableW - 20, currentY + 24);

  ctx.textAlign = 'center';
  ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
  ctx.fillText(`${totalSum.toLocaleString('en-US')} ريال يمني`, tableX + 225, currentY + 24);

  // Signatures segment at bottom
  const signY = 1110;
  ctx.fillStyle = PDF_THEME.textSecondary;
  ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`توقيع وختم الوكيل المعتمد (${getDistributorName()}):`, canvasWidth - 70, signY);
  ctx.textAlign = 'left';
  ctx.fillText('توقيع المحاسب / المراجع المسؤول:', 70, signY);

  ctx.strokeStyle = PDF_THEME.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvasWidth - 70, signY + 30);
  ctx.lineTo(canvasWidth - 320, signY + 30);
  ctx.moveTo(70, signY + 30);
  ctx.lineTo(320, signY + 30);
  ctx.stroke();

  // Footer stamp note
  ctx.font = `18px ${A4_FONT_FAMILY}`;
  ctx.fillStyle = PDF_THEME.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText('تم استخراج هذا الكشف تلقائياً بموجب المطابقات المالية المحلية على الجهاز.', canvasWidth / 2, 1195);
  ctx.fillText(`${getNetworkName()} - خدمة متميزة وعمل مستمر هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1225);

  return canvas;
};

export const downloadAllShopsSummaryPDF = async (shopsData: { name: string; balance: number }[]) => {
  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4
  
  // 1. Filter: show only shops with non-zero balances (containing active debt/credit)
  const filteredShops = shopsData.filter(shop => shop.balance !== 0);

  // 2. Sort: descending by balance (highest debt first)
  filteredShops.sort((a, b) => b.balance - a.balance);

  const totalBalance = filteredShops.reduce((sum, s) => sum + s.balance, 0);

  const rowsPerPage = 18;
  const totalPages = Math.max(1, Math.ceil(filteredShops.length / rowsPerPage));
  const pages: HTMLCanvasElement[] = [];

  const tableX = 50;
  const tableW = canvasWidth - 100; // 800

  for (let p = 0; p < totalPages; p++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Luxury double frame (Margins = 40px)
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);

    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';

    // Header Banner Highlight & Luxury Top Accent Bar
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(45, 45, canvasWidth - 90, 105);
    ctx.fillStyle = PDF_THEME.headerAccent;
    ctx.fillRect(45, 45, canvasWidth - 90, 4);

    // Title: strictly font size 25
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(getNetworkName(), canvasWidth / 2, 75);

    // Subtitle: strictly 21
    ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText('كشف الحساب الإجمالي وأرصدة البقالات والعملاء المعتمدين', canvasWidth / 2, 110);

    // Date & page: strictly 18-19
    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    const nowStr = new Date().toLocaleString('ar-YE', { hour12: false });
    ctx.fillText(`تاريخ التصدير: ${nowStr}  |  الموزع: ${getDistributorName()}  |  صفحة ${p + 1} من ${totalPages}`, canvasWidth / 2, 138);

    // Separator Line
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 155);
    ctx.lineTo(canvasWidth - 50, 155);
    ctx.stroke();

    // Table
    let currentY = 175;
    const rowHeight = 40;

    // Table Header
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, currentY, tableW, 44);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, currentY, tableW, 44);

    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(tableX + 60, currentY);
    ctx.lineTo(tableX + 60, currentY + 44);
    ctx.moveTo(tableX + 540, currentY);
    ctx.lineTo(tableX + 540, currentY + 44);
    ctx.stroke();

    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('م', tableX + 30, currentY + 22);
    ctx.textAlign = 'right';
    ctx.fillText('اسم البقالة / العميل', tableX + tableW - 20, currentY + 22);
    ctx.textAlign = 'center';
    ctx.fillText('الرصيد المتبقي (ريال يمني)', tableX + 300, currentY + 22);

    currentY += 44;

    const pageShops = filteredShops.slice(p * rowsPerPage, (p + 1) * rowsPerPage);

    if (pageShops.length === 0 && p === 0) {
      ctx.fillStyle = PDF_THEME.tableRowEven;
      ctx.fillRect(tableX, currentY, tableW, rowHeight);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, rowHeight);
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `19px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('لا توجد حسابات أو أرصدة مستحقة مسجلة.', canvasWidth / 2, currentY + rowHeight / 2);
      currentY += rowHeight;
    } else {
      pageShops.forEach((shop, index) => {
        const globalIdx = p * rowsPerPage + index;

        ctx.fillStyle = index % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        ctx.fillRect(tableX, currentY, tableW, rowHeight);

        ctx.strokeStyle = PDF_THEME.borderLight;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tableX, currentY, tableW, rowHeight);

        ctx.beginPath();
        ctx.moveTo(tableX + 60, currentY);
        ctx.lineTo(tableX + 60, currentY + rowHeight);
        ctx.moveTo(tableX + 540, currentY);
        ctx.lineTo(tableX + 540, currentY + rowHeight);
        ctx.stroke();

        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `18px ${A4_FONT_FAMILY}`;

        // Index
        ctx.textAlign = 'center';
        ctx.fillText(String(globalIdx + 1), tableX + 30, currentY + rowHeight / 2);

        // Name
        ctx.textAlign = 'right';
        ctx.fillText(shop.name, tableX + tableW - 20, currentY + rowHeight / 2);

        // Balance
        ctx.textAlign = 'center';
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        const balanceText = `${shop.balance.toLocaleString('en-US')} ريال`;
        ctx.fillText(balanceText, tableX + 300, currentY + rowHeight / 2);

        currentY += rowHeight;
      });
    }

    // On final page, add summary row and signatures
    if (p === totalPages - 1) {
      currentY += 15;
      ctx.fillStyle = PDF_THEME.totalHighlightBg;
      ctx.fillRect(tableX, currentY, tableW, 48);

      ctx.strokeStyle = PDF_THEME.totalBorder;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(tableX, currentY, tableW, 48);

      ctx.beginPath();
      ctx.moveTo(tableX + 450, currentY);
      ctx.lineTo(tableX + 450, currentY + 48);
      ctx.stroke();

      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText('إجمالي الأرصدة والمديونية المستحقة:', tableX + tableW - 20, currentY + 24);

      ctx.textAlign = 'center';
      ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${totalBalance.toLocaleString('en-US')} ريال يمني`, tableX + 225, currentY + 24);
    }

    // Signatures
    const signY = 1110;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`توقيع وختم الوكيل المعتمد (${getDistributorName()}):`, canvasWidth - 70, signY);
    ctx.textAlign = 'left';
    ctx.fillText('توقيع المحاسب / المراجع المسؤول:', 70, signY);

    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 70, signY + 30);
    ctx.lineTo(canvasWidth - 320, signY + 30);
    ctx.moveTo(70, signY + 30);
    ctx.lineTo(320, signY + 30);
    ctx.stroke();

    // Footer
    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('تم استخراج هذا الكشف تلقائياً بموجب المطابقات المالية المحلية على الجهاز.', canvasWidth / 2, 1195);
    ctx.fillText(`${getNetworkName()} - خدمة متميزة وعمل مستمر هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1225);

    pages.push(canvas);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  pages.forEach((pCanvas, idx) => {
    if (idx > 0) doc.addPage('a4', 'p');
    const imgData = pCanvas.toDataURL('image/jpeg', 1.0);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  const now = new Date();
  const statementFileName = `كشف_أرصدة_البقالات_${now.getMonth() + 1}_${now.getDate()}.pdf`;
  doc.save(statementFileName);

  // Auto-save to native downloads if possible
  try {
    const pdfDataUri = doc.output('datauristring');
    saveFileToKrotFolder(statementFileName, pdfDataUri, true, true);
  } catch (err) {
    console.log('Native file saving skipped or not available:', err);
  }

  return { success: true, native: false, fileName: statementFileName };
};

export const downloadPeriodReportPDF = async (params: {
  reportType: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  distributorName: string;
  networkName: string;
  cardSales: { label: string; quantity: number; total: number }[];
  groceriesPerformance: { name: string; isPro: boolean; q100: number; q200: number; q250: number; q300: number; q500: number; total: number }[];
  newGroceries: string[];
  inactiveGroceries: string[];
  financials: { totalSales: number; totalCollected: number; totalDebt: number };
}) => {
  const {
    reportType,
    startDate,
    endDate,
    distributorName,
    networkName,
    cardSales,
    groceriesPerformance,
    newGroceries,
    inactiveGroceries,
    financials
  } = params;

  // 1. Try Native capacitor plugin if supported
  if (typeof LocalContacts?.generatePdfReport === 'function') {
    try {
      const result = await LocalContacts.generatePdfReport({
        reportType,
        startDate,
        endDate,
        distributorName,
        networkName,
        cardSales,
        groceriesPerformance,
        newGroceries,
        inactiveGroceries,
        financials
      });
      if (result && result.success) {
        return { success: true, native: true, fileName: result.fileName };
      }
    } catch (err) {
      console.log('Native PDF report failed or unavailable, falling back to multi-page Canvas/jsPDF:', err);
    }
  }

  // 2. HTML5 Canvas & Multi-page jsPDF Fallback (Web view)
  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4 Standard

  const createPageCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Luxury double-border official layout frame (Margins = 40px)
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);

      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';
    }
    return { canvas, ctx };
  };

  const drawCommonHeader = (ctx: CanvasRenderingContext2D, title: string, subtitle: string, pageNum: number) => {
    // Header Banner Highlight & Luxury Top Accent Bar
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(45, 45, canvasWidth - 90, 105);
    ctx.fillStyle = PDF_THEME.headerAccent;
    ctx.fillRect(45, 45, canvasWidth - 90, 4);

    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(networkName || getNetworkName(), canvasWidth / 2, 75);

    ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.fillText(title, canvasWidth / 2, 110);

    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.fillText(subtitle, canvasWidth / 2, 138);

    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 155);
    ctx.lineTo(canvasWidth - 50, 155);
    ctx.stroke();
  };

  const drawCommonFooter = (ctx: CanvasRenderingContext2D, pageNum: number) => {
    const signY = 1110;
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`توقيع وختم الوكيل المعتمد (${distributorName || getDistributorName()}):`, canvasWidth - 70, signY);
    ctx.textAlign = 'left';
    ctx.fillText('توقيع المحاسب / الإدارة:', 70, signY);

    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 70, signY + 30);
    ctx.lineTo(canvasWidth - 320, signY + 30);
    ctx.moveTo(70, signY + 30);
    ctx.lineTo(320, signY + 30);
    ctx.stroke();

    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(`صفحة ${pageNum} من 3  |  ${networkName || getNetworkName()}  |  هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1205);
  };

  const tableX = 50;
  const tableW = canvasWidth - 100; // 800

  // --- Page 1: Card Sales Summary ---
  const page1 = createPageCanvas();
  if (page1.ctx) {
    const ctx = page1.ctx;
    const titleText = `تقرير مبيعات الكروت الموحد - ${reportType === 'weekly' ? 'أسبوعي' : 'شهري'}`;
    const subText = `الموزع: ${distributorName}  |  الفترة: من ${startDate} إلى ${endDate}`;
    drawCommonHeader(ctx, titleText, subText, 1);

    // Table Header
    let currentY = 175;
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, currentY, tableW, 44);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, currentY, tableW, 44);

    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(tableX + 480, currentY);
    ctx.lineTo(tableX + 480, currentY + 44);
    ctx.moveTo(tableX + 240, currentY);
    ctx.lineTo(tableX + 240, currentY + 44);
    ctx.stroke();

    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("فئة الكرت الكلية", tableX + tableW - 20, currentY + 22);
    ctx.textAlign = 'center';
    ctx.fillText("الكمية المباعة (كرت)", tableX + 360, currentY + 22);
    ctx.textAlign = 'center';
    ctx.fillText("إجمالي المبيعات (ريال)", tableX + 120, currentY + 22);

    currentY += 44;
    const rowHeight = 40;
    let totalQty = 0;
    let totalRev = 0;

    cardSales.forEach((item, idx) => {
      totalQty += item.quantity;
      totalRev += item.total;

      ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
      ctx.fillRect(tableX, currentY, tableW, rowHeight);

      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, rowHeight);

      ctx.beginPath();
      ctx.moveTo(tableX + 480, currentY);
      ctx.lineTo(tableX + 480, currentY + rowHeight);
      ctx.moveTo(tableX + 240, currentY);
      ctx.lineTo(tableX + 240, currentY + rowHeight);
      ctx.stroke();

      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText(item.label, tableX + tableW - 20, currentY + rowHeight / 2);

      ctx.textAlign = 'center';
      ctx.fillText(String(item.quantity), tableX + 360, currentY + rowHeight / 2);

      ctx.textAlign = 'center';
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${item.total.toLocaleString('ar-YE')} ريال`, tableX + 120, currentY + rowHeight / 2);

      currentY += rowHeight;
    });

    // Totals Row
    currentY += 15;
    ctx.fillStyle = PDF_THEME.totalHighlightBg;
    ctx.fillRect(tableX, currentY, tableW, 48);

    ctx.strokeStyle = PDF_THEME.totalBorder;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(tableX, currentY, tableW, 48);

    ctx.beginPath();
    ctx.moveTo(tableX + 480, currentY);
    ctx.lineTo(tableX + 480, currentY + 48);
    ctx.moveTo(tableX + 240, currentY);
    ctx.lineTo(tableX + 240, currentY + 48);
    ctx.stroke();

    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("الإجـمـالـي العـام لكروت الفترة:", tableX + tableW - 20, currentY + 24);

    ctx.textAlign = 'center';
    ctx.fillText(String(totalQty), tableX + 360, currentY + 24);

    ctx.textAlign = 'center';
    ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
    ctx.fillText(`${totalRev.toLocaleString('ar-YE')} ريال`, tableX + 120, currentY + 24);

    drawCommonFooter(ctx, 1);
  }

  // --- Page 2: Detailed Grocery Performance Table ---
  const page2 = createPageCanvas();
  if (page2.ctx) {
    const ctx = page2.ctx;
    const titleText = "جدول أداء البقالات والعملاء التفصيلي";
    const subText = `الفترة: من ${startDate} إلى ${endDate}  |  الموزع: ${distributorName}`;
    drawCommonHeader(ctx, titleText, subText, 2);

    let currentY = 175;
    const rowHeight = 36;

    // Table Header
    ctx.fillStyle = PDF_THEME.tableHeaderBg;
    ctx.fillRect(tableX, currentY, tableW, 42);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, currentY, tableW, 42);

    ctx.fillStyle = PDF_THEME.tableHeaderColor;
    ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("اسم البقالة / العميل", tableX + tableW - 15, currentY + 21);

    ctx.textAlign = 'center';
    ctx.fillText("100", tableX + 540, currentY + 21);
    ctx.fillText("200", tableX + 470, currentY + 21);
    ctx.fillText("250", tableX + 400, currentY + 21);
    ctx.fillText("300", tableX + 330, currentY + 21);
    ctx.fillText("500", tableX + 260, currentY + 21);

    ctx.textAlign = 'center';
    ctx.fillText("المبلغ الإجمالي", tableX + 110, currentY + 21);

    currentY += 42;

    let sum100 = 0, sum200 = 0, sum250 = 0, sum300 = 0, sum500 = 0, sumTotal = 0;

    groceriesPerformance.forEach((item, idx) => {
      if (currentY > 1050) return; // Prevent overflow on single sheet

      sum100 += item.q100 || 0;
      sum200 += item.q200 || 0;
      sum250 += item.q250 || 0;
      sum300 += item.q300 || 0;
      sum500 += item.q500 || 0;
      sumTotal += item.total || 0;

      ctx.fillStyle = idx % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
      ctx.fillRect(tableX, currentY, tableW, rowHeight);

      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tableX, currentY, tableW, rowHeight);

      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      const displayName = item.isPro ? `⭐ ${item.name} [PRO]` : item.name;
      ctx.fillText(displayName, tableX + tableW - 15, currentY + rowHeight / 2);

      ctx.textAlign = 'center';
      ctx.fillText(item.q100 > 0 ? String(item.q100) : "-", tableX + 540, currentY + rowHeight / 2);
      ctx.fillText(item.q200 > 0 ? String(item.q200) : "-", tableX + 470, currentY + rowHeight / 2);
      ctx.fillText(item.q250 > 0 ? String(item.q250) : "-", tableX + 400, currentY + rowHeight / 2);
      ctx.fillText(item.q300 > 0 ? String(item.q300) : "-", tableX + 330, currentY + rowHeight / 2);
      ctx.fillText(item.q500 > 0 ? String(item.q500) : "-", tableX + 260, currentY + rowHeight / 2);

      ctx.textAlign = 'center';
      ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
      ctx.fillText(`${item.total.toLocaleString('ar-YE')} ريال`, tableX + 110, currentY + rowHeight / 2);

      currentY += rowHeight;
    });

    // Totals Row
    ctx.fillStyle = PDF_THEME.totalHighlightBg;
    ctx.fillRect(tableX, currentY, tableW, 42);

    ctx.strokeStyle = PDF_THEME.totalBorder;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(tableX, currentY, tableW, 42);

    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("إجمالي المسحوبات للبقالات:", tableX + tableW - 15, currentY + 21);

    ctx.textAlign = 'center';
    ctx.fillText(String(sum100), tableX + 540, currentY + 21);
    ctx.fillText(String(sum200), tableX + 470, currentY + 21);
    ctx.fillText(String(sum250), tableX + 400, currentY + 21);
    ctx.fillText(String(sum300), tableX + 330, currentY + 21);
    ctx.fillText(String(sum500), tableX + 260, currentY + 21);

    ctx.textAlign = 'center';
    ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
    ctx.fillText(`${sumTotal.toLocaleString('ar-YE')} ريال`, tableX + 110, currentY + 21);

    drawCommonFooter(ctx, 2);
  }

  // --- Page 3: Insights & Financial Metrics Dashboard ---
  const page3 = createPageCanvas();
  if (page3.ctx) {
    const ctx = page3.ctx;
    const titleText = "لوحة المؤشرات والتحليلات والمالية الموحدة";
    const subText = `الفترة: من ${startDate} إلى ${endDate}  |  المؤشرات والركود والأداء العام`;
    drawCommonHeader(ctx, titleText, subText, 3);

    // Card 1: New Groceries Box
    ctx.fillStyle = PDF_THEME.headerBg;
    ctx.fillRect(tableX, 180, tableW, 130);
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, 180, tableW, 130);

    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("✨ البقالات والعملاء المشتركون حديثاً في الفترة (العملاء الجدد):", tableX + tableW - 20, 205);

    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.textSecondary;
    let itemY = 235;
    if (newGroceries.length === 0) {
      ctx.fillText("لم يتم رصد أو تسجيل أي بقالات جديدة في هذا النطاق الزمني.", tableX + tableW - 20, itemY);
    } else {
      newGroceries.forEach((name, i) => {
        if (i < 3) {
          ctx.fillText(`• ${name} (تم تأسيس الحساب وبدء النشاط والفوترة بنجاح)`, tableX + tableW - 20, itemY);
          itemY += 28;
        }
      });
    }

    // Card 2: Inactive Groceries Box
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(tableX, 330, tableW, 130);
    ctx.strokeStyle = '#fde68a';
    ctx.strokeRect(tableX, 330, tableW, 130);

    ctx.fillStyle = '#92400e';
    ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("⚠️ تنبيهات الركود والتحصيل (بقالات خاملة بدون سحب أو سداد منذ 5 أيام أو أكثر):", tableX + tableW - 20, 355);

    ctx.font = `18px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = '#78350f';
    let itemY2 = 385;
    if (inactiveGroceries.length === 0) {
      ctx.fillText("رائع! لا يوجد أي ركود، كل البقالات والعملاء لديهم عمليات مستمرة.", tableX + tableW - 20, itemY2);
    } else {
      inactiveGroceries.forEach((info, i) => {
        if (i < 3) {
          ctx.fillText(`• ${info}`, tableX + tableW - 20, itemY2);
          itemY2 += 28;
        }
      });
    }

    // Card 3: Financial Summary Box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tableX, 480, tableW, 400);
    ctx.strokeStyle = PDF_THEME.borderSoft;
    ctx.strokeRect(tableX, 480, tableW, 400);

    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("📊 الملخص المالي والتحليلي العام للفترة المحددة:", tableX + tableW - 20, 515);

    // Total Sales Sub-Card
    ctx.fillStyle = PDF_THEME.totalHighlightBg;
    ctx.fillRect(tableX + 25, 540, tableW - 50, 95);
    ctx.strokeStyle = PDF_THEME.borderLight;
    ctx.strokeRect(tableX + 25, 540, tableW - 50, 95);
    ctx.fillStyle = PDF_THEME.textSecondary;
    ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
    ctx.fillText("إجمالي قيمة المبيعات خلال الفترة المحددة (ريال يمني)", tableX + tableW - 45, 570);
    ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = PDF_THEME.primaryNavy;
    ctx.textAlign = 'left';
    ctx.fillText(`${financials.totalSales.toLocaleString('ar-YE')} ريال`, tableX + 45, 605);

    // Total Collected Sub-Card
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(tableX + 25, 650, tableW - 50, 95);
    ctx.strokeStyle = '#a7f3d0';
    ctx.strokeRect(tableX + 25, 650, tableW - 50, 95);
    ctx.fillStyle = '#065f46';
    ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("إجمالي المبالغ المحصلة والمقبوضة (كاش فوري + دفعات سداد المديونية)", tableX + tableW - 45, 680);
    ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = '#047857';
    ctx.textAlign = 'left';
    ctx.fillText(`${financials.totalCollected.toLocaleString('ar-YE')} ريال`, tableX + 45, 715);

    // Total Debt Sub-Card
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(tableX + 25, 760, tableW - 50, 95);
    ctx.strokeStyle = '#fecaca';
    ctx.strokeRect(tableX + 25, 760, tableW - 50, 95);
    ctx.fillStyle = '#991b1b';
    ctx.font = `bold 18px ${A4_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText("صافي المديونية الجديدة المتراكمة للفترة المحددة", tableX + tableW - 45, 790);
    ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
    ctx.fillStyle = '#b91c1c';
    ctx.textAlign = 'left';
    ctx.fillText(`${financials.totalDebt.toLocaleString('ar-YE')} ريال`, tableX + 45, 825);

    drawCommonFooter(ctx, 3);
  }

  // Draw into jsPDF Document
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Page 1
  const imgData1 = page1.canvas.toDataURL('image/jpeg', 1.0);
  pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);
  
  // Page 2
  pdf.addPage('a4', 'p');
  const imgData2 = page2.canvas.toDataURL('image/jpeg', 1.0);
  pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297);
  
  // Page 3
  pdf.addPage('a4', 'p');
  const imgData3 = page3.canvas.toDataURL('image/jpeg', 1.0);
  pdf.addImage(imgData3, 'JPEG', 0, 0, 210, 297);
  
  const reportFileName = `تقرير_حسابي_${reportType === 'weekly' ? 'أسبوعي' : 'شهري'}_${Date.now()}.pdf`;
  pdf.save(reportFileName);
  
  return { success: true, native: false, fileName: reportFileName };
};

export const generateRegionalReport = async (data: Array<{ name: string; debt: number; region: string }>) => {
  // 1. Group by region and sort descending by debt within each region
  const regionsMap: Record<string, typeof data> = {};
  data.forEach(item => {
    const reg = (item.region || 'غير محددة').trim();
    if (!regionsMap[reg]) {
      regionsMap[reg] = [];
    }
    regionsMap[reg].push(item);
  });

  // Sort each region descending by debt
  Object.keys(regionsMap).forEach(reg => {
    regionsMap[reg].sort((a, b) => b.debt - a.debt);
  });

  const canvasWidth = 900;
  const canvasHeight = 1273; // True A4 Standard
  const regions = Object.keys(regionsMap);
  const pages: HTMLCanvasElement[] = [];

  const tableX = 50;
  const tableW = canvasWidth - 100; // 800

  regions.forEach((region, rIdx) => {
    const regionData = regionsMap[region];
    const networkName = getNetworkName();
    const distributorName = getDistributorName();
    const totalRegionDebt = regionData.reduce((sum, s) => sum + s.debt, 0);

    const rowsPerPage = 18;
    const regPages = Math.max(1, Math.ceil(regionData.length / rowsPerPage));

    for (let p = 0; p < regPages; p++) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // Pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Luxury double thin frame (Margins = 40px)
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);
      ctx.strokeStyle = PDF_THEME.borderLight;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(44, 44, canvasWidth - 88, canvasHeight - 88);

      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';

      // Header Banner Highlight & Luxury Top Accent Bar
      ctx.fillStyle = PDF_THEME.headerBg;
      ctx.fillRect(45, 45, canvasWidth - 90, 105);
      ctx.fillStyle = PDF_THEME.headerAccent;
      ctx.fillRect(45, 45, canvasWidth - 90, 4);

      // Title: strictly font size 25
      ctx.fillStyle = PDF_THEME.primaryNavy;
      ctx.font = `bold 25px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(networkName, canvasWidth / 2, 75);

      // Subtitle: strictly 21
      ctx.font = `bold 21px ${A4_FONT_FAMILY}`;
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.fillText(`تقرير ديون البقالات - منطقة ${region}`, canvasWidth / 2, 110);

      // Metadata: strictly 18-19
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      ctx.fillStyle = PDF_THEME.textMuted;
      ctx.fillText(`الشبكة: ${networkName}  |  الموزع: ${distributorName}  |  تاريخ التصدير: ${new Date().toLocaleDateString('ar-YE')}`, canvasWidth / 2, 138);

      // Separator Line
      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 155);
      ctx.lineTo(canvasWidth - 50, 155);
      ctx.stroke();

      // Table
      let currentY = 175;
      const rowHeight = 40;

      // Table Header
      ctx.fillStyle = PDF_THEME.tableHeaderBg;
      ctx.fillRect(tableX, currentY, tableW, 44);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, currentY, tableW, 44);

      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(tableX + 60, currentY);
      ctx.lineTo(tableX + 60, currentY + 44);
      ctx.moveTo(tableX + 540, currentY);
      ctx.lineTo(tableX + 540, currentY + 44);
      ctx.stroke();

      ctx.fillStyle = PDF_THEME.tableHeaderColor;
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('م', tableX + 30, currentY + 22);
      ctx.textAlign = 'right';
      ctx.fillText('اسم البقالة / العميل', tableX + tableW - 20, currentY + 22);
      ctx.textAlign = 'center';
      ctx.fillText('المديونية المستحقة (ريال يمني)', tableX + 300, currentY + 22);

      currentY += 44;

      const pageShops = regionData.slice(p * rowsPerPage, (p + 1) * rowsPerPage);

      pageShops.forEach((shop, index) => {
        const globalIdx = p * rowsPerPage + index;

        ctx.fillStyle = index % 2 === 0 ? PDF_THEME.tableRowEven : PDF_THEME.tableRowOdd;
        ctx.fillRect(tableX, currentY, tableW, rowHeight);

        ctx.strokeStyle = PDF_THEME.borderLight;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tableX, currentY, tableW, rowHeight);

        ctx.beginPath();
        ctx.moveTo(tableX + 60, currentY);
        ctx.lineTo(tableX + 60, currentY + rowHeight);
        ctx.moveTo(tableX + 540, currentY);
        ctx.lineTo(tableX + 540, currentY + rowHeight);
        ctx.stroke();

        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `18px ${A4_FONT_FAMILY}`;

        // Index
        ctx.textAlign = 'center';
        ctx.fillText(String(globalIdx + 1), tableX + 30, currentY + rowHeight / 2);

        // Name
        ctx.textAlign = 'right';
        ctx.fillText(shop.name, tableX + tableW - 20, currentY + rowHeight / 2);

        // Debt
        ctx.textAlign = 'center';
        ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
        ctx.fillText(`${shop.debt.toLocaleString('en-US')} ريال`, tableX + 300, currentY + rowHeight / 2);

        currentY += rowHeight;
      });

      // On final page of region, draw summary row
      if (p === regPages - 1) {
        currentY += 15;
        ctx.fillStyle = PDF_THEME.totalHighlightBg;
        ctx.fillRect(tableX, currentY, tableW, 48);

        ctx.strokeStyle = PDF_THEME.totalBorder;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(tableX, currentY, tableW, 48);

        ctx.beginPath();
        ctx.moveTo(tableX + 450, currentY);
        ctx.lineTo(tableX + 450, currentY + 48);
        ctx.stroke();

        ctx.fillStyle = PDF_THEME.primaryNavy;
        ctx.font = `bold 20px ${A4_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText('إجمالي مديونية المنطقة:', tableX + tableW - 20, currentY + 24);

        ctx.textAlign = 'center';
        ctx.font = `bold 22px ${A4_FONT_FAMILY}`;
        ctx.fillText(`${totalRegionDebt.toLocaleString('en-US')} ريال يمني`, tableX + 225, currentY + 24);
      }

      // Signatures
      const signY = 1110;
      ctx.fillStyle = PDF_THEME.textSecondary;
      ctx.font = `bold 19px ${A4_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText(`توقيع وختم الوكيل المعتمد (${distributorName}):`, canvasWidth - 70, signY);
      ctx.textAlign = 'left';
      ctx.fillText('توقيع المحاسب / المراجع المسؤول:', 70, signY);

      ctx.strokeStyle = PDF_THEME.borderSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvasWidth - 70, signY + 30);
      ctx.lineTo(canvasWidth - 320, signY + 30);
      ctx.moveTo(70, signY + 30);
      ctx.lineTo(320, signY + 30);
      ctx.stroke();

      // Footer
      ctx.font = `18px ${A4_FONT_FAMILY}`;
      ctx.fillStyle = PDF_THEME.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(`صفحة ${pages.length + 1}  |  ${networkName || getNetworkName()}  |  هاتف: ${getDistributorPhone()}`, canvasWidth / 2, 1205);

      pages.push(canvas);
    }
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  pages.forEach((pCanvas, idx) => {
    if (idx > 0) doc.addPage('a4', 'p');
    const imgData = pCanvas.toDataURL('image/jpeg', 1.0);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  const fileName = `تقرير_المناطق_الموزعة_${Date.now()}.pdf`;
  doc.save(fileName);

  // Also auto-save to device folder on mobile
  try {
    const pdfDataUri = doc.output('datauristring');
    saveFileToKrotFolder(fileName, pdfDataUri, true, true);
  } catch (err) {
    console.log('Native file saving skipped or not available:', err);
  }

  return { success: true, fileName };
};
