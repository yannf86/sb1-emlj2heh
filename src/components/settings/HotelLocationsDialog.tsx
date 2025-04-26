import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLocationParameters } from '@/lib/db/parameters-locations';
import { getHotelLocations, updateHotelLocations } from '@/lib/db/hotel-locations';

interface HotelLocationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: {
    id: string;
    name: string;
  };
}

const HotelLocationsDialog: React.FC<HotelLocationsDialogProps> = ({
  isOpen,
  onClose,
  hotel
}) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load locations and hotel's current locations
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all available locations
        const allLocations = await getLocationParameters();
        setLocations(allLocations);
        
        // Load hotel's current locations
        const hotelLocations = await getHotelLocations(hotel.id);
        setSelectedLocations(hotelLocations.map(loc => loc.location_id));
      } catch (error) {
        console.error('Error loading locations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les lieux disponibles",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, hotel.id]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update hotel locations
      await updateHotelLocations(hotel.id, selectedLocations);
      
      toast({
        title: "Lieux mis à jour",
        description: "Les lieux de l'hôtel ont été mis à jour avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating hotel locations:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des lieux",
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
            <p>Chargement des lieux disponibles...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les lieux</DialogTitle>
          <DialogDescription>
            Sélectionnez les lieux disponibles pour cet hôtel
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4 bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-2">
            <Building className="h-5 w-5 mr-2 text-brand-500" />
            <span className="font-medium">{hotel.name}</span>
          </div>
          
          <div className="space-y-4">
            {locations.map(location => (
              <div key={location.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <Label htmlFor={location.id} className="cursor-pointer">
                    {location.label}
                  </Label>
                </div>
                <Switch
                  id={location.id}
                  checked={selectedLocations.includes(location.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLocations(prev => [...prev, location.id]);
                    } else {
                      setSelectedLocations(prev => prev.filter(id => id !== location.id));
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

export default HotelLocationsDialog;