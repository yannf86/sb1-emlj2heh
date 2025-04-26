import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Get hotels for a location
export const getLocationHotels = async (locationId: string) => {
  try {
    const q = query(
      collection(db, 'hotel_locations'),
      where('location_id', '==', locationId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting location hotels:', error);
    throw error;
  }
};

// Update location hotels
export const updateLocationHotels = async (locationId: string, hotelIds: string[]) => {
  try {
    // First, get existing hotels
    const q = query(
      collection(db, 'hotel_locations'),
      where('location_id', '==', locationId)
    );
    const querySnapshot = await getDocs(q);
    const existingHotels = querySnapshot.docs.map(doc => ({
      id: doc.id,
      hotelId: doc.data().hotel_id
    }));

    // Delete removed hotels
    const hotelsToDelete = existingHotels.filter(
      hotel => !hotelIds.includes(hotel.hotelId)
    );
    
    for (const hotel of hotelsToDelete) {
      await deleteDoc(doc(db, 'hotel_locations', hotel.id));
    }

    // Add new hotels
    const existingHotelIds = existingHotels.map(hotel => hotel.hotelId);
    const hotelsToAdd = hotelIds.filter(
      id => !existingHotelIds.includes(id)
    );
    
    for (const hotelId of hotelsToAdd) {
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
    console.error('Error updating location hotels:', error);
    throw error;
  }
};