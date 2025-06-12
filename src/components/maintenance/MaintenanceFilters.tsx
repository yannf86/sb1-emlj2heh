import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, RefreshCw, User, Wrench } from 'lucide-react';
import { getHotels } from '@/lib/db/hotels';
import { getUsers } from '@/lib/db/users';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { getStatusParameters, findStatusIdByCode } from '@/lib/db/parameters-status';
import { getInterventionTypeParameters } from '@/lib/db/parameters-intervention-type';

interface MaintenanceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterHotel: string;
  onHotelChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  filterAssignedUser: string;
  onAssignedUserChange: (value: string) => void;
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
  filterAssignedUser,
  onAssignedUserChange,
  filtersExpanded,
  onFiltersExpandedChange,
  onReset
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [interventionTypeParams, setInterventionTypeParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inProgressStatusId, setInProgressStatusId] = useState<string | null>(null);
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
        const interventionTypeData = await getInterventionTypeParameters();
        setInterventionTypeParams(interventionTypeData);
        
        // Load users
        const usersData = await getUsers();
        setUsers(usersData);
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
          
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center">
              <User className="h-4 w-4 mr-1 text-muted-foreground" />
              Assigné à
            </label>
            <Select value={filterAssignedUser} onValueChange={onAssignedUserChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les utilisateurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                <SelectItem value="none">Non assigné</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
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