import { format, parse, addDays, subDays, isSameDay, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Normalise une date à minuit (00:00:00) pour les comparaisons de dates sans composante horaire
 * @param date Date à normaliser
 * @returns Nouvelle date normalisée à minuit
 */
export function normalizeToMidnight(date: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(new Date(date.getTime()), 0), 0), 0), 0);
}

/**
 * Normalise une date à la fin de journée (23:59:59.999) pour les comparaisons inclusives
 * @param date Date à normaliser
 * @returns Nouvelle date normalisée à la fin de journée
 */
export function normalizeToEndOfDay(date: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(new Date(date.getTime()), 23), 59), 59), 999);
}

/**
 * Parse une chaîne de date au format ISO (YYYY-MM-DD) en objet Date local
 * @param isoString Chaîne au format YYYY-MM-DD
 * @returns Un objet Date en heure locale
 */
export function parseISOLocalDate(isoString: string): Date {
  if (!isoString) return new Date();
  
  // Utiliser l'option safer pour créer une date locale
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convertit un objet Date en chaîne ISO locale (YYYY-MM-DD)
 * @param date Date à convertir
 * @returns Chaîne au format YYYY-MM-DD
 */
export function formatToISOLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtient la date précédente
 * @param date Date de référence
 * @returns Nouvelle date (jour précédent)
 */
export function getPreviousDay(date: Date): Date {
  return normalizeToMidnight(subDays(new Date(date.getTime()), 1));
}

/**
 * Obtient la date suivante
 * @param date Date de référence
 * @returns Nouvelle date (jour suivant)
 */
export function getNextDay(date: Date): Date {
  return normalizeToMidnight(addDays(new Date(date.getTime()), 1));
}

/**
 * Vérifie si une date est aujourd'hui
 * @param date Date à vérifier
 * @returns true si la date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Formatte une date pour affichage
 * @param date Date à formater
 * @returns Date formatée (ex: "10 juin 2025")
 */
export function formatDateForDisplay(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr });
}

/**
 * Calcule le numéro de semaine pour une date donnée
 * @param date Date
 * @returns Numéro de semaine
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Convertit une chaîne ISO en date sûre (avec validation et correction des fuseaux horaires)
 * @param isoString Chaîne au format YYYY-MM-DD ou complet ISO
 * @param useLocalTime Indique si on doit utiliser l'heure locale (true) ou UTC (false)
 * @returns Date valide ou null
 */
export function safeParseISO(isoString: string, useLocalTime = true): Date | null {
  if (!isoString) return null;
  
  try {
    if (isoString.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
      // Format YYYY-MM-DD - parse en date locale
      const [year, month, day] = isoString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } else {
      // Format ISO complet (avec temps) - parse selon le mode demandé
      const date = new Date(isoString);
      
      if (isNaN(date.getTime())) {
        return null;
      }
      
      if (useLocalTime) {
        // Ajuster l'offset du fuseau horaire pour obtenir la même heure locale
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        return new Date(date.getTime() + offsetMs);
      }
      
      return date;
    }
  } catch (e) {
    console.error("Date parsing error:", e);
    return null;
  }
}

/**
 * Compare deux dates pour le tri
 * @param dateA Première date (string ou Date)
 * @param dateB Deuxième date (string ou Date)
 * @returns Valeur négative si dateA < dateB, positive si dateA > dateB, 0 si égales
 */
export function compareDates(dateA: string | Date, dateB: string | Date): number {
  const dateObjA = typeof dateA === 'string' ? parseISOLocalDate(dateA) : dateA;
  const dateObjB = typeof dateB === 'string' ? parseISOLocalDate(dateB) : dateB;
  
  return dateObjA.getTime() - dateObjB.getTime();
}

/**
 * Vérifie si une date est dans une plage de dates (inclusivement)
 * @param date Date à vérifier
 * @param startDate Date de début de la plage
 * @param endDate Date de fin de la plage
 * @returns true si la date est dans la plage
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const normalizedDate = normalizeToMidnight(date);
  const normalizedStart = normalizeToMidnight(startDate);
  const normalizedEnd = normalizeToMidnight(endDate);
  
  return normalizedDate.getTime() >= normalizedStart.getTime() && 
         normalizedDate.getTime() <= normalizedEnd.getTime();
}