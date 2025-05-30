import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all resolution type parameters
export const getResolutionTypeParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_resolution_type'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // If there are no results, try to get from the legacy parameters collection
    if (querySnapshot.empty) {
      const legacyQuery = query(
        collection(db, 'parameters'),
        where('type', '==', 'resolution_type'),
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
    console.error('Error getting resolution type parameters:', error);
    throw error;
  }
};

// Create new resolution type parameter
export const createResolutionTypeParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'resolution_type',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_resolution_type'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating resolution type parameter:', error);
    throw error;
  }
};

// Update resolution type parameter
export const updateResolutionTypeParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_resolution_type', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating resolution type parameter:', error);
    throw error;
  }
};

// Delete resolution type parameter
export const deleteResolutionTypeParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_resolution_type', id));
  } catch (error) {
    console.error('Error deleting resolution type parameter:', error);
    throw error;
  }
};

// Get resolution type parameter by ID
export const getResolutionTypeParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_resolution_type', id);
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
    if (legacySnap.exists() && legacySnap.data().type === 'resolution_type') {
      return {
        id: legacySnap.id,
        ...legacySnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting resolution type parameter:', error);
    throw error;
  }
};

// Get resolution type label
export const getResolutionTypeLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_resolution_type', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'resolution_type') {
      return legacySnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting resolution type label:', error);
    return 'Inconnu';
  }
};