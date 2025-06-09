import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  AlertTriangle,
  ClipboardList,
  Filter,
  RefreshCw,
  Loader2,
  CheckSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getHotels } from '@/lib/db/hotels';
import LogbookEntry from '@/components/logbook/LogbookEntry';
import LogbookEntryForm from '@/components/logbook/LogbookEntryForm';
import LogbookCalendar from '@/components/logbook/LogbookCalendar';
import LogbookReminders from '@/components/logbook/LogbookReminders';
import LogbookDateNavigation from '@/components/logbook/LogbookDateNavigation';
import LogbookChecklistItem from '@/components/logbook/LogbookChecklistItem';
import { 
  LogbookEntry as LogbookEntryType, 
  LogbookReminder,
  getLogbookEntriesByDate,
  createLogbookEntry,
  updateLogbookEntry,
  deleteLogbookEntry,
  markLogbookEntryAsRead,
  markLogbookEntryAsCompleted,
  addCommentToLogbookEntry,
  getActiveLogbookReminders,
  markLogbookReminderAsCompleted,
  createLogbookReminder
} from '@/lib/db/logbook';

// Type pour les éléments de la check-list
type ChecklistItem = {
  id: string;
  serviceId: string;
  title: string;
  completed: boolean;
  dueDate: string;
  completedById?: string | null;
  completedByName?: string | null;
  completedAt?: string | null;
};

// Type pour les rappels
type Reminder = {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  createdById: string;
  createdByName: string;
};

// Type pour les entrées du cahier de consignes (pour résoudre les erreurs TypeScript)
type EntryType = {
  id: string;
  date: string;
  time: string;
  endDate?: string;
  displayRange?: boolean;
  serviceId: string;
  serviceName: string;
  serviceIcon: string;
  content: string;
  authorId: string;
  authorName: string;
  hotelId: string;
  hotelName: string;
  isTask: boolean;
  isCompleted?: boolean;
  comments?: any[];
  isRead?: boolean;
  roomNumber?: string;
};

// Mock services
const mockServices = [
  { id: 'important', name: 'Important', icon: '⚠️' },
  { id: 'reception', name: 'Réception', icon: '👥' },
  { id: 'housekeeping', name: 'Housekeeping', icon: '🛏️' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'technical', name: 'Technique', icon: '🔧' },
  { id: 'direction', name: 'Direction', icon: '👑' }
];

// Exemple de checklist items
const mockChecklistItems: ChecklistItem[] = [
  { id: 'check1', serviceId: 'reception', title: 'Vérifier la caisse', completed: false, dueDate: new Date().toISOString() },
  { id: 'check2', serviceId: 'housekeeping', title: 'Contrôle des stocks de linge', completed: false, dueDate: new Date().toISOString() },
  { id: 'check3', serviceId: 'reception', title: 'Transmission des VIP', completed: true, dueDate: new Date().toISOString(), completedById: 'user1', completedByName: 'Jean Dupont', completedAt: new Date().toISOString() }
];

const LogbookPage = () => {
  const [selectedTab, setSelectedTab] = useState<string>('entries');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<Date>(new Date());
  const [filterService, setFilterService] = useState<string>('all');
  const [filterHotel, setFilterHotel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyTasks, setShowOnlyTasks] = useState<boolean>(false);
  const [entries, setEntries] = useState<LogbookEntryType[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LogbookEntryType[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [filteredChecklistItems, setFilteredChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState<boolean>(false);
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntryType | null>(null);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Load hotels the user has access to
  useEffect(() => {
    const loadAvailableHotels = async () => {
      try {
        // Load hotels from database with permissions filtering
        const hotelsData = await getHotels();
        setAvailableHotels(hotelsData);
        
        // Automatically set filterHotel if user has only one hotel
        if (hotelsData.length === 1) {
          setFilterHotel(hotelsData[0].id);
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
        setError('Impossible de charger les hôtels. Veuillez réessayer.');
      }
    };
    
    loadAvailableHotels();
  }, []);
  
  // Load entries for the selected date
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser) {
          navigate('/login');
          return;
        }
        
        // Load entries for the selected date
        const entriesData = await getLogbookEntriesByDate(
          selectedDate,
          filterHotel !== 'all' ? filterHotel : undefined
        );
        // S'assurer que chaque entrée a un ID valide
        const validatedEntries = entriesData.map(entry => ({
          ...entry,
          id: entry.id || `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        setEntries(validatedEntries);
        
        // Load reminders
        const remindersData = await getActiveLogbookReminders(selectedDate);
        // S'assurer que chaque rappel a un ID valide
        const validatedReminders = remindersData.map(reminder => ({
          ...reminder,
          id: reminder.id || `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })) as Reminder[];
        setReminders(validatedReminders);
        
      } catch (error) {
        console.error('Error loading entries:', error);
        setError('Une erreur est survenue lors du chargement des consignes.');
      } finally {
        setLoading(false);
      }
    };
    
    loadEntries();
  }, [selectedDate, filterHotel, currentUser, navigate]);
  
  // Apply filters whenever entries, filterService, filterHotel, or searchQuery changes
  useEffect(() => {
    const filterEntries = () => {
      let filtered = [...entries];
      
      // Filter by service
      if (filterService !== 'all') {
        filtered = filtered.filter(entry => entry.serviceId === filterService);
      }
      
      // Filter by hotel
      if (filterHotel !== 'all') {
        filtered = filtered.filter(entry => entry.hotelId === filterHotel);
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          entry => entry.content.toLowerCase().includes(query) ||
                   entry.authorName?.toLowerCase().includes(query) ||
                   (entry.roomNumber && entry.roomNumber.toLowerCase().includes(query))
        );
      }
      
      // Filter by tasks
      if (showOnlyTasks) {
        filtered = filtered.filter(entry => entry.isTask);
      }
      
      // Filter by date or date range
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        
        // Si l'entrée a une plage de dates
        if (entry.displayRange && entry.endDate) {
          const startDate = new Date(entry.date);
          const endDate = new Date(entry.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          const selectedDateCopy = new Date(selectedDate);
          selectedDateCopy.setHours(12, 0, 0, 0);
          
          return selectedDateCopy >= startDate && selectedDateCopy <= endDate;
        }
        
        // Pour une date unique
        return (
          entryDate.getDate() === selectedDate.getDate() &&
          entryDate.getMonth() === selectedDate.getMonth() &&
          entryDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      
      // Sort by time and importance (more important first, then by time)
      filtered.sort((a, b) => {
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        
        // Then sort by time (latest first)
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        if (timeA[0] !== timeB[0]) {
          return timeB[0] - timeA[0];
        }
        
        return timeB[1] - timeA[1];
      });
      
      setFilteredEntries(filtered);
    };
    
    filterEntries();
  }, [entries, filterService, filterHotel, searchQuery, showOnlyTasks, selectedDate]);
  
  // Load checklist items when selectedChecklistDate changes
  useEffect(() => {
    const loadChecklistItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser) {
          navigate('/login');
          return;
        }
        
        // Dans une version réelle, nous chargerions les éléments de la check-list depuis Firebase
        // pour la date sélectionnée
        // Exemple: const checklistData = await getDailyChecklistItems(selectedChecklistDate, filterHotel);
        
        // Pour l'instant, nous utilisons les données mockées
        // Filtrer les éléments de la check-list par date si nécessaire
        const filteredItems = mockChecklistItems.filter(item => {
          const itemDate = new Date(item.dueDate);
          return (
            itemDate.getDate() === selectedChecklistDate.getDate() &&
            itemDate.getMonth() === selectedChecklistDate.getMonth() &&
            itemDate.getFullYear() === selectedChecklistDate.getFullYear()
          );
        });
        
        setChecklistItems(filteredItems);
        // Mettre à jour également les éléments filtrés
        setFilteredChecklistItems(filteredItems);
        
      } catch (error) {
        console.error('Error loading checklist items:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les éléments de la check-list.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadChecklistItems();
  }, [selectedChecklistDate, toast, navigate, currentUser, filterHotel]);
  
  // Apply filters for checklist items
  useEffect(() => {
    let filtered = [...checklistItems];
    
    // Filter by service
    if (filterService !== 'all') {
      filtered = filtered.filter(item => item.serviceId === filterService);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.title.toLowerCase().includes(query));
    }
    
    setFilteredChecklistItems(filtered);
  }, [filterService, searchQuery, checklistItems]);
  
  // Group entries by service
  const entriesByService = () => {
    const grouped: Record<string, LogbookEntryType[]> = {};
    
    // Initialize with all services (including empty ones)
    mockServices.forEach(service => {
      grouped[service.id] = [];
    });
    
    // Populate with entries
    filteredEntries.forEach(entry => {
      if (!grouped[entry.serviceId]) {
        grouped[entry.serviceId] = [];
      }
      
      grouped[entry.serviceId].push(entry);
    });
    
    return grouped;
  };
  
  // Handle saving a new entry
  const handleSaveEntry = async (formData: any) => {
    try {
      // Verify the user has access to the selected hotel
      if (!hasHotelAccess(formData.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel.",
          variant: "destructive",
        });
        return;
      }
      
      // Find hotel name
      const hotel = availableHotels.find(h => h.id === formData.hotelId);
      const hotelName = hotel ? hotel.name : 'Hôtel inconnu';
      
      // Find service details
      const serviceInfo = mockServices.find(s => s.id === formData.serviceId);
      
      if (selectedEntry) {
        // Update existing entry
        await updateLogbookEntry(selectedEntry.id!, {
          ...formData,
          serviceName: serviceInfo?.name || '',
          serviceIcon: serviceInfo?.icon || '',
          hotelName
        });
        
        toast({
          title: "Consigne mise à jour",
          description: "La consigne a été mise à jour avec succès.",
        });
      } else {
        // Create new entry
        const entryId = await createLogbookEntry({
          ...formData,
          serviceName: serviceInfo?.name || '',
          serviceIcon: serviceInfo?.icon || '',
          hotelName
        });
        
        // Si un rappel doit être créé
        if (formData.hasReminder) {
          const newReminder = {
            title: formData.reminderTitle,
            description: formData.reminderDescription || '',
            remindAt: formData.date,
            endDate: formData.endDate || undefined, 
            displayRange: formData.displayRange || false,
            entryId,
            userIds: [currentUser?.id || 'unknown'],
          };
          
          await createLogbookReminder(newReminder);
        }
        
        toast({
          title: "Consigne créée",
          description: "La consigne a été ajoutée au cahier avec succès.",
        });
      }
      
      // Close dialog
      setNewEntryDialogOpen(false);
      setEditEntryDialogOpen(false);
      setSelectedEntry(null);
      
      // Reload entries
      const updatedEntries = await getLogbookEntriesByDate(
        selectedDate,
        filterHotel !== 'all' ? filterHotel : undefined
      );
      setEntries(updatedEntries);
      
      // Reload reminders
      const updatedReminders = await getActiveLogbookReminders(selectedDate);
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la consigne.",
        variant: "destructive",
      });
    }
  };
  
  // Handle editing an entry
  const handleEditEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      // Verify the user has access to the hotel of this entry
      if (!hasHotelAccess(entry.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedEntry(entry);
      setEditEntryDialogOpen(true);
    }
  };
  
  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      // Verify the user has access to the hotel of this entry
      if (!hasHotelAccess(entry.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel.",
          variant: "destructive",
        });
        return;
      }
      
      await deleteLogbookEntry(entryId);
      
      toast({
        title: "Consigne supprimée",
        description: "La consigne a été supprimée avec succès.",
      });
      
      // Refresh entries
      const updatedEntries = await getLogbookEntriesByDate(
        selectedDate,
        filterHotel !== 'all' ? filterHotel : undefined
      );
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la consigne.",
        variant: "destructive",
      });
    }
  };
  
  // Handle marking an entry as read
  const handleMarkAsRead = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      // Verify the user has access to the hotel of this entry
      if (!hasHotelAccess(entry.hotelId)) {
        return;
      }
      
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
  
  // Handle marking an entry as completed
  const handleMarkAsCompleted = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      // Verify the user has access to the hotel of this entry
      if (!hasHotelAccess(entry.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel.",
          variant: "destructive",
        });
        return;
      }
      
      await markLogbookEntryAsCompleted(entryId);
      
      toast({
        title: "Tâche terminée",
        description: "La tâche a été marquée comme terminée.",
      });
      
      // Refresh entries
      const updatedEntries = await getLogbookEntriesByDate(
        selectedDate,
        filterHotel !== 'all' ? filterHotel : undefined
      );
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error marking entry as completed:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage de la tâche.",
        variant: "destructive",
      });
    }
  };
  
  // Handle adding a comment
  const handleAddComment = async (entryId: string, commentText: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      // Verify the user has access to the hotel of this entry
      if (!hasHotelAccess(entry.hotelId)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas accès à cet hôtel.",
          variant: "destructive",
        });
        return;
      }
      
      await addCommentToLogbookEntry(entryId, commentText);
      
      // Refresh entries
      const updatedEntries = await getLogbookEntriesByDate(
        selectedDate,
        filterHotel !== 'all' ? filterHotel : undefined
      );
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du commentaire.",
        variant: "destructive",
      });
    }
  };
  
  // Handle mark reminder as completed
  const handleMarkReminderAsCompleted = async (reminderId: string) => {
    try {
      await markLogbookReminderAsCompleted(reminderId);
      
      toast({
        title: "Rappel terminé",
        description: "Le rappel a été marqué comme terminé.",
      });
      
      // Refresh reminders
      const updatedReminders = await getActiveLogbookReminders(selectedDate);
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage du rappel.",
        variant: "destructive",
      });
    }
  };
  
  // Handle toggling checklist item completion
  const handleToggleChecklistItem = (itemId: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? 
          { 
            ...item, 
            completed: !item.completed,
            completedById: !item.completed ? (currentUser?.id || 'unknown') : null,
            completedByName: !item.completed ? (currentUser?.name || 'Utilisateur') : null,
            completedAt: !item.completed ? new Date().toISOString() : null
          } : item
      )
    );
  };
  
  // Create a new checklist item
  const handleAddChecklistItem = (data: Partial<ChecklistItem>) => {
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      serviceId: data.serviceId || 'reception',
      title: data.title || 'Nouvelle tâche',
      completed: data.completed || false,
      dueDate: data.dueDate || new Date().toISOString(),
      completedById: null,
      completedByName: null,
      completedAt: null
    };
    
    setChecklistItems(prev => [...prev, newItem]);
    
    toast({
      title: "Item ajouté",
      description: "L'élément a été ajouté à la liste.",
    });
  };
  
  const grouped = entriesByService();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cahier de Consignes</h1>
        <p className="text-muted-foreground">Gérez et partagez les consignes quotidiennes entre services</p>
      </div>
      
      <Tabs defaultValue="entries" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="entries">Consignes</TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center">
            <CheckSquare className="mr-2 h-4 w-4" />
            Check-list
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="entries">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main content - entries by service */}
            <div className="col-span-1 md:col-span-8 space-y-4">
              <LogbookDateNavigation 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher dans les consignes..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={filterService}
                  onValueChange={setFilterService}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tous les services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {mockServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <span className="mr-2">{service.icon}</span>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {availableHotels.length > 1 && (
                  <Select
                    value={filterHotel}
                    onValueChange={setFilterHotel}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les hôtels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les hôtels</SelectItem>
                      {availableHotels.map(hotel => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Button
                  variant="outline"
                  className={cn(
                    "flex items-center",
                    showOnlyTasks ? "bg-brand-50 border-brand-200 text-brand-700" : ""
                  )}
                  onClick={() => setShowOnlyTasks(!showOnlyTasks)}
                >
                  <ClipboardList className={cn(
                    "mr-2 h-4 w-4",
                    showOnlyTasks ? "text-brand-500" : "text-muted-foreground"
                  )} />
                  Tâches
                </Button>
                
                <Button
                  variant="default"
                  onClick={() => setNewEntryDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                  <span className="ml-2">Chargement des consignes...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Aucune consigne trouvée</p>
                  <p className="text-muted-foreground mt-1">
                    Aucune consigne n'est disponible pour cette date et ces filtres.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setFilterService('all');
                      setFilterHotel('all');
                      setSearchQuery('');
                      setShowOnlyTasks(false);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Display entries grouped by service */}
                  {filterService === 'all' ? (
                    Object.entries(grouped).map(([serviceId, serviceEntries]) => {
                      if (serviceEntries.length === 0) return null;
                      
                      const service = mockServices.find(s => s.id === serviceId);
                      if (!service) return null;
                      
                      return (
                        <div key={serviceId} className="space-y-2">
                          <div className="flex items-center mb-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                            <span className="text-xl mr-2">{service.icon}</span>
                            <h3 className="font-semibold">{service.name}</h3>
                            <Badge className={cn(
                              "ml-2",
                              service.id === 'important' ? 'bg-red-100 text-red-800' : ''
                            )}>
                              {serviceEntries.length}
                            </Badge>
                          </div>
                          
                          {serviceEntries.map(entry => (
                            <LogbookEntry
                              key={entry.id || ''}
                              entry={entry as EntryType}
                              onEdit={handleEditEntry}
                              onDelete={handleDeleteEntry}
                              onMarkAsRead={handleMarkAsRead}
                              onMarkAsCompleted={handleMarkAsCompleted}
                              onAddComment={handleAddComment}
                            />
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-2">
                      {filteredEntries.map(entry => (
                        <LogbookEntry
                          key={entry.id || ''}
                          entry={entry as EntryType}
                          onEdit={handleEditEntry}
                          onDelete={handleDeleteEntry}
                          onMarkAsRead={handleMarkAsRead}
                          onMarkAsCompleted={handleMarkAsCompleted}
                          onAddComment={handleAddComment}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sidebar - calendar and reminders */}
            <div className="col-span-1 md:col-span-4 space-y-4">
              <LogbookCalendar 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              
              <LogbookReminders 
                reminders={reminders}
                onMarkAsCompleted={handleMarkReminderAsCompleted}
                selectedDate={selectedDate}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-brand-500" />
                    Filtres rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setFilterService('important');
                        setShowOnlyTasks(false);
                      }}
                    >
                      <span className="mr-2">⚠️</span>
                      Consignes importantes
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setFilterService('all');
                        setShowOnlyTasks(true);
                      }}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Tâches à faire
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setFilterService('all');
                        setFilterHotel('all');
                        setShowOnlyTasks(false);
                        setSearchQuery('');
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Réinitialiser les filtres
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="checklist">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Checklist content */}
            <div className="col-span-1 md:col-span-8 space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher dans la check-list..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={filterService}
                  onValueChange={setFilterService}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tous les services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {mockServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <span className="mr-2">{service.icon}</span>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="default"
                  onClick={() => {
                    // Handle adding a new checklist item
                    handleAddChecklistItem({
                      serviceId: filterService === 'all' ? 'reception' : filterService,
                      title: "Nouvelle tâche",
                      completed: false,
                      dueDate: new Date().toISOString()
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                  <span className="ml-2">Chargement de la check-list...</span>
                </div>
              ) : filteredChecklistItems.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Aucun élément trouvé</p>
                  <p className="text-muted-foreground mt-1">
                    Aucun élément dans la check-list ne correspond à ces filtres.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setFilterService('all');
                      setSearchQuery('');
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group checklist items by service */}
                  {filterService === 'all' ? (
                    mockServices.map(service => {
                      const serviceItems = filteredChecklistItems.filter(item => item.serviceId === service.id);
                      
                      if (serviceItems.length === 0) return null;
                      
                      return (
                        <div key={service.id} className="space-y-2">
                          <div className="flex items-center mb-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                            <span className="text-xl mr-2">{service.icon}</span>
                            <h3 className="font-semibold">{service.name}</h3>
                            <Badge className="ml-2">
                              {serviceItems.length}
                            </Badge>
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
                    })
                  ) : (
                    <div className="space-y-2">
                      {filteredChecklistItems.map(item => (
                        <LogbookChecklistItem 
                          key={item.id}
                          item={item}
                          onToggle={handleToggleChecklistItem}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sidebar for checklist */}
            <div className="col-span-1 md:col-span-4 space-y-4">
              <LogbookCalendar 
                selectedDate={selectedChecklistDate}
                onDateChange={setSelectedChecklistDate}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2 text-brand-500" />
                    Check-list du jour
                  </CardTitle>
                  <CardDescription>
                    {selectedChecklistDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Statistiques</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <div className="text-2xl font-bold text-green-600">
                          {filteredChecklistItems.filter(item => item.completed).length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Terminés
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <div className="text-2xl font-bold text-amber-600">
                          {filteredChecklistItems.filter(item => !item.completed).length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          À faire
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="text-sm font-medium mb-2">Filtres</div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setFilterService('all')}
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Toutes les tâches
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setFilterService('all');
                            setSearchQuery('');
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Réinitialiser les filtres
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Entry Dialog */}
      <LogbookEntryForm
        isOpen={newEntryDialogOpen}
        onClose={() => setNewEntryDialogOpen(false)}
        onSave={handleSaveEntry}
        initialData={{
          serviceId: '',
          content: '',
          importance: 1,
          date: selectedDate.toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hotelId: availableHotels.length === 1 ? availableHotels[0].id : '',
          isTask: false,
          // Ajout des nouvelles propriétés
          endDate: '',
          displayRange: false,
          hasReminder: false,
          reminderTitle: '',
          reminderDescription: ''
        }}
      />
      
      {/* Edit Entry Dialog */}
      {selectedEntry && (
        <LogbookEntryForm
          isOpen={editEntryDialogOpen}
          onClose={() => {
            setEditEntryDialogOpen(false);
            setSelectedEntry(null);
          }}
          onSave={handleSaveEntry}
          initialData={selectedEntry}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default LogbookPage;