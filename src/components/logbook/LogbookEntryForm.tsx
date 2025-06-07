import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { getHotels } from '@/lib/db/hotels';

interface LogbookEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const LogbookEntryForm: React.FC<LogbookEntryFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  isEditing = false
}) => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState({
    serviceId: initialData.serviceId || '',
    content: initialData.content || '',
    importance: initialData.importance || 1,
    date: initialData.date || new Date().toISOString().split('T')[0],
    time: initialData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hotelId: initialData.hotelId || (currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : ''),
    roomNumber: initialData.roomNumber || '',
    isTask: initialData.isTask || false,
    assignedToIds: initialData.assignedToIds || [],
    tagIds: initialData.tagIds || []
  });
  
  const [services, setServices] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
          : allHotels.filter(hotel => hasHotelAccess(hotel.id));
        
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
  };
  
  // Validate form
  const validateForm = () => {
    if (!formData.content) {
      return { valid: false, message: 'Le contenu est requis' };
    }
    if (!formData.hotelId) {
      return { valid: false, message: 'Veuillez sélectionner un hôtel' };
    }
    if (!formData.serviceId) {
      return { valid: false, message: 'Veuillez sélectionner un service' };
    }
    
    // Verify the user has access to the selected hotel
    if (!hasHotelAccess(formData.hotelId)) {
      return { valid: false, message: 'Vous n\'avez pas accès à cet hôtel' };
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier une consigne' : 'Nouvelle consigne'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Mettez à jour les informations de la consigne'
              : 'Ajoutez une nouvelle consigne au cahier de transmission'}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
                disabled={hotels.length === 1}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="content">Contenu</Label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-task"
                    checked={formData.isTask}
                    onCheckedChange={(checked) => handleSwitchChange('isTask', checked)}
                  />
                  <Label htmlFor="is-task" className="text-sm">
                    Tâche à effectuer
                  </Label>
                </div>
              </div>
            </div>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Saisissez votre consigne ici..."
              className="min-h-[150px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="importance">Importance</Label>
              <Select
                value={formData.importance.toString()}
                onValueChange={(value) => handleSelectChange('importance', value)}
              >
                <SelectTrigger id="importance">
                  <SelectValue placeholder="Niveau d'importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Normal</SelectItem>
                  <SelectItem value="2">Important</SelectItem>
                  <SelectItem value="3">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Numéro de chambre (optionnel)</Label>
              <Input
                id="roomNumber"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                placeholder="ex: 101"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Enregistrer les modifications' : 'Créer la consigne'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogbookEntryForm;