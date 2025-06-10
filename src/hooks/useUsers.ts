import { useQuery, useMutation } from '@tanstack/react-query';
import { getUsers, getUser, getUserName, getUsersByRole, getUsersByHotel } from '../lib/db/users';
import { queryClient, invalidateUsers } from '../lib/query-client';
import { useToast } from './use-toast';

export function useUsers() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    onError: (error) => {
      console.error('Error loading users:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      });
    },
  });
}

export function useUser(userId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUser(userId),
    enabled: !!userId, // Only run query if userId is provided
    onError: (error) => {
      console.error(`Error loading user ${userId}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'utilisateur',
        variant: 'destructive',
      });
    },
  });
}

export function useUserName(userId: string) {
  return useQuery({
    queryKey: ['users', userId, 'name'],
    queryFn: () => getUserName(userId),
    enabled: !!userId, // Only run query if userId is provided
    staleTime: 24 * 60 * 60 * 1000, // User names are unlikely to change, so cache for 24 hours
  });
}

export function useUsersByRole(role: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['users', 'byRole', role],
    queryFn: () => getUsersByRole(role),
    enabled: !!role, // Only run query if role is provided
    onError: (error) => {
      console.error(`Error loading users with role ${role}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs par rôle',
        variant: 'destructive',
      });
    },
  });
}

export function useUsersByHotel(hotelId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['users', 'byHotel', hotelId],
    queryFn: () => getUsersByHotel(hotelId),
    enabled: !!hotelId, // Only run query if hotelId is provided
    onError: (error) => {
      console.error(`Error loading users for hotel ${hotelId}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs pour cet hôtel',
        variant: 'destructive',
      });
    },
  });
}