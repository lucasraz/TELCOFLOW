import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kB (padrão é 500kB)
    // Isso suprime o aviso "Some chunks are larger than 500 kBs"
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa dependências do node_modules em um arquivo 'vendor' separado
          // Isso ajuda no cache do navegador e organização do build
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});