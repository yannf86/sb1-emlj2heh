import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building, Tag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getHotelIncidentCategories, updateHotelIncidentCategories } from '@/lib/db/hotel-incident-categories';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HotelCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: {
    id: string;
    name: string;
  };
}

const HotelCategoryDialog: React.FC<HotelCategoryDialogProps> = ({
  isOpen,
  onClose,
  hotel
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialCategories, setInitialCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load categories and hotel's current categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all available categories
        const allCategories = await getIncidentCategoryParameters();
        setCategories(allCategories);
        
        // Load hotel's current categories
        const hotelCategories = await getHotelIncidentCategories(hotel.id);
        const categoryIds = hotelCategories.map(cat => cat.category_id);
        setSelectedCategories(categoryIds);
        setInitialCategories(categoryIds);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError("Impossible de charger les catégories disponibles. Veuillez réessayer.");
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories disponibles",
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
      setError(null);
      
      // Use the optimized updateHotelIncidentCategories function
      await updateHotelIncidentCategories(hotel.id, selectedCategories);
      
      toast({
        title: "Catégories mises à jour",
        description: "Les catégories d'incident de l'hôtel ont été mises à jour avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating hotel categories:', error);
      setError("Une erreur est survenue lors de la mise à jour des catégories. Veuillez réessayer.");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des catégories",
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
            <p>Chargement des catégories disponibles...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les catégories d'incidents</DialogTitle>
          <DialogDescription>
            Sélectionnez les catégories d'incidents disponibles pour cet hôtel
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center mb-4 bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-2">
            <Building className="h-5 w-5 mr-2 text-brand-500" />
            <span className="font-medium">{hotel.name}</span>
          </div>
          
          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <Label htmlFor={category.id} className="cursor-pointer">
                    {category.label}
                  </Label>
                </div>
                <Switch
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories(prev => [...prev, category.id]);
                    } else {
                      setSelectedCategories(prev => prev.filter(id => id !== category.id));
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

export default HotelCategoryDialog;