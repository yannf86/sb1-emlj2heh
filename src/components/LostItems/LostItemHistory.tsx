import React, { useState, useEffect } from 'react';
import { historyService } from '../../services/firebase/historyService';
import { HistoryEntry } from '../../types/history';
import { formatDate } from '../../utils/dateUtils';
import { Clock, User, FileText, Edit, Trash2 } from 'lucide-react';

interface LostItemHistoryProps {
  lostItemId: string;
}

const LostItemHistory: React.FC<LostItemHistoryProps> = ({ lostItemId }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!lostItemId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const historyData = await historyService.getLostItemHistory(lostItemId);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'historique:', err);
        setError('Impossible de charger l\'historique. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [lostItemId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-creho-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-warm-500">
        <p>Aucun historique disponible pour cet objet trouvé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <div key={entry.id} className="border border-warm-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <div className="bg-creho-100 p-2 rounded-full mr-3">
                {entry.operation === 'create' && <FileText className="h-5 w-5 text-creho-600" />}
                {entry.operation === 'update' && <Edit className="h-5 w-5 text-amber-600" />}
                {entry.operation === 'delete' && <Trash2 className="h-5 w-5 text-red-600" />}
              </div>
              <div>
                <h4 className="font-medium text-warm-900">
                  {entry.operation === 'create' && 'Création'}
                  {entry.operation === 'update' && 'Modification'}
                  {entry.operation === 'delete' && 'Suppression'}
                </h4>
                <div className="flex items-center text-sm text-warm-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(entry.timestamp)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center text-sm text-warm-500">
              <User className="h-3 w-3 mr-1" />
              <span>{entry.userName || 'Utilisateur inconnu'}</span>
            </div>
          </div>

          {entry.changedFields && entry.changedFields.length > 0 && (
            <div className="mt-2">
              <h5 className="text-sm font-medium text-warm-700 mb-1">Champs modifiés:</h5>
              <div className="flex flex-wrap gap-1">
                {entry.changedFields.map((field) => (
                  <span
                    key={field}
                    className="inline-block px-2 py-1 bg-warm-100 text-warm-700 text-xs rounded-md"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {entry.operation === 'update' && (
            <div className="mt-3 pt-3 border-t border-warm-100">
              <h5 className="text-sm font-medium text-warm-700 mb-2">Détails des modifications:</h5>
              <div className="space-y-2">
                {entry.changedFields?.map((field) => {
                  const oldValue = entry.previousState?.[field];
                  const newValue = entry.newState?.[field];
                  
                  // Ignorer les champs techniques ou les tableaux/objets complexes
                  if (
                    typeof oldValue === 'object' || 
                    typeof newValue === 'object' ||
                    field === 'updatedAt' ||
                    field === 'updatedBy'
                  ) {
                    return null;
                  }
                  
                  return (
                    <div key={field} className="grid grid-cols-3 text-sm">
                      <div className="font-medium text-warm-700">{field}</div>
                      <div className="text-red-500 line-through">{oldValue || '(vide)'}</div>
                      <div className="text-green-600">{newValue || '(vide)'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LostItemHistory;
