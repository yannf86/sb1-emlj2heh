import { useState, useCallback } from 'react';
import { Supplier, SupplierFilters } from '../types/supplier.types';

export const useSupplierList = (suppliers: Supplier[]) => {
  const [filters, setFilters] = useState<SupplierFilters>({
    searchQuery: '',
    filterActive: 'all',
    filtersExpanded: false
  });

  const filteredSuppliers = useCallback(() => {
    return suppliers.filter(supplier => {
      // Filter by active status
      if (filters.filterActive !== 'all') {
        if (filters.filterActive === 'active' && !supplier.active) return false;
        if (filters.filterActive === 'inactive' && supplier.active) return false;
      }
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = supplier.companyName.toLowerCase().includes(query);
        const matchesDescription = supplier.description.toLowerCase().includes(query);
        const matchesCity = supplier.city.toLowerCase().includes(query);
        
        if (!matchesName && !matchesDescription && !matchesCity) return false;
      }
      
      return true;
    });
  }, [suppliers, filters]);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      filterActive: 'all',
      filtersExpanded: false
    });
  };

  return {
    filters,
    setFilters,
    filteredSuppliers: filteredSuppliers(),
    resetFilters
  };
};