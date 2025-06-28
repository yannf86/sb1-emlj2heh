import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import CompleteDayModal from '../components/Checklist/CompleteDayModal';
import ChecklistCommentModal from '../components/Checklist/ChecklistCommentModal';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Target,
  ExternalLink,
  FileText,
  CheckCircle,
  Calendar,
  Hotel,
  RotateCcw,
  MessageCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { DailyChecklist, ServiceProgress, ChecklistProgress } from '../types/checklist';
import { Hotel as HotelType } from '../types/parameters';
import { User as UserType } from '../types/users';
import { dailyChecklistService } from '../services/firebase/dailyChecklistService';
import { hotelsService } from '../services/firebase/hotelsService';
import { usersService } from '../services/firebase/usersService';
import { useAuth } from '../contexts/AuthContext';
import { logbookServices } from '../types/logbook';

export default function Checklist() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all'); // all, completed, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState<DailyChecklist[]>([]);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);
  const [serviceGroups, setServiceGroups] = useState<ServiceProgress[]>([]);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dayProgress, setDayProgress] = useState<ChecklistProgress>({
    total: 0,
    completed: 0,
    percentage: 0,
    canProceedToNextDay: false
  });
  const [isCompleteDayModalOpen, setIsCompleteDayModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedTaskForComment, setSelectedTaskForComment] = useState<DailyChecklist | null>(null);
  const [isDayCompleted, setIsDayCompleted] = useState(false);

  // Référence pour suivre si le composant est monté
  const isMounted = React.useRef(true);
  
  // État pour suivre si c'est le premier chargement
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Définir le composant comme monté
    isMounted.current = true;
    
    // Charger les données initiales
    loadData();
    
    // Nettoyer lors du démontage
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Ne pas charger les tâches lors du premier rendu, car loadData le fera déjà
    if (!isInitialLoad) {
      loadTodaysTasks();
    }
  }, [selectedDate, selectedHotel, selectedService, completionFilter, searchTerm, isInitialLoad]);

  const loadData = async () => {
    try {
      if (!isMounted.current) return;
      setLoading(true);

      // Charger les hôtels
      console.log('Début du chargement des hôtels...');
      const hotelsData = await hotelsService.getHotels();
      console.log('Hôtels récupérés de la base de données:', hotelsData);
      const activeHotels = hotelsData.filter(hotel => hotel.active === true || hotel.active === undefined);
      console.log('Hôtels actifs filtrés:', activeHotels);
      
      if (!isMounted.current) return;
      setHotels(activeHotels);

      // Charger les utilisateurs
      const usersData = await usersService.getUsers();
      if (!isMounted.current) return;
      setUsers(usersData);

      // Récupérer les données de l'utilisateur actuel
      if (currentUser) {
        console.log('Utilisateur connecté:', currentUser);
        // Essayer de trouver l'utilisateur par uid ou par email
        const userData = usersData.find(
          user => user.id === currentUser.uid || 
                 user.email === currentUser.email
        );
        
        console.log('Données utilisateur trouvées:', userData);
        
        if (!isMounted.current) return;
        setCurrentUserData(userData || null);

        // Si l'utilisateur n'est pas admin système, filtrer les hôtels accessibles
        if (userData) {
          console.log('Role utilisateur:', userData.role);
          console.log('Hôtels assignés:', userData.hotels);
          
          // Vérifier si l'utilisateur a accès à des hôtels
          if (userData.role !== 'system_admin' && Array.isArray(userData.hotels) && userData.hotels.length > 0) {
            console.log('Filtrage des hôtels pour utilisateur non-admin');
            const accessibleHotels = activeHotels.filter(hotel => 
              userData.hotels.includes(hotel.id)
            );
            console.log('Hôtels accessibles:', accessibleHotels);
            
            if (!isMounted.current) return;
            setHotels(accessibleHotels);
            
            // Sélectionner le premier hôtel par défaut si aucun n'est sélectionné
            if (selectedHotel === 'all' && accessibleHotels.length > 0) {
              if (!isMounted.current) return;
              setSelectedHotel(accessibleHotels[0].id);
            }
          } else if (userData.role === 'system_admin') {
            console.log('Admin système - accès à tous les hôtels');
            // Pour les admins système, sélectionner le premier hôtel par défaut
            if (selectedHotel === 'all' && activeHotels.length > 0) {
              if (!isMounted.current) return;
              setSelectedHotel(activeHotels[0].id);
            }
          }
        }
      }

      // Charger les tâches pour aujourd'hui
      await loadTodaysTasks();
      
      // Marquer que le chargement initial est terminé
      if (isMounted.current) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        console.log('Chargement terminé');
      }
    }
  };

  const loadTodaysTasks = async () => {
    if (!isMounted.current) return;
    if (!selectedHotel || selectedHotel === 'all') return;
    
    try {
      setLoading(true);
      console.log('Chargement des tâches pour la date:', selectedDate, 'et l\'hôtel:', selectedHotel);
      // Initialiser les tâches pour cette date si elles n'existent pas
      // ou ajouter les nouvelles missions qui n'existent pas encore
      await dailyChecklistService.initializeDailyTasks(selectedDate, selectedHotel);
      
      // Charger les tâches
      const tasksForDate = await dailyChecklistService.getDailyChecklists(selectedDate, selectedHotel);
      console.log('Tâches récupérées:', tasksForDate);
      
      // Appliquer tous les filtres
      let filteredTasks = tasksForDate;

      // Filtre par service
      if (selectedService !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.service === selectedService);
      }

      // Filtre par état de completion
      if (completionFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
      } else if (completionFilter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
      }

      // Filtre par terme de recherche
      if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTasks(filteredTasks);

      // Calculer le progrès du jour (basé sur toutes les tâches, pas seulement les filtrées)
      const totalTasks = tasksForDate.length;
      const completedTasks = tasksForDate.filter(task => task.completed).length;
      const dayPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const canProceed = await dailyChecklistService.canProceedToNextDay(selectedDate, selectedHotel);
      
      setDayProgress({
        total: totalTasks,
        completed: completedTasks,
        percentage: dayPercentage,
        canProceedToNextDay: canProceed
      });

      // Vérifier si la journée est déjà terminée
      const dayCompleted = await dailyChecklistService.isDayCompleted(selectedDate, selectedHotel);
      setIsDayCompleted(dayCompleted);

      // Grouper par service avec calcul de progression (basé sur les tâches filtrées pour l'affichage)
      const groups = logbookServices.map(service => {
        const serviceTasks = filteredTasks.filter(task => task.service === service.key);
        const completedServiceTasks = serviceTasks.filter(task => task.completed).length;
        const servicePercentage = serviceTasks.length > 0 ? Math.round((completedServiceTasks / serviceTasks.length) * 100) : 0;
        
        return {
          service: service.key,
          total: serviceTasks.length,
          completed: completedServiceTasks,
          percentage: servicePercentage,
          tasks: serviceTasks
        };
      }).filter(group => group.total > 0); // Ne garder que les services qui ont des tâches

      console.log('Groupes de services créés:', groups);
      setServiceGroups(groups);

      // Déployer automatiquement seulement les services avec des tâches incomplètes
      const incompleteServices = groups
        .filter(group => group.percentage < 100)
        .map(group => group.service);
      setExpandedServices(new Set(incompleteServices));

    } catch (error) {
      console.error('Error loading today\'s tasks:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    try {
      await dailyChecklistService.toggleTaskCompletion(
        id, 
        completed, 
        currentUserData?.id || currentUser?.uid || 'unknown'
      );
      await loadTodaysTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedTaskForComment || !currentUser) return;
    
    try {
      await dailyChecklistService.addCommentToTask(selectedTaskForComment.id, {
        content: comment,
        authorId: currentUserData?.id || currentUser.uid,
        authorName: currentUserData?.name || currentUser.email?.split('@')[0] || 'Utilisateur',
        createdAt: new Date()
      });
      
      await loadTodaysTasks();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCompleteDay = async () => {
    try {
      await dailyChecklistService.completeDayAndGenerateNext(
        selectedDate,
        selectedHotel,
        currentUserData?.id || currentUser?.uid || 'unknown'
      );
      
      // Passer au jour suivant automatiquement
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
      
      await loadTodaysTasks();
    } catch (error) {
      console.error('Error completing day:', error);
    }
  };
  
  // Fonction pour annuler la complétion d'une journée (réservée aux administrateurs)
  const handleCancelDayCompletion = async () => {
    try {
      await dailyChecklistService.cancelDayCompletion(
        selectedDate,
        selectedHotel
      );
      
      // Recharger les tâches pour mettre à jour l'affichage
      await loadTodaysTasks();
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
    await loadTodaysTasks();
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
    const hotel = hotels.find(h => h.id === hotelId);
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
    const user = users.find(u => u.id === userId);
    return user?.name || 'Utilisateur inconnu';
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
  console.log('Hôtels disponibles pour le sélecteur:', hotels);
  
  // Utiliser tous les hôtels disponibles pour le sélecteur
  const accessibleHotels = hotels;

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
                <Hotel className="w-4 h-4 text-warm-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
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

          {/* Deuxième ligne : Tous les filtres */}
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
                  onChange={(e) => setCompletionFilter(e.target.value)}
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

        {/* Date Navigation */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshTasks}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
              title="Rafraîchir les tâches (pour voir les nouvelles missions)"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Rafraîchir
            </button>
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-warm-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 text-warm-400" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-warm-900 capitalize">
                {selectedDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <div className="flex items-center justify-center space-x-3 text-sm mt-1">
                {isToday() && (
                  <span className="text-blue-600 font-medium">AUJOURD'HUI</span>
                )}
                {isYesterday() && (
                  <span className="text-orange-600 font-medium">HIER</span>
                )}
                {isDayCompleted && (
                  <span className="text-green-600 font-medium">✓ JOURNÉE TERMINÉE</span>
                )}
              </div>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-warm-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4 text-warm-400" />
            </button>
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
          {loading ? (
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
                                  <h4 className={`font-medium text-warm-900 mb-1 ${
                                    task.completed ? 'line-through text-warm-500' : ''
                                  }`}>
                                    {task.title}
                                    {task.completed && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        ✓ Terminé
                                      </span>
                                    )}
                                  </h4>
                                  
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
                                        <span>{task.completedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
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
                                              <span className="text-blue-600">{comment.createdAt.toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <p className="text-blue-700 mt-1">{comment.content}</p>
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
        onSubmit={handleAddComment}
        taskTitle={selectedTaskForComment?.title || ''}
      />
    </Layout>
  );
}