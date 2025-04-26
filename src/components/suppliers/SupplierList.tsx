import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Building, FileText } from 'lucide-react';
import { Supplier } from './types/supplier.types';
import { hotels } from '@/lib/data';

interface SupplierListProps {
  suppliers: Supplier[];
  onViewSupplier: (id: string) => void;
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, onViewSupplier }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fournisseur</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Hôtels</TableHead>
          <TableHead>Contrats</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              Aucun fournisseur trouvé
            </TableCell>
          </TableRow>
        ) : (
          suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                <div className="font-medium">{supplier.companyName}</div>
                <div className="text-xs text-muted-foreground">{supplier.city}, {supplier.country}</div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {supplier.phone}
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {supplier.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {supplier.hotelIds.length === hotels.length ? (
                  <span>Tous les hôtels</span>
                ) : (
                  <span>{supplier.hotelIds.length} hôtel(s)</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{supplier.contractIds.length}</span>
                </div>
              </TableCell>
              <TableCell>
                {supplier.active ? (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-200">
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-200">
                    Inactif
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewSupplier(supplier.id)}
                >
                  Voir
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default SupplierList;