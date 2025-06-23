import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Parameter } from '../../types/parameters';

interface ParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (parameter: Omit<Parameter, 'id'>) => void;
  parameter?: Parameter | null;
  title: string;
}

export default function ParameterModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  parameter, 
  title 
}: ParameterModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    code: '',
    order: 1,
    active: true,
    hotels: ['Hôtels'] as string[]
  });

  useEffect(() => {
    if (parameter) {
      setFormData({
        label: parameter.label,
        code: parameter.code,
        order: parameter.order,
        active: parameter.active,
        hotels: parameter.hotels
      });
    } else {
      setFormData({
        label: '',
        code: '',
        order: 1,
        active: true,
        hotels: ['Hôtels']
      });
    }
  }, [parameter]);

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
            {parameter ? 'Modifier' : 'Ajouter'} {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Label *
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="Entrez le label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="Entrez le code"
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
              {parameter ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}