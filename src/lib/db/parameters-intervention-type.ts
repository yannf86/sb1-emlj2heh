import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all intervention type parameters
export const getInterventionTypeParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_intervention_type'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // If there are no results, try to get from the legacy parameters collection
    if (querySnapshot.empty) {
      const legacyQuery = query(
        collection(db, 'parameters'),
        where('type', '==', 'intervention_type'),
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
    console.error('Error getting intervention type parameters:', error);
    throw error;
  }
};

// Create new intervention type parameter
export const createInterventionTypeParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'intervention_type',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_intervention_type'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating intervention type parameter:', error);
    throw error;
  }
};

// Update intervention type parameter
export const updateInterventionTypeParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_intervention_type', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating intervention type parameter:', error);
    throw error;
  }
};

// Delete intervention type parameter
export const deleteInterventionTypeParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_intervention_type', id));
  } catch (error) {
    console.error('Error deleting intervention type parameter:', error);
    throw error;
  }
};

// Get intervention type parameter by ID
export const getInterventionTypeParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_intervention_type', id);
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
    if (legacySnap.exists() && legacySnap.data().type === 'intervention_type') {
      return {
        id: legacySnap.id,
        ...legacySnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting intervention type parameter:', error);
    throw error;
  }
};

// Get intervention type label
export const getInterventionTypeLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_intervention_type', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to legacy parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'intervention_type') {
      return legacySnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting intervention type label:', error);
    return 'Inconnu';
  }
};