import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Download, 
  Plus, 
  FileText,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportIncidents } from '@/lib/exportUtils';
import { exportIncidentsToPDF } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { getIncidents, createIncident, updateIncident } from '@/lib/db/incidents';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { getHotels, getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getIncidentCategoryLabel } from '@/lib/db/parameters-incident-categories';
import { getImpactLabel } from '@/lib/db/parameters-impact';
import { getStatusLabel } from '@/lib/db/parameters-status';
import { getUserName } from '@/lib/db/users';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import components
import IncidentDialog from '@/components/incidents/IncidentDialog';
import IncidentForm from '@/components/incidents/IncidentForm';
import IncidentList from '@/components/incidents/IncidentList';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentEdit from '@/components/incidents/IncidentEdit';

const IncidentsPage = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImpact, setFilterImpact] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Load incidents and hotels on mount
  useEffect(() => {
    loadIncidents();
    loadAvailableHotels();
  }, []);

  // Function to load incidents with error handling
  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // getIncidents already applies hotel access filtering based on current user
      const data = await getIncidents();
      console.log("Incidents loaded:", data?.length || 0);
      setIncidents(data || []);
    } catch (error: any) {
      console.error('Error loading incidents:', error);
      setError(error?.message || "Impossible de charger les incidents");
      toast({
        title: "Erreur",
        description: "Impossible de charger les incidents. " + (error?.message || ""),
        variant: "destructive",
      });
      
      // Ensure incidents is at least an empty array to prevent rendering issues
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load hotels the current user has access to
  const loadAvailableHotels = async () => {
    try {
      // getHotels now applies hotel access filtering based on current user
      const hotelsData = await getHotels();
      setAvailableHotels(hotelsData);
      
      // If user has only one hotel, automatically select it
      if (hotelsData.length === 1 && filterHotel === 'all') {
        setFilterHotel(hotelsData[0].id);
      }
    } catch (error) {
      console.error('Error loading hotels:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les hôtels",
        variant: "destructive",
      });
      
      // Ensure availableHotels is at least an empty array
      setAvailableHotels([]);
    }
  };
  
  // New incident dialog
  const [newIncidentDialogOpen, setNewIncidentDialogOpen] = useState(false);

  // View incident dialog
  const [viewIncidentDialogOpen, setViewIncidentDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  
  // Edit incident dialog
  const [editIncidentDialogOpen, setEditIncidentDialogOpen] = useState(false);

  // Filter incidents based on selected filters
  const filteredIncidents = incidents ? incidents.filter(incident => {
    // Skip if incident is undefined or null
    if (!incident) return false;
    
    // Filter by hotel
    if (filterHotel !== 'all' && incident.hotelId !== filterHotel) return false;
    
    // Filter by status
    if (filterStatus !== 'all' && incident.statusId !== filterStatus) return false;
    
    // Filter by category
    if (filterCategory !== 'all' && incident.categoryId !== filterCategory) return false;
    
    // Filter by impact
    if (filterImpact !== 'all' && incident.impactId !== filterImpact) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // Make sure description exists before trying to search in it
      const matchesDescription = incident.description?.toLowerCase?.()?.includes?.(query) || false;
      
      // For hotel, category, client name, we'll need to check actual values rather than IDs
      let matchesHotel = false;
      let matchesCategory = false;
      let matchesClient = false;
      
      // Check client name if available
      if (incident.clientName) {
        matchesClient = incident.clientName.toLowerCase().includes(query);
      }
      
      if (!matchesDescription && !matchesHotel && !matchesCategory && !matchesClient) return false;
    }
    
    return true;
  }) : [];
  
  // Handle form submission with error handling
  const handleSubmitIncident = async (formData: any) => {
    try {
      // Verify that user has access to the selected hotel
      if (!hasHotelAccess(formData.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel",
          variant: "destructive",
        });
        return;
      }
      
      // Create incident in Firebase
      await createIncident(formData);
      
      toast({
        title: "Incident créé",
        description: "L'incident a été créé avec succès",
      });
      
      // Reload incidents
      await loadIncidents();
      
      setNewIncidentDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating incident:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de l'incident",
        variant: "destructive",
      });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel(availableHotels.length === 1 ? availableHotels[0].id : 'all');
    setFilterStatus('all');
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
    await loadIncidents(); // Reload incidents after update
    setViewIncidentDialogOpen(false);
    setEditIncidentDialogOpen(false);
  };
  
  // Handle save from edit form directly (not via view dialog)
  const handleSaveEdit = async (updatedIncident: any) => {
    try {
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
      
      // Update incident in Firebase
      await updateIncident(incidentToUpdate.id, incidentToUpdate);
      
      toast({
        title: "Incident mis à jour",
        description: "L'incident a été mis à jour avec succès",
      });
      
      // Reload incidents
      await loadIncidents();
      
      // Close edit dialog
      setEditIncidentDialogOpen(false);
      setSelectedIncident(null);
    } catch (error: any) {
      console.error('Error updating incident:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la mise à jour de l'incident",
        variant: "destructive",
      });
    }
  };

  // Handle incident deletion
  const handleIncidentDelete = async () => {
    await loadIncidents(); // Reload incidents after deletion
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Chargement des incidents...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des données.</p>
        </div>
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
          <Button onClick={() => setNewIncidentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Incident
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
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
      
      <Card>
        <CardContent className="p-0">
          {incidents && incidents.length >= 0 ? (
            <IncidentList 
              incidents={filteredIncidents || []}
              onViewIncident={handleViewIncident}
              onEditIncident={handleEditIncident}
            />
          ) : (
            <div className="p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Erreur lors du chargement des incidents</p>
              <p className="text-muted-foreground">Veuillez rafraîchir la page ou réessayer plus tard.</p>
              <Button 
                variant="outline" 
                onClick={loadIncidents} 
                className="mt-4"
              >
                Réessayer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Incident Form */}
      <IncidentForm 
        isOpen={newIncidentDialogOpen}
        onClose={() => setNewIncidentDialogOpen(false)}
        onSave={handleSubmitIncident}
        isEditing={false}
      />
      
      {/* View Incident Dialog */}
      {selectedIncident && (
        <IncidentDialog 
          incident={selectedIncident}
          isOpen={viewIncidentDialogOpen}
          onClose={() => setViewIncidentDialogOpen(false)}
          onDelete={handleIncidentDelete}
          onUpdate={handleIncidentUpdate}
        />
      )}

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