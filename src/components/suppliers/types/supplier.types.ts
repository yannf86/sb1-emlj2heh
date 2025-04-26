export interface Supplier {
  id: string;
  companyName: string;
  description: string;
  subcategoryId: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  active: boolean;
  hotelIds: string[];
  contractIds: string[];
}

export interface SupplierFormData {
  companyName: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  hotelIds: string[];
}

export interface SupplierFilters {
  searchQuery: string;
  filterActive: 'all' | 'active' | 'inactive';
  filtersExpanded: boolean;
}