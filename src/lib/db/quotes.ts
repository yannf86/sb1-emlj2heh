import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';
import { uploadToSupabase, deleteFromSupabase } from '../supabase';
import { updateMaintenanceRequest, getMaintenanceRequest } from './maintenance';
import { updateTechnicianRating } from './technicians';

// Add a quote to a maintenance request
export const addQuoteToMaintenance = async (maintenanceId: string, quoteData: any, quoteFile?: File | null) => {
  try {
    // Check if maintenance exists
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance request not found');
    }
    
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'system';
    
    // Upload file if provided
    let quoteUrl = quoteData.quoteUrl;
    
    if (quoteFile) {
      // Delete existing file if there is one
      if (quoteUrl) {
        await deleteFromSupabase(quoteUrl);
      }
      
      quoteUrl = await uploadToSupabase(quoteFile, 'devis');
    }
    
    // Prepare quote data
    const quote = {
      amount: quoteData.quoteAmount ? parseFloat(quoteData.quoteAmount) : null,
      url: quoteUrl,
      status: quoteData.quoteStatus || 'pending',
      technicianId: quoteData.technicianId || null,
      comments: quoteData.comments || null,
      createdAt: new Date().toISOString(),
      createdBy: userId
    };
    
    // Update maintenance with quote data
    let quotes = maintenance.quotes || [];
    quotes.push(quote);
    
    // Update maintenance request
    await updateMaintenanceRequest(maintenanceId, {
      quotes,
      quoteUrl,  // For backwards compatibility
      quoteAmount: quoteData.quoteAmount ? parseFloat(quoteData.quoteAmount) : null,
      quoteStatus: quoteData.quoteStatus || 'pending',
      technicianId: quoteData.technicianId || maintenance.technicianId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    });
    
    return {
      success: true,
      quoteId: quotes.length - 1
    };
  } catch (error) {
    console.error('Error adding quote to maintenance:', error);
    throw error;
  }
};

// Update quote status (accept/reject)
export const updateQuoteStatus = async (maintenanceId: string, quoteIndex: number, status: 'accepted' | 'rejected', comments?: string) => {
  try {
    // Check if maintenance exists
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance request not found');
    }
    
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'system';
    
    // Check if quote exists
    if (!maintenance.quotes || !maintenance.quotes[quoteIndex]) {
      // Try to use the legacy fields instead
      if (!maintenance.quoteUrl) {
        throw new Error('Quote not found');
      }
      
      // Create a new quotes array with the legacy data
      maintenance.quotes = [{
        amount: maintenance.quoteAmount,
        url: maintenance.quoteUrl,
        status: maintenance.quoteStatus || 'pending',
        technicianId: maintenance.technicianId,
        createdAt: maintenance.updatedAt,
        createdBy: maintenance.updatedBy
      }];
      
      quoteIndex = 0;
    }
    
    // Update quote status
    const updatedQuotes = [...maintenance.quotes];
    updatedQuotes[quoteIndex] = {
      ...updatedQuotes[quoteIndex],
      status,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: userId,
      statusComments: comments
    };
    
    // Update maintenance request
    await updateMaintenanceRequest(maintenanceId, {
      quotes: updatedQuotes,
      // These fields are for backwards compatibility
      quoteStatus: status,
      quoteAccepted: status === 'accepted',
      quoteAcceptedDate: status === 'accepted' ? new Date().toISOString() : null,
      quoteAcceptedById: status === 'accepted' ? userId : null,
      statusId: status === 'accepted' ? 'stat2' : maintenance.statusId, // If accepted, update status to 'in progress'
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    });
    
    // If accepted and there's a technician assigned, update completed jobs count
    if (status === 'accepted' && maintenance.technicianId) {
      // This is a no-op if technician doesn't exist
      try {
        await updateTechnicianRating(maintenance.technicianId, 0); // Just increment completed jobs without rating yet
      } catch (error) {
        console.warn('Failed to update technician job count:', error);
        // We don't want to fail the entire operation if this fails
      }
    }
    
    return {
      success: true,
      status
    };
  } catch (error) {
    console.error('Error updating quote status:', error);
    throw error;
  }
};

// Get all quotes for a maintenance request
export const getMaintenanceQuotes = async (maintenanceId: string) => {
  try {
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance request not found');
    }
    
    // Handle both new quotes array and legacy fields
    if (maintenance.quotes && maintenance.quotes.length > 0) {
      return maintenance.quotes;
    }
    
    // Try to construct from legacy fields
    if (maintenance.quoteUrl) {
      return [{
        amount: maintenance.quoteAmount,
        url: maintenance.quoteUrl,
        status: maintenance.quoteStatus || (maintenance.quoteAccepted ? 'accepted' : maintenance.quoteAccepted === false ? 'rejected' : 'pending'),
        technicianId: maintenance.technicianId,
        createdAt: maintenance.updatedAt,
        createdBy: maintenance.updatedBy
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting maintenance quotes:', error);
    throw error;
  }
};

// Rate a technician for a completed maintenance
export const rateTechnician = async (maintenanceId: string, rating: number, comments?: string) => {
  try {
    // Check if maintenance exists
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance request not found');
    }
    
    // Check if there's a technician assigned
    if (!maintenance.technicianId) {
      throw new Error('No technician assigned to this maintenance');
    }
    
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'system';
    
    // Update technician rating
    const newRating = await updateTechnicianRating(maintenance.technicianId, rating);
    
    // Add rating to maintenance history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action: 'rate_technician',
      details: {
        rating,
        comments: comments || null,
        technicianId: maintenance.technicianId
      }
    };
    
    const history = maintenance.history || [];
    history.push(historyEntry);
    
    // Update maintenance with rating info
    await updateMaintenanceRequest(maintenanceId, {
      technicianRating: rating,
      technicianRatingComments: comments,
      technicianRatingDate: new Date().toISOString(),
      technicianRatingBy: userId,
      history,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    });
    
    return {
      success: true,
      newRating
    };
  } catch (error) {
    console.error('Error rating technician:', error);
    throw error;
  }
};