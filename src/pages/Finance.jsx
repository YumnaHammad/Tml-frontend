import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart, Warehouse, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import api from '../services/api';
import toast from 'react-hot-toast';

const Finance = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Financial Data
  const [financeData, setFinanceData] = useState({
    totalPurchases: 0,
    totalSales: 0,
    totalWarehouseValue: 0,
    netProfit: 0,
    purchaseCount: 0,
    salesCount: 0,
    totalItems: 0
  });
  
  // Detailed Records
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    fetchFinanceData();
  }, [timeFilter]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel with proper population
      const [purchasesRes, salesRes, warehousesRes] = await Promise.all([
        api.get('/purchases?limit=1000&populate=supplierId,items.productId'),
        api.get('/sales?limit=1000'),
        api.get('/warehouses?populate=currentStock.productId')
      ]);

      const purchasesData = purchasesRes.data?.purchases || [];
      const salesData = salesRes.data?.salesOrders || salesRes.data?.sales || [];
      const warehousesData = warehousesRes.data || [];

      console.log('Purchases Data:', purchasesData);
      console.log('Sales Data:', salesData);
      console.log('Warehouses Data:', warehousesData);

      // Filter by time
      const filteredPurchases = filterByTime(purchasesData);
      const filteredSales = filterByTime(salesData);

      // Calculate financial metrics with actual data
      const totalPurchases = filteredPurchases.reduce((sum, p) => {
        const subtotal = p.totalAmount || 0;
        const tax = p.taxAmount || 0;
        const discount = p.discountAmount || 0;
        const finalAmount = subtotal + tax - discount;
        console.log(`Purchase ${p.purchaseNumber}: subtotal=${subtotal}, tax=${tax}, discount=${discount}, final=${finalAmount}`);
        return sum + finalAmount;
      }, 0);

      const totalSales = filteredSales
        .filter(sale => sale.status !== 'returned' && sale.status !== 'cancelled')
        .reduce((sum, s) => {
          const amount = s.totalAmount || 0;
          console.log(`Sale ${s.orderNumber} (${s.status}): amount=${amount}`);
          return sum + amount;
        }, 0);

      // Calculate warehouse stock value with actual product prices
      let totalWarehouseValue = 0;
      const enrichedWarehouses = warehousesData.map(warehouse => {
        const stockValue = warehouse.currentStock.reduce((sum, item) => {
          // Get unit price from product or use item's unit price
          const unitPrice = item.unitPrice || item.productId?.sellingPrice || 0;
          const quantity = item.quantity || 0;
          const itemValue = unitPrice * quantity;
          
          if (itemValue > 0) {
            console.log(`Stock: ${item.productId?.name} - Qty: ${quantity}, Price: ${unitPrice}, Value: ${itemValue}`);
          }
          
          return sum + itemValue;
        }, 0);
        totalWarehouseValue += stockValue;
        return { ...warehouse, stockValue };
      });

      console.log('Total Purchases:', totalPurchases);
      console.log('Total Sales:', totalSales);
      console.log('Total Warehouse Value:', totalWarehouseValue);

      // Count only non-returned, non-cancelled sales
      const validSalesCount = filteredSales.filter(
        sale => sale.status !== 'returned' && sale.status !== 'cancelled'
      ).length;

      setFinanceData({
        totalPurchases,
        totalSales,
        totalWarehouseValue,
        netProfit: totalSales - totalPurchases,
        purchaseCount: filteredPurchases.length,
        salesCount: validSalesCount,
        totalItems: warehousesData.reduce((sum, w) => sum + (w.currentStock?.length || 0), 0)
      });

      setPurchases(filteredPurchases);
      setSales(filteredSales);
      setWarehouseStock(enrichedWarehouses);
      setWarehouses(warehousesData);

    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const filterByTime = (data) => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return data.filter(item => {
          const itemDate = new Date(item.createdAt || item.purchaseDate || item.orderDate);
          return itemDate.toDateString() === now.toDateString();
        });
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return data.filter(item => {
          const itemDate = new Date(item.createdAt || item.purchaseDate || item.orderDate);
          return itemDate >= weekAgo;
        });
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return data.filter(item => {
          const itemDate = new Date(item.createdAt || item.purchaseDate || item.orderDate);
          return itemDate >= monthAgo;
        });
      default:
        return data;
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <CenteredLoader message="Loading finance data..." size="large" />;
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
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                Finance Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Complete financial overview and records</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                onClick={fetchFinanceData}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Purchases</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(financeData.totalPurchases)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{financeData.purchaseCount} orders</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(financeData.totalSales)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{financeData.salesCount} orders</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Warehouse Value</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(financeData.totalWarehouseValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{financeData.totalItems} items</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Warehouse className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
              financeData.netProfit >= 0 ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Net Profit/Loss</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-2 ${
                  financeData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financeData.netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {financeData.netProfit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                financeData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {financeData.netProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'purchases'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Purchases ({purchases.length})
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sales'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sales ({sales.length})
              </button>
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'warehouse'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Warehouse Stock
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financeData.totalSales)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(financeData.totalPurchases)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Current Inventory Value</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(financeData.totalWarehouseValue)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {financeData.totalSales > 0
                          ? ((financeData.netProfit / financeData.totalSales) * 100).toFixed(2)
                          : '0.00'}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => {
                      const subtotal = purchase.totalAmount || 0;
                      const tax = purchase.taxAmount || 0;
                      const discount = purchase.discountAmount || 0;
                      const total = subtotal + tax - discount;
                      
                      return (
                        <tr key={purchase._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {purchase.purchaseNumber}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {purchase.supplierId?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(purchase.purchaseDate)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {purchase.items?.length || 0}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(tax)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                            -{formatCurrency(discount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              purchase.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : purchase.paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {purchase.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="font-bold">
                      <td colSpan="7" className="px-4 py-4 text-right text-sm text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(financeData.totalPurchases)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.orderNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.customerName || 'Walk-in Customer'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(sale.orderDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.items?.length || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sale.status === 'delivered' || sale.status === 'confirmed_delivered'
                              ? 'bg-green-100 text-green-800'
                              : sale.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="font-bold">
                      <td colSpan="4" className="px-4 py-4 text-right text-sm text-gray-900">
                        Total Revenue:
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(financeData.totalSales)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Warehouse Stock Tab */}
            {activeTab === 'warehouse' && (
              <div className="space-y-6">
                {warehouseStock.map((warehouse) => (
                  <div key={warehouse._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {warehouse.name}
                      </h4>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(warehouse.stockValue)}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Variant
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {warehouse.currentStock?.map((item, index) => {
                            // Get actual unit price from product selling price or item unit price
                            const unitPrice = item.unitPrice || item.productId?.sellingPrice || 0;
                            const quantity = item.quantity || 0;
                            const totalValue = unitPrice * quantity;
                            
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {item.productId?.name || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {item.variantName || 'N/A'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {quantity}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {formatCurrency(unitPrice)}
                                </td>
                                <td className="px-4 py-2 text-sm font-semibold text-purple-600">
                                  {formatCurrency(totalValue)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
