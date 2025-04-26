import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Generic CRUD operations
export const createDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const getDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const getCollection = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting collection:', error);
    throw error;
  }
};

// Collection-specific operations
export const getIncidents = async (hotelId?: string) => {
  try {
    let q = collection(db, 'incidents');
    if (hotelId) {
      q = query(q, where('hotelId', '==', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting incidents:', error);
    throw error;
  }
};

export const getMaintenanceRequests = async (hotelId?: string) => {
  try {
    let q = collection(db, 'maintenance');
    if (hotelId) {
      q = query(q, where('hotelId', '==', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting maintenance requests:', error);
    throw error;
  }
};

export const getQualityVisits = async (hotelId?: string) => {
  try {
    let q = collection(db, 'quality_visits');
    if (hotelId) {
      q = query(q, where('hotelId', '==', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting quality visits:', error);
    throw error;
  }
};

export const getLostItems = async (hotelId?: string) => {
  try {
    let q = collection(db, 'lost_items');
    if (hotelId) {
      q = query(q, where('hotelId', '==', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting lost items:', error);
    throw error;
  }
};

export const getProcedures = async (hotelId?: string) => {
  try {
    let q = collection(db, 'procedures');
    if (hotelId) {
      q = query(q, where('hotelIds', 'array-contains', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting procedures:', error);
    throw error;
  }
};

export const getSuppliers = async (hotelId?: string) => {
  try {
    let q = collection(db, 'suppliers');
    if (hotelId) {
      q = query(q, where('hotelIds', 'array-contains', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
};