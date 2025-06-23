export interface ExperienceLevel {
  id: string;
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  badge: string;
  color: string;
  description?: string;
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActionPoint {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'incidents' | 'maintenance' | 'quality' | 'objects' | 'procedures';
  points: number;
  active: boolean;
  hotels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'incidents' | 'maintenance' | 'quality' | 'objects' | 'procedures' | 'general' | 'special';
  icon: string;
  color: 'bronze' | 'silver' | 'gold';
  condition: string;
  active: boolean;
  hotels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  badge?: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
  hotels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GamificationSettings {
  id: string;
  active: boolean;
  showXPNotifications: boolean;
  showBadgeNotifications: boolean;
  enableRanking: boolean;
  globalXPMultiplier: number;
  resetPeriod: 'none' | 'monthly' | 'quarterly' | 'yearly';
  updatedAt?: Date;
}

export interface UserProgress {
  userId: string;
  totalXP: number;
  currentLevel: number;
  badges: string[];
  completedChallenges: string[];
  lastActivityDate: Date;
  streak: number;
  hotelId: string;
}