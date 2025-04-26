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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting location parameters:', error);
    throw error;
  }
};

// Get locations for a hotel
export const getHotelLocations = async (hotelId: string) => {
  try {
    const q = query(
      collection(db, 'hotel_locations'),
      where('hotel_id', '==', hotelId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const locationIds = querySnapshot.docs.map(doc => doc.data().location_id);
    
    // Get the actual location data
    if (locationIds.length === 0) return [];
    
    const locationsQuery = query(
      collection(db, 'parameters_location'),
      where('active', '==', true)
    );
    const locationsSnapshot = await getDocs(locationsQuery);
    return locationsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(location => locationIds.includes(location.id));
  } catch (error) {
    console.error('Error getting hotel locations:', error);
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
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting location label:', error);
    return 'Inconnu';
  }
};