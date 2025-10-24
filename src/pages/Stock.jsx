import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Stock = () => {
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustFormData, setAdjustFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    type: 'adjustment',
    notes: ''
  });

  useEffect(() => {
    fetchStock();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await axios.get('/api/stock');
      // Sort by creation date - newest first
      const sortedStock = (response.data || []).sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      setStock(sortedStock);
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to fetch stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('/api/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      const adjustData = {
        ...adjustFormData,
        productId: parseInt(adjustFormData.productId),
        warehouseId: parseInt(adjustFormData.warehouseId),
        quantity: parseInt(adjustFormData.quantity)
      };

      await axios.post('/api/stock/adjust', adjustData);
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      resetAdjustForm();
      fetchStock();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const resetAdjustForm = () => {
    setAdjustFormData({
      productId: '',
      warehouseId: '',
      quantity: '',
      type: 'adjustment',
      notes: ''
    });
  };

  const getStockStatus = (actualStock, minStock) => {
    if (actualStock <= 0) return { color: 'text-red-600', label: 'Out of Stock' };
    if (actualStock <= minStock) return { color: 'text-yellow-600', label: 'Low Stock' };
    return { color: 'text-green-600', label: 'In Stock' };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage inventory stock levels across all warehouses
            </p>
          </div>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="btn-primary"
          >
            Adjust Stock
          </button>
        </div>

        {/* Stock Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Warehouse</th>
                  <th className="table-header">Actual Stock</th>
                  <th className="table-header">Reserved</th>
                  <th className="table-header">Projected</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stock.map((item) => {
                  const status = getStockStatus(item.actualStock, item.product.stockAlertThreshold);
                  return (
                    <tr key={`${item.productId}-${item.warehouseId}`}>
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-500 font-mono">{item.product.sku}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.warehouse.name}</div>
                          <div className="text-sm text-gray-500">{item.warehouse.location}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-lg font-semibold">{item.actualStock}</span>
                        <span className="text-sm text-gray-500 ml-1">{item.product.unit}</span>
                      </td>
                      <td className="table-cell">{item.reservedStock}</td>
                      <td className="table-cell">{item.projectedStock}</td>
                      <td className="table-cell">
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adjust Stock Modal */}
        {showAdjustModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust Stock</h3>
                <form onSubmit={handleAdjustSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product *</label>
                    <select
                      name="productId"
                      required
                      className="input-field"
                      value={adjustFormData.productId}
                      onChange={(e) => setAdjustFormData({...adjustFormData, productId: e.target.value})}
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse *</label>
                    <select
                      name="warehouseId"
                      required
                      className="input-field"
                      value={adjustFormData.warehouseId}
                      onChange={(e) => setAdjustFormData({...adjustFormData, warehouseId: e.target.value})}
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} - {warehouse.location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      name="type"
                      required
                      className="input-field"
                      value={adjustFormData.type}
                      onChange={(e) => setAdjustFormData({...adjustFormData, type: e.target.value})}
                    >
                      <option value="adjustment">Direct Adjustment</option>
                      <option value="receipt">Receipt (Add Stock)</option>
                      <option value="dispatch">Dispatch (Remove Stock)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      className="input-field"
                      value={adjustFormData.quantity}
                      onChange={(e) => setAdjustFormData({...adjustFormData, quantity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      className="input-field"
                      value={adjustFormData.notes}
                      onChange={(e) => setAdjustFormData({...adjustFormData, notes: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAdjustModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Adjust Stock
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Stock;
