import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Warehouse, 
  Plus, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  X
} from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import WarehouseFormPage from './forms/WarehouseFormPage';
import api from '../services/api';
import toast from 'react-hot-toast';
import ExportButton from '../components/ExportButton';
import { useAuth } from '../contexts/AuthContext';

const Warehouses = () => {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [newStock, setNewStock] = useState({ productId: '', quantity: '', tags: [] });
  const [addingStock, setAddingStock] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [deleteTransferWarehouse, setDeleteTransferWarehouse] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [warehousesKey, setWarehousesKey] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warehouseToDeleteConfirm, setWarehouseToDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();

  useEffect(() => {
    if (location.pathname === '/warehouses') {
      fetchWarehouses();
    }
    fetchProducts();
  }, [location.pathname]);

  // Ensure products is always an array to prevent map errors
  useEffect(() => {
    if (!Array.isArray(products)) {
      console.warn('Products is not an array, resetting to empty array:', products);
      setProducts([]);
    }
  }, [products]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      console.log('Warehouses API response:', response.data);
      
      // Handle different response structures
      let warehousesData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          warehousesData = response.data;
        } else if (response.data.warehouses && Array.isArray(response.data.warehouses)) {
          warehousesData = response.data.warehouses;
        }
      }
      
      // Sort by creation date - newest first
      const sortedWarehouses = warehousesData.sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      setWarehouses(sortedWarehouses);
      console.log('Warehouses fetched:', warehousesData.length);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get('/products');
      console.log('Products API response:', response.data);
      console.log('Products fetched for stock:', response.data?.length || 0);
      
      // Handle different response structures
      let productsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          productsData = response.data.products;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
      }
      
      console.log('Processed products data:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]); // Ensure products is always an array
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchWarehouseDetails = async (warehouseId, openAddStock = false) => {
    try {
      const response = await api.get(`/warehouses/${warehouseId}`);
      console.log('Warehouse details fetched:', response.data);
      setSelectedWarehouse(response.data);
      
      // Ensure products are loaded
      if (!products || products.length === 0) {
        console.log('Products not loaded, fetching...');
        await fetchProducts();
      }
      
      // Automatically open Add Stock modal if requested
      if (openAddStock) {
        setTimeout(() => {
          console.log('Opening Add Stock modal automatically');
          setShowAddStock(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching warehouse details:', error);
      toast.error('Failed to load warehouse details');
    }
  };

  const handleAddStock = async () => {
    // Validation
    if (!selectedWarehouse || !newStock.productId || !newStock.quantity) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    // Get product name for confirmation
    const selectedProduct = products.find(p => p._id === newStock.productId);
    const productName = selectedProduct?.name || 'Unknown Product';
    const quantity = parseInt(newStock.quantity);

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to add stock?\n\n` +
      `Warehouse: ${selectedWarehouse.name}\n` +
      `Product: ${productName}\n` +
      `Quantity: ${quantity} units\n` +
      `Tags: ${newStock.tags.length > 0 ? newStock.tags.join(', ') : 'None'}`
    );

    if (!confirmed) {
      console.log('❌ Add stock cancelled by user');
      return;
    }

    setAddingStock(true);
    try {
      const response = await api.post(`/warehouses/${selectedWarehouse._id}/add-stock`, {
        productId: newStock.productId,
        quantity: quantity,
        tags: newStock.tags
      });
      
      console.log('✅ Add stock response:', response.data);
      toast.success(`Stock added successfully: ${response.data.addedStock.product} (${response.data.addedStock.quantity} units)`);
      
      setShowAddStock(false);
      setNewStock({ productId: '', quantity: '', tags: [] });
      
      // Refresh warehouse details and list
      await fetchWarehouseDetails(selectedWarehouse._id);
      await fetchWarehouses();
    } catch (error) {
      console.error('❌ Error adding stock:', error);
      toast.error(error.response?.data?.error || 'Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  const confirmDeleteWarehouse = (warehouse) => {
    console.log('🗑️ DELETE BUTTON CLICKED:', warehouse.name);
    setWarehouseToDeleteConfirm(warehouse);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!warehouseToDeleteConfirm || deleting) return;

    setDeleting(true);
    setShowConfirmModal(false);
    
    try {
      console.log('🗑️ DELETING WAREHOUSE:', warehouseToDeleteConfirm.name, warehouseToDeleteConfirm._id);
      
      // Simple direct API call
      const response = await api.delete(`/warehouses/${warehouseToDeleteConfirm._id}`);
      
      console.log('✅ DELETE SUCCESS:', response.data);
      toast.success('Warehouse deleted successfully!');

      // Refresh the warehouses list
      console.log('🔄 Refreshing warehouses list...');
      await fetchWarehouses();
      
      // If we're viewing the deleted warehouse, go back to list
      if (selectedWarehouse && selectedWarehouse._id === warehouseToDeleteConfirm._id) {
        setSelectedWarehouse(null);
      }
      
      console.log('✅ Warehouse deletion completed successfully');
    } catch (error) {
      console.error('❌ DELETE ERROR:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      toast.error(error.response?.data?.error || 'Failed to delete warehouse');
    } finally {
      setDeleting(false);
      setWarehouseToDeleteConfirm(null);
    }
  };

  const openDeleteModal = (warehouse) => {
    // Check if user is authenticated and has permission
    if (!user) {
      toast.error('Please log in to delete warehouses');
      navigate('/login');
      return;
    }
    
    if (!hasAnyRole(['admin', 'manager'])) {
      toast.error('Only admins and managers can delete warehouses');
      return;
    }
    
    console.log('Opening delete modal for warehouse:', warehouse);
    console.log('Current modal state - showDeleteModal:', showDeleteModal, 'warehouseToDelete:', warehouseToDelete);
    
    // Set the warehouse first
    setWarehouseToDelete(warehouse);
    setDeleteTransferWarehouse('');
    
    // Use setTimeout to ensure state update happens
    setTimeout(() => {
      setShowDeleteModal(true);
      console.log('Modal should now be visible');
      
      // Fallback: If modal doesn't appear after 500ms, show a simple confirm
      setTimeout(() => {
        if (!showDeleteModal) {
          console.log('Modal failed to appear, showing fallback confirm');
          const fallbackConfirm = window.confirm(
            `Fallback: Delete warehouse "${warehouse.name}"?\n\n` +
            `This will permanently delete the warehouse and all its data.`
          );
          
          if (fallbackConfirm) {
            // Directly call the delete function
            handleDeleteWarehouse();
          }
        }
      }, 500);
    }, 100);
  };

  const getCapacityColor = (usage) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityBgColor = (usage) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return <CenteredLoader message="Loading warehouses..." size="large" />;
  }

  const isNew = location.pathname === '/warehouses/new';
  if (isNew) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate('/warehouses')} className="text-gray-600 hover:text-gray-800 flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Warehouses
          </button>
        </div>
        <WarehouseFormPage onSuccess={async () => {
          await fetchWarehouses(); // Refresh the list
          navigate('/warehouses');
        }} />
      </div>
    );
  }

  if (selectedWarehouse) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setSelectedWarehouse(null)} 
              className="mr-4 text-gray-600 hover:text-gray-800 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Warehouses
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedWarehouse.name}</h1>
              <p className="text-gray-600">{selectedWarehouse.location}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate(`/warehouses/${selectedWarehouse._id}/add-stock`)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </button>
          </div>
        </div>

        {/* Warehouse Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{selectedWarehouse.currentStock?.length || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-gray-900">{selectedWarehouse.totalStock || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center">
              <Warehouse className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="text-2xl font-bold text-gray-900">{selectedWarehouse.capacity}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center">
              <AlertTriangle className={`h-8 w-8 mr-3 ${
                (selectedWarehouse.availableCapacity || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`} />
              <div>
                <p className="text-sm text-gray-600">Available Space</p>
                <p className={`text-2xl font-bold ${
                  (selectedWarehouse.availableCapacity || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {selectedWarehouse.availableCapacity || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Warehouse Utilization</h3>
            <span className={`font-semibold ${getCapacityColor(selectedWarehouse.capacityUsage || 0)}`}>
              {Math.round(selectedWarehouse.capacityUsage || 0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getCapacityBgColor(selectedWarehouse.capacityUsage || 0)}`}
              style={{ width: `${Math.min(selectedWarehouse.capacityUsage || 0, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{selectedWarehouse.totalStock || 0} items used</span>
            <span>{selectedWarehouse.availableCapacity || 0} items available</span>
          </div>
        </div>

        {/* Product Stock Details */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span className="text-gray-600">Total Stock</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-100 rounded"></div>
                <span className="text-gray-600">Reserved (Pending)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span className="text-gray-600">Delivered (Out)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-100 rounded"></div>
                <span className="text-gray-600">Confirmed Delivered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-100 rounded"></div>
                <span className="text-gray-600">Expected Return (Not received yet)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-100 rounded"></div>
                <span className="text-gray-600">Returned (Received back)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span className="text-gray-600">Available Now</span>
              </div>
            </div>
          </div>
          {selectedWarehouse.currentStock && selectedWarehouse.currentStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product / Variant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Total Stock
                        <span className="text-gray-400" title="Total quantity in warehouse">ℹ️</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Reserved
                        <span className="text-gray-400" title="Items reserved for pending orders (not yet dispatched)">⚠️</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Delivered
                        <span className="text-gray-400" title="Items delivered to customers (out of warehouse)">🚚</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Confirmed Delivered
                        <span className="text-gray-400" title="Items confirmed as delivered (cannot be returned)">✓</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Expected Return
                        <span className="text-gray-400" title="Items marked for return but not yet received back">⏳</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Received Back
                        <span className="text-gray-400" title="Items returned and received back to warehouse">✅</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Available Now
                        <span className="text-gray-400" title="Items available for sale right now">✓</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Merge duplicate product/variant entries by product name + variant name
                    const mergedStock = {};
                    
                    selectedWarehouse.currentStock.forEach(stockItem => {
                      // Create a key based on product name and variant name for proper merging
                      const productName = stockItem.productId?.name || 'Unknown Product';
                      const variantName = stockItem.variantDetails?.name || stockItem.variantName || 'no-variant';
                      const key = `${productName}-${variantName}`;
                      
                      if (!mergedStock[key]) {
                        mergedStock[key] = {
                          ...stockItem,
                          quantity: 0,
                          reservedQuantity: 0,
                          deliveredQuantity: 0,
                          confirmedDeliveredQuantity: 0,
                          expectedReturns: 0,
                          returnedQuantity: 0,
                          // Store the display names for consistent display
                          displayProductName: productName,
                          displayVariantName: variantName,
                          displaySKU: stockItem.variantDetails?.sku || stockItem.productId?.sku || 'N/A'
                        };
                      }
                      
                      // Sum up quantities
                      mergedStock[key].quantity += (stockItem.quantity || 0);
                      mergedStock[key].reservedQuantity += (stockItem.reservedQuantity || 0);
                      mergedStock[key].deliveredQuantity += (stockItem.deliveredQuantity || 0);
                      mergedStock[key].confirmedDeliveredQuantity += (stockItem.confirmedDeliveredQuantity || 0);
                      mergedStock[key].expectedReturns += (stockItem.expectedReturns || 0);
                      mergedStock[key].returnedQuantity += (stockItem.returnedQuantity || 0);
                    });
                    
                    return Object.values(mergedStock).map((stockItem, index) => {
                      // Use the stored display names for consistent display
                      const displayName = stockItem.displayVariantName !== 'no-variant' 
                        ? `${stockItem.displayProductName} / ${stockItem.displayVariantName}`
                        : stockItem.displayProductName;
                      const displaySKU = stockItem.displaySKU;
                      
                      // Get variant attributes for display (use from first item if available)
                      const variantAttributes = stockItem.variantDetails?.attributes || [];
                      
                      return (
                    <motion.tr 
                      key={`${displayName}-${displaySKU}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">{displaySKU}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-bold text-gray-900">{stockItem.quantity}</span>
                          <span className="text-xs text-gray-500">units</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-bold text-orange-600">{stockItem.reservedQuantity || 0}</span>
                          <span className="text-xs text-gray-500">dispatched</span>
                        </div>
                        {(stockItem.reservedQuantity || 0) === 0 && (
                          <span className="text-xs text-green-600 italic">✓ None reserved</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-bold text-red-600">{stockItem.deliveredQuantity || 0}</span>
                            <span className="text-xs text-gray-500">out</span>
                          </div>
                          {(stockItem.deliveredQuantity || 0) > 0 && (
                            <span className="text-xs text-red-600 italic">
                              Delivered to customer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-600">{stockItem.confirmedDeliveredQuantity || 0}</span>
                            <span className="text-xs text-gray-500">confirmed</span>
                          </div>
                          {(stockItem.confirmedDeliveredQuantity || 0) > 0 && (
                            <span className="text-xs text-emerald-600 italic">
                              Cannot return
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-purple-600" />
                            <span className="text-sm font-bold text-purple-600">{stockItem.expectedReturns || 0}</span>
                            <span className="text-xs text-gray-500">pending</span>
                          </div>
                          {(stockItem.expectedReturns || 0) > 0 && (
                            <span className="text-xs text-purple-600 italic">
                              Awaiting return
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-indigo-600" />
                          <span className="text-sm font-bold text-indigo-600">
                            {stockItem.returnedQuantity || 0}
                          </span>
                          <span className="text-xs text-gray-500">received</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold text-green-600">
                            {(stockItem.quantity || 0) - (stockItem.reservedQuantity || 0) - (stockItem.deliveredQuantity || 0) - (stockItem.confirmedDeliveredQuantity || 0)}
                          </span>
                          <span className="text-xs text-gray-500">ready</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {stockItem.tags && stockItem.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {stockItem.tags.map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    tag === 'returned' ? 'bg-blue-100 text-blue-800' :
                                    tag === 'damaged' ? 'bg-red-100 text-red-800' :
                                    tag === 'expired' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Good</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                      );
                    });
                  })()}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products in stock</p>
              <button 
                onClick={() => navigate(`/warehouses/${selectedWarehouse._id}/add-stock`)}
                className="mt-4 btn-primary flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </button>
            </div>
          )}
        </div>

        {/* Add Stock Modal */}
        <AnimatePresence>
          {(() => {
            console.log('Rendering Add Stock Modal - showAddStock:', showAddStock);
            return showAddStock;
          })() && createPortal(
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-0 m-0"
              style={{ 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                margin: 0,
                padding: 0
              }}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Stock to Warehouse</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                    <select
                      value={newStock.productId}
                      onChange={(e) => setNewStock({ ...newStock, productId: e.target.value })}
                      className="w-full input-field"
                      disabled={productsLoading}
                    >
                      <option value="">
                        {productsLoading ? 'Loading products...' : 'Select a product'}
                      </option>
                      {!products || products.length === 0 ? (
                        <option disabled>
                          {productsLoading ? 'Loading...' : 'No products available'}
                        </option>
                      ) : (
                        products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.sku})
                          </option>
                        ))
                      )}
                    </select>
                    {(!products || products.length === 0) && (
                      <p className="text-sm text-red-600 mt-1">No products found. Please add products first.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newStock.quantity}
                      onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                      className="w-full input-field"
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {['returned', 'damaged', 'expired'].map((tag) => (
                        <label key={tag} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newStock.tags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewStock({ ...newStock, tags: [...newStock.tags, tag] });
                              } else {
                                setNewStock({ ...newStock, tags: newStock.tags.filter(t => t !== tag) });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 capitalize">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    onClick={() => {
                      setShowAddStock(false);
                      setNewStock({ productId: '', quantity: '', tags: [] });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddStock}
                    disabled={addingStock}
                    className="btn-primary flex items-center"
                  >
                    {addingStock ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stock
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>

        {/* Delete Warehouse Modal */}
        <AnimatePresence>
          {(() => {
            console.log('Modal render check - showDeleteModal:', showDeleteModal, 'warehouseToDelete:', warehouseToDelete);
            return showDeleteModal && warehouseToDelete;
          })() && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delete Warehouse
                  </h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{warehouseToDelete.name}</strong>?
                  </p>
                  
                  {warehouseToDelete.totalStock > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-yellow-800">
                            This warehouse contains {warehouseToDelete.totalStock} items
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            You must select another warehouse to transfer the stock to.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {warehouseToDelete.totalStock > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer stock to warehouse:
                    </label>
                    <select
                      value={deleteTransferWarehouse}
                      onChange={(e) => setDeleteTransferWarehouse(e.target.value)}
                      className="w-full input-field"
                      required
                    >
                      <option value="">Select a warehouse</option>
                      {warehouses
                        .filter(w => w._id !== warehouseToDelete._id)
                        .map((warehouse) => (
                          <option key={warehouse._id} value={warehouse._id}>
                            {warehouse.name} - {warehouse.availableCapacity || (warehouse.capacity - warehouse.totalStock)} items available
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setWarehouseToDelete(null);
                      setDeleteTransferWarehouse('');
                    }}
                    className="btn-secondary"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteWarehouse}
                    disabled={deleting || (warehouseToDelete.totalStock > 0 && !deleteTransferWarehouse)}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Warehouse
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Export warehouses data
  const handleExportWarehouses = async (format = 'excel') => {
    const { exportWarehouses } = await import('../utils/exportUtils');
    return exportWarehouses(warehouses, format);
  };

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        {/* Title Section - Full width on mobile */}
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your warehouse locations and inventory</p>
          {user && (
            <p className="text-xs sm:text-sm text-green-600 mt-1">
              Logged in as: {user.firstName} {user.lastName} ({user.role})
            </p>
          )}
          {!user && (
            <p className="text-xs sm:text-sm text-red-600 mt-1">
              Not logged in - Please log in to manage warehouses
            </p>
          )}
        </div>
        
        {/* Controls Section - Full width on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <ExportButton
            data={warehouses}
            filename="warehouses"
            title="Warehouse Report"
            exportFunction={handleExportWarehouses}
            variant="default"
            buttonText="Export"
          />
          <button className="btn-primary flex items-center flex-1 sm:flex-initial justify-center" onClick={() => navigate('/warehouses/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search product name to find which warehouse it's in..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Showing warehouses that contain products matching "{searchQuery}"
          </p>
        )}
      </div>

      <div key={warehousesKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses
          .filter(warehouse => {
            if (!searchQuery.trim()) return true;
            
            // Filter warehouses that have products matching the search query
            return warehouse.currentStock?.some(stockItem => {
              const product = products.find(p => p._id === stockItem.productId?._id || p._id === stockItem.productId);
              return product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            });
          })
          .map((warehouse, index) => (
        <motion.div
            key={warehouse._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => fetchWarehouseDetails(warehouse._id)}
        >
          <div className="flex items-center mb-4">
            <Warehouse className="h-8 w-8 text-primary-600 mr-3" />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                  {(warehouse.capacityUsage || 0) > 100 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overflow
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{warehouse.location}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{warehouse.capacity} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Usage:</span>
                <span className="font-medium">{warehouse.totalStock || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Space:</span>
                <span className={`font-medium ${
                  (warehouse.capacity || 0) - (warehouse.totalStock || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {(warehouse.capacity || 0) - (warehouse.totalStock || 0)} items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Products:</span>
                <span className="font-medium">{warehouse.productCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilization:</span>
                <span className={`font-medium ${getCapacityColor(warehouse.capacityUsage || 0)}`}>
                  {Math.round(warehouse.capacityUsage || 0)}%
                </span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getCapacityBgColor(warehouse.capacityUsage || 0)}`}
                style={{ width: `${Math.min(warehouse.capacityUsage || 0, 100)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchWarehouseDetails(warehouse._id, true);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                <Package className="h-4 w-4 mr-1" />
                Add Stock
              </button>
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchWarehouseDetails(warehouse._id);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDeleteWarehouse(warehouse);
                  }}
                  className="text-red-600 hover:text-red-800 p-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                  title="Delete Warehouse"
                  type="button"
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
            </div>
          </div>
        </motion.div>
        ))}
      </div>

      {warehouses.length === 0 && (
        <div className="card p-12 text-center">
          <Warehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No warehouses found</h3>
          <p className="text-gray-600 mb-6">Create your first warehouse to start managing inventory</p>
          <button className="btn-primary flex items-center mx-auto" onClick={() => navigate('/warehouses/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </button>
        </div>
      )}

      {/* Beautiful Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && warehouseToDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-center p-6 border-b border-gray-200">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Warehouse
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-gray-900">
                    "{warehouseToDeleteConfirm.name}"
                  </span>
                  ?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{warehouseToDeleteConfirm.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <p className="font-medium">{warehouseToDeleteConfirm.totalStock || 0} items</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Capacity:</span>
                      <p className="font-medium">{warehouseToDeleteConfirm.capacity} items</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <p className="font-medium">{warehouseToDeleteConfirm.capacityUsage || 0}%</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setWarehouseToDeleteConfirm(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Warehouse
                    </>
                  )}
                </button>
      </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Warehouses;