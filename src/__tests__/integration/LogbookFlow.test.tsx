import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import LogbookPage from '../../../src/pages/LogbookPage';
import DashboardPage from '../../../src/pages/DashboardPage';
import * as LogbookHooks from '../../../hooks/useLogbook';
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

jest.mock('../../../hooks/useLogbook');

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
  isAuthenticated: jest.fn(() => true),
  hasHotelAccess: jest.fn(() => true),
  hasModuleAccess: jest.fn(() => true),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}));

jest.mock('@/components/layouts/DashboardLayout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

// Mock des données pour les tests
const MOCK_ENTRIES_JUNE_10 = [
  {
    id: 'entry1',
    date: '2025-06-10',
    time: '09:00',
    hotelId: 'hotel1',
    serviceId: 'reception',
    serviceName: 'Réception',
    serviceIcon: '👥',
    content: 'Consigne pour le 10 juin',
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
    serviceName: 'Important',
    serviceIcon: '⚠️',
    content: 'Consigne importante pour le 10 juin',
    authorId: 'user1',
    authorName: 'Test User',
    importance: 2,
    isRead: false,
    comments: [],
    history: []
  }
];

const MOCK_ENTRIES_JUNE_11 = [
  {
    id: 'entry3',
    date: '2025-06-11',
    time: '10:00',
    hotelId: 'hotel1',
    serviceId: 'reception',
    serviceName: 'Réception',
    serviceIcon: '👥',
    content: 'Consigne pour le 11 juin',
    authorId: 'user1',
    authorName: 'Test User',
    importance: 1,
    isRead: true,
    comments: [],
    history: []
  }
];

describe('Flux Complet du Cahier de Consignes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock du hook useLogbookEntries pour retourner des données en fonction de la date
    (LogbookHooks.useLogbookEntries as jest.Mock).mockImplementation((date) => {
      const formattedDate = date.toISOString().split('T')[0];
      if (formattedDate === '2025-06-10') {
        return { data: MOCK_ENTRIES_JUNE_10, isLoading: false, error: null };
      } else if (formattedDate === '2025-06-11') {
        return { data: MOCK_ENTRIES_JUNE_11, isLoading: false, error: null };
      }
      return { data: [], isLoading: false, error: null };
    });
    
    // Mock pour onSnapshot - retourne les bonnes entrées en fonction de la date
    (onSnapshot as jest.Mock).mockImplementation((queryObj, callback) => {
      // Extraire la date de la requête
      const dateFilter = (where as jest.Mock).mock.calls.find(call => call[0] === 'date');
      let entries = [];
      
      if (dateFilter && dateFilter[2] === '2025-06-10') {
        entries = MOCK_ENTRIES_JUNE_10;
      } else if (dateFilter && dateFilter[2] === '2025-06-11') {
        entries = MOCK_ENTRIES_JUNE_11;
      }
      
      callback({
        docs: entries.map(entry => ({
          id: entry.id,
          data: () => entry
        }))
      });
      
      // Retourner une fonction pour désabonner
      return jest.fn();
    });

    // Mock pour getDocs
    (getDocs as jest.Mock).mockImplementation(async (queryObj) => {
      // Extraire la date de la requête
      const dateFilter = (where as jest.Mock).mock.calls.find(call => call[0] === 'date');
      let entries = [];
      
      if (dateFilter && dateFilter[2] === '2025-06-10') {
        entries = MOCK_ENTRIES_JUNE_10;
      } else if (dateFilter && dateFilter[2] === '2025-06-11') {
        entries = MOCK_ENTRIES_JUNE_11;
      }
      
      return {
        docs: entries.map(entry => ({
          id: entry.id,
          data: () => entry
        }))
      };
    });
    
    // Mock des autres hooks nécessaires
    (LogbookHooks.useMarkLogbookEntryAsRead as jest.Mock).mockReturnValue({
      mutate: jest.fn()
    });
    (LogbookHooks.useAddCommentToLogbookEntry as jest.Mock).mockReturnValue({
      mutate: jest.fn()
    });
    (LogbookHooks.useMarkLogbookEntryAsCompleted as jest.Mock).mockReturnValue({
      mutate: jest.fn()
    });
    
    // Définir une date fixe pour tous les tests: 10 juin 2025
    const testDate = new Date(2025, 5, 10);
    jest.useFakeTimers().setSystemTime(testDate);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('flux complet: affichage, navigation entre jours et retour correct', async () => {
    render(
      <MemoryRouter initialEntries={['/logbook']}>
        <Routes>
          <Route path="/logbook" element={<LogbookPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // 1. Vérifier l'affichage initial avec les consignes du 10 juin 2025
    await waitFor(() => {
      expect(screen.getByText(/10 juin 2025/i)).toBeInTheDocument();
      expect(screen.getByText('Consigne pour le 10 juin')).toBeInTheDocument();
      expect(screen.getByText('Consigne importante pour le 10 juin')).toBeInTheDocument();
    });
    
    // 2. Naviguer vers le 11 juin 2025
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    // Vérifier que la date et les consignes ont changé
    await waitFor(() => {
      expect(screen.getByText(/11 juin 2025/i)).toBeInTheDocument();
      expect(screen.getByText('Consigne pour le 11 juin')).toBeInTheDocument();
      expect(screen.queryByText('Consigne pour le 10 juin')).not.toBeInTheDocument();
    });
    
    // 3. Revenir au 10 juin 2025
    const prevButton = screen.getByRole('button', { name: /chevron-left/i });
    fireEvent.click(prevButton);
    
    // Vérifier que les consignes du 10 juin sont à nouveau affichées
    await waitFor(() => {
      expect(screen.getByText(/10 juin 2025/i)).toBeInTheDocument();
      expect(screen.getByText('Consigne pour le 10 juin')).toBeInTheDocument();
      expect(screen.getByText('Consigne importante pour le 10 juin')).toBeInTheDocument();
    });
    
    // 4. Utiliser le calendrier pour naviguer au 11 juin
    // D'abord trouver et développer le calendrier
    const day11 = screen.getByRole('button', { name: '11' });
    fireEvent.click(day11);
    
    // Vérifier que la date et les consignes ont changé
    await waitFor(() => {
      expect(screen.getByText(/11 juin 2025/i)).toBeInTheDocument();
      expect(screen.getByText('Consigne pour le 11 juin')).toBeInTheDocument();
    });
    
    // 5. Naviguer vers le dashboard (simuler un changement de route)
    // TODO: Améliorer le test avec un vrai changement de route si possible
    
    // 6. Revenir au cahier de consignes (simuler un retour)
    // Pour le moment, nous allons juste vérifier que les données sont toujours correctes
    await waitFor(() => {
      expect(screen.getByText(/11 juin 2025/i)).toBeInTheDocument();
    });
  });
  
  test('conserve la date sélectionnée lors de la navigation dans le calendrier', async () => {
    render(
      <MemoryRouter initialEntries={['/logbook']}>
        <LogbookPage />
      </MemoryRouter>
    );
    
    // Attendre le chargement initial
    await waitFor(() => {
      expect(screen.getByText(/10 juin 2025/i)).toBeInTheDocument();
    });
    
    // Naviguer vers le mois suivant dans le calendrier
    const nextMonthButton = screen.getByRole('button', { name: /chevron-right/i, hidden: true });
    fireEvent.click(nextMonthButton);
    
    // Sélectionner le 15 juillet
    const day15 = await screen.findByRole('button', { name: '15' });
    fireEvent.click(day15);
    
    // Vérifier que la date a changé pour le 15 juillet 2025
    await waitFor(() => {
      expect(screen.getByText(/15 juillet 2025/i)).toBeInTheDocument();
    });
    
    // Naviguer vers le mois précédent
    const prevMonthButton = screen.getByRole('button', { name: /chevron-left/i, hidden: true });
    fireEvent.click(prevMonthButton);
    
    // Vérifier que nous sommes revenus au mois de juin mais que le jour reste le 15
    await waitFor(() => {
      expect(screen.getByText(/15 juin 2025/i)).toBeInTheDocument();
    });
  });
  
  test('fonctionne correctement lors du passage entre les mois', async () => {
    // Définir le dernier jour du mois
    const lastDayOfMonth = new Date(2025, 5, 30); // 30 juin 2025
    jest.useFakeTimers().setSystemTime(lastDayOfMonth);
    
    render(
      <MemoryRouter initialEntries={['/logbook']}>
        <LogbookPage />
      </MemoryRouter>
    );
    
    // Attendre le chargement initial
    await waitFor(() => {
      expect(screen.getByText(/30 juin 2025/i)).toBeInTheDocument();
    });
    
    // Naviguer vers le jour suivant (1er juillet)
    const nextDayButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextDayButton);
    
    // Vérifier que la date a changé pour le 1er juillet 2025
    await waitFor(() => {
      expect(screen.getByText(/1 juillet 2025/i)).toBeInTheDocument();
    });
    
    // Naviguer vers le jour précédent (retour au 30 juin)
    const prevDayButton = screen.getByRole('button', { name: /chevron-left/i });
    fireEvent.click(prevDayButton);
    
    // Vérifier que nous sommes revenus au 30 juin 2025
    await waitFor(() => {
      expect(screen.getByText(/30 juin 2025/i)).toBeInTheDocument();
    });
  });
});