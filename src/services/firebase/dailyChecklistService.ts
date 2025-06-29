import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  updateDoc,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DailyChecklist, ChecklistComment, ChecklistHistoryEntry } from '../../types/checklist';
import { checklistMissionsService } from './checklistMissionsService';
import { usersService } from './usersService';

export class DailyChecklistService {
  /**
   * Ajoute une entrée d'historique à une tâche
   */
  private async addHistoryEntry(
    taskId: string,
    action: 'completed' | 'uncompleted' | 'commented' | 'updated',
    userId: string,
    description: string,
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    try {
      // Récupérer les informations de l'utilisateur
      const users = await usersService.getUsers();
      const user = users.find(u => u.id === userId);
      const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Utilisateur inconnu';
      
      const historyEntry: ChecklistHistoryEntry = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        userId,
        userName,
        timestamp: Timestamp.now(),
        description,
        oldValue,
        newValue
      };
      
      // Ajouter l'entrée d'historique à la tâche
      const docRef = doc(db, 'daily_checklists', taskId);
      await updateDoc(docRef, {
        history: arrayUnion(historyEntry),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding history entry:', error);
      // Ne pas faire échouer l'opération principale si l'historique échoue
    }
  }
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
      
      const tasks = querySnapshot.docs.map((docSnapshot: any) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as DailyChecklist;
      });

      return tasks;
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
        history: [],
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
      // Récupérer l'état actuel de la tâche pour l'historique
      const docRef = doc(db, 'daily_checklists', id);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : null;
      
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

      await updateDoc(docRef, updateData);
      
      // Ajouter l'entrée d'historique
      if (completedBy) {
        const action = completed ? 'completed' : 'uncompleted';
        const description = completed 
          ? 'Tâche marquée comme terminée'
          : 'Tâche marquée comme non terminée';
        
        await this.addHistoryEntry(
          id,
          action,
          completedBy,
          description,
          { completed: currentData?.completed || false },
          { completed }
        );
      }
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
      
      // Ajouter l'entrée d'historique pour le commentaire
      if (comment.userId) {
        await this.addHistoryEntry(
          taskId,
          'commented',
          comment.userId,
          `Commentaire ajouté : "${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}"`,
          undefined,
          { comment: comment.text }
        );
      }
    } catch (error) {
      console.error('Error adding comment to task:', error);
      throw error;
    }
  }

  async generateDailyChecklistsFromMissions(date: Date, hotelId: string): Promise<void> {
    try {
      console.log('Génération des tâches quotidiennes pour la date:', date, 'et l\'hôtel:', hotelId);
      const missions = await checklistMissionsService.getChecklistMissions();
      console.log('Missions récupérées:', missions.length);
      
      const activeMissions = missions.filter(mission => 
        mission.active && 
        mission.hotels.includes(hotelId)
      );
      console.log('Missions actives pour cet hôtel:', activeMissions.length);
      
      const existingTasks = await this.getDailyChecklists(date, hotelId);
      console.log('Tâches existantes pour cette date:', existingTasks.length);
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
          history: [],
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

  async cancelDayCompletion(date: Date, hotelId: string): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Trouver les documents de complétion pour cette date et cet hôtel
      const q = query(
        collection(db, 'day_completions'),
        where('hotelId', '==', hotelId)
      );

      const querySnapshot = await getDocs(q);
      
      // Filtrer les résultats en mémoire pour vérifier la plage de dates
      const completions = querySnapshot.docs.filter((docSnapshot: any) => {
        const data = docSnapshot.data();
        const docDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
        return docDate >= startOfDay && docDate <= endOfDay && data.completed === true;
      });

      // Supprimer tous les documents de complétion trouvés
      const batch = writeBatch(db);
      completions.forEach((completion: any) => {
        batch.delete(doc(db, 'day_completions', completion.id));
      });

      await batch.commit();
      console.log(`Cancelled day completion for ${date.toDateString()} at hotel ${hotelId}`);
    } catch (error) {
      console.error('Error cancelling day completion:', error);
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
      const completions = querySnapshot.docs.filter((docSnapshot: any) => {
        const data = docSnapshot.data();
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
  // ou ajouter les nouvelles missions qui n'existent pas encore
  async initializeDailyTasks(date: Date, hotelId: string): Promise<void> {
    try {
      console.log('Initialisation des tâches pour la date:', date, 'et l\'hôtel:', hotelId);
      const existingTasks = await this.getDailyChecklists(date, hotelId);
      console.log('Nombre de tâches existantes:', existingTasks.length);
      
      if (existingTasks.length === 0) {
        console.log('Aucune tâche existante, génération de toutes les tâches...');
        // Aucune tâche n'existe, générer toutes les tâches
        await this.generateDailyChecklistsFromMissions(date, hotelId);
      } else {
        console.log('Des tâches existent déjà, vérification des nouvelles missions...');
        // Des tâches existent déjà, vérifier s'il y a de nouvelles missions à ajouter
        await this.addNewMissionsToExistingDay(date, hotelId, existingTasks);
      }
    } catch (error) {
      console.error('Error initializing daily tasks:', error);
      throw error;
    }
  }
  
  // Ajouter uniquement les nouvelles missions aux tâches existantes
  async addNewMissionsToExistingDay(date: Date, hotelId: string, existingTasks: DailyChecklist[]): Promise<void> {
    try {
      console.log('Ajout de nouvelles missions aux tâches existantes pour la date:', date, 'et l\'hôtel:', hotelId);
      // Récupérer toutes les missions actives pour cet hôtel
      const missions = await checklistMissionsService.getChecklistMissions();
      console.log('Nombre total de missions:', missions.length);
      
      const activeMissions = missions.filter(mission => 
        mission.active && 
        mission.hotels.includes(hotelId)
      );
      console.log('Nombre de missions actives pour cet hôtel:', activeMissions.length);
      console.log('Missions actives:', activeMissions);

      // Identifier les missions qui n'ont pas encore de tâches quotidiennes
      const existingMissionIds = existingTasks.map(task => task.missionId);
      console.log('IDs des missions existantes:', existingMissionIds);
      
      const newMissions = activeMissions.filter(mission => 
        !existingMissionIds.includes(mission.id)
      );
      console.log('Nouvelles missions à ajouter:', newMissions);

      if (newMissions.length === 0) {
        console.log('Aucune nouvelle mission à ajouter pour cette date et cet hôtel');
        return;
      }

      console.log(`Ajout de ${newMissions.length} nouvelles missions aux tâches existantes`);

      // Créer les nouvelles tâches quotidiennes
      const batch = writeBatch(db);
      
      for (const mission of newMissions) {
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
          history: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        batch.set(taskRef, taskData);
      }
      
      await batch.commit();
      console.log(`Added ${newMissions.length} new daily tasks for ${date.toDateString()}`);
    } catch (error) {
      console.error('Error adding new missions to existing day:', error);
      throw error;
    }
  }
}

export const dailyChecklistService = new DailyChecklistService();