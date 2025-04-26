import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { Supplier } from './types/supplier.types';
import { getSupplierCategoryName, getSupplierSubcategoryName, getHotelName } from '@/lib/data';

interface SupplierDialogProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

const SupplierDialog: React.FC<SupplierDialogProps> = ({ supplier, isOpen, onClose }) => {
  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du fournisseur</DialogTitle>
          <DialogDescription>
            Consultation des informations du fournisseur
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic information */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{supplier.companyName}</h2>
                <p className="text-muted-foreground">{supplier.description}</p>
              </div>
              <div>
                {supplier.active ? (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-200">
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-200">
                    Inactif
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                <p className="font-medium">{getSupplierCategoryName(supplier.subcategoryId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Sous-catégorie</p>
                <p className="font-medium">{getSupplierSubcategoryName(supplier.subcategoryId)}</p>
              </div>
            </div>
          </div>
          
          {/* Contact information */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-lg font-medium">Coordonnées</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <p>{supplier.address}</p>
              </div>
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <p>{supplier.city}, {supplier.country}</p>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <p>{supplier.phone}</p>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <p>{supplier.email}</p>
              </div>
              {supplier.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a 
                    href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {supplier.website}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Hotels */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-lg font-medium">Hôtels concernés</h3>
            
            <div className="flex flex-wrap gap-2">
              {supplier.hotelIds.map(hotelId => (
                <div 
                  key={hotelId}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm"
                >
                  {getHotelName(hotelId)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Contracts */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-lg font-medium">Contrats</h3>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
              <p className="text-sm text-muted-foreground">
                {supplier.contractIds.length} contrat(s) actif(s)
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button>
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDialog;