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
    return null;
  } catch (error) {
    console.error('Error getting status parameter:', error);
    throw error;
  }
};

// Get status label
export const getStatusLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_status', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting status label:', error);
    return 'Inconnu';
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
      return null;
    }
    
    return querySnapshot.docs[0].id;
  } catch (error) {
    console.error('Error finding status by code:', error);
    return null;
  }
};