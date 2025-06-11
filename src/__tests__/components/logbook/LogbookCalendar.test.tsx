import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogbookCalendar from '../../../components/logbook/LogbookCalendar';
import { normalizeToMidnight } from '../../../lib/date-utils';

describe('LogbookCalendar Component', () => {
  // Helper pour créer une date fixe
  const createTestDate = () => new Date(2025, 5, 10); // 10 juin 2025
  
  test('affiche correctement le calendrier pour un mois donné', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    // Vérifier que le mois et l'année sont affichés correctement
    expect(screen.getByText('Juin 2025')).toBeInTheDocument();
    
    // Vérifier que les jours de la semaine sont affichés
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    
    // Vérifier que le jour sélectionné est bien le 10
    const day10 = screen.getByRole('button', { name: '10' });
    expect(day10).toHaveClass('bg-brand-500');
  });
  
  test('appelle onDateChange avec le mois précédent quand le bouton précédent est cliqué', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /chevron-left/i });
    fireEvent.click(prevButton);
    
    // Vérifier que onDateChange est appelé avec une date en mai 2025
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(4); // Mai (0-indexed)
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getDate()).toBe(10); // Même jour du mois
  });
  
  test('appelle onDateChange avec le mois suivant quand le bouton suivant est cliqué', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    // Vérifier que onDateChange est appelé avec une date en juillet 2025
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(6); // Juillet (0-indexed)
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getDate()).toBe(10); // Même jour du mois
  });
  
  test('appelle onDateChange avec la date aujourd\'hui quand le bouton Aujourd\'hui est cliqué', () => {
    // Définir la date système pour le test
    const today = new Date(2025, 5, 15); // 15 juin 2025
    jest.useFakeTimers().setSystemTime(today);
    
    const testDate = createTestDate(); // 10 juin 2025
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const todayButton = screen.getByRole('button', { name: /aujourd'hui/i });
    fireEvent.click(todayButton);
    
    // Vérifier que onDateChange est appelé avec la date actuelle
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(15);
    expect(calledDate.getMonth()).toBe(5);
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getHours()).toBe(0);
    expect(calledDate.getMinutes()).toBe(0);
    expect(calledDate.getSeconds()).toBe(0);
    
    // Nettoyer les timers
    jest.useRealTimers();
  });
  
  test('appelle onDateChange quand un jour est cliqué', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    // Cliquer sur le jour 15
    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);
    
    // Vérifier que onDateChange est appelé avec le 15 juin 2025
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(15);
    expect(calledDate.getMonth()).toBe(5);
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getHours()).toBe(0);
    expect(calledDate.getMinutes()).toBe(0);
    expect(calledDate.getSeconds()).toBe(0);
  });
  
  test('appelle onDateChange avec la date demain quand le bouton Demain est cliqué', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const tomorrowButton = screen.getByRole('button', { name: /demain/i });
    fireEvent.click(tomorrowButton);
    
    // Vérifier que onDateChange est appelé avec demain (11 juin 2025)
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(11);
    expect(calledDate.getMonth()).toBe(5);
    expect(calledDate.getFullYear()).toBe(2025);
  });
  
  test('gère correctement les mois à jours variables', () => {
    // Février dans une année bissextile (2024)
    const febLeapYear = new Date(2024, 1, 10); // 10 février 2024
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={febLeapYear} 
        onDateChange={handleDateChange} 
      />
    );
    
    // Vérifier que le mois est février 2024
    expect(screen.getByText('Février 2024')).toBeInTheDocument();
    
    // Vérifier que le jour 29 existe (année bissextile)
    expect(screen.getByRole('button', { name: '29' })).toBeInTheDocument();
    
    // Naviguer vers mars
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    // Vérifier que onDateChange est appelé avec le 10 mars 2024
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(2); // Mars (0-indexed)
    expect(calledDate.getFullYear()).toBe(2024);
    expect(calledDate.getDate()).toBe(10); // Même jour
  });
  
  test('gère correctement les transitions d\'année', () => {
    // 31 décembre 2024
    const endOfYear = new Date(2024, 11, 31);
    const handleDateChange = jest.fn();
    
    render(
      <LogbookCalendar 
        selectedDate={endOfYear} 
        onDateChange={handleDateChange} 
      />
    );
    
    // Vérifier que le mois est décembre 2024
    expect(screen.getByText('Décembre 2024')).toBeInTheDocument();
    
    // Naviguer vers le mois suivant (janvier 2025)
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    // Vérifier que onDateChange est appelé avec une date en janvier 2025
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(0); // Janvier
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getDate()).toBe(31);
  });
});