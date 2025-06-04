import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PenTool as Tool, 
  Search, 
  Download, 
  Plus, 
  RefreshCw, 
  SlidersHorizontal, 
  Wrench, 
  FileText,
  Upload,
  Check,
  X,
  Image,
  FileUp,
  Clock,
  Euro,
  CalendarRange,
  User,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportMaintenanceRequests } from '@/lib/exportUtils';
import { exportMaintenanceRequestsToPDF } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { getMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest } from '@/lib/db/maintenance';
import { ensureMaintenanceCollection } from '@/lib/db/ensure-collections';
import { getHotels, getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getInterventionTypeLabel } from '@/lib/db/parameters-intervention-type';
import { getStatusLabel } from '@/lib/db/parameters-status';
import { getUserName, getUsers } from '@/lib/db/users';
import { sendMaintenanceEmailNotifications } from '@/lib/email';
import { getTechnicians } from '@/lib/db/technicians';

// Import components
import MaintenanceDialog from '@/components/maintenance/MaintenanceDialog';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import MaintenanceList from '@/components/maintenance/MaintenanceList';
import MaintenanceFilters from '@/components/maintenance/MaintenanceFilters';

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MaintenancePage = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterAssignedUser, setFilterAssignedUser] = useState('all'); // NOUVEAU: filtre par utilisateur assigné
  const [filterTechnician, setFilterTechnician] = useState('all'); // NOUVEAU: filtre par technicien
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [collectionChecked, setCollectionChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Load maintenance requests on mount
  useEffect(() => {
    const loadMaintenanceRequests = async () => {
      try {
        // Vérifier si la collection existe et la créer si nécessaire
        if (!collectionChecked) {
          await ensureMaintenanceCollection();
          setCollectionChecked(true);
        }
        
        const data = await getMaintenanceRequests();
        setMaintenanceRequests(data);
      } catch (error) {
        console.error('Error loading maintenance requests:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes de maintenance",
          variant: "destructive",
        });
      }
    };
    loadMaintenanceRequests();
    loadAvailableHotels();
    loadAllUsers();
    loadTechnicians();
  }, [collectionChecked, toast]);
  
  // Function to load hotels the current user has access to
  const loadAvailableHotels = async () => {
    try {
      // For admin users, get all hotels
      // For standard users, filter hotels by user's assigned hotels
      const allHotels = await getHotels();
      
      if (currentUser?.role === 'admin') {
        setAvailableHotels(allHotels);
      } else if (currentUser) {
        const userHotels = allHotels.filter(hotel => 
          currentUser.hotels.includes(hotel.id)
        );
        setAvailableHotels(userHotels);
      }
    } catch (error) {
      console.error('Error loading hotels:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les hôtels",
        variant: "destructive",
      });
    }
  };
  
  // Function to load all users
  const loadAllUsers = async () => {
    try {
      const usersData = await getUsers();
      setAllUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  
  // Function to load all technicians
  const loadTechnicians = async () => {
    try {
      const techniciansData = await getTechnicians();
      setTechnicians(techniciansData);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };
  
  // New maintenance dialog
  const [newMaintenanceDialogOpen, setNewMaintenanceDialogOpen] = useState(false);
  
  // Edit maintenance dialog
  const [editMaintenanceDialogOpen, setEditMaintenanceDialogOpen] = useState(false);
  
  // View maintenance dialog
  const [viewMaintenanceDialogOpen, setViewMaintenanceDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  
  // Filter maintenance requests based on selected filters
  const filteredRequests = maintenanceRequests.filter(request => {
    // Filter by hotel
    if (filterHotel !== 'all' && request.hotelId !== filterHotel) return false;
    
    // Filter by status
    if (filterStatus !== 'all' && request.statusId !== filterStatus) return false;
    
    // Filter by intervention type
    if (filterType !== 'all' && request.interventionTypeId !== filterType) return false;
    
    // Filter by assigned user
    if (filterAssignedUser === 'none' && request.assignedUserId) return false;
    if (filterAssignedUser !== 'all' && filterAssignedUser !== 'none' && 
        request.assignedUserId !== filterAssignedUser) return false;
    
    // Filter by technician
    if (filterTechnician === 'none' && 
        (request.technicianId || (request.technicianIds && request.technicianIds.length > 0))) {
      return false;
    }
    
    if (filterTechnician !== 'all' && filterTechnician !== 'none') {
      // Check in both technicianId (legacy) and technicianIds array
      const inTechnicianId = request.technicianId === filterTechnician;
      const inTechnicianIds = request.technicianIds && 
                             request.technicianIds.includes(filterTechnician);
      
      if (!inTechnicianId && !inTechnicianIds) return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = request.description.toLowerCase().includes(query);
      
      if (!matchesDescription) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Handle form submission for new maintenance
  const handleSubmitNewMaintenance = async (formData: any) => {
    try {
      setIsProcessing(true);
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log("Creating maintenance request with data:", formData);
      // Create maintenance request
      const maintenanceId = await createMaintenanceRequest({
        ...formData,
        receivedById: currentUser.id
      });
      console.log("Maintenance request created successfully with ID:", maintenanceId);
      
      // Send email notifications to technicians
      if (formData.technicianIds && formData.technicianIds.length > 0) {
        try {
          await sendMaintenanceEmailNotifications(
            maintenanceId, 
            formData.hotelId, 
            formData.technicianIds, 
            'new_quote_request'
          );
          
          toast({
            title: "Notifications envoyées",
            description: "Les techniciens ont été notifiés par email",
          });
        } catch (emailError) {
          console.error("Error sending email notifications:", emailError);
          toast({
            title: "Avertissement",
            description: "La demande a été créée mais l'envoi des emails a échoué",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Demande d'intervention créée",
        description: "La demande d'intervention a été créée avec succès",
      });

      // Reload maintenance requests
      const updatedRequests = await getMaintenanceRequests();
      setMaintenanceRequests(updatedRequests);
      
      setNewMaintenanceDialogOpen(false);
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la demande",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle form submission for edit maintenance
  const handleSubmitEditMaintenance = async (updatedData: any) => {
    try {
      setIsProcessing(true);
      
      // Check if any technicians were added (for email notifications)
      let newTechnicians: string[] = [];
      
      if (selectedMaintenance && updatedData.technicianIds) {
        // Determine which technicians are newly added
        const oldTechnicianIds = selectedMaintenance.technicianIds || 
                              (selectedMaintenance.technicianId ? [selectedMaintenance.technicianId] : []);
        
        newTechnicians = updatedData.technicianIds.filter(
          (id: string) => !oldTechnicianIds.includes(id)
        );
      }
      
      console.log("Updating maintenance request with data:", updatedData);
      // Update maintenance request
      await updateMaintenanceRequest(updatedData.id, updatedData);
      
      // Send email notifications to newly added technicians
      if (newTechnicians.length > 0) {
        try {
          await sendMaintenanceEmailNotifications(
            updatedData.id,
            updatedData.hotelId,
            newTechnicians,
            'new_quote_request'
          );
          
          toast({
            title: "Notifications envoyées",
            description: `${newTechnicians.length} technicien(s) ont été notifiés par email`,
          });
        } catch (emailError) {
          console.error("Error sending email notifications:", emailError);
          toast({
            title: "Avertissement",
            description: "La mise à jour a été effectuée mais l'envoi des emails a échoué",
            variant: "destructive"
          });
        }
      }
      
      // Reload maintenance requests
      const updatedRequests = await getMaintenanceRequests();
      setMaintenanceRequests(updatedRequests);
      
      toast({
        title: "Demande mise à jour",
        description: "La demande d'intervention a été mise à jour avec succès",
      });
      
      setEditMaintenanceDialogOpen(false);
      setSelectedMaintenance(null);
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel('all');
    setFilterStatus('all');
    setFilterType('all');
    setFilterAssignedUser('all');
    setFilterTechnician('all');
    setSearchQuery('');
  };
  
  // Handle export to Excel
  const handleExcelExport = async () => {
    try {
      await exportMaintenanceRequests(
        filteredRequests,
        getHotelName,
        getLocationLabel,
        getInterventionTypeLabel,
        getStatusLabel,
        getUserName
      );
      
      toast({
        title: "Export Excel réussi",
        description: "Le fichier Excel a été téléchargé avec succès.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export Excel.",
        variant: "destructive",
      });
    }
  };
  
  // Handle export to PDF
  const handlePDFExport = async () => {
    try {
      const fileName = await exportMaintenanceRequestsToPDF(
        filteredRequests,
        getHotelName,
        getLocationLabel,
        getInterventionTypeLabel,
        getStatusLabel,
        getUserName
      );
      
      toast({
        title: "Export PDF réussi",
        description: `Le fichier PDF a été généré avec succès (${fileName}).`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export PDF.",
        variant: "destructive",
      });
    }
  };
  
  // Handle view maintenance
  const handleViewMaintenance = (maintenanceId: string) => {
    const maintenance = maintenanceRequests.find(req => req.id === maintenanceId);
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      setViewMaintenanceDialogOpen(true);
    }
  };
  
  // Handle edit maintenance directly from list
  const handleEditMaintenance = (maintenanceId: string) => {
    const maintenance = maintenanceRequests.find(req => req.id === maintenanceId);
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      setEditMaintenanceDialogOpen(true);
    }
  };
  
  // Handle edit maintenance from dialog
  const handleEditFromDialog = () => {
    if (selectedMaintenance) {
      setViewMaintenanceDialogOpen(false);
      setEditMaintenanceDialogOpen(true);
    }
  };
  
  // Handle update maintenance
  const handleUpdateMaintenance = async (updatedMaintenance: any) => {
    try {
      setIsProcessing(true);
      
      // Update maintenance request
      await updateMaintenanceRequest(updatedMaintenance.id, updatedMaintenance);
      
      // Reload maintenance requests
      const updatedRequests = await getMaintenanceRequests();
      setMaintenanceRequests(updatedRequests);
      
      toast({
        title: "Demande mise à jour",
        description: "La demande d'intervention a été mise à jour avec succès",
      });
      
      setViewMaintenanceDialogOpen(false);
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete maintenance
  const handleDeleteMaintenance = async () => {
    // Reload maintenance requests after deletion
    try {
      const updatedRequests = await getMaintenanceRequests();
      setMaintenanceRequests(updatedRequests);
    } catch (error) {
      console.error('Error reloading maintenance requests:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suivi Technique</h1>
          <p className="text-muted-foreground">Gestion des maintenances et réparations</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={() => setNewMaintenanceDialogOpen(true)} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Intervention
              </>
            )}
          </Button>
          <div className="flex space-x-1">
            <Button variant="outline" onClick={handleExcelExport}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={handlePDFExport}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>
      
      <MaintenanceFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterHotel={filterHotel}
        onHotelChange={setFilterHotel}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterType={filterType}
        onTypeChange={setFilterType}
        filterAssignedUser={filterAssignedUser}
        onAssignedUserChange={setFilterAssignedUser}
        filterTechnician={filterTechnician}
        onTechnicianChange={setFilterTechnician}
        filtersExpanded={filtersExpanded}
        onFiltersExpandedChange={setFiltersExpanded}
        onReset={resetFilters}
      />
      
      <Tabs defaultValue="list" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Liste des Interventions</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <MaintenanceList 
                maintenanceRequests={filteredRequests}
                onViewMaintenance={handleViewMaintenance}
                onEditMaintenance={handleEditMaintenance}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interventions by Type - using real data */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Interventions par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredRequests.reduce((acc: any[], request) => {
                          // Find existing type or add new one
                          const existingType = acc.find(
                            item => item.id === request.interventionTypeId
                          );
                          if (existingType) {
                            existingType.value++;
                          } else {
                            acc.push({
                              id: request.interventionTypeId,
                              name: request.interventionTypeId,
                              value: 1
                            });
                          }
                          return acc;
                        }, [])}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        nameKey="name"
                      >
                        {filteredRequests.reduce((acc: any[], request) => {
                          // Find existing type or add new one
                          const existingType = acc.find(
                            item => item.id === request.interventionTypeId
                          );
                          if (existingType) {
                            existingType.value++;
                          } else {
                            acc.push({
                              id: request.interventionTypeId,
                              name: request.interventionTypeId,
                              value: 1
                            });
                          }
                          return acc;
                        }, []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Interventions by Status - using real data */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Interventions par Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredRequests.reduce((acc: any[], request) => {
                          // Find existing status or add new one
                          const existingStatus = acc.find(
                            item => item.id === request.statusId
                          );
                          if (existingStatus) {
                            existingStatus.value++;
                          } else {
                            acc.push({
                              id: request.statusId,
                              name: request.statusId,
                              value: 1
                            });
                          }
                          return acc;
                        }, [])}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        nameKey="name"
                      >
                        {filteredRequests.reduce((acc: any[], request) => {
                          // Find existing status or add new one
                          const existingStatus = acc.find(
                            item => item.id === request.statusId
                          );
                          if (existingStatus) {
                            existingStatus.value++;
                          } else {
                            acc.push({
                              id: request.statusId,
                              name: request.statusId,
                              value: 1
                            });
                          }
                          return acc;
                        }, []).map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              index === 0 ? "#f59e0b" : // Ouvert
                              index === 1 ? "#3b82f6" : // En cours
                              index === 2 ? "#10b981" : // Résolu
                              index === 3 ? "#6b7280" : // Fermé
                              "#ef4444" // Annulé
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Interventions by Assigned User - NEW */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Interventions par Utilisateur Assigné</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allUsers.map(user => {
                        const count = filteredRequests.filter(request => 
                          request.assignedUserId === user.id
                        ).length;
                        
                        return {
                          name: user.name,
                          count: count
                        };
                      }).filter(item => item.count > 0).sort((a, b) => b.count - a.count)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Nombre d'interventions" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Interventions by Technician - NEW */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Interventions par Technicien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={technicians.map(tech => {
                        // Count interventions where this technician is either in technicianId (legacy)
                        // or in the technicianIds array
                        const count = filteredRequests.filter(request => 
                          request.technicianId === tech.id || 
                          (request.technicianIds && request.technicianIds.includes(tech.id))
                        ).length;
                        
                        return {
                          name: tech.name,
                          count: count
                        };
                      }).filter(item => item.count > 0).sort((a, b) => b.count - a.count)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Nombre d'interventions" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Maintenance Form */}
      <MaintenanceForm 
        isOpen={newMaintenanceDialogOpen}
        onClose={() => setNewMaintenanceDialogOpen(false)}
        onSubmit={handleSubmitNewMaintenance}
        isEditing={false}
      />
      
      {/* Edit Maintenance Form */}
      {selectedMaintenance && (
        <MaintenanceForm 
          isOpen={editMaintenanceDialogOpen}
          onClose={() => setEditMaintenanceDialogOpen(false)}
          maintenance={selectedMaintenance}
          onSubmit={handleSubmitEditMaintenance}
          isEditing={true}
        />
      )}
      
      {/* View Maintenance Dialog */}
      <MaintenanceDialog 
        maintenance={selectedMaintenance}
        isOpen={viewMaintenanceDialogOpen}
        onClose={() => setViewMaintenanceDialogOpen(false)}
        onUpdate={handleUpdateMaintenance}
        onEdit={handleEditFromDialog}
        onDelete={handleDeleteMaintenance}
      />
    </div>
  );
};

export default MaintenancePage;