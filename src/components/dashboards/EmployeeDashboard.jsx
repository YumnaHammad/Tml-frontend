import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Truck,
  Eye,
  TrendingUp,
  AlertTriangle,
  Activity,
  CheckCircle,
  Warehouse,
  DollarSign,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    productsToProcess: 0,
    ordersToFulfill: 0,
    lowStockItems: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalWarehouses: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching employee dashboard data...');
      
      // Fetch data accessible to employees
      const [productsRes, salesRes, purchasesRes, warehousesRes] = await Promise.all([
        api.get('/products'),
        api.get('/sales'),
        api.get('/purchases'),
        api.get('/warehouses')
      ]);

      // Extract data based on actual API response structure
      const products = productsRes.data?.products || [];
      const sales = salesRes.data?.salesOrders || []; // Sales API returns salesOrders
      const purchases = purchasesRes.data?.purchases || [];
      const warehouses = Array.isArray(warehousesRes.data) ? warehousesRes.data : warehousesRes.data?.warehouses || [];

      console.log('Employee Dashboard Data:', { products, sales, purchases, warehouses });
      console.log('Data types:', { 
        products: Array.isArray(products), 
        sales: Array.isArray(sales), 
        purchases: Array.isArray(purchases), 
        warehouses: Array.isArray(warehouses) 
      });

      // Calculate today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate today's activities
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.orderDate || sale.createdAt || sale.date);
        return saleDate >= today;
      });

      const todayPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt || purchase.date);
        return purchaseDate >= today;
      });

      // Calculate low stock products
      const lowStockItems = products.filter(p => (p.currentStock || p.stock || 0) <= 5);
      
      // Get pending orders
      const pendingOrders = sales.filter(s => s.status === 'pending' || s.status === 'processing');
      
      // Get recent activity (last 10 activities)
      const recentActivity = [
        ...sales.slice(0, 3).map(sale => ({
          action: `Sale order #${sale.orderNumber || sale._id?.slice(-6)} processed`,
          time: new Date(sale.orderDate || sale.createdAt || sale.date).toLocaleString(),
          type: 'success'
        })),
        ...purchases.slice(0, 2).map(purchase => ({
          action: `Purchase order #${purchase.purchaseNumber || purchase._id?.slice(-6)} received`,
          time: new Date(purchase.purchaseDate || purchase.createdAt || purchase.date).toLocaleString(),
          type: 'info'
        })),
        ...lowStockItems.slice(0, 2).map(item => ({
          action: `Low stock alert: ${item.name || item.productName} (${item.currentStock || item.stock} left)`,
          time: new Date().toLocaleString(),
          type: 'warning'
        }))
      ].slice(0, 5);

      setStats({
        assignedTasks: pendingOrders.length + lowStockItems.length,
        completedTasks: todaySales.length + todayPurchases.length,
        productsToProcess: products.length,
        ordersToFulfill: pendingOrders.length,
        lowStockItems: lowStockItems.length,
        totalSales: sales.length,
        totalPurchases: purchases.length,
        totalWarehouses: warehouses.length,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching employee dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Set default data if API fails
      setStats({
        assignedTasks: 0,
        completedTasks: 0,
        productsToProcess: 0,
        ordersToFulfill: 0,
        lowStockItems: 0,
        totalSales: 0,
        totalPurchases: 0,
        totalWarehouses: 0,
        recentActivity: [
          { action: 'System data unavailable', time: 'Just now', type: 'warning' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Assigned Tasks',
      value: stats.assignedTasks,
      icon: Activity,
      color: 'blue',
      change: stats.assignedTasks > 0 ? `+${stats.assignedTasks}` : '0',
      changeType: stats.assignedTasks > 0 ? 'positive' : 'neutral',
      onClick: () => navigate('/sales')
    },
    {
      title: 'Completed Today',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'green',
      change: stats.completedTasks > 0 ? `+${stats.completedTasks}` : '0',
      changeType: stats.completedTasks > 0 ? 'positive' : 'neutral',
      onClick: () => navigate('/sales')
    },
    {
      title: 'Total Products',
      value: stats.productsToProcess,
      icon: Package,
      color: 'purple',
      change: stats.productsToProcess > 0 ? `${stats.productsToProcess} items` : '0',
      changeType: 'neutral',
      onClick: () => navigate('/products')
    },
    {
      title: 'Orders to Fulfill',
      value: stats.ordersToFulfill,
      icon: Truck,
      color: 'orange',
      change: stats.ordersToFulfill > 0 ? `${stats.ordersToFulfill} pending` : '0',
      changeType: stats.ordersToFulfill > 0 ? 'negative' : 'neutral',
      onClick: () => navigate('/sales')
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'red',
      change: stats.lowStockItems > 0 ? `${stats.lowStockItems} alerts` : '0',
      changeType: stats.lowStockItems > 0 ? 'negative' : 'neutral',
      onClick: () => navigate('/products')
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: DollarSign,
      color: 'indigo',
      change: stats.totalSales > 0 ? `${stats.totalSales} orders` : '0',
      changeType: 'neutral',
      onClick: () => navigate('/sales')
    },
    {
      title: 'Total Purchases',
      value: stats.totalPurchases,
      icon: ShoppingCart,
      color: 'teal',
      change: stats.totalPurchases > 0 ? `${stats.totalPurchases} orders` : '0',
      changeType: 'neutral',
      onClick: () => navigate('/purchases')
    },
    {
      title: 'Warehouses',
      value: stats.totalWarehouses,
      icon: Warehouse,
      color: 'cyan',
      change: stats.totalWarehouses > 0 ? `${stats.totalWarehouses} locations` : '0',
      changeType: 'neutral',
      onClick: () => navigate('/warehouses')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600 mt-2">Your tasks and daily operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : stat.changeType === 'negative' ? (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/products')}
            className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
          >
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Manage Products</span>
            <span className="text-xs text-gray-500 block mt-1">{stats.productsToProcess} items</span>
          </button>
          <button 
            onClick={() => navigate('/sales')}
            className="p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
          >
            <ShoppingCart className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Process Sales</span>
            <span className="text-xs text-gray-500 block mt-1">{stats.ordersToFulfill} pending</span>
          </button>
          <button 
            onClick={() => navigate('/purchases')}
            className="p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
          >
            <Truck className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Manage Purchases</span>
            <span className="text-xs text-gray-500 block mt-1">{stats.totalPurchases} orders</span>
          </button>
          <button 
            onClick={() => navigate('/warehouses')}
            className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
          >
            <Warehouse className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">View Warehouses</span>
            <span className="text-xs text-gray-500 block mt-1">{stats.totalWarehouses} locations</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className={`p-2 rounded-lg ${
                activity.type === 'success' ? 'bg-green-100' :
                activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <Activity className={`h-5 w-5 ${
                  activity.type === 'success' ? 'text-green-600' :
                  activity.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
