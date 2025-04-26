import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get parameters by type
export const getParametersByType = async (type: string) => {
  try {
    const q = query(
      collection(db, 'parameters'),
      where('type', '==', type)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting parameters:', error);
    throw error;
  }
};

// Create new parameter
export const createParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating parameter:', error);
    throw error;
  }
};

// Update parameter
export const updateParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating parameter:', error);
    throw error;
  }
};

// Delete parameter
export const deleteParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters', id));
  } catch (error) {
    console.error('Error deleting parameter:', error);
    throw error;
  }
};

// Get parameter label
export const getParameterLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting parameter label:', error);
    return 'Inconnu';
  }
};