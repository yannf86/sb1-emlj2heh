export interface Parameter {
  id: string;
  label: string;
  code: string;
  order: number;
  active: boolean;
  hotels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParameterType {
  key: string;
  label: string;
  icon: string;
  collection: string;
}

export const parameterTypes: ParameterType[] = [
  { key: 'location', label: 'Lieux', icon: 'MapPin', collection: 'parameters_location' },
  { key: 'incident_category', label: 'Catégories d\'Incident', icon: 'AlertTriangle', collection: 'parameters_incident_category' },
  { key: 'impact', label: 'Niveaux d\'Impact', icon: 'Activity', collection: 'parameters_impact' },
  { key: 'status', label: 'Statuts', icon: 'Flag', collection: 'parameters_status' },
  { key: 'intervention_type', label: 'Types d\'Intervention', icon: 'Wrench', collection: 'parameters_intervention_type' },
  { key: 'visit_type', label: 'Types de Visite', icon: 'Calendar', collection: 'parameters_visit_type' },
  { key: 'quality_category', label: 'Catégories Qualité', icon: 'ClipboardCheck', collection: 'parameters_quality_category' },
  { key: 'quality_item', label: 'Points de Contrôle Qualité', icon: 'Target', collection: 'parameters_quality_item' },
  { key: 'lost_item_type', label: 'Types d\'Objets Trouvés', icon: 'Package', collection: 'parameters_lost_item_type' },
  { key: 'procedure_type', label: 'Types de Procédure', icon: 'FileText', collection: 'parameters_procedure_type' },
  { key: 'booking_origin', label: 'Origines de Réservation', icon: 'BookOpen', collection: 'parameters_booking_origin' },
  { key: 'resolution_type', label: 'Types de Résolution', icon: 'CheckCircle', collection: 'parameters_resolution_type' },
  { key: 'client_satisfaction', label: 'Satisfaction Client', icon: 'Star', collection: 'parameters_client_satisfaction' },
];

export interface Hotel {
  id: string;
  name: string;
  code?: string;
  address: string;
  city: string;
  country: string;
  imageUrl?: string;
  active: boolean;
  incidentCategories?: string[]; // IDs des catégories d'incidents
  locations?: string[]; // IDs des lieux
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChecklistMission {
  id: string;
  title: string;
  description?: string;
  service: string;
  hotels: string[]; // IDs des hôtels concernés
  isPermanent: boolean;
  imageUrl?: string;
  pdfUrl?: string; // URL du fichier PDF
  pdfFileName?: string; // Nom du fichier PDF
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  order: number;
  active: boolean;
  hotels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GamificationAction {
  id: string;
  userId: string;
  action: string;
  points: number;
  timestamp: Date;
  hotelId?: string;
}