import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes en millisecondes
const WARNING_TIMEOUT = 25 * 60 * 1000; // Avertissement à 25 minutes

export const useAutoLogout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/login');
      console.log('Déconnexion automatique après 30 minutes d\'inactivité');
    } catch (error) {
      console.error('Erreur lors de la déconnexion automatique:', error);
    }
  }, [navigate]);

  const resetTimer = useCallback(() => {
    // Réinitialiser le flag d'avertissement
    warningShownRef.current = false;

    // Nettoyer les timers existants
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Programmer l'avertissement à 25 minutes
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        // Utiliser setTimeout pour éviter de bloquer la déconnexion
        setTimeout(() => {
          const userWantsToStay = window.confirm(
            'Vous serez déconnecté dans 5 minutes par inactivité.\n\nCliquez sur OK pour prolonger votre session ou Annuler pour être déconnecté.'
          );
          
          if (userWantsToStay) {
            resetTimer();
            console.log('Session prolongée par l\'utilisateur');
          }
        }, 0);
      }
    }, WARNING_TIMEOUT);

    // Programmer la déconnexion à 30 minutes
    // Cette déconnexion se produira indépendamment de la réponse à l'avertissement
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!auth.currentUser) {
      return;
    }

    // Liste des événements à surveiller pour détecter l'activité
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Démarrer le timer initial
    resetTimer();

    // Nettoyer lors du démontage
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [handleActivity, resetTimer]);

  return {
    resetTimer,
    logout
  };
};
