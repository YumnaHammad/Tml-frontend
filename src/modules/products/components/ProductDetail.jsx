import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  X,
  DollarSign,
  BarChart3,
  Clock,
  Grid3X3,
  Edit
} from 'lucide-react';

const ProductDetail = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
      } catch (err) {
        setError('Failed to fetch product details.');
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-center mt-4 text-gray-600">Loading product details...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-center mt-4 text-red-600">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!product) return null;

  // Helper to format date and time
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  // Determine stock status
  const getStockStatus = (currentStock) => {
    if (currentStock === 0) return { text: 'Out of Stock', color: 'text-red-500', bgColor: 'bg-red-100' };
    if (currentStock <= 5) return { text: 'Low Stock', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-500', bgColor: 'bg-green-100' };
  };

  const overallStock = product.warehouses?.reduce((sum, w) => sum + w.stock, 0) || 0;
  const { text: overallStatusText, color: overallStatusColor, bgColor: overallStatusBgColor } = getStockStatus(overallStock);

  // Calculate profit margin
  // const profitMargin = product.costPrice > 0 ? 
  //   ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(2) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-6xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3 text-primary-600" />
            {product.name}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mb-8">
          {/* Product Info */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">{product.unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-sm">{formatDateTime(product.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-sm">{formatDateTime(product.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {!product.hasVariants && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Selling Price:</span>
                    <span className="font-medium text-green-600">PKR {product.sellingPrice}</span>
                  </div>
                </div>
              </div>
              )}
            </div>

            {product.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{product.description}</p>
              </div>
            )}

            {/* Product Variants Section */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Grid3X3 className="h-5 w-5 mr-2 text-primary-600" />
                  Product Variants ({product.variants.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.variants.map((variant, index) => {
                    const variantStock = variant.stock || 0;
                    const stockStatus = variantStock === 0 
                      ? { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
                      : variantStock <= 5 
                      ? { text: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
                      : { text: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
                    
                    return (
                      <div key={index} className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 ${stockStatus.borderColor} rounded-lg p-4 hover:shadow-lg transition-shadow`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{variant.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">SKU:</span>
                              <code className="text-xs font-mono px-2 py-1 bg-white text-blue-700 rounded border border-blue-300">
                                {variant.sku}
                              </code>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${stockStatus.bgColor} ${stockStatus.color} border ${stockStatus.borderColor}`}>
                            {variantStock} units
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-white/60 p-2 rounded">
                            <span className="text-sm font-medium text-gray-700">Selling Price:</span>
                            <span className="font-bold text-green-700 text-lg">PKR {variant.sellingPrice}</span>
                          </div>
                          
                          {variant.attributes && variant.attributes.length > 0 && (
                            <div className="pt-2 border-t border-blue-200">
                              <span className="text-xs font-medium text-gray-700">Attributes:</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {variant.attributes.map((attr, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-white rounded border border-blue-300 text-gray-700 font-medium">
                                    {attr.name}: {attr.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Stock Status Badge */}
                          <div className={`${stockStatus.bgColor} p-2 rounded border ${stockStatus.borderColor}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold ${stockStatus.color}`}>
                                Status: {stockStatus.text}
                              </span>
                              {variantStock > 0 && (
                                <span className="text-xs text-gray-600">
                                  Threshold: 5 units
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Overview for Non-Variant Products */}
            {!product.hasVariants && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
                  Stock Overview
                </h3>
                <div className={`p-4 rounded-lg flex items-center justify-between ${overallStatusBgColor} mb-4`}>
                  <span className={`text-lg font-bold ${overallStatusColor}`}>Total Stock: {overallStock} units</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${overallStatusColor} border ${overallStatusColor.replace('text-', 'border-')}`}>
                    {overallStatusText}
                  </span>
                </div>

                {product.warehouses && product.warehouses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 mb-2">Stock by Warehouse:</h4>
                    {product.warehouses.map((warehouse, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <span className="flex items-center text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {warehouse.name}:
                        </span>
                        <span className="font-medium">{warehouse.stock} units</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-blue-700 text-sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Low Stock Threshold: {product.lowStockThreshold || 5} units
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Timeline */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-600" />
            Product Timeline
          </h3>
          <div className="relative pl-8">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            {product.timeline && product.timeline.length > 0 ? (
              product.timeline.map((event, index) => (
                <div key={index} className="mb-6 flex items-start relative">
                  <div className={`absolute -left-1.5 top-2 w-3 h-3 rounded-full z-10 ${
                    event.action === 'created' ? 'bg-green-500' :
                    event.action === 'purchased' ? 'bg-blue-500' :
                    event.action === 'sold' ? 'bg-purple-500' :
                    event.action === 'delivered' ? 'bg-green-600' :
                    event.action === 'returned' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm text-gray-500">{formatDateTime(event.timestampISO)}</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded-full">
                        {event.actor || 'System'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 capitalize">{event.action.replace('_', ' ')}</p>
                    <p className="text-gray-700 text-sm">{event.details}</p>
                    {event.quantity && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Quantity:</span> {event.quantity} units
                      </p>
                    )}
                    {event.warehouse && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Warehouse:</span> {event.warehouse}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No timeline events available for this product.</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Product ID:</span> {product._id}
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                window.location.href = `/products/${product._id}/edit`;
              }} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductDetail;
