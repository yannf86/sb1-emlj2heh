import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';

// Import components
import LogbookDateNavigation from '@/components/logbook/LogbookDateNavigation';
import LogbookCalendar from '@/components/logbook/LogbookCalendar';
import LogbookEntry from '@/components/logbook/LogbookEntry';
import LogbookEntryForm from '@/components/logbook/LogbookEntryForm';
import LogbookReminders from '@/components/logbook/LogbookReminders';
import LogbookChecklistItem from '@/components/logbook/LogbookChecklistItem';
import LogbookChecklistForm from '@/components/logbook/LogbookChecklistForm';
import LogbookChecklistFilter from '@/components/logbook/LogbookChecklistFilter';

// Import functions
import { 
  getLogbookEntriesByDate, 
  createLogbookEntry, 
  updateLogbookEntry, 
  deleteLogbookEntry,
  markLogbookEntryAsRead,
  markLogbookEntryAsCompleted,
  addCommentToLogbookEntry
} from '@/lib/db/logbook';

const LogbookPage = () => {
  // State for date navigation
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State for entries
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for checklist items
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  
  // State for reminders
  const [reminders, setReminders] = useState<any[]>([]);
  
  // State for dialogs
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  
  // State for checklist dialog
  const [newChecklistDialogOpen, setNewChecklistDialogOpen] = useState(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('consignes');
  
  // State for filters
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Check if user is admin or hotel_admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hotel_admin';
  
  // Load entries for the selected date
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel);
        setEntries(entriesData);
        
        // Simulate loading checklist items
        // In a real implementation, this would be a separate API call
        setLoadingChecklist(true);
        
        // Simulate checklist items data
        // This would be replaced with actual data from Firebase
        setTimeout(() => {
          const checklistData = [
            {
              id: 'checklist1',
              serviceId: 'reception',
              title: 'Vérifier la caisse',
              description: 'Vérifier que la caisse est équilibrée en fin de journée',
              completed: false,
              dueDate: new Date().toISOString().split('T')[0],
              hotelId: 'hotel1',
              hotelName: 'Hôtel Royal Palace'
            },
            {
              id: 'checklist2',
              serviceId: 'reception',
              title: 'Transmission des VIP',
              description: 'Transmettre la liste des VIP à l\'équipe de nuit',
              completed: true,
              dueDate: new Date().toISOString().split('T')[0],
              completedById: 'user1',
              completedByName: 'Yann',
              completedAt: new Date().toISOString(),
              hotelId: 'hotel1',
              hotelName: 'Hôtel Royal Palace'
            },
            {
              id: 'checklist3',
              serviceId: 'reception',
              title: 'Nouvelle tâche',
              description: '',
              completed: false,
              dueDate: new Date().toISOString().split('T')[0],
              hotelId: 'hotel1',
              hotelName: 'Hôtel Royal Palace'
            },
            {
              id: 'checklist4',
              serviceId: 'housekeeping',
              title: 'Contrôle des stocks de linge',
              description: 'Vérifier les stocks de linge et passer commande si nécessaire',
              completed: false,
              dueDate: new Date().toISOString().split('T')[0],
              hotelId: 'hotel2',
              hotelName: 'Riviera Luxury Hotel'
            },
            {
              id: 'checklist5',
              serviceId: 'technical',
              title: 'Vérification des équipements',
              description: 'Contrôle hebdomadaire des équipements techniques',
              completed: false,
              dueDate: new Date().toISOString().split('T')[0],
              isPermanent: true,
              hotelId: 'hotel3',
              hotelName: 'Mountain View Resort'
            },
            {
              id: 'checklist6',
              serviceId: 'restaurant',
              title: 'Inventaire des boissons',
              description: 'Faire l\'inventaire des boissons et passer commande',
              completed: false,
              dueDate: new Date().toISOString().split('T')[0],
              endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
              displayRange: true,
              hotelId: 'hotel4',
              hotelName: 'Bordeaux Grand Hotel'
            }
          ];
          
          // Filter checklist items based on hotel filter
          const filteredChecklist = filterHotel === 'all' 
            ? checklistData 
            : checklistData.filter(item => item.hotelId === filterHotel);
          
          // Filter by service if needed
          const serviceFilteredChecklist = filterService === 'all'
            ? filteredChecklist
            : filteredChecklist.filter(item => item.serviceId === filterService);
          
          // Filter by search query if needed
          const searchFilteredChecklist = searchQuery
            ? serviceFilteredChecklist.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
              )
            : serviceFilteredChecklist;
          
          setChecklistItems(searchFilteredChecklist);
          setLoadingChecklist(false);
        }, 500);
        
        // Load reminders
        // This would be replaced with actual data from Firebase
        const reminderData = [
          {
            id: 'reminder1',
            title: 'Réunion d\'équipe',
            description: 'Réunion hebdomadaire avec l\'équipe de réception',
            remindAt: new Date().toISOString(),
            entryId: 'entry1',
            isCompleted: false,
            userIds: ['user1', 'user2']
          },
          {
            id: 'reminder2',
            title: 'Commande fournitures',
            description: 'Passer commande de fournitures de bureau',
            remindAt: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            entryId: 'entry2',
            isCompleted: false,
            userIds: ['user1']
          }
        ];
        
        setReminders(reminderData);
      } catch (error) {
        console.error('Error loading logbook entries:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les consignes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadEntries();
  }, [selectedDate, filterHotel, filterService, searchQuery, toast]);
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Handle new entry submission
  const handleSubmitEntry = async (formData: any) => {
    try {
      await createLogbookEntry(formData);
      
      toast({
        title: "Consigne créée",
        description: "La consigne a été créée avec succès",
      });
      
      // Reload entries
      const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel);
      setEntries(entriesData);
      
      setNewEntryDialogOpen(false);
    } catch (error) {
      console.error('Error creating logbook entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la consigne",
        variant: "destructive",
      });
    }
  };
  
  // Handle edit entry
  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditEntryDialogOpen(true);
  };
  
  // Handle update entry
  const handleUpdateEntry = async (formData: any) => {
    try {
      await updateLogbookEntry(formData.id, formData);
      
      toast({
        title: "Consigne mise à jour",
        description: "La consigne a été mise à jour avec succès",
      });
      
      // Reload entries
      const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel);
      setEntries(entriesData);
      
      setEditEntryDialogOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error updating logbook entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la consigne",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteLogbookEntry(entryId);
      
      toast({
        title: "Consigne supprimée",
        description: "La consigne a été supprimée avec succès",
      });
      
      // Reload entries
      const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error deleting logbook entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la consigne",
        variant: "destructive",
      });
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = async (entryId: string) => {
    try {
      await markLogbookEntryAsRead(entryId);
      
      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === entryId ? { ...entry, isRead: true } : entry
      ));
    } catch (error) {
      console.error('Error marking entry as read:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage de la consigne comme lue",
        variant: "destructive",
      });
    }
  };
  
  // Handle mark as completed
  const handleMarkAsCompleted = async (entryId: string) => {
    try {
      await markLogbookEntryAsCompleted(entryId);
      
      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === entryId ? { ...entry, isCompleted: true } : entry
      ));
    } catch (error) {
      console.error('Error marking entry as completed:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage de la consigne comme terminée",
        variant: "destructive",
      });
    }
  };
  
  // Handle add comment
  const handleAddComment = async (entryId: string, comment: string) => {
    try {
      await addCommentToLogbookEntry(entryId, comment);
      
      // Reload entries to get updated comments
      const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du commentaire",
        variant: "destructive",
      });
    }
  };
  
  // Handle toggle checklist item
  const handleToggleChecklistItem = (itemId: string) => {
    // Update local state
    setChecklistItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { 
          ...item, 
          completed: !item.completed 
        };
        
        // If completed, add completed info
        if (!item.completed) {
          updatedItem.completedById = currentUser?.id;
          updatedItem.completedByName = currentUser?.name;
          updatedItem.completedAt = new Date().toISOString();
        } else {
          // If uncompleted, remove completed info
          delete updatedItem.completedById;
          delete updatedItem.completedByName;
          delete updatedItem.completedAt;
        }
        
        return updatedItem;
      }
      return item;
    }));
    
    // In a real implementation, this would update the database
    toast({
      title: "Tâche mise à jour",
      description: "Le statut de la tâche a été mis à jour",
    });
  };
  
  // Handle new checklist item submission
  const handleSubmitChecklistItem = (formData: any) => {
    // In a real implementation, this would create a new checklist item in the database
    const newItem = {
      id: `checklist${Date.now()}`,
      serviceId: formData.serviceId,
      title: formData.title,
      description: formData.description || '',
      completed: false,
      dueDate: formData.date,
      hotelId: formData.hotelId,
      hotelName: hotels.find(h => h.id === formData.hotelId)?.name || 'Hôtel inconnu',
      isPermanent: formData.isPermanent || false,
      displayRange: formData.displayRange || false,
      endDate: formData.endDate || undefined
    };
    
    // Add to local state
    setChecklistItems(prev => [...prev, newItem]);
    
    toast({
      title: "Tâche créée",
      description: "La tâche a été ajoutée à la check-list",
    });
    
    setNewChecklistDialogOpen(false);
  };
  
  // Group checklist items by service
  const groupedChecklistItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.serviceId]) {
      acc[item.serviceId] = {
        id: item.serviceId,
        name: getServiceName(item.serviceId),
        icon: getServiceIcon(item.serviceId),
        items: []
      };
    }
    
    acc[item.serviceId].items.push(item);
    return acc;
  }, {} as Record<string, { id: string; name: string; icon: string; items: any[] }>);
  
  // Helper function to get service name
  function getServiceName(serviceId: string): string {
    const serviceMap: Record<string, string> = {
      'important': 'Important',
      'reception': 'Réception',
      'housekeeping': 'Housekeeping',
      'restaurant': 'Restaurant',
      'technical': 'Technique',
      'direction': 'Direction'
    };
    
    return serviceMap[serviceId] || 'Autre';
  }
  
  // Helper function to get service icon
  function getServiceIcon(serviceId: string): string {
    const iconMap: Record<string, string> = {
      'important': '⚠️',
      'reception': '👥',
      'housekeeping': '🛏️',
      'restaurant': '🍽️',
      'technical': '🔧',
      'direction': '👑'
    };
    
    return iconMap[serviceId] || '📋';
  }
  
  // Mock hotels data for demo
  const hotels = [
    { id: 'hotel1', name: 'Hôtel Royal Palace' },
    { id: 'hotel2', name: 'Riviera Luxury Hotel' },
    { id: 'hotel3', name: 'Mountain View Resort' },
    { id: 'hotel4', name: 'Bordeaux Grand Hotel' }
  ];
  
  // Reset filters
  const resetFilters = () => {
    setFilterHotel('all');
    setFilterService('all');
    setSearchQuery('');
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left sidebar with calendar */}
      <div className="md:w-64 space-y-6">
        <LogbookCalendar 
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        
        <LogbookReminders 
          reminders={reminders}
          selectedDate={selectedDate}
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <LogbookDateNavigation 
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          
          <div className="flex space-x-2">
            {activeTab === 'consignes' && (
              <Button onClick={() => setNewEntryDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Consigne
              </Button>
            )}
            
            {activeTab === 'check-list' && (
              <Button 
                onClick={() => setNewChecklistDialogOpen(true)}
                disabled={!isAdmin}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Tâche
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="consignes">Consignes</TabsTrigger>
            <TabsTrigger value="check-list">
              <span className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2" />
                Check-list
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="consignes" className="space-y-4 mt-4">
            {loading ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <p>Chargement des consignes...</p>
                  </div>
                </CardContent>
              </Card>
            ) : entries.length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <p>Aucune consigne pour cette date</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setNewEntryDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une consigne
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <LogbookEntry 
                    key={entry.id}
                    entry={entry}
                    onEdit={() => handleEditEntry(entry)}
                    onDelete={() => handleDeleteEntry(entry.id)}
                    onMarkAsRead={() => handleMarkAsRead(entry.id)}
                    onMarkAsCompleted={() => handleMarkAsCompleted(entry.id)}
                    onAddComment={(comment) => handleAddComment(entry.id, comment)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="check-list" className="space-y-4 mt-4">
            <LogbookChecklistFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterHotel={filterHotel}
              onHotelChange={setFilterHotel}
              filterService={filterService}
              onServiceChange={setFilterService}
              onReset={resetFilters}
            />
            
            {loadingChecklist ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <p>Chargement des tâches...</p>
                  </div>
                </CardContent>
              </Card>
            ) : Object.keys(groupedChecklistItems).length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <p>Aucune tâche trouvée</p>
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setNewChecklistDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une tâche
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.values(groupedChecklistItems).map(group => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{group.icon}</span>
                      <h3 className="text-lg font-medium">{group.name}</h3>
                      <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
                        {group.items.length}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {group.items.map(item => (
                        <LogbookChecklistItem 
                          key={item.id}
                          item={item}
                          onToggle={handleToggleChecklistItem}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Entry Dialog */}
      <LogbookEntryForm 
        isOpen={newEntryDialogOpen}
        onClose={() => setNewEntryDialogOpen(false)}
        onSave={handleSubmitEntry}
      />
      
      {/* Edit Entry Dialog */}
      {selectedEntry && (
        <LogbookEntryForm 
          isOpen={editEntryDialogOpen}
          onClose={() => {
            setEditEntryDialogOpen(false);
            setSelectedEntry(null);
          }}
          initialData={selectedEntry}
          onSave={handleUpdateEntry}
          isEditing={true}
        />
      )}
      
      {/* New Checklist Item Dialog */}
      <LogbookChecklistForm
        isOpen={newChecklistDialogOpen}
        onClose={() => setNewChecklistDialogOpen(false)}
        onSave={handleSubmitChecklistItem}
      />
    </div>
  );
};

export default LogbookPage;