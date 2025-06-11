import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { useToast } from './use-toast';
import { 
  getLogbookEntriesByDate, 
  createLogbookEntry, 
  updateLogbookEntry,
  deleteLogbookEntry as deleteLogbookEntryFn,
  markLogbookEntryAsRead,
  markLogbookEntryAsCompleted,
  unmarkLogbookEntryAsCompleted,
  addCommentToLogbookEntry,
  getActiveLogbookReminders,
  createLogbookReminder,
  updateLogbookReminder,
  markLogbookReminderAsCompleted
} from '../lib/db/logbook';

// Hook pour récupérer les entrées du cahier de consignes par date
export function useLogbookEntries(date: Date, hotelId?: string) {
  return useQuery({
    queryKey: ['logbook', 'entries', date.toISOString().split('T')[0], hotelId],
    queryFn: () => getLogbookEntriesByDate(date, hotelId),
    staleTime: 2 * 60 * 1000, // Les données restent fraîches pendant 2 minutes
  });
}

// Hook pour récupérer les rappels actifs
export function useLogbookReminders(date?: Date) {
  return useQuery({
    queryKey: ['logbook', 'reminders', date ? date.toISOString().split('T')[0] : 'active'],
    queryFn: () => getActiveLogbookReminders(date),
    staleTime: 2 * 60 * 1000, // Les données restent fraîches pendant 2 minutes
  });
}

// Hook pour créer une entrée de cahier de consignes
export function useCreateLogbookEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createLogbookEntry,
    onSuccess: () => {
      toast({
        title: 'Consigne créée',
        description: 'La consigne a été ajoutée avec succès au cahier de transmission',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
    onError: (error) => {
      console.error('Error creating logbook entry:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de la consigne',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour mettre à jour une entrée
export function useUpdateLogbookEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string, entry: any }) => updateLogbookEntry(data.id, data.entry),
    onSuccess: () => {
      toast({
        title: 'Consigne mise à jour',
        description: 'La consigne a été mise à jour avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
    onError: (error) => {
      console.error('Error updating logbook entry:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la consigne',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour supprimer une entrée
export function useDeleteLogbookEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteLogbookEntryFn,
    onSuccess: () => {
      toast({
        title: 'Consigne supprimée',
        description: 'La consigne a été supprimée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
    onError: (error) => {
      console.error('Error deleting logbook entry:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de la consigne',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour marquer une entrée comme lue
export function useMarkLogbookEntryAsRead() {
  return useMutation({
    mutationFn: markLogbookEntryAsRead,
    onSuccess: (data, entryId) => {
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
  });
}

// Hook pour marquer une entrée comme terminée
export function useMarkLogbookEntryAsCompleted() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: markLogbookEntryAsCompleted,
    onSuccess: () => {
      toast({
        title: 'Tâche terminée',
        description: 'La tâche a été marquée comme terminée',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
    onError: (error) => {
      console.error('Error marking logbook entry as completed:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du marquage de la tâche comme terminée',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour annuler le statut terminé d'une entrée
export function useUnmarkLogbookEntryAsCompleted() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (entryId: string) => unmarkLogbookEntryAsCompleted(entryId),
    onSuccess: () => {
      toast({
        title: 'Statut réinitialisé',
        description: 'La tâche n\'est plus marquée comme terminée',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
    onError: (error) => {
      console.error('Error unmarking logbook entry as completed:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la réinitialisation du statut de la tâche',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour ajouter un commentaire
export function useAddCommentToLogbookEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string, comment: string }) => addCommentToLogbookEntry(data.id, data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook', 'entries'] });
    },
    onError: (error) => {
      console.error('Error adding comment to logbook entry:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout du commentaire',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour créer un rappel
export function useCreateLogbookReminder() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createLogbookReminder,
    onSuccess: () => {
      toast({
        title: 'Rappel créé',
        description: 'Le rappel a été créé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'reminders'] });
    },
    onError: (error) => {
      console.error('Error creating logbook reminder:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création du rappel',
        variant: 'destructive',
      });
    },
  });
}

// Hook pour marquer un rappel comme terminé
export function useMarkLogbookReminderAsCompleted() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: markLogbookReminderAsCompleted,
    onSuccess: () => {
      toast({
        title: 'Rappel terminé',
        description: 'Le rappel a été marqué comme terminé',
      });
      queryClient.invalidateQueries({ queryKey: ['logbook', 'reminders'] });
    },
    onError: (error) => {
      console.error('Error marking logbook reminder as completed:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du marquage du rappel comme terminé',
        variant: 'destructive',
      });
    },
  });
}

// Exporter la fonction deleteLogbookEntry pour une utilisation directe
export { deleteLogbookEntry } from '../lib/db/logbook';