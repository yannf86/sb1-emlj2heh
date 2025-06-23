const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialiser l'application Firebase Admin si ce n'est pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Fonction Cloud pour supprimer un utilisateur de Firebase Authentication
 * Cette fonction doit être appelée depuis le client avec l'ID de l'utilisateur à supprimer
 */
exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'L\'utilisateur doit être authentifié pour effectuer cette action.'
      );
    }

    // Vérifier si l'utilisateur a les droits d'administration (à adapter selon votre logique d'autorisation)
    // Par exemple, vous pourriez vérifier si l'utilisateur a un rôle d'administrateur dans Firestore
    
    // Récupérer l'ID de l'utilisateur à supprimer depuis les données
    const { uid } = data;
    if (!uid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'L\'ID de l\'utilisateur est requis.'
      );
    }

    // Supprimer l'utilisateur de Firebase Authentication
    await admin.auth().deleteUser(uid);

    return { success: true, message: 'Utilisateur supprimé avec succès de Firebase Authentication' };
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la suppression de l\'utilisateur: ' + error.message
    );
  }
});
