import React, { useState, useEffect } from 'react';
import { historyService } from '../../services/firebase/historyService';
import { lostItemsService } from '../../services/firebase/lostItemsService';
import { LostItem } from '../../types/lostItems';
import { HistoryEntry } from '../../types/history';
import { formatDate } from '../../utils/dateUtils';
import { Search, Clock, User, FileText, Edit, Trash2, Eye } from 'lucide-react';
import LostItemHistoryModal from './LostItemHistoryModal';
import { useUserPermissions } from '../../hooks/useUserPermissions';

const LostItemsHistory: React.FC = () => {
  const [allLostItems, setAllLostItems] = useState<LostItem[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLostItem, setSelectedLostItem] = useState<LostItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const { accessibleHotels } = useUserPermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer tous les objets trouvés
        const lostItemsData = await lostItemsService.getLostItems();
        
        // Filtrer par hôtels accessibles si nécessaire
        const filteredLostItems = accessibleHotels && accessibleHotels.length > 0
          ? lostItemsData.filter(item => accessibleHotels.includes(item.hotelId))
          : lostItemsData;
        
        setAllLostItems(filteredLostItems);
        
        // Récupérer toutes les entrées d'historique liées aux objets trouvés
        const historyData: HistoryEntry[] = [];
        
        // Pour chaque objet trouvé, récupérer son historique
        for (const lostItem of filteredLostItems) {
          try {
            const itemHistory = await historyService.getLostItemHistory(lostItem.id);
            historyData.push(...itemHistory);
          } catch (error) {
            console.error(`Erreur lors de la récupération de l'historique pour l'objet ${lostItem.id}:`, error);
          }
        }
        
        // Trier par date (du plus récent au plus ancien)
        const sortedHistory = historyData.sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const dateB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return dateB - dateA;
        });
        
        setHistoryEntries(sortedHistory);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [accessibleHotels]);

  // Filtrer les entrées d'historique en fonction du terme de recherche
  const filteredEntries = historyEntries.filter(entry => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Rechercher dans les données de l'objet trouvé
    const lostItem = allLostItems.find(item => item.id === entry.entityId);
    if (lostItem) {
      if (lostItem.description?.toLowerCase().includes(searchTermLower)) return true;
      if (lostItem.location?.toLowerCase().includes(searchTermLower)) return true;
      if (lostItem.status?.toLowerCase().includes(searchTermLower)) return true;
    }
    
    // Rechercher dans les données de l'entrée d'historique
    if (entry.userName?.toLowerCase().includes(searchTermLower)) return true;
    if (entry.userEmail?.toLowerCase().includes(searchTermLower)) return true;
    if (entry.operation?.toLowerCase().includes(searchTermLower)) return true;
    
    // Rechercher dans les champs modifiés
    if (entry.changedFields?.some(field => field.toLowerCase().includes(searchTermLower))) return true;
    
    return false;
  });

  const handleViewHistory = (lostItem: LostItem) => {
    setSelectedLostItem(lostItem);
    setIsHistoryModalOpen(true);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create':
        return <FileText className="h-5 w-5 text-creho-600" />;
      case 'update':
        return <Edit className="h-5 w-5 text-amber-600" />;
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-600" />;
      default:
        return <Eye className="h-5 w-5 text-blue-600" />;
    }
  };

  const getOperationText = (operation: string) => {
    switch (operation) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      default:
        return 'Consultation';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-creho-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Historique des objets trouvés</h1>
        <p className="text-warm-600">
          Consultez l'historique complet des modifications apportées aux objets trouvés.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher dans l'historique..."
            className="w-full pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-warm-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-warm-500">
            {searchTerm ? 'Aucun résultat trouvé pour cette recherche.' : 'Aucun historique disponible.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-warm-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Objet trouvé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Champs modifiés
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-warm-200">
                {filteredEntries.map((entry) => {
                  const lostItem = allLostItems.find(item => item.id === entry.entityId);
                  return (
                    <tr key={entry.id} className="hover:bg-warm-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-warm-100 p-2 rounded-full mr-2">
                            {getOperationIcon(entry.operation)}
                          </div>
                          <span className="text-warm-900">
                            {getOperationText(entry.operation)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lostItem ? (
                          <div>
                            <div className="font-medium text-warm-900">{lostItem.description}</div>
                            <div className="text-sm text-warm-500">{lostItem.location}</div>
                          </div>
                        ) : (
                          <span className="text-warm-500 italic">Objet supprimé ou non disponible</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-warm-900">{entry.userName}</div>
                        <div className="text-sm text-warm-500">{entry.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-warm-400" />
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.changedFields && entry.changedFields.length > 0 ? (
                            entry.changedFields.slice(0, 3).map((field) => (
                              <span
                                key={field}
                                className="inline-block px-2 py-1 bg-warm-100 text-warm-700 text-xs rounded-md"
                              >
                                {field}
                              </span>
                            ))
                          ) : (
                            <span className="text-warm-500 italic">-</span>
                          )}
                          {entry.changedFields && entry.changedFields.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-warm-100 text-warm-700 text-xs rounded-md">
                              +{entry.changedFields.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {lostItem && (
                          <button
                            onClick={() => handleViewHistory(lostItem)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Détails
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'historique détaillé */}
      {selectedLostItem && (
        <LostItemHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          lostItem={selectedLostItem}
        />
      )}
    </div>
  );
};

export default LostItemsHistory;
