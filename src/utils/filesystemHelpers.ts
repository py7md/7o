import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Interface representing the result of a save operation to the Krot directory.
 */
export interface KrotSaveResult {
  success: boolean;
  path?: string;
  error?: string;
  method: 'capacitor' | 'browser';
}

/**
 * Clean sanitization for filename to avoid slash conflicts or invalid characters.
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters with underscore
    .trim();
};

/**
 * Saves a file (text or binary base64) directly to the phone's native 'Krot' folder (via Capacitor)
 * or triggers a standard web browser download if running in the browser.
 * 
 * @param filename The name of the file (e.g. "فاتورة_بقالة_النور_12_5.pdf" or "backup_2026_07_01.json")
 * @param content The file content (either plain text for JSON, or full data URI/base64 for binary)
 * @param isBinary Set to true for PDF, image, or other binaries (content must be base64 or dataURI)
 */
export const saveFileToKrotFolder = async (
  filename: string,
  content: string,
  isBinary: boolean = false,
  skipBrowserDownload: boolean = false
): Promise<KrotSaveResult> => {
  const safeFilename = sanitizeFilename(filename);

  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Request public/documents storage permissions
      try {
        const permResult = await Filesystem.requestPermissions() as any;
        if (permResult?.publicStorage !== 'granted') {
          console.warn('Storage permission not fully granted, trying write anyway...');
        }
      } catch (permErr) {
        console.error('Error requesting filesystem permissions:', permErr);
      }

      // 2. Ensure the Krot directory exists in Documents
      try {
        await Filesystem.mkdir({
          path: 'Krot',
          directory: Directory.Documents,
          recursive: true
        });
      } catch (dirErr: any) {
        // Directory might already exist, which is expected
        console.log('Krot directory check:', dirErr.message || dirErr);
      }

      // 3. Prepare the data to be written
      let writeData = content;
      if (isBinary) {
        // If content is a data URI, extract the raw base64 part
        if (content.includes(';base64,')) {
          writeData = content.split(';base64,')[1];
        }
      }

      // 4. Write the file natively
      const result = await Filesystem.writeFile({
        path: `Krot/${safeFilename}`,
        data: writeData,
        directory: Directory.Documents,
        encoding: isBinary ? undefined : Encoding.UTF8
      });

      // Dispatch a custom event to notify UI
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('krot-file-saved', {
          detail: { filename: safeFilename, path: `Documents/Krot/${safeFilename}`, success: true }
        });
        window.dispatchEvent(event);
      }

      return {
        success: true,
        path: `Documents/Krot/${safeFilename}`,
        method: 'capacitor'
      };
    } else {
      if (skipBrowserDownload) {
        return {
          success: true,
          path: `تنزيلات الهاتف (تلقائياً)`,
          method: 'browser'
        };
      }

      // --- Web Browser Fallback ---
      const link = document.createElement('a');
      if (isBinary) {
        // If content is already a data URI or base64
        link.href = content.startsWith('data:') ? content : `data:application/pdf;base64,${content}`;
      } else {
        // Text/JSON content
        const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
        link.href = URL.createObjectURL(blob);
      }
      
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Dispatch custom event to notify UI
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('krot-file-saved', {
          detail: { filename: safeFilename, path: `مجلد التنزيلات (${safeFilename})`, success: true }
        });
        window.dispatchEvent(event);
      }

      return {
        success: true,
        path: `تنزيلات الهاتف (يرجى حفظه في مجلد Krot)`,
        method: 'browser'
      };
    }
  } catch (error: any) {
    console.error('Error saving to Krot folder:', error);
    return {
      success: false,
      error: error.message || String(error),
      method: Capacitor.isNativePlatform() ? 'capacitor' : 'browser'
    };
  }
};
