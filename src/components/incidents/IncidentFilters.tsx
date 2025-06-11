import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, RefreshCw, Calendar } from 'lucide-react';
import { parameters } from '@/lib/data';
import { getHotels } from '@/lib/db/hotels';
import { getHotelIncidentCategories } from '@/lib/db/hotel-incident-categories';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getImpactParameters } from '@/lib/db/parameters-impact';
import { getStatusParameters, findStatusIdByCode } from '@/lib/db/parameters-status';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';

interface IncidentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterHotel: string;
  onHotelChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  filterImpact: string;
  onImpactChange: (value: string) => void;
  filterDateRange: string;
  onDateRangeChange: (value: string) => void;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (value: boolean) => void;
  onReset: () => void;
}

const IncidentFilters: React.FC<IncidentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterHotel,
  onHotelChange,
  filterStatus,
  onStatusChange,
  filterCategory,
  onCategoryChange,
  filterImpact,
  onImpactChange,
  filterDateRange,
  onDateRangeChange,
  filtersExpanded,
  onFiltersExpandedChange,
  onReset
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [categoryParams, setCategoryParams] = useState<any[]>([]);
  const [impactParams, setImpactParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgressStatusId, setInProgressStatusId] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load data from Firebase collections
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels - this function now filters by user permissions
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load status parameters from parameters_status collection
        const statusData = await getStatusParameters();
        setStatusParams(statusData);
        
        // Find the "En cours" status ID
        const inProgressId = await findStatusIdByCode('in_progress');
        if (inProgressId) {
          setInProgressStatusId(inProgressId);
          
          // If filterStatus is empty, set it to the "En cours" status
          if (filterStatus === '') {
            onStatusChange(inProgressId);
          }
        }
        
        // Load impact parameters from parameters_impact collection
        const impactData = await getImpactParameters();
        setImpactParams(impactData);
        
        // Initially load all categories
        const categoryData = await getIncidentCategoryParameters();
        setCategoryParams(categoryData);
      } catch (error) {
        console.error('Error loading filters data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données pour les filtres",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast, currentUser, filterStatus, onStatusChange]);
  
  // When hotel selection changes, update available categories
  useEffect(() => {
    const loadHotelCategories = async () => {
      if (filterHotel === 'all') {
        // If "all hotels" is selected, load all categories
        try {
          const allCategories = await getIncidentCategoryParameters();
          setCategoryParams(allCategories);
        } catch (error) {
          console.error('Error loading all categories:', error);
        }
        return;
      }
      
      try {
        // Get hotel-specific categories
        const hotelCategories = await getHotelIncidentCategories(filterHotel);
        
        if (hotelCategories.length === 0) {
          // If no categories are defined for this hotel, show all categories
          const allCategories = await getIncidentCategoryParameters();
          setCategoryParams(allCategories);
          return;
        }
        
        // Get the full category objects for the IDs
        const categoryIds = hotelCategories.map(hc => hc.category_id);
        const allCategories = await getIncidentCategoryParameters();
        const filteredCategories = allCategories.filter(cat => 
          categoryIds.includes(cat.id)
        );
        
        setCategoryParams(filteredCategories);
        
        // If the currently selected category is not in the filtered list, reset it
        if (filterCategory !== 'all' && !categoryIds.includes(filterCategory)) {
          onCategoryChange('all');
        }
      } catch (error) {
        console.error('Error loading hotel categories:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories pour cet hôtel",
          variant: "destructive",
        });
      }
    };
    
    loadHotelCategories();
  }, [filterHotel, filterCategory, onCategoryChange, toast]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select value={filterHotel} onValueChange={onHotelChange} disabled={hotels.length === 0}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={loading ? "Chargement..." : "Tous les hôtels"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les hôtels</SelectItem>
            {hotels.map(hotel => (
              <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={onStatusChange} disabled={statusParams.length === 0}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={loading ? "Chargement..." : "Tous les statuts"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {statusParams.map(status => (
              <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterDateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">3 derniers mois</SelectItem>
            <SelectItem value="180">6 derniers mois</SelectItem>
            <SelectItem value="365">12 derniers mois</SelectItem>
            <SelectItem value="all">Tous les incidents</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon" onClick={() => onFiltersExpandedChange(!filtersExpanded)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon" onClick={onReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {filtersExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border rounded-md">
          <div>
            <label className="text-sm font-medium mb-1 block">Catégorie</label>
            <Select value={filterCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categoryParams.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Impact</label>
            <Select value={filterImpact} onValueChange={onImpactChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les impacts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les impacts</SelectItem>
                {impactParams.map(impact => (
                  <SelectItem key={impact.id} value={impact.id}>{impact.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentFilters;