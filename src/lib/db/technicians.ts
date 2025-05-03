import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Get all technicians
export const getTechnicians = async () => {
  try {
    const technicianSnapshot = await getDocs(collection(db, 'technicians'));
    return technicianSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting technicians:', error);
    throw error;
  }
};

// Get a single technician by ID
export const getTechnician = async (id: string) => {
  try {
    const technicianDoc = await getDoc(doc(db, 'technicians', id));
    
    if (!technicianDoc.exists()) {
      return null;
    }
    
    return {
      id: technicianDoc.id,
      ...technicianDoc.data()
    };
  } catch (error) {
    console.error('Error getting technician:', error);
    throw error;
  }
};

// Get technicians by hotel
export const getTechniciansByHotel = async (hotelId: string) => {
  try {
    const q = query(
      collection(db, 'technicians'),
      where('hotels', 'array-contains', hotelId),
      where('active', '==', true)
    );
    
    const technicianSnapshot = await getDocs(q);
    return technicianSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting technicians by hotel:', error);
    throw error;
  }
};

// Get available technicians by specialty
export const getAvailableTechniciansBySpecialty = async (specialtyId: string) => {
  try {
    const q = query(
      collection(db, 'technicians'),
      where('specialties', 'array-contains', specialtyId),
      where('available', '==', true),
      where('active', '==', true)
    );
    
    const technicianSnapshot = await getDocs(q);
    return technicianSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting available technicians by specialty:', error);
    throw error;
  }
};

// Create new technician
export const createTechnician = async (technicianData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'technicians'), {
      ...technicianData,
      rating: 0,
      completedJobs: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating technician:', error);
    throw error;
  }
};

// Update technician
export const updateTechnician = async (id: string, technicianData: any) => {
  try {
    const technicianRef = doc(db, 'technicians', id);
    
    await updateDoc(technicianRef, {
      ...technicianData,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating technician:', error);
    throw error;
  }
};

// Delete technician
export const deleteTechnician = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'technicians', id));
    return true;
  } catch (error) {
    console.error('Error deleting technician:', error);
    throw error;
  }
};

// Update technician availability
export const updateTechnicianAvailability = async (id: string, available: boolean) => {
  try {
    const technicianRef = doc(db, 'technicians', id);
    
    await updateDoc(technicianRef, {
      available,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating technician availability:', error);
    throw error;
  }
};

// Update technician rating
export const updateTechnicianRating = async (id: string, newRating: number) => {
  try {
    // Get current technician data
    const technicianDoc = await getDoc(doc(db, 'technicians', id));
    
    if (!technicianDoc.exists()) {
      throw new Error('Technician not found');
    }
    
    const technicianData = technicianDoc.data();
    const currentRating = technicianData.rating || 0;
    const completedJobs = technicianData.completedJobs || 0;
    
    // Calculate new rating (weighted average)
    const updatedRating = completedJobs > 0
      ? (currentRating * completedJobs + newRating) / (completedJobs + 1)
      : newRating;
    
    // Update technician
    const technicianRef = doc(db, 'technicians', id);
    
    await updateDoc(technicianRef, {
      rating: updatedRating,
      completedJobs: completedJobs + 1,
      updatedAt: new Date().toISOString()
    });
    
    return updatedRating;
  } catch (error) {
    console.error('Error updating technician rating:', error);
    throw error;
  }
};