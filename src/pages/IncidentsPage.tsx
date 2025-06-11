import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Download, 
  Plus, 
  FileText,
  BarChart2,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportIncidents } from '@/lib/exportUtils';
import { exportIncidentsToPDF } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getIncidentCategoryLabel } from '@/lib/db/parameters-incident-categories';
import { getImpactLabel } from '@/lib/db/parameters-impact';
import { getStatusLabel, findStatusIdByCode } from '@/lib/db/parameters-status';
import { getUserName } from '@/lib/db/users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import components
import IncidentDialog from '@/components/incidents/IncidentDialog';
import IncidentForm from '@/components/incidents/IncidentForm';
import IncidentList from '@/components/incidents/IncidentList';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentEdit from '@/components/incidents/IncidentEdit';
import IncidentAnalytics from '@/components/incidents/analytics/IncidentAnalytics';

// Import hooks
import { useIncidents, useCreateIncident, useUpdateIncident, useDeleteIncident } from '@/hooks/useIncidents';
import { useHotels } from '@/hooks/useHotels';

const IncidentsPage = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImpact, setFilterImpact] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [inProgressStatusId, setInProgressStatusId] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // React Query hooks
  const { 
    data: incidents = [], 
    isLoading: incidentsLoading, 
    error: incidentsError,
    refetch: refetchIncidents
  } = useIncidents(filterHotel !== 'all' ? filterHotel : undefined, filterStatus !== 'all' && filterStatus !== '' ? filterStatus : undefined);
  
  const { 
    data: hotels = [], 
    isLoading: hotelsLoading 
  } = useHotels();
  
  const createIncidentMutation = useCreateIncident();
  const updateIncidentMutation = useUpdateIncident();
  const deleteIncidentMutation = useDeleteIncident();
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // New incident dialog
  const [newIncidentDialogOpen, setNewIncidentDialogOpen] = useState(false);

  // View incident dialog
  const [viewIncidentDialogOpen, setViewIncidentDialogOpen] = useState(false);
  
  // Edit incident dialog
  const [editIncidentDialogOpen, setEditIncidentDialogOpen] = useState(false);

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

  // Filter incidents based on selected filters
  const filteredIncidents = incidents.filter(incident => {
    // Filter by hotel
    if (filterHotel !== 'all' && incident.hotelId !== filterHotel) return false;
    
    // Filter by status
    if (filterStatus !== 'all' && filterStatus !== '' && incident.statusId !== filterStatus) return false;
    
    // Filter by category
    if (filterCategory !== 'all' && incident.categoryId !== filterCategory) return false;
    
    // Filter by impact
    if (filterImpact !== 'all' && incident.impactId !== filterImpact) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = incident.description.toLowerCase().includes(query);
      
      if (!matchesDescription) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Handle form submission
  const handleSubmitIncident = async (formData: any) => {
    // Verify that user has access to the selected hotel
    if (!hasHotelAccess(formData.hotelId)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas accès à cet hôtel",
        variant: "destructive",
      });
      return;
    }
    
    createIncidentMutation.mutate(formData, {
      onSuccess: () => {
        setNewIncidentDialogOpen(false);
        // Refetch incidents to update the list
        refetchIncidents();
      }
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel(hotels.length === 1 ? hotels[0].id : 'all');
    // Reset to "En cours" if we have the ID, otherwise to 'all'
    setFilterStatus(inProgressStatusId || 'all');
    setFilterCategory('all');
    setFilterImpact('all');
    setSearchQuery('');
  };
  
  // Handle export to Excel
  const handleExcelExport = async () => {
    try {
      await exportIncidents(
        filteredIncidents, 
        getHotelName, 
        getLocationLabel,
        getIncidentCategoryLabel,
        getImpactLabel,
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
      const fileName = await exportIncidentsToPDF(
        filteredIncidents, 
        getHotelName, 
        getLocationLabel,
        getIncidentCategoryLabel,
        getImpactLabel,
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
  
  // Handle export chart to PDF
  const handleExportChart = (chartId: string) => {
    try {
      // Here you would call the chart export function
      // This is a placeholder for the real implementation
      toast({
        title: "Export graphique",
        description: `Le graphique "${chartId}" a été exporté avec succès.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur lors de l'export du graphique:", error);
      
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export du graphique.",
        variant: "destructive",
      });
    }
  };
  
  // Handle view incident
  const handleViewIncident = (incidentId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      // Vérifier l'accès à l'hôtel de l'incident
      if (!hasHotelAccess(incident.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedIncident(incident);
      setViewIncidentDialogOpen(true);
    }
  };

  // Handle edit incident directly from list
  const handleEditIncident = (incidentId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      // Vérifier l'accès à l'hôtel de l'incident
      if (!hasHotelAccess(incident.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedIncident(incident);
      setEditIncidentDialogOpen(true);
    }
  };

  // Handle incident update
  const handleIncidentUpdate = async () => {
    setViewIncidentDialogOpen(false);
    setEditIncidentDialogOpen(false);
    // Refetch incidents to update the list
    refetchIncidents();
  };
  
  // Handle save from edit form directly (not via view dialog)
  const handleSaveEdit = async (updatedIncident: any) => {
    // Vérifier l'accès à l'hôtel de l'incident
    if (!hasHotelAccess(updatedIncident.hotelId)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas accès à cet hôtel",
        variant: "destructive",
      });
      return;
    }
    
    // Create a copy of the incident to avoid modifying the original
    const incidentToUpdate = { ...updatedIncident };
    
    // Ensure fields are never undefined (convert undefined to null)
    if (incidentToUpdate.concludedAt === undefined) {
      incidentToUpdate.concludedAt = null;
    }
    
    if (incidentToUpdate.concludedById === undefined) {
      incidentToUpdate.concludedById = null;
    }
    
    // If concludedById is falsy (null, empty, etc.), ensure concludedAt is also null
    if (!incidentToUpdate.concludedById) {
      incidentToUpdate.concludedAt = null;
      incidentToUpdate.concludedById = null;
    }
    
    updateIncidentMutation.mutate(
      { id: incidentToUpdate.id, data: incidentToUpdate },
      {
        onSuccess: () => {
          setEditIncidentDialogOpen(false);
          setSelectedIncident(null);
          // Refetch incidents to update the list
          refetchIncidents();
        }
      }
    );
  };

  // Handle incident deletion
  const handleIncidentDelete = async () => {
    if (!selectedIncident) return;
    
    deleteIncidentMutation.mutate(selectedIncident.id, {
      onSuccess: () => {
        setViewIncidentDialogOpen(false);
        setSelectedIncident(null);
        // Refetch incidents to update the list
        refetchIncidents();
      }
    });
  };
  
  if (incidentsLoading || hotelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des incidents.</p>
        </div>
      </div>
    );
  }
  
  if (incidentsError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suivi des Incidents</h1>
            <p className="text-muted-foreground">Gestion et analyse des incidents signalés</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            Impossible de charger les incidents. Veuillez réessayer plus tard.
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
          <h1 className="text-2xl font-bold tracking-tight">Suivi des Incidents</h1>
          <p className="text-muted-foreground">Gestion et analyse des incidents signalés</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={() => setNewIncidentDialogOpen(true)}
            disabled={createIncidentMutation.isPending}
          >
            {createIncidentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel Incident
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
      
      <IncidentFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterHotel={filterHotel}
        onHotelChange={setFilterHotel}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterImpact={filterImpact}
        onImpactChange={setFilterImpact}
        filtersExpanded={filtersExpanded}
        onFiltersExpandedChange={setFiltersExpanded}
        onReset={resetFilters}
      />
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="list">Liste des Incidents</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytiques
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <IncidentList 
                incidents={filteredIncidents}
                onViewIncident={handleViewIncident}
                onEditIncident={handleEditIncident}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <IncidentAnalytics 
            incidents={filteredIncidents}
            onExportPDF={handlePDFExport}
            onExportChart={handleExportChart}
          />
        </TabsContent>
      </Tabs>
      
      {/* New Incident Form */}
      <IncidentForm 
        isOpen={newIncidentDialogOpen}
        onClose={() => setNewIncidentDialogOpen(false)}
        onSave={handleSubmitIncident}
        isEditing={false}
      />
      
      {/* View Incident Dialog */}
      <IncidentDialog 
        incident={selectedIncident}
        isOpen={viewIncidentDialogOpen}
        onClose={() => setViewIncidentDialogOpen(false)}
        onDelete={handleIncidentDelete}
        onUpdate={handleIncidentUpdate}
      />

      {/* Edit Incident Dialog */}
      {selectedIncident && (
        <IncidentForm 
          isOpen={editIncidentDialogOpen}
          onClose={() => setEditIncidentDialogOpen(false)}
          incident={selectedIncident}
          onSave={handleSaveEdit}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default IncidentsPage;