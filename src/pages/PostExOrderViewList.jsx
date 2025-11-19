import React, { useState, useEffect } from "react";
import {
  X,
  Warehouse,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Package,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CenteredLoader from "../components/CenteredLoader";
import api from "../services/api";
import toast from "react-hot-toast";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import axios from "axios";
const PostExOrderViewList = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showRemarks, setShowRemarks] = useState(false);

  // Generate timeline from order data
  const generateTimelineFromOrder = (orderData) => {
    if (!orderData) return [];

    const timeline = [];
    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
      } catch {
        return null;
      }
    };

    const status = orderData.status?.toLowerCase() || "";
    const createdAt = formatDateTime(
      orderData.createdAt || orderData.orderDate
    );
    const orderDate = formatDateTime(orderData.orderDate);

    // Always add initial status
    if (createdAt) {
      timeline.push({
        status: "At Tml Mart Warehouse",
        date: createdAt,
        completed: true,
        icon: "warehouse",
        color: "blue",
      });
    }

    // Add statuses based on order status
    if (status.includes("submitted") || status.includes("booked")) {
      timeline.push({
        status: "Departed to PostEx Warehouse",
        date: orderDate || createdAt,
        completed: true,
        icon: "truck",
        color: "red",
      });
    }

    if (status.includes("transit") || status.includes("warehouse")) {
      timeline.push({
        status: "Received at RWP Warehouse",
        date: orderDate || createdAt,
        completed: true,
        icon: "warehouse",
        color: "red",
      });

      if (orderData.deliveryCity) {
        timeline.push({
          status: `Departed to ${orderData.deliveryCity.toUpperCase()}`,
          date: orderDate || createdAt,
          completed: true,
          icon: "truck",
          color: "green",
        });
      }
    }

    if (status.includes("transit") || status.includes("en-route")) {
      timeline.push({
        status: `Arrived at Transit Hub ${
          orderData.deliveryCity?.substring(0, 3).toUpperCase() || "LHE"
        }`,
        date: orderDate || createdAt,
        completed: true,
        icon: "warehouse",
        color: "red",
      });
    }

    if (status.includes("pending") || status.includes("waiting")) {
      timeline.push({
        status: "Waiting for Delivery",
        date: orderDate || createdAt,
        completed: true,
        icon: "warehouse",
        color: "red",
      });
    }

    if (status.includes("transit") || status.includes("enroute")) {
      timeline.push({
        status: "Enroute for Delivery",
        date: orderDate || createdAt,
        completed: true,
        icon: "truck",
        color: "green",
      });
    }

    if (status.includes("attempted")) {
      timeline.push({
        status: "Attempt Made: RFD(REFUSED TO RECEIVE)",
        date: orderDate || createdAt,
        completed: true,
        icon: "refresh",
        color: "blue",
      });
    }

    if (status.includes("review") || status.includes("under review")) {
      timeline.push({
        status: "Delivery Under Review",
        date: orderDate || createdAt,
        completed: true,
        icon: "package",
        color: "brown",
      });
    }

    if (status.includes("delivered")) {
      timeline.push({
        status: "Delivered",
        date: orderDate || createdAt,
        completed: true,
        icon: "check",
        color: "green",
      });
    }

    if (status.includes("returned")) {
      timeline.push({
        status: "Returned",
        date: orderDate || createdAt,
        completed: true,
        icon: "refresh",
        color: "red",
      });
    }

    return timeline;
  };

  // Map order data from PostExOrders format to detail page format
  const mapOrderToDetailFormat = (orderData) => {
    if (!orderData) return null;

    const formatDateTime = (dateString) => {
      if (!dateString) return "-";
      try {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
      } catch {
        return dateString || "-";
      }
    };

    return {
      // Basic Information
      merchantName: orderData.createdBy?.firstName || "PostEx",
      trackingNumber: orderData.trackingNumber || "N/A",
      orderType:
        orderData.orderType === "Normal"
          ? "CASH ON DELIVERY"
          : orderData.orderType || "NORMAL",
      invoiceAmount: orderData.orderAmount || 0,
      bookingWeight: orderData.bookingWeight || 0,
      orderDeliveryDate: orderData.orderDate
        ? formatDateTime(orderData.orderDate)
        : "-",
      pickupCity: orderData.pickupCity || "N/A",
      returnCity: orderData.returnCity || orderData.pickupCity || "N/A",
      orderReference: orderData.orderReferenceNumber || "N/A",
      orderDetails: orderData.orderDetail || "N/A",
      status: orderData.status
        ? orderData.status.replace("_", " ").toUpperCase()
        : "UNBOOKED",
      invoiceAmountDate: orderData.orderDate
        ? formatDateTime(orderData.orderDate)
        : "-",
      actualWeight: orderData.bookingWeight || 0,
      orderPickupDate: orderData.createdAt
        ? formatDateTime(orderData.createdAt)
        : "-",
      pickupAddress: orderData.pickupAddress || "N/A",
      returnAddress:
        orderData.returnAddress || orderData.pickupAddress || "N/A",

      // Customer Details
      customerName: orderData.customerName || "N/A",
      deliveryAddress: orderData.deliveryAddress || "N/A",
      customerPhone: orderData.customerContact || "N/A",
      city: orderData.deliveryCity || "N/A",

      // Payment Details (default values - will be updated when API provides these)
      receivedAmount: 0.0,
      upfrontPayment: 0.0,
      reservedPayment: 0.0,
      codCharges: 0.0,
      upfrontCharges: 0.0,
      balanceAmount: orderData.orderAmount || 0.0,
      upfrontPaymentDate: "-",
      reservedPaymentDate: "-",
      codTax: 0.0,
      upfrontTax: 0.0,

      // Timeline/Status History - Generate from order status and dates
      timeline: generateTimelineFromOrder(orderData),

      // Remarks
      remarks: orderData.notes ? [orderData.notes] : [],
    };
  };

  const [order, setOrder] = useState(null);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("returned")) return "bg-red-500 text-white";
    if (statusLower.includes("delivered")) return "bg-green-500 text-white";
    if (statusLower.includes("pending") || statusLower.includes("waiting"))
      return "bg-yellow-500 text-white";
    if (statusLower.includes("transit") || statusLower.includes("enroute"))
      return "bg-blue-500 text-white";
    return "bg-gray-500 text-white";
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return "0.00";
    return `Rs ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    return dateString;
  };

  // Get icon component for timeline
  const getTimelineIcon = (iconType, color) => {
    const iconClass = `w-6 h-6`;
    const colorClasses = {
      blue: "text-blue-600",
      red: "text-red-600",
      green: "text-green-600",
      brown: "text-amber-700",
      yellow: "text-yellow-600",
    };

    switch (iconType) {
      case "warehouse":
        return (
          <Warehouse
            className={`${iconClass} ${
              colorClasses[color] || colorClasses.blue
            }`}
          />
        );
      case "truck":
        return (
          <Truck
            className={`${iconClass} ${
              colorClasses[color] || colorClasses.green
            }`}
          />
        );
      case "refresh":
        return (
          <RotateCcw
            className={`${iconClass} ${
              colorClasses[color] || colorClasses.blue
            }`}
          />
        );
      case "package":
        return (
          <Package
            className={`${iconClass} ${
              colorClasses[color] || colorClasses.brown
            }`}
          />
        );
      case "check":
        return (
          <CheckCircle
            className={`${iconClass} ${
              colorClasses[color] || colorClasses.green
            }`}
          />
        );
      default:
        return (
          <Clock
            className={`${iconClass} ${
              colorClasses[color] || colorClasses.yellow
            }`}
          />
        );
    }
  };
  const fetchOrder = async () => {
    if (id) {
      try {
        const response = await axios.get(
          "https://api.postex.pk/services/integration/api/order/v1/track-bulk-order",
          {
            headers: {
              token:
                "ZThkODBkYzg4NjBkNDE0YzgxOWUxZGZkM2U0YjNjYjc6ZDk2ZjE5NjBjNzU2NDk3MThmZDc2MmExYTgyYWY5MmY=",
            },
            params: {
              TrackingNumbers: id,
            },
          }
        );

        console.log("response to view order details is ", response);

        const order = response.data.dist[0].trackingResponse;
        console.log("order is ", order);
        setOrder(order);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order:", error);
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    fetchOrder();
  }, [id]);
  // Get background color for timeline icon
  const getTimelineBgColor = (color) => {
    const bgColors = {
      blue: "bg-blue-100",
      red: "bg-red-100",
      green: "bg-green-100",
      brown: "bg-amber-100",
      yellow: "bg-yellow-100",
    };
    return bgColors[color] || "bg-gray-100";
  };

  const handleDownload = async () => {
    try {
      // Prepare data for export
      const exportData = {
        "Merchant Name": order.merchantName,
        "Tracking Number": order.trackingNumber,
        "Order Type": order.orderType,
        "Invoice Amount": order.invoiceAmount,
        "Customer Name": order.customerName,
        "Customer Phone": order.customerPhone,
        "Delivery Address": order.deliveryAddress,
        City: order.city,
        Status: order.status,
        "Order Reference": order.orderReference,
        "Pickup City": order.pickupCity,
        "Return City": order.returnCity,
        "Booking Weight": order.bookingWeight,
        "Actual Weight": order.actualWeight,
        "Received Amount": order.receivedAmount,
        "Upfront Payment": order.upfrontPayment,
        "Balance Amount": order.balanceAmount,
        "COD Charges": order.codCharges,
        "COD Tax": order.codTax,
      };

      const result = exportToExcel(
        [exportData],
        `PostEx_Order_${order.trackingNumber}`,
        "Order Details"
      );
      if (result.success) {
        toast.success("Order details downloaded successfully!");
      } else {
        toast.error("Failed to download order details");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download order details");
    }
  };

  if (loading || !order) {
    return <CenteredLoader message="Loading order details..." size="large" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/postex-orders")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-purple-900">Order Detail</h1>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Basic Information
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Merchant Name:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.merchantName}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Tracking Number:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.trackingNumber}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Order Type:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.orderType}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Invoice Amount:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.invoiceAmount)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Booking Weight:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.bookingWeight} (kg)
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Order Delivery Date:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.orderDeliveryDate}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Pickup City:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.pickupCity || "Rawalpindi"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Return City:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.returnCity || "Rawalpindi"}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Order Reference:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.orderRefNumber}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Order Details:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.orderDetail}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Status:
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.transactionStatus}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Invoice Amount Date:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatDate(order.transactionDate)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Actual Weight:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.actualWeight} (kg)
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Order Pickup Date:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatDate(order.orderPickupDate)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Pickup Address:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right max-w-xs">
                  {order.pickupAddress}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Return Address:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right max-w-xs">
                  {order.returnAddress}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Customer Details
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Customer Name:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.customerName}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Delivery Address:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right max-w-xs">
                  {order.deliveryAddress}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Customer Phone:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.customerPhone}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">City:</span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.cityName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Payment Details
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Received Amount:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.invoicePayment)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Balance Amount:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.balanceAmount)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Upfront Payment:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.upfrontPayment)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Upfront Payment Date:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatDate(order.upfrontPaymentDate)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Reserved Payment:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.reservePayment)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Reserved Payment Date:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatDate(order.reservePaymentDate)}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  COD Charges:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.transactionFee)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  COD Tax:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {formatCurrency(order.transactionTax)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Upfront Charges:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.upfrontCharges !== 0
                    ? formatCurrency(order.upfrontCharges)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Upfront Tax:
                </span>
                <span className="text-sm font-semibold text-green-600 text-right">
                  {order.upfrontTax !== 0
                    ? formatCurrency(order.upfrontTax)
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowRemarks(!showRemarks)}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
          >
            View Remarks
          </button>
          <button
            onClick={() => navigate("/postex-orders")}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
          >
            Back
          </button>
        </div>

        {/* Remarks Modal */}
        {showRemarks && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
              <button
                onClick={() => setShowRemarks(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {order.remarks && order.remarks.length > 0 ? (
              <div className="space-y-3">
                {order.remarks.map((remark, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{remark}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No remarks available
              </p>
            )}
          </div>
        )}

        {/* Order Timeline */}
        {order.transactionStatusHistory &&
          order.transactionStatusHistory?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Timeline
              </h2>

              <div className="overflow-x-auto pb-4">
                <div
                  className="flex gap-4 min-w-max"
                  style={{
                    minWidth: `${
                      order.transactionStatusHistory.length * 200
                    }px`,
                  }}
                >
                  {order.transactionStatusHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center min-w-[180px] relative"
                    >
                      {/* Timeline Line */}
                      {index < order.transactionStatusHistory.length - 1 && (
                        <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 transform translate-x-1/2 z-0"></div>
                      )}

                      {/* Status Icon */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full mb-3 ${getTimelineBgColor(
                          item.color
                        )}`}
                      >
                        {/* Green F badge for completed statuses */}
                        {item.returnRequested === true ? (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-xs font-bold text-white">
                              R
                            </span>
                          </div>
                        ) : (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-xs font-bold text-white">
                              F
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Text */}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-900 mb-1 leading-tight max-w-[160px]">
                          {item.transactionStatusMessage}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.updatedAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default PostExOrderViewList;
