# CREHO - Gestion Multi-Hôtels

Application de gestion complète pour les chaînes hôtelières, permettant de suivre les incidents, les maintenances, les visites qualité, et plus encore.
Test de modification depuis Bolt 30


## Fonctionnalités

- Tableau de bord avec vue d'ensemble des KPIs
- Suivi des incidents clients
- Gestion des interventions techniques
- Visites et contrôles qualité
- Gestion des objets trouvés
- Base documentaire de procédures
- Statistiques et rapports
- Gamification intégrée
- Gestion des fournisseurs

## Architecture technique

L'application utilise les technologies suivantes :

- **Frontend** : React, TypeScript, TailwindCSS
- **Backend** : Firebase (Firestore, Authentication, Storage)
- **Stockage de fichiers** : Supabase Storage (principalement), Firebase Storage (fallback)
- **Authentification** : Firebase Authentication

## Optimisations de performance

### Indexation Firebase

Pour optimiser les performances des requêtes, des index Firestore sont générés automatiquement. L'application lance des requêtes qui génèrent des liens d'indexation lorsqu'un index est manquant.

#### Comment fonctionnent les index automatiques

1. Au démarrage de l'application, des requêtes complexes sont exécutées
2. Si un index est manquant, Firebase génère une erreur avec un lien pour créer l'index
3. Ces liens sont affichés dans la console du navigateur
4. Cliquez sur ces liens pour créer les index requis dans la console Firebase

Exemple de lien d'indexation généré :
```
🔗 Index manquant pour incidents (hotelId ASC + date DESC)
🔗 Créez l'index avec ce lien: https://console.firebase.google.com/...
```

Principaux index requis :
- Filtrage des incidents par hôtel et date
- Filtrage des incidents par hôtel et statut
- Filtrage des incidents par hôtel et catégorie
- Filtrage des interventions techniques par hôtel et date
- Filtrage des interventions techniques par hôtel et statut
- Filtrage des objets trouvés par hôtel et date
- Filtrage des visites qualité par hôtel et date

## Déploiement

L'application peut être déployée sur n'importe quel service d'hébergement statique (Netlify, Vercel, Firebase Hosting) pour le frontend.

Le backend est entièrement géré par Firebase, aucune infrastructure supplémentaire n'est nécessaire.