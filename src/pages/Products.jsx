import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ProductList } from '../modules';
import ProductFormPage from '../modules/products/components/ProductFormPage';
import api from '../services/api';
import ExportButton from '../components/ExportButton';

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const isNewProduct = location.pathname === '/products/new';
  const isEditProduct = location.pathname.includes('/products/') && location.pathname.includes('/edit');

  useEffect(() => {
    if (isEditProduct && id) {
      fetchProduct();
    }
  }, [isEditProduct, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (productData) => {
    try {
      await api.post('/products', productData);
      navigate('/products');
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };

  const handleUpdate = async (productData) => {
    try {
      await api.put(`/products/${id}`, productData);
      navigate('/products');
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  if (isNewProduct || isEditProduct) {
    if (isEditProduct && loading) {
      return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/products')}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </button>
        </div>
        <ProductFormPage 
          product={isEditProduct ? product : null}
          onSubmit={isEditProduct ? handleUpdate : handleCreate}
          onClose={() => navigate('/products')}
        />
      </div>
    );
  }

  return <ProductList />;
};

export default Products;