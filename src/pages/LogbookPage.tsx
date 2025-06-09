import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  BookOpen, 
  Search, 
  Plus, 
  RefreshCw, 
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Filter,
  CheckSquare,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { getHotels } from '@/lib/db/hotels';

// Import components
import LogbookDateNavigation from '@/components/logbook/LogbookDateNavigation';
import LogbookCalendar from '@/components/logbook/LogbookCalendar';
import LogbookEntry from '@/components/logbook/LogbookEntry';
import LogbookEntryForm from '@/components/logbook/LogbookEntryForm';
import LogbookReminders from '@/components/logbook/LogbookReminders';
import LogbookChecklistItem from '@/components/logbook/LogbookChecklistItem';

// Import functions from logbook.ts
import { 
  getLogbookEntriesByDate, 
  createLogbookEntry, 
  updateLogbookEntry, 
  deleteLogbookEntry,
  markLogbookEntryAsRead,
  markLogbookEntryAsCompleted,
  addCommentToLogbookEntry,
  getActiveLogbookReminders,
  markLogbookReminderAsCompleted
} from '@/lib/db/logbook';

const LogbookPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('consignes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<any[]>([]);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // New entry dialog
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  
  // Checklist items
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [newChecklistDialogOpen, setNewChecklistDialogOpen] = useState(false);
  const [checklistFormData, setChecklistFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    dueDate: new Date().toISOString().split('T')[0],
    endDate: '',
    displayRange: false,
    isPermanent: false,
    hotelId: currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : ''
  });
  
  // Load entries for the selected date
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        
        // Get entries for the selected date
        const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel !== 'all' ? filterHotel : undefined);
        
        // Sort entries by importance (descending) and time (descending)
        const sortedEntries = entriesData.sort((a, b) => {
          // First by importance (higher first)
          if (a.importance !== b.importance) {
            return b.importance - a.importance;
          }
          
          // Then by time (newer first)
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          if (timeA[0] !== timeB[0]) {
            return timeB[0] - timeA[0];
          }
          
          return timeB[1] - timeA[1];
        });
        
        setEntries(sortedEntries);
        
        // Get active reminders
        const remindersData = await getActiveLogbookReminders(selectedDate);
        setReminders(remindersData);
        
        // Load checklist items (this would be replaced with actual API call)
        // For now, we'll use a mock implementation
        loadChecklistItems();
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
  }, [selectedDate, filterHotel, toast]);
  
  // Load available hotels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelsData = await getHotels();
        
        // Filter hotels based on user's permissions
        const accessibleHotels = currentUser?.role === 'admin' 
          ? hotelsData 
          : hotelsData.filter(hotel => currentUser?.hotels.includes(hotel.id));
        
        setHotels(accessibleHotels);
        
        // If user has only one hotel, automatically select it
        if (accessibleHotels.length === 1 && filterHotel === 'all') {
          setFilterHotel(accessibleHotels[0].id);
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
      }
    };
    
    loadHotels();
  }, [currentUser, filterHotel]);
  
  // Mock function to load checklist items
  // This would be replaced with an actual API call in a real implementation
  const loadChecklistItems = () => {
    // Filter checklist items by hotel if a specific hotel is selected
    let filteredItems = mockChecklistItems;
    
    if (filterHotel !== 'all') {
      filteredItems = mockChecklistItems.filter(item => 
        !item.hotelId || item.hotelId === filterHotel
      );
    }
    
    setChecklistItems(filteredItems);
  };
  
  // Mock checklist items - this would come from the database in a real implementation
  const mockChecklistItems = [
    // Empty array - removed all test items
  ];
  
  // Services for the checklist
  const services = [
    { id: 'important', name: 'Important', icon: '⚠️' },
    { id: 'reception', name: 'Réception', icon: '👥' },
    { id: 'housekeeping', name: 'Housekeeping', icon: '🛏️' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { id: 'technical', name: 'Technique', icon: '🔧' },
    { id: 'direction', name: 'Direction', icon: '👑' }
  ];
  
  // Handle form submission for new entry
  const handleSubmitEntry = async (formData: any) => {
    try {
      // Create entry in database
      await createLogbookEntry(formData);
      
      toast({
        title: "Consigne créée",
        description: "La consigne a été créée avec succès",
      });
      
      // Reload entries
      const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel !== 'all' ? filterHotel : undefined);
      setEntries(entriesData);
      
      // Close dialog
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
  
  // Handle form submission for new checklist item
  const handleSubmitChecklistItem = async () => {
    try {
      // Validate form
      if (!checklistFormData.title) {
        toast({
          title: "Erreur",
          description: "Le titre est obligatoire",
          variant: "destructive",
        });
        return;
      }
      
      if (!checklistFormData.serviceId) {
        toast({
          title: "Erreur",
          description: "Le service est obligatoire",
          variant: "destructive",
        });
        return;
      }
      
      if (!checklistFormData.hotelId) {
        toast({
          title: "Erreur",
          description: "L'hôtel est obligatoire",
          variant: "destructive",
        });
        return;
      }
      
      if (!checklistFormData.isPermanent && !checklistFormData.dueDate) {
        toast({
          title: "Erreur",
          description: "La date d'échéance est obligatoire",
          variant: "destructive",
        });
        return;
      }
      
      if (checklistFormData.displayRange && !checklistFormData.endDate) {
        toast({
          title: "Erreur",
          description: "La date de fin est obligatoire pour une plage de dates",
          variant: "destructive",
        });
        return;
      }
      
      // Create a new checklist item
      const newItem = {
        id: `checklist-${Date.now()}`,
        title: checklistFormData.title,
        description: checklistFormData.description,
        serviceId: checklistFormData.serviceId,
        dueDate: checklistFormData.dueDate,
        endDate: checklistFormData.displayRange ? checklistFormData.endDate : undefined,
        isPermanent: checklistFormData.isPermanent,
        hotelId: checklistFormData.hotelId,
        hotelName: hotels.find(h => h.id === checklistFormData.hotelId)?.name,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      // In a real implementation, this would be saved to the database
      // For now, we'll just add it to our local state
      setChecklistItems([...checklistItems, newItem]);
      
      toast({
        title: "Tâche créée",
        description: "La tâche a été créée avec succès",
      });
      
      // Reset form and close dialog
      setChecklistFormData({
        title: '',
        description: '',
        serviceId: '',
        dueDate: new Date().toISOString().split('T')[0],
        endDate: '',
        displayRange: false,
        isPermanent: false,
        hotelId: currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : ''
      });
      setNewChecklistDialogOpen(false);
    } catch (error) {
      console.error('Error creating checklist item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la tâche",
        variant: "destructive",
      });
    }
  };
  
  // Handle toggle checklist item
  const handleToggleChecklistItem = (id: string) => {
    // In a real implementation, this would update the database
    // For now, we'll just update our local state
    setChecklistItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              completed: !item.completed,
              completedById: !item.completed ? currentUser?.id : null,
              completedByName: !item.completed ? currentUser?.name : null,
              completedAt: !item.completed ? new Date().toISOString() : null
            } 
          : item
      )
    );
  };
  
  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      // Delete entry from database
      await deleteLogbookEntry(entryId);
      
      toast({
        title: "Consigne supprimée",
        description: "La consigne a été supprimée avec succès",
      });
      
      // Remove from local state
      setEntries(entries.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting logbook entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la consigne",
        variant: "destructive",
      });
    }
  };
  
  // Handle edit entry
  const handleEditEntry = async (entryId: string) => {
    // In a real implementation, this would open an edit dialog
    // For now, we'll just log the action
    console.log('Edit entry:', entryId);
  };
  
  // Handle mark as read
  const handleMarkAsRead = async (entryId: string) => {
    try {
      // Mark entry as read in database
      await markLogbookEntryAsRead(entryId);
      
      // Update local state
      setEntries(entries.map(entry => 
        entry.id === entryId 
          ? { ...entry, isRead: true } 
          : entry
      ));
    } catch (error) {
      console.error('Error marking entry as read:', error);
    }
  };
  
  // Handle mark as completed
  const handleMarkAsCompleted = async (entryId: string) => {
    try {
      // Mark entry as completed in database
      await markLogbookEntryAsCompleted(entryId);
      
      // Update local state
      setEntries(entries.map(entry => 
        entry.id === entryId 
          ? { 
              ...entry, 
              isCompleted: true,
              resolvedById: currentUser?.id,
              resolvedByName: currentUser?.name,
              resolvedAt: new Date().toISOString()
            } 
          : entry
      ));
      
      toast({
        title: "Tâche terminée",
        description: "La tâche a été marquée comme terminée",
      });
    } catch (error) {
      console.error('Error marking entry as completed:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage de la tâche comme terminée",
        variant: "destructive",
      });
    }
  };
  
  // Handle add comment
  const handleAddComment = async (entryId: string, comment: string) => {
    try {
      // Add comment to entry in database
      await addCommentToLogbookEntry(entryId, comment);
      
      // Reload entries to get the updated comments
      const entriesData = await getLogbookEntriesByDate(selectedDate, filterHotel !== 'all' ? filterHotel : undefined);
      setEntries(entriesData);
      
      toast({
        title: "Commentaire ajouté",
        description: "Le commentaire a été ajouté avec succès",
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
  
  // Handle mark reminder as completed
  const handleMarkReminderAsCompleted = async (reminderId: string) => {
    try {
      // Mark reminder as completed in database
      await markLogbookReminderAsCompleted(reminderId);
      
      // Update local state
      setReminders(reminders.filter(reminder => reminder.id !== reminderId));
      
      toast({
        title: "Rappel terminé",
        description: "Le rappel a été marqué comme terminé",
      });
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage du rappel comme terminé",
        variant: "destructive",
      });
    }
  };
  
  // Handle view reminder entry
  const handleViewReminderEntry = (entryId: string) => {
    // In a real implementation, this would scroll to or highlight the entry
    // For now, we'll just log the action
    console.log('View reminder entry:', entryId);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterHotel('all');
    setFilterService('all');
    setFiltersExpanded(false);
  };
  
  // Filter entries based on search query and filters
  const filteredEntries = entries.filter(entry => {
    // Filter by service
    if (filterService !== 'all' && entry.serviceId !== filterService) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = entry.content.toLowerCase().includes(query);
      const matchesService = entry.serviceName?.toLowerCase().includes(query);
      
      return matchesContent || matchesService;
    }
    
    return true;
  });
  
  // Check if user is admin or hotel_admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hotel_admin';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cahier de Consignes</h1>
          <p className="text-muted-foreground">Gestion des consignes et tâches quotidiennes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={() => setNewEntryDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Consigne
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <LogbookCalendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          
          <LogbookReminders 
            reminders={reminders}
            onViewReminder={handleViewReminderEntry}
            onMarkAsCompleted={handleMarkReminderAsCompleted}
            selectedDate={selectedDate}
          />
        </div>
        
        <div className="md:col-span-3 space-y-4">
          <LogbookDateNavigation 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterHotel} onValueChange={setFilterHotel}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Building className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tous les hôtels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les hôtels</SelectItem>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => setFiltersExpanded(!filtersExpanded)}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {filtersExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border rounded-md">
                <div>
                  <label className="text-sm font-medium mb-1 block">Service</label>
                  <Select value={filterService} onValueChange={setFilterService}>
                    <SelectTrigger>
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
                </div>
              </div>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="consignes">Consignes</TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center">
                <CheckSquare className="mr-2 h-4 w-4" />
                Check-list
                <div className="ml-2 bg-brand-100 text-brand-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {checklistItems.filter(item => !item.completed).length}
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="consignes" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Chargement des consignes...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-slate-50 dark:bg-slate-900">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-medium">Aucune consigne pour cette date</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajoutez une nouvelle consigne en cliquant sur le bouton "Nouvelle Consigne"
                  </p>
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <LogbookEntry 
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsCompleted={handleMarkAsCompleted}
                    onAddComment={handleAddComment}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="checklist" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Tâches à effectuer</h2>
                {isAdmin && (
                  <Button 
                    size="sm" 
                    onClick={() => setNewChecklistDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle tâche
                  </Button>
                )}
              </div>
              
              {checklistItems.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-slate-50 dark:bg-slate-900">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-medium">Aucune tâche pour cette date</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAdmin 
                      ? "Ajoutez une nouvelle tâche en cliquant sur le bouton \"Nouvelle tâche\""
                      : "Les tâches apparaîtront ici lorsqu'elles seront assignées"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group by service */}
                  {services.map(service => {
                    const serviceItems = checklistItems.filter(item => item.serviceId === service.id);
                    if (serviceItems.length === 0) return null;
                    
                    return (
                      <div key={service.id} className="space-y-2">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                          <span className="text-xl mr-2">{service.icon}</span>
                          <h3 className="font-medium">{service.name}</h3>
                          <div className="ml-2 bg-brand-100 text-brand-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {serviceItems.filter(item => !item.completed).length}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {serviceItems.map(item => (
                            <LogbookChecklistItem 
                              key={item.id}
                              item={item}
                              onToggle={handleToggleChecklistItem}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* New Entry Form */}
      <LogbookEntryForm 
        isOpen={newEntryDialogOpen}
        onClose={() => setNewEntryDialogOpen(false)}
        onSave={handleSubmitEntry}
      />
      
      {/* New Checklist Item Dialog */}
      <Dialog open={newChecklistDialogOpen} onOpenChange={setNewChecklistDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
            <DialogDescription>
              Créez une nouvelle tâche à effectuer
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={checklistFormData.title}
                onChange={(e) => setChecklistFormData({...checklistFormData, title: e.target.value})}
                placeholder="Titre de la tâche"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Input
                id="description"
                value={checklistFormData.description}
                onChange={(e) => setChecklistFormData({...checklistFormData, description: e.target.value})}
                placeholder="Description de la tâche"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select 
                  value={checklistFormData.serviceId} 
                  onValueChange={(value) => setChecklistFormData({...checklistFormData, serviceId: value})}
                >
                  <SelectTrigger id="service">
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
                <Label htmlFor="hotel">Hôtel</Label>
                <Select 
                  value={checklistFormData.hotelId} 
                  onValueChange={(value) => setChecklistFormData({...checklistFormData, hotelId: value})}
                >
                  <SelectTrigger id="hotel">
                    <SelectValue placeholder="Sélectionner un hôtel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Type de tâche</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-permanent"
                    checked={checklistFormData.isPermanent}
                    onCheckedChange={(checked) => setChecklistFormData({
                      ...checklistFormData, 
                      isPermanent: checked,
                      // If permanent, disable date range
                      displayRange: checked ? false : checklistFormData.displayRange
                    })}
                  />
                  <Label htmlFor="is-permanent" className="text-sm">
                    Tâche permanente
                  </Label>
                </div>
              </div>
              
              {!checklistFormData.isPermanent && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label>Période d'affichage</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="display-range"
                        checked={checklistFormData.displayRange}
                        onCheckedChange={(checked) => setChecklistFormData({...checklistFormData, displayRange: checked})}
                        disabled={checklistFormData.isPermanent}
                      />
                      <Label htmlFor="display-range" className="text-sm">
                        Définir une plage de dates
                      </Label>
                    </div>
                  </div>

                  {checklistFormData.displayRange ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Date de début</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={checklistFormData.dueDate}
                          onChange={(e) => setChecklistFormData({...checklistFormData, dueDate: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Date de fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={checklistFormData.endDate}
                          onChange={(e) => setChecklistFormData({...checklistFormData, endDate: e.target.value})}
                          min={checklistFormData.dueDate} // La date de fin doit être après la date de début
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Date d'échéance</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={checklistFormData.dueDate}
                        onChange={(e) => setChecklistFormData({...checklistFormData, dueDate: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChecklistDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitChecklistItem}>
              Créer la tâche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogbookPage;