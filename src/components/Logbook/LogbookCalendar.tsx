import React from 'react';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { LogbookReminder } from '../../types/logbook';

interface LogbookCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  reminders: LogbookReminder[];
}

const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function LogbookCalendar({ currentDate, onDateChange, reminders }: LogbookCalendarProps) {
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Adjust for Monday start
  const daysInMonth = lastDayOfMonth.getDate();

  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    onDateChange(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    onDateChange(nextMonth);
  };

  const goToToday = () => {
    onDateChange(today);
  };

  const goToTomorrow = () => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    onDateChange(tomorrow);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (!day) return false;
    return (
      day === currentDate.getDate() &&
      currentMonth === currentDate.getMonth() &&
      currentYear === currentDate.getFullYear()
    );
  };

  const hasReminders = (day: number | null) => {
    if (!day) return false;
    
    // Date du jour sélectionné dans le calendrier
    const date = new Date(currentYear, currentMonth, day);
    
    // Date actuelle (aujourd'hui) pour vérifier si les rappels sont expirés
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    return reminders.some(reminder => {
      // Normaliser les dates pour la comparaison
      const reminderStart = new Date(reminder.startDate);
      reminderStart.setHours(0, 0, 0, 0);
      const startTimestamp = reminderStart.getTime();
      
      const reminderEnd = reminder.endDate ? new Date(reminder.endDate) : new Date(reminderStart);
      reminderEnd.setHours(0, 0, 0, 0);
      const endTimestamp = reminderEnd.getTime();
      
      // Date cible (jour sélectionné dans le calendrier)
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      targetDate.setHours(0, 0, 0, 0);
      const targetTimestamp = targetDate.getTime();
      
      // 1. Vérifier si aujourd'hui est APRÈS la date de fin du rappel
      // Si c'est le cas, le rappel ne doit plus être visible nulle part
      if (todayTimestamp > endTimestamp) {
        return false;
      }
      
      // 2. Vérifier si la date cible est entre la date de début et la date de fin
      const isWithinDateRange = targetTimestamp >= startTimestamp && targetTimestamp <= endTimestamp;
      
      // Le rappel est visible si la date est dans la plage et qu'il est actif
      return isWithinDateRange && reminder.active;
    });
  };

  const selectDate = (day: number | null) => {
    if (day) {
      const newDate = new Date(currentYear, currentMonth, day);
      onDateChange(newDate);
    }
  };

  // Obtenir les rappels pour la date sélectionnée (currentDate)
  const selectedDateReminders = reminders.filter(reminder => {
    // Normaliser les dates pour la comparaison (sans l'heure)
    const reminderStart = new Date(reminder.startDate);
    reminderStart.setHours(0, 0, 0, 0);
    const startTimestamp = reminderStart.getTime();
    
    const reminderEnd = reminder.endDate ? new Date(reminder.endDate) : new Date(reminderStart);
    reminderEnd.setHours(0, 0, 0, 0);
    const endTimestamp = reminderEnd.getTime();
    
    // Date sélectionnée sans l'heure
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    selectedDate.setHours(0, 0, 0, 0);
    const selectedTimestamp = selectedDate.getTime();
    
    // Vérifier si la date sélectionnée est entre la date de début et la date de fin
    const isWithinDateRange = selectedTimestamp >= startTimestamp && selectedTimestamp <= endTimestamp;
    
    return isWithinDateRange && reminder.active;
  });
  
  // Obtenir les rappels pour aujourd'hui (pour l'affichage dans le calendrier)
  const todaysReminders = reminders.filter(reminder => {
    const reminderStart = new Date(reminder.startDate);
    reminderStart.setHours(0, 0, 0, 0);
    
    const reminderEnd = reminder.endDate ? new Date(reminder.endDate) : new Date(reminderStart);
    reminderEnd.setHours(0, 0, 0, 0);
    
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    todayDate.setHours(0, 0, 0, 0);
    
    return todayDate >= reminderStart && todayDate <= reminderEnd && reminder.active;
  });

  return (
    <div className="space-y-6">
      {/* Calendrier */}
      <div className="bg-white rounded-lg border border-warm-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-warm-900">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-warm-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 text-warm-400" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-warm-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4 text-warm-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-warm-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => selectDate(day)}
              disabled={!day}
              className={`h-8 relative flex items-center justify-center text-sm rounded-lg transition-colors ${
                !day
                  ? 'cursor-default'
                  : isSelected(day)
                  ? 'bg-creho-500 text-white'
                  : isToday(day)
                  ? 'bg-creho-100 text-creho-700 font-semibold'
                  : 'hover:bg-warm-100 text-warm-700'
              }`}
            >
              {day}
              {day && hasReminders(day) && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-warm-200">
          <div className="flex items-center justify-between text-sm">
            <button 
              onClick={goToToday}
              className="text-warm-600 hover:text-warm-900"
            >
              Aujourd'hui
            </button>
            <button 
              onClick={goToTomorrow}
              className="text-warm-600 hover:text-warm-900"
            >
              Demain
            </button>
          </div>
        </div>
      </div>

      {/* Section Rappels */}
      <div className="bg-white rounded-lg border border-warm-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-warm-900 flex items-center">
            <Bell className="w-4 h-4 mr-2 text-amber-500" />
            Rappels
          </h4>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-warm-600 text-center py-2">
            {currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          
          {selectedDateReminders.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-warm-500">Aucun rappel pour cette date</p>
            </div>
          ) : (
            selectedDateReminders.map((reminder) => (
              <div key={reminder.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">{reminder.title}</p>
                    {reminder.description && (
                      <p className="text-xs text-amber-700 mt-1">{reminder.description}</p>
                    )}
                    <p className="text-xs text-amber-600 mt-1">
                      {reminder.endDate && reminder.startDate.getTime() !== reminder.endDate.getTime() ? (
                        <>Du {reminder.startDate.toLocaleDateString('fr-FR')} au {reminder.endDate.toLocaleDateString('fr-FR')}</>
                      ) : (
                        reminder.startDate.toLocaleDateString('fr-FR')
                      )}
                    </p>
                  </div>
                  <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}