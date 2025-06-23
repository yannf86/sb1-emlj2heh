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
import { Parameter } from '../../types/parameters';

export class ParametersService {
  async getParameters(collectionName: string): Promise<Parameter[]> {
    try {
      const q = query(
        collection(db, collectionName),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure hotels is always an array
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as Parameter[];
    } catch (error) {
      console.error(`Error getting parameters from ${collectionName}:`, error);
      throw error;
    }
  }

  async addParameter(collectionName: string, parameter: Omit<Parameter, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...parameter,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding parameter to ${collectionName}:`, error);
      throw error;
    }
  }

  async updateParameter(collectionName: string, id: string, parameter: Partial<Parameter>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...parameter,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error updating parameter in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteParameter(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting parameter from ${collectionName}:`, error);
      throw error;
    }
  }

  async toggleParameterStatus(collectionName: string, id: string, active: boolean): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        active,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error toggling parameter status in ${collectionName}:`, error);
      throw error;
    }
  }
}

export const parametersService = new ParametersService();