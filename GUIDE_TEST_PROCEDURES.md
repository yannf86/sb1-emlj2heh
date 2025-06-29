# Guide de test - Système de validation et historique des procédures

## Étapes de test recommandées

### 1. Initialisation (Administrateur système uniquement)
- [ ] Se connecter en tant qu'administrateur système
- [ ] Aller dans le module Procédures
- [ ] Cliquer sur le bouton violet "Initialiser Versions"
- [ ] Confirmer l'opération
- [ ] Vérifier que les procédures existantes affichent maintenant "v1"

### 2. Test de création de procédure
- [ ] Créer une nouvelle procédure
- [ ] Vérifier qu'elle apparaît avec "v1"
- [ ] Vérifier l'historique : doit contenir l'entrée "Procédure créée"

### 3. Test de modification sans revalidation
- [ ] Modifier uniquement les hôtels concernés d'une procédure
- [ ] Sauvegarder
- [ ] Vérifier que la version reste inchangée
- [ ] Vérifier que les validations existantes ne sont PAS révoquées
- [ ] Vérifier l'historique : doit contenir "Hôtels concernés modifiés"

### 4. Test de modification avec revalidation
- [ ] Modifier le titre, description, ou contenu d'une procédure
- [ ] Sauvegarder
- [ ] Vérifier que la version s'incrémente (ex: v1 → v2)
- [ ] Vérifier que les validations existantes sont révoquées
- [ ] Vérifier l'historique : doit contenir les modifications ET la révocation

### 5. Test de validation
- [ ] Valider une procédure
- [ ] Vérifier l'historique : doit contenir "Procédure validée par [nom] (version X)"
- [ ] Vérifier que la validation apparaît dans la liste des validations

### 6. Test de révocation manuelle
- [ ] Utiliser le bouton "Révoquer validations" (admin uniquement)
- [ ] Vérifier l'historique : doit contenir "Validations révoquées"
- [ ] Vérifier que les validations disparaissent de la liste

### 7. Test d'affichage de l'historique
- [ ] Ouvrir le détail d'une procédure
- [ ] Cliquer sur "Masquer l'historique" pour afficher l'historique
- [ ] Vérifier que toutes les actions sont listées chronologiquement
- [ ] Vérifier les détails de chaque action

## Résultats attendus

### Modifications déclenchant une revalidation :
- Titre
- Description  
- Contenu
- Document PDF
- Service
- Type

### Modifications NE déclenchant PAS de revalidation :
- Hôtels concernés
- Utilisateurs assignés

### Types d'entrées dans l'historique :
- `created` : Procédure créée
- `updated` : Procédure modifiée (avec détails des champs)
- `acknowledged` : Procédure validée
- `revoked_acknowledgments` : Validations révoquées

## Dépannage

### Si l'historique ne s'affiche pas :
1. Vérifier les index Firestore (voir firestore-indexes.md)
2. Vérifier la console pour les erreurs
3. Les index peuvent prendre quelques minutes à se créer

### Si les versions ne s'affichent pas :
1. Exécuter l'initialisation des versions
2. Rafraîchir la page
3. Vérifier que l'utilisateur est administrateur système
