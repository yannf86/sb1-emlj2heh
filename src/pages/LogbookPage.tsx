import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { getHotels } from '@/lib/db/hotels';

// Importer uniquement le composant ConsignesTab
import ConsignesTab from '@/components/logbook/ConsignesTab';

// Constant mock data - should be replaced by real data from Firebase
const SERVICES = [
  { id: 'important', name: 'Important', icon: '⚠️' },
  { id: 'reception', name: 'Réception', icon: '👥' },
  { id: 'housekeeping', name: 'Housekeeping', icon: '🛏️' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'technical', name: 'Technique', icon: '🔧' },
  { id: 'direction', name: 'Direction', icon: '👑' }
];

const LogbookPage = () => {
  const { toast } = useToast();
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = getCurrentUser();
  
  // Charger les hôtels accessibles à l'utilisateur au montage du composant
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les hôtels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Si l'utilisateur n'a accès qu'à un seul hôtel, le sélectionner automatiquement
        if (hotelsData.length === 1) {
          setSelectedHotel(hotelsData[0].id);
        } else if (currentUser?.hotels.length === 1) {
          setSelectedHotel(currentUser.hotels[0]);
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
        setError('Impossible de charger les hôtels. Veuillez réessayer plus tard.');
        toast({
          title: "Erreur",
          description: "Impossible de charger les hôtels.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadHotels();
  }, [toast, currentUser]);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cahier de Consignes</h1>
          <p className="text-muted-foreground">Gérez et partagez les consignes quotidiennes entre services</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-medium">Chargement des données...</p>
            <p className="text-sm text-muted-foreground mt-2">Veuillez patienter...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cahier de Consignes</h1>
          <p className="text-muted-foreground">Gérez et partagez les consignes quotidiennes entre services</p>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cahier de Consignes</h1>
        <p className="text-muted-foreground">Gérez et partagez les consignes quotidiennes entre services</p>
      </div>
      
      {/* Afficher directement le composant ConsignesTab sans tabs */}
      <ConsignesTab 
        hotelId={selectedHotel}
        services={SERVICES}
      />
    </div>
  );
};

export default LogbookPage;