import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText, 
  Package, 
  MapPin, 
  Phone, 
  Calendar, 
  DollarSign, 
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  MessageSquare,
  X,
  Search,
  Bell,
  User
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CenteredLoader from '../components/CenteredLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const PostExOrderViewList = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showRemarks, setShowRemarks] = useState(false);

  // Sample data structure - will be replaced when you fetch real data
  const [order, setOrder] = useState({
    // Basic Information
    merchantName: 'Tml Mart',
    trackingNumber: '25393050002913',
    orderType: 'CASH ON DELIVERY',
    invoiceAmount: 2800.00,
    bookingWeight: 0.50,
    orderDeliveryDate: 'Rawalpindi',
    pickupCity: 'Rawalpindi',
    returnCity: 'Rawalpindi',
    orderReference: 'Alexa Check Bag Black',
    orderDetails: 'N/A',
    status: 'Returned',
    invoiceAmountDate: 'Nov 8, 2025, 3:42:26 PM',
    actualWeight: 0.90,
    orderPickupDate: 'Nov 8, 2025, 6:22:18 PM',
    pickupAddress: 'Younas Plaza satellite town F Block Leaders BPO New Katariyan Rawalpindi',
    returnAddress: 'Younas Plaza satellite town F Block Leaders BPO New Katariyan Rawalpindi',
    
    // Customer Details
    customerName: 'Shareef',
    deliveryAddress: 'oposit Minnar e pakistan qasur pura kareem park, jamu wala khhu jahangir bakry',
    customerPhone: '03014300944',
    city: 'Lahore',
    
    // Payment Details
    receivedAmount: 0.00,
    upfrontPayment: 1960.00,
    reservedPayment: 0.00,
    codCharges: 209.00,
    upfrontCharges: 0.00,
    balanceAmount: 1960.00,
    upfrontPaymentDate: '-',
    reservedPaymentDate: '-',
    codTax: 33.44,
    upfrontTax: 0.00,
    
    // Timeline/Status History
    timeline: [
      { status: 'At Tml Mart Warehouse', date: 'Nov 8, 2025, 3:42:26 PM', completed: true },
      { status: 'Departed to PostEx Warehouse', date: 'Nov 8, 2025, 6:22:18 PM', completed: true },
      { status: 'Received at RWP Warehouse', date: 'Nov 8, 2025, 9:55:23 PM', completed: true },
      { status: 'Departed to LAHORE', date: 'Nov 9, 2025, 12:33:25 AM', completed: true },
      { status: 'Arrived at Transit Hub LHE', date: 'Nov 9, 2025, 7:19:27 AM', completed: true },
      { status: 'Waiting for Delivery', date: 'Nov 9, 2025, 8:03:15 PM', completed: true },
      { status: 'Departed to LAHORE', date: 'Nov 10, 2025, 12:14:21 PM', completed: true },
      { status: 'Arrived at Transit Hub LHE', date: 'Nov 10, 2025, 12:45:18 PM', completed: true },
      { status: 'Waiting for Delivery', date: 'Nov 10, 2025, 12:52:18 PM', completed: true },
      { status: 'Enroute for Delivery', date: 'Nov 10, 2025, 1:54:17 PM', completed: true },
      { status: 'Attempt Made: RFD(REFUSED TO RECEIVE)', date: 'Nov 10, 2025, 3:48:38 PM', completed: true },
      { status: 'Deliver Under Review', date: 'Nov 10, 2025, 6:44:20 PM', completed: true },
    ],
    
    // Remarks
    remarks: []
  });

  useEffect(() => {
    // TODO: Fetch order data when you implement the API
    // Example:
    // const fetchOrderData = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await api.get(`/postex/orders/${id}`);
    //     setOrder(response.data);
    //   } catch (error) {
    //     console.error('Error fetching order:', error);
    //     toast.error('Failed to load order details');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // if (id) {
    //   fetchOrderData();
    // } else {
    //   setLoading(false);
    // }
    setLoading(false);
  }, [id]);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('returned')) return 'bg-red-500 text-white';
    if (statusLower.includes('delivered')) return 'bg-green-500 text-white';
    if (statusLower.includes('pending') || statusLower.includes('waiting')) return 'bg-yellow-500 text-white';
    if (statusLower.includes('transit') || statusLower.includes('enroute')) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
    }).format(amount).replace('PKR', 'Rs');
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    return dateString;
  };

  const handleDownload = async () => {
    try {
      // Prepare data for export
      const exportData = {
        'Merchant Name': order.merchantName,
        'Tracking Number': order.trackingNumber,
        'Order Type': order.orderType,
        'Invoice Amount': order.invoiceAmount,
        'Customer Name': order.customerName,
        'Customer Phone': order.customerPhone,
        'Delivery Address': order.deliveryAddress,
        'City': order.city,
        'Status': order.status,
        'Order Reference': order.orderReference,
        'Pickup City': order.pickupCity,
        'Return City': order.returnCity,
        'Booking Weight': order.bookingWeight,
        'Actual Weight': order.actualWeight,
        'Received Amount': order.receivedAmount,
        'Upfront Payment': order.upfrontPayment,
        'Balance Amount': order.balanceAmount,
        'COD Charges': order.codCharges,
        'COD Tax': order.codTax,
      };

      const result = exportToExcel([exportData], `PostEx_Order_${order.trackingNumber}`, 'Order Details');
      if (result.success) {
        toast.success('Order details downloaded successfully!');
      } else {
        toast.error('Failed to download order details');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download order details');
    }
  };

  if (loading) {
    return <CenteredLoader message="Loading order details..." size="large" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PostEx Style Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left Side - Logo and Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">PostEx</span>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Dashboard</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Cash on Delivery</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Digital Payments</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Manage Users</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Setting</a>
              </nav>
            </div>
            
            {/* Right Side - Search, Notifications, User */}
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tracking Number"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden md:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order Detail</h1>
        </div>

        {/* Order Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 card p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Merchant Name</label>
                <p className="text-base font-semibold text-gray-900">{order.merchantName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tracking Number</label>
                <p className="text-base font-semibold text-blue-600">{order.trackingNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Type</label>
                <p className="text-base font-semibold text-gray-900">{order.orderType}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Amount</label>
                <p className="text-base font-semibold text-gray-900">{formatCurrency(order.invoiceAmount)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Booking Weight</label>
                <p className="text-base font-semibold text-gray-900">{order.bookingWeight} kg</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Delivery Date</label>
                <p className="text-base font-semibold text-gray-900">{order.orderDeliveryDate}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Pickup City</label>
                <p className="text-base font-semibold text-gray-900">{order.pickupCity}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Return City</label>
                <p className="text-base font-semibold text-gray-900">{order.returnCity}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Reference</label>
                <p className="text-base font-semibold text-gray-900">{order.orderReference}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Details</label>
                <p className="text-base font-semibold text-gray-900">{order.orderDetails}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Amount Date</label>
                <p className="text-base font-semibold text-gray-900">{formatDate(order.invoiceAmountDate)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Actual Weight</label>
                <p className="text-base font-semibold text-gray-900">{order.actualWeight} kg</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Pickup Date</label>
                <p className="text-base font-semibold text-gray-900">{formatDate(order.orderPickupDate)}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Address</label>
                <p className="text-base font-semibold text-gray-900">{order.pickupAddress}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Return Address</label>
                <p className="text-base font-semibold text-gray-900">{order.returnAddress}</p>
              </div>
            </div>
          </motion.div>

          {/* Customer Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Customer Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                <p className="text-base font-semibold text-gray-900">{order.customerName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Address</label>
                <p className="text-base font-semibold text-gray-900">{order.deliveryAddress}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer Phone</label>
                <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {order.customerPhone}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                <p className="text-base font-semibold text-gray-900">{order.city}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Payment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Received Amount</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.receivedAmount)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Upfront Payment</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.upfrontPayment)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Reserved Payment</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.reservedPayment)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">COD Charges</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.codCharges)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Upfront Charges</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.upfrontCharges)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Balance Amount</label>
              <p className="text-base font-semibold text-emerald-600">{formatCurrency(order.balanceAmount)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Upfront Payment Date</label>
              <p className="text-base font-semibold text-gray-900">{formatDate(order.upfrontPaymentDate)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Reserved Payment Date</label>
              <p className="text-base font-semibold text-gray-900">{formatDate(order.reservedPaymentDate)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">COD Tax</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.codTax)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Upfront Tax</label>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(order.upfrontTax)}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowRemarks(!showRemarks)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
          >
            <MessageSquare className="w-5 h-5" />
            View Remarks
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Remarks Modal */}
        {showRemarks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
              <button
                onClick={() => setShowRemarks(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {order.remarks && order.remarks.length > 0 ? (
              <div className="space-y-3">
                {order.remarks.map((remark, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{remark}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No remarks available</p>
            )}
          </motion.div>
        )}

        {/* Order Timeline - Horizontal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Order Journey Timeline</h2>
          
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max" style={{ minWidth: `${order.timeline.length * 200}px` }}>
              {order.timeline.map((item, index) => (
                <div key={index} className="flex flex-col items-center min-w-[180px] relative">
                  {/* Timeline Line */}
                  {index < order.timeline.length - 1 && (
                    <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 transform translate-x-1/2 z-0"></div>
                  )}
                  
                  {/* Status Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                    item.completed 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {item.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                    {/* Green F badge */}
                    {item.completed && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-xs font-bold text-white">F</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Text */}
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900 mb-1 leading-tight">{item.status}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">PostEx.</p>
              <div className="flex gap-4 text-sm text-gray-600">
                <a href="#" className="hover:text-blue-600">Product</a>
                <a href="#" className="hover:text-blue-600">PostEx COD</a>
                <a href="#" className="hover:text-blue-600">Paid</a>
              </div>
            </div>
            <div className="text-sm text-gray-500 text-center md:text-right">
              <p>Legal Terms&Conditions</p>
              <p className="mt-1">Privacy Policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostExOrderViewList;
