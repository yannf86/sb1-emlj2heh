import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  formatDateForDisplay, 
  getPreviousDay,
  getNextDay, 
  isToday, 
  getWeekNumber,
  normalizeToMidnight
} from '@/lib/date-utils';

interface LogbookCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const LogbookCalendar: React.FC<LogbookCalendarProps> = ({
  selectedDate,
  onDateChange
}) => {
  // Month names in French
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  // Day names in French (starting with Monday)
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  
  // Calendar generation for the side panel
  const generateCalendar = (date: Date) => {
    // Créer une nouvelle date pour éviter de modifier l'originale
    const calendarDate = new Date(date.getTime());
    
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust for Sunday (0) as first day of week in JS but wanting Monday (1) as first
    const firstDayAdjusted = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;
    
    // Generate calendar days with padding for start of month
    const days = [];
    for (let i = 0; i < firstDayAdjusted; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Group days into weeks
    const weeks = [];
    let week = [];
    
    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      
      if (week.length === 7 || i === days.length - 1) {
        // Pad the last week if needed
        while (week.length < 7) {
          week.push(null);
        }
        
        weeks.push(week);
        week = [];
      }
    }
    
    return weeks;
  };
  
  const calendar = generateCalendar(selectedDate);
  
  // Navigate to previous/next month
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setMonth(newDate.getMonth() - 1);
    // Keep day the same, but ensure it's valid for the new month
    const day = Math.min(selectedDate.getDate(), new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate());
    newDate.setDate(day);
    onDateChange(normalizeToMidnight(newDate));
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setMonth(newDate.getMonth() + 1);
    // Keep day the same, but ensure it's valid for the new month
    const day = Math.min(selectedDate.getDate(), new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate());
    newDate.setDate(day);
    onDateChange(normalizeToMidnight(newDate));
  };
  
  // Change to specific date
  const goToDate = (year: number, month: number, day: number) => {
    const newDate = new Date(year, month, day);
    onDateChange(normalizeToMidnight(newDate));
  };
  
  // Go to today
  const goToToday = () => {
    onDateChange(normalizeToMidnight(new Date()));
  };
  
  // Check if a day is today
  const checkIsToday = (day: number | null): boolean => {
    if (!day) return false;
    
    const dateToCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    return isToday(dateToCheck);
  };
  
  // Check if a day is the currently selected day
  const isSelectedDay = (day: number | null): boolean => {
    if (!day) return false;
    
    return selectedDate.getDate() === day;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-brand-500" />
              <span>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendar.flat().map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-9"></div>;
            }
            
            const isTodayDate = checkIsToday(day);
            const isSelected = isSelectedDay(day);
            
            return (
              <Button
                key={`day-${index}`}
                variant={isSelected ? "default" : isTodayDate ? "outline" : "ghost"}
                size="sm"
                className={`h-9 w-full ${isSelected ? 'bg-brand-500 hover:bg-brand-600' : ''}`}
                onClick={() => goToDate(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  day
                )}
              >
                {day}
              </Button>
            );
          })}
        </div>
        
        <div className="flex space-x-2 mt-4 justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToToday}
            className="w-full"
          >
            Aujourd'hui
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const tomorrow = getNextDay(new Date());
              onDateChange(tomorrow);
            }}
            className="w-full"
          >
            Demain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogbookCalendar;