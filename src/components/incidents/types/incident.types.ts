import { BadgeCategory } from '@/lib/gamification';

export interface Incident {
  id: string;
  date: string;
  time: string;
  hotelId: string;
  locationId: string;
  roomType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  arrivalDate?: string;
  departureDate?: string;
  reservationAmount?: string;
  origin?: string;
  categoryId: string;
  impactId: string;
  description: string;
  statusId: string;
  receivedById: string;
  concludedById?: string;
  resolutionDescription?: string;
  // Nouveaux champs pour la résolution
  resolutionTypeId?: string;  // Type de résolution
  clientSatisfactionId?: string; // Satisfaction client (ID du paramètre)
  compensationAmount?: string; // Montant du geste commercial
  createdAt: string;
  updatedAt: string;
}

export interface IncidentFormData {
  date: string;
  time: string;
  hotelId: string;
  locationId: string;
  roomType: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  arrivalDate: string;
  departureDate: string;
  reservationAmount: string;
  origin: string;
  categoryId: string;
  impactId: string;
  description: string;
  resolutionDescription: string;
  statusId: string;
  receivedById: string;
  concludedById: string;
  // Nouveaux champs pour la résolution
  resolutionTypeId: string;
  clientSatisfactionId: string;
  compensationAmount: string;
}

export interface IncidentFilters {
  searchQuery: string;
  filterHotel: string;
  filterStatus: string;
  filterCategory: string;
  filterImpact: string;
  filtersExpanded: boolean;
}