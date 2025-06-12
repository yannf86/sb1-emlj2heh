import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get all checklist mission parameters
 * @returns Array of checklist mission parameters
 */
export const getChecklistMissionParameters = async () => {
  try {
    console.log('Fetching all checklist mission parameters');
    const q = query(
      collection(db, 'parameters_checklist_mission'),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} active checklist mission parameters`);
    
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
    console.log(`Fetching missions for hotel ID: ${hotelId}`);
    
    // Récupérer toutes les missions pour voir si on en a
    const allMissions = await getDocs(collection(db, 'parameters_checklist_mission'));
    console.log(`Total missions found: ${allMissions.size}`);
    
    // Log les hotelIds de chaque mission pour débogage
    allMissions.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Mission ${doc.id} (${data.title}): hotelIds =`, 
        Array.isArray(data.hotelIds) ? data.hotelIds : 'Not an array');
    });
    
    // Tester d'abord la requête avec array-contains
    try {
      const q = query(
        collection(db, 'parameters_checklist_mission'),
        where('hotelIds', 'array-contains', hotelId),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} missions with array-contains query`);
      
      if (querySnapshot.size > 0) {
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      console.warn('Error with array-contains query:', error);
    }
    
    // Si la première requête échoue ou ne renvoie rien, essayer une approche différente
    console.log('Trying alternative approach - fetching all missions and filtering in memory');
    
    const allMissionsSnapshot = await getDocs(
      query(collection(db, 'parameters_checklist_mission'), where('active', '==', true))
    );
    
    const filteredMissions = allMissionsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(mission => {
        // S'assurer que hotelIds existe et est un tableau
        const hotelIds = Array.isArray(mission.hotelIds) ? mission.hotelIds : [];
        return hotelIds.includes(hotelId);
      });
    
    console.log(`Found ${filteredMissions.length} missions after manual filtering`);
    return filteredMissions;
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
 * Create a new checklist mission parameter
 * @param data Checklist mission parameter data
 * @returns ID of the created parameter
 */
export const createChecklistMissionParameter = async (data: any) => {
  try {
    // Assurez-vous que hotelIds est bien un tableau
    if (data.hotelIds && !Array.isArray(data.hotelIds)) {
      data.hotelIds = [data.hotelIds];
    }
    
    // Log pour débogage
    console.log('Creating checklist mission with data:', data);
    
    const docRef = await addDoc(collection(db, 'parameters_checklist_mission'), {
      ...data,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Created mission with ID: ${docRef.id}`);
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
    // Assurez-vous que hotelIds est bien un tableau
    if (data.hotelIds && !Array.isArray(data.hotelIds)) {
      data.hotelIds = [data.hotelIds];
    }
    
    const docRef = doc(db, 'parameters_checklist_mission', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Updated mission with ID: ${id}`);
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
    console.log(`Deleted mission with ID: ${id}`);
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