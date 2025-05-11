import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Incident } from '../schema';
import { getCurrentUser } from '../auth';
import { deleteFile } from './file-upload';
import { uploadToSupabase, isDataUrl, dataUrlToFile, deleteFromSupabase } from '../supabase';

// Get all incidents
export const getIncidents = async (hotelId?: string) => {
  try {
    const currentUser = getCurrentUser();
    
    // If no current user, return empty array
    if (!currentUser) {
      console.error('No current user found');
      return [];
    }
    
    let q;
    
    // Admin users can see all incidents
    if (currentUser.role === 'admin') {
      if (hotelId) {
        // If hotelId is provided, filter by it
        q = query(collection(db, 'incidents'), where('hotelId', '==', hotelId));
      } else {
        // Otherwise, get all incidents
        q = collection(db, 'incidents');
      }
    } else {
      // Standard users can only see incidents from their assigned hotels
      if (hotelId) {
        // If hotelId is provided, check if user has access to it
        if (!currentUser.hotels.includes(hotelId)) {
          console.error('User does not have access to this hotel');
          return [];
        }
        q = query(collection(db, 'incidents'), where('hotelId', '==', hotelId));
      } else if (currentUser.hotels.length === 1) {
        // If user has only one hotel, filter by it
        q = query(collection(db, 'incidents'), where('hotelId', '==', currentUser.hotels[0]));
      } else if (currentUser.hotels.length > 1) {
        // If user has multiple hotels, we'll need to make separate queries and combine results
        const results = [];
        for (const hotel of currentUser.hotels) {
          const hotelQuery = query(collection(db, 'incidents'), where('hotelId', '==', hotel));
          const querySnapshot = await getDocs(hotelQuery);
          results.push(...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        return results as Incident[];
      } else {
        // User has no hotels assigned
        return [];
      }
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
    
    const incidentData = {
      id: docSnap.id,
      ...docSnap.data()
    } as Incident;
    
    // Check if current user has access to this incident
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(incidentData.hotelId)) {
      console.error('User does not have access to this incident');
      return null;
    }
    
    return incidentData;
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
      concludedAt: incidentData.concludedById ? new Date().toISOString() : null,
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
        // Use the photosincident bucket as specified
        const photoUrl = await uploadToSupabase(photo, 'photosincident');
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
          // Use the photosincident bucket
          const photoUrl = await uploadToSupabase(file, 'photosincident');
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
    
    // Verify user has access to this incident
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const incidentData = docSnap.data();
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(incidentData.hotelId)) {
      throw new Error('You do not have permission to update this incident');
    }
    
    const oldData = docSnap.data();
    
    // Extract file fields if present
    const { photo, photoPreview, document, documentName, ...updatedIncidentData } = data as any;
    
    // Get current user
    const userId = currentUser?.id || 'system';
    
    // Track what has changed
    const changes = trackChanges(oldData, updatedIncidentData);
    
    // Create update payload
    const payload: any = { ...updatedIncidentData };
    
    // Set concludedAt based on concludedById
    if (payload.concludedById) {
      // If concludedById is set, ensure concludedAt is set
      payload.concludedAt = payload.concludedAt || new Date().toISOString();
    } else {
      // If concludedById is null or undefined, ensure concludedAt is also null
      payload.concludedAt = null;
      payload.concludedById = null;
    }
    
    // Process photo upload to Supabase
    if (photo instanceof File) {
      try {
        // Upload photo to photosincident bucket
        const photoUrl = await uploadToSupabase(photo, 'photosincident');
        
        // Delete old photo if exists
        if (oldData.photoUrl) {
          await deleteFromSupabase(oldData.photoUrl);
        }
        
        payload.photoUrl = photoUrl;
        changes['photoUrl'] = { old: oldData.photoUrl || null, new: 'Updated' };
      } catch (error) {
        console.error('Error uploading photo to Supabase during update:', error);
        throw new Error(`Failed to update photo: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (isDataUrl(photoPreview)) {
      // If it's a data URL, convert to file and upload to Supabase
      const file = await dataUrlToFile(photoPreview, 'incident_photo.jpg');
      if (file) {
        try {
          const photoUrl = await uploadToSupabase(file, 'photosincident');
          
          // Delete old photo if exists
          if (oldData.photoUrl) {
            await deleteFromSupabase(oldData.photoUrl);
          }
          
          payload.photoUrl = photoUrl;
          changes['photoUrl'] = { old: oldData.photoUrl || null, new: 'Updated' };
        } catch (error) {
          console.error('Error uploading photo from data URL to Supabase during update:', error);
        }
      }
    }
    
    // Process document upload
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
    if (!currentUser) throw new Error('Not authenticated');
    
    const userId = currentUser?.id || 'system';
    
    // Get the current incident
    const docRef = doc(db, 'incidents', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Incident not found');
    }
    
    const oldData = docSnap.data();
    
    // Verify user has access to this incident
    if (currentUser.role !== 'admin' && !currentUser.hotels.includes(oldData.hotelId)) {
      throw new Error('You do not have permission to delete this incident');
    }
    
    // Delete associated files (photo and document)
    if (oldData.photoUrl) {
      try {
        await deleteFromSupabase(oldData.photoUrl);
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