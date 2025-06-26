import React, { useState, useEffect } from 'react';
import { X, Hotel } from 'lucide-react';
import { Parameter } from '../../types/parameters';
import { parametersService } from '../../services/firebase/parametersService';

interface HotelLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (locationIds: string[]) => void;
  hotelName: string;
  selectedLocations: string[];
}

export default function HotelLocationsModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  hotelName,
  selectedLocations 
}: HotelLocationsModalProps) {
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedLocations);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      setSelectedIds(selectedLocations);
    }
  }, [isOpen, selectedLocations]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await parametersService.getParameters('parameters_location');
      // Filtrer les lieux actifs
      const activeLocations = data.filter(loc => loc.active);
      
      // Trier les lieux par ordre numérique puis alphabétique
      const sortedLocations = [...activeLocations].sort((a, b) => {
        // Vérifier si les deux labels sont des nombres
        const aNum = parseInt(a.label);
        const bNum = parseInt(b.label);
        
        // Si les deux sont des nombres valides, comparer numériquement
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        // Si seulement a est un nombre, a vient en premier
        else if (!isNaN(aNum)) {
          return -1;
        }
        // Si seulement b est un nombre, b vient en premier
        else if (!isNaN(bNum)) {
          return 1;
        }
        // Sinon, tri alphabétique standard
        return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
      });
      
      setLocations(sortedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setSelectedIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            Gérer les lieux
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-warm-600 mb-4">
            Sélectionnez les lieux disponibles pour cet hôtel
          </p>

          <div className="bg-creho-50 border border-creho-200 rounded-lg p-3 mb-6">
            <div className="flex items-center">
              <Hotel className="w-5 h-5 text-creho-600 mr-2" />
              <span className="font-semibold text-creho-900">{hotelName}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-warm-700">
                      {location.label}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleLocation(location.id)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      selectedIds.includes(location.id) 
                        ? 'bg-creho-500' 
                        : 'bg-warm-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      selectedIds.includes(location.id) 
                        ? 'translate-x-7' 
                        : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-3 p-6 border-t border-warm-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}