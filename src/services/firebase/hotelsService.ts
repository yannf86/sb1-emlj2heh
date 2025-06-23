import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Hotel } from '../../types/parameters';

export class HotelsService {
  async getHotels(): Promise<Hotel[]> {
    try {
      const q = query(
        collection(db, 'hotels'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          incidentCategories: Array.isArray(data.incidentCategories) ? data.incidentCategories : [],
          locations: Array.isArray(data.locations) ? data.locations : [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as Hotel[];
    } catch (error) {
      console.error('Error getting hotels:', error);
      throw error;
    }
  }

  async addHotel(hotel: Omit<Hotel, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'hotels'), {
        ...hotel,
        incidentCategories: hotel.incidentCategories || [],
        locations: hotel.locations || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding hotel:', error);
      throw error;
    }
  }

  async updateHotel(id: string, hotel: Partial<Hotel>): Promise<void> {
    try {
      const docRef = doc(db, 'hotels', id);
      await updateDoc(docRef, {
        ...hotel,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating hotel:', error);
      throw error;
    }
  }

  async deleteHotel(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'hotels', id));
    } catch (error) {
      console.error('Error deleting hotel:', error);
      throw error;
    }
  }

  async updateHotelCategories(id: string, categoryIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'hotels', id);
      await updateDoc(docRef, {
        incidentCategories: categoryIds,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating hotel categories:', error);
      throw error;
    }
  }

  async updateHotelLocations(id: string, locationIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'hotels', id);
      await updateDoc(docRef, {
        locations: locationIds,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating hotel locations:', error);
      throw error;
    }
  }
}

export const hotelsService = new HotelsService();