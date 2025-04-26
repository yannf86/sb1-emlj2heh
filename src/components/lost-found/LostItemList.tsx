import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getLostItemTypeLabel } from '@/lib/db/parameters-lost-item-type';
import { getUserName } from '@/lib/db/users';
import { MapPin, Briefcase, Tag, Edit, Eye, User } from 'lucide-react';
import { LostItem } from './types/lost-item.types';

interface LostItemListProps {
  items: LostItem[];
  onViewItem: (id: string) => void;
  onEditItem?: (id: string) => void;
}

const LostItemList: React.FC<LostItemListProps> = ({ items, onViewItem, onEditItem }) => {
  // State to store resolved labels
  const [resolvedLabels, setResolvedLabels] = useState<{[key: string]: {[key: string]: string}}>({});
  const [loading, setLoading] = useState(true);

  // Load all labels when items change
  useEffect(() => {
    const loadLabels = async () => {
      try {
        setLoading(true);
        const newLabels: {[key: string]: {[key: string]: string}} = {};

        for (const item of items) {
          if (!newLabels[item.id]) {
            newLabels[item.id] = {};
          }

          // Load hotel name
          if (item.hotelId) {
            try {
              newLabels[item.id].hotelName = await getHotelName(item.hotelId);
            } catch (error) {
              console.error(`Error loading hotel name for ID ${item.hotelId}:`, error);
              newLabels[item.id].hotelName = 'Inconnu';
            }
          }

          // Load location label
          if (item.locationId) {
            try {
              newLabels[item.id].locationLabel = await getLocationLabel(item.locationId);
            } catch (error) {
              console.error(`Error loading location for ID ${item.locationId}:`, error);
              newLabels[item.id].locationLabel = 'Inconnu';
            }
          }

          // Load item type label
          if (item.itemTypeId) {
            try {
              newLabels[item.id].itemTypeLabel = await getLostItemTypeLabel(item.itemTypeId);
            } catch (error) {
              console.error(`Error loading item type for ID ${item.itemTypeId}:`, error);
              newLabels[item.id].itemTypeLabel = 'Inconnu';
            }
          }
          
          // Load found by name
          if (item.foundById) {
            try {
              newLabels[item.id].foundByName = await getUserName(item.foundById);
            } catch (error) {
              console.error(`Error loading user for ID ${item.foundById}:`, error);
              newLabels[item.id].foundByName = 'Inconnu';
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

    if (items.length > 0) {
      loadLabels();
    } else {
      setLoading(false);
    }
  }, [items]);

  if (loading && items.length > 0) {
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
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Trouvé par</TableHead>
          <TableHead>Stockage</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              Aucun objet trouvé
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => {
            const labels = resolvedLabels[item.id] || {};
            
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{formatDate(item.date)}</div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </TableCell>
                <TableCell>{labels.hotelName || 'Chargement...'}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <MapPin className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    {labels.locationLabel || 'Chargement...'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Tag className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    {labels.itemTypeLabel || 'Chargement...'}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <User className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    {labels.foundByName || 'Chargement...'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Briefcase className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    {item.storageLocation}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={
                    item.status === 'conservé' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300" :
                    item.status === 'rendu' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300" :
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-orange-600 border-orange-300"
                  }>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {onEditItem && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditItem(item.id)}
                        className="h-8 w-8 p-0"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewItem(item.id)}
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

export default LostItemList;