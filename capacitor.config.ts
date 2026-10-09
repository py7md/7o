import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dahshah.calculator',
  appName: 'حاسبة الدحشة',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
