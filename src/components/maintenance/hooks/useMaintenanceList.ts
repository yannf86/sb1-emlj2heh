import { useState, useCallback } from 'react';
import { Maintenance, MaintenanceFilters } from '../types/maintenance.types';

export const useMaintenanceList = (maintenanceRequests: Maintenance[]) => {
  const [filters, setFilters] = useState<MaintenanceFilters>({
    searchQuery: '',
    filterHotel: 'all',
    filterStatus: 'all',
    filterType: 'all',
    filterAssignedUser: 'all',
    filterTechnician: 'all',
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
      
      // Filter by assigned user
      if (filters.filterAssignedUser === 'none' && request.assignedUserId) return false;
      if (filters.filterAssignedUser !== 'all' && filters.filterAssignedUser !== 'none' && 
          request.assignedUserId !== filters.filterAssignedUser) return false;
      
      // Filter by technician
      if (filters.filterTechnician === 'none' && 
          (request.technicianId || (request.technicianIds && request.technicianIds.length > 0))) {
        return false;
      }
      
      if (filters.filterTechnician !== 'all' && filters.filterTechnician !== 'none') {
        // Check in both technicianId (legacy) and technicianIds array
        const inTechnicianId = request.technicianId === filters.filterTechnician;
        const inTechnicianIds = request.technicianIds && 
                               request.technicianIds.includes(filters.filterTechnician);
        
        if (!inTechnicianId && !inTechnicianIds) return false;
      }
      
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
      filterAssignedUser: 'all',
      filterTechnician: 'all',
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