import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Truck,
  Package,
  MapPin,
  User,
  Calendar,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import axios from "axios";

const PostExOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saleId } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [merchantAddresses, setMerchantAddresses] = useState([]);

  const getInitialFormData = () => ({
    orderType: "Normal",
    orderReferenceNumber: "",
    orderAmount: "",
    orderDate: new Date().toISOString().split("T")[0],
    customerName: "",
    customerContact: "",
    deliveryCity: "",
    deliveryAddress: "",
    airwayBillCopies: "1",
    items: "1",
    pickupCity: "Rawalpindi",
    pickupAddressCode: "001",
    orderDetail: "",
    notes: "",
  });

  const [postExFormData, setPostExFormData] = useState(getInitialFormData());

  // Hardcoded merchant address data since API is giving CORS error
  const hardcodedMerchantAddresses = [
    {
      merchantAddressId: 75324,
      address:
        "Younas Plaza satellite town F Block Leaders BPO New Katariyan Rawalpindi",
      phone1: "03709280484",
      phone2: "03709280484",
      contactPersonName: "Tml Mart",
      merchantId: 39305,
      cityId: 3,
      cityName: "Rawalpindi",
      addressCode: "001",
      addressType: "Default Address",
    },
  ];
  // update postex status
  const updatePostExStatus = async (saleId, trackingNumber) => {
    try {
      const response = await axios.post(
        `/api/sales-orders/update-postex-status`,
        {
          postExStatus: true,
          id: saleId,
          trackingNumber: trackingNumber,
        }
      );
      await updateWharehuse(saleId, "Unbooked");
      toast.success("PostEx status updated successfully");
      console.log("PostEx status updated:", response.data);
    } catch (error) {
      console.error("Error updating postex status:", error);
    }
  };

  const updateWharehuse = async (saleId, newStatus) => {
    console.log("He tried to run me for updating whsrer house");

    try {
      const response = await api.patch(`/sales/${saleId}/status`, {
        status: newStatus,
      });
      console.log(
        "Status updated successfully fro whare house:",
        response.data
      );
    } catch (error) {
      console.error("Error updating status:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        saleId,
        newStatus,
      });
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update status";
      toast.error(errorMessage);
    }
  };

  // Create Axios instance for PostEx API
  const postExApi = axios.create({
    baseURL: "https://api.postex.pk/services/integration/api/order",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // PostEx API Service with Axios
  const postExApiService = {
    token:
      "ZThkODBkYzg4NjBkNDE0YzgxOWUxZGZkM2U0YjNjYjc6ZDk2ZjE5NjBjNzU2NDk3MThmZDc2MmExYTgyYWY5MmY=",

    async createOrder(orderData) {
      try {
        // Remove dashes from phone number before submitting
        const cleanedPhone = (orderData.customerContact || "").replace(/-/g, "");

        // Prepare payload according to PostEx API requirements
        const payload = {
          orderRefNumber: orderData.orderReferenceNumber,
          invoicePayment: orderData.orderAmount.toString(),
          orderDetail: orderData.orderDetail || "",
          customerName: orderData.customerName,
          customerPhone: cleanedPhone, // Phone number without dashes
          deliveryAddress: orderData.deliveryAddress,
          transactionNotes: orderData.notes || "",
          cityName: orderData.deliveryCity,
          invoiceDivision: parseInt(orderData.airwayBillCopies) || 1,
          items: parseInt(orderData.items) || 1,
          pickupAddressCode: orderData.pickupAddressCode || "001",
          orderType: orderData.orderType || "Normal",
        };

        console.log("Submitting to PostEx API:", payload);

        // Add token as a custom header (not Bearer token)
        const config = {
          headers: {
            token: this.token, // Direct token header as required by PostEx API
            "Content-Type": "application/json",
          },
        };

        const response = await postExApi.post(
          "/v3/create-order",
          payload,
          config
        );

        console.log("PostEx API Response:", response.data);

        if (
          response.data.statusCode === "200" ||
          response.data.status === "200"
        ) {
          console.log("postex response is", response);
          const trackingNumber = response.data.dist.trackingNumber;
          updatePostExStatus(saleId, trackingNumber);
          return {
            success: true,
            data: response.data,
            trackingNumber: response.data.dist.trackingNumber,
            orderId: response.data.orderId,
          };
        } else {
          return {
            success: false,
            error:
              response.data.statusMessage ||
              response.data.message ||
              "Order creation failed",
          };
        }
      } catch (error) {
        console.error("Error creating PostEx order:", error);

        // Handle different types of errors
        if (error.response) {
          // Server responded with error status
          const errorMessage =
            error.response.data?.statusMessage ||
            error.response.data?.message ||
            error.response.data?.error ||
            `Server error: ${error.response.status}`;
          return {
            success: false,
            error: errorMessage,
          };
        } else if (error.request) {
          // Request was made but no response received
          return {
            success: false,
            error:
              "No response received from server. Please check your connection.",
          };
        } else {
          // Other errors
          return {
            success: false,
            error: error.message || "An unexpected error occurred",
          };
        }
      }
    },
  };

  // Use hardcoded merchant addresses instead of API call
  useEffect(() => {
    setMerchantAddresses(hardcodedMerchantAddresses);
    // Auto-set the pickup address code from merchant data
    if (hardcodedMerchantAddresses.length > 0) {
      setPostExFormData((prev) => ({
        ...prev,
        pickupAddressCode: hardcodedMerchantAddresses[0].addressCode,
      }));
    }
  }, []);

  // Fetch sale data when saleId is present
  useEffect(() => {
    const fetchSaleData = async () => {
      if (saleId) {
        try {
          setLoading(true);
          console.log("Fetching sale data for ID:", saleId);

          const response = await api.get(`/sales/${saleId}`);
          const sale = response.data;

          console.log("Fetched sale data:", sale);

          // Get product name from first item
          const productName = sale.items?.[0]?.productId?.name || 
                             sale.items?.[0]?.productName || 
                             sale.orderNumber || "";

          // Remove dashes from phone number
          const phoneNumber = (sale.customerInfo?.phone || "").replace(/-/g, "");

          // Populate form with fetched sale data
          setPostExFormData((prev) => ({
            ...prev,
            orderReferenceNumber: productName, // Use product name instead of order number
            orderAmount: sale.totalAmount?.toString() || "",
            orderDate: sale.orderDate
              ? new Date(sale.orderDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            customerName: sale.customerName || sale.customerInfo?.name || "",
            customerContact: phoneNumber, // Phone number without dashes
            deliveryCity: sale.deliveryAddress?.city || "",
            deliveryAddress: sale.deliveryAddress?.street || "",
            items: sale.items?.length?.toString() || "1",
            notes: sale.notes || "",
            bookingWeight: 0.5,
          }));
        } catch (error) {
          console.error("Error fetching sale data:", error);
          toast.error("Failed to load sale data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSaleData();
  }, [saleId]);

  // Keep the existing useEffect for location.state
  useEffect(() => {
    if (location.state?.sale) {
      const sale = location.state.sale;
      console.log("Received sale data from location state:", sale);
      
      // Get product name from first item
      const productName = sale.items?.[0]?.productId?.name || 
                         sale.items?.[0]?.productName || 
                         sale.orderNumber || "";

      // Remove dashes from phone number
      const phoneNumber = (sale.customerInfo?.phone || "").replace(/-/g, "");

      setPostExFormData((prev) => ({
        ...prev,
        orderReferenceNumber: productName, // Use product name instead of order number
        orderAmount: sale.totalAmount?.toString() || "",
        orderDate: sale.orderDate
          ? new Date(sale.orderDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        customerName: sale.customerName || sale.customerInfo?.name || "",
        customerContact: phoneNumber, // Phone number without dashes
        deliveryCity: sale.deliveryAddress?.city || "",
        deliveryAddress: sale.deliveryAddress?.street || "",
        items: sale.items?.length?.toString() || "1",
        notes: sale.notes || "",
      }));
    } else if (!saleId) {
      // Reset form to initial empty state when no sale data and no saleId
      setPostExFormData(getInitialFormData());
    }
  }, [location.state, saleId]);

  const handlePostExFormChange = (e) => {
    const { name, value } = e.target;
    
    // Remove dashes from phone number when user types
    let processedValue = value;
    if (name === "customerContact") {
      processedValue = value.replace(/-/g, "");
    }
    
    setPostExFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handlePostExSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate required fields
    if (
      !postExFormData.orderReferenceNumber ||
      !postExFormData.customerName ||
      !postExFormData.customerContact ||
      !postExFormData.deliveryAddress ||
      !postExFormData.deliveryCity
    ) {
      toast.error("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    // Validate phone number format (03xxxxxxxxx)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(postExFormData.customerContact)) {
      toast.error("Please enter a valid phone number in format 03xxxxxxxxx");
      setSubmitting(false);
      return;
    }

    // Submit to PostEx API
    console.log("Submitting order to PostEx...");
    const result = await postExApiService.createOrder(postExFormData);
    console.log("API Result:", result);

    if (result.success) {
      toast.success("Order successfully created with PostEx!");
      if (result.trackingNumber) {
        toast.success(`Tracking Number: ${result.trackingNumber}`);
      }
      // Navigate back to approved sales after successful submission
      setTimeout(() => {
        navigate("/approved-sales");
      }, 3000);
    } else {
      toast.error(`Failed to create PostEx order: ${result.error}`);
      console.error("PostEx API Error:", result.error);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading sale data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/approved-sales")}
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
              <h1 className="text-3xl font-bold text-gray-900">
                Create PostEx Order
                {saleId && (
                  <span className="text-blue-600 text-lg ml-2">
                    (Sale ID: {saleId})
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                Fill in the details to create a shipping order with PostEx
              </p>
            </div>
          </div>
        </div>

        {/* Merchant Info Display */}
        {merchantAddresses.length > 0 && (
          <div className="card p-6 mb-6 bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Merchant Information (Provider)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {merchantAddresses.map((address) => (
                <div
                  key={address.merchantAddressId}
                  className="border border-blue-200 rounded-lg p-4 bg-white"
                >
                  <h3 className="font-medium text-gray-900">
                    {address.contactPersonName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.address}
                  </p>
                  <p className="text-sm text-gray-500">{address.cityName}</p>
                  <p className="text-sm text-gray-500">
                    Phone: {address.phone1}
                  </p>
                  <p className="text-sm text-gray-500">
                    Address Code: {address.addressCode}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form - REST OF THE FORM CODE REMAINS EXACTLY THE SAME AS BEFORE */}
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
              <h2 className="text-xl font-semibold text-gray-900">
                Order Information
              </h2>
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
                  <option value="Reverse">Reverse</option>
                  <option value="Replacement">Replacement</option>
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
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    Rs
                  </span>
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
              <h2 className="text-xl font-semibold text-gray-900">
                Customer Information
              </h2>
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
                  pattern="03\d{9}"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 03xxxxxxxxx
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Information Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Delivery Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery City <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="deliveryCity"
                  value={postExFormData.deliveryCity}
                  onChange={handlePostExFormChange}
                  placeholder="Enter Delivery City"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
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
              <h2 className="text-xl font-semibold text-gray-900">
                Shipping Details
              </h2>
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
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="card p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Additional Information
              </h2>
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
                  value="Must Call before Delivery"
                  disabled
                  onChange={handlePostExFormChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/approved-sales")}
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitting ? "Creating PostEx Order..." : "Create PostEx Order"}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PostExOrderPage;
