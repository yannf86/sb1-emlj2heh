import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  AlertCircle
} from 'lucide-react';
import { modules } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getHotels } from '@/lib/db/hotels';
import { registerUser } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserFormProvider } from './components/UserFormContext';
import UserFormContent from './components/UserFormContent';

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'standard' as 'standard' | 'admin',
    active: true
  });

  // Load users and hotels on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load users from Firestore
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        
        // Load hotels from Firestore
        const hotelsData = await getHotels();
        setHotels(hotelsData);
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
  }, [toast]);

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
      setSelectedHotels([]);
      setSelectedModules([]);
    }
  }, [newUserDialogOpen]);

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

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  // Open edit dialog for a user
  const handleEdit = useCallback((user: any) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  }, []);

  // Open delete dialog for a user
  const handleDelete = useCallback((user: any) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  }, []);

  // Form change handlers
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHotelsChange = useCallback((hotels: string[]) => {
    setSelectedHotels(hotels);
  }, []);

  const handleModulesChange = useCallback((modules: string[]) => {
    setSelectedModules(modules);
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
    return { valid: true, message: "" };
  }, [formData.name, formData.email, formData.password, formData.confirmPassword, selectedHotels, selectedModules]);

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

  // Handle create user
  const handleCreateUser = useCallback(async () => {
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
        description: "L'utilisateur a été créé avec succès",
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
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
  }, [validateForm, checkDuplicateUser, formData, selectedHotels, selectedModules, toast]);

  // Handle update user
  const handleUpdateUser = useCallback(async () => {
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
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
  }, [validateForm, checkDuplicateUser, selectedUser, formData, selectedHotels, selectedModules, toast]);

  // Handle delete user
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser?.id) return;

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
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
  }, [selectedUser, toast]);

  // Retry loading data
  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      
      // Load hotels from Firestore
      const hotelsData = await getHotels();
      setHotels(hotelsData);
      
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
  }, [toast]);

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
          <Button onClick={() => setNewUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel Utilisateur
          </Button>
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
      
      <div className="flex">
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
                    ) : searchQuery ? (
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>Aucun utilisateur trouvé pour cette recherche</p>
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
                          <span>Administrateur</span>
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(user)}
                        disabled={saving}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      {user.role !== 'admin' && (
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
              Créez un nouvel utilisateur et définissez ses permissions.
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
                  {selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur Standard'}
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
    </div>
  );
};

export default UsersPage;