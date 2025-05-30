import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all client satisfaction parameters
export const getClientSatisfactionParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_client_satisfaction'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // If there are no results, try to get from the legacy parameters collection
    if (querySnapshot.empty) {
      const legacyQuery = query(
        collection(db, 'parameters'),
        where('type', '==', 'client_satisfaction'),
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
    console.error('Error getting client satisfaction parameters:', error);
    throw error;
  }
};

// Create new client satisfaction parameter
export const createClientSatisfactionParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'client_satisfaction',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_client_satisfaction'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating client satisfaction parameter:', error);
    throw error;
  }
};

// Update client satisfaction parameter
export const updateClientSatisfactionParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_client_satisfaction', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating client satisfaction parameter:', error);
    throw error;
  }
};

// Delete client satisfaction parameter
export const deleteClientSatisfactionParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_client_satisfaction', id));
  } catch (error) {
    console.error('Error deleting client satisfaction parameter:', error);
    throw error;
  }
};

// Get client satisfaction parameter by ID
export const getClientSatisfactionParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_client_satisfaction', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    // Try fallback to parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'client_satisfaction') {
      return {
        id: legacySnap.id,
        ...legacySnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting client satisfaction parameter:', error);
    throw error;
  }
};

// Get client satisfaction label
export const getClientSatisfactionLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_client_satisfaction', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'client_satisfaction') {
      return legacySnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting client satisfaction label:', error);
    return 'Inconnu';
  }
};