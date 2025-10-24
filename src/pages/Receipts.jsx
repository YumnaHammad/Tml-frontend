import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    unitCost: '',
    supplier: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchReceipts();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await axios.get('/api/receipts');
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to fetch receipts');
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
      const receiptData = {
        ...formData,
        productId: parseInt(formData.productId),
        warehouseId: parseInt(formData.warehouseId),
        quantity: parseInt(formData.quantity),
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null
      };

      await axios.post('/api/receipts', receiptData);
      toast.success('Receipt created successfully');
      setShowModal(false);
      resetForm();
      fetchReceipts();
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error(error.response?.data?.error || 'Failed to create receipt');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      warehouseId: '',
      quantity: '',
      unitCost: '',
      supplier: '',
      reference: '',
      notes: ''
    });
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
            <h1 className="text-2xl font-bold text-gray-900">Stock Receipts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record incoming stock and update inventory levels
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add New Receipt
          </button>
        </div>

        {/* Receipts Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Product</th>
                  <th className="table-header">Warehouse</th>
                  <th className="table-header">Quantity</th>
                  <th className="table-header">Unit Cost</th>
                  <th className="table-header">Total Cost</th>
                  <th className="table-header">Supplier</th>
                  <th className="table-header">Received By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="table-cell">
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{receipt.product.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{receipt.product.sku}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{receipt.warehouse.name}</div>
                        <div className="text-sm text-gray-500">{receipt.warehouse.location}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium">{receipt.quantity}</span>
                      <span className="text-sm text-gray-500 ml-1">{receipt.product.unit}</span>
                    </td>
                    <td className="table-cell">
                      {receipt.unitCost ? `PKR ${receipt.unitCost.toFixed(2)}` : '-'}
                    </td>
                    <td className="table-cell">
                      {receipt.totalCost ? `PKR ${receipt.totalCost.toFixed(2)}` : '-'}
                    </td>
                    <td className="table-cell">{receipt.supplier || '-'}</td>
                    <td className="table-cell">
                      {receipt.receivedByUser ? 
                        `${receipt.receivedByUser.firstName} ${receipt.receivedByUser.lastName}` : 
                        '-'
                      }
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Receipt</h3>
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
                    <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      name="unitCost"
                      className="input-field"
                      value={formData.unitCost}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input
                      type="text"
                      name="supplier"
                      className="input-field"
                      value={formData.supplier}
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
                      Create Receipt
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

export default Receipts;
