import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  userName: string;
  userEmail: string;
}

export default function PasswordResetModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userName,
  userEmail 
}: PasswordResetModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(userEmail);
      onClose();
    } catch (error) {
      console.error('Error sending password reset:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            Réinitialiser le mot de passe
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
            Envoyer un email de réinitialisation de mot de passe à cet utilisateur.
          </p>

          <div className="bg-creho-50 border border-creho-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-creho-600 mr-3" />
              <div>
                <p className="font-semibold text-creho-900">{userName}</p>
                <p className="text-sm text-creho-700">Un email sera envoyé à:</p>
                <p className="text-sm text-creho-800 font-medium">{userEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Information</h4>
            <p className="text-sm text-blue-700">
              L'utilisateur recevra un email avec un lien pour définir un nouveau mot de passe. 
              Ce lien sera valable pendant 24 heures.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer l\'email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}