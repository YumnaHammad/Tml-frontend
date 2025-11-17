import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, RefreshCw, Eye, Trash2, Search, Filter, Calendar, X } from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const PostExOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Note: PostEx API is now called through our backend for security

  // Map PostEx API response to our format
  const mapPostExOrderToLocalFormat = (apiOrder) => {
    return {
      _id: apiOrder.orderId || apiOrder.id || Math.random().toString(36).substr(2, 9),
      orderReferenceNumber: apiOrder.orderRefNumber || apiOrder.orderReferenceNumber || apiOrder.orderNumber || 'N/A',
      customerName: apiOrder.customerName || 'N/A',
      customerContact: apiOrder.customerPhone || apiOrder.customerContact || 'N/A',
      orderDate: apiOrder.orderDate || apiOrder.createdDate || new Date().toISOString(),
      orderAmount: parseFloat(apiOrder.invoicePayment || apiOrder.orderAmount || apiOrder.amount || 0),
      orderType: apiOrder.orderType || 'Normal',
      status: mapPostExStatusToLocal(apiOrder.status || apiOrder.orderStatus),
      deliveryCity: apiOrder.cityName || apiOrder.deliveryCity || 'N/A',
      deliveryAddress: apiOrder.deliveryAddress || 'N/A',
      items: apiOrder.items || 1,
      airwayBillCopies: apiOrder.invoiceDivision || apiOrder.airwayBillCopies || 1,
      trackingNumber: apiOrder.trackingNumber || apiOrder.trackingId || null,
      orderDetail: apiOrder.orderDetail || '',
      notes: apiOrder.transactionNotes || apiOrder.notes || '',
      bookingWeight: apiOrder.bookingWeight || apiOrder.weight || null,
      pickupCity: apiOrder.pickupCity || 'Rawalpindi',
      pickupAddress: apiOrder.pickupAddress || apiOrder.pickupAddressCode || '',
      returnCity: apiOrder.returnCity || apiOrder.returnCityName || '',
      returnAddress: apiOrder.returnAddress || apiOrder.returnAddressCode || '',
      createdAt: apiOrder.createdDate || apiOrder.createdAt || new Date().toISOString(),
      createdBy: {
        firstName: 'PostEx',
        email: 'postex@api.pk'
      }
    };
  };

  // Map PostEx status to local status format
  const mapPostExStatusToLocal = (postExStatus) => {
    if (!postExStatus) return 'pending';
    
    const statusLower = postExStatus.toLowerCase();
    if (statusLower.includes('pending') || statusLower.includes('pending')) return 'pending';
    if (statusLower.includes('submitted') || statusLower.includes('confirmed')) return 'submitted';
    if (statusLower.includes('transit') || statusLower.includes('shipped')) return 'in_transit';
    if (statusLower.includes('delivered') || statusLower.includes('completed')) return 'delivered';
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) return 'cancelled';
    return 'pending';
  };

  // Fetch PostEx orders from our backend API (which calls PostEx API)
  const fetchPostExOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      
      console.log('Fetching orders from PostEx API via backend...');
      
      // Calculate date range - default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      // Format dates as YYYY-MM-DD for API
      const formatDateForAPI = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      
      console.log('Date range:', { startDate: startDateStr, endDate: endDateStr });
      
      // Call our backend API which will call PostEx API
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      const response = await api.get(`/postex/api/fetch?${params.toString()}`);
      
      console.log('Backend API Response:', response.data);

      // Handle response from our backend
      let ordersData = [];
      if (response.data?.success && response.data?.orders) {
        ordersData = Array.isArray(response.data.orders) ? response.data.orders : [];
      } else if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      }

      // Map API orders to local format
      const mappedOrders = ordersData.map(mapPostExOrderToLocalFormat);

      // Apply client-side filtering
      let filteredOrders = mappedOrders;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.orderReferenceNumber?.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerContact?.toLowerCase().includes(query)
        );
      }

      if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }

      // Apply client-side pagination
      const totalFiltered = filteredOrders.length;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
      setTotalOrdersCount(totalFiltered);
    } catch (error) {
      console.error('Error fetching PostEx orders:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers
        }
      });
      
      setOrders([]);
      setTotalOrdersCount(0);
      
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error || 
                           errorData?.message || 
                           errorData?.statusMessage ||
                           errorData?.detail ||
                           (typeof errorData === 'string' ? errorData : `Server error: ${error.response.status}`);
        
        console.error('Full error response:', JSON.stringify(errorData, null, 2));
        toast.error(`Failed to load PostEx orders: ${errorMessage}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Request setup error:', error.message);
        toast.error(`Failed to load PostEx orders: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPostExOrders();
  }, [fetchPostExOrders]);

  const handleRefresh = () => {
    fetchPostExOrders();
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this PostEx order? Note: This will only remove it from the local view. The order will still exist in PostEx system.')) {
      try {
        // Since we're fetching from PostEx API, we can't delete from there
        // We can only remove from local state if we had local storage
        // For now, just show a message
        toast.error('Cannot delete orders from PostEx API. Orders are managed by PostEx system.');
      } catch (error) {
        console.error('Error deleting PostEx order:', error);
        toast.error('Failed to delete PostEx order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination
  const totalPages = Math.ceil(totalOrdersCount / itemsPerPage);

  if (loading) {
    return <CenteredLoader message="Loading PostEx orders..." size="large" />;
  }

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PostEx Orders</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View all PostEx shipping orders (fetched from PostEx API)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/approved-sales/postex-order')}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference, customer name, or contact..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ORDER REF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRACKING #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WEIGHT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DELIVERY ADDRESS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RETURN ADDRESS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ITEMS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DETAILS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AMOUNT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  JOURNEY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    No PostEx orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    {/* ORDER REF */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderReferenceNumber}
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 mt-1 inline-block">
                        {order.orderType || 'Normal'}
                      </span>
                    </td>
                    {/* TRACKING # */}
                    <td className="px-6 py-4">
                      {order.trackingNumber ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {order.trackingNumber}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(order.orderDate)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    {/* CUSTOMER */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerContact}</div>
                    </td>
                    {/* WEIGHT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.bookingWeight ? `${order.bookingWeight} kg` : '-'}
                      </div>
                    </td>
                    {/* DELIVERY ADDRESS */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.deliveryAddress || order.deliveryCity || '-'}
                      </div>
                      {order.deliveryCity && order.deliveryAddress && (
                        <div className="text-xs text-gray-500 mt-1">{order.deliveryCity}</div>
                      )}
                    </td>
                    {/* RETURN ADDRESS */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.returnAddress || order.pickupAddress || '-'}
                      </div>
                      {order.returnCity && (
                        <div className="text-xs text-gray-500 mt-1">{order.returnCity}</div>
                      )}
                    </td>
                    {/* ITEMS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items || 1}</div>
                    </td>
                    {/* DETAILS */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.orderDetail ? (
                          <span className="truncate max-w-[150px] block" title={order.orderDetail}>
                            {order.orderDetail}
                          </span>
                        ) : (
                          'NA'
                        )}
                      </div>
                    </td>
                    {/* AMOUNT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Rs {order.orderAmount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    {/* JOURNEY */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="px-3 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                        Forward
                      </button>
                    </td>
                    {/* STATUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    {/* ACTIONS */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalOrdersCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalOrdersCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">PostEx Order Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Reference Number:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.orderReferenceNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Order Type:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.orderType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Order Date:</span>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.orderDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Order Amount:</span>
                      <p className="text-sm text-gray-900 font-semibold">
                        Rs {selectedOrder.orderAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <p className="text-sm">
                        <span className={`px-2 py-1 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </span>
                      </p>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Tracking Number:</span>
                        <p className="text-sm text-blue-600 font-semibold">
                          {selectedOrder.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Customer Name:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.customerContact}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Delivery City:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.deliveryCity}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Delivery Address:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Items:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.items}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Airway Bill Copies:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.airwayBillCopies}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Booking Weight:</span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.bookingWeight ? `${selectedOrder.bookingWeight} kg` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Pickup City:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.pickupCity}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Pickup Address:</span>
                      <p className="text-sm text-gray-900">{selectedOrder.pickupAddress}</p>
                    </div>
                    {selectedOrder.returnCity && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Return City:</span>
                        <p className="text-sm text-gray-900">{selectedOrder.returnCity}</p>
                      </div>
                    )}
                    {selectedOrder.returnAddress && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Return Address:</span>
                        <p className="text-sm text-gray-900">{selectedOrder.returnAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedOrder.orderDetail || selectedOrder.notes) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                    <div className="space-y-3">
                      {selectedOrder.orderDetail && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Order Detail:</span>
                          <p className="text-sm text-gray-900">{selectedOrder.orderDetail}</p>
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Notes:</span>
                          <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Created: {formatDate(selectedOrder.createdAt)} by{' '}
                  {selectedOrder.createdBy?.firstName || selectedOrder.createdBy?.email || 'N/A'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PostExOrders;

