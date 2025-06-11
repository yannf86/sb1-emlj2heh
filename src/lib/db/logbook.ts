import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';
import { formatToISOLocalDate, parseISOLocalDate, isDateInRange, normalizeToMidnight } from '../date-utils';

// Interface pour les entrées du cahier de consignes
export interface LogbookEntry {
  id?: string;
  date: string;
  time: string;
  endDate?: string;
  displayRange?: boolean;
  hotelId: string;
  serviceId: string;
  serviceName?: string;
  serviceIcon?: string;
  content: string;
  authorId: string;
  authorName?: string;
  importance: number;
  isTask?: boolean;
  isCompleted?: boolean;
  hotelName?: string;
  roomNumber?: string;
  isRead?: boolean;
  completedDates?: string[]; // Tableau des dates complétées pour les tâches avec plage de dates
  comments?: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  history?: {
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
  }[];
  hasReminder?: boolean;
  reminderTitle?: string;
  reminderDescription?: string;
  reminderUserIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Interface pour les rappels
export interface LogbookReminder {
  id?: string;
  entryId: string;
  title: string;
  description?: string;
  remindAt: string;
  endDate?: string;
  displayRange?: boolean;
  isCompleted?: boolean;
  completedById?: string;
  completedByName?: string;
  completedAt?: string;
  userIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les entrées du cahier de consignes pour une date spécifique
 * @param date Date pour laquelle récupérer les entrées du cahier de consignes
 * @param hotelId ID de l'hôtel (optionnel)
 * @returns Promise avec un tableau d'entrées de cahier de consignes
 */
export const getLogbookEntriesByDate = async (date: Date, hotelId?: string): Promise<LogbookEntry[]> => {
  try {
    // Normaliser la date à minuit pour une comparaison stable
    const normalizedDate = normalizeToMidnight(new Date(date.getTime()));
    
    // Obtenir la date au format YYYY-MM-DD uniquement
    const formattedDate = formatToISOLocalDate(normalizedDate);
    
    console.log(`Fetching logbook entries for date: ${formattedDate}, hotelId: ${hotelId || 'all'}`);
    
    let baseQuery = collection(db, 'logbook_entries');
    let queryConstraints = [];

    // Filtrer par hôtel
    if (hotelId) {
      queryConstraints.push(where('hotelId', '==', hotelId));
    }

    // Vérifier les entrées qui ont une date unique correspondant à la date
    const singleDateQuery = query(
      baseQuery,
      ...queryConstraints,
      where('displayRange', '==', false),
      where('date', '==', formattedDate)
    );

    // Pour les entrées avec plage de dates
    const rangeQuery = query(
      baseQuery,
      ...queryConstraints,
      where('displayRange', '==', true)
    );

    // Exécuter les deux requêtes
    const [singleDateSnapshot, rangeSnapshot] = await Promise.all([
      getDocs(singleDateQuery),
      getDocs(rangeQuery)
    ]);

    // Pour les entrées à date unique, on les prend tous
    const singleDateEntries = singleDateSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${singleDateEntries.length} single date entries for ${formattedDate}`);

    // Pour les entrées avec plage, on filtre en mémoire
    const rangeEntries = rangeSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(entry => {
        // Normaliser les dates sans dépendance au fuseau horaire
        const startDateStr = entry.date;
        const endDateStr = entry.endDate || startDateStr;
        
        // Convertir en objets Date sans problèmes de fuseau horaire
        const startDate = parseISOLocalDate(startDateStr);
        const endDate = parseISOLocalDate(endDateStr);
        const selectedDateObj = normalizedDate;
        
        // Vérifier si la date sélectionnée est dans la plage
        return isDateInRange(selectedDateObj, startDate, endDate);
      });
    
    console.log(`Found ${rangeEntries.length} range entries for ${formattedDate}`);

    // Combiner les résultats
    const entries = [...singleDateEntries, ...rangeEntries] as LogbookEntry[];

    // Trier les résultats en JavaScript
    entries.sort((a, b) => {
      // D'abord par importance (décroissante)
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      
      // Ensuite par date et heure (plus récent en premier)
      // Utiliser les chaînes directement pour éviter les problèmes de fuseau horaire
      const dateTimeA = `${a.date}T${a.time || '00:00'}`;
      const dateTimeB = `${b.date}T${b.time || '00:00'}`;
      
      return dateTimeB.localeCompare(dateTimeA);
    });
    
    console.log(`Total entries for ${formattedDate}: ${entries.length}`);

    return entries;
  } catch (error) {
    console.error('Error getting logbook entries:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle entrée dans le cahier de consignes
 * @param entry Élément de cahier de consignes à créer
 * @returns Promise avec l'ID de la nouvelle entrée créée
 */
export const createLogbookEntry = async (entry: Omit<LogbookEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Valider l'entrée
    if (!entry.hotelId) {
      throw new Error('Hotel ID is required');
    }
    if (!entry.serviceId) {
      throw new Error('Service ID is required');
    }
    if (!entry.content) {
      throw new Error('Content is required');
    }
    
    // S'assurer que la date est au format YYYY-MM-DD
    // On ne modifie pas la date d'entrée, on extrait simplement la partie date
    const entryDate = entry.date.split('T')[0];
    console.log(`Creating entry for date: ${entryDate}`);

    // Ajouter les informations d'historique
    const history = [{
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create',
      details: 'Création de la consigne'
    }];

    // Ajouter les informations de création
    const entryToCreate = {
      ...entry,
      date: entryDate, // Assurons-nous que la date est bien au format YYYY-MM-DD
      authorId: currentUser.id,
      authorName: currentUser.name,
      isRead: true,
      comments: [],
      history,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id,
      updatedBy: currentUser.id
    };

    // Créer l'entrée dans Firestore
    const docRef = await addDoc(collection(db, 'logbook_entries'), entryToCreate);
    
    // Si cette entrée a un rappel, créer également un rappel
    if (entry.hasReminder && entry.reminderTitle) {
      await createLogbookReminder({
        entryId: docRef.id,
        title: entry.reminderTitle,
        description: entry.reminderDescription || null,
        remindAt: entry.date,
        endDate: entry.displayRange ? entry.endDate : null,
        displayRange: entry.displayRange,
        userIds: entry.reminderUserIds || [currentUser.id]
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating logbook entry:', error);
    throw error;
  }
};

/**
 * Mettre à jour une entrée existante
 * @param id ID de l'entrée à mettre à jour
 * @param entry Données de l'entrée à mettre à jour
 * @returns Promise<void>
 */
export const updateLogbookEntry = async (id: string, entry: Partial<LogbookEntry>): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Récupérer l'entrée existante
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Entry not found');
    }

    const existingEntry = entrySnap.data() as LogbookEntry;

    // Créer une entrée d'historique pour cette modification
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      details: 'Modification de la consigne'
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Si des dates sont fournies, s'assurer qu'elles sont au format YYYY-MM-DD
    const updatedEntry = { ...entry };
    if (entry.date) {
      updatedEntry.date = entry.date.split('T')[0];
    }
    if (entry.endDate) {
      updatedEntry.endDate = entry.endDate.split('T')[0];
    }

    // Mettre à jour l'entrée dans Firestore
    await updateDoc(entryRef, {
      ...updatedEntry,
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });

    // Mettre à jour le rappel associé si nécessaire
    if (entry.hasReminder !== undefined || entry.reminderTitle || entry.reminderDescription || 
        entry.displayRange !== undefined || entry.date || entry.endDate) {
      
      // Récupérer les rappels associés à cette entrée
      const remindersQuery = query(
        collection(db, 'logbook_reminders'),
        where('entryId', '==', id)
      );
      const reminderSnap = await getDocs(remindersQuery);
      
      if (!reminderSnap.empty) {
        // Mettre à jour le rappel existant
        const reminderId = reminderSnap.docs[0].id;
        
        const reminderUpdate: Partial<LogbookReminder> = {};
        
        if (entry.reminderTitle) reminderUpdate.title = entry.reminderTitle;
        if (entry.reminderDescription) reminderUpdate.description = entry.reminderDescription;
        if (entry.date) reminderUpdate.remindAt = entry.date;
        if (entry.endDate) reminderUpdate.endDate = entry.endDate;
        if (entry.displayRange !== undefined) reminderUpdate.displayRange = entry.displayRange;
        
        if (Object.keys(reminderUpdate).length > 0) {
          await updateLogbookReminder(reminderId, reminderUpdate);
        }
      } else if (entry.hasReminder && entry.reminderTitle) {
        // Créer un nouveau rappel
        await createLogbookReminder({
          entryId: id,
          title: entry.reminderTitle,
          description: entry.reminderDescription || null,
          remindAt: entry.date || existingEntry.date,
          endDate: entry.displayRange ? entry.endDate : null,
          displayRange: entry.displayRange,
          userIds: entry.reminderUserIds || [currentUser.id]
        });
      }
    }
  } catch (error) {
    console.error('Error updating logbook entry:', error);
    throw error;
  }
};

/**
 * Supprimer une entrée
 * @param id ID de l'entrée à supprimer
 * @returns Promise<void>
 */
export const deleteLogbookEntry = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    console.log(`Attempting to delete logbook entry with id: ${id}`);
    
    // Vérifier si l'entrée existe
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      console.warn(`Entry with ID ${id} not found, but deletion operation is considered successful since the entry is already absent`);
      // Don't throw an error - if the entry doesn't exist, deletion goal is already achieved
      return;
    }
    
    // Supprimer d'abord les rappels associés
    try {
      const remindersQuery = query(
        collection(db, 'logbook_reminders'),
        where('entryId', '==', id)
      );
      const reminderSnap = await getDocs(remindersQuery);
      
      // Delete each reminder document
      const deletePromises = reminderSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Deleted ${deletePromises.length} associated reminders`);
    } catch (reminderError) {
      console.error('Error deleting associated reminders:', reminderError);
      // Continue with the entry deletion even if reminder deletion fails
    }

    // Then delete the entry itself
    await deleteDoc(entryRef);
    console.log(`Successfully deleted logbook entry with id: ${id}`);
  } catch (error) {
    console.error('Error deleting logbook entry:', error);
    throw error;
  }
};

/**
 * Marquer une entrée comme lue
 * @param id ID de l'entrée à marquer comme lue
 * @returns Promise<void>
 */
export const markLogbookEntryAsRead = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Récupérer l'entrée existante
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Entry not found');
    }

    const existingEntry = entrySnap.data() as LogbookEntry;

    // Créer une entrée d'historique pour cette action
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'read',
      details: 'Consigne marquée comme lue'
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Mettre à jour l'entrée dans Firestore
    await updateDoc(entryRef, {
      isRead: true,
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
  } catch (error) {
    console.error('Error marking logbook entry as read:', error);
    throw error;
  }
};

/**
 * Marquer une entrée comme terminée
 * @param id ID de l'entrée à marquer comme terminée
 * @returns Promise<void>
 */
export const markLogbookEntryAsCompleted = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Récupérer l'entrée existante
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Entry not found');
    }

    const existingEntry = entrySnap.data() as LogbookEntry;
    
    // Si c'est une tâche avec une plage de dates, nous stockons la date actuelle comme "completed"
    // dans un tableau des dates complétées, plutôt que de marquer toute la tâche comme complétée
    const today = formatToISOLocalDate(new Date());
    const historyAction = existingEntry.displayRange ? 'complete_for_date' : 'complete';
    const historyDetails = existingEntry.displayRange 
      ? `Tâche marquée comme terminée pour le ${today}`
      : 'Tâche marquée comme terminée';
      
    // Créer une entrée d'historique pour cette action
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: historyAction,
      details: historyDetails
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Mettre à jour l'entrée dans Firestore
    const updateData: any = {
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    
    // Si c'est une tâche avec plage de dates, stocker les dates de complétion
    if (existingEntry.displayRange && existingEntry.isTask) {
      // Initialiser ou mettre à jour le tableau des dates complétées
      const completedDates = existingEntry.completedDates || [];
      if (!completedDates.includes(today)) {
        completedDates.push(today);
      }
      updateData.completedDates = completedDates;
    } else {
      // Pour les tâches normales, marquer simplement comme terminé
      updateData.isCompleted = true;
    }
    
    await updateDoc(entryRef, updateData);
  } catch (error) {
    console.error('Error marking logbook entry as completed:', error);
    throw error;
  }
};

/**
 * Annuler le statut terminé d'une entrée pour une date spécifique
 * @param id ID de l'entrée à modifier
 * @param dateStr Date spécifique à annuler au format YYYY-MM-DD (par défaut: aujourd'hui)
 * @returns Promise<void>
 */
export const unmarkLogbookEntryAsCompleted = async (id: string, dateStr?: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Récupérer l'entrée existante
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Entry not found');
    }

    const existingEntry = entrySnap.data() as LogbookEntry;
    const targetDate = dateStr || formatToISOLocalDate(new Date());
    
    // Créer une entrée d'historique pour cette action
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: existingEntry.displayRange ? 'uncomplete_for_date' : 'uncomplete',
      details: existingEntry.displayRange 
        ? `Statut "terminé" annulé pour le ${targetDate}` 
        : 'Statut "terminé" annulé'
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Préparer les données à mettre à jour
    const updateData: any = {
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    
    // Mettre à jour selon le type d'entrée
    if (existingEntry.displayRange && existingEntry.completedDates) {
      // Pour les tâches avec plage de dates, retirer la date du tableau des dates complétées
      updateData.completedDates = existingEntry.completedDates.filter(date => date !== targetDate);
    } else {
      // Pour les tâches normales, marquer comme non terminée
      updateData.isCompleted = false;
    }
    
    await updateDoc(entryRef, updateData);
  } catch (error) {
    console.error('Error unmarking logbook entry as completed:', error);
    throw error;
  }
};

/**
 * Ajouter un commentaire à une entrée
 * @param id ID de l'entrée à commenter
 * @param comment Contenu du commentaire
 * @returns Promise<void>
 */
export const addCommentToLogbookEntry = async (id: string, comment: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Récupérer l'entrée existante
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Entry not found');
    }

    const existingEntry = entrySnap.data() as LogbookEntry;

    // Créer un nouveau commentaire
    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: comment,
      createdAt: new Date().toISOString()
    };

    // Mettre à jour les commentaires
    const comments = existingEntry.comments || [];
    comments.push(newComment);

    // Créer une entrée d'historique pour cette action
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'comment',
      details: 'Commentaire ajouté'
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Mettre à jour l'entrée dans Firestore
    await updateDoc(entryRef, {
      comments,
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
  } catch (error) {
    console.error('Error adding comment to logbook entry:', error);
    throw error;
  }
};

/**
 * Créer un rappel pour une entrée
 * @param reminder Rappel à créer
 * @returns Promise<string>
 */
export const createLogbookReminder = async (reminder: Omit<LogbookReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // CORRECTION: Vérifier d'abord si un rappel pour cette entrée existe déjà
    // pour éviter la duplication de rappels
    const reminderQuery = query(
      collection(db, 'logbook_reminders'),
      where('entryId', '==', reminder.entryId)
    );
    
    const existingReminders = await getDocs(reminderQuery);
    if (!existingReminders.empty) {
      // Un rappel existe déjà, mettre à jour celui-ci au lieu d'en créer un nouveau
      const existingReminderId = existingReminders.docs[0].id;
      
      // Mettre à jour le rappel existant
      await updateDoc(doc(db, 'logbook_reminders', existingReminderId), {
        ...reminder,
        updatedAt: new Date().toISOString()
      });
      
      console.log("Rappel existant mis à jour au lieu d'en créer un nouveau:", existingReminderId);
      return existingReminderId;
    }

    // Aucun rappel existant, créer un nouveau
    const reminderToCreate = {
      ...reminder,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'logbook_reminders'), reminderToCreate);
    console.log("Nouveau rappel créé:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating logbook reminder:', error);
    throw error;
  }
};

/**
 * Mettre à jour un rappel
 * @param id ID du rappel à mettre à jour
 * @param reminder Données du rappel à mettre à jour
 * @returns Promise<void>
 */
export const updateLogbookReminder = async (id: string, reminder: Partial<LogbookReminder>): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Mettre à jour le rappel dans Firestore
    await updateDoc(doc(db, 'logbook_reminders', id), {
      ...reminder,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating logbook reminder:', error);
    throw error;
  }
};

/**
 * Marquer un rappel comme terminé
 * @param id ID du rappel à marquer comme terminé
 * @returns Promise<void>
 */
export const markLogbookReminderAsCompleted = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Mettre à jour le rappel dans Firestore
    await updateDoc(doc(db, 'logbook_reminders', id), {
      isCompleted: true,
      completedById: currentUser.id,
      completedByName: currentUser.name,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking logbook reminder as completed:', error);
    throw error;
  }
};

/**
 * Obtenir tous les rappels actifs
 * @param date Date pour laquelle obtenir les rappels (facultatif)
 * @returns Promise avec un tableau de rappels
 */
export const getActiveLogbookReminders = async (date?: Date): Promise<LogbookReminder[]> => {
  try {
    const selectedDate = date || new Date();
    const normalizedDate = normalizeToMidnight(new Date(selectedDate.getTime()));
    
    // S'assurer que nous avons un format de date cohérent sans heure
    const formattedDate = formatToISOLocalDate(normalizedDate);
    console.log(`Getting active reminders for date: ${formattedDate}`);
    
    // Requête pour tous les rappels non complétés
    const remindersQuery = query(
      collection(db, 'logbook_reminders'),
      where('isCompleted', '==', false)
    );
    
    const snapshot = await getDocs(remindersQuery);
    
    // Filtrer pour obtenir les rappels correspondant à la date sélectionnée
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(reminder => {
        // Extraire juste la partie date sans l'heure
        const remindAtDateStr = reminder.remindAt.split('T')[0];
        
        // Si c'est une plage de dates
        if (reminder.displayRange && reminder.endDate) {
          const startDateStr = reminder.remindAt.split('T')[0];
          const endDateStr = reminder.endDate.split('T')[0];
          
          // Vérifier si la date sélectionnée est dans la plage (chaînes de caractères)
          return formattedDate >= startDateStr && formattedDate <= endDateStr;
        } 
        
        // Pour une date unique, comparer les chaînes de date YYYY-MM-DD
        return remindAtDateStr === formattedDate;
      }) as LogbookReminder[];
  } catch (error) {
    console.error('Error getting active logbook reminders:', error);
    throw error;
  }
};