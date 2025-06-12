import { BadgeCategory } from '@/lib/gamification';

export interface Maintenance {
  id: string;
  date: string;
  time: string;
  hotelId: string;
  locationId: string;
  interventionTypeId: string;
  description: string;
  receivedById: string;
  assignedUserId?: string; // Utilisateur interne assigné
  statusId: string;
  estimatedAmount?: number;
  finalAmount?: number;
  startDate?: string;
  endDate?: string;
  photoBefore?: string;
  photoAfter?: string;
  comments?: string;
  quotes?: MaintenanceQuote[]; // Tableau de devis
  emailsSent?: { [key: string]: boolean }; // Suivi des emails envoyés
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  history?: {
    timestamp: string;
    userId: string;
    action: string;
    changes: any;
  }[];
  // Champs temporaires pour le formulaire
  photoBeforePreview?: string;
  photoAfterPreview?: string;
}

export interface MaintenanceQuote {
  technicianId: string;
  amount: number;
  url: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  comments?: string;
  statusComments?: string;
  createdAt: string;
  createdBy: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  negotiationHistory?: {
    timestamp: string;
    userId: string;
    message: string;
    amount?: number;
  }[];
}

export interface MaintenanceFormData {
  description: string;
  hotelId: string;
  locationId: string;
  interventionTypeId: string;
  assignedUserId?: string; // Utilisateur interne assigné
  photoBefore: File | null;
  photoBeforePreview: string;
  photoAfter: File | null;
  photoAfterPreview: string;
}

export interface MaintenanceFilters {
  searchQuery: string;
  filterHotel: string;
  filterStatus: string;
  filterType: string;
  filterAssignedUser: string; // Filtre par utilisateur assigné
  filtersExpanded: boolean;
}

export interface MaintenanceEditFormData extends Maintenance {
  photoBefore: File | null;
  photoBeforePreview: string;
  photoAfter: File | null;
  photoAfterPreview: string;
}