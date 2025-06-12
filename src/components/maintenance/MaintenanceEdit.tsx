import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image } from 'lucide-react';
import { users } from '@/lib/data';
import { Maintenance, MaintenanceEditFormData } from './types/maintenance.types';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getInterventionTypeParameters } from '@/lib/db/parameters-intervention-type';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { useToast } from '@/hooks/use-toast';
import { updateMaintenanceRequest } from '@/lib/db/maintenance';
import { deleteFromSupabase } from '../../lib/supabase';
import PhotoDisplay from './PhotoDisplay';

interface MaintenanceEditProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance;
  onSave: (updatedMaintenance: Maintenance) => void;
}

const MaintenanceEdit: React.FC<MaintenanceEditProps> = ({
  isOpen,
  onClose,
  maintenance,
  onSave
}) => {
  const [formData, setFormData] = useState<MaintenanceEditFormData>({
    ...maintenance,
    photoBeforePreview: maintenance.photoBefore || '',
    photoAfterPreview: maintenance.photoAfter || '',
    photoBefore: null,
    photoAfter: null
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBeforeUploading, setPhotoBeforeUploading] = useState(false);
  const [photoAfterUploading, setPhotoAfterUploading] = useState(false);
  const { toast } = useToast();
  
  // Get available staff based on selected hotel
  const availableStaff = users.filter(user => 
    user.role === 'admin' || 
    (user.hotels && user.hotels.includes(formData.hotelId))
  );

  // Load data on mount
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
        
        // Load locations for the selected hotel
        if (formData.hotelId) {
          const locationsData = await getHotelLocations(formData.hotelId);
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
  }, [formData.hotelId, toast]);

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'photoBefore' | 'photoAfter') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (fileType === 'photoBefore' || fileType === 'photoAfter') {
        // Set uploading state
        if (fileType === 'photoBefore') setPhotoBeforeUploading(true);
        else setPhotoAfterUploading(true);
        
        // Validate file size and type
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
      // If we have an existing photo URL, delete it from Supabase
      if (maintenance?.photoBefore) {
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
      
      // Update form data
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
      // If we have an existing photo URL, delete it from Supabase
      if (maintenance?.photoAfter) {
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
      
      // Update form data
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

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Update maintenance request
      await updateMaintenanceRequest(maintenance.id, formData);

      // Create updated maintenance object for parent component
      const updatedMaintenance: Maintenance = {
        ...formData,
        // Remove file properties that shouldn't be part of the Maintenance type
        photoBefore: formData.photoBeforePreview || null,
        photoAfter: formData.photoAfterPreview || null
      } as any;
      
      toast({
        title: "Intervention mise à jour",
        description: "L'intervention technique a été mise à jour avec succès",
      });

      onSave(updatedMaintenance);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'intervention",
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
          <DialogTitle>Modifier l'intervention</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'intervention technique
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
              <SelectTrigger>
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
                        onChange={(e) => handleFileUpload(e, 'photoBefore')}
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
                        onChange={(e) => handleFileUpload(e, 'photoAfter')}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Assignation</h3>
            
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
                <Label htmlFor="assignedUserId">Utilisateur assigné</Label>
                <Select 
                  value={formData.assignedUserId || "unassigned"} 
                  onValueChange={(value) => handleSelectChange('assignedUserId', value === "unassigned" ? null : value)}
                >
                  <SelectTrigger id="assignedUserId">
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assigné</SelectItem>
                    {availableStaff.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires</Label>
              <textarea
                id="comments"
                name="comments"
                className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                value={formData.comments || ''}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={saving || photoBeforeUploading || photoAfterUploading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saving || photoBeforeUploading || photoAfterUploading}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
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

export default MaintenanceEdit;