import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackageX, CheckCircle, XCircle, Warehouse, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ExpectedReturns = () => {
  const [expectedReturns, setExpectedReturns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [confirmingReturn, setConfirmingReturn] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warehousesRes] = await Promise.all([
        api.get('/warehouses')
      ]);
      
      setWarehouses(warehousesRes.data || []);
      
      // Extract expected returns from warehouses
      const returns = [];
      warehousesRes.data.forEach(warehouse => {
        warehouse.currentStock?.forEach(stock => {
          if (stock.expectedReturns && stock.expectedReturns > 0) {
            returns.push({
              warehouse: warehouse.name,
              warehouseId: warehouse._id,
              product: stock.productId?.name || 'Unknown',
              variant: stock.variantName || null,
              quantity: stock.expectedReturns,
              stockItem: stock
            });
          }
        });
      });
      
      setExpectedReturns(returns);
    } catch (error) {
      toast.error('Failed to load expected returns');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReturn = async (returnItem) => {
    if (!selectedWarehouse) {
      toast.error('Please select a warehouse');
      return;
    }

    try {
      // Update the warehouse stock
      const warehouse = warehouses.find(w => w._id === selectedWarehouse);
      const stockItem = warehouse.currentStock.find(s => 
        s.productId._id === returnItem.stockItem.productId._id &&
        (s.variantId || null) === (returnItem.stockItem.variantId || null)
      );

      if (stockItem) {
        // Move from expectedReturns to quantity
        const response = await api.patch(`/warehouses/${selectedWarehouse}/stock`, {
          productId: returnItem.stockItem.productId._id,
          variantId: returnItem.stockItem.variantId,
          quantityChange: returnItem.quantity,
          expectedReturnsChange: -returnItem.quantity
        });

        toast.success(`✅ ${returnItem.quantity} units added to ${warehouse.name}!`);
        setConfirmingReturn(null);
        setSelectedWarehouse('');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to confirm return');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expected returns...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <PackageX className="w-8 h-8 text-blue-600" />
          Expected Returns
        </h1>
        <p className="text-gray-600 mt-2">Manage products expected to be returned</p>
      </div>

      {expectedReturns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <PackageX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Expected Returns</h3>
          <p className="text-gray-500">All returns have been processed</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {expectedReturns.map((returnItem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <PackageX className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {returnItem.product}
                        {returnItem.variant && <span className="text-blue-600"> - {returnItem.variant}</span>}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Currently in: {returnItem.warehouse}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Expected Quantity</p>
                    <p className="text-2xl font-bold text-blue-600">{returnItem.quantity}</p>
                  </div>

                  {confirmingReturn === index ? (
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2"
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => handleConfirmReturn(returnItem)}
                        disabled={!selectedWarehouse}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                      
                      <button
                        onClick={() => {
                          setConfirmingReturn(null);
                          setSelectedWarehouse('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingReturn(index)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Receive Return
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpectedReturns;
