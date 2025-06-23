import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { ExperienceLevel } from '../../types/gamification';

interface ExperienceLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (level: Omit<ExperienceLevel, 'id'>) => void;
  level?: ExperienceLevel | null;
  isEdit?: boolean;
}

const predefinedColors = [
  '#9CA3AF', '#6B7280', '#4B5563', '#10B981', '#059669', '#047857',
  '#3B82F6', '#2563EB', '#1D4ED8', '#8B5CF6', '#7C3AED', '#6D28D9',
  '#F59E0B', '#D97706', '#B45309', '#EF4444', '#DC2626', '#B91C1C',
  '#EC4899', '#DB2777', '#BE185D', '#14B8A6', '#0D9488', '#0F766E',
  '#F97316', '#EA580C', '#C2410C', '#84CC16', '#65A30D', '#4D7C0F',
  '#D4AF37', '#B8860B', '#996515'
];

const predefinedBadges = [
  '🥉', '🥈', '🥇', '🌱', '🌿', '🍀', '💎', '🔮', '⭐', '🔥',
  '👑', '🌟', '⚡', '🏆', '🎖️', '🌞', '🦄', '🎯', '🚀', '💫'
];

export default function ExperienceLevelModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  level, 
  isEdit = false 
}: ExperienceLevelModalProps) {
  const [formData, setFormData] = useState({
    level: 1,
    name: '',
    minXP: 0,
    maxXP: 99,
    badge: '🥉',
    color: '#9CA3AF',
    description: '',
    active: true,
    order: 1
  });

  useEffect(() => {
    if (level) {
      setFormData({
        level: level.level,
        name: level.name,
        minXP: level.minXP,
        maxXP: level.maxXP,
        badge: level.badge,
        color: level.color,
        description: level.description || '',
        active: level.active,
        order: level.order
      });
    } else {
      setFormData({
        level: 1,
        name: '',
        minXP: 0,
        maxXP: 99,
        badge: '🥉',
        color: '#9CA3AF',
        description: '',
        active: true,
        order: 1
      });
    }
  }, [level]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier le niveau' : 'Ajouter un niveau'}
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
            {isEdit ? 'Modifiez les détails de ce niveau d\'expérience' : 'Configurez les seuils d\'expérience pour chaque niveau'}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Niveau *
              </label>
              <input
                type="number"
                required
                min="1"
                max="33"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Ordre *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="Novice"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                XP Minimum *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.minXP}
                onChange={(e) => setFormData({ ...formData, minXP: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                XP Maximum *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.maxXP}
                onChange={(e) => setFormData({ ...formData, maxXP: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Badge *
            </label>
            <div className="grid grid-cols-10 gap-2">
              {predefinedBadges.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setFormData({ ...formData, badge })}
                  className={`p-2 text-lg border rounded-lg hover:bg-warm-50 ${
                    formData.badge === badge ? 'border-creho-500 bg-creho-50' : 'border-warm-300'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Couleur *
            </label>
            <div className="grid grid-cols-11 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    formData.color === color ? 'border-warm-900' : 'border-warm-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-warm-600">Aperçu:</span>
              <div 
                className="flex items-center px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: formData.color }}
              >
                {formData.badge} {formData.name}
              </div>
            </div>
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
              placeholder="Description de ce niveau..."
            />
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