import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Package, Users, Warehouse, TrendingUp, ShoppingCart, ArrowRight, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    products: [],
    suppliers: [],
    warehouses: [],
    sales: [],
    purchases: []
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      searchAll(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchAll = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const searchLower = searchTerm.toLowerCase();

      // Search Products
      const productsRes = await api.get('/products');
      const products = (productsRes.data?.products || []).filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
      );

      // Search Suppliers
      const suppliersRes = await api.get('/suppliers');
      const suppliers = (suppliersRes.data?.suppliers || []).filter(s =>
        s.name?.toLowerCase().includes(searchLower) ||
        s.code?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower)
      );

      // Search Warehouses
      const warehousesRes = await api.get('/warehouses');
      const warehouses = (warehousesRes.data || []).filter(w =>
        w.name?.toLowerCase().includes(searchLower) ||
        w.location?.toLowerCase().includes(searchLower) ||
        w.code?.toLowerCase().includes(searchLower)
      );

      // Search Sales
      const salesRes = await api.get('/sales');
      const sales = (salesRes.data || []).filter(s =>
        s.invoiceNumber?.toLowerCase().includes(searchLower) ||
        s.customerName?.toLowerCase().includes(searchLower)
      );

      // Search Purchases
      const purchasesRes = await api.get('/purchases');
      const purchases = (purchasesRes.data?.purchases || []).filter(p =>
        p.purchaseNumber?.toLowerCase().includes(searchLower) ||
        p.supplierId?.name?.toLowerCase().includes(searchLower)
      );

      setResults({
        products,
        suppliers,
        warehouses,
        sales,
        purchases
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const renderProductCard = (product) => (
    <div 
      key={product._id}
      onClick={() => navigate('/products')}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{product.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
          <p className="text-sm text-gray-500 mt-1">Category: {product.category}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm font-medium text-gray-700">PKR {product.price?.toLocaleString() || 0}</span>
            <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Stock: {product.stock || 0}
            </span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  const renderSupplierCard = (supplier) => (
    <div 
      key={supplier._id}
      onClick={() => navigate('/suppliers')}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{supplier.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Code: {supplier.code}</p>
          <p className="text-sm text-gray-500 mt-1">{supplier.email}</p>
          <p className="text-sm text-gray-500">{supplier.phone}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  const renderWarehouseCard = (warehouse) => (
    <div 
      key={warehouse._id}
      onClick={() => navigate('/warehouses')}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{warehouse.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Code: {warehouse.code}</p>
          <p className="text-sm text-gray-500 mt-1">{warehouse.location}</p>
          <p className="text-sm text-gray-700 mt-2">Capacity: {warehouse.capacity?.toLocaleString() || 0} units</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  const renderSaleCard = (sale) => (
    <div 
      key={sale._id}
      onClick={() => navigate('/sales')}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{sale.invoiceNumber}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Customer: {sale.customerName}</p>
          <p className="text-sm text-gray-700 mt-2">PKR {sale.totalAmount?.toLocaleString() || 0}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  const renderPurchaseCard = (purchase) => (
    <div 
      key={purchase._id}
      onClick={() => navigate('/purchases')}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{purchase.purchaseNumber}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Supplier: {purchase.supplierId?.name || 'N/A'}</p>
          <p className="text-sm text-gray-700 mt-2">PKR {purchase.totalAmount?.toLocaleString() || 0}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  const tabs = [
    { id: 'all', label: 'All Results', count: totalResults },
    { id: 'products', label: 'Products', count: results.products.length },
    { id: 'suppliers', label: 'Suppliers', count: results.suppliers.length },
    { id: 'warehouses', label: 'Warehouses', count: results.warehouses.length },
    { id: 'sales', label: 'Sales', count: results.sales.length },
    { id: 'purchases', label: 'Purchases', count: results.purchases.length },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600">
            {query ? `Showing results for "${query}"` : 'Enter a search query to get started'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, suppliers, warehouses, sales, purchases..."
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-600">Enter a search term to find products, suppliers, warehouses, and more.</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try different keywords or check your spelling.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-lg p-2 border border-gray-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="space-y-6">
              {(activeTab === 'all' || activeTab === 'products') && results.products.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    Products ({results.products.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.products.map(renderProductCard)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'suppliers') && results.suppliers.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Suppliers ({results.suppliers.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.suppliers.map(renderSupplierCard)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'warehouses') && results.warehouses.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Warehouse className="h-6 w-6 text-blue-600" />
                    Warehouses ({results.warehouses.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.warehouses.map(renderWarehouseCard)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'sales') && results.sales.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Sales ({results.sales.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.sales.map(renderSaleCard)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'purchases') && results.purchases.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                    Purchases ({results.purchases.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.purchases.map(renderPurchaseCard)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

