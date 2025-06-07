// Simplified email module that simulates email sending without @sendgrid/mail
export const sendEmail = async (to: string, subject: string, body: string, cc?: string[]): Promise<boolean> => {
  try {
    console.log('📧 Sending email...');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`CC: ${cc?.join(', ') || 'None'}`);
    console.log(`Body: ${body.substring(0, 100)}...`);
    
    // For development: Just log success without making actual network requests
    console.log('✅ Email would be sent in production environment');
    
    return true;
  } catch (error) {
    console.error('❌ Error processing email:', error);
    return false;
  }
};

// Simplified notification functions
export const sendMaintenanceEmailNotifications = async (
  maintenanceId: string,
  hotelId: string,
  technicianIds: string[],
  notificationType: 'new_quote_request' | 'quote_accepted' | 'quote_rejected' | 'maintenance_complete'
): Promise<boolean> => {
  console.log(`📨 Would send ${notificationType} notification for maintenance ${maintenanceId} to ${technicianIds.length} technicians`);
  return true;
};

export const sendIncidentResolvedNotification = async (incident: any): Promise<boolean> => {
  if (!incident.clientEmail) return true;
  console.log(`📨 Would send resolution notification to ${incident.clientEmail} for incident ${incident.id}`);
  return true;
};

export const sendQuoteAcceptedNotification = async (maintenance: any, technicianId: string): Promise<boolean> => {
  console.log(`📨 Would send quote accepted notification to technician ${technicianId}`);
  return true;
};