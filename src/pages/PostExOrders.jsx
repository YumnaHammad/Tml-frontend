import React from "react";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { Forward } from "lucide-react";

const PostExOrders = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    orderStatusId: 0,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const statusOptions = [
    { value: 0, label: "All Orders" },
    { value: 1, label: "Unbooked" },
    { value: 2, label: "Booked" },
    { value: 3, label: "PostEx WareHouse" },
    { value: 4, label: "Out For Delivery" },
    { value: 5, label: "Delivered" },
    { value: 6, label: "Returned" },
    { value: 7, label: "Un-Assigned By Me" },
    { value: 8, label: "Expired" },
    { value: 9, label: "Delivery Under Review" },
    { value: 15, label: "Picked By PostEx" },
    { value: 16, label: "Out For Return" },
    { value: 17, label: "Attempted" },
    { value: 18, label: "En-Route to PostEx warehouse" }
  ];

  const fetchPostExData = async () => {
    try {
      const response = await axios.get(
        "https://api.postex.pk/services/integration/api/order/v1/get-all-order",
        {
          headers: {
            token: "ZThkODBkYzg4NjBkNDE0YzgxOWUxZGZkM2U0YjNjYjc6ZDk2ZjE5NjBjNzU2NDk3MThmZDc2MmExYTgyYWY5MmY=",
            "Content-Type": "application/json",
          },
          params: filters,
        }
      );
      if (response.status === 200) {
        setData(response.data.dist || []);
      }
      console.log("response of postex orders is", response);
    } catch (error) {
      console.log("error fetching data is", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchPostExData();
  };

  useEffect(() => {
    fetchPostExData();
  }, []);

  return (
    <div>
      {/* Filters Section */}
      <div className="card p-4 mb-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              value={filters.orderStatusId}
              onChange={(e) => handleFilterChange('orderStatusId', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ORDER REF
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRACKING #
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WEIGHT
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DELIVERY ADDRESS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RETURN ADDRESS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ITEMS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DETAILS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AMOUNT
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  JOURNEY
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {data && data.length > 0 ? (
                data.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{order.orderRefNumber}</td>
                    <td className="px-4 py-3 text-sm">{order.trackingNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-gray-500 text-xs">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.bookingWeight}kg</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" title={order.deliveryAddress}>
                      {order.deliveryAddress}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" title={order.returnAddress}>
                      {order.returnAddress}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.items}</td>
                    <td className="px-4 py-3 text-sm">{order.orderDetail}</td>
                    <td className="px-4 py-3 text-sm">{order.invoicePayment}</td>
                    <td className="px-4 py-3 text-sm">
                      <Forward className="h-4 w-4 text-blue-600" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.transactionStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.transactionStatus === 'Returned' ? 'bg-red-100 text-red-800' :
                        order.transactionStatus === 'Out For Delivery' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.transactionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                    No orders found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostExOrders;