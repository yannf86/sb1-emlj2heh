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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChecklistMission } from '../../types/parameters';

export class ChecklistMissionsService {
  async getChecklistMissions(): Promise<ChecklistMission[]> {
    try {
      const q = query(collection(db, 'checklist_missions'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      }) as ChecklistMission[];
    } catch (error) {
      console.error('Error getting checklist missions:', error);
      throw error;
    }
  }

  async addChecklistMission(mission: Omit<ChecklistMission, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'checklist_missions'), {
        ...mission,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding checklist mission:', error);
      throw error;
    }
  }

  async updateChecklistMission(id: string, mission: Partial<ChecklistMission>): Promise<void> {
    try {
      const docRef = doc(db, 'checklist_missions', id);
      await updateDoc(docRef, {
        ...mission,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating checklist mission:', error);
      throw error;
    }
  }

  async deleteChecklistMission(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'checklist_missions', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting checklist mission:', error);
      throw error;
    }
  }

  async getChecklistMissionsByHotel(hotelId: string): Promise<ChecklistMission[]> {
    try {
      const q = query(
        collection(db, 'checklist_missions'),
        where('hotels', 'array-contains', hotelId),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      }) as ChecklistMission[];
    } catch (error) {
      console.error('Error getting checklist missions by hotel:', error);
      throw error;
    }
  }

  async getActiveChecklistMissions(): Promise<ChecklistMission[]> {
    try {
      const q = query(
        collection(db, 'checklist_missions'),
        where('active', '==', true),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      }) as ChecklistMission[];
    } catch (error) {
      console.error('Error getting active checklist missions:', error);
      throw error;
    }
  }
}

export const checklistMissionsService = new ChecklistMissionsService();