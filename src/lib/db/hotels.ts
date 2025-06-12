import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Hotel } from '../schema';
import { getCurrentUser, hasHotelAccess, hasGroupAccess } from '../auth';

// Get all hotels
export const getHotels = async () => {
  try {
    const currentUser = getCurrentUser();
    
    // If no current user, return empty array without throwing an error
    if (!currentUser) {
      console.warn('No current user found when loading hotels');
      return [];
    }
    
    let q;
    
    // Build query based on user role, hotel permissions
    if (currentUser.role === 'admin') {
      // Admin users can see all hotels
      q = query(collection(db, 'hotels'));
    } else if (currentUser.role === 'group_admin' && currentUser.groupIds && currentUser.groupIds.length > 0) {
      // Group admins can see hotels in their groups
      q = query(collection(db, 'hotels'), where('groupId', 'in', currentUser.groupIds.slice(0, 10)));
    } else if (currentUser.hotels && currentUser.hotels.length > 0) {
      // Standard users and hotel admins can only see their assigned hotels
      // Note: We can't use "in" queries with more than 10 items, so we use a different approach for users with many hotels
      if (currentUser.hotels.length <= 10) {
        q = query(collection(db, 'hotels'), where('id', 'in', currentUser.hotels));
      } else {
        // For users with more than 10 hotels, get all hotels and filter in memory
        q = query(collection(db, 'hotels'));
      }
    } else {
      // User has no hotels assigned, return empty array
      console.warn(`User ${currentUser.id} has no hotels assigned`);
      return [];
    }
    
    try {
      const querySnapshot = await getDocs(q);
      let hotelsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If we fetched all hotels due to the 10-item limit, filter in memory
      if (currentUser.role !== 'admin' && currentUser.hotels && currentUser.hotels.length > 10) {
        hotelsData = hotelsData.filter(hotel => currentUser.hotels.includes(hotel.id));
      }
      
      return hotelsData as Hotel[];
    } catch (error) {
      console.error('Firebase error getting hotels:', error);
      // Return empty array instead of throwing error
      return [];
    }
  } catch (error) {
    console.error('Error getting hotels:', error);
    // Return empty array instead of throwing
    return [];
  }
};

// Get hotel by ID
export const getHotelById = async (hotelId: string) => {
  try {
    // Si l'ID est vide ou null, retourner null immédiatement
    if (!hotelId) {
      console.warn('Empty hotel ID provided to getHotelById');
      return null;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get hotel document
    const docRef = doc(db, 'hotels', hotelId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const hotel = {
      id: docSnap.id,
      ...docSnap.data()
    } as Hotel;

    // Check permissions - admin can access any hotel
    if (currentUser.role === 'admin') {
      return hotel;
    }

    // Group admin can access hotels in their groups
    if (currentUser.role === 'group_admin' && currentUser.groupIds && currentUser.groupIds.length > 0) {
      if (hotel.groupId && currentUser.groupIds.includes(hotel.groupId)) {
        return hotel;
      }
    }

    // Hotel admin and standard users must have explicit access
    if (hasHotelAccess(hotelId)) {
      return hotel;
    }

    throw new Error('You do not have access to this hotel');
  } catch (error) {
    console.error('Error getting hotel by ID:', error);
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
    return []; // Return empty array instead of throwing
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
    if (currentUser.hotels && currentUser.hotels.length > 0) {
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
    }
    
    // User has no hotel access
    return [];
  } catch (error) {
    console.error('Error getting hotels by IDs:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get hotel name by ID
export const getHotelName = async (hotelId: string): Promise<string> => {
  try {
    // Check if hotelId is valid
    if (!hotelId) {
      console.warn('Invalid hotelId provided to getHotelName:', hotelId);
      return 'Inconnu';
    }
    
    const docRef = doc(db, 'hotels', hotelId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().name;
    }
    
    // Return 'Inconnu' if not found
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
    if (!hotelId) return null;
    
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