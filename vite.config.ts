import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Optimisations de production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Séparation des chunks pour un meilleur cache
        manualChunks: {
          // Grouper les dépendances React
          react: ['react', 'react-dom', 'react-router-dom'],
          // Grouper Firebase
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Grouper les graphiques
          charts: ['recharts'],
          // Grouper les utilitaires
          utils: ['date-fns', 'lucide-react'],
        },
      },
    },
    // Optimiser les assets
    assetsInlineLimit: 4096, // Inline les assets < 4kb
    chunkSizeWarningLimit: 1000, // Warning pour les chunks > 1MB
  },
  // Configuration pour le développement
  server: {
    // Préchargement des modules pour des temps de chargement plus rapides
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
  },
});