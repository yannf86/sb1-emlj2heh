import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Maintenance } from '../schema';
import { getCurrentUser } from '../auth';
import { uploadToSupabase, isDataUrl, dataUrlToFile } from '../supabase';
import { deleteFile } from './file-upload';
import { removeDummyDoc } from './ensure-collections';
import { getHotelName } from './hotels';
import { getLocationLabel } from './parameters-locations';
import { getInterventionTypeLabel } from './parameters-intervention-type';

// Helper function to remove undefined values from an object
const removeUndefined = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value === null || typeof value !== 'object') {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null ? removeUndefined(item) : item
        );
      } else {
        result[key] = removeUndefined(value);
      }
    }
  }
  return result;
};

// Get all maintenance requests
export const getMaintenanceRequests = async (hotelId?: string) => {
  try {
    const currentUser = getCurrentUser();
    
    // If no current user, return empty array without throwing an error
    if (!currentUser) {
      // Just return empty array silently instead of logging an error
      return [];
    }
    
    let q;
    
    // Build query based on user role, hotel permissions, and filter parameters
    if (hotelId) {
      // If hotelId is provided, verify user has access to this hotel
      if (!currentUser.hotels.includes(hotelId)) {
        console.warn(`User ${currentUser.id} does not have access to hotel ${hotelId}`);
        return []; // Return empty array for unauthorized hotel access
      }
      q = query(collection(db, 'maintenance'), where('hotelId', '==', hotelId));
    } else if (currentUser.hotels.length === 1) {
      // If user has only one hotel, filter by it
      q = query(collection(db, 'maintenance'), where('hotelId', '==', currentUser.hotels[0]));
    } else if (currentUser.hotels.length > 0) {
      // If user has multiple hotels, make separate queries for each hotel
      // and combine the results (since Firestore doesn't support OR queries on the same field)
      const results = [];
      for (const hotel of currentUser.hotels) {
        const hotelQuery = query(collection(db, 'maintenance'), where('hotelId', '==', hotel));
        const querySnapshot = await getDocs(hotelQuery);
        results.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
      return results as Maintenance[];
    } else {
      // User has no hotels assigned
      console.warn(`User ${currentUser.id} has no hotels assigned`);
      return [];
    }
    
    const querySnapshot = await getDocs(q);
    
    // Filter out dummy_doc if it exists
    return querySnapshot.docs
      .filter(doc => doc.id !== 'dummy_doc')
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Maintenance[];
  } catch (error) {
    console.error('Error getting maintenance requests:', error);
    throw error;
  }
};

// Get a single maintenance request by ID
export const getMaintenanceRequest = async (id: string) => {
  try {
    // Si l'ID est dummy_doc, retourner null
    if (id === 'dummy_doc') return null;
    
    const docRef = doc(db, 'maintenance', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const maintenanceData = {
      id: docSnap.id,
      ...docSnap.data()
    } as Maintenance;
    
    // Check if current user has access to this maintenance request
    const currentUser = getCurrentUser();
    if (!currentUser) return maintenanceData;
    
    // If user is not admin, check if they have access to this hotel
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(maintenanceData.hotelId)) {
      console.error('User does not have access to this maintenance request');
      return null;
    }
    
    return maintenanceData;
  } catch (error) {
    console.error('Error getting maintenance request:', error);
    throw error;
  }
};

// Create new maintenance request
export const createMaintenanceRequest = async (data: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Extract file fields if present
    const { photoBefore, photoBeforePreview, photoAfter, photoAfterPreview, ...maintenanceData } = data as any;
    
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Verify user has access to the hotel
    if (!currentUser.hotels.includes(maintenanceData.hotelId)) {
      throw new Error('You do not have permission to create maintenance requests for this hotel');
    }
    
    // Create the maintenance payload
    const payload: any = {
      ...maintenanceData,
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
      }],
      // Initialize emailsSent to track notifications
      emailsSent: {}
    };
    
    // Upload photoBefore to Supabase if present
    if (photoBefore instanceof File) {
      try {
        console.log('Uploading photoBefore to Supabase');
        const photoUrl = await uploadToSupabase(photoBefore, 'photoavant');
        payload.photoBefore = photoUrl;
      } catch (error) {
        console.error('Error uploading photoBefore to Supabase:', error);
        throw new Error(`Failed to upload 'before' photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoBeforePreview)) {
      // Convert data URL to File and upload to Supabase
      const file = await dataUrlToFile(photoBeforePreview, 'photoBefore.jpg');
      if (file) {
        try {
          console.log('Uploading converted photoBefore to Supabase');
          const photoUrl = await uploadToSupabase(file, 'photoavant');
          payload.photoBefore = photoUrl;
        } catch (error) {
          console.error('Error uploading photoBefore from data URL to Supabase:', error);
        }
      }
    }
    
    // Upload photoAfter to Supabase if present
    if (photoAfter instanceof File) {
      try {
        console.log('Uploading photoAfter to Supabase');
        const photoUrl = await uploadToSupabase(photoAfter, 'photoapres');
        payload.photoAfter = photoUrl;
      } catch (error) {
        console.error('Error uploading photoAfter to Supabase:', error);
        throw new Error(`Failed to upload 'after' photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoAfterPreview)) {
      // Convert data URL to File and upload to Supabase
      const file = await dataUrlToFile(photoAfterPreview, 'photoAfter.jpg');
      if (file) {
        try {
          console.log('Uploading converted photoAfter to Supabase');
          const photoUrl = await uploadToSupabase(file, 'photoapres');
          payload.photoAfter = photoUrl;
        } catch (error) {
          console.error('Error uploading photoAfter from data URL to Supabase:', error);
        }
      }
    }

    // Create maintenance request in Firestore
    console.log("Creating maintenance request with payload", payload);
    const docRef = await addDoc(collection(db, 'maintenance'), payload);
    console.log("Maintenance request created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    throw error;
  }
};

// Track changes between old and new data
const trackChanges = (oldData: any, newData: any) => {
  const changes: Record<string, { old: any, new: any }> = {};
  
  // Compare each field in the new data with the old data
  for (const [key, value] of Object.entries(newData)) {
    // Skip fields that shouldn't be tracked
    if (key === 'history' || 
        key === 'id' || 
        key === 'createdAt' || 
        key === 'updatedAt' || 
        key === 'createdBy' || 
        key === 'updatedBy' || 
        key === 'photoBefore' || 
        key === 'photoBeforePreview' || 
        key === 'photoAfter' || 
        key === 'photoAfterPreview' ||
        key === 'emailsSent' ||
        typeof value === 'function') {
      continue;
    }
    
    // Check if the field exists in old data
    if (key in oldData) {
      // For arrays, we need to stringify them for comparison
      if (Array.isArray(value) && Array.isArray(oldData[key])) {
        if (JSON.stringify(oldData[key].sort()) !== JSON.stringify(value.sort())) {
          changes[key] = {
            old: oldData[key],
            new: value
          };
        }
      }
      // For other values, do a direct comparison
      else if (JSON.stringify(oldData[key]) !== JSON.stringify(value)) {
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

// Update maintenance request
export const updateMaintenanceRequest = async (id: string, data: Partial<Maintenance>, actorId?: string) => {
  try {
    // Ignorer le document dummy
    if (id === 'dummy_doc') {
      console.log('Ignoring update for dummy document');
      return;
    }
    
    // Get the current maintenance to track changes
    const docRef = doc(db, 'maintenance', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Maintenance request not found');
    }
    
    const oldData = docSnap.data();
    
    // Get current user or use provided actorId
    const currentUser = getCurrentUser();
    let userId = actorId || (currentUser?.id || 'system');
    
    // Only verify user access if we're using the current user (not an actorId)
    if (!actorId && currentUser) {
      // Verify user has access to this maintenance request
      if (!currentUser.hotels.includes(oldData.hotelId)) {
        throw new Error('You do not have permission to update this maintenance request');
      }
    }
    
    // Extract file fields if present
    const { photoBefore, photoBeforePreview, photoAfter, photoAfterPreview, emailsSent, ...maintenanceData } = data as any;
    
    // Create update payload
    const payload: any = { ...maintenanceData };
    
    // Track what has changed
    const changes = trackChanges(oldData, payload);
    
    // Upload photoBefore to Supabase if present
    if (photoBefore instanceof File) {
      try {
        console.log('Uploading updated photoBefore to Supabase');
        const photoUrl = await uploadToSupabase(photoBefore, 'photoavant');
        
        // Delete old photo if exists
        if (oldData.photoBefore) {
          await deleteFile(oldData.photoBefore);
        }
        
        payload.photoBefore = photoUrl;
        changes['photoBefore'] = { old: oldData.photoBefore || null, new: 'Updated' };
      } catch (error) {
        console.error('Error uploading photoBefore to Supabase during update:', error);
        throw new Error(`Failed to upload 'before' photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoBeforePreview)) {
      // Convert data URL to File and upload to Supabase
      const file = await dataUrlToFile(photoBeforePreview, 'photoBefore.jpg');
      if (file) {
        try {
          console.log('Uploading converted photoBefore to Supabase during update');
          const photoUrl = await uploadToSupabase(file, 'photoavant');
          
          // Delete old photo if exists
          if (oldData.photoBefore) {
            await deleteFile(oldData.photoBefore);
          }
          
          payload.photoBefore = photoUrl;
          changes['photoBefore'] = { old: oldData.photoBefore || null, new: 'Updated' };
        } catch (error) {
          console.error('Error uploading photoBefore from data URL to Supabase during update:', error);
        }
      }
    } else if (photoBeforePreview === '' && oldData.photoBefore) {
      // Photo has been removed
      await deleteFile(oldData.photoBefore);
      payload.photoBefore = null;
      changes['photoBefore'] = { old: oldData.photoBefore, new: null };
    } else if (photoBeforePreview && typeof photoBeforePreview === 'string' && photoBeforePreview !== oldData.photoBefore) {
      // It's a different URL, update it
      
      // Delete old photo if exists
      if (oldData.photoBefore) {
        await deleteFile(oldData.photoBefore);
      }
      
      payload.photoBefore = photoBeforePreview;
      changes['photoBefore'] = { old: oldData.photoBefore || null, new: 'Updated' };
    }
    
    // Upload photoAfter to Supabase if present
    if (photoAfter instanceof File) {
      try {
        console.log('Uploading updated photoAfter to Supabase');
        const photoUrl = await uploadToSupabase(photoAfter, 'photoapres');
        
        // Delete old photo if exists
        if (oldData.photoAfter) {
          await deleteFile(oldData.photoAfter);
        }
        
        payload.photoAfter = photoUrl;
        changes['photoAfter'] = { old: oldData.photoAfter || null, new: 'Updated' };
      } catch (error) {
        console.error('Error uploading photoAfter to Supabase during update:', error);
        throw new Error(`Failed to upload 'after' photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoAfterPreview)) {
      // Convert data URL to File and upload to Supabase
      const file = await dataUrlToFile(photoAfterPreview, 'photoAfter.jpg');
      if (file) {
        try {
          console.log('Uploading converted photoAfter to Supabase during update');
          const photoUrl = await uploadToSupabase(file, 'photoapres');
          
          // Delete old photo if exists
          if (oldData.photoAfter) {
            await deleteFile(oldData.photoAfter);
          }
          
          payload.photoAfter = photoUrl;
          changes['photoAfter'] = { old: oldData.photoAfter || null, new: 'Updated' };
        } catch (error) {
          console.error('Error uploading photoAfter from data URL to Supabase during update:', error);
        }
      }
    } else if (photoAfterPreview === '' && oldData.photoAfter) {
      // Photo has been removed
      await deleteFile(oldData.photoAfter);
      payload.photoAfter = null;
      changes['photoAfter'] = { old: oldData.photoAfter, new: null };
    } else if (photoAfterPreview && typeof photoAfterPreview === 'string' && photoAfterPreview !== oldData.photoAfter) {
      // It's a different URL, update it
      
      // Delete old photo if exists
      if (oldData.photoAfter) {
        await deleteFile(oldData.photoAfter);
      }
      
      payload.photoAfter = photoAfterPreview;
      changes['photoAfter'] = { old: oldData.photoAfter || null, new: 'Updated' };
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
    
    // Preserve the emailsSent tracking object if it exists
    if (oldData.emailsSent) {
      payload.emailsSent = oldData.emailsSent;
    } else {
      payload.emailsSent = {};
    }
    
    // Update timestamps and user
    payload.updatedAt = new Date().toISOString();
    payload.updatedBy = userId;
    
    // Remove undefined values from the payload before updating Firestore
    const cleanPayload = removeUndefined(payload);
    
    // Update the document in Firestore
    await updateDoc(docRef, cleanPayload);
    console.log('Maintenance request updated successfully');
    
    return id;
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    throw error;
  }
};

// Delete maintenance request
export const deleteMaintenanceRequest = async (id: string) => {
  try {
    // Ignorer le document dummy
    if (id === 'dummy_doc') {
      console.log('Ignoring delete for dummy document');
      return;
    }
    
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const userId = currentUser?.id || 'system';
    
    // Get the current maintenance request
    const docRef = doc(db, 'maintenance', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Maintenance request not found');
    }
    
    const oldData = docSnap.data();
    
    // Verify user has access to this maintenance request
    if (!currentUser.hotels.includes(oldData.hotelId)) {
      throw new Error('You do not have permission to delete this maintenance request');
    }
    
    // Delete associated files
    if (oldData.photoBefore) {
      try {
        await deleteFile(oldData.photoBefore);
        console.log('Before photo deleted successfully');
      } catch (error) {
        console.error('Error deleting before photo:', error);
      }
    }
    
    if (oldData.photoAfter) {
      try {
        await deleteFile(oldData.photoAfter);
        console.log('After photo deleted successfully');
      } catch (error) {
        console.error('Error deleting after photo:', error);
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
    console.error('Error deleting maintenance request:', error);
    throw error;
  }
};

// Get maintenance requests by hotel ID
export const getMaintenanceRequestsByHotel = async (hotelId: string) => {
  try {
    if (!hotelId) {
      throw new Error('Hotel ID is required');
    }
    
    const maintenanceQuery = query(
      collection(db, 'maintenance'),
      where('hotelId', '==', hotelId)
    );
    
    const snapshot = await getDocs(maintenanceQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Maintenance[];
  } catch (error) {
    console.error('Error getting maintenance requests by hotel:', error);
    throw error;
  }
};