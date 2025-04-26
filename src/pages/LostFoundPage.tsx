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
import { 
  Search, 
  Download, 
  Plus, 
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Briefcase,
  Tag,
  FileText,
  Edit,
  Trash2,
  Image as ImageIcon,
  User
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportLostItems } from '@/lib/exportUtils';
import { exportLostItemsToPDF } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { getLostItems, createLostItem, updateLostItem, deleteLostItem } from '@/lib/db/lost-items';
import { getLostItemTypeParameters, getLostItemTypeLabel } from '@/lib/db/parameters-lost-item-type';
import { getHotelName, getHotels } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getUserName } from '@/lib/db/users';

// Import components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LostItemForm from '@/components/lost-found/LostItemForm';
import LostItemFilters from '@/components/lost-found/LostItemFilters';
import LostItemList from '@/components/lost-found/LostItemList';

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LostFoundPage = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // For item history display
  const [historyUserNames, setHistoryUserNames] = useState<Record<string, string>>({});
  
  // Load lost items on mount
  useEffect(() => {
    loadLostItems();
  }, []);

  // Function to load lost items
  const loadLostItems = async () => {
    try {
      setLoading(true);
      const data = await getLostItems();
      setLostItems(data);
    } catch (error) {
      console.error('Error loading lost items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les objets trouvés",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // New lost item dialog
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  
  // Edit lost item dialog
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  
  // View lost item dialog
  const [viewItemDialogOpen, setViewItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // State for item types to avoid parameter filtering every render
  const [itemTypeParams, setItemTypeParams] = useState<any[]>([]);
  
  // Load item types
  useEffect(() => {
    const loadItemTypes = async () => {
      try {
        const types = await getLostItemTypeParameters();
        setItemTypeParams(types);
      } catch (error) {
        console.error('Error loading item types:', error);
        // Fallback to static data from imported parameters
        setItemTypeParams([]);
      }
    };
    
    loadItemTypes();
  }, []);
  
  // Filter lost items based on selected filters
  const filteredItems = lostItems.filter(item => {
    // Filter by hotel
    if (filterHotel !== 'all' && item.hotelId !== filterHotel) return false;
    
    // Filter by status
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    
    // Filter by item type
    if (filterType !== 'all' && item.itemTypeId !== filterType) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = item.description.toLowerCase().includes(query);
      const matchesStorageLocation = item.storageLocation.toLowerCase().includes(query);
      
      if (!matchesDescription && !matchesStorageLocation) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Handle form submission for new lost item
  const handleSubmitLostItem = async (formData: any) => {
    try {
      // Create lost item in Firebase
      await createLostItem(formData);
      
      toast({
        title: "Objet enregistré",
        description: "L'objet trouvé a été enregistré avec succès",
      });
      
      // Reload lost items
      await loadLostItems();
      
      // Close dialog
      setNewItemDialogOpen(false);
    } catch (error) {
      console.error('Error creating lost item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de l'objet trouvé",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission for edit
  const handleUpdateLostItem = async (updatedData: any) => {
    try {
      // Update lost item in Firebase
      await updateLostItem(updatedData.id, updatedData);
      
      toast({
        title: "Objet mis à jour",
        description: "L'objet trouvé a été mis à jour avec succès",
      });
      
      // Reload lost items
      await loadLostItems();
      
      // Close dialog
      setEditItemDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating lost item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'objet trouvé",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete lost item
  const handleDeleteLostItem = async () => {
    if (!selectedItem) return;

    try {
      // Delete lost item in Firebase
      await deleteLostItem(selectedItem.id);
      
      toast({
        title: "Objet supprimé",
        description: "L'objet trouvé a été supprimé avec succès",
      });
      
      // Reload lost items
      await loadLostItems();
      
      // Close dialog
      setViewItemDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting lost item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'objet trouvé",
        variant: "destructive",
      });
    }
  };
  
  // Prepare chart data - using async functions to get labels
  const itemsByType = itemTypeParams.map(type => ({
    name: type.label,
    value: filteredItems.filter(item => item.itemTypeId === type.id).length
  }));
  
  // Get locations from parameters
  const locationParams = [];
  const itemsByLocation = locationParams.map(location => ({
    name: location.label,
    value: filteredItems.filter(item => 
      item.locationId === location.id && 
      (filterHotel === 'all' || item.hotelId === filterHotel) &&
      (filterStatus === 'all' || item.status === filterStatus) &&
      (filterType === 'all' || item.itemTypeId === filterType)
    ).length
  }));
  
  const itemsByStatus = [
    { name: 'Conservé', value: filteredItems.filter(item => item.status === 'conservé').length },
    { name: 'Rendu', value: filteredItems.filter(item => item.status === 'rendu').length },
    { name: 'Transféré', value: filteredItems.filter(item => item.status === 'transféré').length }
  ];
  
  // Dynamic chart data based on available hotels
  const [hotels, setHotels] = useState<any[]>([]);
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelsData = await getHotels();
        setHotels(hotelsData);
      } catch (error) {
        console.error('Error loading hotels:', error);
        setHotels([]);
      }
    };
    loadHotels();
  }, []);
  
  // Calculate items by hotel
  const itemsByHotel = hotels.map(hotel => ({
    name: hotel.name,
    value: filteredItems.filter(item => item.hotelId === hotel.id).length
  }));
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel('all');
    setFilterStatus('all');
    setFilterType('all');
    setSearchQuery('');
  };
  
  // Handle export to Excel
  const handleExcelExport = () => {
    try {
      exportLostItems(filteredItems, getHotelName, async (id) => {
        let label = 'Inconnu';
        try {
          if (id.startsWith('lit')) {
            label = await getLostItemTypeLabel(id);
          } else if (id.startsWith('loc')) {
            label = await getLocationLabel(id);
          }
          return label;
        } catch (error) {
          return 'Inconnu';
        }
      }, getUserName);
      
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
      const fileName = exportLostItemsToPDF(filteredItems, getHotelName, async (id) => {
        let label = 'Inconnu';
        try {
          if (id.startsWith('lit')) {
            label = await getLostItemTypeLabel(id);
          } else if (id.startsWith('loc')) {
            label = await getLocationLabel(id);
          }
          return label;
        } catch (error) {
          return 'Inconnu';
        }
      }, getUserName);
      
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
  
  // Handle view lost item and load associated data
  const handleViewItem = async (itemId: string) => {
    const item = lostItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setViewItemDialogOpen(true);
      
      // Load user names for history entries
      if (item.history && item.history.length > 0) {
        const userIds = [...new Set(item.history.map((entry: any) => entry.userId))];
        const userNamesObj: Record<string, string> = {};
        
        for (const userId of userIds) {
          try {
            const name = await getUserName(userId);
            userNamesObj[userId] = name || 'Utilisateur inconnu';
          } catch (error) {
            console.error(`Error fetching user name for ID ${userId}:`, error);
            userNamesObj[userId] = 'Utilisateur inconnu';
          }
        }
        
        setHistoryUserNames(userNamesObj);
      }
    }
  };
  
  // Handle edit lost item
  const handleEditItem = (itemId: string) => {
    const item = lostItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setEditItemDialogOpen(true);
    }
  };
  
  // Handle edit from view dialog
  const handleEditFromView = () => {
    if (selectedItem) {
      setViewItemDialogOpen(false);
      setEditItemDialogOpen(true);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des objets trouvés.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Objets Trouvés</h1>
          <p className="text-muted-foreground">Gestion des objets trouvés et perdus</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={() => setNewItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Objet
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
      
      <LostItemFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterHotel={filterHotel}
        onHotelChange={setFilterHotel}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterType={filterType}
        onTypeChange={setFilterType}
        filtersExpanded={filtersExpanded}
        onFiltersExpandedChange={setFiltersExpanded}
        onReset={resetFilters}
      />
      
      <Tabs defaultValue="list" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Liste des Objets</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <div className="rounded-md border">
            <LostItemList 
              items={filteredItems}
              onViewItem={handleViewItem}
              onEditItem={handleEditItem}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Items by Type */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Objets par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={itemsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {itemsByType.map((entry, index) => (
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
            
            {/* Items by Status */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Objets par Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={itemsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#3b82f6" /> {/* Conservé */}
                        <Cell fill="#10b981" /> {/* Rendu */}
                        <Cell fill="#f59e0b" /> {/* Transféré */}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Items by Location */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Objets par Lieu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={itemsByLocation}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={60} />
                      <Tooltip />
                      <Bar dataKey="value" name="Objets" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Items by Hotel */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Objets par Hôtel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={itemsByHotel}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Objets" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Lost Item Form */}
      <LostItemForm 
        isOpen={newItemDialogOpen}
        onClose={() => setNewItemDialogOpen(false)}
        onSubmit={handleSubmitLostItem}
        isEditing={false}
      />
      
      {/* Edit Lost Item Form */}
      {selectedItem && (
        <LostItemForm 
          isOpen={editItemDialogOpen}
          onClose={() => setEditItemDialogOpen(false)}
          lostItem={selectedItem}
          onSubmit={handleUpdateLostItem}
          isEditing={true}
        />
      )}
      
      {/* View Lost Item Dialog */}
      <Dialog open={viewItemDialogOpen} onOpenChange={setViewItemDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'objet trouvé</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Basic item information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">ID de l'objet</p>
                  <p className="font-medium">{selectedItem.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <div>
                    <span className={
                      selectedItem.status === 'conservé' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300" :
                      selectedItem.status === 'rendu' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300" :
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-orange-600 border-orange-300"
                    }>
                      {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date de découverte</p>
                    <p className="font-medium">{formatDate(selectedItem.date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Heure</p>
                    <p className="font-medium">{selectedItem.time}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Hôtel</p>
                    <p className="font-medium">{selectedItem.hotelName || selectedItem.hotelId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                    <p className="font-medium">{selectedItem.locationName || selectedItem.locationId}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type d'objet</p>
                  <p className="font-medium">{selectedItem.itemTypeName || selectedItem.itemTypeId}</p>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-lg font-medium">Description de l'objet</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedItem.description}</p>
              </div>
              
              {/* Storage information */}
              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-lg font-medium">Informations de stockage</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Trouvé par</p>
                    <p className="font-medium">{selectedItem.foundByName || selectedItem.foundById}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Lieu de stockage</p>
                    <p className="font-medium">{selectedItem.storageLocation}</p>
                  </div>
                </div>
              </div>
              
              {/* Photo if exists */}
              {selectedItem.photoUrl && (
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="text-lg font-medium">Photo</h3>
                  <div className="h-48 w-full border rounded-md flex items-center justify-center bg-slate-50 overflow-hidden">
                    <img
                      src={selectedItem.photoUrl}
                      alt="Photo de l'objet"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Return details if returned */}
              {selectedItem.status === 'rendu' && (
                <div className="space-y-4 pt-2 border-t">
                  <h3 className="text-lg font-medium">Détails de restitution</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Rendu à</p>
                      <p className="font-medium">{selectedItem.returnedTo}</p>
                    </div>
                    {selectedItem.returnDate && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Date de restitution</p>
                        <p className="font-medium">{formatDate(selectedItem.returnDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* History if exists */}
              {selectedItem.history && selectedItem.history.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="text-lg font-medium">Historique</h3>
                  <div className="space-y-2">
                    {selectedItem.history.slice().reverse().map((entry: any, index: number) => {
                      const date = formatDate(new Date(entry.timestamp));
                      const time = new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const userName = historyUserNames[entry.userId] || 'Utilisateur inconnu';
                      
                      return (
                        <div key={index} className="border-b pb-2 last:border-b-0 text-sm">
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            <span className="font-medium">{userName}</span>
                            <span className="mx-1">-</span>
                            <span>{date} à {time}</span>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {entry.action === 'create' && 'A créé cet objet trouvé'}
                            {entry.action === 'update' && 'A mis à jour cet objet trouvé'}
                            {entry.action === 'delete' && 'A supprimé cet objet trouvé'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              <div className="space-y-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                    <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                    <p className="font-medium">{formatDate(selectedItem.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleDeleteLostItem}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setViewItemDialogOpen(false)}>
                Fermer
              </Button>
              <Button onClick={handleEditFromView}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LostFoundPage;