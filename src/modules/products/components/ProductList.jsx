import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  X,
  AlertCircle,
  Grid3X3,
  List,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import ProductDetail from './ProductDetail';
import CenteredLoader from '../../../components/CenteredLoader';

const ProductList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const fetchProducts = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const response = await api.get('/products');
      const productsData = response.data.products || response.data;
      // Sort by creation date - newest first
      const sortedProducts = (productsData || []).sort((a, b) => {
        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      });
      setProducts(sortedProducts);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreate = async (productData) => {
    try {
      const response = await api.post('/products', productData);
      setProducts([...products, response.data]);
      navigate('/products');
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };

  const handleUpdate = async (productData, productId) => {
    try {
      const response = await api.put(`/products/${productId}`, productData);
      setProducts(products.map(p => p._id === productId ? response.data : p));
      navigate('/products');
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const openDeleteModal = (product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, product: null });
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    
    const productName = deleteModal.product.name;
    
    try {
      const loadingToast = toast.loading(`Deleting ${productName}...`);
      
      await api.delete(`/products/${deleteModal.product._id}`);
      
      setProducts(products.filter(p => p._id !== deleteModal.product._id));
      
      toast.dismiss(loadingToast);
      toast.success(`${productName} deleted successfully!`);
      
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.response?.data?.error || 'Failed to delete product. Please try again.');
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-500', bgColor: 'bg-red-100' };
    if (stock <= 5) return { text: 'Low Stock', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-500', bgColor: 'bg-green-100' };
  };

  const filteredProducts = products.filter((product) => {
    const term = (searchTerm || '').trim().toLowerCase();
    const name = (product?.name || '').toLowerCase();
    const matchesSearch = term === '' || name.includes(term);
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      case 'name': return a.name.localeCompare(b.name);
      case 'stock': return b.currentStock - a.currentStock;
      case 'price': return b.sellingPrice - a.sellingPrice;
      default: return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, sortBy]);

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return <CenteredLoader message="Loading products..." size="large" />;
  }

  return (
 <>
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        {/* Title Section - Full width on mobile, auto width on larger screens */}
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your inventory products</p>
        </div>
        
        {/* Controls Section - Full width on mobile, auto width on larger screens */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              List
            </button>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/products/new')}
              className="btn-primary flex items-center flex-1 sm:flex-initial justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Products Count and Filters */}
      <div className="card p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{sortedProducts.length}</span> of <span className="font-semibold text-gray-900">{products.length}</span> products
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="newest">Sort by Newest</option>
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
          </select>
          <button
            onClick={() => fetchProducts(false)}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center disabled:opacity-50"
          >
            <Filter className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map((product) => {
            const totalStock = product.warehouses?.reduce((sum, w) => sum + w.stock, 0) || 0;
            const { text: stockText, color: stockColor, bgColor: stockBgColor } = getStockStatus(totalStock);
            
            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => navigate(`/products/${product._id}/edit`)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">{product.unit}</span>
                  </div>
                  
                  {/* Show variants info or regular pricing */}
                  {product.hasVariants && product.variants && product.variants.length > 0 ? (
                    <div className="pt-2 pb-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-600 flex items-center">
                          <Grid3X3 className="h-4 w-4 mr-1" />
                          {product.variants.length} Variants Available
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Click "View" to see variant details and prices
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selling Price:</span>
                      <span className="font-medium">PKR {product.sellingPrice}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stock:</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${stockBgColor} ${stockColor}`}>
                      {totalStock} units - {stockText}
                    </div>
                  </div>
                </div>

                {product.warehouses && product.warehouses.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Stock by Warehouse:</h4>
                    <div className="space-y-1">
                      {product.warehouses.map((warehouse, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{warehouse.name}:</span>
                          <span className="font-medium">{warehouse.stock} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Price
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => {
                  const totalStock = product.warehouses?.reduce((sum, w) => sum + w.stock, 0) || 0;
                  const { text: stockText, color: stockColor, bgColor: stockBgColor } = getStockStatus(totalStock);
                  
                  return (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-8 w-8 text-primary-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                            <div className="text-xs text-gray-400">{product.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{product.category}</span>
                        </div>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.hasVariants && product.variants && product.variants.length > 0 ? (
                            <div className="flex items-center">
                              <Grid3X3 className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm font-semibold text-blue-600">{product.variants.length} Variants</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">PKR {product.costPrice || 0}</span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.hasVariants && product.variants && product.variants.length > 0 ? (
                          <div className="flex items-center">
                            <Grid3X3 className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-semibold text-blue-600">{product.variants.length} Variants</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">PKR {product.sellingPrice}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockBgColor} ${stockColor}`}>
                            {totalStock} units - {stockText}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-gray-400 hover:text-primary-600 transition-colors p-1 hover:bg-primary-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => navigate(`/products/${product._id}/edit`)}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
                                title="Edit Product"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(product)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or add a new product.</p>
        </div>
      )}

      {/* Pagination */}
      {sortedProducts.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, sortedProducts.length)}</span> of{' '}
                <span className="font-medium">{sortedProducts.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={closeDeleteModal}
                style={{ zIndex: 99998 }}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
                style={{ position: 'relative', zIndex: 99999 }}
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delete Product
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.product?.name}"</span>? 
                    This action cannot be undone and will permanently remove the product from your inventory.
                  </p>
                  
                  {deleteModal.product && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">SKU:</span>
                          <span className="ml-2 font-medium">{deleteModal.product.sku}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <span className="ml-2 font-medium">{deleteModal.product.category}</span>
                        </div>
                        {/* <div>
                          <span className="text-gray-600">Cost Price:</span>
                          <span className="ml-2 font-medium">PKR {deleteModal.product.costPrice}</span>
                        </div> */}
                        <div>
                          <span className="text-gray-600">Selling Price:</span>
                          <span className="ml-2 font-medium">PKR {deleteModal.product.sellingPrice}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Delete Product
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
    <div>
    {/* Product Detail Modal */}
    {selectedProduct && (
        <ProductDetail
          productId={selectedProduct._id}
          onClose={() => setSelectedProduct(null)}
        />
      )}

    </div>
 </>
  );
};

export default ProductList;
