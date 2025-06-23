import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';

class StorageService {
  /**
   * Upload un fichier dans Firebase Storage
   * @param file - Le fichier à uploader
   * @param path - Le chemin dans le bucket (ex: 'devis/hotel123/quote456.pdf')
   * @returns L'URL de téléchargement du fichier
   */
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  }

  /**
   * Supprime un fichier de Firebase Storage
   * @param url - L'URL du fichier à supprimer
   */
  async deleteFile(url: string): Promise<void> {
    try {
      // Extraire le chemin du fichier à partir de l'URL
      const fileRef = ref(storage, this.getPathFromUrl(url));
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }

  /**
   * Upload un fichier de devis dans le bucket 'devis'
   * @param file - Le fichier de devis à uploader
   * @param interventionId - L'ID de l'intervention
   * @param quoteId - L'ID du devis
   * @returns L'URL de téléchargement du fichier
   */
  async uploadQuoteFile(file: File, interventionId: string, quoteId: string): Promise<string> {
    const extension = file.name.split('.').pop() || 'pdf';
    const path = `devis/${interventionId}/${quoteId}.${extension}`;
    return this.uploadFile(file, path);
  }

  /**
   * Extrait le chemin du fichier à partir de son URL
   * @param url - L'URL du fichier
   * @returns Le chemin du fichier dans Firebase Storage
   */
  private getPathFromUrl(url: string): string {
    // L'URL Firebase Storage contient généralement un token après le '?'
    // Format: https://firebasestorage.googleapis.com/v0/b/bucket-name/o/path%2Fto%2Ffile?token...
    const urlWithoutQuery = url.split('?')[0];
    // Extraire le chemin après '/o/'
    const path = urlWithoutQuery.split('/o/')[1];
    // Décoder les caractères URL encodés (comme %2F pour '/')
    return decodeURIComponent(path);
  }
}

export const storageService = new StorageService();
