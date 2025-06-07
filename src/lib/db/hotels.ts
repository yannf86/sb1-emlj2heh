import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Hotel } from '../schema';
import { getCurrentUser, hasHotelAccess, hasGroupAccess } from '../auth';

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
    
    // For group_admin, return all hotels in their groups
    if (currentUser.role === 'group_admin' && currentUser.groupIds && currentUser.groupIds.length > 0) {
      return allHotels.filter(hotel => 
        hotel.groupId && currentUser.groupIds.includes(hotel.groupId)
      );
    }
    
    // For both hotel_admin and standard users, filter hotels based on their assigned hotels
    return allHotels.filter(hotel => currentUser.hotels.includes(hotel.id));
  } catch (error) {
    console.error('Error getting hotels:', error);
    throw error;
  }
};

// Get hotels by group
export const getHotelsByGroup = async (groupId: string) => {
  try {
    // Check if current user has access to this group
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    if (currentUser.role !== 'admin' && !hasGroupAccess(groupId)) {
      throw new Error('You do not have access to this group');
    }
    
    // Get hotels for this group
    const q = query(
      collection(db, 'hotels'),
      where('groupId', '==', groupId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hotel[];
  } catch (error) {
    console.error('Error getting hotels by group:', error);
    throw error;
  }
};

// Get hotels by IDs
export const getHotelsByIds = async (hotelIds: string[]) => {
  try {
    if (!hotelIds.length) return [];
    
    // Filter for hotels the current user has access to
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // For admin users, no need to filter
    if (currentUser.role === 'admin') {
      const hotels: Hotel[] = [];
      
      for (const hotelId of hotelIds) {
        const hotelRef = doc(db, 'hotels', hotelId);
        const hotelSnap = await getDoc(hotelRef);
        if (hotelSnap.exists()) {
          hotels.push({
            id: hotelSnap.id,
            ...hotelSnap.data()
          } as Hotel);
        }
      }
      
      return hotels;
    }
    
    // For group_admin users, filter by group access
    if (currentUser.role === 'group_admin' && currentUser.groupIds && currentUser.groupIds.length > 0) {
      const hotels: Hotel[] = [];
      
      for (const hotelId of hotelIds) {
        const hotelRef = doc(db, 'hotels', hotelId);
        const hotelSnap = await getDoc(hotelRef);
        if (hotelSnap.exists()) {
          const hotel = {
            id: hotelSnap.id,
            ...hotelSnap.data()
          } as Hotel;
          
          if (hotel.groupId && currentUser.groupIds.includes(hotel.groupId)) {
            hotels.push(hotel);
          }
        }
      }
      
      return hotels;
    }
    
    // For hotel_admin and standard users, filter by direct hotel access
    const accessibleHotelIds = hotelIds.filter(id => currentUser.hotels.includes(id));
    
    const hotels: Hotel[] = [];
    for (const hotelId of accessibleHotelIds) {
      const hotelRef = doc(db, 'hotels', hotelId);
      const hotelSnap = await getDoc(hotelRef);
      if (hotelSnap.exists()) {
        hotels.push({
          id: hotelSnap.id,
          ...hotelSnap.data()
        } as Hotel);
      }
    }
    
    return hotels;
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

// Create hotel
export const createHotel = async (hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Only admin and group_admin can create hotels
    if (currentUser.role !== 'admin' && currentUser.role !== 'group_admin') {
      throw new Error('You do not have permission to create hotels');
    }
    
    // For group_admin, ensure they have access to the group
    if (currentUser.role === 'group_admin' && hotelData.groupId) {
      if (!currentUser.groupIds || !currentUser.groupIds.includes(hotelData.groupId)) {
        throw new Error('You do not have permission to create hotels for this group');
      }
    }
    
    // Create the hotel
    const hotelRef = await addDoc(collection(db, 'hotels'), {
      ...hotelData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id,
      updatedBy: currentUser.id
    });
    
    return hotelRef.id;
  } catch (error) {
    console.error('Error creating hotel:', error);
    throw error;
  }
};

// Update hotel
export const updateHotel = async (hotelId: string, hotelData: Partial<Hotel>) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get current hotel data
    const hotelRef = doc(db, 'hotels', hotelId);
    const hotelSnap = await getDoc(hotelRef);
    
    if (!hotelSnap.exists()) {
      throw new Error('Hotel not found');
    }
    
    const currentHotelData = hotelSnap.data() as Hotel;
    
    // Check permissions
    if (currentUser.role !== 'admin') {
      // Group admins can only update hotels in their groups
      if (currentUser.role === 'group_admin') {
        if (!currentUser.groupIds || !currentUser.groupIds.includes(currentHotelData.groupId)) {
          throw new Error('You do not have permission to update this hotel');
        }
      } else {
        // Hotel admins and standard users must have explicit access
        if (!hasHotelAccess(hotelId)) {
          throw new Error('You do not have permission to update this hotel');
        }
      }
    }
    
    // If trying to change the group, check if user has access to the new group
    if (hotelData.groupId && hotelData.groupId !== currentHotelData.groupId) {
      if (currentUser.role !== 'admin' && 
          (!currentUser.groupIds || !currentUser.groupIds.includes(hotelData.groupId))) {
        throw new Error('You do not have permission to move this hotel to the specified group');
      }
    }
    
    // Update the hotel
    await updateDoc(hotelRef, {
      ...hotelData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
    
    return true;
  } catch (error) {
    console.error('Error updating hotel:', error);
    throw error;
  }
};

// Get group ID for a hotel
export const getGroupIdForHotel = async (hotelId: string): Promise<string | null> => {
  try {
    const docRef = doc(db, 'hotels', hotelId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().groupId) {
      return docSnap.data().groupId;
    }
    return null;
  } catch (error) {
    console.error('Error getting group ID for hotel:', error);
    return null;
  }
};