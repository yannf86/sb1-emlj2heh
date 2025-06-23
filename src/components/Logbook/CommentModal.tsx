import React, { useState } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  entryTitle: string;
}

export default function CommentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  entryTitle 
}: CommentModalProps) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            Ajouter un commentaire
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-warm-600 mb-2">Consigne :</p>
            <p className="text-sm font-medium text-warm-900 bg-warm-50 p-2 rounded">
              {entryTitle}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Votre commentaire *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Ajoutez votre commentaire..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!comment.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Publier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}