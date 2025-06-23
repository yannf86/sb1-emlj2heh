import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import LogbookModal from '../components/Logbook/LogbookModal';
import LogbookCalendar from '../components/Logbook/LogbookCalendar';
import CommentModal from '../components/Logbook/CommentModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import { LogbookEntry, LogbookReminder, logbookServices, ServiceGroup } from '../types/logbook';
import { Hotel } from '../types/parameters';
import { logbookService } from '../services/firebase/logbookService';
import { hotelsService } from '../services/firebase/hotelsService';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/firebase/usersService';

export default function Logbook() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedEntryForComment, setSelectedEntryForComment] = useState<LogbookEntry | null>(null);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<LogbookEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [reminders, setReminders] = useState<LogbookReminder[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dayProgress, setDayProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  // États pour le modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LogbookEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTodaysEntries();
  }, [selectedDate, entries]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, remindersData, hotelsData] = await Promise.all([
        logbookService.getLogbookEntries(),
        logbookService.getLogbookReminders(),
        hotelsService.getHotels()
      ]);
      
      setEntries(entriesData);
      setReminders(remindersData);
      setHotels(hotelsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysEntries = async () => {
    try {
      const entriesForDate = await logbookService.getEntriesForDate(selectedDate);
      
      // Filtrer selon les critères sélectionnés
      let filteredEntries = entriesForDate;
      
      if (selectedHotel !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.hotelId === selectedHotel);
      }
      
      if (selectedService !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.service === selectedService);
      }
      
      if (searchTerm) {
        filteredEntries = filteredEntries.filter(entry =>
          entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.authorName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Calculer le progrès du jour
      const totalEntries = filteredEntries.length;
      const completedEntries = filteredEntries.filter(entry => entry.completed).length;
      const dayPercentage = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
      
      setDayProgress({
        completed: completedEntries,
        total: totalEntries,
        percentage: dayPercentage
      });

      // Grouper par service avec calcul de progression
      const groups = logbookServices.map(service => {
        const serviceEntries = filteredEntries.filter(entry => entry.service === service.key);
        const completedServiceEntries = serviceEntries.filter(entry => entry.completed).length;
        const servicePercentage = serviceEntries.length > 0 ? Math.round((completedServiceEntries / serviceEntries.length) * 100) : 0;
        
        return {
          service,
          entries: serviceEntries,
          count: serviceEntries.length,
          completed: completedServiceEntries,
          percentage: servicePercentage,
          isExpanded: expandedServices.has(service.key) || serviceEntries.length === 0
        };
      }).filter(group => group.count > 0); // Ne garder que les services qui ont des consignes

      setServiceGroups(groups);

      // Déployer automatiquement seulement les services avec des tâches incomplètes
      const incompleteServices = groups
        .filter(group => group.percentage < 100)
        .map(group => group.service.key);
      setExpandedServices(new Set(incompleteServices));

    } catch (error) {
      console.error('Error loading today\'s entries:', error);
    }
  };

  const handleCreateEntry = async (data: any) => {
    try {
      const entryData = {
        service: data.service,
        hotelId: data.hotelId,
        title: data.content.substring(0, 100), // Premier partie du contenu comme titre
        content: data.content,
        importance: data.importance,
        roomNumber: data.roomNumber,
        isTask: data.isTask,
        completed: false,
        authorId: data.authorId,
        authorName: data.authorName
      };

      const reminderData = data.createReminder ? {
        title: data.reminderTitle,
        description: data.reminderDescription
      } : undefined;

      if (data.dates.length === 1) {
        // Créer une seule entrée
        const entryId = await logbookService.addLogbookEntry({
          ...entryData,
          startDate: data.dates[0],
          endDate: data.dates[0]
        });

        // Créer un rappel si demandé
        if (reminderData) {
          await logbookService.addLogbookReminder({
            entryId,
            title: reminderData.title,
            description: reminderData.description,
            startDate: data.dates[0],
            endDate: data.dates[0],
            active: true
          });
        }
      } else {
        // Créer plusieurs entrées pour la plage de dates
        await logbookService.createEntriesForDateRange(
          entryData,
          data.dates,
          reminderData
        );
      }

      await loadData();
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  const handleUpdateEntry = async (data: any) => {
    if (!selectedEntryForEdit) return;

    try {
      const updateData = {
        service: data.service,
        hotelId: data.hotelId,
        title: data.content.substring(0, 100),
        content: data.content,
        importance: data.importance,
        roomNumber: data.roomNumber,
        isTask: data.isTask,
        startDate: data.dates[0],
        endDate: data.dates[0]
      };

      await logbookService.updateLogbookEntry(selectedEntryForEdit.id, updateData);
      await loadData();
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const toggleEntryCompletion = async (id: string, completed: boolean) => {
    try {
      await logbookService.toggleEntryCompletion(id, completed);
      await loadData();
    } catch (error) {
      console.error('Error toggling entry completion:', error);
    }
  };

  const openDeleteModal = (entry: LogbookEntry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    
    try {
      await logbookService.deleteLogbookEntry(entryToDelete.id);
      await loadData();
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const openEditModal = (entry: LogbookEntry) => {
    setSelectedEntryForEdit(entry);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedEntryForEdit(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntryForEdit(null);
    setIsEditMode(false);
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedEntryForComment || !currentUser) return;
    
    try {
      // Récupérer les données de l'utilisateur
      const users = await usersService.getUsers();
      const userData = users.find(user => user.email === currentUser.email);
      
      await logbookService.addCommentToEntry(selectedEntryForComment.id, {
        content: comment,
        authorId: userData?.id || currentUser.uid,
        authorName: userData?.name || currentUser.email?.split('@')[0] || 'Utilisateur',
        createdAt: new Date()
      });
      
      await loadData();
    } catch (error) {
      console.error('Error adding comment:', error);
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

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel?.name || 'Hôtel inconnu';
  };

  const getImportanceColor = (importance: string) => {
    const colors: { [key: string]: string } = {
      'Normal': 'border-l-blue-500',
      'Important': 'border-l-orange-500',
      'Urgent': 'border-l-red-500'
    };
    return colors[importance] || 'border-l-blue-500';
  };

  const getImportanceBadgeColor = (importance: string) => {
    const colors: { [key: string]: string } = {
      'Normal': 'bg-blue-100 text-blue-700 border-blue-200',
      'Important': 'bg-orange-100 text-orange-700 border-orange-200',
      'Urgent': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[importance] || 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-lime-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  return (
    <Layout title="Cahier de Consignes" subtitle="Gérez et partagez les consignes quotidiennes entre services">
      <div className="h-full flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header Controls */}
          <div className="bg-white border-b border-warm-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les consignes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-64"
                  />
                </div>
                
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                >
                  <option value="all">Tous les hôtels</option>
                  {hotels.map(hotel => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>

                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                >
                  <option value="all">Tous les services</option>
                  {logbookServices.map(service => (
                    <option key={service.key} value={service.key}>
                      {service.icon} {service.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle consigne
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
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
                  {isToday() && (
                    <p className="text-sm text-creho-600 font-medium">AUJOURD'HUI</p>
                  )}
                </div>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-warm-100 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 text-warm-400" />
                </button>
              </div>
            </div>

            {/* Progression globale de la journée */}
            {dayProgress.total > 0 && (
              <div className="mt-4 bg-warm-50 rounded-lg p-4 border border-warm-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 text-warm-600 mr-2" />
                    <span className="text-sm font-medium text-warm-900">
                      Progression du jour
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
              </div>
            )}
          </div>

          {/* Service Groups */}
          <div className="flex-1 overflow-y-auto bg-warm-50 p-4">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Chargement...
                </div>
              ) : serviceGroups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-warm-400" />
                  </div>
                  <h3 className="text-lg font-medium text-warm-900 mb-2">Aucune consigne pour cette date</h3>
                  <p className="text-warm-600 mb-4">Commencez par créer une nouvelle consigne</p>
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
                  >
                    Nouvelle consigne
                  </button>
                </div>
              ) : (
                serviceGroups.map((group) => (
                  <div key={group.service.key} className="bg-white rounded-lg shadow-sm border border-warm-200">
                    {/* Service Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-warm-50 transition-colors border-b border-warm-100"
                      onClick={() => toggleServiceExpansion(group.service.key)}
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-xl mr-3">{group.service.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-warm-900">{group.service.label}</h3>
                              <p className="text-sm text-warm-600">
                                {group.completed}/{group.count} consigne{group.count > 1 ? 's' : ''} terminée{group.completed > 1 ? 's' : ''}
                                {group.percentage === 100 && (
                                  <span className="ml-2 text-green-600 font-medium">✓ Terminé</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-warm-700">{group.count}</span>
                              <span className={`text-sm font-medium ${group.percentage === 100 ? 'text-green-600' : 'text-warm-600'}`}>
                                {group.percentage}%
                              </span>
                              {expandedServices.has(group.service.key) ? (
                                <ChevronUp className="w-5 h-5 text-warm-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-warm-400" />
                              )}
                            </div>
                          </div>
                          
                          {/* Barre de progression du service */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-warm-500">Progression</span>
                              <span className="text-xs font-medium text-warm-700">{group.percentage}%</span>
                            </div>
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

                    {/* Service Entries */}
                    {expandedServices.has(group.service.key) && (
                      <div>
                        {group.entries.map((entry, index) => (
                          <div
                            key={entry.id}
                            className={`border-l-4 ${getImportanceColor(entry.importance)} ${
                              index !== group.entries.length - 1 ? 'border-b border-warm-100' : ''
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {entry.isTask && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        Tâche
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getImportanceBadgeColor(entry.importance)}`}>
                                      {entry.importance}
                                    </span>
                                    {entry.completed && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        ✓ Terminé
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center text-warm-500 mb-2 space-x-3">
                                    <div className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      <span className="text-xs">
                                        {entry.startDate.toLocaleDateString('fr-FR')}
                                        {entry.endDate && entry.startDate.getTime() !== entry.endDate.getTime() && (
                                          ` - ${entry.endDate.toLocaleDateString('fr-FR')}`
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      <span className="text-xs">{getHotelName(entry.hotelId)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      <span className="text-xs">Par {entry.authorName}</span>
                                    </div>
                                    {entry.roomNumber && (
                                      <div className="flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        <span className="text-xs">Chambre {entry.roomNumber}</span>
                                      </div>
                                    )}
                                  </div>

                                  <p className={`text-warm-800 ${entry.completed ? 'line-through text-warm-500' : ''}`}>
                                    {entry.content}
                                  </p>

                                  {/* Comments */}
                                  {entry.comments && entry.comments.length > 0 && (
                                    <div className="mt-3 bg-blue-50 rounded-lg p-3">
                                      <h4 className="text-xs font-medium text-blue-800 mb-2">
                                        Commentaires ({entry.comments.length})
                                      </h4>
                                      <div className="space-y-2">
                                        {entry.comments.map((comment) => (
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
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100">
                                <div className="flex items-center space-x-4">
                                  <button
                                    onClick={() => toggleEntryCompletion(entry.id, !entry.completed)}
                                    className={`flex items-center text-xs font-medium transition-colors ${
                                      entry.completed 
                                        ? 'text-green-600 hover:text-green-700' 
                                        : 'text-warm-600 hover:text-green-600'
                                    }`}
                                  >
                                    {entry.completed ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Terminé
                                      </>
                                    ) : (
                                      <>
                                        <Circle className="w-3 h-3 mr-1" />
                                        Marquer comme terminé
                                      </>
                                    )}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSelectedEntryForComment(entry);
                                      setIsCommentModalOpen(true);
                                    }}
                                    className="flex items-center text-xs text-warm-600 hover:text-warm-800"
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    Commenter
                                  </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => openEditModal(entry)}
                                    className="p-1 hover:bg-warm-100 rounded transition-colors"
                                    title="Modifier la consigne"
                                  >
                                    <Edit className="w-4 h-4 text-warm-400 hover:text-creho-600" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(entry)}
                                    className="p-1 hover:bg-warm-100 rounded transition-colors"
                                    title="Supprimer la consigne"
                                  >
                                    <Trash2 className="w-4 h-4 text-warm-400 hover:text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div className="w-80 bg-white border-l border-warm-200 p-4">
          <LogbookCalendar
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
            reminders={reminders}
          />
        </div>
      </div>

      <LogbookModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={isEditMode ? handleUpdateEntry : handleCreateEntry}
        entry={selectedEntryForEdit}
        isEdit={isEditMode}
      />

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmit={handleAddComment}
        entryTitle={selectedEntryForComment?.title || ''}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEntryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette consigne ?"
        itemName={entryToDelete?.content.substring(0, 50) + (entryToDelete?.content.length > 50 ? '...' : '')}
      />
    </Layout>
  );
}