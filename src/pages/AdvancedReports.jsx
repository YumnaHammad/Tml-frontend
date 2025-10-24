import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import CenteredLoader from '../components/CenteredLoader';

const AdvancedReports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Report Data
  const [overviewData, setOverviewData] = useState(null);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [purchaseAnalytics, setPurchaseAnalytics] = useState(null);
  const [productPerformance, setProductPerformance] = useState([]);
  const [supplierAnalytics, setSupplierAnalytics] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState([]);
  const [profitAnalysis, setProfitAnalysis] = useState(null);

  useEffect(() => {
    fetchAllReports();
  }, [dateRange]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [purchasesRes, salesRes, productsRes, suppliersRes] = await Promise.all([
        api.get('/purchases?limit=1000&populate=supplierId,items.productId'),
        api.get('/sales?limit=1000'),
        api.get('/products?limit=1000'),
        api.get('/suppliers?limit=1000')
      ]);

      const purchases = purchasesRes.data?.purchases || [];
      const sales = salesRes.data?.salesOrders || salesRes.data?.sales || [];
      const products = productsRes.data?.products || [];
      const suppliers = suppliersRes.data?.suppliers || [];

      // Filter by date range
      const filteredPurchases = filterByDateRange(purchases);
      const filteredSales = filterByDateRange(sales);

      // Generate reports
      generateOverviewReport(filteredPurchases, filteredSales, products);
      generateSalesAnalytics(filteredSales);
      generatePurchaseAnalytics(filteredPurchases);
      generateProductPerformance(filteredSales, products);
      generateSupplierAnalytics(filteredPurchases, suppliers);
      generateCustomerAnalytics(filteredSales);
      generateProfitAnalysis(filteredPurchases, filteredSales);

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load advanced reports');
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = (data) => {
    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.purchaseDate || item.orderDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    });
  };

  const generateOverviewReport = (purchases, sales, products) => {
    const totalPurchases = purchases.reduce((sum, p) => {
      const subtotal = p.totalAmount || 0;
      const tax = p.taxAmount || 0;
      const discount = p.discountAmount || 0;
      return sum + subtotal + tax - discount;
    }, 0);

    const totalSales = sales
      .filter(s => s.status !== 'returned' && s.status !== 'cancelled')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    const totalProfit = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    setOverviewData({
      totalPurchases,
      totalSales,
      totalProfit,
      profitMargin,
      purchaseCount: purchases.length,
      salesCount: sales.filter(s => s.status !== 'returned' && s.status !== 'cancelled').length,
      productCount: products.length,
      avgOrderValue: sales.length > 0 ? totalSales / sales.length : 0
    });
  };

  const generateSalesAnalytics = (sales) => {
    const validSales = sales.filter(s => s.status !== 'returned' && s.status !== 'cancelled');
    
    // Sales by status
    const salesByStatus = validSales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {});

    // Sales by day
    const salesByDay = validSales.reduce((acc, sale) => {
      const date = new Date(sale.orderDate || sale.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (sale.totalAmount || 0);
      return acc;
    }, {});

    setSalesAnalytics({
      salesByStatus,
      salesByDay,
      totalOrders: validSales.length,
      averageOrderValue: validSales.length > 0 
        ? validSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / validSales.length 
        : 0
    });
  };

  const generatePurchaseAnalytics = (purchases) => {
    const totalCost = purchases.reduce((sum, p) => {
      const subtotal = p.totalAmount || 0;
      const tax = p.taxAmount || 0;
      const discount = p.discountAmount || 0;
      return sum + subtotal + tax - discount;
    }, 0);

    // Purchases by payment method
    const byPaymentMethod = purchases.reduce((acc, p) => {
      const method = p.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Purchases by payment status
    const byPaymentStatus = purchases.reduce((acc, p) => {
      const status = p.paymentStatus || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    setPurchaseAnalytics({
      totalCost,
      purchaseCount: purchases.length,
      byPaymentMethod,
      byPaymentStatus,
      averagePurchaseValue: purchases.length > 0 ? totalCost / purchases.length : 0
    });
  };

  const generateProductPerformance = (sales, products) => {
    const productSales = {};
    
    sales.forEach(sale => {
      if (sale.status !== 'returned' && sale.status !== 'cancelled') {
        sale.items?.forEach(item => {
          const productId = item.productId?._id || item.productId;
          const productName = item.productId?.name || 'Unknown';
          const quantity = item.quantity || 0;
          const price = item.unitPrice || 0;
          const total = quantity * price;

          if (!productSales[productId]) {
            productSales[productId] = {
              name: productName,
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }

          productSales[productId].quantity += quantity;
          productSales[productId].revenue += total;
          productSales[productId].orders += 1;
        });
      }
    });

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    setProductPerformance(sortedProducts);
  };

  const generateSupplierAnalytics = (purchases, suppliers) => {
    const supplierData = {};
    
    purchases.forEach(purchase => {
      const supplierId = purchase.supplierId?._id || purchase.supplierId;
      const supplierName = purchase.supplierId?.name || 'Unknown';
      const amount = (purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.discountAmount || 0);

      if (!supplierData[supplierId]) {
        supplierData[supplierId] = {
          name: supplierName,
          totalPurchases: 0,
          orderCount: 0
        };
      }

      supplierData[supplierId].totalPurchases += amount;
      supplierData[supplierId].orderCount += 1;
    });

    const sortedSuppliers = Object.values(supplierData)
      .sort((a, b) => b.totalPurchases - a.totalPurchases);

    setSupplierAnalytics(sortedSuppliers);
  };

  const generateCustomerAnalytics = (sales) => {
    const customerData = {};
    
    sales.forEach(sale => {
      if (sale.status !== 'returned' && sale.status !== 'cancelled') {
        const customerName = sale.customerName || 'Walk-in Customer';
        const amount = sale.totalAmount || 0;

        if (!customerData[customerName]) {
          customerData[customerName] = {
            name: customerName,
            totalSpent: 0,
            orderCount: 0
          };
        }

        customerData[customerName].totalSpent += amount;
        customerData[customerName].orderCount += 1;
      }
    });

    const sortedCustomers = Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20);

    setCustomerAnalytics(sortedCustomers);
  };

  const generateProfitAnalysis = (purchases, sales) => {
    const validSales = sales.filter(s => s.status !== 'returned' && s.status !== 'cancelled');
    
    const totalRevenue = validSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalCost = purchases.reduce((sum, p) => {
      const subtotal = p.totalAmount || 0;
      const tax = p.taxAmount || 0;
      const discount = p.discountAmount || 0;
      return sum + subtotal + tax - discount;
    }, 0);
    
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    setProfitAnalysis({
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      revenueGrowth: 0, // Can be calculated with historical data
      costGrowth: 0
    });
  };

  const formatCurrency = (amount) => {
    return `PKR ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return <CenteredLoader message="Loading advanced reports..." size="large" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                Advanced Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-2">Deep insights and business intelligence</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={fetchAllReports}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              {['overview', 'sales', 'purchases', 'products', 'suppliers', 'customers', 'profit'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && overviewData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-8 h-8 text-blue-600" />
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overviewData.totalSales)}</p>
                    <p className="text-xs text-gray-500 mt-2">{overviewData.salesCount} orders</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <ShoppingCart className="w-8 h-8 text-red-600" />
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overviewData.totalPurchases)}</p>
                    <p className="text-xs text-gray-500 mt-2">{overviewData.purchaseCount} orders</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                      <ArrowUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overviewData.totalProfit)}</p>
                    <p className="text-xs text-gray-500 mt-2">{overviewData.profitMargin.toFixed(2)}% margin</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <Package className="w-8 h-8 text-purple-600" />
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overviewData.avgOrderValue)}</p>
                    <p className="text-xs text-gray-500 mt-2">Per transaction</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className="text-2xl font-bold text-green-600">{overviewData.profitMargin.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-blue-600">{overviewData.productCount}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-purple-600">{overviewData.salesCount + overviewData.purchaseCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Analytics Tab */}
            {activeTab === 'sales' && salesAnalytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Status</h3>
                    <div className="space-y-3">
                      {Object.entries(salesAnalytics.salesByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                          <span className="text-sm font-semibold text-gray-900">{count} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{salesAnalytics.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Order Value</p>
                        <p className="text-2xl font-bold text-primary-600">{formatCurrency(salesAnalytics.averageOrderValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Analytics Tab */}
            {activeTab === 'purchases' && purchaseAnalytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchases by Payment Method</h3>
                    <div className="space-y-3">
                      {Object.entries(purchaseAnalytics.byPaymentMethod).map(([method, count]) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                    <div className="space-y-3">
                      {Object.entries(purchaseAnalytics.byPaymentStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{status}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(purchaseAnalytics.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{purchaseAnalytics.purchaseCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Value</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(purchaseAnalytics.averagePurchaseValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Performance Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productPerformance.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.orders}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(product.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Analytics Tab */}
            {activeTab === 'suppliers' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Supplier Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {supplierAnalytics.map((supplier, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.orderCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                              {formatCurrency(supplier.totalPurchases)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Analytics Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customerAnalytics.map((customer, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.orderCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(customer.totalSpent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Profit Analysis Tab */}
            {activeTab === 'profit' && profitAnalysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(profitAnalysis.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Growth Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{profitAnalysis.revenueGrowth.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(profitAnalysis.totalCost)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cost Growth</p>
                        <p className="text-2xl font-bold text-gray-900">{profitAnalysis.costGrowth.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Gross Profit</p>
                      <p className={`text-4xl font-bold ${profitAnalysis.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitAnalysis.grossProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Profit Margin</p>
                      <p className={`text-4xl font-bold ${profitAnalysis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitAnalysis.profitMargin.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;