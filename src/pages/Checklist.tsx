import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  CheckCircle, 
  CheckCircle2,
  Circle,
  Clock, 
  Search, 
  Target,
  MapPin,
  User,
  ExternalLink,
  FileText,
  CheckSquare,
  XCircle,
  RefreshCw,
  RotateCcw,
  MessageCircle,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import CompleteDayModal from '../components/Checklist/CompleteDayModal';
import ChecklistCommentModal from '../components/Checklist/ChecklistCommentModal';
import { dailyChecklistService } from '../services/firebase/dailyChecklistService';
import { hotelsService } from '../services/firebase/hotelsService';
import { usersService } from '../services/firebase/usersService';
import { DailyChecklist } from '../types/checklist';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceProgress, ChecklistProgress } from '../types/checklist';
import { logbookServices } from '../types/logbook';

const Checklist = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // États locaux pour les filtres et l'interface utilisateur
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [isCompleteDayModalOpen, setIsCompleteDayModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedTaskForComment, setSelectedTaskForComment] = useState<DailyChecklist | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());

  // Requête pour récupérer tous les hôtels avec mise en cache
  const { data: hotelsData = [], isLoading: isLoadingHotels } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      console.log('Chargement des hôtels via React Query');
      const hotels = await hotelsService.getHotels();
      return hotels.filter(hotel => hotel.active === true || hotel.active === undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Requête pour récupérer tous les utilisateurs avec mise en cache
  const { data: usersData = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('Chargement des utilisateurs via React Query');
      return await usersService.getUsers();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Déterminer l'utilisateur actuel à partir des données utilisateurs
  const currentUserData = useMemo(() => {
    if (!currentUser || !usersData.length) return null;
    return usersData.find(
      user => user.id === currentUser.uid || user.email === currentUser.email
    ) || null;
  }, [currentUser, usersData]);

  // Filtrer les hôtels accessibles en fonction du rôle de l'utilisateur
  const accessibleHotels = useMemo(() => {
    if (!currentUserData || !hotelsData.length) return hotelsData;
    
    // Si l'utilisateur est admin système, il a accès à tous les hôtels
    if (currentUserData.role === 'system_admin') {
      return hotelsData;
    }
    
    // Sinon, filtrer les hôtels auxquels l'utilisateur a accès
    if (Array.isArray(currentUserData.hotels) && currentUserData.hotels.length > 0) {
      return hotelsData.filter(hotel => 
        currentUserData.hotels.includes(hotel.id)
      );
    }
    
    return [];
  }, [hotelsData, currentUserData]);

  // Auto-sélection du premier hôtel si aucun n'est sélectionné
  useEffect(() => {
    if (selectedHotel === 'all' && accessibleHotels.length > 0) {
      setSelectedHotel(accessibleHotels[0].id);
    }
  }, [accessibleHotels, selectedHotel]);

  // Initialisation des tâches quotidiennes pour la date et l'hôtel sélectionnés
  const { isLoading: isInitializing } = useQuery({
    queryKey: ['initializeTasks', selectedDate.toISOString().split('T')[0], selectedHotel],
    queryFn: async () => {
      if (!selectedHotel || selectedHotel === 'all') return null;
      console.log('Initialisation des tâches pour la date:', selectedDate, 'et l\'hôtel:', selectedHotel);
      await dailyChecklistService.initializeDailyTasks(selectedDate, selectedHotel);
      return true;
    },
    enabled: !!selectedHotel && selectedHotel !== 'all',
    staleTime: 30 * 1000, // 30 secondes
  });

  // Récupération des tâches quotidiennes avec mise en cache
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['dailyChecklists', selectedDate.toISOString().split('T')[0], selectedHotel],
    queryFn: async () => {
      if (!selectedHotel || selectedHotel === 'all') return [];
      console.log('Chargement des tâches pour la date:', selectedDate, 'et l\'hôtel:', selectedHotel);
      return await dailyChecklistService.getDailyChecklists(selectedDate, selectedHotel);
    },
    enabled: !!selectedHotel && selectedHotel !== 'all' && !isInitializing,
    staleTime: 30 * 1000, // 30 secondes
  });

  // Vérification si la journée est complétée avec mise en cache
  const { data: isDayCompleted = false } = useQuery({
    queryKey: ['isDayCompleted', selectedDate.toISOString().split('T')[0], selectedHotel],
    queryFn: async () => {
      if (!selectedHotel || selectedHotel === 'all') return false;
      return await dailyChecklistService.isDayCompleted(selectedDate, selectedHotel);
    },
    enabled: !!selectedHotel && selectedHotel !== 'all',
    staleTime: 30 * 1000, // 30 secondes
  });

  // Vérification si on peut passer au jour suivant avec mise en cache
  const { data: canProceedToNextDay = false } = useQuery({
    queryKey: ['canProceedToNextDay', selectedDate.toISOString().split('T')[0], selectedHotel],
    queryFn: async () => {
      if (!selectedHotel || selectedHotel === 'all') return false;
      return await dailyChecklistService.canProceedToNextDay(selectedDate, selectedHotel);
    },
    enabled: !!selectedHotel && selectedHotel !== 'all',
    staleTime: 30 * 1000, // 30 secondes
  });

  // Filtrage des tâches en fonction des critères sélectionnés (service, état de complétion, recherche)
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filtre par service
    if (selectedService !== 'all') {
      filtered = filtered.filter(task => task.service === selectedService);
    }

    // Filtre par état de completion
    if (completionFilter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    } else if (completionFilter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [tasks, selectedService, completionFilter, searchTerm]);

  // Calcul du progrès quotidien et des groupes de services
  const { dayProgress, serviceGroups } = useMemo(() => {
    // Calcul du progrès global de la journée
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: DailyChecklist) => task.completed).length;
    const dayPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const progress: ChecklistProgress = {
      total: totalTasks,
      completed: completedTasks,
      percentage: dayPercentage,
      canProceedToNextDay: canProceedToNextDay && totalTasks > 0 && completedTasks === totalTasks && !isDayCompleted
    };

    // Grouper par service avec calcul de progression (basé sur les tâches filtrées pour l'affichage)
    const groups: ServiceProgress[] = logbookServices.map(service => {
      const serviceTasks = filteredTasks.filter((task: DailyChecklist) => task.service === service.key);
      const serviceTotal = serviceTasks.length;
      const serviceCompleted = serviceTasks.filter((task: DailyChecklist) => task.completed).length;
      const servicePercentage = serviceTotal > 0 ? Math.round((serviceCompleted / serviceTotal) * 100) : 0;
      
      return {
        service: service.key,
        label: service.label,
        icon: service.icon,
        color: service.color,
        total: serviceTotal,
        completed: serviceCompleted,
        percentage: servicePercentage,
        tasks: serviceTasks
      };
    }).filter((group: ServiceProgress) => group.total > 0); // Ne garder que les services qui ont des tâches

    return { dayProgress: progress, serviceGroups: groups };
  }, [tasks, filteredTasks, isDayCompleted, canProceedToNextDay]);

  // Déployer automatiquement les services avec des tâches incomplètes
  useEffect(() => {
    const incompleteServices = serviceGroups
      .filter((group: ServiceProgress) => group.percentage < 100)
      .map((group: ServiceProgress) => group.service);
    setExpandedServices(new Set(incompleteServices));
  }, [serviceGroups]);

  // État de chargement global
  const isLoadingGlobal = isLoadingHotels || isLoadingUsers || tasksLoading || isInitializing;

  // Mutation pour basculer l'état de complétion d'une tâche
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      console.log('Basculement de l\'état de la tâche:', id, 'vers:', completed);
      return await dailyChecklistService.toggleTaskCompletion(
        id, 
        completed, 
        currentUserData?.id || currentUser?.uid || 'unknown'
      );
    },
    onSuccess: () => {
      // Invalider et refetch les données des tâches
      queryClient.invalidateQueries({ queryKey: ['dailyChecklists'] });
      queryClient.invalidateQueries({ queryKey: ['isDayCompleted'] });
      queryClient.invalidateQueries({ queryKey: ['canProceedToNextDay'] });
    },
    onError: (error) => {
      console.error('Error toggling task completion:', error);
    }
  });

  // Mutation pour ajouter un commentaire
  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      console.log('Ajout d\'un commentaire pour la tâche:', taskId, 'commentaire:', comment);
      return await dailyChecklistService.addCommentToTask(taskId, {
        content: comment,
        authorId: currentUserData?.id || currentUser?.uid || 'unknown',
        authorName: currentUserData?.name || currentUser?.email?.split('@')[0] || 'Utilisateur',
        createdAt: new Date()
      });
    },
    onSuccess: () => {
      // Invalider et refetch les données des tâches
      queryClient.invalidateQueries({ queryKey: ['dailyChecklists'] });
      // Fermer la modal
      setIsCommentModalOpen(false);
      setSelectedTaskForComment(null);
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
    }
  });

  // Mutation pour compléter la journée
  const completeDayMutation = useMutation({
    mutationFn: async () => {
      console.log('Complétion de la journée pour la date:', selectedDate, 'et l\'hôtel:', selectedHotel);
      return await dailyChecklistService.completeDayAndGenerateNext(
        selectedDate,
        selectedHotel,
        currentUserData?.id || currentUser?.uid || 'unknown'
      );
    },
    onSuccess: () => {
      // Invalider et refetch les données
      queryClient.invalidateQueries({ queryKey: ['dailyChecklists'] });
      queryClient.invalidateQueries({ queryKey: ['isDayCompleted'] });
      queryClient.invalidateQueries({ queryKey: ['canProceedToNextDay'] });
      // Passer au jour suivant automatiquement
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
      // Fermer la modal
      setIsCompleteDayModalOpen(false);
    },
    onError: (error) => {
      console.error('Error completing day:', error);
    }
  });

  // Fonctions de gestion des événements
  const toggleTaskCompletion = (id: string, completed: boolean) => {
    toggleTaskMutation.mutate({ id, completed });
  };

  const handleAddComment = (taskId: string, comment: string) => {
    addCommentMutation.mutate({ taskId, comment });
  };

  const handleCompleteDay = () => {
    completeDayMutation.mutate();
  };

  // Fonction pour annuler la complétion d'une journée (réservée aux administrateurs)
  const handleCancelDayCompletion = async () => {
    try {
      await dailyChecklistService.cancelDayCompletion(
        selectedDate,
        selectedHotel
      );
      
      // Recharger les tâches pour mettre à jour l'affichage
      queryClient.invalidateQueries({ queryKey: ['dailyChecklists'] });
    } catch (error) {
      console.error('Error cancelling day completion:', error);
    }
  };

  const toggleServiceExpansion = (serviceKey: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceKey)) {
      newExpanded.delete(serviceKey);
    } else {
      newExpanded.add(serviceKey);
    }
    setExpandedServices(newExpanded);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const resetFilters = () => {
    setSelectedService('all');
    setCompletionFilter('all');
    setSearchTerm('');
  };
  
  const refreshTasks = async () => {
    queryClient.invalidateQueries({ queryKey: ['dailyTasks'] });
  };

  const toggleHistoryExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedHistories);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedHistories(newExpanded);
  };

  const getServiceInfo = (serviceKey: string) => {
    return logbookServices.find(s => s.key === serviceKey) || {
      key: serviceKey,
      label: serviceKey,
      icon: '📋',
      color: '#6B7280'
    };
  };

  const getHotelName = (hotelId: string) => {
    const hotel = hotelsData.find((h: any) => h.id === hotelId);
    return hotel?.name || 'Hôtel inconnu';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-lime-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getUserName = (userId: string) => {
    const user = usersData.find((u: any) => u.id === userId);
    return user?.name || 'Utilisateur inconnu';
  };

  // Fonction utilitaire pour convertir les timestamps Firestore en Date
  const convertFirestoreTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const isYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return selectedDate.toDateString() === yesterday.toDateString();
  };

  // Afficher les hôtels disponibles dans la console pour débogage
  console.log('Hôtels disponibles pour le sélecteur:', hotelsData);

  const hasActiveFilters = selectedService !== 'all' || completionFilter !== 'all' || searchTerm !== '';

  return (
    <Layout title="Check-lists" subtitle="Gestion des check-lists quotidiennes par service">
      <div className="p-6">
        {/* Header avec tous les filtres intégrés */}
        <div className="bg-white border border-warm-200 rounded-lg p-4 mb-6">
          {/* Première ligne : Recherche et sélection d'hôtel */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher dans les check-lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-80"
                />
              </div>

              {/* Sélecteur d'hôtel */}
              <div className="relative">
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 bg-white min-w-[200px]"
                >
                  <option value="all">Sélectionner un hôtel</option>
                  {accessibleHotels && accessibleHotels.length > 0 ? (
                    accessibleHotels.map(hotel => (
                      <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun hôtel disponible</option>
                  )}
                </select>
                <MapPin className="w-4 h-4 text-warm-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Bouton Aujourd'hui si pas aujourd'hui */}
              {!isToday() && (
                <button
                  onClick={goToToday}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-1 inline" />
                  Aujourd'hui
                </button>
              )}

              {/* Bouton Terminer la journée */}
              {dayProgress.canProceedToNextDay && !isDayCompleted && (
                <button
                  onClick={() => setIsCompleteDayModalOpen(true)}
                  className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-2 inline" />
                  Terminer la journée
                </button>
              )}
              
              {/* Bouton Annuler la complétion (visible uniquement pour les administrateurs) */}
              {isDayCompleted && currentUserData && (currentUserData.role === 'system_admin' || currentUserData.role === 'hotel_admin') && (
                <button
                  onClick={handleCancelDayCompletion}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  <XCircle className="w-4 h-4 mr-2 inline" />
                  Annuler la complétion
                </button>
              )}
            </div>
          </div>

          {/* Deuxième ligne : Filtres et navigation de date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Filtre par service */}
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 text-sm min-w-[160px]"
                >
                  <option value="all">Tous les services</option>
                  {logbookServices.map(service => (
                    <option key={service.key} value={service.key}>
                      {service.icon} {service.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par état */}
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">État</label>
                <select
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value as 'all' | 'completed' | 'pending')}
                  className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 text-sm min-w-[140px]"
                >
                  <option value="all">Toutes les tâches</option>
                  <option value="pending">Tâches à faire</option>
                  <option value="completed">Tâches terminées</option>
                </select>
              </div>

              {/* Indicateur de résultats */}
              <div className="text-sm text-warm-600 bg-warm-50 px-3 py-2 rounded-lg">
                <span className="font-medium">{tasks.length}</span> tâche{tasks.length > 1 ? 's' : ''} 
                {hasActiveFilters && <span className="text-warm-500"> (filtrée{tasks.length > 1 ? 's' : ''})</span>}
              </div>
            </div>

            {/* Navigation de date et actions */}
            <div className="flex items-center space-x-3">
              {/* Bouton Rafraîchir */}
              <button
                onClick={refreshTasks}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                title="Rafraîchir les tâches (pour voir les nouvelles missions)"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Rafraîchir
              </button>
              
              {/* Navigation de date */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1.5 hover:bg-warm-100 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4 text-warm-400" />
                </button>
                <div className="text-center px-2">
                  <div className="text-sm font-semibold text-warm-900">
                    {selectedDate.toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short'
                    })}
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-xs">
                    {isToday() && (
                      <span className="text-blue-600 font-medium">AUJOURD'HUI</span>
                    )}
                    {isYesterday() && (
                      <span className="text-orange-600 font-medium">HIER</span>
                    )}
                    {isDayCompleted && (
                      <span className="text-green-600 font-medium">✓ TERMINÉE</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-1.5 hover:bg-warm-100 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 text-warm-400" />
                </button>
              </div>
              
              {/* Bouton de réinitialisation des filtres */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-warm-600 hover:text-warm-800 hover:bg-warm-50 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>
        </div>



        {/* Progression globale */}
        {dayProgress.total > 0 && (
          <div className="bg-white rounded-lg border border-warm-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-warm-600 mr-2" />
                <span className="text-sm font-medium text-warm-900">
                  Progression globale
                </span>
              </div>
              <span className="text-sm font-semibold text-warm-700">
                {dayProgress.completed}/{dayProgress.total} ({dayProgress.percentage}%)
              </span>
            </div>
            <div className="w-full bg-warm-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(dayProgress.percentage)}`}
                style={{ width: `${dayProgress.percentage}%` }}
              ></div>
            </div>
            
            {dayProgress.canProceedToNextDay && (
              <div className="mt-2 text-center">
                <span className="text-xs text-green-600 font-medium">
                  ✓ Toutes les tâches sont terminées - Vous pouvez passer au jour suivant
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tasks Content */}
        <div className="space-y-4">
          {isLoadingGlobal ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Chargement...
            </div>
          ) : selectedHotel === 'all' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-warm-400" />
              </div>
              <h3 className="text-lg font-medium text-warm-900 mb-2">Sélectionnez un hôtel</h3>
              <p className="text-warm-600">Choisissez un hôtel pour voir ses check-lists</p>
            </div>
          ) : serviceGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-warm-400" />
              </div>
              <h3 className="text-lg font-medium text-warm-900 mb-2">
                {hasActiveFilters ? 'Aucune tâche ne correspond aux filtres' : 'Aucune tâche pour cette date'}
              </h3>
              <p className="text-warm-600">
                {hasActiveFilters 
                  ? 'Essayez de modifier vos critères de recherche' 
                  : 'Les tâches seront générées automatiquement selon les missions configurées'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            serviceGroups.map((group) => {
              const serviceInfo = getServiceInfo(group.service);
              
              return (
                <div key={group.service} className="bg-white rounded-lg shadow-sm border border-warm-200">
                  {/* Service Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-warm-50 transition-colors border-b border-warm-100"
                    onClick={() => toggleServiceExpansion(group.service)}
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-xl mr-3">{serviceInfo.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-warm-900">{serviceInfo.label}</h3>
                            <p className="text-sm text-warm-600">
                              {group.completed}/{group.total} tâche{group.total > 1 ? 's' : ''} terminée{group.completed > 1 ? 's' : ''}
                              {group.percentage === 100 && (
                                <span className="ml-2 text-green-600 font-medium">✓ Terminé</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-warm-700">{group.total}</span>
                            <span className={`text-sm font-medium ${group.percentage === 100 ? 'text-green-600' : 'text-warm-600'}`}>
                              {group.percentage}%
                            </span>
                            {expandedServices.has(group.service) ? (
                              <ChevronUp className="w-5 h-5 text-warm-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-warm-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Barre de progression du service */}
                        <div className="mt-2">
                          <div className="w-full bg-warm-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(group.percentage)}`}
                              style={{ width: `${group.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Tasks */}
                  {expandedServices.has(group.service) && (
                    <div>
                      {group.tasks.length === 0 ? (
                        <div className="p-4 text-center text-warm-500">
                          <p className="text-sm">Aucune tâche dans cette catégorie.</p>
                        </div>
                      ) : (
                        group.tasks.map((task, index) => (
                          <div
                            key={task.id}
                            className={`p-4 ${
                              index !== group.tasks.length - 1 ? 'border-b border-warm-100' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <button
                                  onClick={() => toggleTaskCompletion(task.id, !task.completed)}
                                  className={`mt-1 p-1 rounded-full transition-colors ${
                                    task.completed 
                                      ? 'text-green-500 hover:text-green-600' 
                                      : 'text-warm-300 hover:text-green-500'
                                  }`}
                                >
                                  {task.completed ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>
                                
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className={`font-medium text-warm-900 ${
                                      task.completed ? 'line-through text-warm-500' : ''
                                    }`}>
                                      {task.title}
                                      {task.completed && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                          ✓ Terminé
                                        </span>
                                      )}
                                    </h4>
                                    
                                    {/* History Button */}
                                    {task.history && task.history.length > 0 && (
                                      <button
                                        onClick={() => toggleHistoryExpansion(task.id)}
                                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 ml-2"
                                      >
                                        <History className="w-3 h-3" />
                                        <span className="hidden sm:inline">({task.history.length})</span>
                                        {expandedHistories.has(task.id) ? (
                                          <ChevronUp className="w-3 h-3" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  
                                  {task.description && (
                                    <p className={`text-sm text-warm-600 mb-2 ${
                                      task.completed ? 'line-through text-warm-400' : ''
                                    }`}>
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex items-center text-xs text-warm-500 space-x-3 mb-2">
                                    <div className="flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      <span>{getHotelName(task.hotelId)}</span>
                                    </div>
                                    
                                    {task.completed && task.completedBy && (
                                      <div className="flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        <span>Par {getUserName(task.completedBy)}</span>
                                      </div>
                                    )}
                                    
                                    {task.completed && task.completedAt && (
                                      <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span>{convertFirestoreTimestamp(task.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Comments */}
                                  {task.comments && task.comments.length > 0 && (
                                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                                      <h4 className="text-xs font-medium text-blue-800 mb-2">
                                        Commentaires ({task.comments.length})
                                      </h4>
                                      <div className="space-y-2">
                                        {task.comments.map((comment) => (
                                          <div key={comment.id} className="text-xs">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium text-blue-900">{comment.authorName}</span>
                                              <span className="text-blue-600">{convertFirestoreTimestamp(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <p className="text-blue-700 mt-1">{comment.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* History Content */}
                                  {task.history && task.history.length > 0 && expandedHistories.has(task.id) && (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-2 animate-in slide-in-from-top-2 duration-200">
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {task.history
                                          .sort((a, b) => convertFirestoreTimestamp(b.timestamp).getTime() - convertFirestoreTimestamp(a.timestamp).getTime())
                                          .slice(0, 5)
                                          .map((entry) => (
                                          <div key={entry.id} className="text-xs border-l-2 border-gray-300 pl-2">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium text-gray-900">{entry.userName}</span>
                                              <span className="text-gray-600">
                                                {convertFirestoreTimestamp(entry.timestamp).toLocaleDateString('fr-FR')} à {convertFirestoreTimestamp(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                            <div className="flex items-center mt-1">
                                              {entry.action === 'completed' && <CheckCircle className="w-3 h-3 mr-1 text-green-600" />}
                                              {entry.action === 'uncompleted' && <XCircle className="w-3 h-3 mr-1 text-red-600" />}
                                              {entry.action === 'commented' && <MessageCircle className="w-3 h-3 mr-1 text-blue-600" />}
                                              {entry.action === 'updated' && <RotateCcw className="w-3 h-3 mr-1 text-orange-600" />}
                                              <p className="text-gray-700">{entry.description}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center space-x-4">
                                    <button
                                      onClick={() => {
                                        setSelectedTaskForComment(task);
                                        setIsCommentModalOpen(true);
                                      }}
                                      className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <MessageCircle className="w-3 h-3 mr-1" />
                                      Commenter
                                    </button>

                                    {task.completed && (
                                      <button
                                        onClick={() => toggleTaskCompletion(task.id, false)}
                                        className="flex items-center text-xs text-orange-600 hover:text-orange-800"
                                      >
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Annuler la complétion
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-3">
                                {task.imageUrl && (
                                  <a
                                    href={task.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-blue-500 hover:text-blue-700"
                                    title="Voir l'image"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                
                                {task.pdfUrl && (
                                  <a
                                    href={task.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-red-500 hover:text-red-700"
                                    title={`Voir ${task.pdfFileName || 'le PDF'}`}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <CompleteDayModal
        isOpen={isCompleteDayModalOpen}
        onClose={() => setIsCompleteDayModalOpen(false)}
        onConfirm={handleCompleteDay}
        date={selectedDate}
        hotelName={getHotelName(selectedHotel)}
        allTasksCompleted={dayProgress.canProceedToNextDay}
      />

      <ChecklistCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmit={(comment: string) => {
          if (selectedTaskForComment) {
            handleAddComment(selectedTaskForComment.id, comment);
          }
        }}
        taskTitle={selectedTaskForComment?.title || ''}
      />
    </Layout>
  );
};

export default Checklist;