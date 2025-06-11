import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConsignesTab from '../../../components/logbook/ConsignesTab';
import * as LogbookHooks from '../../../hooks/useLogbook';
import * as AuthModule from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

// Mock les dépendances
jest.mock('../../../lib/firebase', () => ({
  db: {},
  auth: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  deleteDoc: jest.fn(),
  orderBy: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
}));

jest.mock('../../../hooks/useLogbook', () => ({
  useLogbookEntries: jest.fn(),
  useMarkLogbookEntryAsRead: jest.fn(() => ({ mutate: jest.fn() })),
  useMarkLogbookEntryAsCompleted: jest.fn(() => ({ mutate: jest.fn() })),
  useAddCommentToLogbookEntry: jest.fn(() => ({ mutate: jest.fn() })),
  deleteLogbookEntry: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../lib/db/hotels', () => ({
  getHotels: jest.fn(() => Promise.resolve([
    { id: 'hotel1', name: 'Hôtel Royal Palace' },
    { id: 'hotel2', name: 'Riviera Luxury Hotel' }
  ]))
}));

jest.mock('../../../lib/auth', () => ({
  getCurrentUser: jest.fn(() => ({
    id: 'user1',
    name: 'Test User',
    hotels: ['hotel1', 'hotel2'],
    modules: ['mod1', 'mod2', 'mod12']
  })),
  isAuthenticated: jest.fn(() => true)
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}));

const SERVICES = [
  { id: 'important', name: 'Important', icon: '⚠️' },
  { id: 'reception', name: 'Réception', icon: '👥' }
];

const MOCK_ENTRIES = [
  {
    id: 'entry1',
    date: '2025-06-10',
    time: '09:00',
    hotelId: 'hotel1',
    serviceId: 'reception',
    content: 'Entrée test 1',
    authorId: 'user1',
    authorName: 'Test User',
    importance: 1,
    isRead: true,
    comments: [],
    history: []
  },
  {
    id: 'entry2',
    date: '2025-06-10',
    time: '14:00',
    hotelId: 'hotel1',
    serviceId: 'important',
    content: 'Entrée test 2',
    authorId: 'user1',
    authorName: 'Test User',
    importance: 2,
    isRead: false,
    comments: [],
    history: []
  }
];

describe('ConsignesTab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure le mock pour useLogbookEntries
    (LogbookHooks.useLogbookEntries as jest.Mock).mockReturnValue({
      data: MOCK_ENTRIES,
      isLoading: false,
      error: null
    });
    
    // Configure le mock pour onSnapshot
    (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
      callback({
        docs: MOCK_ENTRIES.map(entry => ({
          id: entry.id,
          data: () => entry
        }))
      });
      
      // Retourne une fonction pour désabonner
      return jest.fn();
    });

    // Configure le mock pour getDocs
    (getDocs as jest.Mock).mockResolvedValue({
      docs: MOCK_ENTRIES.map(entry => ({
        id: entry.id,
        data: () => entry
      }))
    });
  });
  
  test('affiche correctement les entrées du cahier pour une date spécifique', async () => {
    // Définir une date fixe pour le test: 10 juin 2025
    const testDate = new Date(2025, 5, 10);
    jest.useFakeTimers().setSystemTime(testDate);
    
    render(<ConsignesTab services={SERVICES} />);
    
    // Vérifier que la date est affichée correctement
    await waitFor(() => {
      expect(screen.getByText(/10 juin 2025/i)).toBeInTheDocument();
    });
    
    // Vérifier que les entrées du cahier sont affichées
    await waitFor(() => {
      expect(screen.getByText('Entrée test 1')).toBeInTheDocument();
      expect(screen.getByText('Entrée test 2')).toBeInTheDocument();
    });
    
    // Vérifier que les services sont affichés
    expect(screen.getByText('Réception')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
  });

  test('navigation entre les dates', async () => {
    // Définir une date fixe pour le test: 10 juin 2025
    const testDate = new Date(2025, 5, 10);
    jest.useFakeTimers().setSystemTime(testDate);
    
    render(<ConsignesTab services={SERVICES} />);
    
    // Vérifier que la date initiale est affichée correctement
    await waitFor(() => {
      expect(screen.getByText(/10 juin 2025/i)).toBeInTheDocument();
    });
    
    // Naviguer vers le jour suivant (11 juin)
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    // Vérifier que la date a changé
    await waitFor(() => {
      expect(screen.getByText(/11 juin 2025/i)).toBeInTheDocument();
    });
    
    // Retourner au 10 juin
    const prevButton = screen.getByRole('button', { name: /chevron-left/i });
    fireEvent.click(prevButton);
    
    // Vérifier que la date est revenue au 10 juin
    await waitFor(() => {
      expect(screen.getByText(/10 juin 2025/i)).toBeInTheDocument();
    });
    
    // Aller à aujourd'hui (si aujourd'hui n'est pas déjà le 10 juin)
    if (new Date().getDate() !== 10 || new Date().getMonth() !== 5 || new Date().getFullYear() !== 2025) {
      const todayButton = screen.getByRole('button', { name: /aujourd'hui/i });
      fireEvent.click(todayButton);
      
      // Vérifier que la date est aujourd'hui
      await waitFor(() => {
        expect(screen.getByText(/aujourd'hui/i, { exact: false })).toBeInTheDocument();
      });
    }
  });
  
  test('suppression d\'une entrée', async () => {
    render(<ConsignesTab services={SERVICES} />);
    
    // Ouvrir l'entrée
    await waitFor(() => {
      const entryElement = screen.getByText('Entrée test 1');
      fireEvent.click(entryElement);
    });
    
    // Cliquer sur le bouton de suppression
    const deleteButton = screen.getByRole('button', { name: /trash/i });
    fireEvent.click(deleteButton);
    
    // Confirmer la suppression
    const confirmButton = screen.getByRole('button', { name: /supprimer/i });
    fireEvent.click(confirmButton);
    
    // Vérifier que la méthode de suppression a été appelée
    await waitFor(() => {
      expect(LogbookHooks.deleteLogbookEntry).toHaveBeenCalledWith('entry1');
    });
  });
  
  test('filtrage par hôtel', async () => {
    render(<ConsignesTab services={SERVICES} />);
    
    // Attendre que le composant soit chargé
    await waitFor(() => {
      expect(screen.getByText(/rechercher dans les consignes/i)).toBeInTheDocument();
    });
    
    // Sélectionner le filtre d'hôtel
    const hotelSelect = screen.getByRole('combobox', { name: /hôtel/i });
    fireEvent.click(hotelSelect);
    
    // Choisir un hôtel
    const hotelOption = screen.getByText('Hôtel Royal Palace');
    fireEvent.click(hotelOption);
    
    // Vérifier que la requête Firebase a été appelée avec le bon filtre
    expect(where).toHaveBeenCalledWith('hotelId', '==', 'hotel1');
  });
});