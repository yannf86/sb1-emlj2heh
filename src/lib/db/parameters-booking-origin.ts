import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all booking origin parameters
export const getBookingOriginParameters = async () => {
  try {
    const q = query(
      collection(db, 'parameters_booking_origin'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting booking origin parameters:', error);
    throw error;
  }
};

// Create new booking origin parameter
export const createBookingOriginParameter = async (data: any) => {
  try {
    const paramData = {
      ...data,
      type: 'booking_origin',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters_booking_origin'), paramData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking origin parameter:', error);
    throw error;
  }
};

// Update booking origin parameter
export const updateBookingOriginParameter = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters_booking_origin', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating booking origin parameter:', error);
    throw error;
  }
};

// Delete booking origin parameter
export const deleteBookingOriginParameter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters_booking_origin', id));
  } catch (error) {
    console.error('Error deleting booking origin parameter:', error);
    throw error;
  }
};

// Get booking origin parameter by ID
export const getBookingOriginParameter = async (id: string) => {
  try {
    const docRef = doc(db, 'parameters_booking_origin', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting booking origin parameter:', error);
    throw error;
  }
};

// Get booking origin label
export const getBookingOriginLabel = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'parameters_booking_origin', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Try fallback to parameters collection
    const paramRef = doc(db, 'parameters', id);
    const paramSnap = await getDoc(paramRef);
    if (paramSnap.exists()) {
      return paramSnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting booking origin label:', error);
    return 'Inconnu';
  }
};

// Alternative approach: Use parameters collection until migration is complete
export const getBookingOriginLabelFallback = async (id: string): Promise<string> => {
  try {
    // Try from dedicated collection first
    const docRef = doc(db, 'parameters_booking_origin', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().label;
    }
    
    // Fallback to parameters collection
    const paramRef = doc(db, 'parameters', id);
    const paramSnap = await getDoc(paramRef);
    if (paramSnap.exists()) {
      return paramSnap.data().label;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting booking origin label:', error);
    return 'Inconnu';
  }
};