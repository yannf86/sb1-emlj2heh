import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get all checklist mission parameters
 * @returns Array of checklist mission parameters
 */
export const getChecklistMissionParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_checklist_mission'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting checklist mission parameters:', error);
    throw error;
  }
};

/**
 * Get checklist mission parameters by hotel
 * @param hotelId Hotel ID to filter by
 * @returns Array of checklist mission parameters for the specified hotel
 */
export const getChecklistMissionParametersByHotel = async (hotelId: string) => {
  try {
    const q = query(
      collection(db, 'parameters_checklist_mission'),
      where('hotelIds', 'array-contains', hotelId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting checklist mission parameters by hotel:', error);
    throw error;
  }
};

/**
 * Get checklist mission parameters by service
 * @param serviceId Service ID to filter by
 * @returns Array of checklist mission parameters for the specified service
 */
export const getChecklistMissionParametersByService = async (serviceId: string) => {
  try {
    const q = query(
      collection(db, 'parameters_checklist_mission'),
      where('serviceId', '==', serviceId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting checklist mission parameters by service:', error);
    throw error;
  }
};

/**
 * Create a new checklist mission parameter and associated items for today
 * @param data Checklist mission parameter data
 * @returns ID of the created parameter
 */
export const createChecklistMissionParameter = async (data: any) => {
  try {
    // Create the checklist mission parameter
    const docRef = await addDoc(collection(db, 'parameters_checklist_mission'), {
      ...data,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create checklist items for today in each hotel
    if (data.hotelIds && data.hotelIds.length > 0) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Import the createChecklistItem function
      const { createChecklistItem } = await import('./checklist');
      
      // Create a checklist item for each hotel
      const createPromises = data.hotelIds.map(hotelId => 
        createChecklistItem({
          title: data.title,
          description: data.description || null,
          hotelId,
          serviceId: data.serviceId,
          date: today,
          completed: false,
          missionId: docRef.id,
          isPermanent: data.isPermanent || false,
          imageUrl: data.imageUrl || null,
          attachmentPath: data.attachmentPath || null,
          orderIndex: data.order || 0
        })
      );
      
      // Wait for all items to be created (even if some fail)
      await Promise.allSettled(createPromises);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating checklist mission parameter:', error);
    throw error;
  }
};

/**
 * Update an existing checklist mission parameter
 * @param id ID of the parameter to update
 * @param data Updated parameter data
 */
export const updateChecklistMissionParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_checklist_mission', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating checklist mission parameter:', error);
    throw error;
  }
};

/**
 * Delete a checklist mission parameter
 * @param id ID of the parameter to delete
 */
export const deleteChecklistMissionParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_checklist_mission', id));
  } catch (error) {
    console.error('Error deleting checklist mission parameter:', error);
    throw error;
  }
};

/**
 * Get a specific checklist mission parameter by ID
 * @param id ID of the parameter to get
 * @returns The checklist mission parameter or null if not found
 */
export const getChecklistMissionParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_checklist_mission', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error getting checklist mission parameter:', error);
    throw error;
  }
};