# Guide de dépannage Firebase

## Erreurs d'authentification courantes

### 1. `FirebaseError: Firebase: Error (auth/invalid-credential)`

**Causes possibles :**
- Clé API expirée ou incorrecte
- Restrictions d'API mal configurées
- Problème de réseau/proxy
- Configuration Firebase incorrecte

**Solutions :**

#### A. Vérifier la configuration Firebase
1. Aller dans la [Console Firebase](https://console.firebase.google.com)
2. Sélectionner le projet `app-creho-2`
3. Aller dans **Paramètres du projet** → **Général**
4. Vérifier que la configuration correspond à celle dans `src/lib/firebase.ts`

#### B. Régénérer la clé API
1. Dans la Console Firebase → **Paramètres du projet** → **Général**
2. Faire défiler jusqu'à "Vos applications"
3. Cliquer sur l'icône de configuration (engrenage) de votre app web
4. Copier la nouvelle configuration
5. Remplacer dans `src/lib/firebase.ts`

#### C. Vérifier les restrictions d'API
1. Aller dans [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet `app-creho-2`
3. Aller dans **APIs & Services** → **Credentials**
4. Cliquer sur la clé API
5. Vérifier les restrictions :
   - **Application restrictions** : Aucune ou HTTP referrers avec votre domaine
   - **API restrictions** : Inclure Identity Toolkit API

### 2. `identitytoolkit.googleapis.com` erreur 400

**Solution :**
1. Aller dans [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Library**
3. Rechercher "Identity Toolkit API"
4. Cliquer dessus et **Enable**

### 3. Avertissement React "Maximum update depth exceeded"

**Cause :** Boucle infinie dans un useEffect ou setState

**Solution temporaire :**
- Redémarrer l'application : `npm start` ou `yarn start`
- Vider le cache du navigateur

**Solution permanente :**
- Identifier le composant qui cause la boucle
- Vérifier les dépendances des useEffect
- Éviter les setState dans le render

## Vérifications rapides

### 1. Statut des services Firebase
- Vérifier [Firebase Status](https://status.firebase.google.com/)

### 2. Configuration réseau
- Désactiver temporairement le VPN/proxy
- Tester sur un autre réseau

### 3. Cache du navigateur
- Vider le cache et les cookies
- Tester en mode incognito

## Commandes utiles

```bash
# Redémarrer l'application
npm start

# Vider le cache npm
npm start -- --reset-cache

# Vérifier les dépendances Firebase
npm list firebase
```

## Contact support

Si les erreurs persistent :
1. Noter l'heure exacte de l'erreur
2. Copier le message d'erreur complet
3. Vérifier les logs de la Console Firebase
4. Contacter le support technique avec ces informations
