const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'L\'utilisateur doit être authentifié pour effectuer cette action.'
      );
    }

    const { uid } = data;
    if (!uid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'L\'ID de l\'utilisateur est requis.'
      );
    }

    await admin.auth().deleteUser(uid);

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès de Firebase Authentication',
    };
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la suppression de l\'utilisateur: ' + error.message
    );
  }
});
