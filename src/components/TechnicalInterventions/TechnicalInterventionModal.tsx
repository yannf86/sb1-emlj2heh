import React, { useState, useEffect } from 'react';
import { X, History } from 'lucide-react';
import { TechnicalIntervention, Technician } from '../../types/maintenance';
import { Parameter } from '../../types/parameters';
import { User as UserType } from '../../types/users';
import { Hotel } from '../../types/parameters';
import { parametersService } from '../../services/firebase/parametersService';
import { hotelsService } from '../../services/firebase/hotelsService';
import { usersService } from '../../services/firebase/usersService';
import { techniciansService } from '../../services/firebase/techniciansService';
import { permissionsService } from '../../services/firebase/permissionsService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { useInterventionForm } from '../../hooks/useInterventionForm';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import InterventionBasicInfo from './components/InterventionBasicInfo';
import InterventionPhotos from './components/InterventionPhotos';
import InterventionAssignment from './components/InterventionAssignment';
import InterventionQuotes from './components/InterventionQuotes';
import InterventionCosts from './components/InterventionCosts';
import InterventionComments from './components/InterventionComments';
import TechnicalInterventionHistoryModal from './TechnicalInterventionHistoryModal';

interface TechnicalInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (intervention: Omit<TechnicalIntervention, 'id'>, beforePhoto?: File, afterPhoto?: File) => void;
  intervention?: TechnicalIntervention | null;
  isEdit?: boolean;
}

export default function TechnicalInterventionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  intervention, 
  isEdit = false 
}: TechnicalInterventionModalProps) {
  const { currentUser } = useAuth();
  const { userData, accessibleHotels, initialized } = useUserPermissions();
  const { formData, updateFormData } = useInterventionForm(intervention);
  const { beforePhoto, afterPhoto, handlePhotoChange, resetPhotos } = usePhotoUpload();
  
  // Data states
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]); // Hôtels filtrés par permissions
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<Parameter[]>([]);
  const [statuses, setStatuses] = useState<Parameter[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]); // Utilisateurs filtrés par hôtel
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]); // Techniciens filtrés par hôtel
  const [filteredLocations, setFilteredLocations] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadParameters();
      resetPhotos();
      
      // Forcer le rechargement des utilisateurs et techniciens après l'ouverture du modal
      // pour s'assurer que les listes sont correctement filtrées
      if (isEdit && intervention) {
        console.log('Mode édition, intervention:', intervention);
      }
    }
  }, [isOpen, isEdit, intervention]);
  
  // Vérifier si l'utilisateur est admin système
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.email) {
        const isAdmin = await permissionsService.isSystemAdmin(currentUser.email);
        setIsSystemAdmin(isAdmin);
      }
    };
    
    checkAdminStatus();
  }, [currentUser?.email]);
  
  // Filtrer les hôtels selon les permissions utilisateur et définir l'hôtel par défaut
  useEffect(() => {
    if (hotels.length > 0 && initialized && accessibleHotels.length > 0) {
      let userHotels: Hotel[] = [];
      
      if (accessibleHotels.includes('all')) {
        // Admin système - accès à tous les hôtels
        userHotels = hotels;
        setFilteredHotels(hotels);
      } else {
        // Utilisateur standard - accès uniquement aux hôtels autorisés
        userHotels = hotels.filter(hotel => accessibleHotels.includes(hotel.id));
        setFilteredHotels(userHotels);
        
        // Si l'hôtel actuellement sélectionné n'est pas dans la liste des hôtels autorisés
        if (formData.hotelId && !accessibleHotels.includes(formData.hotelId)) {
          // Réinitialiser la sélection d'hôtel
          updateFormData({ hotelId: '' });
        }
      }
      
      // Définir l'hôtel par défaut en mode création
      if (!isEdit && !intervention && !formData.hotelId && userHotels.length > 0) {
        console.log('Définition de l\'hôtel par défaut pour une nouvelle intervention');
        
        // Si l'utilisateur n'a accès qu'à un seul hôtel, le sélectionner automatiquement
        if (userHotels.length === 1) {
          console.log('Un seul hôtel accessible, sélection automatique:', userHotels[0].name);
          updateFormData({ hotelId: userHotels[0].id });
        } 
        // Si l'utilisateur a accès à plusieurs hôtels, sélectionner le premier
        else if (accessibleHotels.length > 0 && accessibleHotels[0] !== 'all') {
          const defaultHotelId = accessibleHotels[0];
          const defaultHotel = hotels.find(h => h.id === defaultHotelId);
          if (defaultHotel) {
            console.log('Sélection du premier hôtel de l\'utilisateur:', defaultHotel.name);
            updateFormData({ hotelId: defaultHotelId });
          }
        }
      }
    }
  }, [hotels, initialized, accessibleHotels, formData.hotelId]);

  // Filter locations when hotel changes and sort them alphabetically
  useEffect(() => {
    if (formData.hotelId) {
      const selectedHotel = hotels.find(h => h.id === formData.hotelId);
      if (selectedHotel) {
        // Filtrer les lieux disponibles pour l'hôtel sélectionné
        const availableLocations = locations.filter(loc => 
          selectedHotel.locations?.includes(loc.id) || false
        );
        
        // Trier les lieux par ordre alphabétique
        const sortedLocations = [...availableLocations].sort((a, b) => 
          a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })
        );
        
        setFilteredLocations(sortedLocations);

        if (formData.location && !availableLocations.find(l => l.id === formData.location)) {
          updateFormData({ location: '' });
        }
      }
    } else {
      setFilteredLocations([]);
      updateFormData({ location: '' });
    }
  }, [formData.hotelId, hotels, locations]);
  
  // Filtrer les utilisateurs en fonction de l'hôtel sélectionné
  useEffect(() => {
    if (formData.hotelId) {
      // Filtrer les utilisateurs qui ont accès à l'hôtel sélectionné ou qui sont admin système
      const hotelUsers = users.filter(user => 
        user.role === 'system_admin' || // Les admins système ont accès à tous les hôtels
        user.hotels.includes(formData.hotelId) || // Utilisateurs avec accès spécifique à cet hôtel
        user.hotels.includes('all') // Utilisateurs avec accès à tous les hôtels
      );
      
      // Trier les utilisateurs par ordre alphabétique
      const sortedUsers = [...hotelUsers].sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
      
      setFilteredUsers(sortedUsers);
      
      // En mode édition, on ne réinitialise pas l'assignation même si l'utilisateur n'est pas dans la liste
      // Cela permet de conserver l'assignation existante lors de l'édition
      if (!isEdit && formData.assignedToType === 'user' && formData.assignedTo && 
          !hotelUsers.find(u => u.id === formData.assignedTo)) {
        updateFormData({ assignedTo: '' });
      }
    } else {
      // Aucun hôtel sélectionné, liste vide mais on ne réinitialise pas en mode édition
      setFilteredUsers([]);
      if (!isEdit && formData.assignedToType === 'user') {
        updateFormData({ assignedTo: '' });
      }
    }
  }, [formData.hotelId, users, formData.assignedToType, isEdit]);
  
  // Filtrer les techniciens en fonction de l'hôtel sélectionné
  useEffect(() => {
    if (formData.hotelId) {
      // Filtrer les techniciens qui peuvent intervenir dans l'hôtel sélectionné
      const hotelTechnicians = technicians.filter(tech => 
        tech.hotels.includes(formData.hotelId) || // Techniciens assignés à cet hôtel
        tech.hotels.includes('all') // Techniciens pouvant intervenir partout
      );
      
      // Trier les techniciens par ordre alphabétique
      const sortedTechnicians = [...hotelTechnicians].sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
      
      setFilteredTechnicians(sortedTechnicians);
      
      // En mode édition, on ne réinitialise pas l'assignation même si le technicien n'est pas dans la liste
      // Cela permet de conserver l'assignation existante lors de l'édition
      if (!isEdit && formData.assignedToType === 'technician' && formData.assignedTo && 
          !hotelTechnicians.find(t => t.id === formData.assignedTo)) {
        updateFormData({ assignedTo: '' });
      }
    } else {
      // Aucun hôtel sélectionné, liste vide mais on ne réinitialise pas en mode édition
      setFilteredTechnicians([]);
      if (!isEdit && formData.assignedToType === 'technician') {
        updateFormData({ assignedTo: '' });
      }
    }
  }, [formData.hotelId, technicians, formData.assignedToType, isEdit]);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const [
        hotelsData, 
        locationsData, 
        interventionTypesData, 
        statusesData, 
        usersData,
        techniciansData
      ] = await Promise.all([
        hotelsService.getHotels(),
        parametersService.getParameters('parameters_location'),
        parametersService.getParameters('parameters_intervention_type'),
        parametersService.getParameters('parameters_status'),
        usersService.getUsers(),
        techniciansService.getTechnicians()
      ]);
      
      setHotels(hotelsData);
      // Le filtrage des hôtels est maintenant géré dans un useEffect séparé
      setLocations(locationsData.filter(p => p.active));
      setInterventionTypes(interventionTypesData.filter(p => p.active));
      setStatuses(statusesData.filter(p => p.active));
      setUsers(usersData.filter(u => u.active));
      setTechnicians(techniciansData.filter(t => t.active));
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Les fonctions handleQuoteToggle et handleQuotesUpdate ont été remplacées
  // par des fonctions anonymes directement dans les props du composant InterventionQuotes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Créer une copie du formData pour éviter de modifier l'original
    const cleanedFormData = { ...formData } as Record<string, any>;
    
    // Nettoyer les valeurs undefined qui pourraient causer des problèmes avec Firestore
    Object.keys(cleanedFormData).forEach(key => {
      if (cleanedFormData[key] === undefined) {
        delete cleanedFormData[key];
      }
    });
    
    // S'assurer que les dates sont valides
    if (cleanedFormData.startDate && !(cleanedFormData.startDate instanceof Date)) {
      try {
        cleanedFormData.startDate = new Date(cleanedFormData.startDate);
      } catch (error) {
        delete cleanedFormData.startDate;
      }
    }
    
    if (cleanedFormData.endDate && !(cleanedFormData.endDate instanceof Date)) {
      try {
        cleanedFormData.endDate = new Date(cleanedFormData.endDate);
      } catch (error) {
        delete cleanedFormData.endDate;
      }
    }
    
    const interventionData: Omit<TechnicalIntervention, 'id'> = {
      ...formData,  // Utiliser formData original pour la structure de base
      ...Object.fromEntries(  // N'ajouter que les valeurs non-undefined du cleanedFormData
        Object.entries(cleanedFormData).filter(([_, value]) => value !== undefined)
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Toujours conserver createdBy (requis par le type)
      createdBy: isEdit ? (intervention?.createdBy || 'unknown') : (currentUser?.uid || 'unknown'),
      // Ajouter updatedBy uniquement en mode édition
      ...(isEdit ? { updatedBy: currentUser?.uid || 'unknown' } : {})
    };

    onSubmit(interventionData, beforePhoto || undefined, afterPhoto || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier l\'intervention' : 'Nouvelle Intervention Technique'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-warm-600">
            {isEdit ? 'Modifiez les détails de cette intervention technique' : 'Créer une nouvelle demande d\'intervention technique'}
          </p>

          <InterventionBasicInfo
            formData={formData}
            updateFormData={updateFormData}
            hotels={filteredHotels}
            locations={locations}
            interventionTypes={interventionTypes}
            filteredLocations={filteredLocations}
          />

          <InterventionPhotos
            beforePhoto={beforePhoto}
            afterPhoto={afterPhoto}
            onPhotoChange={handlePhotoChange}
            beforePhotoUrl={intervention?.beforePhotoUrl}
            afterPhotoUrl={intervention?.afterPhotoUrl}
          />

          <InterventionAssignment
            formData={formData}
            updateFormData={updateFormData}
            statuses={statuses}
            users={filteredUsers}
            technicians={filteredTechnicians}
          />

          <InterventionQuotes
            hasQuote={formData.hasQuote}
            quotes={formData.quotes}
            technicians={filteredTechnicians}
            onQuoteToggle={(hasQuote) => updateFormData({ hasQuote })}
            onQuotesUpdate={(quotes) => updateFormData({ quotes })}
            interventionId={intervention?.id}
          />

          <InterventionCosts
            formData={formData}
            updateFormData={updateFormData}
          />

          <InterventionComments
            formData={formData}
            updateFormData={updateFormData}
          />

          <div className="flex space-x-3 pt-4">
            {isEdit && intervention && (
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors flex items-center"
              >
                <History size={18} className="mr-1" />
                Historique
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Enregistrer les modifications' : 'Créer l\'intervention'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal d'historique */}
      {intervention && (
        <TechnicalInterventionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          intervention={intervention}
        />
      )}
    </div>
  );
}