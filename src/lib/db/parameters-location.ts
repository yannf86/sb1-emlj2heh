import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all location parameters
export const getLocationParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_location'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // If there are no results, try to get from the legacy parameters collection
    if (querySnapshot.empty) {
      const legacyQuery = query(
        collection(db, 'parameters'),
        where('type', '==', 'location'),
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
    console.error('Error getting location parameters:', error);
    throw error;
  }
};

// Get location parameter by ID
export const getLocationParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_location', id);
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
    if (legacySnap.exists() && legacySnap.data().type === 'location') {
      return {
        id: legacySnap.id,
        ...legacySnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting location parameter:', error);
    throw error;
  }
};

// Get location label
export const getLocationLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_location', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to legacy parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'location') {
      return legacySnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting location label:', error);
    return 'Inconnu';
  }
};