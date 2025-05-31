import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, X, Loader2 } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getLostItemTypeParameters } from '@/lib/db/parameters-lost-item-type';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, getUsersByHotel } from '@/lib/db/users';
import { useDate } from '@/hooks/use-date';
import { useToast } from '@/hooks/use-toast';
import { supabase, uploadToSupabase, isDataUrl, dataUrlToFile, deleteFromSupabase } from '@/lib/supabase';
import PhotoDisplay from '@/components/maintenance/PhotoDisplay';

interface LostItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isEditing?: boolean;
  lostItem?: any;
}

const LostItemForm: React.FC<LostItemFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing = false,
  lostItem
}) => {
  const currentUser = getCurrentUser();
  const { toast } = useToast();

  // Initialisation du formulaire selon le mode (création ou édition)
  const [formData, setFormData] = useState<any>(() => {
    if (isEditing && lostItem) {
      return {
        ...lostItem,
        photoPreview: lostItem.photoUrl || ''
      };
    } else {
      return {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hotelId: currentUser?.role === 'standard' && currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : '',
        locationId: '',
        description: '',
        itemTypeId: '',
        foundById: currentUser?.id || '',
        returnedById: '',
        storageLocation: '',
        status: 'conservé',
        returnedTo: '',
        returnDate: ''
      };
    }
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingItemTypes, setLoadingItemTypes] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load item types from parameters_lost_item_type collection
        setLoadingItemTypes(true);
        const itemTypesData = await getLostItemTypeParameters();
        setItemTypes(itemTypesData);
        setLoadingItemTypes(false);
        
        // Load all users initially
        const allUsers = await getUsers();
        setUsers(allUsers);
        
        // Load locations and users for the current hotel if editing
        if (isEditing && lostItem?.hotelId) {
          setLoadingLocations(true);
          const locationsData = await getHotelLocations(lostItem.hotelId);
          setLocations(locationsData);
          setLoadingLocations(false);
          
          // Load users for this hotel
          const hotelUsers = await getUsersByHotel(lostItem.hotelId);
          setFilteredUsers(hotelUsers);
        } else {
          setFilteredUsers(allUsers);
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
  }, [isEditing, lostItem, toast]);

  // Load locations when hotel changes
  useEffect(() => {
    const loadLocations = async () => {
      if (!formData.hotelId) {
        setLocations([]);
        setFormData(prev => ({
          ...prev,
          locationId: ''
        }));
        return;
      }

      try {
        setLoadingLocations(true);
        // Use getHotelLocations to get only locations for this specific hotel
        const locationsData = await getHotelLocations(formData.hotelId);
        setLocations(locationsData);
        
        // If current locationId is not in the new locations, reset it
        if (formData.locationId && !locationsData.some(loc => loc.id === formData.locationId)) {
          setFormData(prev => ({
            ...prev,
            locationId: ''
          }));
        }
      } catch (error) {
        console.error('Error loading locations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les lieux pour cet hôtel",
          variant: "destructive",
        });
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, [formData.hotelId, toast]);
  
  // Load users filtered by hotel when hotel selection changes
  useEffect(() => {
    const loadFilteredUsers = async () => {
      if (!formData.hotelId) {
        // If no hotel selected, show all users
        setFilteredUsers(users);
        return;
      }

      try {
        setLoadingUsers(true);
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
      } finally {
        setLoadingUsers(false);
      }
    };

    loadFilteredUsers();
  }, [formData.hotelId, users, toast]);

  // Use the date hook for found date
  const foundDate = useDate({
    defaultDate: formData.date,
    defaultTime: formData.time,
    required: true
  });
  
  // Use date hook for return date if item was returned
  const returnDate = useDate({
    defaultDate: formData.returnDate,
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
      // When hotel changes, we reset locationId to ensure it's valid for the new hotel
      setFormData(prev => ({
        ...prev,
        [name]: value,
        locationId: '' // Reset location when hotel changes
      }));
    } else if (name === 'foundById' || name === 'returnedById') {
      setFormData(prev => ({
        ...prev,
        [name]: value === "none" ? "" : value
      }));
    } else if (name === 'status') {
      // If status changes to 'rendu', set returnDate to today if not already set
      if (value === 'rendu' && !formData.returnDate) {
        setFormData(prev => ({
          ...prev,
          status: value,
          returnDate: new Date().toISOString().split('T')[0]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          status: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 2MB",
          variant: "destructive",
        });
        setPhotoUploading(false);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format de fichier incorrect",
          description: "Veuillez sélectionner un fichier image (JPG, PNG, etc.)",
          variant: "destructive",
        });
        setPhotoUploading(false);
        return;
      }

      // Read file and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: file,
          photoPreview: reader.result as string
        }));
        setPhotoUploading(false);
      };
      
      reader.onerror = () => {
        setPhotoUploading(false);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier sélectionné",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setPhotoUploading(false);
      console.error('Error handling file upload:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du fichier",
        variant: "destructive",
      });
    }
  };

  // Delete photo from form and storage
  const handleDeletePhoto = async () => {
    // If editing and we have a photoUrl, delete from storage
    if (isEditing && lostItem?.photoUrl) {
      try {
        console.log('🗑️ Deleting photo from storage:', lostItem.photoUrl);
        await deleteFromSupabase(lostItem.photoUrl);
        console.log('✅ Photo successfully deleted from storage');
        
        toast({
          title: "Photo supprimée",
          description: "La photo a été supprimée avec succès",
        });
      } catch (error) {
        console.error('❌ Error deleting photo:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression de la photo. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    }
    
    // Remove photo from form data
    setFormData(prev => ({
      ...prev,
      photo: null,
      photoPreview: ''
    }));
  };

  // Filter hotels based on user role
  const filteredHotels = currentUser?.role === 'admin' 
    ? hotels 
    : hotels.filter(hotel => currentUser?.hotels?.includes(hotel.id));

  // Validate form before submission
  const validateForm = () => {
    if (!formData.hotelId) {
      return { valid: false, message: "Veuillez sélectionner un hôtel" };
    }
    if (!formData.locationId) {
      return { valid: false, message: "Veuillez sélectionner un lieu" };
    }
    if (!formData.itemTypeId) {
      return { valid: false, message: "Veuillez sélectionner un type d'objet" };
    }
    if (!formData.foundById) {
      return { valid: false, message: "Veuillez sélectionner la personne qui a trouvé l'objet" };
    }
    if (!formData.description || formData.description.trim().length < 5) {
      return { valid: false, message: "Veuillez fournir une description d'au moins 5 caractères" };
    }
    if (!formData.storageLocation) {
      return { valid: false, message: "Veuillez indiquer le lieu de stockage" };
    }
    if (formData.status === 'rendu' && !formData.returnedTo) {
      return { valid: false, message: "Veuillez indiquer à qui l'objet a été rendu" };
    }
    if (formData.status === 'rendu' && !formData.returnedById) {
      return { valid: false, message: "Veuillez indiquer qui a rendu l'objet" };
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
    
    setSaving(true);
    
    try {
      // Update form data with dates from hooks
      const updatedData = {
        ...formData,
        date: foundDate.date,
        time: foundDate.time,
        returnDate: formData.status === 'rendu' ? (returnDate.date || new Date().toISOString().split('T')[0]) : null
      };
      
      // If there's a photo file, it will be handled by the server
      // If there's only a photoPreview URL, make sure it's included
      
      await onSubmit(updatedData);
      
      toast({
        title: "Objet enregistré",
        description: isEditing ? "L'objet a été mis à jour avec succès" : "L'objet trouvé a été enregistré avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive"
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
            <DialogDescription>
              Veuillez patienter pendant le chargement des données
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
            <p>Chargement en cours...</p>
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
            {isEditing ? 'Modifier l\'objet trouvé' : 'Nouvel Objet Trouvé'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations de l\'objet trouvé' 
              : 'Enregistrez un nouvel objet trouvé'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <DateTimePicker
            label="Date et heure de découverte"
            date={foundDate.date}
            time={foundDate.time}
            onDateChange={foundDate.setDate}
            onTimeChange={foundDate.setTime}
            error={foundDate.error}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Hôtel
              </Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => handleSelectChange('hotelId', value)}
                disabled={currentUser?.role === 'standard' && currentUser?.hotels?.length === 1}
              >
                <SelectTrigger id="hotelId">
                  <SelectValue placeholder="Sélectionnez un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHotels.length === 0 ? (
                    <SelectItem value="none\" disabled>Aucun hôtel disponible</SelectItem>
                  ) : (
                    filteredHotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locationId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Lieu de découverte
              </Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleSelectChange('locationId', value)}
                disabled={!formData.hotelId || loadingLocations}
              >
                <SelectTrigger id="locationId">
                  <SelectValue placeholder={!formData.hotelId ? "Sélectionnez d'abord un hôtel" : loadingLocations ? "Chargement..." : "Sélectionnez un lieu"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingLocations ? (
                    <SelectItem value="loading\" disabled>Chargement...</SelectItem>
                  ) : locations.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun lieu disponible pour cet hôtel</SelectItem>
                  ) : (
                    locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>{location.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemTypeId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Type d'objet
              </Label>
              <Select 
                value={formData.itemTypeId} 
                onValueChange={(value) => handleSelectChange('itemTypeId', value)}
                disabled={loadingItemTypes}
              >
                <SelectTrigger id="itemTypeId">
                  <SelectValue placeholder={loadingItemTypes ? "Chargement..." : "Sélectionnez un type d'objet"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingItemTypes ? (
                    <SelectItem value="loading\" disabled>Chargement des types d'objets...</SelectItem>
                  ) : itemTypes.length === 0 ? (
                    <SelectItem value="none\" disabled>Aucun type d'objet disponible</SelectItem>
                  ) : (
                    itemTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="foundById" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Trouvé par
              </Label>
              <Select
                value={formData.foundById || "none"}
                onValueChange={(value) => handleSelectChange('foundById', value)}
                disabled={loadingUsers || !formData.hotelId}
              >
                <SelectTrigger id="foundById">
                  <SelectValue placeholder={
                    !formData.hotelId
                      ? "Sélectionnez d'abord un hôtel"
                      : loadingUsers
                        ? "Chargement..."
                        : "Sélectionnez un utilisateur"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <SelectItem value="loading\" disabled>Chargement des utilisateurs...</SelectItem>
                  ) : filteredUsers.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun utilisateur disponible</SelectItem>
                  ) : (
                    filteredUsers
                      .filter(user => user.id && user.id !== '')
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Description de l'objet
            </Label>
            <textarea
              id="description"
              name="description"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Décrivez l'objet trouvé de façon détaillée..."
              value={formData.description}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storageLocation" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Lieu de stockage
              </Label>
              <Input
                id="storageLocation"
                name="storageLocation"
                placeholder="Indiquez où l'objet est stocké"
                value={formData.storageLocation}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Statut
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservé">Conservé</SelectItem>
                  <SelectItem value="rendu">Rendu</SelectItem>
                  <SelectItem value="transféré">Transféré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Always show the returnedById field */}
          <div className="space-y-2">
            <Label htmlFor="returnedById">
              Rendu par
              {formData.status === 'rendu' && <span className="ml-0.5 text-red-500">*</span>}
            </Label>
            <Select
              value={formData.returnedById || "none"}
              onValueChange={(value) => handleSelectChange('returnedById', value)}
              disabled={loadingUsers || !formData.hotelId}
            >
              <SelectTrigger id="returnedById">
                <SelectValue placeholder={
                  !formData.hotelId
                    ? "Sélectionnez d'abord un hôtel"
                    : loadingUsers
                      ? "Chargement..."
                      : "Sélectionnez un utilisateur"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non spécifié</SelectItem>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>Chargement des utilisateurs...</SelectItem>
                ) : filteredUsers.length === 0 ? (
                  <SelectItem value="none" disabled>Aucun utilisateur disponible</SelectItem>
                ) : (
                  filteredUsers
                    .filter(user => user.id && user.id !== '')
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            {formData.status !== 'rendu' && (
              <p className="text-xs text-muted-foreground">
                Ce champ est obligatoire uniquement si l'objet est rendu
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photo">Photo de l'objet</Label>
            <div className="mt-2">
              {photoUploading ? (
                <div className="flex items-center justify-center w-full h-48 bg-slate-100 rounded-md">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
                    <p className="text-sm text-slate-500">Traitement de l'image...</p>
                  </div>
                </div>
              ) : formData.photoPreview ? (
                <PhotoDisplay 
                  photoUrl={formData.photoPreview}
                  type="before"
                  onDelete={handleDeletePhoto}
                  altText="Photo de l'objet trouvé"
                />
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-bray-800 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Image className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (MAX. 2MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={saving || photoUploading}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional return information shown only when status is 'rendu' */}
          {formData.status === 'rendu' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Informations de restitution</h3>
              
              <div className="space-y-2">
                <Label htmlFor="returnedTo" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Rendu à (nom)
                </Label>
                <Input
                  id="returnedTo"
                  name="returnedTo"
                  placeholder="Nom de la personne à qui l'objet a été rendu"
                  value={formData.returnedTo}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="returnDate">
                  Date de restitution
                </Label>
                <Input
                  id="returnDate"
                  name="returnDate"
                  type="date"
                  value={formData.returnDate || new Date().toISOString().split('T')[0]}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnEmail">
                    Email du destinataire
                  </Label>
                  <Input
                    id="returnEmail"
                    name="returnEmail"
                    type="email"
                    placeholder="Email de la personne"
                    value={formData.returnEmail || ''}
                    onChange={handleFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="returnPhone">
                    Téléphone du destinataire
                  </Label>
                  <Input
                    id="returnPhone"
                    name="returnPhone"
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={formData.returnPhone || ''}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="returnDetails">
                  Commentaires sur la restitution
                </Label>
                <textarea
                  id="returnDetails"
                  name="returnDetails"
                  className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  placeholder="Détails supplémentaires concernant la restitution..."
                  value={formData.returnDetails || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving || photoUploading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saving || photoUploading}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              isEditing ? 'Enregistrer les modifications' : 'Créer l\'objet trouvé'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LostItemForm;