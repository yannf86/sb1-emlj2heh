import React from 'react';
import { X } from 'lucide-react';
import LostItemHistory from './LostItemHistory';
import { LostItem } from '../../types/lostItems';

interface LostItemHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lostItem: LostItem | null;
}

const LostItemHistoryModal: React.FC<LostItemHistoryModalProps> = ({
  isOpen,
  onClose,
  lostItem
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-warm-200">
          <h2 className="text-xl font-semibold text-warm-900">
            Historique - {lostItem?.description || 'Objet trouvé'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-warm-100 transition-colors"
          >
            <X className="h-6 w-6 text-warm-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {lostItem ? (
            <LostItemHistory lostItemId={lostItem.id} />
          ) : (
            <p className="text-center text-warm-500">
              Impossible de charger l'historique. Données de l'objet trouvé non disponibles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LostItemHistoryModal;
