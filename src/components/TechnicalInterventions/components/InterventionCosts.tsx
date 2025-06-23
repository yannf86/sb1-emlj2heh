import React from 'react';
import { Euro } from 'lucide-react';
import { InterventionFormData } from '../../../hooks/useInterventionForm';

interface InterventionCostsProps {
  formData: InterventionFormData;
  updateFormData: (updates: Partial<InterventionFormData>) => void;
}

export default function InterventionCosts({
  formData,
  updateFormData
}: InterventionCostsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-warm-900 mb-4">Dates et coûts</h3>
      
      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={formData.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => {
              // Validation pour éviter les dates invalides
              try {
                const dateValue = e.target.value;
                if (!dateValue || dateValue === '0') {
                  // Si la valeur est vide ou "0", ne pas définir de date
                  updateFormData({ startDate: undefined });
                } else {
                  const newDate = new Date(dateValue);
                  // Vérifier si la date est valide
                  if (isNaN(newDate.getTime())) {
                    console.warn('Date de début invalide détectée:', dateValue);
                    // Ne pas définir de date en cas d'erreur
                    updateFormData({ startDate: undefined });
                  } else {
                    updateFormData({ startDate: newDate });
                  }
                }
              } catch (error) {
                console.error('Erreur lors de la conversion de la date de début:', error);
                // Ne pas définir de date en cas d'erreur
                updateFormData({ startDate: undefined });
              }
            }}
            className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={formData.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => {
              // Validation pour éviter les dates invalides
              try {
                const dateValue = e.target.value;
                if (!dateValue || dateValue === '0') {
                  // Si la valeur est vide ou "0", ne pas définir de date
                  updateFormData({ endDate: undefined });
                } else {
                  const newDate = new Date(dateValue);
                  // Vérifier si la date est valide
                  if (isNaN(newDate.getTime())) {
                    console.warn('Date de fin invalide détectée:', dateValue);
                    // Ne pas définir de date en cas d'erreur
                    updateFormData({ endDate: undefined });
                  } else {
                    updateFormData({ endDate: newDate });
                  }
                }
              } catch (error) {
                console.error('Erreur lors de la conversion de la date de fin:', error);
                // Ne pas définir de date en cas d'erreur
                updateFormData({ endDate: undefined });
              }
            }}
            className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
          />
        </div>
      </div>

      {/* Coûts */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Montant estimé (€)
          </label>
          <div className="relative">
            <Euro className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedCost === 0 ? '' : formData.estimatedCost}
              onChange={(e) => updateFormData({ estimatedCost: parseFloat(e.target.value) || 0 })}
              className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Montant final (€)
          </label>
          <div className="relative">
            <Euro className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.finalCost === 0 ? '' : formData.finalCost}
              onChange={(e) => updateFormData({ finalCost: parseFloat(e.target.value) || 0 })}
              className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
    </div>
  );
}