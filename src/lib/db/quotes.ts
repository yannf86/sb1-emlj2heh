import { query, where, getDocs, collection, doc as firestoreDoc, getDoc as firestoreGetDoc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getAuth, sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { getCurrentTechnician } from '../technician-auth';
import { updateMaintenanceRequest, getMaintenanceRequest } from './maintenance';
import { uploadToSupabase, deleteFromSupabase } from '../supabase';
import { getTechnician } from './technicians';
import { getHotelName } from './hotels';
import { getLocationLabel } from './parameters-locations';
import { getInterventionTypeLabel } from './parameters-intervention-type';

// Add a quote to a maintenance request
export const addQuoteToMaintenance = async (maintenanceId: string, quoteData: any) => {
  try {
    // Check if maintenance exists
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance request not found');
    }
    
    const currentUser = getCurrentTechnician();
    const userId = currentUser?.id || 'system';
    
    // Upload file if provided
    let quoteUrl = quoteData.quoteUrl;
    
    if (quoteData.quoteFile) {
      // Delete existing file if there is one
      if (maintenance.quoteUrl) {
        await deleteFromSupabase(maintenance.quoteUrl);
      }
      
      // Upload new file to Supabase
      quoteUrl = await uploadToSupabase(quoteData.quoteFile, 'devis');
    }
    
    // Prepare quote data
    const quote = {
      technicianId: quoteData.technicianId || null,
      amount: quoteData.quoteAmount ? parseFloat(quoteData.quoteAmount) : null,
      url: quoteUrl,
      status: quoteData.quoteStatus || 'pending',
      comments: quoteData.comments || null,
      createdAt: new Date().toISOString(),
      createdBy: userId
    };
    
    // Update maintenance with quote data
    let quotes = maintenance.quotes || [];
    quotes.push(quote);
    
    // Update maintenance
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
      quoteId: quotes.length - 1,
      quoteUrl: quoteUrl
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
    
    const currentUser = getCurrentTechnician();
    const userId = currentUser?.id || 'system';
    
    // Save the technicianId for notification purposes
    const technicianId = maintenance.quotes?.[quoteIndex]?.technicianId || maintenance.technicianId;
    
    // Create a copy of the quotes array to avoid mutating the original
    const updatedQuotes = [...(maintenance.quotes || [])];
    
    // Use a separate variable to keep track of the accepted technicianId
    let acceptedTechnicianId = null;
    
    if (status === 'accepted') {
      // When accepting a quote, mark all others as rejected
      updatedQuotes.forEach((quote, index) => {
        if (index === quoteIndex) {
          // Update the accepted quote
          updatedQuotes[index] = {
            ...updatedQuotes[index],
            status: 'accepted',
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedBy: userId,
            statusComments: comments
          };
          acceptedTechnicianId = updatedQuotes[index].technicianId;
        } else if (quote.status === 'pending') {
          // Only update quotes that are still pending
          updatedQuotes[index] = {
            ...updatedQuotes[index],
            status: 'rejected',
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedBy: userId,
            statusComments: 'Autre devis accepté'
          };
        }
        // Keep quotes that are already accepted or rejected with their original status
      });
    } else {
      // When rejecting a specific quote, only update that one
      // Make sure we don't change any previously accepted quotes
      if (updatedQuotes[quoteIndex].status !== 'accepted') {
        updatedQuotes[quoteIndex] = {
          ...updatedQuotes[quoteIndex],
          status: 'rejected',
          statusUpdatedAt: new Date().toISOString(),
          statusUpdatedBy: userId,
          statusComments: comments
        };
      } else {
        // Cannot reject an already accepted quote
        throw new Error('Cannot reject a quote that has already been accepted');
      }
    }
    
    // Check if any quote is already accepted to determine the primary technician
    const acceptedQuote = updatedQuotes.find(q => q.status === 'accepted');
    
    // Determine which technicianId to use for backwards compatibility
    const primaryTechnicianId = acceptedQuote ? acceptedQuote.technicianId : maintenance.technicianId;
    
    // Determine global quote status for backwards compatibility
    // If any quote is accepted, the global status is 'accepted'
    const globalQuoteStatus = acceptedQuote ? 'accepted' : status;
    
    // Update maintenance request
    await updateMaintenanceRequest(maintenanceId, {
      quotes: updatedQuotes,
      // These fields are for backwards compatibility
      quoteStatus: globalQuoteStatus,
      quoteAccepted: globalQuoteStatus === 'accepted',
      quoteAcceptedDate: globalQuoteStatus === 'accepted' ? new Date().toISOString() : null,
      quoteAcceptedById: globalQuoteStatus === 'accepted' ? userId : null,
      technicianId: primaryTechnicianId,
      statusId: globalQuoteStatus === 'accepted' ? 'stat2' : maintenance.statusId, // If accepted, update status to 'in progress'
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }, userId);
    
    // If accepted and there's a technician assigned, update completed jobs count
    if (status === 'accepted' && technicianId) {
      // This is a no-op if technician doesn't exist
      try {
        await updateTechnicianRating(technicianId, 0); // Just increment completed jobs without rating yet
      } catch (error) {
        console.warn('Failed to update technician job count:', error);
        // We don't want to fail the entire operation if this fails
      }
    }
    
    // Send notifications to relevant technicians
    if (status === 'accepted') {
      // Notify the accepted technician
      try {
        await sendMaintenanceEmailNotifications(
          maintenanceId,
          maintenance.hotelId,
          [technicianId],
          'quote_accepted'
        );
      } catch (emailError) {
        console.warn('Failed to send acceptance notification email:', emailError);
      }
      
      // Notify rejected technicians
      const rejectedTechnicianIds = updatedQuotes
        .filter((q, idx) => idx !== quoteIndex && q.status === 'rejected' && q.technicianId !== technicianId)
        .map(q => q.technicianId);
      
      if (rejectedTechnicianIds.length > 0) {
        try {
          await sendMaintenanceEmailNotifications(
            maintenanceId,
            maintenance.hotelId,
            rejectedTechnicianIds,
            'quote_rejected'
          );
        } catch (emailError) {
          console.warn('Failed to send rejection notification emails:', emailError);
        }
      }
    } else if (status === 'rejected') {
      // Notify only the rejected technician
      try {
        await sendMaintenanceEmailNotifications(
          maintenanceId,
          maintenance.hotelId,
          [technicianId],
          'quote_rejected'
        );
      } catch (emailError) {
        console.warn('Failed to send rejection notification email:', emailError);
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
    
    const currentUser = getCurrentTechnician();
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
    }, userId);
    
    return {
      success: true,
      newRating
    };
  } catch (error) {
    console.error('Error rating technician:', error);
    throw error;
  }
};