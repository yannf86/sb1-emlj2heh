import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';
import { getHotels } from './hotels';

// Define the Technician type
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  specialties?: string[];
  hourlyRate?: number;
  hotels: string[];
  modules: string[]; // Modules comme pour les utilisateurs
  createdAt: string;
  updatedAt: string;
}

// Get all technicians
export const getTechnicians = async (): Promise<Technician[]> => {
  try {
    const currentUser = getCurrentUser();
    
    // If no current user, return empty array
    if (!currentUser) {
      console.error('No current user found');
      return [];
    }
    
    // Get technicians from Firestore based on user's permissions
    const q = query(collection(db, 'technicians'));
    const querySnapshot = await getDocs(q);
    
    let technicians = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Technician[];
    
    // Filter technicians by hotel access if user is not admin
    if (currentUser.role !== 'admin') {
      technicians = technicians.filter(technician => {
        // Check if any of the technician's hotels are in the user's accessible hotels
        const accessibleHotels = technician.hotels.filter(hotelId => 
          currentUser.hotels.includes(hotelId)
        );
        return accessibleHotels.length > 0;
      });
    }
    
    return technicians;
  } catch (error) {
    console.error('Error getting technicians:', error);
    throw error;
  }
};

// Get technician by ID
export const getTechnician = async (id: string): Promise<Technician | null> => {
  try {
    const docRef = doc(db, 'technicians', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const technicianData = {
      id: docSnap.id,
      ...docSnap.data()
    } as Technician;
    
    // Check if current user has access to this technician
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    // Admins can access any technician
    if (currentUser.role === 'admin') {
      return technicianData;
    }
    
    // Check if any of the technician's hotels are accessible to the user
    const accessibleHotels = technicianData.hotels.filter(hotelId => 
      currentUser.hotels.includes(hotelId)
    );
    
    if (accessibleHotels.length === 0) {
      console.error('User does not have access to this technician');
      return null;
    }
    
    return technicianData;
  } catch (error) {
    console.error('Error getting technician:', error);
    throw error;
  }
};

// Get technicians by hotel
export const getTechniciansByHotel = async (hotelId: string): Promise<Technician[]> => {
  try {
    const currentUser = getCurrentUser();
    
    // Check if current user has access to the hotel
    if (!currentUser) {
      console.error('No current user found');
      return [];
    }
    
    if (!currentUser.hotels.includes(hotelId) && currentUser.role !== 'admin') {
      console.error('User does not have access to this hotel');
      return [];
    }
    
    // Query technicians that have this hotel in their hotels array
    const q = query(
      collection(db, 'technicians'),
      where('hotels', 'array-contains', hotelId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Technician[];
  } catch (error) {
    console.error('Error getting technicians by hotel:', error);
    throw error;
  }
};

// Create a new technician
export const createTechnician = async (data: Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Verify the user has access to all the selected hotels
    const accessibleHotels = data.hotels.filter(hotelId => 
      currentUser.role === 'admin' || currentUser.hotels.includes(hotelId)
    );
    
    if (accessibleHotels.length !== data.hotels.length) {
      throw new Error('You do not have access to one or more of the selected hotels');
    }
    
    // Prepare technician data
    const technicianData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id,
      updatedBy: currentUser.id
    };
    
    // Create technician in Firestore
    const docRef = await addDoc(collection(db, 'technicians'), technicianData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating technician:', error);
    throw error;
  }
};

// Update technician
export const updateTechnician = async (id: string, data: Partial<Technician>): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get current technician to verify access
    const technician = await getTechnician(id);
    if (!technician) {
      throw new Error('Technician not found');
    }
    
    // Verify the user has access to all the selected hotels if hotels are being updated
    if (data.hotels) {
      const accessibleHotels = data.hotels.filter(hotelId => 
        currentUser.role === 'admin' || currentUser.hotels.includes(hotelId)
      );
      
      if (accessibleHotels.length !== data.hotels.length) {
        throw new Error('You do not have access to one or more of the selected hotels');
      }
    }
    
    // Update technician in Firestore
    const technicianRef = doc(db, 'technicians', id);
    await updateDoc(technicianRef, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
  } catch (error) {
    console.error('Error updating technician:', error);
    throw error;
  }
};

// Delete technician
export const deleteTechnician = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get current technician to verify access
    const technician = await getTechnician(id);
    if (!technician) {
      throw new Error('Technician not found');
    }
    
    // Only admins or users with access to all the technician's hotels can delete
    if (currentUser.role !== 'admin') {
      // Check if user has access to all technician's hotels
      const accessible = technician.hotels.every(hotelId => 
        currentUser.hotels.includes(hotelId)
      );
      
      if (!accessible) {
        throw new Error('You do not have sufficient permissions to delete this technician');
      }
    }
    
    // Delete technician from Firestore
    await deleteDoc(doc(db, 'technicians', id));
  } catch (error) {
    console.error('Error deleting technician:', error);
    throw error;
  }
};