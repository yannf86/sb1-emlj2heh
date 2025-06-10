import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { queryClient } from '../lib/query-client';

/**
 * Hook pour précharger les données lorsqu'un utilisateur s'authentifie
 */
export function usePrefetchData() {
  const location = useLocation();
  
  // Préchargement des données les plus utilisées
  useEffect(() => {
    // Précharger uniquement à la connexion (dashboard) ou à l'accès initial
    if (location.pathname === '/dashboard' || location.pathname === '/') {
      console.log('🔄 Préchargement des données fréquemment utilisées...');
      
      // Préchargement des données de base
      queryClient.prefetchQuery({ 
        queryKey: ['hotels'],
        queryFn: () => import('../lib/db/hotels').then(module => module.getHotels())
      });
      
      queryClient.prefetchQuery({ 
        queryKey: ['users'],
        queryFn: () => import('../lib/db/users').then(module => module.getUsers())
      });
      
      // Préchargement des paramètres (rarement modifiés)
      queryClient.prefetchQuery({ 
        queryKey: ['parameters', 'status'],
        queryFn: () => import('../lib/db/parameters-status').then(module => module.getStatusParameters())
      });
      
      queryClient.prefetchQuery({ 
        queryKey: ['parameters', 'incident_category'],
        queryFn: () => import('../lib/db/parameters-incident-categories').then(module => module.getIncidentCategoryParameters())
      });
      
      // Préchargement asynchrone des données principales pour les modules principaux
      setTimeout(() => {
        queryClient.prefetchQuery({ 
          queryKey: ['incidents'],
          queryFn: () => import('../lib/db/incidents').then(module => module.getIncidents())
        });
        
        queryClient.prefetchQuery({ 
          queryKey: ['maintenance'],
          queryFn: () => import('../lib/db/maintenance').then(module => module.getMaintenanceRequests())
        });
      }, 2000); // Délai pour permettre au chargement initial de se terminer
    }
  }, [location.pathname]);

  return null;
}

/**
 * Hook pour optimiser les requêtes lors de la navigation entre écrans
 */
export function useOptimizedQueries() {
  const location = useLocation();

  useEffect(() => {
    // Optimiser les requêtes basées sur le chemin actuel
    switch(location.pathname) {
      case '/incidents':
        // Précharger les données connexes pour l'écran incidents
        queryClient.prefetchQuery({ 
          queryKey: ['parameters', 'impact'],
          queryFn: () => import('../lib/db/parameters-impact').then(module => module.getImpactParameters())
        });
        break;
        
      case '/maintenance':
        // Précharger les données connexes pour l'écran maintenance
        queryClient.prefetchQuery({ 
          queryKey: ['technicians'],
          queryFn: () => import('../lib/db/technicians').then(module => module.getTechnicians())
        });
        break;
        
      case '/lost-found':
        // Précharger les données connexes pour l'écran objets trouvés
        queryClient.prefetchQuery({ 
          queryKey: ['parameters', 'lost_item_type'],
          queryFn: () => import('../lib/db/parameters-lost-item-type').then(module => module.getLostItemTypeParameters())
        });
        break;
        
      default:
        break;
    }
  }, [location.pathname]);

  return null;
}