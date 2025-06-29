# Guide de test - Permissions des procédures

## Objectif
Vérifier que seuls les utilisateurs explicitement assignés à une procédure peuvent la voir et y accéder.

## Scénarios de test

### 1. Test Administrateur Système
- [ ] Se connecter en tant qu'administrateur système
- [ ] Vérifier que **toutes** les procédures sont visibles
- [ ] Pouvoir créer, modifier, supprimer toutes les procédures

### 2. Test Administrateur d'Hôtel
- [ ] Se connecter en tant qu'administrateur d'hôtel
- [ ] Vérifier que **toutes** les procédures sont visibles
- [ ] Pouvoir créer, modifier, supprimer les procédures

### 3. Test Utilisateur Standard - Assigné à la procédure
- [ ] Se connecter en tant qu'utilisateur standard
- [ ] Créer une procédure et assigner cet utilisateur
- [ ] Vérifier que l'utilisateur **peut voir** cette procédure
- [ ] Vérifier qu'il peut la valider

### 4. Test Utilisateur Standard - NON assigné à la procédure
- [ ] Se connecter en tant qu'utilisateur standard
- [ ] Créer une procédure **sans** assigner cet utilisateur
- [ ] Assigner la procédure à l'hôtel de l'utilisateur
- [ ] Vérifier que l'utilisateur **ne peut PAS voir** cette procédure

### 5. Test Utilisateur d'un autre hôtel
- [ ] Se connecter en tant qu'utilisateur de l'Hôtel A
- [ ] Créer une procédure assignée à l'Hôtel B uniquement
- [ ] Vérifier que l'utilisateur de l'Hôtel A **ne peut PAS voir** cette procédure

## Résultats attendus

### Visibilité des procédures :
- **Administrateurs système/hôtel** : Voient TOUTES les procédures
- **Utilisateurs standards** : Voient UNIQUEMENT les procédures où ils sont explicitement assignés dans le champ "Utilisateurs assignés"

### Règles importantes :
- ❌ **Ancien comportement** : Utilisateur assigné à l'hôtel → voit toutes les procédures de l'hôtel
- ✅ **Nouveau comportement** : Utilisateur doit être explicitement assigné à chaque procédure

## Comment tester

### Étape 1 : Préparer les données
1. Créer 2 utilisateurs standards dans des hôtels différents
2. Créer 3 procédures :
   - Procédure A : Assignée à l'utilisateur 1
   - Procédure B : Assignée à l'utilisateur 2
   - Procédure C : Assignée à aucun utilisateur (seulement aux hôtels)

### Étape 2 : Tester la visibilité
1. Se connecter avec l'utilisateur 1
   - Doit voir : Procédure A uniquement
   - Ne doit pas voir : Procédures B et C

2. Se connecter avec l'utilisateur 2
   - Doit voir : Procédure B uniquement
   - Ne doit pas voir : Procédures A et C

3. Se connecter en tant qu'admin
   - Doit voir : Toutes les procédures (A, B, C)

## Dépannage

### Si un utilisateur voit trop de procédures :
1. Vérifier son rôle (ne doit pas être admin)
2. Vérifier que les procédures n'ont pas cet utilisateur dans "Utilisateurs assignés"
3. Vider le cache du navigateur et recharger

### Si un utilisateur ne voit pas ses procédures :
1. Vérifier qu'il est bien dans "Utilisateurs assignés" de la procédure
2. Vérifier que la procédure est active (`isActive: true`)
3. Vérifier la console pour les erreurs

## Validation finale
- [ ] Les permissions respectent le principe du moindre privilège
- [ ] Seuls les utilisateurs explicitement assignés voient les procédures
- [ ] Les administrateurs conservent l'accès complet
- [ ] Aucune fuite de données entre utilisateurs non autorisés
