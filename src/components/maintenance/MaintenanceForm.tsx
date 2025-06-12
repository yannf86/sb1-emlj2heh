import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getInterventionTypeParameters } from '@/lib/db/parameters-intervention-type';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, getUsersByHotel } from '@/lib/db/users';
import { useDate } from '@/hooks/use-date';
import { useToast } from '@/hooks/use-toast';
import { findStatusIdByCode } from '@/lib/db/parameters-status';
import { Loader2, Image } from 'lucide-react';
import { uploadToSupabase, isDataUrl, dataUrlToFile } from '../supabase';
import PhotoDisplay from '@/components/maintenance/PhotoDisplay';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance?: any; // Optional maintenance data for edit mode
  onSubmit: (formData: any) => void;
  isEditing?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  isOpen,
  onClose,
  maintenance,
  onSubmit,
  isEditing = false
}) => {
  const currentUser = getCurrentUser();
  const { toast } = useToast();

  // Initialisation du formulaire selon le mode (création ou édition)
  const [formData, setFormData] = useState<any>(() => {
    if (isEditing && maintenance) {
      return {
        ...maintenance,
        photoBeforePreview: maintenance.photoBefore || '',
        photoAfterPreview: maintenance.photoAfter || ''
      };
    } else {
      return {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hotelId: currentUser?.role === 'standard' && currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : '',
        locationId: '',
        interventionTypeId: '',
        description: '',
        photoBefore: null,
        photoBeforePreview: '',
        photoAfter: null,
        photoAfterPreview: '',
        assignedUserId: '',
        statusId: '',
        estimatedAmount: '',
        finalAmount: '',
        startDate: '',
        endDate: '',
        comments: '',
        receivedById: currentUser?.id || ''
      };
    }
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [photoBeforeUploading, setPhotoBeforeUploading] = useState(false);
  const [photoAfterUploading, setPhotoAfterUploading] = useState(false);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load intervention types
        const interventionTypesData = await getInterventionTypeParameters();
        setInterventionTypes(interventionTypesData);
        
        // Load statuses
        const statusesData = await getStatusParameters();
        setStatusParams(statusesData);
        
        // Load all users initially
        const allUsers = await getUsers();
        setUsers(allUsers);
        
        // Filter users based on selected hotel
        if (maintenance?.hotelId) {
          const hotelUsers = await getUsersByHotel(maintenance.hotelId);
          setFilteredUsers(hotelUsers);
        } else {
          setFilteredUsers(allUsers);
        }
        
        // Load locations for the current hotel
        if (maintenance?.hotelId) {
          await loadLocationsForHotel(maintenance.hotelId);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [maintenance?.hotelId, toast]);

  // Load locations when hotel changes
  const loadLocationsForHotel = async (hotelId: string) => {
    if (!hotelId) {
      setLocations([]);
      return;
    }

    try {
      setLoadingLocations(true);
      const locationsData = await getHotelLocations(hotelId);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les lieux pour cet hôtel",
        variant: "destructive",
      });
    } finally {
      setLoadingLocations(false);
    }
  };
  
  useEffect(() => {
    if (formData.hotelId) {
      loadLocationsForHotel(formData.hotelId);
    }
  }, [formData.hotelId]);
  
  // Load users filtered by hotel when hotel selection changes
  useEffect(() => {
    const loadFilteredUsers = async () => {
      if (!formData.hotelId) {
        // If no hotel selected, show all users
        setFilteredUsers(users);
        return;
      }

      try {
        // Get users with access to the selected hotel
        const hotelUsers = await getUsersByHotel(formData.hotelId);
        setFilteredUsers(hotelUsers);
      } catch (error) {
        console.error('Error loading users by hotel:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs pour cet hôtel",
          variant: "destructive",
        });
        // Fallback to all users
        setFilteredUsers(users);
      }
    };

    loadFilteredUsers();
  }, [formData.hotelId, users, toast]);

  // Use the date hook for incident date
  const maintenanceDate = useDate({
    defaultDate: formData.date,
    defaultTime: formData.time,
    required: true
  });
  
  // Use the date hook for start/end dates
  const startDate = useDate({
    defaultDate: formData.startDate,
    required: false
  });
  
  const endDate = useDate({
    defaultDate: formData.endDate,
    minDate: formData.startDate,
    required: false
  });

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string | null) => {
    if (name === 'hotelId') {
      // When hotel changes, reset locationId
      setFormData(prev => ({
        ...prev,
        [name]: value,
        locationId: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle file upload - photoBefore
  const handlePhotoBeforeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoBeforeUploading(true);
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 2MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format de fichier incorrect",
          description: "Veuillez sélectionner un fichier image (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Read file and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoBefore: file,
          photoBeforePreview: reader.result as string
        }));
        setPhotoBeforeUploading(false);
      };
      reader.onerror = () => {
        setPhotoBeforeUploading(false);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier sélectionné",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setPhotoBeforeUploading(false);
      console.error('Error handling file upload:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du fichier",
        variant: "destructive",
      });
    }
  };

  // Handle file upload - photoAfter
  const handlePhotoAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoAfterUploading(true);
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 2MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format de fichier incorrect",
          description: "Veuillez sélectionner un fichier image (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Read file and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoAfter: file,
          photoAfterPreview: reader.result as string
        }));
        setPhotoAfterUploading(false);
      };
      reader.onerror = () => {
        setPhotoAfterUploading(false);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier sélectionné",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setPhotoAfterUploading(false);
      console.error('Error handling file upload:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du fichier",
        variant: "destructive",
      });
    }
  };

  // Handle delete photoBefore
  const handleDeletePhotoBefore = async () => {
    try {
      // Update form data
      setFormData(prev => ({
        ...prev,
        photoBefore: null,
        photoBeforePreview: ''
      }));
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive",
      });
    }
  };

  // Handle delete photoAfter
  const handleDeletePhotoAfter = async () => {
    try {
      // Update form data
      setFormData(prev => ({
        ...prev,
        photoAfter: null,
        photoAfterPreview: ''
      }));
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive",
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.hotelId) {
      return { valid: false, message: "Veuillez sélectionner un hôtel" };
    }
    if (!formData.locationId) {
      return { valid: false, message: "Veuillez sélectionner un lieu" };
    }
    if (!formData.interventionTypeId) {
      return { valid: false, message: "Veuillez sélectionner un type d'intervention" };
    }
    if (!formData.description || formData.description.trim().length < 5) {
      return { valid: false, message: "Veuillez fournir une description d'au moins 5 caractères" };
    }
    if (!formData.statusId) {
      return { valid: false, message: "Veuillez sélectionner un statut" };
    }
    
    return { valid: true, message: "" };
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate the form
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Validation échouée",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    // Update form data with dates from hooks
    const updatedFormData = {
      ...formData,
      date: maintenanceDate.date,
      time: maintenanceDate.time,
      startDate: startDate.date,
      endDate: endDate.date
    };

    onSubmit(updatedFormData);
  };

  // Update form data when dates change
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      date: maintenanceDate.date,
      time: maintenanceDate.time
    }));
  }, [maintenanceDate.date, maintenanceDate.time]);

  useEffect(() => {
    if (startDate.date) {
      setFormData(prev => ({ 
        ...prev, 
        startDate: startDate.date 
      }));
    }
  }, [startDate.date]);

  useEffect(() => {
    if (endDate.date) {
      setFormData(prev => ({ 
        ...prev, 
        endDate: endDate.date 
      }));
    }
  }, [endDate.date]);

  // Reset locationId when hotel changes
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        locationId: '',
      }));
    }
  }, [formData.hotelId, isEditing]);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
            <p>Chargement des données en cours...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? 'Modifier l\'intervention' 
              : 'Nouvelle Intervention Technique'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de l\'intervention'
              : 'Créez une nouvelle demande d\'intervention technique'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <DateTimePicker
            label="Date et heure de l'intervention"
            date={maintenanceDate.date}
            time={maintenanceDate.time}
            onDateChange={maintenanceDate.setDate}
            onTimeChange={maintenanceDate.setTime}
            error={maintenanceDate.error}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId">Hôtel</Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => handleSelectChange('hotelId', value)}
                disabled={currentUser?.role === 'standard' && currentUser?.hotels?.length === 1}
              >
                <SelectTrigger id="hotelId">
                  <SelectValue placeholder="Sélectionnez un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locationId">Lieu</Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleSelectChange('locationId', value)}
                disabled={!formData.hotelId || loadingLocations}
              >
                <SelectTrigger id="locationId">
                  <SelectValue placeholder={!formData.hotelId ? "Sélectionnez d'abord un hôtel" : "Sélectionnez un lieu"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingLocations ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : locations.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun lieu disponible</SelectItem>
                  ) : (
                    locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>{location.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interventionTypeId">Type d'intervention</Label>
            <Select 
              value={formData.interventionTypeId} 
              onValueChange={(value) => handleSelectChange('interventionTypeId', value)}
            >
              <SelectTrigger id="interventionTypeId">
                <SelectValue placeholder="Sélectionnez un type d'intervention" />
              </SelectTrigger>
              <SelectContent>
                {interventionTypes.length === 0 ? (
                  <SelectItem value="none" disabled>Aucun type disponible</SelectItem>
                ) : (
                  interventionTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={formData.description}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Photo Avant */}
              <div className="space-y-2">
                <Label>Photo avant</Label>
                {photoBeforeUploading ? (
                  <div className="flex items-center justify-center w-full h-48 bg-slate-100 rounded-md">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
                      <p className="text-sm text-slate-500">Traitement de l'image...</p>
                    </div>
                  </div>
                ) : formData.photoBeforePreview ? (
                  <PhotoDisplay 
                    photoUrl={formData.photoBeforePreview}
                    type="before"
                    onDelete={handleDeletePhotoBefore}
                    altText="Photo avant intervention"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="text-xs text-gray-500">Cliquez pour uploader</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handlePhotoBeforeUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Photo Après */}
              <div className="space-y-2">
                <Label>Photo après</Label>
                {photoAfterUploading ? (
                  <div className="flex items-center justify-center w-full h-48 bg-slate-100 rounded-md">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
                      <p className="text-sm text-slate-500">Traitement de l'image...</p>
                    </div>
                  </div>
                ) : formData.photoAfterPreview ? (
                  <PhotoDisplay 
                    photoUrl={formData.photoAfterPreview}
                    type="after"
                    onDelete={handleDeletePhotoAfter}
                    altText="Photo après intervention"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="text-xs text-gray-500">Cliquez pour uploader</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handlePhotoAfterUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusId">Statut</Label>
              <Select 
                value={formData.statusId} 
                onValueChange={(value) => handleSelectChange('statusId', value)}
              >
                <SelectTrigger id="statusId">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusParams.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun statut disponible</SelectItem>
                  ) : (
                    statusParams.map(status => (
                      <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignedUserId">Assigné à</Label>
              <Select 
                value={formData.assignedUserId || "none"} 
                onValueChange={(value) => handleSelectChange('assignedUserId', value === "none" ? null : value)}
              >
                <SelectTrigger id="assignedUserId">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {filteredUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Dates et coûts</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedAmount">Montant estimé (€)</Label>
                <Input
                  id="estimatedAmount"
                  name="estimatedAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.estimatedAmount}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="finalAmount">Montant final (€)</Label>
                <Input
                  id="finalAmount"
                  name="finalAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.finalAmount}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires</Label>
            <textarea
              id="comments"
              name="comments"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={formData.comments}
              onChange={handleFormChange}
              placeholder="Commentaires additionnels..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={photoBeforeUploading || photoAfterUploading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={photoBeforeUploading || photoAfterUploading}
          >
            {isEditing ? 'Enregistrer les modifications' : 'Créer l\'intervention'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceForm;