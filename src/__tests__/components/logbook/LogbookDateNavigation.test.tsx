import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogbookDateNavigation from '../../../components/logbook/LogbookDateNavigation';
import { formatDateForDisplay } from '../../../lib/date-utils';

describe('LogbookDateNavigation Component', () => {
  // Helper pour créer une date fixe
  const createTestDate = () => new Date(2025, 5, 10); // 10 juin 2025
  
  test('affiche correctement la date', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    expect(screen.getByText(formatDateForDisplay(testDate))).toBeInTheDocument();
  });
  
  test('appelle onDateChange avec la date précédente quand le bouton précédent est cliqué', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /chevron-left/i });
    fireEvent.click(prevButton);
    
    const expectedDate = new Date(testDate);
    expectedDate.setDate(testDate.getDate() - 1);
    expectedDate.setHours(0, 0, 0, 0);
    
    expect(handleDateChange).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getFullYear()).toBe(expectedDate.getFullYear());
    expect(calledDate.getMonth()).toBe(expectedDate.getMonth());
    expect(calledDate.getDate()).toBe(expectedDate.getDate());
    expect(calledDate.getHours()).toBe(0);
    expect(calledDate.getMinutes()).toBe(0);
    expect(calledDate.getSeconds()).toBe(0);
    expect(calledDate.getMilliseconds()).toBe(0);
  });
  
  test('appelle onDateChange avec la date suivante quand le bouton suivant est cliqué', () => {
    const testDate = createTestDate();
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    const expectedDate = new Date(testDate);
    expectedDate.setDate(testDate.getDate() + 1);
    expectedDate.setHours(0, 0, 0, 0);
    
    expect(handleDateChange).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getFullYear()).toBe(expectedDate.getFullYear());
    expect(calledDate.getMonth()).toBe(expectedDate.getMonth());
    expect(calledDate.getDate()).toBe(expectedDate.getDate());
    expect(calledDate.getHours()).toBe(0);
    expect(calledDate.getMinutes()).toBe(0);
    expect(calledDate.getSeconds()).toBe(0);
    expect(calledDate.getMilliseconds()).toBe(0);
  });
  
  test('affiche le bouton Aujourd\'hui quand la date n\'est pas aujourd\'hui', () => {
    // Définir la date système pour le test
    const realDate = new Date(2025, 5, 15); // 15 juin 2025
    jest.useFakeTimers().setSystemTime(realDate);
    
    const testDate = createTestDate(); // 10 juin 2025
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    const todayButton = screen.getByRole('button', { name: /aujourd'hui/i });
    expect(todayButton).toBeInTheDocument();
    
    fireEvent.click(todayButton);
    
    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(15); // L'heure système
    expect(calledDate.getMonth()).toBe(5);
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getHours()).toBe(0);
    expect(calledDate.getMinutes()).toBe(0);
    expect(calledDate.getSeconds()).toBe(0);
    expect(calledDate.getMilliseconds()).toBe(0);
    
    // Nettoyer les timers
    jest.useRealTimers();
  });
  
  test('n\'affiche pas le bouton Aujourd\'hui quand la date est aujourd\'hui', () => {
    // Définir la date système pour le test (même que la date sélectionnée)
    const testDate = createTestDate(); // 10 juin 2025
    jest.useFakeTimers().setSystemTime(testDate);
    
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    // Vérifier que le bouton Aujourd'hui n'est pas présent
    const todayButton = screen.queryByRole('button', { name: /aujourd'hui/i });
    expect(todayButton).not.toBeInTheDocument();
    
    // Nettoyer les timers
    jest.useRealTimers();
  });
  
  test('affiche correctement le texte relatif pour aujourd\'hui', () => {
    // Définir la date système pour le test (même que la date sélectionnée)
    const testDate = createTestDate(); // 10 juin 2025
    jest.useFakeTimers().setSystemTime(testDate);
    
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={testDate} 
        onDateChange={handleDateChange} 
      />
    );
    
    expect(screen.getByText("AUJOURD'HUI")).toBeInTheDocument();
    
    // Nettoyer les timers
    jest.useRealTimers();
  });
  
  test('affiche correctement le texte relatif pour demain', () => {
    // Définir la date système pour le test (jour avant la date sélectionnée)
    const today = new Date(2025, 5, 10); // 10 juin 2025
    jest.useFakeTimers().setSystemTime(today);
    
    const tomorrow = new Date(2025, 5, 11); // 11 juin 2025
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={tomorrow} 
        onDateChange={handleDateChange} 
      />
    );
    
    expect(screen.getByText("DEMAIN")).toBeInTheDocument();
    
    // Nettoyer les timers
    jest.useRealTimers();
  });
  
  test('affiche correctement le texte relatif pour hier', () => {
    // Définir la date système pour le test (jour après la date sélectionnée)
    const today = new Date(2025, 5, 10); // 10 juin 2025
    jest.useFakeTimers().setSystemTime(today);
    
    const yesterday = new Date(2025, 5, 9); // 9 juin 2025
    const handleDateChange = jest.fn();
    
    render(
      <LogbookDateNavigation 
        selectedDate={yesterday} 
        onDateChange={handleDateChange} 
      />
    );
    
    expect(screen.getByText("HIER")).toBeInTheDocument();
    
    // Nettoyer les timers
    jest.useRealTimers();
  });
});