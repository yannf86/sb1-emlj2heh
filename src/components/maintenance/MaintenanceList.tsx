import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Image, FileUp, Check, X, Edit, Eye, Clock8 } from 'lucide-react';
import { Maintenance } from './types/maintenance.types';

// Import DB helper functions
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getInterventionTypeLabel } from '@/lib/db/parameters-intervention-type';
import { getStatusLabel } from '@/lib/db/parameters-status';

interface MaintenanceListProps {
  maintenanceRequests: Maintenance[];
  onViewMaintenance: (id: string) => void;
  onEditMaintenance?: (id: string) => void;
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({ maintenanceRequests, onViewMaintenance, onEditMaintenance }) => {
  // State for resolved labels
  const [resolvedLabels, setResolvedLabels] = useState<{[key: string]: {[key: string]: string}}>({});
  const [loading, setLoading] = useState(true);

  // Load all labels when maintenance requests change
  useEffect(() => {
    const loadLabels = async () => {
      try {
        setLoading(true);
        const newLabels: {[key: string]: {[key: string]: string}} = {};

        for (const request of maintenanceRequests) {
          if (!newLabels[request.id]) {
            newLabels[request.id] = {};
          }

          // Load hotel name
          if (request.hotelId) {
            try {
              newLabels[request.id].hotelName = await getHotelName(request.hotelId);
            } catch (error) {
              console.error(`Error loading hotel name for ID ${request.hotelId}:`, error);
              newLabels[request.id].hotelName = 'Inconnu';
            }
          }

          // Load location label
          if (request.locationId) {
            try {
              newLabels[request.id].locationLabel = await getLocationLabel(request.locationId);
            } catch (error) {
              console.error(`Error loading location for ID ${request.locationId}:`, error);
              newLabels[request.id].locationLabel = 'Inconnu';
            }
          }

          // Load intervention type label
          if (request.interventionTypeId) {
            try {
              newLabels[request.id].interventionTypeLabel = await getInterventionTypeLabel(request.interventionTypeId);
            } catch (error) {
              console.error(`Error loading intervention type for ID ${request.interventionTypeId}:`, error);
              newLabels[request.id].interventionTypeLabel = 'Inconnu';
            }
          }

          // Load status label
          if (request.statusId) {
            try {
              newLabels[request.id].statusLabel = await getStatusLabel(request.statusId);
            } catch (error) {
              console.error(`Error loading status for ID ${request.statusId}:`, error);
              newLabels[request.id].statusLabel = 'Inconnu';
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

    if (maintenanceRequests.length > 0) {
      loadLabels();
    } else {
      setLoading(false);
    }
  }, [maintenanceRequests]);

  if (loading && maintenanceRequests.length > 0) {
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
          <TableHead>Lieu</TableHead>
          <TableHead>Type d'intervention</TableHead>
          <TableHead>Photos</TableHead>
          <TableHead>Devis</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {maintenanceRequests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              Aucune intervention trouvée
            </TableCell>
          </TableRow>
        ) : (
          maintenanceRequests.map((request) => {
            const labels = resolvedLabels[request.id] || {};
            
            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{formatDate(request.date)}</div>
                  <div className="text-xs text-muted-foreground">{request.time}</div>
                </TableCell>
                <TableCell>{labels.hotelName || 'Chargement...'}</TableCell>
                <TableCell>{labels.locationLabel || 'Chargement...'}</TableCell>
                <TableCell>{labels.interventionTypeLabel || 'Chargement...'}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {request.photoBefore && (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 border-blue-200">
                        <Image className="h-3 w-3 mr-1" />
                        Avant
                      </span>
                    )}
                    {request.photoAfter && (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 border-green-200">
                        <Image className="h-3 w-3 mr-1" />
                        Après
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {request.quoteUrl && (
                    <div className="flex flex-col space-y-1">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 border-amber-200">
                        <FileUp className="h-3 w-3 mr-1" />
                        {request.quoteAmount ? `${request.quoteAmount}€` : 'Devis'}
                      </span>
                      {request.quoteStatus && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          request.quoteStatus === 'accepted' 
                            ? "bg-green-50 text-green-600 border-green-200" 
                            : request.quoteStatus === 'rejected' 
                            ? "bg-red-50 text-red-600 border-red-200" 
                            : "bg-orange-50 text-orange-600 border-orange-200"
                        }`}>
                          {request.quoteStatus === 'accepted' 
                            ? <><Check className="h-3 w-3 mr-1" /> Accepté</> 
                            : request.quoteStatus === 'rejected' 
                            ? <><X className="h-3 w-3 mr-1" /> Refusé</>
                            : <><Clock8 className="h-3 w-3 mr-1" /> En attente</>}
                        </span>
                      )}
                      {!request.quoteStatus && request.quoteAccepted !== undefined && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          request.quoteAccepted 
                            ? "bg-green-50 text-green-600 border-green-200" 
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {request.quoteAccepted 
                            ? <><Check className="h-3 w-3 mr-1" /> Accepté</> 
                            : <><X className="h-3 w-3 mr-1" /> Refusé</>}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className={
                    request.statusId === 'stat1' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-600 border-yellow-300" :
                    request.statusId === 'stat2' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300" :
                    request.statusId === 'stat3' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300" :
                    request.statusId === 'stat4' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-300" :
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300"
                  }>
                    {labels.statusLabel || 'Chargement...'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {onEditMaintenance && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditMaintenance(request.id)}
                        className="h-8 w-8 p-0"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewMaintenance(request.id)}
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

export default MaintenanceList;