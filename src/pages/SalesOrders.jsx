import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import ModuleDashboard from '../components/ModuleDashboard';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
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
  Eye,
  BarChart3
} from 'lucide-react';

const SalesOrders = () => {
  const { user } = useAuth();
  const { showConfirm, showSuccess, showError, showInfo, AlertComponent } = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/sales-orders');
      // Sort by creation date - newest first
      const sortedOrders = (response.data || []).sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast.error('Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    showConfirm({
      title: 'Submit Sales Order',
      message: `Are you sure you want to submit this sales order for "${order?.customerName}"? This will check stock availability and create a dispatch record.`,
      confirmText: 'Submit',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await axios.post(`/api/sales-orders/${orderId}/submit`);
          showSuccess({
            title: 'Order Submitted',
            message: 'Sales order has been successfully submitted and dispatch record created.'
          });
          fetchOrders();
        } catch (error) {
          console.error('Error submitting sales order:', error);
          showError({
            title: 'Submit Failed',
            message: error.response?.data?.error || 'Failed to submit sales order. Please try again.'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Orders</h1>
              <p className="mt-2 text-gray-600">
                Manage your sales orders and customer transactions
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
                onClick={() => toast.info('Sales order creation feature coming soon!')}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Sales Order
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
                  placeholder="Search sales orders..."
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
              <ModuleDashboard module="sales" title="Sales Orders" />
            </div>
          )}

          {/* Orders Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Order ID</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Items</th>
                    <th className="table-header">Total Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Dispatch Status</th>
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
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
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
                        {order.dispatch ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.dispatch.status === 'delivered' ? 'bg-success-100 text-success-800' :
                            order.dispatch.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                            order.dispatch.status === 'returned' ? 'bg-danger-100 text-danger-800' :
                            'bg-warning-100 text-warning-800'
                          }`}>
                            {order.dispatch.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
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
                            onClick={() => toast.info('View feature coming soon!')}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                            title="View order"
                          >
                            <Eye className="h-4 w-4" />
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
                              title="View receipt"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No sales orders found</p>
              </div>
            )}

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
        </div>
        {/* Alert Component */}
        <AlertComponent />
      </Layout>
    </ProtectedRoute>
  );
};

export default SalesOrders;
