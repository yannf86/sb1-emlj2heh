import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized caching configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Les données restent fraîches pendant 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache conservé pendant 30 minutes
      refetchOnWindowFocus: false, // Ne pas refetch quand l'onglet regagne le focus
      refetchOnReconnect: true, // Refetch lors de la reconnexion internet
      retry: 1, // Réessayer une fois en cas d'échec
      keepPreviousData: true, // Garder les anciennes données pendant le chargement des nouvelles
    },
  },
});

// Helper functions to invalidate queries
export const invalidateIncidents = () => {
  return queryClient.invalidateQueries({ queryKey: ['incidents'] });
};

export const invalidateMaintenanceRequests = () => {
  return queryClient.invalidateQueries({ queryKey: ['maintenance'] });
};

export const invalidateLostItems = () => {
  return queryClient.invalidateQueries({ queryKey: ['lostItems'] });
};

export const invalidateHotels = () => {
  return queryClient.invalidateQueries({ queryKey: ['hotels'] });
};

export const invalidateUsers = () => {
  return queryClient.invalidateQueries({ queryKey: ['users'] });
};

export const invalidateGamificationStats = () => {
  return queryClient.invalidateQueries({ queryKey: ['gamification'] });
};