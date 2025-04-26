import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Get locations for a hotel
export const getHotelLocations = async (hotelId: string) => {
  try {
    const q = query(
      collection(db, 'hotel_locations'),
      where('hotel_id', '==', hotelId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting hotel locations:', error);
    throw error;
  }
};

// Update hotel locations
export const updateHotelLocations = async (hotelId: string, locationIds: string[]) => {
  try {
    // First, get existing locations
    const q = query(
      collection(db, 'hotel_locations'),
      where('hotel_id', '==', hotelId)
    );
    const querySnapshot = await getDocs(q);
    const existingLocations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      locationId: doc.data().location_id
    }));

    // Delete removed locations
    const locationsToDelete = existingLocations.filter(
      loc => !locationIds.includes(loc.locationId)
    );
    
    for (const loc of locationsToDelete) {
      await deleteDoc(doc(db, 'hotel_locations', loc.id));
    }

    // Add new locations
    const existingLocationIds = existingLocations.map(loc => loc.locationId);
    const locationsToAdd = locationIds.filter(
      id => !existingLocationIds.includes(id)
    );
    
    for (const locationId of locationsToAdd) {
      await addDoc(collection(db, 'hotel_locations'), {
        hotel_id: hotelId,
        location_id: locationId,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating hotel locations:', error);
    throw error;
  }
};