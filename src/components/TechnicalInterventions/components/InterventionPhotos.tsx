import React, { useState, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface InterventionPhotosProps {
  beforePhoto: File | null;
  afterPhoto: File | null;
  onPhotoChange: (type: 'before' | 'after', file: File | null) => void;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}

export default function InterventionPhotos({
  beforePhoto,
  afterPhoto,
  onPhotoChange,
  beforePhotoUrl,
  afterPhotoUrl
}: InterventionPhotosProps) {
  // États locaux pour suivre si une photo a été remplacée
  const [beforePhotoReplaced, setBeforePhotoReplaced] = useState(false);
  const [afterPhotoReplaced, setAfterPhotoReplaced] = useState(false);
  
  // Réinitialiser les états de remplacement lorsque le modal est ouvert/fermé
  useEffect(() => {
    setBeforePhotoReplaced(false);
    setAfterPhotoReplaced(false);
  }, [beforePhotoUrl, afterPhotoUrl]);

  const handleFileChange = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Marquer la photo comme remplacée
      if (type === 'before') {
        setBeforePhotoReplaced(true);
      } else {
        setAfterPhotoReplaced(true);
      }
    }
    onPhotoChange(type, file);
  };
  
  // Fonction pour annuler le remplacement d'une photo
  const handleCancelReplacement = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhotoReplaced(false);
      onPhotoChange(type, null);
    } else {
      setAfterPhotoReplaced(false);
      onPhotoChange(type, null);
    }
  };

  const PhotoUploadBox = ({ 
    type, 
    photo, 
    photoUrl,
    label,
    isReplaced
  }: { 
    type: 'before' | 'after'; 
    photo: File | null; 
    photoUrl?: string;
    label: string;
    isReplaced: boolean;
  }) => (
    <div>
      <label className="block text-xs text-warm-600 mb-2">{label}</label>
      <div className="border-2 border-dashed border-warm-300 rounded-lg p-4 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(type, e)}
          className="hidden"
          id={`${type}-photo`}
        />
        {/* Afficher la nouvelle photo si elle a été remplacée */}
        {isReplaced && photo ? (
          <div className="relative">
            <img 
              src={URL.createObjectURL(photo)} 
              alt={`Nouvelle photo ${type}`} 
              className="w-full h-32 object-cover rounded-lg" 
            />
            <div className="absolute top-2 right-2">
              <button 
                type="button"
                onClick={() => handleCancelReplacement(type)}
                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Nouvelle photo
            </div>
          </div>
        ) : photoUrl ? (
          <div className="relative">
            <img 
              src={photoUrl} 
              alt={`Photo ${type}`} 
              className="w-full h-32 object-cover rounded-lg" 
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <label htmlFor={`${type}-photo`} className="cursor-pointer text-white text-xs p-2 bg-creho-500 rounded-md">
                Remplacer
              </label>
            </div>
          </div>
        ) : (
          <label htmlFor={`${type}-photo`} className="cursor-pointer">
            {photo ? (
              <div>
                <Camera className="w-6 h-6 text-creho-500 mx-auto mb-2" />
                <p className="text-xs text-creho-600">{photo.name}</p>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-warm-400 mx-auto mb-2" />
                <p className="text-xs text-warm-600">Cliquez pour uploader</p>
              </div>
            )}
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-warm-700 mb-2">
        Photos
      </label>
      <div className="grid grid-cols-2 gap-4">
        <PhotoUploadBox 
          type="before" 
          photo={beforePhoto}
          photoUrl={beforePhotoUrl}
          label="Photo avant"
          isReplaced={beforePhotoReplaced}
        />
        <PhotoUploadBox 
          type="after" 
          photo={afterPhoto}
          photoUrl={afterPhotoUrl}
          label="Photo après"
          isReplaced={afterPhotoReplaced}
        />
      </div>
    </div>
  );
}