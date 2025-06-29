import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
  arrayUnion,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LogbookEntry, LogbookReminder, LogbookComment, LogbookHistoryEntry } from '../../types/logbook';
import { usersService } from './usersService';
import { getDoc } from 'firebase/firestore';

export class LogbookService {
  // Cache pour les données fréquemment utilisées
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

  private static isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? (Date.now() - cached.timestamp) < this.CACHE_DURATION : false;
  }

  private static getFromCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private static setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // LogbookEntries
  async getLogbookEntries(hotelFilter?: string, serviceFilter?: string, limitCount: number = 100): Promise<LogbookEntry[]> {
    try {
      const cacheKey = `logbook-${hotelFilter || 'all'}-${serviceFilter || 'all'}-${limitCount}`;
      const cached = LogbookService.getFromCache<LogbookEntry[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Construction optimisée de la requête
      const constraints = [orderBy('startDate', 'desc')];

      if (hotelFilter && hotelFilter !== 'all') {
        constraints.unshift(where('hotelId', '==', hotelFilter));
      }

      if (serviceFilter && serviceFilter !== 'all') {
        constraints.unshift(where('service', '==', serviceFilter));
      }

      // Limite par défaut pour éviter de charger trop de données
      constraints.push(limit(limitCount));

      const q = query(collection(db, 'logbook_entries'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const entries = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
          completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          comments: Array.isArray(data.comments) ? data.comments.map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt)
          })) : [],
          history: Array.isArray(data.history) ? data.history.map((historyItem: any) => ({
            ...historyItem,
            timestamp: historyItem.timestamp instanceof Timestamp ? historyItem.timestamp.toDate() : new Date(historyItem.timestamp)
          })) : [],
        };
      }) as LogbookEntry[];

      LogbookService.setCache(cacheKey, entries);
      return entries;
    } catch (error) {
      console.error('Error getting logbook entries:', error);
      throw error;
    }
  }

  async addLogbookEntry(entry: Omit<LogbookEntry, 'id'>): Promise<string> {
    try {
      const optimizedEntry = {
        service: entry.service,
        hotelId: entry.hotelId,
        title: entry.title,
        content: entry.content,
        startDate: Timestamp.fromDate(entry.startDate),
        endDate: entry.endDate ? Timestamp.fromDate(entry.endDate) : null,
        importance: entry.importance || 'Normal',
        roomNumber: entry.roomNumber || '',
        isTask: entry.isTask || false,
        completed: false,
        authorId: entry.authorId,
        authorName: entry.authorName,
        comments: [],
        history: entry.history ? entry.history.map(historyItem => ({
          ...historyItem,
          timestamp: Timestamp.fromDate(historyItem.timestamp)
        })) : [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'logbook_entries'), optimizedEntry);
      this.clearCache();
      return docRef.id;
    } catch (error) {
      console.error('Error adding logbook entry:', error);
      throw error;
    }
  }

  async updateLogbookEntry(id: string, entry: Partial<LogbookEntry>): Promise<void> {
    try {
      const updateData: any = {
        ...entry,
        updatedAt: Timestamp.now(),
      };

      if (entry.startDate) {
        updateData.startDate = Timestamp.fromDate(entry.startDate);
      }

      if (entry.endDate) {
        updateData.endDate = Timestamp.fromDate(entry.endDate);
      }

      // Gérer completedAt - peut être une Date ou null
      if (entry.completedAt !== undefined) {
        updateData.completedAt = entry.completedAt ? Timestamp.fromDate(entry.completedAt) : null;
      }

      // Gérer l'historique
      if (entry.history) {
        updateData.history = entry.history.map(historyItem => ({
          ...historyItem,
          timestamp: Timestamp.fromDate(historyItem.timestamp)
        }));
      }

      console.log('Service updating with data:', updateData); // Debug

      const docRef = doc(db, 'logbook_entries', id);
      await updateDoc(docRef, updateData);
      this.clearCache();
    } catch (error) {
      console.error('Error updating logbook entry:', error);
      throw error;
    }
  }

  async addCommentToEntry(entryId: string, comment: Omit<LogbookComment, 'id'>): Promise<void> {
    try {
      const docRef = doc(db, 'logbook_entries', entryId);
      const commentWithId = {
        id: `comment_${Date.now()}`,
        ...comment,
        createdAt: Timestamp.now(),
      };
      
      await updateDoc(docRef, {
        comments: arrayUnion(commentWithId),
        updatedAt: Timestamp.now(),
      });
      
      this.clearCache();
    } catch (error) {
      console.error('Error adding comment to entry:', error);
      throw error;
    }
  }

  async deleteLogbookEntry(id: string): Promise<void> {
    try {
      // Supprimer aussi les rappels associés
      await this.deleteRemindersByEntryId(id);
      await deleteDoc(doc(db, 'logbook_entries', id));
      this.clearCache();
    } catch (error) {
      console.error('Error deleting logbook entry:', error);
      throw error;
    }
  }

  async toggleEntryCompletion(id: string, completed: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'logbook_entries', id);
      await updateDoc(docRef, {
        completed,
        updatedAt: Timestamp.now(),
      });
      this.clearCache();
    } catch (error) {
      console.error('Error toggling entry completion:', error);
      throw error;
    }
  }

  // LogbookReminders
  async getLogbookReminders(): Promise<LogbookReminder[]> {
    try {
      // Désactiver le cache pour le débogage
      // const cacheKey = 'all-logbook-reminders';
      // const cached = LogbookService.getFromCache<LogbookReminder[]>(cacheKey);
      // if (cached) {
      //   return cached;
      // }

      console.log('Fetching all logbook reminders from Firestore');
      
      const q = query(
        collection(db, 'logbook_reminders'),
        orderBy('startDate', 'asc'),
        limit(50) // Limite pour éviter de charger trop de rappels
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} reminders in Firestore`);
      
      const reminders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Conversion explicite des dates
        let startDate: Date;
        if (data.startDate instanceof Timestamp) {
          startDate = data.startDate.toDate();
        } else if (data.startDate && typeof data.startDate.toDate === 'function') {
          startDate = data.startDate.toDate();
        } else {
          startDate = new Date(data.startDate);
        }
        
        // Conversion de la date de fin (si elle existe)
        let endDate: Date | undefined = undefined;
        if (data.endDate) {
          if (data.endDate instanceof Timestamp) {
            endDate = data.endDate.toDate();
          } else if (data.endDate && typeof data.endDate.toDate === 'function') {
            endDate = data.endDate.toDate();
          } else {
            endDate = new Date(data.endDate);
          }
        }
        
        const reminder: LogbookReminder = {
          id: doc.id,
          entryId: data.entryId,
          title: data.title,
          description: data.description,
          startDate: startDate,
          endDate: endDate,
          active: data.active === undefined ? true : data.active,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
        
        console.log(`Reminder: ${reminder.title}, startDate: ${startDate.toISOString()}, endDate: ${endDate?.toISOString() || 'none'}`);
        return reminder;
      });

      // LogbookService.setCache(cacheKey, reminders);
      return reminders;
    } catch (error) {
      console.error('Error getting logbook reminders:', error);
      throw error;
    }
  }

  async addLogbookReminder(reminder: Omit<LogbookReminder, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'logbook_reminders'), {
        ...reminder,
        startDate: Timestamp.fromDate(reminder.startDate),
        endDate: reminder.endDate ? Timestamp.fromDate(reminder.endDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      this.clearCache();
      return docRef.id;
    } catch (error) {
      console.error('Error adding logbook reminder:', error);
      throw error;
    }
  }

  async deleteRemindersByEntryId(entryId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'logbook_reminders'),
        where('entryId', '==', entryId)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      await batch.commit();
      this.clearCache();
    } catch (error) {
      console.error('Error deleting reminders by entry ID:', error);
      throw error;
    }
  }

  // Méthodes utilitaires optimisées
  async getEntriesForDate(date: Date): Promise<LogbookEntry[]> {
    try {
      const dateKey = date.toISOString().split('T')[0];
      const cacheKey = `entries-for-date-${dateKey}`;
      const cached = LogbookService.getFromCache<LogbookEntry[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const entries = await this.getLogbookEntries();
      
      const filteredEntries = entries.filter(entry => {
        const entryStart = new Date(entry.startDate);
        const entryEnd = entry.endDate ? new Date(entry.endDate) : entryStart;
        
        // Normaliser les dates pour la comparaison (seulement jour/mois/année)
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(entryStart.getFullYear(), entryStart.getMonth(), entryStart.getDate());
        const endDate = new Date(entryEnd.getFullYear(), entryEnd.getMonth(), entryEnd.getDate());
        
        // Vérifier si la date cible est exactement égale à la date de début
        // ou si elle est entre la date de début et de fin (pour les plages de dates)
        if (entry.endDate) {
          // Si c'est une plage de dates, la consigne doit être affichée uniquement pour la date de début
          return targetDate.getTime() === startDate.getTime();
        } else {
          // Si c'est une date unique, la consigne doit être affichée uniquement pour cette date
          return targetDate.getTime() === startDate.getTime();
        }
      });

      LogbookService.setCache(cacheKey, filteredEntries);
      return filteredEntries;
    } catch (error) {
      console.error('Error getting entries for date:', error);
      throw error;
    }
  }

  async getRemindersForDate(date: Date): Promise<LogbookReminder[]> {
    try {
      // Désactiver complètement le cache pour le débogage
      const reminders = await this.getLogbookReminders();
      console.log(`Nombre total de rappels récupérés: ${reminders.length}`);
      
      // APPROCHE SIMPLIFIÉE: Utiliser les dates brutes sans conversion
      const now = new Date();
      console.log(`Date et heure actuelles: ${now.toISOString()}`);
      
      // Filtrer les rappels en deux étapes distinctes
      const activeReminders = [];
      
      for (const reminder of reminders) {
        console.log(`\n--- Analyse du rappel: ${reminder.title} ---`);
        console.log(`Date de début: ${reminder.startDate instanceof Date ? reminder.startDate.toISOString() : 'Non-Date'}`);
        console.log(`Date de fin: ${reminder.endDate instanceof Date ? reminder.endDate.toISOString() : 'Non-Date ou undefined'}`);
        console.log(`Actif: ${reminder.active}`);
        
        // ÉTAPE 1: Vérifier si le rappel est expiré
        if (reminder.endDate) {
          // Convertir en dates JavaScript si ce n'est pas déjà le cas
          const endDate = reminder.endDate instanceof Date ? reminder.endDate : new Date(reminder.endDate);
          
          // Comparer les dates avec l'heure
          if (now > endDate) {
            console.log(`RAPPEL EXPIRÉ: ${reminder.title} - Date de fin ${endDate.toISOString()} < Aujourd'hui ${now.toISOString()}`);
            continue; // Ignorer ce rappel et passer au suivant
          }
          
          // Si la date de fin est aujourd'hui, vérifier si l'heure de fin est déjà passée
          const endDateDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          if (endDateDay.getTime() === todayDay.getTime()) {
            console.log(`Le rappel ${reminder.title} se termine aujourd'hui à ${endDate.getHours()}:${endDate.getMinutes()}`);
            console.log(`Heure actuelle: ${now.getHours()}:${now.getMinutes()}`);
          }
        }
        
        // ÉTAPE 2: Vérifier si la date sélectionnée est dans la plage du rappel
        const startDate = reminder.startDate instanceof Date ? reminder.startDate : new Date(reminder.startDate);
        const endDate = reminder.endDate instanceof Date ? reminder.endDate : 
                       (reminder.endDate ? new Date(reminder.endDate) : startDate);
        
        // Normaliser la date sélectionnée (sans l'heure)
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Normaliser les dates du rappel (sans l'heure)
        const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // Vérifier si la date cible est dans la plage
        if (targetDate >= normalizedStartDate && targetDate <= normalizedEndDate && reminder.active) {
          console.log(`RAPPEL AJOUTÉ: ${reminder.title} - Date cible ${targetDate.toISOString()} est entre ${normalizedStartDate.toISOString()} et ${normalizedEndDate.toISOString()}`);
          activeReminders.push(reminder);
        } else {
          console.log(`RAPPEL IGNORÉ: ${reminder.title} - Date cible ${targetDate.toISOString()} n'est pas dans la plage ou rappel inactif`);
        }
      }
      
      console.log(`Nombre final de rappels pour la date ${date.toISOString().split('T')[0]}: ${activeReminders.length}`);
      return activeReminders;
    } catch (error) {
      console.error('Error getting reminders for date:', error);
      throw error;
    }
  }

  // Créer plusieurs entrées pour une plage de dates (optimisé avec batch)
  async createEntriesForDateRange(
    entryData: Omit<LogbookEntry, 'id' | 'startDate' | 'endDate' | 'comments'>,
    dates: Date[],
    reminderData?: { title: string; description?: string }
  ): Promise<void> {
    try {
      // Limitation pour éviter des opérations trop volumineuses
      if (dates.length > 100) {
        throw new Error('Trop de dates sélectionnées. Maximum 100 dates.');
      }

      const batch = writeBatch(db);
      
      for (const date of dates) {
        // Créer une entrée pour chaque date
        const entryRef = doc(collection(db, 'logbook_entries'));
        const entryToAdd = {
          ...entryData,
          startDate: Timestamp.fromDate(date),
          endDate: Timestamp.fromDate(date), // Même date pour début et fin
          comments: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        batch.set(entryRef, entryToAdd);
        
        // Créer un rappel si demandé
        if (reminderData) {
          const reminderRef = doc(collection(db, 'logbook_reminders'));
          const reminderToAdd = {
            entryId: entryRef.id,
            title: reminderData.title,
            description: reminderData.description || '',
            startDate: Timestamp.fromDate(date),
            endDate: Timestamp.fromDate(date),
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };
          
          batch.set(reminderRef, reminderToAdd);
        }
      }
      
      await batch.commit();
      this.clearCache();
    } catch (error) {
      console.error('Error creating entries for date range:', error);
      throw error;
    }
  }

  private clearCache(): void {
    LogbookService.cache.clear();
  }
}

export const logbookService = new LogbookService();