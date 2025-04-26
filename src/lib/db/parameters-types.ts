import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Predefined parameter types
const PARAMETER_TYPES = [
  { id: 'location', name: 'Lieux' },
  { id: 'incident_category', name: 'Catégories d\'Incident' },
  { id: 'impact', name: 'Niveaux d\'Impact' },
  { id: 'status', name: 'Statuts' },
  { id: 'intervention_type', name: 'Types d\'Intervention' },
  { id: 'visit_type', name: 'Types de Visite' },
  { id: 'quality_category', name: 'Catégories Qualité' },
  { id: 'quality_item', name: 'Points de Contrôle Qualité' },
  { id: 'lost_item_type', name: 'Types d\'Objets Trouvés' },
  { id: 'procedure_type', name: 'Types de Procédure' },
  { id: 'booking_origin', name: 'Origines de Réservation' }
];

// Get all parameter types
export const getParameterTypes = async () => {
  try {
    return PARAMETER_TYPES;
  } catch (error) {
    console.error('Error getting parameter types:', error);
    throw error;
  }
};

// Get parameters by collection name
export const getParametersByCollection = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, `parameters_${collectionName}`));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting parameters from ${collectionName}:`, error);
    throw error;
  }
};