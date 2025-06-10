import { useQuery, useMutation } from '@tanstack/react-query';
import { getLostItems, getLostItem, createLostItem, updateLostItem, deleteLostItem } from '../lib/db/lost-items';
import { queryClient, invalidateLostItems } from '../lib/query-client';
import { useToast } from './use-toast';

export function useLostItems(hotelId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['lostItems', { hotelId }],
    queryFn: () => getLostItems(hotelId),
    onError: (error) => {
      console.error('Error loading lost items:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les objets trouvés',
        variant: 'destructive',
      });
    },
  });
}

export function useLostItem(id: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['lostItems', id],
    queryFn: () => getLostItem(id),
    enabled: !!id, // Only run query if id is provided
    onError: (error) => {
      console.error(`Error loading lost item ${id}:`, error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'objet trouvé',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateLostItem() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createLostItem,
    onSuccess: () => {
      toast({
        title: 'Objet enregistré',
        description: 'L\'objet trouvé a été enregistré avec succès',
      });
      return invalidateLostItems();
    },
    onError: (error) => {
      console.error('Error creating lost item:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'enregistrement de l\'objet trouvé',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLostItem() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string; data: any }) => updateLostItem(data.id, data.data),
    onSuccess: () => {
      toast({
        title: 'Objet mis à jour',
        description: 'L\'objet trouvé a été mis à jour avec succès',
      });
      return invalidateLostItems();
    },
    onError: (error) => {
      console.error('Error updating lost item:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de l\'objet trouvé',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteLostItem() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteLostItem,
    onSuccess: () => {
      toast({
        title: 'Objet supprimé',
        description: 'L\'objet trouvé a été supprimé avec succès',
      });
      return invalidateLostItems();
    },
    onError: (error) => {
      console.error('Error deleting lost item:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de l\'objet trouvé',
        variant: 'destructive',
      });
    },
  });
}