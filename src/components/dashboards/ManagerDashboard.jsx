import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  Eye,
  Plus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalSales: 0,
    totalPurchases: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    todaySales: 0,
    todayPurchases: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch data accessible to managers
      const [productsRes, warehousesRes, salesRes, purchasesRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses'),
        api.get('/sales'),
        api.get('/purchases')
      ]);

      console.log('API Responses:', { productsRes, warehousesRes, salesRes, purchasesRes });

      // Extract data based on actual API response structure
      const products = productsRes.data?.products || [];
      const warehouses = Array.isArray(warehousesRes.data) ? warehousesRes.data : warehousesRes.data?.warehouses || [];
      const sales = salesRes.data?.salesOrders || []; // Sales API returns salesOrders
      const purchases = purchasesRes.data?.purchases || [];

      console.log('Extracted data:', { products, warehouses, sales, purchases });
      console.log('Data types:', { 
        products: Array.isArray(products), 
        warehouses: Array.isArray(warehouses), 
        sales: Array.isArray(sales), 
        purchases: Array.isArray(purchases) 
      });
      
      // Calculate today's sales and purchases
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Debug today's date filtering
      console.log('Today date:', today);
      console.log('Sample sales dates:', sales.slice(0, 2).map(s => ({
        orderNumber: s.orderNumber,
        orderDate: s.orderDate,
        createdAt: s.createdAt,
        isToday: new Date(s.orderDate || s.createdAt) >= today
      })));
      console.log('Sample purchase dates:', purchases.slice(0, 2).map(p => ({
        purchaseNumber: p.purchaseNumber,
        purchaseDate: p.purchaseDate,
        createdAt: p.createdAt,
        isToday: new Date(p.purchaseDate || p.createdAt) >= today
      })));
      
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.orderDate || sale.createdAt || sale.date);
        return saleDate >= today;
      });

      const todayPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt || purchase.date);
        return purchaseDate >= today;
      });

      // Calculate low stock products
      const lowStockProducts = products.filter(p => (p.currentStock || p.stock || 0) <= 5);

      // Get recent sales and purchases (last 5)
      const recentSalesData = sales.slice(0, 5);
      const recentPurchasesData = purchases.slice(0, 5);

      setStats({
        totalProducts: products.length,
        totalWarehouses: warehouses.length,
        totalSales: sales.length,
        totalPurchases: purchases.length,
        lowStockProducts: lowStockProducts.length,
        pendingOrders: sales.filter(s => s.status === 'pending' || s.status === 'processing').length,
        todaySales: todaySales.length,
        todayPurchases: todayPurchases.length
      });

      setRecentSales(recentSalesData);
      setRecentPurchases(recentPurchasesData);
      setLowStockItems(lowStockProducts.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Set some default data if API fails
      setStats({
        totalProducts: 0,
        totalWarehouses: 0,
        totalSales: 0,
        totalPurchases: 0,
        lowStockProducts: 0,
        pendingOrders: 0,
        todaySales: 0,
        todayPurchases: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'blue',
      change: '+2',
      changeType: 'positive',
      onClick: () => navigate('/products')
    },
    {
      title: 'Warehouses',
      value: stats.totalWarehouses,
      icon: Warehouse,
      color: 'purple',
      change: '+1',
      changeType: 'positive',
      onClick: () => navigate('/warehouses')
    },
    {
      title: 'Low Stock Alert',
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: 'red',
      change: '-1',
      changeType: 'negative',
      onClick: () => navigate('/products')
    },
    {
      title: 'Today\'s Sales',
      value: stats.todaySales,
      icon: Truck,
      color: 'green',
      change: '+3',
      changeType: 'positive',
      onClick: () => navigate('/sales')
    },
    {
      title: 'Today\'s Purchases',
      value: stats.todayPurchases,
      icon: ShoppingCart,
      color: 'orange',
      change: '+2',
      changeType: 'positive',
      onClick: () => navigate('/purchases')
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'yellow',
      change: '+1',
      changeType: 'negative',
      onClick: () => navigate('/sales')
    }
  ];

  const quickActions = [
    {
      title: 'New Sale',
      description: 'Create a new sales order',
      icon: Truck,
      color: 'green',
      onClick: () => navigate('/sales/new')
    },
    {
      title: 'New Purchase',
      description: 'Create a new purchase order',
      icon: ShoppingCart,
      color: 'blue',
      onClick: () => navigate('/purchases/new')
    },
    {
      title: 'Manage Products',
      description: 'Add or edit products',
      icon: Package,
      color: 'purple',
      onClick: () => navigate('/products')
    },
    {
      title: 'View Reports',
      description: 'Check sales and inventory reports',
      icon: BarChart3,
      color: 'indigo',
      onClick: () => navigate('/reports')
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage sales, purchases, and inventory operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Operations Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-100 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={action.onClick}
              className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group text-left"
            >
              <div className={`p-3 rounded-lg bg-${action.color}-100 mb-4 inline-block`}>
                <action.icon className={`h-6 w-6 text-${action.color}-600`} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              <div className="flex items-center text-blue-600 group-hover:text-blue-800">
                <span className="text-sm font-medium">Get Started</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Sales</h3>
            <button 
              onClick={() => navigate('/sales')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent sales</p>
            ) : (
              recentSales.map((sale, index) => (
                <motion.div
                  key={sale._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Truck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Sale #{sale.orderNumber || sale._id?.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.customerName || sale.customerInfo?.name || 'Unknown Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {getStatusIcon(sale.status)}
                      <span className="ml-1">{sale.status || 'pending'}</span>
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      PKR {sale.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Purchases</h3>
            <button 
              onClick={() => navigate('/purchases')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentPurchases.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent purchases</p>
            ) : (
              recentPurchases.map((purchase, index) => (
                <motion.div
                  key={purchase._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Purchase #{purchase.purchaseNumber || purchase._id?.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {purchase.supplierName || purchase.supplier?.name || 'Unknown Supplier'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                      {getStatusIcon(purchase.status)}
                      <span className="ml-1">{purchase.status || 'pending'}</span>
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      PKR {purchase.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Low Stock Alert</h3>
            <button 
              onClick={() => navigate('/products')}
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
            >
              Manage Stock
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-red-600 font-medium">
                      Stock: {item.currentStock || 0} units
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;