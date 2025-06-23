export interface LogbookEntry {
  id: string;
  service: string;
  hotelId: string;
  title: string;
  content: string;
  startDate: Date;
  endDate?: Date;
  importance: 'Normal' | 'Important' | 'Urgent';
  roomNumber?: string;
  isTask: boolean;
  completed: boolean;
  authorId: string;
  authorName: string;
  comments?: LogbookComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LogbookComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface LogbookReminder {
  id: string;
  entryId: string; // Référence à l'entrée du logbook
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogbookService {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const logbookServices: LogbookService[] = [
  { key: 'reception', label: 'Réception', icon: '🏨', color: '#3B82F6' },
  { key: 'housekeeping', label: 'Housekeeping', icon: '🧹', color: '#10B981' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#F59E0B' },
  { key: 'maintenance', label: 'Maintenance', icon: '🔧', color: '#EF4444' },
  { key: 'direction', label: 'Direction', icon: '👔', color: '#8B5CF6' },
  { key: 'security', label: 'Sécurité', icon: '🔒', color: '#6B7280' },
  { key: 'bar', label: 'Bar', icon: '🍷', color: '#EC4899' },
];

export interface ServiceGroup {
  service: LogbookService;
  entries: LogbookEntry[];
  count: number;
  completed: number;
  percentage: number;
  isExpanded: boolean;
}