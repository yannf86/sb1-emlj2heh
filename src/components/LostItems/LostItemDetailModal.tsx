import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { LostItem } from '../../types/lostItems';
import { storage } from '../../lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface LostItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lostItem: LostItem | null;
  getHotelName: (id: string) => string;
  getLocationLabel: (id: string) => string;
  getItemTypeLabel: (id: string) => string;
  getUserName: (id: string) => string;
  formatDate: (date: Date | null) => string;
}

export default function LostItemDetailModal({
  isOpen,
  onClose,
  lostItem,
  getHotelName,
  getLocationLabel,
  getItemTypeLabel,
  getUserName,
  formatDate
}: LostItemDetailModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && lostItem?.photoUrl) {
      setImageLoading(true);
      setImageError(false);
      
      // Récupérer l'URL directe depuis Firebase Storage
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
    } else {
      setImageUrl('');
    }
  }, [isOpen, lostItem]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Erreur de chargement de l\'image:', e);
    setImageError(true);
    // Utiliser une image par défaut
    e.currentTarget.src = '/assets/images/placeholder-image.png';
  };

  if (!isOpen || !lostItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            Détails de l'objet trouvé
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="text-lg font-medium text-warm-900 mb-4">Informations générales</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-warm-500 w-32">Date de découverte:</span>
                    <span className="text-warm-900 font-medium">{formatDate(lostItem.discoveryDate)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-warm-500 w-32">Date de création:</span>
                    <span className="text-warm-900 font-medium">{formatDate(lostItem.createdAt)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-warm-500 w-32">Hôtel:</span>
                    <span className="text-warm-900 font-medium">{getHotelName(lostItem.hotelId)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-warm-500 w-32">Lieu:</span>
                    <span className="text-warm-900 font-medium">{getLocationLabel(lostItem.locationId)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-warm-500 w-32">Type d'objet:</span>
                    <span className="text-warm-900 font-medium">{getItemTypeLabel(lostItem.itemTypeId)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-warm-500 w-32">Description:</span>
                    <span className="text-warm-900 font-medium">{lostItem.description}</span>
                  </div>
                  <div className="flex">
                    <span className="text-warm-500 w-32">Statut:</span>
                    <span className={`text-warm-900 font-medium px-2 py-1 rounded-full ${
                      lostItem.status === 'found' ? 'bg-yellow-100 text-yellow-800' : 
                      lostItem.status === 'returned' ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lostItem.status === 'found' ? 'Trouvé' : 
                       lostItem.status === 'returned' ? 'Rendu' : 
                       'Autre'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations de retour si l'objet a été rendu */}
              {lostItem.status === 'returned' && (
                <div>
                  <h3 className="text-lg font-medium text-warm-900 mb-4">Informations de retour</h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="text-warm-500 w-32">Date de retour:</span>
                      <span className="text-warm-900 font-medium">{formatDate(lostItem.returnedDate)}</span>
                    </div>
                    <div className="flex">
                      <span className="text-warm-500 w-32">Rendu par:</span>
                      <span className="text-warm-900 font-medium">{getUserName(lostItem.returnedById || '')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-warm-500 mb-1">Notes:</span>
                      <p className="text-warm-900 bg-warm-50 p-3 rounded-lg">
                        {lostItem.returnedNotes || 'Aucune note'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              {/* Photo */}
              {lostItem.photoUrl && (
                <div>
                  <h3 className="text-lg font-medium text-warm-900 mb-4">Photo</h3>
                  <div className="border border-warm-200 rounded-lg overflow-hidden p-2 bg-white">
                    {imageLoading ? (
                      <div className="flex items-center justify-center h-64">
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
                      <div className="flex flex-col items-center justify-center h-64 bg-warm-50 text-warm-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>Impossible de charger l'image</p>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img 
                          src={imageUrl} 
                          alt={lostItem.description || 'Photo de l\'objet trouvé'} 
                          className="w-full h-auto max-h-64 object-contain mx-auto"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
