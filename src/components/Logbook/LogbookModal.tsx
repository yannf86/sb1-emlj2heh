import React, { useState, useEffect } from 'react';
import { X, Calendar, Hotel as HotelIcon } from 'lucide-react';
import { logbookServices } from '../../types/logbook';
import { Hotel } from '../../types/parameters';
import { hotelsService } from '../../services/firebase/hotelsService';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/firebase/usersService';
import { LogbookEntry } from '../../types/logbook';

interface LogbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  entry?: LogbookEntry | null;
  isEdit?: boolean;
}

export default function LogbookModal({ isOpen, onClose, onSubmit, entry, isEdit = false }: LogbookModalProps) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    service: '',
    hotelId: '',
    hasDateRange: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    selectedDates: [] as string[],
    content: '',
    isTask: false,
    importance: 'Normal' as 'Normal' | 'Important' | 'Urgent',
    roomNumber: '',
    createReminder: false,
    reminderTitle: '',
    reminderDescription: ''
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isMultipleDates, setIsMultipleDates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (entry && isEdit) {
        // Pré-remplir les champs en mode édition
        const entryDate = entry.startDate.toISOString().split('T')[0];
        setFormData({
          service: entry.service,
          hotelId: entry.hotelId,
          hasDateRange: false,
          startDate: entryDate,
          endDate: entry.endDate ? entry.endDate.toISOString().split('T')[0] : '',
          selectedDates: [entryDate],
          content: entry.content,
          isTask: entry.isTask,
          importance: entry.importance,
          roomNumber: entry.roomNumber || '',
          createReminder: false,
          reminderTitle: '',
          reminderDescription: ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, entry, isEdit]);

  const loadData = async () => {
    try {
      const [allHotels, users] = await Promise.all([
        hotelsService.getHotels(),
        usersService.getUsers()
      ]);

      // Trouver l'utilisateur connecté
      const loggedInUser = users.find(user => user.email === currentUser?.email);
      setCurrentUserData(loggedInUser);

      // Filtrer les hôtels accessibles selon le rôle
      let accessibleHotels = allHotels;
      
      if (loggedInUser) {
        // Les administrateurs système ont accès à tous les hôtels
        if (loggedInUser.role === 'system_admin') {
          accessibleHotels = allHotels;
        } else {
          // Les autres utilisateurs ne voient que leurs hôtels assignés
          accessibleHotels = allHotels.filter(hotel => loggedInUser.hotels.includes(hotel.id));
        }
      }

      setHotels(accessibleHotels);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      service: '',
      hotelId: '',
      hasDateRange: false,
      startDate: today,
      endDate: '',
      selectedDates: [today],
      content: '',
      isTask: false,
      importance: 'Normal',
      roomNumber: '',
      createReminder: false,
      reminderTitle: '',
      reminderDescription: ''
    });
    setIsMultipleDates(false);
  };

  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    
    try {
      // Validation des dates
      if (!start || !end || start === '0' || end === '0') {
        console.warn('Dates invalides détectées dans generateDateRange:', { start, end });
        return [new Date().toISOString().split('T')[0]];
      }
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Vérifier si les dates sont valides
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Dates invalides détectées dans generateDateRange:', { start, end });
        return [new Date().toISOString().split('T')[0]];
      }
      
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    } catch (error) {
      console.error('Erreur lors de la génération de la plage de dates:', error);
      return [new Date().toISOString().split('T')[0]];
    }
  };

  const handleDateRangeToggle = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, hasDateRange: enabled }));
    setIsMultipleDates(enabled);
    
    if (enabled && formData.endDate) {
      const dates = generateDateRange(formData.startDate, formData.endDate);
      setFormData(prev => ({ ...prev, selectedDates: dates }));
    } else {
      setFormData(prev => ({ ...prev, selectedDates: [prev.startDate] }));
    }
  };

  const handleStartDateChange = (date: string) => {
    try {
      // Validation de la date
      if (!date || date === '0') {
        // Si la date est invalide, utiliser la date actuelle
        const today = new Date().toISOString().split('T')[0];
        
        setFormData(prev => {
          const newData = { ...prev, startDate: today };
          
          if (prev.hasDateRange && prev.endDate) {
            newData.selectedDates = generateDateRange(today, prev.endDate);
          } else {
            newData.selectedDates = [today];
          }
          
          return newData;
        });
      } else {
        // Vérifier si la date est valide
        const testDate = new Date(date);
        if (isNaN(testDate.getTime())) {
          console.warn('Date de début invalide détectée:', date);
          const today = new Date().toISOString().split('T')[0];
          
          setFormData(prev => {
            const newData = { ...prev, startDate: today };
            
            if (prev.hasDateRange && prev.endDate) {
              newData.selectedDates = generateDateRange(today, prev.endDate);
            } else {
              newData.selectedDates = [today];
            }
            
            return newData;
          });
        } else {
          // La date est valide, continuer normalement
          setFormData(prev => {
            const newData = { ...prev, startDate: date };
            
            if (prev.hasDateRange && prev.endDate) {
              newData.selectedDates = generateDateRange(date, prev.endDate);
            } else {
              newData.selectedDates = [date];
            }
            
            return newData;
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de la date de début:', error);
      // En cas d'erreur, utiliser la date actuelle
      const today = new Date().toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        startDate: today,
        selectedDates: [today]
      }));
    }
  };

  const handleEndDateChange = (date: string) => {
    try {
      // Validation de la date
      if (!date || date === '0') {
        // Si la date est vide ou invalide, ne pas définir de date de fin
        setFormData(prev => ({
          ...prev,
          endDate: ''
        }));
      } else {
        // Vérifier si la date est valide
        const testDate = new Date(date);
        if (isNaN(testDate.getTime())) {
          console.warn('Date de fin invalide détectée:', date);
          setFormData(prev => ({
            ...prev,
            endDate: ''
          }));
        } else {
          // La date est valide, continuer normalement
          setFormData(prev => {
            const newData = { ...prev, endDate: date };
            
            if (prev.hasDateRange && date) {
              newData.selectedDates = generateDateRange(prev.startDate, date);
            }
            
            return newData;
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de la date de fin:', error);
      // En cas d'erreur, ne pas définir de date de fin
      setFormData(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  const handleReminderToggle = (enabled: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      createReminder: enabled,
      reminderTitle: enabled ? prev.content.substring(0, 50) : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      authorId: currentUserData?.id || '',
      authorName: currentUserData?.name || 'Utilisateur',
      dates: formData.selectedDates.map(date => new Date(date))
    };
    
    onSubmit(submitData);
    onClose();
  };

  if (!isOpen) return null;

  const selectedService = logbookServices.find(s => s.key === formData.service);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier la consigne' : 'Nouvelle consigne'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-warm-600">
            {isEdit ? 'Modifiez les détails de cette consigne' : 'Ajoutez une nouvelle consigne au cahier de transmission'}
          </p>

          {/* Service et Hôtel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Service *
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="">Sélectionner un service</option>
                {logbookServices.map(service => (
                  <option key={service.key} value={service.key}>
                    {service.icon} {service.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Hôtel *
              </label>
              <select
                required
                value={formData.hotelId}
                onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="">Sélectionner un hôtel</option>
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Période d'affichage - Masqué en mode édition */}
          {!isEdit && (
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-warm-700">
                Définir une plage de dates
              </label>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasDateRange}
                    onChange={(e) => handleDateRangeToggle(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${
                    formData.hasDateRange ? 'bg-blue-500' : 'bg-warm-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      formData.hasDateRange ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                {isEdit ? 'Date *' : 'Date de début *'}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Date de fin {formData.hasDateRange ? '*' : ''}
                </label>
                <input
                  type="date"
                  required={formData.hasDateRange}
                  disabled={!formData.hasDateRange}
                  value={formData.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 disabled:bg-warm-100 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* Aperçu des dates sélectionnées - Masqué en mode édition */}
          {!isEdit && formData.selectedDates.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                {formData.selectedDates.length} consigne(s) seront créées :
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Du {new Date(formData.selectedDates[0]).toLocaleDateString('fr-FR')} au {' '}
                {new Date(formData.selectedDates[formData.selectedDates.length - 1]).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}

          {/* Tâche à effectuer */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-warm-700">Tâche à effectuer</span>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isTask}
                  onChange={(e) => setFormData({ ...formData, isTask: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.isTask ? 'bg-green-500' : 'bg-warm-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    formData.isTask ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Contenu *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Saisissez votre consigne ici..."
              rows={4}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
            />
          </div>

          {/* Importance et Numéro de chambre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Importance
              </label>
              <select
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value as any })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Numéro de chambre (optionnel)
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="ex: 101"
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
            </div>
          </div>

          {/* Créer un rappel - Masqué en mode édition */}
          {!isEdit && (
            <>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.createReminder}
                    onChange={(e) => handleReminderToggle(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${
                    formData.createReminder ? 'bg-amber-500' : 'bg-warm-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      formData.createReminder ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                  </div>
                  <span className="ml-3 text-sm text-warm-700">Créer un rappel</span>
                </label>
              </div>

              {/* Détails du rappel */}
              {formData.createReminder && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">
                      Titre du rappel *
                    </label>
                    <input
                      type="text"
                      required={formData.createReminder}
                      value={formData.reminderTitle}
                      onChange={(e) => setFormData({ ...formData, reminderTitle: e.target.value })}
                      placeholder="Titre du rappel"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">
                      Description (optionnelle)
                    </label>
                    <textarea
                      value={formData.reminderDescription}
                      onChange={(e) => setFormData({ ...formData, reminderDescription: e.target.value })}
                      rows={2}
                      placeholder="Description du rappel"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  <p className="text-xs text-amber-700">
                    Ce rappel sera affiché pendant toute la période définie pour cette consigne. 
                    Du {new Date(formData.startDate).toLocaleDateString('fr-FR')} 
                    {formData.hasDateRange && formData.endDate ? ` au ${new Date(formData.endDate).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={hotels.length === 0}
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Enregistrer les modifications' : 'Créer la consigne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}