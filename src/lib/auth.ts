import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

// Types
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'standard';
  hotels: string[];
  modules: string[];
  active: boolean;
};

// Store the current user
let currentUser: AuthUser | null = null;

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
      await firebaseSignOut(auth);
      return { success: false, message: "Utilisateur non trouvé" };
    }
    
    // If there are multiple users with the same email, find the one with matching username
    if (querySnapshot.docs.length > 1) {
      const matchingUser = querySnapshot.docs.find(doc => doc.data().name === username);
      
      if (!matchingUser) {
        await firebaseSignOut(auth);
        return { success: false, message: "Le nom d'utilisateur ne correspond pas" };
      }
      
      const userData = matchingUser.data();
      if (!userData.active) {
        await firebaseSignOut(auth);
        return { success: false, message: "Compte désactivé" };
      }
      
      // Set the current user
      currentUser = {
        id: matchingUser.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hotels: userData.hotels,
        modules: userData.modules,
        active: userData.active
      };
    } else {
      // Just one user with this email - check if the username matches
      const userData = querySnapshot.docs[0].data();
      
      if (userData.name !== username) {
        await firebaseSignOut(auth);
        return { success: false, message: "Le nom d'utilisateur ne correspond pas" };
      }
      
      if (!userData.active) {
        await firebaseSignOut(auth);
        return { success: false, message: "Compte désactivé" };
      }
      
      // Set the current user
      currentUser = {
        id: querySnapshot.docs[0].id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hotels: userData.hotels,
        modules: userData.modules,
        active: userData.active
      };
    }
    
    // Store the user in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
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
    localStorage.removeItem('currentUser');
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Get the current user
export const getCurrentUser = (): AuthUser | null => {
  if (currentUser) {
    return currentUser;
  }
  
  // Check if user is stored in localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    return currentUser;
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
  if (user.role === 'admin') return true;
  
  // Check if the module is in the user's allowed modules
  return user.modules.some(m => m === moduleCode);
};

// Check if user has access to a specific hotel
export const hasHotelAccess = (hotelId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin has access to all hotels
  if (user.role === 'admin') return true;
  
  // Check if the hotel is in the user's allowed hotels
  return user.hotels.includes(hotelId);
};

// Initialize auth from localStorage and set up auth state listener
export const initAuth = () => {
  // First check localStorage
  getCurrentUser();
  
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
              hotels: docData.hotels,
              modules: docData.modules,
              active: docData.active
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
        }
      }
    } else {
      // User is signed out
      currentUser = null;
      localStorage.removeItem('currentUser');
    }
  });
};