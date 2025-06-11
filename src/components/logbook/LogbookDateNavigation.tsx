import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatDateForDisplay, getPreviousDay, getNextDay, isToday, normalizeToMidnight } from '@/lib/date-utils';

interface LogbookDateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const LogbookDateNavigation: React.FC<LogbookDateNavigationProps> = ({
  selectedDate,
  onDateChange
}) => {
  // Go to previous day
  const goToPreviousDay = () => {
    onDateChange(getPreviousDay(selectedDate));
  };

  // Go to next day
  const goToNextDay = () => {
    onDateChange(getNextDay(selectedDate));
  };

  // Go to today
  const goToToday = () => {
    onDateChange(normalizeToMidnight(new Date()));
  };

  // Get relative day text (AUJOURD'HUI, DEMAIN, HIER, etc.)
  const getRelativeDayText = () => {
    const today = normalizeToMidnight(new Date());
    
    // Calculer la différence en jours
    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "AUJOURD'HUI";
    if (diffDays === 1) return "DEMAIN";
    if (diffDays === -1) return "HIER";
    
    if (diffDays > 1) return `DANS ${diffDays} JOURS`;
    if (diffDays < -1) return `IL Y A ${Math.abs(diffDays)} JOURS`;
    
    return "";
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            className="h-9 w-9 mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold capitalize">
            {formatDateForDisplay(selectedDate)}
          </h2>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            className="h-9 w-9 ml-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {!isToday(selectedDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="flex items-center"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Aujourd'hui
          </Button>
        )}
      </div>
      
      {getRelativeDayText() && (
        <div className="text-sm text-brand-500 font-medium">
          {getRelativeDayText()}
        </div>
      )}
    </div>
  );
};

export default LogbookDateNavigation;