import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, UserPlus, PenTool as Tool, Building, Phone, Mail, FileText, Star, CheckCircle, XCircle, Edit, Trash2, RefreshCw, AlertCircle, Euro } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, deleteDoc, query, where, startAfter, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getHotels } from '@/lib/db/hotels';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckboxGroup } from './components/CheckboxGroup';

const TECHNICIAN_SPECIALTIES = [
  { id: 'spec1', name: 'Plomberie' },
  { id: 'spec2', name: 'Électricité' },
  { id: 'spec3', name: 'Climatisation/Chauffage' },
  { id: 'spec4', name: 'Menuiserie' },
  { id: 'spec5', name: 'Peinture' },
  { id: 'spec6', name: 'Serrurerie' },
  { id: 'spec7', name: 'Vitrage' },
  { id: 'spec8', name: 'Informatique/Réseau' },
  { id: 'spec9', name: 'Équipement de cuisine' },
  { id: 'spec10', name: 'Toiture/Étanchéité' },
];

interface TechnicianData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  specialties: string[];
  hourlyRate: string;
  hotels: string[];
  available: boolean;
  active: boolean;
  rating?: number;
  completedJobs?: number;
  createdAt?: string;
  updatedAt?: string;
}

const TechniciansPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newTechnicianDialogOpen, setNewTechnicianDialogOpen] = useState(false);
  const [editTechnicianDialogOpen, setEditTechnicianDialogOpen] = useState(false);
  const [deleteTechnicianDialogOpen, setDeleteTechnicianDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianData | null>(null);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<TechnicianData[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  // Form state
  const [formData, setFormData] = useState<TechnicianData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    specialties: [],
    hourlyRate: '',
    hotels: [],
    available: true,
    active: true
  });

  // Load technicians and hotels on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load technicians with pagination
  const loadTechnicians = async (firstPage = false) => {
    try {
      setLoading(true);
      
      let technicianQuery;
      
      if (firstPage) {
        technicianQuery = query(
          collection(db, 'technicians'),
          orderBy('name'),
          limit(pageSize)
        );
        setCurrentPage(1);
      } else if (lastVisible) {
        technicianQuery = query(
          collection(db, 'technicians'),
          orderBy('name'),
          startAfter(lastVisible),
          limit(pageSize)
        );
        setCurrentPage(prev => prev + 1);
      } else {
        // First load or reset
        technicianQuery = query(
          collection(db, 'technicians'),
          orderBy('name'),
          limit(pageSize)
        );
        setCurrentPage(1);
      }
      
      const snapshot = await getDocs(technicianQuery);
      
      // Check if there might be more results
      setHasMore(snapshot.docs.length === pageSize);
      
      // Save the last visible document for pagination
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
      
      const techniciansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TechnicianData[];
      
      if (firstPage) {
        setTechnicians(techniciansData);
      } else {
        setTechnicians(prev => [...prev, ...techniciansData]);
      }
      
    } catch (error) {
      console.error('Error loading technicians:', error);
      setError('Impossible de charger les techniciens. Vérifiez votre connexion internet.');
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les techniciens. Vérifiez votre connexion internet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load hotels
      const hotelsData = await getHotels();
      setHotels(hotelsData);
      
      // Load first page of technicians
      await loadTechnicians(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Impossible de charger les données. Vérifiez votre connexion internet.');
      toast({
        title: "Erreur de connexion",
        description: "Impossible de charger les données. Vérifiez votre connexion internet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize form data when dialog opens
  useEffect(() => {
    if (newTechnicianDialogOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        specialties: [],
        hourlyRate: '',
        hotels: [],
        available: true,
        active: true
      });
      setSelectedHotels([]);
      setSelectedSpecialties([]);
    }
  }, [newTechnicianDialogOpen]);

  // Initialize edit form when dialog opens
  useEffect(() => {
    if (editTechnicianDialogOpen && selectedTechnician) {
      setFormData({
        ...selectedTechnician
      });
      setSelectedHotels(selectedTechnician.hotels || []);
      setSelectedSpecialties(selectedTechnician.specialties || []);
    }
  }, [editTechnicianDialogOpen, selectedTechnician]);

  // Filter technicians based on search query
  const filteredTechnicians = technicians.filter(technician => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      technician.name?.toLowerCase().includes(query) ||
      technician.email?.toLowerCase().includes(query) ||
      technician.company?.toLowerCase().includes(query) ||
      technician.phone?.toLowerCase().includes(query)
    );
  });

  // Open edit dialog for a technician
  const handleEdit = (technician: TechnicianData) => {
    setSelectedTechnician(technician);
    setEditTechnicianDialogOpen(true);
  };

  // Open delete dialog for a technician
  const handleDelete = (technician: TechnicianData) => {
    setSelectedTechnician(technician);
    setDeleteTechnicianDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form boolean changes
  const handleBooleanChange = (name: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      return { valid: false, message: "Le nom est requis" };
    }
    if (!formData.email.trim()) {
      return { valid: false, message: "L'email est requis" };
    }
    if (!formData.phone.trim()) {
      return { valid: false, message: "Le téléphone est requis" };
    }
    if (selectedHotels.length === 0) {
      return { valid: false, message: "Au moins un hôtel doit être sélectionné" };
    }
    if (selectedSpecialties.length === 0) {
      return { valid: false, message: "Au moins une spécialité doit être sélectionnée" };
    }
    return { valid: true, message: "" };
  };

  // Handle create technician
  const handleCreateTechnician = async () => {
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

      // Create technician in Firestore
      const technicianData = {
        ...formData,
        specialties: selectedSpecialties,
        hotels: selectedHotels,
        rating: 0,
        completedJobs: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'technicians'), technicianData);
      
      toast({
        title: "Technicien créé",
        description: "Le technicien a été créé avec succès",
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        specialties: [],
        hourlyRate: '',
        hotels: [],
        available: true,
        active: true
      });
      setSelectedHotels([]);
      setSelectedSpecialties([]);
      setNewTechnicianDialogOpen(false);

      // Reload technicians
      await loadData();
    } catch (error: any) {
      console.error('Error creating technician:', error);
      setError(`Erreur lors de la création du technicien: ${error.message}`);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du technicien",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle update technician
  const handleUpdateTechnician = async () => {
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
        throw new Error("ID du technicien manquant");
      }

      // Update technician in Firestore
      const technicianRef = doc(db, 'technicians', selectedTechnician.id);
      await updateDoc(technicianRef, {
        ...formData,
        specialties: selectedSpecialties,
        hotels: selectedHotels,
        updatedAt: new Date().toISOString()
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
        specialties: [],
        hourlyRate: '',
        hotels: [],
        available: true,
        active: true
      });
      setSelectedHotels([]);
      setSelectedSpecialties([]);
      setEditTechnicianDialogOpen(false);

      // Reload technicians
      await loadData();
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
  };

  // Handle delete technician
  const handleDeleteTechnician = async () => {
    if (!selectedTechnician?.id) return;

    try {
      setSaving(true);
      setError(null);

      // Delete technician from Firestore
      await deleteDoc(doc(db, 'technicians', selectedTechnician.id));

      toast({
        title: "Technicien supprimé",
        description: "Le technicien a été supprimé avec succès",
      });

      // Close dialog
      setDeleteTechnicianDialogOpen(false);
      setSelectedTechnician(null);

      // Reload technicians
      await loadData();
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
  };

  // Load more technicians
  const loadMoreTechnicians = () => {
    if (hasMore) {
      loadTechnicians(false);
    }
  };

  // Retry loading data
  const handleRetry = () => {
    loadData();
  };

  // Render technician form content (common for create and edit)
  const renderTechnicianForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Nom complet
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">
            Entreprise
          </Label>
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="Nom de l'entreprise"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john.doe@example.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Téléphone
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourlyRate">
          Taux horaire (€)
        </Label>
        <Input
          id="hourlyRate"
          name="hourlyRate"
          type="number"
          value={formData.hourlyRate}
          onChange={handleInputChange}
          placeholder="45.00"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Spécialités</Label>
        <div className="p-4 border rounded-md max-h-36 overflow-y-auto">
          <CheckboxGroup
            items={TECHNICIAN_SPECIALTIES}
            selectedItems={selectedSpecialties}
            onSelectionChange={setSelectedSpecialties}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Hôtels accessibles</Label>
        <div className="p-4 border rounded-md max-h-36 overflow-y-auto">
          {hotels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun hôtel disponible</p>
          ) : (
            <CheckboxGroup
              items={hotels.map(hotel => ({ id: hotel.id, name: hotel.name }))}
              selectedItems={selectedHotels}
              onSelectionChange={setSelectedHotels}
            />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="technician-available" 
            checked={formData.available}
            onCheckedChange={value => handleBooleanChange('available', value)}
          />
          <Label htmlFor="technician-available" className="text-sm font-medium">
            Disponible pour des interventions
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="technician-active" 
            checked={formData.active}
            onCheckedChange={value => handleBooleanChange('active', value)}
          />
          <Label htmlFor="technician-active" className="text-sm font-medium">
            Technicien actif
          </Label>
        </div>
      </div>
    </div>
  );

  if (loading && technicians.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
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
          <p className="text-muted-foreground">Gérer les techniciens et prestataires pour les interventions techniques</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={() => setNewTechnicianDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau Technicien
          </Button>
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
      
      <div className="flex">
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
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Spécialités</TableHead>
                <TableHead>Taux horaire</TableHead>
                <TableHead>Évaluation</TableHead>
                <TableHead>Disponibilité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechnicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {error ? (
                      <div className="flex flex-col items-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Impossible de charger les techniciens</p>
                      </div>
                    ) : searchQuery ? (
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun technicien trouvé pour cette recherche</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Tool className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun technicien enregistré</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTechnicians.map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell className="font-medium">{technician.name}</TableCell>
                    <TableCell>{technician.company || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {technician.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {technician.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {technician.specialties?.slice(0, 3).map(specialty => {
                          const specialtyName = TECHNICIAN_SPECIALTIES.find(s => s.id === specialty)?.name || specialty;
                          return (
                            <span 
                              key={specialty}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            >
                              {specialtyName}
                            </span>
                          );
                        })}
                        {technician.specialties?.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{technician.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{technician.hourlyRate ? `${technician.hourlyRate}€/h` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span>{technician.rating ? technician.rating.toFixed(1) : '-'}</span>
                        {technician.completedJobs > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({technician.completedJobs} job{technician.completedJobs !== 1 && 's'})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {technician.active ? (
                        technician.available ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border-amber-300">
                            Occupé
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(technician)}
                        disabled={saving}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {hasMore && (
            <div className="flex justify-center p-4 border-t">
              <Button
                variant="outline"
                onClick={loadMoreTechnicians}
                disabled={loading}
              >
                {loading ? "Chargement..." : "Charger plus de techniciens"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Technician Dialog */}
      <Dialog 
        open={newTechnicianDialogOpen} 
        onOpenChange={(open) => {
          setNewTechnicianDialogOpen(open);
          if (!open) {
            // Reset form when dialog closes
            setFormData({
              name: '',
              email: '',
              phone: '',
              company: '',
              specialties: [],
              hourlyRate: '',
              hotels: [],
              available: true,
              active: true
            });
            setSelectedHotels([]);
            setSelectedSpecialties([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau technicien</DialogTitle>
            <DialogDescription>
              Créez un nouveau technicien pour les interventions de maintenance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {renderTechnicianForm()}
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
          setEditTechnicianDialogOpen(open);
          // Reset selected technician when dialog closes
          if (!open) {
            setSelectedTechnician(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modifier le technicien</DialogTitle>
            <DialogDescription>
              Modifiez les informations et les disponibilités du technicien.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {renderTechnicianForm()}
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
          setDeleteTechnicianDialogOpen(open);
          if (!open) {
            setSelectedTechnician(null);
          }
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
                <Tool className="h-5 w-5 mr-2 text-red-500" />
                <h3 className="text-lg font-medium">{selectedTechnician.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {selectedTechnician.company && (
                  <p className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {selectedTechnician.company}
                  </p>
                )}
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {selectedTechnician.email}
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {selectedTechnician.phone}
                </p>
              </div>
              
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Cette action supprimera définitivement le technicien et toutes ses références dans l'application.
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