import { useQuery, useMutation } from '@tanstack/react-query';
import { getTechnicians, getTechnician, getTechniciansByHotel, updateTechnicianRating } from '../lib/db/technicians';
import { queryClient } from '../lib/query-client';
import { useToast } from './use-toast';

export function useTechnicians() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
    onError: (error) => {
      console.error('Error loading technicians:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les techniciens',
        variant: 'destructive',
      });
    },
  });
}

export function useTechnician(id: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['technicians', id],
    queryFn: () => getTechnician(id),
    enabled: !!id, // Only run query if id is provided
    onError: (error) => {
      console.error(`Error loading technician ${id}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du technicien',
        variant: 'destructive',
      });
    },
  });
}

export function useTechniciansByHotel(hotelId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['technicians', 'byHotel', hotelId],
    queryFn: () => getTechniciansByHotel(hotelId),
    enabled: !!hotelId, // Only run query if hotelId is provided
    onError: (error) => {
      console.error(`Error loading technicians for hotel ${hotelId}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les techniciens pour cet hôtel',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTechnicianRating() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { technicianId: string; rating: number }) => 
      updateTechnicianRating(data.technicianId, data.rating),
    onSuccess: () => {
      toast({
        title: 'Évaluation enregistrée',
        description: 'Merci d\'avoir évalué ce technicien',
      });
      return queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error) => {
      console.error('Error updating technician rating:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'enregistrement de l\'évaluation',
        variant: 'destructive',
      });
    },
  });
}