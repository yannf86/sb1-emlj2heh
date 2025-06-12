import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PenTool as Tool, 
  Search, 
  Download, 
  Plus, 
  RefreshCw, 
  SlidersHorizontal,
  FileText,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportMaintenanceRequests } from '@/lib/exportUtils';
import { exportMaintenanceRequestsToPDF } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { ensureMaintenanceCollection } from '@/lib/db/ensure-collections';
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getInterventionTypeLabel } from '@/lib/db/parameters-intervention-type';
import { getStatusLabel, findStatusIdByCode } from '@/lib/db/parameters-status';
import { getUserName } from '@/lib/db/users';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import components
import MaintenanceDialog from '@/components/maintenance/MaintenanceDialog';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import MaintenanceList from '@/components/maintenance/MaintenanceList';
import MaintenanceFilters from '@/components/maintenance/MaintenanceFilters';

// Import hooks
import { useMaintenanceRequests, useCreateMaintenanceRequest, useUpdateMaintenanceRequest, useDeleteMaintenanceRequest } from '@/hooks/useMaintenance';
import { useHotels } from '@/hooks/useHotels';
import { useUsers } from '@/hooks/useUsers';

const MaintenancePage = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAssignedUser, setFilterAssignedUser] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [collectionChecked, setCollectionChecked] = useState(false);
  const [inProgressStatusId, setInProgressStatusId] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // React Query hooks
  const { 
    data: maintenanceRequests = [], 
    isLoading: maintenanceLoading, 
    error: maintenanceError,
    refetch: refetchMaintenance
  } = useMaintenanceRequests();
  
  const { 
    data: hotels = [], 
    isLoading: hotelsLoading 
  } = useHotels();
  
  const { 
    data: users = [], 
    isLoading: usersLoading 
  } = useUsers();
  
  const createMaintenanceMutation = useCreateMaintenanceRequest();
  const updateMaintenanceMutation = useUpdateMaintenanceRequest();
  const deleteMaintenanceMutation = useDeleteMaintenanceRequest();
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Check if collection exists
  useEffect(() => {
    const checkCollection = async () => {
      if (!collectionChecked) {
        await ensureMaintenanceCollection();
        setCollectionChecked(true);
        refetchMaintenance();
      }
    };
    
    checkCollection();
  }, [collectionChecked, refetchMaintenance]);

  // Fetch the "En cours" status ID on component mount
  useEffect(() => {
    const getInProgressStatusId = async () => {
      try {
        // Try to find the status ID for "En cours" (in_progress)
        const statusId = await findStatusIdByCode('in_progress');
        if (statusId) {
          setInProgressStatusId(statusId);
          // Only set the filter status if it hasn't been set yet
          if (!initialLoadComplete) {
            setFilterStatus(statusId);
          }
        } else {
          console.warn('Could not find status ID for "En cours"');
          // If we can't find the specific status, default to 'all'
          if (!initialLoadComplete) {
            setFilterStatus('all');
          }
        }
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error finding in_progress status ID:', error);
        if (!initialLoadComplete) {
          setFilterStatus('all');
          setInitialLoadComplete(true);
        }
      }
    };

    getInProgressStatusId();
  }, [initialLoadComplete]);

  // Set the default hotel filter if user has only one hotel
  useEffect(() => {
    if (!hotelsLoading && hotels.length === 1 && filterHotel === 'all') {
      setFilterHotel(hotels[0].id);
    }
  }, [hotels, hotelsLoading, filterHotel]);
  
  // New maintenance dialog
  const [newMaintenanceDialogOpen, setNewMaintenanceDialogOpen] = useState(false);
  
  // Edit maintenance dialog
  const [editMaintenanceDialogOpen, setEditMaintenanceDialogOpen] = useState(false);
  
  // View maintenance dialog
  const [viewMaintenanceDialogOpen, setViewMaintenanceDialogOpen] = useState(false);
  
  // Filter maintenance requests based on selected filters
  const filteredRequests = maintenanceRequests.filter(request => {
    // Filter by hotel
    if (filterHotel !== 'all' && request.hotelId !== filterHotel) return false;
    
    // Filter by status
    if (filterStatus !== 'all' && filterStatus !== '' && request.statusId !== filterStatus) return false;
    
    // Filter by intervention type
    if (filterType !== 'all' && request.interventionTypeId !== filterType) return false;
    
    // Filter by assigned user
    if (filterAssignedUser === 'none' && request.assignedUserId) return false;
    if (filterAssignedUser !== 'all' && filterAssignedUser !== 'none' && 
        request.assignedUserId !== filterAssignedUser) return false;
    
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
    createMaintenanceMutation.mutate(
      { 
        ...formData, 
        receivedById: currentUser?.id 
      },
      {
        onSuccess: () => {
          setNewMaintenanceDialogOpen(false);
        }
      }
    );
  };
  
  // Handle form submission for edit maintenance
  const handleSubmitEditMaintenance = async (updatedData: any) => {
    updateMaintenanceMutation.mutate(
      { id: updatedData.id, data: updatedData },
      {
        onSuccess: () => {
          setEditMaintenanceDialogOpen(false);
          setSelectedMaintenance(null);
        }
      }
    );
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel(hotels.length === 1 ? hotels[0].id : 'all');
    // Reset to "En cours" if we have the ID, otherwise to 'all'
    setFilterStatus(inProgressStatusId || 'all');
    setFilterType('all');
    setFilterAssignedUser('all');
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
    updateMaintenanceMutation.mutate(
      { id: updatedMaintenance.id, data: updatedMaintenance },
      {
        onSuccess: () => {
          setViewMaintenanceDialogOpen(false);
        }
      }
    );
  };

  // Handle delete maintenance
  const handleDeleteMaintenance = async () => {
    if (!selectedMaintenance) return;
    
    deleteMaintenanceMutation.mutate(
      selectedMaintenance.id,
      {
        onSuccess: () => {
          setViewMaintenanceDialogOpen(false);
          setSelectedMaintenance(null);
        }
      }
    );
  };
  
  if (maintenanceLoading || hotelsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des demandes de maintenance.</p>
        </div>
      </div>
    );
  }

  if (maintenanceError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suivi Technique</h1>
            <p className="text-muted-foreground">Gestion des maintenances et réparations</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            Impossible de charger les demandes de maintenance. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
        
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suivi Technique</h1>
          <p className="text-muted-foreground">Gestion des maintenances et réparations</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={() => setNewMaintenanceDialogOpen(true)}
            disabled={createMaintenanceMutation.isPending}
          >
            {createMaintenanceMutation.isPending ? (
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
          {/* Analytics content */}
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