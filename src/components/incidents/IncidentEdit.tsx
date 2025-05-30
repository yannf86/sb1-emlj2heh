import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getHotelIncidentCategories } from '@/lib/db/hotel-incident-categories';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getImpactParameters } from '@/lib/db/parameters-impact';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getResolutionTypeParameters } from '@/lib/db/parameters-resolution-type';
import { getClientSatisfactionParameters } from '@/lib/db/parameters-client-satisfaction';
import { getBookingOriginParameters } from '@/lib/db/parameters-booking-origin';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, getUsersByHotel } from '@/lib/db/users';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadToSupabase, deleteFromSupabase, isDataUrl, dataUrlToFile } from '@/lib/supabase';
import PhotoDisplay from '@/components/maintenance/PhotoDisplay';

interface IncidentEditProps {
  isOpen: boolean;
  onClose: () => void;
  incident: any;
  onSave: (updatedIncident: any) => void;
}

const IncidentEdit: React.FC<IncidentEditProps> = ({
  isOpen,
  onClose,
  incident,
  onSave
}) => {
  const [formData, setFormData] = useState<any>({
    ...incident,
    photoPreview: incident.photoUrl || ''
  });

  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [resolutionTypes, setResolutionTypes] = useState<any[]>([]);
  const [clientSatisfactions, setClientSatisfactions] = useState<any[]>([]);
  const [bookingOrigins, setBookingOrigins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load categories
        const categoriesData = await getIncidentCategoryParameters();
        setCategories(categoriesData);
        
        // Load impacts
        const impactsData = await getImpactParameters();
        setImpacts(impactsData);
        
        // Load statuses
        const statusesData = await getStatusParameters();
        setStatuses(statusesData);
        
        // Load resolution types
        const resolutionTypesData = await getResolutionTypeParameters();
        setResolutionTypes(resolutionTypesData);
        
        // Load client satisfaction options
        const clientSatisfactionsData = await getClientSatisfactionParameters();
        setClientSatisfactions(clientSatisfactionsData);
        
        // Load booking origins
        const bookingOriginsData = await getBookingOriginParameters();
        setBookingOrigins(bookingOriginsData);
        
        // Load all users initially
        const allUsers = await getUsers();
        setUsers(allUsers);
        
        // Filter users based on selected hotel
        if (incident.hotelId) {
          const hotelUsers = await getUsersByHotel(incident.hotelId);
          setFilteredUsers(hotelUsers);
        } else {
          setFilteredUsers(allUsers);
        }
        
        // Load locations for the current hotel
        if (incident.hotelId) {
          await loadLocationsForHotel(incident.hotelId);
          await loadCategoriesForHotel(incident.hotelId);
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
  }, [incident.hotelId, toast]);

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
  
  // Load categories when hotel changes
  const loadCategoriesForHotel = async (hotelId: string) => {
    if (!hotelId) {
      // If no hotel selected, load all categories
      const categoriesData = await getIncidentCategoryParameters();
      setCategories(categoriesData);
      return;
    }

    try {
      setLoadingCategories(true);
      // Get hotel-specific categories
      const hotelCategories = await getHotelIncidentCategories(hotelId);
      
      if (hotelCategories.length === 0) {
        // If no categories are defined for this hotel, show all categories
        const categoriesData = await getIncidentCategoryParameters();
        setCategories(categoriesData);
        return;
      }
      
      // Get the full category objects for the IDs
      const categoryIds = hotelCategories.map(hc => hc.category_id);
      const allCategories = await getIncidentCategoryParameters();
      const filteredCategories = allCategories.filter(cat => 
        categoryIds.includes(cat.id)
      );
      
      setCategories(filteredCategories);
      
      // If the currently selected category is not in the filtered list, reset it
      if (formData.categoryId && !categoryIds.includes(formData.categoryId)) {
        setFormData(prev => ({
          ...prev,
          categoryId: ''
        }));
      }
    } catch (error) {
      console.error('Error loading categories for hotel:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories pour cet hôtel",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };
  
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
      // When hotel changes, reset locationId and categoryId
      setFormData(prev => ({
        ...prev,
        [name]: value,
        locationId: '',
        categoryId: '',
        concludedById: null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      
      // Validate file size (max 2MB)
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

  // Handle delete photo
  const handleDeletePhoto = async () => {
    try {
      // If we have an existing photo URL, delete it from Supabase
      if (incident.photoUrl) {
        console.log('🗑️ Deleting photo from Supabase:', incident.photoUrl);
        await deleteFromSupabase(incident.photoUrl);
        console.log('✅ Photo deleted successfully from Supabase');
        toast({
          title: "Photo supprimée",
          description: "La photo a été supprimée avec succès"
        });
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        photo: null,
        photoPreview: ''
      }));
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive"
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Create a copy of the form data for submission
      const submissionData = { ...formData };
      
      // Handle photo upload if needed
      if (submissionData.photo instanceof File) {
        try {
          const photoUrl = await uploadToSupabase(submissionData.photo, 'photosincident');
          submissionData.photoUrl = photoUrl;
          
          // If there was an existing photo, delete it
          if (incident.photoUrl && incident.photoUrl !== photoUrl) {
            await deleteFromSupabase(incident.photoUrl);
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: "Erreur",
            description: "Impossible de télécharger la photo",
            variant: "destructive"
          });
          // Continue with submission even if photo upload fails
        }
      } else if (isDataUrl(submissionData.photoPreview) && !submissionData.photoUrl) {
        // Handle data URL - convert to file and upload
        try {
          const file = await dataUrlToFile(submissionData.photoPreview, 'incident_photo.jpg');
          if (file) {
            const photoUrl = await uploadToSupabase(file, 'photosincident');
            submissionData.photoUrl = photoUrl;
            
            // If there was an existing photo, delete it
            if (incident.photoUrl && incident.photoUrl !== photoUrl) {
              await deleteFromSupabase(incident.photoUrl);
            }
          }
        } catch (error) {
          console.error('Error processing photo data URL:', error);
        }
      } else if (!submissionData.photoPreview && incident.photoUrl) {
        // Photo has been removed
        submissionData.photoUrl = null;
      }
      
      // Remove temporary photo fields before submission
      delete submissionData.photo;
      delete submissionData.photoPreview;
      
      // Ensure concludedAt is properly set
      if (submissionData.concludedById) {
        submissionData.concludedAt = submissionData.concludedAt || new Date().toISOString();
      } else {
        submissionData.concludedAt = null;
        submissionData.concludedById = null;
      }
      
      // Save the incident
      await onSave(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
          <div className="py-6">
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
          <DialogTitle>Modifier l'incident</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'incident
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId">Hôtel</Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => handleSelectChange('hotelId', value)}
              >
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder={!formData.hotelId ? "Sélectionnez d'abord un hôtel" : "Sélectionnez un lieu"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingLocations ? (
                    <SelectItem value="loading\" disabled>Chargement...</SelectItem>
                  ) : locations.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun lieu disponible</SelectItem>
                  ) : (
                    locations
                      .filter(location => location.id && location.id !== '')
                      .map(location => (
                        <SelectItem key={location.id} value={location.id}>{location.label}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleSelectChange('categoryId', value)}
                disabled={loadingCategories || !formData.hotelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.hotelId ? "Sélectionnez d'abord un hôtel" : loadingCategories ? "Chargement..." : "Sélectionnez une catégorie"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingCategories ? (
                    <SelectItem value="loading\" disabled>Chargement des catégories...</SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="none" disabled>Aucune catégorie disponible</SelectItem>
                  ) : (
                    categories
                      .filter(category => category.id && category.id !== '')
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="impactId">Impact</Label>
              <Select 
                value={formData.impactId} 
                onValueChange={(value) => handleSelectChange('impactId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un impact" />
                </SelectTrigger>
                <SelectContent>
                  {impacts.map(impact => (
                    <SelectItem key={impact.id} value={impact.id}>{impact.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {/* Photo de l'incident */}
          <div className="space-y-2">
            <Label htmlFor="photo">Photo de l'incident</Label>
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
                altText="Photo de l'incident"
              />
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-bray-800 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-3 text-gray-400" />
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
                    disabled={photoUploading}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolutionDescription">Description de la résolution</Label>
            <textarea
              id="resolutionDescription"
              name="resolutionDescription"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Description de la résolution (optionnel)"
              value={formData.resolutionDescription || ''}
              onChange={handleFormChange}
            />
          </div>
          
          {/* Nouveaux champs pour la résolution */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Information de résolution</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resolutionTypeId">Type de résolution</Label>
                <Select 
                  value={formData.resolutionTypeId || "none"} 
                  onValueChange={(value) => handleSelectChange('resolutionTypeId', value === "none" ? null : value)}
                >
                  <SelectTrigger id="resolutionTypeId">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non spécifié</SelectItem>
                    {resolutionTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compensationAmount">Montant geste commercial (€)</Label>
                <Input
                  id="compensationAmount"
                  name="compensationAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.compensationAmount || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientSatisfactionId">Satisfaction client</Label>
              <Select 
                value={formData.clientSatisfactionId || "none"} 
                onValueChange={(value) => handleSelectChange('clientSatisfactionId', value === "none" ? null : value)}
              >
                <SelectTrigger id="clientSatisfactionId">
                  <SelectValue placeholder="Sélectionnez un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non spécifié</SelectItem>
                  {clientSatisfactions.map(satisfaction => (
                    <SelectItem key={satisfaction.id} value={satisfaction.id}>{satisfaction.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivedById">Reçu par</Label>
              <Select 
                value={formData.receivedById} 
                onValueChange={(value) => handleSelectChange('receivedById', value)}
                disabled={loadingUsers || !formData.hotelId}
              >
                <SelectTrigger id="receivedById">
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
            
            <div className="space-y-2">
              <Label htmlFor="concludedById">Conclu par</Label>
              <Select 
                value={formData.concludedById || "none"} 
                onValueChange={(value) => handleSelectChange('concludedById', value === "none" ? null : value)}
                disabled={loadingUsers || !formData.hotelId}
              >
                <SelectTrigger id="concludedById">
                  <SelectValue placeholder={
                    !formData.hotelId
                      ? "Sélectionnez d'abord un hôtel"
                      : loadingUsers
                        ? "Chargement..."
                        : "Sélectionnez un utilisateur"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">En Attente</SelectItem>
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
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusId">Statut</Label>
              <Select 
                value={formData.statusId} 
                onValueChange={(value) => handleSelectChange('statusId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses
                    .filter(status => status.id && status.id !== '') // Filter out empty IDs
                    .map(status => (
                      <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Informations Client</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={formData.clientName || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={formData.clientEmail || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Téléphone</Label>
              <Input
                id="clientPhone"
                name="clientPhone"
                type="tel"
                value={formData.clientPhone || ''}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Date d'arrivée</Label>
                <Input
                  id="arrivalDate"
                  name="arrivalDate"
                  type="date"
                  value={formData.arrivalDate || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departureDate">Date de départ</Label>
                <Input
                  id="departureDate"
                  name="departureDate"
                  type="date"
                  value={formData.departureDate || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservationAmount">Montant réservation</Label>
                <Input
                  id="reservationAmount"
                  name="reservationAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.reservationAmount || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="origin">Origine réservation</Label>
                <Select 
                  value={formData.origin || "none"} 
                  onValueChange={(value) => handleSelectChange('origin', value === "none" ? null : value)}
                >
                  <SelectTrigger id="origin">
                    <SelectValue placeholder="Sélectionnez une origine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non spécifié</SelectItem>
                    {bookingOrigins.map(origin => (
                      <SelectItem key={origin.id} value={origin.id}>{origin.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={photoUploading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={photoUploading}
          >
            {photoUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement en cours...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentEdit;