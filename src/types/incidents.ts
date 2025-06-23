export interface Incident {
  id: string;
  date: Date;
  time: string;
  hotelId?: string; // Relié aux hôtels Firebase
  categoryId: string; // Filtré par hôtel
  impactId: string;
  description: string;
  photoURL?: string; // URL de la photo stockée dans Firebase Storage
  incidentMode: string[];
  resolutionDescription?: string;
  resolutionType?: string; // Relié à parameters_resolution_type
  concernedEngine?: string;
  estimatedCost?: number;
  actualCost?: number; // Montant geste commercial
  statusId: string;
  receivedById: string; // Relié à la collection Users
  assignedTo?: string; // Conclu par - relié à la collection Users
  
  // Informations client
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientArrivalDate?: Date; // Nouveau champ
  clientDepartureDate?: Date;
  clientRoom?: string;
  clientReservation?: string;
  bookingAmount?: number; // Nouveau champ pour montant réservation
  bookingOrigin?: string; // Relié à parameters_booking_origin
  
  // Satisfaction client
  clientSatisfactionId?: string;
  clientComment?: string;
  
  // Informations hôtel et localisation (filtré par hôtel)
  location?: string;
  
  // Métadonnées
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  internalNotes?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  updatedBy?: string; // ID de l'utilisateur qui a mis à jour l'incident
}

export interface IncidentStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  averageResolutionTime: number;
  satisfactionScore: number;
}

export interface IncidentAnalytics {
  byCategory: { name: string; value: number; color: string }[];
  byStatus: { name: string; value: number; color: string }[];
  byImpact: { name: string; value: number; color: string }[];
  byHotel: { name: string; value: number }[];
  byEngine: { name: string; value: number }[];
  categoryEvolution: { date: string; [key: string]: any }[];
  resolutionTimes: { category: string; avgTime: number }[];
  satisfactionByCategory: { category: string; satisfaction: number }[];
}