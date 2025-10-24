import React, { useState } from 'react';
import { Building2, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WarehouseFormPage = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Warehouse name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Warehouse name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Warehouse name must be less than 50 characters';
    }
    
    // Location validation
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    } else if (formData.location.trim().length < 5) {
      errors.location = 'Location must be at least 5 characters';
    } else if (formData.location.trim().length > 100) {
      errors.location = 'Location must be less than 100 characters';
    }
    
    // Capacity validation
    if (!formData.capacity) {
      errors.capacity = 'Capacity is required';
    } else {
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        errors.capacity = 'Capacity must be a positive number';
      } else if (capacity < 1) {
        errors.capacity = 'Capacity must be at least 1 item';
      } else if (capacity > 10000) {
        errors.capacity = 'Capacity cannot exceed 10,000 items';
      }
    }
    
    // Description validation (optional)
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const warehouseData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: parseInt(formData.capacity),
        description: formData.description.trim() || undefined
      };
      
      await api.post('/warehouses', warehouseData);
      
      // Wait for the warehouse list to refresh before showing success
      if (onSuccess) {
        await onSuccess();
      }
      
      toast.success('Warehouse created successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center mb-6">
        <Building2 className="h-7 w-7 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Add New Warehouse</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
              {formData.name && !validationErrors.name && (
                <CheckCircle className="inline h-4 w-4 text-green-500 ml-2" />
              )}
            </label>
            <div className="relative">
              <input 
                name="name" 
                className={`input-field pr-10 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : formData.name ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`} 
                placeholder="e.g., Central Warehouse" 
                value={formData.name} 
                onChange={handleChange}
                maxLength={50}
              />
              {validationErrors.name && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              )}
            </div>
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.name}
              </p>
            )}
            {formData.name && !validationErrors.name && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {formData.name.length}/50 characters
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity (items) *
              {formData.capacity && !validationErrors.capacity && (
                <CheckCircle className="inline h-4 w-4 text-green-500 ml-2" />
              )}
            </label>
            <div className="relative">
              <input 
                type="number" 
                name="capacity" 
                className={`input-field pr-10 ${validationErrors.capacity ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : formData.capacity ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`} 
                placeholder="e.g., 1000" 
                value={formData.capacity} 
                onChange={handleChange}
                min="1"
                max="10000"
              />
              {validationErrors.capacity && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              )}
            </div>
            {validationErrors.capacity && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.capacity}
              </p>
            )}
            {formData.capacity && !validationErrors.capacity && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Capacity: {parseInt(formData.capacity).toLocaleString()} items
              </p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
              {formData.location && !validationErrors.location && (
                <CheckCircle className="inline h-4 w-4 text-green-500 ml-2" />
              )}
            </label>
            <div className="relative">
              <input 
                name="location" 
                className={`input-field pr-10 ${validationErrors.location ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : formData.location ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`} 
                placeholder="e.g., 123 Main Street, Karachi, Pakistan" 
                value={formData.location} 
                onChange={handleChange}
                maxLength={100}
              />
              {validationErrors.location && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              )}
            </div>
            {validationErrors.location && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.location}
              </p>
            )}
            {formData.location && !validationErrors.location && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {formData.location.length}/100 characters
              </p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
              {formData.description && !validationErrors.description && (
                <CheckCircle className="inline h-4 w-4 text-green-500 ml-2" />
              )}
            </label>
            <div className="relative">
              <textarea 
                name="description" 
                rows={3} 
                className={`input-field pr-10 ${validationErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : formData.description ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`} 
                placeholder="Optional: Describe the warehouse purpose, special features, etc." 
                value={formData.description} 
                onChange={handleChange}
                maxLength={500}
              />
              {validationErrors.description && (
                <AlertCircle className="absolute right-3 top-2 h-5 w-5 text-red-500" />
              )}
            </div>
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.description}
              </p>
            )}
            {formData.description && !validationErrors.description && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {formData.description.length}/500 characters
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {Object.keys(validationErrors).length === 0 && formData.name && formData.location && formData.capacity ? (
              <span className="text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Ready to create warehouse
              </span>
            ) : (
              <span className="text-gray-500">Fill in all required fields to continue</span>
            )}
          </div>
          <button 
            type="submit" 
            className={`btn-primary ${Object.keys(validationErrors).length > 0 || !formData.name || !formData.location || !formData.capacity ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || Object.keys(validationErrors).length > 0 || !formData.name || !formData.location || !formData.capacity}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                Creating Warehouse...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> 
                Create Warehouse
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WarehouseFormPage;
