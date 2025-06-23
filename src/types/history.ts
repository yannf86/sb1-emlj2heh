import { Timestamp } from 'firebase/firestore';

export interface HistoryChange {
  field?: string;
  old?: any;
  new?: any;
}

export interface HistoryEntry {
  id: string;
  entityId?: string; // Pour compatibilité avec l'ancien format
  entityType?: 'incident' | 'lostItem' | 'maintenance' | 'technical_intervention'; // Pour compatibilité avec l'ancien format
  
  // Nouveau format
  action: 'create' | 'update' | 'delete';
  changes?: HistoryChange[] | Record<string, any>;
  type?: string;
  timestamp: Date | Timestamp;
  userId: string;
  
  // Champs pour l'ancien format
  previousState?: any;
  newState?: any;
  changedFields?: string[];
  userName?: string;
  userEmail?: string;
  operation?: 'create' | 'update' | 'delete'; // Pour compatibilité avec l'ancien format
}
