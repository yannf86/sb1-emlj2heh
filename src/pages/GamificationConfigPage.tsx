import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Award, Target, Trophy, Settings, Save, Plus, Trash, Edit, CheckCircle, Gauge, Star, Sparkles, CornerDownRight, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  EXPERIENCE_LEVELS, 
  ACTION_POINTS, 
  BADGES, 
  BadgeCategory 
} from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';

const XpPointsIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="lucide lucide-star"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    <text x="7.5" y="16" style={{ fontSize: '8px', fontWeight: 'bold', stroke: 'none', fill: 'currentColor' }}>XP</text>
  </svg>
);

// Helper function to get category color
const getCategoryColor = (category: BadgeCategory) => {
  const colors: Record<BadgeCategory, string> = {
    [BadgeCategory.Incidents]: 'text-yellow-600 bg-yellow-100 border-yellow-200',
    [BadgeCategory.Maintenance]: 'text-blue-600 bg-blue-100 border-blue-200',
    [BadgeCategory.Quality]: 'text-green-600 bg-green-100 border-green-200',
    [BadgeCategory.LostFound]: 'text-purple-600 bg-purple-100 border-purple-200',
    [BadgeCategory.Procedures]: 'text-indigo-600 bg-indigo-100 border-indigo-200',
    [BadgeCategory.General]: 'text-gray-600 bg-gray-100 border-gray-200',
    [BadgeCategory.Special]: 'text-pink-600 bg-pink-100 border-pink-200',
  };
  return colors[category] || 'text-gray-600 bg-gray-100 border-gray-200';
};

// Helper function to get tier color
const getTierColor = (tier: number) => {
  const colors = {
    1: 'text-amber-800 bg-amber-100 border-amber-200',
    2: 'text-slate-800 bg-slate-200 border-slate-300',
    3: 'text-yellow-800 bg-yellow-100 border-yellow-200',
  };
  return colors[tier as keyof typeof colors] || 'text-gray-600 bg-gray-100 border-gray-200';
};

const GamificationConfigPage = () => {
  const { toast } = useToast();
  
  // State for experience levels
  const [levels, setLevels] = useState(EXPERIENCE_LEVELS);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [levelDialog, setLevelDialog] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<typeof EXPERIENCE_LEVELS[0] | null>(null);
  
  // State for action points
  const [actionPoints, setActionPoints] = useState<Record<string, number>>(ACTION_POINTS);
  const [actionPointDialog, setActionPointDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<{ key: string; value: number } | null>(null);
  
  // State for badges
  const [badges, setBadges] = useState(BADGES);
  const [badgeDialog, setBadgeDialog] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<typeof BADGES[0] | null>(null);
  
  // State for challenges
  const [challengeDialog, setChallengeDialog] = useState(false);
  
  // Handlers for experience levels
  const handleEditLevel = (level: typeof EXPERIENCE_LEVELS[0]) => {
    setCurrentLevel({ ...level });
    setLevelDialog(true);
  };
  
  const handleSaveLevel = () => {
    if (!currentLevel) return;
    
    // Update or add level
    const updatedLevels = currentLevel.level 
      ? levels.map(l => l.level === currentLevel.level ? currentLevel : l)
      : [...levels, { ...currentLevel, level: Math.max(...levels.map(l => l.level)) + 1 }];
    
    setLevels(updatedLevels);
    setLevelDialog(false);
    
    toast({
      title: "Niveaux d'expérience mis à jour",
      description: "Les modifications ont été enregistrées avec succès",
      variant: "default",
    });
  };
  
  // Handlers for action points
  const handleEditAction = (key: string, value: number) => {
    setCurrentAction({ key, value });
    setActionPointDialog(true);
  };
  
  const handleSaveAction = () => {
    if (!currentAction) return;
    
    setActionPoints({
      ...actionPoints,
      [currentAction.key]: currentAction.value
    });
    
    setActionPointDialog(false);
    
    toast({
      title: "Points d'action mis à jour",
      description: "Les modifications ont été enregistrées avec succès",
      variant: "default",
    });
  };
  
  // Handlers for badges
  const handleEditBadge = (badge: typeof BADGES[0]) => {
    setCurrentBadge({ ...badge });
    setBadgeDialog(true);
  };
  
  const handleSaveBadge = () => {
    if (!currentBadge) return;
    
    // Update or add badge
    const updatedBadges = currentBadge.id
      ? badges.map(b => b.id === currentBadge.id ? currentBadge : b)
      : [...badges, { ...currentBadge, id: `custom_badge_${Date.now()}` }];
    
    setBadges(updatedBadges);
    setBadgeDialog(false);
    
    toast({
      title: "Badge mis à jour",
      description: "Les modifications ont été enregistrées avec succès",
      variant: "default",
    });
  };
  
  // Handler for global save
  const handleSaveAll = () => {
    // Here we would save all changes to a database or configuration file
    // For now, just show a toast message
    toast({
      title: "Configuration enregistrée",
      description: "Toutes les modifications ont été enregistrées avec succès",
      variant: "default",
    });
  };
  
  // Group action points by category
  const groupedActionPoints = () => {
    const groups: Record<string, { key: string; value: number }[]> = {
      'Incidents': [],
      'Maintenance': [],
      'Qualité': [],
      'Objets Trouvés': [],
      'Procédures': [],
      'Général': [],
    };
    
    Object.entries(actionPoints).forEach(([key, value]) => {
      if (key.includes('INCIDENT')) {
        groups['Incidents'].push({ key, value });
      } else if (key.includes('MAINTENANCE')) {
        groups['Maintenance'].push({ key, value });
      } else if (key.includes('QUALITY')) {
        groups['Qualité'].push({ key, value });
      } else if (key.includes('LOST_ITEM')) {
        groups['Objets Trouvés'].push({ key, value });
      } else if (key.includes('PROCEDURE')) {
        groups['Procédures'].push({ key, value });
      } else {
        groups['Général'].push({ key, value });
      }
    });
    
    return groups;
  };
  
  const actionLabels: Record<string, string> = {
    CREATE_INCIDENT: 'Créer un incident',
    RESOLVE_INCIDENT: 'Résoudre un incident',
    RESOLVE_CRITICAL_INCIDENT: 'Résoudre un incident critique',
    CREATE_MAINTENANCE: 'Créer une demande de maintenance',
    COMPLETE_MAINTENANCE: 'Compléter une maintenance',
    EXPEDITE_MAINTENANCE: 'Compléter rapidement une maintenance',
    COMPLETE_QUALITY_CHECK: 'Effectuer un contrôle qualité',
    HIGH_QUALITY_SCORE: 'Obtenir un score qualité élevé (>90%)',
    REGISTER_LOST_ITEM: 'Enregistrer un objet trouvé',
    RETURN_LOST_ITEM: 'Retourner un objet trouvé',
    CREATE_PROCEDURE: 'Créer une procédure',
    READ_PROCEDURE: 'Lire une procédure',
    VALIDATE_PROCEDURE: 'Valider une procédure',
    FIRST_LOGIN_OF_DAY: 'Première connexion du jour',
    CONSECUTIVE_DAY_LOGIN: 'Connexion jour consécutif',
    WEEKLY_GOAL_COMPLETION: 'Compléter un objectif hebdomadaire',
    HELP_COLLEAGUE: 'Aider un collègue',
    RECEIVE_THANKS: 'Recevoir un remerciement',
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuration de la Gamification</h1>
          <p className="text-muted-foreground">
            Personnaliser les paramètres du système de gamification
          </p>
        </div>
        
        <Button variant="default" onClick={handleSaveAll}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer toutes les modifications
        </Button>
      </div>
      
      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList className="w-full flex flex-wrap justify-start">
          <TabsTrigger value="levels" className="flex items-center">
            <Gauge className="mr-2 h-4 w-4" />
            Niveaux d'Expérience
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center">
            <XpPointsIcon />
            <span className="ml-2">Points d'Action</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center">
            <Award className="mr-2 h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center">
            <Target className="mr-2 h-4 w-4" />
            Défis
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Configuration Générale
          </TabsTrigger>
        </TabsList>
        
        {/* Experience Levels Tab */}
        <TabsContent value="levels">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Niveaux d'Expérience</CardTitle>
                <CardDescription>
                  Configurer les seuils d'expérience pour chaque niveau
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  setCurrentLevel({
                    level: 0,
                    name: '',
                    minXP: 0,
                    maxXP: 0,
                    color: 'text-slate-600',
                    badge: '🔰'
                  });
                  setLevelDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un niveau
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>XP Minimum</TableHead>
                    <TableHead>XP Maximum</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.map((level) => (
                    <TableRow key={level.level}>
                      <TableCell className="font-bold">{level.level}</TableCell>
                      <TableCell>{level.name}</TableCell>
                      <TableCell>{level.minXP}</TableCell>
                      <TableCell>{level.maxXP}</TableCell>
                      <TableCell>
                        <span className="text-2xl">{level.badge}</span>
                      </TableCell>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full ${level.color.replace('text-', 'bg-')}`}></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditLevel(level)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Les modifications apportées affecteront le calcul des niveaux pour tous les utilisateurs.
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Action Points Tab */}
        <TabsContent value="points">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Points d'Action</CardTitle>
                <CardDescription>
                  Configurer les points XP attribués pour chaque action dans le système
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Général">
                <TabsList className="mb-4">
                  {Object.keys(groupedActionPoints()).map((group) => (
                    <TabsTrigger key={group} value={group}>{group}</TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(groupedActionPoints()).map(([group, actions]) => (
                  <TabsContent key={group} value={group}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/2">Action</TableHead>
                          <TableHead>Points XP</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actions.map(({ key, value }) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">
                              {actionLabels[key] || key}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bold">
                                +{value} XP
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditAction(key, value)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                <Info className="h-4 w-4 inline mr-1" />
                Les points XP sont attribués automatiquement lorsque les utilisateurs effectuent des actions dans le système.
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Badges Tab */}
        <TabsContent value="badges">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Gérer les badges qui peuvent être débloqués par les utilisateurs
                </CardDescription>
              </div>
              <Button 
                size="sm"
                onClick={() => {
                  setCurrentBadge({
                    id: '',
                    name: '',
                    description: '',
                    icon: '🏆',
                    category: BadgeCategory.General,
                    tier: 1,
                    hidden: false,
                    condition: () => false,
                  });
                  setBadgeDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un badge
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={BadgeCategory.General}>
                <TabsList className="mb-4 flex flex-wrap">
                  {Object.values(BadgeCategory).map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category === BadgeCategory.Incidents && '🚨 Incidents'}
                      {category === BadgeCategory.Maintenance && '🔧 Maintenance'}
                      {category === BadgeCategory.Quality && '📋 Qualité'}
                      {category === BadgeCategory.LostFound && '🔍 Objets Trouvés'}
                      {category === BadgeCategory.Procedures && '📝 Procédures'}
                      {category === BadgeCategory.General && '🌟 Général'}
                      {category === BadgeCategory.Special && '🎭 Spéciaux'}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.values(BadgeCategory).map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badges
                        .filter(badge => badge.category === category)
                        .map((badge) => (
                          <Card key={badge.id} className="overflow-hidden">
                            <CardHeader className={`py-3 ${getCategoryColor(badge.category)}`}>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span className="text-2xl mr-2">{badge.icon}</span>
                                  <div>
                                    <CardTitle className="text-base">{badge.name}</CardTitle>
                                    <Badge variant="outline" className={`mt-1 ${getTierColor(badge.tier)}`}>
                                      {badge.tier === 1 ? 'Bronze' : badge.tier === 2 ? 'Argent' : 'Or'}
                                    </Badge>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => handleEditBadge(badge)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-3">
                              <p className="text-sm">{badge.description}</p>
                              {badge.hidden && (
                                <Badge variant="outline" className="mt-2 text-xs bg-gray-100">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Badge caché
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                <Info className="h-4 w-4 inline mr-1" />
                Les badges sont débloqués automatiquement lorsque les utilisateurs remplissent les conditions associées.
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Challenges Tab */}
        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Défis</CardTitle>
              <CardDescription>
                Configurer les défis hebdomadaires et spéciaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Configuration avancée</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      La configuration des défis nécessite des ajustements dans le code source. 
                      Contactez votre équipe de développement pour personnaliser les défis hebdomadaires.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Défis Hebdomadaires</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3 bg-blue-50">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">🚨</span>
                          <CardTitle className="text-base">Résolution Efficace</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm">Résoudre 5 incidents cette semaine</p>
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            +100 XP
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Module Incidents
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3 bg-blue-50">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">🔧</span>
                          <CardTitle className="text-base">Technicien de la Semaine</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm">Compléter 3 maintenances cette semaine</p>
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            +80 XP
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Module Maintenance
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3 bg-blue-50">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">📋</span>
                          <CardTitle className="text-base">Excellence Qualité</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm">Effectuer 2 contrôles qualité avec un score &gt; 90%</p>
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            +120 XP
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Module Qualité
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3 bg-blue-50">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">📆</span>
                          <CardTitle className="text-base">Présence Assidue</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm">Se connecter 5 jours cette semaine</p>
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            +50 XP
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Global
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Configuration Temporelle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="week-start">Début de la semaine de défis</Label>
                      <Select defaultValue="0">
                        <SelectTrigger id="week-start">
                          <SelectValue placeholder="Choisir un jour" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Dimanche</SelectItem>
                          <SelectItem value="1">Lundi</SelectItem>
                          <SelectItem value="2">Mardi</SelectItem>
                          <SelectItem value="3">Mercredi</SelectItem>
                          <SelectItem value="4">Jeudi</SelectItem>
                          <SelectItem value="5">Vendredi</SelectItem>
                          <SelectItem value="6">Samedi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reset-time">Heure de réinitialisation</Label>
                      <Input id="reset-time" type="time" defaultValue="00:00" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                <Info className="h-4 w-4 inline mr-1" />
                Les défis sont réinitialisés automatiquement au début de chaque semaine.
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Générale</CardTitle>
              <CardDescription>
                Paramètres globaux du système de gamification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Activation */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Activation du Système</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="gamification-active" defaultChecked />
                    <Label htmlFor="gamification-active">Système de gamification actif</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="show-popup" defaultChecked />
                    <Label htmlFor="show-popup">Afficher les notifications de points XP</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="show-badges" defaultChecked />
                    <Label htmlFor="show-badges">Afficher les notifications de badges</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="show-leaderboard" defaultChecked />
                    <Label htmlFor="show-leaderboard">Activer le classement</Label>
                  </div>
                </div>
              </div>
              
              {/* Visual Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Apparence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Couleur principale</Label>
                    <Input id="primary-color" type="color" defaultValue="#D4A017" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Couleur secondaire</Label>
                    <Input id="secondary-color" type="color" defaultValue="#8C6410" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toolbar-position">Position de la barre d'outils</Label>
                    <Select defaultValue="top">
                      <SelectTrigger id="toolbar-position">
                        <SelectValue placeholder="Choisir une position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Haut</SelectItem>
                        <SelectItem value="bottom">Bas</SelectItem>
                        <SelectItem value="left">Gauche</SelectItem>
                        <SelectItem value="right">Droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="animation-speed">Vitesse d'animation</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger id="animation-speed">
                        <SelectValue placeholder="Choisir une vitesse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Lente</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="fast">Rapide</SelectItem>
                        <SelectItem value="none">Aucune</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Data Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Gestion des Données</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-reset">Réinitialisation des données</Label>
                      <Select defaultValue="manual">
                        <SelectTrigger id="data-reset">
                          <SelectValue placeholder="Choisir une option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manuelle uniquement</SelectItem>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                          <SelectItem value="quarterly">Trimestrielle</SelectItem>
                          <SelectItem value="yearly">Annuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="data-export-format">Format d'exportation</Label>
                      <Select defaultValue="json">
                        <SelectTrigger id="data-export-format">
                          <SelectValue placeholder="Choisir un format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch id="data-backup" defaultChecked />
                    <Label htmlFor="data-backup">Activer les sauvegardes automatiques</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réinitialiser les paramètres
              </Button>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Level Edit Dialog */}
      <Dialog open={levelDialog} onOpenChange={setLevelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentLevel?.level ? 'Modifier le Niveau' : 'Ajouter un Niveau'}</DialogTitle>
            <DialogDescription>
              {currentLevel?.level 
                ? `Modifiez les paramètres du niveau ${currentLevel.level}` 
                : 'Ajoutez un nouveau niveau d\'expérience'}
            </DialogDescription>
          </DialogHeader>
          {currentLevel && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level-number">Numéro de niveau</Label>
                  <Input 
                    id="level-number"
                    type="number"
                    min="1"
                    value={currentLevel.level || ''}
                    onChange={(e) => setCurrentLevel({
                      ...currentLevel,
                      level: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level-name">Nom du niveau</Label>
                  <Input 
                    id="level-name"
                    value={currentLevel.name}
                    onChange={(e) => setCurrentLevel({
                      ...currentLevel,
                      name: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-xp">XP Minimum</Label>
                  <Input 
                    id="min-xp"
                    type="number"
                    min="0"
                    value={currentLevel.minXP}
                    onChange={(e) => setCurrentLevel({
                      ...currentLevel,
                      minXP: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-xp">XP Maximum</Label>
                  <Input 
                    id="max-xp"
                    type="number"
                    min="0"
                    value={currentLevel.maxXP}
                    onChange={(e) => setCurrentLevel({
                      ...currentLevel,
                      maxXP: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level-badge">Badge</Label>
                  <Input 
                    id="level-badge"
                    value={currentLevel.badge}
                    onChange={(e) => setCurrentLevel({
                      ...currentLevel,
                      badge: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level-color">Couleur</Label>
                  <Select 
                    value={currentLevel.color} 
                    onValueChange={(value) => setCurrentLevel({
                      ...currentLevel,
                      color: value
                    })}
                  >
                    <SelectTrigger id="level-color">
                      <SelectValue placeholder="Choisir une couleur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-slate-600">Gris</SelectItem>
                      <SelectItem value="text-blue-600">Bleu</SelectItem>
                      <SelectItem value="text-green-600">Vert</SelectItem>
                      <SelectItem value="text-purple-600">Violet</SelectItem>
                      <SelectItem value="text-orange-600">Orange</SelectItem>
                      <SelectItem value="text-red-600">Rouge</SelectItem>
                      <SelectItem value="text-brand-600">Couleur principale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLevelDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveLevel}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Action Points Dialog */}
      <Dialog open={actionPointDialog} onOpenChange={setActionPointDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier les Points d'Action</DialogTitle>
            <DialogDescription>
              Ajustez la valeur des points XP pour cette action
            </DialogDescription>
          </DialogHeader>
          {currentAction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="action-name">Action</Label>
                <Input 
                  id="action-name"
                  value={actionLabels[currentAction.key] || currentAction.key}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action-points">Points XP</Label>
                <Input 
                  id="action-points"
                  type="number"
                  min="0"
                  value={currentAction.value}
                  onChange={(e) => setCurrentAction({
                    ...currentAction,
                    value: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionPointDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveAction}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Badge Edit Dialog */}
      <Dialog open={badgeDialog} onOpenChange={setBadgeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentBadge?.id ? 'Modifier le Badge' : 'Ajouter un Badge'}</DialogTitle>
            <DialogDescription>
              {currentBadge?.id
                ? `Modifiez les paramètres du badge ${currentBadge.name}`
                : 'Ajoutez un nouveau badge'}
            </DialogDescription>
          </DialogHeader>
          {currentBadge && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge-name">Nom du badge</Label>
                  <Input 
                    id="badge-name"
                    value={currentBadge.name}
                    onChange={(e) => setCurrentBadge({
                      ...currentBadge,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge-icon">Icône</Label>
                  <Input 
                    id="badge-icon"
                    value={currentBadge.icon}
                    onChange={(e) => setCurrentBadge({
                      ...currentBadge,
                      icon: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="badge-description">Description</Label>
                <Input 
                  id="badge-description"
                  value={currentBadge.description}
                  onChange={(e) => setCurrentBadge({
                    ...currentBadge,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge-category">Catégorie</Label>
                  <Select 
                    value={currentBadge.category} 
                    onValueChange={(value) => setCurrentBadge({
                      ...currentBadge,
                      category: value as BadgeCategory
                    })}
                  >
                    <SelectTrigger id="badge-category">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(BadgeCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === BadgeCategory.Incidents && '🚨 Incidents'}
                          {category === BadgeCategory.Maintenance && '🔧 Maintenance'}
                          {category === BadgeCategory.Quality && '📋 Qualité'}
                          {category === BadgeCategory.LostFound && '🔍 Objets Trouvés'}
                          {category === BadgeCategory.Procedures && '📝 Procédures'}
                          {category === BadgeCategory.General && '🌟 Général'}
                          {category === BadgeCategory.Special && '🎭 Spéciaux'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge-tier">Niveau</Label>
                  <Select 
                    value={currentBadge.tier.toString()} 
                    onValueChange={(value) => setCurrentBadge({
                      ...currentBadge,
                      tier: parseInt(value) as 1 | 2 | 3
                    })}
                  >
                    <SelectTrigger id="badge-tier">
                      <SelectValue placeholder="Choisir un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Bronze</SelectItem>
                      <SelectItem value="2">Argent</SelectItem>
                      <SelectItem value="3">Or</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="badge-hidden"
                  checked={currentBadge.hidden || false}
                  onCheckedChange={(checked) => setCurrentBadge({
                    ...currentBadge,
                    hidden: checked
                  })}
                />
                <Label htmlFor="badge-hidden">Badge caché</Label>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Les conditions de déblocage du badge doivent être configurées dans le code source.
                    Contactez votre équipe de développement pour modifier ces conditions.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgeDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveBadge}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamificationConfigPage;