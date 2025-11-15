import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Truck, Package, MapPin, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const PostExOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const getInitialFormData = () => ({
    orderType: 'Normal',
    orderReferenceNumber: '',
    orderAmount: '',
    orderDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerContact: '',
    deliveryCity: '',
    deliveryAddress: '',
    airwayBillCopies: '1',
    items: '1',
    pickupCity: 'Rawalpindi',
    pickupAddress: '',
    returnCity: '',
    returnAddress: '',
    bookingWeight: '',
    orderDetail: '',
    notes: ''
  });

  const [postExFormData, setPostExFormData] = useState(getInitialFormData());

  // Pre-populate form if sale data is passed via location state, otherwise reset to empty
  useEffect(() => {
    if (location.state?.sale) {
      const sale = location.state.sale;
      setPostExFormData({
        orderType: 'Normal',
        orderReferenceNumber: sale.orderNumber || '',
        orderAmount: sale.totalAmount?.toString() || '',
        orderDate: sale.orderDate ? new Date(sale.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        customerName: sale.customerName || sale.customerInfo?.name || '',
        customerContact: sale.customerInfo?.phone || '',
        deliveryCity: sale.deliveryAddress?.city || '',
        deliveryAddress: sale.deliveryAddress?.street || '',
        airwayBillCopies: '1',
        items: sale.items?.length?.toString() || '1',
        pickupCity: 'Rawalpindi',
        pickupAddress: '',
        returnCity: '',
        returnAddress: '',
        bookingWeight: '',
        orderDetail: '',
        notes: sale.notes || ''
      });
    } else {
      // Reset form to initial empty state when no sale data
      setPostExFormData(getInitialFormData());
    }
  }, [location.state]);

  const handlePostExFormChange = (e) => {
    const { name, value } = e.target;
    setPostExFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostExSubmit = async (e) => {
    e.preventDefault();
    // Here you would integrate with PostEx API
    // For now, just show a success message
    toast.success('Order submitted to PostEx successfully!');
    navigate('/approved-sales');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/approved-sales')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Approved Sales</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create PostEx Order</h1>
              <p className="text-gray-600 mt-1">Fill in the details to create a shipping order with PostEx</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handlePostExSubmit}
          className="space-y-6"
        >
          {/* Order Information Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="orderType"
                  value={postExFormData.orderType}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Normal">Normal</option>
                  <option value="Express">Express</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="orderReferenceNumber"
                  value={postExFormData.orderReferenceNumber}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Order ref Number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Amount (Rs) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rs</span>
                  <input
                    type="number"
                    name="orderAmount"
                    value={postExFormData.orderAmount}
                    onChange={handlePostExFormChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="orderDate"
                  value={postExFormData.orderDate}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={postExFormData.customerName}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Contact <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customerContact"
                  value={postExFormData.customerContact}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="03xxxxxxxxx"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Information Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Delivery Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery City <span className="text-red-500">*</span>
                </label>
                <select
                  name="deliveryCity"
                  value={postExFormData.deliveryCity}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Search</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="deliveryAddress"
                  value={postExFormData.deliveryAddress}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer Address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Shipping Details Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <Truck className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Shipping Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="items"
                  value={postExFormData.items}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Airway Bill Copies <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="airwayBillCopies"
                  value={postExFormData.airwayBillCopies}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Weight (kg)
                </label>
                <input
                  type="number"
                  name="bookingWeight"
                  value={postExFormData.bookingWeight}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Booking weight in Kg"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup City <span className="text-red-500">*</span>
                </label>
                <select
                  name="pickupCity"
                  value={postExFormData.pickupCity}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Address <span className="text-red-500">*</span>
                </label>
                <select
                  name="pickupAddress"
                  value={postExFormData.pickupAddress}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Search</option>
                  <option value="Address 1">Address 1</option>
                  <option value="Address 2">Address 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return City
                </label>
                <select
                  name="returnCity"
                  value={postExFormData.returnCity}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Search</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Address
                </label>
                <select
                  name="returnAddress"
                  value={postExFormData.returnAddress}
                  onChange={handlePostExFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Search</option>
                  <option value="Address 1">Address 1</option>
                  <option value="Address 2">Address 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Detail (optional)
                </label>
                <textarea
                  name="orderDetail"
                  value={postExFormData.orderDetail}
                  onChange={handlePostExFormChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional order details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={postExFormData.notes}
                  onChange={handlePostExFormChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/approved-sales')}
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              Create PostEx Order
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PostExOrderPage;

