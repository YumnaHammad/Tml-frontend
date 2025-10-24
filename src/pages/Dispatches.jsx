import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { useAlert } from '../hooks/useAlert';

const Dispatches = () => {
  const { showError, showSuccess, AlertComponent } = useAlert();
  const [dispatches, setDispatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    unitPrice: '',
    customer: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchDispatches();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchDispatches = async () => {
    try {
      const response = await axios.get('/api/dispatches');
      setDispatches(response.data);
    } catch (error) {
      console.error('Error fetching dispatches:', error);
      showError({
        title: 'Fetch Failed',
        message: 'Failed to fetch dispatches. Please try again.'
      });
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dispatchData = {
        ...formData,
        productId: parseInt(formData.productId),
        warehouseId: parseInt(formData.warehouseId),
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null
      };

      await axios.post('/api/dispatches', dispatchData);
      toast.success('Dispatch created successfully');
      setShowModal(false);
      resetForm();
      fetchDispatches();
    } catch (error) {
      console.error('Error creating dispatch:', error);
      toast.error(error.response?.data?.error || 'Failed to create dispatch');
    }
  };

  const handleStatusUpdate = async (dispatchId, newStatus) => {
    try {
      await axios.put(`/api/dispatches/${dispatchId}/status`, { status: newStatus });
      toast.success('Dispatch status updated successfully');
      fetchDispatches();
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      toast.error('Failed to update dispatch status');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      warehouseId: '',
      quantity: '',
      unitPrice: '',
      customer: '',
      reference: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Dispatches</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage outgoing stock and track delivery status
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Create New Dispatch
          </button>
        </div>

        {/* Dispatches Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Product</th>
                  <th className="table-header">Warehouse</th>
                  <th className="table-header">Quantity</th>
                  <th className="table-header">Unit Price</th>
                  <th className="table-header">Total Price</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dispatches.map((dispatch) => (
                  <tr key={dispatch.id}>
                    <td className="table-cell">
                      {new Date(dispatch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dispatch.product?.name || dispatch.productName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          {dispatch.product?.sku || dispatch.productSku || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dispatch.warehouse?.name || dispatch.warehouseName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dispatch.warehouse?.location || dispatch.warehouseLocation || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium">{dispatch.quantity}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        {dispatch.product?.unit || dispatch.productUnit || 'units'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {dispatch.unitPrice ? new Intl.NumberFormat('en-PK', {
                        style: 'currency',
                        currency: 'PKR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(dispatch.unitPrice) : '-'}
                    </td>
                    <td className="table-cell">
                      {dispatch.totalPrice ? new Intl.NumberFormat('en-PK', {
                        style: 'currency',
                        currency: 'PKR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(dispatch.totalPrice) : '-'}
                    </td>
                    <td className="table-cell">{dispatch.customer || '-'}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispatch.status)}`}>
                        {dispatch.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        {dispatch.status === 'reserved' && (
                          <button
                            onClick={() => handleStatusUpdate(dispatch.id, 'shipped')}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Ship
                          </button>
                        )}
                        {dispatch.status === 'shipped' && (
                          <button
                            onClick={() => handleStatusUpdate(dispatch.id, 'delivered')}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Deliver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Dispatch</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product *</label>
                    <select
                      name="productId"
                      required
                      className="input-field"
                      value={formData.productId}
                      onChange={handleInputChange}
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
                      value={formData.warehouseId}
                      onChange={handleInputChange}
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
                    <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      className="input-field"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="unitPrice"
                      className="input-field"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <input
                      type="text"
                      name="customer"
                      className="input-field"
                      value={formData.customer}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <input
                      type="text"
                      name="reference"
                      className="input-field"
                      value={formData.reference}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      className="input-field"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Dispatch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      
        {/* Alert Component */}
        <AlertComponent />
      </Layout>
    </ProtectedRoute>
  );
};

export default Dispatches;
