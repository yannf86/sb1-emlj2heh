import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../schema';
import { users as mockUsers } from '../data'; // Import mock data as fallback

// Get all users
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error getting users:', error);
    // Return mock data as fallback when Firebase fails
    console.warn('Using mock data as fallback due to Firebase connection error');
    return mockUsers;
  }
};

// Get active users
export const getActiveUsers = async () => {
  try {
    const q = query(collection(db, 'users'), where('active', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error getting active users:', error);
    // Return filtered mock data as fallback
    return mockUsers.filter(user => user.active);
  }
};

// Get user by ID
export const getUser = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    // Return mock user if ID matches
    const mockUser = mockUsers.find(user => user.id === userId);
    return mockUser || null;
  }
};

// Get user name by ID
export const getUserName = async (userId: string): Promise<string> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().name;
    }
    
    // If not found in Firestore, check mock data
    const mockUser = mockUsers.find(user => user.id === userId);
    if (mockUser) {
      return mockUser.name;
    }
    
    return 'Inconnu';
  } catch (error) {
    console.error('Error getting user name:', error);
    // Check mock data as fallback
    const mockUser = mockUsers.find(user => user.id === userId);
    return mockUser ? mockUser.name : 'Inconnu';
  }
};

// Get users by role
export const getUsersByRole = async (role: string) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role), where('active', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error getting users by role:', error);
    // Return filtered mock data as fallback
    return mockUsers.filter(user => user.role === role && user.active);
  }
};

// Get users by hotel ID
export const getUsersByHotel = async (hotelId: string) => {
  try {
    // Query users who have this hotel in their hotels array or are admins
    const q = query(
      collection(db, 'users'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    // Filter results to include admins or users with this hotel
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((user: User) => 
        user.role === 'admin' || 
        (user.hotels && user.hotels.includes(hotelId))
      ) as User[];
  } catch (error) {
    console.error('Error getting users by hotel:', error);
    // Return filtered mock data as fallback
    return mockUsers.filter(user => 
      (user.active && user.role === 'admin') || 
      (user.active && user.hotels.includes(hotelId))
    );
  }
};