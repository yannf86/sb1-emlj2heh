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
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { Technician } from '../../types/maintenance';

export class TechniciansService {
  async getTechnicians(hotelFilter?: string): Promise<Technician[]> {
    try {
      let q = query(
        collection(db, 'technicians'),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      let technicians = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          specialties: Array.isArray(data.specialties) ? data.specialties : [],
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
          modules: Array.isArray(data.modules) ? data.modules : [],
          hourlyRate: data.hourlyRate || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      }) as Technician[];

      // Filter by hotel if specified
      if (hotelFilter && hotelFilter !== 'all') {
        technicians = technicians.filter(tech => 
          tech.hotels.includes(hotelFilter)
        );
      }

      return technicians;
    } catch (error) {
      console.error('Error getting technicians:', error);
      throw error;
    }
  }

  async addTechnician(technician: Omit<Technician, 'id'>, password?: string): Promise<string> {
    try {
      // Create user in Firebase Auth if email and password are provided
      if (technician.email && password) {
        try {
          await createUserWithEmailAndPassword(auth, technician.email, password);
        } catch (authError) {
          console.error('Error creating Firebase Auth user:', authError);
          // Continue with Firestore creation even if Auth fails
        }
      }

      const docRef = await addDoc(collection(db, 'technicians'), {
        ...technician,
        specialties: technician.specialties || [],
        hotels: technician.hotels || [],
        modules: technician.modules || [],
        hourlyRate: technician.hourlyRate || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding technician:', error);
      throw error;
    }
  }

  async updateTechnician(id: string, technician: Partial<Technician>): Promise<void> {
    try {
      const docRef = doc(db, 'technicians', id);
      await updateDoc(docRef, {
        ...technician,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating technician:', error);
      throw error;
    }
  }

  async deleteTechnician(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'technicians', id));
    } catch (error) {
      console.error('Error deleting technician:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async toggleTechnicianStatus(id: string, active: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'technicians', id);
      await updateDoc(docRef, {
        active,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error toggling technician status:', error);
      throw error;
    }
  }

  async getAvailableTechnicians(hotelId?: string): Promise<Technician[]> {
    try {
      const technicians = await this.getTechnicians(hotelId);
      return technicians.filter(tech => 
        tech.active && tech.availability === 'available'
      );
    } catch (error) {
      console.error('Error getting available technicians:', error);
      throw error;
    }
  }

  async updateTechnicianHotels(id: string, hotelIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'technicians', id);
      await updateDoc(docRef, {
        hotels: hotelIds,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating technician hotels:', error);
      throw error;
    }
  }

  async updateTechnicianModules(id: string, moduleIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'technicians', id);
      await updateDoc(docRef, {
        modules: moduleIds,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating technician modules:', error);
      throw error;
    }
  }
}

export const techniciansService = new TechniciansService();