import * as XLSX from 'xlsx';
import { formatDate } from './utils';

/**
 * Configure l'apparence et le style d'une feuille Excel
 * @param ws Feuille de calcul à formater
 * @param headerRow Tableau contenant les titres des colonnes
 */
export const applyExcelStyling = (ws: XLSX.WorkSheet, headerRow: string[]) => {
  // Définir les styles
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "D4A017" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };
  
  const borderStyle = {
    border: {
      top: { style: "thin", color: { rgb: "CCCCCC" } },
      bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      left: { style: "thin", color: { rgb: "CCCCCC" } },
      right: { style: "thin", color: { rgb: "CCCCCC" } }
    }
  };
  
  const evenRowStyle = {
    fill: { fgColor: { rgb: "F5EACB" } }
  };
  
  // Appliquer les styles aux en-têtes
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const headerRange = { ...range, e: { r: range.s.r, c: range.e.c } };
  
  // Largeur des colonnes
  const colWidths = headerRow.map(header => 
    Math.max(header.length, 12)
  );
  
  // Définir la largeur des colonnes
  ws['!cols'] = colWidths.map(width => ({ width }));
  
  // Définir la hauteur de la ligne d'en-tête
  ws['!rows'] = [{ hpt: 25 }]; // hauteur de la première ligne
  
  // Créer les styles pour toutes les cellules
  if (!ws['!styleprop']) ws['!styleprop'] = {};
  
  // Style pour les en-têtes
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ r: headerRange.s.r, c: C });
    ws[addr].s = headerStyle;
  }
  
  // Style pour le contenu
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[addr]) {
        ws[addr].s = R % 2 === 0 ? { ...borderStyle, ...evenRowStyle } : borderStyle;
      }
    }
  }
  
  return ws;
};

/**
 * Exporte les données vers un fichier Excel avec une mise en page professionnelle
 * @param data Données à exporter
 * @param sheetName Nom de la feuille
 * @param fileName Nom du fichier
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  sheetName: string,
  fileName: string
) => {
  // Si les données sont vides
  if (data.length === 0) {
    console.warn("Aucune donnée à exporter");
    return;
  }
  
  // Convertir en feuille Excel
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Récupérer les en-têtes
  const headerRow = Object.keys(data[0]);
  
  // Appliquer le style
  applyExcelStyling(ws, headerRow);
  
  // Créer le classeur
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Générer le nom du fichier avec la date
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${dateStr}.xlsx`;
  
  // Exporter le fichier
  XLSX.writeFile(wb, fullFileName);
};

/**
 * Exporte les incidents vers un fichier Excel formaté
 * @param incidents Données des incidents à exporter
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getUserName Fonction pour obtenir le nom d'un utilisateur
 */
export const exportIncidents = (
  incidents: any[],
  getHotelName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getUserName: (id: string) => string
) => {
  // Préparer les données pour l'export
  const exportData = incidents.map(incident => ({
    'Date': formatDate(new Date(incident.date)),
    'Heure': incident.time,
    'Hôtel': getHotelName(incident.hotelId),
    'Lieu': getParameterLabel(incident.locationId),
    'Catégorie': getParameterLabel(incident.categoryId),
    'Impact': getParameterLabel(incident.impactId),
    'Client': incident.clientName || '-',
    'Description': incident.description,
    'Reçu par': getUserName(incident.receivedById),
    'Statut': getParameterLabel(incident.statusId),
    'Date de création': formatDate(incident.createdAt)
  }));
  
  // Exporter vers Excel
  exportToExcel(exportData, "Incidents", "CREHO_Incidents");
};

/**
 * Exporte les demandes de maintenance vers un fichier Excel formaté
 * @param maintenanceRequests Données des demandes de maintenance à exporter
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getUserName Fonction pour obtenir le nom d'un utilisateur
 */
export const exportMaintenanceRequests = (
  maintenanceRequests: any[],
  getHotelName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getUserName: (id: string) => string
) => {
  // Préparer les données pour l'export
  const exportData = maintenanceRequests.map(request => ({
    'Date': formatDate(new Date(request.date)),
    'Heure': request.time,
    'Hôtel': getHotelName(request.hotelId),
    'Lieu': getParameterLabel(request.locationId),
    'Type d\'intervention': getParameterLabel(request.interventionTypeId),
    'Description': request.description,
    'Reçu par': getUserName(request.receivedById),
    'Technicien': request.technicianId ? getUserName(request.technicianId) : '-',
    'Montant estimé': request.estimatedAmount ? `${request.estimatedAmount} €` : '-',
    'Montant final': request.finalAmount ? `${request.finalAmount} €` : '-',
    'Statut': getParameterLabel(request.statusId),
    'Date de début': request.startDate ? formatDate(request.startDate) : '-',
    'Date de fin': request.endDate ? formatDate(request.endDate) : '-',
    'Date de création': formatDate(request.createdAt)
  }));
  
  // Exporter vers Excel
  exportToExcel(exportData, "Maintenance", "CREHO_Maintenance");
};

/**
 * Exporte les objets trouvés vers un fichier Excel formaté
 * @param lostItems Données des objets trouvés à exporter
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getUserName Fonction pour obtenir le nom d'un utilisateur
 */
export const exportLostItems = (
  lostItems: any[],
  getHotelName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getUserName: (id: string) => string
) => {
  // Préparer les données pour l'export
  const exportData = lostItems.map(item => ({
    'Date': formatDate(new Date(item.date)),
    'Heure': item.time,
    'Hôtel': getHotelName(item.hotelId),
    'Lieu': getParameterLabel(item.locationId),
    'Type d\'objet': getParameterLabel(item.itemTypeId),
    'Description': item.description,
    'Trouvé par': getUserName(item.foundById),
    'Lieu de stockage': item.storageLocation,
    'Statut': item.status.charAt(0).toUpperCase() + item.status.slice(1),
    'Rendu à': item.returnedTo || '-',
    'Date de restitution': item.returnDate ? formatDate(item.returnDate) : '-',
    'Date de création': formatDate(item.createdAt)
  }));
  
  // Exporter vers Excel
  exportToExcel(exportData, "Objets_Trouves", "CREHO_Objets_Trouves");
};

/**
 * Exporte les procédures vers un fichier Excel formaté
 * @param procedures Données des procédures à exporter
 * @param getModuleName Fonction pour obtenir le nom du module
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 */
export const exportProcedures = (
  procedures: any[],
  getModuleName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getHotelName: (id: string) => string
) => {
  // Préparer les données pour l'export
  const exportData = procedures.map(procedure => {
    // Formater la liste des hôtels
    let hotelsList;
    if (procedure.hotelIds.length === 0) {
      hotelsList = '-';
    } else if (procedure.hotelIds.length === 1) {
      hotelsList = getHotelName(procedure.hotelIds[0]);
    } else {
      hotelsList = procedure.hotelIds.map(id => getHotelName(id)).join(', ');
    }
    
    return {
      'Titre': procedure.title,
      'Description': procedure.description,
      'Module': getModuleName(procedure.moduleId),
      'Type': getParameterLabel(procedure.typeId),
      'Hôtels': hotelsList,
      'URL du fichier': procedure.fileUrl,
      'Lectures totales': procedure.userReads.length,
      'Lectures validées': procedure.userReads.filter(r => r.validated).length,
      'Date de création': formatDate(procedure.createdAt),
      'Date de mise à jour': formatDate(procedure.updatedAt)
    };
  });
  
  // Exporter vers Excel
  exportToExcel(exportData, "Procedures", "CREHO_Procedures");
};