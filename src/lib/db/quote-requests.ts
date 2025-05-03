import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTechnician } from '../technician-auth';
import { uploadToSupabase, deleteFromSupabase } from '../supabase';
import { updateMaintenanceRequest, getMaintenanceRequest } from './maintenance';
import { getHotelName } from './hotels';
import { getLocationLabel } from './parameters-locations';
import { getInterventionTypeLabel } from './parameters-intervention-type';

// Get quote requests for the logged-in technician
export const getQuoteRequestsForTechnician = async () => {
  try {
    const technician = getCurrentTechnician();
    if (!technician) {
      throw new Error('Aucun technicien connecté');
    }
    
    // Get maintenances where this technician is in the technicianIds array
    // and has a quote request (hasQuote flag is true)
    const maintenanceQuery = query(
      collection(db, 'maintenance'),
      where('technicianIds', 'array-contains', technician.id),
      // We can't combine array-contains with other field filters in a single query
      // So we'll get all maintenances assigned to this technician and filter later
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(maintenanceQuery);
    
    // Process maintenances to add hotel and location names
    const requests = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if no "hasQuote" flag or if it's false
      if (!data.hasQuote && !data.quotes && !data.quoteUrl) {
        continue;
      }
      
      // Get additional info: hotel name, location name, etc.
      let hotelName = 'Chargement...';
      let locationName = 'Chargement...';
      let interventionTypeName = 'Chargement...';
      
      try {
        hotelName = await getHotelName(data.hotelId);
        locationName = await getLocationLabel(data.locationId);
        interventionTypeName = await getInterventionTypeLabel(data.interventionTypeId);
      } catch (error) {
        console.error('Error loading additional data:', error);
      }
      
      // Format the maintenance as a quote request
      const request = {
        id: doc.id,
        ...data,
        hotelName,
        locationName,
        interventionTypeName,
        // Determine quote status for this technician
        quoteSubmitted: false,
        quoteRejected: false
      };
      
      // Check if this technician has already submitted a quote or rejected the request
      if (data.quotes && Array.isArray(data.quotes)) {
        const technicianQuote = data.quotes.find((q: any) => q.technicianId === technician.id);
        if (technicianQuote) {
          request.quoteSubmitted = true;
          request.quoteStatus = technicianQuote.status;
          request.quoteAmount = technicianQuote.amount;
          request.quoteUrl = technicianQuote.url;
          request.quoteComments = technicianQuote.comments;
        }
      }
      
      requests.push(request);
    }
    
    return requests;
  } catch (error) {
    console.error('Error getting quote requests:', error);
    
    // Check if this is a Firebase index error
    if (error instanceof Error && 
        (error.message.includes('requires an index') || 
         error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
         error.message.includes('index is currently building'))) {
      // Return empty array instead of throwing to prevent app crash
      console.warn('Firebase requires a composite index. Please visit the URL in the error message to create it.');
      return [];
    }
    
    throw error;
  }
};

// Submit a quote for a maintenance request
export const submitQuote = async (maintenanceId: string, data: {
  amount: number;
  comments?: string;
  quoteFile?: File;
  acceptRequest: boolean;
  existingFileUrl?: string | null;
}) => {
  try {
    const technician = getCurrentTechnician();
    if (!technician) {
      throw new Error('Aucun technicien connecté');
    }
    
    // Check if maintenance exists
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Demande de maintenance introuvable');
    }
    
    // Check if technician is in the list of technicianIds
    if (!maintenance.technicianIds || !maintenance.technicianIds.includes(technician.id)) {
      throw new Error('Ce technicien n\'est pas autorisé à proposer un devis pour cette intervention');
    }
    
    // If technician rejects the request
    if (!data.acceptRequest) {
      // Update maintenance to record the rejection
      let updatedQuotes = maintenance.quotes || [];
      
      // Check if technician already has a quote
      const existingQuoteIndex = updatedQuotes.findIndex((q: any) => q.technicianId === technician.id);
      
      if (existingQuoteIndex >= 0) {
        // Update existing quote to rejected
        updatedQuotes[existingQuoteIndex] = {
          ...updatedQuotes[existingQuoteIndex],
          status: 'rejected',
          statusUpdatedAt: new Date().toISOString(),
          statusUpdatedBy: technician.id,
          statusComments: data.comments || 'Intervention refusée par le technicien'
        };
      } else {
        // Add new quote entry with rejected status
        updatedQuotes.push({
          technicianId: technician.id,
          status: 'rejected',
          createdAt: new Date().toISOString(),
          createdBy: technician.id,
          comments: data.comments || 'Intervention refusée par le technicien',
        });
      }
      
      // Update maintenance
      await updateMaintenanceRequest(maintenanceId, {
        quotes: updatedQuotes,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id
      });
      
      return { 
        success: true,
        message: 'Demande refusée avec succès'
      };
    }
    
    // Technician is accepting and submitting a quote
    // Validate amount
    if (!data.amount || data.amount <= 0) {
      throw new Error('Le montant du devis est requis');
    }
    
    // Upload file if provided
    let quoteUrl = data.existingFileUrl || null;
    if (data.quoteFile) {
      // If we're replacing an existing file, delete it first
      if (data.existingFileUrl) {
        try {
          await deleteFromSupabase(data.existingFileUrl);
        } catch (error) {
          console.warn('Failed to delete existing quote file:', error);
          // Continue anyway
        }
      }
      
      quoteUrl = await uploadToSupabase(data.quoteFile, 'devis');
    }
    
    // Update maintenance with new quote
    let updatedQuotes = maintenance.quotes || [];
    
    // Check if technician already has a quote
    const existingQuoteIndex = updatedQuotes.findIndex((q: any) => q.technicianId === technician.id);
    
    if (existingQuoteIndex >= 0) {
      // Update existing quote
      updatedQuotes[existingQuoteIndex] = {
        ...updatedQuotes[existingQuoteIndex],
        amount: data.amount,
        url: quoteUrl || updatedQuotes[existingQuoteIndex].url,
        status: 'pending',
        comments: data.comments,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new quote
      updatedQuotes.push({
        technicianId: technician.id,
        amount: data.amount,
        url: quoteUrl,
        status: 'pending',
        comments: data.comments,
        createdAt: new Date().toISOString(),
        createdBy: technician.id
      });
    }
    
    // If this is the first quote, also update legacy fields for backwards compatibility
    if (updatedQuotes.length === 1 || !maintenance.quoteUrl) {
      await updateMaintenanceRequest(maintenanceId, {
        quotes: updatedQuotes,
        quoteUrl: quoteUrl || maintenance.quoteUrl,
        quoteAmount: data.amount,
        quoteStatus: 'pending',
        technicianId: technician.id,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id
      });
    } else {
      // Just update the quotes array
      await updateMaintenanceRequest(maintenanceId, {
        quotes: updatedQuotes,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id
      });
    }
    
    return { 
      success: true,
      message: 'Devis soumis avec succès',
      quoteUrl: quoteUrl
    };
  } catch (error) {
    console.error('Error submitting quote:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Une erreur est survenue lors de la soumission du devis');
    }
  }
};

// Update an existing quote - NEW FUNCTION
export const updateQuote = async (maintenanceId: string, data: {
  amount: number;
  comments?: string;
  quoteFile?: File;
  acceptRequest: boolean;
  existingFileUrl?: string | null;
}) => {
  try {
    const technician = getCurrentTechnician();
    if (!technician) {
      throw new Error('Aucun technicien connecté');
    }
    
    // Check if maintenance exists
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      throw new Error('Demande de maintenance introuvable');
    }
    
    // Check if technician is in the list of technicianIds
    if (!maintenance.technicianIds || !maintenance.technicianIds.includes(technician.id)) {
      throw new Error('Ce technicien n\'est pas autorisé à modifier ce devis');
    }
    
    // Validate amount
    if (!data.amount || data.amount <= 0) {
      throw new Error('Le montant du devis est requis');
    }
    
    // Check if maintenance already has quotes
    let updatedQuotes = maintenance.quotes || [];
    const existingQuoteIndex = updatedQuotes.findIndex((q: any) => q.technicianId === technician.id);
    
    // If no quote found from this technician, error
    if (existingQuoteIndex < 0) {
      throw new Error('Aucun devis trouvé à modifier');
    }
    
    // Check if quote is still modifiable (not accepted or rejected)
    if (updatedQuotes[existingQuoteIndex].status !== 'pending') {
      throw new Error('Ce devis ne peut plus être modifié car il a déjà été traité');
    }
    
    // Upload file if provided
    let quoteUrl = data.existingFileUrl || null;
    if (data.quoteFile) {
      // If we're replacing an existing file, delete it first
      if (data.existingFileUrl) {
        try {
          await deleteFromSupabase(data.existingFileUrl);
        } catch (error) {
          console.warn('Failed to delete existing quote file:', error);
          // Continue anyway
        }
      }
      
      quoteUrl = await uploadToSupabase(data.quoteFile, 'devis');
    }
    
    // Update the quote
    updatedQuotes[existingQuoteIndex] = {
      ...updatedQuotes[existingQuoteIndex],
      amount: data.amount,
      url: quoteUrl || updatedQuotes[existingQuoteIndex].url,
      comments: data.comments,
      updatedAt: new Date().toISOString()
    };
    
    // Update maintenance
    // Also update legacy fields if this is the primary quote
    if (existingQuoteIndex === 0 || 
        (maintenance.technicianId === technician.id && maintenance.quoteUrl)) {
      await updateMaintenanceRequest(maintenanceId, {
        quotes: updatedQuotes,
        quoteUrl: quoteUrl || maintenance.quoteUrl,
        quoteAmount: data.amount,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id
      });
    } else {
      // Just update the quotes array
      await updateMaintenanceRequest(maintenanceId, {
        quotes: updatedQuotes,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id
      });
    }
    
    return { 
      success: true,
      message: 'Devis modifié avec succès',
      quoteUrl: quoteUrl
    };
  } catch (error) {
    console.error('Error updating quote:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Une erreur est survenue lors de la modification du devis');
    }
  }
};

// Check if technician has any new or pending quote requests
export const getQuoteRequestsCount = async () => {
  try {
    const requests = await getQuoteRequestsForTechnician();
    
    // Count requests where the technician hasn't submitted a quote yet
    const pendingCount = requests.filter(req => !req.quoteSubmitted && !req.quoteRejected).length;
    
    // Count requests where the technician has submitted a quote and is waiting for a response
    const submittedCount = requests.filter(req => 
      req.quoteSubmitted && 
      req.quoteStatus === 'pending'
    ).length;
    
    // Count accepted quotes
    const acceptedCount = requests.filter(req => 
      req.quoteSubmitted && 
      (req.quoteStatus === 'accepted' || req.quoteAccepted === true)
    ).length;
    
    return {
      pendingRequests: pendingCount,
      submittedQuotes: submittedCount,
      acceptedQuotes: acceptedCount,
      total: requests.length
    };
  } catch (error) {
    console.error('Error getting quote requests count:', error);
    return {
      pendingRequests: 0,
      submittedQuotes: 0,
      acceptedQuotes: 0,
      total: 0,
      error: true,
      requiresIndex: error instanceof Error && 
        (error.message.includes('requires an index') || 
         error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
         error.message.includes('index is currently building'))
    };
  }
};