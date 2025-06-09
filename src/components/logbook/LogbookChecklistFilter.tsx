import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { getHotels } from '@/lib/db/hotels';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';

interface LogbookChecklistFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterHotel: string;
  onHotelChange: (value: string) => void;
  filterService: string;
  onServiceChange: (value: string) => void;
  onReset: () => void;
}

const LogbookChecklistFilter: React.FC<LogbookChecklistFilterProps> = ({
  searchQuery,
  onSearchChange,
  filterHotel,
  onHotelChange,
  filterService,
  onServiceChange,
  onReset
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load hotels on mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        const hotelsData = await getHotels();
        
        // Filter hotels based on user's permissions
        if (currentUser?.role === 'admin') {
          setHotels(hotelsData);
        } else if (currentUser) {
          const userHotels = hotelsData.filter(hotel => 
            currentUser.hotels.includes(hotel.id)
          );
          setHotels(userHotels);
          
          // If user has only one hotel, automatically select it
          if (userHotels.length === 1 && filterHotel === 'all') {
            onHotelChange(userHotels[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les hôtels",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadHotels();
  }, [toast, currentUser, filterHotel, onHotelChange]);

  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher une tâche..."
          className="pl-8 w-full"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Select value={filterHotel} onValueChange={onHotelChange} disabled={hotels.length === 0 || hotels.length === 1}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={loading ? "Chargement..." : "Tous les hôtels"} />
        </SelectTrigger>
        <SelectContent>
          {hotels.length > 1 && <SelectItem value="all">Tous les hôtels</SelectItem>}
          {hotels.map(hotel => (
            <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filterService} onValueChange={onServiceChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tous les services" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les services</SelectItem>
          <SelectItem value="important">⚠️ Important</SelectItem>
          <SelectItem value="reception">👥 Réception</SelectItem>
          <SelectItem value="housekeeping">🛏️ Housekeeping</SelectItem>
          <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
          <SelectItem value="technical">🔧 Technique</SelectItem>
          <SelectItem value="direction">👑 Direction</SelectItem>
        </SelectContent>
      </Select>
      
      <Button variant="outline" size="icon" onClick={onReset}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LogbookChecklistFilter;