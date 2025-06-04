import { getCurrentUser } from './auth';
import { getHotelName } from './db/hotels';
import { getLocationLabel } from './db/parameters-locations';
import { getInterventionTypeLabel } from './db/parameters-intervention-type';
import { getStatusLabel } from './db/parameters-status';
import { getUserName } from './db/users';
import { Maintenance } from './schema';
import { useToast } from '@/hooks/use-toast';
import { getMaintenanceRequest } from './db/maintenance';
import { getTechnician } from './db/technicians';

// Simulate email sending for development environment
// In production, this would be replaced with a real email service API call
export const sendEmail = async (to: string, subject: string, body: string, cc?: string[]): Promise<boolean> => {
  try {
    console.log('📧 Sending email...');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`CC: ${cc?.join(', ') || 'None'}`);
    console.log(`Body: ${body.substring(0, 100)}...`);
    
    // For development: Just log success without making actual network requests
    // This prevents network errors in development environment
    console.log('✅ Email would be sent in production environment');
    
    // In production, this would make an API call to your email service
    // Uncomment this section when you have a real email API configured
    /*
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        cc
      })
    });

    if (!response.ok) {
      throw new Error(`Email API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success;
    */

    // For development, always return success
    return true;
  } catch (error) {
    console.error('❌ Error processing email:', error);
    
    // Important: Return false instead of throwing, so the application can continue
    // This way, email failures won't break the main functionality
    return false;
  }
};

// Specific email templates

/**
 * Send a notification email for a new incident
 */
export const sendIncidentNotification = async (incident: any): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    // Get hotel and recipient information
    const hotelName = await getHotelName(incident.hotelId);
    
    // In a real app, you would get the recipient's email from your user database
    // For demo purposes, we'll use a placeholder
    const to = 'manager@example.com';
    const subject = `[CREHO] Nouvel incident - ${hotelName}`;
    
    // Build email body with incident details
    const locationName = await getLocationLabel(incident.locationId);
    const body = `
      <h2>Nouvel incident signalé</h2>
      <p><strong>Hôtel:</strong> ${hotelName}</p>
      <p><strong>Lieu:</strong> ${locationName}</p>
      <p><strong>Date:</strong> ${incident.date} à ${incident.time}</p>
      <p><strong>Description:</strong> ${incident.description}</p>
      <p><strong>Signalé par:</strong> ${currentUser.name}</p>
      <p>Veuillez vous connecter à l'application CREHO pour plus de détails.</p>
    `;
    
    return await sendEmail(to, subject, body);
  } catch (error) {
    console.error('Error sending incident notification:', error);
    return false;
  }
};

/**
 * Send a notification email for a new maintenance request
 */
export const sendMaintenanceEmailNotifications = async (
  maintenanceId: string,
  hotelId: string,
  technicianIds: string[],
  notificationType: 'new_quote_request' | 'quote_accepted' | 'quote_rejected' | 'maintenance_complete'
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    // Retrieve the full maintenance object using the ID
    const maintenance = await getMaintenanceRequest(maintenanceId);
    if (!maintenance) {
      console.error('Maintenance request not found for ID:', maintenanceId);
      return false;
    }
    
    // Get hotel and location information
    const hotelName = await getHotelName(hotelId);
    
    // Only attempt to get these values if maintenance object exists
    let locationName = "Non spécifié";
    let interventionTypeName = "Non spécifié";
    
    try {
      if (maintenance.locationId) {
        locationName = await getLocationLabel(maintenance.locationId);
      }
      
      if (maintenance.interventionTypeId) {
        interventionTypeName = await getInterventionTypeLabel(maintenance.interventionTypeId);
      }
    } catch (error) {
      console.error('Error fetching location or intervention type details:', error);
      // Continue with default values if there's an error
    }
    
    // In a real app, you would get the recipient's email from your user database
    // For demo purposes, we'll use a placeholder
    const to = 'maintenance@example.com';
    const subject = `[CREHO] Nouvelle demande d'intervention - ${hotelName}`;
    
    // Build email body with maintenance details
    const body = `
      <h2>Nouvelle demande d'intervention technique</h2>
      <p><strong>Hôtel:</strong> ${hotelName}</p>
      <p><strong>Lieu:</strong> ${locationName}</p>
      <p><strong>Type d'intervention:</strong> ${interventionTypeName}</p>
      <p><strong>Date:</strong> ${maintenance.date} à ${maintenance.time}</p>
      <p><strong>Description:</strong> ${maintenance.description}</p>
      <p><strong>Demandé par:</strong> ${currentUser.name}</p>
      <p>Veuillez vous connecter à l'application CREHO pour plus de détails.</p>
    `;
    
    // If there are assigned technicians, also send them notifications
    let allNotificationsSent = true;
    
    if (technicianIds && technicianIds.length > 0) {
      // For each technician, send a personalized notification
      for (const technicianId of technicianIds) {
        try {
          // Get technician info
          let technicianName = "Technicien";
          let technicianEmail = "technician@example.com"; // Default placeholder
          
          try {
            const technician = await getTechnician(technicianId);
            if (technician) {
              technicianName = technician.name;
              technicianEmail = technician.email;
            }
          } catch (techError) {
            console.warn(`Could not fetch technician data for ID ${technicianId}:`, techError);
          }
          
          // Customize email based on notification type
          let techSubject, techBody;
          
          switch (notificationType) {
            case 'new_quote_request':
              techSubject = `[CREHO] Nouvelle demande de devis - ${hotelName}`;
              techBody = `
                <h2>Bonjour ${technicianName},</h2>
                <p>Vous avez reçu une nouvelle demande de devis.</p>
                <p><strong>Hôtel:</strong> ${hotelName}</p>
                <p><strong>Lieu:</strong> ${locationName}</p>
                <p><strong>Type d'intervention:</strong> ${interventionTypeName}</p>
                <p><strong>Date:</strong> ${maintenance.date} à ${maintenance.time}</p>
                <p><strong>Description:</strong> ${maintenance.description}</p>
                <p>Veuillez vous connecter à l'application CREHO pour fournir un devis.</p>
              `;
              break;
              
            case 'quote_accepted':
              techSubject = `[CREHO] Devis accepté - ${hotelName}`;
              techBody = `
                <h2>Bonjour ${technicianName},</h2>
                <p>Votre devis pour l'intervention suivante a été accepté:</p>
                <p><strong>Hôtel:</strong> ${hotelName}</p>
                <p><strong>Lieu:</strong> ${locationName}</p>
                <p><strong>Type d'intervention:</strong> ${interventionTypeName}</p>
                <p><strong>Date:</strong> ${maintenance.date} à ${maintenance.time}</p>
                <p>Veuillez vous connecter à l'application CREHO pour voir les détails.</p>
              `;
              break;
              
            case 'quote_rejected':
              techSubject = `[CREHO] Devis refusé - ${hotelName}`;
              techBody = `
                <h2>Bonjour ${technicianName},</h2>
                <p>Nous regrettons de vous informer que votre devis pour l'intervention suivante a été refusé:</p>
                <p><strong>Hôtel:</strong> ${hotelName}</p>
                <p><strong>Lieu:</strong> ${locationName}</p>
                <p><strong>Type d'intervention:</strong> ${interventionTypeName}</p>
                <p>Veuillez vous connecter à l'application CREHO pour plus d'informations.</p>
              `;
              break;
              
            case 'maintenance_complete':
              techSubject = `[CREHO] Intervention terminée - ${hotelName}`;
              techBody = `
                <h2>Bonjour ${technicianName},</h2>
                <p>L'intervention suivante a été marquée comme terminée:</p>
                <p><strong>Hôtel:</strong> ${hotelName}</p>
                <p><strong>Lieu:</strong> ${locationName}</p>
                <p><strong>Type d'intervention:</strong> ${interventionTypeName}</p>
                <p>Merci pour votre travail. Vous pouvez vous connecter à l'application CREHO pour voir les détails.</p>
              `;
              break;
          }
          
          // This is a non-critical notification, so we don't want to break the flow if it fails
          const techEmailSent = await sendEmail(technicianEmail, techSubject, techBody);
          if (!techEmailSent) {
            console.warn(`Failed to send email to technician ${technicianId}`);
            allNotificationsSent = false;
          }
        } catch (error) {
          console.error(`Error sending notification to technician ${technicianId}:`, error);
          allNotificationsSent = false;
        }
      }
    }
    
    // Send the main notification email
    const mainEmailSent = await sendEmail(to, subject, body);
    
    // Return true only if all notifications were sent successfully
    return mainEmailSent && allNotificationsSent;
  } catch (error) {
    console.error('Error preparing maintenance email notifications:', error);
    return false;
  }
};

/**
 * Send a notification email for a resolved incident
 */
export const sendIncidentResolvedNotification = async (incident: any): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    // Get hotel and recipient information
    const hotelName = await getHotelName(incident.hotelId);
    
    // If there's a client email, send them a notification
    if (incident.clientEmail) {
      const subject = `[${hotelName}] Résolution de votre signalement`;
      
      // Build email body with incident details
      const body = `
        <h2>Bonjour,</h2>
        <p>Nous vous informons que l'incident que vous avez signalé a été résolu.</p>
        <p><strong>Description:</strong> ${incident.description}</p>
        <p><strong>Résolution:</strong> ${incident.resolutionDescription || 'Problème résolu'}</p>
        <p>Nous vous remercions pour votre patience et votre compréhension.</p>
        <p>Cordialement,<br/>L'équipe de ${hotelName}</p>
      `;
      
      return await sendEmail(incident.clientEmail, subject, body);
    }
    
    return true; // No client email to notify
  } catch (error) {
    console.error('Error sending incident resolution notification:', error);
    return false;
  }
};

/**
 * Send a notification when a quote is accepted
 */
export const sendQuoteAcceptedNotification = async (maintenance: Maintenance, technicianId: string): Promise<boolean> => {
  try {
    // In a real app, get technician email from your database
    const technicianEmail = "technician@example.com"; // Placeholder
    
    const hotelName = await getHotelName(maintenance.hotelId);
    const subject = `[CREHO] Devis accepté - ${hotelName}`;
    
    const body = `
      <h2>Votre devis a été accepté</h2>
      <p>Le devis que vous avez soumis pour l'intervention suivante a été accepté:</p>
      <p><strong>Hôtel:</strong> ${hotelName}</p>
      <p><strong>Montant accepté:</strong> ${maintenance.quoteAmount || 'Non spécifié'} €</p>
      <p><strong>Description:</strong> ${maintenance.description}</p>
      <p>Veuillez vous connecter à l'application CREHO pour planifier cette intervention.</p>
    `;
    
    return await sendEmail(technicianEmail, subject, body);
  } catch (error) {
    console.error('Error sending quote accepted notification:', error);
    return false;
  }
};