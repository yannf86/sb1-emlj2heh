import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Ensure the jspdf-autotable is properly imported - this fixes the autoTable is not a function error
type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
};

import { formatDate } from './utils';

/**
 * Configuration des styles de base pour les exports PDF
 */
const PDF_CONFIG = {
  headerColor: [212, 160, 23], // Brand color: #D4A017
  secondaryColor: [140, 100, 16], // Darker brand color: #8C6410
  textColor: [74, 74, 74], // Charcoal: #4A4A4A
  pageMargins: { top: 30, right: 20, bottom: 30, left: 20 },
  footerText: 'CREHO - Gestion Multi-Hôtels',
  logoHeight: 20,
};

/**
 * Crée un PDF avec l'en-tête, le pied de page et les styles de base
 * @param title Titre du document
 * @param landscape Orientation du document
 * @returns Instance jsPDF configurée
 */
const createBasePDF = (title: string, landscape = false): JsPDFWithAutoTable => {
  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as JsPDFWithAutoTable;
  
  // Définir la taille de police par défaut
  doc.setFontSize(10);
  
  // Ajouter l'en-tête
  doc.setFillColor(PDF_CONFIG.headerColor[0], PDF_CONFIG.headerColor[1], PDF_CONFIG.headerColor[2]);
  doc.rect(0, 0, doc.internal.pageSize.width, 16, 'F');
  
  // Ajouter le titre
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title, PDF_CONFIG.pageMargins.left, 10);
  
  // Ajouter la date d'export
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Export du ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right - 50, 
    10
  );
  
  // Fonction pour ajouter le pied de page
  const addFooter = (data: any) => {
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(
      PDF_CONFIG.pageMargins.left, 
      doc.internal.pageSize.height - 20, 
      doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right, 
      doc.internal.pageSize.height - 20
    );
    
    // Texte du pied de page
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      PDF_CONFIG.footerText,
      PDF_CONFIG.pageMargins.left,
      doc.internal.pageSize.height - 10
    );
    
    // Numéro de page
    const pageCount = doc.internal.getNumberOfPages();
    doc.text(
      `Page ${data.pageNumber} / ${pageCount}`,
      doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right - 25,
      doc.internal.pageSize.height - 10
    );
  };
  
  return doc;
};

/**
 * Exporte les incidents vers un fichier PDF avec mise en page
 * @param incidents Données des incidents à exporter
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getUserName Fonction pour obtenir le nom d'un utilisateur
 */
export const exportIncidentsToPDF = (
  incidents: any[],
  getHotelName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getUserName: (id: string) => string
): string => {
  try {
    // Créer un nouveau document PDF
    const doc = createBasePDF('Suivi des Incidents', true);
    
    // Préparer les données pour la table
    const tableColumn = [
      'Date', 
      'Hôtel', 
      'Lieu', 
      'Catégorie', 
      'Impact', 
      'Client', 
      'Description',
      'Reçu par',
      'Statut'
    ];
    
    const tableRows = incidents.map(incident => [
      `${formatDate(new Date(incident.date))} ${incident.time}`,
      getHotelName(incident.hotelId),
      getParameterLabel(incident.locationId),
      getParameterLabel(incident.categoryId),
      getParameterLabel(incident.impactId),
      incident.clientName || '-',
      incident.description,
      getUserName(incident.receivedById),
      getParameterLabel(incident.statusId)
    ]);
    
    // Ajouter statistiques
    const categoryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    
    incidents.forEach(incident => {
      const category = getParameterLabel(incident.categoryId);
      const status = getParameterLabel(incident.statusId);
      
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Ajouter un résumé en haut du document
    doc.setFontSize(12);
    doc.setTextColor(PDF_CONFIG.textColor[0], PDF_CONFIG.textColor[1], PDF_CONFIG.textColor[2]);
    doc.text(`Nombre total d'incidents: ${incidents.length}`, PDF_CONFIG.pageMargins.left, 25);
    
    // Ajouter le tableau principal
    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      headStyles: {
        fillColor: [PDF_CONFIG.headerColor[0], PDF_CONFIG.headerColor[1], PDF_CONFIG.headerColor[2]],
        textColor: [255, 255, 255],
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 9,
        lineColor: [220, 220, 220]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 28 }, // Date
        1: { cellWidth: 30 }, // Hôtel
        2: { cellWidth: 25 }, // Lieu
        3: { cellWidth: 25 }, // Catégorie
        4: { cellWidth: 20 }, // Impact
        5: { cellWidth: 25 }, // Client
        6: { cellWidth: 'auto' }, // Description
        7: { cellWidth: 30 }, // Reçu par
        8: { cellWidth: 20 }, // Statut
      },
      margin: PDF_CONFIG.pageMargins,
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Ligne de séparation
          doc.setDrawColor(200, 200, 200);
          doc.line(
            PDF_CONFIG.pageMargins.left, 
            doc.internal.pageSize.height - 20, 
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right, 
            doc.internal.pageSize.height - 20
          );
          
          // Texte du pied de page
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text(
            PDF_CONFIG.footerText,
            PDF_CONFIG.pageMargins.left,
            doc.internal.pageSize.height - 10
          );
          
          // Numéro de page
          doc.text(
            `Page ${i} / ${pageCount}`,
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right - 25,
            doc.internal.pageSize.height - 10
          );
        }
      }
    });
    
    // Enregistrer le PDF
    const fileName = `CREHO_Incidents_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error("Erreur pendant la génération du PDF:", error);
    throw error;
  }
};

/**
 * Exporte les demandes de maintenance vers un fichier PDF avec mise en page
 * @param maintenanceRequests Données des demandes de maintenance à exporter
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getUserName Fonction pour obtenir le nom d'un utilisateur
 */
export const exportMaintenanceRequestsToPDF = (
  maintenanceRequests: any[],
  getHotelName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getUserName: (id: string) => string
): string => {
  try {
    // Créer un nouveau document PDF
    const doc = createBasePDF('Suivi Technique / Maintenance', true);
    
    // Préparer les données pour la table
    const tableColumn = [
      'Date', 
      'Hôtel', 
      'Lieu', 
      'Type d\'intervention',
      'Description', 
      'Reçu par',
      'Technicien', 
      'Statut',
      'Montant estimé',
      'Montant final'
    ];
    
    const tableRows = maintenanceRequests.map(request => [
      `${formatDate(new Date(request.date))} ${request.time}`,
      getHotelName(request.hotelId),
      getParameterLabel(request.locationId),
      getParameterLabel(request.interventionTypeId),
      request.description,
      getUserName(request.receivedById),
      request.technicianId ? getUserName(request.technicianId) : '-',
      getParameterLabel(request.statusId),
      request.estimatedAmount ? `${request.estimatedAmount} €` : '-',
      request.finalAmount ? `${request.finalAmount} €` : '-'
    ]);
    
    // Ajouter un résumé en haut du document
    doc.setFontSize(12);
    doc.setTextColor(PDF_CONFIG.textColor[0], PDF_CONFIG.textColor[1], PDF_CONFIG.textColor[2]);
    doc.text(`Nombre total d'interventions: ${maintenanceRequests.length}`, PDF_CONFIG.pageMargins.left, 25);
    
    // Ajouter le tableau principal
    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      headStyles: {
        fillColor: [PDF_CONFIG.headerColor[0], PDF_CONFIG.headerColor[1], PDF_CONFIG.headerColor[2]],
        textColor: [255, 255, 255],
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 9,
        lineColor: [220, 220, 220]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 28 }, // Date
        1: { cellWidth: 25 }, // Hôtel
        2: { cellWidth: 20 }, // Lieu
        3: { cellWidth: 25 }, // Type d'intervention
        4: { cellWidth: 'auto' }, // Description
        5: { cellWidth: 25 }, // Reçu par
        6: { cellWidth: 25 }, // Technicien
        7: { cellWidth: 20 }, // Statut
        8: { cellWidth: 23 }, // Montant estimé
        9: { cellWidth: 23 }, // Montant final
      },
      margin: PDF_CONFIG.pageMargins,
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Ligne de séparation
          doc.setDrawColor(200, 200, 200);
          doc.line(
            PDF_CONFIG.pageMargins.left, 
            doc.internal.pageSize.height - 20, 
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right, 
            doc.internal.pageSize.height - 20
          );
          
          // Texte du pied de page
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text(
            PDF_CONFIG.footerText,
            PDF_CONFIG.pageMargins.left,
            doc.internal.pageSize.height - 10
          );
          
          // Numéro de page
          doc.text(
            `Page ${i} / ${pageCount}`,
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right - 25,
            doc.internal.pageSize.height - 10
          );
        }
      }
    });
    
    // Enregistrer le PDF
    const fileName = `CREHO_Maintenance_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error("Erreur pendant la génération du PDF:", error);
    throw error;
  }
};

/**
 * Exporte les objets trouvés vers un fichier PDF avec mise en page
 * @param lostItems Données des objets trouvés à exporter
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getUserName Fonction pour obtenir le nom d'un utilisateur
 */
export const exportLostItemsToPDF = (
  lostItems: any[],
  getHotelName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getUserName: (id: string) => string
): string => {
  try {
    // Créer un nouveau document PDF
    const doc = createBasePDF('Suivi des Objets Trouvés', true);
    
    // Préparer les données pour la table
    const tableColumn = [
      'Date', 
      'Hôtel', 
      'Lieu', 
      'Type d\'objet',
      'Description', 
      'Trouvé par',
      'Stockage', 
      'Statut',
      'Rendu à',
      'Date restitution'
    ];
    
    const tableRows = lostItems.map(item => [
      `${formatDate(new Date(item.date))} ${item.time}`,
      getHotelName(item.hotelId),
      getParameterLabel(item.locationId),
      getParameterLabel(item.itemTypeId),
      item.description,
      getUserName(item.foundById),
      item.storageLocation,
      item.status.charAt(0).toUpperCase() + item.status.slice(1),
      item.returnedTo || '-',
      item.returnDate ? formatDate(new Date(item.returnDate)) : '-'
    ]);
    
    // Ajouter statistiques de base
    const countByStatus = {
      'conservé': lostItems.filter(item => item.status === 'conservé').length,
      'rendu': lostItems.filter(item => item.status === 'rendu').length,
      'transféré': lostItems.filter(item => item.status === 'transféré').length
    };
    
    // Ajouter un résumé en haut du document
    doc.setFontSize(12);
    doc.setTextColor(PDF_CONFIG.textColor[0], PDF_CONFIG.textColor[1], PDF_CONFIG.textColor[2]);
    doc.text(`Nombre total d'objets: ${lostItems.length}`, PDF_CONFIG.pageMargins.left, 25);
    doc.setFontSize(10);
    doc.text(`Conservés: ${countByStatus.conservé} | Rendus: ${countByStatus.rendu} | Transférés: ${countByStatus.transféré}`, PDF_CONFIG.pageMargins.left, 30);
    
    // Ajouter le tableau principal
    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      headStyles: {
        fillColor: [PDF_CONFIG.headerColor[0], PDF_CONFIG.headerColor[1], PDF_CONFIG.headerColor[2]],
        textColor: [255, 255, 255],
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 9,
        lineColor: [220, 220, 220]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 28 }, // Date
        1: { cellWidth: 25 }, // Hôtel
        2: { cellWidth: 20 }, // Lieu
        3: { cellWidth: 25 }, // Type d'objet
        4: { cellWidth: 'auto' }, // Description
        5: { cellWidth: 25 }, // Trouvé par
        6: { cellWidth: 25 }, // Stockage
        7: { cellWidth: 20 }, // Statut
        8: { cellWidth: 25 }, // Rendu à
        9: { cellWidth: 25 }, // Date restitution
      },
      margin: PDF_CONFIG.pageMargins,
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Ligne de séparation
          doc.setDrawColor(200, 200, 200);
          doc.line(
            PDF_CONFIG.pageMargins.left, 
            doc.internal.pageSize.height - 20, 
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right, 
            doc.internal.pageSize.height - 20
          );
          
          // Texte du pied de page
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text(
            PDF_CONFIG.footerText,
            PDF_CONFIG.pageMargins.left,
            doc.internal.pageSize.height - 10
          );
          
          // Numéro de page
          doc.text(
            `Page ${i} / ${pageCount}`,
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right - 25,
            doc.internal.pageSize.height - 10
          );
        }
      }
    });
    
    // Enregistrer le PDF
    const fileName = `CREHO_Objets_Trouves_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error("Erreur pendant la génération du PDF:", error);
    throw error;
  }
};

/**
 * Exporte les procédures vers un fichier PDF avec mise en page
 * @param procedures Données des procédures à exporter
 * @param getModuleName Fonction pour obtenir le nom du module
 * @param getParameterLabel Fonction pour obtenir le libellé d'un paramètre
 * @param getHotelName Fonction pour obtenir le nom de l'hôtel
 */
export const exportProceduresToPDF = (
  procedures: any[],
  getModuleName: (id: string) => string,
  getParameterLabel: (id: string) => string,
  getHotelName: (id: string) => string
): string => {
  try {
    // Créer un nouveau document PDF
    const doc = createBasePDF('Procédures', true);
    
    // Préparer les données pour la table
    const tableColumn = [
      'Titre', 
      'Module', 
      'Type', 
      'Hôtels',
      'Description', 
      'Lectures validées',
      'Lectures totales', 
      'Date création',
      'Dernière MàJ'
    ];
    
    const tableRows = procedures.map(procedure => {
      // Formater la liste des hôtels
      let hotelsList;
      if (procedure.hotelIds.length === 0) {
        hotelsList = '-';
      } else if (procedure.hotelIds.length === 1) {
        hotelsList = getHotelName(procedure.hotelIds[0]);
      } else {
        hotelsList = procedure.hotelIds.map(id => getHotelName(id)).join(', ');
      }
      
      return [
        procedure.title,
        getModuleName(procedure.moduleId),
        getParameterLabel(procedure.typeId),
        hotelsList,
        procedure.description,
        procedure.userReads.filter(r => r.validated).length.toString(),
        procedure.userReads.length.toString(),
        formatDate(new Date(procedure.createdAt)),
        formatDate(new Date(procedure.updatedAt))
      ];
    });
    
    // Ajouter un résumé en haut du document
    doc.setFontSize(12);
    doc.setTextColor(PDF_CONFIG.textColor[0], PDF_CONFIG.textColor[1], PDF_CONFIG.textColor[2]);
    doc.text(`Nombre total de procédures: ${procedures.length}`, PDF_CONFIG.pageMargins.left, 25);
    
    // Ajouter le tableau principal
    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      headStyles: {
        fillColor: [PDF_CONFIG.headerColor[0], PDF_CONFIG.headerColor[1], PDF_CONFIG.headerColor[2]],
        textColor: [255, 255, 255],
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 9,
        lineColor: [220, 220, 220]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Titre
        1: { cellWidth: 30 }, // Module
        2: { cellWidth: 25 }, // Type
        3: { cellWidth: 40 }, // Hôtels
        4: { cellWidth: 'auto' }, // Description
        5: { cellWidth: 20 }, // Lectures validées
        6: { cellWidth: 20 }, // Lectures totales
        7: { cellWidth: 25 }, // Date création
        8: { cellWidth: 25 }, // Dernière MàJ
      },
      margin: PDF_CONFIG.pageMargins,
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Ligne de séparation
          doc.setDrawColor(200, 200, 200);
          doc.line(
            PDF_CONFIG.pageMargins.left, 
            doc.internal.pageSize.height - 20, 
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right, 
            doc.internal.pageSize.height - 20
          );
          
          // Texte du pied de page
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text(
            PDF_CONFIG.footerText,
            PDF_CONFIG.pageMargins.left,
            doc.internal.pageSize.height - 10
          );
          
          // Numéro de page
          doc.text(
            `Page ${i} / ${pageCount}`,
            doc.internal.pageSize.width - PDF_CONFIG.pageMargins.right - 25,
            doc.internal.pageSize.height - 10
          );
        }
      }
    });
    
    // Enregistrer le PDF
    const fileName = `CREHO_Procedures_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error("Erreur pendant la génération du PDF:", error);
    throw error;
  }
};