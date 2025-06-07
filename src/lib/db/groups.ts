import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';
import { Group } from '../schema';

// Get all groups
export const getGroups = async () => {
  try {
    const currentUser = getCurrentUser();
    
    // If no current user, return empty array
    if (!currentUser) {
      console.error('No current user found');
      return [];
    }
    
    let q;
    
    // Admin users can see all groups
    if (currentUser.role === 'admin') {
      q = query(collection(db, 'groups'));
    } else {
      // Standard and hotel_admin users can only see groups they have access to
      q = query(
        collection(db, 'groups'),
        where('userIds', 'array-contains', currentUser.id)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];
  } catch (error) {
    console.error('Error getting groups:', error);
    throw error;
  }
};

// Get group by ID
export const getGroupById = async (id: string) => {
  try {
    const docRef = doc(db, 'groups', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const groupData = {
      id: docSnap.id,
      ...docSnap.data()
    } as Group;
    
    // Check if current user has access to this group
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    // Admins can access any group
    if (currentUser.role === 'admin') {
      return groupData;
    }
    
    // For others, check if they are in the userIds array
    if (groupData.userIds && groupData.userIds.includes(currentUser.id)) {
      return groupData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
};

// Create group
export const createGroup = async (data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Only admins can create groups
    if (currentUser.role !== 'admin') {
      throw new Error('You do not have permission to create groups');
    }
    
    // Create the group
    const docRef = await addDoc(collection(db, 'groups'), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id,
      updatedBy: currentUser.id
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Update group
export const updateGroup = async (id: string, data: Partial<Group>) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get current group to verify permissions
    const group = await getGroupById(id);
    if (!group) {
      throw new Error('Group not found or access denied');
    }
    
    // Only admins can update groups
    if (currentUser.role !== 'admin') {
      throw new Error('You do not have permission to update this group');
    }
    
    // Update the group
    const docRef = doc(db, 'groups', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
    
    return true;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

// Delete group
export const deleteGroup = async (id: string) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Only admins can delete groups
    if (currentUser.role !== 'admin') {
      throw new Error('You do not have permission to delete groups');
    }
    
    // First, check if there are any hotels associated with this group
    const hotelsQuery = query(
      collection(db, 'hotels'),
      where('groupId', '==', id)
    );
    
    const hotelsSnapshot = await getDocs(hotelsQuery);
    if (!hotelsSnapshot.empty) {
      throw new Error('Cannot delete group with associated hotels. Please reassign or delete the hotels first.');
    }
    
    // Delete the group
    await deleteDoc(doc(db, 'groups', id));
    
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// Get group name by ID
export const getGroupName = async (id: string): Promise<string> => {
  try {
    const docRef = doc(db, 'groups', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().name;
    }
    return 'Groupe inconnu';
  } catch (error) {
    console.error('Error getting group name:', error);
    return 'Groupe inconnu';
  }
};

// Get groups for a hotel
export const getGroupsForHotel = async (hotelId: string) => {
  try {
    // Get the hotel to find its group
    const hotelRef = doc(db, 'hotels', hotelId);
    const hotelSnap = await getDoc(hotelRef);
    
    if (!hotelSnap.exists() || !hotelSnap.data().groupId) {
      return [];
    }
    
    const groupId = hotelSnap.data().groupId;
    
    // Get the group
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      return [];
    }
    
    return [{
      id: groupSnap.id,
      ...groupSnap.data()
    }] as Group[];
  } catch (error) {
    console.error('Error getting groups for hotel:', error);
    return [];
  }
};

// Check if user has access to a group
export const hasGroupAccess = (groupId: string): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Admin has access to all groups
  if (currentUser.role === 'admin') return true;
  
  // Check if user has explicit access to this group
  if (currentUser.groupIds && currentUser.groupIds.includes(groupId)) {
    return true;
  }
  
  return false;
};

// Add users to group
export const addUsersToGroup = async (groupId: string, userIds: string[]) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Only admins can manage group users
    if (currentUser.role !== 'admin') {
      throw new Error('You do not have permission to manage group users');
    }
    
    // Get current group
    const group = await getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found or access denied');
    }
    
    // Update group userIds array
    const existingUserIds = group.userIds || [];
    const newUserIds = [...new Set([...existingUserIds, ...userIds])]; // Remove duplicates
    
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      userIds: newUserIds,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
    
    // Update user groupIds array
    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userGroupIds = userData.groupIds || [];
        
        if (!userGroupIds.includes(groupId)) {
          await updateDoc(userRef, {
            groupIds: [...userGroupIds, groupId],
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding users to group:', error);
    throw error;
  }
};

// Remove users from group
export const removeUsersFromGroup = async (groupId: string, userIds: string[]) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Only admins can manage group users
    if (currentUser.role !== 'admin') {
      throw new Error('You do not have permission to manage group users');
    }
    
    // Get current group
    const group = await getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found or access denied');
    }
    
    // Update group userIds array
    const existingUserIds = group.userIds || [];
    const newUserIds = existingUserIds.filter(id => !userIds.includes(id));
    
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      userIds: newUserIds,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
    
    // Update user groupIds array
    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userGroupIds = userData.groupIds || [];
        
        if (userGroupIds.includes(groupId)) {
          await updateDoc(userRef, {
            groupIds: userGroupIds.filter(id => id !== groupId),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error removing users from group:', error);
    throw error;
  }
};

// Get users by group ID
export const getUsersByGroup = async (groupId: string) => {
  try {
    // Check if user has access to the group
    if (!hasGroupAccess(groupId)) {
      throw new Error('You do not have permission to access this group');
    }
    
    // Get users that belong to this group
    const q = query(
      collection(db, 'users'),
      where('groupIds', 'array-contains', groupId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users by group:', error);
    throw error;
  }
};

// Get hotels by group ID
export const getHotelsByGroup = async (groupId: string) => {
  try {
    // Check if user has access to the group
    if (!hasGroupAccess(groupId)) {
      throw new Error('You do not have permission to access this group');
    }
    
    // Get hotels that belong to this group
    const q = query(
      collection(db, 'hotels'),
      where('groupId', '==', groupId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting hotels by group:', error);
    throw error;
  }
};