import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Image, FileUp, X, Loader2 } from 'lucide-react';
import { Maintenance, MaintenanceFormData } from './types/maintenance.types';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getInterventionTypeParameters } from '@/lib/db/parameters-intervention-type';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getUsers } from '@/lib/db/users';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { deleteFromSupabase } from '@/lib/supabase';
import QuoteFileDisplay from './QuoteFileDisplay';
import PhotoDisplay from './PhotoDisplay';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isEditing?: boolean;
  maintenance?: Maintenance;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing = false,
  maintenance
}) => {
  const currentUser = getCurrentUser();
  const { toast } = useToast();

  // Initialisation du formulaire selon le mode (création ou édition)
  const [formData, setFormData] = useState<any>(() => {
    if (isEditing && maintenance) {
      return {
        ...maintenance,
        photoBeforePreview: maintenance.photoBefore || '',
        photoAfterPreview: maintenance.photoAfter || '',
        hasQuote: !!maintenance.quoteUrl
      };
    } else {
      return {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hotelId: currentUser?.role === 'standard' && currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : '',
        locationId: '',
        interventionTypeId: '',
        description: '',
        statusId: '',
        receivedById: currentUser?.id || '',
        technicianId: null,
        estimatedAmount: '',
        finalAmount: '',
        startDate: '',
        endDate: '',
        comments: '',
        quoteStatus: 'pending'
      };
    }
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [photoBeforeUploading, setPhotoBeforeUploading] = useState(false);
  const [photoAfterUploading, setPhotoAfterUploading] = useState(false);

  // Initialize the quote status from legacy data if needed
  useEffect(() => {
    if (isEditing && maintenance && !formData.quoteStatus) {
      if (maintenance.quoteAccepted !== undefined) {
        setFormData(prev => ({
          ...prev,
          quoteStatus: maintenance.quoteAccepted ? 'accepted' : 'rejected'
        }));
      } else if (maintenance.quoteUrl) {
        setFormData(prev => ({
          ...prev,
          quoteStatus: 'pending'
        }));
      }
    }
  }, [isEditing, maintenance, formData.quoteStatus]);

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
        
        // Load users for technician selection
        const usersData = await getUsers();
        setUsers(usersData);
        
        // Load locations for the selected hotel if editing
        if (isEditing && maintenance?.hotelId) {
          const locationsData = await getHotelLocations(maintenance.hotelId);
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
  }, [isEditing, maintenance, toast]);

  // Load locations when hotel changes
  useEffect(() => {
    const loadLocations = async () => {
      if (!formData.hotelId) {
        setLocations([]);
        // Clear locationId when hotel is changed
        setFormData(prev => ({
          ...prev,
          locationId: ''
        }));
        return;
      }

      try {
        setLoadingLocations(true);
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

  // Set receivedById to current user's ID if not already set
  useEffect(() => {
    if (currentUser && !formData.receivedById && !isEditing) {
      setFormData(prev => ({
        ...prev,
        receivedById: currentUser.id
      }));
    }
  }, [currentUser, formData.receivedById, isEditing]);

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
      // When hotel changes, reset locationId and technicianId
      setFormData(prev => ({
        ...prev,
        [name]: value,
        locationId: '', // Reset location when hotel changes
        technicianId: null // Reset technician when hotel changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === "none" ? null : value
      }));
    }
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'photoBefore' | 'photoAfter' | 'quoteFile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (fileType === 'photoBefore' || fileType === 'photoAfter') {
        // Set uploading state
        if (fileType === 'photoBefore') setPhotoBeforeUploading(true);
        else setPhotoAfterUploading(true);
        
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: "La taille du fichier ne doit pas dépasser 2MB",
            variant: "destructive",
          });
          if (fileType === 'photoBefore') setPhotoBeforeUploading(false);
          else setPhotoAfterUploading(false);
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Format de fichier incorrect",
            description: "Veuillez sélectionner un fichier image (JPG, PNG, etc.)",
            variant: "destructive",
          });
          if (fileType === 'photoBefore') setPhotoBeforeUploading(false);
          else setPhotoAfterUploading(false);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            [fileType]: file,
            [`${fileType}Preview`]: reader.result as string
          }));
          if (fileType === 'photoBefore') setPhotoBeforeUploading(false);
          else setPhotoAfterUploading(false);
        };
        reader.onerror = () => {
          if (fileType === 'photoBefore') setPhotoBeforeUploading(false);
          else setPhotoAfterUploading(false);
          toast({
            title: "Erreur de lecture",
            description: "Impossible de lire le fichier sélectionné",
            variant: "destructive",
          });
        };
        reader.readAsDataURL(file);
      } else if (fileType === 'quoteFile') {
        // Validate file size (5MB max for documents)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: "La taille du fichier ne doit pas dépasser 5MB",
            variant: "destructive",
          });
          return;
        }
        
        // Accept common document formats
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
          toast({
            title: "Format de fichier incorrect",
            description: "Veuillez sélectionner un fichier de type PDF, DOC ou DOCX",
            variant: "destructive",
          });
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          quoteFile: file
        }));
        
        toast({
          title: "Fichier ajouté",
          description: `Le fichier ${file.name} a été ajouté avec succès`
        });
      }
    } catch (error) {
      if (fileType === 'photoBefore') setPhotoBeforeUploading(false);
      else if (fileType === 'photoAfter') setPhotoAfterUploading(false);
      console.error('Error handling file upload:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du fichier",
        variant: "destructive",
      });
    }
  };

  // Handle delete photo before
  const handleDeletePhotoBefore = async () => {
    try {
      // If we are in edit mode and have an existing photo URL, delete it from Supabase
      if (isEditing && maintenance?.photoBefore) {
        console.log('🗑️ Deleting photoBefore from Supabase:', maintenance.photoBefore);
        const success = await deleteFromSupabase(maintenance.photoBefore);
        if (success) {
          console.log('✅ Photo before deleted successfully from Supabase');
          toast({
            title: "Photo supprimée",
            description: "La photo du problème a été supprimée avec succès",
          });
        } else {
          console.error('❌ Failed to delete photo from Supabase');
          toast({
            title: "Avertissement",
            description: "La photo a été retirée du formulaire mais peut-être pas du stockage",
            variant: "destructive",
          });
        }
      }
      
      // Update form data to remove the photo reference
      setFormData(prev => ({
        ...prev,
        photoBefore: null,
        photoBeforePreview: ''
      }));
    } catch (error) {
      console.error('Error deleting photo before:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive",
      });
    }
  };

  // Handle delete photo after
  const handleDeletePhotoAfter = async () => {
    try {
      // If we are in edit mode and have an existing photo URL, delete it from Supabase
      if (isEditing && maintenance?.photoAfter) {
        console.log('🗑️ Deleting photoAfter from Supabase:', maintenance.photoAfter);
        const success = await deleteFromSupabase(maintenance.photoAfter);
        if (success) {
          console.log('✅ Photo after deleted successfully from Supabase');
          toast({
            title: "Photo supprimée",
            description: "La photo après résolution a été supprimée avec succès",
          });
        } else {
          console.error('❌ Failed to delete photo from Supabase');
          toast({
            title: "Avertissement",
            description: "La photo a été retirée du formulaire mais peut-être pas du stockage",
            variant: "destructive",
          });
        }
      }
      
      // Update form data to remove the photo reference
      setFormData(prev => ({
        ...prev,
        photoAfter: null,
        photoAfterPreview: ''
      }));
    } catch (error) {
      console.error('Error deleting photo after:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete quote file
  const handleDeleteQuoteFile = async () => {
    try {
      // If we are in edit mode and have an existing quote URL, delete it from Supabase
      if (isEditing && maintenance?.quoteUrl) {
        console.log('🗑️ Deleting quoteUrl from Supabase:', maintenance.quoteUrl);
        const success = await deleteFromSupabase(maintenance.quoteUrl);
        if (success) {
          console.log('✅ Quote file deleted successfully from Supabase');
          toast({
            title: "Devis supprimé",
            description: "Le fichier de devis a été supprimé avec succès",
          });
        } else {
          console.error('❌ Failed to delete quote from Supabase');
          toast({
            title: "Avertissement",
            description: "Le devis a été retiré du formulaire mais peut-être pas du stockage",
            variant: "destructive",
          });
        }
      }
      
      // Update form data to remove quote references
      setFormData(prev => ({
        ...prev,
        quoteFile: null,
        quoteUrl: null,
        hasQuote: false
      }));
    } catch (error) {
      console.error('Error deleting quote file:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du devis",
        variant: "destructive",
      });
    }
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
    if (!formData.interventionTypeId) {
      return { valid: false, message: "Veuillez sélectionner un type d'intervention" };
    }
    if (!formData.description || formData.description.trim().length < 10) {
      return { valid: false, message: "La description doit contenir au moins 10 caractères" };
    }
    
    // Additional validation for edit mode
    if (isEditing) {
      if (!formData.statusId) {
        return { valid: false, message: "Veuillez sélectionner un statut" };
      }
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
    
    try {
      setIsSubmitting(true);
      
      // For new interventions, set default status if not specified
      if (!isEditing && !formData.statusId) {
        // Find the "open" status
        const openStatus = statusParams.find(s => s.code === 'open');
        formData.statusId = openStatus ? openStatus.id : statusParams[0]?.id;
      }
      
      await onSubmit(formData);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission du formulaire",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
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
            {isEditing 
              ? 'Modifier l\'intervention' 
              : 'Nouvelle Intervention Technique'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations de l\'intervention technique' 
              : 'Créez une nouvelle demande d\'intervention technique'}
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
                value={formData.date || ''}
                onChange={handleFormChange}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time || ''}
                onChange={handleFormChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Hôtel</Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => handleSelectChange('hotelId', value)}
                disabled={currentUser?.role === 'standard' && currentUser?.hotels?.length === 1 || isSubmitting}
              >
                <SelectTrigger id="hotelId">
                  <SelectValue placeholder="Sélectionnez un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHotels.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun hôtel disponible</SelectItem>
                  ) : (
                    filteredHotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locationId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Lieu</Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleSelectChange('locationId', value)}
                disabled={!formData.hotelId || loadingLocations || isSubmitting}
              >
                <SelectTrigger id="locationId">
                  <SelectValue placeholder={!formData.hotelId ? "Sélectionnez d'abord un hôtel" : loadingLocations ? "Chargement..." : "Sélectionnez un lieu"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingLocations ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
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
          
          <div className="space-y-2">
            <Label htmlFor="interventionTypeId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Type d'intervention</Label>
            <Select 
              value={formData.interventionTypeId} 
              onValueChange={(value) => handleSelectChange('interventionTypeId', value)}
              disabled={isSubmitting}
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
            <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">Description du problème</Label>
            <textarea
              id="description"
              name="description"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Décrivez le problème technique..."
              value={formData.description}
              onChange={handleFormChange}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Photo avant */}
          <div className="space-y-2">
            <Label htmlFor="photoBefore">Photo du problème</Label>
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
                isEditable={true}
              />
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photoBefore')}
                    disabled={isSubmitting || photoBeforeUploading}
                  />
                </label>
              </div>
            )}
          </div>
          
          {/* Photo après */}
          <div className="space-y-2">
            <Label htmlFor="photoAfter">Photo après résolution</Label>
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
                isEditable={true}
              />
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photoAfter')}
                    disabled={isSubmitting || photoAfterUploading}
                  />
                </label>
              </div>
            )}
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="hasQuote" 
                checked={formData.hasQuote} 
                onCheckedChange={(checked) => {
                  if (!checked && formData.quoteUrl) {
                    handleDeleteQuoteFile();
                  } else {
                    handleSwitchChange('hasQuote', checked);
                  }
                }}
                disabled={isSubmitting}
              />
              <Label htmlFor="hasQuote">Devis disponible</Label>
            </div>
            
            {formData.hasQuote && (
              <>
                {/* Affichage du fichier de devis s'il existe déjà */}
                {formData.quoteUrl && !formData.quoteFile && (
                  <div className="mb-3">
                    <QuoteFileDisplay 
                      quoteUrl={formData.quoteUrl}
                      onDelete={handleDeleteQuoteFile}
                    />
                  </div>
                )}
                
                {/* Champ d'upload pour un nouveau fichier de devis */}
                <div className="space-y-2">
                  <Label htmlFor="quoteFile">Fichier du devis {formData.quoteUrl ? '(remplacer)' : ''}</Label>
                  <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="w-6 h-6 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Cliquez pour uploader le devis</span>
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX (MAX. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => handleFileUpload(e, 'quoteFile')}
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                  {formData.quoteFile && (
                    <div className="flex justify-between items-center mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-sm text-blue-600">
                        Fichier sélectionné: {formData.quoteFile.name} ({(formData.quoteFile.size / 1024).toFixed(0)} KB)
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setFormData(prev => ({ ...prev, quoteFile: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quoteAmount">Montant du devis (€)</Label>
                    <Input
                      id="quoteAmount"
                      name="quoteAmount"
                      type="number"
                      placeholder="0.00"
                      value={formData.quoteAmount || ''}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quoteStatus">Statut du devis</Label>
                    <Select
                      value={formData.quoteStatus || 'pending'}
                      onValueChange={(value) => handleSelectChange('quoteStatus', value as 'pending' | 'accepted' | 'rejected')}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="quoteStatus">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="accepted">Accepté</SelectItem>
                        <SelectItem value="rejected">Refusé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Assignation & Suivi</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technicianId">Technicien</Label>
                <Select 
                  value={formData.technicianId || "unassigned"} 
                  onValueChange={(value) => handleSelectChange('technicianId', value === "unassigned" ? null : value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="technicianId">
                    <SelectValue placeholder="Sélectionner un technicien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assigné</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statusId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Statut</Label>
                <Select 
                  value={formData.statusId} 
                  onValueChange={(value) => handleSelectChange('statusId', value)}
                  disabled={isSubmitting}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
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
                  value={formData.estimatedAmount || ''}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="finalAmount">Montant final (€)</Label>
                <Input
                  id="finalAmount"
                  name="finalAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.finalAmount || ''}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires</Label>
              <textarea
                id="comments"
                name="comments"
                className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Commentaires additionnels..."
                value={formData.comments || ''}
                onChange={handleFormChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting || photoBeforeUploading || photoAfterUploading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || photoBeforeUploading || photoAfterUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              isEditing ? 'Enregistrer les modifications' : 'Créer l\'intervention'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceForm;