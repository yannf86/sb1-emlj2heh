import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust for Sunday (0) as first day of week in JS but wanting Monday (1) as first
    const firstDayAdjusted = (firstDay === 0) ? 6 : firstDay - 1;
    
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
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };
  
  // Change to specific date
  const goToDate = (year: number, month: number, day: number) => {
    const newDate = new Date(year, month, day);
    onDateChange(newDate);
  };
  
  // Go to today
  const goToToday = () => {
    onDateChange(new Date());
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
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
            
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
            const isSelectedDay = 
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === date.getMonth() &&
              selectedDate.getFullYear() === date.getFullYear();
            
            const isTodayDate = 
              new Date().getDate() === day &&
              new Date().getMonth() === date.getMonth() &&
              new Date().getFullYear() === date.getFullYear();
            
            return (
              <Button
                key={`day-${index}`}
                variant={isSelectedDay ? "default" : isTodayDate ? "outline" : "ghost"}
                size="sm"
                className={`h-9 w-full ${isSelectedDay ? 'bg-brand-500 hover:bg-brand-600' : ''}`}
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
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
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