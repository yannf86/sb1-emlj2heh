import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all impact parameters
export const getImpactParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_impact'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting impact parameters:', error);
    throw error;
  }
};

// Create new impact parameter
export const createImpactParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'impact',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_impact'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating impact parameter:', error);
    throw error;
  }
};

// Update impact parameter
export const updateImpactParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_impact', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating impact parameter:', error);
    throw error;
  }
};

// Delete impact parameter
export const deleteImpactParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_impact', id));
  } catch (error) {
    console.error('Error deleting impact parameter:', error);
    throw error;
  }
};

// Get impact parameter by ID
export const getImpactParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_impact', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting impact parameter:', error);
    throw error;
  }
};

// Get impact label
export const getImpactLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_impact', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting impact label:', error);
    return 'Inconnu';
  }
};