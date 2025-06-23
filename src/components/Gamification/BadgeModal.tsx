import React, { useState, useEffect } from 'react';
import { X, Award, Hotel } from 'lucide-react';
import { Badge, Hotel as HotelType } from '../../types/gamification';
import { hotelsService } from '../../services/firebase/hotelsService';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (badge: Omit<Badge, 'id'>) => void;
  badge?: Badge | null;
  isEdit?: boolean;
}

const categories = [
  { value: 'incidents', label: 'Incidents', icon: '⚠️' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'quality', label: 'Qualité', icon: '✅' },
  { value: 'objects', label: 'Objets Trouvés', icon: '📦' },
  { value: 'procedures', label: 'Procédures', icon: '📋' },
  { value: 'general', label: 'Général', icon: '⚡' },
  { value: 'special', label: 'Spéciaux', icon: '🌟' },
];

const badgeColors = [
  { value: 'bronze', label: 'Bronze', color: '#CD7F32' },
  { value: 'silver', label: 'Argent', color: '#C0C0C0' },
  { value: 'gold', label: 'Or', color: '#FFD700' },
];

const predefinedIcons = [
  '🥉', '🥈', '🥇', '🏆', '🎖️', '🌟', '⭐', '💫', '🎯', '🚀',
  '🔥', '💎', '👑', '🦄', '⚡', '🌞', '🎪', '🎭', '🎨', '🎵'
];

export default function BadgeModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  badge, 
  isEdit = false 
}: BadgeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general' as Badge['category'],
    icon: '🏆',
    color: 'bronze' as Badge['color'],
    condition: '',
    active: true,
    hotels: [] as string[]
  });
  const [hotels, setHotels] = useState<HotelType[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHotels();
      if (badge) {
        setFormData({
          name: badge.name,
          description: badge.description,
          category: badge.category,
          icon: badge.icon,
          color: badge.color,
          condition: badge.condition,
          active: badge.active,
          hotels: badge.hotels || []
        });
      } else {
        setFormData({
          name: '',
          description: '',
          category: 'general',
          icon: '🏆',
          color: 'bronze',
          condition: '',
          active: true,
          hotels: []
        });
      }
    }
  }, [isOpen, badge]);

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
  const selectedColor = badgeColors.find(c => c.value === formData.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier le badge' : 'Ajouter un badge'}
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
            {isEdit ? 'Modifiez ce badge qui peut être débloqué par les utilisateurs' : 'Gérer les badges qui peuvent être débloqués par les utilisateurs'}
          </p>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Nom du badge *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="Premiers Pas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="S'est connecté pour la première fois"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Badge['category'] })}
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
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Icône du badge *
            </label>
            <div className="grid grid-cols-10 gap-2">
              {predefinedIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-2 text-lg border rounded-lg hover:bg-warm-50 ${
                    formData.icon === icon ? 'border-creho-500 bg-creho-50' : 'border-warm-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Couleur du badge *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {badgeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value as Badge['color'] })}
                  className={`p-3 border rounded-lg hover:bg-warm-50 ${
                    formData.color === color.value ? 'border-creho-500 bg-creho-50' : 'border-warm-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    <span className="text-sm font-medium">{color.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-warm-600">Aperçu:</span>
              <div 
                className="flex items-center px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: selectedColor?.color }}
              >
                {formData.icon} {formData.name}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Condition d'obtention *
            </label>
            <input
              type="text"
              required
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="A reçu 10 remerciements"
            />
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
              Les badges sont débloqués automatiquement lorsque les utilisateurs remplissent les conditions associées.
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