import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';
import { deleteFile } from './file-upload';
import { uploadToSupabase, isDataUrl, dataUrlToFile } from '../supabase';

// Get all lost items
export const getLostItems = async (hotelId?: string) => {
  try {
    const currentUser = getCurrentUser();
    
    // If no current user, return empty array
    if (!currentUser) {
      console.error('No current user found');
      return [];
    }
    
    let q;
    
    // Admin users can see all lost items
    if (currentUser.role === 'admin') {
      if (hotelId) {
        // If hotelId is provided, filter by it
        q = query(collection(db, 'lost_items'), where('hotelId', '==', hotelId));
      } else {
        // Otherwise, get all lost items
        q = collection(db, 'lost_items');
      }
    } else {
      // Standard users can only see lost items from their assigned hotels
      if (hotelId) {
        // If hotelId is provided, check if user has access to it
        if (!currentUser.hotels.includes(hotelId)) {
          console.error('User does not have access to this hotel');
          return [];
        }
        q = query(collection(db, 'lost_items'), where('hotelId', '==', hotelId));
      } else if (currentUser.hotels.length === 1) {
        // If user has only one hotel, filter by it
        q = query(collection(db, 'lost_items'), where('hotelId', '==', currentUser.hotels[0]));
      } else if (currentUser.hotels.length > 0) {
        // If user has multiple hotels, we'll need to make separate queries and combine results
        const results = [];
        for (const hotel of currentUser.hotels) {
          const hotelQuery = query(collection(db, 'lost_items'), where('hotelId', '==', hotel));
          const querySnapshot = await getDocs(hotelQuery);
          results.push(...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        return results;
      } else {
        // User has no hotels assigned
        return [];
      }
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting lost items:', error);
    throw error;
  }
};

// Get a single lost item by ID
export const getLostItem = async (id: string) => {
  try {
    const docRef = doc(db, 'lost_items', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const itemData = {
      id: docSnap.id,
      ...docSnap.data()
    };
    
    // Check if current user has access to this lost item
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(itemData.hotelId)) {
      console.error('User does not have access to this lost item');
      return null;
    }
    
    return itemData;
  } catch (error) {
    console.error('Error getting lost item:', error);
    throw error;
  }
};

// Create new lost item
export const createLostItem = async (data: any) => {
  try {
    // Extract file fields and preview data
    const { photo, photoPreview, ...lostItemData } = data;
    
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Verify user has access to the hotel
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(lostItemData.hotelId)) {
      throw new Error('You do not have permission to create lost items for this hotel');
    }
    
    // Create the lost item payload
    const lostItemPayload: any = {
      ...lostItemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'system',
      updatedBy: currentUser?.id || 'system',
      // Initialize history array
      history: [{
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        action: 'create',
        changes: { type: 'initial_creation' }
      }]
    };

    // Upload photo to Supabase if present
    if (photo instanceof File) {
      try {
        // Use the objettrouve bucket as specified
        const photoUrl = await uploadToSupabase(photo, 'objettrouve');
        lostItemPayload.photoUrl = photoUrl;
      } catch (error) {
        console.error('Error uploading photo to Supabase:', error);
        throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoPreview)) {
      // Convert data URL to File and upload to Supabase
      const file = await dataUrlToFile(photoPreview, 'lost_item_photo.jpg');
      if (file) {
        try {
          const photoUrl = await uploadToSupabase(file, 'objettrouve');
          lostItemPayload.photoUrl = photoUrl;
        } catch (error) {
          console.error('Error uploading photo from data URL to Supabase:', error);
        }
      }
    } else if (photoPreview) {
      lostItemPayload.photoUrl = photoPreview;
    }

    // Create lost item document
    const docRef = await addDoc(collection(db, 'lost_items'), lostItemPayload);
    return docRef.id;
  } catch (error) {
    console.error('Error creating lost item:', error);
    throw error;
  }
};

// Track changes between old and new data
const trackChanges = (oldData: any, newData: any) => {
  const changes: Record<string, { old: any, new: any }> = {};
  
  // Compare each field in the new data with the old data
  for (const [key, value] of Object.entries(newData)) {
    // Skip history field, internal fields, and functions
    if (key === 'history' || key === 'id' || key === 'createdAt' || key === 'updatedAt' || 
        key === 'createdBy' || key === 'updatedBy' || typeof value === 'function' ||
        key === 'photo' || key === 'photoPreview') {
      continue;
    }
    
    // Check if the field exists in old data
    if (key in oldData) {
      // Check if the value is different
      if (JSON.stringify(oldData[key]) !== JSON.stringify(value)) {
        changes[key] = {
          old: oldData[key],
          new: value
        };
      }
    } else if (value !== null && value !== undefined && value !== '') {
      // New field with a value
      changes[key] = {
        old: null,
        new: value
      };
    }
  }
  
  return changes;
};

// Update lost item
export const updateLostItem = async (id: string, data: any) => {
  try {
    // Get the current lost item to track changes
    const docRef = doc(db, 'lost_items', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Lost item not found');
    }
    
    const oldData = docSnap.data();
    
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Verify user has access to this lost item
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(oldData.hotelId)) {
      throw new Error('You do not have permission to update this lost item');
    }
    
    // Extract file fields if present
    const { photo, photoPreview, ...itemData } = data;
    
    const userId = currentUser?.id || 'system';
    
    // Track what has changed
    const changes = trackChanges(oldData, itemData);
    
    // Create update payload
    const payload: any = { ...itemData };
    
    // Check if returnDate was set and add it to changes
    if (payload.status === 'rendu' && !oldData.returnDate && !payload.returnDate) {
      payload.returnDate = new Date().toISOString();
      changes['returnDate'] = { old: null, new: payload.returnDate };
    }
    
    // Upload photo to Supabase if present (using objettrouve bucket)
    if (photo instanceof File) {
      try {
        const photoUrl = await uploadToSupabase(photo, 'objettrouve');
        
        // Delete the old photo if it exists
        if (oldData.photoUrl) {
          await deleteFile(oldData.photoUrl);
        }
        
        payload.photoUrl = photoUrl;
        changes['photoUrl'] = { old: oldData.photoUrl || null, new: 'Updated' };
      } catch (error) {
        console.error('Error uploading photo to Supabase during update:', error);
        throw new Error(`Failed to update photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoPreview)) {
      // Convert data URL to File and upload to Supabase
      const file = await dataUrlToFile(photoPreview, 'lost_item_photo.jpg');
      if (file) {
        try {
          const photoUrl = await uploadToSupabase(file, 'objettrouve');
          
          // Delete the old photo if it exists
          if (oldData.photoUrl) {
            await deleteFile(oldData.photoUrl);
          }
          
          payload.photoUrl = photoUrl;
          changes['photoUrl'] = { old: oldData.photoUrl || null, new: 'Updated' };
        } catch (error) {
          console.error('Error uploading photo from data URL to Supabase during update:', error);
        }
      }
    } else if (photoPreview && photoPreview !== oldData.photoUrl) {
      payload.photoUrl = photoPreview;
      changes['photoUrl'] = { old: oldData.photoUrl || null, new: photoPreview };
    } else if (photoPreview === '' && oldData.photoUrl) {
      // Photo has been removed
      await deleteFile(oldData.photoUrl);
      payload.photoUrl = null;
      changes['photoUrl'] = { old: oldData.photoUrl, new: null };
    }
    
    // Create a history entry if there are changes
    if (Object.keys(changes).length > 0) {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action: 'update',
        changes
      };
      
      // Update the history array
      const history = oldData.history || [];
      history.push(historyEntry);
      payload.history = history;
    }
    
    // Update timestamps and user
    payload.updatedAt = new Date().toISOString();
    payload.updatedBy = userId;
    
    // Update the document in Firestore
    await updateDoc(docRef, payload);
  } catch (error) {
    console.error('Error updating lost item:', error);
    throw error;
  }
};

// Delete lost item
export const deleteLostItem = async (id: string) => {
  try {
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const userId = currentUser?.id || 'system';
    
    // Get the current lost item
    const docRef = doc(db, 'lost_items', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Lost item not found');
    }
    
    const oldData = docSnap.data();
    
    // Verify user has access to this lost item
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(oldData.hotelId)) {
      throw new Error('You do not have permission to delete this lost item');
    }
    
    // Delete the photo file from storage if it exists
    if (oldData.photoUrl) {
      try {
        console.log('🗑️ Deleting photo file from storage:', oldData.photoUrl);
        await deleteFile(oldData.photoUrl);
        console.log('✅ Photo file deleted from storage successfully');
      } catch (deleteError) {
        console.error('❌ Error deleting photo file:', deleteError);
      }
    }
    
    // Add deletion to history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action: 'delete',
      changes: { type: 'deletion' }
    };
    
    // Update history before deletion (for audit purposes)
    const history = oldData.history || [];
    history.push(historyEntry);
    
    await updateDoc(docRef, {
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      history
    });
    
    // Now delete the document
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting lost item:', error);
    throw error;
  }
};