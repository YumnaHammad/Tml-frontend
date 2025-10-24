import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
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
  X
} from 'lucide-react';

const ProductDetail = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${productId}`);
      console.log('🔍 ProductDetail - Full API Response:', response.data);
      console.log('🎨 Has Variants?:', response.data.hasVariants);
      console.log('📦 Variants Array:', response.data.variants);
      console.log('📊 Variants Length:', response.data.variants?.length);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'text-green-600 bg-green-100';
      case 'YELLOW': return 'text-yellow-600 bg-yellow-100';
      case 'RED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventIcon = (action) => {
    switch (action) {
      case 'product_created': return <Package className="h-4 w-4" />;
      case 'purchase_created': return <TrendingUp className="h-4 w-4" />;
      case 'stock_transferred': return <Truck className="h-4 w-4" />;
      case 'order_delivered': return <CheckCircle className="h-4 w-4" />;
      case 'order_returned': return <RotateCcw className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (action) => {
    switch (action) {
      case 'product_created': return 'bg-blue-100 text-blue-600';
      case 'purchase_created': return 'bg-green-100 text-green-600';
      case 'stock_transferred': return 'bg-purple-100 text-purple-600';
      case 'order_delivered': return 'bg-emerald-100 text-emerald-600';
      case 'order_returned': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return createPortal(
      <div 
        className="fixed bg-black bg-opacity-50 flex items-center justify-center regular-modal" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9500,
          margin: 0,
          padding: 0
        }}
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading product details...</span>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (error) {
    return createPortal(
      <div 
        className="fixed bg-black bg-opacity-50 flex items-center justify-center regular-modal" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9500,
          margin: 0,
          padding: 0
        }}
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!product) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9500,
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto'
      }}
      onClick={onClose}
    >

      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '1024px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          margin: '16px',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-600">SKU: {product.sku}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 120px)', backgroundColor: '#ffffff' }}>
          <div className="p-6 space-y-6">
            {/* Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">{product.unit}</span>
                  </div>
                  {!product.hasVariants && (
                    <>
                      {/* <div className="flex justify-between">
                        <span className="text-gray-600">Cost Price:</span>
                        <span className="font-medium">PKR {product.costPrice}</span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Selling Price:</span>
                        <span className="font-medium">PKR {product.sellingPrice}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Stock:</span>
                    <span className="font-medium">{product.totalStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.stockStatus)}`}>
                      {product.stockStatus}
                    </span>
                  </div>
                  {product.alertMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-red-800 text-sm">{product.alertMessage}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Warehouse Stock</h3>
                <div className="space-y-2">
                  {product.warehouseStock?.map((warehouse, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600 text-sm">{warehouse.name}</span>
                      </div>
                      <span className="font-medium">{warehouse.stock} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-yellow-900">🔍 Debug Info:</h3>
              <div className="text-xs text-yellow-800 space-y-1">
                <p>hasVariants: <strong>{product.hasVariants ? 'TRUE ✅' : 'FALSE ❌'}</strong></p>
                <p>variants exists: <strong>{product.variants ? 'YES ✅' : 'NO ❌'}</strong></p>
                <p>variants length: <strong>{product.variants?.length || 0}</strong></p>
                {product.variants && product.variants.length > 0 && (
                  <p>First variant: <strong>{product.variants[0]?.name || 'N/A'}</strong></p>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Variants ({product.variants.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.variants.map((variant, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{variant.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">SKU: {variant.sku}</p>
                        </div>
                        {variant.stock > 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {/* Attributes */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {variant.attributes.map((attr, attrIndex) => (
                            <span 
                              key={attrIndex}
                              className="inline-flex items-center px-2 py-1 bg-white border border-blue-200 rounded text-xs"
                            >
                              <span className="font-medium text-gray-700">{attr.name}:</span>
                              <span className="ml-1 text-blue-600">{attr.value}</span>
                            </span>
                          ))}
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-200">
                          {/* <div>
                            <p className="text-xs text-gray-600">Cost Price</p>
                            <p className="font-semibold text-gray-900">PKR {variant.costPrice}</p>
                          </div> */}
                          <div>
                            <p className="text-xs text-gray-600">Selling Price</p>
                            <p className="font-semibold text-green-600">PKR {variant.sellingPrice}</p>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="pt-2 border-t border-blue-200">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-600">Stock</p>
                            <p className="font-semibold text-gray-900">{variant.stock} units</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {product.timeline && product.timeline.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Timeline</h3>
                <div className="space-y-4">
                  {product.timeline.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className={`p-2 rounded-full ${getEventColor(event.action)}`}>
                        {getEventIcon(event.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {event.action.replace(/_/g, ' ')}
                          </h4>
                          <span className="text-sm text-gray-500" title={event.timestampISO}>
                            {event.timestampDisplay}
                          </span>
                        </div>
                        {event.actorId && (
                          <p className="text-sm text-gray-600 mt-1">
                            By: {event.actorId.firstName} {event.actorId.lastName}
                          </p>
                        )}
                        {event.metadata && (
                          <div className="mt-2 text-sm text-gray-600">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="ml-2">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProductDetail;
