import React from 'react';
import { MessageCircle } from 'lucide-react';
import { InterventionFormData } from '../../../hooks/useInterventionForm';

interface InterventionCommentsProps {
  formData: InterventionFormData;
  updateFormData: (updates: Partial<InterventionFormData>) => void;
}

export default function InterventionComments({
  formData,
  updateFormData
}: InterventionCommentsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-warm-700 mb-1 flex items-center">
        <MessageCircle className="w-4 h-4 mr-2" />
        Commentaires
      </label>
      <textarea
        value={formData.comments}
        onChange={(e) => updateFormData({ comments: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
        placeholder="Commentaires additionnels..."
      />
    </div>
  );
}