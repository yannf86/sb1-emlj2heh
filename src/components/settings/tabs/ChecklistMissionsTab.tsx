import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckSquare,
  Building,
  ListChecks,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { getHotels } from '@/lib/db/hotels';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { 
  getChecklistMissionParameters, 
  createChecklistMissionParameter, 
  updateChecklistMissionParameter, 
  deleteChecklistMissionParameter 
} from '@/lib/db/parameters-checklist-missions';

const ChecklistMissionsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [missions, setMissions] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    hotelIds: [] as string[],
    isPermanent: false,
    imageUrl: '',
    attachmentPath: ''
  });
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Load missions, hotels and services
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load checklist mission parameters
        const missionsData = await getChecklistMissionParameters();
        setMissions(missionsData);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load services (from logbook_services)
        // Note: This is a placeholder - you'll need to implement this function
        const servicesData = await getLogbookServices();
        setServices(servicesData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Impossible de charger les données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Temporary placeholder function to get services
  const getLogbookServices = async () => {
    // This is a placeholder - in a real implementation, you would fetch from Firebase
    return [
      { id: 'reception', name: 'Réception', icon: '👥' },
      { id: 'housekeeping', name: 'Housekeeping', icon: '🛏️' },
      { id: 'pdj', name: 'Petit déjeuner', icon: '🍳' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
      { id: 'technical', name: 'Technique', icon: '🔧' },
      { id: 'security', name: 'Sécurité', icon: '🔒' }
    ];
  };
  
  // Filter missions based on search and filters
  const filteredMissions = missions.filter(mission => {
    // Filter by hotel
    if (filterHotel !== 'all' && !mission.hotelIds?.includes(filterHotel)) {
      return false;
    }
    
    // Filter by service
    if (filterService !== 'all' && mission.serviceId !== filterService) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = mission.title?.toLowerCase().includes(query);
      const matchesDescription = mission.description?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
  
  // Handle opening the form dialog for a new mission
  const handleNewMission = () => {
    setSelectedMission(null);
    setFormData({
      title: '',
      description: '',
      serviceId: '',
      hotelIds: currentUser?.hotels || [],
      isPermanent: false,
      imageUrl: '',
      attachmentPath: ''
    });
    setMissionDialogOpen(true);
  };
  
  // Handle opening the form dialog to edit a mission
  const handleEditMission = (mission: any) => {
    setSelectedMission(mission);
    setFormData({
      title: mission.title || '',
      description: mission.description || '',
      serviceId: mission.serviceId || '',
      hotelIds: mission.hotelIds || [],
      isPermanent: mission.isPermanent || false,
      imageUrl: mission.imageUrl || '',
      attachmentPath: mission.attachmentPath || ''
    });
    setMissionDialogOpen(true);
  };
  
  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (mission: any) => {
    setSelectedMission(mission);
    setDeleteDialogOpen(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle hotel selection toggle
  const handleHotelToggle = (hotelId: string) => {
    setFormData(prev => {
      const hotelIds = [...prev.hotelIds];
      const index = hotelIds.indexOf(hotelId);
      
      if (index === -1) {
        hotelIds.push(hotelId);
      } else {
        hotelIds.splice(index, 1);
      }
      
      return { ...prev, hotelIds };
    });
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Form validation
      if (!formData.title) {
        toast({
          title: "Erreur de validation",
          description: "Le titre est obligatoire",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.serviceId) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez sélectionner un service",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.hotelIds.length === 0) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez sélectionner au moins un hôtel",
          variant: "destructive",
        });
        return;
      }
      
      setSaving(true);
      
      // Prepare the data
      const missionData = {
        ...formData,
        type: 'checklist_mission',
        active: true
      };
      
      if (selectedMission) {
        // Update existing mission
        await updateChecklistMissionParameter(selectedMission.id, missionData);
        toast({
          title: "Mission mise à jour",
          description: "La mission a été mise à jour avec succès",
        });
      } else {
        // Create new mission
        await createChecklistMissionParameter(missionData);
        toast({
          title: "Mission créée",
          description: "La nouvelle mission a été créée avec succès",
        });
      }
      
      // Reload missions
      const missionsData = await getChecklistMissionParameters();
      setMissions(missionsData);
      
      // Close dialog
      setMissionDialogOpen(false);
      
    } catch (error) {
      console.error('Error saving mission:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la mission",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedMission) return;
    
    try {
      setSaving(true);
      
      await deleteChecklistMissionParameter(selectedMission.id);
      
      toast({
        title: "Mission supprimée",
        description: "La mission a été supprimée avec succès",
      });
      
      // Reload missions
      const missionsData = await getChecklistMissionParameters();
      setMissions(missionsData);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setSelectedMission(null);
      
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la mission",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Get service name by ID
  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Service inconnu';
  };
  
  // Get service icon by ID
  const getServiceIcon = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.icon : '📋';
  };
  
  // Get hotel names for a list of hotel IDs
  const getHotelNames = (hotelIds: string[]): string => {
    if (!hotelIds || hotelIds.length === 0) return 'Aucun hôtel';
    
    if (hotelIds.length === hotels.length) {
      return 'Tous les hôtels';
    }
    
    const hotelNames = hotelIds.map(id => {
      const hotel = hotels.find(h => h.id === id);
      return hotel ? hotel.name : 'Hôtel inconnu';
    });
    
    if (hotelNames.length <= 2) {
      return hotelNames.join(', ');
    }
    
    return `${hotelNames.length} hôtels`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <p className="text-lg font-medium">Chargement des missions de check-list...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5 text-brand-500" />
              Missions de Check-list
            </CardTitle>
            <CardDescription>
              Configuration des tâches quotidiennes pour les check-lists par service et par hôtel
            </CardDescription>
          </div>
          
          <Button onClick={handleNewMission}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Mission
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une mission..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    <span className="mr-2">{service.icon}</span>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterHotel} onValueChange={setFilterHotel}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les hôtels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les hôtels</SelectItem>
                {hotels.map(hotel => (
                  <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Hôtels</TableHead>
                <TableHead>Permanent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                    <p>Aucune mission trouvée</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNewMission}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une mission
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMissions.map(mission => (
                  <TableRow key={mission.id}>
                    <TableCell>
                      <div className="font-medium">{mission.title}</div>
                      {mission.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {mission.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getServiceIcon(mission.serviceId)}</span>
                        <span>{getServiceName(mission.serviceId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{getHotelNames(mission.hotelIds)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mission.isPermanent ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckSquare className="mr-1 h-3 w-3" />
                          Permanent
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Non</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditMission(mission)}
                        disabled={saving}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteClick(mission)}
                        disabled={saving}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Mission Dialog */}
      <Dialog 
        open={missionDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMission(null);
          }
          setMissionDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMission ? 'Modifier la mission' : 'Nouvelle mission de check-list'}
            </DialogTitle>
            <DialogDescription>
              {selectedMission 
                ? 'Modifiez les détails de cette mission de check-list' 
                : 'Créez une nouvelle mission pour les check-lists quotidiennes'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la mission</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="ex: Vérifier l'état des chambres"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Instructions détaillées pour accomplir cette mission"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serviceId">Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => handleSelectChange('serviceId', value)}
              >
                <SelectTrigger id="serviceId">
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
              <Label>Hôtels concernés</Label>
              <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                {hotels.map(hotel => (
                  <div key={hotel.id} className="flex items-center space-x-2 py-1">
                    <Switch 
                      id={`hotel-${hotel.id}`}
                      checked={formData.hotelIds.includes(hotel.id)}
                      onCheckedChange={() => handleHotelToggle(hotel.id)}
                    />
                    <Label htmlFor={`hotel-${hotel.id}`} className="cursor-pointer">
                      {hotel.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPermanent" className="cursor-pointer">
                  Mission permanente
                </Label>
                <Switch
                  id="isPermanent"
                  checked={formData.isPermanent}
                  onCheckedChange={(checked) => handleSwitchChange('isPermanent', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Les missions permanentes sont dupliquées automatiquement chaque jour.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de l'image (optionnelle)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://exemple.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                L'image sera affichée comme référence pour cette mission
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attachmentPath">Chemin du fichier attaché (optionnel)</Label>
              <Input
                id="attachmentPath"
                name="attachmentPath"
                value={formData.attachmentPath}
                onChange={handleInputChange}
                placeholder="https://exemple.com/document.pdf"
              />
              <p className="text-xs text-muted-foreground">
                Un lien vers un fichier complémentaire pour cette mission
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMissionDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {selectedMission ? 'Enregistrer les modifications' : 'Créer la mission'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMission(null);
          }
          setDeleteDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette mission de check-list ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMission && (
            <div className="py-4">
              <div className="font-medium mb-2">{selectedMission.title}</div>
              {selectedMission.description && (
                <p className="text-sm text-muted-foreground mb-4">{selectedMission.description}</p>
              )}
              
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cette suppression ne s'applique qu'aux configurations futures. 
                  Les tâches déjà créées pour les journées passées ou présentes ne seront pas affectées.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={saving}
            >
              {saving ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChecklistMissionsTab;