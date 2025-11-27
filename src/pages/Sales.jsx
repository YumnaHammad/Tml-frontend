import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Download,
  Package,
  RotateCcw,
  ArrowRight,
  X,
  List,
  Eye,
  Edit,
  Trash2,
  Table2,
  Phone,
} from "lucide-react";
import CenteredLoader from "../components/CenteredLoader";
import { useLocation, useNavigate } from "react-router-dom";
import SalesFormPage from "./forms/SalesFormPage";
import api from "../services/api";
import ExportButton from "../components/ExportButton";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [newlyAddedSaleId, setNewlyAddedSaleId] = useState(null);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalDelivered: 0,
    totalReturns: 0,
    totalRevenue: 0,
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmSale, setConfirmSale] = useState(null);
  // View and Edit modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingSaleId, setEditingSaleId] = useState(null);
  // Duplicate phone numbers modal state
  const [showDuplicatePhoneModal, setShowDuplicatePhoneModal] = useState(false);
  const [duplicatePhones, setDuplicatePhones] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [timeFilter, setTimeFilter] = useState("day"); // all, day, week, month - default to 'day' (today)
  const [sortFilter, setSortFilter] = useState("newest"); // newest, oldest, amount_high, amount_low, status
  const [selectedDate, setSelectedDate] = useState(""); // For calendar date picker
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'list' or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState(""); // Search filter for phone number, CN number, and agent name
  const [totalSalesCount, setTotalSalesCount] = useState(0); // Total sales count from server
  const [selectedSales, setSelectedSales] = useState([]); // Array of sale IDs for bulk actions
  const selectAllCheckboxRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user role for access control

  // Fetch sales data with server-side pagination
  const fetchSales = async () => {
    try {
      setRefreshing(true);
      // When searching OR "All Time" is selected, show ALL results (no pagination limit)
      // Otherwise, use normal pagination
      const isSearching = searchTerm.trim().length > 0;
      const isAllTime = timeFilter === "all";
      const showAllResults = isSearching || isAllTime;

      const pageSize = showAllResults ? 10000 : itemsPerPage; // Show all results when searching or "All Time"
      const params = new URLSearchParams({
        page: showAllResults ? "1" : currentPage.toString(), // Always page 1 when showing all results
        limit: pageSize.toString(),
      });

      // Add search to backend if provided
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      // Add time filter to backend
      if (timeFilter !== "all") {
        const now = new Date();
        let startDate;

        switch (timeFilter) {
          case "day":
            // For "today", set both start and end date to today's range
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            startDate.setHours(0, 0, 0, 0);
            const todayEndDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            todayEndDate.setHours(23, 59, 59, 999);
            params.append("startDate", startDate.toISOString());
            params.append("endDate", todayEndDate.toISOString());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            params.append("startDate", startDate.toISOString());
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            params.append("startDate", startDate.toISOString());
            break;
          case "90days":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            params.append("startDate", startDate.toISOString());
            break;
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            params.append("startDate", startDate.toISOString());
            break;
          case "custom":
            if (selectedDate) {
              startDate = new Date(selectedDate);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(selectedDate);
              endDate.setHours(23, 59, 59, 999);
              params.append("startDate", startDate.toISOString());
              params.append("endDate", endDate.toISOString());
            }
            break;
          default:
            break;
        }

        // Only append startDate if it wasn't already appended (for day and custom cases)
        if (timeFilter !== "custom" && timeFilter !== "day" && startDate) {
          params.append("startDate", startDate.toISOString());
        }
      }

      const response = await api.get(`/sales?${params.toString()}`);
      let salesData = response.data?.salesOrders || [];
      const totalFromServer = response.data?.total || 0;

      // Check for temporary sales in localStorage (newly created ones)
      const tempSales = JSON.parse(localStorage.getItem("tempSales") || "[]");
      if (tempSales.length > 0) {
        // Merge temporary sales with API data, avoiding duplicates
        const apiSaleIds = new Set(salesData.map((s) => s._id));
        const newTempSales = tempSales.filter((s) => !apiSaleIds.has(s._id));
        salesData = [...newTempSales, ...salesData];

        // Clear temporary sales after merging
        localStorage.removeItem("tempSales");
      }

      // Apply client-side sorting based on sortFilter
      const sortedSales = [...salesData].sort((a, b) => {
        switch (sortFilter) {
          case "newest":
            return (
              new Date(b.orderDate || b.createdAt || b._id) -
              new Date(a.orderDate || a.createdAt || a._id)
            );
          case "oldest":
            return (
              new Date(a.orderDate || a.createdAt || a._id) -
              new Date(b.orderDate || b.createdAt || b._id)
            );
          case "amount_high":
            return (b.totalAmount || 0) - (a.totalAmount || 0);
          case "amount_low":
            return (a.totalAmount || 0) - (b.totalAmount || 0);
          case "status":
            return (a.status || "").localeCompare(b.status || "");
          default:
            return (
              new Date(b.orderDate || b.createdAt || b._id) -
              new Date(a.orderDate || a.createdAt || a._id)
            );
        }
      });

      // Always use real data from API, even if empty
      setSales(sortedSales);

      // For stats, we need to fetch aggregated data separately for accuracy
      // For now, calculate from current page (approximate) or fetch stats endpoint if available
      // Note: For large datasets, stats should come from separate aggregation endpoint
      const stats = {
        totalSales: totalFromServer || salesData.length,
        // For delivered/returns/revenue, approximate from current page or use aggregation
        totalDelivered: salesData.filter(
          (sale) =>
            sale.status === "delivered" || sale.status === "confirmed_delivered"
        ).length,
        totalReturns: salesData.filter(
          (sale) =>
            sale.status === "returned" || sale.status === "expected_return"
        ).length,
        totalRevenue: salesData
          .filter(
            (sale) =>
              sale.status !== "returned" &&
              sale.status !== "expected_return" &&
              sale.status !== "cancelled"
          )
          .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      };

      // Store total for pagination
      setTotalSalesCount(totalFromServer);

      setSalesStats(stats);
    } catch (error) {
      console.error("Error fetching sales:", error);

      // Show empty state instead of dummy data
      setSales([]);
      setSalesStats({
        totalSales: 0,
        totalDelivered: 0,
        totalReturns: 0,
        totalRevenue: 0,
      });

      toast.error("Failed to load sales orders. Please check your connection.");

      /* Removed dummy data - using real API data only
      const dummySales = [
        {
          _id: '1',
          orderNumber: 'SO-0001',
          customerId: { name: 'ABC Corporation' },
          customerName: 'ABC Corporation',
          items: [
            { productId: { name: 'Laptop Dell XPS 13' }, quantity: 2, unitPrice: 95000, totalPrice: 190000 },
            { productId: { name: 'Wireless Mouse' }, quantity: 2, unitPrice: 3500, totalPrice: 7000 }
          ],
          totalAmount: 197000,
          status: 'delivered',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          notes: 'Corporate order for new employees',
          paymentMethod: 'Bank Transfer'
        },
        {
          _id: '2',
          orderNumber: 'SO-0002',
          customerId: { name: 'XYZ Tech Solutions' },
          customerName: 'XYZ Tech Solutions',
          items: [
            { productId: { name: 'Office Chair' }, quantity: 5, unitPrice: 18000, totalPrice: 90000 },
            { productId: { name: 'Desk Lamp' }, quantity: 5, unitPrice: 4500, totalPrice: 22500 }
          ],
          totalAmount: 112500,
          status: 'delivered',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          notes: 'Office setup for new branch',
          paymentMethod: 'Credit Card'
        },
        {
          _id: '3',
          orderNumber: 'SO-0003',
          customerId: { name: 'Startup Inc' },
          customerName: 'Startup Inc',
          items: [
            { productId: { name: 'Monitor 24" LED' }, quantity: 3, unitPrice: 28000, totalPrice: 84000 },
            { productId: { name: 'Keyboard Mechanical' }, quantity: 3, unitPrice: 9500, totalPrice: 28500 }
          ],
          totalAmount: 112500,
          status: 'shipped',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
          deliveryDate: null,
          notes: 'Equipment for startup office',
          paymentMethod: 'Online Payment'
        },
        {
          _id: '4',
          orderNumber: 'SO-0004',
          customerId: { name: 'Individual Customer' },
          customerName: 'Ahmed Ali',
          items: [
            { productId: { name: 'A4 Paper (500 sheets)' }, quantity: 10, unitPrice: 1000, totalPrice: 10000 },
            { productId: { name: 'Blue Pens (Box of 12)' }, quantity: 5, unitPrice: 1500, totalPrice: 7500 },
            { productId: { name: 'Notebooks (A5)' }, quantity: 8, unitPrice: 600, totalPrice: 4800 }
          ],
          totalAmount: 22300,
          status: 'delivered',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          notes: 'Personal office supplies',
          paymentMethod: 'Cash on Delivery'
        },
        {
          _id: '5',
          orderNumber: 'SO-0005',
          customerId: { name: 'Green Office Ltd' },
          customerName: 'Green Office Ltd',
          items: [
            { productId: { name: 'Disinfectant Spray' }, quantity: 8, unitPrice: 1500, totalPrice: 12000 },
            { productId: { name: 'Paper Towels (Pack of 12)' }, quantity: 4, unitPrice: 2200, totalPrice: 8800 }
          ],
          totalAmount: 20800,
          status: 'returned',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
          deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          notes: 'Returned due to damaged packaging',
          paymentMethod: 'Bank Transfer'
        },
        {
          _id: '6',
          orderNumber: 'SO-0006',
          customerId: { name: 'Tech Hub' },
          customerName: 'Tech Hub',
          items: [
            { productId: { name: 'Laptop Dell XPS 13' }, quantity: 1, unitPrice: 95000, totalPrice: 95000 },
            { productId: { name: 'Office Chair' }, quantity: 1, unitPrice: 18000, totalPrice: 18000 },
            { productId: { name: 'Monitor 24" LED' }, quantity: 1, unitPrice: 28000, totalPrice: 28000 }
          ],
          totalAmount: 141000,
          status: 'pending',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
          deliveryDate: null,
          notes: 'Complete workstation setup',
          paymentMethod: 'Bank Transfer'
        },
        {
          _id: '7',
          orderNumber: 'SO-0007',
          customerId: { name: 'Home Office Solutions' },
          customerName: 'Home Office Solutions',
          items: [
            { productId: { name: 'Wireless Mouse' }, quantity: 15, unitPrice: 3500, totalPrice: 52500 },
            { productId: { name: 'Keyboard Mechanical' }, quantity: 15, unitPrice: 9500, totalPrice: 142500 }
          ],
          totalAmount: 195000,
          status: 'delivered',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
          deliveryDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
          notes: 'Bulk order for home office packages',
          paymentMethod: 'Credit Card'
        }
      ];
      
      setSales(dummySales);
      
      // Calculate stats from dummy data
      const stats = {
        totalSales: dummySales.length,
        totalDelivered: dummySales.filter(sale => sale.status === 'delivered' || sale.status === 'confirmed_delivered').length,
        totalReturns: dummySales.filter(sale => sale.status === 'returned').length,
        totalRevenue: dummySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      };
      
      setSalesStats(stats);
      */ // End of dummy data comment
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Check for temporary sales on component mount
  useEffect(() => {
    const tempSales = JSON.parse(localStorage.getItem("tempSales") || "[]");
    if (tempSales.length > 0) {
      // Add temporary sales to the current state
      setSales((prev) => {
        const existingIds = new Set(prev.map((s) => s._id));
        const newSales = tempSales.filter((s) => !existingIds.has(s._id));
        if (newSales.length > 0) {
          // Update stats
          setSalesStats((prevStats) => {
            const newStats = { ...prevStats };
            newSales.forEach((sale) => {
              newStats.totalSales += 1;
              newStats.totalDelivered +=
                sale.status === "delivered" ||
                sale.status === "confirmed_delivered"
                  ? 1
                  : 0;
              newStats.totalReturns += sale.status === "returned" ? 1 : 0;
              newStats.totalRevenue += sale.totalAmount || 0;
            });
            return newStats;
          });

          // Highlight the most recent sale
          if (newSales[0]) {
            setNewlyAddedSaleId(newSales[0]._id);
            setTimeout(() => setNewlyAddedSaleId(null), 3000);
          }

          return [...newSales, ...prev];
        }
        return prev;
      });

      // Clear temporary sales after adding to state
      localStorage.removeItem("tempSales");
    }
  }, []);

  // Refresh data when navigating back from sales form
  useEffect(() => {
    if (location.state?.refresh) {
      fetchSales();
      // Clear the refresh state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Refetch when page, search, or time filter changes
  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, timeFilter, selectedDate]);

  // Removed auto-refresh to prevent UI disturbance

  // Handle card clicks
  const handleCardClick = (cardType) => {
    // Future: Add navigation to detailed views
  };

  // Filter sales by time period
  const getFilteredSales = () => {
    let filteredSales = sales;

    // Note: Search filter is now handled server-side when searchTerm is provided
    // Client-side search is only used when server-side pagination is not active

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date();
      let filterDate;

      switch (timeFilter) {
        case "day":
          filterDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "90days":
          filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          filterDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "custom":
          // Handle custom date selection
          if (selectedDate) {
            const selected = new Date(selectedDate);
            const startOfDay = new Date(
              selected.getFullYear(),
              selected.getMonth(),
              selected.getDate()
            );
            const endOfDay = new Date(
              selected.getFullYear(),
              selected.getMonth(),
              selected.getDate() + 1
            );
            filteredSales = sales.filter((sale) => {
              const saleDate = new Date(sale.createdAt);
              return saleDate >= startOfDay && saleDate < endOfDay;
            });
            return filteredSales;
          }
          break;
        default:
          break;
      }

      if (timeFilter !== "custom") {
        filteredSales = sales.filter(
          (sale) => new Date(sale.createdAt) >= filterDate
        );
      }
    }

    // Apply sort filter
    const sortedSales = [...filteredSales].sort((a, b) => {
      switch (sortFilter) {
        case "newest":
          return (
            new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
          );
        case "oldest":
          return (
            new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id)
          );
        case "amount_high":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amount_low":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return (
            new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
          );
      }
    });

    return sortedSales;
  };

  // When "All Time" is selected or searching, sales state contains ALL results from server
  // Otherwise, apply client-side time filters (for day, week, month, etc.)
  let filteredSales = sales;
  const isAllTime = timeFilter === "all";
  const isSearching = searchTerm.trim().length > 0;

  // Only apply client-side time filters if not "All Time" and not searching
  // (Backend handles time filters when searching, but we still need client-side for non-search)
  if (!isAllTime && !isSearching) {
    // Apply client-side time filter
    const now = new Date();
    let filterDate;

    switch (timeFilter) {
      case "day":
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredSales = sales.filter((sale) => {
          const saleDate = new Date(sale.orderDate || sale.createdAt);
          return saleDate >= filterDate;
        });
        break;
      case "week":
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredSales = sales.filter((sale) => {
          const saleDate = new Date(sale.orderDate || sale.createdAt);
          return saleDate >= filterDate;
        });
        break;
      case "month":
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredSales = sales.filter((sale) => {
          const saleDate = new Date(sale.orderDate || sale.createdAt);
          return saleDate >= filterDate;
        });
        break;
      case "90days":
        filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredSales = sales.filter((sale) => {
          const saleDate = new Date(sale.orderDate || sale.createdAt);
          return saleDate >= filterDate;
        });
        break;
      case "year":
        filterDate = new Date(now.getFullYear(), 0, 1);
        filteredSales = sales.filter((sale) => {
          const saleDate = new Date(sale.orderDate || sale.createdAt);
          return saleDate >= filterDate;
        });
        break;
      case "custom":
        if (selectedDate) {
          const selected = new Date(selectedDate);
          const startOfDay = new Date(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate()
          );
          const endOfDay = new Date(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate() + 1
          );
          filteredSales = sales.filter((sale) => {
            const saleDate = new Date(sale.orderDate || sale.createdAt);
            return saleDate >= startOfDay && saleDate < endOfDay;
          });
        }
        break;
      default:
        break;
    }

    // Apply client-side sorting
    filteredSales = [...filteredSales].sort((a, b) => {
      switch (sortFilter) {
        case "newest":
          return (
            new Date(b.orderDate || b.createdAt || b._id) -
            new Date(a.orderDate || a.createdAt || a._id)
          );
        case "oldest":
          return (
            new Date(a.orderDate || a.createdAt || a._id) -
            new Date(b.orderDate || b.createdAt || b._id)
          );
        case "amount_high":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amount_low":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return (
            new Date(b.orderDate || b.createdAt || b._id) -
            new Date(a.orderDate || a.createdAt || a._id)
          );
      }
    });
  } else {
    // Always respect the selected sort order, even when showing all results
    filteredSales = [...sales].sort((a, b) => {
      switch (sortFilter) {
        case "newest":
          return (
            new Date(b.orderDate || b.createdAt || b._id) -
            new Date(a.orderDate || a.createdAt || a._id)
          );
        case "oldest":
          return (
            new Date(a.orderDate || a.createdAt || a._id) -
            new Date(b.orderDate || b.createdAt || b._id)
          );
        case "amount_high":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amount_low":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return (
            new Date(b.orderDate || b.createdAt || b._id) -
            new Date(a.orderDate || a.createdAt || a._id)
          );
      }
    });
  }

  // When "All Time" or searching, show ALL results (no pagination)
  // Otherwise, use pagination
  const currentSales = filteredSales;
  const showPagination = !isAllTime && !isSearching;
  const totalPages = showPagination
    ? Math.ceil((totalSalesCount || filteredSales.length) / itemsPerPage)
    : 1;

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, sortFilter, selectedDate]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    if (newFilter !== "custom") {
      setSelectedDate(""); // Clear selected date when switching to other filters
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setTimeFilter("custom");
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortFilter(newSort);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchSales();
  };

  // Fetch duplicate phone numbers
  const fetchDuplicatePhones = async () => {
    try {
      setLoadingDuplicates(true);
      const response = await api.get(
        "/sales/check-duplicate-phones?limit=2000"
      );
      setDuplicatePhones(response.data.duplicates || []);
      setShowDuplicatePhoneModal(true);
      if (response.data.duplicates.length === 0) {
        toast.success("No duplicate phone numbers found!");
      } else {
        toast.success(
          `Found ${response.data.duplicates.length} duplicate phone numbers`
        );
      }
    } catch (error) {
      console.error("Error fetching duplicate phone numbers:", error);
      toast.error("Failed to fetch duplicate phone numbers");
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Export sales data - exports ALL filtered/search results
  const handleExportSales = async (format = "excel") => {
    const { exportSales } = await import("../utils/exportUtils");
    // filteredSales contains ALL search results when searching, or all filtered results when not searching
    const dataToExport = filteredSales.length > 0 ? filteredSales : sales;
    const filename = searchTerm.trim()
      ? `sales-search-${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, "-")}`
      : "sales";
    return exportSales(dataToExport, format, filename);
  };

  // Confirmation handlers
  const showConfirmation = (sale, action) => {
    setConfirmSale(sale);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction || !confirmSale) return;

    try {
      if (confirmAction === "returnReceived") {
        // Handle return received logic
        const loadingToast = toast.loading("Processing return...");

        const expectedReturnsRes = await api.get("/expected-returns");
        const expectedReturn = expectedReturnsRes.data.expectedReturns?.find(
          (er) =>
            (er.salesOrderId && (er.salesOrderId._id || er.salesOrderId)) ===
              confirmSale._id && er.status === "pending"
        );

        if (expectedReturn) {
          await api.post(`/expected-returns/${expectedReturn._id}/receive`);

          toast.dismiss(loadingToast);
          toast.success("Return received! Stock added back to warehouse ✅", {
            duration: 5000,
          });

          fetchSales();
        } else {
          toast.dismiss(loadingToast);
          toast.error(
            "Expected return record not found. Please use Expected Returns page."
          );
        }
      } else {
        // Handle regular status change
        await handleStatusChange(confirmSale._id, confirmAction);
      }
    } catch (error) {
      console.error("Error processing action:", error);
      toast.error(error.response?.data?.error || "Failed to process action");
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmSale(null);
    }
  };

  // Update QC status
  const handleQCStatusUpdate = async (saleId, qcStatus) => {
    let loadingToast;
    try {
      loadingToast = toast.loading(`Updating QC status to ${qcStatus}...`);

      const response = await api.put(`/sales/${saleId}/qc-status`, {
        qcStatus,
      });

      // Update local state
      setSales((prevSales) =>
        prevSales.map((sale) =>
          sale._id === saleId ? { ...sale, qcStatus: qcStatus } : sale
        )
      );

      toast.dismiss(loadingToast);
      toast.success(`QC status updated to ${qcStatus}!`);

      fetchSales(); // Refresh to get updated data
    } catch (error) {
      console.error("Error updating QC status:", error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update QC status";
      toast.error(errorMessage);
    }
  };

  // Bulk QC status update
  const handleBulkQCStatusUpdate = async (qcStatus) => {
    if (selectedSales.length === 0) {
      toast.error("Please select at least one sale to update");
      return;
    }

    let loadingToast;
    try {
      loadingToast = toast.loading(`Updating QC status for ${selectedSales.length} sale(s) to ${qcStatus}...`);
      
      // Update all selected sales
      const updatePromises = selectedSales.map(saleId =>
        api.put(`/sales/${saleId}/qc-status`, { qcStatus })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setSales((prevSales) =>
        prevSales.map((sale) =>
          selectedSales.includes(sale._id) ? { ...sale, qcStatus: qcStatus } : sale
        )
      );
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully updated ${selectedSales.length} sale(s) to ${qcStatus}!`);
      
      setSelectedSales([]); // Clear selection
      fetchSales(); // Refresh to get updated data
    } catch (error) {
      console.error("Error updating bulk QC status:", error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update QC status";
      toast.error(errorMessage);
    }
  };

  // Handle checkbox selection
  const handleSelectSale = (saleId) => {
    setSelectedSales(prev => {
      if (prev.includes(saleId)) {
        return prev.filter(id => id !== saleId);
      } else {
        return [...prev, saleId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSales.length === currentSales.length) {
      setSelectedSales([]);
    } else {
      const allSaleIds = currentSales.map(sale => sale._id);
      setSelectedSales(allSaleIds);
    }
  };

  // Check if all sales are selected
  const allSelected = currentSales.length > 0 && selectedSales.length === currentSales.length;
  const someSelected = selectedSales.length > 0 && selectedSales.length < currentSales.length;

  // Set indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Change sales status
  const handleStatusChange = async (saleId, newStatus) => {
    let loadingToast;
    try {
      loadingToast = toast.loading(`Updating status to ${newStatus}...`);

      const response = await api.patch(`/sales/${saleId}/status`, {
        status: newStatus,
      });

      // Update local state
      setSales((prevSales) =>
        prevSales.map((sale) =>
          sale._id === saleId ? { ...sale, status: newStatus } : sale
        )
      );

      toast.dismiss(loadingToast);

      // Show special message based on status
      if (newStatus === "expected_return") {
        const warehouseName = response.data.warehouseName || "warehouse";
        toast.success(`Added to Expected Returns in ${warehouseName}! 📦`, {
          duration: 5000,
          icon: "⏳",
        });
      } else if (newStatus === "returned") {
        const warehouseName = response.data.warehouseName || "warehouse";
        toast.success(`Return confirmed! Stock added to ${warehouseName}! ✅`, {
          duration: 5000,
          icon: "🔄",
        });
      } else if (newStatus === "confirmed_delivered") {
        toast.success(
          `Order confirmed as delivered! Items moved to confirmed delivered column in warehouse! ✅`,
          {
            duration: 5000,
            icon: "✓",
          }
        );
      } else {
        toast.success(`Status updated to ${newStatus}!`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        saleId,
        newStatus,
      });

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update status";
      toast.error(errorMessage);
    }
  };

  // Handle View Sale
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowViewModal(true);
  };

  // Handle Edit Sale
  const handleEditSale = (sale) => {
    setEditingSaleId(sale._id);
    navigate(`/sales/edit/${sale._id}`);
  };

  // Handle Delete Sale
  const handleDeleteSale = async (saleId) => {
    try {
      const loadingToast = toast.loading("Deleting sales order...");

      await api.delete(`/sales/${saleId}`);

      toast.dismiss(loadingToast);
      toast.success("Sales order deleted successfully!");

      // Refresh sales list
      fetchSales();
    } catch (error) {
      console.error("Error deleting sales order:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to delete sales order";
      toast.error(errorMessage);
    }
  };

  // Generate and download delivery note
  const handleDownloadDeliveryNote = async (sale) => {
    let loadingToast;
    try {
      loadingToast = toast.loading("Generating delivery note...");

      // Import jsPDF
      const jsPDF = (await import("jspdf")).default;

      // Import autoTable plugin - this extends jsPDF prototype
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Verify autoTable is available
      if (typeof doc.autoTable !== "function") {
        console.error("autoTable not available on jsPDF instance");
        throw new Error(
          "PDF generation library not loaded properly. Please refresh the page."
        );
      }

      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Blue color
      doc.text("DELIVERY NOTE", 105, 20, { align: "center" });

      // Horizontal line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);

      // Order Information
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Order Number: ${sale.orderNumber || "N/A"}`, 20, 35);
      doc.text(
        `Order Date: ${
          sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "N/A"
        }`,
        20,
        42
      );
      doc.text(`Status: ${(sale.status || "pending").toUpperCase()}`, 20, 49);

      // Customer Information
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Customer Information:", 20, 60);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        `Name: ${sale.customerInfo?.name || sale.customerName || "N/A"}`,
        20,
        67
      );
      doc.text(`Email: ${sale.customerInfo?.email || "N/A"}`, 20, 74);
      doc.text(`Phone: ${sale.customerInfo?.phone || "N/A"}`, 20, 81);

      // Delivery Address
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Delivery Address:", 20, 92);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      const deliveryAddr = sale.deliveryAddress || {};
      doc.text(`${deliveryAddr.street || "N/A"}`, 20, 99);
      doc.text(
        `${deliveryAddr.city || "N/A"}, ${deliveryAddr.state || "N/A"} ${
          deliveryAddr.zipCode || ""
        }`,
        20,
        106
      );
      doc.text(`${deliveryAddr.country || "N/A"}`, 20, 113);

      // Items Table
      const tableData =
        sale.items?.map((item) => {
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const quantity = parseInt(item.quantity) || 0;
          const total = quantity * unitPrice;

          return [
            item.productId?.name || item.productName || "Unknown Product",
            item.variantName || "-",
            quantity,
            `PKR ${unitPrice.toFixed(2)}`,
            `PKR ${total.toFixed(2)}`,
          ];
        }) || [];

      doc.autoTable({
        startY: 125,
        head: [["Product", "Variant", "Quantity", "Unit Price", "Total"]],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });

      // Total
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(
        `Total Amount: PKR ${sale.totalAmount?.toLocaleString() || "0"}`,
        20,
        finalY
      );

      // Notes
      if (sale.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text("Notes:", 20, finalY + 10);
        doc.setFont(undefined, "normal");
        doc.text(sale.notes, 20, finalY + 17, { maxWidth: 170 });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Thank you for your business!", 105, 280, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, {
        align: "center",
      });

      // Save PDF
      doc.save(`Delivery-Note-${sale.orderNumber}.pdf`);

      toast.dismiss(loadingToast);
      toast.success("Delivery note downloaded!");
    } catch (error) {
      console.error("Error generating delivery note:", error);
      console.error("Error details:", error.message);
      console.error("Sale data:", sale);

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.error(`Failed to generate delivery note: ${error.message}`);
    }
  };

  if (loading) {
    return <CenteredLoader message="Loading sales..." size="large" />;
  }

  const isNew = location.pathname === "/sales/new";
  if (isNew) {
    return (
      <div className="max-w-3xl mx-auto">
        <SalesFormPage
          onSuccess={(newSale) => {
            // Add the new sale to state immediately
            setSales((prev) => [newSale, ...prev]);

            // Highlight the newly added sale
            setNewlyAddedSaleId(newSale._id);

            // Clear highlight after 3 seconds
            setTimeout(() => setNewlyAddedSaleId(null), 3000);

            // Update stats immediately
            setSalesStats((prev) => ({
              totalSales: prev.totalSales + 1,
              totalDelivered:
                prev.totalDelivered +
                (newSale.status === "delivered" ||
                newSale.status === "confirmed_delivered"
                  ? 1
                  : 0),
              totalReturns:
                prev.totalReturns + (newSale.status === "returned" ? 1 : 0),
              totalRevenue: prev.totalRevenue + (newSale.totalAmount || 0),
            }));

            navigate("/sales");
          }}
        />
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        {/* Title Section - Full width on mobile */}
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Sales Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your sales and orders
          </p>
        </div>

        {/* Controls Section - Full width on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* View Toggle - Hidden for agents */}
          {user?.role !== "agent" && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="List View"
              >
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">
                  List
                </span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <Table2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">
                  Table
                </span>
              </button>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
            title="Refresh sales from database"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 sm:mr-2 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={fetchDuplicatePhones}
            disabled={loadingDuplicates}
            className="flex items-center px-3 py-1.5 sm:py-2 text-orange-600 hover:text-orange-900 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
            title="Check for duplicate phone numbers"
          >
            <Phone
              className={`h-4 w-4 mr-1 sm:mr-2 ${
                loadingDuplicates ? "animate-pulse" : ""
              }`}
            />
            <span className="hidden sm:inline">Duplicates</span>
          </button>
          {/* Export Button - Hidden for agents */}
          {user?.role !== "agent" && (
            <ExportButton
              data={filteredSales}
              filename={
                searchTerm.trim()
                  ? `sales-search-${searchTerm
                      .trim()
                      .replace(/[^a-zA-Z0-9]/g, "-")}`
                  : "sales"
              }
              title={
                searchTerm.trim()
                  ? `Sales Report - Search: ${searchTerm.trim()}`
                  : "Sales Report"
              }
              exportFunction={handleExportSales}
              variant="default"
              buttonText="Export"
            />
          )}
          <button
            className="btn-primary flex items-center flex-1 sm:flex-initial justify-center"
            onClick={() => navigate("/sales/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Sales Order</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards - Hidden for agents */}
      {user?.role !== "agent" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleCardClick("total")}
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-lg mr-4">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesStats.totalSales}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleCardClick("delivered")}
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-lg mr-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesStats.totalDelivered}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleCardClick("returns")}
          >
            <div className="flex items-center">
              <div className="p-3 bg-red-500 rounded-lg mr-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Returns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesStats.totalReturns}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleCardClick("revenue")}
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-lg mr-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  PKR {salesStats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search Filter */}
      <div className="mt-6 mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by phone, CN, agent, or product name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sales Records Section */}
      <div className="card p-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Sales Records (
            {searchTerm.trim()
              ? `${filteredSales.length} of ${totalSalesCount}`
              : `${filteredSales.length} of ${
                  totalSalesCount || sales.length
                }`}{" "}
            total)
          </h2>
          <div className="flex items-center space-x-4 flex-wrap">
            {user?.role !== "agent" && selectedSales.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkQCStatusUpdate("approved")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve QC ({selectedSales.length})
                </button>
                <button
                  onClick={() => handleBulkQCStatusUpdate("rejected")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Reject QC ({selectedSales.length})
                </button>
              </>
            )}
            <select
              value={sortFilter}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              title="Sort by"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount (High to Low)</option>
              <option value="amount_low">Amount (Low to High)</option>
              <option value="status">By Status</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              title="Filter by time"
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date</option>
            </select>
            {timeFilter === "custom" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                title="Select specific date"
                max={new Date().toISOString().split("T")[0]} // Don't allow future dates
              />
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh sales data"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No sales found</p>
            <p className="text-gray-400 text-sm mt-2">
              {timeFilter === "all"
                ? "Start by creating your first sales order to see real data"
                : timeFilter === "custom"
                ? `No sales found for ${
                    selectedDate
                      ? new Date(selectedDate).toLocaleDateString()
                      : "the selected date"
                  }`
                : `No sales found for the selected ${timeFilter} period`}
            </p>
            <button
              onClick={() => navigate("/sales/new")}
              className="btn-primary mt-4"
            >
              Create Your First Sales Order
            </button>
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              // Table View
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {user?.role !== "agent" && (
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              ref={selectAllCheckboxRef}
                              checked={allSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sale Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          System Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ minWidth: "250px", width: "300px" }}
                        >
                          Customer Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        {/* CN Number column - Visible to all roles */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CN Number
                        </th>
                        {/* Status column - Hidden for agents */}
                        {user?.role !== "agent" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        )}
                        {/* QC Status column - Hidden for agents */}
                        {user?.role !== "agent" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            QC Status
                          </th>
                        )}
                        {/* Workflow Actions column - Hidden for agents */}
                        {user?.role !== "agent" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Workflow Actions
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentSales.map((sale) => (
                        <tr key={sale._id} className="hover:bg-gray-50">
                          {/* CHECKBOX */}
                          {user?.role !== "agent" && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={selectedSales.includes(sale._id)}
                                onChange={() => handleSelectSale(sale._id)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            </td>
                          )}
                          {/* Order Number */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {sale.orderNumber}
                            </div>
                          </td>

                          {/* Sale Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {sale.orderDate
                                ? new Date(sale.orderDate).toLocaleString()
                                : "-"}
                            </div>
                          </td>

                          {/* System Timestamp */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {sale.timestamp
                                ? new Date(sale.timestamp).toLocaleString()
                                : sale.createdAt
                                ? new Date(sale.createdAt).toLocaleString()
                                : "-"}
                            </div>
                          </td>

                          {/* Customer Name */}
                          <td
                            className="px-6 py-4"
                            style={{ maxWidth: "150px", width: "150px" }}
                          >
                            <div
                              className="text-sm text-gray-900 break-words overflow-hidden text-ellipsis"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={
                                sale.customerName ||
                                sale.customerInfo?.name ||
                                "N/A"
                              }
                            >
                              {sale.customerName ||
                                sale.customerInfo?.name ||
                                "N/A"}
                            </div>
                          </td>

                          {/* Phone Number */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {sale.customerInfo?.phone || "-"}
                            </div>
                          </td>

                          {/* Agent Name */}
                          <td
                            className="px-6 py-4"
                            style={{ maxWidth: "150px", width: "150px" }}
                          >
                            <div
                              className="text-sm text-gray-900 break-words overflow-hidden text-ellipsis line-clamp-2"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={
                                sale.agentName ||
                                sale.agent_name ||
                                sale.createdBy?.firstName ||
                                sale.createdBy?.email ||
                                "-"
                              }
                            >
                              {sale.agentName ||
                                sale.agent_name ||
                                sale.createdBy?.firstName ||
                                sale.createdBy?.email ||
                                "-"}
                            </div>
                          </td>

                          {/* Product Name */}
                          <td
                            className="px-6 py-4"
                            style={{ maxWidth: "200px", width: "200px" }}
                          >
                            <div className="text-sm text-gray-900">
                              {sale.items && sale.items.length > 0 ? (
                                sale.items.slice(0, 3).map((item, idx) => {
                                  const productName =
                                    item.productId?.name || "Unknown";
                                  const variantName = item.variantName
                                    ? ` - ${item.variantName}`
                                    : "";
                                  const fullProductName =
                                    productName + variantName;

                                  return (
                                    <div key={idx}>
                                      {idx > 0 && (
                                        <hr className="my-2 border-gray-300" />
                                      )}
                                      <div
                                        className="text-sm text-gray-600 mb-1 break-words overflow-hidden text-ellipsis"
                                        style={{
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                        title={fullProductName}
                                      >
                                        {fullProductName}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              {sale.items?.length > 3 && (
                                <div className="text-sm text-gray-500 mt-1">
                                  +{sale.items.length - 3} more
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {sale.items && sale.items.length > 0 ? (
                                sale.items.slice(0, 3).map((item, idx) => {
                                  return (
                                    <div key={idx}>
                                      {idx > 0 && (
                                        <hr className="my-2 border-gray-300" />
                                      )}
                                      <div className="text-sm text-gray-600 mb-1">
                                        {item.quantity}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              {sale.items?.length > 3 && (
                                <div className="text-sm text-gray-500 mt-1">
                                  -
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              Rs {sale.totalAmount?.toLocaleString() || "0"}
                            </div>
                          </td>

                          {/* Customer Address */}
                          <td
                            className="px-6 py-4"
                            style={{ maxWidth: "250px", width: "250px" }}
                          >
                            <div className="text-sm text-gray-900">
                              {sale.deliveryAddress ? (
                                <>
                                  {sale.deliveryAddress.street && (
                                    <div
                                      className="break-words overflow-hidden text-ellipsis"
                                      style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                      title={sale.deliveryAddress.street}
                                    >
                                      {sale.deliveryAddress.street}
                                    </div>
                                  )}
                                  {sale.deliveryAddress.city && (
                                    <div
                                      className="text-xs text-gray-600 break-words overflow-hidden text-ellipsis"
                                      style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                      title={sale.deliveryAddress.city}
                                    >
                                      {sale.deliveryAddress.city}
                                    </div>
                                  )}
                                  {sale.deliveryAddress.country && (
                                    <div className="text-xs text-gray-600">
                                      {sale.deliveryAddress.country}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>

                          {/* Notes */}
                          <td
                            className="px-6 py-4"
                            style={{ maxWidth: "150px", width: "150px" }}
                          >
                            <div
                              className="text-sm text-gray-900 break-words overflow-hidden text-ellipsis"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={sale.notes || "-"}
                            >
                              {sale.notes || "-"}
                            </div>
                          </td>

                          {/* CN Number - Visible to all roles */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {sale.trackingNumber || "-"}
                            </div>
                          </td>

                          {/* Status - Hidden for agents */}
                          {user?.role !== "agent" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  sale.status === "delivered"
                                    ? "bg-green-100 text-green-800"
                                    : sale.status === "confirmed_delivered"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sale.status === "returned"
                                    ? "bg-red-100 text-red-800"
                                    : sale.status === "expected_return"
                                    ? "bg-purple-100 text-purple-800"
                                    : sale.status === "dispatched" ||
                                      sale.status === "dispatch"
                                    ? "bg-blue-100 text-blue-800"
                                    : sale.status === "confirmed"
                                    ? "bg-cyan-100 text-cyan-800"
                                    : sale.status === "cancelled"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {sale.status === "expected_return"
                                  ? "Expected Return"
                                  : sale.status === "confirmed_delivered"
                                  ? "Confirmed Delivered"
                                  : sale.status || "Pending"}
                              </span>
                            </td>
                          )}

                          {/* QC Status - Hidden for agents */}
                          {user?.role !== "agent" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {sale.qcStatus ? (
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    sale.qcStatus === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : sale.qcStatus === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {sale.qcStatus}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          )}

                          {/* Workflow Actions - Hidden for agents */}
                          {user?.role !== "agent" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {/* QC Buttons - Only show for admin and manager, not for agents */}
                                {user?.role !== "agent" &&
                                  sale.status === "pending" &&
                                  sale.qcStatus !== "rejected" && (
                                    <>
                                      {(!sale.qcStatus ||
                                        sale.qcStatus === "pending") && (
                                        <>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleQCStatusUpdate(
                                                sale._id,
                                                "approved"
                                              );
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                            title="Approve QC"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            QC Approved
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleQCStatusUpdate(
                                                sale._id,
                                                "rejected"
                                              );
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                            title="Reject QC"
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            QC Reject
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                {/* Dispatch Button - Only show for admin and manager, not for agents */}
                                {user?.role !== "agent" &&
                                  (sale.status === "pending" ||
                                    sale.status === "confirmed") &&
                                  sale.qcStatus === "approved" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showConfirmation(sale, "dispatch");
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                      title="Mark as Dispatched"
                                    >
                                      <Truck className="w-3 h-3 mr-1" />
                                      Dispatch
                                    </button>
                                  )}

                                {/* Delivered Button - Only for admin and manager, not for agents */}
                                {user?.role !== "agent" &&
                                  (sale.status === "dispatch" ||
                                    sale.status === "dispatched") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showConfirmation(sale, "delivered");
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                      title="Mark as Delivered"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Delivered
                                    </button>
                                  )}

                                {/* Confirm Delivered and Expected Return - Only for admin and manager, not for agents */}
                                {user?.role !== "agent" &&
                                  sale.status === "delivered" && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          showConfirmation(
                                            sale,
                                            "confirmed_delivered"
                                          );
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                        title="Confirm Delivered - Move to confirmed delivered column in warehouse"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Confirm Delivered
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          showConfirmation(
                                            sale,
                                            "expected_return"
                                          );
                                        }}
                                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                        title="Mark as Expected Return - Product will appear in Expected Returns module"
                                      >
                                        <Clock className="w-3 h-3 mr-1" />
                                        Expected Return
                                      </button>
                                    </>
                                  )}

                                {/* Return Received - Only for admin and manager, not for agents */}
                                {user?.role !== "agent" &&
                                  sale.status === "expected_return" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showConfirmation(
                                          sale,
                                          "returnReceived"
                                        );
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                      title="Confirm that return has been received back to warehouse"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Return Received
                                    </button>
                                  )}

                                {sale.qcStatus === "rejected" && (
                                  <span className="text-xs text-red-600 font-medium">
                                    QC Rejected
                                  </span>
                                )}

                                {sale.status === "confirmed_delivered" && (
                                  <span className="text-xs text-green-600 font-medium">
                                    Confirmed Delivered
                                  </span>
                                )}

                                {sale.status === "returned" && (
                                  <span className="text-xs text-green-600 font-medium">
                                    Return Completed
                                  </span>
                                )}

                                {sale.status !== "pending" &&
                                  sale.status !== "dispatch" &&
                                  sale.status !== "dispatched" &&
                                  sale.status !== "delivered" &&
                                  sale.status !== "expected_return" &&
                                  sale.qcStatus !== "pending" &&
                                  sale.qcStatus !== "approved" &&
                                  sale.qcStatus !== "rejected" && (
                                    <span className="text-xs text-gray-400">
                                      -
                                    </span>
                                  )}
                              </div>
                            </td>
                          )}

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSale(sale);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors flex-shrink-0"
                                title="View Sales Order Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit button - Only for admin and manager, not for agents - Always enabled but order details are read-only */}
                              {user?.role !== "agent" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSale(sale);
                                  }}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white p-1.5 rounded transition-colors flex-shrink-0"
                                  title="Edit Sales Order (Order details are read-only)"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete button - Only for admin and manager, not for agents - Hide after dispatch or QC reject */}
                              {user?.role !== "agent" &&
                                (sale.status === "pending" ||
                                  sale.status === "confirmed") &&
                                sale.qcStatus !== "rejected" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        window.confirm(
                                          `Are you sure you want to delete ${sale.orderNumber}? This action cannot be undone.`
                                        )
                                      ) {
                                        handleDeleteSale(sale._id);
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition-colors flex-shrink-0"
                                    title="Delete Sales Order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // List View
              <div className="space-y-3 sm:space-y-4">
                {currentSales.map((sale) => (
                  <motion.div
                    key={sale._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-300 ${
                      newlyAddedSaleId === sale._id
                        ? "border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {sale.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sale.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : sale.status === "confirmed_delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : sale.status === "returned"
                                ? "bg-red-100 text-red-800"
                                : sale.status === "expected_return"
                                ? "bg-purple-100 text-purple-800"
                                : sale.status === "dispatched" ||
                                  sale.status === "dispatch"
                                ? "bg-blue-100 text-blue-800"
                                : sale.status === "confirmed"
                                ? "bg-cyan-100 text-cyan-800"
                                : sale.status === "cancelled"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {sale.status === "expected_return"
                              ? "Expected Return"
                              : sale.status === "confirmed_delivered"
                              ? "Confirmed Delivered"
                              : sale.status}
                          </span>
                        </div>
                        {/* View, Edit, Delete Buttons - Left Side */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSale(sale);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                            title="View Sales Order Details"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                          {/* Edit button - Only for admin and manager, not for agents - Always enabled but order details are read-only */}
                          {user?.role !== "agent" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSale(sale);
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                              title="Edit Sales Order (Order details are read-only)"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                          )}
                          {/* Delete button - Only for admin and manager, not for agents - Hide after dispatch or QC reject */}
                          {user?.role !== "agent" &&
                            (sale.status === "pending" ||
                              sale.status === "confirmed") &&
                            sale.qcStatus !== "rejected" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete ${sale.orderNumber}? This action cannot be undone.`
                                    )
                                  ) {
                                    handleDeleteSale(sale._id);
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                title="Delete Sales Order"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">
                                Sale:{" "}
                                {sale.orderDate
                                  ? new Date(sale.orderDate).toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-[11px] sm:text-xs text-gray-500">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">
                                System:{" "}
                                {sale.timestamp
                                  ? new Date(sale.timestamp).toLocaleString()
                                  : sale.createdAt
                                  ? new Date(sale.createdAt).toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {sale.items?.length || 0} items
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium truncate">
                              Rs {sale.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {sale.status === "delivered" ? (
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-600 flex-shrink-0" />
                            ) : sale.status === "returned" ? (
                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-red-600 flex-shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-600 flex-shrink-0" />
                            )}
                            <span className="capitalize truncate">
                              {sale.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-3">
                          <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                            Items:
                          </p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {sale.items?.slice(0, 3).map((item, index) => {
                              const productName =
                                item.productId?.name || "Unknown Product";
                              const variantName = item.variantName
                                ? ` - ${item.variantName}`
                                : "";
                              const displayName = `${productName}${variantName}`;

                              return (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded-full text-xs truncate max-w-[200px]"
                                  title={`${displayName} (x${item.quantity})`}
                                >
                                  {displayName} (x{item.quantity})
                                </span>
                              );
                            })}
                            {sale.items?.length > 3 && (
                              <span className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-xs whitespace-nowrap">
                                +{sale.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right min-w-0 flex-shrink-0 sm:ml-4 mt-3 sm:mt-0">
                        <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                          Customer:{" "}
                          {sale.customerName ||
                            sale.customerInfo?.name ||
                            sale.customerId?.name ||
                            "Unknown"}
                        </div>
                        <div className="text-xs text-gray-400 mb-2 sm:mb-4">
                          {sale.deliveryDate
                            ? `Delivered: ${new Date(
                                sale.deliveryDate
                              ).toLocaleDateString()}`
                            : "Not delivered yet"}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
                          {/* Return Button - Only for admin and manager, not for agents */}
                          {user?.role !== "agent" &&
                            sale.status === "expected_return" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirmation(sale, "returnReceived");
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                title="Confirm that return has been received back to warehouse"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Return Received
                              </button>
                            )}

                          {/* QC Buttons - Only show for admin and manager, not for agents */}
                          {user?.role !== "agent" &&
                            sale.status === "pending" &&
                            sale.qcStatus !== "rejected" && (
                              <>
                                {(!sale.qcStatus ||
                                  sale.qcStatus === "pending") && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQCStatusUpdate(
                                          sale._id,
                                          "approved"
                                        );
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                      title="Approve QC"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      QC Approved
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQCStatusUpdate(
                                          sale._id,
                                          "rejected"
                                        );
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                      title="Reject QC"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      QC Reject
                                    </button>
                                  </>
                                )}
                              </>
                            )}

                          {/* Dispatch Button - Only show for admin and manager, not for agents */}
                          {user?.role !== "agent" &&
                            (sale.status === "pending" ||
                              sale.status === "confirmed") &&
                            sale.qcStatus === "approved" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirmation(sale, "dispatch");
                                }}
                                className="btn-primary flex items-center text-xs px-2 py-1 whitespace-nowrap"
                                title="Mark as Dispatched"
                              >
                                <Truck className="w-3 h-3 mr-1" />
                                Dispatch
                              </button>
                            )}

                          {/* Delivered Button - Only for admin and manager, not for agents */}
                          {user?.role !== "agent" &&
                            (sale.status === "dispatch" ||
                              sale.status === "dispatched") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirmation(sale, "delivered");
                                }}
                                className="btn-success flex items-center text-xs px-2 py-1 whitespace-nowrap"
                                title="Mark as Delivered"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Delivered
                              </button>
                            )}

                          {/* Confirm Delivered and Expected Return - Only for admin and manager, not for agents */}
                          {user?.role !== "agent" &&
                            sale.status === "delivered" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showConfirmation(
                                      sale,
                                      "confirmed_delivered"
                                    );
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                                  title="Confirm Delivered - Move to confirmed delivered column in warehouse"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirm Delivered
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showConfirmation(sale, "expected_return");
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors"
                                  title="Mark as Expected Return - Product will appear in Expected Returns module"
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Expected Return
                                </button>
                              </>
                            )}

                          {sale.status === "confirmed_delivered" && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                              Confirmed Delivered
                            </div>
                          )}

                          {sale.status === "returned" && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                              Return Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination Controls - Only show when not "All Time" and not searching */}
        {showPagination &&
          totalPages > 1 &&
          !loading &&
          filteredSales.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {(() => {
                      const start = (currentPage - 1) * itemsPerPage + 1;
                      const total = totalSalesCount || filteredSales.length;
                      const end = Math.min(currentPage * itemsPerPage, total);
                      return (
                        <>
                          Showing{" "}
                          <span className="font-medium">
                            {total === 0 ? 0 : start}
                          </span>{" "}
                          to <span className="font-medium">{end}</span> of{" "}
                          <span className="font-medium">{total}</span> results
                        </>
                      );
                    })()}
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 &&
                          pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNumber
                                ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return (
                          <span
                            key={pageNumber}
                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction === "dispatch" && "Confirm Dispatch"}
                {confirmAction === "delivered" && "Confirm Delivery"}
                {confirmAction === "confirmed_delivered" && "Confirm Delivered"}
                {confirmAction === "expected_return" &&
                  "Confirm Expected Return"}
                {confirmAction === "returnReceived" &&
                  "Confirm Return Received"}
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {confirmAction === "dispatch" &&
                  `Are you sure you want to dispatch order ${confirmSale?.orderNumber}? This will reserve stock in warehouse.`}
                {confirmAction === "delivered" &&
                  `Are you sure you want to mark order ${confirmSale?.orderNumber} as delivered?`}
                {confirmAction === "confirmed_delivered" &&
                  `Are you sure you want to confirm delivery for order ${confirmSale?.orderNumber}? This will move items to the confirmed delivered column in warehouse and disable the Expected Return option.`}
                {confirmAction === "expected_return" &&
                  `Are you sure you want to mark order ${confirmSale?.orderNumber} as expected return? This will add it to the Expected Returns module.`}
                {confirmAction === "returnReceived" &&
                  `Are you sure you want to confirm that the return for order ${confirmSale?.orderNumber} has been received back to warehouse?`}
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 ${
                    confirmAction === "returnReceived"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  }`}
                >
                  {confirmAction === "dispatch" && "Dispatch Order"}
                  {confirmAction === "delivered" && "Mark as Delivered"}
                  {confirmAction === "confirmed_delivered" &&
                    "Confirm Delivered"}
                  {confirmAction === "expected_return" &&
                    "Mark as Expected Return"}
                  {confirmAction === "returnReceived" && "Confirm Return"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Sales Order Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                Sales Order Details - {selectedSale.orderNumber}
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Order Number
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedSale.orderNumber}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </h4>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSale.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : selectedSale.status === "confirmed_delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedSale.status === "returned"
                        ? "bg-red-100 text-red-800"
                        : selectedSale.status === "expected_return"
                        ? "bg-purple-100 text-purple-800"
                        : selectedSale.status === "dispatched" ||
                          selectedSale.status === "dispatch"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedSale.status}
                  </span>
                  {selectedSale.qcStatus && (
                    <span
                      className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        selectedSale.qcStatus === "approved"
                          ? "bg-green-100 text-green-800"
                          : selectedSale.qcStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      QC: {selectedSale.qcStatus}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Order Date
                  </h4>
                  <p className="text-gray-900">
                    {selectedSale.orderDate
                      ? new Date(selectedSale.orderDate).toLocaleDateString()
                      : new Date(selectedSale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Total Amount
                  </h4>
                  <p className="text-lg font-semibold text-green-600">
                    Rs {selectedSale.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 mb-1">
                      Name
                    </h5>
                    <p className="text-gray-900">
                      {selectedSale.customerName ||
                        selectedSale.customerInfo?.name ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 mb-1">
                      Phone
                    </h5>
                    <p className="text-gray-900">
                      {selectedSale.customerInfo?.phone ||
                        selectedSale.customerPhone ||
                        "N/A"}
                    </p>
                  </div>
                  {selectedSale.customerInfo?.cnNumber && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">
                        Tracking Number
                      </h5>
                      <p className="text-gray-900">
                        {selectedSale.customerInfo.cnNumber}
                      </p>
                    </div>
                  )}
                  {selectedSale.agentName && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">
                        Agent Name
                      </h5>
                      <p className="text-gray-900">{selectedSale.agentName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              {selectedSale.deliveryAddress && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Delivery Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSale.deliveryAddress.street && (
                      <div className="md:col-span-2">
                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                          Street
                        </h5>
                        <p className="text-gray-900">
                          {selectedSale.deliveryAddress.street}
                        </p>
                      </div>
                    )}
                    {selectedSale.deliveryAddress.city && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                          City
                        </h5>
                        <p className="text-gray-900">
                          {selectedSale.deliveryAddress.city}
                        </p>
                      </div>
                    )}
                    {selectedSale.deliveryAddress.country && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                          Country
                        </h5>
                        <p className="text-gray-900">
                          {selectedSale.deliveryAddress.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Order Items
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Variant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.productId?.name || "Unknown Product"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.variantName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Rs {item.unitPrice?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            Rs{" "}
                            {(item.quantity * item.unitPrice).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"
                        >
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                          Rs {selectedSale.totalAmount?.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedSale.notes && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">
                    Notes
                  </h4>
                  <p className="text-gray-700">{selectedSale.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditSale(selectedSale);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Phone Numbers Modal */}
      {showDuplicatePhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Duplicate Phone Numbers
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Found {duplicatePhones.length} phone number(s) with multiple
                  orders
                </p>
              </div>
              <button
                onClick={() => setShowDuplicatePhoneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingDuplicates ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">
                    Loading duplicate phone numbers...
                  </span>
                </div>
              ) : duplicatePhones.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No duplicate phone numbers found!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {duplicatePhones.map((duplicate, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Phone className="h-5 w-5 text-orange-600" />
                            <h4 className="text-lg font-semibold text-gray-900">
                              {duplicate.phoneNumber}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                duplicate.isSameCustomer
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {duplicate.isSameCustomer
                                ? "Same Customer"
                                : `${duplicate.uniqueCustomers} Different Customers`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {duplicate.message}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">
                                Total Orders:
                              </span>
                              <span className="ml-2 font-semibold text-gray-900">
                                {duplicate.totalOrders}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Total Amount:
                              </span>
                              <span className="ml-2 font-semibold text-green-600">
                                Rs {duplicate.totalAmount?.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg Order:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                Rs{" "}
                                {Math.round(
                                  duplicate.averageOrderAmount
                                )?.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Customers:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                {duplicate.uniqueCustomers}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customers List */}
                      {duplicate.customers &&
                        duplicate.customers.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Customers:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {duplicate.customers.map((customer, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                                >
                                  {customer.name} ({customer.orderCount} orders)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Orders List */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">
                          Orders:
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Order #
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Customer
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Date
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Amount
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Agent
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {duplicate.orders.map((order, orderIdx) => (
                                <tr key={orderIdx} className="hover:bg-gray-50">
                                  <td
                                    className="px-3 py-2 text-sm font-medium text-blue-600 cursor-pointer"
                                    onClick={() => {
                                      const sale = sales.find(
                                        (s) =>
                                          s.orderNumber === order.orderNumber
                                      );
                                      if (sale) {
                                        setSelectedSale(sale);
                                        setShowDuplicatePhoneModal(false);
                                        setShowViewModal(true);
                                      }
                                    }}
                                  >
                                    {order.orderNumber}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {order.customerName}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {new Date(
                                      order.timestamp
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-semibold text-green-600">
                                    Rs {order.totalAmount?.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        order.status === "delivered"
                                          ? "bg-green-100 text-green-800"
                                          : order.status ===
                                            "confirmed_delivered"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : order.status === "returned"
                                          ? "bg-red-100 text-red-800"
                                          : order.status === "expected_return"
                                          ? "bg-purple-100 text-purple-800"
                                          : order.status === "dispatched" ||
                                            order.status === "dispatch"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {order.agentName || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDuplicatePhoneModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
