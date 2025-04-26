import { Map, Building, AlertTriangle, Gauge, ListChecks, ClipboardCheck, Tag, Globe } from 'lucide-react';

export const paramTypeLabels: Record<string, string> = {
  location: 'Lieux',
  room_type: 'Types de Chambre',
  incident_category: 'Catégories d\'Incident',
  impact: 'Niveaux d\'Impact',
  resolution_type: 'Types de Résolution',
  client_satisfaction: 'Satisfaction Client',
  status: 'Statuts',
  intervention_type: 'Types d\'Intervention',
  visit_type: 'Types de Visite',
  quality_category: 'Catégories Qualité',
  quality_item: 'Points de Contrôle Qualité',
  lost_item_type: 'Types d\'Objets Trouvés',
  procedure_type: 'Types de Procédure',
  booking_origin: 'Origines de Réservation'
};

export const paramTypeIcons = {
  location: Map,
  room_type: Building,
  incident_category: AlertTriangle,
  impact: Gauge,
  resolution_type: ListChecks,
  client_satisfaction: ListChecks,
  status: ListChecks,
  intervention_type: ListChecks,
  visit_type: ClipboardCheck,
  quality_category: ClipboardCheck,
  quality_item: ClipboardCheck,
  lost_item_type: Tag,
  procedure_type: ListChecks,
  booking_origin: Globe
};