export interface TechnicalIntervention {
  id: string;
  title: string;
  description: string;
  hotelId: string;
  hotelName?: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  statusName?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName?: string;
  date: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  cost?: number;
  notes?: string;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TechnicalInterventionFormData {
  title: string;
  description: string;
  hotelId: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  assignedTo?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  cost?: number;
  notes?: string;
}
