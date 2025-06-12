import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

// Types
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'group_admin' | 'hotel_admin' | 'standard'; // Added group_admin role
  hotels: string[];
  modules: string[];
  groupIds: string[]; // Added groupIds
  active: boolean;
};

// Store the current user
let currentUser: AuthUser | null = null;

// Timeout for session expiry (5 minutes in ms)
export const SESSION_TIMEOUT = 5 * 60 * 1000; 
let inactivityTimer: NodeJS.Timeout | null = null;

// Test user credentials - all removed
const TEST_USERS = {};

// Simple login function
export const login = async (email: string, password: string, username: string): Promise<{ success: boolean; message?: string; user?: AuthUser }> => {
  try {
    // Login via Firebase auth first
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Check if there are multiple users with the same email
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No user found with email:", email);
      await firebaseSignOut(auth);
      return { success: false, message: "Utilisateur non trouvé" };
    }
    
    // If there are multiple users with the same email, find the one with matching username
    if (querySnapshot.docs.length > 1) {
      const matchingUser = querySnapshot.docs.find(doc => doc.data().name === username);
      
      if (!matchingUser) {
        console.error("Username does not match:", username);
        await firebaseSignOut(auth);
        return { success: false, message: "Le nom d'utilisateur ne correspond pas" };
      }
      
      const userData = matchingUser.data();
      if (!userData.active) {
        console.error("User account is disabled:", userData.name);
        await firebaseSignOut(auth);
        return { success: false, message: "Compte désactivé" };
      }
      
      // Set the current user
      currentUser = {
        id: matchingUser.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hotels: userData.hotels || [],
        modules: userData.modules || [],
        groupIds: userData.groupIds || [],
        active: userData.active
      };
    } else {
      // Just one user with this email - check if the username matches
      const userData = querySnapshot.docs[0].data();
      
      if (userData.name !== username) {
        console.error("Username does not match:", username, "vs", userData.name);
        await firebaseSignOut(auth);
        return { success: false, message: "Le nom d'utilisateur ne correspond pas" };
      }
      
      if (!userData.active) {
        console.error("User account is disabled:", userData.name);
        await firebaseSignOut(auth);
        return { success: false, message: "Compte désactivé" };
      }
      
      // Set the current user
      currentUser = {
        id: querySnapshot.docs[0].id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hotels: userData.hotels || [],
        modules: userData.modules || [],
        groupIds: userData.groupIds || [],
        active: userData.active
      };
    }
    
    // Store the user in sessionStorage instead of localStorage (will be cleared when browser closes)
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Set last activity time
    setLastActivityTime();
    
    // Start inactivity timer
    startInactivityTimer();
    
    return { success: true, user: currentUser };
  } catch (error: any) {
    console.error("Login error:", error);
    return { 
      success: false, 
      message: error.code === 'auth/invalid-credential' 
        ? "Identifiants incorrects"
        : "Une erreur est survenue" 
    };
  }
};

// Send a password reset email to the user
export const sendPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { 
      success: true, 
      message: "Un email de réinitialisation de mot de passe a été envoyé" 
    };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { 
      success: false, 
      message: error.code === 'auth/user-not-found' 
        ? "Aucun utilisateur trouvé avec cette adresse email"
        : "Une erreur est survenue" 
    };
  }
};

// Register a new user
export const registerUser = async (
  email: string, 
  password: string, 
  userData: Omit<AuthUser, 'id'>
): Promise<{ success: boolean; message?: string; user?: AuthUser }> => {
  try {
    // First, check if any user with this email already exists in Firestore
    const emailQuery = query(
      collection(db, 'users'), 
      where('email', '==', email)
    );
    const emailQuerySnapshot = await getDocs(emailQuery);
    
    if (!emailQuerySnapshot.empty) {
      return { success: false, message: "Cette adresse email est déjà utilisée" };
    }
    
    // Then check if user with same email and name already exists
    const q = query(
      collection(db, 'users'), 
      where('email', '==', email), 
      where('name', '==', userData.name)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, message: "Un utilisateur avec ce même nom et email existe déjà" };
    }
    
    // Check if we need to create a new Firebase Auth user
    let firebaseUserId: string;
    
    // Try to create a new Firebase Auth user
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUserId = userCredential.user.uid;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: "Cette adresse email est déjà utilisée" };
      } else {
        throw error; // Rethrow other errors to be caught by the outer catch block
      }
    }
    
    // Create user document in Firestore with the Firebase uid
    const userDoc = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', firebaseUserId), userDoc);
    
    // Envoyer email de réinitialisation de mot de passe après création réussie
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // On continue même en cas d'erreur car l'utilisateur a bien été créé
    }
    
    return { 
      success: true, 
      user: { 
        id: firebaseUserId, 
        ...userData 
      }
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    let errorMessage = "Une erreur est survenue lors de la création du compte";
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Cette adresse email est déjà utilisée";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Le mot de passe est trop faible";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "L'adresse email n'est pas valide";
    }
    
    return { success: false, message: errorMessage };
  }
};

// Logout function
export const logout = async () => {
  try {
    await firebaseSignOut(auth);
    currentUser = null;
    
    // Clear user data from sessionStorage
    sessionStorage.removeItem('currentUser');
    
    // Clear inactivity timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Get the current user
export const getCurrentUser = (): AuthUser | null => {
  if (currentUser) {
    return currentUser;
  }
  
  // Check if user is stored in sessionStorage
  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      // Make sure critical fields are initialized
      if (currentUser) {
        if (!currentUser.hotels) currentUser.hotels = [];
        if (!currentUser.modules) currentUser.modules = [];
        if (!currentUser.groupIds) currentUser.groupIds = [];
      }
      return currentUser;
    } catch (e) {
      sessionStorage.removeItem('currentUser');
    }
  }
  
  return null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Check if user has access to a specific module
export const hasModuleAccess = (moduleCode: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin has access to all modules
  if (user.role === 'admin' || user.role === 'group_admin' || user.role === 'hotel_admin') return true;
  
  // Check if the module is in the user's allowed modules
  return user.modules.some(m => m === moduleCode);
};

// Check if user has access to a specific hotel
export const hasHotelAccess = (hotelId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin has access to all hotels
  if (user.role === 'admin') return true;
  
  // Group admin and hotel admins have access to their assigned hotels
  if (user.role === 'group_admin') {
    // For group admins, we need to check if the hotel belongs to one of their groups
    // This is a simplified check - in real implementation, you would query the database
    // to check if the hotel's groupId is in the user's groupIds
    return true; // This will be replaced with proper group-based check
  }
  
  // Hotel admins and standard users only have access to their assigned hotels
  return user.hotels.includes(hotelId);
};

// Check if user has access to a specific group
export const hasGroupAccess = (groupId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin has access to all groups
  if (user.role === 'admin') return true;
  
  // Group admin and hotel admin have access to their assigned groups
  if (user.groupIds && user.groupIds.includes(groupId)) {
    return true;
  }
  
  return false;
};

// Check if user can create users for a specific hotel
export const canCreateUsersForHotel = (hotelId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin and hotel_admin can create users, but only for hotels they have access to
  if ((user.role === 'admin' || user.role === 'hotel_admin' || user.role === 'group_admin') && 
      (user.role === 'admin' || user.hotels.includes(hotelId))) {
    return true;
  }
  
  return false;
};

// Check if user can create users for a specific group
export const canCreateUsersForGroup = (groupId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin and group_admin can create users for groups they have access to
  if (user.role === 'admin') {
    return true;
  }
  
  if (user.role === 'group_admin' && user.groupIds && user.groupIds.includes(groupId)) {
    return true;
  }
  
  return false;
};

// Check if user can modify hotel parameters
export const canModifyHotelParameters = (hotelId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin, group_admin, and hotel_admin can modify hotel parameters, but only for hotels they have access to
  if ((user.role === 'admin' || user.role === 'group_admin' || user.role === 'hotel_admin') && 
      (user.role === 'admin' || user.hotels.includes(hotelId))) {
    return true;
  }
  
  return false;
};

// Set the last activity time
export const setLastActivityTime = () => {
  sessionStorage.setItem('lastActivity', Date.now().toString());
};

// Start the inactivity timer
export const startInactivityTimer = () => {
  // Clear any existing timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Set new timer
  inactivityTimer = setTimeout(() => {
    console.log("User inactive for 5 minutes, logging out");
    logout();
    
    // Reload the page to redirect to login
    window.location.href = '/login';
  }, SESSION_TIMEOUT);
};

// Reset the inactivity timer on user activity
export const resetInactivityTimer = () => {
  setLastActivityTime();
  startInactivityTimer();
};

// Check if session has expired due to inactivity
export const checkSessionExpiry = (): boolean => {
  const lastActivity = sessionStorage.getItem('lastActivity');
  if (!lastActivity) return false;
  
  const lastActivityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();
  
  return (currentTime - lastActivityTime) > SESSION_TIMEOUT;
};

// Initialize auth from sessionStorage and set up auth state listener
export const initAuth = () => {
  // First check sessionStorage
  getCurrentUser();
  
  // Check if session has expired
  if (isAuthenticated() && checkSessionExpiry()) {
    console.log("Session expired, logging out");
    logout();
    return;
  }
  
  // Start inactivity timer if user is authenticated
  if (isAuthenticated()) {
    startInactivityTimer();
  }
  
  // Then set up auth state listener
  onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // User is signed in
      if (!currentUser) {
        // If we don't have the user data yet, fetch it
        const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // If multiple users with same email, we should have already set currentUser in login()
          // This is just a fallback for when the app is reloaded
          if (querySnapshot.docs.length === 1) {
            const docData = querySnapshot.docs[0].data();
            currentUser = {
              id: querySnapshot.docs[0].id,
              name: docData.name,
              email: docData.email,
              role: docData.role,
              hotels: docData.hotels || [],
              modules: docData.modules || [],
              groupIds: docData.groupIds || [],
              active: docData.active
            };
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
        }
      }
      
      // Reset inactivity timer
      resetInactivityTimer();
    } else {
      // User is signed out
      currentUser = null;
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('lastActivity');
      
      // Clear inactivity timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  });
};