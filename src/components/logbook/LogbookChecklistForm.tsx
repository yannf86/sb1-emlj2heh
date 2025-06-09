import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentUser } from '@/lib/auth';
import { getHotels } from '@/lib/db/hotels';

interface LogbookChecklistFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const LogbookChecklistForm: React.FC<LogbookChecklistFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  isEditing = false
}) => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Initialisation du formulaire selon le mode (création ou édition)
  const [formData, setFormData] = useState({
    serviceId: initialData.serviceId || '',
    title: initialData.title || '',
    description: initialData.description || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
    endDate: initialData.endDate || '', // Date de fin pour plage de dates
    displayRange: initialData.displayRange || false, // Pour activer/désactiver la plage de date
    isPermanent: initialData.isPermanent || false, // Pour les tâches permanentes
    hotelId: initialData.hotelId || (currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : ''),
    assignedUserIds: initialData.assignedUserIds || [],
  });
  
  const [services, setServices] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load services and hotels
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, these would be loaded from Firestore
        // For now, use static data
        setServices([
          { id: 'important', name: 'Important', icon: '⚠️' },
          { id: 'reception', name: 'Réception', icon: '👥' },
          { id: 'housekeeping', name: 'Housekeeping', icon: '🛏️' },
          { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
          { id: 'technical', name: 'Technique', icon: '🔧' },
          { id: 'direction', name: 'Direction', icon: '👑' }
        ]);
        
        // Load hotels with access check
        const allHotels = await getHotels();
        
        // Filter hotels based on user's access rights
        const accessibleHotels = currentUser?.role === 'admin' 
          ? allHotels 
          : allHotels.filter(hotel => currentUser?.hotels.includes(hotel.id));
        
        setHotels(accessibleHotels);
        
        // Set default hotel if user has only one
        if (accessibleHotels.length === 1 && !formData.hotelId) {
          setFormData(prev => ({
            ...prev,
            hotelId: accessibleHotels[0].id
          }));
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Impossible de charger les données. Veuillez réessayer.');
        toast({
          title: "Erreur",
          description: "Impossible de charger les données nécessaires.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser, toast, formData.hotelId]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));

    // Si on active "Tâche permanente", désactiver la plage de dates
    if (name === 'isPermanent' && checked) {
      setFormData(prev => ({ ...prev, displayRange: false }));
    }
    
    // Si on désactive la plage de dates, on vide la date de fin
    if (name === 'displayRange' && !checked) {
      setFormData(prev => ({ ...prev, endDate: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    if (!formData.title) {
      return { valid: false, message: 'Le titre est requis' };
    }
    if (!formData.hotelId) {
      return { valid: false, message: 'Veuillez sélectionner un hôtel' };
    }
    if (!formData.serviceId) {
      return { valid: false, message: 'Veuillez sélectionner un service' };
    }
    
    // Verify the user has access to the selected hotel
    if (!currentUser?.hotels.includes(formData.hotelId) && currentUser?.role !== 'admin') {
      return { valid: false, message: 'Vous n\'avez pas accès à cet hôtel' };
    }
    
    // Vérifier que la date de fin est après la date de début si plage de dates active
    if (formData.displayRange && formData.endDate) {
      if (formData.endDate < formData.date) {
        return { valid: false, message: 'La date de fin doit être après la date de début' };
      }
    }
    
    return { valid: true, message: '' };
  };
  
  // Handle form submission
  const handleSubmit = () => {
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Erreur de validation",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    
    onSave({
      ...formData,
      authorId: currentUser?.id
    });
  };
  
  // Check if user is admin or hotel_admin
  const canCreateChecklist = currentUser?.role === 'admin' || currentUser?.role === 'hotel_admin';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier une tâche' : 'Nouvelle tâche'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Mettez à jour les informations de la tâche'
              : 'Ajoutez une nouvelle tâche à la check-list'}
          </DialogDescription>
        </DialogHeader>
        
        {!canCreateChecklist && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seuls les administrateurs peuvent créer des tâches dans la check-list.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => handleSelectChange('serviceId', value)}
                disabled={!canCreateChecklist}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      <span className="mr-2">{service.icon}</span>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hotel">Hôtel</Label>
              <Select
                value={formData.hotelId}
                onValueChange={(value) => handleSelectChange('hotelId', value)}
                disabled={hotels.length === 1 || !canCreateChecklist}
              >
                <SelectTrigger id="hotel">
                  <SelectValue placeholder="Sélectionner un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la tâche</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Titre de la tâche"
              disabled={!canCreateChecklist}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description de la tâche"
              disabled={!canCreateChecklist}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Type de tâche</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-permanent"
                  checked={formData.isPermanent}
                  onCheckedChange={(checked) => handleSwitchChange('isPermanent', checked)}
                  disabled={!canCreateChecklist}
                />
                <Label htmlFor="is-permanent" className="text-sm">
                  Tâche permanente
                </Label>
              </div>
            </div>

            {!formData.isPermanent && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <Label>Période d'affichage</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="display-range"
                      checked={formData.displayRange}
                      onCheckedChange={(checked) => handleSwitchChange('displayRange', checked)}
                      disabled={formData.isPermanent || !canCreateChecklist}
                    />
                    <Label htmlFor="display-range" className="text-sm">
                      Définir une plage de dates
                    </Label>
                  </div>
                </div>

                {formData.displayRange ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date de début</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        disabled={!canCreateChecklist}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.date} // La date de fin doit être après la date de début
                        disabled={!canCreateChecklist}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="date">Date d'échéance</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      disabled={!canCreateChecklist}
                    />
                  </div>
                )}
              </div>
            )}
            
            {formData.isPermanent && (
              <div className="mt-2 text-xs text-muted-foreground">
                Les tâches permanentes sont toujours visibles et ne sont pas liées à une date spécifique.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canCreateChecklist}
          >
            {isEditing ? 'Enregistrer les modifications' : 'Créer la tâche'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogbookChecklistForm;