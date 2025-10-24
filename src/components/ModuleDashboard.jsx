import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './charts/StatCard';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';
import toast from 'react-hot-toast';
import { useAlert } from '../hooks/useAlert';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';

const ModuleDashboard = ({ module, title }) => {
  const { showError, AlertComponent } = useAlert();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchModuleData();
  }, [module]);

  const fetchModuleData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/dashboard/analytics/${module}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error(`Error fetching ${module} analytics:`, error);
      showError({
        title: 'Analytics Error',
        message: `Failed to fetch ${module} analytics. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchModuleData();
    setRefreshing(false);
    toast.success(`${title} data refreshed`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading {title} analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
          <p className="text-gray-600">Unable to load {title} analytics.</p>
        </div>
      </div>
    );
  }

  const renderModuleContent = () => {
    switch (module) {
      case 'products':
        return (
          <div className="space-y-6">
            {/* Product Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Products"
                value={analyticsData.totalProducts}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Total Variants"
                value={analyticsData.totalVariants}
                icon={Activity}
                color="green"
              />
              <StatCard
                title="Low Stock Products"
                value={analyticsData.lowStockProducts}
                icon={AlertTriangle}
                color="yellow"
              />
            </div>

            {/* Product Stock Distribution */}
            <BarChart
              data={analyticsData.stockDistribution.map(product => ({
                name: product.name,
                stock: product.totalStock,
                variants: product.variants,
                value: product.value
              }))}
              dataKey="stock"
              xAxisKey="name"
              title="Product Stock Distribution"
              color="#3B82F6"
            />

            {/* Product Value Distribution */}
            <BarChart
              data={analyticsData.stockDistribution.map(product => ({
                name: product.name,
                value: product.value
              }))}
              dataKey="value"
              xAxisKey="name"
              title="Product Value Distribution ($)"
              color="#10B981"
            />
          </div>
        );

      case 'purchases':
        return (
          <div className="space-y-6">
            {/* Purchase Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Orders"
                value={analyticsData.totalOrders}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Total Value"
                value={`PKR ${analyticsData.totalValue.toFixed(2)}`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Average Order Value"
                value={`$${analyticsData.averageOrderValue.toFixed(2)}`}
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* Top Suppliers */}
            <BarChart
              data={Object.entries(analyticsData.topSuppliers).map(([supplier, data]) => ({
                name: supplier,
                orders: data.count,
                total: data.total
              }))}
              dataKey="orders"
              xAxisKey="name"
              title="Top Suppliers by Order Count"
              color="#3B82F6"
            />

            {/* Supplier Value */}
            <BarChart
              data={Object.entries(analyticsData.topSuppliers).map(([supplier, data]) => ({
                name: supplier,
                value: data.total
              }))}
              dataKey="value"
              xAxisKey="name"
              title="Top Suppliers by Total Value ($)"
              color="#10B981"
            />
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            {/* Sales Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Orders"
                value={analyticsData.totalOrders}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Total Revenue"
                value={`PKR ${analyticsData.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Average Order Value"
                value={`$${analyticsData.averageOrderValue.toFixed(2)}`}
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* Top Customers */}
            <BarChart
              data={Object.entries(analyticsData.topCustomers).map(([customer, data]) => ({
                name: customer,
                orders: data.orders,
                total: data.total
              }))}
              dataKey="orders"
              xAxisKey="name"
              title="Top Customers by Order Count"
              color="#3B82F6"
            />

            {/* Customer Value */}
            <BarChart
              data={Object.entries(analyticsData.topCustomers).map(([customer, data]) => ({
                name: customer,
                value: data.total
              }))}
              dataKey="value"
              xAxisKey="name"
              title="Top Customers by Total Value ($)"
              color="#10B981"
            />

            {/* Product Performance */}
            <BarChart
              data={Object.entries(analyticsData.productPerformance).map(([product, data]) => ({
                name: product,
                quantity: data.quantity,
                revenue: data.revenue
              }))}
              dataKey="quantity"
              xAxisKey="name"
              title="Product Performance by Quantity Sold"
              color="#F59E0B"
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Analytics not available for this module.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title} Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">
            Detailed insights and performance metrics for {title.toLowerCase()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary mt-4 sm:mt-0"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </button>
      </div>

      {/* Module Content */}
      {renderModuleContent()}
      
      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
};

export default ModuleDashboard;
