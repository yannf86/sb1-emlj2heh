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
  
  // Initialisation du formulaire selon le mode (création ou édition)
  const [formData, setFormData] = useState({
    serviceId: initialData.serviceId || '',
    content: initialData.content || '',
    importance: initialData.importance || 1,
    date: initialData.date || new Date().toISOString().split('T')[0],
    endDate: initialData.endDate || '', // Nouvelle prop pour date de fin
    displayRange: initialData.displayRange || false, // Pour activer/désactiver la plage de date
    time: initialData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hotelId: initialData.hotelId || (currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : ''),
    roomNumber: initialData.roomNumber || '',
    isTask: initialData.isTask || false,
    assignedToIds: initialData.assignedToIds || [],
    tagIds: initialData.tagIds || [],
    // Rappels
    hasReminder: initialData.hasReminder || false,
    reminderTitle: initialData.reminderTitle || '',
    reminderDescription: initialData.reminderDescription || '',
    reminderUserIds: initialData.reminderUserIds || []
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

    // Si on désactive la plage de dates, on vide la date de fin
    if (name === 'displayRange' && !checked) {
      setFormData(prev => ({ ...prev, endDate: '' }));
    }
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
    if (!currentUser?.hotels.includes(formData.hotelId) && currentUser?.role !== 'admin') {
      return { valid: false, message: 'Vous n\'avez pas accès à cet hôtel' };
    }
    
    // Vérifier que la date de fin est après la date de début si plage de dates active
    if (formData.displayRange && formData.endDate) {
      if (formData.endDate < formData.date) {
        return { valid: false, message: 'La date de fin doit être après la date de début' };
      }
    }
    
    // Valider les données du rappel
    if (formData.hasReminder) {
      if (!formData.reminderTitle) {
        return { valid: false, message: 'Le titre du rappel est requis' };
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Période d'affichage</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="display-range"
                  checked={formData.displayRange}
                  onCheckedChange={(checked) => handleSwitchChange('displayRange', checked)}
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
                  />
                </div>
              </div>
            ) : (
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
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="content">Contenu</Label>
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
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Saisissez votre consigne ici..."
              className="min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
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

          {/* Section Rappel */}
          <div className="space-y-2 pt-4 border-t mt-4">
            <div className="flex items-center justify-between">
              <Label>Créer un rappel</Label>
              <Switch
                id="has-reminder"
                checked={formData.hasReminder}
                onCheckedChange={(checked) => handleSwitchChange('hasReminder', checked)}
              />
            </div>
            
            {formData.hasReminder && (
              <div className="space-y-4 pl-4 border-l-2 border-brand-200 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="reminderTitle">Titre du rappel</Label>
                  <Input
                    id="reminderTitle"
                    name="reminderTitle"
                    value={formData.reminderTitle}
                    onChange={handleInputChange}
                    placeholder="Titre du rappel"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reminderDescription">Description (optionnel)</Label>
                  <textarea
                    id="reminderDescription"
                    name="reminderDescription"
                    value={formData.reminderDescription}
                    onChange={handleInputChange}
                    placeholder="Description du rappel..."
                    className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>

                <div className="pt-1 text-xs text-muted-foreground">
                  Ce rappel sera affiché pendant toute la période définie pour cette consigne.
                  {formData.displayRange 
                    ? ' Du ' + formData.date + (formData.endDate ? ' au ' + formData.endDate : '') 
                    : ' Le ' + formData.date}
                </div>
              </div>
            )}
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