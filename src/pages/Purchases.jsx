import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Package, DollarSign, Calendar, Clock, Filter, RefreshCw, FileText, Receipt, CheckCircle, AlertCircle, Grid3X3, List, Table2, X, Search, Eye } from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PurchaseFormPage from './forms/PurchaseFormPage';
import api from '../services/api';
import ExportButton from '../components/ExportButton';
import { generateDocument } from '../utils/documentGenerator';
import ReceiptGenerator from '../components/ReceiptGenerator';
import toast from 'react-hot-toast';

const Purchases = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [newlyAddedPurchaseId, setNewlyAddedPurchaseId] = useState(null);
  const [purchaseStats, setPurchaseStats] = useState({
    totalPurchases: 0,
    totalItems: 0,
    totalValue: user?.role === 'admin' ? 0 : null // Hide financial data for managers
  });
  const [timeFilter, setTimeFilter] = useState('day'); // all, day, week, month - default to 'day' (today)
  const [sortFilter, setSortFilter] = useState('newest'); // newest, oldest, amount_high, amount_low, status
  const [selectedDate, setSelectedDate] = useState(''); // For calendar date picker
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table'); // 'grid', 'list', or 'table'
  const [searchTerm, setSearchTerm] = useState(''); // Search filter for supplier name, phone, purchase number
  const [totalPurchasesCount, setTotalPurchasesCount] = useState(0); // Total purchases count from server
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch purchases data with server-side pagination
  const fetchPurchases = async () => {
    try {
      setRefreshing(true);
      // When searching OR "All Time" is selected, show ALL results (no pagination limit)
      // Otherwise, use normal pagination
      const isSearching = searchTerm.trim().length > 0;
      const isAllTime = timeFilter === 'all';
      const showAllResults = isSearching || isAllTime;
      
      const pageSize = showAllResults ? 10000 : itemsPerPage; // Show all results when searching or "All Time"
      const params = new URLSearchParams({
        page: showAllResults ? '1' : currentPage.toString(), // Always page 1 when showing all results
        limit: pageSize.toString()
      });
      
      // Add search to backend if provided
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      // Add time filter to backend
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (timeFilter) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case 'custom':
            if (selectedDate) {
              startDate = new Date(selectedDate);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(selectedDate);
              endDate.setHours(23, 59, 59, 999);
              params.append('startDate', startDate.toISOString());
              params.append('endDate', endDate.toISOString());
            }
            break;
          default:
            break;
        }
        
        if (timeFilter !== 'custom' && startDate) {
          params.append('startDate', startDate.toISOString());
        }
      }
      
      const response = await api.get(`/purchases?${params.toString()}`);
      let purchasesData = response.data?.purchases || [];
      const totalFromServer = response.data?.total || 0;
      
      // Check for temporary purchases in localStorage (newly created ones)
      const tempPurchases = JSON.parse(localStorage.getItem('tempPurchases') || '[]');
      if (tempPurchases.length > 0) {
        // Merge temporary purchases with API data, avoiding duplicates
        const apiPurchaseIds = new Set(purchasesData.map(p => p._id));
        const newTempPurchases = tempPurchases.filter(p => !apiPurchaseIds.has(p._id));
        purchasesData = [...newTempPurchases, ...purchasesData];
        
        // Clear temporary purchases after merging
        localStorage.removeItem('tempPurchases');
      }
      
      // Apply client-side sorting based on sortFilter
      const sortedPurchases = [...purchasesData].sort((a, b) => {
        switch (sortFilter) {
          case 'newest':
            return new Date(b.purchaseDate || b.createdAt || b._id) - new Date(a.purchaseDate || a.createdAt || a._id);
          case 'oldest':
            return new Date(a.purchaseDate || a.createdAt || a._id) - new Date(b.purchaseDate || b.createdAt || b._id);
          case 'amount_high':
            return (b.totalAmount || 0) - (a.totalAmount || 0);
          case 'amount_low':
            return (a.totalAmount || 0) - (b.totalAmount || 0);
          case 'status':
            return (a.status || '').localeCompare(b.status || '');
          default:
            return new Date(b.purchaseDate || b.createdAt || b._id) - new Date(a.purchaseDate || a.createdAt || a._id);
        }
      });
      
      // Always use real data from API, even if empty
      setPurchases(sortedPurchases);
      
      // Store total for pagination
      setTotalPurchasesCount(totalFromServer);
      
      // Calculate stats from real data (will be 0 if no purchases)
      const stats = {
        totalPurchases: totalFromServer || purchasesData.length,
        totalItems: purchasesData.reduce((sum, purchase) => 
          sum + (purchase.items ? purchase.items.reduce((itemSum, item) => itemSum + item.quantity, 0) : 0), 0),
        totalValue: user?.role === 'admin' ? purchasesData.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0) : null
      };
      
      setPurchaseStats(stats);
      
    } catch (error) {
      console.error('Error fetching purchases:', error);
      
      // Set empty state if API fails
      setPurchases([]);
      setPurchaseStats({
        totalPurchases: 0,
        totalItems: 0,
        totalValue: 0
      });
      
      // Show error message to user
      toast.error('Failed to load purchases from database. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load dummy data for demonstration
  const loadDummyData = () => {
    const dummyPurchases = [
        {
          _id: '1',
          purchaseNumber: 'PUR-0001',
          supplierId: { name: 'Tech Supplies Ltd' },
          items: [
            { productId: { name: 'Laptop Dell XPS 13' }, quantity: 5, unitPrice: 85000, totalPrice: 425000 },
            { productId: { name: 'Wireless Mouse' }, quantity: 10, unitPrice: 2500, totalPrice: 25000 }
          ],
          totalAmount: 450000,
          status: 'received',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          receivedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          notes: 'Bulk order for office setup',
          paymentMethod: 'Bank Transfer'
        },
        {
          _id: '2',
          purchaseNumber: 'PUR-0002',
          supplierId: { name: 'Office Furniture Co' },
          items: [
            { productId: { name: 'Office Chair' }, quantity: 15, unitPrice: 15000, totalPrice: 225000 },
            { productId: { name: 'Desk Lamp' }, quantity: 20, unitPrice: 3500, totalPrice: 70000 }
          ],
          totalAmount: 295000,
          status: 'received',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          receivedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
          notes: 'Furniture for new office space',
          paymentMethod: 'Credit Card'
        },
        {
          _id: '3',
          purchaseNumber: 'PUR-0003',
          supplierId: { name: 'Stationery World' },
          items: [
            { productId: { name: 'A4 Paper (500 sheets)' }, quantity: 50, unitPrice: 800, totalPrice: 40000 },
            { productId: { name: 'Blue Pens (Box of 12)' }, quantity: 25, unitPrice: 1200, totalPrice: 30000 },
            { productId: { name: 'Notebooks (A5)' }, quantity: 30, unitPrice: 500, totalPrice: 15000 }
          ],
          totalAmount: 85000,
          status: 'received',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          receivedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          notes: 'Monthly stationery restock',
          paymentMethod: 'Cash'
        },
        {
          _id: '4',
          purchaseNumber: 'PUR-0004',
          supplierId: { name: 'Tech Supplies Ltd' },
          items: [
            { productId: { name: 'Monitor 24" LED' }, quantity: 8, unitPrice: 25000, totalPrice: 200000 },
            { productId: { name: 'Keyboard Mechanical' }, quantity: 8, unitPrice: 8000, totalPrice: 64000 }
          ],
          totalAmount: 264000,
          status: 'received',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          receivedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
          notes: 'Equipment for new employees',
          paymentMethod: 'Bank Transfer'
        },
        {
          _id: '5',
          purchaseNumber: 'PUR-0005',
          supplierId: { name: 'Cleaning Supplies Inc' },
          items: [
            { productId: { name: 'Disinfectant Spray' }, quantity: 20, unitPrice: 1200, totalPrice: 24000 },
            { productId: { name: 'Paper Towels (Pack of 12)' }, quantity: 10, unitPrice: 1800, totalPrice: 18000 },
            { productId: { name: 'Trash Bags Large' }, quantity: 15, unitPrice: 900, totalPrice: 13500 }
          ],
          totalAmount: 55500,
          status: 'received',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
          receivedDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days ago
          notes: 'Office cleaning supplies',
          paymentMethod: 'Cash'
        }
      ];
      
      setPurchases(dummyPurchases);
      
      // Calculate stats from dummy data
      const stats = {
        totalPurchases: dummyPurchases.length,
        totalItems: dummyPurchases.reduce((sum, purchase) => 
          sum + purchase.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        totalValue: dummyPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
      };
      
      setPurchaseStats(stats);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Check for temporary purchases on component mount
  useEffect(() => {
    const tempPurchases = JSON.parse(localStorage.getItem('tempPurchases') || '[]');
    if (tempPurchases.length > 0) {
      // Add temporary purchases to the current state
      setPurchases(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const newPurchases = tempPurchases.filter(p => !existingIds.has(p._id));
        if (newPurchases.length > 0) {
          // Update stats
          setPurchaseStats(prevStats => {
            const newStats = { ...prevStats };
            newPurchases.forEach(purchase => {
              newStats.totalPurchases += 1;
              newStats.totalItems += purchase.items ? 
                purchase.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
              newStats.totalValue += purchase.totalAmount || 0;
            });
            return newStats;
          });
          
          // Highlight the most recent purchase
          if (newPurchases[0]) {
            setNewlyAddedPurchaseId(newPurchases[0]._id);
            setTimeout(() => setNewlyAddedPurchaseId(null), 3000);
          }
          
          return [...newPurchases, ...prev];
        }
        return prev;
      });
      
      // Clear temporary purchases after adding to state
      localStorage.removeItem('tempPurchases');
    }
  }, []);

  // Refresh data when navigating back from purchase form
  useEffect(() => {
    if (location.state?.refresh) {
      // If we have the new purchase data, add it to state immediately
      if (location.state.newPurchase) {
        const newPurchase = location.state.newPurchase;
        setPurchases(prev => [newPurchase, ...prev]);
        
        // Highlight the newly added purchase
        setNewlyAddedPurchaseId(newPurchase._id);
        
        // Clear highlight after 3 seconds
        setTimeout(() => setNewlyAddedPurchaseId(null), 3000);
        
        // Update stats immediately
        setPurchaseStats(prev => ({
          totalPurchases: prev.totalPurchases + 1,
          totalItems: prev.totalItems + (newPurchase.items ? 
            newPurchase.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
          totalValue: prev.totalValue + (newPurchase.totalAmount || 0)
        }));
        
        // Show success toast if not already shown
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.success(`Purchase ${newPurchase.purchaseNumber} added successfully!`, {
            duration: 3000
          });
        }
      } else {
        // Fallback to fetching all data
      fetchPurchases();
      }
      
      // Clear the refresh state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Removed auto-refresh to prevent UI disturbance

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    if (newFilter !== 'custom') {
      setSelectedDate(''); // Clear selected date when switching to other filters
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setTimeFilter('custom');
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortFilter(newSort);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchPurchases();
  };

  // When "All Time" is selected or searching, purchases state contains ALL results from server
  // Otherwise, apply client-side time filters (for day, week, month, etc.)
  let filteredPurchases = purchases;
  const isAllTime = timeFilter === 'all';
  const isSearching = searchTerm.trim().length > 0;
  
  // Only apply client-side time filters if not "All Time" and not searching
  if (!isAllTime && !isSearching) {
    // Apply client-side time filter
    const now = new Date();
    let filterDate;
    
    switch (timeFilter) {
      case 'day':
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
          return purchaseDate >= filterDate;
        });
        break;
      case 'week':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
          return purchaseDate >= filterDate;
        });
        break;
      case 'month':
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
          return purchaseDate >= filterDate;
        });
        break;
      case '90days':
        filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
          return purchaseDate >= filterDate;
        });
        break;
      case 'year':
        filterDate = new Date(now.getFullYear(), 0, 1);
        filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
          return purchaseDate >= filterDate;
        });
        break;
      case 'custom':
        if (selectedDate) {
          const selected = new Date(selectedDate);
          const startOfDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
          const endOfDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 1);
          filteredPurchases = purchases.filter(purchase => {
            const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
            return purchaseDate >= startOfDay && purchaseDate < endOfDay;
          });
        }
        break;
      default:
        break;
    }
    
    // Apply client-side sorting
    filteredPurchases = [...filteredPurchases].sort((a, b) => {
      switch (sortFilter) {
        case 'newest':
          return new Date(b.purchaseDate || b.createdAt || b._id) - new Date(a.purchaseDate || a.createdAt || a._id);
        case 'oldest':
          return new Date(a.purchaseDate || a.createdAt || a._id) - new Date(b.purchaseDate || b.createdAt || b._id);
        case 'amount_high':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_low':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return new Date(b.purchaseDate || b.createdAt || b._id) - new Date(a.purchaseDate || a.createdAt || a._id);
      }
    });
  } else {
    // For "All Time" or when searching, sorting is already applied in fetchPurchases
    filteredPurchases = purchases;
  }
  
  // When "All Time" or searching, show ALL results (no pagination)
  // Otherwise, use pagination
  const showPagination = !isAllTime && !isSearching;
  const totalPages = showPagination ? Math.ceil((totalPurchasesCount || filteredPurchases.length) / itemsPerPage) : 1;
  const indexOfLastItem = showPagination ? currentPage * itemsPerPage : filteredPurchases.length;
  const indexOfFirstItem = showPagination ? indexOfLastItem - itemsPerPage : 0;
  const currentPurchases = showPagination ? filteredPurchases.slice(indexOfFirstItem, indexOfLastItem) : filteredPurchases;

  // Refetch when page, search, or time filter changes
  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, timeFilter, selectedDate]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, sortFilter, selectedDate, searchTerm]);

  // Export purchases data - exports ALL filtered/search results
  const handleExportPurchases = async (format = 'excel') => {
    try {
      // filteredPurchases contains ALL search results when searching, or all filtered results when not searching
      const dataToExport = filteredPurchases.length > 0 ? filteredPurchases : purchases;
      const { exportPurchases } = await import('../utils/exportUtils');
      const filename = searchTerm.trim() 
        ? `purchases-search-${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, '-')}` 
        : 'purchases';
      const result = exportPurchases(dataToExport, format, filename);
      return result;
    } catch (error) {
      console.error('Export error in handleExportPurchases:', error);
      return { success: false, error: error.message };
    }
  };

  // Generate invoice for purchase
  const handleGenerateInvoice = async (purchaseId) => {
    try {
      const response = await api.post(`/purchases/${purchaseId}/invoice`);
      
      if (response.data.success) {
        toast.success('Invoice generated successfully!');
        fetchPurchases(); // Refresh the list
      }
    } catch (error) {
      console.error('Generate invoice error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate invoice');
    }
  };

  // Mark payment as cleared
  const handleMarkPaymentCleared = async (purchaseId) => {
    try {
      const response = await api.post(`/purchases/${purchaseId}/clear-payment`);
      
      if (response.data.success) {
        toast.success('Payment cleared and stock updated successfully!');
        fetchPurchases(); // Refresh the list
      }
    } catch (error) {
      console.error('Mark payment cleared error:', error);
      toast.error(error.response?.data?.error || 'Failed to clear payment');
    }
  };

  // Download invoice/receipt
  const handleDownloadDocument = async (purchaseId, type = 'invoice', format = 'pdf') => {
    try {
      const purchase = purchases.find(p => p._id === purchaseId);
      if (!purchase) {
        toast.error('Purchase not found');
        return;
      }

      if (type === 'receipt') {
        const doc = ReceiptGenerator.generatePurchaseReceipt(purchase, purchase.supplierId);
        doc.save(`receipt_${purchase.purchaseNumber}.pdf`);
        toast.success('Receipt downloaded successfully');
      } else {
        // Use the new invoice generator to match receipt design
        const doc = ReceiptGenerator.generateInvoice(purchase, purchase.supplierId);
        doc.save(`invoice_${purchase.purchaseNumber}.pdf`);
        toast.success('Invoice downloaded successfully');
      }
    } catch (error) {
      console.error('Download document error:', error);
      toast.error(error.response?.data?.error || `Failed to download ${type}`);
    }
  };

  if (loading) {
    return <CenteredLoader message="Loading purchases..." size="large" />;
  }

  const isNew = location.pathname === '/purchases/new';
  if (isNew) {
    return (
      <div className="max-w-3xl mx-auto">
        <PurchaseFormPage 
          onSuccess={(newPurchase) => {
            // Add the new purchase to state immediately
            setPurchases(prev => [newPurchase, ...prev]);
            
            // Highlight the newly added purchase
            setNewlyAddedPurchaseId(newPurchase._id);
            
            // Clear highlight after 3 seconds
            setTimeout(() => setNewlyAddedPurchaseId(null), 3000);
            
            // Update stats immediately
            setPurchaseStats(prev => ({
              totalPurchases: prev.totalPurchases + 1,
              totalItems: prev.totalItems + (newPurchase.items ? 
                newPurchase.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
              totalValue: prev.totalValue + (newPurchase.totalAmount || 0)
            }));
            
            navigate('/purchases');
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Purchase Orders' : 'Supplier Profiles'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 truncate">
            {user?.role === 'admin' 
              ? 'Manage your purchase orders and suppliers' 
              : 'View supplier profiles and contact information'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View Toggle - Hidden for agents */}
          {user?.role !== 'agent' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">List</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <Table2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">Table</span>
              </button>
            </div>
          )}
          
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
            title="Refresh purchases from database"
          >
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <ExportButton
            data={filteredPurchases}
            filename={searchTerm.trim() ? `purchases-search-${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, '-')}` : 'purchases'}
            title={searchTerm.trim() ? `Purchase Report - Search: ${searchTerm.trim()}` : 'Purchase Report'}
            exportFunction={handleExportPurchases}
            variant="default"
            buttonText="Export"
          />
          {user?.role === 'admin' && (
            <button 
              className="btn-primary flex items-center whitespace-nowrap" 
              onClick={() => navigate('/purchases/new')}
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Purchase Order</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 sm:p-5 md:p-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-500 rounded-lg flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                {user?.role === 'admin' ? 'Total Purchases' : 'Supplier Interactions'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{purchaseStats.totalPurchases}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 sm:p-5 md:p-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-500 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                {user?.role === 'admin' ? 'Items Purchased' : 'Active Suppliers'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{purchaseStats.totalItems}</p>
            </div>
          </div>
        </motion.div>

        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 sm:p-5 md:p-6"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-500 rounded-lg flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Value</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">PKR {purchaseStats.totalValue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Search Filter */}
      <div className="mt-6 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by supplier name, phone, or purchase number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="input-field pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
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

      {/* Purchase Records Section */}
      <div className="card p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Purchase Records ({searchTerm.trim() ? `${filteredPurchases.length} of ${totalPurchasesCount}` : `${filteredPurchases.length} of ${totalPurchasesCount || purchases.length}`} total)
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <select
              value={sortFilter}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              title="Sort by"
            >
              <option value="newest"> Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high"> Amount (High to Low)</option>
              <option value="amount_low"> Amount (Low to High)</option>
              <option value="status">By Status</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
            {timeFilter === 'custom' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                title="Select specific date"
                max={new Date().toISOString().split('T')[0]} // Don't allow future dates
              />
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh purchases data"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">
              {user?.role === 'admin' ? 'No purchases found' : 'No supplier profiles found'}
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 px-4">
              {user?.role === 'admin' ? (
                timeFilter === 'all' ? 'Start by creating your first purchase order to see real data' : 
                timeFilter === 'custom' ? `No purchases found for ${selectedDate ? new Date(selectedDate).toLocaleDateString() : 'the selected date'}` :
                `No purchases found for the selected ${timeFilter} period`
              ) : (
                timeFilter === 'all' ? 'No supplier interactions found in the system' : 
                timeFilter === 'custom' ? `No supplier interactions found for ${selectedDate ? new Date(selectedDate).toLocaleDateString() : 'the selected date'}` :
                `No supplier interactions found for the selected ${timeFilter} period`
              )}
            </p>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/purchases/new')}
                className="btn-primary mt-4"
              >
                Create Your First Purchase Order
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              // Table View
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      {user?.role === 'admin' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Status
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPurchases.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{purchase.purchaseNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 
                             purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{purchase.supplierId?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{purchase.supplierId?.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {purchase.items && purchase.items.length > 0 ? (
                              purchase.items.slice(0, 3).map((item, idx) => {
                                const productName = item.productId?.name || 'Unknown';
                                const variantName = item.variantName ? ` - ${item.variantName}` : '';
                                return (
                                  <div key={idx}>
                                    {idx > 0 && <hr className="my-2 border-gray-300" />}
                                    <div className="text-sm text-gray-600 mb-1">
                                      {productName}{variantName}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {purchase.items?.length > 3 && (
                              <div className="text-sm text-gray-500 mt-1">+{purchase.items.length - 3} more</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {purchase.items && purchase.items.length > 0 ? (
                              purchase.items.slice(0, 3).map((item, idx) => (
                                <div key={idx}>
                                  {idx > 0 && <hr className="my-2 border-gray-300" />}
                                  <div className="text-sm text-gray-600 mb-1">{item.quantity}</div>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            PKR {purchase.totalAmount?.toLocaleString() || '0'}
                          </div>
                        </td>
                        {user?.role === 'admin' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                purchase.status === 'received' ? 'bg-green-100 text-green-800' :
                                purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {purchase.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                purchase.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                purchase.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {purchase.paymentStatus || 'Pending'}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {user?.role === 'admin' && (
                              <>
                                {!purchase.invoiceGenerated && (
                                  <button
                                    onClick={() => handleGenerateInvoice(purchase._id)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Generate Invoice"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                )}
                                {purchase.invoiceGenerated && (
                                  <button
                                    onClick={() => handleDownloadDocument(purchase._id, 'invoice', 'pdf')}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Download Invoice"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                )}
                                {purchase.paymentStatus !== 'paid' && (
                                  <button
                                    onClick={() => handleMarkPaymentCleared(purchase._id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Mark Payment Cleared"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => {
                                // View purchase details - you can add a modal here
                                console.log('View purchase:', purchase._id);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // List View (existing grid/list view)
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6' : 'space-y-3 sm:space-y-4'}>
                {currentPurchases.map((purchase) => (
              <motion.div
                key={purchase._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-300 ${
                  newlyAddedPurchaseId === purchase._id 
                    ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{purchase.purchaseNumber}</span>
                        <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          purchase.status === 'received' ? 'bg-green-100 text-green-800' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status}
                        </span>
                        {user?.role === 'admin' && (
                          <>
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              purchase.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              purchase.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {purchase.paymentStatus}
                            </span>
                            
                            {/* Partial Payment Info */}
                            {purchase.paymentStatus === 'partial' && purchase.advancePayment > 0 && (
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Advance:</span> PKR {purchase.advancePayment.toFixed(2)} | 
                                <span className="font-medium ml-1">Remaining:</span> PKR {(purchase.remainingPayment || 0).toFixed(2)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Action Buttons - Admin Only */}
                      {user?.role === 'admin' && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          {/* Generate Invoice */}
                          {!purchase.invoiceGenerated && (
                            <button
                              onClick={() => handleGenerateInvoice(purchase._id)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Generate Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Download Invoice */}
                          {purchase.invoiceGenerated && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDownloadDocument(purchase._id, 'invoice', 'pdf')}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Download Invoice (PDF)"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <span className="text-xs text-green-600 font-medium">INV</span>
                            </div>
                          )}
                          
                          {/* Clear Payment */}
                          {purchase.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaymentCleared(purchase._id)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="Mark Payment Cleared"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Download Receipt */}
                          {purchase.receiptGenerated && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDownloadDocument(purchase._id, 'receipt', 'pdf')}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                title="Download Receipt (PDF)"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                              <span className="text-xs text-green-600 font-medium">REC</span>
                            </div>
                          )}
                          
                          {/* Payment Status Indicator */}
                          {purchase.paymentStatus === 'paid' && !purchase.receiptGenerated && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">PAID</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span>{purchase.items.length} items</span>
                      </div>
                      {user?.role === 'admin' && (
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="font-medium truncate">PKR {purchase.totalAmount?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {user?.role === 'admin' ? (
                      <div className="mt-2 sm:mt-3">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Items:</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {purchase.items.slice(0, 3).map((item, index) => {
                            const productName = item.productId?.name || 'Unknown Product';
                            const variantName = item.variantName ? ` - ${item.variantName}` : '';
                            const displayName = `${productName}${variantName}`;
                            
                            return (
                              <span
                                key={index}
                                className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs truncate max-w-[200px]"
                                title={`${displayName} (x${item.quantity})`}
                              >
                                {displayName} (x{item.quantity})
                              </span>
                            );
                          })}
                          {purchase.items.length > 3 && (
                            <span className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-xs whitespace-nowrap">
                              +{purchase.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 sm:mt-3">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Supplier Profile:</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {(purchase.supplierId?.name || 'Unknown').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{purchase.supplierId?.name || 'Unknown Supplier'}</p>
                              <p className="text-xs text-gray-500">{purchase.supplierId?.email || 'No email'}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p><span className="font-medium">Phone:</span> {purchase.supplierId?.phone || 'Not provided'}</p>
                            <p><span className="font-medium">Location:</span> {purchase.supplierId?.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {user?.role === 'admin' ? (
                    <div className="lg:text-right border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4 min-w-0 flex-shrink-0">
                      <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                        <span className="font-medium">Supplier:</span> {purchase.supplierId?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {purchase.receivedDate ? `Received: ${new Date(purchase.receivedDate).toLocaleDateString()}` : 'Not received yet'}
                      </div>
                    </div>
                  ) : (
                    <div className="lg:text-right border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4 min-w-0 flex-shrink-0">
                      <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                        <span className="font-medium">Purchase Date:</span> {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <span className="font-medium">Status:</span> {purchase.status}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
              </div>
            )}

          {/* Pagination Controls - Only show when not "All Time" and not searching */}
          {showPagination && totalPages > 1 && !loading && filteredPurchases.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredPurchases.length)}</span> of{' '}
                    <span className="font-medium">{filteredPurchases.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                        return <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default Purchases;
