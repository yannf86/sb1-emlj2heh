import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Check, MessageSquare, Edit, Trash2, Clock, AlertTriangle, User, Home, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatToISOLocalDate } from '@/lib/date-utils';

interface LogbookEntryProps {
  entry: {
    id: string;
    date: string;
    time: string;
    endDate?: string;
    displayRange?: boolean;
    serviceId: string;
    serviceName: string;
    serviceIcon: string;
    content: string;
    authorId: string;
    authorName: string;
    importance: number;
    isCompleted?: boolean;
    isTask?: boolean;
    hotelId: string;
    hotelName: string;
    roomNumber?: string;
    completedDates?: string[]; // Tableau des dates complétées
    comments?: { id: string; authorId: string; authorName: string; content: string; createdAt: string }[];
    isRead?: boolean;
  };
  onEdit?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
  onMarkAsRead?: (entryId: string) => void;
  onMarkAsCompleted?: (entryId: string) => void;
  onUnmarkAsCompleted?: (entryId: string) => void;
  onAddComment?: (entryId: string, comment: string) => void;
  selectedDate?: Date; // Date sélectionnée pour l'affichage (pour gérer les statuts par jour)
}

const LogbookEntry: React.FC<LogbookEntryProps> = ({
  entry,
  onEdit,
  onDelete,
  onMarkAsRead,
  onMarkAsCompleted,
  onUnmarkAsCompleted,
  onAddComment,
  selectedDate = new Date() // Par défaut, on utilise la date actuelle
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Handle importance level visual treatment
  const getImportanceStyles = () => {
    switch (entry.importance) {
      case 3: // Critical
        return {
          cardClass: 'border-red-300 dark:border-red-800',
          badgeClass: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };
      case 2: // Important
        return {
          cardClass: 'border-amber-300 dark:border-amber-800',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
        };
      default: // Normal
        return {
          cardClass: '',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
        };
    }
  };
  
  const { cardClass, badgeClass } = getImportanceStyles();
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && onAddComment) {
      onAddComment(entry.id, comment);
      setComment('');
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(entry.id);
    }
    setShowDeleteConfirm(false);
  };

  // Formater l'affichage de la date selon qu'il s'agisse d'une plage ou d'une date unique
  const getDateDisplay = () => {
    if (entry.displayRange && entry.endDate) {
      return (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Du {formatDate(new Date(entry.date))} au {formatDate(new Date(entry.endDate))}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatDate(new Date(entry.date))} à {entry.time}</span>
        </div>
      );
    }
  };
  
  // Vérifier si une tâche est complétée pour une date spécifique
  const isCompletedForDate = (checkDate: Date = selectedDate) => {
    // Si ce n'est pas une tâche, on renvoie simplement isCompleted
    if (!entry.isTask) {
      return entry.isCompleted;
    }

    // Format YYYY-MM-DD de la date à vérifier
    const dateStr = formatToISOLocalDate(checkDate);
    
    // Si c'est une tâche sans plage de dates, on utilise isCompleted
    if (!entry.displayRange) {
      return entry.isCompleted;
    }
    
    // Pour les tâches récurrentes (plage de dates), vérifier si la date est dans completedDates
    if (entry.completedDates && entry.completedDates.length > 0) {
      return entry.completedDates.includes(dateStr);
    }
    
    return false; // Par défaut, pas complété
  };
  
  return (
    <Card 
      className={cn("mb-3 overflow-hidden", cardClass, {
        'opacity-75': isCompletedForDate(),
        'border-l-4 border-l-blue-500': !entry.isRead
      })}
    >
      <div 
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="text-xl">{entry.serviceIcon}</div>
          <div>
            <div className="font-medium flex items-center">
              {entry.serviceName}
              {entry.importance > 1 && (
                <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
              )}
              {entry.roomNumber && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Chambre {entry.roomNumber}
                </Badge>
              )}
              {!entry.isRead && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                  Nouveau
                </Badge>
              )}
              {entry.isTask && (
                <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                  Tâche
                </Badge>
              )}
              {entry.isTask && isCompletedForDate() && (
                <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                  Terminé
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {getDateDisplay()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      
      {expanded && (
        <>
          <div className="border-t px-4 py-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
                <span>{entry.authorName}</span>
                <span className="mx-2">•</span>
                <Home className="h-3.5 w-3.5 mr-1 text-slate-500" />
                <span>{entry.hotelName}</span>
              </div>
              
              <div className="flex space-x-1">
                {entry.isTask && onMarkAsCompleted && !isCompletedForDate() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsCompleted(entry.id);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Terminer
                  </Button>
                )}

                {entry.isTask && onUnmarkAsCompleted && isCompletedForDate() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnmarkAsCompleted(entry.id);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                )}
                
                {onEdit && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(entry.id);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className={cn("whitespace-pre-wrap mb-4", {
              "line-through text-muted-foreground": isCompletedForDate()
            })}>
              {entry.content}
            </div>
            
            {/* Comments section */}
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowComments(!showComments)}
                className="text-muted-foreground"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {entry.comments && entry.comments.length > 0 ? 
                  `${entry.comments.length} commentaire${entry.comments.length > 1 ? 's' : ''}` : 
                  'Commenter'
                }
              </Button>
              
              {showComments && (
                <div className="mt-3 space-y-3">
                  {entry.comments && entry.comments.map(comment => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                      <div className="flex justify-between items-center text-sm">
                        <div className="font-medium">{comment.authorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(new Date(comment.createdAt))}
                        </div>
                      </div>
                      <div className="mt-1 text-sm">
                        {comment.content}
                      </div>
                    </div>
                  ))}
                  
                  <form onSubmit={handleCommentSubmit} className="flex mt-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <Button 
                      type="submit"
                      className="rounded-l-none"
                      disabled={!comment.trim()}
                    >
                      Envoyer
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette consigne ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LogbookEntry;