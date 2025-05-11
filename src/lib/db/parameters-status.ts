import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all status parameters
export const getStatusParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_status'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // If there are no results from parameters_status, try to get from the legacy parameters collection
    if (querySnapshot.empty) {
      console.log('No status parameters found in parameters_status, trying legacy collection');
      const legacyQuery = query(
        collection(db, 'parameters'),
        where('type', '==', 'status'),
        where('active', '==', true)
      );
      const legacySnapshot = await getDocs(legacyQuery);
      return legacySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting status parameters:', error);
    throw error;
  }
};

// Create new status parameter
export const createStatusParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'status',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_status'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating status parameter:', error);
    throw error;
  }
};

// Update status parameter
export const updateStatusParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_status', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating status parameter:', error);
    throw error;
  }
};

// Delete status parameter
export const deleteStatusParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_status', id));
  } catch (error) {
    console.error('Error deleting status parameter:', error);
    throw error;
  }
};

// Get status parameter by ID
export const getStatusParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_status', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    // Try fallback to legacy parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'status') {
      return {
        id: legacySnap.id,
        ...legacySnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting status parameter:', error);
    throw error;
  }
};

// Get status label
export const getStatusLabel = async (id: string): Promise<string> => {
  try {
    // First try to get from parameters_status collection
    const docRef = doc(db, 'parameters_status', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to legacy parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      if (legacySnap.data().type === 'status') {
        return legacySnap.data().label;
      }
    }
    
    // If we have a known status ID, return a hardcoded value
    // This helps when Firebase is temporarily unavailable
    const statusMap: {[key: string]: string} = {
      'stat1': 'Ouvert',
      'stat2': 'En cours',
      'stat3': 'Résolu',
      'stat4': 'Fermé',
      'stat5': 'Annulé',
      'CZa3iy84r8pVqjVOQHNL': 'En cours',
      'JyK8HpAF5qwg39QbQeS1': 'Résolu',
    };
    
    if (statusMap[id]) {
      return statusMap[id];
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting status label:', error);
    // Return a reasonable default instead of throwing error
    return 'Statut';
  }
};

// Find status ID by code
export const findStatusIdByCode = async (code: string): Promise<string | null> => {
  try {
    const q = query(
      collection(db, 'parameters_status'),
      where('code', '==', code),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // Try legacy params collection
      const legacyQ = query(
        collection(db, 'parameters'),
        where('type', '==', 'status'),
        where('code', '==', code),
        where('active', '==', true)
      );
      const legacySnapshot = await getDocs(legacyQ);
      if (legacySnapshot.empty) {
        return null;
      }
      return legacySnapshot.docs[0].id;
    }
    
    return querySnapshot.docs[0].id;
  } catch (error) {
    console.error('Error finding status by code:', error);
    return null;
  }
};