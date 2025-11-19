import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Truck,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  X,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  SlidersHorizontal,
  MoreVertical,
  Ban,
  MessageSquare,
  Edit,
} from "lucide-react";
import CenteredLoader from "../components/CenteredLoader";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [orderForRemarks, setOrderForRemarks] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [amountRangeFilter, setAmountRangeFilter] = useState({
    min: "",
    max: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Status options from the second component
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
    { value: 18, label: "En-Route to PostEx warehouse" },
  ];

  // Map PostEx API response to our format
  const mapPostExOrderToLocalFormat = (apiOrder) => {
    return {
      _id:
        apiOrder.orderId ||
        apiOrder.id ||
        Math.random().toString(36).substr(2, 9),
      orderReferenceNumber:
        apiOrder.orderRefNumber ||
        apiOrder.orderReferenceNumber ||
        apiOrder.orderNumber ||
        "N/A",
      customerName: apiOrder.customerName || "N/A",
      customerContact:
        apiOrder.customerPhone || apiOrder.customerContact || "N/A",
      orderDate:
        apiOrder.orderDate || apiOrder.createdDate || new Date().toISOString(),
      orderAmount: parseFloat(
        apiOrder.invoicePayment || apiOrder.orderAmount || apiOrder.amount || 0
      ),
      orderType: apiOrder.orderType || "Normal",
      status:
        apiOrder.transactionStatus || apiOrder.status || apiOrder.orderStatus,
      deliveryCity: apiOrder.cityName || apiOrder.deliveryCity || "N/A",
      deliveryAddress: apiOrder.deliveryAddress || "N/A",
      items: apiOrder.items || 1,
      airwayBillCopies:
        apiOrder.invoiceDivision || apiOrder.airwayBillCopies || 1,
      trackingNumber: apiOrder.trackingNumber || apiOrder.trackingId || null,
      orderDetail: apiOrder.orderDetail || "",
      notes: apiOrder.transactionNotes || apiOrder.notes || "",
      bookingWeight: apiOrder.bookingWeight || apiOrder.weight || null,
      pickupCity: apiOrder.pickupCity || "Rawalpindi",
      pickupAddress: apiOrder.pickupAddress || apiOrder.pickupAddressCode || "",
      returnCity: apiOrder.returnCity || apiOrder.returnCityName || "",
      returnAddress: apiOrder.returnAddress || apiOrder.returnAddressCode || "",
      createdAt:
        apiOrder.createdDate || apiOrder.createdAt || new Date().toISOString(),
      createdBy: {
        firstName: "PostEx",
        email: "postex@api.pk",
      },
      // Additional fields from second component
      transactionStatus: apiOrder.transactionStatus || "N/A",
    };
  };

  // Map PostEx status to local status format
  const mapPostExStatusToLocal = (postExStatus) => {
    if (!postExStatus) return "pending";

    const statusLower = postExStatus.toLowerCase();
    if (
      statusLower.includes("pending") ||
      statusLower.includes("unbooked") ||
      statusLower.includes("un-assigned")
    )
      return "pending";
    if (
      statusLower.includes("submitted") ||
      statusLower.includes("confirmed") ||
      statusLower.includes("booked") ||
      statusLower.includes("picked") ||
      statusLower.includes("en-route")
    )
      return "submitted";
    if (
      statusLower.includes("transit") ||
      statusLower.includes("shipped") ||
      statusLower.includes("warehouse") ||
      statusLower.includes("out for delivery") ||
      statusLower.includes("attempted")
    )
      return "in_transit";
    if (statusLower.includes("delivered") || statusLower.includes("completed"))
      return "delivered";
    if (
      statusLower.includes("cancelled") ||
      statusLower.includes("canceled") ||
      statusLower.includes("returned") ||
      statusLower.includes("expired")
    )
      return "cancelled";
    return "pending";
  };

  // Apply filters function
  const applyFilters = useCallback(
    (ordersToFilter) => {
      if (!ordersToFilter || ordersToFilter.length === 0) {
        setOrders([]);
        setTotalOrdersCount(0);
        return;
      }

      let filteredOrders = [...ordersToFilter];

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(
          (order) =>
            order.orderReferenceNumber?.toLowerCase().includes(query) ||
            order.customerName?.toLowerCase().includes(query) ||
            order.customerContact?.toLowerCase().includes(query) ||
            order.trackingNumber?.toLowerCase().includes(query)
        );
      }

      // Status filter
      if (statusFilter) {
        filteredOrders = filteredOrders.filter(
          (order) => order.status === statusFilter
        );
      }

      // City filter
      if (cityFilter) {
        filteredOrders = filteredOrders.filter((order) =>
          order.deliveryCity?.toLowerCase().includes(cityFilter.toLowerCase())
        );
      }

      // Order type filter
      if (orderTypeFilter) {
        filteredOrders = filteredOrders.filter(
          (order) => order.orderType === orderTypeFilter
        );
      }

      // Date range filter
      if (dateRangeFilter.startDate) {
        const startDate = new Date(dateRangeFilter.startDate);
        filteredOrders = filteredOrders.filter((order) => {
          const orderDate = new Date(order.orderDate || order.createdAt);
          return orderDate >= startDate;
        });
      }
      if (dateRangeFilter.endDate) {
        const endDate = new Date(dateRangeFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        filteredOrders = filteredOrders.filter((order) => {
          const orderDate = new Date(order.orderDate || order.createdAt);
          return orderDate <= endDate;
        });
      }

      // Amount range filter
      if (amountRangeFilter.min) {
        const minAmount = parseFloat(amountRangeFilter.min);
        filteredOrders = filteredOrders.filter(
          (order) => (order.orderAmount || 0) >= minAmount
        );
      }
      if (amountRangeFilter.max) {
        const maxAmount = parseFloat(amountRangeFilter.max);
        filteredOrders = filteredOrders.filter(
          (order) => (order.orderAmount || 0) <= maxAmount
        );
      }

      // Update total count
      setTotalOrdersCount(filteredOrders.length);

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
    },
    [
      searchQuery,
      statusFilter,
      cityFilter,
      orderTypeFilter,
      dateRangeFilter,
      amountRangeFilter,
      currentPage,
      itemsPerPage,
    ]
  );

  // Fetch PostEx orders directly from PostEx API (from second component)
  const fetchPostExOrders = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      console.log("Fetching orders directly from PostEx API using Axios...");

      // Use the exact same API call from the second component with Axios
      const response = await axios.get(
        "https://api.postex.pk/services/integration/api/order/v1/get-all-order",
        {
          headers: {
            token:
              "ZThkODBkYzg4NjBkNDE0YzgxOWUxZGZkM2U0YjNjYjc6ZDk2ZjE5NjBjNzU2NDk3MThmZDc2MmExYTgyYWY5MmY=",
            "Content-Type": "application/json",
          },
          params: {
            orderStatusId: 0, // All orders by default
            startDate: dateRangeFilter.startDate,
            endDate: dateRangeFilter.endDate,
          },
        }
      );

      console.log("Response from PostEx is:", response);
      console.log("Response data:", response.data);
      console.log("Response status:", response.status);

      if (response.status === 200) {
        const data = response.data;
        console.log("PostEx API response data:", data);

        let ordersData = data.dist || [];
        console.log("Orders data from API:", ordersData.length);

        // Map API orders to local format
        const mappedOrders = ordersData.map(mapPostExOrderToLocalFormat);
        console.log("Mapped orders count:", mappedOrders.length);

        // Store all orders
        setAllOrders(mappedOrders);

        // Calculate summary statistics
        const stats = {
          totalOrders: mappedOrders.length,
          totalRevenue: mappedOrders.reduce(
            (sum, order) => sum + (order.orderAmount || 0),
            0
          ),
          pendingOrders: mappedOrders.filter(
            (order) => order.status === "pending"
          ).length,
          deliveredOrders: mappedOrders.filter(
            (order) => order.status === "delivered"
          ).length,
        };
        setSummaryStats(stats);
        console.log("Summary stats calculated:", stats);

        // Apply filters
        if (mappedOrders.length > 0) {
          applyFilters(mappedOrders);
        } else {
          // If no orders, clear the filtered results
          setOrders([]);
          setTotalOrdersCount(0);
          console.log("No orders found, clearing table");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching PostEx orders:", error);

      // More detailed error logging for Axios
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
      }
      console.error("Error config:", error.config);

      setOrders([]);
      setTotalOrdersCount(0);

      let errorMessage = "Failed to load PostEx orders: ";
      if (error.response) {
        errorMessage += `Server responded with status ${error.response.status}`;
        if (error.response.data) {
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.request) {
        errorMessage += "No response received from server";
      } else {
        errorMessage += error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRangeFilter.startDate, dateRangeFilter.endDate, applyFilters]);

  // Reapply filters when filters change
  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilters(allOrders);
    }
  }, [
    searchQuery,
    statusFilter,
    cityFilter,
    orderTypeFilter,
    dateRangeFilter,
    amountRangeFilter,
    currentPage,
    itemsPerPage,
    applyFilters,
    allOrders,
  ]);

  useEffect(() => {
    fetchPostExOrders();
  }, [fetchPostExOrders]);

  const handleRefresh = () => {
    fetchPostExOrders();
  };

  const handleView = (order) => {
    setOpenDropdownId(null); // Close dropdown after action
    // Navigate to detail page with order data
    navigate(`/viewlist/${order._id}`, { state: { order } });
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
    setOpenDropdownId(null); // Close dropdown after action
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      // TODO: Implement actual cancel order API call
      // Example:
      // await api.post(`/postex/orders/${orderToCancel._id}/cancel`);

      toast.success(
        `Order ${orderToCancel.orderReferenceNumber} has been cancelled`
      );
      setShowCancelModal(false);
      setOrderToCancel(null);

      // Refresh the orders list
      fetchPostExOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order. Please try again.");
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const handleViewRemarks = (order) => {
    setOrderForRemarks(order);
    setShowRemarksModal(true);
    setOpenDropdownId(null); // Close dropdown after action
  };

  const handleCloseRemarksModal = () => {
    setShowRemarksModal(false);
    setOrderForRemarks(null);
  };

  // Get remarks for an order (sample data - replace with API call)
  const getOrderRemarks = (order) => {
    // TODO: Replace with actual API call to fetch remarks
    // For now, return sample data
    return [
      {
        id: 1,
        remark: "REFUSED TO RECEIVE",
        userName: "Call Courier",
        date: "2025-11-10",
      },
      {
        id: 2,
        remark: "REDELIVERY AS SOON AS POSSIBLE",
        userName: "Tml Mart",
        date: "2025-11-10",
      },
      {
        id: 3,
        remark: "REFUSED TO RECEIVE",
        userName: "Call Courier",
        date: "2025-11-12",
      },
    ];
  };

  const handleEditRemark = (remark) => {
    // TODO: Implement edit remark functionality
    toast.info(
      `Edit remark functionality for "${remark.remark}" will be implemented`
    );
  };

  // Check if order status is unbooked/pending
  const isUnbookedStatus = (status) => {
    const statusLower = status?.toLowerCase() || "";
    return statusLower.includes("pending") || statusLower.includes("unbooked");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination
  const totalPages = Math.ceil(totalOrdersCount / itemsPerPage);

  if (loading) {
    return <CenteredLoader message="Loading PostEx orders..." size="large" />;
  }

  // Get unique cities for filter
  const uniqueCities = [
    ...new Set(allOrders.map((order) => order.deliveryCity).filter(Boolean)),
  ].sort();

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCityFilter("");
    setOrderTypeFilter("");
    setDateRangeFilter({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
    setAmountRangeFilter({ min: "", max: "" });
    setCurrentPage(1);
  };

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            PostEx Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View all PostEx shipping orders (fetched directly from PostEx API)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
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
              <p className="text-blue-100 text-sm font-medium mb-1">
                Total Orders
              </p>
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
              <p className="text-green-100 text-sm font-medium mb-1">
                Total Revenue
              </p>
              <p className="text-3xl font-bold">
                Rs {summaryStats.totalRevenue.toLocaleString()}
              </p>
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
              <p className="text-yellow-100 text-sm font-medium mb-1">
                Pending Orders
              </p>
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
              <p className="text-emerald-100 text-sm font-medium mb-1">
                Delivered Orders
              </p>
              <p className="text-3xl font-bold">
                {summaryStats.deliveredOrders}
              </p>
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
              {showAdvancedFilters ? "Hide" : "Show"} Advanced
            </button>
            {(searchQuery ||
              statusFilter ||
              cityFilter ||
              orderTypeFilter ||
              dateRangeFilter.startDate ||
              dateRangeFilter.endDate ||
              amountRangeFilter.min ||
              amountRangeFilter.max) && (
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
              {statusOptions.map((status, i) => (
                <option key={i} value={status.label}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
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
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
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
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
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
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }));
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
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }));
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
                    setAmountRangeFilter((prev) => ({
                      ...prev,
                      min: e.target.value,
                    }));
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
                    setAmountRangeFilter((prev) => ({
                      ...prev,
                      max: e.target.value,
                    }));
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.NO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  STATUS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-6 py-8 text-center text-gray-500"
                  >
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
                        {order.orderType || "Normal"}
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
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerContact}
                      </div>
                    </td>
                    {/* WEIGHT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.bookingWeight
                          ? `${order.bookingWeight} kg`
                          : "-"}
                      </div>
                    </td>
                    {/* DELIVERY ADDRESS */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.deliveryAddress || order.deliveryCity || "-"}
                      </div>
                      {order.deliveryCity && order.deliveryAddress && (
                        <div className="text-xs text-gray-500 mt-1">
                          {order.deliveryCity}
                        </div>
                      )}
                    </td>
                    {/* RETURN ADDRESS */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.returnAddress || order.pickupAddress || "-"}
                      </div>
                      {order.returnCity && (
                        <div className="text-xs text-gray-500 mt-1">
                          {order.returnCity}
                        </div>
                      )}
                    </td>
                    {/* ITEMS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items || 1}
                      </div>
                    </td>
                    {/* DETAILS */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.orderDetail ? (
                          <span
                            className="truncate max-w-[150px] block"
                            title={order.orderDetail}
                          >
                            {order.orderDetail}
                          </span>
                        ) : (
                          "NA"
                        )}
                      </div>
                    </td>
                    {/* AMOUNT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Rs {order.orderAmount?.toLocaleString() || "0"}
                      </div>
                    </td>
                    {/* JOURNEY */}
                   
                    {/* STATUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status?.replace("_", " ").toUpperCase() ||
                          "PENDING"}
                      </span>
                    </td>
                    {/* ACTIONS */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative dropdown-container">
                        <button
                          onClick={() =>
                            setOpenDropdownId(
                              openDropdownId === order._id ? null : order._id
                            )
                          }
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openDropdownId === order._id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleView(order)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Detail
                              </button>
                              {isUnbookedStatus(order.status) ? (
                                <button
                                  onClick={() => handleViewRemarks(order)}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  View Remarks
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCancelOrder(order)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
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
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalOrdersCount)}
                  </span>{" "}
                  of <span className="font-medium">{totalOrdersCount}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
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
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
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
                <h2 className="text-2xl font-bold text-gray-900">
                  PostEx Order Details
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Reference Number:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.orderReferenceNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Order Type:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.orderType}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Order Date:
                      </span>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedOrder.orderDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Order Amount:
                      </span>
                      <p className="text-sm text-gray-900 font-semibold">
                        Rs {selectedOrder.orderAmount?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Status:
                      </span>
                      <p className="text-sm">
                        <span
                          className={`px-2 py-1 rounded-full ${getStatusColor(
                            selectedOrder.status
                          )}`}
                        >
                          {selectedOrder.status
                            ?.replace("_", " ")
                            .toUpperCase() || "PENDING"}
                        </span>
                      </p>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Tracking Number:
                        </span>
                        <p className="text-sm text-blue-600 font-semibold">
                          {selectedOrder.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Customer Name:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.customerName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Contact:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.customerContact}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Delivery City:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.deliveryCity}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Delivery Address:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Shipping Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Items:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.items}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Airway Bill Copies:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.airwayBillCopies}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Booking Weight:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.bookingWeight
                          ? `${selectedOrder.bookingWeight} kg`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Pickup City:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.pickupCity}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Pickup Address:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.pickupAddress}
                      </p>
                    </div>
                    {selectedOrder.returnCity && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Return City:
                        </span>
                        <p className="text-sm text-gray-900">
                          {selectedOrder.returnCity}
                        </p>
                      </div>
                    )}
                    {selectedOrder.returnAddress && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Return Address:
                        </span>
                        <p className="text-sm text-gray-900">
                          {selectedOrder.returnAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedOrder.orderDetail || selectedOrder.notes) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Additional Information
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.orderDetail && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Order Detail:
                          </span>
                          <p className="text-sm text-gray-900">
                            {selectedOrder.orderDetail}
                          </p>
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Notes:
                          </span>
                          <p className="text-sm text-gray-900">
                            {selectedOrder.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Created: {formatDate(selectedOrder.createdAt)} by{" "}
                  {selectedOrder.createdBy?.firstName ||
                    selectedOrder.createdBy?.email ||
                    "N/A"}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Cancel Order
                </h2>
                <button
                  onClick={handleCloseCancelModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to cancel the order?
                </p>
                {orderToCancel && (
                  <p className="text-sm text-gray-500 mt-2">
                    Order Reference:{" "}
                    <span className="font-semibold">
                      {orderToCancel.orderReferenceNumber}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCloseCancelModal}
                  className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Remarks Modal */}
      {showRemarksModal && orderForRemarks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  View Remarks
                </h2>
                <button
                  onClick={handleCloseRemarksModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Remarks Table */}
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        REMARKS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        USER NAME
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        DATE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Edit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getOrderRemarks(orderForRemarks).length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No remarks available
                        </td>
                      </tr>
                    ) : (
                      getOrderRemarks(orderForRemarks).map((remark) => (
                        <tr key={remark.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {remark.remark}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {remark.userName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {remark.date}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleEditRemark(remark)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit Remark"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCloseRemarksModal}
                  className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PostExOrders;
