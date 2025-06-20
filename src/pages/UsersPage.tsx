import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  RefreshCw,
  CheckCheck,
  XCircle,
  ShieldCheck,
  Edit,
  Trash2,
  AlertCircle,
  Send,
  SlidersHorizontal,
  Building,
  UserCheck
} from 'lucide-react';
import { modules } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getHotels } from '@/lib/db/hotels';
import { registerUser, sendPasswordReset, getCurrentUser, hasHotelAccess, canCreateUsersForHotel } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserFormProvider } from './components/UserFormContext';
import UserFormContent from './components/UserFormContent';

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'standard' as 'standard' | 'hotel_admin' | 'admin',
    active: true
  });

  // Load users and hotels on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load users from Firestore based on current user's permissions
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If current user is not a system admin, filter users based on hotel access
        if (currentUser && currentUser.role !== 'admin') {
          usersData = usersData.filter(user => {
            // A hotel_admin can see users that share at least one hotel with them
            const sharedHotels = user.hotels.filter((hotelId: string) => 
              currentUser.hotels.includes(hotelId)
            );
            return sharedHotels.length > 0;
          });
        }
        
        setUsers(usersData);
        
        // Load hotels from Firestore - filter based on user's access
        const hotelsData = await getHotels();
        
        // Filter hotels based on user's permissions
        const accessibleHotels = hotelsData.filter(hotel => 
          hasHotelAccess(hotel.id)
        );
        
        setHotels(accessibleHotels);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Impossible de charger les données. Vérifiez votre connexion internet et réessayez.');
        // Use mock data as fallback
        setUsers([]);
        setHotels([]);
        
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter à la base de données. Vérifiez votre connexion internet.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast, currentUser]);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (newUserDialogOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'standard',
        active: true
      });
      // Pre-select user's accessible hotels by default
      setSelectedHotels(currentUser?.hotels || []);
      setSelectedModules([]);
    }
  }, [newUserDialogOpen, currentUser?.hotels]);

  // Initialize edit form when dialog opens
  useEffect(() => {
    if (editUserDialogOpen && selectedUser) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        password: '',
        confirmPassword: '',
        role: selectedUser.role || 'standard',
        active: selectedUser.active !== undefined ? selectedUser.active : true
      });
      setSelectedHotels(selectedUser.hotels || []);
      setSelectedModules(selectedUser.modules || []);
    }
  }, [editUserDialogOpen, selectedUser]);

  // Filter users based on search query, hotel, and role
  const filteredUsers = users.filter(user => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = user.name?.toLowerCase().includes(query);
      const matchesEmail = user.email?.toLowerCase().includes(query);
      const matchesRole = user.role?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesEmail && !matchesRole) return false;
    }
    
    // Filter by hotel
    if (filterHotel !== 'all') {
      if (!user.hotels || !user.hotels.includes(filterHotel)) return false;
    }
    
    // Filter by role
    if (filterRole !== 'all') {
      if (user.role !== filterRole) return false;
    }
    
    return true;
  });

  // Check if current user can create users
  const canCreateUsers = useCallback(() => {
    if (!currentUser) return false;
    
    // Full admins and hotel admins can create users
    if (['admin', 'hotel_admin'].includes(currentUser.role)) {
      return true;
    }
    
    return false;
  }, [currentUser]);

  // Check if current user can edit a specific user
  const canEditUser = useCallback((user: any) => {
    if (!currentUser || !user) return false;
    
    // Full admins can edit anyone
    if (currentUser.role === 'admin') return true;
    
    // Hotel admins can edit users for their hotels, except other admins
    if (currentUser.role === 'hotel_admin') {
      // Can't edit system admins
      if (user.role === 'admin') return false;
      
      // Can edit users with shared hotels
      const sharedHotels = user.hotels.filter((hotelId: string) => 
        currentUser.hotels.includes(hotelId)
      );
      return sharedHotels.length > 0;
    }
    
    return false;
  }, [currentUser]);

  // Check if current user can delete a specific user
  const canDeleteUser = useCallback((user: any) => {
    if (!currentUser || !user) return false;
    
    // Nobody can delete system admins
    if (user.role === 'admin') return false;
    
    // Full admins can delete anyone except system admins
    if (currentUser.role === 'admin') return true;
    
    // Hotel admins can delete standard users for their hotels
    if (currentUser.role === 'hotel_admin') {
      // Can only delete standard users (not other hotel admins)
      if (user.role !== 'standard') return false;
      
      // Can delete users with shared hotels
      const sharedHotels = user.hotels.filter((hotelId: string) => 
        currentUser.hotels.includes(hotelId)
      );
      return sharedHotels.length > 0;
    }
    
    return false;
  }, [currentUser]);

  // Open edit dialog for a user
  const handleEdit = useCallback((user: any) => {
    // Check if current user can edit this user
    if (!canEditUser(user)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour modifier cet utilisateur",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  }, [canEditUser, toast]);

  // Open delete dialog for a user
  const handleDelete = useCallback((user: any) => {
    // Check if current user can delete this user
    if (!canDeleteUser(user)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour supprimer cet utilisateur",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  }, [canDeleteUser, toast]);

  // Open reset password dialog for a user
  const handleResetPassword = useCallback((user: any) => {
    // Check if current user can edit this user (same permissions as edit)
    if (!canEditUser(user)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour réinitialiser le mot de passe de cet utilisateur",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  }, [canEditUser, toast]);

  // Form change handlers
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHotelsChange = useCallback((hotels: string[]) => {
    // Ensure hotels are actually accessible by the current user
    const accessibleHotels = hotels.filter(hotelId => hasHotelAccess(hotelId));
    setSelectedHotels(accessibleHotels);
  }, []);

  const handleModulesChange = useCallback((modules: string[]) => {
    setSelectedModules(modules);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterHotel('all');
    setFilterRole('all');
    setFiltersExpanded(false);
  }, []);

  // Validate form
  const validateForm = useCallback((isNew: boolean = true) => {
    if (!formData.name) {
      return { valid: false, message: "Le nom est requis" };
    }
    if (!formData.email) {
      return { valid: false, message: "L'email est requis" };
    }
    if (isNew && !formData.password) {
      return { valid: false, message: "Le mot de passe est requis" };
    }
    if (isNew && formData.password !== formData.confirmPassword) {
      return { valid: false, message: "Les mots de passe ne correspondent pas" };
    }
    if (selectedHotels.length === 0) {
      return { valid: false, message: "Au moins un hôtel doit être sélectionné" };
    }
    if (selectedModules.length === 0) {
      return { valid: false, message: "Au moins un module doit être sélectionné" };
    }
    
    // Verify that current user has permission for all selected hotels
    if (!currentUser) {
      return { valid: false, message: "Erreur d'authentification" };
    }
    
    // If not system admin, verify hotel permissions
    if (currentUser.role !== 'admin') {
      const unauthorizedHotels = selectedHotels.filter(hotelId => 
        !currentUser.hotels.includes(hotelId)
      );
      
      if (unauthorizedHotels.length > 0) {
        return { valid: false, message: "Vous avez sélectionné des hôtels auxquels vous n'avez pas accès" };
      }
    }
    
    // For hotel_admin role, only admins or hotel_admins can create them
    if (formData.role === 'hotel_admin' && currentUser.role !== 'admin' && currentUser.role !== 'hotel_admin') {
      return { valid: false, message: "Vous n'avez pas le droit de créer des administrateurs d'hôtel" };
    }
    
    // Only system admins can create system admins
    if (formData.role === 'admin' && currentUser.role !== 'admin') {
      return { valid: false, message: "Seul un administrateur système peut créer un autre administrateur système" };
    }
    
    return { valid: true, message: "" };
  }, [formData.name, formData.email, formData.password, formData.confirmPassword, formData.role, selectedHotels, selectedModules, currentUser]);

  // Check if user with same email and name already exists
  const checkDuplicateUser = useCallback(async (): Promise<boolean> => {
    try {
      // Check if a user with the same email and name already exists
      const q = query(
        collection(db, 'users'),
        where('email', '==', formData.email),
        where('name', '==', formData.name)
      );
      const querySnapshot = await getDocs(q);
      
      // For updates, exclude the current user from the check
      if (selectedUser && querySnapshot.docs.some(doc => doc.id !== selectedUser.id && 
          doc.data().email === formData.email && 
          doc.data().name === formData.name)) {
        return true;
      }
      
      // For new users, any match is a duplicate
      if (!selectedUser && !querySnapshot.empty) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for duplicate user:', error);
      return false; // Assume no duplicate in case of error
    }
  }, [formData.email, formData.name, selectedUser]);

  // Send password reset email
  const handleSendPasswordReset = useCallback(async () => {
    if (!selectedUser?.email) {
      toast({
        title: "Erreur",
        description: "Adresse email non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const result = await sendPasswordReset(selectedUser.email);
      
      if (result.success) {
        toast({
          title: "Email envoyé",
          description: "Un email de réinitialisation de mot de passe a été envoyé à l'utilisateur",
        });
        setResetPasswordDialogOpen(false);
      } else {
        throw new Error(result.message || "Erreur lors de l'envoi de l'email");
      }
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      setError(`Erreur lors de l'envoi de l'email: ${error.message}`);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedUser, toast]);

  // Handle create user
  const handleCreateUser = useCallback(async () => {
    // Vérifier si l'utilisateur peut créer des utilisateurs
    if (!canCreateUsers()) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour créer des utilisateurs",
        variant: "destructive",
      });
      return;
    }
    
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Erreur de validation",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate user (same email and name)
    const isDuplicate = await checkDuplicateUser();
    if (isDuplicate) {
      toast({
        title: "Erreur de validation",
        description: "Un utilisateur avec ce nom et cette adresse email existe déjà",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create user in Firebase Authentication and Firestore
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        hotels: selectedHotels,
        modules: selectedModules,
        active: formData.active
      };
      
      const result = await registerUser(formData.email, formData.password, userData);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès et un email lui a été envoyé pour configurer son mot de passe",
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'standard',
        active: true
      });
      setSelectedHotels([]);
      setSelectedModules([]);
      setNewUserDialogOpen(false);

      // Reload users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter users based on current user's permissions
      if (currentUser && currentUser.role !== 'admin') {
        usersData = usersData.filter(user => {
          const sharedHotels = user.hotels.filter((hotelId: string) => 
            currentUser.hotels.includes(hotelId)
          );
          return sharedHotels.length > 0;
        });
      }
      
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(`Erreur lors de la création de l'utilisateur: ${error.message}`);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [validateForm, checkDuplicateUser, formData, selectedHotels, selectedModules, toast, canCreateUsers, currentUser]);

  // Handle update user
  const handleUpdateUser = useCallback(async () => {
    // Check if current user can edit this user
    if (!canEditUser(selectedUser)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour modifier cet utilisateur",
        variant: "destructive",
      });
      return;
    }
    
    const validation = validateForm(false);
    if (!validation.valid) {
      toast({
        title: "Erreur de validation",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate user (same email and name, but different ID)
    const isDuplicate = await checkDuplicateUser();
    if (isDuplicate) {
      toast({
        title: "Erreur de validation",
        description: "Un autre utilisateur avec ce nom et cette adresse email existe déjà",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (!selectedUser?.id) {
        throw new Error("ID utilisateur manquant");
      }

      // Update user in Firestore
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        hotels: selectedHotels,
        modules: selectedModules,
        active: formData.active,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès",
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'standard',
        active: true
      });
      setSelectedHotels([]);
      setSelectedModules([]);
      setEditUserDialogOpen(false);
      setSelectedUser(null);

      // Reload users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter users based on current user's permissions
      if (currentUser && currentUser.role !== 'admin') {
        usersData = usersData.filter(user => {
          const sharedHotels = user.hotels.filter((hotelId: string) => 
            currentUser.hotels.includes(hotelId)
          );
          return sharedHotels.length > 0;
        });
      }
      
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [validateForm, checkDuplicateUser, selectedUser, formData, selectedHotels, selectedModules, toast, currentUser, canEditUser]);

  // Handle delete user
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser?.id) return;
    
    // Check if current user can delete this user
    if (!canDeleteUser(selectedUser)) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour supprimer cet utilisateur",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Delete user from Firestore
      await deleteDoc(doc(db, 'users', selectedUser.id));

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });

      // Close dialog
      setDeleteUserDialogOpen(false);
      setSelectedUser(null);

      // Reload users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter users based on current user's permissions
      if (currentUser && currentUser.role !== 'admin') {
        usersData = usersData.filter(user => {
          const sharedHotels = user.hotels.filter((hotelId: string) => 
            currentUser.hotels.includes(hotelId)
          );
          return sharedHotels.length > 0;
        });
      }
      
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedUser, toast, currentUser, canDeleteUser]);

  // Retry loading data
  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter users based on current user's permissions
      if (currentUser && currentUser.role !== 'admin') {
        usersData = usersData.filter(user => {
          const sharedHotels = user.hotels.filter((hotelId: string) => 
            currentUser.hotels.includes(hotelId)
          );
          return sharedHotels.length > 0;
        });
      }
      
      setUsers(usersData);
      
      // Load hotels from Firestore - filter based on user's access
      const hotelsData = await getHotels();
      const accessibleHotels = hotelsData.filter(hotel => 
        hasHotelAccess(hotel.id)
      );
      setHotels(accessibleHotels);
      
      toast({
        title: "Données chargées",
        description: "Les données ont été chargées avec succès",
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Impossible de charger les données. Vérifiez votre connexion internet et réessayez.');
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à la base de données. Vérifiez votre connexion internet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, currentUser]);

  // Get user role label
  const getUserRoleLabel = (role: string): string => {
    switch(role) {
      case 'admin': return 'Administrateur Système';
      case 'hotel_admin': return 'Administrateur Hôtel';
      case 'standard': return 'Utilisateur Standard';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des utilisateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérer les comptes utilisateurs et leurs permissions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {canCreateUsers() && (
            <Button onClick={() => setNewUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouvel Utilisateur
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de connexion</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className="ml-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un utilisateur..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filterHotel} onValueChange={setFilterHotel}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Building className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les hôtels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les hôtels</SelectItem>
              {hotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <UserCheck className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="admin">Administrateur Système</SelectItem>
              <SelectItem value="hotel_admin">Administrateur Hôtel</SelectItem>
              <SelectItem value="standard">Utilisateur Standard</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {filtersExpanded && (
          <div className="p-4 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtres supplémentaires si nécessaire */}
            </div>
          </div>
        )}
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Hôtels</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {error ? (
                      <div className="flex flex-col items-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Impossible de charger les utilisateurs</p>
                      </div>
                    ) : searchQuery || filterHotel !== 'all' || filterRole !== 'all' ? (
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun utilisateur trouvé avec ces critères</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun utilisateur trouvé</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <div className="flex items-center">
                          <ShieldCheck className="mr-1 h-4 w-4 text-blue-500" />
                          <span>Administrateur Système</span>
                        </div>
                      ) : user.role === 'hotel_admin' ? (
                        <div className="flex items-center">
                          <ShieldCheck className="mr-1 h-4 w-4 text-green-500" />
                          <span>Administrateur Hôtel</span>
                        </div>
                      ) : (
                        <span>Utilisateur Standard</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.hotels?.length === hotels.length ? (
                        <span>Tous les hôtels</span>
                      ) : (
                        <span>{user.hotels?.length || 0} hôtel(s)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.modules?.length === modules.length ? (
                        <span>Tous les modules</span>
                      ) : (
                        <span>{user.modules?.length || 0} module(s)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.active ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300">
                          <CheckCheck className="mr-1 h-3 w-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canEditUser(user) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          disabled={saving}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      )}
                      
                      {canEditUser(user) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(user)}
                          disabled={saving}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      )}
                      
                      {canDeleteUser(user) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(user)}
                          disabled={saving}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* New User Dialog */}
      <Dialog 
        open={newUserDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset form when dialog closes
            setFormData({
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'standard',
              active: true
            });
            setSelectedHotels([]);
            setSelectedModules([]);
          }
          setNewUserDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouvel utilisateur et définissez ses permissions. Un email sera automatiquement envoyé à l'utilisateur pour qu'il puisse définir son mot de passe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <UserFormProvider
              initialFormData={formData}
              initialHotels={selectedHotels}
              initialModules={selectedModules}
              isNew={true}
              saving={saving}
              onFormChange={handleFormChange}
              onHotelsChange={handleHotelsChange}
              onModulesChange={handleModulesChange}
            >
              <UserFormContent hotels={hotels} />
            </UserFormProvider>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewUserDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={saving}
            >
              {saving ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog 
        open={editUserDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset selected user when dialog closes
            setSelectedUser(null);
          }
          setEditUserDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations et les permissions de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <UserFormProvider
              initialFormData={formData}
              initialHotels={selectedHotels}
              initialModules={selectedModules}
              isNew={false}
              saving={saving}
              onFormChange={handleFormChange}
              onHotelsChange={handleHotelsChange}
              onModulesChange={handleModulesChange}
            >
              <UserFormContent hotels={hotels} />
            </UserFormProvider>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditUserDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog 
        open={deleteUserDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
          }
          setDeleteUserDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 mr-2 text-red-500" />
                <h3 className="text-lg font-medium">{selectedUser.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {selectedUser.email}
                </p>
                <p className="flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {getUserRoleLabel(selectedUser.role)}
                </p>
              </div>
              
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Cette action supprimera définitivement l'utilisateur et toutes ses données associées.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteUserDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={saving}
            >
              {saving ? 'Suppression...' : 'Supprimer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog 
        open={resetPasswordDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
          }
          setResetPasswordDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Envoyer un email de réinitialisation de mot de passe à cet utilisateur.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Mail className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="text-lg font-medium">{selectedUser.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="flex items-center font-medium">
                  Un email sera envoyé à:
                </p>
                <p className="flex items-center ml-2 text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
              
              <Alert className="mt-4">
                <Mail className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  L'utilisateur recevra un email avec un lien pour définir un nouveau mot de passe. Ce lien sera valable pendant 24 heures.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResetPasswordDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              variant="default"
              onClick={handleSendPasswordReset}
              disabled={saving}
            >
              {saving ? 'Envoi en cours...' : 'Envoyer l\'email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;