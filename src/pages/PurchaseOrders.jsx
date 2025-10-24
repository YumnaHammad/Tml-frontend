import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import ModuleDashboard from '../components/ModuleDashboard';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAlert } from '../hooks/useAlert';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  X,
  Save,
  Send,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  BarChart3
} from 'lucide-react';

const PurchaseOrders = () => {
  const { user } = useAuth();
  const { showConfirm, showSuccess, showError, AlertComponent } = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      supplierName: '',
      items: [{ variantId: '', quantity: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/purchase-orders');
      // Sort by creation date - newest first
      const sortedOrders = (response.data || []).sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const orderData = {
        supplierName: data.supplierName,
        items: data.items.map(item => ({
          variantId: parseInt(item.variantId),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }))
      };

      if (editingOrder) {
        await axios.put(`/api/purchase-orders/${editingOrder.id}`, orderData);
        toast.success('Purchase order updated successfully');
      } else {
        await axios.post('/api/purchase-orders', orderData);
        toast.success('Purchase order created successfully');
      }

      setShowModal(false);
      setEditingOrder(null);
      reset();
      fetchOrders();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      toast.error(error.response?.data?.error || 'Failed to save purchase order');
    }
  };

  const handleEdit = (order) => {
    if (order.status !== 'draft') {
      toast.error('Cannot edit submitted purchase orders');
      return;
    }

    setEditingOrder(order);
    setValue('supplierName', order.supplierName);
    setValue('items', order.items.map(item => ({
      variantId: item.variant.id.toString(),
      quantity: item.quantity,
      price: item.price
    })));
    setShowModal(true);
  };

  const handleDelete = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    showConfirm({
      title: 'Delete Purchase Order',
      message: `Are you sure you want to delete purchase order from "${order?.supplierName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/purchase-orders/${orderId}`);
          showSuccess({
            title: 'Order Deleted',
            message: 'Purchase order has been successfully deleted.'
          });
          fetchOrders();
        } catch (error) {
          console.error('Error deleting purchase order:', error);
          showError({
            title: 'Delete Failed',
            message: 'Failed to delete purchase order. Please try again.'
          });
        }
      }
    });
  };

  const handleSubmitOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    showConfirm({
      title: 'Submit Purchase Order',
      message: `Are you sure you want to submit this purchase order from "${order?.supplierName}"? This will update inventory and generate an invoice.`,
      confirmText: 'Submit',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await axios.post(`/api/purchase-orders/${orderId}/submit`);
          showSuccess({
            title: 'Order Submitted',
            message: 'Purchase order has been successfully submitted and inventory updated.'
          });
          fetchOrders();
        } catch (error) {
          console.error('Error submitting purchase order:', error);
          showError({
            title: 'Submit Failed',
            message: error.response?.data?.error || 'Failed to submit purchase order. Please try again.'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const resetForm = () => {
    reset();
    setEditingOrder(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toString().includes(searchQuery);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-12 w-12"></div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="mt-2 text-gray-600">
                Manage your purchase orders and supplier transactions
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="btn-secondary"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search purchase orders..."
                  className="input-field pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                  }}
                  className="btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          {showAnalytics && (
            <div className="card p-6">
              <ModuleDashboard module="purchases" title="Purchase Orders" />
            </div>
          )}

          {/* Orders Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Order ID</th>
                    <th className="table-header">Supplier</th>
                    <th className="table-header">Items</th>
                    <th className="table-header">Total Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Created By</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          #{order.id}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">{order.supplierName}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{order.items.length} items</div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className="font-semibold text-green-600">
                            {new Intl.NumberFormat('en-PK', {
                              style: 'currency',
                              currency: 'PKR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(parseFloat(order.totalAmount))}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{order.creator?.name}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(order)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                            title="Edit order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {order.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitOrder(order.id)}
                              disabled={submitting}
                              className="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors duration-200"
                              title="Submit order"
                            >
                              {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {order.status === 'submitted' && (
                            <button
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="View invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          {order.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-200"
                              title="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slide-over Modal */}
          <AnimatePresence>
            {showModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
                  onClick={handleModalClose}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {editingOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
                      </h3>
                      <button
                        onClick={handleModalClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Supplier Name *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Enter supplier name"
                          {...register('supplierName', { required: 'Supplier name is required' })}
                        />
                        {errors.supplierName && (
                          <p className="mt-1 text-sm text-danger-600">{errors.supplierName.message}</p>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Order Items</h4>
                          <button
                            type="button"
                            onClick={() => append({ variantId: '', quantity: 1, price: 0 })}
                            className="btn-secondary"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </button>
                        </div>

                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-sm font-medium text-gray-900">Item {index + 1}</h5>
                                {fields.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-danger-600 hover:text-danger-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Variant *
                                  </label>
                                  <select
                                    className="input-field"
                                    {...register(`items.${index}.variantId`, { required: 'Please select a variant' })}
                                  >
                                    <option value="">Select variant...</option>
                                    {products.map(product => 
                                      product.variants.map(variant => (
                                        <option key={variant.id} value={variant.id}>
                                          {product.name} - {variant.sku}
                                        </option>
                                      ))
                                    )}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity *
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    className="input-field"
                                    {...register(`items.${index}.quantity`, { 
                                      required: 'Quantity is required',
                                      min: { value: 1, message: 'Quantity must be at least 1' }
                                    })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price per Unit (PKR) *
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">PKR</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="input-field pl-12"
                                      {...register(`items.${index}.price`, { 
                                        required: 'Price is required',
                                        min: { value: 0, message: 'Price must be greater than 0' }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={handleModalClose}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          <Save className="h-4 w-4 mr-2" />
                          {editingOrder ? 'Update Order' : 'Save as Draft'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* Alert Component */}
        <AlertComponent />
      </Layout>
    </ProtectedRoute>
  );
};

export default PurchaseOrders;
