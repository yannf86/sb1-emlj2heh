import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Bell, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  remindAt: string; // ISO date string
  entryId: string;
  isCompleted: boolean;
  userIds: string[];
}

interface LogbookRemindersProps {
  reminders: Reminder[];
  onAddReminder?: () => void;
  onViewReminder?: (reminderId: string) => void;
  onMarkAsCompleted?: (reminderId: string) => void;
}

const LogbookReminders: React.FC<LogbookRemindersProps> = ({
  reminders,
  onAddReminder,
  onViewReminder,
  onMarkAsCompleted
}) => {
  // Get today's and upcoming reminders
  const todaysReminders = reminders.filter(reminder => {
    const remindDate = new Date(reminder.remindAt);
    const today = new Date();
    return remindDate.getDate() === today.getDate() &&
           remindDate.getMonth() === today.getMonth() &&
           remindDate.getFullYear() === today.getFullYear() &&
           !reminder.isCompleted;
  });
  
  const upcomingReminders = reminders.filter(reminder => {
    const remindDate = new Date(reminder.remindAt);
    const today = new Date();
    return (remindDate > today) && !reminder.isCompleted &&
           !(remindDate.getDate() === today.getDate() &&
             remindDate.getMonth() === today.getMonth() &&
             remindDate.getFullYear() === today.getFullYear());
  }).sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());

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
          {todaysReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Aujourd'hui</h3>
              <div className="space-y-2">
                {todaysReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    onView={onViewReminder}
                    onComplete={onMarkAsCompleted}
                  />
                ))}
              </div>
            </div>
          )}
          
          {upcomingReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">À venir</h3>
              <div className="space-y-2">
                {upcomingReminders.slice(0, 3).map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    onView={onViewReminder}
                    onComplete={onMarkAsCompleted}
                  />
                ))}
                
                {upcomingReminders.length > 3 && (
                  <div className="text-center mt-2">
                    <Button variant="ghost\" size="sm\" className="text-xs">
                      Voir tous les rappels ({upcomingReminders.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {todaysReminders.length === 0 && upcomingReminders.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun rappel à venir</p>
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
  onView?: (reminderId: string) => void;
  onComplete?: (reminderId: string) => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({
  reminder,
  onView,
  onComplete
}) => {
  const remindDate = new Date(reminder.remindAt);
  const today = new Date();
  const isToday = remindDate.getDate() === today.getDate() &&
                 remindDate.getMonth() === today.getMonth() &&
                 remindDate.getFullYear() === today.getFullYear();

  return (
    <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-center">
        <div className="font-medium">{reminder.title}</div>
        <Badge 
          className={isToday ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}
        >
          {isToday 
            ? `${remindDate.getHours().toString().padStart(2, '0')}:${remindDate.getMinutes().toString().padStart(2, '0')}`
            : formatDate(remindDate)
          }
        </Badge>
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
            onClick={() => onView(reminder.id)}
          >
            Voir la consigne
          </Button>
        )}
        
        {onComplete && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onComplete(reminder.id)}
          >
            <Clock className="h-3 w-3 mr-1" />
            Terminé
          </Button>
        )}
      </div>
    </div>
  );
};

export default LogbookReminders;