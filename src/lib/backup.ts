// Mock implementation for frontend
export interface Backup {
  filename: string;
  path: string;
  timestamp: Date;
}

export const createBackup = async () => {
  try {
    // Mock successful backup creation
    const timestamp = new Date();
    const filename = `backup-${timestamp.toISOString().split('.')[0].replace(/[:]/g, '-')}.zip`;
    
    return {
      success: true,
      filename,
      path: `/backups/${filename}`
    };
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur est survenue'
    };
  }
};

export const restoreBackup = async (backupPath: string) => {
  try {
    return {
      success: false,
      error: 'La restauration n\'est pas encore implémentée'
    };
  } catch (error) {
    console.error('Erreur lors de la restauration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur est survenue'
    };
  }
};

export const listBackups = (): Backup[] => {
  // Return mock data
  return [
    {
      filename: 'backup-2025-03-20-10-30-00.zip',
      path: '/backups/backup-2025-03-20-10-30-00.zip',
      timestamp: new Date('2025-03-20T10:30:00')
    },
    {
      filename: 'backup-2025-03-19-15-45-00.zip', 
      path: '/backups/backup-2025-03-19-15-45-00.zip',
      timestamp: new Date('2025-03-19T15:45:00')
    },
    {
      filename: 'backup-2025-03-18-09-15-00.zip',
      path: '/backups/backup-2025-03-18-09-15-00.zip', 
      timestamp: new Date('2025-03-18T09:15:00')
    }
  ];
};