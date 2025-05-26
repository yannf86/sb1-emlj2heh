import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building, Bed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRoomTypeParameters } from '@/lib/db/parameters-room-type';
import { getHotelRoomTypes, updateHotelRoomTypes } from '@/lib/db/hotel-room-types';

interface HotelRoomTypesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: {
    id: string;
    name: string;
  };
}

const HotelRoomTypesDialog: React.FC<HotelRoomTypesDialogProps> = ({
  isOpen,
  onClose,
  hotel
}) => {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load room types and hotel's current room types
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all available room types
        const allRoomTypes = await getRoomTypeParameters();
        setRoomTypes(allRoomTypes);
        
        // Load hotel's current room types
        const hotelRoomTypes = await getHotelRoomTypes(hotel.id);
        setSelectedRoomTypes(hotelRoomTypes.map(rt => rt.room_type_id));
      } catch (error) {
        console.error('Error loading room types:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les types de chambre disponibles",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, hotel.id, toast]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update hotel room types
      await updateHotelRoomTypes(hotel.id, selectedRoomTypes);
      
      toast({
        title: "Types de chambre mis à jour",
        description: "Les types de chambre de l'hôtel ont été mis à jour avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating hotel room types:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des types de chambre",
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
            <p>Chargement des types de chambre disponibles...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les types de chambre</DialogTitle>
          <DialogDescription>
            Sélectionnez les types de chambre disponibles pour cet hôtel
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4 bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-2">
            <Building className="h-5 w-5 mr-2 text-brand-500" />
            <span className="font-medium">{hotel.name}</span>
          </div>
          
          <div className="space-y-4">
            {roomTypes.map(roomType => (
              <div key={roomType.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Bed className="h-4 w-4 text-slate-500" />
                  <Label htmlFor={roomType.id} className="cursor-pointer">
                    {roomType.label}
                  </Label>
                </div>
                <Switch
                  id={roomType.id}
                  checked={selectedRoomTypes.includes(roomType.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRoomTypes(prev => [...prev, roomType.id]);
                    } else {
                      setSelectedRoomTypes(prev => prev.filter(id => id !== roomType.id));
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

export default HotelRoomTypesDialog;