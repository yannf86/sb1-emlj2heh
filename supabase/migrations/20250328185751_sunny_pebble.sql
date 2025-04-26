/*
  # Insert Static Data

  1. New Data
    - Insert initial users
    - Insert hotels
    - Insert modules
    - Insert hotel services
    - Insert parameters
    - Insert supplier categories and subcategories

  2. Changes
    - Initial data population
*/

-- Insert initial admin user
INSERT INTO users (id, name, email, role, hotels, modules, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin Test',
  'admin@test.com',
  'admin',
  ARRAY(SELECT id FROM hotels),
  ARRAY(SELECT id FROM modules),
  true
);

-- Insert initial standard user
INSERT INTO users (id, name, email, role, hotels, modules, active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'User Test',
  'user@test.com',
  'standard',
  ARRAY['hotel1', 'hotel2'],
  ARRAY['mod1', 'mod2', 'mod3', 'mod4', 'mod5'],
  true
);

-- Insert hotels
INSERT INTO hotels (id, name, address, city, country, image_url)
VALUES
  ('hotel1', 'Hôtel Royal Palace', '15 Avenue des Champs-Élysées', 'Paris', 'France', 'https://images.unsplash.com/photo-1566073771259-6a8506099945'),
  ('hotel2', 'Riviera Luxury Hotel', '23 Promenade des Anglais', 'Nice', 'France', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'),
  ('hotel3', 'Mountain View Resort', '42 Route des Alpes', 'Chamonix', 'France', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'),
  ('hotel4', 'Bordeaux Grand Hotel', '78 Quai des Chartrons', 'Bordeaux', 'France', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791');

-- Insert modules
INSERT INTO modules (id, name, code, icon, active, "order")
VALUES
  ('mod1', 'Tableau de Bord', 'dashboard', 'layout-dashboard', true, 1),
  ('mod2', 'Suivi Incidents', 'incidents', 'alert-triangle', true, 2),
  ('mod3', 'Suivi Technique', 'maintenance', 'tool', true, 3),
  ('mod4', 'Visites Qualité', 'quality', 'clipboard-check', true, 4),
  ('mod5', 'Objets Trouvés', 'lost-found', 'search', true, 5),
  ('mod6', 'Procédures', 'procedures', 'file-text', true, 6),
  ('mod7', 'Statistiques', 'statistics', 'bar-chart', true, 7),
  ('mod8', 'Paramètres', 'settings', 'settings', true, 8),
  ('mod9', 'Gestion des Utilisateurs', 'users', 'users', true, 9),
  ('mod10', 'Gamification', 'gamification', 'trophy', true, 10),
  ('mod11', 'Fournisseurs', 'suppliers', 'truck', true, 11);

-- Insert hotel services
INSERT INTO hotel_services (id, name, code, icon, "order")
VALUES
  ('serv1', 'Réception', 'reception', '👥', 1),
  ('serv2', 'Housekeeping', 'housekeeping', '🛏️', 2),
  ('serv3', 'Restauration', 'restaurant', '🍽️', 3),
  ('serv4', 'Technique', 'maintenance', '🔧', 4),
  ('serv5', 'Sécurité', 'security', '🛡️', 5),
  ('serv6', 'Spa & Bien-être', 'spa', '💆', 6),
  ('serv7', 'Événementiel', 'events', '🎪', 7),
  ('serv8', 'Commercial', 'sales', '💼', 8),
  ('serv9', 'Administration', 'admin', '📊', 9);

-- Insert parameters
-- Locations
INSERT INTO parameters (type, code, label, active, "order")
VALUES
  ('location', 'lobby', 'Hall d''accueil', true, 1),
  ('location', 'room', 'Chambre', true, 2),
  ('location', 'restaurant', 'Restaurant', true, 3),
  ('location', 'bar', 'Bar', true, 4),
  ('location', 'pool', 'Piscine', true, 5),
  ('location', 'spa', 'Spa', true, 6),
  ('location', 'gym', 'Salle de sport', true, 7),
  ('location', 'parking', 'Parking', true, 8);

-- Room types
INSERT INTO parameters (type, code, label, active, "order")
VALUES
  ('room_type', 'standard', 'Chambre Standard', true, 1),
  ('room_type', 'superior', 'Chambre Supérieure', true, 2),
  ('room_type', 'deluxe', 'Chambre Deluxe', true, 3),
  ('room_type', 'suite', 'Suite', true, 4),
  ('room_type', 'junior_suite', 'Suite Junior', true, 5);

-- Incident categories
INSERT INTO parameters (type, code, label, active, "order")
VALUES
  ('incident_category', 'cleanliness', 'Propreté', true, 1),
  ('incident_category', 'technical', 'Problème technique', true, 2),
  ('incident_category', 'service', 'Service', true, 3),
  ('incident_category', 'noise', 'Bruit', true, 4),
  ('incident_category', 'food', 'Nourriture', true, 5);

-- Impact levels
INSERT INTO parameters (type, code, label, active, "order")
VALUES
  ('impact', 'low', 'Faible', true, 1),
  ('impact', 'medium', 'Moyen', true, 2),
  ('impact', 'high', 'Élevé', true, 3),
  ('impact', 'critical', 'Critique', true, 4);

-- Status
INSERT INTO parameters (type, code, label, active, "order")
VALUES
  ('status', 'open', 'Ouvert', true, 1),
  ('status', 'in_progress', 'En cours', true, 2),
  ('status', 'resolved', 'Résolu', true, 3),
  ('status', 'closed', 'Fermé', true, 4),
  ('status', 'cancelled', 'Annulé', true, 5);

-- Insert other parameter types...
-- (Add remaining parameter types from the static data)

-- Insert supplier categories
INSERT INTO supplier_categories (id, name, icon, "order")
VALUES
  ('cat1', 'Alimentaire', '🍽️', 1),
  ('cat2', 'Équipement', '🛠️', 2),
  ('cat3', 'Services', '🔧', 3),
  ('cat4', 'Consommables', '📦', 4),
  ('cat5', 'Textile & Linge', '🧺', 5),
  ('cat6', 'Bien-être & Spa', '💆', 6),
  ('cat7', 'Technologie', '💻', 7),
  ('cat8', 'Événementiel', '🎪', 8),
  ('cat9', 'Décoration', '🎨', 9),
  ('cat10', 'Sécurité', '🔒', 10);

-- Insert supplier subcategories
INSERT INTO supplier_subcategories (id, category_id, name, description, "order")
VALUES
  -- Alimentaire (cat1)
  ('sub1', 'cat1', 'Produits frais', 'Fruits, légumes, viandes, poissons', 1),
  ('sub2', 'cat1', 'Boissons', 'Alcools, softs, eaux, cafés, thés', 2),
  ('sub3', 'cat1', 'Épicerie', 'Produits secs, conserves, condiments', 3),
  ('sub4', 'cat1', 'Produits laitiers', 'Lait, fromages, yaourts, crèmes', 4),
  ('sub5', 'cat1', 'Boulangerie & Pâtisserie', 'Pains, viennoiseries, pâtisseries', 5);

-- Insert remaining subcategories...
-- (Add remaining subcategories from the static data)