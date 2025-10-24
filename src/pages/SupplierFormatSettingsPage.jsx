import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SupplierFormatSettings from '../components/SupplierFormatSettings';
import { loadFormatSettings, saveFormatSettings } from '../utils/supplierFormatUtils';
import toast from 'react-hot-toast';

const SupplierFormatSettingsPage = () => {
  const navigate = useNavigate();

  const handleFormatChange = (newSettings) => {
    const saved = saveFormatSettings(newSettings);
    if (saved) {
      toast.success('Format settings saved successfully');
    } else {
      toast.error('Failed to save format settings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/suppliers')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Suppliers
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Supplier Format Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <SupplierFormatSettings
          initialFormat={loadFormatSettings()}
          onFormatChange={handleFormatChange}
        />
      </div>
    </div>
  );
};

export default SupplierFormatSettingsPage;
