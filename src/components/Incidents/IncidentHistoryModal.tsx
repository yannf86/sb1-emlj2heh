import React from 'react';
import { X, History } from 'lucide-react';
import IncidentHistory from './IncidentHistory';
import { Incident } from '../../types/incidents';

interface IncidentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident;
}

export default function IncidentHistoryModal({ 
  isOpen, 
  onClose, 
  incident 
}: IncidentHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-warm-200">
          <h2 className="text-xl font-semibold text-warm-900 flex items-center">
            <History className="w-5 h-5 mr-2 text-creho-600" />
            Historique des modifications - {incident.description.substring(0, 30)}{incident.description.length > 30 ? '...' : ''}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-warm-100 rounded-full"
          >
            <X size={20} className="text-warm-500" />
          </button>
        </div>

        <div className="p-6">
          <IncidentHistory incidentId={incident.id} />
        </div>
      </div>
    </div>
  );
}
