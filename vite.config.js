import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'RichPartnersTelegramSdk',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist/esm',
    rollupOptions: {
      external: ['@telegram-apps/sdk', 'crypto-js'],
    },
  },
});