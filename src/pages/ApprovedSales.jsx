import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw, Eye, Edit, Download, Table2, List, X } from 'lucide-react';
import CenteredLoader from '../components/CenteredLoader';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ExportButton from '../components/ExportButton';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ApprovedSales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch approved sales data
  const fetchApprovedSales = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      const response = await api.get(`/sales/approved?${params.toString()}`);
      const salesData = response.data?.salesOrders || [];
      const totalFromServer = response.data?.total || 0;

      setSales(salesData);
      setTotalSalesCount(totalFromServer);
    } catch (error) {
      console.error('Error fetching approved sales:', error);
      setSales([]);
      setTotalSalesCount(0);
      toast.error('Failed to load approved sales orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovedSales();
  }, [currentPage]);

  const handleRefresh = () => {
    fetchApprovedSales();
  };

  const handleView = (sale) => {
    setSelectedSale(sale);
    setShowViewModal(true);
  };

  const handleEdit = (saleId) => {
    navigate(`/sales/edit/${saleId}`);
  };

  const handleProceedToPostEx = () => {
    // Navigate to PostEx order page with empty form
    navigate('/approved-sales/postex-order');
  };

  const handleExportSales = async (format = 'excel') => {
    const { exportSales } = await import('../utils/exportUtils');
    const filename = `approved-sales-${new Date().toISOString().split('T')[0]}`;
    return exportSales(sales, format, filename);
  };

  // Pagination
  const totalPages = Math.ceil(totalSalesCount / itemsPerPage);
  const currentSales = sales;

  if (loading) {
    return <CenteredLoader message="Loading approved sales..." size="large" />;
  }

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Approved Sales</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View all QC approved sales orders</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {user?.role !== 'agent' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">List</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <Table2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">Table</span>
              </button>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
            title="Refresh approved sales"
          >
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {user?.role !== 'agent' && (
            <ExportButton
              data={sales}
              filename="approved-sales"
              title="Approved Sales Report"
              exportFunction={handleExportSales}
              variant="default"
              buttonText="Export"
            />
          )}
        </div>
      </div>

      {/* Statistics Card */}
      <div className="mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Approved Sales</p>
              <p className="text-2xl font-bold text-gray-900">{totalSalesCount}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Approved Sales Records ({totalSalesCount} total)
              </h3>
              <button
                onClick={handleProceedToPostEx}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Proceed to PostEx
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      System Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '250px', width: '300px' }}>
                      Customer Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    {user?.role !== 'agent' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QC Status
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSales.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role !== 'agent' ? 12 : 11} className="px-6 py-8 text-center text-gray-500">
                        No approved sales orders found.
                      </td>
                    </tr>
                  ) : (
                    currentSales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{sale.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sale.orderDate ? new Date(sale.orderDate).toLocaleString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sale.timestamp ? new Date(sale.timestamp).toLocaleString() :
                              sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ maxWidth: '150px', width: '150px' }}>
                          <div
                            className="text-sm text-gray-900 break-words overflow-hidden text-ellipsis"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={sale.customerName || sale.customerInfo?.name || 'N/A'}
                          >
                            {sale.customerName || sale.customerInfo?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.customerInfo?.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4" style={{ maxWidth: '150px', width: '150px' }}>
                          <div
                            className="text-sm text-gray-900 break-words overflow-hidden text-ellipsis line-clamp-2"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={sale.agentName || sale.agent_name || sale.createdBy?.firstName || sale.createdBy?.email || '-'}
                          >
                            {sale.agentName || sale.agent_name || sale.createdBy?.firstName || sale.createdBy?.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ maxWidth: '200px', width: '200px' }}>
                          <div className="text-sm text-gray-900">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.slice(0, 3).map((item, idx) => {
                                const productName = item.productId?.name || 'Unknown';
                                const variantName = item.variantName ? ` - ${item.variantName}` : '';
                                const fullProductName = productName + variantName;

                                return (
                                  <div key={idx}>
                                    {idx > 0 && <hr className="my-2 border-gray-300" />}
                                    <div
                                      className="text-sm text-gray-600 mb-1 break-words overflow-hidden text-ellipsis"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                      title={fullProductName}
                                    >
                                      {fullProductName}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {sale.items?.length > 3 && (
                              <div className="text-sm text-gray-500 mt-1">+{sale.items.length - 3} more</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.slice(0, 3).map((item, idx) => (
                                <div key={idx}>
                                  {idx > 0 && <hr className="my-2 border-gray-300" />}
                                  <div className="text-sm text-gray-600 mb-1">
                                    {item.quantity}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {sale.items?.length > 3 && (
                              <div className="text-sm text-gray-500 mt-1">-</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            Rs {sale.totalAmount?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ maxWidth: '250px', width: '250px' }}>
                          <div className="text-sm text-gray-900">
                            {sale.deliveryAddress ? (
                              <>
                                {sale.deliveryAddress.street && (
                                  <div
                                    className="break-words overflow-hidden text-ellipsis"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                    title={sale.deliveryAddress.street}
                                  >
                                    {sale.deliveryAddress.street}
                                  </div>
                                )}
                                {sale.deliveryAddress.city && (
                                  <div
                                    className="text-xs text-gray-600 break-words overflow-hidden text-ellipsis"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                    title={sale.deliveryAddress.city}
                                  >
                                    {sale.deliveryAddress.city}
                                  </div>
                                )}
                                {sale.deliveryAddress.country && (
                                  <div className="text-xs text-gray-600">{sale.deliveryAddress.country}</div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ maxWidth: '150px', width: '150px' }}>
                          <div
                            className="text-sm text-gray-900 break-words overflow-hidden text-ellipsis"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={sale.notes || '-'}
                          >
                            {sale.notes || '-'}
                          </div>
                        </td>
                        {user?.role !== 'agent' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sale.qcStatus ? (
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                sale.qcStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                sale.qcStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                                {sale.qcStatus}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(sale)}
                              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm"
                              title="View Details"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            {user?.role !== 'agent' && (
                              <button
                                onClick={() => handleEdit(sale._id)}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center text-xs px-2 py-1 rounded transition-colors shadow-sm"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalSalesCount)} of {totalSalesCount} results
                </div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Sales Order Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Order Number:</span> {selectedSale.orderNumber}</p>
                    <p><span className="font-medium">Sale Date:</span> {selectedSale.orderDate ? new Date(selectedSale.orderDate).toLocaleString() : '-'}</p>
                    <p><span className="font-medium">Status:</span> {selectedSale.status || 'Pending'}</p>
                    <p><span className="font-medium">QC Status:</span> {selectedSale.qcStatus || '-'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedSale.customerName || selectedSale.customerInfo?.name || '-'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedSale.customerInfo?.phone || '-'}</p>
                    <p><span className="font-medium">CN Number:</span> {selectedSale.customerInfo?.cnNumber || '-'}</p>
                    {selectedSale.agentName && (
                      <p><span className="font-medium">Agent:</span> {selectedSale.agentName}</p>
                    )}
                  </div>
                </div>
              </div>
              {selectedSale.deliveryAddress && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Address</h4>
                  <div className="text-sm text-gray-600">
                    {selectedSale.deliveryAddress.street && <p>{selectedSale.deliveryAddress.street}</p>}
                    {selectedSale.deliveryAddress.city && <p>{selectedSale.deliveryAddress.city}</p>}
                    {selectedSale.deliveryAddress.country && <p>{selectedSale.deliveryAddress.country}</p>}
                  </div>
                </div>
              )}
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded p-3">
                        <p className="font-medium">{item.productId?.name || 'Unknown'}</p>
                        {item.variantName && <p className="text-sm text-gray-600">Variant: {item.variantName}</p>}
                        <p className="text-sm">Quantity: {item.quantity} × Rs {item.unitPrice} = Rs {item.totalPrice || (item.quantity * item.unitPrice)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-right">
                    <p className="text-lg font-bold">Total: Rs {selectedSale.totalAmount?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApprovedSales;

