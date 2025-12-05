import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SalesFormPage = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);
  
  // Get current timestamp
  const getCurrentTimestamp = () => {
    return new Date().toISOString();
  };
  const formatDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
  };
  
  const [formData, setFormData] = useState({
    customerInfo: {
      name: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    deliveryAddress: {
      street: '',
      city: '',
      country: ''
    },
    agentName: '',
    timestamp: getCurrentTimestamp(),
    orderDate: getCurrentTimestamp(),
    notes: '',
    items: [],
    status: 'pending'
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [stockChecks, setStockChecks] = useState({});

  useEffect(() => {
    fetchProducts();
    if (id) {
      fetchSalesOrder(id);
    }
  }, [id]);

  // Fetch existing sales order for editing
  const fetchSalesOrder = async (saleId) => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/${saleId}`);
      const sale = response.data;
      
      setIsEditing(true);
      setOriginalStatus(sale.status);
      
      // Populate form with existing data
      setFormData({
        customerInfo: {
          name: sale.customerInfo?.name || sale.customerName || '',
          phone: sale.customerInfo?.phone || sale.customerPhone || '',
          address: sale.customerInfo?.address || {}
        },
        deliveryAddress: sale.deliveryAddress || {
          street: '',
          city: '',
          country: ''
        },
        agentName: sale.agentName || '',
        timestamp: sale.timestamp || getCurrentTimestamp(),
        orderDate: sale.orderDate || sale.timestamp || sale.createdAt || getCurrentTimestamp(),
        notes: sale.notes || '',
        items: sale.items?.map(item => ({
          productId: item.productId?._id || item.productId || '',
          variantId: item.variantId || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || (item.quantity * item.unitPrice)
        })) || [],
        status: sale.status || 'pending'
      });
    } catch (error) {
      console.error('Error fetching sales order:', error);
      toast.error('Failed to load sales order');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  // Update timestamp when user is available (but don't auto-populate agent name)
  useEffect(() => {
    if (user && !isEditing) {
      const now = new Date().toISOString();
      setFormData(prev => ({
        ...prev,
        timestamp: now,
        orderDate: prev.orderDate || now
      }));
    }
  }, [user, isEditing]);

  const fetchProducts = async () => {
    try {
      // Fetch ALL products first (including inactive ones)
      const productsResponse = await api.get('/products');
      const allProducts = productsResponse.data.products || [];
      
      // Debug: Log all product names to help identify missing products
      console.log('All products fetched:', allProducts.map(p => p.name));
      
      // Fetch warehouses to get ACTUAL purchased stock (with variants)
      const warehousesResponse = await api.get('/warehouses');
      const warehouses = warehousesResponse.data || [];
      
      // Track which product+variant combinations have stock
      const normalizeKey = (value) => {
        if (!value) return '';
        return String(value).toLowerCase().trim().replace(/\s+/g, ' ');
      };

      const productByIdMap = new Map(
        allProducts.map(product => [product._id ? product._id.toString() : '', product])
      );

      const variantStockMap = new Map(); // Key: "productId-variantId", Value: available quantity
      const variantStockByNameMap = new Map(); // Key: "normalizedProductName-normalizedVariantName", Value: available quantity
      const productStockMap = new Map(); // Key: "productId", Value: available quantity
      const productStockByNameMap = new Map(); // Key: "normalizedProductName", Value: available quantity

      warehouses.forEach(warehouse => {
        if (!Array.isArray(warehouse.currentStock)) return;

        warehouse.currentStock.forEach(stockItem => {
          const totalStock = stockItem.quantity || 0;
          const reserved = stockItem.reservedQuantity || 0;
          const delivered = stockItem.deliveredQuantity || 0;
          const confirmedDelivered = stockItem.confirmedDeliveredQuantity || 0;
          const available = Math.max(0, totalStock - reserved - delivered - confirmedDelivered);

          const rawProductId = stockItem.productId?._id || stockItem.productId;
          const productId = rawProductId ? rawProductId.toString() : '';
          const rawVariantId = stockItem.variantId || 'no-variant';
          const variantId = rawVariantId.toString();

          const productRecord = productByIdMap.get(productId);
          const productName = productRecord?.name || stockItem.productId?.name || 'Unknown Product';

          let variantName = stockItem.variantDetails?.name || stockItem.variantName || 'no-variant';
          if (
            productRecord &&
            productRecord.hasVariants &&
            Array.isArray(productRecord.variants) &&
            variantId !== 'no-variant'
          ) {
            const matchedVariant = productRecord.variants.find(
              (v) => (v._id && v._id.toString() === variantId) || (v.sku && v.sku.toString() === variantId)
            );
            if (matchedVariant?.name) {
              variantName = matchedVariant.name;
            }
          }

          if (productId) {
            const idKey = `${productId}-${variantId}`;
            variantStockMap.set(idKey, (variantStockMap.get(idKey) || 0) + available);
            productStockMap.set(productId, (productStockMap.get(productId) || 0) + available);
          }

          const normalizedProductName = normalizeKey(productName);
          const normalizedVariantName = normalizeKey(variantName);

          const nameKey = `${normalizedProductName}-${normalizedVariantName}`;
          variantStockByNameMap.set(nameKey, (variantStockByNameMap.get(nameKey) || 0) + available);

          if (productName) {
            productStockByNameMap.set(
              normalizedProductName,
              (productStockByNameMap.get(normalizedProductName) || 0) + available
            );
          }
        });
      });

      // Show all products, but mark stock availability for each variant/product
      const productsWithStockInfo = allProducts.map(product => {
        const productIdStr = product._id ? product._id.toString() : '';
        const normalizedProductName = normalizeKey(product.name);

        if (product.hasVariants && product.variants && product.variants.length > 0) {
          const variantsWithStockInfo = product.variants.map(variant => {
            const rawVariantId = variant._id || variant.sku || 'no-variant';
            const variantIdStr = rawVariantId.toString();
            const variantKey = `${productIdStr}-${variantIdStr}`;
            const nameKey = `${normalizedProductName}-${normalizeKey(variant.name)}`;
            const availableStock = variantStockMap.get(variantKey) ?? variantStockByNameMap.get(nameKey) ?? 0;

            return {
              ...variant,
              availableStock
            };
          });

          const productAvailableStock = productStockMap.get(productIdStr) ?? productStockByNameMap.get(normalizedProductName) ?? 0;

          return {
            ...product,
            variants: variantsWithStockInfo,
            availableStock: productAvailableStock
          };
        } else {
          const productAvailableStock = productStockMap.get(productIdStr) ?? productStockByNameMap.get(normalizedProductName) ?? 0;

          return {
            ...product,
            availableStock: productAvailableStock
          };
        }
      });
      
      setProducts(productsWithStockInfo);
      
      // Debug: Log products that will be shown in dropdown
      console.log('Products in dropdown:', productsWithStockInfo.map(p => `${p.name} (Stock: ${p.availableStock || 0})`));
      
      // Show info if no products have stock, but still allow selection
      const productsWithStock = productsWithStockInfo.filter(product => {
        if (product.hasVariants && product.variants) {
          return product.variants.some(v => (v.availableStock || 0) > 0);
        }
        return (product.availableStock || 0) > 0;
      });
      
      if (productsWithStock.length === 0 && productsWithStockInfo.length > 0) {
        toast.info('No products currently in stock, but you can still create orders.', {
          duration: 4000,
          icon: '📦'
        });
      }
    } catch (error) {
      // Don't show error if it's just no data
      setProducts([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('customerInfo.')) {
      const field = name.replace('customerInfo.', '');
      if (field.startsWith('address.')) {
        const addressField = field.replace('address.', '');
        setFormData(prev => ({
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            address: {
              ...prev.customerInfo.address,
              [addressField]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            [field]: value
          }
        }));
      }
    } else if (name.startsWith('deliveryAddress.')) {
      const field = name.replace('deliveryAddress.', '');
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOrderDateChange = (value) => {
    if (!value) {
      setFormData(prev => ({
        ...prev,
        orderDate: ''
      }));
      return;
    }

    const selected = new Date(value);
    if (Number.isNaN(selected.getTime())) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      orderDate: selected.toISOString()
    }));

    if (validationErrors.orderDate) {
      setValidationErrors(prev => ({
        ...prev,
        orderDate: ''
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        variantId: '',
        variantName: '',
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

  const getVariantPrice = (variantId, productId) => {
    const product = products.find(p => p._id === productId);
    if (!product || !product.variants) return 0;
    
    const variant = product.variants.find(v => (v._id || v.sku) === variantId);
    return variant ? (variant.sellingPrice || 0) : 0;
  };

  const getProductVariants = (productId) => {
    const product = products.find(p => p._id === productId);
    return (product && product.hasVariants && product.variants) ? product.variants : [];
  };

  const updateItem = async (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { 
          ...item, 
          [field]: value,
        };
        
        // Reset variant and price when product changes
        if (field === 'productId') {
          updatedItem.variantId = '';
          updatedItem.variantName = '';
          updatedItem.unitPrice = 0;
        }
        
        // Update unit price and variantName when variant is selected
        if (field === 'variantId') {
          updatedItem.unitPrice = getVariantPrice(value, item.productId);
          // Get variant name from product
          const product = products.find(p => p._id === item.productId);
          if (product && product.variants) {
            const variant = product.variants.find(v => (v._id || v.sku) === value);
            updatedItem.variantName = variant?.name || null;
          } else {
            updatedItem.variantName = null;
          }
        }
        
        // Update total price when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = field === 'quantity' 
            ? value * (updatedItem.unitPrice || item.unitPrice) 
            : (updatedItem.quantity || item.quantity) * value;
        }
        
        return updatedItem;
      }
      return item;
    });

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Check stock availability when product, variant, or quantity changes
    if ((field === 'productId' || field === 'variantId' || field === 'quantity') && value) {
      await checkStockAvailability(updatedItems[index]);
    }
  };

  const checkStockAvailability = async (item) => {
    if (!item.productId || !item.quantity) return;

    try {
      // Use the same logic as fetchProducts to get combined stock
      const warehousesResponse = await api.get('/warehouses');
      const warehouses = warehousesResponse.data || [];
      
      let totalAvailableStock = 0;
      const variantId = item.variantId || 'no-variant';
      
      // Get product and variant names for name-based matching
      const product = products.find(p => p._id === item.productId);
      const productName = product?.name || 'Unknown Product';
      const variant = product?.variants?.find(v => (v._id || v.sku) === variantId);
      const variantName = variant?.name || 'no-variant';
      
      // Normalize names for flexible matching (lowercase, trim, remove extra spaces)
      const normalizeName = (name) => {
        if (!name || name === 'no-variant' || name === 'Unknown Product') return name;
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
      };
      
      const normalizedProductName = normalizeName(productName);
      const normalizedVariantName = normalizeName(variantName);
      
      // Debug logging
      console.log('Checking stock for:', {
        productId: item.productId,
        productName: productName,
        variantId: variantId,
        variantName: variantName,
        quantity: item.quantity
      });
      
      warehouses.forEach(warehouse => {
        if (warehouse.currentStock && Array.isArray(warehouse.currentStock)) {
          warehouse.currentStock.forEach(stockItem => {
            const stockProductId = stockItem.productId?._id || stockItem.productId;
            const stockVariantId = stockItem.variantId || 'no-variant';
            const stockProductName = stockItem.productId?.name || 'Unknown Product';
            const stockVariantName = stockItem.variantDetails?.name || stockItem.variantName || 'no-variant';
            
            // Normalize warehouse stock names
            const normalizedStockProductName = normalizeName(stockProductName);
            const normalizedStockVariantName = normalizeName(stockVariantName);
            
            // Match by ID (exact)
            const idMatch = stockProductId && item.productId && 
                          stockProductId.toString() === item.productId.toString() && 
                          stockVariantId === variantId;
            
            // Match by normalized names (flexible)
            const nameMatch = normalizedProductName !== 'unknown product' &&
                            normalizedStockProductName !== 'unknown product' &&
                            normalizedProductName === normalizedStockProductName &&
                            (normalizedVariantName === normalizedStockVariantName || 
                             normalizedVariantName === 'no-variant' && normalizedStockVariantName === 'no-variant');
            
            // Also try partial matching for variant names (e.g., "maroon" matches "maroon - PKF")
            const variantPartialMatch = normalizedVariantName !== 'no-variant' &&
                                       normalizedStockVariantName !== 'no-variant' &&
                                       (normalizedStockVariantName.includes(normalizedVariantName) ||
                                        normalizedVariantName.includes(normalizedStockVariantName));
            
            // Flexible product name matching (handles "Capri bag pac" vs "Capri bag pack of 4")
            const productNameExactMatch = normalizedProductName !== 'unknown product' &&
                                         normalizedStockProductName !== 'unknown product' &&
                                         normalizedProductName === normalizedStockProductName;
            
            // Partial product name match (e.g., "capri bag pac" matches "capri bag pack of 4")
            const productNamePartialMatch = normalizedProductName !== 'unknown product' &&
                                          normalizedStockProductName !== 'unknown product' &&
                                          (normalizedStockProductName.includes(normalizedProductName) ||
                                           normalizedProductName.includes(normalizedStockProductName));
            
            const productNameMatch = productNameExactMatch || productNamePartialMatch;
            const flexibleNameMatch = productNameMatch && (nameMatch || variantPartialMatch);
            
            if (idMatch || flexibleNameMatch) {
              const totalStock = (stockItem.quantity || 0);
              const reserved = (stockItem.reservedQuantity || 0);
              const delivered = (stockItem.deliveredQuantity || 0);
              const confirmedDelivered = (stockItem.confirmedDeliveredQuantity || 0);
              const available = totalStock - reserved - delivered - confirmedDelivered;
              
              console.log('Stock match found:', {
                warehouse: warehouse.name,
                productName: stockProductName,
                variantName: stockVariantName,
                totalStock,
                reserved,
                delivered,
                confirmedDelivered,
                available
              });
              
              totalAvailableStock += Math.max(0, available);
            }
          });
        }
      });

      console.log('Stock check result:', {
        productName: productName,
        variantName: variantName,
        totalAvailableStock,
        required: item.quantity,
        sufficient: totalAvailableStock >= item.quantity
      });

      setStockChecks(prev => ({
        ...prev,
        [`${item.productId}-${variantId}`]: {
          available: totalAvailableStock,
          required: item.quantity,
          sufficient: totalAvailableStock >= item.quantity
        }
      }));
    } catch (error) {
      // Silently handle error - stock check is informational only
    }
  };

  const validateForm = () => {
    const errors = {};

    // Customer info validation
    if (!formData.customerInfo.name) {
      errors['customerInfo.name'] = 'Customer name is required';
    }
    if (!formData.customerInfo.phone) {
      errors['customerInfo.phone'] = 'Customer phone is required';
    } else if (!/^0\d{3}-\d{7}$/.test(formData.customerInfo.phone)) {
      errors['customerInfo.phone'] = 'Phone number must be in format 0XXX-XXXXXXX ';
    }

    // Delivery address validation
    if (!formData.deliveryAddress.street) {
      errors['deliveryAddress.street'] = 'Delivery address is required';
    }
    if (!formData.deliveryAddress.city) {
      errors['deliveryAddress.city'] = 'Delivery city is required';
    }

    if (!formData.orderDate) {
      errors.orderDate = 'Sale date and time is required';
    }

    // Items validation
    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item_${index}_productId`] = 'Product is required';
      }
      
      // Check if product has variants
      const product = products.find(p => p._id === item.productId);
      if (product && product.hasVariants && product.variants && product.variants.length > 0) {
        if (!item.variantId) {
          errors[`item_${index}_variantId`] = 'Variant is required for this product';
        }
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors[`item_${index}_unitPrice`] = 'Unit price must be greater than 0';
      }

      // Note: Stock validation removed - allowing out-of-stock orders
      // Stock availability is shown as a warning but doesn't block submission
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      // Update timestamp to current time before submitting
      const currentTimestamp = new Date().toISOString();
      
      // Check for out-of-stock items and mark them
      const itemsWithStockStatus = formData.items.map(item => {
        const variantId = item.variantId || 'no-variant';
        const stockCheck = stockChecks[`${item.productId}-${variantId}`];
        const isOutOfStock = stockCheck && !stockCheck.sufficient;
        
        return {
          ...item,
          isOutOfStock: isOutOfStock || false
        };
      });

      const orderDateISO = formData.orderDate
        ? new Date(formData.orderDate).toISOString()
        : currentTimestamp;

      // Transform the data to include customerName at the top level
      const salesData = {
        ...formData,
        items: itemsWithStockStatus,
        customerName: formData.customerInfo.name,
        customerPhone: formData.customerInfo.phone,
        agentName: formData.agentName || '',
        timestamp: currentTimestamp,
        orderDate: orderDateISO,
        hasOutOfStockItems: itemsWithStockStatus.some(item => item.isOutOfStock)
      };
      
      // Remove status from update data - status should only be changed via action buttons
      if (isEditing && id) {
        delete salesData.status;
      }
      
      let response;
      
      if (isEditing && id) {
        // Update existing sales order
        response = await api.put(`/sales/${id}`, salesData);
        const updatedSale = response.data.salesOrder;
        
        toast.success(`Sales order ${updatedSale.orderNumber || id} updated successfully!`, {
          duration: 4000,
          icon: '✅'
        });
        
        // Navigate back to sales page
        navigate('/sales');
      } else {
        // Create new sales order
        response = await api.post('/sales', salesData);
        const newSale = response.data.salesOrder;
        
        // Show success message with out-of-stock warning if applicable
        const hasOutOfStock = itemsWithStockStatus.some(item => item.isOutOfStock);
        if (hasOutOfStock) {
          toast.success(`Sales order ${newSale.orderNumber || 'SO-' + newSale._id.slice(-4)} created successfully! ⚠ Contains out-of-stock items (backorder).`, {
            duration: 5000,
            icon: '✅'
          });
        } else {
          toast.success(`Sales order ${newSale.orderNumber || 'SO-' + newSale._id.slice(-4)} created successfully!`, {
            duration: 4000,
            icon: '✅'
          });
        }
        
        // Store the new sale in localStorage for immediate access
        const existingSales = JSON.parse(localStorage.getItem('tempSales') || '[]');
        existingSales.unshift(newSale);
        localStorage.setItem('tempSales', JSON.stringify(existingSales));
        
        // If onSuccess callback is provided, use it for immediate state update
        if (onSuccess) {
          onSuccess(newSale);
        } else {
          // Navigate back to sales page
          navigate('/sales');
        }
      }
    } catch (error) {
      // Show detailed error message from backend
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create sales order. Please check stock availability.';
      
      if (errorData) {
        if (errorData.error) {
          errorMessage = errorData.error;
          // Add details if available
          if (errorData.details) {
            errorMessage += `. ${errorData.details}`;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      toast.error(errorMessage, {
        duration: 6000,
        icon: '❌',
        style: {
          maxWidth: '500px'
        }
      });
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
              onClick={() => navigate('/sales')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Sales</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Sales Order' : 'Create Sales Order'}</h1>
              <p className="text-gray-600">{isEditing ? 'Update sales order details' : 'Create new sales order for customer'}</p>
            </div>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Customer Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1: Customer Name and Agent Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerInfo.name"
                  value={formData.customerInfo.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors['customerInfo.name'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer name"
                />
                {validationErrors['customerInfo.name'] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors['customerInfo.name']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter agent name"
                />
              </div>

              {/* Row 2: City and Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="customerInfo.address.city"
                  value={formData.customerInfo.address.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors['customerInfo.address.city'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer city"
                />
                {validationErrors['customerInfo.address.city'] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors['customerInfo.address.city']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="customerInfo.phone"
                  value={formData.customerInfo.phone}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9-]/g, ''); // Allow digits and dash
                    // Remove dash if user is deleting
                    const digits = value.replace(/-/g, '');
                    
                    // Format as 0XXX-XXXXXXX
                    if (digits.length > 0) {
                      // Ensure starts with 0
                      if (digits[0] !== '0') {
                        value = '0' + digits.slice(0, 10);
                      } else {
                        value = digits.slice(0, 11);
                      }
                      // Add dash after 4th digit if we have more than 4 digits
                      if (value.length > 4) {
                        value = value.slice(0, 4) + '-' + value.slice(4, 11);
                      }
                    } else {
                      value = '';
                    }
                    
                    handleChange({ target: { name: 'customerInfo.phone', value } });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors['customerInfo.phone'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="xxxx-xxxxxxx"
                  maxLength={12}
                />
                {validationErrors['customerInfo.phone'] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors['customerInfo.phone']}
                  </p>
                )}
              </div>

              {/* Row 3: Sale Date & Time and System Timestamp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  name="orderDate"
                  value={formatDateTimeLocal(formData.orderDate)}
                  onChange={(e) => handleOrderDateChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors.orderDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.orderDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.orderDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Timestamp
                </label>
                <input
                  type="text"
                  name="timestamp"
                  value={new Date(formData.timestamp).toLocaleString()}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Status field - only shown when editing (read-only) */}
              {isEditing && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    value={formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1).replace('_', ' ') : 'Pending'}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Status cannot be changed here. Use the action buttons in the sales list to update status.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="deliveryAddress.street"
                  value={formData.deliveryAddress.street}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors['deliveryAddress.street'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Main Street"
                />
                {validationErrors['deliveryAddress.street'] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors['deliveryAddress.street']}
                  </p>
                )}
      </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="deliveryAddress.city"
                  value={formData.deliveryAddress.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors['deliveryAddress.city'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="New York"
                />
                {validationErrors['deliveryAddress.city'] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors['deliveryAddress.city']}
                  </p>
                )}
              </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="deliveryAddress.country"
                  value={formData.deliveryAddress.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="United States"
                />
              </div>
          </div>
        </div>

          {/* Out of Stock Warning Banner */}
          {(() => {
            const hasOutOfStockItems = formData.items.some(item => {
              const variantId = item.variantId || 'no-variant';
              const stockCheck = stockChecks[`${item.productId}-${variantId}`];
              return stockCheck && !stockCheck.sufficient;
            });
            
            return hasOutOfStockItems && (
              <div className="card p-4 mb-6 bg-orange-50 border-2 border-orange-300">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-semibold text-orange-800">
                    ⚠ Warning: This order contains out-of-stock items. The order will be created as a backorder and marked accordingly.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Sales Items */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
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
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                          {products.map(product => {
                            const stockInfo = product.hasVariants 
                              ? '' // Variants will show their own stock
                              : ` - Stock: ${product.availableStock || 0}`;
                            return (
                              <option key={product._id} value={product._id}>
                                {product.name} ({product.sku}){stockInfo}
                              </option>
                            );
                          })}
                        </select>
                        {validationErrors[`item_${index}_productId`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors[`item_${index}_productId`]}
                          </p>
                        )}
                      </div>

                      {/* Variant Selection */}
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
                            {getProductVariants(item.productId).map(variant => {
                              const stockInfo = variant.availableStock !== undefined 
                                ? ` - Stock: ${variant.availableStock || 0}` 
                                : '';
                              return (
                              <option key={variant._id || variant.sku} value={variant._id || variant.sku}>
                                {variant.name} - PKR {variant.sellingPrice}{stockInfo}
                              </option>
                              );
                            })}
                          </select>
                          {validationErrors[`item_${index}_variantId`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors[`item_${index}_variantId`]}
                            </p>
                          )}
                        </div>
                      )}

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
                        {(() => {
                          const variantId = item.variantId || 'no-variant';
                          const stockCheck = stockChecks[`${item.productId}-${variantId}`];
                          return stockCheck && (
                            <div className="mt-1">
                              {stockCheck.sufficient ? (
                                <p className="text-sm text-green-600 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  ✔ Stock available: {stockCheck.available}
                                </p>
                              ) : stockCheck.available === 0 ? (
                                <p className="text-sm text-red-600 flex items-center font-semibold">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  ⚠ OUT OF STOCK - Order will be created as backorder
                                </p>
                              ) : (
                                <p className="text-sm text-orange-600 flex items-center font-semibold">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  ⚠ Low stock: {stockCheck.available} available (Required: {stockCheck.required}) - Order will be created as backorder
                                </p>
                              )}
                            </div>
                          );
                        })()}
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
                          Rs {(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes for this order..."
              />
        </div>

            {/* Total */}
            {formData.items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount:</p>
                    <p className="text-2xl font-bold text-primary-600">
                      Rs {calculateTotal().toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/sales')}
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
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Update Sales Order' : 'Create Sales Order'}</span>
                </>
              )}
          </button>
        </div>
        </motion.form>
      </div>
    </div>
  );
};

export default SalesFormPage;
