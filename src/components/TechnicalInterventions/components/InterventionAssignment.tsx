import React from 'react';
import { User, Users } from 'lucide-react';
import { InterventionFormData } from '../../../hooks/useInterventionForm';
import { Parameter } from '../../../types/parameters';
import { User as UserType } from '../../../types/users';
import { Technician } from '../../../types/maintenance';

interface InterventionAssignmentProps {
  formData: InterventionFormData;
  updateFormData: (updates: Partial<InterventionFormData>) => void;
  statuses: Parameter[];
  users: UserType[];
  technicians: Technician[];
}

export default function InterventionAssignment({
  formData,
  updateFormData,
  statuses,
  users,
  technicians
}: InterventionAssignmentProps) {
  const getAssignablePersons = () => {
    if (formData.assignedToType === 'user') {
      return users.map(user => ({ id: user.id, name: user.name, type: 'user' as const }));
    } else {
      return technicians.map(tech => ({ id: tech.id, name: tech.name, type: 'technician' as const }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Statut */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Statut *
        </label>
        <select
          required
          value={formData.statusId}
          onChange={(e) => updateFormData({ statusId: e.target.value })}
          className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
        >
          <option value="">Sélectionnez un statut</option>
          {statuses.map(status => (
            <option key={status.id} value={status.id}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Type d'assignation */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Type d'assignation
        </label>
        <div className="flex space-x-2 mb-2">
          <button
            type="button"
            onClick={() => updateFormData({ assignedToType: 'user' })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              formData.assignedToType === 'user'
                ? 'bg-creho-500 text-white border-creho-500'
                : 'bg-white text-warm-700 border-warm-300 hover:bg-warm-50'
            }`}
          >
            <User className="w-4 h-4 mr-1 inline" />
            Utilisateurs
          </button>
          <button
            type="button"
            onClick={() => updateFormData({ assignedToType: 'technician' })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              formData.assignedToType === 'technician'
                ? 'bg-creho-500 text-white border-creho-500'
                : 'bg-white text-warm-700 border-warm-300 hover:bg-warm-50'
            }`}
          >
            <Users className="w-4 h-4 mr-1 inline" />
            Techniciens
          </button>
        </div>
        
        {/* Sélection de la personne */}
        <select
          value={formData.assignedTo}
          onChange={(e) => updateFormData({ assignedTo: e.target.value })}
          className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
        >
          <option value="">Non assigné</option>
          {getAssignablePersons().map(person => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}