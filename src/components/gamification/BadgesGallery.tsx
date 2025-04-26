import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCategory, BADGES } from '@/lib/gamification';
import { useGamification } from './GamificationContext';
import BadgeDisplay from './BadgeDisplay';
import { Award, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const BadgesGallery: React.FC = () => {
  const { badges, getBadgesByCategory } = useGamification();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Regrouper les badges par catégorie pour l'affichage
  const badgesByCategory = {
    [BadgeCategory.Incidents]: getBadgesByCategory(BadgeCategory.Incidents),
    [BadgeCategory.Maintenance]: getBadgesByCategory(BadgeCategory.Maintenance),
    [BadgeCategory.Quality]: getBadgesByCategory(BadgeCategory.Quality),
    [BadgeCategory.LostFound]: getBadgesByCategory(BadgeCategory.LostFound),
    [BadgeCategory.Procedures]: getBadgesByCategory(BadgeCategory.Procedures),
    [BadgeCategory.General]: getBadgesByCategory(BadgeCategory.General),
    [BadgeCategory.Special]: getBadgesByCategory(BadgeCategory.Special),
  };
  
  // Calculer les badges débloqués par catégorie
  const totalBadgesByCategory = {
    [BadgeCategory.Incidents]: BADGES.filter(b => b.category === BadgeCategory.Incidents && !b.hidden).length,
    [BadgeCategory.Maintenance]: BADGES.filter(b => b.category === BadgeCategory.Maintenance && !b.hidden).length,
    [BadgeCategory.Quality]: BADGES.filter(b => b.category === BadgeCategory.Quality && !b.hidden).length,
    [BadgeCategory.LostFound]: BADGES.filter(b => b.category === BadgeCategory.LostFound && !b.hidden).length,
    [BadgeCategory.Procedures]: BADGES.filter(b => b.category === BadgeCategory.Procedures && !b.hidden).length,
    [BadgeCategory.General]: BADGES.filter(b => b.category === BadgeCategory.General && !b.hidden).length,
    [BadgeCategory.Special]: BADGES.filter(b => b.category === BadgeCategory.Special).length,
  };
  
  // Filtrer les badges par recherche
  const filteredBadges = searchQuery 
    ? badges.filter(badge => 
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        badge.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  // Tous les badges disponibles pour comparer
  const allBadges = BADGES.filter(b => !b.hidden);
  
  // Nombre total de badges débloqués
  const totalUnlockedBadges = badges.length;
  const totalAvailableBadges = allBadges.length;
  
  // Traduire les catégories en français
  const categoryTranslations: Record<BadgeCategory, string> = {
    [BadgeCategory.Incidents]: 'Incidents',
    [BadgeCategory.Maintenance]: 'Maintenance',
    [BadgeCategory.Quality]: 'Qualité',
    [BadgeCategory.LostFound]: 'Objets Trouvés',
    [BadgeCategory.Procedures]: 'Procédures',
    [BadgeCategory.General]: 'Général',
    [BadgeCategory.Special]: 'Spéciaux',
  };
  
  // Icônes par catégorie
  const categoryIcons: Record<BadgeCategory, string> = {
    [BadgeCategory.Incidents]: '🚨',
    [BadgeCategory.Maintenance]: '🔧',
    [BadgeCategory.Quality]: '📋',
    [BadgeCategory.LostFound]: '🔍',
    [BadgeCategory.Procedures]: '📝',
    [BadgeCategory.General]: '🌟',
    [BadgeCategory.Special]: '🎭',
  };
  
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Award className="h-5 w-5 mr-2 text-brand-500" /> Collection de Badges
        </CardTitle>
        <CardDescription>
          {totalUnlockedBadges} badges débloqués sur {totalAvailableBadges} disponibles
        </CardDescription>
        
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un badge..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {searchQuery ? (
          <div>
            <h3 className="text-sm font-medium mb-4">Résultats de recherche</h3>
            {filteredBadges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filteredBadges.map(badge => (
                  <BadgeDisplay key={badge.id} badge={badge} size="lg" />
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                Aucun badge trouvé pour cette recherche.
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue={BadgeCategory.General}>
            <TabsList className="w-full flex flex-wrap">
              {Object.values(BadgeCategory).map(category => (
                <TabsTrigger key={category} value={category} className="flex-1">
                  <span className="mr-1">{categoryIcons[category]}</span>
                  <span className="hidden sm:inline">{categoryTranslations[category]}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {badgesByCategory[category].length}/{totalBadgesByCategory[category]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.values(BadgeCategory).map(category => (
              <TabsContent key={category} value={category}>
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-4">
                    Badges {categoryTranslations[category]}
                  </h3>
                  
                  {badgesByCategory[category].length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {badgesByCategory[category].map(badge => (
                        <BadgeDisplay key={badge.id} badge={badge} size="lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      Aucun badge débloqué dans cette catégorie.
                    </div>
                  )}
                  
                  {/* Liste des badges verrouillés (grisés) */}
                  {badgesByCategory[category].length < totalBadgesByCategory[category] && (
                    <>
                      <h3 className="text-sm font-medium mt-6 mb-4">Badges à débloquer</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 opacity-40">
                        {BADGES.filter(
                          b => b.category === category && 
                          !b.hidden && 
                          !badges.some(userBadge => userBadge.id === b.id)
                        ).map(badge => (
                          <BadgeDisplay key={badge.id} badge={badge} size="lg" />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgesGallery;