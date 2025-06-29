import React, { useState } from 'react';
import { procedureService } from '../../services/firebase/procedureService';
import { useAuth } from '../../contexts/AuthContext';

interface ProcedureDiagnosticProps {
  procedureId: string;
}

export default function ProcedureDiagnostic({ procedureId }: ProcedureDiagnosticProps) {
  const { currentUser } = useAuth();
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    if (!currentUser || currentUser.role !== 'system_admin') return;
    
    setLoading(true);
    try {
      // Récupérer les données de diagnostic
      const procedure = await procedureService.getProcedureById(procedureId);
      const history = await procedureService.getProcedureHistory(procedureId);
      const acknowledgments = await procedureService.getProcedureAcknowledgments(procedureId);
      
      setDiagnosticData({
        procedure,
        history,
        acknowledgments,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      setDiagnosticData({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'system_admin') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h4 className="text-sm font-medium text-yellow-800 mb-2">
        🔧 Diagnostic (Admin uniquement)
      </h4>
      
      <button
        onClick={runDiagnostic}
        disabled={loading}
        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        {loading ? 'Diagnostic...' : 'Lancer diagnostic'}
      </button>
      
      {diagnosticData && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">
            Diagnostic du {diagnosticData.timestamp}
          </p>
          
          {diagnosticData.error ? (
            <div className="text-red-600 text-sm">
              <strong>Erreur:</strong> {diagnosticData.error}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <strong>Procédure:</strong> Version {diagnosticData.procedure?.version || 'non définie'}
              </div>
              <div>
                <strong>Historique:</strong> {diagnosticData.history?.length || 0} entrées
              </div>
              <div>
                <strong>Validations:</strong> {diagnosticData.acknowledgments?.length || 0} validations
              </div>
              
              {diagnosticData.history?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">
                    Voir historique détaillé
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 text-xs overflow-auto max-h-40">
                    {JSON.stringify(diagnosticData.history, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
