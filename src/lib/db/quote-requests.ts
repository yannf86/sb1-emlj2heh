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

// Get quote requests for the logged-in technician
export const getQuoteRequestsForTechnician = async () => {
  try {
    const technician = getCurrentTechnician();
    if (!technician) {
      return { 
        error: true, 
        errorMessage: "Vous devez être connecté pour voir vos demandes de devis" 
      };
    }
    
    console.log(`Getting quote requests for technician ${technician.id} (${technician.name})`);
    
    // Get maintenances where this technician is in the technicianIds array
    // Important: We're removing the orderBy clause which was causing the index issue
    // We'll sort the results in memory instead
    const maintenanceQuery = query(
      collection(db, 'maintenance'),
      where('technicianIds', 'array-contains', technician.id)
    );
    
    const snapshot = await getDocs(maintenanceQuery);
    
    // Log number of results for debugging
    console.log(`Found ${snapshot.size} maintenance requests with technician assigned`);
    
    // Process maintenances to add hotel and location names
    const requests = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`Processing request ID: ${doc.id}, technicianIds: ${JSON.stringify(data.technicianIds)}`);
      
      // Get additional info: hotel name, location name, etc.
      let hotelName = 'Chargement...';
      let locationName = 'Chargement...';
      let interventionTypeName = 'Chargement...';
      
      try {
        const hotelRef = await firestoreGetDoc(firestoreDoc(db, 'hotels', data.hotelId));
        if (hotelRef.exists()) {
          hotelName = hotelRef.data().name;
        }
      } catch (error) {
        console.error('Error loading hotel name:', error);
      }
      
      try {
        const locationRef = await firestoreGetDoc(firestoreDoc(db, 'parameters_location', data.locationId));
        if (locationRef.exists()) {
          locationName = locationRef.data().label;
        } else {
          // Try legacy parameters collection
          const legacyLocationRef = await firestoreGetDoc(firestoreDoc(db, 'parameters', data.locationId));
          if (legacyLocationRef.exists() && legacyLocationRef.data().type === 'location') {
            locationName = legacyLocationRef.data().label;
          }
        }
      } catch (error) {
        console.error('Error loading location name:', error);
      }
      
      try {
        const interventionTypeRef = await firestoreGetDoc(firestoreDoc(db, 'parameters_intervention_type', data.interventionTypeId));
        if (interventionTypeRef.exists()) {
          interventionTypeName = interventionTypeRef.data().label;
        } else {
          // Try legacy parameters collection
          const legacyInterventionTypeRef = await firestoreGetDoc(firestoreDoc(db, 'parameters', data.interventionTypeId));
          if (legacyInterventionTypeRef.exists() && legacyInterventionTypeRef.data().type === 'intervention_type') {
            interventionTypeName = legacyInterventionTypeRef.data().label;
          }
        }
      } catch (error) {
        console.error('Error loading intervention type name:', error);
      }

      // CORRECTION: Vérifier correctement si un devis a déjà été soumis pour ce technicien
      // Un devis n'est considéré comme "soumis" que si un fichier de devis a été téléchargé
      let quoteSubmitted = false;
      
      // Vérifier si ce technicien a déjà soumis un devis avec un fichier
      if (data.quotes && Array.isArray(data.quotes)) {
        quoteSubmitted = data.quotes.some(q => 
          q.technicianId === technician.id && q.url && q.url.trim() !== ''
        );
      } 
      // Vérifier le format legacy mais UNIQUEMENT si le technicien courant est celui assigné
      // et qu'un fichier de devis existe
      else if (data.technicianId === technician.id) {
        quoteSubmitted = data.quoteSubmitted === true && data.quoteUrl && data.quoteUrl.trim() !== '';
      }
      
      console.log(`Processing maintenance request: ${doc.id}, quoteSubmitted: ${quoteSubmitted}`);
      
      // Format the maintenance as a quote request
      const request = {
        id: doc.id,
        ...data,
        hotelName,
        locationName,
        interventionTypeName,
        quoteSubmitted // CORRECTION: Utiliser notre variable calculée
      };
      
      requests.push(request);
    }
    
    // Sort results by date (descending) - we do this in memory since we removed orderBy
    requests.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });
    
    console.log(`Returning ${requests.length} quote requests`);
    return requests;
  } catch (error) {
    console.error('Error getting quote requests:', error);
    
    // Check if this is an index error
    if (error instanceof Error && 
        (error.message.includes('requires an index') || 
         error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
         error.message.includes('index is currently building'))) {
      return {
        error: true,
        requiresIndex: true,
        errorMessage: error.message
      };
    }
    
    // For other errors, return empty data
    return {
      error: true,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Get quote requests count for the technician dashboard
export const getQuoteRequestsCount = async () => {
  try {
    // First check if technician is authenticated
    const technician = getCurrentTechnician();
    if (!technician) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log(`Getting quote request counts for technician ${technician.id}`);
    
    // Use a try/catch block specifically for the Firebase query
    try {
      // Attempt to retrieve all requests for this technician
      const requests = await getQuoteRequestsForTechnician();
      if (requests.error) {
        return {
          pendingRequests: 0,
          submittedQuotes: 0,
          acceptedQuotes: 0,
          total: 0,
          error: true,
          requiresIndex: requests.requiresIndex,
          errorMessage: requests.errorMessage
        };
      }
      
      console.log(`Retrieved ${requests.length} quote requests`);
      
      // CORRECTION ICI: Comptage plus précis des demandes en attente et des devis soumis
      
      // Les demandes en attente sont celles où le technicien n'a PAS encore soumis de devis avec fichier
      const pendingRequests = requests.filter(req => {
        // Si l'indicateur quoteSubmitted est false, c'est une demande en attente
        return !req.quoteSubmitted;
      }).length;
      
      // Les devis soumis sont ceux où le technicien a soumis un devis qui est en attente de réponse
      const submittedQuotes = requests.filter(req => {
        // Vérifier si un devis a été soumis par ce technicien avec un fichier
        if (req.quotes && Array.isArray(req.quotes)) {
          const techQuote = req.quotes.find(q => q.technicianId === technician.id && q.url && q.url.trim() !== '');
          return techQuote && techQuote.status === 'pending';
        } else if (req.technicianId === technician.id && req.quoteSubmitted && req.quoteUrl && req.quoteUrl.trim() !== '') {
          // Priorité à l'état 'pending' explicite ou à l'absence de drapeau quoteAccepted
          return req.quoteStatus === 'pending' || 
            (!req.quoteStatus && req.quoteAccepted !== true && req.quoteAccepted !== false);
        }
        return false;
      }).length;
      
      // Compter les devis acceptés
      const acceptedQuotes = requests.filter(req => {
        // Vérifier si le devis de ce technicien a été accepté
        if (req.quotes && Array.isArray(req.quotes)) {
          const techQuote = req.quotes.find(q => q.technicianId === technician.id);
          return techQuote && techQuote.status === 'accepted' && techQuote.url && techQuote.url.trim() !== '';
        } else if (req.technicianId === technician.id && req.quoteUrl && req.quoteUrl.trim() !== '') {
          // Priorité à l'état 'accepted' explicite, puis au drapeau quoteAccepted
          return req.quoteStatus === 'accepted' || req.quoteAccepted === true;
        }
        return false;
      }).length;
      
      return {
        pendingRequests,
        submittedQuotes,
        acceptedQuotes,
        total: requests.length
      };
    } catch (error) {
      // This specifically catches Firebase database query errors
      console.error('Firebase query error:', error);
      
      // Check if this is an index error
      if (error instanceof Error && 
          (error.message.includes('requires an index') || 
           error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
           error.message.includes('index is currently building'))) {
        return {
          pendingRequests: 0,
          submittedQuotes: 0,
          acceptedQuotes: 0,
          total: 0,
          error: true,
          requiresIndex: true,
          errorMessage: error.message
        };
      }
      
      // For other query errors, return empty data
      return {
        pendingRequests: 0,
        submittedQuotes: 0,
        acceptedQuotes: 0,
        total: 0,
        error: true,
        errorMessage: error.message
      };
    }
  } catch (error) {
    console.error('Error getting quote requests count:', error);
    
    // Return a more structured error object with information
    return {
      pendingRequests: 0,
      submittedQuotes: 0,
      acceptedQuotes: 0,
      total: 0,
      error: true,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      requiresIndex: error instanceof Error && 
        (error.message.includes('requires an index') || 
         error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
         error.message.includes('index is currently building'))
    };
  }
};

// Submit a quote for a maintenance request
export const submitQuote = async (maintenanceRequest: any, data: {
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

    // Use the maintenance object directly instead of fetching it again
    const maintenance = maintenanceRequest;
    
    // Check if technician is in the list of technicianIds
    if (!maintenance.technicianIds || !maintenance.technicianIds.includes(technician.id)) {
      throw new Error('Ce technicien n\'est pas autorisé à proposer un devis pour cette intervention');
    }
    
    // If technician rejects the request
    if (!data.acceptRequest) {
      // Update maintenance to record the rejection
      let updatedQuotes = maintenance.quotes || [];
      
      // Check if technician already has a quote
      const existingQuoteIndex = updatedQuotes.findIndex((q) => q.technicianId === technician.id);
      
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
      await updateMaintenanceRequest(maintenance.id, {
        quotes: updatedQuotes,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id
      }, technician.id);
      
      return { 
        success: true,
        message: 'Demande refusée avec succès'
      };
    }
    
    // Technician is accepting and submitting a quote
    // MODIFICATION: Exiger obligatoirement un fichier de devis pour soumettre un devis
    if (!data.quoteFile && !data.existingFileUrl) {
      throw new Error('Vous devez fournir un fichier de devis pour soumettre une proposition');
    }

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
    
    // MODIFICATION: S'assurer qu'un URL de fichier existe toujours
    if (!quoteUrl) {
      throw new Error('Le fichier de devis est obligatoire');
    }
    
    // Update maintenance with new quote
    let updatedQuotes = maintenance.quotes || [];
    
    // Check if technician already has a quote
    const existingQuoteIndex = updatedQuotes.findIndex((q) => q.technicianId === technician.id);
    
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
      await updateMaintenanceRequest(maintenance.id, {
        quotes: updatedQuotes,
        quoteUrl: quoteUrl || maintenance.quoteUrl,
        quoteAmount: data.amount,
        quoteStatus: 'pending',
        technicianId: technician.id,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id,
        quoteSubmitted: true // CRUCIAL: Marque le devis comme soumis uniquement si un fichier est présent
      }, technician.id);
    } else {
      // Just update the quotes array
      await updateMaintenanceRequest(maintenance.id, {
        quotes: updatedQuotes,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id,
        quoteSubmitted: true // CRUCIAL: Marque le devis comme soumis uniquement si un fichier est présent
      }, technician.id);
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

// Update an existing quote
export const updateQuote = async (maintenanceRequest: any, data: {
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
    
    // Use the maintenance object directly instead of fetching it again
    const maintenance = maintenanceRequest;
    
    // Check if technician is in the list of technicianIds
    if (!maintenance.technicianIds || !maintenance.technicianIds.includes(technician.id)) {
      throw new Error('Ce technicien n\'est pas autorisé à modifier ce devis');
    }
    
    // Validate amount
    if (!data.amount || data.amount <= 0) {
      throw new Error('Le montant du devis est requis');
    }
    
    // MODIFICATION: Si aucun fichier existant et aucun nouveau fichier, exiger un fichier
    if (!data.existingFileUrl && !data.quoteFile) {
      throw new Error('Un fichier de devis est obligatoire');
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
    const existingQuoteIndex = updatedQuotes.findIndex((q) => q.technicianId === technician.id);
    
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
    if (existingQuoteIndex === 0 || 
        (maintenance.technicianId === technician.id && maintenance.quoteUrl)) {
      await updateMaintenanceRequest(maintenance.id, {
        quotes: updatedQuotes,
        quoteUrl: quoteUrl || maintenance.quoteUrl,
        quoteAmount: data.amount,
        quoteStatus: 'pending',
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id,
        quoteSubmitted: true // Marque explicitement comme soumis
      }, technician.id);
    } else {
      // Just update the quotes array
      await updateMaintenanceRequest(maintenance.id, {
        quotes: updatedQuotes,
        updatedAt: new Date().toISOString(),
        updatedBy: technician.id,
        quoteSubmitted: true // Marque explicitement comme soumis
      }, technician.id);
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