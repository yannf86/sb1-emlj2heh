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
  technicianId?: string; // Pour rétrocompatibilité
  technicianIds?: string[]; // Nouveau: liste des techniciens
  statusId: string;
  estimatedAmount?: number;
  finalAmount?: number;
  startDate?: string;
  endDate?: string;
  photoBefore?: string;
  photoAfter?: string;
  quoteUrl?: string;
  quoteAmount?: number;
  quoteStatus?: 'pending' | 'accepted' | 'rejected';  // Remplace quoteAccepted avec 3 états possibles
  quoteAccepted?: boolean; // Ancien champ pour rétrocompatibilité
  quoteAcceptedDate?: string;
  quoteAcceptedById?: string;
  comments?: string;
  quotes?: MaintenanceQuote[]; // Nouveau: tableau de devis
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
  photoBefore: File | null;
  photoBeforePreview: string;
  hasQuote: boolean;
  quoteFile: File | null;
  quoteAmount: string;
  quoteStatus: 'pending' | 'accepted' | 'rejected';
}

export interface MaintenanceFilters {
  searchQuery: string;
  filterHotel: string;
  filterStatus: string;
  filterType: string;
  filtersExpanded: boolean;
}

export interface MaintenanceEditFormData extends Maintenance {
  photoBefore: File | null;
  photoBeforePreview: string;
  photoAfter: File | null;
  photoAfterPreview: string;
  quoteFile: File | null;
}