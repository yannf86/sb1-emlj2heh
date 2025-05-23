import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { getHotels } from '@/lib/db/hotels';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getImpactParameters } from '@/lib/db/parameters-impact';
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
  filtersExpanded,
  onFiltersExpandedChange,
  onReset
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [categoryParams, setCategoryParams] = useState<any[]>([]);
  const [impactParams, setImpactParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load data from Firebase collections
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels
        const hotelsData = await getHotels();
        
        // Filter hotels based on user permissions
        if (currentUser?.role === 'admin') {
          setHotels(hotelsData);
        } else if (currentUser) {
          const filteredHotels = hotelsData.filter(hotel => 
            currentUser.hotels.includes(hotel.id)
          );
          setHotels(filteredHotels);
        } else {
          setHotels([]);
        }
        
        // Load status parameters from parameters_status collection
        const statusData = await getStatusParameters();
        setStatusParams(statusData);
        
        // Load category parameters from parameters_incident_category collection
        const categoryData = await getIncidentCategoryParameters();
        setCategoryParams(categoryData);
        
        // Load impact parameters from parameters_impact collection
        const impactData = await getImpactParameters();
        setImpactParams(impactData);
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
  }, [toast, currentUser]);

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
            <label className="text-sm font-medium mb-1 block">Statut</label>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statusParams.map(status => (
                  <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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