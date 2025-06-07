import { User } from './data';

/**
 * Types et interfaces pour le système de gamification
 */

// Niveaux d'expérience et leurs seuils
export const EXPERIENCE_LEVELS = [
  { level: 1, name: "Novice", minXP: 0, maxXP: 99, color: "text-slate-600", badge: "🔰" },
  { level: 2, name: "Apprenti", minXP: 100, maxXP: 199, color: "text-blue-600", badge: "🔹" },
  { level: 3, name: "Assistant", minXP: 200, maxXP: 349, color: "text-cyan-600", badge: "🔷" },
  { level: 4, name: "Débutant", minXP: 350, maxXP: 499, color: "text-teal-600", badge: "💠" },
  { level: 5, name: "Initié", minXP: 500, maxXP: 699, color: "text-green-600", badge: "🟢" },
  { level: 6, name: "Compétent", minXP: 700, maxXP: 899, color: "text-lime-600", badge: "🍀" },
  { level: 7, name: "Qualifié", minXP: 900, maxXP: 1199, color: "text-emerald-600", badge: "🌱" },
  { level: 8, name: "Professionnel", minXP: 1200, maxXP: 1599, color: "text-green-700", badge: "🌿" },
  { level: 9, name: "Spécialiste", minXP: 1600, maxXP: 1999, color: "text-purple-600", badge: "🔮" },
  { level: 10, name: "Expert", minXP: 2000, maxXP: 2499, color: "text-indigo-600", badge: "✨" },
  { level: 11, name: "Virtuose", minXP: 2500, maxXP: 2999, color: "text-blue-700", badge: "💫" },
  { level: 12, name: "Maître", minXP: 3000, maxXP: 3599, color: "text-amber-600", badge: "🌟" },
  { level: 13, name: "Érudit", minXP: 3600, maxXP: 4299, color: "text-orange-600", badge: "🔆" },
  { level: 14, name: "Savant", minXP: 4300, maxXP: 4999, color: "text-amber-700", badge: "✴️" },
  { level: 15, name: "Connaisseur", minXP: 5000, maxXP: 5999, color: "text-yellow-600", badge: "⭐" },
  { level: 16, name: "Éminent", minXP: 6000, maxXP: 6999, color: "text-yellow-700", badge: "🌠" },
  { level: 17, name: "Distingué", minXP: 7000, maxXP: 8299, color: "text-red-600", badge: "🔥" },
  { level: 18, name: "Révéré", minXP: 8300, maxXP: 9599, color: "text-rose-600", badge: "💥" },
  { level: 19, name: "Illustre", minXP: 9600, maxXP: 11199, color: "text-pink-600", badge: "🌸" },
  { level: 20, name: "Vénérable", minXP: 11200, maxXP: 12999, color: "text-red-700", badge: "🏵️" },
  { level: 21, name: "Légendaire", minXP: 13000, maxXP: 14999, color: "text-purple-700", badge: "👑" },
  { level: 22, name: "Mythique", minXP: 15000, maxXP: 17499, color: "text-fuchsia-700", badge: "🎭" },
  { level: 23, name: "Transcendant", minXP: 17500, maxXP: 19999, color: "text-violet-700", badge: "🌌" },
  { level: 24, name: "Divin", minXP: 20000, maxXP: 23499, color: "text-indigo-800", badge: "🌠" },
  { level: 25, name: "Éternel", minXP: 23500, maxXP: 26999, color: "text-blue-800", badge: "⚜️" },
  { level: 26, name: "Céleste", minXP: 27000, maxXP: 30999, color: "text-sky-800", badge: "🌀" },
  { level: 27, name: "Cosmique", minXP: 31000, maxXP: 35499, color: "text-cyan-800", badge: "🌊" },
  { level: 28, name: "Universel", minXP: 35500, maxXP: 39999, color: "text-teal-800", badge: "🌍" },
  { level: 29, name: "Infini", minXP: 40000, maxXP: 45999, color: "text-emerald-800", badge: "♾️" },
  { level: 30, name: "Omniscient", minXP: 46000, maxXP: 52999, color: "text-lime-800", badge: "🧠" },
  { level: 31, name: "Suprême", minXP: 53000, maxXP: 59999, color: "text-amber-800", badge: "🔱" },
  { level: 32, name: "Ultime", minXP: 60000, maxXP: 74999, color: "text-orange-800", badge: "💎" },
  { level: 33, name: "Absolu", minXP: 75000, maxXP: Infinity, color: "text-brand-600", badge: "🏆" }
];

// Catégories de badges
export enum BadgeCategory {
  Incidents = "incidents",
  Maintenance = "maintenance",
  Quality = "quality",
  LostFound = "lostFound",
  Procedures = "procedures",
  General = "general",
  Special = "special"
}

// Structure d'un badge
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: 1 | 2 | 3; // Bronze, Argent, Or
  hidden?: boolean; // Badge secret
  condition: (stats: UserStats) => boolean; // Fonction qui vérifie si le badge est débloqué
}

// Points d'actions pour différentes activités
export const ACTION_POINTS = {
  // Points pour les incidents
  CREATE_INCIDENT: 10,
  RESOLVE_INCIDENT: 25,
  RESOLVE_CRITICAL_INCIDENT: 40,
  
  // Points pour la maintenance
  CREATE_MAINTENANCE: 10,
  COMPLETE_MAINTENANCE: 20,
  EXPEDITE_MAINTENANCE: 15, // Maintenance complétée rapidement
  
  // Points pour la qualité
  COMPLETE_QUALITY_CHECK: 30,
  HIGH_QUALITY_SCORE: 20, // Score qualité > 90%
  
  // Points pour les objets trouvés
  REGISTER_LOST_ITEM: 5,
  RETURN_LOST_ITEM: 15,
  
  // Points pour les procédures
  CREATE_PROCEDURE: 25,
  READ_PROCEDURE: 5,
  VALIDATE_PROCEDURE: 10,
  
  // Points généraux
  FIRST_LOGIN_OF_DAY: 5,
  CONSECUTIVE_DAY_LOGIN: 2,
  WEEKLY_GOAL_COMPLETION: 50,
  HELP_COLLEAGUE: 15,
  RECEIVE_THANKS: 10,
};

// Structure des statistiques d'un utilisateur pour la gamification
export interface UserStats {
  userId: string;
  xp: number;
  level: number;
  badges: string[]; // IDs des badges obtenus
  
  // Statistiques d'incidents
  incidentsCreated: number;
  incidentsResolved: number;
  criticalIncidentsResolved: number;
  avgResolutionTime: number; // En heures
  
  // Statistiques de maintenance
  maintenanceCreated: number;
  maintenanceCompleted: number;
  quickMaintenanceCompleted: number; // Maintenance complétée avant la date prévue
  
  // Statistiques de qualité
  qualityChecksCompleted: number;
  avgQualityScore: number; // Score moyen de qualité (0-100)
  highQualityChecks: number; // Contrôles de qualité avec un score > 90%
  
  // Statistiques d'objets trouvés
  lostItemsRegistered: number;
  lostItemsReturned: number;
  
  // Statistiques de procédures
  proceduresCreated: number;
  proceduresRead: number;
  proceduresValidated: number;
  
  // Statistiques générales
  consecutiveLogins: number;
  totalLogins: number;
  lastLoginDate: string;
  weeklyGoalsCompleted: number;
  thanksReceived: number;
  helpProvided: number;
  
  // Statistiques spéciales
  contributionsPerModule: {
    [moduleId: string]: number;
  };
  
  // Statistiques de streak
  currentStreak: number;
  longestStreak: number;
  
  // Date de dernière mise à jour
  lastUpdated: string;
}

// Type pour les actions de gamification
export type GamificationAction = 
  | { type: 'CREATE_INCIDENT'; severity?: 'low' | 'medium' | 'high' | 'critical' }
  | { type: 'RESOLVE_INCIDENT'; severity?: 'low' | 'medium' | 'high' | 'critical'; resolutionTime?: number }
  | { type: 'CREATE_MAINTENANCE' }
  | { type: 'COMPLETE_MAINTENANCE'; beforeSchedule?: boolean }
  | { type: 'COMPLETE_QUALITY_CHECK'; score: number }
  | { type: 'REGISTER_LOST_ITEM' }
  | { type: 'RETURN_LOST_ITEM' }
  | { type: 'CREATE_PROCEDURE' }
  | { type: 'READ_PROCEDURE' }
  | { type: 'VALIDATE_PROCEDURE' }
  | { type: 'LOGIN' }
  | { type: 'HELP_COLLEAGUE' }
  | { type: 'RECEIVE_THANKS' }
  | { type: 'COMPLETE_WEEKLY_GOAL' };

// Défis hebdomadaires
export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  startDate: Date;
  endDate: Date;
  condition: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => number; // 0-100 pourcentage de progression
  target: number;
  moduleId?: string; // Si spécifique à un module
}

// Fonction pour initialiser les statistiques utilisateur
export function initializeUserStats(userId: string): UserStats {
  return {
    userId,
    xp: 0,
    level: 1,
    badges: [],
    
    incidentsCreated: 0,
    incidentsResolved: 0,
    criticalIncidentsResolved: 0,
    avgResolutionTime: 0,
    
    maintenanceCreated: 0,
    maintenanceCompleted: 0,
    quickMaintenanceCompleted: 0,
    
    qualityChecksCompleted: 0,
    avgQualityScore: 0,
    highQualityChecks: 0,
    
    lostItemsRegistered: 0,
    lostItemsReturned: 0,
    
    proceduresCreated: 0,
    proceduresRead: 0,
    proceduresValidated: 0,
    
    consecutiveLogins: 0,
    totalLogins: 0,
    lastLoginDate: '',
    weeklyGoalsCompleted: 0,
    thanksReceived: 0,
    helpProvided: 0,
    
    contributionsPerModule: {},
    
    currentStreak: 0,
    longestStreak: 0,
    
    lastUpdated: new Date().toISOString()
  };
}

// Fonction pour calculer le niveau en fonction de l'XP
export function calculateLevel(xp: number): number {
  for (let i = EXPERIENCE_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= EXPERIENCE_LEVELS[i].minXP) {
      return EXPERIENCE_LEVELS[i].level;
    }
  }
  return 1; // Par défaut, niveau 1
}

// Fonction pour obtenir les informations du niveau
export function getLevelInfo(level: number) {
  return EXPERIENCE_LEVELS.find(l => l.level === level) || EXPERIENCE_LEVELS[0];
}

// Fonction pour calculer la progression vers le niveau suivant (en pourcentage)
export function calculateLevelProgress(xp: number): number {
  const currentLevel = getLevelInfo(calculateLevel(xp));
  
  if (currentLevel.level === EXPERIENCE_LEVELS.length) {
    return 100; // Max level
  }
  
  const nextLevel = EXPERIENCE_LEVELS.find(l => l.level === currentLevel.level + 1);
  if (!nextLevel) return 100;
  
  const xpInCurrentLevel = xp - currentLevel.minXP;
  const xpRequiredForNextLevel = nextLevel.minXP - currentLevel.minXP;
  
  return Math.floor((xpInCurrentLevel / xpRequiredForNextLevel) * 100);
}

// Liste complète des badges
export const BADGES: Badge[] = [
  // Badges Incidents
  {
    id: 'incident_reporter',
    name: 'Signaleur Débutant',
    description: 'A signalé son premier incident',
    icon: '🚨',
    category: BadgeCategory.Incidents,
    tier: 1,
    condition: (stats) => stats.incidentsCreated >= 1
  },
  {
    id: 'incident_reporter_silver',
    name: 'Signaleur Expérimenté',
    description: 'A signalé 10 incidents',
    icon: '🚨',
    category: BadgeCategory.Incidents,
    tier: 2,
    condition: (stats) => stats.incidentsCreated >= 10
  },
  {
    id: 'incident_reporter_gold',
    name: 'Signaleur Expert',
    description: 'A signalé 50 incidents',
    icon: '🚨',
    category: BadgeCategory.Incidents,
    tier: 3,
    condition: (stats) => stats.incidentsCreated >= 50
  },
  {
    id: 'problem_solver',
    name: 'Résolveur Débutant',
    description: 'A résolu son premier incident',
    icon: '🔧',
    category: BadgeCategory.Incidents,
    tier: 1,
    condition: (stats) => stats.incidentsResolved >= 1
  },
  {
    id: 'problem_solver_silver',
    name: 'Résolveur Expérimenté',
    description: 'A résolu 25 incidents',
    icon: '🔧',
    category: BadgeCategory.Incidents,
    tier: 2,
    condition: (stats) => stats.incidentsResolved >= 25
  },
  {
    id: 'problem_solver_gold',
    name: 'Résolveur Expert',
    description: 'A résolu 100 incidents',
    icon: '🔧',
    category: BadgeCategory.Incidents,
    tier: 3,
    condition: (stats) => stats.incidentsResolved >= 100
  },
  {
    id: 'crisis_manager',
    name: 'Gestionnaire de Crise',
    description: 'A résolu un incident critique',
    icon: '🔥',
    category: BadgeCategory.Incidents,
    tier: 2,
    condition: (stats) => stats.criticalIncidentsResolved >= 1
  },
  {
    id: 'crisis_manager_gold',
    name: 'Expert en Gestion de Crise',
    description: 'A résolu 10 incidents critiques',
    icon: '🔥',
    category: BadgeCategory.Incidents,
    tier: 3,
    condition: (stats) => stats.criticalIncidentsResolved >= 10
  },
  {
    id: 'speed_solver',
    name: 'Résolveur Éclair',
    description: 'Temps moyen de résolution sous 4 heures',
    icon: '⚡',
    category: BadgeCategory.Incidents,
    tier: 2,
    condition: (stats) => stats.incidentsResolved >= 5 && stats.avgResolutionTime <= 4
  },
  
  // Badges Maintenance
  {
    id: 'maintenance_requester',
    name: 'Demandeur Technique',
    description: 'A créé sa première demande de maintenance',
    icon: '🔨',
    category: BadgeCategory.Maintenance,
    tier: 1,
    condition: (stats) => stats.maintenanceCreated >= 1
  },
  {
    id: 'maintenance_completer',
    name: 'Technicien Apprenti',
    description: 'A complété 5 maintenances',
    icon: '🛠️',
    category: BadgeCategory.Maintenance,
    tier: 1,
    condition: (stats) => stats.maintenanceCompleted >= 5
  },
  {
    id: 'maintenance_completer_silver',
    name: 'Technicien Confirmé',
    description: 'A complété 20 maintenances',
    icon: '🛠️',
    category: BadgeCategory.Maintenance,
    tier: 2,
    condition: (stats) => stats.maintenanceCompleted >= 20
  },
  {
    id: 'maintenance_completer_gold',
    name: 'Technicien Expert',
    description: 'A complété 75 maintenances',
    icon: '🛠️',
    category: BadgeCategory.Maintenance,
    tier: 3,
    condition: (stats) => stats.maintenanceCompleted >= 75
  },
  {
    id: 'quick_fixer',
    name: 'Réparateur Efficace',
    description: 'A terminé 3 maintenances avant la date prévue',
    icon: '⏱️',
    category: BadgeCategory.Maintenance,
    tier: 2,
    condition: (stats) => stats.quickMaintenanceCompleted >= 3
  },
  
  // Badges Qualité
  {
    id: 'quality_checker',
    name: 'Contrôleur Qualité',
    description: 'A effectué son premier contrôle qualité',
    icon: '📋',
    category: BadgeCategory.Quality,
    tier: 1,
    condition: (stats) => stats.qualityChecksCompleted >= 1
  },
  {
    id: 'quality_checker_silver',
    name: 'Inspecteur Qualité',
    description: 'A effectué 10 contrôles qualité',
    icon: '📋',
    category: BadgeCategory.Quality,
    tier: 2,
    condition: (stats) => stats.qualityChecksCompleted >= 10
  },
  {
    id: 'quality_checker_gold',
    name: 'Directeur Qualité',
    description: 'A effectué 30 contrôles qualité',
    icon: '📋',
    category: BadgeCategory.Quality,
    tier: 3,
    condition: (stats) => stats.qualityChecksCompleted >= 30
  },
  {
    id: 'perfectionist',
    name: 'Perfectionniste',
    description: 'A obtenu un score qualité supérieur à 95%',
    icon: '✨',
    category: BadgeCategory.Quality,
    tier: 2,
    condition: (stats) => stats.highQualityChecks >= 1 && stats.avgQualityScore >= 95
  },
  {
    id: 'consistency_king',
    name: 'Roi de la Constance',
    description: 'A maintenu un score qualité moyen supérieur à 90% sur 5 contrôles',
    icon: '👑',
    category: BadgeCategory.Quality,
    tier: 3,
    condition: (stats) => stats.qualityChecksCompleted >= 5 && stats.avgQualityScore >= 90
  },
  
  // Badges Objets Trouvés
  {
    id: 'lost_finder',
    name: 'Bon Samaritain',
    description: 'A enregistré son premier objet trouvé',
    icon: '🔍',
    category: BadgeCategory.LostFound,
    tier: 1,
    condition: (stats) => stats.lostItemsRegistered >= 1
  },
  {
    id: 'lost_finder_silver',
    name: 'Chercheur Dévoué',
    description: 'A enregistré 15 objets trouvés',
    icon: '🔍',
    category: BadgeCategory.LostFound,
    tier: 2,
    condition: (stats) => stats.lostItemsRegistered >= 15
  },
  {
    id: 'lost_finder_gold',
    name: 'Détective Privé',
    description: 'A enregistré 50 objets trouvés',
    icon: '🔍',
    category: BadgeCategory.LostFound,
    tier: 3,
    condition: (stats) => stats.lostItemsRegistered >= 50
  },
  {
    id: 'item_returner',
    name: 'Restituteur',
    description: 'A restitué 5 objets à leurs propriétaires',
    icon: '🎁',
    category: BadgeCategory.LostFound,
    tier: 2,
    condition: (stats) => stats.lostItemsReturned >= 5
  },
  {
    id: 'item_returner_gold',
    name: 'Champion de la Restitution',
    description: 'A restitué 20 objets à leurs propriétaires',
    icon: '🎁',
    category: BadgeCategory.LostFound,
    tier: 3,
    condition: (stats) => stats.lostItemsReturned >= 20
  },
  
  // Badges Procédures
  {
    id: 'procedure_creator',
    name: 'Rédacteur Débutant',
    description: 'A créé sa première procédure',
    icon: '📝',
    category: BadgeCategory.Procedures,
    tier: 1,
    condition: (stats) => stats.proceduresCreated >= 1
  },
  {
    id: 'procedure_creator_silver',
    name: 'Rédacteur Expérimenté',
    description: 'A créé 5 procédures',
    icon: '📝',
    category: BadgeCategory.Procedures,
    tier: 2,
    condition: (stats) => stats.proceduresCreated >= 5
  },
  {
    id: 'procedure_creator_gold',
    name: 'Rédacteur Expert',
    description: 'A créé 15 procédures',
    icon: '📝',
    category: BadgeCategory.Procedures,
    tier: 3,
    condition: (stats) => stats.proceduresCreated >= 15
  },
  {
    id: 'avid_reader',
    name: 'Lecteur Assidu',
    description: 'A lu 10 procédures',
    icon: '📚',
    category: BadgeCategory.Procedures,
    tier: 1,
    condition: (stats) => stats.proceduresRead >= 10
  },
  {
    id: 'avid_reader_silver',
    name: 'Bibliophile',
    description: 'A lu 25 procédures',
    icon: '📚',
    category: BadgeCategory.Procedures,
    tier: 2,
    condition: (stats) => stats.proceduresRead >= 25
  },
  {
    id: 'validator',
    name: 'Validateur',
    description: 'A validé 10 procédures',
    icon: '✅',
    category: BadgeCategory.Procedures,
    tier: 2,
    condition: (stats) => stats.proceduresValidated >= 10
  },
  
  // Badges Généraux
  {
    id: 'first_steps',
    name: 'Premiers Pas',
    description: 'S\'est connecté pour la première fois',
    icon: '🏁',
    category: BadgeCategory.General,
    tier: 1,
    condition: (stats) => stats.totalLogins >= 1
  },
  {
    id: 'regular_user',
    name: 'Utilisateur Régulier',
    description: 'S\'est connecté 30 jours',
    icon: '📆',
    category: BadgeCategory.General,
    tier: 2,
    condition: (stats) => stats.totalLogins >= 30
  },
  {
    id: 'dedicated_user',
    name: 'Utilisateur Dévoué',
    description: 'S\'est connecté 100 jours',
    icon: '📆',
    category: BadgeCategory.General,
    tier: 3,
    condition: (stats) => stats.totalLogins >= 100
  },
  {
    id: 'streak_starter',
    name: 'Série Débutante',
    description: 'S\'est connecté 3 jours consécutifs',
    icon: '🔥',
    category: BadgeCategory.General,
    tier: 1,
    condition: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'streak_master',
    name: 'Maître des Séries',
    description: 'S\'est connecté 14 jours consécutifs',
    icon: '🔥',
    category: BadgeCategory.General,
    tier: 2,
    condition: (stats) => stats.currentStreak >= 14
  },
  {
    id: 'streak_legend',
    name: 'Légende des Séries',
    description: 'S\'est connecté 30 jours consécutifs',
    icon: '🔥',
    category: BadgeCategory.General,
    tier: 3,
    condition: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'team_player',
    name: 'Joueur d\'Équipe',
    description: 'A aidé 5 collègues',
    icon: '🤝',
    category: BadgeCategory.General,
    tier: 2,
    condition: (stats) => stats.helpProvided >= 5
  },
  {
    id: 'appreciated',
    name: 'Apprécié',
    description: 'A reçu 10 remerciements',
    icon: '👏',
    category: BadgeCategory.General,
    tier: 2,
    condition: (stats) => stats.thanksReceived >= 10
  },
  {
    id: 'goal_achiever',
    name: 'Atteigneur d\'Objectifs',
    description: 'A complété 5 objectifs hebdomadaires',
    icon: '🎯',
    category: BadgeCategory.General,
    tier: 2,
    condition: (stats) => stats.weeklyGoalsCompleted >= 5
  },
  
  // Badges Spéciaux (cachés jusqu'à obtention)
  {
    id: 'jack_of_all_trades',
    name: 'Touche-à-Tout',
    description: 'A contribué dans tous les modules',
    icon: '🃏',
    category: BadgeCategory.Special,
    tier: 3,
    hidden: true,
    condition: (stats) => {
      const moduleIds = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5', 'mod6', 'mod7', 'mod8', 'mod9'];
      return moduleIds.every(moduleId => (stats.contributionsPerModule[moduleId] || 0) > 0);
    }
  },
  {
    id: 'night_owl',
    name: 'Oiseau de Nuit',
    description: 'S\'est connecté après 22h 10 fois',
    icon: '🦉',
    category: BadgeCategory.Special,
    tier: 2,
    hidden: true,
    condition: (stats) => false // Logique spéciale à implémenter
  },
  {
    id: 'early_bird',
    name: 'Lève-Tôt',
    description: 'S\'est connecté avant 7h 10 fois',
    icon: '🌅',
    category: BadgeCategory.Special,
    tier: 2,
    hidden: true,
    condition: (stats) => false // Logique spéciale à implémenter
  },
  {
    id: 'perfect_week',
    name: 'Semaine Parfaite',
    description: 'S\'est connecté chaque jour de la semaine',
    icon: '📅',
    category: BadgeCategory.Special,
    tier: 2,
    hidden: true,
    condition: (stats) => stats.currentStreak >= 7
  },
];

// Exemple de défis hebdomadaires
export const generateWeeklyChallenges = (): Challenge[] => {
  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return [
    {
      id: 'weekly_incidents',
      title: 'Résolution Efficace',
      description: 'Résoudre 5 incidents cette semaine',
      icon: '🚨',
      xpReward: 100,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.incidentsResolved >= 5,
      progress: (stats) => Math.min(Math.floor((stats.incidentsResolved / 5) * 100), 100),
      target: 5,
      moduleId: 'mod2'
    },
    {
      id: 'weekly_maintenance',
      title: 'Technicien de la Semaine',
      description: 'Compléter 3 maintenances cette semaine',
      icon: '🔧',
      xpReward: 80,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.maintenanceCompleted >= 3,
      progress: (stats) => Math.min(Math.floor((stats.maintenanceCompleted / 3) * 100), 100),
      target: 3,
      moduleId: 'mod3'
    },
    {
      id: 'weekly_quality',
      title: 'Excellence Qualité',
      description: 'Effectuer 2 contrôles qualité avec un score > 90%',
      icon: '📋',
      xpReward: 120,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.highQualityChecks >= 2,
      progress: (stats) => Math.min(Math.floor((stats.highQualityChecks / 2) * 100), 100),
      target: 2,
      moduleId: 'mod4'
    },
    {
      id: 'weekly_login',
      title: 'Présence Assidue',
      description: 'Se connecter 5 jours cette semaine',
      icon: '📆',
      xpReward: 50,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.consecutiveLogins >= 5,
      progress: (stats) => Math.min(Math.floor((stats.consecutiveLogins / 5) * 100), 100),
      target: 5
    },
    {
      id: 'weekly_procedures',
      title: 'Lecteur Informé',
      description: 'Lire et valider 3 procédures cette semaine',
      icon: '📚',
      xpReward: 75,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.proceduresValidated >= 3,
      progress: (stats) => Math.min(Math.floor((stats.proceduresValidated / 3) * 100), 100),
      target: 3,
      moduleId: 'mod6'
    }
  ];
};

// Fonction pour mettre à jour les statistiques d'un utilisateur
export function updateUserStats(stats: UserStats, action: GamificationAction): { 
  newStats: UserStats, 
  xpGained: number, 
  newBadges: Badge[] 
} {
  const newStats = { ...stats };
  let xpGained = 0;
  
  // Mise à jour selon l'action
  switch (action.type) {
    case 'CREATE_INCIDENT':
      newStats.incidentsCreated += 1;
      xpGained = ACTION_POINTS.CREATE_INCIDENT;
      if (action.severity === 'critical') {
        xpGained *= 1.5; // Plus de points pour incidents critiques
      }
      break;
      
    case 'RESOLVE_INCIDENT':
      newStats.incidentsResolved += 1;
      if (action.severity === 'critical') {
        newStats.criticalIncidentsResolved += 1;
        xpGained = ACTION_POINTS.RESOLVE_CRITICAL_INCIDENT;
      } else {
        xpGained = ACTION_POINTS.RESOLVE_INCIDENT;
      }
      
      // Mettre à jour le temps moyen de résolution
      if (action.resolutionTime) {
        const totalResolutionTime = newStats.avgResolutionTime * (newStats.incidentsResolved - 1) + action.resolutionTime;
        newStats.avgResolutionTime = totalResolutionTime / newStats.incidentsResolved;
      }
      break;
      
    case 'CREATE_MAINTENANCE':
      newStats.maintenanceCreated += 1;
      xpGained = ACTION_POINTS.CREATE_MAINTENANCE;
      break;
      
    case 'COMPLETE_MAINTENANCE':
      newStats.maintenanceCompleted += 1;
      xpGained = ACTION_POINTS.COMPLETE_MAINTENANCE;
      if (action.beforeSchedule) {
        newStats.quickMaintenanceCompleted += 1;
        xpGained += ACTION_POINTS.EXPEDITE_MAINTENANCE;
      }
      break;
      
    case 'COMPLETE_QUALITY_CHECK':
      newStats.qualityChecksCompleted += 1;
      xpGained = ACTION_POINTS.COMPLETE_QUALITY_CHECK;
      
      // Mettre à jour le score moyen de qualité
      const totalQualityScore = newStats.avgQualityScore * (newStats.qualityChecksCompleted - 1) + action.score;
      newStats.avgQualityScore = totalQualityScore / newStats.qualityChecksCompleted;
      
      if (action.score > 90) {
        newStats.highQualityChecks += 1;
        xpGained += ACTION_POINTS.HIGH_QUALITY_SCORE;
      }
      break;
      
    case 'REGISTER_LOST_ITEM':
      newStats.lostItemsRegistered += 1;
      xpGained = ACTION_POINTS.REGISTER_LOST_ITEM;
      break;
      
    case 'RETURN_LOST_ITEM':
      newStats.lostItemsReturned += 1;
      xpGained = ACTION_POINTS.RETURN_LOST_ITEM;
      break;
      
    case 'CREATE_PROCEDURE':
      newStats.proceduresCreated += 1;
      xpGained = ACTION_POINTS.CREATE_PROCEDURE;
      break;
      
    case 'READ_PROCEDURE':
      newStats.proceduresRead += 1;
      xpGained = ACTION_POINTS.READ_PROCEDURE;
      break;
      
    case 'VALIDATE_PROCEDURE':
      newStats.proceduresValidated += 1;
      xpGained = ACTION_POINTS.VALIDATE_PROCEDURE;
      break;
      
    case 'LOGIN':
      newStats.totalLogins += 1;
      xpGained = ACTION_POINTS.FIRST_LOGIN_OF_DAY;
      
      // Vérifier les connexions consécutives
      const lastLogin = new Date(newStats.lastLoginDate || 0);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (lastLogin.toDateString() === yesterday.toDateString()) {
        newStats.consecutiveLogins += 1;
        newStats.currentStreak += 1;
        xpGained += ACTION_POINTS.CONSECUTIVE_DAY_LOGIN;
        
        if (newStats.currentStreak > newStats.longestStreak) {
          newStats.longestStreak = newStats.currentStreak;
        }
      } else if (lastLogin.toDateString() !== today.toDateString()) {
        // Réinitialiser le streak si pas connecté hier et pas encore aujourd'hui
        newStats.consecutiveLogins = 1;
        newStats.currentStreak = 1;
      }
      
      newStats.lastLoginDate = today.toISOString();
      break;
      
    case 'HELP_COLLEAGUE':
      newStats.helpProvided += 1;
      xpGained = ACTION_POINTS.HELP_COLLEAGUE;
      break;
      
    case 'RECEIVE_THANKS':
      newStats.thanksReceived += 1;
      xpGained = ACTION_POINTS.RECEIVE_THANKS;
      break;
      
    case 'COMPLETE_WEEKLY_GOAL':
      newStats.weeklyGoalsCompleted += 1;
      xpGained = ACTION_POINTS.WEEKLY_GOAL_COMPLETION;
      break;
  }
  
  // Ajouter l'XP gagnée
  newStats.xp += xpGained;
  
  // Mettre à jour le niveau
  newStats.level = calculateLevel(newStats.xp);
  
  // Mettre à jour la date de dernière mise à jour
  newStats.lastUpdated = new Date().toISOString();
  
  // Vérifier les nouveaux badges
  const currentBadges = new Set(newStats.badges);
  const newBadges: Badge[] = [];
  
  BADGES.forEach(badge => {
    if (!currentBadges.has(badge.id) && badge.condition(newStats)) {
      currentBadges.add(badge.id);
      newBadges.push(badge);
    }
  });
  
  // Mettre à jour la liste des badges
  newStats.badges = Array.from(currentBadges);
  
  return { newStats, xpGained, newBadges };
}

// Fonction pour obtenir la liste des badges d'un utilisateur
export function getUserBadges(stats: UserStats): Badge[] {
  return BADGES.filter(badge => 
    stats.badges.includes(badge.id) || 
    (!badge.hidden && badge.condition(stats))
  );
}

// Fonction pour trier les badges par catégorie
export function groupBadgesByCategory(badges: Badge[]): Record<BadgeCategory, Badge[]> {
  const result = Object.values(BadgeCategory).reduce((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as Record<BadgeCategory, Badge[]>);
  
  badges.forEach(badge => {
    result[badge.category].push(badge);
  });
  
  return result;
}

// Fonction pour calculer le rang global d'un utilisateur
export function calculateRank(stats: UserStats): {
  rank: string;
  points: number;
  nextRank: string;
  pointsNeeded: number;
} {
  const ranks = [
    { name: "Bronze", minPoints: 0, maxPoints: 999 },
    { name: "Argent", minPoints: 1000, maxPoints: 2999 },
    { name: "Or", minPoints: 3000, maxPoints: 7999 },
    { name: "Platine", minPoints: 8000, maxPoints: 14999 },
    { name: "Diamant", minPoints: 15000, maxPoints: 29999 },
    { name: "Champion", minPoints: 30000, maxPoints: Infinity },
  ];
  
  // Points basés sur XP, badges et contributions
  const points = stats.xp + (stats.badges.length * 100) + 
    (stats.incidentsResolved * 10) + (stats.maintenanceCompleted * 10) + 
    (stats.qualityChecksCompleted * 15) + (stats.lostItemsReturned * 5) + 
    (stats.proceduresCreated * 20);
  
  // Trouver le rang actuel
  let currentRank = ranks[0];
  let nextRank = ranks[1];
  
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (points >= ranks[i].minPoints) {
      currentRank = ranks[i];
      nextRank = i < ranks.length - 1 ? ranks[i + 1] : ranks[i];
      break;
    }
  }
  
  const pointsNeeded = nextRank.minPoints - points;
  
  return {
    rank: currentRank.name,
    points,
    nextRank: nextRank.name === currentRank.name ? "Max" : nextRank.name,
    pointsNeeded: pointsNeeded <= 0 ? 0 : pointsNeeded
  };
}

// Mock service pour stocker les données des utilisateurs
export const GamificationService = {
  userStats: new Map<string, UserStats>(),
  
  // Initialiser les statistiques d'un utilisateur
  initUser(userId: string) {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, initializeUserStats(userId));
      
      // Simuler une première connexion
      this.updateStats(userId, { type: 'LOGIN' });
    }
    return this.userStats.get(userId)!;
  },
  
  // Obtenir les statistiques d'un utilisateur
  getStats(userId: string): UserStats {
    if (!this.userStats.has(userId)) {
      return this.initUser(userId);
    }
    return this.userStats.get(userId)!;
  },
  
  // Mettre à jour les statistiques d'un utilisateur
  updateStats(userId: string, action: GamificationAction) {
    const stats = this.getStats(userId);
    const { newStats, xpGained, newBadges } = updateUserStats(stats, action);
    
    this.userStats.set(userId, newStats);
    
    return { newStats, xpGained, newBadges };
  },
  
  // Obtenir les badges d'un utilisateur
  getBadges(userId: string): Badge[] {
    const stats = this.getStats(userId);
    return getUserBadges(stats);
  },
  
  // Obtenir le niveau d'un utilisateur et sa progression
  getLevel(userId: string): { level: number; progress: number; levelInfo: any } {
    const stats = this.getStats(userId);
    const level = stats.level;
    const progress = calculateLevelProgress(stats.xp);
    const levelInfo = getLevelInfo(level);
    
    return { level, progress, levelInfo };
  },
  
  // Obtenir le classement d'un utilisateur
  getRank(userId: string) {
    const stats = this.getStats(userId);
    return calculateRank(stats);
  },
  
  // Obtenir les défis hebdomadaires d'un utilisateur
  getChallenges(userId: string): { challenges: Challenge[]; progress: { [id: string]: number } } {
    const stats = this.getStats(userId);
    const challenges = generateWeeklyChallenges();
    
    const progress = challenges.reduce((acc, challenge) => {
      acc[challenge.id] = challenge.progress(stats);
      return acc;
    }, {} as { [id: string]: number });
    
    return { challenges, progress };
  }
};