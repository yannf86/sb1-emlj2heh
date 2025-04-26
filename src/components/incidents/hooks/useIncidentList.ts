import { useState, useCallback } from 'react';
import { Incident, IncidentFilters } from '../types/incident.types';

export const useIncidentList = (incidents: Incident[]) => {
  const [filters, setFilters] = useState<IncidentFilters>({
    searchQuery: '',
    filterHotel: 'all',
    filterStatus: 'all',
    filterCategory: 'all',
    filterImpact: 'all',
    filtersExpanded: false
  });

  const filteredIncidents = useCallback(() => {
    return incidents.filter(incident => {
      // Filter by hotel
      if (filters.filterHotel !== 'all' && incident.hotelId !== filters.filterHotel) return false;
      
      // Filter by status
      if (filters.filterStatus !== 'all' && incident.statusId !== filters.filterStatus) return false;
      
      // Filter by category
      if (filters.filterCategory !== 'all' && incident.categoryId !== filters.filterCategory) return false;
      
      // Filter by impact
      if (filters.filterImpact !== 'all' && incident.impactId !== filters.filterImpact) return false;
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesDescription = incident.description.toLowerCase().includes(query);
        const matchesClient = incident.clientName ? incident.clientName.toLowerCase().includes(query) : false;
        
        if (!matchesDescription && !matchesClient) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incidents, filters]);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      filterHotel: 'all',
      filterStatus: 'all',
      filterCategory: 'all',
      filterImpact: 'all',
      filtersExpanded: false
    });
  };

  return {
    filters,
    setFilters,
    filteredIncidents: filteredIncidents(),
    resetFilters
  };
};