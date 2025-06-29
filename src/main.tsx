import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

// Configuration optimisée du QueryClient pour les check-lists
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache pendant 5 minutes pour les données statiques (hôtels, utilisateurs)
      staleTime: 5 * 60 * 1000,
      // Cache pendant 10 minutes avant suppression
      gcTime: 10 * 60 * 1000,
      // Retry une seule fois en cas d'erreur
      retry: 1,
      // Ne pas refetch automatiquement au focus
      refetchOnWindowFocus: false,
      // Refetch en arrière-plan si les données sont stale
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry les mutations une fois en cas d'erreur
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
