import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Calendar,
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart,
  Star, Clock, CheckCircle, XCircle, AlertTriangle, Users,
  BarChart3, PieChart, Activity, Target, Award, Truck,
  FileText, Edit, Trash2, Eye, Download, Share2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const SupplierDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [businessStats, setBusinessStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    onTimeDeliveryRate: 0,
    qualityRating: 0,
    totalProducts: 0,
    activeProducts: 0,
    paymentHistory: [],
    orderHistory: []
  });

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data);
      
      // Fetch business analytics
      await fetchBusinessAnalytics(response.data._id);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      toast.error('Failed to fetch supplier details');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessAnalytics = async (supplierId) => {
    try {
      // Fetch comprehensive business data
      const [ordersResponse, analyticsResponse] = await Promise.all([
        api.get(`/suppliers/${supplierId}/orders`),
        api.get(`/suppliers/${supplierId}/analytics`)
      ]);

      const orders = ordersResponse.data;
      const analytics = analyticsResponse.data;

      // Calculate business statistics
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
      const onTimeDeliveries = orders.filter(order => order.deliveredOnTime).length;
      const onTimeDeliveryRate = orders.length > 0 ? (onTimeDeliveries / orders.length) * 100 : 0;

      setBusinessStats({
        totalOrders: orders.length,
        totalSpent,
        averageOrderValue,
        lastOrderDate: orders.length > 0 ? orders[0].orderDate : null,
        onTimeDeliveryRate,
        qualityRating: analytics.averageRating || 0,
        totalProducts: analytics.totalProducts || 0,
        activeProducts: analytics.activeProducts || 0,
        paymentHistory: analytics.paymentHistory || [],
        orderHistory: orders.slice(0, 10) // Last 10 orders
      });
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      // Set default values if analytics fail
      setBusinessStats(prev => ({
        ...prev,
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        onTimeDeliveryRate: 0
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading supplier details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Supplier Not Found</h2>
            <p className="text-gray-600">The requested supplier could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Suppliers
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Supplier Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/suppliers/edit/${supplier._id}`)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Supplier
          </button>
        </div>
      </div>

      {/* Supplier Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
              <p className="text-gray-600">{supplier.companyName || 'Individual Supplier'}</p>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                  {supplier.status || 'Active'}
                </span>
                <div className="flex items-center ml-3">
                  {getRatingStars(businessStats.qualityRating)}
                  <span className="ml-2 text-sm text-gray-600">({businessStats.qualityRating.toFixed(1)})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{supplier.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{supplier.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Website</p>
              <p className="font-medium">{supplier.website || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{supplier.address?.city || 'N/A'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Business Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{businessStats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">PKR {businessStats.totalSpent.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+8% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">${businessStats.averageOrderValue.toFixed(2)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-600">-3% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On-Time Delivery</p>
              <p className="text-2xl font-bold text-gray-900">{businessStats.onTimeDeliveryRate.toFixed(1)}%</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">Excellent performance</span>
          </div>
        </motion.div>
      </div>

      {/* Detailed Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Person Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Contact Person
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{supplier.contactPerson?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="font-medium">{supplier.contactPerson?.position || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{supplier.contactPerson?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{supplier.contactPerson?.phone || 'N/A'}</p>
            </div>
          </div>
        </motion.div>

        {/* Business Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Business Terms
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Payment Terms</p>
              <p className="font-medium">{supplier.paymentTerms || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Credit Limit</p>
              <p className="font-medium">PKR {supplier.creditLimit?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Supplier Since</p>
              <p className="font-medium">{new Date(supplier.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Order</p>
              <p className="font-medium">{businessStats.lastOrderDate ? new Date(businessStats.lastOrderDate).toLocaleDateString() : 'No orders yet'}</p>
            </div>
          </div>
        </motion.div>

        {/* Complete Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Complete Address
          </h3>
          <div className="space-y-2">
            <p className="font-medium">{supplier.address?.street || 'N/A'}</p>
            <p>{supplier.address?.city || 'N/A'}, {supplier.address?.state || 'N/A'}</p>
            <p>{supplier.address?.country || 'N/A'} {supplier.address?.postalCode || ''}</p>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Quality Rating</span>
              <div className="flex items-center">
                {getRatingStars(businessStats.qualityRating)}
                <span className="ml-2 font-medium">{businessStats.qualityRating.toFixed(1)}/5.0</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">On-Time Delivery</span>
              <span className="font-medium">{businessStats.onTimeDeliveryRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="font-medium">{businessStats.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Products</span>
              <span className="font-medium">{businessStats.activeProducts}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      {businessStats.orderHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-lg p-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Recent Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businessStats.orderHistory.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber || order._id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      PKR {order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.deliveredOnTime ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Notes Section */}
      {supplier.notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-lg p-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Notes
          </h3>
          <p className="text-gray-700 leading-relaxed">{supplier.notes}</p>
        </motion.div>
      )}
    </div>
  );
};

export default SupplierDetailPage;
