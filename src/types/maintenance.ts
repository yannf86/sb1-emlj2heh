export interface TechnicalIntervention {
  id: string;
  date: Date;
  time: string;
  hotelId: string;
  location: string;
  interventionTypeId: string;
  description: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  statusId: string;
  assignedTo?: string;
  assignedToType: 'user' | 'technician'; // Pour différencier users et technicians
  startDate?: Date;
  endDate?: Date;
  estimatedCost: number;
  finalCost: number;
  comments?: string;
  
  // Gestion des devis
  hasQuote: boolean;
  quotes: TechnicalQuote[];
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string; // ID de l'utilisateur qui a mis à jour l'intervention
}

export interface TechnicalQuote {
  id: string;
  technicianId: string;
  amount: number;
  discount: number; // Montant de la remise
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  quotedAt: Date;
  quoteFileUrl?: string | null; // URL du fichier de devis stocké dans Firebase Storage
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string; // Entreprise
  specialties: string[]; // Spécialités
  hourlyRate: number; // Taux horaire en euros
  hotels: string[]; // Hôtels où le technicien peut intervenir
  modules: string[]; // Modules accessibles (similaire aux users)
  active: boolean;
  contractType: 'internal' | 'external';
  availability: 'available' | 'busy' | 'unavailable';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicalStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  averageCompletionTime: number;
  totalEstimatedCost: number;
  totalFinalCost: number;
}

export interface TechnicalAnalytics {
  byType: { name: string; value: number; color: string }[];
  byStatus: { name: string; value: number; color: string }[];
  byHotel: { name: string; value: number }[];
  byTechnician: { name: string; value: number }[];
  costEvolution: { date: string; estimated: number; final: number }[];
  completionTimes: { type: string; avgTime: number }[];
  monthlyInterventions: { month: string; count: number }[];
}