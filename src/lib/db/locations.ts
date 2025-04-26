import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all locations
export const getLocations = async () => {
  try {
    const q = query(
      collection(db, 'parameters'),
      where('type', '==', 'location')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting locations:', error);
    throw error;
  }
};

// Create new location
export const createLocation = async (data: any) => {
  try {
    const locationData = {
      ...data,
      type: 'location',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'parameters'), locationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

// Update location
export const updateLocation = async (id: string, data: any) => {
  try {
    const docRef = doc(db, 'parameters', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Delete location
export const deleteLocation = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'parameters', id));
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

// Get locations for a hotel
export const getHotelLocations = async (hotelId: string) => {
  try {
    // First get the hotel-location relationships
    const q = query(
      collection(db, 'hotel_locations'),
      where('hotel_id', '==', hotelId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const locationIds = querySnapshot.docs.map(doc => doc.data().location_id);
    
    // Then get the actual location data
    if (locationIds.length === 0) return [];
    
    const locationsQuery = query(
      collection(db, 'parameters'),
      where('type', '==', 'location'),
      where('id', 'in', locationIds)
    );
    const locationsSnapshot = await getDocs(locationsQuery);
    return locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting hotel locations:', error);
    throw error;
  }
};