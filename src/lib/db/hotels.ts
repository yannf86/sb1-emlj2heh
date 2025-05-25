import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Hotel } from '../schema';
import { getCurrentUser } from '../auth';

// Get all hotels
export const getHotels = async () => {
  try {
    const currentUser = getCurrentUser();
    
    // Get all hotels from Firestore
    const querySnapshot = await getDocs(collection(db, 'hotels'));
    const allHotels = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hotel[];
    
    // If no user is logged in or user is system admin (role='admin'), return all hotels
    if (!currentUser || currentUser.role === 'admin') return allHotels;
    
    // For both hotel_admin and standard users, filter hotels based on their assigned hotels
    return allHotels.filter(hotel => currentUser.hotels.includes(hotel.id));
  } catch (error) {
    console.error('Error getting hotels:', error);
    throw error;
  }
};

// Get hotels by IDs
export const getHotelsByIds = async (hotelIds: string[]) => {
  try {
    if (!hotelIds.length) return [];
    
    const q = query(
      collection(db, 'hotels'), 
      where('id', 'in', hotelIds)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hotel[];
  } catch (error) {
    console.error('Error getting hotels by IDs:', error);
    throw error;
  }
};

// Get hotel name by ID
export const getHotelName = async (hotelId: string): Promise<string> => {
  try {
    const docRef = doc(db, 'hotels', hotelId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().name;
    }
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting hotel name:', error);
    return 'Inconnu';
  }
};