import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Clock, User, Calendar, Building, CalendarRange, CheckSquare, Info } from 'lucide-react';
import { useLogbookEntries } from '@/hooks/useLogbook';
import { isDateInRange, parseISOLocalDate, formatToISOLocalDate } from '@/lib/date-utils';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  remindAt: string; // ISO date string
  entryId: string;
  isCompleted?: boolean;
  completedById?: string;
  completedByName?: string;
  completedAt?: string;
  userIds: string[];
  // Nouvelles propriétés pour les plages de dates
  endDate?: string; // Date de fin optionnelle
  displayRange?: boolean; // Indique si c'est une plage de dates
}

interface LogbookRemindersProps {
  selectedDate?: Date; // Date actuellement affichée
  onAddReminder?: () => void;
  onViewReminder?: (reminderId: string) => void;
  onMarkAsCompleted?: (reminderId: string) => void;
}

const LogbookReminders: React.FC<LogbookRemindersProps> = ({
  selectedDate = new Date(),
  onAddReminder,
  onViewReminder,
  onMarkAsCompleted,
}) => {
  // Utiliser useLogbookEntries pour récupérer les entrées avec rappels
  const { 
    data: entries = [], 
    isLoading: isLoadingEntries
  } = useLogbookEntries(selectedDate);

  // Filtrer les entrées pour ne garder que celles avec rappels
  const entriesWithReminders = entries.filter(entry => 
    entry.hasReminder && entry.reminderTitle
  );
  
  // Convertir les entrées en objets "rappel" pour l'affichage
  const reminders: Reminder[] = entriesWithReminders.map(entry => ({
    id: entry.id,
    title: entry.reminderTitle || entry.content.substring(0, 40) + '...',
    description: entry.reminderDescription || entry.content,
    remindAt: entry.date,
    entryId: entry.id,
    isCompleted: entry.isCompleted || false,
    userIds: entry.reminderUserIds || [entry.authorId],
    endDate: entry.endDate,
    displayRange: entry.displayRange
  }));

  // Récupérer la date sélectionnée au format ISO pour comparaison
  const selectedDateStr = formatToISOLocalDate(selectedDate);

  // Filtrer pour obtenir les rappels actifs pour la date sélectionnée
  const activeReminders = reminders.filter(reminder => {
    // Ne pas afficher les rappels complétés si ce ne sont pas des tâches récurrentes
    if (reminder.isCompleted && !reminder.displayRange) return false;
    
    // Si c'est une plage de dates
    if (reminder.displayRange && reminder.endDate) {
      const startDate = parseISOLocalDate(reminder.remindAt);
      const endDate = parseISOLocalDate(reminder.endDate);
      return isDateInRange(selectedDate, startDate, endDate);
    }
    
    // Pour une date unique, comparer les chaînes de date YYYY-MM-DD
    return reminder.remindAt.split('T')[0] === selectedDateStr;
  });

  if (isLoadingEntries) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-brand-500" />
              <span>Rappels</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-muted-foreground">
            Chargement des rappels...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-brand-500" />
            <span>Rappels</span>
          </div>
          {onAddReminder && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddReminder}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Aujourd'hui</h3>
              <div className="space-y-2">
                {activeReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    onView={onViewReminder ? () => onViewReminder(reminder.entryId) : undefined}
                    onComplete={onMarkAsCompleted ? () => onMarkAsCompleted(reminder.id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
          
          {activeReminders.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun rappel pour aujourd'hui</p>
              {onAddReminder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddReminder}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un rappel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ReminderItemProps {
  reminder: Reminder;
  onView?: () => void;
  onComplete?: () => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({
  reminder,
  onView,
  onComplete
}) => {
  // Formater l'affichage de la date
  const getDateDisplay = () => {
    if (reminder.displayRange && reminder.endDate) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          Du {formatDate(new Date(reminder.remindAt))} au {formatDate(new Date(reminder.endDate))}
        </Badge>
      );
    }

    const remindDate = new Date(reminder.remindAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    remindDate.setHours(0, 0, 0, 0);
    
    const isToday = remindDate.getTime() === today.getTime();

    return (
      <Badge 
        className={isToday ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}
      >
        {formatDate(remindDate)}
      </Badge>
    );
  };

  return (
    <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-center">
        <div className="font-medium">{reminder.title}</div>
        {getDateDisplay()}
      </div>
      
      {reminder.description && (
        <div className="text-sm text-muted-foreground mt-1">
          {reminder.description}
        </div>
      )}
      
      <div className="flex justify-end mt-2">
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs mr-2"
            onClick={onView}
          >
            Voir la consigne
          </Button>
        )}
        
        {onComplete && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onComplete}
          >
            <Clock className="h-3 w-3 mr-1" />
            Terminé
          </Button>
        )}
      </div>
    </div>
  );
};

// Import Bell icon locally
const Bell = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Ajout de l'icône AlertTriangle
const AlertTriangle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export default LogbookReminders;