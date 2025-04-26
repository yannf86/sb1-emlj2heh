import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getHotelName, getParameterLabel, getUserName } from '@/lib/data';
import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QualityVisitEdit from './QualityVisitEdit';

interface QualityVisitDialogProps {
  visit: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedVisit: any) => void;
}

const QualityVisitDialog: React.FC<QualityVisitDialogProps> = ({ 
  visit, 
  isOpen, 
  onClose,
  onUpdate 
}) => {
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  if (!visit) return null;

  // Handle save changes
  const handleSave = (updatedVisit: any) => {
    // Here you would normally send the updated data to your backend
    toast({
      title: "Visite mise à jour",
      description: "Les modifications ont été enregistrées avec succès",
    });
    
    // Call onUpdate if provided
    if (onUpdate) {
      onUpdate(updatedVisit);
    }
    
    setEditMode(false);
  };

  if (editMode) {
    return (
      <QualityVisitEdit 
        isOpen={isOpen}
        onClose={() => setEditMode(false)}
        visit={visit}
        onSave={handleSave}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la visite qualité</DialogTitle>
          <DialogDescription>
            Visite effectuée le {formatDate(visit.visitDate)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with score */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">
                {getHotelName(visit.hotelId)} - {getParameterLabel(visit.visitTypeId)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {visit.startTime} - {visit.endTime}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className={`text-2xl font-bold ${
                visit.conformityRate >= 90 ? "text-green-600" :
                visit.conformityRate >= 80 ? "text-lime-600" :
                visit.conformityRate >= 70 ? "text-amber-600" :
                "text-red-600"
              }`}>
                {visit.conformityRate}%
              </div>
              <p className="text-sm text-muted-foreground">Taux de conformité</p>
            </div>
          </div>
          
          {/* Personnel */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Visiteur</p>
              <p className="font-medium">{getUserName(visit.visitorId)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Référent local</p>
              <p className="font-medium">
                {visit.localReferentId ? getUserName(visit.localReferentId) : "Non spécifié"}
              </p>
            </div>
          </div>
          
          {/* Checklist results */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-lg font-medium">Liste de contrôle</h3>
            
            {visit.checklist.reduce((acc: any[], item: any) => {
              const category = acc.find(cat => cat.id === item.categoryId);
              if (category) {
                category.items.push(item);
              } else {
                acc.push({
                  id: item.categoryId,
                  label: getParameterLabel(item.categoryId),
                  items: [item]
                });
              }
              return acc;
            }, []).map((category: any) => {
              // Calculate category score
              const conformeCount = category.items.filter((i: any) => i.result === 'conforme').length;
              const applicableCount = category.items.filter((i: any) => i.result !== 'non-applicable').length;
              const categoryScore = applicableCount > 0 ? Math.round((conformeCount / applicableCount) * 100) : 100;
              
              return (
                <div key={category.id} className="space-y-2 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{category.label}</h4>
                    <div className={`px-2 py-0.5 rounded-full text-sm font-medium ${
                      categoryScore >= 90 ? "bg-green-100 text-green-800" :
                      categoryScore >= 80 ? "bg-lime-100 text-lime-800" :
                      categoryScore >= 70 ? "bg-amber-100 text-amber-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {categoryScore}%
                    </div>
                  </div>
                  
                  <div className="border rounded-md divide-y">
                    {category.items.map((item: any) => (
                      <div key={item.id} className="p-2 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="font-medium">{getParameterLabel(item.itemId)}</p>
                          {item.comment && (
                            <p className="text-xs text-muted-foreground">{item.comment}</p>
                          )}
                        </div>
                        <div>
                          {item.result === 'conforme' ? (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Conforme
                            </span>
                          ) : item.result === 'non-conforme' ? (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-200">
                              <XCircle className="mr-1 h-3 w-3" />
                              Non conforme
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-200">
                              N/A
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Remarks and Action Plan */}
          {(visit.remarks || visit.actionPlan) && (
            <div className="space-y-4 pt-2 border-t">
              {visit.remarks && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Remarques</h3>
                  <p className="text-sm whitespace-pre-wrap">{visit.remarks}</p>
                </div>
              )}
              
              {visit.actionPlan && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Plan d'action</h3>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                      <p className="text-sm whitespace-pre-wrap text-amber-800">{visit.actionPlan}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Metadata */}
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                <p className="font-medium">{formatDate(visit.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                <p className="font-medium">{formatDate(visit.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={() => setEditMode(true)}>
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QualityVisitDialog;