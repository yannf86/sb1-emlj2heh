import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Types for our data
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'standard';
  hotels: string[];
  modules: string[];
  active: boolean;
};

export type Hotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  imageUrl: string;
  availableLocations?: string[]; // IDs of available locations
  availableRoomTypes?: string[]; // IDs of available room types
};

// Hotel services
export type HotelService = {
  id: string;
  name: string;
  code: string;
  icon: string;
  order: number;
};

// Mock data (temporary until Firebase integration is complete)
export const hotelServices: HotelService[] = [
  { id: 'serv1', name: 'Réception', code: 'reception', icon: '👥', order: 1 },
  { id: 'serv2', name: 'Housekeeping', code: 'housekeeping', icon: '🛏️', order: 2 },
  { id: 'serv3', name: 'Restauration', code: 'restaurant', icon: '🍽️', order: 3 },
  { id: 'serv4', name: 'Technique', code: 'maintenance', icon: '🔧', order: 4 },
  { id: 'serv5', name: 'Sécurité', code: 'security', icon: '🛡️', order: 5 },
  { id: 'serv6', name: 'Spa & Bien-être', code: 'spa', icon: '💆', order: 6 },
  { id: 'serv7', name: 'Événementiel', code: 'events', icon: '🎪', order: 7 },
  { id: 'serv8', name: 'Commercial', code: 'sales', icon: '💼', order: 8 },
  { id: 'serv9', name: 'Administration', code: 'admin', icon: '📊', order: 9 },
];

// Mock data
export const modules = [
  { id: 'mod1', name: 'Tableau de Bord', code: 'dashboard', icon: 'layout-dashboard', active: true, order: 1 },
  { id: 'mod2', name: 'Suivi Incidents', code: 'incidents', icon: 'alert-triangle', active: true, order: 2 },
  { id: 'mod3', name: 'Suivi Technique', code: 'maintenance', icon: 'tool', active: true, order: 3 },
  { id: 'mod4', name: 'Visites Qualité', code: 'quality', icon: 'clipboard-check', active: true, order: 4 },
  { id: 'mod5', name: 'Objets Trouvés', code: 'lost-found', icon: 'search', active: true, order: 5 },
  { id: 'mod6', name: 'Procédures', code: 'procedures', icon: 'file-text', active: true, order: 6 },
  { id: 'mod7', name: 'Statistiques', code: 'statistics', icon: 'bar-chart', active: true, order: 7 },
  { id: 'mod8', name: 'Paramètres', code: 'settings', icon: 'settings', active: true, order: 8 },
  { id: 'mod9', name: 'Gestion des Utilisateurs', code: 'users', icon: 'users', active: true, order: 9 },
  { id: 'mod10', name: 'Gamification', code: 'gamification', icon: 'trophy', active: true, order: 10 },
  { id: 'mod11', name: 'Fournisseurs', code: 'suppliers', icon: 'truck', active: true, order: 11 }
];

export const hotels = [
  {
    id: 'hotel1',
    name: 'Hôtel Royal Palace',
    address: '15 Avenue des Champs-Élysées',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 'hotel2',
    name: 'Riviera Luxury Hotel',
    address: '23 Promenade des Anglais',
    city: 'Nice',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 'hotel3',
    name: 'Mountain View Resort',
    address: '42 Route des Alpes',
    city: 'Chamonix',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 'hotel4',
    name: 'Bordeaux Grand Hotel',
    address: '78 Quai des Chartrons',
    city: 'Bordeaux',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80'
  }
];

export const users: User[] = [
  {
    id: 'user1',
    name: 'Admin Test',
    email: 'admin@test.com',
    role: 'admin',
    hotels: ['hotel1', 'hotel2', 'hotel3', 'hotel4'],
    modules: ['mod1', 'mod2', 'mod3', 'mod4', 'mod5', 'mod6', 'mod7', 'mod8', 'mod9', 'mod10', 'mod11'],
    active: true
  },
  {
    id: 'user2',
    name: 'User Test',
    email: 'user@test.com',
    role: 'standard',
    hotels: ['hotel1', 'hotel2'],
    modules: ['mod1', 'mod2', 'mod3', 'mod4', 'mod5'],
    active: true
  },
];

// Parameters
export type Parameter = {
  id: string;
  type: string;
  code: string;
  label: string;
  active: boolean;
  order: number;
};

export const parameters: Parameter[] = [
  // Locations
  { id: 'loc1', type: 'location', code: 'lobby', label: 'Hall d\'accueil', active: true, order: 1 },
  { id: 'loc2', type: 'location', code: 'room', label: 'Chambre', active: true, order: 2 },
  { id: 'loc3', type: 'location', code: 'restaurant', label: 'Restaurant', active: true, order: 3 },
  { id: 'loc4', type: 'location', code: 'bar', label: 'Bar', active: true, order: 4 },
  { id: 'loc5', type: 'location', code: 'pool', label: 'Piscine', active: true, order: 5 },
  { id: 'loc6', type: 'location', code: 'spa', label: 'Spa', active: true, order: 6 },
  { id: 'loc7', type: 'location', code: 'gym', label: 'Salle de sport', active: true, order: 7 },
  { id: 'loc8', type: 'location', code: 'parking', label: 'Parking', active: true, order: 8 },
  
  // Room types
  { id: 'room1', type: 'room_type', code: 'standard', label: 'Chambre Standard', active: true, order: 1 },
  { id: 'room2', type: 'room_type', code: 'superior', label: 'Chambre Supérieure', active: true, order: 2 },
  { id: 'room3', type: 'room_type', code: 'deluxe', label: 'Chambre Deluxe', active: true, order: 3 },
  { id: 'room4', type: 'room_type', code: 'suite', label: 'Suite', active: true, order: 4 },
  { id: 'room5', type: 'room_type', code: 'junior_suite', label: 'Suite Junior', active: true, order: 5 },
  
  // Incident categories
  { id: 'cat1', type: 'incident_category', code: 'cleanliness', label: 'Propreté', active: true, order: 1 },
  { id: 'cat2', type: 'incident_category', code: 'technical', label: 'Problème technique', active: true, order: 2 },
  { id: 'cat3', type: 'incident_category', code: 'service', label: 'Service', active: true, order: 3 },
  { id: 'cat4', type: 'incident_category', code: 'noise', label: 'Bruit', active: true, order: 4 },
  { id: 'cat5', type: 'incident_category', code: 'food', label: 'Nourriture', active: true, order: 5 },
  
  // Impact degrees
  { id: 'imp1', type: 'impact', code: 'low', label: 'Faible', active: true, order: 1 },
  { id: 'imp2', type: 'impact', code: 'medium', label: 'Moyen', active: true, order: 2 },
  { id: 'imp3', type: 'impact', code: 'high', label: 'Élevé', active: true, order: 3 },
  { id: 'imp4', type: 'impact', code: 'critical', label: 'Critique', active: true, order: 4 },
  
  // Resolution types
  { id: 'res1', type: 'resolution_type', code: 'immediate', label: 'Résolu immédiatement', active: true, order: 1 },
  { id: 'res2', type: 'resolution_type', code: 'partial', label: 'Résolu partiellement', active: true, order: 2 },
  { id: 'res3', type: 'resolution_type', code: 'delayed', label: 'Résolu avec délai', active: true, order: 3 },
  { id: 'res4', type: 'resolution_type', code: 'escalated', label: 'Escaladé', active: true, order: 4 },
  
  // Client satisfaction
  { id: 'sat1', type: 'client_satisfaction', code: 'very_satisfied', label: 'Très satisfait', active: true, order: 1 },
  { id: 'sat2', type: 'client_satisfaction', code: 'satisfied', label: 'Satisfait', active: true, order: 2 },
  { id: 'sat3', type: 'client_satisfaction', code: 'neutral', label: 'Neutre', active: true, order: 3 },
  { id: 'sat4', type: 'client_satisfaction', code: 'unsatisfied', label: 'Insatisfait', active: true, order: 4 },
  { id: 'sat5', type: 'client_satisfaction', code: 'very_unsatisfied', label: 'Très insatisfait', active: true, order: 5 },
  
  // Status
  { id: 'stat1', type: 'status', code: 'open', label: 'Ouvert', active: true, order: 1 },
  { id: 'stat2', type: 'status', code: 'in_progress', label: 'En cours', active: true, order: 2 },
  { id: 'stat3', type: 'status', code: 'resolved', label: 'Résolu', active: true, order: 3 },
  { id: 'stat4', type: 'status', code: 'closed', label: 'Fermé', active: true, order: 4 },
  { id: 'stat5', type: 'status', code: 'cancelled', label: 'Annulé', active: true, order: 5 },
  
  // Intervention types
  { id: 'int1', type: 'intervention_type', code: 'plumbing', label: 'Plomberie', active: true, order: 1 },
  { id: 'int2', type: 'intervention_type', code: 'electrical', label: 'Électricité', active: true, order: 2 },
  { id: 'int3', type: 'intervention_type', code: 'hvac', label: 'Climatisation/Chauffage', active: true, order: 3 },
  { id: 'int4', type: 'intervention_type', code: 'furniture', label: 'Mobilier', active: true, order: 4 },
  { id: 'int5', type: 'intervention_type', code: 'painting', label: 'Peinture', active: true, order: 5 },
  
  // Visit types
  { id: 'vis1', type: 'visit_type', code: 'first', label: 'Première visite', active: true, order: 1 },
  { id: 'vis2', type: 'visit_type', code: 'monthly', label: 'Visite mensuelle', active: true, order: 2 },
  { id: 'vis3', type: 'visit_type', code: 'spot', label: 'Contrôle ponctuel', active: true, order: 3 },
  { id: 'vis4', type: 'visit_type', code: 'post_incident', label: 'Suite à incident', active: true, order: 4 },
  { id: 'vis5', type: 'visit_type', code: 'quality', label: 'Contrôle qualité', active: true, order: 5 },
  
  // Quality check categories
  { id: 'qcat1', type: 'quality_category', code: 'hygiene', label: 'Hygiène & Propreté', active: true, order: 1 },
  { id: 'qcat2', type: 'quality_category', code: 'maintenance', label: 'Maintenance & Technique', active: true, order: 2 },
  { id: 'qcat3', type: 'quality_category', code: 'team', label: 'Équipe & Service', active: true, order: 3 },
  { id: 'qcat4', type: 'quality_category', code: 'documentation', label: 'Documentation & Affichage', active: true, order: 4 },
  { id: 'qcat5', type: 'quality_category', code: 'food', label: 'Petit-déjeuner / Restauration', active: true, order: 5 },
  { id: 'qcat6', type: 'quality_category', code: 'equipment', label: 'Équipements & Services', active: true, order: 6 },
  
  // Quality check items for each category
  { id: 'qitem1', type: 'quality_item', code: 'hygiene_1', label: 'Propreté des sanitaires', active: true, order: 1 },
  { id: 'qitem2', type: 'quality_item', code: 'hygiene_2', label: 'Propreté des sols', active: true, order: 2 },
  { id: 'qitem3', type: 'quality_item', code: 'maintenance_1', label: 'État des équipements', active: true, order: 3 },
  { id: 'qitem4', type: 'quality_item', code: 'maintenance_2', label: 'Fonctionnement climatisation', active: true, order: 4 },
  { id: 'qitem5', type: 'quality_item', code: 'team_1', label: 'Accueil clients', active: true, order: 5 },
  { id: 'qitem6', type: 'quality_item', code: 'team_2', label: 'Tenue du personnel', active: true, order: 6 },
  
  // Lost item types
  { id: 'lit1', type: 'lost_item_type', code: 'electronics', label: 'Électronique', active: true, order: 1 },
  { id: 'lit2', type: 'lost_item_type', code: 'clothing', label: 'Vêtement', active: true, order: 2 },
  { id: 'lit3', type: 'lost_item_type', code: 'jewelry', label: 'Bijou', active: true, order: 3 },
  { id: 'lit4', type: 'lost_item_type', code: 'documents', label: 'Document', active: true, order: 4 },
  { id: 'lit5', type: 'lost_item_type', code: 'other', label: 'Autre', active: true, order: 5 },
  
  // Procedure types
  { id: 'proc1', type: 'procedure_type', code: 'guide', label: 'Guide', active: true, order: 1 },
  { id: 'proc2', type: 'procedure_type', code: 'protocol', label: 'Protocole', active: true, order: 2 },
  { id: 'proc3', type: 'procedure_type', code: 'training', label: 'Formation', active: true, order: 3 },
  { id: 'proc4', type: 'procedure_type', code: 'emergency', label: 'Urgence', active: true, order: 4 },
  { id: 'proc5', type: 'procedure_type', code: 'other', label: 'Autre', active: true, order: 5 },
  
  // Booking origins
  { id: 'book1', type: 'booking_origin', code: 'direct', label: 'Direct', active: true, order: 1 },
  { id: 'book2', type: 'booking_origin', code: 'booking', label: 'Booking.com', active: true, order: 2 },
  { id: 'book3', type: 'booking_origin', code: 'expedia', label: 'Expedia', active: true, order: 3 },
  { id: 'book4', type: 'booking_origin', code: 'airbnb', label: 'Airbnb', active: true, order: 4 },
  { id: 'book5', type: 'booking_origin', code: 'agency', label: 'Agence', active: true, order: 5 },
  { id: 'book6', type: 'booking_origin', code: 'corporate', label: 'Corporate', active: true, order: 6 },
  { id: 'book7', type: 'booking_origin', code: 'other', label: 'Autre', active: true, order: 7 }
];

// Supplier categories
export const supplierCategories = [
  { id: 'cat1', name: 'Alimentaire', icon: '🍽️', order: 1 },
  { id: 'cat2', name: 'Équipement', icon: '🛠️', order: 2 },
  { id: 'cat3', name: 'Services', icon: '🔧', order: 3 },
  { id: 'cat4', name: 'Consommables', icon: '📦', order: 4 },
  { id: 'cat5', name: 'Textile & Linge', icon: '🧺', order: 5 },
  { id: 'cat6', name: 'Bien-être & Spa', icon: '💆', order: 6 },
  { id: 'cat7', name: 'Technologie', icon: '💻', order: 7 },
  { id: 'cat8', name: 'Événementiel', icon: '🎪', order: 8 },
  { id: 'cat9', name: 'Décoration', icon: '🎨', order: 9 },
  { id: 'cat10', name: 'Sécurité', icon: '🔒', order: 10 }
];

// Supplier subcategories
export const supplierSubcategories = [
  // Alimentaire (cat1)
  { id: 'sub1', categoryId: 'cat1', name: 'Produits frais', description: 'Fruits, légumes, viandes, poissons', order: 1 },
  { id: 'sub2', categoryId: 'cat1', name: 'Boissons', description: 'Alcools, softs, eaux, cafés, thés', order: 2 },
  { id: 'sub3', categoryId: 'cat1', name: 'Épicerie', description: 'Produits secs, conserves, condiments', order: 3 },
  { id: 'sub4', categoryId: 'cat1', name: 'Produits laitiers', description: 'Lait, fromages, yaourts, crèmes', order: 4 },
  { id: 'sub5', categoryId: 'cat1', name: 'Boulangerie & Pâtisserie', description: 'Pains, viennoiseries, pâtisseries', order: 5 },
  
  // Équipement (cat2)
  { id: 'sub6', categoryId: 'cat2', name: 'Mobilier', description: 'Meubles, literie, assises', order: 1 },
  { id: 'sub7', categoryId: 'cat2', name: 'Électroménager', description: 'Appareils de cuisine, climatisation', order: 2 },
  { id: 'sub8', categoryId: 'cat2', name: 'Équipement de cuisine', description: 'Ustensiles, matériel professionnel', order: 3 },
  { id: 'sub9', categoryId: 'cat2', name: 'Équipement de salle', description: 'Tables, chaises, buffets', order: 4 },
  { id: 'sub10', categoryId: 'cat2', name: 'Équipement de chambre', description: 'Lits, armoires, bureaux', order: 5 },
  
  // Services (cat3)
  { id: 'sub11', categoryId: 'cat3', name: 'Maintenance', description: 'Réparations, entretien technique', order: 1 },
  { id: 'sub12', categoryId: 'cat3', name: 'Nettoyage', description: 'Services de nettoyage et blanchisserie', order: 2 },
  { id: 'sub13', categoryId: 'cat3', name: 'Sécurité', description: 'Surveillance, systèmes de sécurité', order: 3 },
  { id: 'sub14', categoryId: 'cat3', name: 'Transport', description: 'Navettes, services de voiturier', order: 4 },
  { id: 'sub15', categoryId: 'cat3', name: 'Formation', description: 'Formation du personnel', order: 5 },
  
  // Consommables (cat4)
  { id: 'sub16', categoryId: 'cat4', name: 'Produits d\'accueil', description: 'Savons, shampoings, accessoires', order: 1 },
  { id: 'sub17', categoryId: 'cat4', name: 'Produits d\'entretien', description: 'Produits de nettoyage, papier', order: 2 },
  { id: 'sub18', categoryId: 'cat4', name: 'Fournitures de bureau', description: 'Papeterie, cartouches', order: 3 },
  { id: 'sub19', categoryId: 'cat4', name: 'Articles jetables', description: 'Vaisselle jetable, emballages', order: 4 },
  { id: 'sub20', categoryId: 'cat4', name: 'Produits d\'hygiène', description: 'Désinfectants, gants, masques', order: 5 },
  
  // Textile & Linge (cat5)
  { id: 'sub21', categoryId: 'cat5', name: 'Linge de lit', description: 'Draps, couettes, oreillers', order: 1 },
  { id: 'sub22', categoryId: 'cat5', name: 'Linge de bain', description: 'Serviettes, peignoirs, tapis de bain', order: 2 },
  { id: 'sub23', categoryId: 'cat5', name: 'Linge de table', description: 'Nappes, serviettes de table', order: 3 },
  { id: 'sub24', categoryId: 'cat5', name: 'Uniformes', description: 'Tenues du personnel', order: 4 },
  { id: 'sub25', categoryId: 'cat5', name: 'Textiles décoratifs', description: 'Rideaux, coussins, plaids', order: 5 },
  
  // Bien-être & Spa (cat6)
  { id: 'sub26', categoryId: 'cat6', name: 'Équipement spa', description: 'Tables de massage, appareils', order: 1 },
  { id: 'sub27', categoryId: 'cat6', name: 'Produits de soin', description: 'Huiles, crèmes, masques', order: 2 },
  { id: 'sub28', categoryId: 'cat6', name: 'Accessoires bien-être', description: 'Peignoirs, chaussons, accessoires', order: 3 },
  { id: 'sub29', categoryId: 'cat6', name: 'Aromathérapie', description: 'Huiles essentielles, diffuseurs', order: 4 },
  { id: 'sub30', categoryId: 'cat6', name: 'Équipement fitness', description: 'Machines, tapis, accessoires', order: 5 },
  
  // Technologie (cat7)
  { id: 'sub31', categoryId: 'cat7', name: 'Informatique', description: 'Ordinateurs, imprimantes, réseaux', order: 1 },
  { id: 'sub32', categoryId: 'cat7', name: 'Télévision & Audio', description: 'TV, systèmes audio, projecteurs', order: 2 },
  { id: 'sub33', categoryId: 'cat7', name: 'Logiciels', description: 'PMS, CRM, logiciels métier', order: 3 },
  { id: 'sub34', categoryId: 'cat7', name: 'Domotique', description: 'Contrôle d\'accès, automatisation', order: 4 },
  { id: 'sub35', categoryId: 'cat7', name: 'Téléphonie', description: 'Systèmes téléphoniques, standard', order: 5 },
  
  // Événementiel (cat8)
  { id: 'sub36', categoryId: 'cat8', name: 'Équipement événementiel', description: 'Mobilier, stands, scène', order: 1 },
  { id: 'sub37', categoryId: 'cat8', name: 'Audio-visuel', description: 'Son, lumière, vidéo', order: 2 },
  { id: 'sub38', categoryId: 'cat8', name: 'Décoration événementielle', description: 'Fleurs, décorations temporaires', order: 3 },
  { id: 'sub39', categoryId: 'cat8', name: 'Traiteur événementiel', description: 'Services de restauration événementielle', order: 4 },
  { id: 'sub40', categoryId: 'cat8', name: 'Animation', description: 'Artistes, animations, spectacles', order: 5 },
  
  // Décoration (cat9)
  { id: 'sub41', categoryId: 'cat9', name: 'Art & Tableaux', description: 'Œuvres d\'art, reproductions', order: 1 },
  { id: 'sub42', categoryId: 'cat9', name: 'Luminaires', description: 'Lampes, suspensions, appliques', order: 2 },
  { id: 'sub43', categoryId: 'cat9', name: 'Plantes & Fleurs', description: 'Plantes, compositions florales', order: 3 },
  { id: 'sub44', categoryId: 'cat9', name: 'Objets décoratifs', description: 'Vases, miroirs, accessoires', order: 4 },
  { id: 'sub45', categoryId: 'cat9', name: 'Revêtements', description: 'Papier peint, peinture, moquette', order: 5 },
  
  // Sécurité (cat10)
  { id: 'sub46', category: 'cat10', name: 'Systèmes de surveillance', description: 'Caméras, moniteurs, enregistreurs', order: 1 },
  { id: 'sub47', category: 'cat10', name: 'Contrôle d\'accès', description: 'Serrures, badges, biométrie', order: 2 },
  { id: 'sub48', category: 'cat10', name: 'Sécurité incendie', description: 'Détecteurs, extincteurs, signalisation', order: 3 },
  { id: 'sub49', category: 'cat10', name: 'Coffres-forts', description: 'Coffres chambres et réception', order: 4 },
  { id: 'sub50', category: 'cat10', name: 'Équipement de sécurité', description: 'EPI, premiers secours, signalétique', order: 5 }
];

// Helper functions
export function getAvailableLocations(hotelId: string): Parameter[] {
  const hotel = hotels.find(h => h.id === hotelId);
  if (!hotel) return [];
  
  // If hotel has specific locations defined, filter by those
  if (hotel.availableLocations) {
    return parameters
      .filter(p => p.type === 'location')
      .filter(p => hotel.availableLocations?.includes(p.id));
  }
  
  // Otherwise return all locations
  return parameters.filter(p => p.type === 'location');
}

export function getAvailableRoomTypes(hotelId: string): Parameter[] {
  const hotel = hotels.find(h => h.id === hotelId);
  if (!hotel) return [];
  
  // If hotel has specific room types defined, filter by those
  if (hotel.availableRoomTypes) {
    return parameters
      .filter(p => p.type === 'room_type')
      .filter(p => hotel.availableRoomTypes?.includes(p.id));
  }
  
  // Otherwise return all room types
  return parameters.filter(p => p.type === 'room_type');
}

export function getAvailableStaff(hotelId: string): User[] {
  return users.filter(user => 
    user.role === 'admin' || 
    user.hotels.includes(hotelId)
  );
}

// Helper function to get parameter label by id
export function getParameterLabel(id: string): string {
  const param = parameters.find(p => p.id === id);
  return param ? param.label : 'Inconnu';
}

// Helper function to get hotel name by id
export function getHotelName(id: string): string {
  const hotel = hotels.find(h => h.id === id);
  return hotel ? hotel.name : 'Inconnu';
}

// Helper function to get user name by id
export function getUserName(id: string): string {
  const user = users.find(u => u.id === id);
  return user ? user.name : 'Inconnu';
}

// Helper function to get module name by id
export function getModuleName(id: string): string {
  const module = modules.find(m => m.id === id);
  return module ? module.name : 'Inconnu';
}

// Helper function to get service name by id
export function getServiceName(id: string): string {
  const service = hotelServices.find(s => s.id === id);
  return service ? service.name : 'Inconnu';
}

// Helper function to get supplier category name by subcategory id
export function getSupplierCategoryName(subcategoryId: string): string {
  const subcategory = supplierSubcategories.find(sub => sub.id === subcategoryId);
  if (!subcategory) return 'Inconnu';
  
  const category = supplierCategories.find(cat => cat.id === subcategory.categoryId);
  return category ? category.name : 'Inconnu';
}

// Helper function to get supplier subcategory name by id
export function getSupplierSubcategoryName(id: string): string {
  const subcategory = supplierSubcategories.find(sub => sub.id === id);
  return subcategory ? subcategory.name : 'Inconnu';
}

// Generate mock data for testing (will be replaced with Firebase data)
export const incidents = [];
export const maintenanceRequests = [];
export const qualityVisits = [];
export const lostItems = [];
export const procedures = [];
export const suppliers = [];