import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { permissionsService } from '../services/firebase/permissionsService';
import { User } from '../types/users';

export function useUserPermissions() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [accessibleHotels, setAccessibleHotels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      loadUserPermissions();
    } else {
      setLoading(false);
    }
  }, [currentUser?.email]);

  const loadUserPermissions = async () => {
    if (!currentUser?.email) {
      console.log('useUserPermissions: No currentUser email');
      setLoading(false);
      return;
    }

    try {
      console.log('useUserPermissions: Loading permissions for:', currentUser.email);
      setLoading(true);
      
      // Charger les données utilisateur
      const user = await permissionsService.getCurrentUser(currentUser.email);
      console.log('useUserPermissions: Loaded user data:', user);
      setUserData(user);

      // Charger les hôtels accessibles
      const hotels = await permissionsService.getAccessibleHotels(currentUser.email);
      console.log('useUserPermissions: Loaded accessible hotels:', hotels);
      setAccessibleHotels(hotels);
      
      // Marquer comme initialisé après le premier chargement réussi
      setInitialized(true);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccessToHotel = async (hotelId: string): Promise<boolean> => {
    if (!currentUser?.email) return false;
    return await permissionsService.hasAccessToHotel(currentUser.email, hotelId);
  };

  const applyHotelFilter = async (requestedFilter?: string): Promise<string[]> => {
    if (!currentUser?.email) return [];
    return await permissionsService.applyHotelFilter(currentUser.email, requestedFilter);
  };

  const isSystemAdmin = userData?.role === 'system_admin';
  const isHotelAdmin = userData?.role === 'hotel_admin';

  return {
    userData,
    accessibleHotels,
    loading,
    initialized,
    hasAccessToHotel,
    applyHotelFilter,
    isSystemAdmin,
    isHotelAdmin,
    refreshPermissions: loadUserPermissions
  };
}