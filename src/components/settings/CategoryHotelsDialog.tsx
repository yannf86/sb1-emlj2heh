import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tag, Building, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getHotels } from '@/lib/db/hotels';
import { getCategoryHotels, updateCategoryHotels } from '@/lib/db/hotel-incident-categories';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CategoryHotelsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: string;
    label: string;
  };
}

const CategoryHotelsDialog: React.FC<CategoryHotelsDialogProps> = ({
  isOpen,
  onClose,
  category
}) => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [initialHotels, setInitialHotels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load hotels and category's current hotels
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all available hotels
        const allHotels = await getHotels();
        setHotels(allHotels);
        
        // Load category's current hotels
        const categoryHotels = await getCategoryHotels(category.id);
        
        // Extract hotel IDs from the results
        const hotelIds = categoryHotels.map(item => item.hotel_id);
        setSelectedHotels(hotelIds);
        setInitialHotels(hotelIds);
      } catch (error) {
        console.error('Error loading hotels:', error);
        setError("Impossible de charger les hôtels disponibles. Veuillez réessayer.");
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
  }, [isOpen, category.id, toast]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Use the dedicated updateCategoryHotels function
      await updateCategoryHotels(category.id, selectedHotels);
      
      toast({
        title: "Hôtels mis à jour",
        description: "Les hôtels associés à cette catégorie ont été mis à jour avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating category hotels:', error);
      setError("Une erreur est survenue lors de la mise à jour des hôtels. Veuillez réessayer.");
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
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
            Sélectionnez les hôtels où cette catégorie d'incident est disponible
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        
          <div className="flex items-center mb-4 bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-2">
            <Tag className="h-5 w-5 mr-2 text-brand-500" />
            <span className="font-medium">{category.label}</span>
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
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryHotelsDialog;