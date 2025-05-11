import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getIncidentCategoryLabel } from '@/lib/db/parameters-incident-categories';
import { getImpactLabel } from '@/lib/db/parameters-impact';
import { getStatusLabel } from '@/lib/db/parameters-status';
import { getUserName } from '@/lib/db/users';
import { Edit, Eye } from 'lucide-react';

interface IncidentListProps {
  incidents: any[];
  onViewIncident: (id: string) => void;
  onEditIncident?: (id: string) => void;
}

const IncidentList: React.FC<IncidentListProps> = ({ incidents, onViewIncident, onEditIncident }) => {
  // State to store resolved labels
  const [resolvedLabels, setResolvedLabels] = useState<{[key: string]: {[key: string]: string}}>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Load all labels when incidents change
  useEffect(() => {
    const loadLabels = async () => {
      try {
        setLoading(true);
        const newLabels: {[key: string]: {[key: string]: string}} = {};

        for (const incident of incidents) {
          if (!newLabels[incident.id]) {
            newLabels[incident.id] = {};
          }

          // Load hotel name
          if (incident.hotelId) {
            try {
              newLabels[incident.id].hotelName = await getHotelName(incident.hotelId);
            } catch (error) {
              console.error(`Error loading hotel name for ID ${incident.hotelId}:`, error);
              newLabels[incident.id].hotelName = 'Inconnu';
            }
          }

          // Load location label
          if (incident.locationId) {
            try {
              newLabels[incident.id].locationLabel = await getLocationLabel(incident.locationId);
            } catch (error) {
              console.error(`Error loading location for ID ${incident.locationId}:`, error);
              newLabels[incident.id].locationLabel = 'Inconnu';
            }
          }

          // Load category label
          if (incident.categoryId) {
            try {
              newLabels[incident.id].categoryLabel = await getIncidentCategoryLabel(incident.categoryId);
            } catch (error) {
              console.error(`Error loading category for ID ${incident.categoryId}:`, error);
              newLabels[incident.id].categoryLabel = 'Inconnu';
            }
          }

          // Load impact label
          if (incident.impactId) {
            try {
              newLabels[incident.id].impactLabel = await getImpactLabel(incident.impactId);
            } catch (error) {
              console.error(`Error loading impact for ID ${incident.impactId}:`, error);
              newLabels[incident.id].impactLabel = 'Inconnu';
            }
          }

          // Load status label
          if (incident.statusId) {
            try {
              newLabels[incident.id].statusLabel = await getStatusLabel(incident.statusId);
            } catch (error) {
              console.error(`Error loading status for ID ${incident.statusId}:`, error);
              
              // Backup status logic in case of fetch failure
              const statusMap: {[key: string]: string} = {
                'stat1': 'Ouvert',
                'stat2': 'En cours',
                'stat3': 'Résolu',
                'stat4': 'Fermé',
                'stat5': 'Annulé',
                'CZa3iy84r8pVqjVOQHNL': 'En cours',
                'JyK8HpAF5qwg39QbQeS1': 'Résolu',
              };
              
              newLabels[incident.id].statusLabel = statusMap[incident.statusId] || 'Statut';
            }
          }

          // Load receiver name
          if (incident.receivedById) {
            try {
              newLabels[incident.id].receivedByName = await getUserName(incident.receivedById);
            } catch (error) {
              console.error(`Error loading user for ID ${incident.receivedById}:`, error);
              newLabels[incident.id].receivedByName = 'Inconnu';
            }
          }
        }

        setResolvedLabels(newLabels);
      } catch (error) {
        console.error('Error loading labels:', error);
      } finally {
        setLoading(false);
      }
    };

    if (incidents.length > 0) {
      loadLabels();
    } else {
      setLoading(false);
    }
  }, [incidents]);

  if (loading && incidents.length > 0) {
    return (
      <div className="py-8 text-center">
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Hôtel</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead>Impact</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Reçu par</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              Aucun incident trouvé
            </TableCell>
          </TableRow>
        ) : (
          incidents.map((incident) => {
            const labels = resolvedLabels[incident.id] || {};
            
            return (
              <TableRow key={incident.id}>
                <TableCell>
                  <div className="font-medium">{formatDate(incident.date)}</div>
                  <div className="text-xs text-muted-foreground">{incident.time}</div>
                </TableCell>
                <TableCell>{labels.hotelName || 'Inconnu'}</TableCell>
                <TableCell>{labels.categoryLabel || 'Inconnu'}</TableCell>
                <TableCell>
                  <span className={
                    incident.impactId === 'imp4' ? "text-red-500 font-medium" :
                    incident.impactId === 'imp3' ? "text-amber-500 font-medium" :
                    incident.impactId === 'imp2' ? "text-blue-500 font-medium" :
                    "text-green-500 font-medium"
                  }>
                    {labels.impactLabel || 'Inconnu'}
                  </span>
                </TableCell>
                <TableCell>{incident.clientName || "-"}</TableCell>
                <TableCell>{labels.receivedByName || 'Inconnu'}</TableCell>
                <TableCell>
                  <span className={
                    incident.statusId === 'stat1' || incident.statusId === 'Ouvert' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-600 border-yellow-300" :
                    incident.statusId === 'stat2' || incident.statusId === 'CZa3iy84r8pVqjVOQHNL' || incident.statusId === 'En cours' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300" :
                    incident.statusId === 'stat3' || incident.statusId === 'JyK8HpAF5qwg39QbQeS1' || incident.statusId === 'Résolu' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300" :
                    incident.statusId === 'stat4' || incident.statusId === 'Fermé' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-300" :
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300"
                  }>
                    {labels.statusLabel || (
                      incident.statusId === 'stat1' ? 'Ouvert' :
                      incident.statusId === 'stat2' || incident.statusId === 'CZa3iy84r8pVqjVOQHNL' ? 'En cours' :
                      incident.statusId === 'stat3' || incident.statusId === 'JyK8HpAF5qwg39QbQeS1' ? 'Résolu' :
                      incident.statusId === 'stat4' ? 'Fermé' :
                      incident.statusId === 'stat5' ? 'Annulé' : 'Inconnu'
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {onEditIncident && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditIncident(incident.id)}
                        className="h-8 w-8 p-0"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewIncident(incident.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

export default IncidentList;