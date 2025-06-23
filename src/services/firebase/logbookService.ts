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
import { LogbookEntry, LogbookReminder, LogbookComment } from '../../types/logbook';

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
      
      const entries = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          comments: Array.isArray(data.comments) ? data.comments.map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt)
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
      const cacheKey = 'logbook-reminders';
      const cached = LogbookService.getFromCache<LogbookReminder[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const q = query(
        collection(db, 'logbook_reminders'),
        orderBy('startDate', 'asc'),
        limit(50) // Limite pour éviter de charger trop de rappels
      );
      
      const querySnapshot = await getDocs(q);
      
      const reminders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      }) as LogbookReminder[];

      LogbookService.setCache(cacheKey, reminders);
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
        
        return targetDate >= startDate && targetDate <= endDate;
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
      const dateKey = date.toISOString().split('T')[0];
      const cacheKey = `reminders-for-date-${dateKey}`;
      const cached = LogbookService.getFromCache<LogbookReminder[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const reminders = await this.getLogbookReminders();
      
      const filteredReminders = reminders.filter(reminder => {
        const reminderStart = new Date(reminder.startDate);
        const reminderEnd = reminder.endDate ? new Date(reminder.endDate) : reminderStart;
        
        // Normaliser les dates pour la comparaison
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(reminderStart.getFullYear(), reminderStart.getMonth(), reminderStart.getDate());
        const endDate = new Date(reminderEnd.getFullYear(), reminderEnd.getMonth(), reminderEnd.getDate());
        
        return targetDate >= startDate && targetDate <= endDate && reminder.active;
      });

      LogbookService.setCache(cacheKey, filteredReminders);
      return filteredReminders;
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