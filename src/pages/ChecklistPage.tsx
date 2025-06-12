import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  AlertTriangle,
  Check,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { getHotels } from '@/lib/db/hotels';
import { formatToISOLocalDate, normalizeToMidnight, isToday } from '@/lib/date-utils';

// Import components
import ChecklistNavigation from '@/components/checklist/ChecklistNavigation';
import ChecklistGroup from '@/components/checklist/ChecklistGroup';
import CompleteDialog from '@/components/checklist/CompleteDialog';

// Import services
import { 
  getChecklistItems, 
  completeChecklistItem, 
  uncompleteChecklistItem,
  duplicateToNextDay
} from '@/lib/db/checklist';
import { getChecklistMissionParameters } from '@/lib/db/parameters-checklist-missions';
import { SERVICES } from '@/lib/constants';

const ChecklistPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => normalizeToMidnight(new Date()));
  const [filterHotel, setFilterHotel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [checklistMissions, setChecklistMissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [duplicationInProgress, setDuplicationInProgress] = useState(false);
  const [completedPercent, setCompletedPercent] = useState<number>(0);
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load hotels on mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // If user has only one hotel, select it by default
        if (currentUser && currentUser.hotels.length === 1) {
          setFilterHotel(currentUser.hotels[0]);
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
        setError('Impossible de charger les hôtels. Veuillez réessayer plus tard.');
      }
    };
    
    loadHotels();
  }, [currentUser]);

  // Load checklist missions (parameter configuration)
  useEffect(() => {
    const loadChecklistMissions = async () => {
      try {
        const missions = await getChecklistMissionParameters();
        setChecklistMissions(missions);
      } catch (error) {
        console.error('Error loading checklist missions:', error);
      }
    };
    
    loadChecklistMissions();
  }, []);

  // Load checklist items for the selected date and hotel
  useEffect(() => {
    const loadChecklistItems = async () => {
      if (!filterHotel) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const dateStr = formatToISOLocalDate(selectedDate);
        const items = await getChecklistItems(dateStr, filterHotel);
        setChecklistItems(items);
        
        // Update completion percentage
        updateCompletionPercent(items);
      } catch (error) {
        console.error('Error loading checklist items:', error);
        setError('Impossible de charger les éléments de la checklist. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    loadChecklistItems();
  }, [selectedDate, filterHotel]);

  // Calculate completion percentage
  const updateCompletionPercent = (items) => {
    if (items.length > 0) {
      const completed = items.filter(item => item.completed).length;
      const percent = Math.round((completed / items.length) * 100);
      setCompletedPercent(percent);
    } else {
      setCompletedPercent(0);
    }
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(normalizeToMidnight(date));
  };

  // Handle item completion toggle
  const handleToggleComplete = async (itemId: string, completed: boolean) => {
    try {
      if (completed) {
        await completeChecklistItem(itemId);
      } else {
        await uncompleteChecklistItem(itemId);
      }
      
      // Update the local state
      const updatedItems = checklistItems.map(item => 
        item.id === itemId ? { ...item, completed } : item
      );
      setChecklistItems(updatedItems);
      
      // Update completion percentage
      updateCompletionPercent(updatedItems);
      
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'élément de la checklist",
        variant: "destructive",
      });
    }
  };

  // Handle complete day and duplicate to next day
  const handleCompleteDay = () => {
    if (completedPercent < 100) {
      toast({
        title: "Impossible de valider",
        description: "Toutes les tâches doivent être complétées pour valider la journée",
        variant: "destructive",
      });
      return;
    }
    
    setCompleteDialogOpen(true);
  };

  const confirmCompleteDay = async () => {
    try {
      setDuplicationInProgress(true);
      
      // Duplicate all items to next day
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      await duplicateToNextDay(filterHotel, formatToISOLocalDate(selectedDate), formatToISOLocalDate(nextDate));
      
      toast({
        title: "Journée validée",
        description: "Les tâches ont été dupliquées pour le jour suivant",
      });
      
      // Navigate to next day
      setSelectedDate(normalizeToMidnight(nextDate));
      
    } catch (error) {
      console.error('Error completing day:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider la journée",
        variant: "destructive",
      });
    } finally {
      setDuplicationInProgress(false);
      setCompleteDialogOpen(false);
    }
  };

  // Group items by service
  const groupedItems = checklistItems.reduce((groups, item) => {
    const serviceId = item.serviceId;
    if (!groups[serviceId]) {
      groups[serviceId] = [];
    }
    groups[serviceId].push(item);
    return groups;
  }, {} as Record<string, any[]>);

  // Filter services based on search query
  const filteredServiceIds = !searchQuery 
    ? Object.keys(groupedItems) 
    : Object.keys(groupedItems).filter(serviceId => 
        groupedItems[serviceId].some(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (item.description?.toLowerCase()?.includes(searchQuery.toLowerCase()))
        )
      );

  if (!filterHotel) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-lists</h1>
          <p className="text-muted-foreground">Gestion des check-lists quotidiennes par service</p>
        </div>
        
        <Alert variant="default">
          <AlertDescription>
            Veuillez sélectionner un hôtel pour afficher les check-lists.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Sélectionner un hôtel</h2>
              <Select value={filterHotel} onValueChange={setFilterHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Chargement des check-lists...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des données.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-lists</h1>
          <p className="text-muted-foreground">Gestion des check-lists quotidiennes par service</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Select value={filterHotel} onValueChange={setFilterHotel}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sélectionner un hôtel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {completedPercent === 100 && (
            <Button onClick={handleCompleteDay}>
              <Check className="mr-2 h-4 w-4" />
              Terminer la journée
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-full sm:flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher dans les check-lists..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Date navigation */}
          <ChecklistNavigation 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange}
          />
          
          {/* Main content */}
          <div className="space-y-6 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {checklistItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Aucune check-list pour cette date</h3>
                  <p className="text-muted-foreground">
                    Aucune tâche n'est définie pour cette date. Contactez votre administrateur pour 
                    configurer les check-lists pour cet hôtel.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Global completion indicator */}
                <div className="bg-white dark:bg-charcoal-900 rounded-lg border border-cream-200 dark:border-charcoal-700 shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium">Progression globale</h2>
                    <span className="font-bold">{completedPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        completedPercent === 100 
                          ? 'bg-green-500'
                          : completedPercent >= 75
                            ? 'bg-lime-500'
                            : completedPercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                      }`} 
                      style={{ width: `${completedPercent}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Checklist groups by service */}
                {filteredServiceIds.map(serviceId => (
                  <ChecklistGroup 
                    key={serviceId}
                    items={groupedItems[serviceId]} 
                    onToggleComplete={handleToggleComplete}
                    searchQuery={searchQuery}
                  />
                ))}
                
                {/* Complete day button (fixed at bottom) */}
                {completedPercent === 100 && (
                  <div className="fixed bottom-6 right-6">
                    <Button 
                      onClick={handleCompleteDay}
                      size="lg"
                      className="shadow-lg"
                    >
                      <Check className="mr-2 h-5 w-5" />
                      Terminer la journée
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Complete Day Dialog */}
      <CompleteDialog 
        isOpen={completeDialogOpen} 
        onClose={() => setCompleteDialogOpen(false)}
        onConfirm={confirmCompleteDay}
        loading={duplicationInProgress}
      />
    </div>
  );
};

export default ChecklistPage;