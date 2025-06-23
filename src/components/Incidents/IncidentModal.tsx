import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, Clock, Camera, FileText, ExternalLink, Download, Edit, Trash2 } from 'lucide-react';
import PdfViewer from '../common/PdfViewer';
import PdfPreview from '../common/PdfPreview';
import { Incident } from '../../types/incidents';
import { Parameter, Hotel } from '../../types/parameters';
import { User as UserType } from '../../types/users';
import { hotelsService } from '../../services/firebase/hotelsService';
import { parametersService } from '../../services/firebase/parametersService';
import { usersService } from '../../services/firebase/usersService';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Omit<Incident, 'id'>) => void;
  incident?: Incident | null;
  isEdit?: boolean;
}

export default function IncidentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  incident, 
  isEdit = false 
}: IncidentModalProps) {
  const { currentUser } = useAuth();
  const { accessibleHotels, isSystemAdmin } = useUserPermissions();
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Définir l'interface pour le formData pour éviter les problèmes de typage
  interface IncidentFormData {
    date: Date;
    time: string;
    hotelId: string;
    location: string; // Toujours une chaîne, jamais undefined
    categoryId: string;
    impactId: string;
    description: string;
    incidentPhoto: File | null;
    photoURL: string;
    resolutionDescription: string;
    resolutionType: string;
    commercialGesture: number;
    clientSatisfactionId: string;
    receivedById: string;
    concludedBy: string;
    statusId: string;
    showPdfViewer: boolean;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientArrivalDate: Date | null;
    clientDepartureDate: Date | null;
    clientRoom: string;
    clientReservation: string;
    bookingAmount: number;
    bookingOrigin: string;
  }

  // Fonction pour obtenir l'heure actuelle au format HH:MM
  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    console.log(`Génération de l'heure actuelle: ${hours}:${minutes}`);
    return `${hours}:${minutes}`;
  };
  
  // Heure actuelle pour l'initialisation du formulaire
  const [defaultTime] = useState(getCurrentTime());

  const [formData, setFormData] = useState<IncidentFormData>({
    date: new Date(),
    time: defaultTime, // Heure actuelle par défaut
    hotelId: '',
    location: '',
    categoryId: '',
    impactId: '',
    description: '',
    incidentPhoto: null,
    photoURL: '',
    resolutionDescription: '',
    resolutionType: '',
    commercialGesture: 0,
    clientSatisfactionId: '',
    receivedById: '',
    concludedBy: '',
    statusId: 'CZa3iy84r8pVqjVOQHNL', // En cours
    showPdfViewer: false,
    
    // Informations Client
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientArrivalDate: null,
    clientDepartureDate: null,
    clientRoom: '',
    clientReservation: '',
    bookingAmount: 0,
    bookingOrigin: '',
  });

  // Fonction de réinitialisation du formulaire supprimée car non utilisée

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Parameter[]>([]);
  const [impacts, setImpacts] = useState<Parameter[]>([]);
  const [statuses, setStatuses] = useState<Parameter[]>([]);
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [resolutionTypes, setResolutionTypes] = useState<Parameter[]>([]);
  const [bookingOrigins, setBookingOrigins] = useState<Parameter[]>([]);
  const [satisfactionTypes, setSatisfactionTypes] = useState<Parameter[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);

  // Listes filtrées basées sur l'hôtel sélectionné
  const [filteredCategories, setFilteredCategories] = useState<Parameter[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Parameter[]>([]);

  // Effet pour initialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      console.log('Modal ouvert, chargement des paramètres...');
      // Réinitialiser l'état pour éviter les données résiduelles
      setHotels([]);
      setCurrentUserData(null);
      
      loadParameters().then((success) => {
        console.log('Paramètres chargés avec succès:', success);
        if (incident) {
          console.log('Mode édition, préremplissage avec les données de l\'incident');
          console.log('Valeur du champ location dans l\'incident:', incident.location);
          
          // Préserver la valeur originale du champ location pour référence
          // S'assurer que la valeur est toujours une chaîne, même si elle est undefined
          const originalLocation = incident.location || '';
          
          setFormData({
            date: incident.date ? new Date(incident.date) : new Date(),
            time: incident.time || '',
            hotelId: incident.hotelId || '',
            location: originalLocation, // Utiliser la valeur originale ou chaîne vide
            categoryId: incident.categoryId || '',
            impactId: incident.impactId || '',
            description: incident.description || '',
            incidentPhoto: null,
            photoURL: incident.photoURL || '',
            resolutionDescription: incident.resolutionDescription || '',
            resolutionType: incident.resolutionType || '',
            commercialGesture: incident.actualCost || 0, // Utilisation de actualCost au lieu de commercialGesture
            clientSatisfactionId: incident.clientSatisfactionId || '',
            receivedById: incident.receivedById || '',
            concludedBy: incident.assignedTo || '', // Utilisation de assignedTo au lieu de concludedBy
            statusId: incident.statusId || 'CZa3iy84r8pVqjVOQHNL',
            showPdfViewer: false,
            
            // Informations Client
            clientName: incident.clientName || '',
            clientEmail: incident.clientEmail || '',
            clientPhone: incident.clientPhone || '',
            clientArrivalDate: incident.clientArrivalDate ? new Date(incident.clientArrivalDate) : null,
            clientDepartureDate: incident.clientDepartureDate ? new Date(incident.clientDepartureDate) : null,
            clientRoom: incident.clientRoom || '',
            clientReservation: incident.clientReservation || '',
            bookingAmount: incident.bookingAmount || 0,
            bookingOrigin: incident.bookingOrigin || '',
          });
          
          // Log pour débogage
          console.log('FormData après initialisation en mode édition:', { location: originalLocation });
        } else {
          console.log('Mode création, initialisation du formulaire');
          
          // Trouver l'hôtel par défaut pour l'utilisateur connecté
          let defaultHotelId = '';
          if (currentUserData && currentUserData.hotels && currentUserData.hotels.length > 0) {
            defaultHotelId = currentUserData.hotels[0];
            console.log('Hôtel par défaut défini:', defaultHotelId);
          } else if (accessibleHotels.length === 1 && hotels.length === 1) {
            defaultHotelId = hotels[0].id;
            console.log('Un seul hôtel accessible, sélectionné par défaut:', defaultHotelId);
          }
          
          // Utiliser l'heure par défaut définie lors de l'initialisation du composant
          console.log('Utilisation de l\'heure par défaut:', defaultTime);
          
          setFormData({
            date: new Date(),
            time: defaultTime, // Utiliser l'heure par défaut
            hotelId: defaultHotelId, // Hôtel par défaut
            location: '',
            categoryId: '',
            impactId: '',
            description: '',
            incidentPhoto: null,
            photoURL: '',
            resolutionDescription: '',
            resolutionType: '',
            commercialGesture: 0,
            clientSatisfactionId: '',
            receivedById: currentUserData && currentUserData.id ? currentUserData.id : '', // Utilisateur actuel par défaut
            concludedBy: '',
            statusId: 'CZa3iy84r8pVqjVOQHNL', // En cours
            showPdfViewer: false,
            
            // Informations Client
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            clientArrivalDate: null,
            clientDepartureDate: null,
            clientRoom: '',
            clientReservation: '',
            bookingAmount: 0,
            bookingOrigin: '',
          });
        }
      });
    }
  }, [isOpen, incident]);
  
  // Effet pour préserver la valeur du champ location en mode édition
  useEffect(() => {
    if (isEdit && incident && incident.location !== undefined) {
      // S'assurer que le champ location n'est pas réinitialisé en mode édition
      const safeLocation = incident.location || ''; // Garantir une chaîne, même si undefined
      
      setFormData(prev => {
        if (prev.location !== safeLocation) {
          console.log('Restauration de la valeur du champ location:', safeLocation);
          return { ...prev, location: safeLocation };
        }
        return prev;
      });
    }
  }, [isEdit, incident, filteredLocations]);

  // Effet spécifique pour initialiser les valeurs par défaut après le chargement des données
  useEffect(() => {
    // Ne s'exécute que lorsque les données sont chargées et qu'on est en mode création
    if (!incident && currentUserData && hotels.length > 0 && isOpen) {
      console.log('Initialisation des valeurs par défaut après chargement des données');
      
      // Déterminer l'hôtel par défaut
      let defaultHotelId = '';
      if (currentUserData.hotels && currentUserData.hotels.length > 0) {
        defaultHotelId = currentUserData.hotels[0];
        console.log('Hôtel par défaut défini depuis utilisateur:', defaultHotelId);
      } else if (hotels.length === 1) {
        defaultHotelId = hotels[0].id;
        console.log('Un seul hôtel accessible, sélectionné par défaut:', defaultHotelId);
      }
      
      // Définir les valeurs par défaut immédiatement
      setFormData(prev => ({
        ...prev,
        hotelId: defaultHotelId,
        receivedById: currentUserData.id,
        time: defaultTime
      }));
      
      // Force une mise à jour après un court délai pour s'assurer que les valeurs sont appliquées
      setTimeout(() => {
        console.log('Mise à jour forcée des valeurs par défaut');
        setFormData(prev => ({
          ...prev,
          hotelId: defaultHotelId,
          receivedById: currentUserData.id,
          time: defaultTime
        }));
      }, 100);
    }
  }, [incident, currentUserData, hotels, defaultTime, isOpen]);

  // Effet pour filtrer les catégories, lieux et utilisateurs en fonction de l'hôtel sélectionné
  useEffect(() => {
    if (formData.hotelId && currentUserData) {
      console.log('Filtrage des données pour l\'hôtel:', formData.hotelId);
      console.log('Valeur actuelle du champ location:', formData.location);
      
      const selectedHotel = hotels.find(h => h.id === formData.hotelId);
      if (selectedHotel) {
        // Filtrer les catégories d'incidents pour cet hôtel
        const availableCategories = categories.filter(cat => 
          selectedHotel.incidentCategories?.includes(cat.id) || false
        );
        // Trier les catégories par ordre alphabétique
        const sortedCategories = [...availableCategories].sort((a, b) => 
          a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
        );
        setFilteredCategories(sortedCategories);

        // Filtrer les lieux pour cet hôtel
        const availableLocations = locations.filter(loc => 
          selectedHotel.locations?.includes(loc.id) || false
        );
        // Trier les lieux par ordre alphabétique
        const sortedLocations = [...availableLocations].sort((a, b) => 
          a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
        );
        setFilteredLocations(sortedLocations);
        console.log('Lieux disponibles après filtrage:', sortedLocations.length);
        
        // Filtrer les utilisateurs pour cet hôtel
        const hotelUsers = users.filter(user => 
          user.hotels?.includes(selectedHotel.id) || user.role === 'system_admin'
        );
        // Trier les utilisateurs par ordre alphabétique
        const sortedUsers = [...hotelUsers].sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        setFilteredUsers(sortedUsers);

        // Réinitialiser les sélections si elles ne sont plus valides
        if (formData.categoryId && !availableCategories.find(c => c.id === formData.categoryId)) {
          setFormData(prev => ({ ...prev, categoryId: '' }));
        }
        
        // IMPORTANT: En mode édition, on préserve toujours la valeur du champ location
        // car elle peut être un texte libre et pas forcément un ID présent dans la liste
        if (isEdit && incident && incident.location !== undefined) {
          const safeLocation = incident.location || ''; // Garantir une chaîne, même si undefined
          console.log('Mode édition: préservation du champ location:', safeLocation);
          // Garantir que la valeur est préservée en mode édition
          setFormData(prev => ({ ...prev, location: safeLocation }));
        } else if (!isEdit && formData.location && !availableLocations.find(l => l.id === formData.location)) {
          // En mode création, on réinitialise si la valeur n'est pas valide
          console.log('Réinitialisation du champ location en mode création');
          setFormData(prev => ({ ...prev, location: '' }));
        }
      }
    } else {
      setFilteredCategories([]);
      setFilteredLocations([]);
      setFilteredUsers([]);
      
      // Ne pas réinitialiser location en mode édition
      if (!isEdit) {
        setFormData(prev => ({ ...prev, categoryId: '', location: '' }));
      } else {
        setFormData(prev => ({ ...prev, categoryId: '' }));
      }
    }
  }, [formData.hotelId, hotels, categories, locations, users, currentUserData, isEdit, incident]);

  const loadParameters = async () => {
    try {
      console.log('Chargement des paramètres...');
      const [allHotelsData, categoriesData, impactsData, statusesData, locationsData, resolutionTypesData, bookingOriginsData, satisfactionData, usersData] = await Promise.all([
        hotelsService.getHotels(),
        parametersService.getParameters('parameters_incident_category'),
        parametersService.getParameters('parameters_impact'),
        parametersService.getParameters('parameters_status'),
        parametersService.getParameters('parameters_location'),
        parametersService.getParameters('parameters_resolution_type'),
        parametersService.getParameters('parameters_booking_origin'),
        parametersService.getParameters('parameters_client_satisfaction'),
        usersService.getUsers(),
      ]);
      
      console.log('Paramètres chargés avec succès');
      console.log('Lieux disponibles:', locationsData.filter(p => p.active).length);
      
      // Trouver l'utilisateur connecté par son email
      const loggedInUser = usersData.find(user => user.email === currentUser?.email);
      console.log('Utilisateur connecté trouvé:', loggedInUser?.name || 'Non trouvé');
      setCurrentUserData(loggedInUser || null);

      // Filtrer les hôtels selon le rôle de l'utilisateur
      let accessibleHotels: Hotel[] = [];
      if (loggedInUser) {
        // Les administrateurs système ont accès à TOUS les hôtels
        if (loggedInUser.role === 'system_admin') {
          accessibleHotels = allHotelsData;
        } else if (loggedInUser.hotels) {
          // Autres utilisateurs : filtrer selon leurs hôtels assignés
          accessibleHotels = allHotelsData.filter(hotel => 
            loggedInUser.hotels?.includes(hotel.id) || false
          );
        }
      } else {
        // En cas d'erreur, afficher tous les hôtels
        accessibleHotels = allHotelsData;
      }

      console.log('Hôtels accessibles:', accessibleHotels.length);
      setHotels(accessibleHotels);
      setCategories(categoriesData.filter(p => p.active));
      setImpacts(impactsData.filter(p => p.active));
      setStatuses(statusesData.filter(p => p.active));
      setLocations(locationsData.filter(p => p.active));
      setResolutionTypes(resolutionTypesData.filter(p => p.active));
      setBookingOrigins(bookingOriginsData.filter(p => p.active));
      setSatisfactionTypes(satisfactionData.filter(p => p.active));
      setUsers(usersData.filter(u => u.active));
      
      // Ne pas définir les valeurs par défaut ici, c'est géré par un useEffect séparé

      return Promise.resolve(true);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      return Promise.resolve(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. La taille maximale est de 2MB.');
        return;
      }
      setFormData({ ...formData, incidentPhoto: file });
    } else {
      alert('Veuillez sélectionner une image (PNG, JPG) ou un fichier PDF.');
    }
  };

  // Fonction pour télécharger la photo vers Firebase Storage
  const uploadPhotoToStorage = async (file: File): Promise<string> => {
    try {
      // Créer un nom de fichier unique avec timestamp
      const timestamp = new Date().getTime();
      const fileName = `incidents/${formData.hotelId}/${timestamp}_${file.name}`;
      
      // Référence au fichier dans Firebase Storage
      const storageRef = ref(storage, fileName);
      
      // Télécharger le fichier
      const snapshot = await uploadBytes(storageRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Photo téléchargée avec succès:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors du téléchargement de la photo:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que l'utilisateur a accès à l'hôtel sélectionné
    if (!isSystemAdmin && !accessibleHotels.includes(formData.hotelId)) {
      alert('Vous n\'avez pas accès à cet hôtel.');
      return;
    }

    // Validation spécifique pour le statut clôturé (ID: 3ElZmcduy3R8NUd1kuzn)
    if (formData.statusId === '3ElZmcduy3R8NUd1kuzn') {
      const validationErrors = [];
      
      // Vérifier la description de résolution (minimum 10 caractères)
      if (!formData.resolutionDescription || formData.resolutionDescription.trim().length < 10) {
        validationErrors.push('La description de la résolution doit contenir au moins 10 caractères');
      }
      
      // Vérifier que "Conclu par" est renseigné
      if (!formData.concludedBy) {
        validationErrors.push('Le champ "Conclu par" doit être renseigné');
      }
      
      // Vérifier que la satisfaction client est renseignée
      if (!formData.clientSatisfactionId) {
        validationErrors.push('La satisfaction client doit être renseignée');
      }
      
      // Vérifier que le type de résolution est renseigné
      if (!formData.resolutionType) {
        validationErrors.push('Le type de résolution doit être renseigné');
      }
      
      // Si des erreurs de validation sont présentes, afficher le modal et arrêter la soumission
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors);
        setShowValidationModal(true);
        return;
      }
    }

    try {
      // Si une photo est sélectionnée, la télécharger d'abord
      let photoURL = formData.photoURL;
      if (formData.incidentPhoto) {
        // Afficher un indicateur de chargement ou désactiver le bouton de soumission ici
        photoURL = await uploadPhotoToStorage(formData.incidentPhoto);
      }
      
      // Transformer les données pour correspondre au type Incident
      const incidentData: Omit<Incident, 'id'> = {
        date: formData.date,
        time: formData.time,
        hotelId: formData.hotelId,
        location: formData.location, // Utiliser location conformément à la définition du type Incident
        categoryId: formData.categoryId,
        impactId: formData.impactId,
        description: formData.description,
        photoURL: photoURL, // Ajouter l'URL de la photo
        resolutionDescription: formData.resolutionDescription,
        resolutionType: formData.resolutionType,
        actualCost: formData.commercialGesture,
        clientSatisfactionId: formData.clientSatisfactionId,
        receivedById: formData.receivedById,
        assignedTo: formData.concludedBy,
        statusId: formData.statusId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        clientArrivalDate: formData.clientArrivalDate || undefined,
        clientDepartureDate: formData.clientDepartureDate || undefined,
        clientRoom: formData.clientRoom,
        clientReservation: formData.clientReservation,
        bookingAmount: formData.bookingAmount,
        bookingOrigin: formData.bookingOrigin,
        incidentMode: [], // Valeur par défaut
        estimatedCost: 0,
        priority: 'medium',
      };

      onSubmit(incidentData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'incident:', error);
      alert('Une erreur est survenue lors de la soumission de l\'incident. Veuillez réessayer.');
    }
  };

  if (!isOpen) return null;

  // Modal de validation personnalisé
  const ValidationModal = () => {
    if (!showValidationModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 shadow-xl">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-warm-900">Impossible de clôturer l'incident</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-warm-600 mb-3">Veuillez corriger les erreurs suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowValidationModal(false)}
              className="px-4 py-2 bg-creho-600 text-white rounded-lg hover:bg-creho-700 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ValidationModal />
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier l\'incident' : 'Nouvel Incident'}
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
            {isEdit ? 'Modifiez les détails de cet incident' : 'Créez un nouvel incident à traiter'}
          </p>

          {/* Message d'information si aucun hôtel accessible */}
          {hotels.length === 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-medium">Aucun hôtel accessible</p>
              <p className="text-orange-700 text-sm mt-1">
                Vous n'avez accès à aucun hôtel. Veuillez contacter votre administrateur pour vous assigner des hôtels.
              </p>
            </div>
          )}

          {/* Date et heure de l'incident */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Date et heure de l'incident *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={formData.date.toISOString().split('T')[0]}
                  onChange={(e) => {
                    // Validation pour éviter les dates invalides
                    try {
                      const dateValue = e.target.value;
                      if (!dateValue || dateValue === '0') {
                        // Si la valeur est vide ou "0", utiliser la date actuelle
                        setFormData({ ...formData, date: new Date() });
                      } else {
                        const newDate = new Date(dateValue);
                        // Vérifier si la date est valide
                        if (isNaN(newDate.getTime())) {
                          console.warn('Date invalide détectée:', dateValue);
                          // Utiliser la date actuelle en cas d'erreur
                          setFormData({ ...formData, date: new Date() });
                        } else {
                          setFormData({ ...formData, date: newDate });
                        }
                      }
                    } catch (error) {
                      console.error('Erreur lors de la conversion de la date:', error);
                      // Utiliser la date actuelle en cas d'erreur
                      setFormData({ ...formData, date: new Date() });
                    }
                  }}
                  className="pl-10 pr-4 py-2 w-full border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
                />
              </div>
              <div className="relative">
                <Clock className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={formData.time || defaultTime}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                />
              </div>
            </div>
          </div>

          {/* Hôtel et Lieu */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Hôtel *
              </label>
              <select
                required
                value={formData.hotelId}
                onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                disabled={hotels.length === 0}
                className="w-full px-3 py-2 border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500 disabled:bg-warm-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {hotels.length === 0 ? 'Aucun hôtel accessible' : 'Sélectionnez un hôtel'}
                </option>
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))}
              </select>
              {hotels.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Contactez votre administrateur pour accéder aux hôtels
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Lieu *
              </label>
              <select
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!formData.hotelId}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 disabled:bg-warm-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.hotelId ? 'Sélectionnez d\'abord un hôtel' : 'Sélectionnez un lieu'}
                </option>
                {filteredLocations.map(location => (
                  <option key={location.id} value={location.id}>{location.label}</option>
                ))}
              </select>
              {formData.hotelId && filteredLocations.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Aucun lieu configuré pour cet hôtel
                </p>
              )}
            </div>
          </div>

          {/* Catégorie et Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Catégorie *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={!formData.hotelId}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 disabled:bg-warm-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.hotelId ? 'Sélectionnez d\'abord un hôtel' : 'Sélectionnez une catégorie'}
                </option>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
              {formData.hotelId && filteredCategories.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Aucune catégorie configurée pour cet hôtel
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Impact *
              </label>
              <select
                required
                value={formData.impactId}
                onChange={(e) => setFormData({ ...formData, impactId: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="">Sélectionnez un impact</option>
                {impacts.map(impact => (
                  <option key={impact.id} value={impact.id}>{impact.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Décrivez l'incident en détail..."
            />
          </div>

          {/* Document ou photo de l'incident */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Document ou photo de l'incident
            </label>
            <div className="border-2 border-dashed border-warm-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handlePhotoChange}
                className="hidden"
                id="incident-photo"
              />
              {formData.incidentPhoto ? (
                <div>
                  {formData.incidentPhoto.type.includes('pdf') ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-creho-500 mx-auto mb-2" />
                      <p className="text-sm text-creho-600">{formData.incidentPhoto.name}</p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-8 h-8 text-creho-500 mx-auto mb-2" />
                      <p className="text-sm text-creho-600">{formData.incidentPhoto.name}</p>
                    </div>
                  )}
                </div>
              ) : formData.photoURL ? (
                <div>
                  {/* Document ou photo existant avec options */}
                  <div className="relative group">
                    {formData.photoURL.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-64 h-64 mx-auto mb-2 flex flex-col items-center justify-center bg-warm-100 rounded overflow-hidden">
                        <div className="w-full h-full">
                          <PdfPreview url={formData.photoURL} />
                        </div>
                        <div className="text-warm-500 text-xs absolute bottom-2 bg-white px-2 py-1 rounded-md">PDF</div>
                      </div>
                    ) : (
                      <img 
                        src={formData.photoURL} 
                        alt="Photo de l'incident" 
                        className="w-64 h-64 object-cover mx-auto mb-2 rounded" 
                      />
                    )}
                    
                    {/* Overlay avec options */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-2">
                        {/* Visualiser */}
                        <button
                          type="button" 
                          className="p-2 bg-white rounded-full hover:bg-warm-100 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (formData.photoURL.toLowerCase().endsWith('.pdf')) {
                              setFormData({...formData, showPdfViewer: true});
                            } else {
                              window.open(formData.photoURL, '_blank');
                            }
                          }}
                          title="Visualiser"
                        >
                          <ExternalLink size={16} className="text-warm-700" />
                        </button>
                        
                        {/* Télécharger */}
                        <a 
                          href={formData.photoURL} 
                          download
                          className="p-2 bg-white rounded-full hover:bg-warm-100 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title="Télécharger"
                        >
                          <Download size={16} className="text-warm-700" />
                        </a>
                        
                        {/* Modifier */}
                        <label 
                          htmlFor="incident-photo"
                          className="p-2 bg-white rounded-full hover:bg-warm-100 transition-colors cursor-pointer"
                          title="Remplacer"
                        >
                          <Edit size={16} className="text-warm-700" />
                        </label>
                        
                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => {
                            // Réinitialiser l'URL de la photo
                            setFormData({...formData, photoURL: ''});
                          }}
                          className="p-2 bg-white rounded-full hover:bg-warm-100 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-creho-600">Photo existante</p>
                  <p className="text-xs text-warm-500 mt-1">Survolez pour les options</p>
                </div>
              ) : (
                <label htmlFor="incident-photo" className="cursor-pointer">
                  <div>
                    <Upload className="w-8 h-8 text-warm-400 mx-auto mb-2" />
                    <p className="text-sm text-warm-600">Cliquez pour uploader ou glissez-déposez</p>
                    <p className="text-xs text-warm-500 mt-1">PNG, JPG, PDF (MAX. 2MB)</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Description de la résolution */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Description de la résolution
            </label>
            <textarea
              value={formData.resolutionDescription}
              onChange={(e) => setFormData({ ...formData, resolutionDescription: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Description de la résolution (optionnelle)"
            />
          </div>

          {/* Information de résolution */}
          <div>
            <h3 className="text-lg font-medium text-warm-900 mb-4">Information de résolution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Type de résolution
                </label>
                <select
                  value={formData.resolutionType}
                  onChange={(e) => setFormData({ ...formData, resolutionType: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                >
                  <option value="">Non spécifié</option>
                  {resolutionTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Montant geste commercial (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.commercialGesture}
                  onChange={(e) => setFormData({ ...formData, commercialGesture: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Satisfaction client */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Satisfaction client
            </label>
            <select
              value={formData.clientSatisfactionId}
              onChange={(e) => setFormData({ ...formData, clientSatisfactionId: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              <option value="">Non spécifié</option>
              {satisfactionTypes.map(satisfaction => (
                <option key={satisfaction.id} value={satisfaction.id}>{satisfaction.label}</option>
              ))}
            </select>
          </div>

          {/* Reçu par, Conclu par et Statut */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Reçu par *
              </label>
              <select
                required
                value={formData.receivedById}
                onChange={(e) => setFormData({ ...formData, receivedById: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                disabled={!formData.hotelId}
              >
                <option value="">Sélectionnez un utilisateur</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {formData.hotelId && filteredUsers.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Aucun utilisateur pour cet hôtel
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Conclu par
              </label>
              <select
                value={formData.concludedBy}
                onChange={(e) => setFormData({ ...formData, concludedBy: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="">En Attente</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Statut *
              </label>
              <select
                required
                value={formData.statusId}
                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Informations Client */}
          <div className="border-t border-warm-200 pt-6">
            <h3 className="text-lg font-medium text-warm-900 mb-4">Informations Client</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Date d'arrivée
                </label>
                <input
                  type="date"
                  value={formData.clientArrivalDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    clientArrivalDate: e.target.value ? new Date(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Date de départ
                </label>
                <input
                  type="date"
                  value={formData.clientDepartureDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    clientDepartureDate: e.target.value ? new Date(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Chambre
                </label>
                <input
                  type="text"
                  value={formData.clientRoom}
                  onChange={(e) => setFormData({ ...formData, clientRoom: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Réservation
                </label>
                <input
                  type="text"
                  value={formData.clientReservation}
                  onChange={(e) => setFormData({ ...formData, clientReservation: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="Numéro de réservation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Montant réservation (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bookingAmount}
                  onChange={(e) => setFormData({ ...formData, bookingAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Origine réservation
                </label>
                <select
                  value={formData.bookingOrigin}
                  onChange={(e) => setFormData({ ...formData, bookingOrigin: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                >
                  <option value="">Non spécifié</option>
                  {bookingOrigins.map(origin => (
                    <option key={origin.id} value={origin.id}>{origin.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Modal de visualisation PDF */}
          {formData.showPdfViewer && formData.photoURL && formData.photoURL.toLowerCase().endsWith('.pdf') && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-warm-200">
                  <h3 className="font-medium">Visualisation du document</h3>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, showPdfViewer: false})}
                    className="p-1 hover:bg-warm-100 rounded-full"
                  >
                    <X size={18} className="text-warm-500" />
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <div className="w-full h-full">
                    <PdfViewer 
                      url={formData.photoURL} 
                      onClose={() => setFormData({...formData, showPdfViewer: false})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-warm-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-warm-700 bg-warm-100 hover:bg-warm-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={hotels.length === 0}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${hotels.length === 0 ? 'bg-warm-300 cursor-not-allowed' : 'bg-creho-600 hover:bg-creho-700'}`}
            >
              {isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}