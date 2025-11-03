import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, UserPlus, Search, Filter, Download, RefreshCw, Eye, Edit3, Trash2,
  Shield, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, XCircle, AlertTriangle,
  Crown, User, UserCheck, UserX, Settings, Bell, BellOff, Lock, Unlock,
  Plus, Minus, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, MoreVertical,
  FileText, Save, X, ArrowLeft, ArrowRight, Home, Menu, Grid, List, Table,
  Key, EyeOff, Copy, ExternalLink, Printer, Share2, Upload, Database,
  Activity, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  Target, Zap, Star, Heart, ThumbsUp, ThumbsDown, MessageSquare,
  Volume2, VolumeX, Mic, MicOff, Camera, Video, Image, File,
  Folder, Archive, Bookmark, Tag, Flag, Pin, Navigation, Compass,
  Timer, History, RotateCcw, RotateCw, Undo, Redo, Maximize2, Minimize2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ExportButton from '../components/ExportButton';

const AdvancedUserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // table, grid, list
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee',
    status: 'active',
    profileImage: null,
    bio: '',
    permissions: {
      products: { read: true, write: false, delete: false, export: false },
      warehouses: { read: true, write: false, delete: false, export: false },
      sales: { read: true, write: false, delete: false, export: false },
      purchases: { read: true, write: false, delete: false, export: false },
      reports: { read: true, write: false, delete: false, export: false },
      users: { read: false, write: false, delete: false, export: false },
      settings: { read: false, write: false, delete: false, export: false }
    },
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  });

  // User statistics
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admin: 0,
    manager: 0,
    employee: 0
  });

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      console.log('Users API response:', response.data);
      
      // Backend returns { users: [...] }, so we need to extract the users array
      const usersData = Array.isArray(response.data?.users) ? response.data.users : [];
      
      console.log('Extracted users data:', usersData);
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Calculate statistics - using isActive instead of status
      const stats = {
        total: usersData.length,
        active: usersData.filter(user => user.isActive === true).length,
        inactive: usersData.filter(user => user.isActive === false).length,
        admin: usersData.filter(user => user.role === 'admin').length,
        manager: usersData.filter(user => user.role === 'manager').length,
        employee: usersData.filter(user => user.role === 'employee').length
      };
      
      console.log('Calculated stats:', stats);
      setUserStats(stats);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set empty arrays if API fails
      setUsers([]);
      setFilteredUsers([]);
      setUserStats({
        total: 0,
        active: 0,
        inactive: 0,
        admin: 0,
        manager: 0,
        employee: 0
      });
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users based on search, filters, and sorting
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter (using isActive field)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.isActive === true;
        if (statusFilter === 'inactive') return user.isActive === false;
        return true;
      });
    }

    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role?.toLowerCase() || '';
          bValue = b.role?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'lastLogin':
          aValue = new Date(a.lastLogin || 0);
          bValue = new Date(b.lastLogin || 0);
          break;
        default:
          aValue = a.firstName?.toLowerCase() || '';
          bValue = b.firstName?.toLowerCase() || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Phone number is invalid';
    }

    // Password validation for new users
    if (!showEditModal) {
      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
      }
    }

    // Confirm password validation
    if (!showEditModal && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle bulk selection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  // Bulk actions
  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    switch (action) {
      case 'activate':
        toast.success(`${selectedUsers.length} users activated`);
        break;
      case 'deactivate':
        toast.success(`${selectedUsers.length} users deactivated`);
        break;
      case 'delete':
        toast.success(`${selectedUsers.length} users deleted`);
        break;
      case 'export':
        toast.success(`Exporting ${selectedUsers.length} users`);
        break;
    }
    
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  // Export users with multiple formats
  const handleExportUsers = async (format = 'excel') => {
    const { exportUsers } = await import('../utils/exportUtils');
    return exportUsers(filteredUsers, format);
  };

  // Create user
  const createUser = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.error('Validation errors:', errors);
      toast.error('Please fix validation errors');
      return;
    }

    try {
      await api.post('/users', formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  // Update user
  const updateUser = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.error('Validation errors:', errors);
      toast.error('Please fix validation errors');
      return;
    }

    try {
      const updateData = { ...formData };
      // Don't send password if it's empty (for updates)
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await api.put(`/users/${selectedUser._id}`, updateData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  // Delete user
  const deleteUser = async () => {
    try {
      await api.delete(`/users/${selectedUser._id}`);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      department: '',
      position: '',
      role: 'employee',
      status: 'active',
      profileImage: null,
      bio: '',
      permissions: {
        products: { read: true, write: false, delete: false, export: false },
        warehouses: { read: true, write: false, delete: false, export: false },
        sales: { read: true, write: false, delete: false, export: false },
        purchases: { read: true, write: false, delete: false, export: false },
        reports: { read: true, write: false, delete: false, export: false },
        users: { read: false, write: false, delete: false, export: false },
        settings: { read: false, write: false, delete: false, export: false }
      },
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
      }
    });
    setShowPasswordField(false);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    navigate(`/users/edit/${user._id || user.id}`);
  };

  // Handle delete user (opens confirmation modal)
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle permission change
  const handlePermissionChange = (module, permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Title Section - Full width on mobile */}
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {user?.role === 'admin' ? 'User Management' : 'View Users'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {user?.role === 'admin' 
                  ? 'Comprehensive user control and permissions' 
                  : 'View user information and status'
                }
              </p>
            </div>
            
            {/* Controls Section - Full width on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Table View"
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Activate Selected"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                      title="Deactivate Selected"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <ExportButton
                      data={filteredUsers.filter(user => selectedUsers.includes(user._id))}
                      filename="selected_users"
                      title="Selected Users Report"
                      exportFunction={handleExportUsers}
                      variant="icon-only"
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    />
                  </div>
                </div>
              )}

              {/* Export All */}
              <ExportButton
                data={filteredUsers}
                filename="users"
                title="User Management Report"
                exportFunction={handleExportUsers}
                variant="default"
                buttonText="Export"
              />

              {/* Refresh */}
              <button
                onClick={fetchUsers}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                title="Refresh users data"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>

              {/* Add User */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/users/new')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setRoleFilter('all')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setStatusFilter('active')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setStatusFilter('inactive')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">{userStats.inactive}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setRoleFilter('admin')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.admin}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setRoleFilter('manager')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{userStats.manager}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setRoleFilter('employee')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.employee}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, email, phone, department, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="name-asc">Sort by Name (A-Z)</option>
                <option value="name-desc">Sort by Name (Z-A)</option>
                <option value="email-asc">Sort by Email (A-Z)</option>
                <option value="email-desc">Sort by Email (Z-A)</option>
                <option value="role-asc">Sort by Role (A-Z)</option>
                <option value="role-desc">Sort by Role (Z-A)</option>
                <option value="status-asc">Sort by Status (A-Z)</option>
                <option value="status-desc">Sort by Status (Z-A)</option>
                <option value="lastLogin-desc">Sort by Last Login (Recent)</option>
                <option value="lastLogin-asc">Sort by Last Login (Oldest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Display - Conditional Rendering based on viewMode */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                      >
                        <span>User</span>
                        <div className="flex flex-col">
                          <ArrowUp className={`w-3 h-3 ${sortBy === 'name' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <ArrowDown className={`w-3 h-3 ${sortBy === 'name' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Role</span>
                      <div className="flex flex-col">
                        <ArrowUp className={`w-3 h-3 ${sortBy === 'role' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <ArrowDown className={`w-3 h-3 ${sortBy === 'role' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Status</span>
                      <div className="flex flex-col">
                        <ArrowUp className={`w-3 h-3 ${sortBy === 'status' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <ArrowDown className={`w-3 h-3 ${sortBy === 'status' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('lastLogin')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Last Login</span>
                      <div className="flex flex-col">
                        <ArrowUp className={`w-3 h-3 ${sortBy === 'lastLogin' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <ArrowDown className={`w-3 h-3 ${sortBy === 'lastLogin' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 ${selectedUsers.includes(user._id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="rounded border-gray-300 mr-3"
                        />
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            user.role === 'admin' ? 'bg-purple-500' :
                            user.role === 'manager' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}>
                            <span className="text-white font-medium">
                              {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.department && (
                            <div className="text-xs text-gray-400">{user.department}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.role === 'admin' && <Crown className="w-4 h-4 text-purple-600 mr-1" />}
                        {user.role === 'manager' && <Shield className="w-4 h-4 text-orange-600 mr-1" />}
                        {user.role === 'employee' && <User className="w-4 h-4 text-blue-600 mr-1" />}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.isActive === true ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive === true ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 ${
                  selectedUsers.includes(user._id) ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'
                }`}
                onClick={() => {
                  if (selectedUsers.includes(user._id)) {
                    setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                  } else {
                    setSelectedUsers([...selectedUsers, user._id]);
                  }
                }}
              >
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    user.role === 'admin' ? 'bg-purple-500' :
                    user.role === 'manager' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    <span className="text-white font-medium">
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}{user.lastName?.charAt(0)?.toUpperCase() || ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {user.firstName || 'Unknown'} {user.lastName || 'User'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
                  </div>
                </div>

                {/* Role and Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Role</span>
                    <div className="flex items-center">
                      {user.role === 'admin' && <Crown className="w-4 h-4 text-purple-600 mr-1" />}
                      {user.role === 'manager' && <Shield className="w-4 h-4 text-orange-600 mr-1" />}
                      {user.role === 'employee' && <User className="w-4 h-4 text-blue-600 mr-1" />}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <div className="flex items-center">
                      {user.isActive === true ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive === true ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Last Login</span>
                    <span className="text-xs text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewUser(user);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user);
                        }}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                    selectedUsers.includes(user._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => {
                    if (selectedUsers.includes(user._id)) {
                      setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                    } else {
                      setSelectedUsers([...selectedUsers, user._id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (selectedUsers.includes(user._id)) {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                          } else {
                            setSelectedUsers([...selectedUsers, user._id]);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-purple-500' :
                        user.role === 'manager' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        <span className="text-white font-medium text-sm">
                          {user.firstName?.charAt(0)?.toUpperCase() || 'U'}{user.lastName?.charAt(0)?.toUpperCase() || ''}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {user.firstName || 'Unknown'} {user.lastName || 'User'}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {user.role === 'admin' && <Crown className="w-4 h-4 text-purple-600" />}
                            {user.role === 'manager' && <Shield className="w-4 h-4 text-orange-600" />}
                            {user.role === 'employee' && <User className="w-4 h-4 text-blue-600" />}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {user.isActive === true ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive === true ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUser(user);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors duration-200"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user);
                              }}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors duration-200"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No users found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by creating your first user'}
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    {Object.entries(formData.permissions).map(([module, permissions]) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 capitalize mb-2">{module}</h4>
                        <div className="flex space-x-4">
                          {Object.entries(permissions).map(([permission, value]) => (
                            <label key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handlePermissionChange(module, permission, e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700 capitalize">{permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Create User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    {Object.entries(formData.permissions).map(([module, permissions]) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 capitalize mb-2">{module}</h4>
                        <div className="flex space-x-4">
                          {Object.entries(permissions).map(([permission, value]) => (
                            <label key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handlePermissionChange(module, permission, e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700 capitalize">{permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Update User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View User Modal */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {selectedUser.firstName?.charAt(0)?.toUpperCase() || 'U'}{selectedUser.lastName?.charAt(0)?.toUpperCase() || ''}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedUser.firstName || 'Unknown'} {selectedUser.lastName || 'User'}
                    </h2>
                    <p className="text-gray-500">{selectedUser.email || 'No email'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <p className="text-gray-900">{selectedUser.firstName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <p className="text-gray-900">{selectedUser.lastName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedUser.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <div className="flex items-center">
                        {selectedUser.role === 'admin' && <Crown className="w-4 h-4 text-purple-600 mr-2" />}
                        {selectedUser.role === 'manager' && <Shield className="w-4 h-4 text-orange-600 mr-2" />}
                        {selectedUser.role === 'employee' && <User className="w-4 h-4 text-blue-600 mr-2" />}
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          selectedUser.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedUser.role ? selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1) : 'Agent'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center">
                        {selectedUser.isActive === true ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        )}
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedUser.isActive === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedUser.isActive === true ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedUser._id}</p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                      <p className="text-gray-900">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                      <p className="text-gray-900">
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditUser(selectedUser);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedUserManagement;
