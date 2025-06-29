export interface ChecklistComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface ChecklistHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'completed' | 'uncompleted' | 'commented';
  field?: string; // Champ modifié (pour les updates)
  oldValue?: any; // Ancienne valeur
  newValue?: any; // Nouvelle valeur
  userId: string;
  userName: string;
  timestamp: Date;
  description: string; // Description lisible de l'action
}

export interface DailyChecklist {
  id: string;
  date: Date;
  hotelId: string;
  missionId: string; // Référence à la mission dans parameters_checklist_mission
  title: string;
  description?: string;
  service: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  imageUrl?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  order: number;
  comments?: ChecklistComment[];
  history?: ChecklistHistoryEntry[]; // Historique des modifications
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  canProceedToNextDay: boolean;
}

export interface ServiceProgress {
  service: string;
  total: number;
  completed: number;
  percentage: number;
  tasks: DailyChecklist[];
}

export interface DayCompletion {
  date: Date;
  hotelId: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}