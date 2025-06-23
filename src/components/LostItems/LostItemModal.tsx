import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, Clock, Camera, Trash2, ExternalLink, Download } from 'lucide-react';
import { LostItem } from '../../types/lostItems';
import { Parameter, Hotel } from '../../types/parameters';
import { User } from '../../types/users';
import { parametersService } from '../../services/firebase/parametersService';
import { hotelsService } from '../../services/firebase/hotelsService';
import { usersService } from '../../services/firebase/usersService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { storage } from '../../lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface LostItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lostItem: Omit<LostItem, 'id'>, photo?: File) => void;
  lostItem?: LostItem | null;
  isEdit?: boolean;
}

export default function LostItemModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  lostItem, 
  isEdit = false 
}: LostItemModalProps) {
  const { currentUser } = useAuth();
  const { userData, accessibleHotels, isSystemAdmin } = useUserPermissions();
  const [formData, setFormData] = useState({
    discoveryDate: new Date(),
    discoveryTime: '',
    hotelId: '',
    locationId: '',
    itemTypeId: '',
    description: '',
    foundById: '',
    storageLocation: '',
    status: 'conserved' as 'conserved' | 'returned',
    returnedById: '',
    returnedDate: undefined as Date | undefined,
    returnedNotes: '',
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [itemTypes, setItemTypes] = useState<Parameter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Parameter[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [deletePhoto, setDeletePhoto] = useState<boolean>(false);

  // Fonction pour obtenir la date et l'heure actuelles
  const getCurrentDateTime = () => {
    const now = new Date();
    // Format de l'heure HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    return { now, currentTime };
  };
  
  useEffect(() => {
    if (isOpen) {
      loadParameters();
      if (lostItem) {
        setFormData({
          discoveryDate: lostItem.discoveryDate,
          discoveryTime: lostItem.discoveryTime,
          hotelId: lostItem.hotelId,
          locationId: lostItem.locationId,
          itemTypeId: lostItem.itemTypeId,
          description: lostItem.description,
          foundById: lostItem.foundById,
          storageLocation: lostItem.storageLocation,
          status: lostItem.status,
          returnedById: lostItem.returnedById || '',
          returnedDate: lostItem.returnedDate,
          returnedNotes: lostItem.returnedNotes || '',
        });
        
        // Récupérer l'URL directe de l'image si disponible
        if (lostItem.photoUrl) {
          setImageLoading(true);
          setImageError(false);
          
          try {
            const photoRef = ref(storage, lostItem.photoUrl);
            getDownloadURL(photoRef)
              .then(url => {
                console.log('URL directe récupérée avec succès:', url);
                setImageUrl(url);
                setImageLoading(false);
              })
              .catch(error => {
                console.error('Erreur lors de la récupération de l\'URL directe:', error);
                setImageError(true);
                setImageLoading(false);
              });
          } catch (error) {
            console.error('Erreur lors de la création de la référence:', error);
            setImageError(true);
            setImageLoading(false);
          }
        }
      } else {
        // Toujours utiliser la date et l'heure actuelles pour un nouvel objet
        const { now, currentTime } = getCurrentDateTime();
        console.log('Initialisation avec la date actuelle:', now.toLocaleDateString('fr-FR'), currentTime);
        
        setFormData({
          discoveryDate: now,
          discoveryTime: currentTime,
          hotelId: '',
          locationId: '',
          itemTypeId: '',
          description: '',
          foundById: '',
          storageLocation: '',
          status: 'conserved',
          returnedById: '',
          returnedDate: undefined,
          returnedNotes: '',
        });
      }
      setPhoto(null);
    }
  }, [isOpen, lostItem]);

  // Filter locations and users when hotel changes
  useEffect(() => {
    if (formData.hotelId) {
      const selectedHotel = hotels.find(h => h.id === formData.hotelId);
      if (selectedHotel) {
        // Filtrer les lieux disponibles pour cet hôtel
        const availableLocations = locations.filter(loc => 
          selectedHotel.locations?.includes(loc.id) || false
        );
        
        // Trier les lieux par ordre alphabétique
        const sortedLocations = [...availableLocations].sort((a, b) => 
          a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
        );
        
        setFilteredLocations(sortedLocations);

        if (formData.locationId && !availableLocations.find(l => l.id === formData.locationId)) {
          setFormData(prev => ({ ...prev, locationId: '' }));
        }
        
        // Filtrer les utilisateurs qui ont accès à cet hôtel
        const hotelUsers = users.filter(user => 
          // Les administrateurs système ont accès à tous les hôtels
          user.role === 'system_admin' || 
          // Les autres utilisateurs doivent avoir l'hôtel dans leur liste
          user.hotels.includes(formData.hotelId)
        );
        setFilteredUsers(hotelUsers);
        
        // Réinitialiser les champs d'utilisateur si nécessaire
        if (formData.foundById && !hotelUsers.find(u => u.id === formData.foundById)) {
          setFormData(prev => ({ ...prev, foundById: '' }));
        }
        if (formData.returnedById && !hotelUsers.find(u => u.id === formData.returnedById)) {
          setFormData(prev => ({ ...prev, returnedById: '' }));
        }
      }
    } else {
      setFilteredLocations([]);
      setFilteredUsers([]);
      setFormData(prev => ({ 
        ...prev, 
        locationId: '',
        foundById: '',
        returnedById: ''
      }));
    }
  }, [formData.hotelId, hotels, locations, users]);

  // Reset returnedById when status changes to conserved
  useEffect(() => {
    if (formData.status === 'conserved') {
      setFormData(prev => ({ 
        ...prev, 
        returnedById: '',
        returnedDate: undefined,
        returnedNotes: ''
      }));
    } else if (formData.status === 'returned' && !formData.returnedDate) {
      setFormData(prev => ({ 
        ...prev, 
        returnedDate: new Date()
      }));
    }
  }, [formData.status]);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const [
        hotelsData, 
        locationsData, 
        itemTypesData, 
        usersData
      ] = await Promise.all([
        hotelsService.getHotels(),
        parametersService.getParameters('parameters_location'),
        parametersService.getParameters('parameters_lost_item_type'),
        usersService.getUsers(),
      ]);
      
      // Filtrer les hôtels accessibles à l'utilisateur
      let filteredHotels = hotelsData;
      if (!isSystemAdmin && userData) {
        // Si l'utilisateur n'est pas admin système, filtrer selon ses accès
        filteredHotels = hotelsData.filter(hotel => 
          userData.hotels.includes(hotel.id)
        );
        console.log(`[LostItemModal] Filtrage des hôtels pour l'utilisateur: ${userData.hotels.length} hôtels accessibles sur ${hotelsData.length}`);
      }
      
      // Trier les hôtels par ordre alphabétique
      const sortedHotels = [...filteredHotels].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      
      // Trier les lieux par ordre alphabétique
      const activeLocations = locationsData.filter(p => p.active);
      const sortedLocations = [...activeLocations].sort((a, b) => 
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
      );
      
      // Trier les types d'objets par ordre alphabétique
      const activeItemTypes = itemTypesData.filter(p => p.active);
      const sortedItemTypes = [...activeItemTypes].sort((a, b) => 
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
      );
      
      // Trier les utilisateurs par ordre alphabétique
      const activeUsers = usersData.filter(u => u.active);
      const sortedUsers = [...activeUsers].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      
      setHotels(sortedHotels);
      setLocations(sortedLocations);
      setItemTypes(sortedItemTypes);
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      
      // Prévisualiser l'image sélectionnée
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setImageError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Erreur de chargement de l\'image:', e);
    setImageError(true);
    // Utiliser une image par défaut
    e.currentTarget.src = '/assets/images/placeholder-image.png';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.status === 'returned' && !formData.returnedById) {
      alert('Veuillez sélectionner qui a rendu l\'objet.');
      return;
    }
    
    // Toujours utiliser la date actuelle pour createdAt et updatedAt
    const now = new Date();
    console.log('Date de soumission:', now.toLocaleDateString('fr-FR'), now.toLocaleTimeString('fr-FR'));
    
    const lostItemData: Omit<LostItem, 'id'> = {
      ...formData,
      // Si c'est un nouvel objet, mettre à jour la date de découverte avec la date actuelle
      discoveryDate: !isEdit ? now : formData.discoveryDate,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.uid || 'unknown'
    };

    onSubmit(lostItemData, photo, deletePhoto);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier l\'objet trouvé' : 'Nouvel Objet Trouvé'}
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
            {isEdit ? 'Modifiez les détails de cet objet trouvé' : 'Enregistrer un nouvel objet trouvé'}
          </p>

          {/* Date et heure de découverte */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Date et heure de découverte *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={formData.discoveryDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    // Validation pour éviter les dates invalides
                    try {
                      const dateValue = e.target.value;
                      if (!dateValue || dateValue === '0') {
                        // Si la valeur est vide ou "0", utiliser la date actuelle
                        setFormData({ ...formData, discoveryDate: new Date() });
                      } else {
                        const newDate = new Date(dateValue);
                        // Vérifier si la date est valide
                        if (isNaN(newDate.getTime())) {
                          console.warn('Date invalide détectée:', dateValue);
                          // Utiliser la date actuelle en cas d'erreur
                          setFormData({ ...formData, discoveryDate: new Date() });
                        } else {
                          setFormData({ ...formData, discoveryDate: newDate });
                        }
                      }
                    } catch (error) {
                      console.error('Erreur lors de la conversion de la date:', error);
                      // Utiliser la date actuelle en cas d'erreur
                      setFormData({ ...formData, discoveryDate: new Date() });
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
                  value={formData.discoveryTime}
                  onChange={(e) => setFormData({ ...formData, discoveryTime: e.target.value })}
                  className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                />
              </div>
            </div>
          </div>

          {/* Hôtel et Lieu de découverte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Hôtel *
              </label>
              <select
                required
                value={formData.hotelId}
                onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                className="w-full px-3 py-2 border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
              >
                <option value="">Sélectionnez un hôtel</option>
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Lieu de découverte *
              </label>
              <select
                required
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
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
            </div>
          </div>

          {/* Type d'objet et Trouvé par */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Type d'objet *
              </label>
              <select
                required
                value={formData.itemTypeId}
                onChange={(e) => setFormData({ ...formData, itemTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="">Sélectionnez un type d'objet</option>
                {itemTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Trouvé par *
              </label>
              <select
                required
                value={formData.foundById}
                onChange={(e) => setFormData({ ...formData, foundById: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                disabled={!formData.hotelId}
              >
                <option value="">
                  {!formData.hotelId ? "Sélectionnez d'abord un hôtel" : "Sélectionnez un utilisateur"}
                </option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description de l'objet */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Description de l'objet *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Décrivez l'objet trouvé de façon détaillée..."
            />
          </div>

          {/* Lieu de stockage et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Lieu de stockage *
              </label>
              <input
                type="text"
                required
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="Indiquez où l'objet est stocké"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Statut *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'conserved' | 'returned' })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="conserved">Conservé</option>
                <option value="returned">Rendu</option>
              </select>
            </div>
          </div>

          {/* Rendu par (conditionnel) */}
          {formData.status === 'returned' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-green-900">Informations de restitution</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Rendu par *
                  </label>
                  <select
                    required={formData.status === 'returned'}
                    value={formData.returnedById}
                    onChange={(e) => setFormData({ ...formData, returnedById: e.target.value })}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!formData.hotelId}
                  >
                    <option value="">
                      {!formData.hotelId ? "Sélectionnez d'abord un hôtel" : "Sélectionnez un utilisateur"}
                    </option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-green-600 mt-1">
                    Ce champ est obligatoire uniquement si l'objet est rendu
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Date de restitution
                  </label>
                  <input
                    type="date"
                    value={formData.returnedDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      returnedDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Notes de restitution
                </label>
                <textarea
                  value={formData.returnedNotes}
                  onChange={(e) => setFormData({ ...formData, returnedNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Notes sur la restitution de l'objet..."
                />
              </div>
            </div>
          )}

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Photo
            </label>
            <div className="border-2 border-dashed border-warm-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="lost-item-photo"
              />
              {photo ? (
                <div>
                  <div className="mb-2 bg-white p-4 rounded-lg shadow-sm">
                    <img 
                      src={imageUrl} 
                      alt="Aperçu de la photo" 
                      className="max-h-48 mx-auto rounded-lg object-contain"
                      onError={handleImageError}
                    />
                  </div>
                  <p className="text-sm text-creho-600">{photo.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setImageUrl('');
                    }}
                    className="mt-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Supprimer
                  </button>
                </div>
              ) : lostItem?.photoUrl ? (
                <div>
                  <div className="mb-2 bg-white p-4 rounded-lg shadow-sm">
                    {imageLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-warm-200 h-10 w-10"></div>
                          <div className="flex-1 space-y-6 py-1">
                            <div className="h-2 bg-warm-200 rounded"></div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="h-2 bg-warm-200 rounded col-span-2"></div>
                                <div className="h-2 bg-warm-200 rounded col-span-1"></div>
                              </div>
                              <div className="h-2 bg-warm-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : imageError ? (
                      <div className="flex flex-col items-center justify-center h-48 bg-warm-50 text-warm-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>Impossible de charger l'image</p>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img 
                          src={imageUrl} 
                          alt="Photo de l'objet" 
                          className="max-h-48 mx-auto rounded-lg object-contain"
                          onError={handleImageError}
                        />
                        
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
                                window.open(imageUrl, '_blank');
                              }}
                              title="Visualiser"
                            >
                              <ExternalLink size={16} className="text-warm-700" />
                            </button>
                            
                            {/* Télécharger */}
                            <a 
                              href={imageUrl} 
                              download
                              className="p-2 bg-white rounded-full hover:bg-warm-100 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="Télécharger"
                            >
                              <Download size={16} className="text-warm-700" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-creho-600">Photo existante</p>
                  <div className="flex space-x-2 justify-center mt-2">
                    <label
                      htmlFor="lost-item-photo"
                      className="inline-block px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 cursor-pointer transition-colors"
                    >
                      Remplacer
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Voulez-vous supprimer cette photo?')) {
                          setDeletePhoto(true);
                          setImageUrl('');
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-warm-400 mx-auto mb-2" />
                  <p className="text-sm text-warm-500">Cliquez pour ajouter une photo</p>
                  <label
                    htmlFor="lost-item-photo"
                    className="mt-2 inline-block px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 cursor-pointer transition-colors"
                  >
                    Parcourir
                  </label>
                </div>
              )}
            </div>
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Enregistrer les modifications' : 'Créer l\'objet trouvé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}