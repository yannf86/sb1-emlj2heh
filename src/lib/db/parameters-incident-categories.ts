import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all incident category parameters
export const getIncidentCategoryParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_incident_category'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting incident category parameters:', error);
    throw error;
  }
};

// Create new incident category parameter
export const createIncidentCategoryParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'incident_category',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_incident_category'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating incident category parameter:', error);
    throw error;
  }
};

// Update incident category parameter
export const updateIncidentCategoryParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_incident_category', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating incident category parameter:', error);
    throw error;
  }
};

// Delete incident category parameter
export const deleteIncidentCategoryParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_incident_category', id));
  } catch (error) {
    console.error('Error deleting incident category parameter:', error);
    throw error;
  }
};

// Get incident category label
export const getIncidentCategoryLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_incident_category', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting incident category label:', error);
    return 'Inconnu';
  }
};