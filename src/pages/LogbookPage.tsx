import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Bell, 
  CheckSquare,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { 
  getLogbookEntriesByDate, 
  createLogbookEntry, 
  updateLogbookEntry, 
  deleteLogbookEntry, 
  markLogbookEntryAsCompleted,
  markLogbookEntryAsRead,
  addCommentToLogbookEntry,
  getActiveLogbookReminders
} from '@/lib/db/logbook';
import { getHotels, getHotelName } from '@/lib/db/hotels';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import components
import LogbookDateNavigation from '@/components/logbook/LogbookDateNavigation';
import LogbookCalendar from '@/components/logbook/LogbookCalendar';
import LogbookEntry from '@/components/logbook/LogbookEntry';
import LogbookEntryForm from '@/components/logbook/LogbookEntryForm';
import LogbookReminders from '@/components/logbook/LogbookReminders';
import LogbookChecklistItem from '@/components/logbook/LogbookChecklistItem';

const LogbookPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('consignes');
  const [entries, setEntries] = useState<any[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Dialogs
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [newChecklistItemDialogOpen, setNewChecklistItemDialogOpen] = useState(false);
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState(false);
  const [editChecklistItemDialogOpen, setEditChecklistItemDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<any>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'entry' | 'checklist'}>(
    {id: '', type: 'entry'}
  );
  
  // Load entries and checklist items for the selected date
  useEffect(() => {
    loadEntriesAndChecklist();
  }, [selectedDate, selectedHotel]);
  
  // Load available hotels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelsData = await getHotels();
        
        // Filter hotels based on user's permissions
        let userHotels = hotelsData;
        if (currentUser && currentUser.role !== 'admin') {
          userHotels = hotelsData.filter(hotel => 
            currentUser.hotels.includes(hotel.id)
          );
        }
        
        setAvailableHotels(userHotels);
        
        // If user has only one hotel, select it by default
        if (userHotels.length === 1 && !selectedHotel) {
          setSelectedHotel(userHotels[0].id);
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des hôtels",
          variant: "destructive",
        });
      }
    };
    
    loadHotels();
  }, [currentUser, toast, selectedHotel]);
  
  // Load entries and checklist items
  const loadEntriesAndChecklist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get entries for the selected date
      const entriesData = await getLogbookEntriesByDate(selectedDate, selectedHotel);
      
      // Separate regular entries from checklist items
      const regularEntries = entriesData.filter(entry => !entry.isTask);
      const checkItems = entriesData.filter(entry => entry.isTask);
      
      // Get reminders
      const remindersData = await getActiveLogbookReminders(selectedDate);
      
      setEntries(regularEntries);
      setChecklistItems(checkItems);
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading logbook data:', error);
      setError('Une erreur est survenue lors du chargement des données');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du cahier de consignes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter entries based on search query
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      entry.content.toLowerCase().includes(query) ||
      (entry.serviceName && entry.serviceName.toLowerCase().includes(query)) ||
      (entry.authorName && entry.authorName.toLowerCase().includes(query))
    );
  });
  
  // Filter checklist items based on search query
  const filteredChecklistItems = checklistItems.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.serviceName && item.serviceName.toLowerCase().includes(query))
    );
  });
  
  // Check if user can create/edit/delete entries
  const canManageEntries = () => {
    if (!currentUser) return false;
    
    // Admins can always manage entries
    if (currentUser.role === 'admin' || currentUser.role === 'hotel_admin' || currentUser.role === 'group_admin') {
      return true;
    }
    
    return false;
  };
  
  // Handle form submission for new entry
  const handleSubmitEntry = async (formData: any) => {
    try {
      // Create new entry
      await createLogbookEntry({
        ...formData,
        authorId: currentUser?.id
      });
      
      toast({
        title: formData.isTask ? "Tâche créée" : "Consigne créée",
        description: formData.isTask ? "La tâche a été créée avec succès" : "La consigne a été créée avec succès",
      });
      
      // Reload entries
      loadEntriesAndChecklist();
      
      // Close dialog
      setNewEntryDialogOpen(false);
      setNewChecklistItemDialogOpen(false);
    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission for edit entry
  const handleUpdateEntry = async (formData: any) => {
    try {
      // Update entry
      await updateLogbookEntry(formData.id, formData);
      
      toast({
        title: formData.isTask ? "Tâche mise à jour" : "Consigne mise à jour",
        description: formData.isTask ? "La tâche a été mise à jour avec succès" : "La consigne a été mise à jour avec succès",
      });
      
      // Reload entries
      loadEntriesAndChecklist();
      
      // Close dialog
      setEditEntryDialogOpen(false);
      setEditChecklistItemDialogOpen(false);
      setSelectedEntry(null);
      setSelectedChecklistItem(null);
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete entry
  const handleDeleteEntry = async () => {
    if (!itemToDelete.id) return;
    
    try {
      // Delete entry
      await deleteLogbookEntry(itemToDelete.id);
      
      toast({
        title: itemToDelete.type === 'checklist' ? "Tâche supprimée" : "Consigne supprimée",
        description: itemToDelete.type === 'checklist' ? "La tâche a été supprimée avec succès" : "La consigne a été supprimée avec succès",
      });
      
      // Reload entries
      loadEntriesAndChecklist();
      
      // Close dialog
      setDeleteConfirmDialogOpen(false);
      setItemToDelete({id: '', type: 'entry'});
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };
  
  // Handle mark entry as read
  const handleMarkAsRead = async (entryId: string) => {
    try {
      await markLogbookEntryAsRead(entryId);
      
      // Update local state
      setEntries(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, isRead: true } : entry
        )
      );
    } catch (error) {
      console.error('Error marking entry as read:', error);
    }
  };
  
  // Handle mark checklist item as completed
  const handleToggleChecklistItem = async (itemId: string) => {
    try {
      // Find the item
      const item = checklistItems.find(item => item.id === itemId);
      if (!item) return;
      
      // If already completed, do nothing (we don't support uncompleting)
      if (item.completed) return;
      
      // Mark as completed
      await markLogbookEntryAsCompleted(itemId);
      
      // Update local state
      setChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, completed: true } : item
        )
      );
      
      toast({
        title: "Tâche terminée",
        description: "La tâche a été marquée comme terminée",
      });
    } catch (error) {
      console.error('Error completing checklist item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la tâche",
        variant: "destructive",
      });
    }
  };
  
  // Handle add comment to entry
  const handleAddComment = async (entryId: string, comment: string) => {
    try {
      await addCommentToLogbookEntry(entryId, comment);
      
      // Reload entries to get updated comments
      loadEntriesAndChecklist();
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du commentaire",
        variant: "destructive",
      });
    }
  };
  
  // Handle edit entry
  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditEntryDialogOpen(true);
  };
  
  // Handle edit checklist item
  const handleEditChecklistItem = (item: any) => {
    setSelectedChecklistItem(item);
    setEditChecklistItemDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = (id: string, type: 'entry' | 'checklist') => {
    setItemToDelete({id, type});
    setDeleteConfirmDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cahier de Consignes</h1>
          <p className="text-muted-foreground">Gestion des consignes et tâches quotidiennes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Hotel selector */}
          <Select 
            value={selectedHotel || ''} 
            onValueChange={setSelectedHotel}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tous les hôtels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les hôtels</SelectItem>
              {availableHotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <LogbookDateNavigation 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="consignes" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Consignes
              </TabsTrigger>
              <TabsTrigger value="check-list" className="flex items-center">
                <CheckSquare className="mr-2 h-4 w-4" />
                Check-list
              </TabsTrigger>
            </TabsList>
            
            <div className="flex justify-between items-center mt-4 mb-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={activeTab === 'consignes' ? "Rechercher dans les consignes..." : "Rechercher dans la check-list..."}
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {canManageEntries() && (
                <Button 
                  onClick={() => {
                    if (activeTab === 'consignes') {
                      setNewEntryDialogOpen(true);
                    } else {
                      setNewChecklistItemDialogOpen(true);
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle
                </Button>
              )}
            </div>
            
            <TabsContent value="consignes" className="mt-2 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Chargement des consignes...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Aucune consigne pour cette date</p>
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <LogbookEntry 
                    key={entry.id}
                    entry={entry}
                    onEdit={canManageEntries() ? handleEditEntry : undefined}
                    onDelete={canManageEntries() ? (id) => handleDeleteConfirm(id, 'entry') : undefined}
                    onMarkAsRead={handleMarkAsRead}
                    onAddComment={handleAddComment}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="check-list" className="mt-2 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Chargement de la check-list...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : filteredChecklistItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Aucune tâche pour cette date</p>
                </div>
              ) : (
                filteredChecklistItems.map(item => (
                  <div key={item.id} className="relative group">
                    <LogbookChecklistItem 
                      item={item}
                      onToggle={handleToggleChecklistItem}
                    />
                    
                    {canManageEntries() && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditChecklistItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteConfirm(item.id, 'checklist')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <LogbookCalendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          
          <LogbookReminders 
            reminders={reminders}
            selectedDate={selectedDate}
          />
        </div>
      </div>
      
      {/* New Entry Dialog */}
      <LogbookEntryForm 
        isOpen={newEntryDialogOpen}
        onClose={() => setNewEntryDialogOpen(false)}
        onSubmit={handleSubmitEntry}
        isEditing={false}
      />
      
      {/* New Checklist Item Dialog */}
      <LogbookEntryForm 
        isOpen={newChecklistItemDialogOpen}
        onClose={() => setNewChecklistItemDialogOpen(false)}
        onSubmit={handleSubmitEntry}
        isEditing={false}
        initialData={{ isTask: true }}
      />
      
      {/* Edit Entry Dialog */}
      {selectedEntry && (
        <LogbookEntryForm 
          isOpen={editEntryDialogOpen}
          onClose={() => {
            setEditEntryDialogOpen(false);
            setSelectedEntry(null);
          }}
          onSubmit={handleUpdateEntry}
          isEditing={true}
          initialData={selectedEntry}
        />
      )}
      
      {/* Edit Checklist Item Dialog */}
      {selectedChecklistItem && (
        <LogbookEntryForm 
          isOpen={editChecklistItemDialogOpen}
          onClose={() => {
            setEditChecklistItemDialogOpen(false);
            setSelectedChecklistItem(null);
          }}
          onSubmit={handleUpdateEntry}
          isEditing={true}
          initialData={selectedChecklistItem}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette {itemToDelete.type === 'checklist' ? 'tâche' : 'consigne'} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEntry}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogbookPage;