import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      // Cloud Run terminates TLS at port 443; HMR must connect over secure wss:// on port 443
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        protocol: 'wss',
        clientPort: 443,
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@capacitor')) {
                return 'vendor-capacitor';
              }
              if (id.includes('jspdf') || id.includes('jspdf-autotable') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('exceljs')) {
                return 'vendor-excel';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('motion')) {
                return 'vendor-react';
              }
            }
            if (id.includes('amiriFontBase64')) {
              return 'font-amiri';
            }
          },
        },
      },
    },
  };
});
