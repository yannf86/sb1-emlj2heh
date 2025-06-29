// Utiliser any pour éviter les problèmes de typage avec Timestamp
// Dans un contexte réel, il faudrait résoudre ce problème de manière plus propre

export interface Procedure {
  id: string;
  title: string;
  description: string;
  service: string;
  type: 'standard' | 'emergency' | 'training' | 'quality';
  hotels: string[]; // IDs des hôtels concernés
  assignedUsers: string[]; // IDs des utilisateurs assignés
  content?: string; // Contenu additionnel
  pdfUrl?: string; // URL du document PDF
  pdfName?: string; // Nom du fichier PDF
  version?: number; // Version de la procédure pour le suivi des modifications
  createdBy: string;
  createdByName: string;
  createdAt: any; // Devrait être Timestamp de Firebase
  updatedAt: any; // Devrait être Timestamp de Firebase
  isActive: boolean;
}

export interface ProcedureAcknowledgment {
  id: string;
  procedureId: string;
  userId: string;
  userName: string;
  userEmail: string;
  hotelId: string;
  hotelName: string;
  acknowledgedAt: any; // Devrait être Timestamp de Firebase
  version: number; // Version de la procédure au moment de la validation
}

export interface ProcedureHistory {
  id: string;
  procedureId: string;
  action: 'created' | 'updated' | 'acknowledged' | 'deactivated' | 'reactivated' | 'revoked_acknowledgments';
  userId: string;
  userName: string;
  timestamp: any; // Devrait être Timestamp de Firebase
  details?: string;
  previousData?: any;
  newData?: any;
}

export const procedureServices = [
  'Réception',
  'Housekeeping', 
  'Restauration',
  'Technique',
  'Sécurité',
  'Spa & Bien-être',
  'Événementiel',
  'Commercial',
  'Administration'
];

export const procedureTypes = [
  { value: 'standard', label: 'Standard' },
  { value: 'emergency', label: 'Urgence' },
  { value: 'training', label: 'Formation' },
  { value: 'quality', label: 'Qualité' }
];
