import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getHotels } from '@/lib/db/hotels';
import { getLocationHotels, updateLocationHotels } from '@/lib/db/location-hotels';

interface LocationHotelsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    id: string;
    label: string;
  };
}

const LocationHotelsDialog: React.FC<LocationHotelsDialogProps> = ({
  isOpen,
  onClose,
  location
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load hotels and location's current hotels
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all available hotels
        const allHotels = await getHotels();
        setHotels(allHotels);
        
        // Load location's current hotels
        const locationHotels = await getLocationHotels(location.id);
        setSelectedHotels(locationHotels.map(h => h.hotel_id));
      } catch (error) {
        console.error('Error loading hotels:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les hôtels disponibles",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, location.id]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update location hotels
      await updateLocationHotels(location.id, selectedHotels);
      
      toast({
        title: "Hôtels mis à jour",
        description: "Les hôtels associés au lieu ont été mis à jour avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating location hotels:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des hôtels",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p>Chargement des hôtels disponibles...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les hôtels</DialogTitle>
          <DialogDescription>
            Sélectionnez les hôtels où ce lieu est disponible
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4 bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-2">
            <MapPin className="h-5 w-5 mr-2 text-brand-500" />
            <span className="font-medium">{location.label}</span>
          </div>
          
          <div className="space-y-4">
            {hotels.map(hotel => (
              <div key={hotel.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-slate-500" />
                  <Label htmlFor={hotel.id} className="cursor-pointer">
                    {hotel.name}
                  </Label>
                </div>
                <Switch
                  id={hotel.id}
                  checked={selectedHotels.includes(hotel.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedHotels(prev => [...prev, hotel.id]);
                    } else {
                      setSelectedHotels(prev => prev.filter(id => id !== hotel.id));
                    }
                  }}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationHotelsDialog;