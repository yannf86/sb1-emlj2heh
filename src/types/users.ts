export interface User {
  id: string;
  name: string;
  email: string;
  role: 'standard' | 'hotel_admin' | 'system_admin';
  hotels: string[]; // IDs des hôtels accessibles
  modules: string[]; // IDs des modules accessibles (mod20, mod21, etc.)
  active: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRole {
  key: string;
  label: string;
  description: string;
}

export const userRoles: UserRole[] = [
  {
    key: 'standard',
    label: 'Utilisateur Standard',
    description: 'Accès limité aux modules assignés'
  },
  {
    key: 'hotel_admin',
    label: 'Administrateur Hôtel',
    description: 'Gestion complète des hôtels assignés'
  },
  {
    key: 'system_admin',
    label: 'Administrateur Système',
    description: 'Accès complet à tous les modules et hôtels'
  }
];

export interface AppModule {
  key: string;
  label: string;
  path: string;
  icon: string;
}

// Modules de l'application avec IDs commençant à mod20
export const appModules: AppModule[] = [
  { key: 'mod20', label: 'Tableau de Bord', path: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'mod21', label: 'Cahier de Consignes', path: '/logbook', icon: 'BookOpen' },
  { key: 'mod22', label: 'Check-list', path: '/checklist', icon: 'CheckSquare' },
  { key: 'mod23', label: 'Suivi Incidents', path: '/incidents', icon: 'AlertTriangle' },
  { key: 'mod24', label: 'Suivi Technique', path: '/maintenance', icon: 'Wrench' },
  { key: 'mod26', label: 'Visites Qualité', path: '/quality-visits', icon: 'ClipboardCheck' },
  { key: 'mod27', label: 'Objets Trouvés', path: '/lost-items', icon: 'Package' },
  { key: 'mod28', label: 'Procédures', path: '/procedures', icon: 'FileText' },
  { key: 'mod30', label: 'Fournisseurs', path: '/suppliers', icon: 'Building' },
  // Nouveaux modules
  { key: 'mod33', label: 'Ressources Humaines', path: '/hr', icon: 'Users' },
  { key: 'mod34', label: 'Suivi Mission DOP', path: '/dop-missions', icon: 'Target' },
  { key: 'mod35', label: 'Housekeeping', path: '/housekeeping', icon: 'Sparkles' },
  { key: 'mod36', label: 'Planning', path: '/planning', icon: 'Calendar' },
  { key: 'mod37', label: 'Mail Automatisation', path: '/mail-automation', icon: 'Mail' },
  { key: 'mod38', label: 'Canal de Discussion', path: '/chat', icon: 'MessageCircle' },
  // Modules administratifs en bas
  { key: 'mod25', label: 'Techniciens', path: '/technicians', icon: 'Users' },
  { key: 'mod29', label: 'Gamification', path: '/gamification', icon: 'Trophy' },
  { key: 'mod31', label: 'Paramètres', path: '/parameters', icon: 'Settings' },
  { key: 'mod32', label: 'Utilisateurs', path: '/users', icon: 'User' },
];