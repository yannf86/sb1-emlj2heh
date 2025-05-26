import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getImpactParameters } from '@/lib/db/parameters-impact';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getBookingOriginParameters } from '@/lib/db/parameters-booking-origin';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, getUsersByHotel } from '@/lib/db/users';
import { useDate } from '@/hooks/use-date';
import { useToast } from '@/hooks/use-toast';
import { findStatusIdByCode } from '@/lib/db/parameters-status';
import { Loader2, Image, X } from 'lucide-react';
import { deleteFromSupabase } from '@/lib/supabase';
import PhotoDisplay from '@/components/maintenance/PhotoDisplay';

interface IncidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  incident?: any; // Optional incident data for edit mode
  onSave: (formData: any) => void;
  isEditing?: boolean;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
  isOpen,
  onClose,
  incident,
  onSave,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hotelId: '',
    locationId: '',
    roomType: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    arrivalDate: '',
    departureDate: '',
    reservationAmount: '',
    origin: '',
    categoryId: '',
    impactId: '',
    description: '',
    statusId: '',
    receivedById: '',
    concludedById: '',
    resolutionDescription: ''
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [bookingOrigins, setBookingOrigins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Initialiser le formulaire avec les données de l'incident si en mode édition
  useEffect(() => {
    if (isEditing && incident) {
      setFormData({
        ...incident,
        photoPreview: incident.photoUrl || ''
      });
    } else {
      // Pour un nouvel incident, on essaie de trouver le statut "ouvert" par défaut
      const initializeDefaultStatus = async () => {
        try {
          const openStatusId = await findStatusIdByCode('open');
          if (openStatusId) {
            setFormData(prev => ({
              ...prev,
              statusId: openStatusId,
              // Make sure receivedById is set to current user
              receivedById: currentUser?.id || ''
            }));
          } else {
            // If no status found, still set the current user
            setFormData(prev => ({
              ...prev,
              receivedById: currentUser?.id || ''
            }));
          }
        } catch (error) {
          console.error('Error finding default status:', error);
          // Even on error, ensure current user is set
          setFormData(prev => ({
            ...prev,
            receivedById: currentUser?.id || ''
          }));
        }
      };
      initializeDefaultStatus();
    }
  }, [isEditing, incident, currentUser]);

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
        
        // Load booking origins
        const bookingOriginsData = await getBookingOriginParameters();
        setBookingOrigins(bookingOriginsData);
        
        // Load all users initially
        const allUsers = await getUsers();
        setUsers(allUsers);
        
        // Filter users based on selected hotel
        if (incident?.hotelId) {
          const hotelUsers = await getUsersByHotel(incident.hotelId);
          setFilteredUsers(hotelUsers);
        } else {
          setFilteredUsers(allUsers);
        }
        
        // Load locations for the current hotel
        if (incident?.hotelId) {
          const locationsData = await getHotelLocations(incident.hotelId);
          setLocations(locationsData);
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
  }, [incident?.hotelId, toast]);

  // Load locations when hotel changes
  useEffect(() => {
    const loadLocations = async () => {
      if (!formData.hotelId) {
        setLocations([]);
        return;
      }

      try {
        setLoadingLocations(true);
        const locationsData = await getHotelLocations(formData.hotelId);
        setLocations(locationsData);
      } catch (error) {
        console.error('Error loading locations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les lieux",
          variant: "destructive",
        });
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

  // Use the date hook for incident date
  const incidentDate = useDate({
    defaultDate: formData.date,
    defaultTime: formData.time,
    required: true
  });

  // Use the date hook for arrival/departure dates
  const arrivalDate = useDate({
    defaultDate: formData.arrivalDate,
    required: false
  });

  const departureDate = useDate({
    defaultDate: formData.departureDate,
    minDate: formData.arrivalDate,
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
        locationId: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === "none" ? null : value
      }));
    }
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
      // If editing and there's an existing photo URL, delete from Supabase
      if (isEditing && incident?.photoUrl) {
        console.log('🗑️ Deleting photo from Supabase:', incident.photoUrl);
        const success = await deleteFromSupabase(incident.photoUrl);
        if (success) {
          console.log('✅ Photo deleted successfully from Supabase');
          toast({
            title: "Photo supprimée",
            description: "La photo a été supprimée avec succès"
          });
        } else {
          console.error('❌ Failed to delete photo from Supabase');
          toast({
            title: "Avertissement",
            description: "La photo a été retirée du formulaire mais peut-être pas du stockage",
            variant: "destructive"
          });
        }
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
    // Validate required fields
    if (!formData.hotelId || !formData.locationId || !formData.categoryId || !formData.impactId || !formData.description || !formData.statusId || !formData.receivedById) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Update form data with dates from hooks
    const updatedFormData = {
      ...formData,
      date: incidentDate.date,
      time: incidentDate.time,
      arrivalDate: arrivalDate.date,
      departureDate: departureDate.date,
      // Ensure concludedAt and concludedById are properly handled
      concludedAt: formData.concludedById ? new Date().toISOString() : null,
      concludedById: formData.concludedById || null
    };

    onSave(updatedFormData);
  };

  // Update form data when dates change
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      date: incidentDate.date,
      time: incidentDate.time
    }));
  }, [incidentDate.date, incidentDate.time]);

  useEffect(() => {
    if (arrivalDate.date) {
      setFormData(prev => ({ 
        ...prev, 
        arrivalDate: arrivalDate.date 
      }));
    }
  }, [arrivalDate.date]);

  useEffect(() => {
    if (departureDate.date) {
      setFormData(prev => ({ 
        ...prev, 
        departureDate: departureDate.date 
      }));
    }
  }, [departureDate.date]);

  // Reset locationId when hotel changes
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        locationId: ''
      }));
    }
  }, [formData.hotelId, isEditing]);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-brand-500" />
            <p>Chargement des données en cours...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter hotels based on user permissions
  const filteredHotels = currentUser?.role === 'admin' 
    ? hotels 
    : hotels.filter(hotel => currentUser?.hotels?.includes(hotel.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'incident' : 'Nouvel Incident'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations de l\'incident' 
              : 'Créez un nouvel incident'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <DateTimePicker
            label="Date et heure de l'incident"
            date={incidentDate.date}
            time={incidentDate.time}
            onDateChange={incidentDate.setDate}
            onTimeChange={incidentDate.setTime}
            error={incidentDate.error}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Hôtel
              </Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    hotelId: value,
                    locationId: '' // Reset location when hotel changes
                  }));
                }}
              >
                <SelectTrigger id="hotelId">
                  <SelectValue placeholder="Sélectionnez un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
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
                Lieu
              </Label>
              <Select 
                name="locationId" 
                value={formData.locationId} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'locationId', value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
                disabled={!formData.hotelId || loadingLocations}
              >
                <SelectTrigger id="locationId">
                  <SelectValue placeholder={
                    !formData.hotelId 
                      ? "Sélectionnez d'abord un hôtel" 
                      : loadingLocations 
                        ? "Chargement..." 
                        : "Sélectionnez un lieu"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {loadingLocations ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
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
              <Label htmlFor="categoryId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Catégorie
              </Label>
              <Select 
                name="categoryId" 
                value={formData.categoryId} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'categoryId', value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
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
              <Label htmlFor="impactId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Impact
              </Label>
              <Select 
                name="impactId" 
                value={formData.impactId} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'impactId', value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger id="impactId">
                  <SelectValue placeholder="Sélectionnez un impact" />
                </SelectTrigger>
                <SelectContent>
                  {impacts.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun niveau d'impact disponible</SelectItem>
                  ) : (
                    impacts
                      .filter(impact => impact.id && impact.id !== '')
                      .map(impact => (
                        <SelectItem key={impact.id} value={impact.id}>{impact.label}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Description
            </Label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivedById" className="after:content-['*'] after:ml-0.5 after:text-red-500">Reçu par</Label>
              <Select 
                value={formData.receivedById || "none"} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'receivedById', value: value === "none" ? "" : value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
                disabled={loadingUsers}
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
            
            <div className="space-y-2">
              <Label htmlFor="concludedById">Conclu par</Label>
              <Select 
                value={formData.concludedById || "none"} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'concludedById', value: value === "none" ? "" : value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
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
              <Label htmlFor="statusId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Statut</Label>
              <Select 
                name="statusId" 
                value={formData.statusId} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'statusId', value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger id="statusId">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun statut disponible</SelectItem>
                  ) : (
                    statuses
                      .filter(status => status.id && status.id !== '') // Filter out empty IDs
                      .map(status => (
                        <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                      ))
                  )}
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
              <DateTimePicker
                label="Date d'arrivée"
                date={arrivalDate.date}
                time=""
                onDateChange={arrivalDate.setDate}
                onTimeChange={() => {}}
                error={arrivalDate.error}
              />
              
              <DateTimePicker
                label="Date de départ"
                date={departureDate.date}
                time=""
                onDateChange={departureDate.setDate}
                onTimeChange={() => {}}
                error={departureDate.error}
                disabled={!formData.arrivalDate}
              />
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
                  onValueChange={(value) => handleFormChange({ 
                    target: { name: 'origin', value: value === "none" ? "" : value } 
                  } as React.ChangeEvent<HTMLSelectElement>)}
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
          <Button variant="outline" onClick={onClose} disabled={photoUploading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={photoUploading}>
            {photoUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              isEditing ? 'Enregistrer les modifications' : 'Créer l\'incident'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentForm;