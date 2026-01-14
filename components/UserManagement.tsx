import React, { useState } from 'react';
import { User, UserRole, Organization } from '../types';
import { Users, Building, Shield, Plus, Edit2, Search, MoreHorizontal, Check, X, Phone, Mail, Lock, Globe, LogIn, Trash2, Ban, Image as ImageIcon } from 'lucide-react';

// --- Form State Interfaces ---
interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  permissions: string[];
  bio: string;
  profilePicture: string;
}

const INITIAL_USER_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  permissions: [],
  bio: '',
  profilePicture: ''
};

interface OrgFormState {
  name: string;
  industry: string;
  website: string;
  adminUser: UserFormState;
}

const INITIAL_ORG_FORM: OrgFormState = {
  name: '',
  industry: '',
  website: '',
  adminUser: { ...INITIAL_USER_FORM }
};

const PERMISSION_MODULES = [
    { id: 'dashboard', label: 'Command Center', types: ['view'] },
    { id: 'proposals', label: 'Proposal Builder', types: ['view', 'edit'] },
    { id: 'operations', label: 'Operations Hub', types: ['view', 'edit'] },
    { id: 'finance', label: 'Finance', types: ['view', 'edit'] },
    { id: 'support', label: 'Support Center', types: ['view', 'edit'] },
    { id: 'users', label: 'Users & Access', types: ['view', 'edit'] },
    { id: 'marketing', label: 'Marketing AI', types: ['view', 'edit'] },
    { id: 'classes', label: 'Classes & Events', types: ['view', 'edit'] },
];

interface UserManagementProps {
    organizations: Organization[];
    setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
    teamMembers: User[];
    setTeamMembers: React.Dispatch<React.SetStateAction<User[]>>;
    individuals: User[];
    setIndividuals: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
    onLoginAs: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ 
    organizations, setOrganizations, teamMembers, setTeamMembers, individuals, setIndividuals, currentUser, onLoginAs 
}) => {
  // If Client, force client view. Otherwise default to team.
  const [viewMode, setViewMode] = useState<'team' | 'clients' | 'individuals'>(currentUser.role === UserRole.CLIENT ? 'clients' : 'team');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  
  // Menu State
  const [activeOrgMenuId, setActiveOrgMenuId] = useState<string | null>(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ADD_ORG' | 'ADD_TEAM' | 'EDIT_TEAM' | 'ADD_CLIENT_USER' | 'EDIT_CLIENT_USER' | 'ADD_INDIVIDUAL' | 'EDIT_INDIVIDUAL'>('ADD_ORG');
  
  // IDs for editing context
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [targetOrgId, setTargetOrgId] = useState<string | null>(null);

  // Form State
  const [userFormData, setUserFormData] = useState<UserFormState>(INITIAL_USER_FORM);
  const [orgFormData, setOrgFormData] = useState<OrgFormState>(INITIAL_ORG_FORM);

  const canEditUsers = currentUser.permissions.includes('edit_users');
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isClient = currentUser.role === UserRole.CLIENT;

  // Handle z-index and visibility for dropdowns in organizations view
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Handlers ---

  const toggleOrg = (id: string) => {
      setExpandedOrg(expandedOrg === id ? null : id);
  };

  const openAddOrgModal = () => {
      setModalType('ADD_ORG');
      setOrgFormData(INITIAL_ORG_FORM);
      setIsModalOpen(true);
  };

  const openAddTeamModal = () => {
      setModalType('ADD_TEAM');
      setUserFormData(INITIAL_USER_FORM);
      setIsModalOpen(true);
  };

  const openEditTeamModal = (user: User) => {
      setModalType('EDIT_TEAM');
      setEditingUserId(user.id);
      const [first, ...rest] = user.name.split(' ');
      setUserFormData({
          firstName: first,
          lastName: rest.join(' '),
          email: user.email,
          phone: user.phone || '',
          password: '', // Don't show existing password
          permissions: user.permissions,
          bio: user.bio || '',
          profilePicture: user.profilePicture || ''
      });
      setIsModalOpen(true);
  };

  const openAddClientUserModal = (orgId: string) => {
      setModalType('ADD_CLIENT_USER');
      setTargetOrgId(orgId);
      setUserFormData(INITIAL_USER_FORM);
      setIsModalOpen(true);
  };

  const openEditClientUserModal = (orgId: string, user: User) => {
      setModalType('EDIT_CLIENT_USER');
      setTargetOrgId(orgId);
      setEditingUserId(user.id);
      const [first, ...rest] = user.name.split(' ');
      setUserFormData({
          firstName: first,
          lastName: rest.join(' '),
          email: user.email,
          phone: user.phone || '',
          password: '',
          permissions: user.permissions,
          bio: user.bio || '',
          profilePicture: user.profilePicture || ''
      });
      setIsModalOpen(true);
  };

  const openAddIndividualModal = () => {
      setModalType('ADD_INDIVIDUAL');
      setUserFormData(INITIAL_USER_FORM);
      setIsModalOpen(true);
  };

  const openEditIndividualModal = (user: User) => {
      setModalType('EDIT_INDIVIDUAL');
      setEditingUserId(user.id);
      const [first, ...rest] = user.name.split(' ');
      setUserFormData({
          firstName: first,
          lastName: rest.join(' '),
          email: user.email,
          phone: user.phone || '',
          password: '',
          permissions: user.permissions,
          bio: user.bio || '',
          profilePicture: user.profilePicture || ''
      });
      setIsModalOpen(true);
  };

  const handleUserFormChange = (field: keyof UserFormState, value: any) => {
      setUserFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrgFormChange = (field: keyof OrgFormState, value: any) => {
      setOrgFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrgAdminChange = (field: keyof UserFormState, value: any) => {
      setOrgFormData(prev => ({ 
          ...prev, 
          adminUser: { ...prev.adminUser, [field]: value } 
      }));
  };

  const togglePermission = (perm: string, isOrgAdmin = false) => {
      const targetPermissions = isOrgAdmin ? orgFormData.adminUser.permissions : userFormData.permissions;
      let updated = [...targetPermissions];

      if (updated.includes(perm)) {
          updated = updated.filter(p => p !== perm);
          // If removing view access, automatically remove edit access for that module
          if (perm.startsWith('view_')) {
              const module = perm.split('_')[1];
              updated = updated.filter(p => p !== `edit_${module}`);
          }
      } else {
          updated.push(perm);
          // If adding edit access, automatically add view access for that module
          if (perm.startsWith('edit_')) {
              const module = perm.split('_')[1];
              if (!updated.includes(`view_${module}`)) {
                  updated.push(`view_${module}`);
              }
          }
      }

      if (isOrgAdmin) {
          handleOrgAdminChange('permissions', updated);
      } else {
          handleUserFormChange('permissions', updated);
      }
  };

  // --- Deletion & Suspension Logic ---

  const deleteUser = (userId: string, isTeam: boolean, orgId?: string, e?: React.MouseEvent) => {
    // 1. STOP EVENT PROPAGATION IMMEDIATELY
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    }
    
    // EXECUTE DELETE IMMEDIATELY (No Confirmation)
    if (isTeam) {
        setTeamMembers(prev => prev.filter(u => u.id !== userId));
    } else if (orgId) {
        setOrganizations(prev => prev.map(org => {
            if (org.id === orgId) {
                // Ensure a deep copy of the users array is returned
                return { 
                    ...org, 
                    users: org.users.filter(u => u.id !== userId) 
                };
            }
            return org;
        }));
    } else {
        setIndividuals(prev => prev.filter(u => u.id !== userId));
    }
    
    // 4. CLOSE MODAL IF OPEN
    setIsModalOpen(false);
  }

  const toggleUserStatus = (userId: string, isTeam: boolean, orgId?: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      if (isTeam) {
          setTeamMembers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'Suspended' ? 'Active' : 'Suspended' } : u));
      } else if (orgId) {
          setOrganizations(prev => prev.map(org => {
              if (org.id === orgId) {
                  return { ...org, users: org.users.map(u => u.id === userId ? { ...u, status: u.status === 'Suspended' ? 'Active' : 'Suspended' } : u) };
              }
              return org;
          }));
      } else {
          setIndividuals(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'Suspended' ? 'Active' : 'Suspended' } : u));
      }
  };

  const deleteOrg = (orgId: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
      }
      // EXECUTE DELETE IMMEDIATELY (No Confirmation)
      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      setActiveOrgMenuId(null);
  };

  const toggleOrgStatus = (orgId: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      setOrganizations(prev => prev.map(o => {
          if (o.id === orgId) {
              return { ...o, status: o.status === 'Suspended' ? 'Active' : 'Suspended' };
          }
          return o;
      }));
      setActiveOrgMenuId(null);
  };

  // --- Form Submission ---

  const handleSubmit = () => {
      // 1. ADD ORGANIZATION
      if (modalType === 'ADD_ORG') {
          const newOrgId = `org-${Date.now()}`;
          const newUserId = `u-${Date.now()}`;
          const newOrg: Organization = {
              id: newOrgId,
              name: orgFormData.name,
              industry: orgFormData.industry,
              status: 'Onboarding',
              users: [{
                  id: newUserId,
                  name: `${orgFormData.adminUser.firstName} ${orgFormData.adminUser.lastName}`,
                  email: orgFormData.adminUser.email,
                  phone: orgFormData.adminUser.phone,
                  role: UserRole.CLIENT,
                  status: 'Active',
                  permissions: orgFormData.adminUser.permissions,
                  bio: orgFormData.adminUser.bio,
                  profilePicture: orgFormData.adminUser.profilePicture
              }]
          };
          setOrganizations([...organizations, newOrg]);
      }

      // 2. ADD TEAM MEMBER
      if (modalType === 'ADD_TEAM') {
          const newUser: User = {
              id: `tm-${Date.now()}`,
              name: `${userFormData.firstName} ${userFormData.lastName}`,
              email: userFormData.email,
              phone: userFormData.phone,
              role: UserRole.EMPLOYEE, // Default to Employee for new adds
              status: 'Active',
              permissions: userFormData.permissions
          };
          setTeamMembers([...teamMembers, newUser]);
      }

      // 3. EDIT TEAM MEMBER
      if (modalType === 'EDIT_TEAM' && editingUserId) {
          setTeamMembers(teamMembers.map(u => u.id === editingUserId ? {
              ...u,
              name: `${userFormData.firstName} ${userFormData.lastName}`,
              email: userFormData.email,
              phone: userFormData.phone,
              permissions: u.role === UserRole.SUPER_ADMIN ? u.permissions : userFormData.permissions, // Prevent editing super admin permissions
              bio: userFormData.bio,
              profilePicture: userFormData.profilePicture
          } : u));
      }

      // 4. ADD CLIENT USER
      if (modalType === 'ADD_CLIENT_USER' && targetOrgId) {
          const newUser: User = {
              id: `cu-${Date.now()}`,
              name: `${userFormData.firstName} ${userFormData.lastName}`,
              email: userFormData.email,
              phone: userFormData.phone,
              role: UserRole.CLIENT,
              status: 'Active',
              permissions: userFormData.permissions
          };
          setOrganizations(organizations.map(org => org.id === targetOrgId ? {
              ...org,
              users: [...org.users, newUser]
          } : org));
      }

      // 5. EDIT CLIENT USER
      if (modalType === 'EDIT_CLIENT_USER' && targetOrgId && editingUserId) {
          setOrganizations(organizations.map(org => org.id === targetOrgId ? {
              ...org,
              users: org.users.map(u => u.id === editingUserId ? {
                  ...u,
                  name: `${userFormData.firstName} ${userFormData.lastName}`,
                  email: userFormData.email,
                  phone: userFormData.phone,
                  permissions: userFormData.permissions,
                  bio: userFormData.bio,
                  profilePicture: userFormData.profilePicture
              } : u)
          } : org));
      }

      // 6. ADD INDIVIDUAL
      if (modalType === 'ADD_INDIVIDUAL') {
          const newUser: User = {
              id: `ind-${Date.now()}`,
              name: `${userFormData.firstName} ${userFormData.lastName}`,
              email: userFormData.email,
              phone: userFormData.phone,
              role: UserRole.CLIENT,
              status: 'Active',
              permissions: userFormData.permissions,
              bio: userFormData.bio,
              profilePicture: userFormData.profilePicture
          };
          setIndividuals([...individuals, newUser]);
      }

      // 7. EDIT INDIVIDUAL
      if (modalType === 'EDIT_INDIVIDUAL' && editingUserId) {
          setIndividuals(individuals.map(u => u.id === editingUserId ? {
              ...u,
              name: `${userFormData.firstName} ${userFormData.lastName}`,
              email: userFormData.email,
              phone: userFormData.phone,
              permissions: userFormData.permissions,
              bio: userFormData.bio,
              profilePicture: userFormData.profilePicture
          } : u));
      }

      setIsModalOpen(false);
  };

  // --- FILTERING ---
  const displayedOrganizations = isClient 
    ? organizations.filter(o => o.users.some(u => u.id === currentUser.id))
    : organizations.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- Render Components ---

  const PermissionSelector = ({ selected, onChange, disabled = false, isOrgAdmin = false }: { selected: string[], onChange: (p: string, isOrg: boolean) => void, disabled?: boolean, isOrgAdmin?: boolean }) => (
      <div className="space-y-3 mt-2 bg-black/20 p-4 rounded-lg border border-white/5">
          {PERMISSION_MODULES.map(module => (
              <div key={module.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate-300 font-medium">{module.label}</span>
                  <div className="flex gap-2">
                      {module.types.map(type => {
                          const permString = `${type}_${module.id}`;
                          const isChecked = selected.includes(permString);
                          return (
                              <button
                                  key={type}
                                  onClick={() => !disabled && onChange(permString, isOrgAdmin)}
                                  disabled={disabled}
                                  className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                                      isChecked 
                                      ? 'bg-sadaya-gold text-black border border-sadaya-gold shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                                      : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10'
                                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                  {type}
                                  {isChecked && <Check className="w-3 h-3"/>}
                              </button>
                          );
                      })}
                  </div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-headline font-light text-white mb-2">User & Access Management</h2>
                <p className="text-slate-400 font-body font-thin text-lg">Manage team roles, permissions and client access.</p>
            </div>
            
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 w-full md:w-auto">
                {!isClient && (
                    <button 
                        onClick={() => setViewMode('team')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-headline transition-all ${viewMode === 'team' ? 'bg-sadaya-gold text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                        Team Members
                    </button>
                )}
                <button 
                    onClick={() => setViewMode('clients')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-headline transition-all ${viewMode === 'clients' ? 'bg-sadaya-gold text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                    {isClient ? 'My Organization' : 'Client Accounts'}
                </button>
            </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                <input 
                    type="text" 
                    placeholder="Search users or organizations..." 
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-sadaya-gold outline-none font-body font-light"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {canEditUsers && !isClient && (
                <button 
                    onClick={viewMode === 'team' ? openAddTeamModal : openAddOrgModal}
                    className="bg-white/10 border border-white/20 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-headline flex items-center justify-center w-full md:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2"/> Add {viewMode === 'team' ? 'Member' : 'Organization'}
                </button>
            )}
        </div>

        {/* TEAM VIEW */}
        {viewMode === 'team' && !isClient && (
            <div className="glass-panel rounded-xl overflow-hidden border border-white/10 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-white/5 text-slate-400 text-xs font-headline font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Permissions</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {teamMembers.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sadaya-gold to-blue-600 flex items-center justify-center text-xs font-bold text-black">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-headline text-sm">{user.name}</div>
                                            <div className="text-slate-500 font-body font-thin text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === UserRole.SUPER_ADMIN ? 'bg-sadaya-gold/20 text-sadaya-gold border border-sadaya-gold/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.status === 'Suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                        {user.status || 'Active'}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-400 font-mono">
                                    {user.phone || 'N/A'}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {user.role === UserRole.SUPER_ADMIN ? (
                                            <span className="text-xs text-sadaya-gold flex items-center"><Shield className="w-3 h-3 mr-1"/> Full Access</span>
                                        ) : (
                                            <>
                                                {user.permissions.length > 0 ? (
                                                    <span className="text-xs text-slate-400">{user.permissions.length} active permissions</span>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">No access</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {/* Login As Button (Only for Super Admin, and not for self) */}
                                        {isSuperAdmin && currentUser.id !== user.id && (
                                            <button 
                                                onClick={() => onLoginAs(user)}
                                                className="p-2 text-slate-400 hover:text-sadaya-gold hover:bg-white/5 rounded transition-colors"
                                                title={`Login as ${user.name}`}
                                            >
                                                <LogIn className="w-4 h-4"/>
                                            </button>
                                        )}
                                        
                                        {canEditUsers && (
                                            <>
                                                <button onClick={() => openEditTeamModal(user)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Edit User">
                                                    <Edit2 className="w-4 h-4"/>
                                                </button>
                                                {/* Delete/Suspend Actions for Team */}
                                                {user.role !== UserRole.SUPER_ADMIN && (
                                                    <>
                                                        <button 
                                                            onClick={(e) => toggleUserStatus(user.id, true, undefined, e)} 
                                                            className={`p-2 rounded transition-colors ${user.status === 'Suspended' ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'}`}
                                                            title={user.status === 'Suspended' ? "Activate User" : "Suspend User"}
                                                        >
                                                            <Ban className="w-4 h-4"/>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => deleteUser(user.id, true, undefined, e)} 
                                                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* CLIENTS VIEW */}
        {viewMode === 'clients' && (
            <div className="space-y-4">
                {displayedOrganizations.map(org => (
                    // Ensure overflow is visible so dropdowns aren't clipped
                    <div key={org.id} className="glass-panel rounded-xl border border-white/10 relative overflow-visible">
                        <div 
                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${expandedOrg === org.id ? 'rounded-t-xl bg-white/5' : 'rounded-xl'}`}
                            onClick={() => toggleOrg(org.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Building className="w-5 h-5 text-sadaya-gold"/>
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-white font-headline font-bold truncate">{org.name}</h3>
                                    <p className="text-slate-500 text-xs font-body font-light truncate">{org.industry} • {org.users.length} Users</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                    org.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                    org.status === 'Suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                    {org.status}
                                </span>
                                {/* Org Dropdown Action (Only if not client) */}
                                {!isClient && (
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setActiveOrgMenuId(activeOrgMenuId === org.id ? null : org.id); 
                                            }}
                                            className="text-slate-500 hover:text-white p-1"
                                        >
                                            <MoreHorizontal className="w-5 h-5"/>
                                        </button>
                                        {activeOrgMenuId === org.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden">
                                                <button 
                                                    onClick={(e) => toggleOrgStatus(org.id, e)}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white border-b border-white/5 transition-colors"
                                                >
                                                    {org.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                                                </button>
                                                <button 
                                                    onClick={(e) => deleteOrg(org.id, e)}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                >
                                                    Delete Account
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expanded Users List */}
                        {expandedOrg === org.id && (
                            <div className="bg-black/30 border-t border-white/5 p-4 rounded-b-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm text-slate-400 font-headline uppercase font-bold">Organization Users</h4>
                                    {canEditUsers && (
                                        <button 
                                            onClick={() => openAddClientUserModal(org.id)}
                                            className="text-xs text-sadaya-gold hover:underline font-bold flex items-center"
                                        >
                                            <Plus className="w-3 h-3 mr-1"/> Add User
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    {org.users.map(user => (
                                        <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-white text-sm font-medium">{user.name}</div>
                                                        {user.status === 'Suspended' && <span className="text-[10px] text-red-400 border border-red-500/30 px-1 rounded bg-red-500/10">Suspended</span>}
                                                    </div>
                                                    <div className="text-slate-500 text-xs flex items-center gap-2">
                                                        <span>{user.email}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-600 hidden md:block"></span>
                                                        <span className="hidden md:block">{user.phone || 'No Phone'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                                                 <div className="flex flex-col items-start md:items-end">
                                                     <span className="text-xs text-slate-400">Waiver Status</span>
                                                     <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${user.waiverSigned ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-sadaya-gold bg-sadaya-gold/10 border border-sadaya-gold/20'}`}>
                                                        {user.waiverSigned ? `Signed (${user.waiverSignedDate})` : 'Pending'}
                                                     </span>
                                                 </div>
                                                 <div className="flex flex-col items-start md:items-end">
                                                     <span className="text-xs text-slate-400">Permissions</span>
                                                     <span className="text-xs text-white">{user.permissions.length} modules</span>
                                                 </div>
                                                 <div className="flex gap-2">
                                                     {isSuperAdmin && (
                                                         <button 
                                                            onClick={() => onLoginAs(user)}
                                                            className="text-slate-500 hover:text-sadaya-gold p-1"
                                                            title="Login as User"
                                                         >
                                                             <LogIn className="w-4 h-4"/>
                                                         </button>
                                                     )}
                                                     {canEditUsers && (
                                                         <>
                                                            <button 
                                                                onClick={() => openEditClientUserModal(org.id, user)}
                                                                className="text-slate-500 hover:text-white p-1"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-4 h-4"/>
                                                            </button>
                                                            {/* Client User Actions */}
                                                            <button 
                                                                onClick={(e) => toggleUserStatus(user.id, false, org.id, e)} 
                                                                className={`p-1 rounded transition-colors ${user.status === 'Suspended' ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'}`}
                                                                title={user.status === 'Suspended' ? "Activate User" : "Suspend User"}
                                                            >
                                                                <Ban className="w-4 h-4"/>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => deleteUser(user.id, false, org.id, e)} 
                                                                className="text-red-400 hover:text-red-300 p-1"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                         </>
                                                     )}
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* INDIVIDUALS VIEW */}
        {viewMode === 'individuals' && !isClient && (
            <div className="glass-panel rounded-xl overflow-hidden border border-white/10 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-white/5 text-slate-400 text-xs font-headline font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Permissions</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {individuals.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        <div>
                                            <div className="text-white font-headline text-sm">{user.name}</div>
                                            <div className="text-slate-500 font-body font-thin text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.status === 'Suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                        {user.status || 'Active'}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-400 font-mono">
                                    {user.phone || 'N/A'}
                                </td>
                                <td className="p-4">
                                    <span className="text-xs text-slate-400">{user.permissions.length} active permissions</span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {isSuperAdmin && (
                                            <button onClick={() => onLoginAs(user)} className="p-2 text-slate-400 hover:text-sadaya-gold hover:bg-white/5 rounded transition-colors" title={`Login as ${user.name}`}><LogIn className="w-4 h-4"/></button>
                                        )}
                                        {canEditUsers && (
                                            <>
                                                <button onClick={() => openEditIndividualModal(user)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Edit"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={(e) => toggleUserStatus(user.id, false, undefined, e)} className={`p-2 rounded transition-colors ${user.status === 'Suspended' ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'}`} title={user.status === 'Suspended' ? "Activate" : "Suspend"}><Ban className="w-4 h-4"/></button>
                                                <button onClick={(e) => deleteUser(user.id, false, undefined, e)} className="p-2 text-red-400 hover:text-red-300 transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* ... MODAL code remains the same ... */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <h2 className="text-xl font-headline text-white font-bold">
                            {modalType === 'ADD_ORG' && 'Initialize New Organization'}
                            {modalType === 'ADD_TEAM' && 'Add Team Member'}
                            {modalType === 'EDIT_TEAM' && 'Edit Team Member'}
                            {modalType === 'ADD_CLIENT_USER' && 'Add Client User'}
                            {modalType === 'EDIT_CLIENT_USER' && 'Edit Client User'}
                            {modalType === 'ADD_INDIVIDUAL' && 'Add Individual Account'}
                            {modalType === 'EDIT_INDIVIDUAL' && 'Edit Individual Account'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                        {/* 1. ORGANIZATION DETAILS SECTION (Only for ADD_ORG) */}
                        {modalType === 'ADD_ORG' && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-sadaya-gold uppercase tracking-widest border-b border-white/5 pb-2">Organization Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400">Organization Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                            <input 
                                                value={orgFormData.name} onChange={(e) => handleOrgFormChange('name', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-sm text-white focus:border-sadaya-gold outline-none" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400">Industry</label>
                                        <input 
                                            value={orgFormData.industry} onChange={(e) => handleOrgFormChange('industry', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-sadaya-gold outline-none" 
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs text-slate-400">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                            <input 
                                                value={orgFormData.website} onChange={(e) => handleOrgFormChange('website', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-sm text-white focus:border-sadaya-gold outline-none" 
                                                placeholder="https://"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. USER DETAILS SECTION (Dynamic based on mode) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-sadaya-gold uppercase tracking-widest border-b border-white/5 pb-2">
                                {modalType === 'ADD_ORG' ? 'Primary Admin Contact' : 'User Information'}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">First Name</label>
                                    <input 
                                        value={modalType === 'ADD_ORG' ? orgFormData.adminUser.firstName : userFormData.firstName}
                                        onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('firstName', e.target.value) : handleUserFormChange('firstName', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-sadaya-gold outline-none" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Last Name</label>
                                    <input 
                                        value={modalType === 'ADD_ORG' ? orgFormData.adminUser.lastName : userFormData.lastName}
                                        onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('lastName', e.target.value) : handleUserFormChange('lastName', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-sadaya-gold outline-none" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <input 
                                            type="email"
                                            value={modalType === 'ADD_ORG' ? orgFormData.adminUser.email : userFormData.email}
                                            onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('email', e.target.value) : handleUserFormChange('email', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-sm text-white focus:border-sadaya-gold outline-none" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <input 
                                            value={modalType === 'ADD_ORG' ? orgFormData.adminUser.phone : userFormData.phone}
                                            onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('phone', e.target.value) : handleUserFormChange('phone', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-sm text-white focus:border-sadaya-gold outline-none" 
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-slate-400">Profile Picture URL</label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <input 
                                            value={modalType === 'ADD_ORG' ? orgFormData.adminUser.profilePicture : userFormData.profilePicture}
                                            onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('profilePicture', e.target.value) : handleUserFormChange('profilePicture', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-sm text-white focus:border-sadaya-gold outline-none" 
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-slate-400">Bio</label>
                                    <textarea 
                                        value={modalType === 'ADD_ORG' ? orgFormData.adminUser.bio : userFormData.bio}
                                        onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('bio', e.target.value) : handleUserFormChange('bio', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-sadaya-gold outline-none h-20" 
                                        placeholder="Brief biography..."
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-slate-400">Set Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <input 
                                            type="password"
                                            value={modalType === 'ADD_ORG' ? orgFormData.adminUser.password : userFormData.password}
                                            onChange={(e) => modalType === 'ADD_ORG' ? handleOrgAdminChange('password', e.target.value) : handleUserFormChange('password', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-sm text-white focus:border-sadaya-gold outline-none" 
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="text-xs text-slate-400 flex justify-between">
                                    <span>Access Permissions</span>
                                    {editingUserId && teamMembers.find(u => u.id === editingUserId)?.role === UserRole.SUPER_ADMIN && (
                                        <span className="text-sadaya-gold font-bold flex items-center"><Shield className="w-3 h-3 mr-1"/> Super Admin Access Locked</span>
                                    )}
                                </label>
                                <PermissionSelector 
                                    selected={modalType === 'ADD_ORG' ? orgFormData.adminUser.permissions : userFormData.permissions} 
                                    onChange={togglePermission}
                                    isOrgAdmin={modalType === 'ADD_ORG'}
                                    disabled={!!(editingUserId && teamMembers.find(u => u.id === editingUserId)?.role === UserRole.SUPER_ADMIN)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between gap-3">
                         {modalType === 'EDIT_TEAM' && editingUserId && teamMembers.find(u => u.id === editingUserId)?.role !== UserRole.SUPER_ADMIN && (
                            <button onClick={(e) => deleteUser(editingUserId!, true, undefined, e)} className="text-red-400 hover:text-red-300 flex items-center text-sm">
                                <Trash2 className="w-4 h-4 mr-2"/> Delete User
                            </button>
                         )}
                         <div className="flex gap-3 ml-auto">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};