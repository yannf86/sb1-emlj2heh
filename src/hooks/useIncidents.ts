import { useQuery, useMutation } from '@tanstack/react-query';
import { getIncidents, getIncident, createIncident, updateIncident, deleteIncident } from '../lib/db/incidents';
import { queryClient, invalidateIncidents } from '../lib/query-client';
import { useToast } from './use-toast';

export function useIncidents(hotelId?: string, statusId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['incidents', { hotelId, statusId }],
    queryFn: () => getIncidents(hotelId, undefined, statusId),
    onError: (error) => {
      console.error('Error loading incidents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les incidents',
        variant: 'destructive',
      });
    },
  });
}

export function useIncident(id: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => getIncident(id),
    enabled: !!id, // Only run query if id is provided
    onError: (error) => {
      console.error(`Error loading incident ${id}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'incident',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateIncident() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      toast({
        title: 'Incident créé',
        description: 'L\'incident a été créé avec succès',
      });
      return invalidateIncidents();
    },
    onError: (error) => {
      console.error('Error creating incident:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de l\'incident',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateIncident() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string; data: any }) => updateIncident(data.id, data.data),
    onSuccess: () => {
      toast({
        title: 'Incident mis à jour',
        description: 'L\'incident a été mis à jour avec succès',
      });
      return invalidateIncidents();
    },
    onError: (error) => {
      console.error('Error updating incident:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de l\'incident',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteIncident() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => {
      toast({
        title: 'Incident supprimé',
        description: 'L\'incident a été supprimé avec succès',
      });
      return invalidateIncidents();
    },
    onError: (error) => {
      console.error('Error deleting incident:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de l\'incident',
        variant: 'destructive',
      });
    },
  });
}