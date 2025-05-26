import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Get room types for a hotel
export const getHotelRoomTypes = async (hotelId: string) => {
  try {
    const q = query(
      collection(db, 'hotel_room_types'),
      where('hotel_id', '==', hotelId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting hotel room types:', error);
    throw error;
  }
};

// Update hotel room types
export const updateHotelRoomTypes = async (hotelId: string, roomTypeIds: string[]) => {
  try {
    // First, get existing room types
    const q = query(
      collection(db, 'hotel_room_types'),
      where('hotel_id', '==', hotelId)
    );
    const querySnapshot = await getDocs(q);
    const existingRoomTypes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      roomTypeId: doc.data().room_type_id
    }));

    // Delete removed room types
    const roomTypesToDelete = existingRoomTypes.filter(
      rt => !roomTypeIds.includes(rt.roomTypeId)
    );
    
    for (const rt of roomTypesToDelete) {
      await deleteDoc(doc(db, 'hotel_room_types', rt.id));
    }

    // Add new room types
    const existingRoomTypeIds = existingRoomTypes.map(rt => rt.roomTypeId);
    const roomTypesToAdd = roomTypeIds.filter(
      id => !existingRoomTypeIds.includes(id)
    );
    
    for (const roomTypeId of roomTypesToAdd) {
      await addDoc(collection(db, 'hotel_room_types'), {
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating hotel room types:', error);
    throw error;
  }
};