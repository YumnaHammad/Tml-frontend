import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddStockPage = () => {
  const navigate = useNavigate();
  const { id: warehouseId } = useParams();
  
  const [warehouse, setWarehouse] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    fetchWarehouse();
    fetchProducts();
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    try {
      const response = await api.get(`/warehouses/${warehouseId}`);
      setWarehouse(response.data);
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      toast.error('Failed to load warehouse details');
      navigate('/warehouses');
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch all purchases
      const purchasesResponse = await api.get('/purchases');
      const purchases = purchasesResponse.data?.purchases || [];
      
      // Filter only paid purchases and extract unique products
      const purchasedProductIds = new Set();
      const purchasedProductsMap = new Map();
      
      purchases.forEach(purchase => {
        // Only include paid purchases
        if (purchase.status === 'paid' || purchase.status === 'completed') {
          purchase.items?.forEach(item => {
            if (item.productId) {
              const productId = item.productId._id || item.productId;
              const productData = item.productId._id ? item.productId : null;
              
              purchasedProductIds.add(productId);
              
              if (productData && !purchasedProductsMap.has(productId)) {
                purchasedProductsMap.set(productId, {
                  ...productData,
                  totalPurchased: item.quantity,
                  lastPurchaseDate: purchase.createdAt
                });
              }
            }
          });
        }
      });
      
      // Convert map to array
      const purchasedProducts = Array.from(purchasedProductsMap.values());
      
      console.log('Purchased products with paid receipts:', purchasedProducts.length);
      setProducts(purchasedProducts);
      
    } catch (error) {
      console.error('Error fetching purchased products:', error);
      toast.error('Failed to load purchased products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productId) {
      newErrors.productId = 'Please select a product';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const selectedProduct = products.find(p => p._id === formData.productId);
    const productName = selectedProduct?.name || 'Unknown Product';
    const quantity = parseInt(formData.quantity);

    // Store confirmation data and show modal
    setConfirmData({
      productName,
      quantity,
      tags: formData.tags
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAddStock = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    
    try {
      const response = await api.post(`/warehouses/${warehouseId}/add-stock`, {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        tags: formData.tags
      });
      
      toast.success(`Stock added successfully: ${response.data.addedStock.product} (${response.data.addedStock.quantity} units)`);
      navigate(`/warehouses`);
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error(error.response?.data?.error || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmData(null);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/warehouses')}
          className="text-gray-600 hover:text-gray-800 flex items-center mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Warehouses
        </button>
        
        <div className="flex items-center">
          <Package className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
            {warehouse && (
              <p className="text-gray-600">
                to {warehouse.name} - {warehouse.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Info Card */}
      {warehouse && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Capacity</p>
              <p className="font-semibold text-gray-900">{warehouse.capacity} items</p>
            </div>
            <div>
              <p className="text-gray-600">Current Stock</p>
              <p className="font-semibold text-gray-900">{warehouse.totalStock || 0} items</p>
            </div>
            <div>
              <p className="text-gray-600">Available Space</p>
              <p className="font-semibold text-green-600">
                {(warehouse.capacity || 0) - (warehouse.totalStock || 0)} items
              </p>
            </div>
            <div>
              <p className="text-gray-600">Utilization</p>
              <p className="font-semibold text-gray-900">
                {Math.round(warehouse.capacityUsage || 0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product * <span className="text-xs text-gray-500">(Purchased with paid receipt only)</span>
            </label>
            <select
              value={formData.productId}
              onChange={(e) => {
                setFormData({ ...formData, productId: e.target.value });
                setErrors({ ...errors, productId: '' });
              }}
              className={`w-full input-field ${errors.productId ? 'border-red-300' : ''}`}
            >
              <option value="">Select a purchased product</option>
              {products.length === 0 ? (
                <option disabled>No purchased products available</option>
              ) : (
                products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku}) - PKR {product.sellingPrice || 'N/A'}
                  </option>
                ))
              )}
            </select>
            {errors.productId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.productId}
              </p>
            )}
            {products.length === 0 && !loading && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  No purchased products available
                </p>
                <p className="text-xs text-yellow-700">
                  You can only add products that you've purchased with paid receipts.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/purchases/new')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Create a purchase order first
                  </button>
                </p>
              </div>
            )}
            {products.length > 0 && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {products.length} purchased product{products.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => {
                setFormData({ ...formData, quantity: e.target.value });
                setErrors({ ...errors, quantity: '' });
              }}
              className={`w-full input-field ${errors.quantity ? 'border-red-300' : ''}`}
              placeholder="Enter quantity (e.g., 100)"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.quantity}
              </p>
            )}
            {formData.quantity && !errors.quantity && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Adding {formData.quantity} units
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-3">
              {['returned', 'damaged', 'expired'].map((tag) => (
                <label
                  key={tag}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm font-medium capitalize ${
                    formData.tags.includes(tag) ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {tag}
                  </span>
                </label>
              ))}
            </div>
            {formData.tags.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Selected tags: {formData.tags.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/warehouses')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || products.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Stock...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </>
            )}
          </button>
        </div>
      </form>
    </div>

    {/* Confirmation Modal */}
    <AnimatePresence>
      {showConfirmModal && confirmData && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center confirmation-modal p-4"
          style={{ zIndex: 9998 }}
          onClick={handleCancelConfirm}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            style={{ position: 'relative', zIndex: 9999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Add Stock
              </h3>
              <button
                onClick={handleCancelConfirm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to add stock?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Warehouse:</span>
                  <span className="text-sm font-semibold text-gray-900">{warehouse?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Product:</span>
                  <span className="text-sm font-semibold text-gray-900">{confirmData.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Quantity:</span>
                  <span className="text-sm font-semibold text-green-600">{confirmData.quantity} units</span>
                </div>
                {confirmData.tags.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Tags:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {confirmData.tags.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddStock}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Stock
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
    </>
  );
};

export default AddStockPage;

