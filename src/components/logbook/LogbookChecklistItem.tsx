import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Clock, User, Calendar, Building, CalendarRange, CheckSquare, Info } from 'lucide-react';

interface LogbookChecklistItemProps {
  item: {
    id: string;
    serviceId: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate: string;
    endDate?: string;
    isPermanent?: boolean;
    hotelId?: string;
    hotelName?: string;
    completedById?: string | null;
    completedByName?: string | null;
    completedAt?: string | null;
  };
  onToggle: (id: string) => void;
}

const LogbookChecklistItem: React.FC<LogbookChecklistItemProps> = ({
  item,
  onToggle
}) => {
  const serviceName = {
    'important': { name: 'Important', icon: '⚠️' },
    'reception': { name: 'Réception', icon: '👥' },
    'housekeeping': { name: 'Housekeeping', icon: '🛏️' },
    'restaurant': { name: 'Restaurant', icon: '🍽️' },
    'technical': { name: 'Technique', icon: '🔧' },
    'direction': { name: 'Direction', icon: '👑' }
  }[item.serviceId] || { name: 'Autre', icon: '📋' };

  return (
    <Card className={`${item.completed ? 'opacity-75' : ''}`}>
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          <input
            type="checkbox"
            checked={item.completed} 
            onChange={() => onToggle(item.id)}
            className="mr-2 h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            id={`checklist-item-${item.id}`}
          />
          <label 
            htmlFor={`checklist-item-${item.id}`}
            className="flex-1 cursor-pointer"
          >
            <div>
              <div className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </div>
              {item.description && (
                <div className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                  {item.description}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {item.hotelName && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Building className="h-3 w-3 mr-1" />
                    <span>{item.hotelName}</span>
                  </div>
                )}
                
                {item.isPermanent ? (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Tâche permanente
                  </Badge>
                ) : item.endDate ? (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <CalendarRange className="h-3 w-3 mr-1" />
                    Du {formatDate(new Date(item.dueDate))} au {formatDate(new Date(item.endDate))}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(new Date(item.dueDate))}
                  </Badge>
                )}
              </div>
            </div>
          </label>
          
          <div className="flex items-center">
            <Badge className="mr-2">
              <span className="mr-1">{serviceName.icon}</span>
              <span>{serviceName.name}</span>
            </Badge>
          </div>
        </div>
        
        {item.completed && item.completedById && (
          <div className="px-4 py-2 border-t bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span>Terminé par {item.completedByName}</span>
            <span className="mx-2">•</span>
            <Clock className="h-3 w-3 mr-1" />
            <span>{item.completedAt ? formatDate(new Date(item.completedAt)) : 'Date inconnue'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LogbookChecklistItem;