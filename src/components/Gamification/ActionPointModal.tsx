import React, { useState, useEffect } from 'react';
import { X, Zap, Hotel } from 'lucide-react';
import { ActionPoint, Hotel as HotelType } from '../../types/gamification';
import { hotelsService } from '../../services/firebase/hotelsService';

interface ActionPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionPoint: Omit<ActionPoint, 'id'>) => void;
  actionPoint?: ActionPoint | null;
  isEdit?: boolean;
}

const categories = [
  { value: 'general', label: 'Général', icon: '⚡' },
  { value: 'incidents', label: 'Incidents', icon: '⚠️' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'quality', label: 'Qualité', icon: '✅' },
  { value: 'objects', label: 'Objets Trouvés', icon: '📦' },
  { value: 'procedures', label: 'Procédures', icon: '📋' },
];

export default function ActionPointModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  actionPoint, 
  isEdit = false 
}: ActionPointModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general' as ActionPoint['category'],
    points: 5,
    active: true,
    hotels: [] as string[]
  });
  const [hotels, setHotels] = useState<HotelType[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHotels();
      if (actionPoint) {
        setFormData({
          name: actionPoint.name,
          description: actionPoint.description,
          category: actionPoint.category,
          points: actionPoint.points,
          active: actionPoint.active,
          hotels: actionPoint.hotels || []
        });
      } else {
        setFormData({
          name: '',
          description: '',
          category: 'general',
          points: 5,
          active: true,
          hotels: []
        });
      }
    }
  }, [isOpen, actionPoint]);

  const loadHotels = async () => {
    try {
      const data = await hotelsService.getHotels();
      setHotels(data);
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const toggleHotel = (hotelId: string) => {
    setFormData(prev => ({
      ...prev,
      hotels: prev.hotels.includes(hotelId)
        ? prev.hotels.filter(id => id !== hotelId)
        : [...prev.hotels, hotelId]
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const selectedCategory = categories.find(c => c.value === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier l\'action' : 'Ajouter une action'}
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
            {isEdit ? 'Modifiez les points XP attribués pour cette action' : 'Configurez les points XP attribués pour chaque action dans le système'}
          </p>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Action *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="Première connexion du jour"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Description de l'action..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ActionPoint['category'] })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              required
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Points XP *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="w-full px-3 py-2 pr-10 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Zap className="w-4 h-4 text-creho-500" />
              </div>
            </div>
            <p className="text-xs text-warm-500 mt-1">
              Valeur entre 1 et 100 points. 
              {formData.points > 50 && <span className="text-orange-600 ml-1">⚠️ Valeur élevée</span>}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Hôtels concernés
            </label>
            <div className="max-h-32 overflow-y-auto border border-warm-300 rounded-lg p-3 space-y-2">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Hotel className="w-4 h-4 text-warm-400 mr-2" />
                    <span className="text-sm text-warm-700">{hotel.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleHotel(hotel.id)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      formData.hotels.includes(hotel.id) 
                        ? 'bg-creho-500' 
                        : 'bg-warm-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      formData.hotels.includes(hotel.id) 
                        ? 'translate-x-7' 
                        : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-warm-500 mt-1">
              Les points XP sont attribués automatiquement lorsque les utilisateurs effectuent des actions dans le système.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-warm-700">
              Actif
            </label>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-8 h-4 rounded-full ${formData.active ? 'bg-green-500' : 'bg-warm-300'} relative transition-colors`}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${formData.active ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                </div>
              </label>
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
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              {isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}