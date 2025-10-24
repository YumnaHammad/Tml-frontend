import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Users, Warehouse, Truck, BarChart3, TrendingUp, TrendingDown,
  AlertTriangle, DollarSign, Activity, RefreshCw, Eye, FileText, Clock,
  CheckCircle, XCircle, RotateCcw, ShoppingCart, Receipt, CreditCard,
  Calendar, Filter, Download, Settings, Bell, Search, ArrowUpRight,
  ArrowDownRight, Target, Zap, Globe, Shield, Database, Server, Crown,
  Wifi, WifiOff, AlertCircle, Info, Star, Heart, ThumbsUp, ThumbsDown,
  MessageSquare, Mail, Phone, MapPin, Building2, UserPlus, UserMinus,
  Edit3, Trash2, Save, X, Plus, ChevronRight, ChevronDown, Maximize2,
  Minimize2, MoreVertical, Printer, Share2, Copy, ExternalLink, Lock,
  Unlock, EyeOff, Key, LogOut, Home, Menu, Grid, List, Table, Layout,
  Palette, Moon, Sun, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack,
  Repeat, Shuffle, Volume1, Mic, MicOff, Camera, Video, Image, File,
  Folder, Archive, Bookmark, Tag, Flag, Pin, Map, Navigation, Compass,
  Timer, History, RotateCcw as RotateCcwIcon, RotateCw,
  Undo, Redo, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ChevronUp,
  ChevronLeft, ChevronDown as ChevronDownIcon, ChevronRight as ChevronRightIcon
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Treemap, FunnelChart, Funnel, LabelList,
  Sankey, ReferenceLine, ReferenceArea, Brush, ErrorBar, Dot
} from "recharts";
import api from "../../services/api";

const AdvancedAdminDashboard = () => {
  // State Management
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalProducts: 0,
      totalItemsInStock: 0,
      totalWarehouses: 0,
      totalUsers: 0,
      totalSuppliers: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalOrders: 0,
      totalReturns: 0
    },
    realTimeMetrics: {
      onlineUsers: 0,
      activeOrders: 0,
      pendingDeliveries: 0,
      criticalAlerts: 0,
      systemHealth: 'excellent'
    },
    salesAnalytics: {
      today: { revenue: 0, orders: 0, profit: 0 },
      thisWeek: { revenue: 0, orders: 0, profit: 0 },
      thisMonth: { revenue: 0, orders: 0, profit: 0 },
      lastMonth: { revenue: 0, orders: 0, profit: 0 }
    },
    inventoryMetrics: {
      lowStockProducts: 0,
      outOfStockProducts: 0,
      fastMovingProducts: 0,
      slowMovingProducts: 0,
      totalInventoryValue: 0,
      warehouseUtilization: 0
    }
  });

  const [chartData, setChartData] = useState({
    salesTrend: [],
    inventoryTrend: [],
    userActivity: [],
    warehousePerformance: [],
    productPerformance: [],
    financialMetrics: []
  });

  const [notifications, setNotifications] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Try to fetch from existing endpoints, fallback to mock data
      try {
        const summaryRes = await api.get('/reports/dashboard/summary');
        console.log('Dashboard summary data:', summaryRes.data);
        
        setDashboardData(prevData => ({
          ...prevData,
          summary: summaryRes.data || {
            totalProducts: 0,
            totalItemsInStock: 0,
            totalWarehouses: 0,
            totalUsers: 0,
            totalSuppliers: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            totalProfit: 0,
            totalOrders: 0,
            totalReturns: 0,
            totalDispatched: 0,
            returnsThisWeek: 0,
            deliveredThisWeek: 0
          },
          realTimeMetrics: summaryRes.data?.realTimeMetrics || {
            onlineUsers: summaryRes.data?.totalUsers || 1, // Use total users or at least 1
            activeOrders: 0,
            pendingDeliveries: 0,
            criticalAlerts: 0,
            systemHealth: 'excellent'
          },
          salesAnalytics: {
            today: { revenue: 45000, orders: 25, profit: 8500 },
            thisWeek: { revenue: 285000, orders: 145, profit: 52000 },
            thisMonth: { revenue: 1250000, orders: 680, profit: 225000 },
            lastMonth: { revenue: 1180000, orders: 650, profit: 210000 }
          },
          inventoryMetrics: {
            lowStockProducts: 45,
            outOfStockProducts: 8,
            fastMovingProducts: 125,
            slowMovingProducts: 67,
            totalInventoryValue: 3200000,
            warehouseUtilization: 78
          }
        }));
      } catch (summaryError) {
        console.log('Using mock data for dashboard');
        // Generate mock data when API fails
        generateMockData();
      }

      // Generate mock data for charts, alerts, and notifications
      generateMockChartData();
      generateMockNotifications();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Generate mock data for demonstration
      generateMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate Mock Data for Demo
  const generateMockData = () => {
    const mockSummary = {
      totalProducts: 1250,
      totalItemsInStock: 15750,
      totalWarehouses: 8,
      totalUsers: 45,
      totalSuppliers: 23,
      totalCustomers: 1200,
      totalRevenue: 2500000,
      totalProfit: 450000,
      totalOrders: 3450,
      totalReturns: 125
    };

    const mockRealTime = {
      onlineUsers: 12,
      activeOrders: 89,
      pendingDeliveries: 23,
      criticalAlerts: 3,
      systemHealth: 'excellent'
    };

    const mockSalesAnalytics = {
      today: { revenue: 45000, orders: 25, profit: 8500 },
      thisWeek: { revenue: 285000, orders: 145, profit: 52000 },
      thisMonth: { revenue: 1250000, orders: 680, profit: 225000 },
      lastMonth: { revenue: 1180000, orders: 650, profit: 210000 }
    };

    const mockInventoryMetrics = {
      lowStockProducts: 45,
      outOfStockProducts: 8,
      fastMovingProducts: 125,
      slowMovingProducts: 67,
      totalInventoryValue: 3200000,
      warehouseUtilization: 78
    };

    setDashboardData({
      summary: mockSummary,
      realTimeMetrics: mockRealTime,
      salesAnalytics: mockSalesAnalytics,
      inventoryMetrics: mockInventoryMetrics
    });

    // Generate mock chart data
    generateMockChartData();
    generateMockNotifications();
  };

  const generateMockChartData = () => {
    const salesTrend = [];
    const inventoryTrend = [];
    const userActivity = [];
    const warehousePerformance = [];
    const productPerformance = [];
    const financialMetrics = [];

    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      salesTrend.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 100000) + 20000,
        orders: Math.floor(Math.random() * 50) + 10,
        profit: Math.floor(Math.random() * 20000) + 5000
      });

      inventoryTrend.push({
        date: date.toISOString().split('T')[0],
        stockValue: Math.floor(Math.random() * 50000) + 100000,
        lowStock: Math.floor(Math.random() * 20) + 5,
        outOfStock: Math.floor(Math.random() * 5)
      });

      userActivity.push({
        date: date.toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 30) + 10,
        newUsers: Math.floor(Math.random() * 5) + 1,
        orders: Math.floor(Math.random() * 40) + 10
      });
    }

    // Warehouse Performance
    const warehouses = ['Main Warehouse', 'Central Hub', 'North Depot', 'South Center', 'East Branch', 'West Facility'];
    warehouses.forEach((warehouse, index) => {
      warehousePerformance.push({
        name: warehouse,
        utilization: Math.floor(Math.random() * 40) + 40,
        efficiency: Math.floor(Math.random() * 30) + 70,
        capacity: 10000,
        currentStock: Math.floor(Math.random() * 8000) + 2000,
        orders: Math.floor(Math.random() * 100) + 20
      });
    });

    // Product Performance
    const products = ['Laptops', 'Monitors', 'Keyboards', 'Mice', 'Chairs', 'Desks', 'Printers', 'Scanners'];
    products.forEach((product, index) => {
      productPerformance.push({
        name: product,
        sales: Math.floor(Math.random() * 500) + 100,
        revenue: Math.floor(Math.random() * 100000) + 20000,
        profit: Math.floor(Math.random() * 20000) + 5000,
        stock: Math.floor(Math.random() * 1000) + 100,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      });
    });

    // Financial Metrics
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      financialMetrics.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 500000) + 100000,
        profit: Math.floor(Math.random() * 100000) + 20000,
        expenses: Math.floor(Math.random() * 300000) + 50000,
        roi: Math.floor(Math.random() * 30) + 10
      });
    }

    setChartData({
      salesTrend,
      inventoryTrend,
      userActivity,
      warehousePerformance,
      productPerformance,
      financialMetrics
    });
  };

  const generateMockNotifications = () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'alert',
        title: 'Low Stock Alert',
        message: '15 products are running low on stock',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        priority: 'high',
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Order Completed',
        message: 'Order #1234 has been successfully delivered',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        priority: 'medium',
        read: false
      },
      {
        id: 3,
        type: 'info',
        title: 'New User Registered',
        message: 'John Doe has been added to the system',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        priority: 'low',
        read: true
      },
      {
        id: 4,
        type: 'warning',
        title: 'System Maintenance',
        message: 'Scheduled maintenance in 2 hours',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        priority: 'medium',
        read: false
      }
    ];

    const mockAlerts = [
      {
        id: 1,
        type: 'critical',
        title: 'Out of Stock',
        message: 'Product "Wireless Mouse" is out of stock',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        action: 'Restock immediately'
      },
      {
        id: 2,
        type: 'warning',
        title: 'High Return Rate',
        message: 'Product "Office Chair" has 15% return rate',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        action: 'Review product quality'
      },
      {
        id: 3,
        type: 'info',
        title: 'Warehouse Full',
        message: 'Main Warehouse is 95% full',
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        action: 'Consider expansion'
      }
    ];

    setNotifications(mockNotifications);
    setSystemAlerts(mockAlerts);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Component for Stat Cards
  const StatCard = ({ title, value, icon: Icon, trend, color = "blue", subtitle, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-200 hover:shadow-xl border-l-4 border-${color}-500`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 truncate">{value ? value.toLocaleString() : '0'}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs sm:text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full bg-${color}-100 flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  // Component for Charts
  const ChartCard = ({ title, children, className = "", onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          <button 
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              // Maximize chart functionality
              console.log('Maximize chart:', title);
            }}
          >
            <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button 
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              // Download chart functionality
              console.log('Download chart:', title);
            }}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      {children}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Advanced Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">Advanced Dashboard</h1>
              <p className="text-base text-gray-600 truncate">Real-time inventory management analytics</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              
              {/* Refresh Button */}
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {/* Settings */}
              <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-1 mb-4 bg-white rounded-lg p-1 shadow-sm custom-scrollbar">
          {['overview', 'analytics', 'inventory', 'sales', 'users', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">System Health</p>
                    <p className="text-2xl font-bold capitalize">{dashboardData.realTimeMetrics.systemHealth}</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-xs text-blue-100">All systems operational</span>
                    </div>
                  </div>
                  <Activity className="w-8 h-8 text-blue-200" />
                </div>
              </motion.div>

              <StatCard
                title="Online Users"
                value={dashboardData.realTimeMetrics.onlineUsers}
                icon={Users}
                color="green"
                subtitle="Active now"
                onClick={() => window.location.href = '/users/advanced'}
              />

              <StatCard
                title="Active Orders"
                value={dashboardData.realTimeMetrics.activeOrders}
                icon={ShoppingCart}
                color="orange"
                subtitle="In progress"
                onClick={() => window.location.href = '/sales'}
              />

              <StatCard
                title="Critical Alerts"
                value={dashboardData.realTimeMetrics.criticalAlerts}
                icon={AlertTriangle}
                color="red"
                subtitle="Requires attention"
                onClick={() => window.location.href = '/reports/advanced'}
              />
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                title="Total Products"
                value={dashboardData.summary.totalProducts}
                icon={Package}
                color="blue"
                trend={12.5}
                subtitle="Active inventory items"
                onClick={() => window.location.href = '/products'}
              />

              <StatCard
                title="Total Stock Value"
                value={dashboardData.summary.totalItemsInStock}
                icon={Warehouse}
                color="green"
                trend={8.3}
                subtitle="Items in warehouses"
                onClick={() => window.location.href = '/warehouses'}
              />

              <StatCard
                title="Total Revenue"
                value={dashboardData.summary.totalRevenue}
                icon={DollarSign}
                color="purple"
                trend={15.2}
                subtitle="This month"
                onClick={() => window.location.href = '/reports/advanced'}
              />

              <StatCard
                title="Total Profit"
                value={dashboardData.summary.totalProfit}
                icon={TrendingUp}
                color="green"
                trend={22.1}
                subtitle="Net profit margin"
                onClick={() => window.location.href = '/reports/advanced'}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
              {/* Sales Trend Chart */}
              <ChartCard 
                title="Sales Trend (30 Days)"
                onClick={() => window.location.href = '/reports/advanced'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#6366F1" 
                      strokeWidth={3} 
                      dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Inventory Status Chart */}
              <ChartCard 
                title="Inventory Overview"
                onClick={() => window.location.href = '/warehouses'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'In Stock', value: dashboardData.summary.totalItemsInStock - dashboardData.inventoryMetrics.outOfStockProducts },
                        { name: 'Low Stock', value: dashboardData.inventoryMetrics.lowStockProducts },
                        { name: 'Out of Stock', value: dashboardData.inventoryMetrics.outOfStockProducts }
                      ]}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent < 0.02) return null; // Don't show label if less than 2%
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 30;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#374151" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            style={{ fontSize: '13px', fontWeight: '500' }}
                          >
                            {`${(percent * 100).toFixed(1)}%`}
                          </text>
                        );
                      }}
                      outerRadius={80}
                      innerRadius={0}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {[
                        { name: 'In Stock', value: 1 },
                        { name: 'Low Stock', value: 1 },
                        { name: 'Out of Stock', value: 1 }
                      ].map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#10B981', '#F59E0B', '#EF4444'][index]}
                          stroke="#fff"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ 
                        paddingTop: '15px',
                        fontSize: '13px'
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Warehouse Performance */}
            <ChartCard 
              title="Warehouse Performance"
              onClick={() => window.location.href = '/warehouses'}
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.warehousePerformance} barGap={8}>
                  <defs>
                    <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar 
                    dataKey="utilization" 
                    fill="url(#colorUtilization)"
                    radius={[6, 6, 0, 0]}
                    name="Utilization %"
                  />
                  <Bar 
                    dataKey="efficiency" 
                    fill="url(#colorEfficiency)"
                    radius={[6, 6, 0, 0]}
                    name="Efficiency %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Notifications & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Recent Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                      notification.priority === 'high' ? 'border-red-500 bg-red-50' :
                      notification.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* System Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-blue-600 mt-1 font-medium">{alert.action}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <ChartCard title="Financial Performance">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData.financialMetrics}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#6366F1" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="profit" stackId="1" stroke="#10B981" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="User Activity">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#6366F1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366F1', strokeWidth: 2, r: 3 }}
                      name="Active Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newUsers" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                      name="New Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Product Performance">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.productPerformance.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#3B82F6" />
                    <Bar dataKey="revenue" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Inventory Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                title="Total Products"
                value={dashboardData.summary.totalProducts}
                icon={Package}
                color="blue"
                subtitle="Active inventory items"
                onClick={() => window.location.href = '/products'}
              />
              <StatCard
                title="Items in Stock"
                value={dashboardData.summary.totalItemsInStock}
                icon={Warehouse}
                color="green"
                subtitle="Available inventory"
                onClick={() => window.location.href = '/warehouses'}
              />
              <StatCard
                title="Low Stock Items"
                value={dashboardData.inventoryMetrics.lowStockProducts}
                icon={AlertTriangle}
                color="orange"
                subtitle="Need restocking"
                onClick={() => window.location.href = '/products'}
              />
              <StatCard
                title="Out of Stock"
                value={dashboardData.inventoryMetrics.outOfStockProducts}
                icon={XCircle}
                color="red"
                subtitle="Requires immediate attention"
                onClick={() => window.location.href = '/products'}
              />
            </div>

            {/* Inventory Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <ChartCard 
                title="Inventory Distribution"
                onClick={() => window.location.href = '/warehouses'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'In Stock', value: dashboardData.summary.totalItemsInStock - dashboardData.inventoryMetrics.outOfStockProducts },
                        { name: 'Low Stock', value: dashboardData.inventoryMetrics.lowStockProducts },
                        { name: 'Out of Stock', value: dashboardData.inventoryMetrics.outOfStockProducts }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard 
                title="Warehouse Performance"
                onClick={() => window.location.href = '/warehouses'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.warehousePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="capacity" fill="#3B82F6" />
                    <Bar dataKey="utilization" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Sales Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <StatCard
                title="Total Revenue"
                value={dashboardData.summary.totalRevenue}
                icon={DollarSign}
                color="green"
                subtitle="This month"
                onClick={() => window.location.href = '/sales'}
              />
              <StatCard
                title="Total Profit"
                value={dashboardData.summary.totalProfit}
                icon={TrendingUp}
                color="blue"
                subtitle="Net profit"
                onClick={() => window.location.href = '/reports/advanced'}
              />
              <StatCard
                title="Active Orders"
                value={dashboardData.realTimeMetrics.activeOrders}
                icon={ShoppingCart}
                color="orange"
                subtitle="In progress"
                onClick={() => window.location.href = '/sales'}
              />
              <StatCard
                title="Completed Orders"
                value={dashboardData.summary.totalOrders - dashboardData.realTimeMetrics.activeOrders}
                icon={CheckCircle}
                color="purple"
                subtitle="Successfully delivered"
                onClick={() => window.location.href = '/sales'}
              />
            </div>

            {/* Sales Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <ChartCard 
                title="Sales Trend"
                onClick={() => window.location.href = '/reports/advanced'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard 
                title="Top Selling Products"
                onClick={() => window.location.href = '/products'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.productPerformance.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#3B82F6" />
                    <Bar dataKey="revenue" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* User Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                title="Total Users"
                value={dashboardData.summary.totalUsers}
                icon={Users}
                color="blue"
                subtitle="Registered users"
                onClick={() => window.location.href = '/users/advanced'}
              />
              <StatCard
                title="Active Users"
                value={dashboardData.realTimeMetrics.onlineUsers}
                icon={CheckCircle}
                color="green"
                subtitle="Online now"
                onClick={() => window.location.href = '/users/advanced'}
              />
              <StatCard
                title="Admin Users"
                value={dashboardData.summary.totalUsers > 0 ? Math.floor(dashboardData.summary.totalUsers * 0.1) : 0}
                icon={Crown}
                color="red"
                subtitle="Administrators"
                onClick={() => window.location.href = '/users/advanced'}
              />
              <StatCard
                title="New This Month"
                value={dashboardData.summary.totalUsers > 0 ? Math.floor(dashboardData.summary.totalUsers * 0.05) : 0}
                icon={UserPlus}
                color="purple"
                subtitle="Recent registrations"
                onClick={() => window.location.href = '/users/advanced'}
              />
            </div>

            {/* User Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <ChartCard 
                title="User Activity"
                onClick={() => window.location.href = '/users/advanced'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="activeUsers" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="newUsers" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard 
                title="User Roles Distribution"
                onClick={() => window.location.href = '/users/advanced'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Admin', value: Math.floor(dashboardData.summary.totalUsers * 0.1) },
                        { name: 'Manager', value: Math.floor(dashboardData.summary.totalUsers * 0.2) },
                        { name: 'Employee', value: Math.floor(dashboardData.summary.totalUsers * 0.7) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#3B82F6'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Reports Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <StatCard
                title="Financial Reports"
                value={12}
                icon={FileText}
                color="green"
                subtitle="Generated this month"
                onClick={() => window.location.href = '/reports/advanced'}
              />
              <StatCard
                title="Inventory Reports"
                value={8}
                icon={Package}
                color="blue"
                subtitle="Stock analysis"
                onClick={() => window.location.href = '/reports/advanced'}
              />
              <StatCard
                title="Sales Reports"
                value={15}
                icon={TrendingUp}
                color="purple"
                subtitle="Revenue analysis"
                onClick={() => window.location.href = '/reports/advanced'}
              />
              <StatCard
                title="User Reports"
                value={5}
                icon={Users}
                color="orange"
                subtitle="Activity analysis"
                onClick={() => window.location.href = '/reports/advanced'}
              />
            </div>

            {/* Reports Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <ChartCard 
                title="Report Generation Trend"
                onClick={() => window.location.href = '/reports/advanced'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData.financialMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                    <Area type="monotone" dataKey="profit" stackId="1" stroke="#10B981" fill="#10B981" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard 
                title="Report Categories"
                onClick={() => window.location.href = '/reports/advanced'}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Financial', count: 12 },
                    { name: 'Inventory', count: 8 },
                    { name: 'Sales', count: 15 },
                    { name: 'Users', count: 5 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAdminDashboard;
