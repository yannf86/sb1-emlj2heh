import { useQuery, useMutation } from '@tanstack/react-query';
import { getTechnicians, getTechnician, getTechniciansByHotel, createTechnician, updateTechnician, deleteTechnician } from '../lib/db/technicians';
import { queryClient } from '../lib/query-client';
import { useToast } from './use-toast';

// Hook for getting all technicians
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

// Hook for getting a single technician by ID
export function useTechnician(technicianId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['technicians', technicianId],
    queryFn: () => getTechnician(technicianId),
    enabled: !!technicianId, // Only run query if technicianId is provided
    onError: (error) => {
      console.error(`Error loading technician ${technicianId}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du technicien',
        variant: 'destructive',
      });
    },
  });
}

// Hook for getting technicians by hotel
export function useTechniciansByHotel(hotelId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['technicians', 'hotel', hotelId],
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

// Hook for creating a technician
export function useCreateTechnician() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createTechnician,
    onSuccess: () => {
      toast({
        title: 'Technicien créé',
        description: 'Le technicien a été créé avec succès',
      });
      return queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error) => {
      console.error('Error creating technician:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création du technicien',
        variant: 'destructive',
      });
    },
  });
}

// Hook for updating a technician
export function useUpdateTechnician() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string; data: Partial<any> }) => updateTechnician(data.id, data.data),
    onSuccess: () => {
      toast({
        title: 'Technicien mis à jour',
        description: 'Le technicien a été mis à jour avec succès',
      });
      return queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error) => {
      console.error('Error updating technician:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour du technicien',
        variant: 'destructive',
      });
    },
  });
}

// Hook for deleting a technician
export function useDeleteTechnician() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteTechnician,
    onSuccess: () => {
      toast({
        title: 'Technicien supprimé',
        description: 'Le technicien a été supprimé avec succès',
      });
      return queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error) => {
      console.error('Error deleting technician:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression du technicien',
        variant: 'destructive',
      });
    },
  });
}