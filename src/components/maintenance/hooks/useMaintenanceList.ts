import { useState, useCallback } from 'react';
import { Maintenance, MaintenanceFilters } from '../types/maintenance.types';

export const useMaintenanceList = (maintenanceRequests: Maintenance[]) => {
  const [filters, setFilters] = useState<MaintenanceFilters>({
    searchQuery: '',
    filterHotel: 'all',
    filterStatus: 'all',
    filterType: 'all',
    filtersExpanded: false
  });

  const filteredRequests = useCallback(() => {
    return maintenanceRequests.filter(request => {
      // Filter by hotel
      if (filters.filterHotel !== 'all' && request.hotelId !== filters.filterHotel) return false;
      
      // Filter by status
      if (filters.filterStatus !== 'all' && request.statusId !== filters.filterStatus) return false;
      
      // Filter by intervention type
      if (filters.filterType !== 'all' && request.interventionTypeId !== filters.filterType) return false;
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesDescription = request.description.toLowerCase().includes(query);
        
        if (!matchesDescription) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenanceRequests, filters]);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      filterHotel: 'all',
      filterStatus: 'all',
      filterType: 'all',
      filtersExpanded: false
    });
  };

  return {
    filters,
    setFilters,
    filteredRequests: filteredRequests(),
    resetFilters
  };
};