export interface LostItem {
  id: string;
  discoveryDate: Date;
  discoveryTime: string;
  hotelId: string;
  locationId: string; // Référence vers parameters_location
  itemTypeId: string; // Référence vers parameters_lost_item_type
  description: string;
  foundById: string; // Référence vers users
  storageLocation: string;
  status: 'conserved' | 'returned'; // conservé ou rendu
  returnedById?: string; // Référence vers users (obligatoire si status = returned)
  returnedDate?: Date;
  returnedNotes?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface LostItemStats {
  total: number;
  conserved: number;
  returned: number;
  byType: { [key: string]: number };
  byHotel: { [key: string]: number };
  returnRate: number; // Pourcentage d'objets rendus
}

export interface LostItemAnalytics {
  byType: { name: string; value: number; color: string }[];
  byStatus: { name: string; value: number; color: string }[];
  monthlyTrends: { month: string; count: number }[];
}