import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Download, 
  Phone, 
  Info, 
  CalendarDays, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  UserPlus, 
  Coins, 
  Package, 
  ShoppingCart, 
  RotateCcw,
  Search,
  X,
  Printer,
  MessageCircle,
  Copy,
  Share2,
  Edit3,
  Gift
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { AgentAccount, AgentTransaction, SaleRecord, WholesaleBonusRecord } from '../types';
import { getNetworkName, getDistributorName, getDistributorPhone, drawDahshahLogo, openWhatsAppDirect } from '../utils/invoiceHelpers';
import { AgentStatementModal } from './AgentStatementModal';
import { calculateWholesaleBonusCards, buildWholesaleBonusRecords } from '../utils/wholesaleMarginRules';

// السعر العادي للكروت: فئة 100: 85, فئة 200: 170, فئة 250: 210, فئة 300: 260, فئة 500: 420
export const DEFAULT_CARD_MARKET_VALUE: Record<number, number> = {
  100: 85,
  200: 170,
  250: 210,
  300: 260,
  500: 420
};

interface PurchasesPageProps {
  agents: AgentAccount[];
  setAgents: React.Dispatch<React.SetStateAction<AgentAccount[]>>;
  salesHistory: SaleRecord[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Draw Purchase Invoice on Canvas (POS Thermal Mode + Modern Colored Mode)
export const drawPurchaseInvoiceOnCanvas = (summary: {
  items: { label: string; category: number; quantity: number; price: number; total: number }[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  agentName: string;
  agentPhone?: string;
  previousBalance?: number;
  currentBalance?: number;
  invoiceNum?: string;
  transactionId?: string;
}, isThermal: boolean = false): HTMLCanvasElement | null => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const items = summary.items;
  const headerHeight = 165;
  const itemRowHeight = 42;
  const footerHeight = 225;
  const canvasWidth = 500;
  const canvasHeight = headerHeight + (items.length * itemRowHeight) + footerHeight;
  
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

    drawDahshahLogo(ctx, 22, 23, 140, 72, true);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    
    ctx.textAlign = 'right';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(getNetworkName(), canvasWidth - 30, 46);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('فاتورة شراء كروت اتصالات وموزعين', canvasWidth - 30, 73);
    
    drawDashLine(100);
    
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`التاريخ: ${summary.date}  |  رقم الفاتورة: ${summary.invoiceNum || 'بدون رقم'}`, canvasWidth - 30, 118);
    
    ctx.textAlign = 'left';
    ctx.fillText(`الوكيل: ${summary.agentName}`, 30, 118);
    
    drawDashLine(135);
    
    let currentY = 158;
    
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
    ctx.fillText('إجمالي قيمة الفاتورة:', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillText(`${summary.totalAmount} ريال`, 40, currentY);
    
    currentY += 25;
    ctx.textAlign = 'right';
    ctx.fillText('المبلغ المدفوع (الواصل):', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillText(`${summary.paidAmount} ريال`, 40, currentY);
    
    const invoiceRemaining = summary.totalAmount - summary.paidAmount;
    currentY += 25;
    ctx.textAlign = 'right';
    ctx.fillText(invoiceRemaining >= 0 ? 'المتبقي من الفاتورة (آجل):' : 'المتبقي من الفاتورة (له):', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.abs(invoiceRemaining)} ريال`, 40, currentY);

    const prevBal = summary.previousBalance ?? 0;
    if (prevBal !== 0) {
      currentY += 25;
      ctx.textAlign = 'right';
      ctx.fillText(prevBal > 0 ? 'الرصيد السابق المستحق للوكيل مسبقاً:' : 'الرصيد السابق للوكيل (له):', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.abs(prevBal)} ريال`, 40, currentY);
    }

    const grandTotalBalance = prevBal + invoiceRemaining;
    currentY += 25;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(grandTotalBalance > 0 ? 'صافي الحساب والمديونية للوكيل علينا:' : grandTotalBalance < 0 ? 'صافي رصيد الوكيل الحالي علينا:' : 'صافي الحساب الجاري للوكيل علينا:', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillText(grandTotalBalance === 0 ? 'خالص مسدد بالكامل' : `${Math.abs(grandTotalBalance)} ريال`, 40, currentY);
    
    currentY += 20;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    drawDashLine(currentY);
    currentY += 28;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('الوكيل المورد: ' + summary.agentName + ' - هاتف: ' + (summary.agentPhone || 'لا يوجد'), canvasWidth / 2, currentY);
    currentY += 20;
    ctx.font = '10px sans-serif';
    ctx.fillText('نشكر ثقتكم بنا - نظام كروت ' + getNetworkName(), canvasWidth / 2, currentY);
  } else {
    // --- Modern Colored Digital Invoice Style ---
    ctx.strokeStyle = '#3b82f6'; // Blue border
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
    
    // Header gradient fill
    const gradient = ctx.createLinearGradient(12, 12, canvasWidth - 12, 95);
    gradient.addColorStop(0, '#1e3a8a'); // deep blue
    gradient.addColorStop(1, '#3b82f6'); // light blue
    ctx.fillStyle = gradient;
    ctx.fillRect(12, 12, canvasWidth - 24, 83);
    
    drawDahshahLogo(ctx, 22, 23, 140, 72, false);
    
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    
    ctx.textAlign = 'right';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText(getNetworkName(), canvasWidth - 30, 40);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('فاتورة شراء وتوريد كروت شبكة معتمدة', canvasWidth - 30, 68);
    
    // Meta section background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(12, 95, canvasWidth - 24, 45);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`التاريخ: ${summary.date}  |  رقم الفاتورة: ${summary.invoiceNum || 'بدون رقم'}`, canvasWidth - 30, 118);
    
    ctx.textAlign = 'left';
    ctx.fillText(`الوكيل المورد: ${summary.agentName}`, 30, 118);
    
    let currentY = 175;
    
    // Table Headers
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(25, 148, canvasWidth - 50, 26);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الرقم', 450, currentY - 13);
    ctx.fillText('تفاصيل الفئة كرت', 320, currentY - 13);
    ctx.fillText('سعر الشراء', 205, currentY - 13);
    ctx.fillText('الكمية', 135, currentY - 13);
    ctx.fillText('اجمالي المبلغ', 65, currentY - 13);
    
    // Table Rows
    currentY = 198;
    items.forEach((item, idx) => {
      // Row alternate background
      if (idx % 2 === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(25, currentY - 15, canvasWidth - 50, itemRowHeight);
      }
      
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1), 450, currentY);
      ctx.fillText(item.label, 320, currentY);
      ctx.fillText(`${item.price} ريال`, 205, currentY);
      ctx.fillText(String(item.quantity), 135, currentY);
      
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.fillText(`${item.total} ريال`, 65, currentY);
      
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(25, currentY + 20);
      ctx.lineTo(canvasWidth - 25, currentY + 20);
      ctx.stroke();
      
      currentY += itemRowHeight;
    });
    
    // Total summaries
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(25, currentY - 10, canvasWidth - 50, footerHeight - 90);
    
    currentY += 15;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('إجمالي قيمة الفاتورة المشتراة:', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2563eb';
    ctx.fillText(`${summary.totalAmount} ريال يمني`, 40, currentY);
    
    currentY += 24;
    ctx.fillStyle = '#1e293b';
    ctx.fillText('المبلغ المدفوع (الواصل):', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#16a34a';
    ctx.fillText(`${summary.paidAmount} ريال`, 40, currentY);
    
    const invoiceRemaining = summary.totalAmount - summary.paidAmount;
    currentY += 24;
    ctx.fillStyle = '#1e293b';
    ctx.fillText('المتبقي من الفاتورة (آجل):', canvasWidth - 40, currentY);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`${Math.abs(invoiceRemaining)} ريال`, 40, currentY);

    const prevBal = summary.previousBalance ?? 0;
    if (prevBal !== 0) {
      currentY += 24;
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.fillText(prevBal > 0 ? 'الرصيد السابق المستحق للوكيل مسبقاً:' : 'رصيد الوكيل السابق (له مسبقاً):', canvasWidth - 40, currentY);
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.abs(prevBal)} ريال`, 40, currentY);
    }

    const grandTotalBalance = prevBal + invoiceRemaining;
    currentY += 26;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(25, currentY - 15, canvasWidth - 50, 26);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(grandTotalBalance > 0 ? 'صافي الحساب والمديونية الكلية للوكيل علينا:' : grandTotalBalance < 0 ? 'صافي رصيد الوكيل الحالي علينا:' : 'صافي الحساب الكلي للوكيل علينا:', canvasWidth - 40, currentY - 2);
    ctx.textAlign = 'left';
    ctx.fillText(grandTotalBalance === 0 ? 'خالص مسدد' : `${Math.abs(grandTotalBalance)} ريال يمني`, 40, currentY - 2);
    
    currentY += 32;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, currentY);
    ctx.lineTo(canvasWidth - 30, currentY);
    ctx.stroke();
    
    currentY += 20;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الوكيل المورد: ' + summary.agentName + ' - للتواصل والاتصال: ' + (summary.agentPhone || 'لا يوجد هاتف'), canvasWidth / 2, currentY);
    currentY += 15;
    ctx.fillText('نظام كروت وحسابات شبكة ' + getNetworkName() + ' المتكامل', canvasWidth / 2, currentY);
  }
  
  return canvas;
};

const downloadPurchaseInvoicePDF = (summary: any, isThermal: boolean = false) => {
  const canvas = drawPurchaseInvoiceOnCanvas(summary, isThermal);
  if (!canvas) return;
  
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const pdfWidth = canvasWidth * 0.264583; // px to mm conversion
  const pdfHeight = canvasHeight * 0.264583;
  
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'l' : 'p',
    unit: 'mm',
    format: [pdfWidth, pdfHeight]
  });
  
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  
  const fileName = `فاتورة شراء - ${summary.agentName} - ${summary.date}.pdf`;
  pdf.save(fileName);
};

const downloadPurchaseInvoicePNG = (summary: any, isThermal: boolean = false) => {
  const canvas = drawPurchaseInvoiceOnCanvas(summary, isThermal);
  if (!canvas) return;
  
  const imgData = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.setAttribute('href', imgData);
  
  const fileName = `فاتورة شراء - ${summary.agentName} - ${summary.date}.png`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const PurchasesPage: React.FC<PurchasesPageProps> = ({
  agents,
  setAgents,
  salesHistory,
  showToast
}) => {
  // Navigation & View States
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<AgentTransaction | null>(null);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementModalAgent, setStatementModalAgent] = useState<AgentAccount | null>(null);
  const [agentSearch, setAgentSearch] = useState('');
  const [isThermalMode, setIsThermalMode] = useState(false);

  // Form States - Add Agent
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentDesc, setNewAgentDesc] = useState('');

  // Form States - Add Purchase
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<number, number>>({
    100: 0, 200: 0, 250: 0, 300: 0, 500: 0
  });
  const [purchaseCosts, setPurchaseCosts] = useState<Record<number, number>>({
    100: 80, 200: 160, 250: 200, 300: 240, 500: 400
  });
  const [purchasePaidAmount, setPurchasePaidAmount] = useState<number | string>('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseInvoiceNum, setPurchaseInvoiceNum] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form States - Add Payment (سند)
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form States - Edit Agent
  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentAccount | null>(null);
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentPhone, setEditAgentPhone] = useState('');
  const [editAgentDesc, setEditAgentDesc] = useState('');

  // Form States - Edit Transaction
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<AgentTransaction | null>(null);
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxInvoiceNum, setEditTxInvoiceNum] = useState('');
  const [editTxNotes, setEditTxNotes] = useState('');
  const [editTxAmount, setEditTxAmount] = useState<number | string>('');
  const [editTxQuantities, setEditTxQuantities] = useState<Record<number, number>>({ 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 });
  const [editTxCosts, setEditTxCosts] = useState<Record<number, number>>({ 100: 80, 200: 160, 250: 200, 300: 240, 500: 400 });

  // Auto wholesale bonus cards computation based on exact business rules:
  // 560 cards -> +15 bonus of same cat
  // 280 cards -> +7 of same cat (+1 cat 100 for 200/250/300, +1 cat 250 for 500)
  // Multiples of 40 -> +1 bonus of same cat
  // Evaluated at regular selling prices (السعر العادي)
  const autoBonusBreakdown = useMemo(() => {
    const items = [100, 200, 250, 300, 500]
      .map(cat => ({ category: cat, quantity: purchaseQuantities[cat] || 0 }))
      .filter(i => i.quantity > 0);
    return calculateWholesaleBonusCards(items);
  }, [purchaseQuantities]);

  const totalAutoBonusCards = useMemo(() => {
    return autoBonusBreakdown.reduce((sum, b) => sum + b.quantity, 0);
  }, [autoBonusBreakdown]);

  // Edit Transaction Auto bonus computation
  const editAutoBonusBreakdown = useMemo(() => {
    const items = [100, 200, 250, 300, 500]
      .map(cat => ({ category: cat, quantity: editTxQuantities[cat] || 0 }))
      .filter(i => i.quantity > 0);
    return calculateWholesaleBonusCards(items);
  }, [editTxQuantities]);

  const editTotalAutoBonusCards = useMemo(() => {
    return editAutoBonusBreakdown.reduce((sum, b) => sum + b.quantity, 0);
  }, [editAutoBonusBreakdown]);

  // Date Filters for Agent Statement
  const [statementStartDate, setStatementStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [statementEndDate, setStatementEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Sharing States
  const [sharingDetails, setSharingDetails] = useState<{
    agentName: string;
    agentPhone: string;
    invoiceNum: string;
    date: string;
    items: { label: string; category: number; quantity: number; price: number; total: number }[];
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    previousBalance?: number;
    currentBalance: number;
    transactionId?: string;
  } | null>(null);

  // Sharing Message formatting
  const shareMessageText = useMemo(() => {
    if (!sharingDetails) return '';
    const itemsText = sharingDetails.items
      .map(item => `• ${item.label}: ${item.quantity} كرت x ${item.price} = ${item.total} ريال`)
      .join('\n');

    return `*فاتورة مشتريات* 🧾
*الوكيل:* ${sharingDetails.agentName}
*التاريخ:* ${sharingDetails.date}
${sharingDetails.invoiceNum ? `*رقم الفاتورة:* ${sharingDetails.invoiceNum}\n` : ''}--------------------------------
*تفاصيل الكروت المشتراة:*
${itemsText}
--------------------------------
*إجمالي الفاتورة:* ${sharingDetails.totalAmount.toLocaleString('ar-YE')} ريال
*المدفوع (الواصل):* ${sharingDetails.paidAmount.toLocaleString('ar-YE')} ريال
*المتبقي من الفاتورة:* ${sharingDetails.remainingAmount.toLocaleString('ar-YE')} ريال
*الرصيد المتبقي الكلي:* ${sharingDetails.currentBalance.toLocaleString('ar-YE')} ريال
--------------------------------
تم تصديرها من تطبيق *${getNetworkName()}* 📱`;
  }, [sharingDetails]);

  const handleCopyToClipboard = () => {
    if (!sharingDetails) return;
    navigator.clipboard.writeText(shareMessageText);
    showToast('📋 تم نسخ نص الفاتورة إلى الحافظة بنجاح!', 'success');
  };

  const handleSendWhatsApp = () => {
    if (!sharingDetails) return;
    openWhatsAppDirect(sharingDetails.agentPhone, shareMessageText);
    showToast('💬 تم فتح واتساب لإرسال الفاتورة', 'success');
  };

  const handleSendSMS = () => {
    if (!sharingDetails) return;
    const cleanPhone = sharingDetails.agentPhone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) {
      finalPhone = `967${cleanPhone}`;
    } else if (cleanPhone.startsWith('0')) {
      finalPhone = `967${cleanPhone.substring(1)}`;
    }
    const cleanMsg = shareMessageText.replace(/\*/g, ''); // strip asterisks for SMS
    const encText = encodeURIComponent(cleanMsg);
    const url = finalPhone ? `sms:${finalPhone}?&body=${encText}` : `sms:?&body=${encText}`;
    window.open(url, '_blank');
    showToast('📱 تم فتح تطبيق الرسائل النصية SMS', 'success');
  };

  // --- DYNAMIC CARD STOCK CALCULATION ---
  const computedStock = useMemo(() => {
    const stock: Record<number, number> = { 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 };
    
    // Add all purchases from all agents
    agents.forEach(agent => {
      (agent.transactions || []).forEach(tx => {
        if (tx.type === 'purchase' && tx.items) {
          tx.items.forEach(item => {
            if (stock[item.category] !== undefined) {
              stock[item.category] += (item.quantity || 0);
            }
          });
        }
      });
    });

    // Subtract all sales
    salesHistory.forEach(sale => {
      if (stock[sale.category] !== undefined) {
        stock[sale.category] -= (sale.quantity || 0);
      }
    });

    return stock;
  }, [agents, salesHistory]);

  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  // Filtered Agent Transactions based on dates
  const filteredTransactions = useMemo(() => {
    if (!selectedAgent) return [];
    return (selectedAgent.transactions || [])
      .filter(tx => tx.date >= statementStartDate && tx.date <= statementEndDate)
      .sort((a, b) => b.date.localeCompare(a.date)); // descending date
  }, [selectedAgent, statementStartDate, statementEndDate]);

  const txs = filteredTransactions;

  // Total invoice amount in the purchase calculator
  const purchaseTotalAmount = useMemo(() => {
    return Object.keys(purchaseQuantities).reduce((sum, key) => {
      const cat = Number(key);
      const qty = purchaseQuantities[cat] || 0;
      const cost = purchaseCosts[cat] || 0;
      return sum + (qty * cost);
    }, 0);
  }, [purchaseQuantities, purchaseCosts]);

  // Handle adding a new agent
  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) {
      showToast('⚠️ يرجى إدخال اسم الوكيل!', 'error');
      return;
    }

    const isDuplicate = agents.some(a => a.name.toLowerCase() === newAgentName.trim().toLowerCase());
    if (isDuplicate) {
      showToast('⚠️ اسم الوكيل هذا مسجل بالفعل!', 'error');
      return;
    }

    const newAgent: AgentAccount = {
      id: 'AG-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      name: newAgentName.trim(),
      phone: newAgentPhone.trim(),
      description: newAgentDesc.trim(),
      totalPurchases: 0,
      totalPayments: 0,
      currentBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      transactions: []
    };

    setAgents(prev => [newAgent, ...prev]);
    showToast(`✅ تم إضافة الوكيل "${newAgent.name}" بنجاح!`, 'success');

    // Reset Form
    setNewAgentName('');
    setNewAgentPhone('');
    setNewAgentDesc('');
    setShowAddAgentModal(false);
  };

  // Handle adding a purchase invoice
  const handleAddPurchase = () => {
    if (!selectedAgent) return;

    const items = (Object.entries(purchaseQuantities) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([catStr, qty]) => {
        const cat = Number(catStr);
        const cost = purchaseCosts[cat] || 0;
        return {
          label: `فئة ${cat}`,
          category: cat,
          quantity: qty,
          price: cost,
          total: qty * cost
        };
      });

    if (items.length === 0) {
      showToast('⚠️ يرجى تحديد كمية كارت واحد على الأقل للشراء!', 'error');
      return;
    }

    const totalInvoiceAmount = purchaseTotalAmount;
    const paid = Number(purchasePaidAmount) || 0;

    if (paid < 0 || paid > totalInvoiceAmount) {
      showToast('⚠️ المبلغ الواصل يجب أن يكون بين 0 وإجمالي الفاتورة!', 'error');
      return;
    }

    const txId = 'TX-PUR-' + Date.now().toString(36).substring(4).toUpperCase();
    const invoiceLabel = purchaseInvoiceNum.trim() ? `فاتورة مشتريات رقم ${purchaseInvoiceNum.trim()}` : 'فاتورة شراء كروت';

    // Automatic Wholesale Profit Margin Cards:
    // Full batch (560) -> 15 cards, Half batch (280) -> 7 cards (+ companion bonus), Multiples of 40 -> 1 card
    // Added automatically to Wholesale Margin profit ONLY (never added to sale inventory stock)
    const bonusCards = calculateWholesaleBonusCards(items);
    const autoWholesaleRecords = buildWholesaleBonusRecords(
      txId,
      purchaseDate,
      selectedAgent.id,
      selectedAgent.name,
      purchaseInvoiceNum.trim(),
      bonusCards
    );

    if (autoWholesaleRecords.length > 0) {
      try {
        const saved = localStorage.getItem('wholesale_bonus_records');
        const existing: WholesaleBonusRecord[] = saved ? JSON.parse(saved) : [];
        const updated = [...autoWholesaleRecords, ...existing];
        localStorage.setItem('wholesale_bonus_records', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to auto-save wholesale bonus cards:', e);
      }
    }

    const newTx: AgentTransaction = {
      id: txId,
      date: purchaseDate,
      type: 'purchase',
      amount: totalInvoiceAmount,
      invoiceNum: purchaseInvoiceNum.trim() || undefined,
      notes: `${invoiceLabel}${purchaseNotes.trim() ? ` - ${purchaseNotes.trim()}` : ''} (واصل: ${paid}، متبقي: ${totalInvoiceAmount - paid})`,
      items: items,
      bonusCards: bonusCards.length > 0 ? bonusCards : undefined
    };

    // If there is any paid amount on the spot, we can either record it as a direct deduction in outstanding balance,
    // or add a secondary payment transaction automatically. Let's record it by updating the totals!
    // Symmetrical with Shops: A sale of amount increases balance. A payment of paid decreases balance.
    // For agent: A purchase of totalInvoiceAmount increases balance (we owe them more).
    // A payment of paid reduces balance (we paid them).
    // Let's record the purchase and an automatic matching payment if paid > 0!
    const extraTransactions: AgentTransaction[] = [];
    if (paid > 0) {
      extraTransactions.push({
        id: 'TX-PAY-' + (Date.now() + 1).toString(36).substring(4).toUpperCase(),
        date: purchaseDate,
        type: 'payment',
        amount: paid,
        notes: `دفعة مسددة فورية مع الفاتورة ${purchaseInvoiceNum.trim() ? `#${purchaseInvoiceNum.trim()}` : ''}`
      });
    }

    setAgents(prev => {
      return prev.map(a => {
        if (a.id === selectedAgent.id) {
          const nextTxs = [...(a.transactions || []), newTx, ...extraTransactions];
          const totalPurchases = nextTxs.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
          const totalPayments = nextTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
          return {
            ...a,
            transactions: nextTxs,
            totalPurchases,
            totalPayments,
            currentBalance: totalPurchases - totalPayments
          };
        }
        return a;
      });
    });

    const totalBonusQty = bonusCards.reduce((s, b) => s + b.quantity, 0);
    const bonusMsg = totalBonusQty > 0 ? ` وتم احتساب ${totalBonusQty} كرت بونص مجاني في هامش الربح 🎁` : '';
    showToast(`✅ تم تسجيل فاتورة المشتريات بقيمة ${totalInvoiceAmount} ريال بنجاح!${bonusMsg}`, 'success');

    // Prepare Sharing details
    const nextBalance = selectedAgent.currentBalance + totalInvoiceAmount - paid;
    setSharingDetails({
      agentName: selectedAgent.name,
      agentPhone: selectedAgent.phone || '',
      invoiceNum: purchaseInvoiceNum.trim(),
      date: purchaseDate,
      items: items,
      totalAmount: totalInvoiceAmount,
      paidAmount: paid,
      remainingAmount: totalInvoiceAmount - paid,
      previousBalance: selectedAgent.currentBalance,
      currentBalance: nextBalance,
      transactionId: txId
    });

    // Reset Form
    setPurchaseQuantities({ 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 });
    setPurchasePaidAmount('');
    setPurchaseNotes('');
    setPurchaseInvoiceNum('');
    setShowAddPurchaseModal(false);
  };

  // Handle adding a payment voucher (سند دفع للوكيل)
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const amt = Number(paymentAmount) || 0;
    if (amt <= 0) {
      showToast('⚠️ يرجى إدخال مبلغ صحيح أكبر من الصفر!', 'error');
      return;
    }

    const txId = 'TX-PAY-' + Date.now().toString(36).substring(4).toUpperCase();
    const newTx: AgentTransaction = {
      id: txId,
      date: paymentDate,
      type: 'payment',
      amount: amt,
      notes: paymentNotes.trim() ? paymentNotes.trim() : 'سند صرف ودفع حساب نقداً للوكيل'
    };

    setAgents(prev => {
      return prev.map(a => {
        if (a.id === selectedAgent.id) {
          const nextTxs = [...(a.transactions || []), newTx];
          const totalPurchases = nextTxs.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
          const totalPayments = nextTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
          return {
            ...a,
            transactions: nextTxs,
            totalPurchases,
            totalPayments,
            currentBalance: totalPurchases - totalPayments
          };
        }
        return a;
      });
    });

    showToast(`✅ تم تسجيل السند بقيمة ${amt} ريال بنجاح للوكيل!`, 'success');

    // Reset Form
    setPaymentAmount('');
    setPaymentNotes('');
    setShowAddPaymentModal(false);
  };

  // --- AGENT EDIT & DELETE HANDLERS ---
  const handleStartEditAgent = (agentToEdit: AgentAccount) => {
    setEditingAgent(agentToEdit);
    setEditAgentName(agentToEdit.name);
    setEditAgentPhone(agentToEdit.phone || '');
    setEditAgentDesc(agentToEdit.description || '');
    setShowEditAgentModal(true);
  };

  const handleSaveEditAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    if (!editAgentName.trim()) {
      showToast('⚠️ يرجى إدخال اسم الوكيل!', 'error');
      return;
    }

    setAgents(prev => prev.map(a => {
      if (a.id === editingAgent.id) {
        return {
          ...a,
          name: editAgentName.trim(),
          phone: editAgentPhone.trim() || undefined,
          description: editAgentDesc.trim() || undefined
        };
      }
      return a;
    }));

    // Update wholesale bonus records in localStorage if name changed
    try {
      const saved = localStorage.getItem('wholesale_bonus_records');
      if (saved) {
        const bonuses: WholesaleBonusRecord[] = JSON.parse(saved);
        const updated = bonuses.map(b => {
          if (b.agentId === editingAgent.id || b.agentName === editingAgent.name) {
            return { ...b, agentName: editAgentName.trim() };
          }
          return b;
        });
        localStorage.setItem('wholesale_bonus_records', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }

    showToast('✅ تم تحديث وتعديل بيانات الوكيل بنجاح!', 'success');
    setShowEditAgentModal(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = (agentId: string) => {
    const target = agents.find(a => a.id === agentId);
    if (!target) return;

    if (!confirm(`🚨 هل أنت متأكد من حذف حساب الوكيل بالكامل (${target.name})؟ سيتم حذف جميع فواتيره وسنداته نهائياً ولا يمكن التراجع عن هذا الإجراء!`)) {
      return;
    }

    setAgents(prev => prev.filter(a => a.id !== agentId));

    // Also clean up linked bonus records from wholesale_bonus_records
    try {
      const saved = localStorage.getItem('wholesale_bonus_records');
      if (saved) {
        const bonuses: WholesaleBonusRecord[] = JSON.parse(saved);
        const updated = bonuses.filter(b => b.agentId !== agentId && b.agentName !== target.name);
        localStorage.setItem('wholesale_bonus_records', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }

    if (selectedAgentId === agentId) {
      setSelectedAgentId(null);
    }
    showToast(`🗑️ تم حذف حساب الوكيل (${target.name}) بنجاح`, 'info');
  };

  // --- TRANSACTION EDIT HANDLERS ---
  const handleStartEditTransaction = (tx: AgentTransaction) => {
    setEditingTx(tx);
    setEditTxDate(tx.date);
    setEditTxInvoiceNum(tx.invoiceNum || '');
    setEditTxNotes(tx.notes || '');
    setEditTxAmount(tx.amount || 0);

    const qtys: Record<number, number> = { 100: 0, 200: 0, 250: 0, 300: 0, 500: 0 };
    const costs: Record<number, number> = { 100: 80, 200: 160, 250: 200, 300: 240, 500: 400 };

    if (tx.items && tx.items.length > 0) {
      tx.items.forEach(it => {
        qtys[it.category] = it.quantity || 0;
        costs[it.category] = it.price || costs[it.category] || it.category;
      });
    }

    setEditTxQuantities(qtys);
    setEditTxCosts(costs);
    setShowEditTxModal(true);
  };

  const handleSaveEditTransaction = () => {
    if (!editingTx || !selectedAgent) return;

    if (editingTx.type === 'purchase') {
      const items = (Object.entries(editTxQuantities) as [string, number][])
        .filter(([_, qty]) => qty > 0)
        .map(([catStr, qty]) => {
          const cat = Number(catStr);
          const cost = editTxCosts[cat] || 0;
          return {
            label: `فئة ${cat}`,
            category: cat,
            quantity: qty,
            price: cost,
            total: qty * cost
          };
        });

      if (items.length === 0) {
        showToast('⚠️ يرجى تحديد كمية كارت واحد على الأقل!', 'error');
        return;
      }

      const totalInvoiceAmount = items.reduce((sum, it) => sum + it.total, 0);

      // Re-calculate auto bonus cards based on wholesale margin rules
      const bonusCards = calculateWholesaleBonusCards(items);
      const autoWholesaleRecords = buildWholesaleBonusRecords(
        editingTx.id,
        editTxDate,
        selectedAgent.id,
        selectedAgent.name,
        editTxInvoiceNum.trim() || editingTx.id,
        bonusCards
      );

      // Update wholesale bonus records in localStorage
      try {
        const saved = localStorage.getItem('wholesale_bonus_records');
        const existing: WholesaleBonusRecord[] = saved ? JSON.parse(saved) : [];
        const cleaned = existing.filter(r => !r.id.startsWith(`WBONUS-AUTO-${editingTx.id}`));
        const updated = [...autoWholesaleRecords, ...cleaned];
        localStorage.setItem('wholesale_bonus_records', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      const updatedTx: AgentTransaction = {
        ...editingTx,
        date: editTxDate,
        amount: totalInvoiceAmount,
        invoiceNum: editTxInvoiceNum.trim() || undefined,
        notes: editTxNotes.trim() || editingTx.notes,
        items,
        bonusCards: bonusCards.length > 0 ? bonusCards : undefined
      };

      setAgents(prev => prev.map(a => {
        if (a.id === selectedAgent.id) {
          const nextTxs = (a.transactions || []).map(t => t.id === editingTx.id ? updatedTx : t);
          const totalPurchases = nextTxs.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
          const totalPayments = nextTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
          return {
            ...a,
            transactions: nextTxs,
            totalPurchases,
            totalPayments,
            currentBalance: totalPurchases - totalPayments
          };
        }
        return a;
      }));

      showToast('✅ تم تعديل فاتورة المشتريات وتحديث الحسابات وهامش الجملة بنجاح!', 'success');
    } else {
      // Payment voucher editing
      const amt = Number(editTxAmount) || 0;
      if (amt <= 0) {
        showToast('⚠️ يرجى إدخال مبلغ صحيح أكبر من الصفر!', 'error');
        return;
      }

      const updatedTx: AgentTransaction = {
        ...editingTx,
        date: editTxDate,
        amount: amt,
        notes: editTxNotes.trim() || 'سند سداد ودفع حساب نقداً للوكيل'
      };

      setAgents(prev => prev.map(a => {
        if (a.id === selectedAgent.id) {
          const nextTxs = (a.transactions || []).map(t => t.id === editingTx.id ? updatedTx : t);
          const totalPurchases = nextTxs.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
          const totalPayments = nextTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
          return {
            ...a,
            transactions: nextTxs,
            totalPurchases,
            totalPayments,
            currentBalance: totalPurchases - totalPayments
          };
        }
        return a;
      }));

      showToast('✅ تم تعديل سند السداد وتحديث الحساب بنجاح!', 'success');
    }

    setShowEditTxModal(false);
    setEditingTx(null);
  };

  // Handle deleting/undoing a transaction
  const handleDeleteTransaction = (txId: string) => {
    if (!selectedAgent) return;
    if (!confirm('🚨 هل أنت متأكد من رغبتك في حذف وإلغاء هذه المعاملة؟ سيتم تحديث رصيد الوكيل ومخزون الكروت فوراً!')) return;

    // Clean up auto wholesale bonus records for this purchase transaction
    try {
      const saved = localStorage.getItem('wholesale_bonus_records');
      if (saved) {
        const existing: WholesaleBonusRecord[] = JSON.parse(saved);
        const filtered = existing.filter(r => !r.id.startsWith(`WBONUS-AUTO-${txId}`));
        localStorage.setItem('wholesale_bonus_records', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }

    setAgents(prev => {
      return prev.map(a => {
        if (a.id === selectedAgent.id) {
          const nextTxs = (a.transactions || []).filter(t => t.id !== txId);
          const totalPurchases = nextTxs.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
          const totalPayments = nextTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
          return {
            ...a,
            transactions: nextTxs,
            totalPurchases,
            totalPayments,
            currentBalance: totalPurchases - totalPayments
          };
        }
        return a;
      });
    });

    showToast('🗑️ تم إلغاء المعاملة بنجاح وتحديث الحسابات والمخزون وهامش الأرباح.', 'info');
  };

  // Handle undoing a newly created purchase invoice from the popup
  const handleUndoPurchase = () => {
    if (!sharingDetails || !selectedAgent) return;
    const txId = sharingDetails.transactionId;
    if (!txId) return;

    if (!confirm('↩️ هل أنت متأكد من رغبتك في التراجع عن فاتورة المشتريات هذه؟ سيتم إلغاء وحذف الفاتورة ومسحها من حساب الوكيل، وسحب الكروت المضافة من المخزن.')) return;

    setAgents(prev => {
      return prev.map(a => {
        if (a.id === selectedAgent.id) {
          // Filter out the purchase transaction (txId) and any automatic payment linked with this invoice number or created immediately as direct payment
          const nextTxs = (a.transactions || []).filter(t => {
            const isTargetPurchase = t.id === txId;
            const isTargetLinkedPayment = t.type === 'payment' && t.notes.includes(sharingDetails.invoiceNum ? `#${sharingDetails.invoiceNum}` : 'دفعة مسددة فورية مع الفاتورة');
            return !isTargetPurchase && !isTargetLinkedPayment;
          });
          const totalPurchases = nextTxs.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
          const totalPayments = nextTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
          return {
            ...a,
            transactions: nextTxs,
            totalPurchases,
            totalPayments,
            currentBalance: totalPurchases - totalPayments
          };
        }
        return a;
      });
    });

    showToast('↩️ تم التراجع عن فاتورة المشتريات وحذفها بنجاح!', 'info');
    setSharingDetails(null);
  };

  // Filter Agents List for search
  const filteredAgents = useMemo(() => {
    return agents.filter(a => 
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) || 
      (a.phone && a.phone.includes(agentSearch))
    );
  }, [agents, agentSearch]);

  // Helper to convert numbers to Arabic words (Tafqeet) for Yemeni Rial
  const numberToArabicWords = (num: number): string => {
    if (num === 0) return 'صفر';
    
    const ones = ['', 'واحد', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    const processGroup = (n: number): string => {
      let parts: string[] = [];
      if (n >= 100) {
        const h = Math.floor(n / 100);
        parts.push(hundreds[h]);
        n %= 100;
      }
      if (n >= 20) {
        const ts = Math.floor(n / 10);
        const o = n % 10;
        if (o > 0) {
          parts.push(ones[o] + ' و' + tens[ts]);
        } else {
          parts.push(tens[ts]);
        }
      } else if (n > 0) {
        parts.push(ones[n]);
      }
      return parts.filter(p => p !== '').join(' و');
    };

    let resultParts: string[] = [];
    let temp = Math.floor(Math.abs(num));

    // Billions
    if (temp >= 1000000000) {
      const b = Math.floor(temp / 1000000000);
      if (b === 1) resultParts.push('مليار');
      else if (b === 2) resultParts.push('ملياران');
      else if (b >= 3 && b <= 10) resultParts.push(processGroup(b) + ' مليارات');
      else resultParts.push(processGroup(b) + ' مليار');
      temp %= 1000000000;
    }

    // Millions
    if (temp >= 1000000) {
      const m = Math.floor(temp / 1000000);
      if (m === 1) resultParts.push('مليون');
      else if (m === 2) resultParts.push('مليونان');
      else if (m >= 3 && m <= 10) resultParts.push(processGroup(m) + ' ملايين');
      else resultParts.push(processGroup(m) + ' مليون');
      temp %= 1000000;
    }

    // Thousands
    if (temp >= 1000) {
      const th = Math.floor(temp / 1000);
      if (th === 1) resultParts.push('ألف');
      else if (th === 2) resultParts.push('ألفين');
      else if (th >= 3 && th <= 10) resultParts.push(processGroup(th) + ' آلاف');
      else resultParts.push(processGroup(th) + ' ألف');
      temp %= 1000;
    }

    // Ones, Tens, Hundreds
    if (temp > 0) {
      resultParts.push(processGroup(temp));
    }

    return resultParts.filter(p => p !== '').join(' و');
  };

  // --- DOWNLOAD AGENT STATEMENT EXCEL ---
  const handleDownloadExcel = async () => {
    if (!selectedAgent) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب الوكيل', {
        views: [{ rightToLeft: true }]
      });

      // Headers
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = getNetworkName() || 'شبكة كروت مبيعات';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A2:E2');
      const subTitleCell = worksheet.getCell('A2');
      subTitleCell.value = `كشف حساب الوكيل: ${selectedAgent.name}`;
      subTitleCell.font = { name: 'Arial', size: 12, bold: true };
      subTitleCell.alignment = { horizontal: 'center' };

      worksheet.getCell('A3').value = 'هاتف الوكيل:';
      worksheet.getCell('B3').value = selectedAgent.phone || 'غير متوفر';
      worksheet.getCell('D3').value = 'الفترة من:';
      worksheet.getCell('E3').value = `${statementStartDate} إلى ${statementEndDate}`;

      worksheet.getCell('A4').value = 'إجمالي المشتريات:';
      worksheet.getCell('B4').value = selectedAgent.totalPurchases;
      worksheet.getCell('D4').value = 'إجمالي المسدد:';
      worksheet.getCell('E4').value = selectedAgent.totalPayments;

      worksheet.getCell('A5').value = 'الرصيد المتبقي له:';
      worksheet.getCell('B5').value = selectedAgent.currentBalance;
      worksheet.getCell('B5').font = { bold: true, color: { argb: 'FFFF0000' } };

      // Table Headers (التاريخ، البيان، المبلغ، التفاصيل، رمز العملية)
      const headers = ['التاريخ', 'البيان', 'المبلغ (ريال)', 'التفاصيل', 'رمز العملية'];
      worksheet.getRow(7).values = headers;
      worksheet.getRow(7).font = { bold: true };
      worksheet.getRow(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

      // Calculate chronological running balances
      const sortedTxsAsc = [...(selectedAgent.transactions || [])].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.type === b.type) return a.id.localeCompare(b.id);
        return a.type === 'purchase' ? -1 : 1;
      });

      const runningBalancesMap: Record<string, number> = {};
      let currentRunning = 0;
      sortedTxsAsc.forEach(tx => {
        if (tx.type === 'purchase') {
          currentRunning += tx.amount;
        } else {
          currentRunning -= tx.amount;
        }
        runningBalancesMap[tx.id] = currentRunning;
      });

      // Add Rows
      filteredTransactions.forEach((tx) => {
        const dateStr = tx.date;
        const typeStr = tx.type === 'purchase' ? 'فاتورة شراء كروت' : 'سند واصل';
        const amountVal = tx.amount;
        
        let detailText = '';
        if (tx.type === 'purchase') {
          if (tx.items && tx.items.length > 0) {
            detailText = tx.items.map(item => `${item.quantity} كرت فئة ${item.category}`).join(' و ');
          } else {
            detailText = tx.notes || 'شراء كروت متنوعة';
          }
        } else {
          const balanceAtTx = runningBalancesMap[tx.id] || 0;
          detailText = `واصل لكم ${tx.amount.toLocaleString('ar-YE')} ريال والمتبقي لكم ${balanceAtTx.toLocaleString('ar-YE')} ريال`;
        }

        const row = worksheet.addRow([
          dateStr,
          typeStr,
          amountVal,
          detailText,
          tx.id
        ]);

        if (tx.type === 'purchase') {
          row.getCell(2).font = { color: { argb: 'FF2563EB' }, bold: true };
        } else {
          row.getCell(2).font = { color: { argb: 'FF16A34A' }, bold: true };
        }
      });

      // Outside table balance statement (خارج الجدول)
      worksheet.addRow([]); // Empty row
      const finalBalance = selectedAgent.currentBalance;
      let balanceLabel = '';
      let balanceTextWords = '';

      if (finalBalance > 0) {
        balanceLabel = `رصيد الوكيل الحالي (له علينا): ${finalBalance.toLocaleString('ar-YE')} ريال يمني`;
        balanceTextWords = `فقط ${numberToArabicWords(finalBalance)} ريال يمني لا غير`;
      } else if (finalBalance < 0) {
        balanceLabel = `رصيد الوكيل الحالي (عليه لنا): ${Math.abs(finalBalance).toLocaleString('ar-YE')} ريال يمني`;
        balanceTextWords = `فقط ${numberToArabicWords(Math.abs(finalBalance))} ريال يمني لا غير`;
      } else {
        balanceLabel = `رصيد الوكيل الحالي: 0 ريال`;
        balanceTextWords = `خالص مسدد ولا يوجد أي مستحقات (صفر)`;
      }

      const summaryRow1 = worksheet.addRow(['', '', '', balanceLabel, '']);
      summaryRow1.getCell(4).font = { size: 12, bold: true, color: { argb: finalBalance > 0 ? 'FFDC2626' : 'FF16A34A' } };
      
      const summaryRow2 = worksheet.addRow(['', '', '', balanceTextWords, '']);
      summaryRow2.getCell(4).font = { size: 11, italic: true, bold: true, color: { argb: 'FF475569' } };

      // Auto-fit Columns
      worksheet.columns.forEach(column => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          if (cell.value) {
            const valStr = cell.value.toString();
            const len = valStr.split('').reduce((acc, char) => {
              return acc + (char.charCodeAt(0) > 128 ? 1.8 : 1);
            }, 0);
            if (len > maxLen) maxLen = len;
          }
        });
        column.width = Math.max(maxLen + 4, 14);
      });

      // Save File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `كشف_حساب_الوكيل_${selectedAgent.name}_${statementStartDate}_إلى_${statementEndDate}.xlsx`;
      link.click();

      showToast('✅ تم تحميل تقرير Excel لكشف حساب الوكيل بنجاح!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('❌ فشل في تصدير ملف Excel!', 'error');
    }
  };

  // --- DOWNLOAD AGENT STATEMENT PDF (CANVAS & jspdf) ---
  const handleDownloadPDF = () => {
    if (!selectedAgent) return;

    try {
      const txs = filteredTransactions;
      
      // Calculate chronological running balances
      const sortedTxsAsc = [...(selectedAgent.transactions || [])].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.type === b.type) return a.id.localeCompare(b.id);
        return a.type === 'purchase' ? -1 : 1;
      });

      const runningBalancesMap: Record<string, number> = {};
      let currentRunning = 0;
      sortedTxsAsc.forEach(tx => {
        if (tx.type === 'purchase') {
          currentRunning += tx.amount;
        } else {
          currentRunning -= tx.amount;
        }
        runningBalancesMap[tx.id] = currentRunning;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Symmetrical wrap text helper
      const wrapText = (c: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const metrics = c.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };

      // Measure row heights dynamically
      ctx.font = '8.5px sans-serif';
      const detailsTexts: string[] = [];
      const rowHeights: number[] = [];

      txs.forEach((tx) => {
        let detailText = '';
        if (tx.type === 'purchase') {
          if (tx.items && tx.items.length > 0) {
            detailText = tx.items.map(item => `${item.quantity} كرت فئة ${item.category}`).join(' و ');
          } else {
            detailText = tx.notes || 'شراء كروت متنوعة';
          }
        } else {
          const balanceAtTx = runningBalancesMap[tx.id] || 0;
          detailText = `واصل لكم ${tx.amount.toLocaleString('ar-YE')} ريال والمتبقي لكم ${balanceAtTx.toLocaleString('ar-YE')} ريال`;
        }
        detailsTexts.push(detailText);

        const wrapped = wrapText(ctx, detailText, 170);
        const numLines = Math.max(1, wrapped.length);
        const height = Math.max(35, 12 + (numLines * 14));
        rowHeights.push(height);
      });

      const headerHeight = 290;
      const footerHeight = 260;
      const totalRowsHeight = rowHeights.reduce((a, b) => a + b, 0);
      
      const canvasWidth = 650;
      const canvasHeight = headerHeight + totalRowsHeight + footerHeight;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Border layout
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(15, 15, canvasWidth - 30, canvasHeight - 30);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

      // Config
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';

      // Title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(getNetworkName() || 'شبكة المبيعات المعتمدة', canvasWidth / 2, 55);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('كشف حساب ومطابقة حسابات الوكلاء والموردين', canvasWidth / 2, 85);

      // Dividers
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(40, 98);
      ctx.lineTo(canvasWidth - 40, 98);
      ctx.stroke();

      // Info Box (RTL)
      ctx.textAlign = 'right';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#1e293b';

      // Draw Metadata
      ctx.fillText(`الوكيل المورد: ${selectedAgent.name}`, canvasWidth - 50, 120);
      ctx.fillText(`رقم الهاتف: ${selectedAgent.phone || 'غير متوفر'}`, canvasWidth - 50, 140);
      ctx.fillText(`بيان الوكيل: ${selectedAgent.description || 'بدون وصف'}`, canvasWidth - 50, 160);

      ctx.fillText(`الفترة من تاريخ: ${statementStartDate}`, 250, 120);
      ctx.fillText(`إلى تاريخ: ${statementEndDate}`, 250, 140);
      ctx.fillText(`تاريخ الطباعة: ${new Date().toLocaleDateString('ar-YE')}`, 250, 160);

      // Symmetrical Account Summary Card
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(45, 185, canvasWidth - 90, 50);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(45, 185, canvasWidth - 90, 50);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('إجمالي المشتريات', 500, 200);
      ctx.fillText('إجمالي الواصل (المسدد)', 325, 200);
      ctx.fillText('الرصيد المتبقي له', 150, 200);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(`${selectedAgent.totalPurchases.toLocaleString('ar-YE')} ريال`, 500, 222);
      ctx.fillStyle = '#16a34a';
      ctx.fillText(`${selectedAgent.totalPayments.toLocaleString('ar-YE')} ريال`, 325, 222);
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`${selectedAgent.currentBalance.toLocaleString('ar-YE')} ريال`, 150, 222);

      // Table Header Row
      let currentY = 260;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(45, currentY, canvasWidth - 90, 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('التاريخ', 565, currentY + 12);
      ctx.fillText('البيان', 470, currentY + 12);
      ctx.fillText('المبلغ (ريال)', 365, currentY + 12);
      ctx.fillText('التفاصيل', 225, currentY + 12);
      ctx.fillText('رمز العملية', 90, currentY + 12);

      // Render Transaction rows
      currentY += 25;
      ctx.fillStyle = '#000000';
      ctx.font = '9px sans-serif';

      txs.forEach((tx, index) => {
        const rowHeight = rowHeights[index];

        // Alternating row background
        if (index % 2 === 0) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(45, currentY, canvasWidth - 90, rowHeight);
        }
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(45, currentY + rowHeight);
        ctx.lineTo(canvasWidth - 45, currentY + rowHeight);
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.font = '9px sans-serif';

        // Col 1: Date (التاريخ) -> X center = 565
        ctx.fillText(tx.date, 565, currentY + (rowHeight / 2));
        
        // Col 2: البيان -> X center = 470
        ctx.font = 'bold 9px sans-serif';
        if (tx.type === 'purchase') {
          ctx.fillStyle = '#2563eb';
          ctx.fillText('فاتورة شراء كروت', 470, currentY + (rowHeight / 2));
        } else {
          ctx.fillStyle = '#16a34a';
          ctx.fillText('سند واصل', 470, currentY + (rowHeight / 2));
        }

        // Col 3: المبلغ -> X center = 365
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(tx.amount.toLocaleString('ar-YE'), 365, currentY + (rowHeight / 2));

        // Col 4: التفاصيل -> Alignment in the range X: 135 to 315
        ctx.fillStyle = '#334155';
        ctx.font = '8.5px sans-serif';
        ctx.textAlign = 'right';

        const detailText = detailsTexts[index];
        const wrappedLines = wrapText(ctx, detailText, 170);
        const startLineY = currentY + (rowHeight / 2) - ((wrappedLines.length - 1) * 14 / 2);
        
        wrappedLines.forEach((line, lineIdx) => {
          ctx.fillText(line, 305, startLineY + (lineIdx * 14));
        });

        // Col 5: رمز العملية -> X center = 90
        ctx.fillStyle = '#64748b';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tx.id, 90, currentY + (rowHeight / 2));

        currentY += rowHeight;
      });

      // Draw Account Balance Summary Box (خارج الجدول)
      currentY += 25;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(45, currentY, canvasWidth - 90, 60);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(45, currentY, canvasWidth - 90, 60);

      const balanceVal = selectedAgent.currentBalance;
      let balanceTitle = '';
      let balanceWords = '';

      if (balanceVal > 0) {
        balanceTitle = `رصيد الوكيل الحالي (له علينا): ${balanceVal.toLocaleString('ar-YE')} ريال يمني`;
        balanceWords = `فقط ${numberToArabicWords(balanceVal)} ريال يمني لا غير`;
        ctx.fillStyle = '#dc2626'; // Red for debt to agent
      } else if (balanceVal < 0) {
        balanceTitle = `رصيد الوكيل الحالي (عليه لنا): ${Math.abs(balanceVal).toLocaleString('ar-YE')} ريال يمني`;
        balanceWords = `فقط ${numberToArabicWords(Math.abs(balanceVal))} ريال يمني لا غير`;
        ctx.fillStyle = '#16a34a'; // Green for surplus
      } else {
        balanceTitle = `رصيد الوكيل الحالي: 0 ريال (خالص مسدد ولا يوجد أي مستحقات)`;
        balanceWords = `صفر ريال يمني لا غير`;
        ctx.fillStyle = '#0f172a';
      }

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(balanceTitle, canvasWidth - 65, currentY + 18);

      ctx.fillStyle = '#475569';
      ctx.font = 'italic bold 10.5px sans-serif';
      ctx.fillText(balanceWords, canvasWidth - 65, currentY + 40);

      currentY += 80;

      // Signature Area
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'right';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('توقيع المحاسب / الإدارة:', canvasWidth - 70, currentY);
      ctx.fillText('توقيع وختم الوكيل المورد:', 180, currentY);

      ctx.beginPath();
      ctx.moveTo(canvasWidth - 180, currentY + 25);
      ctx.lineTo(canvasWidth - 50, currentY + 25);
      ctx.moveTo(50, currentY + 25);
      ctx.lineTo(180, currentY + 25);
      ctx.stroke();

      // Footer
      currentY += 55;
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${getNetworkName()} - نظام جرد متكامل هاتف: ${getDistributorPhone() || 'شبكة مبيعات'}`, canvasWidth / 2, currentY);

      // Convert to PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = canvasWidth * 0.264583; // px to mm
      const pdfHeight = canvasHeight * 0.264583;

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'l' : 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`كشف_حساب_الوكيل_${selectedAgent.name}.pdf`);
      showToast('✅ تم تحميل تقرير PDF لكشف حساب الوكيل بنجاح!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('❌ فشل في تصدير ملف PDF!', 'error');
    }
  };

  return (
    <div className="p-4 space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* 1. STOCK BALANCES BAR (خانات أرصدة كروت المشتريات) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <Package className="text-blue-500" size={20} />
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">رصيد الكروت الحالي بالمخزن (الجرد)</h3>
        </div>

        {/* 5 Equal Cards in a Single Row */}
        <div className="flex flex-row items-stretch gap-2 sm:gap-3 w-full overflow-x-auto pb-1">
          {[100, 200, 250, 300, 500].map((cat) => {
            const stock = computedStock[cat] || 0;
            const isLow = stock <= 10;
            return (
              <motion.div
                whileHover={{ scale: 1.02 }}
                key={cat}
                className={`flex-1 min-w-[70px] sm:min-w-0 p-3 sm:p-4 rounded-2xl border text-center transition-all shadow-sm flex flex-col justify-between items-center ${
                  isLow 
                    ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' 
                    : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="text-[11px] sm:text-xs font-bold opacity-75 block mb-1 whitespace-nowrap">
                  فئة {cat}
                </div>
                <div className="text-xl sm:text-2xl font-black font-sans tracking-tight my-0.5">
                  {stock.toLocaleString('ar-YE')}
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold opacity-60 whitespace-nowrap">
                  {isLow ? '⚠️ منخفض' : 'جاهز للبيع'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedAgent ? (
          /* --- VIEW A: AGENT LIST & CREATION --- */
          <motion.div
            key="agent-list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Search and Add Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="ابحث عن وكيل..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setShowAddAgentModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus size={16} />
                <span>إضافة وكيل جديد</span>
              </button>
            </div>

            {/* Agent Grid */}
            {filteredAgents.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-150 dark:border-slate-800 text-slate-400 text-sm font-bold">
                📢 لا يوجد وكلاء مسجلين حالياً يطابقون البحث. يرجى إضافة وكيلك الأول لبدء عملية الشراء والجرد المالي!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAgents.map(agent => (
                  <motion.div
                    whileHover={{ y: -2 }}
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="p-5 bg-white dark:bg-slate-900 rounded-[1.8rem] border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer text-right flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg font-mono font-bold">
                          {agent.id}
                        </span>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{agent.name}</h4>
                      </div>
                      
                      {agent.phone && (
                        <div className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                          <span>{agent.phone}</span>
                          <Phone size={12} className="opacity-70" />
                        </div>
                      )}

                      {agent.description && (
                        <p className="text-[11px] text-slate-400 font-bold truncate">
                          {agent.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50 dark:border-slate-800/50 text-center text-[10px] font-bold text-slate-500">
                      <div>
                        <span className="opacity-75 block">المشتريات</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-black font-sans">
                          {agent.totalPurchases?.toLocaleString('ar-YE') || 0}
                        </span>
                      </div>
                      <div>
                        <span className="opacity-75 block">المسدد (الواصل)</span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-black font-sans">
                          {agent.totalPayments?.toLocaleString('ar-YE') || 0}
                        </span>
                      </div>
                      <div>
                        <span className="opacity-75 block">المتبقي له</span>
                        <span className="text-xs text-red-600 dark:text-red-400 font-black font-sans">
                          {agent.currentBalance?.toLocaleString('ar-YE') || 0}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditAgent(agent);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-600 hover:text-blue-600 dark:text-slate-300 rounded-lg text-xs transition-colors"
                          title="تعديل بيانات الوكيل"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAgent(agent.id);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-300 rounded-lg text-xs transition-colors"
                          title="حذف الوكيل بالكامل"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatementModalAgent(agent);
                          setShowStatementModal(true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors"
                        title="تصدير كشف حساب الوكيل"
                      >
                        <FileText size={11} />
                        <span>كشف الحساب</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* --- VIEW B: AGENT STATEMENT (كشف الحساب وتفاصيل المشتريات) --- */
          <motion.div
            key="agent-statement-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header / Back Action */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 flex-wrap gap-2">
              <button
                onClick={() => setSelectedAgentId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>العودة للوكلاء</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEditAgent(selectedAgent)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="تعديل بيانات وحساب الوكيل"
                >
                  <Edit3 size={13} />
                  <span>تعديل الوكيل</span>
                </button>
                <button
                  onClick={() => handleDeleteAgent(selectedAgent.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="حذف حساب الوكيل بالكامل"
                >
                  <Trash2 size={13} />
                  <span>حذف الوكيل</span>
                </button>
              </div>

              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{selectedAgent.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{selectedAgent.phone || 'بدون هاتف'} • {selectedAgent.description || 'بدون بيان'}</p>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">إجمالي المشتريات</span>
                <span className="text-sm font-sans font-black text-blue-600 dark:text-blue-400">
                  {selectedAgent.totalPurchases?.toLocaleString('ar-YE') || 0} <span className="text-[9px] font-normal">ريال</span>
                </span>
              </div>
              <div className="p-3 bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/20 rounded-2xl">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">إجمالي الواصل</span>
                <span className="text-sm font-sans font-black text-green-600 dark:text-green-400">
                  {selectedAgent.totalPayments?.toLocaleString('ar-YE') || 0} <span className="text-[9px] font-normal">ريال</span>
                </span>
              </div>
              <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">الرصيد المتبقي له</span>
                <span className="text-sm font-sans font-black text-red-600 dark:text-red-400">
                  {selectedAgent.currentBalance?.toLocaleString('ar-YE') || 0} <span className="text-[9px] font-normal">ريال</span>
                </span>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowAddPurchaseModal(true)}
                className="py-3 px-4 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <ShoppingCart size={15} />
                <span>شراء كروت (فاتورة مشتريات)</span>
              </button>

              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="py-3 px-4 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Coins size={15} />
                <span>سند سداد (دفع حساب للوكيل)</span>
              </button>
            </div>

            {/* Filters and Exports Box */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <CalendarDays size={16} />
                  <h4 className="text-xs font-extrabold">تاريخ كشف الحساب والتقارير</h4>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setStatementModalAgent(selectedAgent);
                      setShowStatementModal(true);
                    }}
                    className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    title="تصدير كشف حساب المشتريات والوكلاء (تفصيلي / إجمالي)"
                  >
                    <FileText size={13} />
                    <span>تصدير كشف الحساب (تفصيلي / إجمالي)</span>
                  </button>

                  <button
                    onClick={() => {
                      setStatementModalAgent(selectedAgent);
                      setShowStatementModal(true);
                    }}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="تنزيل كشف الحساب بصيغة Excel"
                  >
                    <Download size={12} />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => {
                      setStatementModalAgent(selectedAgent);
                      setShowStatementModal(true);
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="تنزيل كشف الحساب كـ PDF"
                  >
                    <Printer size={12} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                <div>
                  <label className="block mb-1 text-[10px] text-right">من تاريخ:</label>
                  <input
                    type="date"
                    value={statementStartDate}
                    onChange={(e) => setStatementStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] text-right">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={statementEndDate}
                    onChange={(e) => setStatementEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">دفتر المعاملات والعمليات المسجلة</h4>
              
              {txs.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400 text-xs font-bold border border-dashed border-slate-200 dark:border-slate-800">
                  لا توجد حركات مسجلة للوكيل في الفترة المحددة!
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {txs.map(tx => (
                    <div
                      key={tx.id}
                      onClick={() => setViewingTx(tx)}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-right gap-3 shadow-sm hover:border-slate-250 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStartEditTransaction(tx)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="تعديل هذه المعاملة"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="حذف وإلغاء هذه المعاملة"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-sans font-black text-slate-900 dark:text-white">
                            {tx.amount?.toLocaleString('ar-YE')} ريال
                          </span>
                          
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                            tx.type === 'purchase'
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                              : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                          }`}>
                            {tx.type === 'purchase' ? 'شراء كروت 🛒' : 'سداد حساب 🧾'}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold leading-normal">
                          {tx.notes}
                        </p>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>{tx.id}</span>
                          <span className="font-sans font-semibold">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewing Agent Transaction Detail Modal */}
      <AnimatePresence>
        {viewingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTx(null)}
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
                  onClick={() => setViewingTx(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                    {viewingTx.type === 'purchase' ? 'تفاصيل فاتورة الشراء' : 'تفاصيل السند المالي'}
                  </span>
                  <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 font-sans text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 relative overflow-hidden">
                  <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800"></div>

                  <div className="text-center space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-[13px]">
                      {agents.find(a => a.id === selectedAgentId)?.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">رقم العملية: {viewingTx.id}</p>
                    <p className="text-[10px] text-slate-400">التاريخ: {viewingTx.date}</p>
                    
                    <div className="pt-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        viewingTx.type === 'purchase' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {viewingTx.type === 'purchase' ? '🛒 فاتورة توريد كروت' : '🧾 سند سداد حساب للوكيل'}
                      </span>
                    </div>
                  </div>

                  {viewingTx.type === 'purchase' && viewingTx.items && viewingTx.items.length > 0 ? (
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                      <h5 className="font-extrabold text-slate-400 text-[10px] mb-1.5 text-right">الكروت المشتراة:</h5>
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 font-bold text-[10px] text-slate-400 border-b border-slate-200/50 dark:border-slate-800/50 pb-1 text-center" style={{ direction: 'rtl' }}>
                          <span className="text-right pr-1">الفئة</span>
                          <span>الكمية</span>
                          <span>سعر الشراء</span>
                          <span>الإجمالي</span>
                        </div>
                        {viewingTx.items.map((it, idx) => (
                          <div key={idx} className="grid grid-cols-4 items-center text-slate-600 dark:text-slate-300 font-extrabold text-[11px] text-center py-1 border-b border-slate-100/50 dark:border-slate-800/30" style={{ direction: 'rtl' }}>
                            <span className="text-right text-indigo-600 dark:text-indigo-400 font-bold pr-1">{it.label}</span>
                            <span className="font-sans text-slate-800 dark:text-slate-200">{it.quantity}</span>
                            <span className="font-sans text-slate-500 dark:text-slate-400">{it.price.toLocaleString('ar-YE')}</span>
                            <span className="font-sans text-slate-900 dark:text-slate-100 font-bold">{it.total.toLocaleString('ar-YE')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">البيان / الملاحظات:</span>
                      <p className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl leading-relaxed text-slate-700 dark:text-slate-300 font-bold">
                        {viewingTx.notes || 'سداد حساب نقدي للوكيل.'}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-xs font-extrabold" style={{ direction: 'rtl' }}>
                    <div className="flex justify-between items-center text-slate-950 dark:text-white">
                      <span>إجمالي قيمة العملية:</span>
                      <span className="font-sans font-black text-sm">{viewingTx.amount.toLocaleString('ar-YE')} ريال</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const selectedAgent = agents.find(a => a.id === selectedAgentId);
                      const docSummary = {
                        items: viewingTx.items || [{
                          label: 'شراء كروت ' + getNetworkName(),
                          category: viewingTx.amount,
                          quantity: 1,
                          price: viewingTx.amount,
                          total: viewingTx.amount
                        }],
                        totalAmount: viewingTx.type === 'purchase' ? viewingTx.amount : 0,
                        paidAmount: viewingTx.type === 'payment' ? viewingTx.amount : 0,
                        remainingAmount: viewingTx.type === 'purchase' ? viewingTx.amount : 0,
                        date: viewingTx.date,
                        agentName: selectedAgent?.name || '',
                        agentPhone: selectedAgent?.phone,
                        previousBalance: 0,
                        transactionId: viewingTx.id
                      };
                      downloadPurchaseInvoicePDF(docSummary, isThermalMode);
                      showToast('تم تحميل مستند العملية PDF بنجاح 📄', 'success');
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-red-500/10"
                  >
                    <Download size={13} />
                    <span>تحميل PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const selectedAgent = agents.find(a => a.id === selectedAgentId);
                      const agentName = selectedAgent ? selectedAgent.name : 'الوكيل';
                      const isPurchase = viewingTx.type === 'purchase';
                      const typeText = isPurchase ? '🛒 فاتورة شراء كروت' : '🧾 سند سداد حساب';
                      
                      let msg = `*${typeText} - ${getNetworkName()}* 📄\n`;
                      msg += `*المورد / الوكيل:* ${agentName}\n`;
                      msg += `*التاريخ:* ${viewingTx.date}\n`;
                      msg += `*رمز العملية:* \`${viewingTx.id}\`\n`;
                      msg += `------------------------------------\n`;
                      
                      if (isPurchase) {
                        if (viewingTx.items && viewingTx.items.length > 0) {
                          viewingTx.items.forEach(it => {
                            msg += `🔹 *${it.quantity} أبو ${it.category}* = ${it.total} ريال\n`;
                          });
                        } else {
                          msg += `🔹 مشتريات بقيمة: *${viewingTx.amount} ريال*\n`;
                        }
                        msg += `------------------------------------\n`;
                        msg += `💵 *إجمالي قيمة الفاتورة:* *${viewingTx.amount} ريال*\n`;
                      } else {
                        msg += `📥 *المبلغ المدفوع للوكيل:* *${viewingTx.amount} ريال*\n`;
                        if (viewingTx.notes) {
                          msg += `📝 *البيان:* ${viewingTx.notes}\n`;
                        }
                      }
                      
                      msg += `------------------------------------\n`;
                      msg += `💡 _نظام كروت وحسابات شبكة ${getNetworkName()} المتكامل_`;
                      
                      navigator.clipboard.writeText(msg);
                      showToast('📋 تم نسخ تفاصيل العملية بنجاح!', 'success');
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-blue-500/10"
                  >
                    <Copy size={13} />
                    <span>نسخ كـ نص</span>
                  </button>
                  <button
                    onClick={() => {
                      const txToEdit = viewingTx;
                      setViewingTx(null);
                      handleStartEditTransaction(txToEdit);
                    }}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-amber-500/10"
                  >
                    <Edit3 size={13} />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => {
                      const txToDelete = viewingTx;
                      setViewingTx(null);
                      handleDeleteTransaction(txToDelete.id);
                    }}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-rose-500/10"
                  >
                    <Trash2 size={13} />
                    <span>حذف</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const selectedAgent = agents.find(a => a.id === selectedAgentId);
                    const agentName = selectedAgent ? selectedAgent.name : 'الوكيل';
                    const isPurchase = viewingTx.type === 'purchase';
                    const typeText = isPurchase ? '🛒 فاتورة شراء كروت' : '🧾 سند سداد حساب';
                    
                    let msg = `*${typeText} - ${getNetworkName()}* 📄\n`;
                    msg += `*المورد / الوكيل:* ${agentName}\n`;
                    msg += `*التاريخ:* ${viewingTx.date}\n`;
                    msg += `*رمز العملية:* \`${viewingTx.id}\`\n`;
                    msg += `------------------------------------\n`;
                    
                    if (isPurchase) {
                      if (viewingTx.items && viewingTx.items.length > 0) {
                        viewingTx.items.forEach(it => {
                          msg += `🔹 *${it.quantity} أبو ${it.category}* = ${it.total} ريال\n`;
                        });
                      } else {
                        msg += `🔹 مشتريات بقيمة: *${viewingTx.amount} ريال*\n`;
                      }
                      msg += `------------------------------------\n`;
                      msg += `💵 *إجمالي قيمة الفاتورة:* *${viewingTx.amount} ريال*\n`;
                    } else {
                      msg += `📥 *المبلغ المدفوع للوكيل:* *${viewingTx.amount} ريال*\n`;
                      if (viewingTx.notes) {
                        msg += `📝 *البيان:* ${viewingTx.notes}\n`;
                      }
                    }
                    
                    msg += `------------------------------------\n`;
                    msg += `💡 _نظام كروت وحسابات شبكة ${getNetworkName()} المتكامل_`;
                    
                    const destPhone = selectedAgent?.phone ? selectedAgent.phone.replace('+', '') : '';
                    openWhatsAppDirect(destPhone, msg);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                >
                  <MessageCircle size={13} />
                  <span>مشاركة واتساب (تفاصيل)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODALS ================= */}

      {/* A. ADD AGENT MODAL */}
      <AnimatePresence>
        {showAddAgentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowAddAgentModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-2xl p-6 text-right z-10 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <button
                  onClick={() => setShowAddAgentModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">إضافة وكيل / مورد جديد</h3>
              </div>

              <form onSubmit={handleAddAgent} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <label className="block mb-1 text-right">اسم الوكيل الكامل: *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يحيى صالح للاتصالات"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block mb-1 text-right">رقم الهاتف (اختياري):</label>
                  <input
                    type="tel"
                    placeholder="مثال: 771234567"
                    value={newAgentPhone}
                    onChange={(e) => setNewAgentPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block mb-1 text-right">الوصف أو الملاحظات (اختياري):</label>
                  <textarea
                    placeholder="تفاصيل إضافية حول هذا الوكيل..."
                    value={newAgentDesc}
                    onChange={(e) => setNewAgentDesc(e.target.value)}
                    className="w-full h-16 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer text-center"
                >
                  حفظ وتسجيل الوكيل الجديد ✅
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. ADD PURCHASE INVOICE MODAL (شراء كروت بالتفصيل) */}
      <AnimatePresence>
        {showAddPurchaseModal && selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowAddPurchaseModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-2xl p-5 text-right z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <button
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">شراء كروت من {selectedAgent.name}</h3>
              </div>

              {/* Calculator Form */}
              <div className="space-y-3.5 text-right">
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                  <div>
                    <label className="block mb-1 text-right">تاريخ الفاتورة:</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-950 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-right">رقم الفاتورة (اختياري):</label>
                    <input
                      type="text"
                      placeholder="رقم الفاتورة بالمورد..."
                      value={purchaseInvoiceNum}
                      onChange={(e) => setPurchaseInvoiceNum(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right text-slate-950 dark:text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Items Grid */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-black text-slate-400 block">حدد كميات الكروت وأسعار الشراء:</span>
                  
                  {[100, 200, 250, 300, 500].map(cat => (
                    <div 
                      key={cat} 
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs shrink-0 text-slate-700 dark:text-slate-300">
                        <span>فئة {cat}</span>
                        <Package size={14} className="text-slate-400" />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Cost Input */}
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] opacity-75">سعر الكارت:</span>
                          <input
                            type="number"
                            min="0"
                            value={purchaseCosts[cat]}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setPurchaseCosts(prev => ({ ...prev, [cat]: val }));
                            }}
                            className="w-16 h-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-sans font-black text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] opacity-75">الكمية:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const cur = purchaseQuantities[cat] || 0;
                                setPurchaseQuantities(prev => ({ ...prev, [cat]: Math.max(0, cur - 1) }));
                              }}
                              className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center cursor-pointer select-none"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={purchaseQuantities[cat] || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setPurchaseQuantities(prev => ({ ...prev, [cat]: val }));
                              }}
                              placeholder="0"
                              className="w-12 h-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-sans font-black text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => {
                                const cur = purchaseQuantities[cat] || 0;
                                setPurchaseQuantities(prev => ({ ...prev, [cat]: cur + 1 }));
                              }}
                              className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation summary */}
                <div className="p-4 bg-indigo-600 rounded-2xl text-white text-right space-y-3 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-indigo-100 font-bold">إجمالي فاتورة الشراء:</span>
                    <span className="text-xl font-black font-sans">{purchaseTotalAmount.toLocaleString('ar-YE')} <span className="text-xs font-normal">ريال</span></span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div>
                      <label className="block text-indigo-100 mb-0.5">الواصل (المبلغ المدفوع):</label>
                      <input
                        type="number"
                        min="0"
                        max={purchaseTotalAmount}
                        placeholder="أدخل المسدد..."
                        value={purchasePaidAmount}
                        onChange={(e) => setPurchasePaidAmount(e.target.value)}
                        className="w-full h-8 px-2 bg-white/15 border border-white/20 rounded-lg text-right text-xs text-white outline-none font-sans font-black focus:bg-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-indigo-100 mb-0.5">المتبقي دين للوكيل:</label>
                      <div className="h-8 flex items-center justify-end font-sans font-black text-xs text-red-200 bg-white/5 px-2 rounded-lg">
                        {(purchaseTotalAmount - (Number(purchasePaidAmount) || 0)).toLocaleString('ar-YE')} ريال
                      </div>
                    </div>
                  </div>

                  {/* Helpers */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPurchasePaidAmount(purchaseTotalAmount)}
                      className="flex-1 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors text-center"
                    >
                      مدفوعة بالكامل ✅
                    </button>
                    <button
                      onClick={() => setPurchasePaidAmount(0)}
                      className="flex-1 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors text-center"
                    >
                      آجل بالكامل ❌
                    </button>
                  </div>
                </div>

                {/* Automatic Wholesale Profit Margin Cards Banner */}
                {totalAutoBonusCards > 0 && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-black text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <Gift size={16} className="text-emerald-600" />
                        <span>كروت بونص الجملة المكتسبة (تلقائياً):</span>
                      </span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {totalAutoBonusCards} كرت مجاني 🎁
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex flex-wrap gap-1.5">
                      {autoBonusBreakdown.map(b => (
                        <span key={b.category} className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded font-bold">
                          فئة {b.category}: {b.quantity} كرت (+{b.totalValue.toLocaleString()} ر.ي أرباح)
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      * تُحسب تلقائياً (بمعدل 1 كرت لكل 40 كرت) وتُضاف فوراً لهامش أرباح الجملة دون إدراجها في مخزون البيع.
                    </p>
                  </div>
                )}

                <div className="space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label className="block mb-0.5">بيان وتفاصيل الفاتورة (اختياري):</label>
                  <input
                    type="text"
                    placeholder="بيان إضافي (مثال: شراء كروت دفع أولى)..."
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500 text-xs"
                  />
                </div>

                <button
                  onClick={handleAddPurchase}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer text-center"
                >
                  تأكيد وحفظ فاتورة المشتريات وتحديث الكروت 🛒
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. ADD PAYMENT VOUCHER MODAL (سند دفع) */}
      <AnimatePresence>
        {showAddPaymentModal && selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowAddPaymentModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-2xl p-6 text-right z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">سند دفع حساب نقدي للوكيل</h3>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <label className="block mb-1 text-right">مبلغ الدفع/السداد: *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="أدخل القيمة بالريال..."
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-green-500 font-sans font-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block mb-1 text-right">تاريخ السند:</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center outline-none text-slate-950 dark:text-white focus:border-green-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block mb-1 text-right">بيان / ملاحظات السند:</label>
                  <input
                    type="text"
                    placeholder="مثال: سداد نقدي جزء من الحساب المتبقي"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-green-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-lg shadow-green-500/10 active:scale-95 transition-all cursor-pointer text-center"
                >
                  تسجيل وحفظ سند الصرف ✅
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* D. DIRECT SHARE INVOICE MODAL (مواءمة كاملة مع فاتورة المبيعات من انبثاق ومشاركة وطباعة وتنزيل وتراجع) */}
      <AnimatePresence>
        {sharingDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setSharingDetails(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-2xl p-6 text-right z-10 space-y-4 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  onClick={() => setSharingDetails(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">تم تسجيل الفاتورة بنجاح! 🎉</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  لقد تم حفظ فاتورة المشتريات وتحديث مخزن الكروت تلقائياً وإدراج المعاملة في كشف حساب الوكيل.
                </p>

                {/* Styled Receipt Preview Card */}
                <div className={`p-5 rounded-2xl border transition-all shadow-inner ${
                  isThermalMode 
                    ? "bg-white border-2 border-dashed border-black text-black font-mono" 
                    : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-800 dark:text-slate-200"
                }`}>
                  <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-800 mb-3">
                    <h4 className="font-extrabold text-sm">{getNetworkName() || 'شبكة المبيعات'}</h4>
                    <p className="text-[10px] opacity-75">فاتورة شراء وتوريد كروت اتصالات</p>
                  </div>
                  
                  <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300 dark:border-slate-800 mb-3 leading-relaxed">
                    <div className="flex justify-between">
                      <span className="font-bold">المورد/الوكيل:</span>
                      <span>{sharingDetails.agentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">التاريخ:</span>
                      <span>{sharingDetails.date}</span>
                    </div>
                    {sharingDetails.invoiceNum && (
                      <div className="flex justify-between">
                        <span className="font-bold">رقم الفاتورة:</span>
                        <span>{sharingDetails.invoiceNum}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] opacity-70">
                      <span>رقم المعاملة:</span>
                      <span>{sharingDetails.transactionId || 'TX-PUR-'}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
                    {sharingDetails.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-900/40 pb-1.5">
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white block">{item.label}</span>
                          <span className="text-[10px] text-slate-500 block">سعر الشراء: {item.price} ريال</span>
                        </div>
                        <div className="text-left font-bold text-slate-900 dark:text-white">
                          <span>{item.quantity} كرت</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 block">{item.total} ريال</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals Block */}
                  <div className="space-y-1 text-xs pt-2 border-t border-dashed border-slate-300 dark:border-slate-800 leading-relaxed">
                    <div className="flex justify-between font-bold">
                      <span>إجمالي قيمة الكروت:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">{sharingDetails.totalAmount} ريال</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                      <span>المبلغ المدفوع (الواصل):</span>
                      <span>{sharingDetails.paidAmount} ريال</span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400 font-bold">
                      <span>المتبقي من الفاتورة:</span>
                      <span>{sharingDetails.remainingAmount} ريال</span>
                    </div>
                    {sharingDetails.previousBalance !== undefined && (
                      <div className="flex justify-between text-amber-700 dark:text-amber-500 font-medium">
                        <span>الرصيد السابق للوكيل:</span>
                        <span>{sharingDetails.previousBalance} ريال</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-xs border-t border-slate-200 dark:border-slate-800 pt-1.5 text-slate-950 dark:text-white">
                      <span>صافي الحساب الكلي للوكيل:</span>
                      <span>{sharingDetails.currentBalance} ريال</span>
                    </div>
                  </div>
                </div>

                {/* Quick Thermal toggle switch inside receipt popup */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
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

                {/* Sharing Layout Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => {
                      downloadPurchaseInvoicePDF(sharingDetails, isThermalMode);
                      showToast('تم تحميل كشف الـ PDF بنجاح 📁', 'success');
                    }}
                    className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex flex-col items-center gap-1.5 text-xs font-black transition-colors active:scale-95 cursor-pointer"
                  >
                    <Share2 size={20} className="text-green-500" />
                    مشاركة عبر الواتساب
                  </button>

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleSendSMS}
                      className="flex-1 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors active:scale-95 cursor-pointer min-h-[44px]"
                    >
                      <FileText size={16} className="text-blue-500" />
                      <span>رسالة نصية (SMS)</span>
                    </button>
                    <button 
                      onClick={handleSendWhatsApp}
                      className="flex-1 p-2 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors active:scale-95 cursor-pointer min-h-[44px] shadow-sm shadow-green-600/10"
                    >
                      <MessageCircle size={16} className="text-white" />
                      <span>نصية عبر واتساب 💬</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      downloadPurchaseInvoicePDF(sharingDetails, isThermalMode);
                      showToast('تم تحميل الفاتورة بصيغة PDF بنجاح 📁', 'success');
                    }}
                    className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex flex-col items-center gap-1.5 text-xs font-black transition-colors active:scale-95 cursor-pointer"
                  >
                    <Download size={20} className="text-amber-500" />
                    تنزيل الفاتورة (PDF)
                  </button>

                  <button 
                    onClick={() => {
                      window.print();
                      showToast('جاري بدء الطباعة الحرارية المباشرة... 🖨️', 'success');
                    }}
                    className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 border border-amber-600/50 text-white flex flex-col items-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    <Printer size={20} className="text-white" />
                    طباعة حرارية مباشرة
                  </button>
                </div>

                {/* Footer buttons (Undo & Confirmation) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleUndoPurchase}
                    className="py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black rounded-2xl border border-rose-200/60 dark:border-rose-900/40 active:scale-95 transition-transform text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>↩️ تراجع وإلغاء الفاتورة</span>
                  </button>
                  <button 
                    onClick={() => setSharingDetails(null)}
                    className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl active:scale-95 transition-transform text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>فاتورة جديدة ومتابعة العمل</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Precision POS Thermal Print Component for Purchase Invoice (hidden print:block) */}
      {sharingDetails && (
        <div id="thermal-print-section" className="hidden print:block font-sans text-black bg-white w-full max-w-[80mm] mx-auto text-right text-xs leading-normal pb-4" style={{ direction: 'rtl' }}>
          {/* Header */}
          <div className="text-center font-bold pb-2 border-b border-dashed border-black mb-2">
            <h2 className="text-[13px] font-black tracking-wider m-0">{getNetworkName() || 'شبكة كروت'}</h2>
            <p className="text-[9px] m-0 font-normal">للإنترنت والخدمات والاتصالات والموزعين</p>
            <div className="mt-1">
              <span className="border border-black px-2 py-0.5 text-[9px] rounded font-black inline-block">فاتورة شراء وتوريد كروت</span>
            </div>
          </div>
          
          {/* Info */}
          <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-black mb-2 leading-relaxed">
            <div><span className="font-bold">اسم الوكيل:</span> {sharingDetails.agentName}</div>
            <div><span className="font-bold">التاريخ:</span> {sharingDetails.date}</div>
            <div><span className="font-bold">الوقت:</span> {new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</div>
            {sharingDetails.invoiceNum && (
              <div><span className="font-bold">رقم الفاتورة:</span> {sharingDetails.invoiceNum}</div>
            )}
            <div><span className="font-bold">رقم العملية:</span> {sharingDetails.transactionId || 'TX-PUR-'}</div>
          </div>

          {/* Table */}
          <table className="w-full text-[10px] text-right border-collapse mb-2">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="py-1 text-right font-black">تفاصيل الفئة كرت</th>
                <th className="py-1 text-center font-black">السعر</th>
                <th className="py-1 text-center font-black">الكمية</th>
                <th className="py-1 text-left font-black">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {sharingDetails.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dashed border-black/20">
                  <td className="py-1 text-right font-medium">{item.label}</td>
                  <td className="py-1 text-center font-bold">{item.price}</td>
                  <td className="py-1 text-center font-bold">{item.quantity} كرت</td>
                  <td className="py-1 text-left font-black">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 text-[10px] border-t border-dashed border-black pt-2 leading-relaxed">
            <div className="flex justify-between font-black text-[11px]">
              <span>إجمالي قيمة الفاتورة:</span>
              <span>{sharingDetails.totalAmount} ريال</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>المدفوع (الواصل):</span>
              <span>{sharingDetails.paidAmount} ريال</span>
            </div>
            <div className="flex justify-between font-bold text-red-600">
              <span>المتبقي من الفاتورة (آجل):</span>
              <span>{sharingDetails.remainingAmount} ريال</span>
            </div>
            {sharingDetails.previousBalance !== undefined && (
              <div className="flex justify-between font-bold text-amber-700">
                <span>الرصيد السابق للوكيل:</span>
                <span>{sharingDetails.previousBalance} ريال</span>
              </div>
            )}
            <div className="flex justify-between font-black text-[11px] border-t border-dashed border-black pt-1">
              <span>صافي الحساب الكلي للوكيل علينا:</span>
              <span>{sharingDetails.currentBalance} ريال</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[8px] mt-4 pt-2 border-t border-dashed border-black">
            <p className="m-0 font-bold">المورد والوكيل: {sharingDetails.agentName}</p>
            <p className="m-0 font-bold">تطبيق إدارة شبكة {getNetworkName()}</p>
            <p className="m-0 font-normal">نشكر ثقتكم بنا - [ لسنا الوحيدون ولكننا الافضل ]</p>
          </div>
        </div>
      )}

      {/* Pre-Export Configuration Modal for Agent Account Statement */}
      <AgentStatementModal
        isOpen={showStatementModal}
        onClose={() => {
          setShowStatementModal(false);
          setStatementModalAgent(null);
        }}
        agent={statementModalAgent || selectedAgent}
        showToast={showToast}
      />

      {/* E. EDIT AGENT MODAL */}
      <AnimatePresence>
        {showEditAgentModal && editingAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => {
                setShowEditAgentModal(false);
                setEditingAgent(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-2xl p-6 text-right z-10 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <button
                  onClick={() => {
                    setShowEditAgentModal(false);
                    setEditingAgent(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">تعديل بيانات الوكيل</h3>
                  <Edit3 size={16} className="text-blue-500" />
                </div>
              </div>

              <form onSubmit={handleSaveEditAgent} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <label className="block mb-1 text-right">اسم الوكيل الكامل: *</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الوكيل..."
                    value={editAgentName}
                    onChange={(e) => setEditAgentName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block mb-1 text-right">رقم الهاتف (اختياري):</label>
                  <input
                    type="tel"
                    placeholder="رقم الهاتف..."
                    value={editAgentPhone}
                    onChange={(e) => setEditAgentPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block mb-1 text-right">الوصف أو الملاحظات (اختياري):</label>
                  <textarea
                    placeholder="ملاحظات وتفاصيل إضافية..."
                    value={editAgentDesc}
                    onChange={(e) => setEditAgentDesc(e.target.value)}
                    className="w-full h-16 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer text-center"
                >
                  حفظ وتحديث بيانات الوكيل ✅
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* F. EDIT TRANSACTION MODAL (تعديل الفاتورة وتعديل هامش العمولة والبونص) */}
      <AnimatePresence>
        {showEditTxModal && editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => {
                setShowEditTxModal(false);
                setEditingTx(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-2xl p-5 text-right z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <button
                  onClick={() => {
                    setShowEditTxModal(false);
                    setEditingTx(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {editingTx.type === 'purchase' ? 'تعديل فاتورة المشتريات وهامش الكروت' : 'تعديل سند الصرف والسداد'}
                  </h3>
                  <Edit3 size={16} className="text-amber-500" />
                </div>
              </div>

              {editingTx.type === 'purchase' ? (
                /* Edit Purchase Invoice Form */
                <div className="space-y-3.5 text-right">
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                    <div>
                      <label className="block mb-1 text-right">تاريخ الفاتورة:</label>
                      <input
                        type="date"
                        value={editTxDate}
                        onChange={(e) => setEditTxDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-950 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-right">رقم الفاتورة:</label>
                      <input
                        type="text"
                        placeholder="رقم الفاتورة..."
                        value={editTxInvoiceNum}
                        onChange={(e) => setEditTxInvoiceNum(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right text-slate-950 dark:text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Items Grid for editing quantities and costs */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black text-slate-400 block">تعديل كميات الكروت وأسعار الشراء:</span>
                    
                    {[100, 200, 250, 300, 500].map(cat => (
                      <div 
                        key={cat} 
                        className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs shrink-0 text-slate-700 dark:text-slate-300">
                          <span>فئة {cat}</span>
                          <Package size={14} className="text-slate-400" />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Cost Input */}
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] opacity-75">سعر الكارت:</span>
                            <input
                              type="number"
                              min="0"
                              value={editTxCosts[cat]}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setEditTxCosts(prev => ({ ...prev, [cat]: val }));
                              }}
                              className="w-16 h-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-sans font-black text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* Quantity Counter */}
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] opacity-75">الكمية:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const cur = editTxQuantities[cat] || 0;
                                  setEditTxQuantities(prev => ({ ...prev, [cat]: Math.max(0, cur - 1) }));
                                }}
                                className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center cursor-pointer select-none"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={editTxQuantities[cat] || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setEditTxQuantities(prev => ({ ...prev, [cat]: val }));
                                }}
                                placeholder="0"
                                className="w-12 h-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-sans font-black text-slate-900 dark:text-white"
                              />
                              <button
                                onClick={() => {
                                  const cur = editTxQuantities[cat] || 0;
                                  setEditTxQuantities(prev => ({ ...prev, [cat]: cur + 1 }));
                                }}
                                className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total calculation */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">إجمالي الفاتورة الجديد:</span>
                    <span className="text-base font-black font-sans text-indigo-900 dark:text-indigo-200">
                      {[100, 200, 250, 300, 500].reduce((sum, cat) => sum + ((editTxQuantities[cat] || 0) * (editTxCosts[cat] || 0)), 0).toLocaleString('ar-YE')} ريال
                    </span>
                  </div>

                  {/* Wholesale Bonus Cards & Margin Preview */}
                  {editTotalAutoBonusCards > 0 && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-black text-emerald-800 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <Gift size={16} className="text-emerald-600" />
                          <span>هامش كروت البونص المكتسبة بعد التعديل:</span>
                        </span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {editTotalAutoBonusCards} كرت مجاني 🎁
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex flex-wrap gap-1.5">
                        {editAutoBonusBreakdown.map(b => (
                          <span key={b.category} className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded font-bold">
                            فئة {b.category}: {b.quantity} كرت (+{b.totalValue.toLocaleString()} ر.ي أرباح)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <label className="block mb-0.5">ملاحظات وبيان الفاتورة:</label>
                    <input
                      type="text"
                      placeholder="بيان الفاتورة..."
                      value={editTxNotes}
                      onChange={(e) => setEditTxNotes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-blue-500 text-xs"
                    />
                  </div>

                  <button
                    onClick={handleSaveEditTransaction}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer text-center"
                  >
                    حفظ وتحديث الفاتورة وهامش العمولة ✅
                  </button>
                </div>
              ) : (
                /* Edit Payment Voucher Form */
                <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="space-y-1">
                    <label className="block mb-1 text-right">مبلغ السداد/الدفع: *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="أدخل المبلغ..."
                      value={editTxAmount}
                      onChange={(e) => setEditTxAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-amber-500 font-sans font-black text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block mb-1 text-right">تاريخ السند:</label>
                    <input
                      type="date"
                      required
                      value={editTxDate}
                      onChange={(e) => setEditTxDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center outline-none text-slate-950 dark:text-white focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block mb-1 text-right">البيان / الملاحظات:</label>
                    <input
                      type="text"
                      placeholder="بيان السند..."
                      value={editTxNotes}
                      onChange={(e) => setEditTxNotes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-right outline-none text-slate-950 dark:text-white focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveEditTransaction}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer text-center"
                  >
                    حفظ وتحديث سند الصرف ✅
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
