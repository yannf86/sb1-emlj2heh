import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
}

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  itemName 
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-warm-700 mb-2">{message}</p>
          
          {itemName && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <span className="font-medium">Élément à supprimer :</span> {itemName}
              </p>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-orange-800">
              <span className="font-medium">⚠️ Attention :</span> Cette action est irréversible. 
              Une fois supprimé, cet élément ne pourra pas être récupéré.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors font-medium"
            >
              Non, annuler
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Oui, supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}