import { Capacitor, registerPlugin } from '@capacitor/core';

export interface LocalContactsPlugin {
  getLocalAndSimContacts: () => Promise<{
    contacts: Array<{
      name?: string;
      displayName?: string;
      phone?: string;
      phoneNumber?: string;
      phones?: Array<{ number: string }>;
    }>;
  }>;
  generatePdfReport?: (options: {
    title: string;
    content: string;
    fileName: string;
  }) => Promise<{
    success: boolean;
    filePath?: string;
  }>;
  [key: string]: any;
}

/**
 * Singleton LocalContacts plugin instance with idempotency guard.
 * Prevents "Capacitor plugin 'LocalContacts' already registered" error
 * caused by multiple imports or React component remounts / Fast Refresh.
 */
export const LocalContacts = 
  (Capacitor as any).Plugins?.LocalContacts ||
  registerPlugin<LocalContactsPlugin>('LocalContacts');
