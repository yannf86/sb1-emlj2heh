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

// User related types
interface User extends BaseDocument {
  name: string;
  email: string;
  role: 'admin' | 'standard';
  hotels: string[];
  modules: string[];
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
  locationId: string;
  interventionTypeId: string;
  description: string;
  receivedById: string;
  technicianId?: string;
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
}

// Quality related types
interface QualityVisit extends BaseDocument {
  visitDate: string;
  startTime: string;
  endTime: string;
  hotelId: string;
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

// Export all types
export type {
  BaseDocument,
  AuditLog,
  User,
  UserActivity,
  Hotel,
  Parameter,
  Incident,
  Maintenance,
  QualityVisit,
  LostItem,
  Procedure,
  Supplier,
  UserStats,
  Badge,
  Challenge
};