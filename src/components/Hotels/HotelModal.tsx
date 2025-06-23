import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Hotel } from '../../types/parameters';

interface HotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hotel: Omit<Hotel, 'id'>) => void;
  hotel?: Hotel | null;
  isEdit?: boolean;
}

export default function HotelModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  hotel, 
  isEdit = false 
}: HotelModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    country: 'France',
    imageUrl: '',
    active: true,
    incidentCategories: [] as string[],
    locations: [] as string[]
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name,
        code: hotel.code || '',
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        imageUrl: hotel.imageUrl || '',
        active: hotel.active,
        incidentCategories: hotel.incidentCategories || [],
        locations: hotel.locations || []
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        country: 'France',
        imageUrl: '',
        active: true,
        incidentCategories: [],
        locations: []
      });
    }
  }, [hotel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier l\'hôtel' : 'Ajouter un nouvel hôtel'}
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
            {isEdit ? 'Modifiez les informations de l\'hôtel' : 'Créez un nouvel hôtel dans le système'}
          </p>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Nom de l'hôtel *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
              placeholder="Hotel de France"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Adresse *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="35 AVENUE DU 8 SEPTEMBRE 1944"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="21200 Beaune"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Pays *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="France"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              URL de l'image
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-warm-500 mt-1">URL d'une image représentative de l'hôtel (optionnel)</p>
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
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              {isEdit ? 'Enregistrer les modifications' : 'Créer l\'hôtel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}