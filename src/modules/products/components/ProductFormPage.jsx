import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Package,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  X
} from 'lucide-react';

const ProductFormPage = ({ product, onSubmit, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    description: '',
    hasVariants: false
  });
  const [loading, setLoading] = useState(false);
  const [generatingSKU, setGeneratingSKU] = useState(false);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  
  // Variants state
  const [attributes, setAttributes] = useState([
    { name: 'Color', values: ['Red', 'Black', 'Blue'] },
    { name: 'Size', values: ['Small', 'Medium', 'Large'] }
  ]);
  const [variants, setVariants] = useState([]);
  const [showVariants, setShowVariants] = useState(false);

  useEffect(() => {
    fetchWarehouses();
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        unit: product.unit || 'pcs',
        costPrice: product.costPrice || '',
        sellingPrice: product.sellingPrice || '',
        description: product.description || '',
        hasVariants: product.hasVariants || false
      });
      if (product.attributes) {
        setAttributes(product.attributes);
      }
      if (product.variants) {
        setVariants(product.variants);
        setShowVariants(true);
      }
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
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If SKU changes and we have variants, update variant SKUs
    if (name === 'sku' && variants.length > 0) {
      const updatedVariants = variants.map((variant, index) => {
        // Extract attribute parts from variant name
        const attributeParts = variant.attributes.map(attr => {
          const cleanValue = attr.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          return cleanValue.substring(0, 3);
        }).join('-');
        
        const variantSKU = attributeParts 
          ? `${value || 'PROD'}-${attributeParts}` 
          : `${value || 'PROD'}-V${index + 1}`;
        
        return {
          ...variant,
          sku: variantSKU
        };
      });
      
      setVariants(updatedVariants);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields - SKU and selling price only required when no variants
      const requiredFields = ['name', 'category'];
      if (!showVariants) {
        requiredFields.push('sku', 'sellingPrice');
      }
      // if (user?.role === 'admin') {
      //   requiredFields.push('costPrice');
      // }
      
      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`Please fill in all required fields`);
        }
      }

      if (!showVariants && parseFloat(formData.sellingPrice) <= 0) {
        throw new Error('Selling price must be greater than 0');
      }
      
      // if (user?.role === 'admin' && formData.costPrice && parseFloat(formData.costPrice) <= 0) {
      //   throw new Error('Cost price must be greater than 0');
      // }

      // Include variants if they exist
      const submitData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        description: formData.description,
        hasVariants: variants.length > 0,
        attributes: variants.length > 0 ? attributes : undefined,
        variants: variants.length > 0 ? variants : undefined
      };
      
      // Only include SKU and selling price if no variants
      if (!showVariants) {
        submitData.sku = formData.sku;
        submitData.sellingPrice = formData.sellingPrice;
      }

      await onSubmit(submitData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a product name first');
      return;
    }
    
    setGeneratingSKU(true);
    setError(null);
    
    try {
      const response = await api.post('/products/generate-sku', {
        productName: formData.name.trim()
      });
      
      const newSKU = response.data.sku;
      
      setFormData({
        ...formData,
        sku: newSKU
      });
      
      // If we have variants, update their SKUs too
      if (variants.length > 0) {
        const updatedVariants = variants.map((variant, index) => {
          const attributeParts = variant.attributes.map(attr => {
            const cleanValue = attr.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            return cleanValue.substring(0, 3);
          }).join('-');
          
          const variantSKU = attributeParts 
            ? `${newSKU}-${attributeParts}` 
            : `${newSKU}-V${index + 1}`;
          
          return {
            ...variant,
            sku: variantSKU
          };
        });
        
        setVariants(updatedVariants);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate SKU');
    } finally {
      setGeneratingSKU(false);
    }
  };

  // Attribute functions
  const addAttribute = () => {
    setAttributes([...attributes, { name: '', values: [''] }]);
  };

  const removeAttribute = (index) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
    // Regenerate variants if we have any
    if (variants.length > 0) {
      generateVariants(newAttributes);
    }
  };

  const updateAttributeName = (index, name) => {
    const newAttributes = [...attributes];
    newAttributes[index].name = name;
    setAttributes(newAttributes);
  };

  const updateAttributeValues = (attrIndex, valueIndex, value) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].values[valueIndex] = value;
    setAttributes(newAttributes);
  };

  const addAttributeValue = (attrIndex) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].values.push('');
    setAttributes(newAttributes);
  };

  const removeAttributeValue = (attrIndex, valueIndex) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].values = newAttributes[attrIndex].values.filter((_, i) => i !== valueIndex);
    setAttributes(newAttributes);
  };

  // Generate variants from attributes
  const generateVariants = (attrs = attributes) => {
    const validAttributes = attrs.filter(attr => 
      attr.name.trim() && attr.values.some(v => v.trim())
    );

    if (validAttributes.length === 0) {
      setVariants([]);
      return;
    }

    // Generate all combinations
    const combinations = validAttributes.reduce((acc, attr) => {
      const validValues = attr.values.filter(v => v.trim());
      if (acc.length === 0) {
        return validValues.map(v => [{ name: attr.name, value: v }]);
      }
      const newCombinations = [];
      acc.forEach(combination => {
        validValues.forEach(value => {
          newCombinations.push([...combination, { name: attr.name, value }]);
        });
      });
      return newCombinations;
    }, []);

    // Create variant objects with unique SKUs
    const newVariants = combinations.map((combination, index) => {
      const variantName = combination.map(c => c.value).join(' / ');
      
      // Generate variant SKU with attribute values
      const attributeParts = combination.map(attr => {
        // Take first 3 letters of each value and uppercase
        const cleanValue = attr.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return cleanValue.substring(0, 3);
      }).join('-');
      
      // Create unique SKU: BASE-SKU-ATTR1-ATTR2 or BASE-SKU-V1, V2...
      const baseSKU = formData.sku || 'PROD';
      const variantSKU = attributeParts 
        ? `${baseSKU}-${attributeParts}` 
        : `${baseSKU}-V${index + 1}`;
      
      return {
        name: variantName,
        sku: variantSKU,
        attributes: combination,
        costPrice: user?.role === 'admin' ? (formData.costPrice || '') : '',
        sellingPrice: formData.sellingPrice || '',
        stock: 0
      };
    });

    setVariants(newVariants);
    setShowVariants(true);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="h-8 w-8 mr-3 text-primary-600" />
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-3">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* SKU - Hidden when using variants */}
          {!showVariants && (
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-3">
              SKU *
            </label>
            <div className="flex">
              <input
                type="text"
                id="sku"
                name="sku"
                  required={!showVariants}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter or generate SKU"
                value={formData.sku}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={generateSKU}
                disabled={generatingSKU}
                className="px-6 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {generatingSKU ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>
          )}

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-3">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-3">
              Unit *
            </label>
            <select
              id="unit"
              name="unit"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.unit}
              onChange={handleChange}
            >
              <option value="pcs">Pieces</option>
              <option value="kg">Kilogram</option>
              <option value="liters">Liters</option>
              <option value="meters">Meters</option>
              <option value="boxes">Boxes</option>
            </select>
          </div>

          {/* Cost Price - Admin Only - Hidden when using variants */}
          {!showVariants && user?.role === 'admin' && (
            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-3">
                Cost Price (PKR) *
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                required={!showVariants}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Selling Price - Disabled when variants are active */}
          <div>
            <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-3">
              Selling Price (PKR) {!showVariants && '*'}
            </label>
            <input
              type="number"
              id="sellingPrice"
              name="sellingPrice"
              required={!showVariants}
              min="0"
              step="0.01"
              disabled={showVariants}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                showVariants ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
              }`}
              placeholder={showVariants ? `Disabled - Set ${user?.role === 'admin' ? 'cost and selling' : 'selling'} price for each variant below` : 'Enter selling price'}
              value={formData.sellingPrice}
              onChange={handleChange}
            />
            {showVariants && (
              <p className="mt-1 text-xs text-gray-500">
                ℹ️ This field is disabled. Set the {user?.role === 'admin' ? 'cost and selling' : 'selling'} price for each variant below.
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter product description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* Product Variants Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                <p className="text-sm text-gray-600 mt-1">Add variants like colors, sizes, etc. (Optional)</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVariants(!showVariants);
                  if (!showVariants && attributes.length === 0) {
                    setAttributes([{ name: 'Color', values: [''] }]);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showVariants ? 'Hide Variants' : 'Add Variants'}
              </button>
            </div>
            
            {showVariants && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>💡 Note:</strong> When using variants, {user?.role === 'admin' ? 'cost and selling' : 'selling'} prices are set individually for each variant below. 
                  The base product price fields are hidden.
                </p>
              </div>
            )}
          </div>

          {showVariants && (
            <div className="space-y-6">
              {/* Attributes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900">Attributes (e.g., Color, Size)</h4>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Attribute
                  </button>
                </div>

                <div className="space-y-4">
                  {attributes.map((attribute, attrIndex) => (
                    <div key={attrIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          placeholder="Attribute name (e.g., Color, Size)"
                          value={attribute.name}
                          onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(attrIndex)}
                          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Values:</label>
                        {attribute.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Value (e.g., Red, Large)"
                              value={value}
                              onChange={(e) => updateAttributeValues(attrIndex, valueIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {attribute.values.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addAttributeValue(attrIndex)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Value
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => generateVariants()}
                  disabled={attributes.length === 0 || !attributes.some(a => a.name.trim() && a.values.some(v => v.trim()))}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Generate Variants
                </button>
              </div>

              {/* Generated Variants */}
              {variants.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">
                    Generated Variants ({variants.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {variants.map((variant, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{variant.name}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-600">SKU:</p>
                              <code className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                {variant.sku}
                              </code>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className={`grid gap-3 ${user?.role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {user?.role === 'admin' && (
                            <div>
                              <label className="text-xs text-gray-600">Cost Price (PKR)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={variant.costPrice}
                                onChange={(e) => updateVariant(index, 'costPrice', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-gray-600">Selling Price (PKR)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.sellingPrice}
                              onChange={(e) => updateVariant(index, 'sellingPrice', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {product ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProductFormPage;
