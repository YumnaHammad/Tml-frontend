import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Package, Plus, Minus, Trash2, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle, Warehouse, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PurchaseFormPage = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showNoWarehouseModal, setShowNoWarehouseModal] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    paymentMethod: 'cash',
    paymentTerms: 'immediate',
    taxAmount: 0,
    discountAmount: 0,
    discountType: 'percentage',
    advancePayment: 0,
    advancePaymentDate: '',
    items: []
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    checkWarehouses();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const checkWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      const warehousesData = response.data || [];
      setWarehouses(warehousesData);
      
      if (warehousesData.length === 0) {
        setShowNoWarehouseModal(true);
      }
    } catch (error) {
      console.error('Error checking warehouses:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        variantId: '',
        quantity: 1,
        unitPrice: 0
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              [field]: value,
              // Reset variant and price when product changes
              ...(field === 'productId' ? {
                variantId: '',
                unitPrice: 0
              } : {}),
              // Update unit price when variant is selected
              ...(field === 'variantId' ? {
                unitPrice: getVariantPrice(value, item.productId)
              } : {}),
              ...(field === 'quantity' || field === 'unitPrice' ? {
                totalPrice: field === 'quantity' ? value * item.unitPrice : item.quantity * value
              } : {})
            }
          : item
      )
    }));
  };

  const getVariantPrice = (variantId, productId) => {
    const product = products.find(p => p._id === productId);
    if (product && product.variants) {
      const variant = product.variants.find(v => v._id === variantId);
      // return variant ? variant.costPrice || variant.sellingPrice : 0;
      return variant ? variant.sellingPrice : 0;
    }
    return 0;
  };

  const getProductVariants = (productId) => {
    const product = products.find(p => p._id === productId);
    return product && product.hasVariants && product.variants ? product.variants : [];
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.supplierId) {
      errors.supplierId = 'Supplier is required';
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item_${index}_productId`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors[`item_${index}_unitPrice`] = 'Unit price must be greater than 0';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const calculateFinalAmount = () => {
    const subtotal = calculateTotal();
    const tax = parseFloat(formData.taxAmount) || 0;
    const discount = parseFloat(formData.discountAmount) || 0;
    return subtotal + tax - discount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if warehouses exist
    if (warehouses.length === 0) {
      setShowNoWarehouseModal(true);
      toast.error('Cannot create purchase order without a warehouse');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        ...formData,
        totalAmount: calculateTotal(),
        finalAmount: calculateFinalAmount()
      };
      const response = await api.post('/purchases', purchaseData);
      const newPurchase = response.data.purchase;
      
      // Show success message with more details
      toast.success(`Purchase order ${newPurchase.purchaseNumber} created successfully!`, {
        duration: 4000,
        icon: '✅'
      });
      
      // Store the new purchase in localStorage for immediate access
      const existingPurchases = JSON.parse(localStorage.getItem('tempPurchases') || '[]');
      existingPurchases.unshift(newPurchase);
      localStorage.setItem('tempPurchases', JSON.stringify(existingPurchases));
      
      // If onSuccess callback is provided, use it for immediate state update
      if (onSuccess) {
        onSuccess(newPurchase);
      } else {
        // Navigate back to purchases page
        navigate('/purchases');
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error(error.response?.data?.error || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/purchases')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Purchases</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
              <p className="text-gray-600">Add new purchase from supplier</p>
            </div>
          </div>
      </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Supplier Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors.supplierId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} ({supplier.supplierCode})
                    </option>
              ))}
            </select>
                {validationErrors.supplierId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.supplierId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="check">📝 Check</option>
                  <option value="credit_card">💳 Credit Card</option>
                  <option value="debit_card">💳 Debit Card</option>
                  <option value="mobile_payment">📱 Mobile Payment (JazzCash, EasyPaisa)</option>
                  <option value="online_transfer">🌐 Online Transfer</option>
                  <option value="letter_of_credit">📄 Letter of Credit</option>
                  <option value="bank_draft">🏦 Bank Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="immediate">⚡ Immediate Payment</option>
                  <option value="net_7">📅 Net 7 Days</option>
                  <option value="net_15">📅 Net 15 Days</option>
                  <option value="net_30">📅 Net 30 Days</option>
                  <option value="net_45">📅 Net 45 Days</option>
                  <option value="net_60">📅 Net 60 Days</option>
                  <option value="on_delivery">🚚 Payment on Delivery</option>
                  <option value="partial">💰 Partial Payment</option>
                  <option value="custom">📋 Custom Terms</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Amount (PKR)
                </label>
                <input
                  type="number"
                  name="taxAmount"
                  value={formData.taxAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="percentage">% Percentage</option>
                  <option value="fixed">PKR Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (PKR)'}
                </label>
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleChange}
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 0.1 : 0.01}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={formData.discountType === 'percentage' ? "0.0" : "0.00"}
                />
                {formData.discountType === 'percentage' && formData.totalAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Discount: PKR {((formData.totalAmount * formData.discountAmount) / 100).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Payment (PKR)
                </label>
                <input
                  type="number"
                  name="advancePayment"
                  value={formData.advancePayment}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Half payment before receiving goods from supplier
                </p>
                {formData.advancePayment > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Remaining Payment:</span> PKR {(formData.totalAmount + (formData.taxAmount || 0) - (formData.discountAmount || 0) - formData.advancePayment).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {formData.advancePayment > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Payment Date
                  </label>
                  <input
                    type="date"
                    name="advancePaymentDate"
                    value={formData.advancePaymentDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Additional notes for this purchase..."
                />
              </div>
          </div>
        </div>

          {/* Purchase Items */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Purchase Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            {validationErrors.items && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {validationErrors.items}
                </p>
              </div>
            )}

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
        <div className="space-y-4">
          {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Product Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product *
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              validationErrors[`item_${index}_productId`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select Product</option>
                            {products.map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                          {validationErrors[`item_${index}_productId`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors[`item_${index}_productId`]}
                            </p>
                          )}
                        </div>

                        {/* Variant Selection - Only show if product has variants */}
                        {item.productId && getProductVariants(item.productId).length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Variant *
                            </label>
                            <select
                              value={item.variantId || ''}
                              onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                validationErrors[`item_${index}_variantId`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Variant</option>
                              {getProductVariants(item.productId).map(variant => (
                                <option key={variant._id || variant.sku} value={variant._id || variant.sku}>
                                  {variant.name} - PKR {variant.sellingPrice}
                                </option>
                              ))}
                            </select>
                            {validationErrors[`item_${index}_variantId`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {validationErrors[`item_${index}_variantId`]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity and Price */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            validationErrors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors[`item_${index}_quantity`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors[`item_${index}_quantity`]}
                          </p>
                        )}
            </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            validationErrors[`item_${index}_unitPrice`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors[`item_${index}_unitPrice`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors[`item_${index}_unitPrice`]}
                          </p>
                        )}
        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Price
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                            PKR {(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {formData.items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">PKR {calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    {parseFloat(formData.taxAmount) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium text-green-600">+PKR {parseFloat(formData.taxAmount).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {parseFloat(formData.discountAmount) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-red-600">-PKR {parseFloat(formData.discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-300 pt-2">
                      <p className="text-lg font-bold text-primary-600">
                        Final Amount: PKR {calculateFinalAmount().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </>
              )}
          </button>
        </div>
        </motion.form>
      </div>

      {/* No Warehouse Warning Modal */}
      {showNoWarehouseModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                navigate('/purchases');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">No Warehouse Found</h3>
                    <p className="text-sm text-gray-500 mt-1">Action Required</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/purchases')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-800 font-medium mb-1">
                        Cannot Create Purchase Order
                      </p>
                      <p className="text-sm text-orange-700">
                        You need to create at least one warehouse before you can purchase products.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Warehouses are required to store purchased products. Please create a warehouse first:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 ml-5">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Go to <strong>Warehouses</strong> module</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Click <strong>"Add Warehouse"</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Fill in the warehouse details and save</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/purchases')}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={() => {
                    setShowNoWarehouseModal(false);
                    navigate('/warehouses');
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Warehouse className="w-4 h-4" />
                  <span>Create Warehouse</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default PurchaseFormPage;
