import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ExportButton = ({ 
  data, 
  filename = 'export', 
  title = 'Export Report', 
  columns = [],
  exportFunction = null,
  className = '',
  buttonText = 'Export',
  showText = true,
  variant = 'default' // 'default', 'icon-only', 'dropdown'
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format = 'excel') => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Ensure format is a string and default to 'excel' if not provided
    const exportFormat = (format && typeof format === 'string') ? format.toLowerCase().trim() : 'excel';

    console.log('ExportButton: handleExport called with format', format, '-> using', exportFormat);

    setIsExporting(true);
    setShowDropdown(false);

    try {
      let result;
      
      if (exportFunction) {
        // Use custom export function
        result = await exportFunction(data, exportFormat);
      } else {
        // Use default export
        const { exportData } = await import('../utils/exportUtils');
        result = exportData(data, exportFormat, filename, title, columns);
      }

      if (result && result.success) {
        toast.success(`${exportFormat.toUpperCase()} file exported successfully!`);
      } else {
        toast.error(`Export failed: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const buttonVariants = {
    default: "flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200",
    iconOnly: "p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200",
    primary: "flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
  };

  const iconVariants = {
    default: "w-4 h-4 mr-2",
    iconOnly: "w-4 h-4",
    primary: "w-4 h-4 mr-2"
  };

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isExporting}
          className={`${buttonVariants.default} ${className}`}
          title="Export data"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <Download className={iconVariants.default} />
          )}
          {showText && buttonText}
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Export Format
                </div>
                
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-3 text-green-600" />
                  Export as Excel
                </button>
                
                {/* PDF export commented out as per request */}
                {/* <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <FileText className="w-4 h-4 mr-3 text-red-600" />
                  Export as PDF
                </button> */}
                
                {/* CSV export removed as per request */}
                {/* <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <Download className="w-4 h-4 mr-3 text-blue-600" />
                  Export as CSV
                </button> */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className={`${buttonVariants[variant]} ${className}`}
        title="Export data"
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
        ) : (
          <Download className={iconVariants[variant]} />
        )}
        {showText && variant !== 'iconOnly' && buttonText}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Export Format
              </div>
              
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <FileSpreadsheet className="w-4 h-4 mr-3 text-green-600" />
                Export as Excel
              </button>
              
              {/* PDF export commented out as per request */}
              {/* <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <FileText className="w-4 h-4 mr-3 text-red-600" />
                Export as PDF
              </button> */}
              
              {/* CSV export removed as per request */}
              {/* <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-3 text-blue-600" />
                Export as CSV
              </button> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;
