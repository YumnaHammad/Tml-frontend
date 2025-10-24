import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  Warehouse,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw
} from "lucide-react";
import api from "../../services/api";

const AdminDashboard = () => {
  const [dashboardSummary, setDashboardSummary] = useState({
    totalProducts: 0,
    totalItemsInStock: 0,
    totalWarehouses: 0,
    dispatchedProducts: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    },
    returns: {
      thisWeek: 0,
      thisMonth: 0
    },
    deliveredProducts: {
      thisWeek: 0,
      thisMonth: 0
    }
  });

  const [stockAlerts, setStockAlerts] = useState({
    alerts: [],
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    lowAlerts: 0
  });

  const [mainReport, setMainReport] = useState({
    report: [],
    summary: {
      criticalAlerts: 0,
      outOfStock: 0,
      warningAlerts: 0,
      goodStock: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [summaryRes, alertsRes, reportRes] = await Promise.all([
        api.get("/reports/dashboard/summary"),
        api.get("/stock/alerts"),
        api.get("/reports/dashboard/main")
      ]);

      setDashboardSummary(summaryRes.data);
      setStockAlerts(alertsRes.data);
      setMainReport(reportRes.data);

    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const statCards = [
    {
      title: "Total Products",
      value: dashboardSummary.totalProducts,
      icon: Package,
      color: "blue",
      change: "Active",
      changeType: "positive",
    },
    {
      title: "Total Items in Stock",
      value: dashboardSummary.totalItemsInStock.toLocaleString(),
      icon: Warehouse,
      color: "green",
      change: "Across all warehouses",
      changeType: "neutral",
    },
    {
      title: "Total Warehouses",
      value: dashboardSummary.totalWarehouses,
      icon: Warehouse,
      color: "purple",
      change: "Active locations",
      changeType: "positive",
    },
    {
      title: "Dispatched Today",
      value: dashboardSummary.dispatchedProducts.today,
      icon: Truck,
      color: "indigo",
      change: `${dashboardSummary.dispatchedProducts.thisWeek} this week`,
      changeType: "positive",
    },
    {
      title: "Returns This Week",
      value: dashboardSummary.returns.thisWeek,
      icon: RotateCcw,
      color: "orange",
      change: `${dashboardSummary.returns.thisMonth} this month`,
      changeType: "neutral",
    },
    {
      title: "Delivered This Week",
      value: dashboardSummary.deliveredProducts.thisWeek,
      icon: CheckCircle,
      color: "emerald",
      change: `${dashboardSummary.deliveredProducts.thisMonth} this month`,
      changeType: "positive",
    },
  ];

  const getStockAlertColor = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return 'red';
      case 'warning': return 'yellow';
      case 'low': return 'orange';
      default: return 'green';
    }
  };

  const getStockAlertIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'low': return AlertTriangle;
      default: return CheckCircle;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Complete system overview and real-time metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
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
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  {stat.changeType === "positive" ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : stat.changeType === "negative" ? (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
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

      {/* Stock Alerts */}
      {stockAlerts.totalAlerts > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Stock Alerts ({stockAlerts.totalAlerts})
          </h3>
            <div className="flex space-x-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Critical: {stockAlerts.criticalAlerts}
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Warning: {stockAlerts.warningAlerts}
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Low: {stockAlerts.lowAlerts}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {stockAlerts.alerts.slice(0, 5).map((alert, index) => {
              const AlertIcon = getStockAlertIcon(alert.alertLevel);
              const alertColor = getStockAlertColor(alert.alertLevel);
              return (
                <div key={index} className={`p-4 rounded-lg border-l-4 border-${alertColor}-500 bg-${alertColor}-50`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertIcon className={`w-5 h-5 text-${alertColor}-600 mr-3`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.productName}</h4>
                        <p className="text-sm text-gray-600">SKU: {alert.productSku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{alert.currentStock} items</p>
                      <p className="text-xs text-gray-600">{alert.daysOfInventory} days left</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {stockAlerts.alerts.length > 5 && (
              <p className="text-sm text-gray-600 text-center pt-2">
                And {stockAlerts.alerts.length - 5} more alerts...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard Report */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
            Product Stock Overview
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Critical: {mainReport.summary.criticalAlerts}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                Out of Stock: {mainReport.summary.outOfStock}
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Warning: {mainReport.summary.warningAlerts}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Good: {mainReport.summary.goodStock}
              </span>
            </div>
            <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700">
              <Eye className="w-4 h-4" />
              <span className="text-sm">View All</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Current Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Weekly Sales</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Monthly Sales</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mainReport.report.slice(0, 10).map((item, index) => {
                const AlertIcon = getStockAlertIcon(item.stockAlert);
                const alertColor = getStockAlertColor(item.stockAlert);
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">{item.productSku}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{item.currentStock}</span>
                      <span className="text-sm text-gray-600 ml-1">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4">{item.weeklySales}</td>
                    <td className="py-3 px-4">{item.monthlySales}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <AlertIcon className={`w-4 h-4 mr-2 text-${alertColor}-600`} />
                        <span className={`text-sm font-medium text-${alertColor}-600`}>
                          {item.stockAlert === 'critical' ? 'Critical' :
                           item.stockAlert === 'warning' ? 'Warning' :
                           item.stockAlert === 'out_of_stock' ? 'Out of Stock' :
                           'Good'}
                        </span>
                        {item.daysOfInventory < 999 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({item.daysOfInventory} days)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary-600 hover:text-primary-700 text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {mainReport.report.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All {mainReport.report.length} Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
