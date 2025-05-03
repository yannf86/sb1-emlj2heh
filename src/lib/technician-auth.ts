import { query, where, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

// Store the current technician
let currentTechnician: any | null = null;

interface TechnicianAuthResult {
  success: boolean;
  technician?: any;
  message?: string;
}

// Login function for technicians (simulated authentication)
export const loginTechnician = async (email: string, password: string): Promise<TechnicianAuthResult> => {
  try {
    // In a real app, this would validate against Firebase Auth
    // For now, we'll just check if there's a technician with this email
    const techQuery = query(
      collection(db, 'technicians'),
      where('email', '==', email),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(techQuery);
    
    if (snapshot.empty) {
      return { 
        success: false, 
        message: "Aucun technicien actif trouvé avec cet email" 
      };
    }
    
    // For testing, we'll accept any password for existing technicians
    // In a real app, you'd check credentials properly
    const technicianData = snapshot.docs[0].data();
    const technician = {
      id: snapshot.docs[0].id,
      ...technicianData
    };
    
    // Store in localStorage with 24h expiration
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    const authData = {
      technician,
      expires: expires.toISOString()
    };
    
    localStorage.setItem('technicianAuth', JSON.stringify(authData));
    currentTechnician = technician;
    
    return { 
      success: true,
      technician
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la connexion"
    };
  }
};

// Logout function
export const logoutTechnician = () => {
  localStorage.removeItem('technicianAuth');
  currentTechnician = null;
};

// Get the current logged in technician
export const getCurrentTechnician = () => {
  if (currentTechnician) {
    return currentTechnician;
  }
  
  // Check localStorage
  const techAuth = localStorage.getItem('technicianAuth');
  if (techAuth) {
    try {
      const auth = JSON.parse(techAuth);
      const now = new Date();
      
      // Check if session is still valid
      if (auth.expires && new Date(auth.expires) > now) {
        currentTechnician = auth.technician;
        return currentTechnician;
      } else {
        // Clear expired session
        localStorage.removeItem('technicianAuth');
      }
    } catch (e) {
      localStorage.removeItem('technicianAuth');
    }
  }
  
  return null;
};

// Check if a technician is logged in
export const isTechnicianLoggedIn = () => {
  return getCurrentTechnician() !== null;
};

// Refresh technician session (extend expiration)
export const refreshTechnicianSession = () => {
  const techAuth = localStorage.getItem('technicianAuth');
  if (techAuth) {
    try {
      const auth = JSON.parse(techAuth);
      const now = new Date();
      
      // Check if session is still valid
      if (auth.expires && new Date(auth.expires) > now) {
        // Extend by 24 hours from now
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);
        
        const authData = {
          technician: auth.technician,
          expires: expires.toISOString()
        };
        
        localStorage.setItem('technicianAuth', JSON.stringify(authData));
      }
    } catch (e) {
      // Ignore errors
    }
  }
};