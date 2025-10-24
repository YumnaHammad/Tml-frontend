import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, TrendingUp, DollarSign, Calendar, Clock, Filter, RefreshCw, CheckCircle, XCircle, Download, Package, RotateCcw, ArrowRight, X, Grid3X3, List } from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import SalesFormPage from './forms/SalesFormPage';
import api from '../services/api';
import ExportButton from '../components/ExportButton';
import toast from 'react-hot-toast';

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [newlyAddedSaleId, setNewlyAddedSaleId] = useState(null);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalDelivered: 0,
    totalReturns: 0,
    totalRevenue: 0
  });
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmSale, setConfirmSale] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all, day, week, month
  const [sortFilter, setSortFilter] = useState('newest'); // newest, oldest, amount_high, amount_low, status
  const [selectedDate, setSelectedDate] = useState(''); // For calendar date picker
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch sales data
  const fetchSales = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/sales?limit=1000'); // Fetch all sales
      let salesData = response.data?.salesOrders || [];
      
      // Check for temporary sales in localStorage (newly created ones)
      const tempSales = JSON.parse(localStorage.getItem('tempSales') || '[]');
      if (tempSales.length > 0) {
        // Merge temporary sales with API data, avoiding duplicates
        const apiSaleIds = new Set(salesData.map(s => s._id));
        const newTempSales = tempSales.filter(s => !apiSaleIds.has(s._id));
        salesData = [...newTempSales, ...salesData];
        
        // Clear temporary sales after merging
        localStorage.removeItem('tempSales');
      }
      
      // Sort by creation date - newest first
      const sortedSales = salesData.sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      
      // Always use real data from API, even if empty
      setSales(sortedSales);
      
      // Calculate stats from real data (will be 0 if no sales)
      const stats = {
        totalSales: salesData.length,
        totalDelivered: salesData.filter(sale => sale.status === 'delivered' || sale.status === 'confirmed_delivered').length,
        totalReturns: salesData.filter(sale => sale.status === 'returned' || sale.status === 'expected_return').length,
        totalRevenue: salesData
          .filter(sale => sale.status !== 'returned' && sale.status !== 'expected_return' && sale.status !== 'cancelled')
          .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      };
      
      setSalesStats(stats);
      
    } catch (error) {
      console.error('Error fetching sales:', error);
      
      // Show empty state instead of dummy data
      setSales([]);
      setSalesStats({
        totalSales: 0,
        totalDelivered: 0,
        totalReturns: 0,
        totalRevenue: 0
      });
      
      toast.error('Failed to load sales orders. Please check your connection.');
      
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
      */  // End of dummy data comment
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
    const tempSales = JSON.parse(localStorage.getItem('tempSales') || '[]');
    if (tempSales.length > 0) {
      // Add temporary sales to the current state
      setSales(prev => {
        const existingIds = new Set(prev.map(s => s._id));
        const newSales = tempSales.filter(s => !existingIds.has(s._id));
        if (newSales.length > 0) {
          // Update stats
          setSalesStats(prevStats => {
            const newStats = { ...prevStats };
            newSales.forEach(sale => {
              newStats.totalSales += 1;
              newStats.totalDelivered += (sale.status === 'delivered' || sale.status === 'confirmed_delivered' ? 1 : 0);
              newStats.totalReturns += (sale.status === 'returned' ? 1 : 0);
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
      localStorage.removeItem('tempSales');
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

  // Removed auto-refresh to prevent UI disturbance

  // Handle card clicks
  const handleCardClick = (cardType) => {
    // Future: Add navigation to detailed views
  };

  // Filter sales by time period
  const getFilteredSales = () => {
    let filteredSales = sales;
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let filterDate;
      
      switch (timeFilter) {
        case 'day':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '90days':
          filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          filterDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          // Handle custom date selection
          if (selectedDate) {
            const selected = new Date(selectedDate);
            const startOfDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
            const endOfDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 1);
            filteredSales = sales.filter(sale => {
              const saleDate = new Date(sale.createdAt);
              return saleDate >= startOfDay && saleDate < endOfDay;
            });
            return filteredSales;
          }
          break;
        default:
          break;
      }
      
      if (timeFilter !== 'custom') {
        filteredSales = sales.filter(sale => new Date(sale.createdAt) >= filterDate);
      }
    }
    
    // Apply sort filter
    const sortedSales = [...filteredSales].sort((a, b) => {
      switch (sortFilter) {
        case 'newest':
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        case 'oldest':
          return new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id);
        case 'amount_high':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_low':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      }
    });
    
    return sortedSales;
  };

  // Pagination logic
  const filteredSales = getFilteredSales();
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, sortFilter, selectedDate]);

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
    fetchSales();
  };

  // Export sales data
  const handleExportSales = async (format = 'excel') => {
    const { exportSales } = await import('../utils/exportUtils');
    return exportSales(filteredSales, format);
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
      if (confirmAction === 'returnReceived') {
        // Handle return received logic
        const loadingToast = toast.loading('Processing return...');
        
        const expectedReturnsRes = await api.get('/expected-returns');
        const expectedReturn = expectedReturnsRes.data.expectedReturns?.find(
          (er) => ((er.salesOrderId && (er.salesOrderId._id || er.salesOrderId)) === confirmSale._id) && er.status === 'pending'
        );
        
        if (expectedReturn) {
          await api.post(`/expected-returns/${expectedReturn._id}/receive`);
          
          toast.dismiss(loadingToast);
          toast.success('Return received! Stock added back to warehouse ✅', {
            duration: 5000
          });
          
          fetchSales();
        } else {
          toast.dismiss(loadingToast);
          toast.error('Expected return record not found. Please use Expected Returns page.');
        }
      } else {
        // Handle regular status change
        await handleStatusChange(confirmSale._id, confirmAction);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error(error.response?.data?.error || 'Failed to process action');
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmSale(null);
    }
  };

  // Change sales status
  const handleStatusChange = async (saleId, newStatus) => {
    let loadingToast;
    try {
      loadingToast = toast.loading(`Updating status to ${newStatus}...`);
      
      const response = await api.patch(`/sales/${saleId}/status`, { status: newStatus });
      
      // Update local state
      setSales(prevSales =>
        prevSales.map(sale =>
          sale._id === saleId ? { ...sale, status: newStatus } : sale
        )
      );
      
      toast.dismiss(loadingToast);
      
      // Show special message based on status
      if (newStatus === 'expected_return') {
        const warehouseName = response.data.warehouseName || 'warehouse';
        toast.success(`Added to Expected Returns in ${warehouseName}! 📦`, {
          duration: 5000,
          icon: '⏳'
        });
      } else if (newStatus === 'returned') {
        const warehouseName = response.data.warehouseName || 'warehouse';
        toast.success(`Return confirmed! Stock added to ${warehouseName}! ✅`, {
          duration: 5000,
          icon: '🔄'
        });
      } else if (newStatus === 'confirmed_delivered') {
        toast.success(`Order confirmed as delivered! Items moved to confirmed delivered column in warehouse! ✅`, {
          duration: 5000,
          icon: '✓'
        });
      } else {
        toast.success(`Status updated to ${newStatus}!`);
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        saleId,
        newStatus
      });
      
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update status';
      toast.error(errorMessage);
    }
  };

  // Generate and download delivery note
  const handleDownloadDeliveryNote = async (sale) => {
    let loadingToast;
    try {
      loadingToast = toast.loading('Generating delivery note...');
      
      // Import jsPDF
      const jsPDF = (await import('jspdf')).default;
      
      // Import autoTable plugin - this extends jsPDF prototype
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Verify autoTable is available
      if (typeof doc.autoTable !== 'function') {
        console.error('autoTable not available on jsPDF instance');
        throw new Error('PDF generation library not loaded properly. Please refresh the page.');
      }
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Blue color
      doc.text('DELIVERY NOTE', 105, 20, { align: 'center' });
      
      // Horizontal line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Order Information
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Order Number: ${sale.orderNumber || 'N/A'}`, 20, 35);
      doc.text(`Order Date: ${sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}`, 20, 42);
      doc.text(`Status: ${(sale.status || 'pending').toUpperCase()}`, 20, 49);
      
      // Customer Information
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Customer Information:', 20, 60);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${sale.customerInfo?.name || sale.customerName || 'N/A'}`, 20, 67);
      doc.text(`Email: ${sale.customerInfo?.email || 'N/A'}`, 20, 74);
      doc.text(`Phone: ${sale.customerInfo?.phone || 'N/A'}`, 20, 81);
      
      // Delivery Address
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Delivery Address:', 20, 92);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const deliveryAddr = sale.deliveryAddress || {};
      doc.text(`${deliveryAddr.street || 'N/A'}`, 20, 99);
      doc.text(`${deliveryAddr.city || 'N/A'}, ${deliveryAddr.state || 'N/A'} ${deliveryAddr.zipCode || ''}`, 20, 106);
      doc.text(`${deliveryAddr.country || 'N/A'}`, 20, 113);
      
      // Items Table
      const tableData = sale.items?.map(item => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const total = quantity * unitPrice;
        
        return [
          item.productId?.name || item.productName || 'Unknown Product',
          item.variantName || '-',
          quantity,
          `PKR ${unitPrice.toFixed(2)}`,
          `PKR ${total.toFixed(2)}`
        ];
      }) || [];
      
      doc.autoTable({
        startY: 125,
        head: [['Product', 'Variant', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        }
      });
      
      // Total
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total Amount: PKR ${sale.totalAmount?.toLocaleString() || '0'}`, 20, finalY);
      
      // Notes
      if (sale.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Notes:', 20, finalY + 10);
        doc.setFont(undefined, 'normal');
        doc.text(sale.notes, 20, finalY + 17, { maxWidth: 170 });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Thank you for your business!', 105, 280, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
      
      // Save PDF
      doc.save(`Delivery-Note-${sale.orderNumber}.pdf`);
      
      toast.dismiss(loadingToast);
      toast.success('Delivery note downloaded!');
      
    } catch (error) {
      console.error('Error generating delivery note:', error);
      console.error('Error details:', error.message);
      console.error('Sale data:', sale);
      
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      toast.error(`Failed to generate delivery note: ${error.message}`);
    }
  };

  if (loading) {
    return <CenteredLoader message="Loading sales..." size="large" />;
  }

  const isNew = location.pathname === '/sales/new';
  if (isNew) {
    return (
      <div className="max-w-3xl mx-auto">
        <SalesFormPage 
          onSuccess={(newSale) => {
            // Add the new sale to state immediately
            setSales(prev => [newSale, ...prev]);
            
            // Highlight the newly added sale
            setNewlyAddedSaleId(newSale._id);
            
            // Clear highlight after 3 seconds
            setTimeout(() => setNewlyAddedSaleId(null), 3000);
            
            // Update stats immediately
            setSalesStats(prev => ({
              totalSales: prev.totalSales + 1,
              totalDelivered: prev.totalDelivered + (newSale.status === 'delivered' || newSale.status === 'confirmed_delivered' ? 1 : 0),
              totalReturns: prev.totalReturns + (newSale.status === 'returned' ? 1 : 0),
              totalRevenue: prev.totalRevenue + (newSale.totalAmount || 0)
            }));
            
            navigate('/sales');
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your sales and orders</p>
        </div>
        
        {/* Controls Section - Full width on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline text-sm font-medium">Grid</span>
            </button>
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
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
            title="Refresh sales from database"
          >
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <ExportButton
            data={filteredSales}
            filename="sales"
            title="Sales Report"
            exportFunction={handleExportSales}
            variant="default"
            buttonText="Export"
          />
          <button 
            className="btn-primary flex items-center flex-1 sm:flex-initial justify-center" 
            onClick={() => navigate('/sales/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Sales Order</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleCardClick('total')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg mr-4">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{salesStats.totalSales}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleCardClick('delivered')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{salesStats.totalDelivered}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleCardClick('returns')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-500 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Returns</p>
              <p className="text-2xl font-bold text-gray-900">{salesStats.totalReturns}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleCardClick('revenue')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {salesStats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sales Records Section */}
      <div className="card p-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Sales Records ({filteredSales.length} of {sales.length} total)
          </h2>
          <div className="flex items-center space-x-4 flex-wrap">
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
            {timeFilter === 'custom' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                title="Select specific date"
                max={new Date().toISOString().split('T')[0]} // Don't allow future dates
              />
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh sales data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No sales found</p>
            <p className="text-gray-400 text-sm mt-2">
              {timeFilter === 'all' ? 'Start by creating your first sales order to see real data' : 
               timeFilter === 'custom' ? `No sales found for ${selectedDate ? new Date(selectedDate).toLocaleDateString() : 'the selected date'}` :
               `No sales found for the selected ${timeFilter} period`}
            </p>
            <button
              onClick={() => navigate('/sales/new')}
              className="btn-primary mt-4"
            >
              Create Your First Sales Order
            </button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6' : 'space-y-3 sm:space-y-4'}>
              {currentSales.map((sale) => (
              <motion.div
                key={sale._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-300 ${
                  newlyAddedSaleId === sale._id 
                    ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{sale.orderNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        sale.status === 'confirmed_delivered' ? 'bg-emerald-100 text-emerald-800' :
                        sale.status === 'returned' ? 'bg-red-100 text-red-800' :
                        sale.status === 'expected_return' ? 'bg-purple-100 text-purple-800' :
                        sale.status === 'dispatched' || sale.status === 'dispatch' ? 'bg-blue-100 text-blue-800' :
                        sale.status === 'confirmed' ? 'bg-cyan-100 text-cyan-800' :
                        sale.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.status === 'expected_return' ? 'Expected Return' : 
                         sale.status === 'confirmed_delivered' ? 'Confirmed Delivered' : 
                         sale.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{new Date(sale.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{sale.items?.length || 0} items</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="font-medium truncate">PKR {sale.totalAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center">
                        {sale.status === 'delivered' ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-600 flex-shrink-0" /> :
                         sale.status === 'returned' ? <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-red-600 flex-shrink-0" /> :
                         <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-600 flex-shrink-0" />}
                        <span className="capitalize truncate">{sale.status}</span>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Items:</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {sale.items?.slice(0, 3).map((item, index) => {
                          const productName = item.productId?.name || 'Unknown Product';
                          const variantName = item.variantName ? ` - ${item.variantName}` : '';
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
                      Customer: {sale.customerName || sale.customerInfo?.name || sale.customerId?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-400 mb-2 sm:mb-4">
                      {sale.deliveryDate ? `Delivered: ${new Date(sale.deliveryDate).toLocaleDateString()}` : 'Not delivered yet'}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
                      {/* Return Button - For Expected Returns */}
                      {sale.status === 'expected_return' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmation(sale, 'returnReceived');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm whitespace-nowrap"
                          title="Confirm that return has been received back to warehouse"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Return Received
                        </button>
                      )}
                      
                      {/* Status Change Buttons */}
                      {sale.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmation(sale, 'dispatch');
                          }}
                          className="btn-primary flex items-center text-xs px-2 py-1 whitespace-nowrap"
                          title="Mark as Dispatched"
                        >
                          <Truck className="w-3 h-3 mr-1" />
                          Dispatch
                        </button>
                      )}
                      
                      {(sale.status === 'dispatch' || sale.status === 'dispatched') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmation(sale, 'delivered');
                          }}
                          className="btn-success flex items-center text-xs px-2 py-1 whitespace-nowrap"
                          title="Mark as Delivered"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Delivered
                        </button>
                      )}
                      
                      
                      {sale.status === 'delivered' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showConfirmation(sale, 'confirmed_delivered');
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
                              showConfirmation(sale, 'expected_return');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors"
                            title="Mark as Expected Return - Product will appear in Expected Returns module"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Expected Return
                          </button>
                        </>
                      )}
                      
                      {sale.status === 'confirmed_delivered' && (
                        <div className="flex items-center text-xs text-gray-500">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                          Confirmed Delivered
                        </div>
                      )}
                      
                      {sale.status === 'returned' && (
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
          </>
        )}

        {/* Pagination Controls */}
        {!loading && filteredSales.length > 0 && (
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
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredSales.length)}</span> of{' '}
                    <span className="font-medium">{filteredSales.length}</span> results
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
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction === 'dispatch' && 'Confirm Dispatch'}
                {confirmAction === 'delivered' && 'Confirm Delivery'}
                {confirmAction === 'confirmed_delivered' && 'Confirm Delivered'}
                {confirmAction === 'expected_return' && 'Confirm Expected Return'}
                {confirmAction === 'returnReceived' && 'Confirm Return Received'}
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
                {confirmAction === 'dispatch' && `Are you sure you want to dispatch order ${confirmSale?.orderNumber}? This will reserve stock in warehouse.`}
                {confirmAction === 'delivered' && `Are you sure you want to mark order ${confirmSale?.orderNumber} as delivered?`}
                {confirmAction === 'confirmed_delivered' && `Are you sure you want to confirm delivery for order ${confirmSale?.orderNumber}? This will move items to the confirmed delivered column in warehouse and disable the Expected Return option.`}
                {confirmAction === 'expected_return' && `Are you sure you want to mark order ${confirmSale?.orderNumber} as expected return? This will add it to the Expected Returns module.`}
                {confirmAction === 'returnReceived' && `Are you sure you want to confirm that the return for order ${confirmSale?.orderNumber} has been received back to warehouse?`}
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
                    confirmAction === 'returnReceived' 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {confirmAction === 'dispatch' && 'Dispatch Order'}
                  {confirmAction === 'delivered' && 'Mark as Delivered'}
                  {confirmAction === 'confirmed_delivered' && 'Confirm Delivered'}
                  {confirmAction === 'expected_return' && 'Mark as Expected Return'}
                  {confirmAction === 'returnReceived' && 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales