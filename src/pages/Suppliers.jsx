import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Plus, Search, Filter, RefreshCw, Eye, Edit3,
  Star, TrendingUp, DollarSign, Calendar, Clock, CheckCircle, XCircle,
  AlertTriangle, Mail, Phone, MapPin, Globe, Crown, Shield, User,
  ArrowUp, ArrowDown, MoreVertical, Download, FileSpreadsheet, FileText,
  BarChart3, PieChart, LineChart, Target, Zap, Activity, X,
  ShoppingCart, Package, Settings
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ExportButton from '../components/ExportButton';
import { 
  loadFormatSettings, 
  applyFormatSettings, 
  getVisibleColumns, 
  getColumnConfig,
  generateExportData 
} from '../utils/supplierFormatUtils';

const Suppliers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [supplierStats, setSupplierStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    preferredSuppliers: 0,
    totalSpent: 0,
    averageRating: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [spendingAnalytics, setSpendingAnalytics] = useState(null);
  const [formatSettings, setFormatSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contactPerson: {
      name: '',
      position: '',
      email: '',
      phone: ''
    },
    paymentTerms: 'Net 30',
    creditLimit: 0,
    categories: [],
    notes: ''
  });

  // Fetch suppliers data
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers');
      console.log('Suppliers API response:', response.data);
      
      const suppliersData = Array.isArray(response.data?.suppliers) ? response.data.suppliers : [];
      console.log('Suppliers data:', suppliersData);
      // Sort by creation date - newest first
      const sortedSuppliers = suppliersData.sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      setSuppliers(sortedSuppliers);
      setFilteredSuppliers(sortedSuppliers);
      
      // Fetch supplier stats
      const statsResponse = await api.get('/suppliers/stats');
      setSupplierStats(statsResponse.data);
      
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
      setFilteredSuppliers([]);
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch spending analytics
  const fetchSpendingAnalytics = async (period = 'month') => {
    try {
      const response = await api.get(`/suppliers/analytics/spending?period=${period}`);
      setSpendingAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching spending analytics:', error);
      toast.error('Failed to fetch spending analytics');
    }
  };

  // Filter and sort suppliers
  useEffect(() => {
    let filtered = suppliers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter);
    }

    // Sort suppliers
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.companyName || a.name || '').toLowerCase();
          bValue = (b.companyName || b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'totalSpent':
          aValue = a.totalSpent || 0;
          bValue = b.totalSpent || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchSuppliers();
    // Load format settings
    const settings = loadFormatSettings();
    setFormatSettings(settings);
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Create supplier
  const createSupplier = async () => {
    try {
      await api.post('/suppliers', formData);
      toast.success('Supplier created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error(error.response?.data?.error || 'Failed to create supplier');
    }
  };

  // Update supplier
  const updateSupplier = async () => {
    try {
      await api.put(`/suppliers/${selectedSupplier._id}`, formData);
      toast.success('Supplier updated successfully');
      setShowEditModal(false);
      setSelectedSupplier(null);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error(error.response?.data?.error || 'Failed to update supplier');
    }
  };

  // Delete supplier
  const deleteSupplier = async () => {
    try {
      await api.delete(`/suppliers/${selectedSupplier._id}`);
      toast.success('Supplier deleted successfully');
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error(error.response?.data?.error || 'Failed to delete supplier');
    }
  };

  // View supplier details
  const handleViewSupplier = (supplier) => {
    console.log('Viewing supplier:', supplier);
    const supplierId = supplier._id || supplier.id;
    if (!supplierId) {
      toast.error('Supplier ID not found');
      return;
    }
    navigate(`/suppliers/${supplierId}`);
  };

  // Edit supplier
  const handleEditSupplier = (supplier) => {
    console.log('Editing supplier:', supplier);
    const supplierId = supplier._id || supplier.id;
    if (!supplierId) {
      toast.error('Supplier ID not found');
      return;
    }
    navigate(`/suppliers/edit/${supplierId}`);
  };


  // View analytics
  const handleViewAnalytics = (supplier) => {
    setSelectedSupplier(supplier);
    setShowAnalyticsModal(true);
    fetchSpendingAnalytics();
  };


  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
      },
      contactPerson: {
        name: '',
        position: '',
        email: '',
        phone: ''
      },
      paymentTerms: 'Net 30',
      creditLimit: 0,
      categories: [],
      notes: ''
    });
  };

  // Export suppliers
  const handleExportSuppliers = async (format = 'excel') => {
    const { exportSuppliers } = await import('../utils/exportUtils');
    const exportData = formatSettings ? generateExportData(filteredSuppliers, formatSettings) : filteredSuppliers;
    return exportSuppliers(exportData, format);
  };

  // Handle format settings change
  const handleFormatChange = (newSettings) => {
    setFormatSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        {/* Title Section - Full width on mobile */}
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Suppliers' : 'Supplier Directory'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {user?.role === 'admin' 
              ? 'Manage your suppliers and track spending' 
              : 'View supplier information and contact details'
            }
          </p>
        </div>
        
        {/* Controls Section - Full width on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <ExportButton
            data={filteredSuppliers}
            filename="suppliers"
            title="Supplier Report"
            exportFunction={handleExportSuppliers}
            variant="default"
            buttonText="Export"
          />
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/suppliers/add')}
              className="btn-primary flex items-center flex-1 sm:flex-initial justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Total Suppliers</p>
              <p className="text-xl font-bold text-gray-900">{supplierStats.totalSuppliers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg mr-3">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{supplierStats.activeSuppliers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg mr-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Preferred</p>
              <p className="text-xl font-bold text-gray-900">{supplierStats.preferredSuppliers}</p>
            </div>
          </div>
        </motion.div>

        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">PKR {supplierStats.totalSpent?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-4"
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Avg Rating</p>
              <p className="text-xl font-bold text-gray-900">{supplierStats.averageRating?.toFixed(1) || '0.0'}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Blacklisted">Blacklisted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="totalSpent">Total Spent</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleSort(sortBy)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="mr-2">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('totalSpent')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                  >
                    <span>Total Spent</span>
                    <div className="flex flex-col">
                      <ArrowUp className={`w-3 h-3 ${sortBy === 'totalSpent' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <ArrowDown className={`w-3 h-3 ${sortBy === 'totalSpent' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('rating')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                  >
                    <span>Rating</span>
                    <div className="flex flex-col">
                      <ArrowUp className={`w-3 h-3 ${sortBy === 'rating' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <ArrowDown className={`w-3 h-3 ${sortBy === 'rating' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <motion.tr
                  key={supplier._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {(supplier.companyName || supplier.name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.companyName || supplier.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.name && supplier.companyName ? supplier.name : supplier.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.email}</div>
                    <div className="text-sm text-gray-500">{supplier.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      PKR {supplier.totalSpent?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {supplier.totalPurchases || 0} orders
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (supplier.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        {supplier.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {supplier.status === 'Active' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mr-2" />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.status === 'Active' ? 'bg-green-100 text-green-800' :
                        supplier.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                        supplier.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {supplier.status || 'Active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewSupplier(supplier)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Supplier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleViewAnalytics(supplier)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No suppliers found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first supplier'}
          </p>
        </div>
      )}

      {/* Create Supplier Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Add New Supplier</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); createSupplier(); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                        <option value="COD">COD</option>
                        <option value="Prepaid">Prepaid</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                      <input
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Create Supplier
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Analytics Modal */}
      <AnimatePresence>
        {showAnalyticsModal && selectedSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowAnalyticsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        Analytics Dashboard
                  </h2>
                      <p className="text-blue-100 text-sm">
                        {selectedSupplier.companyName || selectedSupplier.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnalyticsModal(false)}
                    className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                {spendingAnalytics ? (
                  <div className="space-y-8">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Total Spent</p>
                            <p className="text-3xl font-bold mt-1">
                          PKR {spendingAnalytics.summary?.totalSpent?.toLocaleString() || '0'}
                        </p>
                            <p className="text-blue-100 text-xs mt-2">All time spending</p>
                      </div>
                          <DollarSign className="h-8 w-8 text-blue-200" />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Total Orders</p>
                            <p className="text-3xl font-bold mt-1">
                          {spendingAnalytics.summary?.totalOrders || '0'}
                        </p>
                            <p className="text-green-100 text-xs mt-2">Completed orders</p>
                      </div>
                          <ShoppingCart className="h-8 w-8 text-green-200" />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
                            <p className="text-3xl font-bold mt-1">
                              ${spendingAnalytics.summary?.averageOrderValue 
                                ? spendingAnalytics.summary.averageOrderValue.toFixed(0)
                                : spendingAnalytics.summary?.totalSpent && spendingAnalytics.summary?.totalOrders
                                  ? (spendingAnalytics.summary.totalSpent / spendingAnalytics.summary.totalOrders).toFixed(0)
                                  : '0'}
                            </p>
                            <p className="text-purple-100 text-xs mt-2">Per order average</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-200" />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm font-medium">Period</p>
                            <p className="text-3xl font-bold mt-1 capitalize">
                          {spendingAnalytics.period || 'Month'}
                        </p>
                            <p className="text-orange-100 text-xs mt-2">Analysis period</p>
                      </div>
                          <Calendar className="h-8 w-8 text-orange-200" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Spending Trend Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <Activity className="h-6 w-6 text-blue-600 mr-3" />
                          Spending Trend
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Monthly Spending</span>
                        </div>
                      </div>
                      
                      {/* Enhanced Chart Area */}
                      <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200">
                        <div className="h-full flex items-end justify-between space-x-2">
                          {/* Mock Bar Chart */}
                          {[65, 80, 45, 90, 70, 85, 60, 75, 95, 50, 88, 92].map((height, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                              <div 
                                className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-full transition-all duration-1000 hover:from-blue-600 hover:to-blue-500"
                                style={{ height: `${height}%`, minHeight: '20px' }}
                              ></div>
                              <div className="text-xs text-gray-500 mt-2 font-medium">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Chart Legend */}
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-600">Monthly Spending</span>
                            </div>
                          </div>
                          <div className="text-gray-500">
                            Last 12 months
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Top Products Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <Package className="h-6 w-6 text-green-600 mr-3" />
                          Top Products by Spending
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <TrendingUp className="h-4 w-4" />
                          <span>Top 5 products</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {(spendingAnalytics.spendingByProduct?.length > 0 
                          ? spendingAnalytics.spendingByProduct.slice(0, 5)
                          : [
                              { productName: 'Electronics Components', totalSpent: 125000 },
                              { productName: 'Office Supplies', totalSpent: 85000 },
                              { productName: 'Raw Materials', totalSpent: 95000 },
                              { productName: 'Packaging Materials', totalSpent: 45000 },
                              { productName: 'Maintenance Tools', totalSpent: 35000 }
                            ]
                        ).map((item, index) => {
                          const percentage = spendingAnalytics.summary?.totalSpent 
                            ? (item.totalSpent / spendingAnalytics.summary.totalSpent) * 100 
                            : 0;
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + index * 0.1 }}
                              className="group hover:bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                      {item.productName || `Product ${index + 1}`}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {percentage.toFixed(1)}% of total spending
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-green-600">
                              PKR {item.totalSpent?.toLocaleString() || '0'}
                                  </p>
                                  <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                                    <div 
                                      className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(percentage, 100)}%` }}
                                    ></div>
                          </div>
                      </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Performance Insights */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-2 flex items-center">
                            <Target className="h-6 w-6 mr-3" />
                            Performance Insights
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="bg-white bg-opacity-10 rounded-xl p-4">
                              <p className="text-indigo-100 text-sm">Growth Rate</p>
                              <p className="text-2xl font-bold">+12.5%</p>
                              <p className="text-indigo-100 text-xs">vs last period</p>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-xl p-4">
                              <p className="text-indigo-100 text-sm">Efficiency Score</p>
                              <p className="text-2xl font-bold">94%</p>
                              <p className="text-indigo-100 text-xs">Overall performance</p>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-xl p-4">
                              <p className="text-indigo-100 text-sm">Risk Level</p>
                              <p className="text-2xl font-bold text-green-200">Low</p>
                              <p className="text-indigo-100 text-xs">Supplier reliability</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading analytics data...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => setShowAnalyticsModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Close Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Supplier Modal */}
      <AnimatePresence>
        {showViewModal && selectedSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Supplier Details</h2>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedSupplier.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <p className="text-gray-900">{selectedSupplier.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedSupplier.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{selectedSupplier.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <p className="text-gray-900">{selectedSupplier.website || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                      <p className="text-gray-900">{selectedSupplier.paymentTerms}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                      <p className="text-gray-900">PKR {selectedSupplier.creditLimit || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedSupplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSupplier.status}
                      </span>
                    </div>
                  </div>
                  
                  {selectedSupplier.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-900">
                        {[selectedSupplier.address.street, selectedSupplier.address.city, selectedSupplier.address.state, selectedSupplier.address.country]
                          .filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {selectedSupplier.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-gray-900">{selectedSupplier.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-6 border-t mt-6">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Supplier Modal */}
      <AnimatePresence>
        {showEditModal && selectedSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Supplier</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); updateSupplier(); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                        <option value="COD">Cash on Delivery</option>
                        <option value="Prepaid">Prepaid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (PKR)</label>
                      <input
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Supplier
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default Suppliers;
