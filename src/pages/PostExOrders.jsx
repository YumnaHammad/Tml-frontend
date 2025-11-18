<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, RefreshCw, Eye, Trash2, Search, Filter, Calendar, X, Package, DollarSign, Clock, CheckCircle, TrendingUp, MapPin, SlidersHorizontal } from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const PostExOrders = () => {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState([]); // Store all fetched orders
  const [orders, setOrders] = useState([]); // Filtered and paginated orders
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [amountRangeFilter, setAmountRangeFilter] = useState({
    min: '',
    max: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });
  const navigate = useNavigate();
  const { user } = useAuth();
=======
import React from "react";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { Forward } from "lucide-react";

const PostExOrders = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    orderStatusId: 0,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e

  const statusOptions = [
    { value: 0, label: "All Orders" },
    { value: 1, label: "Unbooked" },
    { value: 2, label: "Booked" },
    { value: 3, label: "PostEx WareHouse" },
    { value: 4, label: "Out For Delivery" },
    { value: 5, label: "Delivered" },
    { value: 6, label: "Returned" },
    { value: 7, label: "Un-Assigned By Me" },
    { value: 8, label: "Expired" },
    { value: 9, label: "Delivery Under Review" },
    { value: 15, label: "Picked By PostEx" },
    { value: 16, label: "Out For Return" },
    { value: 17, label: "Attempted" },
    { value: 18, label: "En-Route to PostEx warehouse" }
  ];

<<<<<<< HEAD
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

  // Apply filters function
  const applyFilters = useCallback((ordersToFilter) => {
    if (!ordersToFilter || ordersToFilter.length === 0) {
      setOrders([]);
      setTotalOrdersCount(0);
      return;
    }

    let filteredOrders = [...ordersToFilter];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.orderReferenceNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerContact?.toLowerCase().includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }

    // City filter
    if (cityFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.deliveryCity?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Order type filter
    if (orderTypeFilter) {
      filteredOrders = filteredOrders.filter(order => order.orderType === orderTypeFilter);
    }

    // Date range filter
    if (dateRangeFilter.startDate) {
      const startDate = new Date(dateRangeFilter.startDate);
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate >= startDate;
      });
    }
    if (dateRangeFilter.endDate) {
      const endDate = new Date(dateRangeFilter.endDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end date
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate <= endDate;
      });
    }

    // Amount range filter
    if (amountRangeFilter.min) {
      const minAmount = parseFloat(amountRangeFilter.min);
      filteredOrders = filteredOrders.filter(order => (order.orderAmount || 0) >= minAmount);
    }
    if (amountRangeFilter.max) {
      const maxAmount = parseFloat(amountRangeFilter.max);
      filteredOrders = filteredOrders.filter(order => (order.orderAmount || 0) <= maxAmount);
    }

    // Update total count
    setTotalOrdersCount(filteredOrders.length);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    setOrders(paginatedOrders);
  }, [searchQuery, statusFilter, cityFilter, orderTypeFilter, dateRangeFilter, amountRangeFilter, currentPage, itemsPerPage]);

  // Fetch PostEx orders from our backend API (which calls PostEx API)
  const fetchPostExOrders = useCallback(async () => {
    try {
      setLoading(true);
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
      console.log('Response success:', response.data?.success);
      console.log('Response orders:', response.data?.orders);
      console.log('Orders count:', response.data?.orders?.length || 0);

      // Handle response from our backend
      let ordersData = [];
      if (response.data?.success && response.data?.orders) {
        ordersData = Array.isArray(response.data.orders) ? response.data.orders : [];
        console.log('Using response.data.orders, count:', ordersData.length);
      } else if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
        console.log('Using response.data as array, count:', ordersData.length);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
        console.log('Using response.data.data, count:', ordersData.length);
      } else {
        console.warn('Unexpected response format:', response.data);
      }

      console.log('Final ordersData before mapping:', ordersData.length);

      // Map API orders to local format
      const mappedOrders = ordersData.map(mapPostExOrderToLocalFormat);
      console.log('Mapped orders count:', mappedOrders.length);

      // Store all orders
      setAllOrders(mappedOrders);
      
      // Calculate summary statistics
      const stats = {
        totalOrders: mappedOrders.length,
        totalRevenue: mappedOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0),
        pendingOrders: mappedOrders.filter(order => order.status === 'pending').length,
        deliveredOrders: mappedOrders.filter(order => order.status === 'delivered').length
      };
      setSummaryStats(stats);
      console.log('Summary stats calculated:', stats);

      // Apply filters
      if (mappedOrders.length > 0) {
        applyFilters(mappedOrders);
      } else {
        // If no orders, clear the filtered results
        setOrders([]);
        setTotalOrdersCount(0);
        console.log('No orders found, clearing table');
      }
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
=======
  const fetchPostExData = async () => {
    try {
      const response = await axios.get(
        "https://api.postex.pk/services/integration/api/order/v1/get-all-order",
        {
          headers: {
            token: "ZThkODBkYzg4NjBkNDE0YzgxOWUxZGZkM2U0YjNjYjc6ZDk2ZjE5NjBjNzU2NDk3MThmZDc2MmExYTgyYWY5MmY=",
            "Content-Type": "application/json",
          },
          params: filters,
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e
        }
      );
      if (response.status === 200) {
        setData(response.data.dist || []);
      }
      console.log("response of postex orders is", response);
    } catch (error) {
      console.log("error fetching data is", error);
    }
<<<<<<< HEAD
  }, [applyFilters]);

  // Reapply filters when filters change
  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilters(allOrders);
    }
  }, [searchQuery, statusFilter, cityFilter, orderTypeFilter, dateRangeFilter, amountRangeFilter, currentPage, itemsPerPage, applyFilters, allOrders]);
=======
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchPostExData();
  };
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e

  useEffect(() => {
    fetchPostExData();
  }, []);

  // Get unique cities for filter
  const uniqueCities = [...new Set(allOrders.map(order => order.deliveryCity).filter(Boolean))].sort();

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCityFilter('');
    setOrderTypeFilter('');
    setDateRangeFilter({ startDate: '', endDate: '' });
    setAmountRangeFilter({ min: '', max: '' });
    setCurrentPage(1);
  };

  return (
<<<<<<< HEAD
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold">{summaryStats.totalOrders}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
              <Package className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">Rs {summaryStats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-lg p-3">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium mb-1">Pending Orders</p>
              <p className="text-3xl font-bold">{summaryStats.pendingOrders}</p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-lg p-3">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Delivered Orders</p>
              <p className="text-3xl font-bold">{summaryStats.deliveredOrders}</p>
            </div>
            <div className="bg-emerald-400 bg-opacity-30 rounded-lg p-3">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
            </button>
            {(searchQuery || statusFilter || cityFilter || orderTypeFilter || dateRangeFilter.startDate || dateRangeFilter.endDate || amountRangeFilter.min || amountRangeFilter.max) && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference, customer, contact, or tracking..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
=======
    <div>
      {/* Filters Section */}
      <div className="card p-4 mb-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              value={filters.orderStatusId}
              onChange={(e) => handleFilterChange('orderStatusId', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
<<<<<<< HEAD
          <div>
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Order Types</option>
              <option value="Normal">Normal</option>
              <option value="Reverse">Reverse</option>
              <option value="Replacement">Replacement</option>
            </select>
=======
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Apply Filters
            </button>
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Delivery City
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRangeFilter.startDate}
                  onChange={(e) => {
                    setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRangeFilter.endDate}
                  onChange={(e) => {
                    setDateRangeFilter(prev => ({ ...prev, endDate: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Min Amount
                </label>
                <input
                  type="number"
                  placeholder="Min"
                  value={amountRangeFilter.min}
                  onChange={(e) => {
                    setAmountRangeFilter(prev => ({ ...prev, min: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Max Amount
                </label>
                <input
                  type="number"
                  placeholder="Max"
                  value={amountRangeFilter.max}
                  onChange={(e) => {
                    setAmountRangeFilter(prev => ({ ...prev, max: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
<<<<<<< HEAD
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.NO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
=======
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e
                  ORDER REF
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRACKING #
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WEIGHT
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DELIVERY ADDRESS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RETURN ADDRESS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ITEMS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DETAILS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AMOUNT
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  JOURNEY
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
<<<<<<< HEAD
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                    No PostEx orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    {/* SERIAL NUMBER */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </div>
                    </td>
                    {/* ORDER REF */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderReferenceNumber}
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 mt-1 inline-block">
                        {order.orderType || 'Normal'}
=======
              {data && data.length > 0 ? (
                data.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{order.orderRefNumber}</td>
                    <td className="px-4 py-3 text-sm">{order.trackingNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-gray-500 text-xs">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.bookingWeight}kg</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" title={order.deliveryAddress}>
                      {order.deliveryAddress}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" title={order.returnAddress}>
                      {order.returnAddress}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.items}</td>
                    <td className="px-4 py-3 text-sm">{order.orderDetail}</td>
                    <td className="px-4 py-3 text-sm">{order.invoicePayment}</td>
                    <td className="px-4 py-3 text-sm">
                      <Forward className="h-4 w-4 text-blue-600" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.transactionStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.transactionStatus === 'Returned' ? 'bg-red-100 text-red-800' :
                        order.transactionStatus === 'Out For Delivery' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.transactionStatus}
>>>>>>> c546cc58f7747c58f81de43bf7fa4cfb87f3b89e
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                    No orders found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostExOrders;