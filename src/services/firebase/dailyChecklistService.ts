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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DailyChecklist, DayCompletion, ChecklistComment } from '../../types/checklist';
import { ChecklistMission } from '../../types/parameters';
import { checklistMissionsService } from './checklistMissionsService';

export class DailyChecklistService {
  async getDailyChecklists(date: Date, hotelId?: string): Promise<DailyChecklist[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Build query constraints in the correct order for Firestore
      // Equality filters first, then inequality filters, then orderBy
      const constraints = [];

      // Add equality filter first if hotelId is specified
      if (hotelId && hotelId !== 'all') {
        constraints.push(where('hotelId', '==', hotelId));
      }

      // Add inequality filters for date range
      constraints.push(where('date', '>=', Timestamp.fromDate(startOfDay)));
      constraints.push(where('date', '<=', Timestamp.fromDate(endOfDay)));

      // Add orderBy clauses last
      constraints.push(orderBy('date'));
      constraints.push(orderBy('order', 'asc'));

      const q = query(collection(db, 'daily_checklists'), ...constraints);

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          comments: Array.isArray(data.comments) ? data.comments.map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt)
          })) : [],
        };
      }) as DailyChecklist[];
    } catch (error) {
      console.error('Error getting daily checklists:', error);
      throw error;
    }
  }

  async addDailyChecklist(checklist: Omit<DailyChecklist, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'daily_checklists'), {
        ...checklist,
        date: Timestamp.fromDate(checklist.date),
        completedAt: checklist.completedAt ? Timestamp.fromDate(checklist.completedAt) : null,
        comments: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding daily checklist:', error);
      throw error;
    }
  }

  async toggleTaskCompletion(id: string, completed: boolean, completedBy?: string): Promise<void> {
    try {
      const updateData: any = {
        completed,
        updatedAt: Timestamp.now(),
      };

      if (completed) {
        updateData.completedAt = Timestamp.now();
        updateData.completedBy = completedBy;
      } else {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }

      const docRef = doc(db, 'daily_checklists', id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }

  async addCommentToTask(taskId: string, comment: Omit<ChecklistComment, 'id'>): Promise<void> {
    try {
      const docRef = doc(db, 'daily_checklists', taskId);
      const commentWithId = {
        id: `comment_${Date.now()}`,
        ...comment,
        createdAt: Timestamp.now(),
      };
      
      await updateDoc(docRef, {
        comments: arrayUnion(commentWithId),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding comment to task:', error);
      throw error;
    }
  }

  async generateDailyChecklistsFromMissions(date: Date, hotelId: string): Promise<void> {
    try {
      // Récupérer toutes les missions actives pour cet hôtel
      const missions = await checklistMissionsService.getChecklistMissions();
      const activeMissions = missions.filter(mission => 
        mission.active && 
        mission.hotels.includes(hotelId)
      );

      // Vérifier si les tâches existent déjà pour cette date et cet hôtel
      const existingTasks = await this.getDailyChecklists(date, hotelId);
      if (existingTasks.length > 0) {
        console.log('Tasks already exist for this date and hotel');
        return;
      }

      // Créer les tâches quotidiennes
      const batch = writeBatch(db);
      
      for (const mission of activeMissions) {
        const taskRef = doc(collection(db, 'daily_checklists'));
        const taskData = {
          date: Timestamp.fromDate(date),
          hotelId,
          missionId: mission.id,
          title: mission.title,
          description: mission.description || '',
          service: mission.service,
          completed: false,
          imageUrl: mission.imageUrl || '',
          pdfUrl: mission.pdfUrl || '',
          pdfFileName: mission.pdfFileName || '',
          order: mission.order,
          comments: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        batch.set(taskRef, taskData);
      }
      
      await batch.commit();
      console.log(`Generated ${activeMissions.length} daily tasks for ${date.toDateString()}`);
    } catch (error) {
      console.error('Error generating daily checklists:', error);
      throw error;
    }
  }

  async completeDayAndGenerateNext(date: Date, hotelId: string, completedBy: string): Promise<void> {
    try {
      // Marquer la journée comme terminée
      await this.markDayAsCompleted(date, hotelId, completedBy);
      
      // Générer les tâches pour le lendemain
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      await this.generateDailyChecklistsFromMissions(nextDay, hotelId);
    } catch (error) {
      console.error('Error completing day and generating next:', error);
      throw error;
    }
  }

  async markDayAsCompleted(date: Date, hotelId: string, completedBy: string): Promise<void> {
    try {
      const completionData = {
        date: Timestamp.fromDate(date),
        hotelId,
        completed: true,
        completedAt: Timestamp.now(),
        completedBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'day_completions'), completionData);
    } catch (error) {
      console.error('Error marking day as completed:', error);
      throw error;
    }
  }

  async isDayCompleted(date: Date, hotelId: string): Promise<boolean> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Use a simpler query to avoid composite index requirements temporarily
      // First try with just hotelId filter
      const q = query(
        collection(db, 'day_completions'),
        where('hotelId', '==', hotelId)
      );

      const querySnapshot = await getDocs(q);
      
      // Filter results in memory to check the date range
      const completions = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        const docDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
        return docDate >= startOfDay && docDate <= endOfDay && data.completed === true;
      });

      return completions.length > 0;
    } catch (error) {
      // If even the simplified query fails, log the error but don't break the app
      console.warn('Error checking if day is completed, assuming not completed:', error);
      return false;
    }
  }

  async canProceedToNextDay(date: Date, hotelId: string): Promise<boolean> {
    try {
      const tasks = await this.getDailyChecklists(date, hotelId);
      return tasks.length > 0 && tasks.every(task => task.completed);
    } catch (error) {
      console.error('Error checking if can proceed to next day:', error);
      return false;
    }
  }

  // Initialiser les tâches pour une date donnée si elles n'existent pas
  async initializeDailyTasks(date: Date, hotelId: string): Promise<void> {
    try {
      const existingTasks = await this.getDailyChecklists(date, hotelId);
      if (existingTasks.length === 0) {
        await this.generateDailyChecklistsFromMissions(date, hotelId);
      }
    } catch (error) {
      console.error('Error initializing daily tasks:', error);
      throw error;
    }
  }
}

export const dailyChecklistService = new DailyChecklistService();