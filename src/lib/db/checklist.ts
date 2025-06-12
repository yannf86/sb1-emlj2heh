import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  Timestamp, 
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from '../auth';
import { getChecklistMissionParametersByHotel } from './parameters-checklist-missions';

// Interface for checklist items
interface ChecklistItem {
  id?: string;
  title: string;
  description?: string;
  hotelId: string;
  serviceId: string;
  date: string;
  completed: boolean;
  completedById?: string;
  completedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  imageUrl?: string;
  attachmentPath?: string;
  attachmentName?: string;
  missionId?: string;
  isPermanent?: boolean;
  roomNumber?: string;
  orderIndex?: number;
}

/**
 * Get checklist items for a specific date and hotel
 * @param date Date string in format YYYY-MM-DD
 * @param hotelId Hotel ID
 * @returns Array of checklist items
 */
export const getChecklistItems = async (date: string, hotelId: string) => {
  try {
    console.log(`Getting checklist items for date ${date} and hotel ${hotelId}`);
    const q = query(
      collection(db, 'checklist_items'),
      where('date', '==', date),
      where('hotelId', '==', hotelId),
      orderBy('orderIndex', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} checklist items`);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChecklistItem[];
  } catch (error) {
    console.error('Error getting checklist items:', error);
    throw error;
  }
};

/**
 * Create a new checklist item
 * @param data Checklist item data
 * @returns ID of the created item
 */
export const createChecklistItem = async (data: Omit<ChecklistItem, 'id'>) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log('Creating single checklist item:', data);
    
    const docRef = await addDoc(collection(db, 'checklist_items'), {
      ...data,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id
    });
    
    console.log('Successfully created checklist item with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating checklist item:', error);
    throw error;
  }
};

/**
 * Update an existing checklist item
 * @param id ID of the item to update
 * @param data Updated item data
 */
export const updateChecklistItem = async (id: string, data: Partial<ChecklistItem>) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const docRef = doc(db, 'checklist_items', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
  } catch (error) {
    console.error('Error updating checklist item:', error);
    throw error;
  }
};

/**
 * Mark a checklist item as complete
 * @param id ID of the item to mark as complete
 * @returns Updated checklist item
 */
export const completeChecklistItem = async (id: string) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const docRef = doc(db, 'checklist_items', id);
    await updateDoc(docRef, {
      completed: true,
      completedById: currentUser.id,
      completedByName: currentUser.name,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Checklist item not found');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error completing checklist item:', error);
    throw error;
  }
};

/**
 * Mark a checklist item as incomplete
 * @param id ID of the item to mark as incomplete
 * @returns Updated checklist item
 */
export const uncompleteChecklistItem = async (id: string) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const docRef = doc(db, 'checklist_items', id);
    await updateDoc(docRef, {
      completed: false,
      completedById: null,
      completedByName: null,
      completedAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    });
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Checklist item not found');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error uncompleting checklist item:', error);
    throw error;
  }
};

/**
 * Delete a checklist item
 * @param id ID of the item to delete
 */
export const deleteChecklistItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'checklist_items', id));
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    throw error;
  }
};

/**
 * Get service information by ID
 * @param serviceId Service ID
 * @returns Service information (name and icon)
 */
export const getServiceInfo = async (serviceId: string) => {
  try {
    // Essayer d'abord de récupérer depuis logbook_services
    const docRef = doc(db, 'logbook_services', serviceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name || 'Service inconnu',
        icon: data.icon || '📋'
      };
    }
    
    // Si non trouvé, essayer avec les services prédéfinis
    const predefinedServices = {
      'reception': { name: 'Réception', icon: '👥' },
      'housekeeping': { name: 'Housekeeping', icon: '🛏️' },
      'pdj': { name: 'Petit déjeuner', icon: '🍳' },
      'restaurant': { name: 'Restaurant', icon: '🍽️' },
      'technical': { name: 'Technique', icon: '🔧' },
      'security': { name: 'Sécurité', icon: '🔒' },
      'important': { name: 'Important', icon: '⚠️' },
      'direction': { name: 'Direction', icon: '👑' }
    };
    
    if (predefinedServices[serviceId]) {
      return predefinedServices[serviceId];
    }
    
    // Fallback default
    return {
      name: 'Service',
      icon: '📋'
    };
  } catch (error) {
    console.error('Error getting service info:', error);
    return {
      name: 'Service',
      icon: '📋'
    };
  }
};

/**
 * Duplicate checklist items to the next day
 * @param hotelId Hotel ID
 * @param currentDate Current date (format: YYYY-MM-DD)
 * @param nextDate Next date (format: YYYY-MM-DD)
 * @returns Array of IDs of created items
 */
export const duplicateToNextDay = async (hotelId: string, currentDate: string, nextDate: string) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get items for current date
    const currentItems = await getChecklistItems(currentDate, hotelId);
    
    // Check if next day items already exist
    const nextDayQuery = query(
      collection(db, 'checklist_items'),
      where('date', '==', nextDate),
      where('hotelId', '==', hotelId)
    );
    
    const nextDaySnapshot = await getDocs(nextDayQuery);
    
    // If items already exist for next day, don't duplicate
    if (!nextDaySnapshot.empty) {
      throw new Error('Des tâches existent déjà pour le jour suivant');
    }
    
    // Duplicate items in a batch
    const batch = writeBatch(db);
    const newItemIds: string[] = [];
    
    for (const item of currentItems) {
      // Create a new document reference
      const newDocRef = doc(collection(db, 'checklist_items'));
      
      // Add the document to the batch
      batch.set(newDocRef, {
        title: item.title,
        description: item.description || null,
        hotelId: item.hotelId,
        serviceId: item.serviceId,
        date: nextDate,
        completed: false,
        completedById: null,
        completedAt: null,
        assignedTo: item.assignedTo || null,
        assignedToName: item.assignedToName || null,
        imageUrl: item.imageUrl || null,
        attachmentPath: item.attachmentPath || null,
        attachmentName: item.attachmentName || null,
        missionId: item.missionId || null,
        isPermanent: item.isPermanent || false,
        roomNumber: item.roomNumber || null,
        orderIndex: item.orderIndex || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.id
      });
      
      newItemIds.push(newDocRef.id);
    }
    
    // Commit the batch
    await batch.commit();
    
    return newItemIds;
  } catch (error) {
    console.error('Error duplicating checklist items:', error);
    throw error;
  }
};

/**
 * Create checklist items for a hotel based on the checklist mission parameters
 * @param hotelId Hotel ID
 * @param date Date string in format YYYY-MM-DD
 * @returns Array of IDs of created items
 */
export const createChecklistItemsFromMissions = async (hotelId: string, date: string) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log(`Generating checklist items for hotel ${hotelId} on date ${date}`);
    
    // Get missions for this hotel
    const missions = await getChecklistMissionParametersByHotel(hotelId);
    console.log(`Found ${missions.length} missions for hotel`, missions);
    
    // Check if items already exist for this date
    const existingQuery = query(
      collection(db, 'checklist_items'),
      where('date', '==', date),
      where('hotelId', '==', hotelId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    console.log(`Found ${existingSnapshot.size} existing items for this date`);
    
    // If items already exist, don't create new ones
    if (!existingSnapshot.empty) {
      throw new Error('Des tâches existent déjà pour cette date');
    }
    
    console.log('Creating new checklist items from missions');
    const newItemIds: string[] = [];
    
    // Créer les tâches une à la fois au lieu d'utiliser un batch
    // Cela pourrait aider à identifier les problèmes plus facilement
    
    // Si la liste des missions est vide, créer au moins une tâche par défaut
    if (missions.length === 0) {
      console.log('No missions found, creating a default task');
      
      const docRef = await addDoc(collection(db, 'checklist_items'), {
        title: 'Vérification quotidienne',
        description: 'Vérification générale à effectuer quotidiennement',
        hotelId: hotelId,
        serviceId: 'reception', // Service par défaut
        date: date,
        completed: false,
        isPermanent: true,
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.id
      });
      
      console.log(`Created default checklist item with ID: ${docRef.id}`);
      newItemIds.push(docRef.id);
    } else {
      for (let i = 0; i < missions.length; i++) {
        const mission = missions[i];
        console.log(`Creating task ${i+1}/${missions.length} for mission: ${mission.title}`);
        
        try {
          const docRef = await addDoc(collection(db, 'checklist_items'), {
            title: mission.title,
            description: mission.description || null,
            hotelId: hotelId,
            serviceId: mission.serviceId,
            date: date,
            completed: false,
            missionId: mission.id,
            isPermanent: mission.isPermanent || false,
            imageUrl: mission.imageUrl || null,
            attachmentPath: mission.attachmentPath || null,
            orderIndex: i,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentUser.id
          });
          
          console.log(`Successfully created checklist item with ID: ${docRef.id}`);
          newItemIds.push(docRef.id);
        } catch (itemError) {
          console.error(`Error creating item for mission ${mission.title}:`, itemError);
          // Continue with other missions even if this one fails
        }
      }
    }
    
    console.log(`Created ${newItemIds.length} checklist items`);
    
    // Vérifier si les documents sont correctement créés dans Firestore
    setTimeout(async () => {
      try {
        console.log('Verifying if items were created in Firestore...');
        const verificationQuery = query(
          collection(db, 'checklist_items'),
          where('date', '==', date),
          where('hotelId', '==', hotelId)
        );
        
        const verificationSnapshot = await getDocs(verificationQuery);
        console.log(`Verification: Found ${verificationSnapshot.size} items in Firestore for date ${date} and hotel ${hotelId}`);
      } catch (verificationError) {
        console.error('Error during verification:', verificationError);
      }
    }, 2000);
    
    return newItemIds;
  } catch (error) {
    console.error('Error creating checklist items from missions:', error);
    throw error;
  }
};