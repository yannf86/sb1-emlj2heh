import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';

// Interface pour les entrées du cahier de consignes
export interface LogbookEntry {
  id?: string;
  date: string;
  time: string;
  endDate?: string;
  displayRange?: boolean;
  isPermanent?: boolean;
  hotelId: string;
  hotelName?: string;
  serviceId: string;
  serviceName?: string;
  serviceIcon?: string;
  content: string;
  title?: string; // Pour les tâches de checklist
  description?: string; // Pour les tâches de checklist
  authorId: string;
  authorName?: string;
  importance: number;
  isTask?: boolean;
  isCompleted?: boolean;
  completedById?: string | null;
  completedByName?: string | null;
  completedAt?: string | null;
  roomNumber?: string;
  isRead?: boolean;
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

// Obtenir les entrées du cahier de consignes pour une date spécifique
export const getLogbookEntriesByDate = async (date: Date, hotelId?: string): Promise<LogbookEntry[]> => {
  try {
    // Formats pour les dates - utiliser minuit pour éviter les problèmes de fuseau horaire
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    let baseQuery = collection(db, 'logbook_entries');
    let queryConstraints = [];

    // Filtrer par hôtel si spécifié
    if (hotelId) {
      queryConstraints.push(where('hotelId', '==', hotelId));
    } else {
      // Si aucun hôtel n'est spécifié, filtrer par les hôtels auxquels l'utilisateur a accès
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.role !== 'admin') {
        // Pour les utilisateurs non-admin, on doit filtrer par leurs hôtels
        if (currentUser.hotels.length === 1) {
          // Si l'utilisateur n'a accès qu'à un seul hôtel, on peut utiliser une requête simple
          queryConstraints.push(where('hotelId', '==', currentUser.hotels[0]));
        } else if (currentUser.hotels.length > 0) {
          // Si l'utilisateur a accès à plusieurs hôtels, on doit faire plusieurs requêtes
          // et combiner les résultats, car Firestore ne supporte pas les requêtes OR sur le même champ
          const results = [];
          for (const hotel of currentUser.hotels) {
            const hotelQuery = query(
              baseQuery,
              where('hotelId', '==', hotel)
            );
            const snapshot = await getDocs(hotelQuery);
            results.push(...snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          }
          
          // Filtrer les résultats en mémoire
          const filteredResults = results.filter(entry => {
            // Pour les entrées à date unique
            if (!entry.displayRange && !entry.isPermanent) {
              return entry.date === formattedDate;
            }
            
            // Pour les entrées permanentes, toujours les inclure
            if (entry.isPermanent) {
              return true;
            }
            
            // Pour les entrées avec plage de dates
            if (entry.displayRange && entry.endDate) {
              const startDate = new Date(entry.date);
              const endDate = new Date(entry.endDate);
              const selectedDate = new Date(formattedDate);
              
              // Normaliser les dates pour éviter les problèmes de fuseau horaire
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              selectedDate.setHours(12, 0, 0, 0);
              
              return selectedDate >= startDate && selectedDate <= endDate;
            }
            
            return false;
          });
          
          // Trier les résultats
          filteredResults.sort((a, b) => {
            // D'abord par importance (plus important = plus grand nombre)
            if (a.importance !== b.importance) {
              return b.importance - a.importance;
            }
            
            // Ensuite par date (plus récent en premier pour les plages)
            if (a.displayRange && b.displayRange) {
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              if (dateA.getTime() !== dateB.getTime()) {
                return dateB.getTime() - dateA.getTime();
              }
            }
            
            // Enfin par heure (plus récent en premier)
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            
            if (timeA[0] !== timeB[0]) {
              return timeB[0] - timeA[0];
            }
            
            return timeB[1] - timeA[1];
          });
          
          // Enrichir les entrées avec les noms d'hôtels et d'auteurs
          for (const entry of filteredResults) {
            try {
              // Ajouter le nom de l'hôtel
              if (entry.hotelId && !entry.hotelName) {
                entry.hotelName = await getHotelName(entry.hotelId);
              }
              
              // Ajouter le nom de l'auteur
              if (entry.authorId && !entry.authorName) {
                const userDoc = await getDoc(doc(db, 'users', entry.authorId));
                if (userDoc.exists()) {
                  entry.authorName = userDoc.data().name;
                }
              }
              
              // Ajouter le nom de la personne qui a complété la tâche
              if (entry.completedById && !entry.completedByName) {
                const userDoc = await getDoc(doc(db, 'users', entry.completedById));
                if (userDoc.exists()) {
                  entry.completedByName = userDoc.data().name;
                }
              }
            } catch (error) {
              console.error('Error enriching entry data:', error);
            }
          }
          
          return filteredResults;
        }
      }
    }

    // Vérifier les entrées qui ont une date unique correspondant à la date
    // Simplifié: enlever orderBy pour éviter les index composites complexes
    const singleDateQuery = query(
      baseQuery,
      ...queryConstraints,
      where('displayRange', '==', false),
      where('isPermanent', '==', false),
      where('date', '==', formattedDate)
    );

    // Pour les entrées permanentes
    const permanentQuery = query(
      baseQuery,
      ...queryConstraints,
      where('isPermanent', '==', true)
    );

    // Pour les entrées avec plage de dates, on fait une requête simplifiée
    // puis on filtre en mémoire pour éviter les index composites
    const rangeQuery = query(
      baseQuery,
      ...queryConstraints,
      where('displayRange', '==', true),
      where('isPermanent', '==', false)
    );

    // Exécuter les trois requêtes
    const [singleDateSnapshot, permanentSnapshot, rangeSnapshot] = await Promise.all([
      getDocs(singleDateQuery),
      getDocs(permanentQuery),
      getDocs(rangeQuery)
    ]);

    // Pour les entrées à date unique, on les prend toutes
    const singleDateEntries = singleDateSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Pour les entrées permanentes, on les prend toutes
    const permanentEntries = permanentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Pour les entrées avec plage, on filtre en mémoire
    const rangeEntries = rangeSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(entry => {
        // Convertir les dates en objets Date, en forçant l'heure à midi pour éviter les problèmes de fuseau horaire
        const startDate = new Date(entry.date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(entry.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        const selectedDateCopy = new Date(date);
        selectedDateCopy.setHours(12, 0, 0, 0);
        
        // Vérifier si la date sélectionnée est dans la plage (inclut les bornes)
        return selectedDateCopy >= startDate && selectedDateCopy <= endDate;
      });

    // Combiner les résultats
    const entries = [...singleDateEntries, ...permanentEntries, ...rangeEntries] as LogbookEntry[];

    // Enrichir les entrées avec les noms d'hôtels et d'auteurs
    for (const entry of entries) {
      try {
        // Ajouter le nom de l'hôtel
        if (entry.hotelId && !entry.hotelName) {
          entry.hotelName = await getHotelName(entry.hotelId);
        }
        
        // Ajouter le nom de l'auteur
        if (entry.authorId && !entry.authorName) {
          const userDoc = await getDoc(doc(db, 'users', entry.authorId));
          if (userDoc.exists()) {
            entry.authorName = userDoc.data().name;
          }
        }
        
        // Ajouter le nom de la personne qui a complété la tâche
        if (entry.completedById && !entry.completedByName) {
          const userDoc = await getDoc(doc(db, 'users', entry.completedById));
          if (userDoc.exists()) {
            entry.completedByName = userDoc.data().name;
          }
        }
      } catch (error) {
        console.error('Error enriching entry data:', error);
      }
    }

    // Trier les résultats en JavaScript pour éviter les index composites
    entries.sort((a, b) => {
      // D'abord par importance (plus important = plus grand nombre)
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      
      // Ensuite par date (plus récent en premier pour les plages)
      if (a.displayRange && b.displayRange) {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
      }
      
      // Enfin par heure (plus récent en premier)
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) {
        return timeB[0] - timeA[0];
      }
      
      return timeB[1] - timeA[1];
    });

    return entries;
  } catch (error) {
    console.error('Error getting logbook entries:', error);
    throw error;
  }
};

// Créer une nouvelle entrée dans le cahier de consignes
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
    if (entry.isTask && !entry.title) {
      throw new Error('Title is required for tasks');
    }
    if (!entry.isTask && !entry.content) {
      throw new Error('Content is required for entries');
    }

    // Ajouter les informations d'historique
    const history = [{
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create',
      details: entry.isTask ? 'Création de la tâche' : 'Création de la consigne'
    }];

    // Ajouter les informations de création
    const entryToCreate = {
      ...entry,
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
        description: entry.reminderDescription,
        remindAt: entry.date,
        endDate: entry.displayRange ? entry.endDate : undefined,
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

// Mettre à jour une entrée existante
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

    // Vérifier les permissions
    if (existingEntry.authorId !== currentUser.id && 
        currentUser.role !== 'admin' && 
        currentUser.role !== 'hotel_admin' && 
        currentUser.role !== 'group_admin') {
      throw new Error('You do not have permission to update this entry');
    }

    // Créer une entrée d'historique pour cette modification
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      details: entry.isTask ? 'Modification de la tâche' : 'Modification de la consigne'
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Mettre à jour l'entrée dans Firestore
    await updateDoc(entryRef, {
      ...entry,
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
          description: entry.reminderDescription,
          remindAt: entry.date || existingEntry.date,
          endDate: entry.displayRange ? entry.endDate : undefined,
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

// Supprimer une entrée
export const deleteLogbookEntry = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Récupérer l'entrée existante pour vérifier les permissions
    const entryRef = doc(db, 'logbook_entries', id);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Entry not found');
    }

    const existingEntry = entrySnap.data() as LogbookEntry;

    // Vérifier les permissions
    if (existingEntry.authorId !== currentUser.id && 
        currentUser.role !== 'admin' && 
        currentUser.role !== 'hotel_admin' && 
        currentUser.role !== 'group_admin') {
      throw new Error('You do not have permission to delete this entry');
    }

    // Supprimer l'entrée
    await deleteDoc(doc(db, 'logbook_entries', id));

    // Supprimer les rappels associés
    const remindersQuery = query(
      collection(db, 'logbook_reminders'),
      where('entryId', '==', id)
    );
    const reminderSnap = await getDocs(remindersQuery);
    
    for (const reminderDoc of reminderSnap.docs) {
      await deleteDoc(doc(db, 'logbook_reminders', reminderDoc.id));
    }
  } catch (error) {
    console.error('Error deleting logbook entry:', error);
    throw error;
  }
};

// Marquer une entrée comme lue
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

// Marquer une entrée comme terminée
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

    // Créer une entrée d'historique pour cette action
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'complete',
      details: 'Tâche marquée comme terminée'
    };

    // Mettre à jour l'historique
    const history = existingEntry.history || [];
    history.push(historyEntry);

    // Mettre à jour l'entrée dans Firestore
    await updateDoc(entryRef, {
      isCompleted: true,
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id,
      completedById: currentUser.id,
      completedByName: currentUser.name,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking logbook entry as completed:', error);
    throw error;
  }
};

// Ajouter un commentaire à une entrée
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

// Créer un rappel pour une entrée
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

// Mettre à jour un rappel
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

// Marquer un rappel comme terminé
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

// Obtenir tous les rappels actifs
export const getActiveLogbookReminders = async (date?: Date): Promise<LogbookReminder[]> => {
  try {
    const selectedDate = date || new Date();
    
    // IMPORTANT: Convertir en chaîne de caractères sans heure
    // puis reconvertir en Date pour normaliser
    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const normalizedDate = new Date(formattedDate + 'T12:00:00.000Z'); // Midi en UTC
    
    // Requête simplifiée pour éviter les index complexes
    const remindersQuery = query(
      collection(db, 'logbook_reminders'),
      where('isCompleted', '==', false)
    );
    
    const snapshot = await getDocs(remindersQuery);
    
    // Après avoir récupéré tous les rappels non complétés, 
    // nous filtrons manuellement pour trouver ceux qui correspondent à la date
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(reminder => {
        // Si c'est une plage de dates
        if (reminder.displayRange && reminder.endDate) {
          // Normalisons les dates de début et de fin pour éviter tout problème de fuseau horaire
          const startDate = new Date(reminder.remindAt.split('T')[0] + 'T00:00:00.000Z');
          const endDate = new Date(reminder.endDate.split('T')[0] + 'T23:59:59.999Z');
          
          // Vérifier si la date sélectionnée (normalisée) est dans la plage
          // Comparer les dates directement (et non leur représentation en chaîne)
          return normalizedDate >= startDate && normalizedDate <= endDate;
        } 
        
        // Pour une date unique, comparer simplement les dates sans l'heure
        return reminder.remindAt.split('T')[0] === formattedDate;
      }) as LogbookReminder[];
  } catch (error) {
    console.error('Error getting active logbook reminders:', error);
    throw error;
  }
};