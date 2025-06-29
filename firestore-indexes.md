# Index Firestore requis pour le module Procédures

## Index pour procedure_history

Créez ces index dans la console Firebase :

### Index 1 - Historique par procédure
- Collection : `procedure_history`
- Champs :
  - `procedureId` : Ascending
  - `timestamp` : Descending

### Index 2 - Validations par procédure  
- Collection : `procedure_acknowledgments`
- Champs :
  - `procedureId` : Ascending
  - `acknowledgedAt` : Descending

## Comment créer les index

1. Allez dans la console Firebase
2. Sélectionnez votre projet
3. Allez dans Firestore Database
4. Cliquez sur l'onglet "Index"
5. Cliquez sur "Créer un index"
6. Ajoutez les champs comme spécifié ci-dessus

Ou utilisez les liens fournis dans les erreurs de la console pour créer automatiquement les index.
