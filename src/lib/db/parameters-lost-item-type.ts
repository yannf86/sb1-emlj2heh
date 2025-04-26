import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all lost item type parameters
export const getLostItemTypeParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_lost_item_type'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // If there are no results, try to get from the legacy parameters collection
    if (querySnapshot.empty) {
      const legacyQuery = query(
        collection(db, 'parameters'),
        where('type', '==', 'lost_item_type'),
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
    console.error('Error getting lost item type parameters:', error);
    throw error;
  }
};

// Create new lost item type parameter
export const createLostItemTypeParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'lost_item_type',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_lost_item_type'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating lost item type parameter:', error);
    throw error;
  }
};

// Update lost item type parameter
export const updateLostItemTypeParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_lost_item_type', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating lost item type parameter:', error);
    throw error;
  }
};

// Delete lost item type parameter
export const deleteLostItemTypeParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_lost_item_type', id));
  } catch (error) {
    console.error('Error deleting lost item type parameter:', error);
    throw error;
  }
};

// Get lost item type parameter by ID
export const getLostItemTypeParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_lost_item_type', id);
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
    if (legacySnap.exists() && legacySnap.data().type === 'lost_item_type') {
      return {
        id: legacySnap.id,
        ...legacySnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting lost item type parameter:', error);
    throw error;
  }
};

// Get lost item type label
export const getLostItemTypeLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_lost_item_type', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to parameters collection
    const legacyRef = doc(db, 'parameters', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && legacySnap.data().type === 'lost_item_type') {
      return legacySnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting lost item type label:', error);
    return 'Inconnu';
  }
};

// Migration function to transfer lost item types from parameters to parameters_lost_item_type
export const migrateLostItemTypes = async () => {
  try {
    // Get all lost item types from parameters collection
    const q = query(
      collection(db, 'parameters'),
      where('type', '==', 'lost_item_type')
    );
    const querySnapshot = await getDocs(q);
    
    // For each parameter, create a new document in parameters_lost_item_type
    const results = [];
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Check if already exists in the destination collection
      const existsQuery = query(
        collection(db, 'parameters_lost_item_type'),
        where('code', '==', data.code)
      );
      const existsSnapshot = await getDocs(existsQuery);
      
      if (existsSnapshot.empty) {
        // Create new document in parameters_lost_item_type
        const newDocRef = await addDoc(collection(db, 'parameters_lost_item_type'), {
          code: data.code,
          label: data.label,
          active: data.active,
          order: data.order,
          metadata: data.metadata || {},
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        results.push({
          id: docSnapshot.id,
          newId: newDocRef.id,
          success: true
        });
      } else {
        results.push({
          id: docSnapshot.id,
          success: false,
          reason: 'already_exists'
        });
      }
    }
    
    return { success: true, migrated: results.length, results };
  } catch (error) {
    console.error('Error migrating lost item types:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};