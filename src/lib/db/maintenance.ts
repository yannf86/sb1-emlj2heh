import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Maintenance } from '../schema';
import { getCurrentUser } from '../auth';
import { uploadToSupabase, isDataUrl, dataUrlToFile } from '../supabase';
import { deleteFile } from './file-upload';
import { removeDummyDoc } from './ensure-collections';

// Get all maintenance requests
export const getMaintenanceRequests = async (hotelId?: string) => {
  try {
    let q = collection(db, 'maintenance');
    if (hotelId) {
      q = query(q, where('hotelId', '==', hotelId));
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
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Maintenance;
  } catch (error) {
    console.error('Error getting maintenance request:', error);
    throw error;
  }
};

// Create new maintenance request
export const createMaintenanceRequest = async (data: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Extract file fields if present
    const { photoBefore, photoBeforePreview, photoAfter, photoAfterPreview, quoteFile, hasQuote, ...maintenanceData } = data as any;
    
    // Get current user
    const currentUser = getCurrentUser();
    
    // Create payload
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
      }]
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
    
    // Upload quote file to Supabase if present
    if (hasQuote && quoteFile instanceof File) {
      try {
        console.log('Uploading quote file to Supabase');
        const quoteUrl = await uploadToSupabase(quoteFile, 'devis');
        payload.quoteUrl = quoteUrl;
      } catch (error) {
        console.error('Error uploading quote file to Supabase:', error);
        throw new Error(`Failed to upload quote file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Essayer de supprimer le document dummy_doc s'il existe
    try {
      await removeDummyDoc('maintenance');
    } catch (error) {
      console.error('Error removing dummy document:', error);
      // Ce n'est pas critique, on continue
    }
    
    // If we have hasQuote but not quoteStatus, set default quoteStatus to pending
    if (hasQuote && !payload.quoteStatus) {
      payload.quoteStatus = 'pending';
    }
    
    // Create maintenance request in Firestore
    console.log('Creating maintenance request with payload', payload);
    const docRef = await addDoc(collection(db, 'maintenance'), payload);
    console.log('Maintenance request created with ID:', docRef.id);
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
        key === 'quoteFile' || 
        key === 'hasQuote' ||
        typeof value === 'function') {
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

// Update maintenance request
export const updateMaintenanceRequest = async (id: string, data: Partial<Maintenance>) => {
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
    
    // Get current user
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'system';
    
    // Extract file fields if present
    const { photoBefore, photoBeforePreview, photoAfter, photoAfterPreview, quoteFile, hasQuote, ...maintenanceData } = data as any;
    
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
    
    // Upload quote file to Supabase if present
    if (quoteFile instanceof File) {
      try {
        console.log('Uploading updated quote file to Supabase');
        const quoteUrl = await uploadToSupabase(quoteFile, 'devis');
        
        // Delete old quote if exists
        if (oldData.quoteUrl) {
          await deleteFile(oldData.quoteUrl);
        }
        
        payload.quoteUrl = quoteUrl;
        changes['quoteUrl'] = { old: oldData.quoteUrl || null, new: 'Updated' };
      } catch (error) {
        console.error('Error uploading quote file to Supabase during update:', error);
        throw new Error(`Failed to upload quote file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Handle the hasQuote flag - if it's false, clear quote-related fields
    if (hasQuote === false) {
      // Delete the quote file if it exists
      if (oldData.quoteUrl) {
        await deleteFile(oldData.quoteUrl);
      }
      
      payload.quoteUrl = null;
      payload.quoteAmount = null;
      payload.quoteStatus = null;
      
      // Track these changes
      if (oldData.quoteUrl) changes['quoteUrl'] = { old: oldData.quoteUrl, new: null };
      if (oldData.quoteAmount) changes['quoteAmount'] = { old: oldData.quoteAmount, new: null };
      if (oldData.quoteStatus) changes['quoteStatus'] = { old: oldData.quoteStatus, new: null };
    }
    
    // Handle compatibility with old quoteAccepted boolean field
    if (payload.quoteStatus === 'accepted') {
      payload.quoteAccepted = true;
    } else if (payload.quoteStatus === 'rejected') {
      payload.quoteAccepted = false;
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
    console.log('Updating maintenance request with payload', payload);
    await updateDoc(docRef, payload);
    console.log('Maintenance request updated successfully');
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
    const userId = currentUser?.id || 'system';
    
    // Get the current maintenance request
    const docRef = doc(db, 'maintenance', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Maintenance request not found');
    }
    
    const oldData = docSnap.data();
    
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
    
    if (oldData.quoteUrl) {
      try {
        await deleteFile(oldData.quoteUrl);
        console.log('Quote file deleted successfully');
      } catch (error) {
        console.error('Error deleting quote file:', error);
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