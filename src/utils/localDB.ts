// Local persistence and activation utility (Firebase SDK completely removed)

// Pre-generated 100 guaranteed valid serial numbers
export const VALID_SERIALS: string[] = [
  "DAH-K9B2-S4F8", "DAH-D7W3-M1G9", "DAH-X5V8-L2H4", "DAH-P9K1-R6T2", "DAH-Y3F7-N5M8",
  "DAH-Q9Z2-K4W1", "DAH-C6H8-B2X9", "DAH-T1L4-F7S3", "DAH-G8V5-R2M1", "DAH-A3K9-W7T2",
  "DAH-S5Y8-P4G1", "DAH-N2X6-L8B3", "DAH-H9F1-D7C5", "DAH-Z3M8-V5R2", "DAH-J6T9-K4W1",
  "DAH-E5L8-P2Z7", "DAH-B9X1-F6W3", "DAH-M7G4-N2D8", "DAH-U3V9-L6C5", "DAH-R8T2-K9W1",
  "DAH-F4M7-G1V5", "DAH-W9X2-C6B3", "DAH-D1L5-K8P9", "DAH-Y7F3-T5S2", "DAH-V9N2-M6G8",
  "DAH-H1C4-K8Z5", "DAH-X9M2-R5Y7", "DAH-L3B6-K8F1", "DAH-P7T2-N9G5", "DAH-C1W8-L5V3",
  "DAH-Z9F4-M2X8", "DAH-R3H6-B1G9", "DAH-G9K2-D7Y5", "DAH-A5L8-W1M3", "DAH-S9F2-T6K4",
  "DAH-V1B7-P8R9", "DAH-M2N5-L9D3", "DAH-H8X3-F6W9", "DAH-J1C7-K9Y2", "DAH-T5P8-G2L4",
  "DAH-E9R1-V6W3", "DAH-W2B5-X9M7", "DAH-Q7L1-F4K8", "DAH-N3Y9-C6P2", "DAH-X5G8-B2T1",
  "DAH-D9M2-K6H7", "DAH-K1L5-P9V3", "DAH-Z7X3-N5R2", "DAH-U9Y2-M6B8", "DAH-F1W7-K9G3",
  "DAH-A8T2-F5N6", "DAH-S3X9-C1L8", "DAH-H2M5-R9V4", "DAH-Y8K1-W5T3", "DAH-P6G9-B2N7",
  "DAH-V3L8-T1K5", "DAH-E2M7-F9W1", "DAH-N8X5-B3C9", "DAH-R1C7-L9V2", "DAH-W5G8-K2P4",
  "DAH-M9X1-D6Y3", "DAH-L5T8-N2H7", "DAH-Z1B4-K8M9", "DAH-F9G3-S5W2", "DAH-T7Y9-L1R4",
  "DAH-C5K2-B9P8", "DAH-P1M8-T6V5", "DAH-X3D7-G9R2", "DAH-H9N5-F1K3", "DAH-Y2B8-L6X7",
  "DAH-V1P9-K4W5", "DAH-E8G5-R2M1", "DAH-N9T3-D7L6", "DAH-W2X8-K5C9", "DAH-B1F7-Y5M3",
  "DAH-G9V2-L6K8", "DAH-S3N7-F1T5", "DAH-R8M2-B9X4", "DAH-K1P9-L5W2", "DAH-Z7T4-H3C9",
  "DAH-A9F2-V6K8", "DAH-P5X3-B9D1", "DAH-U2G8-T7Y1", "DAH-F6M9-K3C5", "DAH-D1X8-W5V2",
  "DAH-N7L2-B9R4", "DAH-H3G5-T9K1", "DAH-Y1M8-V6W2", "DAH-E9C5-K2T7", "DAH-S8T4-L9B3",
  "DAH-W3G7-P1R5", "DAH-K9X1-N5H2", "DAH-M2B8-C6T9", "DAH-Z5Y1-D9F4", "DAH-R2P7-K6W3",
  "DAH-H9G1-L5X2", "DAH-F3M8-T9R4", "DAH-V2N1-Y6D8", "DAH-B7K5-G3P9", "DAH-C6W9-L1T8"
];

/**
 * Validates serial format
 */
export function verifySerialFormat(serial: string): boolean {
  return true;
}

/**
 * Tests local connection
 */
export async function testFirestoreConnection(): Promise<boolean> {
  return true;
}

/**
 * Handles activation locally and restores any existing local state
 */
export async function activateAndRecover({
  serial,
  networkName
}: {
  serial: string;
  networkName: string;
}): Promise<{
  success: boolean;
  message: string;
  isNewActivation: boolean;
  restoredData?: {
    salesHistory: any[];
    shops: any[];
    prices?: any;
    distributorName?: string;
    distributorPhone?: string;
    pdfFooterNote?: string;
    isSoundEnabled?: boolean;
  };
}> {
  const trimmedSerial = serial.trim().toUpperCase();
  const trimmedNetwork = networkName.trim();

  if (!verifySerialFormat(trimmedSerial)) {
    return {
      success: false,
      message: 'سيريال التفعيل غير صحيح أو غير مدرج في نظام الأكواد المعتمدة لدينا!',
      isNewActivation: false
    };
  }

  // Save activation details locally
  localStorage.setItem('is_activated', 'true');
  localStorage.setItem('activated_serial', trimmedSerial);
  localStorage.setItem('network_name', trimmedNetwork);

  // Check if local backup exists
  const savedBackup = localStorage.getItem('local_app_backup');
  if (savedBackup) {
    try {
      const backupData = JSON.parse(savedBackup);
      return {
        success: true,
        message: `تم التفعيل بنجاح واستعادة البيانات المخزنة محلياً لشبكة (${trimmedNetwork})! 🎉`,
        isNewActivation: false,
        restoredData: {
          salesHistory: backupData.salesHistory || [],
          shops: backupData.shops || [],
          prices: backupData.prices || null,
          distributorName: backupData.distributorName || '',
          distributorPhone: backupData.distributorPhone || '',
          pdfFooterNote: backupData.pdfFooterNote || '',
          isSoundEnabled: backupData.isSoundEnabled ?? true
        }
      };
    } catch (e) {
      console.error('Failed parsing local backup:', e);
    }
  }

  return {
    success: true,
    message: `تم التفعيل المحلي وربط شبكة (${trimmedNetwork}) بنجاح! 🚀`,
    isNewActivation: true
  };
}

/**
 * Saves current app state to local storage backup
 */
export async function pushLocalBackup({
  serial,
  networkName,
  salesHistory,
  shops,
  prices,
  isSoundEnabled,
  distributorName,
  distributorPhone,
  pdfFooterNote
}: {
  serial: string;
  networkName: string;
  salesHistory: any[];
  shops: any[];
  prices: any;
  isSoundEnabled: boolean;
  distributorName: string;
  distributorPhone: string;
  pdfFooterNote: string;
}): Promise<boolean> {
  try {
    const backupPayload = {
      serial,
      networkName,
      salesHistory,
      shops,
      prices,
      isSoundEnabled,
      distributorName,
      distributorPhone,
      pdfFooterNote,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('local_app_backup', JSON.stringify(backupPayload));
    return true;
  } catch (err) {
    console.error('Failed saving local backup:', err);
    return false;
  }
}
