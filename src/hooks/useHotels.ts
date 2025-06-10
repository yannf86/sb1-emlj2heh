import { useQuery, useMutation } from '@tanstack/react-query';
import { getHotels, getHotelById } from '../lib/db/hotels';
import { queryClient, invalidateHotels } from '../lib/query-client';
import { useToast } from './use-toast';

export function useHotels() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['hotels'],
    queryFn: getHotels,
    onError: (error) => {
      console.error('Error loading hotels:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les hôtels',
        variant: 'destructive',
      });
    },
  });
}

export function useHotelById(hotelId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['hotels', hotelId],
    queryFn: () => getHotelById(hotelId),
    enabled: !!hotelId, // Only run query if hotelId is provided
    onError: (error) => {
      console.error(`Error loading hotel ${hotelId}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'hôtel',
        variant: 'destructive',
      });
    },
  });
}