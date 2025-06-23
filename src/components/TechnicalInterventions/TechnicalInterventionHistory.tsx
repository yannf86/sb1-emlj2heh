import React, { useState, useEffect } from 'react';
import HistoryViewer from '../common/HistoryViewer';
import { historyService } from '../../services/firebase/historyService';
import { HistoryEntry } from '../../types/history';

interface TechnicalInterventionHistoryProps {
  interventionId: string;
}

export default function TechnicalInterventionHistory({ interventionId }: TechnicalInterventionHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const historyData = await historyService.getTechnicalInterventionHistory(interventionId);
        setHistory(historyData);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'historique:', err);
        setError('Impossible de charger l\'historique. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };

    if (interventionId) {
      fetchHistory();
    }
  }, [interventionId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p className="text-red-700">{error}</p>
        <p className="text-red-600 mt-2 text-sm">
          Si c'est la première fois que vous utilisez cette fonctionnalité, il est possible que les index Firestore nécessaires 
          ne soient pas encore créés. Veuillez réessayer dans quelques minutes ou contacter l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-warm-900">Historique des modifications</h3>
      <HistoryViewer history={history} isLoading={isLoading} />
    </div>
  );
}
