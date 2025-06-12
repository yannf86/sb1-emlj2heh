import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wrench, 
  Building, 
  Phone, 
  Mail, 
  Plus,
  Search, 
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  SlidersHorizontal,
  Loader2,
  Building2,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getHotels } from '@/lib/db/hotels';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { modules } from '@/lib/data';
import { TechnicianFormProvider } from './components/TechnicianFormContext';
import TechnicianFormContent from './components/TechnicianFormContent';
import { useTechnicians, useCreateTechnician, useUpdateTechnician, useDeleteTechnician } from '@/hooks/useTechnicians';

const TechniciansPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [newTechnicianDialogOpen, setNewTechnicianDialogOpen] = useState(false);
  const [editTechnicianDialogOpen, setEditTechnicianDialogOpen] = useState(false);
  const [deleteTechnicianDialogOpen, setDeleteTechnicianDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // React Query hooks
  const { 
    data: technicians = [], 
    isLoading: techniciansLoading, 
    refetch: refetchTechnicians 
  } = useTechnicians();
  
  const createTechnicianMutation = useCreateTechnician();
  const updateTechnicianMutation = useUpdateTechnician();
  const deleteTechnicianMutation = useDeleteTechnician();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    specialties: '',
    hourlyRate: ''
  });

  // Load hotels on mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setError(null);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
      } catch (error) {
        console.error('Error loading hotels:', error);
        setError('Impossible de charger les hôtels. Vérifiez votre connexion internet et réessayez.');
        
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter à la base de données. Vérifiez votre connexion internet.",
          variant: "destructive",
        });
      }
    };
    
    loadHotels();
  }, [toast]);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (newTechnicianDialogOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        specialties: '',
        hourlyRate: ''
      });
      // Pre-select user's accessible hotels by default
      setSelectedHotels(currentUser?.hotels || []);
      // Pre-select maintenance module by default
      setSelectedModules(['mod3']);
    }
  }, [newTechnicianDialogOpen, currentUser?.hotels]);

  // Initialize edit form when dialog opens
  useEffect(() => {
    if (editTechnicianDialogOpen && selectedTechnician) {
      setFormData({
        name: selectedTechnician.name || '',
        email: selectedTechnician.email || '',
        phone: selectedTechnician.phone || '',
        company: selectedTechnician.company || '',
        specialties: selectedTechnician.specialties?.join(', ') || '',
        hourlyRate: selectedTechnician.hourlyRate?.toString() || ''
      });
      setSelectedHotels(selectedTechnician.hotels || []);
      setSelectedModules(selectedTechnician.modules || []);
    }
  }, [editTechnicianDialogOpen, selectedTechnician]);

  // Filter technicians based on search query and hotel
  const filteredTechnicians = technicians.filter(technician => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = technician.name?.toLowerCase().includes(query);
      const matchesEmail = technician.email?.toLowerCase().includes(query);
      const matchesCompany = technician.company?.toLowerCase().includes(query);
      const matchesPhone = technician.phone?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesEmail && !matchesCompany && !matchesPhone) return false;
    }
    
    // Filter by hotel
    if (filterHotel !== 'all') {
      if (!technician.hotels?.includes(filterHotel)) return false;
    }
    
    return true;
  });

  // Check if current user can create technicians
  const canCreateTechnicians = useCallback(() => {
    if (!currentUser) return false;
    
    // Admins and hotel admins can create technicians
    return ['admin', 'hotel_admin'].includes(currentUser.role);
  }, [currentUser]);

  // Check if current user can edit a specific technician
  const canEditTechnician = useCallback((technician: any) => {
    if (!currentUser || !technician) return false;
    
    // Admins can edit any technician
    if (currentUser.role === 'admin') return true;
    
    // Hotel admins can edit technicians for their hotels
    if (currentUser.role === 'hotel_admin') {
      // Check if user has access to any of technician's hotels
      const accessibleHotels = technician.hotels.filter((hotelId: string) => 
        currentUser.hotels.includes(hotelId)
      );
      return accessibleHotels.length > 0;
    }
    
    return false;
  }, [currentUser]);

  // Open edit dialog for a technician
  const handleEdit = useCallback((technician: any) => {
    // Check if current user can edit this technician
    if (!canEditTechnician(technician)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour modifier ce technicien",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedTechnician(technician);
    setEditTechnicianDialogOpen(true);
  }, [canEditTechnician, toast]);

  // Open delete dialog for a technician
  const handleDelete = useCallback((technician: any) => {
    // Only admins and hotel admins can delete technicians
    if (!currentUser || !['admin', 'hotel_admin'].includes(currentUser.role)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour supprimer des techniciens",
        variant: "destructive",
      });
      return;
    }
    
    // Hotel admins can only delete technicians for their hotels
    if (currentUser.role === 'hotel_admin') {
      const accessibleHotels = technician.hotels.filter((hotelId: string) => 
        currentUser.hotels.includes(hotelId)
      );
      
      if (accessibleHotels.length === 0) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès aux hôtels de ce technicien",
          variant: "destructive",
        });
        return;
      }
    }
    
    setSelectedTechnician(technician);
    setDeleteTechnicianDialogOpen(true);
  }, [currentUser, toast]);

  // Form change handlers
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHotelsChange = useCallback((hotels: string[]) => {
    // Ensure hotels are actually accessible by the current user
    const accessibleHotels = hotels.filter(hotelId => hasHotelAccess(hotelId));
    setSelectedHotels(accessibleHotels);
  }, []);

  const handleModulesChange = useCallback((modules: string[]) => {
    setSelectedModules(modules);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterHotel('all');
    setFiltersExpanded(false);
  }, []);

  // Validate form before submission
  const validateForm = useCallback(() => {
    if (!formData.name) {
      return { valid: false, message: "Le nom est requis" };
    }
    if (!formData.email) {
      return { valid: false, message: "L'email est requis" };
    }
    if (!formData.phone) {
      return { valid: false, message: "Le téléphone est requis" };
    }
    if (selectedHotels.length === 0) {
      return { valid: false, message: "Au moins un hôtel doit être sélectionné" };
    }
    if (selectedModules.length === 0) {
      return { valid: false, message: "Au moins un module doit être sélectionné" };
    }
    
    return { valid: true, message: "" };
  }, [formData, selectedHotels, selectedModules]);

  // Handle create technician
  const handleCreateTechnician = useCallback(async () => {
    // Verify the user can create technicians
    if (!canCreateTechnicians()) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour créer des techniciens",
        variant: "destructive",
      });
      return;
    }
    
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
      setSaving(true);
      setError(null);

      // Parse specialties from string to array
      const specialtiesArray = formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : [];
      
      // Parse hourly rate to number, ensuring null instead of undefined for empty values
      const parsedHourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null;
      const hourlyRate = !isNaN(parsedHourlyRate) && parsedHourlyRate !== null ? parsedHourlyRate : null;

      // Create technician data
      const technicianData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || undefined,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
        hourlyRate,
        hotels: selectedHotels,
        modules: selectedModules
      };
      
      await createTechnicianMutation.mutateAsync(technicianData);

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        specialties: '',
        hourlyRate: ''
      });
      setSelectedHotels([]);
      setSelectedModules([]);
      setNewTechnicianDialogOpen(false);

      // Refresh data
      refetchTechnicians();
      
    } catch (error) {
      console.error('Error creating technician:', error);
      setError(`Erreur lors de la création du technicien: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du technicien",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [validateForm, formData, selectedHotels, selectedModules, toast, canCreateTechnicians, createTechnicianMutation, refetchTechnicians]);

  // Handle update technician
  const handleUpdateTechnician = useCallback(async () => {
    // Check if current user can edit this technician
    if (!canEditTechnician(selectedTechnician)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour modifier ce technicien",
        variant: "destructive",
      });
      return;
    }
    
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
      setSaving(true);
      setError(null);

      if (!selectedTechnician?.id) {
        throw new Error("ID technicien manquant");
      }

      // Parse specialties from string to array
      const specialtiesArray = formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : [];
      
      // Parse hourly rate to number, ensuring null instead of undefined for empty values
      const parsedHourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null;
      const hourlyRate = !isNaN(parsedHourlyRate) && parsedHourlyRate !== null ? parsedHourlyRate : null;

      // Update technician data
      const technicianData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || undefined,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
        hourlyRate,
        hotels: selectedHotels,
        modules: selectedModules
      };

      await updateTechnicianMutation.mutateAsync({ 
        id: selectedTechnician.id, 
        data: technicianData 
      });

      toast({
        title: "Technicien modifié",
        description: "Le technicien a été modifié avec succès",
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        specialties: '',
        hourlyRate: ''
      });
      setSelectedHotels([]);
      setSelectedModules([]);
      setEditTechnicianDialogOpen(false);
      setSelectedTechnician(null);

      // Refresh data
      refetchTechnicians();
      
    } catch (error: any) {
      console.error('Error updating technician:', error);
      setError(`Erreur lors de la mise à jour du technicien: ${error.message}`);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du technicien",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [validateForm, selectedTechnician, formData, selectedHotels, selectedModules, toast, canEditTechnician, updateTechnicianMutation, refetchTechnicians]);

  // Handle delete technician
  const handleDeleteTechnician = useCallback(async () => {
    if (!selectedTechnician?.id) return;

    try {
      setSaving(true);
      setError(null);

      await deleteTechnicianMutation.mutateAsync(selectedTechnician.id);

      toast({
        title: "Technicien supprimé",
        description: "Le technicien a été supprimé avec succès",
      });

      // Close dialog
      setDeleteTechnicianDialogOpen(false);
      setSelectedTechnician(null);

      // Refresh data
      refetchTechnicians();
      
    } catch (error: any) {
      console.error('Error deleting technician:', error);
      setError(`Erreur lors de la suppression du technicien: ${error.message}`);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du technicien",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedTechnician, toast, deleteTechnicianMutation, refetchTechnicians]);

  // Retry loading data
  const handleRetry = useCallback(async () => {
    setError(null);
    refetchTechnicians();
  }, [refetchTechnicians]);

  if (techniciansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des techniciens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Techniciens</h1>
          <p className="text-muted-foreground">Gérer les techniciens et leurs assignations pour la maintenance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {canCreateTechnicians() && (
            <Button onClick={() => setNewTechnicianDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Technicien
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de connexion</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className="ml-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un technicien..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filterHotel} onValueChange={setFilterHotel}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Building className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les hôtels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les hôtels</SelectItem>
              {hotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des Techniciens</CardTitle>
          <CardDescription>
            {filteredTechnicians.length} techniciens au total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technicien</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Hôtels</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Taux horaire</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechnicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {error ? (
                      <div className="flex flex-col items-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Impossible de charger les techniciens</p>
                      </div>
                    ) : searchQuery || filterHotel !== 'all' ? (
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun technicien trouvé avec ces critères</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Wrench className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun technicien trouvé</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTechnicians.map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell className="font-medium">{technician.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          {technician.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          {technician.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1 text-slate-400" />
                        {technician.company || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {technician.hotels?.length === hotels.length ? (
                        <span>Tous les hôtels</span>
                      ) : (
                        <span>{technician.hotels?.length || 0} hôtel(s)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {technician.modules?.length === modules.length ? (
                        <span>Tous les modules</span>
                      ) : (
                        <span>{technician.modules?.length || 0} module(s)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {technician.hourlyRate ? `${technician.hourlyRate} €/h` : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canEditTechnician(technician) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(technician)}
                          disabled={saving}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      )}
                      
                      {currentUser && ['admin', 'hotel_admin'].includes(currentUser.role) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(technician)}
                          disabled={saving}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* New Technician Dialog */}
      <Dialog 
        open={newTechnicianDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset form when dialog closes
            setFormData({
              name: '',
              email: '',
              phone: '',
              company: '',
              specialties: '',
              hourlyRate: ''
            });
            setSelectedHotels([]);
            setSelectedModules([]);
          }
          setNewTechnicianDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau technicien</DialogTitle>
            <DialogDescription>
              Créez un nouveau technicien pour la maintenance et les interventions techniques.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <TechnicianFormProvider
              initialFormData={formData}
              initialHotels={selectedHotels}
              initialModules={selectedModules}
              isNew={true}
              saving={saving}
              onFormChange={handleFormChange}
              onHotelsChange={handleHotelsChange}
              onModulesChange={handleModulesChange}
            >
              <TechnicianFormContent hotels={hotels} />
            </TechnicianFormProvider>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewTechnicianDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateTechnician}
              disabled={saving}
            >
              {saving ? 'Création...' : 'Créer le technicien'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Technician Dialog */}
      <Dialog 
        open={editTechnicianDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset selected technician when dialog closes
            setSelectedTechnician(null);
          }
          setEditTechnicianDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modifier le technicien</DialogTitle>
            <DialogDescription>
              Modifiez les informations et les attributions du technicien.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <TechnicianFormProvider
              initialFormData={formData}
              initialHotels={selectedHotels}
              initialModules={selectedModules}
              isNew={false}
              saving={saving}
              onFormChange={handleFormChange}
              onHotelsChange={handleHotelsChange}
              onModulesChange={handleModulesChange}
            >
              <TechnicianFormContent hotels={hotels} />
            </TechnicianFormProvider>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditTechnicianDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateTechnician}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Technician Dialog */}
      <Dialog 
        open={deleteTechnicianDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTechnician(null);
          }
          setDeleteTechnicianDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Supprimer le technicien</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce technicien ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTechnician && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Wrench className="h-5 w-5 mr-2 text-red-500" />
                <h3 className="text-lg font-medium">{selectedTechnician.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {selectedTechnician.email}
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {selectedTechnician.phone}
                </p>
                {selectedTechnician.company && (
                  <p className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    {selectedTechnician.company}
                  </p>
                )}
                <p className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {selectedTechnician.modules?.length || 0} module(s) assigné(s)
                </p>
              </div>
              
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Cette action supprimera définitivement le technicien et toutes ses données associées.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteTechnicianDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTechnician}
              disabled={saving}
            >
              {saving ? 'Suppression...' : 'Supprimer le technicien'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechniciansPage;