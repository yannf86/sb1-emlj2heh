import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogbookEntry from '../../../components/logbook/LogbookEntry';

describe('LogbookEntry Component', () => {
  // Mock de l'entrée de test
  const mockEntry = {
    id: 'entry1',
    date: '2025-06-10',
    time: '09:30',
    hotelId: 'hotel1',
    hotelName: 'Hôtel Royal Palace',
    serviceId: 'reception',
    serviceName: 'Réception',
    serviceIcon: '👥',
    content: 'Ceci est un test d\'entrée',
    authorId: 'user1',
    authorName: 'Jean Dupont',
    importance: 2,
    isRead: false,
    roomNumber: '101',
    comments: [
      {
        id: 'comment1',
        authorId: 'user2',
        authorName: 'Marie Martin',
        content: 'Commentaire de test',
        createdAt: '2025-06-10T10:00:00.000Z'
      }
    ],
    history: []
  };

  // Mock des fonctions de gestion des événements
  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onMarkAsRead: jest.fn(),
    onMarkAsCompleted: jest.fn(),
    onAddComment: jest.fn()
  };

  test('affiche correctement les informations de base', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    expect(screen.getByText('Réception')).toBeInTheDocument();
    expect(screen.getByText('Chambre 101')).toBeInTheDocument();
    expect(screen.getByText('Nouveau')).toBeInTheDocument();
  });

  test('affiche l\'entrée réduite par défaut', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Le contenu ne devrait pas être visible initialement
    expect(screen.queryByText('Ceci est un test d\'entrée')).not.toBeInTheDocument();
  });

  test('développe l\'entrée au clic', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Cliquer sur l'entrée pour la développer
    fireEvent.click(screen.getByText('Réception'));
    
    // Maintenant le contenu devrait être visible
    expect(screen.getByText('Ceci est un test d\'entrée')).toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Hôtel Royal Palace')).toBeInTheDocument();
  });

  test('affiche les commentaires quand demandé', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Cliquer pour développer l'entrée
    fireEvent.click(screen.getByText('Réception'));
    
    // Cliquer pour afficher les commentaires
    fireEvent.click(screen.getByText('1 commentaire'));
    
    // Vérifier que le commentaire est affiché
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    expect(screen.getByText('Commentaire de test')).toBeInTheDocument();
  });

  test('appelle onDelete avec confirmation', async () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Développer l'entrée
    fireEvent.click(screen.getByText('Réception'));
    
    // Cliquer sur le bouton de suppression
    fireEvent.click(screen.getByRole('button', { name: /trash/i }));
    
    // La boîte de dialogue de confirmation devrait s'afficher
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
    
    // Confirmer la suppression
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }));
    
    // Vérifier que onDelete a été appelé avec le bon ID
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('entry1');
  });

  test('gère l\'annulation de la suppression', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Développer l'entrée
    fireEvent.click(screen.getByText('Réception'));
    
    // Cliquer sur le bouton de suppression
    fireEvent.click(screen.getByRole('button', { name: /trash/i }));
    
    // Annuler la suppression
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    
    // Vérifier que onDelete n'a pas été appelé
    expect(mockHandlers.onDelete).not.toHaveBeenCalled();
  });
  
  test('formate correctement l\'affichage des dates de plage', () => {
    const rangeEntry = {
      ...mockEntry,
      displayRange: true,
      endDate: '2025-06-15'
    };
    
    render(<LogbookEntry entry={rangeEntry} {...mockHandlers} />);
    
    // Vérifier que la plage de dates est affichée correctement
    expect(screen.getByText(/du 10\/06\/2025 au 15\/06\/2025/i)).toBeInTheDocument();
  });
  
  test('appelle onEdit quand le bouton d\'édition est cliqué', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Développer l'entrée
    fireEvent.click(screen.getByText('Réception'));
    
    // Cliquer sur le bouton d'édition
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    // Vérifier que onEdit a été appelé avec le bon ID
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('entry1');
  });

  test('appelle onAddComment lorsqu\'un commentaire est soumis', () => {
    render(<LogbookEntry entry={mockEntry} {...mockHandlers} />);
    
    // Développer l'entrée
    fireEvent.click(screen.getByText('Réception'));
    
    // Cliquer pour afficher les commentaires
    fireEvent.click(screen.getByText('1 commentaire'));
    
    // Entrer un nouveau commentaire
    const commentInput = screen.getByPlaceholderText('Ajouter un commentaire...');
    fireEvent.change(commentInput, { target: { value: 'Nouveau commentaire' } });
    
    // Soumettre le formulaire
    fireEvent.submit(commentInput.closest('form'));
    
    // Vérifier que onAddComment a été appelé avec les bons arguments
    expect(mockHandlers.onAddComment).toHaveBeenCalledWith('entry1', 'Nouveau commentaire');
  });
  
  test('n\'affiche pas le badge Nouveau pour les entrées lues', () => {
    const readEntry = {
      ...mockEntry,
      isRead: true
    };
    
    render(<LogbookEntry entry={readEntry} {...mockHandlers} />);
    
    // Le badge Nouveau ne devrait pas être présent
    expect(screen.queryByText('Nouveau')).not.toBeInTheDocument();
  });
  
  test('appelle onMarkAsCompleted pour les tâches', () => {
    const taskEntry = {
      ...mockEntry,
      isTask: true,
      isCompleted: false
    };
    
    render(<LogbookEntry entry={taskEntry} {...mockHandlers} />);
    
    // Développer l'entrée
    fireEvent.click(screen.getByText('Réception'));
    
    // Vérifier que le badge Tâche est affiché
    expect(screen.getByText('Tâche')).toBeInTheDocument();
    
    // Cliquer sur le bouton de complétion de la tâche
    fireEvent.click(screen.getByRole('button', { name: /terminer/i }));
    
    // Vérifier que onMarkAsCompleted a été appelé avec le bon ID
    expect(mockHandlers.onMarkAsCompleted).toHaveBeenCalledWith('entry1');
  });
  
  test('affiche correctement les entrées à forte importance', () => {
    const criticalEntry = {
      ...mockEntry,
      importance: 3 // Critique
    };
    
    render(<LogbookEntry entry={criticalEntry} {...mockHandlers} />);
    
    // La carte devrait avoir une bordure rouge pour les entrées critiques
    const card = screen.getByText('Réception').closest('.border-red-300');
    expect(card).toBeInTheDocument();
  });
});