import React, { useState } from 'react';
import { X, CheckCircle, Calendar, ArrowRight } from 'lucide-react';

interface CompleteDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  date: Date;
  hotelName: string;
  allTasksCompleted: boolean;
}

export default function CompleteDayModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  date,
  hotelName,
  allTasksCompleted 
}: CompleteDayModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error completing day:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Valider et passer au jour suivant
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-warm-600 mb-4">
            Confirmez pour valider cette journée et dupliquer les tâches pour demain
          </p>

          <div className="bg-warm-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="font-semibold text-warm-900 mb-2">
                {allTasksCompleted ? 'Toutes les tâches sont complétées!' : 'Attention : Toutes les tâches ne sont pas terminées'}
              </p>
              
              <div className="flex items-center justify-center space-x-4 my-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-warm-900">{hotelName}</p>
                    <p className="text-xs text-warm-600">{date.toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-warm-400" />
                
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-warm-900">Demain</p>
                    <p className="text-xs text-warm-600">{nextDay.toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Information</h4>
            <p className="text-sm text-blue-700">
              En confirmant, vous allez valider cette journée et créer automatiquement 
              les mêmes tâches pour demain.
            </p>
          </div>

          {!allTasksCompleted && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-orange-900 mb-2">⚠️ Attention</h4>
              <p className="text-sm text-orange-700">
                Certaines tâches ne sont pas encore terminées. Vous pouvez tout de même 
                passer au jour suivant si nécessaire.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmer et passer à demain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}