/**
 * Utilitaires pour la gestion et le formatage des dates
 */

/**
 * Formate une date en format français (JJ/MM/AAAA)
 * Gère les dates sous forme de string, Date ou timestamp
 */
export const formatDate = (date: Date | string | number | undefined): string => {
  if (!date) return 'Date non définie';
  
  try {
    // Si c'est déjà une Date valide
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('fr-FR');
    }
    
    // Si c'est un timestamp (nombre)
    if (typeof date === 'number') {
      return new Date(date).toLocaleDateString('fr-FR');
    }
    
    // Si c'est une chaîne de caractères
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR');
      }
    }
    
    return 'Date invalide';
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
};

/**
 * Formate une date et heure en format français (JJ/MM/AAAA HH:MM)
 */
export const formatDateTime = (date: Date | string | number | undefined): string => {
  if (!date) return 'Date non définie';
  
  try {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return 'Date invalide';
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }
    
    return `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    console.error('Erreur lors du formatage de la date et heure:', error);
    return 'Date invalide';
  }
};

/**
 * Obtient la date actuelle au format ISO
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Obtient l'heure actuelle au format HH:MM
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

/**
 * Calcule la différence en jours entre deux dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // heures*minutes*secondes*millisecondes
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
};
