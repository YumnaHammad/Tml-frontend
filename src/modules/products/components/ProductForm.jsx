import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { motion } from 'framer-motion';
import {
  Package,
  X,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';

const ProductForm = ({ product, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'piece',
    // costPrice: '', // Commented out
    sellingPrice: '',
    description: '',
    currentStock: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    fetchWarehouses();
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        unit: product.unit || 'piece',
        // costPrice: product.costPrice || '', // Commented out
        sellingPrice: product.sellingPrice || '',
        description: product.description || '',
        currentStock: product.currentStock || 0
      });
    }
  }, [product]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      // if (formData.costPrice <= 0 || formData.sellingPrice <= 0) {
      //   throw new Error('Prices must be greater than 0');
      // }
      if (formData.sellingPrice <= 0) {
        throw new Error('Selling price must be greater than 0');
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    setFormData({
      ...formData,
      sku: `${prefix}-${timestamp}`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-2 text-primary-600" />
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="input-field"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  required
                  className="input-field rounded-r-none"
                  placeholder="Enter or generate SKU"
                  value={formData.sku}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="input-field"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Tools">Tools</option>
                <option value="Materials">Materials</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                id="unit"
                name="unit"
                required
                className="input-field"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram</option>
                <option value="liter">Liter</option>
                <option value="meter">Meter</option>
                <option value="box">Box</option>
                <option value="set">Set</option>
              </select>
            </div>

            {/* Cost Price */}
            {/* <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (PKR) *
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={handleChange}
              />
            </div> */}

            {/* Selling Price */}
            <div>
              <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (PKR) *
              </label>
              <input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="input-field"
              placeholder="Enter product description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Initial Stock */}
          <div>
            <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Stock
            </label>
            <input
              type="number"
              id="currentStock"
              name="currentStock"
              min="0"
              className="input-field"
              placeholder="0"
              value={formData.currentStock}
              onChange={handleChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {product ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductForm;
