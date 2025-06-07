// Database schema and types for Firestore collections

// Base types for common fields
interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface AuditLog extends BaseDocument {
  collectionName: string;
  documentId: string;
  action: 'create' | 'update' | 'delete';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  userId: string;
  timestamp: string;
}

// Group related types
interface Group extends BaseDocument {
  name: string;
  description?: string;
  userIds: string[];  // Users who have access to this group
  logoUrl?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

// User related types
interface User extends BaseDocument {
  name: string;
  email: string;
  role: 'admin' | 'group_admin' | 'hotel_admin' | 'standard'; // Added group_admin role
  hotels: string[];
  modules: string[];
  groupIds: string[]; // Groups the user belongs to
  active: boolean;
  lastLogin?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
}

interface UserActivity extends BaseDocument {
  userId: string;
  action: string;
  module: string;
  details: any;
  timestamp: string;
}

// Hotel related types
interface Hotel extends BaseDocument {
  name: string;
  address: string;
  city: string;
  country: string;
  imageUrl: string;
  groupId: string; // The group this hotel belongs to
  availableLocations?: string[];
  availableRoomTypes?: string[];
  settings?: {
    checkInTime?: string;
    checkOutTime?: string;
    timezone?: string;
    currency?: string;
  };
  contacts?: {
    phone?: string;
    email?: string;
    emergency?: string;
  };
}

// Parameter types
interface Parameter extends BaseDocument {
  type: string;
  code: string;
  label: string;
  active: boolean;
  order: number;
  metadata?: Record<string, any>;
}

// Incident related types
interface Incident extends BaseDocument {
  date: string;
  time: string;
  hotelId: string;
  groupId: string; // The group this incident belongs to
  locationId: string;
  roomType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  arrivalDate?: string;
  departureDate?: string;
  reservationAmount?: string;
  origin?: string;
  categoryId: string;
  impactId: string;
  description: string;
  statusId: string;
  receivedById: string;
  concludedById?: string;
  resolution?: {
    date?: string;
    description?: string;
    type?: string;
    cost?: number;
  };
  attachments?: {
    url: string;
    type: string;
    name: string;
    uploadedAt: string;
    uploadedBy: string;
  }[];
  history: {
    timestamp: string;
    userId: string;
    action: string;
    details: any;
  }[];
}

// Maintenance related types
interface Maintenance extends BaseDocument {
  date: string;
  time: string;
  hotelId: string;
  groupId: string; // The group this maintenance belongs to
  locationId: string;
  interventionTypeId: string;
  description: string;
  receivedById: string;
  technicianId?: string;
  technicianIds?: string[];
  statusId: string;
  estimatedAmount?: number;
  finalAmount?: number;
  startDate?: string;
  endDate?: string;
  photoBefore?: string;
  photoAfter?: string;
  quote?: {
    url?: string;
    amount?: number;
    accepted?: boolean;
    acceptedDate?: string;
    acceptedById?: string;
  };
  quoteUrl?: string;
  quoteAmount?: number;
  quoteStatus?: 'pending' | 'accepted' | 'rejected';
  quoteAccepted?: boolean;
  quoteAcceptedDate?: string;
  quoteAcceptedById?: string;
  quoteSubmitted?: boolean;
  quotes?: MaintenanceQuote[];
  parts?: {
    name: string;
    quantity: number;
    cost: number;
    supplierId?: string;
  }[];
  history: {
    timestamp: string;
    userId: string;
    action: string;
    details: any;
  }[];
  emailsSent?: { [key: string]: boolean };
}

interface MaintenanceQuote {
  technicianId: string;
  amount: number;
  url: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  comments?: string;
  statusComments?: string;
  createdAt: string;
  createdBy: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  negotiationHistory?: {
    timestamp: string;
    userId: string;
    message: string;
    amount?: number;
  }[];
}

// Quality related types
interface QualityVisit extends BaseDocument {
  visitDate: string;
  startTime: string;
  endTime: string;
  hotelId: string;
  groupId: string; // The group this quality visit belongs to
  visitorId: string;
  localReferentId?: string;
  visitTypeId: string;
  checklist: {
    categoryId: string;
    itemId: string;
    result: 'conforme' | 'non-conforme' | 'non-applicable';
    comment?: string;
    photos?: string[];
  }[];
  remarks?: string;
  actionPlan?: string;
  conformityRate: number;
  photos?: {
    url: string;
    caption?: string;
    uploadedAt: string;
  }[];
  history: {
    timestamp: string;
    userId: string;
    action: string;
    details: any;
  }[];
}

// Lost & Found related types
interface LostItem extends BaseDocument {
  date: string;
  time: string;
  hotelId: string;
  groupId: string; // The group this lost item belongs to
  locationId: string;
  description: string;
  itemTypeId: string;
  foundById: string;
  storageLocation: string;
  status: 'conservé' | 'rendu' | 'transféré';
  returnedTo?: string;
  returnDate?: string;
  photos?: string[];
  history: {
    timestamp: string;
    userId: string;
    action: string;
    details: any;
  }[];
}

// Procedure related types
interface Procedure extends BaseDocument {
  title: string;
  description: string;
  fileUrl: string;
  moduleId: string;
  hotelIds: string[];
  groupIds: string[]; // The groups this procedure belongs to
  typeId: string;
  serviceId: string;
  assignedUserIds: string[];
  content?: string;
  version: number;
  userReads: {
    userId: string;
    readDate: string;
    validated: boolean;
  }[];
  attachments?: {
    url: string;
    type: string;
    name: string;
    uploadedAt: string;
  }[];
  history: {
    timestamp: string;
    userId: string;
    action: string;
    details: any;
    version: number;
  }[];
}

// Supplier related types
interface Supplier extends BaseDocument {
  companyName: string;
  description: string;
  subcategoryId: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  active: boolean;
  hotelIds: string[];
  groupIds: string[]; // The groups this supplier belongs to
  contacts?: {
    name: string;
    role: string;
    phone: string;
    email: string;
  }[];
  contracts?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    amount: number;
    fileUrl: string;
    status: 'draft' | 'active' | 'expired' | 'terminated';
  }[];
  ratings?: {
    userId: string;
    rating: number;
    comment?: string;
    date: string;
  }[];
  history: {
    timestamp: string;
    userId: string;
    action: string;
    details: any;
  }[];
}

// Gamification related types
interface UserStats extends BaseDocument {
  userId: string;
  xp: number;
  level: number;
  badges: string[];
  stats: {
    incidentsCreated: number;
    incidentsResolved: number;
    criticalIncidentsResolved: number;
    avgResolutionTime: number;
    maintenanceCreated: number;
    maintenanceCompleted: number;
    quickMaintenanceCompleted: number;
    qualityChecksCompleted: number;
    avgQualityScore: number;
    highQualityChecks: number;
    lostItemsRegistered: number;
    lostItemsReturned: number;
    proceduresCreated: number;
    proceduresRead: number;
    proceduresValidated: number;
    consecutiveLogins: number;
    totalLogins: number;
    lastLoginDate: string;
    weeklyGoalsCompleted: number;
    thanksReceived: number;
    helpProvided: number;
  };
  history: {
    timestamp: string;
    action: string;
    xpGained: number;
    details: any;
  }[];
}

interface Badge extends BaseDocument {
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: 1 | 2 | 3;
  hidden?: boolean;
  requirements: {
    type: string;
    value: number;
  }[];
}

interface Challenge extends BaseDocument {
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  requirements: {
    type: string;
    target: number;
  }[];
  participants?: {
    userId: string;
    progress: number;
    completed: boolean;
    completedAt?: string;
  }[];
}

// Technician related types
interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  specialties: string[];
  hourlyRate?: number;
  hotels: string[];
  groupIds: string[]; // The groups this technician belongs to
  available: boolean;
  active: boolean;
  rating?: number;
  completedJobs?: number;
  createdAt: string;
  updatedAt: string;
}

// Export all types
export type {
  BaseDocument,
  AuditLog,
  Group,
  User,
  UserActivity,
  Hotel,
  Parameter,
  Incident,
  Maintenance,
  MaintenanceQuote,
  QualityVisit,
  LostItem,
  Procedure,
  Supplier,
  UserStats,
  Badge,
  Challenge,
  Technician
};