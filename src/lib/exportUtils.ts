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
export const exportIncidents = async (
  incidents: any[],
  getHotelName: (id: string) => Promise<string>,
  getLocationLabel: (id: string) => Promise<string>,
  getCategoryLabel: (id: string) => Promise<string>,
  getImpactLabel: (id: string) => Promise<string>,
  getStatusLabel: (id: string) => Promise<string>,
  getUserName: (id: string) => Promise<string>
) => {
  // Préparer les données pour l'export
  const exportData = await Promise.all(incidents.map(async incident => {
    // Asynchronously resolve all labels
    const hotelName = await getHotelName(incident.hotelId);
    const locationName = await getLocationLabel(incident.locationId);
    const categoryName = await getCategoryLabel(incident.categoryId);
    const impactName = await getImpactLabel(incident.impactId);
    const statusName = await getStatusLabel(incident.statusId);
    const receivedByName = await getUserName(incident.receivedById);
    const concludedByName = incident.concludedById ? await getUserName(incident.concludedById) : '-';
    
    return {
      'Date': formatDate(new Date(incident.date)),
      'Heure': incident.time,
      'Hôtel': hotelName,
      'Lieu': locationName,
      'Catégorie': categoryName,
      'Impact': impactName,
      'Client': incident.clientName || '-',
      'Description': incident.description,
      'Description de la résolution': incident.resolutionDescription || '-',
      'Reçu par': receivedByName,
      'Conclu par': concludedByName,
      'Statut': statusName,
      'Date de création': formatDate(incident.createdAt)
    };
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
export const exportMaintenanceRequests = async (
  maintenanceRequests: any[],
  getHotelName: (id: string) => Promise<string>,
  getLocationLabel: (id: string) => Promise<string>,
  getInterventionTypeLabel: (id: string) => Promise<string>,
  getStatusLabel: (id: string) => Promise<string>,
  getUserName: (id: string) => Promise<string>
) => {
  // Préparer les données pour l'export
  const exportData = await Promise.all(maintenanceRequests.map(async request => {
    // Asynchronously resolve all labels
    const hotelName = await getHotelName(request.hotelId);
    const locationName = await getLocationLabel(request.locationId);
    const interventionTypeName = await getInterventionTypeLabel(request.interventionTypeId);
    const statusName = await getStatusLabel(request.statusId);
    const receivedByName = await getUserName(request.receivedById);
    const technicianName = request.technicianId ? await getUserName(request.technicianId) : '-';
    
    return {
      'Date': formatDate(new Date(request.date)),
      'Heure': request.time,
      'Hôtel': hotelName,
      'Lieu': locationName,
      'Type d\'intervention': interventionTypeName,
      'Description': request.description,
      'Reçu par': receivedByName,
      'Technicien': technicianName,
      'Montant estimé': request.estimatedAmount ? `${request.estimatedAmount} €` : '-',
      'Montant final': request.finalAmount ? `${request.finalAmount} €` : '-',
      'Statut': statusName,
      'Date de début': request.startDate ? formatDate(request.startDate) : '-',
      'Date de fin': request.endDate ? formatDate(request.endDate) : '-',
      'Date de création': formatDate(request.createdAt)
    };
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
export const exportLostItems = async (
  lostItems: any[],
  getHotelName: (id: string) => Promise<string>,
  getLocationLabel: (id: string) => Promise<string>,
  getItemTypeLabel: (id: string) => Promise<string>,
  getUserName: (id: string) => Promise<string>
) => {
  // Préparer les données pour l'export
  const exportData = await Promise.all(lostItems.map(async item => {
    // Asynchronously resolve all labels
    const hotelName = await getHotelName(item.hotelId);
    const locationName = await getLocationLabel(item.locationId);
    const itemTypeName = await getItemTypeLabel(item.itemTypeId);
    const foundByName = await getUserName(item.foundById);
    
    return {
      'Date': formatDate(new Date(item.date)),
      'Heure': item.time,
      'Hôtel': hotelName,
      'Lieu': locationName,
      'Type d\'objet': itemTypeName,
      'Description': item.description,
      'Trouvé par': foundByName,
      'Lieu de stockage': item.storageLocation,
      'Statut': item.status.charAt(0).toUpperCase() + item.status.slice(1),
      'Rendu à': item.returnedTo || '-',
      'Date de restitution': item.returnDate ? formatDate(item.returnDate) : '-',
      'Date de création': formatDate(item.createdAt)
    };
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
export const exportProcedures = async (
  procedures: any[],
  getModuleName: (id: string) => Promise<string>,
  getTypeLabel: (id: string) => Promise<string>,
  getHotelName: (id: string) => Promise<string>
) => {
  // Préparer les données pour l'export
  const exportData = await Promise.all(procedures.map(async procedure => {
    // Resolve module name and type label
    const moduleName = await getModuleName(procedure.moduleId);
    const typeLabel = await getTypeLabel(procedure.typeId);
    
    // Resolve all hotel names
    const hotelNames = await Promise.all(procedure.hotelIds.map((id: string) => getHotelName(id)));
    let hotelsList = '';
    
    if (procedure.hotelIds.length === 0) {
      hotelsList = '-';
    } else if (procedure.hotelIds.length === 1) {
      hotelsList = hotelNames[0];
    } else {
      hotelsList = hotelNames.join(', ');
    }
    
    return {
      'Titre': procedure.title,
      'Description': procedure.description,
      'Module': moduleName,
      'Type': typeLabel,
      'Hôtels': hotelsList,
      'URL du fichier': procedure.fileUrl,
      'Lectures totales': procedure.userReads.length,
      'Lectures validées': procedure.userReads.filter((r: any) => r.validated).length,
      'Date de création': formatDate(procedure.createdAt),
      'Date de mise à jour': formatDate(procedure.updatedAt)
    };
  }));
  
  // Exporter vers Excel
  exportToExcel(exportData, "Procedures", "CREHO_Procedures");
};