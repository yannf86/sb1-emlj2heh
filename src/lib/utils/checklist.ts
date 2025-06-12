/**
 * Utilitaires pour la gestion des check-lists
 */

/**
 * Calcule le pourcentage de complétion pour une liste d'éléments
 * @param items Liste d'items de check-list
 * @returns Pourcentage de complétion (0-100)
 */
export const calculateCompletionPercentage = (items: any[]): number => {
  if (!items || items.length === 0) return 0;
  
  const completedItems = items.filter(item => item.completed);
  return Math.round((completedItems.length / items.length) * 100);
};

/**
 * Filtre les items de checklist en fonction d'une recherche
 * @param items Liste d'items à filtrer
 * @param searchQuery Texte de recherche
 * @returns Liste d'items filtrés
 */
export const filterItemsBySearchQuery = (items: any[], searchQuery: string): any[] => {
  if (!searchQuery) return items;
  
  const query = searchQuery.toLowerCase();
  return items.filter(item => 
    item.title.toLowerCase().includes(query) || 
    (item.description && item.description.toLowerCase().includes(query))
  );
};

/**
 * Regroupe les items par service
 * @param items Liste d'items à grouper
 * @returns Objet avec les items regroupés par serviceId
 */
export const groupItemsByService = (items: any[]): Record<string, any[]> => {
  return items.reduce((groups, item) => {
    const serviceId = item.serviceId;
    if (!groups[serviceId]) {
      groups[serviceId] = [];
    }
    groups[serviceId].push(item);
    return groups;
  }, {});
};

/**
 * Filtre les services en fonction d'une recherche sur leurs items
 * @param groupedItems Items regroupés par service
 * @param searchQuery Texte de recherche
 * @returns Liste de serviceIds filtrés
 */
export const filterServicesBySearchQuery = (groupedItems: Record<string, any[]>, searchQuery: string): string[] => {
  if (!searchQuery) return Object.keys(groupedItems);
  
  const query = searchQuery.toLowerCase();
  return Object.keys(groupedItems).filter(serviceId => 
    groupedItems[serviceId].some(item => 
      item.title.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query))
    )
  );
};