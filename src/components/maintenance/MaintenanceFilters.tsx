import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { parameters } from '@/lib/data';
import { getHotels } from '@/lib/db/hotels';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterHotel: string;
  onHotelChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (value: boolean) => void;
  onReset: () => void;
}

const MaintenanceFilters: React.FC<MaintenanceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterHotel,
  onHotelChange,
  filterStatus,
  onStatusChange,
  filterType,
  onTypeChange,
  filtersExpanded,
  onFiltersExpandedChange,
  onReset
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const statusParams = parameters.filter(p => p.type === 'status');
  const interventionTypeParams = parameters.filter(p => p.type === 'intervention_type');

  // Load hotels from Firebase
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        const hotelsData = await getHotels();
        setHotels(hotelsData);
      } catch (error) {
        console.error('Error loading hotels:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des hôtels",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadHotels();
  }, [toast]);

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
        
        <Select value={filterHotel} onValueChange={onHotelChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les hôtels" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border rounded-md">
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
            <label className="text-sm font-medium mb-1 block">Type d'intervention</label>
            <Select value={filterType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {interventionTypeParams.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceFilters;