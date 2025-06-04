import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, RefreshCw, User, Wrench } from 'lucide-react';
import { parameters } from '@/lib/data';
import { getHotels } from '@/lib/db/hotels';
import { getUsers } from '@/lib/db/users';
import { getTechnicians } from '@/lib/db/technicians';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';

interface MaintenanceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterHotel: string;
  onHotelChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  filterAssignedUser: string; // NOUVEAU: filtre par utilisateur assigné
  onAssignedUserChange: (value: string) => void; // NOUVEAU: fonction pour changer l'utilisateur assigné
  filterTechnician: string; // NOUVEAU: filtre par technicien
  onTechnicianChange: (value: string) => void; // NOUVEAU: fonction pour changer le technicien
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
  filterTechnician,
  onTechnicianChange,
  filtersExpanded,
  onFiltersExpandedChange,
  onReset
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const statusParams = parameters.filter(p => p.type === 'status');
  const interventionTypeParams = parameters.filter(p => p.type === 'intervention_type');

  // Load hotels from Firestore
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        const hotelsData = await getHotels();
        
        // Filter hotels based on user's permissions
        if (currentUser?.role === 'admin') {
          setHotels(hotelsData);
        } else if (currentUser) {
          const filteredHotels = hotelsData.filter(hotel => 
            currentUser.hotels.includes(hotel.id)
          );
          setHotels(filteredHotels);
        }
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
  }, [toast, currentUser]);
  
  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    
    loadUsers();
  }, []);

  // Load technicians
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const techniciansData = await getTechnicians();
        setTechnicians(techniciansData);
      } catch (error) {
        console.error('Error loading technicians:', error);
      }
    };
    
    loadTechnicians();
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md">
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
          
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center">
              <Wrench className="h-4 w-4 mr-1 text-muted-foreground" />
              Technicien
            </label>
            <Select value={filterTechnician} onValueChange={onTechnicianChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les techniciens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les techniciens</SelectItem>
                <SelectItem value="none">Non assigné</SelectItem>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}{tech.company ? ` (${tech.company})` : ''}
                  </SelectItem>
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