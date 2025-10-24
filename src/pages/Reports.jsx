import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  RotateCcw,
  Warehouse,
  DollarSign,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { BarChart, PieChart } from '../components/charts';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [mainReport, setMainReport] = useState(null);
  const [weeklySales, setWeeklySales] = useState(null);
  const [monthlySales, setMonthlySales] = useState(null);
  const [monthlyInventory, setMonthlyInventory] = useState(null);
  const [supplierPerformance, setSupplierPerformance] = useState(null);
  const [returnAnalysis, setReturnAnalysis] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, reportRes] = await Promise.all([
        api.get('/reports/dashboard/summary'),
        api.get('/reports/dashboard/main')
      ]);
      setDashboardSummary(summaryRes.data);
      setMainReport(reportRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/weekly-sales');
      setWeeklySales(response.data);
    } catch (error) {
      console.error('Error fetching weekly sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/monthly-sales');
      setMonthlySales(response.data);
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/monthly-inventory');
      setMonthlyInventory(response.data);
    } catch (error) {
      console.error('Error fetching monthly inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierPerformance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/supplier-performance', {
        params: dateRange
      });
      setSupplierPerformance(response.data);
    } catch (error) {
      console.error('Error fetching supplier performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnAnalysis = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/return-analysis', {
        params: dateRange
      });
      setReturnAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching return analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Fetch data based on selected tab
    switch (tab) {
      case 'weekly-sales':
        if (!weeklySales) fetchWeeklySales();
        break;
      case 'monthly-sales':
        if (!monthlySales) fetchMonthlySales();
        break;
      case 'monthly-inventory':
        if (!monthlyInventory) fetchMonthlyInventory();
        break;
      case 'supplier-performance':
        if (!supplierPerformance) fetchSupplierPerformance();
        break;
      case 'return-analysis':
        if (!returnAnalysis) fetchReturnAnalysis();
        break;
      case 'city-reports':
        // City reports will be handled by navigation to the city reports page
        break;
      case 'advanced-reports':
        // Advanced reports will be handled by navigation to the advanced reports page
        break;
      default:
        break;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard Report', icon: BarChart3 },
    { id: 'weekly-sales', label: 'Weekly Sales', icon: TrendingUp },
    { id: 'monthly-sales', label: 'Monthly Sales', icon: DollarSign },
    { id: 'monthly-inventory', label: 'Monthly Inventory', icon: Package },
    { id: 'supplier-performance', label: 'Supplier Performance', icon: Truck },
    { id: 'return-analysis', label: 'Return Analysis', icon: RotateCcw },
    { id: 'city-reports', label: 'City Reports', icon: MapPin },
    // Only show advanced reports for admin
    ...(user?.role === 'admin' ? [{ id: 'advanced-reports', label: 'Advanced Reports', icon: TrendingUp }] : [])
  ];

  const renderDashboardReport = () => {
    if (!dashboardSummary || !mainReport) return null;

  return (
    <div className="space-y-4 lg:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{dashboardSummary.totalProducts}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Items in Stock</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{(dashboardSummary.totalItemsInStock || 0).toLocaleString()}</p>
              </div>
              <Warehouse className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            </div>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Delivered This Week</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{dashboardSummary.deliveredProducts.thisWeek}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
            </div>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Returns This Week</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{dashboardSummary.returns.thisWeek}</p>
              </div>
              <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Main Report Table */}
        <div className="card p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">Product Stock Overview</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                Critical: {mainReport.summary.criticalAlerts}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full whitespace-nowrap">
                Out of Stock: {mainReport.summary.outOfStock}
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
                Warning: {mainReport.summary.warningAlerts}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
                Good: {mainReport.summary.goodStock}
              </span>
        </div>
      </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Sales</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Sales</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {mainReport.report.slice(0, 20).map((item, index) => {
                  const getAlertColor = (alert) => {
                    switch (alert) {
                      case 'critical': return 'text-red-600';
                      case 'warning': return 'text-yellow-600';
                      case 'out_of_stock': return 'text-gray-600';
                      default: return 'text-green-600';
                    }
                  };

                  const getAlertIcon = (alert) => {
                    switch (alert) {
                      case 'critical':
                      case 'warning':
                        return <AlertTriangle className="w-4 h-4" />;
                      case 'out_of_stock':
                        return <XCircle className="w-4 h-4" />;
                      default:
                        return <CheckCircle className="w-4 h-4" />;
                    }
                  };

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-600 truncate">{item.productSku}</p>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-medium">{item.currentStock}</span>
                        <span className="text-xs text-gray-600 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{item.weeklySales}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{item.monthlySales}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
          <div className="flex items-center">
                          <span className={`${getAlertColor(item.stockAlert)}`}>
                            {getAlertIcon(item.stockAlert)}
                          </span>
                          <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${getAlertColor(item.stockAlert)}`}>
                            {item.stockAlert === 'critical' ? 'Critical' :
                             item.stockAlert === 'warning' ? 'Warning' :
                             item.stockAlert === 'out_of_stock' ? 'Out of Stock' :
                             'Good'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                          {item.daysOfInventory < 999 ? `${item.daysOfInventory} days` : '∞'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklySalesReport = () => {
    if (!weeklySales) return null;

    // Ensure we have the required data structure
    if (!weeklySales.summary || !weeklySales.topProducts) {
    return (
          <div className="card p-6">
          <div className="text-center text-gray-500">
            <p>No sales data available for this week.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 lg:space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {user?.role === 'admin' && (
            <div className="card p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">PKR {(weeklySales.summary?.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              </div>
            </div>
          )}

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{weeklySales.summary?.totalOrders || 0}</p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
            </div>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{weeklySales.summary?.totalItems || 0}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
            </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Unique Products</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{weeklySales.summary?.uniqueProducts || 0}</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Weekly Sales Performance</h3>
          <div className="h-48 sm:h-64">
            <BarChart
              data={(weeklySales.topProducts || []).slice(0, 10)}
              dataKey="totalQuantity"
              nameKey="productName"
              color="#3b82f6"
            />
            </div>
          </div>

        {/* Top Products with Variants */}
        <div className="card p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Top Selling Products & Variants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(weeklySales.topProducts || []).slice(0, 20).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.productName}</div>
                        <div className="text-xs text-gray-500 truncate">SKU: {product.productSku}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.variantName === 'No Variant' 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {product.variantName}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 truncate">{product.category}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {product.totalQuantity} {product.unit}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      PKR {product.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{product.orderCount}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      PKR {product.averagePrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        {weeklySales.categoryBreakdown && weeklySales.categoryBreakdown.length > 0 && (
          <div className="card p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <div className="space-y-3 lg:space-y-4">
              {weeklySales.categoryBreakdown.map((category, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                  <div className="flex items-center min-w-0">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{category.category}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{category.productCount} products, {category.variants} variants</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm sm:text-base font-medium text-gray-900">{category.totalQuantity} items</p>
                    <p className="text-xs sm:text-sm text-gray-600">PKR {category.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Breakdown */}
        {weeklySales.dailyBreakdown && weeklySales.dailyBreakdown.length > 0 && (
          <div className="card p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
            <div className="space-y-2 lg:space-y-3">
              {weeklySales.dailyBreakdown.map((day, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                    <span className="text-gray-600">{day.orders} orders</span>
                    <span className="text-gray-600">{day.items} items</span>
                    <span className="font-medium text-gray-900">PKR {day.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonthlySalesReport = () => {
    if (!monthlySales) return null;

    // Ensure we have the required data structure
    if (!monthlySales.summary || !monthlySales.topProducts) {
      return (
        <div className="card p-4 lg:p-6">
          <div className="text-center text-gray-500">
            <p>No sales data available for this month.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 lg:space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {user?.role === 'admin' && (
            <div className="card p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">PKR {(monthlySales.summary.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              </div>
            </div>
          )}

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{monthlySales.summary.totalOrders || 0}</p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
            </div>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{monthlySales.summary.totalItems || 0}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </div>

          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Unique Products</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{monthlySales.summary.uniqueProducts || 0}</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Top Products with Variants */}
        <div className="card p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Top Selling Products & Variants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlySales.topProducts.slice(0, 20).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.productName}</div>
                        <div className="text-xs text-gray-500 truncate">SKU: {product.productSku}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.variantName === 'No Variant' 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {product.variantName}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 truncate">{product.category}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {product.totalQuantity} {product.unit}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      PKR {product.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{product.orderCount}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      PKR {product.averagePrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <div className="space-y-4">
            {monthlySales.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
                  <div className="w-4 h-4 bg-primary-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-600">{category.productCount} products, {category.variants} variants</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{category.totalQuantity} items</p>
                  <p className="text-sm text-gray-600">PKR {category.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Breakdown</h3>
          <div className="space-y-3">
            {monthlySales.weeklyBreakdown.map((week, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Week of {new Date(week.weekStart).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-gray-600">{week.orders} orders</span>
                  <span className="text-gray-600">{week.items} items</span>
                  <span className="font-medium text-gray-900">PKR {week.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyInventoryReport = () => {
    if (!monthlyInventory) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{monthlyInventory.summary.totalProducts || 0}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </div>

          {user?.role === 'admin' && (
            <>
              <div className="card p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Opening Value</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">PKR {(monthlyInventory.summary.totalOpeningValue || 0).toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                </div>
              </div>

              <div className="card p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Closing Value</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">PKR {(monthlyInventory.summary.totalClosingValue || 0).toLocaleString()}</p>
                  </div>
                  <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                </div>
              </div>
            </>
          )}

          {user?.role === 'admin' && (
            <div className="card p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Net Change</p>
                  <p className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${(monthlyInventory.summary.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(monthlyInventory.summary.netChange || 0) >= 0 ? '+' : ''}{monthlyInventory.summary.netChange || 0}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* Inventory Table */}
        <div className="card p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Monthly Inventory Movement</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Opening Stock</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Stock In</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Stock Out</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Closing Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(monthlyInventory.inventory || []).slice(0, 20).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.productName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{item.productSku || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{item.openingStock || 0}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-600">{item.stockIn || 0}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-red-600">{item.stockOut || 0}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{item.closingStock || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
            </div>
    );
  };

  const renderSupplierPerformanceReport = () => {
    if (!supplierPerformance) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{supplierPerformance.summary.totalSuppliers}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{supplierPerformance.summary.totalPurchases}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
            </div>

          {user?.role === 'admin' && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {(supplierPerformance.summary.totalAmount || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              </div>
          )}
          </div>

        {/* Supplier Performance Table */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Supplier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Total Purchases</th>
                  {user?.role === 'admin' && (
                    <>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Order Value</th>
                    </>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Delivery Performance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">On-Time Performance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rating</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.suppliers.map((supplier, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{supplier.supplierName}</p>
                        <p className="text-sm text-gray-600">{supplier.supplierCode}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{supplier.totalPurchases || 0}</td>
                    {user?.role === 'admin' && (
                      <>
                        <td className="py-3 px-4">PKR {(supplier.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">PKR {(supplier.averageOrderValue || 0).toLocaleString()}</td>
                      </>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${supplier.deliveryPerformance || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{supplier.deliveryPerformance || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
          <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${supplier.onTimePerformance || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{supplier.onTimePerformance || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.rating === 'A' ? 'bg-green-100 text-green-800' :
                        supplier.rating === 'B' ? 'bg-blue-100 text-blue-800' :
                        supplier.rating === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {supplier.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderReturnAnalysisReport = () => {
    if (!returnAnalysis) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{returnAnalysis.summary.totalReturns}</p>
              </div>
              <RotateCcw className="w-8 h-8 text-orange-600" />
            </div>
            </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Return Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{returnAnalysis.summary.totalReturnQuantity}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{returnAnalysis.summary.totalSales}</p>
              </div>
              <Truck className="w-8 h-8 text-green-600" />
            </div>
      </div>

      <div className="card p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Return Rate</p>
                <p className="text-2xl font-bold text-gray-900">{returnAnalysis.summary.returnRate}%</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Return Reasons Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Reasons</h3>
          <div className="h-64">
            <PieChart
              data={returnAnalysis.returnReasons}
              dataKey="count"
              nameKey="reason"
            />
          </div>
        </div>

        {/* Top Returned Products */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Returned Products</h3>
          <div className="space-y-4">
            {returnAnalysis.productReturns.slice(0, 10).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{product.productName}</p>
                    <p className="text-sm text-gray-600">SKU: {product.productSku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{product.returnQuantity} returns</p>
                  <p className="text-sm text-gray-600">{product.returnCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Comprehensive business insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => {
                console.log(`Refreshing ${activeTab} report data...`);
                switch (activeTab) {
                  case 'dashboard':
                    fetchDashboardData();
                    break;
                  case 'weekly-sales':
                    fetchWeeklySales();
                    break;
                  case 'monthly-sales':
                    fetchMonthlySales();
                    break;
                  case 'monthly-inventory':
                    fetchMonthlyInventory();
                    break;
                  case 'supplier-performance':
                    fetchSupplierPerformance();
                    break;
                  case 'return-analysis':
                    fetchReturnAnalysis();
                    break;
                  default:
                    break;
                }
              }}
              disabled={loading}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-xs sm:text-sm"
              title="Refresh current report data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 lg:mb-8">
          <nav className="-mb-px flex flex-wrap gap-2 sm:gap-4 lg:gap-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && renderDashboardReport()}
          {activeTab === 'weekly-sales' && renderWeeklySalesReport()}
          {activeTab === 'monthly-sales' && renderMonthlySalesReport()}
          {activeTab === 'monthly-inventory' && renderMonthlyInventoryReport()}
          {activeTab === 'supplier-performance' && renderSupplierPerformanceReport()}
          {activeTab === 'return-analysis' && renderReturnAnalysisReport()}
          {activeTab === 'city-reports' && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">City Reports</h3>
              <p className="text-gray-600 mb-6">Click below to view detailed city-wise reports</p>
              <a
                href="/city-reports"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Go to City Reports
              </a>
            </div>
          )}
          {activeTab === 'advanced-reports' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Reports</h3>
              <p className="text-gray-600 mb-6">Click below to view advanced analytics and reports</p>
              <a
                href="/reports/advanced"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Go to Advanced Reports
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;