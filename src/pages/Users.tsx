import { useState, useEffect } from 'react';
import { useUserPermissions } from '../hooks/useUserPermissions';
import Layout from '../components/Layout/Layout';
import UserModal from '../components/Users/UserModal';
import PasswordResetModal from '../components/Users/PasswordResetModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import {
  Search,
  Plus,
  Mail,
  Edit,
  Trash2,
  RefreshCw,
  User as UserIcon,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { User, userRoles, appModules } from '../types/users';
import { Hotel } from '../types/parameters';
import { usersService } from '../services/firebase/usersService';
import { hotelsService } from '../services/firebase/hotelsService';

export default function Users() {
  const { isSystemAdmin } = useUserPermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // États pour le modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, hotelsData] = await Promise.all([
        usersService.getUsers(),
        hotelsService.getHotels()
      ]);
      setUsers(usersData);
      setHotels(hotelsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id'>, password?: string) => {
    try {
      if (password) {
        const userId = await usersService.addUser(userData, password);
        console.log('User created successfully with ID:', userId);
        loadData();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création de l\'utilisateur: ' + (error as Error).message);
    }
  };

  const handleUpdateUser = async (userData: Omit<User, 'id'>) => {
    try {
      if (selectedUser) {
        // Vérifier si l'utilisateur est un admin système et si l'utilisateur actuel n'est pas un admin système
        if (selectedUser.role === 'system_admin' && !isSystemAdmin) {
          alert('Seul un administrateur système peut modifier un autre administrateur système.');
          return;
        }
        
        await usersService.updateUser(selectedUser.id, userData);
        loadData();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erreur lors de la modification de l\'utilisateur');
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await usersService.deleteUser(userToDelete.id);
      await loadData();
      setUserToDelete(null);
      setIsDeleteModalOpen(false);
      alert('Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur: ' + (error as Error).message);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await usersService.sendPasswordReset(email);
      alert('Email de réinitialisation envoyé avec succès');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    }
  };

  const openEditModal = (user: User) => {
    // Vérifier si l'utilisateur est un admin système et si l'utilisateur actuel n'est pas un admin système
    if (user.role === 'system_admin' && !isSystemAdmin) {
      alert('Seul un administrateur système peut modifier un autre administrateur système.');
      return;
    }
    setSelectedUser(user);
    setIsEditMode(true);
    setIsUserModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setIsUserModalOpen(true);
  };

  const openPasswordResetModal = (user: User) => {
    setSelectedUser(user);
    setIsPasswordResetModalOpen(true);
  };

  const getRoleLabel = (role: string) => {
    const roleObj = userRoles.find(r => r.key === role);
    return roleObj?.label || role;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'system_admin':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'hotel_admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <UserIcon className="w-4 h-4 text-warm-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'text-purple-700';
      case 'hotel_admin':
        return 'text-blue-700';
      default:
        return 'text-warm-700';
    }
  };

  // Fonction supprimée car non utilisée

  const getModuleCount = (moduleIds: string[]) => {
    if (moduleIds.length === 0) return 'Aucun module';
    if (moduleIds.length === appModules.length) return 'Tous les modules';
    return `${moduleIds.length} module${moduleIds.length > 1 ? 's' : ''}`;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && user.active) ||
                         (selectedStatus === 'inactive' && !user.active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Layout title="Utilisateurs" subtitle="Gestion des utilisateurs">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-warm-900">Gestion des Utilisateurs</h1>
              <p className="text-warm-600">Gérer les comptes utilisateurs et leurs permissions</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Utilisateur
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-full"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              <option value="all">Tous les rôles</option>
              {userRoles.map(role => (
                <option key={role.key} value={role.key}>{role.label}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-warm-600" />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-warm-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Hôtels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-warm-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-warm-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-warm-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-creho-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-creho-600 font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-warm-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-warm-700">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className={`ml-2 text-sm font-medium ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-warm-600">
                          {user.hotels.length} hôtel{user.hotels.length > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-warm-600">
                          {getModuleCount(user.modules)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openPasswordResetModal(user)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Envoyer email de réinitialisation"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-creho-600 hover:text-creho-900 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isSystemAdmin && (
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={isEditMode ? handleUpdateUser : handleCreateUser}
        user={selectedUser}
        isEdit={isEditMode}
      />

      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => setIsPasswordResetModalOpen(false)}
        onSubmit={handlePasswordReset}
        userName={selectedUser?.name || ''}
        userEmail={selectedUser?.email || ''}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
        itemName={userToDelete?.name}
      />
    </Layout>
  );
}