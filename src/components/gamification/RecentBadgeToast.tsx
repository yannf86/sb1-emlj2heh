import React, { useEffect } from 'react';
import { useGamification } from './GamificationContext';
import { useToast } from '@/hooks/use-toast';
import BadgeDisplay from './BadgeDisplay';

// Composant pour afficher des toasts quand de nouveaux badges sont débloqués
const RecentBadgeToast: React.FC = () => {
  const { recentBadges, clearRecentBadges } = useGamification();
  const { toast } = useToast();
  
  useEffect(() => {
    if (recentBadges.length > 0) {
      // Afficher un toast pour chaque badge récent
      recentBadges.forEach(badge => {
        toast({
          title: (
            <div className="flex items-center">
              <span className="text-xl mr-2">{badge.icon}</span>
              <span>Nouveau badge : {badge.name}</span>
            </div>
          ),
          description: badge.description,
          action: <BadgeDisplay badge={badge} showTooltip={false} />,
        });
      });
      
      // Effacer les badges récents après les avoir affichés
      clearRecentBadges();
    }
  }, [recentBadges, toast, clearRecentBadges]);
  
  // Ce composant n'affiche rien directement
  return null;
};

export default RecentBadgeToast;