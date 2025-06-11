import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  PlusCircle,
  Calendar, 
  AlertTriangle,
  Building,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import LogbookDateNavigation from './LogbookDateNavigation';
import LogbookCalendar from './LogbookCalendar';
import LogbookEntry from './LogbookEntry';
import LogbookEntryForm from './LogbookEntryForm';
import LogbookReminders from './LogbookReminders';
import { useLogbookEntries, useMarkLogbookEntryAsRead, useAddCommentToLogbookEntry, useMarkLogbookEntryAsCompleted, useUnmarkLogbookEntryAsCompleted, deleteLogbookEntry } from '@/hooks/useLogbook';
import { getHotels } from '@/lib/db/hotels';
import * as firestore from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { formatToISOLocalDate, normalizeToMidnight, parseISOLocalDate, isDateInRange } from '@/lib/date-utils';

interface ConsignesTabProps {
  hotelId?: string;
  services: any[];
}

const ConsignesTab: React.FC<ConsignesTabProps> = ({ hotelId, services }) => {
  // États locaux
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Initialiser la date avec l'heure à minuit
    const date = normalizeToMidnight(new Date());
    return date;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterHotel, setFilterHotel] = useState<string>(hotelId || 'all');
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [localEntries, setLocalEntries] = useState<any[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const { toast } = useToast();
  
  const currentUser = getCurrentUser();
  
  // Charger les hôtels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelsData = await getHotels();
        setHotels(hotelsData);
      } catch (error) {
        console.error('Error loading hotels:', error);
      }
    };
    
    loadHotels();
  }, []);
  
  // Gérer les changements de date sélectionnée
  const handleDateChange = (date: Date) => {
    const normalizedDate = normalizeToMidnight(date);
    setSelectedDate(normalizedDate);
  };
  
  // Récupérer les entrées du cahier de consignes directement de Firebase pour s'assurer d'avoir les données les plus récentes
  useEffect(() => {
    setIsLoadingLocal(true);
    
    // Format de date pour la requête (YYYY-MM-DD)
    const dateStr = formatToISOLocalDate(selectedDate);
    console.log(`Fetching entries for date: ${dateStr}, hotel: ${filterHotel}`);
    
    // Créer la requête Firebase - RECHERCHE UNIQUEMENT LES ENTRÉES POUR LA DATE SPÉCIFIQUE
    let q;
    
    if (filterHotel !== 'all') {
      q = firestore.query(
        firestore.collection(db, 'logbook_entries'),
        firestore.where('hotelId', '==', filterHotel),
        firestore.where('date', '==', dateStr) // Filtre explicite sur la date exacte
      );
    } else {
      // Si aucun hôtel spécifique n'est sélectionné, filtrer par les hôtels accessibles à l'utilisateur
      if (currentUser && currentUser.role !== 'admin' && currentUser.hotels.length > 0) {
        // Pour les utilisateurs standard, limiter aux hôtels autorisés
        q = firestore.query(
          firestore.collection(db, 'logbook_entries'),
          firestore.where('hotelId', 'in', currentUser.hotels.slice(0, 10)), // Firebase limite 'in' à 10 valeurs max
          firestore.where('date', '==', dateStr) // Filtre explicite sur la date exacte
        );
      } else {
        // Pour les admins ou si aucune restriction
        q = firestore.query(
          firestore.collection(db, 'logbook_entries'),
          firestore.where('date', '==', dateStr) // Filtre explicite sur la date exacte
        );
      }
    }
    
    // Array pour tracker les ID des entrées déjà traitées
    // afin d'éviter les doublons
    const processedEntryIds = new Set<string>();

    // S'abonner aux changements en temps réel
    const unsubscribe = firestore.onSnapshot(q, 
      (snapshot) => {
        const entries = snapshot.docs.map(doc => {
          // Marquer cet ID comme traité
          processedEntryIds.add(doc.id);
          return {
            id: doc.id,
            ...doc.data()
          };
        });
        
        // Pour les entrées avec plage de dates, nous devons faire une requête séparée
        // et filtrer côté client
        const getRangeEntries = async () => {
          try {
            const rangeQuery = firestore.query(
              firestore.collection(db, 'logbook_entries'),
              firestore.where('displayRange', '==', true)
            );
            
            const rangeSnapshot = await firestore.getDocs(rangeQuery);
            const rangeEntries = rangeSnapshot.docs
              .map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data
                };
              })
              .filter(entry => {
                // Éviter les doublons - ignorer les entrées déjà présentes
                if (processedEntryIds.has(entry.id)) {
                  return false;
                }
                
                if (!entry.date || !entry.endDate) return false;
                
                // Vérifier si la date sélectionnée est dans la plage
                const startDate = parseISOLocalDate(entry.date);
                const endDate = parseISOLocalDate(entry.endDate);
                
                return isDateInRange(selectedDate, startDate, endDate);
              });
            
            // Fusionner les entrées avec déduplication
            const combinedEntries = [...entries, ...rangeEntries];
            console.log(`Loaded ${combinedEntries.length} entries for date ${dateStr}`);
            setLocalEntries(combinedEntries);
            setIsLoadingLocal(false);
          } catch (error) {
            console.error("Error loading range entries:", error);
            setIsLoadingLocal(false);
          }
        };
        
        getRangeEntries();
      },
      (error) => {
        console.error("Error getting real-time entries:", error);
        setIsLoadingLocal(false);
      }
    );

    // Nettoyer l'abonnement à l'unmount
    return () => unsubscribe();
  }, [selectedDate, filterHotel, currentUser]);
  
  // Récupérer les entrées du cahier de consignes via React Query (pour compatibilité)
  const { 
    data: entries = [], 
    isLoading: isLoadingQuery, 
    error 
  } = useLogbookEntries(selectedDate, filterHotel !== 'all' ? filterHotel : undefined);
  
  // Utiliser les entrées locales pour s'assurer d'avoir les données les plus récentes
  const allEntries = localEntries.length > 0 ? localEntries : entries;
  const isLoading = isLoadingLocal || isLoadingQuery;
  
  // Mutations pour les actions sur les entrées
  const markAsReadMutation = useMarkLogbookEntryAsRead();
  const addCommentMutation = useAddCommentToLogbookEntry();
  const markAsCompletedMutation = useMarkLogbookEntryAsCompleted();
  const unmarkAsCompletedMutation = useUnmarkLogbookEntryAsCompleted();
  
  // Filtrer les entrées en fonction de la recherche et du filtre de service
  const filteredEntries = allEntries.filter(entry => {
    // Filtrer par service
    if (filterService !== 'all' && entry.serviceId !== filterService) {
      return false;
    }
    
    // Recherche textuelle
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return entry.content.toLowerCase().includes(query) || 
             entry.serviceName?.toLowerCase().includes(query) || false;
    }
    
    return true;
  }).sort((a, b) => {
    // D'abord par importance (décroissante)
    if (a.importance !== b.importance) {
      return b.importance - a.importance;
    }
    
    // Ensuite par date et heure (plus récent en premier)
    // Utiliser les chaînes directement pour éviter les problèmes de fuseau horaire
    const dateTimeA = `${a.date}T${a.time || '00:00'}`;
    const dateTimeB = `${b.date}T${b.time || '00:00'}`;
    
    return dateTimeB.localeCompare(dateTimeA);
  });
  
  console.log(`Filtered entries for ${selectedDate.toISOString().split('T')[0]}: ${filteredEntries.length}`);
  
  // Grouper les entrées par service pour un affichage organisé
  const groupedEntries: Record<string, any[]> = {};
  filteredEntries.forEach(entry => {
    if (!groupedEntries[entry.serviceId]) {
      groupedEntries[entry.serviceId] = [];
    }
    groupedEntries[entry.serviceId].push(entry);
  });
  
  // Gérer les actions sur les entrées
  const handleEditEntry = (entryId: string) => {
    const entry = allEntries.find(e => e.id === entryId);
    if (entry) {
      setSelectedEntry(entry);
      setEditEntryDialogOpen(true);
    }
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    try {
      console.log(`Deleting entry with ID: ${entryId}`);
      await deleteLogbookEntry(entryId);
      toast({
        title: "Consigne supprimée",
        description: "La consigne a été supprimée avec succès",
      });
      
      // Mise à jour automatique via onSnapshot, mais on peut forcer la mise à jour
      setLocalEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la consigne",
        variant: "destructive",
      });
    }
  };
  
  const handleMarkAsRead = (entryId: string) => {
    markAsReadMutation.mutate(entryId);
  };
  
  const handleAddComment = (entryId: string, comment: string) => {
    addCommentMutation.mutate({ id: entryId, comment });
  };
  
  const handleMarkAsCompleted = (entryId: string) => {
    markAsCompletedMutation.mutate(entryId);
  };

  const handleUnmarkAsCompleted = (entryId: string) => {
    unmarkAsCompletedMutation.mutate(entryId);
  };
  
  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 gap-2">
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
        
        {/* Filtre Hôtels */}
        <Select 
          value={filterHotel}
          onValueChange={setFilterHotel}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Tous les hôtels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les hôtels</SelectItem>
            {hotels.map(hotel => (
              <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Filtre Services */}
        <Select 
          value={filterService}
          onValueChange={setFilterService}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {services.map(service => (
              <SelectItem key={service.id} value={service.id}>
                <span className="inline-block mr-2">{service.icon}</span>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={() => setNewEntryDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle consigne
        </Button>
      </div>
      
      {/* Navigation de date et contenu principal */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-4">
          <LogbookDateNavigation 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange}
          />

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
                <p>Chargement des consignes...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center text-red-500">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p>Erreur de chargement des consignes</p>
              </CardContent>
            </Card>
          ) : filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Aucune consigne pour cette date</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setNewEntryDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter une consigne
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Afficher les services avec la même présentation que l'onglet Consignes
            services.map(service => {
              // Ne pas afficher les services qui n'ont pas de tâches
              if (!groupedEntries[service.id] || groupedEntries[service.id].length === 0) {
                return null;
              }

              const serviceEntries = groupedEntries[service.id];

              return (
                <div key={service.id} className="mb-4">
                  {/* En-tête du service (comme dans l'image) */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-t-md">
                    <div className="flex items-center">
                      <div className="text-2xl mr-2">{service.icon}</div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      {serviceEntries.length}
                    </div>
                  </div>

                  {/* Liste des tâches du service */}
                  <div className="space-y-2 mt-2">
                    {serviceEntries.map(entry => (
                      <LogbookEntry
                        key={entry.id} 
                        entry={{
                          ...entry,
                          serviceIcon: service.icon,
                          serviceName: service.name
                        }}
                        onEdit={handleEditEntry}
                        onDelete={handleDeleteEntry}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAsCompleted={handleMarkAsCompleted}
                        onUnmarkAsCompleted={handleUnmarkAsCompleted}
                        onAddComment={handleAddComment}
                        selectedDate={selectedDate}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="w-full md:w-64 space-y-4">
          <LogbookCalendar 
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          
          <LogbookReminders 
            selectedDate={selectedDate}
          />
        </div>
      </div>
      
      {/* Formulaire d'ajout/édition de consigne */}
      <LogbookEntryForm 
        isOpen={newEntryDialogOpen}
        onClose={() => setNewEntryDialogOpen(false)}
        initialData={{
          date: formatToISOLocalDate(selectedDate),
          serviceId: filterService !== 'all' ? filterService : '',
          hotelId: filterHotel !== 'all' ? filterHotel : ''
        }}
        isEditing={false}
      />
      
      {selectedEntry && (
        <LogbookEntryForm 
          isOpen={editEntryDialogOpen}
          onClose={() => {
            setEditEntryDialogOpen(false);
            setSelectedEntry(null);
          }}
          initialData={selectedEntry}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default ConsignesTab;