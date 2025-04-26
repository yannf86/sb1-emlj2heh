import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Incident } from '../schema';
import { getCurrentUser } from '../auth';
import { uploadToSupabase, isDataUrl, dataUrlToFile } from '../supabase';
import { deleteFile } from './file-upload';

// Get all incidents
export const getIncidents = async (hotelId?: string) => {
  try {
    let q = collection(db, 'incidents');
    if (hotelId) {
      q = query(q, where('hotelId', '==', hotelId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Incident[];
  } catch (error) {
    console.error('Error getting incidents:', error);
    throw error;
  }
};

// Get incident by ID
export const getIncident = async (id: string) => {
  try {
    const docRef = doc(db, 'incidents', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Incident;
  } catch (error) {
    console.error('Error getting incident:', error);
    throw error;
  }
};

// Create new incident
export const createIncident = async (data: any) => {
  try {
    // Extract file fields and preview data
    const { photo, photoPreview, document, documentName, ...incidentData } = data;
    
    // Get current user
    const currentUser = getCurrentUser();
    
    // Create the incident payload
    const incidentPayload: any = {
      ...incidentData,
      concludedById: incidentData.concludedById || null,
      resolutionDescription: incidentData.resolutionDescription || null,
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

    // Process photo upload to Supabase
    if (photo instanceof File) {
      try {
        const photoUrl = await uploadToSupabase(photo, 'photoavant');
        incidentPayload.photoUrl = photoUrl;
        console.log('Photo URL saved:', photoUrl);
      } catch (error) {
        console.error('Error uploading photo to Supabase:', error);
        throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoPreview)) {
      // If it's a data URL, convert to file and upload
      const file = await dataUrlToFile(photoPreview, 'incident_photo.jpg');
      if (file) {
        try {
          const photoUrl = await uploadToSupabase(file, 'photoavant');
          incidentPayload.photoUrl = photoUrl;
          console.log('Photo URL saved from data URL:', photoUrl);
        } catch (error) {
          console.error('Error uploading photo from data URL to Supabase:', error);
        }
      }
    }
    
    // Process document upload
    if (document instanceof File) {
      try {
        const docUrl = await uploadToSupabase(document, 'devis');
        
        incidentPayload.documentUrl = docUrl;
        incidentPayload.documentName = documentName || document.name;
        console.log('Document URL saved:', docUrl);
      } catch (error) {
        console.error('Error uploading document to Supabase:', error);
        throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Create incident document in Firestore
    const docRef = await addDoc(collection(db, 'incidents'), incidentPayload);
    console.log('Incident created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating incident:', error);
    throw error;
  }
};

// Track changes between old and new data
const trackChanges = (oldData: any, newData: any) => {
  const changes: Record<string, { old: any, new: any }> = {};
  
  // Compare each field in the new data with the old data
  for (const [key, value] of Object.entries(newData)) {
    // Skip fields that should not be tracked
    if (key === 'history' || 
        key === 'id' || 
        key === 'createdAt' || 
        key === 'updatedAt' || 
        key === 'createdBy' || 
        key === 'updatedBy' || 
        key === 'photo' || 
        key === 'photoPreview' || 
        key === 'document' || 
        key === 'documentName' || 
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

// Update incident
export const updateIncident = async (id: string, data: Partial<Incident>) => {
  try {
    // Get the current incident to track changes
    const docRef = doc(db, 'incidents', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Incident not found');
    }
    
    const oldData = docSnap.data();
    
    // Extract file fields if present
    const { photo, photoPreview, document, documentName, ...incidentData } = data as any;
    
    // Get current user
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'system';
    
    // Track what has changed
    const changes = trackChanges(oldData, incidentData);
    
    // Check if concludedById was set and set timestamp
    let concludedAt = oldData.concludedAt;
    if (incidentData.concludedById && !oldData.concludedById) {
      concludedAt = new Date().toISOString();
    } else if (incidentData.concludedById === null && oldData.concludedById) {
      concludedAt = null;
    }
    
    // Create update payload
    const payload: any = { ...incidentData, concludedAt };
    
    // Process photo upload to Supabase
    if (photo instanceof File) {
      try {
        // Upload new photo
        const photoUrl = await uploadToSupabase(photo, 'photoavant');
        payload.photoUrl = photoUrl;
        
        // Delete old photo if exists
        if (oldData.photoUrl) {
          await deleteFile(oldData.photoUrl);
        }
        
        if (!changes['photoUrl'] && photoUrl !== oldData.photoUrl) {
          changes['photoUrl'] = { old: oldData.photoUrl || null, new: 'Updated' };
        }
      } catch (error) {
        console.error('Error uploading photo to Supabase during update:', error);
        throw new Error(`Failed to update photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoPreview)) {
      // If it's a data URL, convert to file and upload to Supabase
      const file = await dataUrlToFile(photoPreview, 'incident_photo.jpg');
      if (file) {
        try {
          const photoUrl = await uploadToSupabase(file, 'photoavant');
          
          // Delete old photo if exists
          if (oldData.photoUrl) {
            await deleteFile(oldData.photoUrl);
          }
          
          payload.photoUrl = photoUrl;
          changes['photoUrl'] = { old: oldData.photoUrl || null, new: 'Updated' };
        } catch (error) {
          console.error('Error uploading photo from data URL to Supabase during update:', error);
        }
      }
    }
    
    // Process document upload to Supabase
    if (document instanceof File) {
      try {
        const docUrl = await uploadToSupabase(document, 'devis');
        
        // Delete old document if exists
        if (oldData.documentUrl) {
          await deleteFile(oldData.documentUrl);
        }
        
        payload.documentUrl = docUrl;
        payload.documentName = documentName || document.name;
        changes['documentUrl'] = { old: oldData.documentUrl || null, new: 'Updated' };
        if (documentName !== oldData.documentName) {
          changes['documentName'] = { old: oldData.documentName || null, new: documentName || document.name };
        }
      } catch (error) {
        console.error('Error uploading document to Supabase during update:', error);
        throw new Error(`Failed to update document: ${error instanceof Error ? error.message : String(error)}`);
      }
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
    console.log('Incident updated successfully');
  } catch (error) {
    console.error('Error updating incident:', error);
    throw error;
  }
};

// Delete incident
export const deleteIncident = async (id: string) => {
  try {
    // Get current user
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'system';
    
    // Get the current incident
    const docRef = doc(db, 'incidents', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Incident not found');
    }
    
    const oldData = docSnap.data();
    
    // Delete associated files (photo and document)
    if (oldData.photoUrl) {
      try {
        await deleteFile(oldData.photoUrl);
        console.log('Photo deleted successfully');
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
    
    if (oldData.documentUrl) {
      try {
        await deleteFile(oldData.documentUrl);
        console.log('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
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
    console.error('Error deleting incident:', error);
    throw error;
  }
};

// Clear concludedBy field on an incident
export const clearConcludedBy = async (id: string) => {
  try {
    const docRef = doc(db, 'incidents', id);
    await updateDoc(docRef, {
      concludedById: null,
      concludedAt: null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing concludedBy field:', error);
    throw error;
  }
};