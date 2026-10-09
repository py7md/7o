import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Search, Phone, User, Smartphone } from 'lucide-react';
import { LocalContacts } from '../utils/localContactsPlugin';

interface Contact {
  name: string;
  phone: string;
}

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string, phone: string) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}

const SAMPLE_CONTACTS: Contact[] = [
  { name: 'بقالة البركة', phone: '773086403' },
  { name: 'سوبرماركت المدينة', phone: '775566778' },
  { name: 'بقالة السلام', phone: '733445566' },
  { name: 'بقالة النور والهدى', phone: '711223344' },
  { name: 'سوبر ماركت الوفاء', phone: '771223344' },
  { name: 'بقالة الأمانة', phone: '770123456' },
  { name: 'موزع كروت الشبكة', phone: '773086403' },
  { name: 'بقالة الرشيد', phone: '770112233' },
  { name: 'بقالة الياسمين', phone: '775544332' }
];

export const ContactPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  showToast
}: ContactPickerModalProps) => {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [contactsList, setContactsList] = useState<Contact[]>(SAMPLE_CONTACTS);

  // Search filter
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contactsList;
    return contactsList.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [search, contactsList]);

  // Request native contacts
  const handleNativeContactPicker = async () => {
    try {
      // First try the native LocalContacts Capacitor plugin!
      if (typeof LocalContacts?.getLocalAndSimContacts === 'function') {
        const result = await LocalContacts.getLocalAndSimContacts();
        if (result && Array.isArray(result.contacts) && result.contacts.length > 0) {
          const cleaned = result.contacts
            .map((c: any) => {
              const rawPhone = c.phone || c.phoneNumber || (Array.isArray(c.phones) ? c.phones[0]?.number : '') || '';
              let cleanPhone = String(rawPhone).replace(/[\s\-\(\)]/g, '');
              if (cleanPhone.startsWith('+967')) {
                cleanPhone = cleanPhone.replace('+967', '');
              } else if (cleanPhone.startsWith('00967')) {
                cleanPhone = cleanPhone.replace('00967', '');
              }
              return { 
                name: (c.name || c.displayName || 'بدون اسم').trim(), 
                phone: cleanPhone.trim() 
              };
            })
            .filter((c: any) => c.phone.length > 0);

          if (cleaned.length > 0) {
            setContactsList(cleaned);
            showToast('تم استيراد جهات اتصال الهاتف والشريحة بنجاح! 👤', 'success');
            return;
          }
        }
      }
    } catch (err) {
      console.log('Capacitor LocalContacts failed or unavailable, trying browser fallback:', err);
    }

    const supportsContacts = 'contacts' in navigator && typeof (navigator as any).contacts?.select === 'function';
    if (supportsContacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const name = contact.name && contact.name[0] ? contact.name[0] : '';
          const phone = contact.tel && contact.tel[0] ? contact.tel[0] : '';
          
          // Clean phone numbers (remove spaces, country codes, etc.)
          let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
          if (cleanPhone.startsWith('+967')) {
            cleanPhone = cleanPhone.replace('+967', '');
          } else if (cleanPhone.startsWith('00967')) {
            cleanPhone = cleanPhone.replace('00967', '');
          }
          
          if (name) {
            onSelect(name, cleanPhone);
            showToast(`تم استيراد جهة الاتصال: ${name} بنجاح! 👤`, 'success');
            onClose();
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
        showToast('تم إلغاء أو تعذر الوصول لجهات اتصال جهازك ⚠️', 'error');
      }
    } else {
      showToast('المتصفح الحالي لا يدعم سحب جهات الاتصال مباشرة، يرجى كتابتها أو اختيارها من القائمة بالأسفل 📱', 'info');
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    const phone = customPhone.trim();
    if (!name) {
      showToast('يرجى كتابة اسم جهة الاتصال', 'error');
      return;
    }
    onSelect(name, phone);
    showToast(`تم اختيار جهة الاتصال: ${name} 👤`, 'success');
    setCustomName('');
    setCustomPhone('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-5 overflow-hidden flex flex-col max-h-[85vh] text-right"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-slate-800 dark:text-white">اختر من جهات الاتصال</span>
            <User size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 font-sans text-xs">
          {/* Native Picker Button */}
          <button
            onClick={handleNativeContactPicker}
            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-100/50 dark:border-indigo-900/40 rounded-2xl text-indigo-700 dark:text-indigo-400 font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Smartphone size={16} />
            <span>سحب من جهات اتصال الهاتف 📱</span>
          </button>

          {/* Custom Add Form */}
          <form onSubmit={handleAddCustom} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
            <h4 className="font-black text-slate-800 dark:text-slate-300 text-right">إدخال يدوي مخصص وسريع:</h4>
            
            <div className="space-y-2">
              <div>
                <input
                  type="text"
                  placeholder="اسم العميل / البقالة"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-colors text-right"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="رقم الهاتف (مثال: 773086403)"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-colors text-right font-sans"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer active:scale-95"
                >
                  اعتماد
                </button>
              </div>
            </div>
          </form>

          {/* Sample List Search */}
          <div className="space-y-2.5">
            <h4 className="font-black text-slate-400 dark:text-slate-500 text-right">أو اختر من جهات الاتصال الشائعة:</h4>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 ابحث بالاسم أو الرقم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-colors text-right"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Contacts List */}
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-bold italic">
                  لا توجد جهات اتصال تطابق بحثك
                </div>
              ) : (
                filteredContacts.map((contact, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelect(contact.name, contact.phone);
                      showToast(`تم اختيار: ${contact.name} 👤`, 'success');
                      onClose();
                    }}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-100/50 dark:border-slate-800/60 rounded-xl flex items-center justify-between transition-colors cursor-pointer text-right group"
                  >
                    <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-sans">{contact.phone}</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{contact.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
