import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { getHotels } from '@/lib/db/hotels';
import { formatToISOLocalDate, normalizeToMidnight } from '@/lib/date-utils';

// Interface pour les données du formulaire
export interface LogbookEntryFormData {
  date: string;
  time?: string;
  endDate?: string;
  displayRange?: boolean;
  hotelId: string;
  serviceId: string;
  serviceName?: string;
  serviceIcon?: string;
  content: string;
  authorId?: string;
  importance: number;
  isTask?: boolean;
  roomNumber?: string;
  isRead?: boolean;
  comments?: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  hasReminder?: boolean;
  reminderTitle?: string;
  reminderDescription?: string;
  reminderUserIds?: string[];
}

interface LogbookEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<LogbookEntryFormData>;
  isEditing?: boolean;
}

const LogbookEntryForm: React.FC<LogbookEntryFormProps> = ({
  isOpen,
  onClose,
  initialData = {},
  isEditing = false
}) => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Initialisation du formulaire selon le mode (création ou édition)
  const [formData, setFormData] = useState<LogbookEntryFormData>({
    date: formatToISOLocalDate(new Date()), // Utiliser la date du jour par défaut
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hotelId: '',
    serviceId: '',
    content: '',
    importance: 1,
    isTask: false,
    hasReminder: false
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les hôtels au montage
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les hôtels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Si l'utilisateur n'a accès qu'à un seul hôtel, le sélectionner automatiquement
        if (hotelsData.length === 1 && !formData.hotelId) {
          setFormData(prev => ({
            ...prev,
            hotelId: hotelsData[0].id
          }));
        } else if (currentUser?.hotels.length === 1 && !formData.hotelId) {
          setFormData(prev => ({
            ...prev,
            hotelId: currentUser.hotels[0]
          }));
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
  }, [toast, currentUser, formData.hotelId]);
  
  // Mettre à jour le formulaire avec les données initiales
  useEffect(() => {
    if (isOpen && initialData) {
      // S'assurer que les dates sont au format YYYY-MM-DD sans composante d'heure
      const cleanData = {...initialData};
      
      // Normaliser la date au format YYYY-MM-DD
      if (cleanData.date) {
        cleanData.date = cleanData.date.split('T')[0];
      } else {
        cleanData.date = formatToISOLocalDate(new Date()); // Utiliser la date du jour par défaut
      }
      
      // Normaliser la date de fin au format YYYY-MM-DD
      if (cleanData.endDate) {
        cleanData.endDate = cleanData.endDate.split('T')[0];
      }
      
      setFormData(prev => ({
        ...prev,
        ...cleanData
      }));
    }
  }, [isOpen, initialData]);
  
  // Gestion des changements de formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
    
    // Si on désactive la plage de dates, on vide la date de fin
    if (name === 'displayRange' && !checked) {
      setFormData(prev => ({ ...prev, endDate: '' }));
    }
    
    // Si on active "permanent", désactiver la plage de dates
    if (name === 'isPermanent' && checked) {
      setFormData(prev => ({ ...prev, displayRange: false, endDate: '' }));
    }
  };
  
  // Validation du formulaire
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
  
  // Soumission du formulaire
  const handleSubmit = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Erreur de validation",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Normaliser les dates au format YYYY-MM-DD
      const dateStr = formData.date.split('T')[0];
      const endDateStr = formData.endDate ? formData.endDate.split('T')[0] : null;
      
      // Ajouter l'ID d'auteur (utilisateur courant) et nettoyer les valeurs undefined
      const submissionData = {
        ...formData,
        date: dateStr,
        endDate: endDateStr,
        authorId: currentUser?.id,
        // Ensure reminder fields are never undefined
        reminderTitle: formData.reminderTitle || null,
        reminderDescription: formData.reminderDescription || null,
        reminderUserIds: formData.reminderUserIds || null
      };
      
      if (isEditing && initialData.id) {
        // Mise à jour
        await updateLogbookEntry(initialData.id, submissionData);
      } else {
        // Création
        await createLogbookEntry(submissionData);
      }
      
      toast({
        title: "Consigne enregistrée",
        description: isEditing ? "La consigne a été mise à jour avec succès" : "La consigne a été créée avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting logbook entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la consigne",
        variant: "destructive",
      });
    }
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
              <Label htmlFor="service" className="after:content-['*'] after:ml-0.5 after:text-red-500">Service</Label>
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
              <Label htmlFor="hotel" className="after:content-['*'] after:ml-0.5 after:text-red-500">Hôtel</Label>
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
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Période d'affichage</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="display-range"
                  checked={formData.displayRange || false}
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
                  <Label htmlFor="date" className="after:content-['*'] after:ml-0.5 after:text-red-500">Date de début</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Date de fin</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={handleInputChange}
                    min={formData.date} // La date de fin doit être après la date de début
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="after:content-['*'] after:ml-0.5 after:text-red-500">Date</Label>
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
              <Label htmlFor="content" className="after:content-['*'] after:ml-0.5 after:text-red-500">Contenu</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-task"
                  checked={formData.isTask || false}
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
              value={formData.content || ''}
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
                value={formData.roomNumber || ''}
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
                checked={formData.hasReminder || false}
                onCheckedChange={(checked) => handleSwitchChange('hasReminder', checked)}
              />
            </div>
            
            {formData.hasReminder && (
              <div className="space-y-4 pl-4 border-l-2 border-brand-200 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="reminderTitle" className="after:content-['*'] after:ml-0.5 after:text-red-500">Titre du rappel</Label>
                  <Input
                    id="reminderTitle"
                    name="reminderTitle"
                    value={formData.reminderTitle || ''}
                    onChange={handleInputChange}
                    placeholder="Titre du rappel"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reminderDescription">Description (optionnel)</Label>
                  <textarea
                    id="reminderDescription"
                    name="reminderDescription"
                    value={formData.reminderDescription || ''}
                    onChange={handleInputChange}
                    placeholder="Description du rappel..."
                    className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>

                <div className="pt-1 text-xs text-muted-foreground">
                  Ce rappel sera affiché pendant toute la période définie pour cette consigne.
                  {formData.displayRange 
                    ? ` Du ${formData.date}${formData.endDate ? ` au ${formData.endDate}` : ''}` 
                    : ` Le ${formData.date}`}
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

// Helper functions
const createLogbookEntry = async (entry: any) => {
  const { createLogbookEntry } = await import('../../lib/db/logbook');
  return createLogbookEntry(entry);
};

const updateLogbookEntry = async (id: string, entry: any) => {
  const { updateLogbookEntry } = await import('../../lib/db/logbook');
  return updateLogbookEntry(id, entry);
};

// Constantes pour services
const services = [
  { id: 'important', name: 'Important', icon: '⚠️' },
  { id: 'reception', name: 'Réception', icon: '👥' },
  { id: 'housekeeping', name: 'Housekeeping', icon: '🛏️' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'technical', name: 'Technique', icon: '🔧' },
  { id: 'direction', name: 'Direction', icon: '👑' }
];