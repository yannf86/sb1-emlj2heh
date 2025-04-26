import { BadgeCategory } from '@/lib/gamification';

export interface LostItem {
  id: string;
  date: string;
  time: string;
  hotelId: string;
  locationId: string;
  description: string;
  itemTypeId: string;
  foundById: string;
  returnedById?: string;
  storageLocation: string;
  status: 'conservé' | 'rendu' | 'transféré';
  returnedTo?: string;
  returnDate?: string;
  returnEmail?: string;
  returnPhone?: string;
  returnDetails?: string;
  photoUrl?: string;
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
}

export interface LostItemFormData {
  date: string;
  time: string;
  hotelId: string;
  locationId: string;
  description: string;
  itemTypeId: string;
  foundById: string;
  returnedById?: string;
  storageLocation: string;
  status: 'conservé' | 'rendu' | 'transféré';
  returnedTo?: string;
  returnDate?: string;
  returnEmail?: string;
  returnPhone?: string;
  returnDetails?: string;
  photo?: File | null;
  photoPreview?: string;
}

export interface LostItemFilters {
  searchQuery: string;
  filterHotel: string;
  filterStatus: string;
  filterType: string;
  filtersExpanded: boolean;
}