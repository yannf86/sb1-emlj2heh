import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Download, 
  Plus, 
  FileText
} from 'lucide-react';
import { 
  hotels, 
  users, 
  parameters, 
  getHotelName, 
  getParameterLabel, 
  getUserName 
} from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { exportIncidents } from '@/lib/exportUtils';
import { exportIncidentsToPDF } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { getIncidents, createIncident, updateIncident } from '@/lib/db/incidents';
import { getCurrentUser } from '@/lib/auth';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Load incidents on mount
  useEffect(() => {
    loadIncidents();
  }, []);

  // Function to load incidents
  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await getIncidents();
      setIncidents(data);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les incidents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
  const filteredIncidents = incidents.filter(incident => {
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
      const matchesDescription = incident.description.toLowerCase().includes(query);
      const matchesHotel = getHotelName(incident.hotelId).toLowerCase().includes(query);
      const matchesCategory = getParameterLabel(incident.categoryId).toLowerCase().includes(query);
      const matchesClient = incident.clientName ? incident.clientName.toLowerCase().includes(query) : false;
      
      if (!matchesDescription && !matchesHotel && !matchesCategory && !matchesClient) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Handle form submission
  const handleSubmitIncident = async (formData: any) => {
    try {
      // Create incident in Firebase
      await createIncident(formData);
      
      toast({
        title: "Incident créé",
        description: "L'incident a été créé avec succès",
      });
      
      // Reload incidents
      await loadIncidents();
      
      setNewIncidentDialogOpen(false);
    } catch (error) {
      console.error('Error creating incident:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'incident",
        variant: "destructive",
      });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterImpact('all');
    setSearchQuery('');
  };
  
  // Handle export to Excel
  const handleExcelExport = () => {
    try {
      exportIncidents(filteredIncidents, getHotelName, getParameterLabel, getUserName);
      
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
  const handlePDFExport = () => {
    try {
      const fileName = exportIncidentsToPDF(filteredIncidents, getHotelName, getParameterLabel, getUserName);
      
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
      setSelectedIncident(incident);
      setViewIncidentDialogOpen(true);
    }
  };

  // Handle edit incident directly from list
  const handleEditIncident = (incidentId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
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
      // Update incident in Firebase
      await updateIncident(updatedIncident.id, updatedIncident);
      
      toast({
        title: "Incident mis à jour",
        description: "L'incident a été mis à jour avec succès",
      });
      
      // Reload incidents
      await loadIncidents();
      
      // Close edit dialog
      setEditIncidentDialogOpen(false);
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'incident",
        variant: "destructive",
      });
    }
  };

  // Handle incident deletion
  const handleIncidentDelete = async () => {
    await loadIncidents(); // Reload incidents after deletion
  };
  
  if (loading) {
    return <div>Chargement des incidents...</div>;
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
          <IncidentList 
            incidents={filteredIncidents}
            onViewIncident={handleViewIncident}
            onEditIncident={handleEditIncident}
          />
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