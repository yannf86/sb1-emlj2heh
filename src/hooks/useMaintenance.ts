import { useQuery, useMutation } from '@tanstack/react-query';
import { getMaintenanceRequests, getMaintenanceRequest, createMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, getMaintenanceRequestsByTechnician } from '../lib/db/maintenance';
import { queryClient, invalidateMaintenanceRequests } from '../lib/query-client';
import { useToast } from './use-toast';

export function useMaintenanceRequests(hotelId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['maintenance', { hotelId }],
    queryFn: () => getMaintenanceRequests(hotelId),
    onError: (error) => {
      console.error('Error loading maintenance requests:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes de maintenance',
        variant: 'destructive',
      });
    },
  });
}

export function useMaintenanceRequest(id: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => getMaintenanceRequest(id),
    enabled: !!id, // Only run query if id is provided
    onError: (error) => {
      console.error(`Error loading maintenance request ${id}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de la demande de maintenance',
        variant: 'destructive',
      });
    },
  });
}

export function useMaintenanceRequestsByTechnician(technicianId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['maintenance', 'technician', technicianId],
    queryFn: () => getMaintenanceRequestsByTechnician(technicianId),
    enabled: !!technicianId, // Only run query if technicianId is provided
    onError: (error) => {
      console.error(`Error loading maintenance requests for technician ${technicianId}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes de maintenance pour ce technicien',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateMaintenanceRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: () => {
      toast({
        title: 'Demande créée',
        description: 'La demande de maintenance a été créée avec succès',
      });
      return invalidateMaintenanceRequests();
    },
    onError: (error) => {
      console.error('Error creating maintenance request:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de la demande de maintenance',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMaintenanceRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string; data: any; actorId?: string }) => 
      updateMaintenanceRequest(data.id, data.data, data.actorId),
    onSuccess: () => {
      toast({
        title: 'Demande mise à jour',
        description: 'La demande de maintenance a été mise à jour avec succès',
      });
      return invalidateMaintenanceRequests();
    },
    onError: (error) => {
      console.error('Error updating maintenance request:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la demande de maintenance',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMaintenanceRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteMaintenanceRequest,
    onSuccess: () => {
      toast({
        title: 'Demande supprimée',
        description: 'La demande de maintenance a été supprimée avec succès',
      });
      return invalidateMaintenanceRequests();
    },
    onError: (error) => {
      console.error('Error deleting maintenance request:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de la demande de maintenance',
        variant: 'destructive',
      });
    },
  });
}