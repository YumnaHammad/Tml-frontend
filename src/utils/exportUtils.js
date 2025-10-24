import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Excel Export Utility
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {   if (!data || data.length === 0) {
      return { success: false, error: 'No data to export' };
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(data[0]);
    
    headers.forEach((header, index) => {
      let maxLength = header.length;
      data.forEach(row => {
        const cellValue = String(row[header] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });
      colWidths[index] = Math.min(Math.max(maxLength + 2, 10), 50); // Min 10, Max 50
    });
    
    ws['!cols'] = colWidths.map(width => ({ width }));
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    console.log('Excel Export: Downloading file as', fullFilename);
    
    // Save the file with proper Excel extension and MIME type
    XLSX.writeFile(wb, fullFilename, { 
      bookType: 'xlsx',
      type: 'buffer'
    });
    
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: error.message };
  }
};

// PDF Export Utility
export const exportToPDF = (data, filename = 'export', title = 'Export Report', columns = []) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare data for table
    let tableData = [];
    let tableColumns = [];
    
    if (columns.length > 0) {
      // Use provided columns
      tableColumns = columns.map(col => ({
        title: col.header,
        dataKey: col.key
      }));
      
      tableData = data.map(item => {
        const row = {};
        columns.forEach(col => {
          row[col.key] = item[col.key] || '';
        });
        return row;
      });
    } else {
      // Auto-generate columns from data
      if (data.length > 0) {
        const firstItem = data[0];
        tableColumns = Object.keys(firstItem).map(key => ({
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          dataKey: key
        }));
        tableData = data;
      }
    }
    
    // Add table
    doc.autoTable({
      head: [tableColumns.map(col => col.title)],
      body: tableData.map(row => tableColumns.map(col => {
        const value = row[col.dataKey] || '';
        // Format numbers with proper formatting
        if (typeof value === 'number') {
          if (col.title.toLowerCase().includes('price') || col.title.toLowerCase().includes('cost') || col.title.toLowerCase().includes('total')) {
            return `PKR ${value.toFixed(2)}`;
          }
          return value.toString();
        }
        return value;
      })),
      startY: 40,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Light gray
      },
      columnStyles: {
        // Make certain columns narrower
        'Unit Price': { cellWidth: 20 },
        'Item Total': { cellWidth: 20 },
        'Purchase Total': { cellWidth: 20 },
        'Quantity': { cellWidth: 15 },
        'Status': { cellWidth: 15 },
        'Payment Status': { cellWidth: 15 }
      }
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.pdf`;
    
    console.log('PDF Export: Downloading file as', fullFilename);
    
    // Force PDF download with explicit MIME type
    console.log('PDF Export: Forcing PDF download with explicit MIME type');
    
    // Create PDF blob with explicit MIME type
    const pdfBlob = doc.output('blob', { type: 'application/pdf' });
    
    // Create download link with explicit PDF attributes
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    link.type = 'application/pdf';
    link.style.display = 'none';
    
    // Set additional attributes to force PDF recognition
    link.setAttribute('data-type', 'pdf');
    link.setAttribute('data-format', 'pdf');
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('PDF Export: PDF file forced download completed as', fullFilename);
    
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error: error.message };
  }
};

// CSV Export Utility (for backward compatibility)
export const exportToCSV = (data, filename = 'export') => {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'No data to export' };
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content with proper formatting
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header] || '';
          
          // Format numbers properly
          if (typeof value === 'number') {
            if (header.toLowerCase().includes('price') || header.toLowerCase().includes('cost') || header.toLowerCase().includes('total')) {
              value = value.toFixed(2);
            }
          }
          
          // Convert to string
          value = String(value);
          
          // Escape commas, quotes, and newlines
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download file with proper MIME type
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.csv`;
    
    console.log('CSV Export: Downloading file as', fullFilename);
    
    // Create blob with proper CSV MIME type
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;',
      endings: 'native'
    });
    const url = URL.createObjectURL(blob);
    
    // Create download link with proper attributes
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    link.type = 'text/csv';
    link.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error: error.message };
  }
};

// Generic Export Function with Format Selection
export const exportData = (data, format, filename = 'export', title = 'Export Report', columns = []) => {
  // Ensure format is a string and default to 'excel' if not provided
  const exportFormat = (format && typeof format === 'string') ? format.toLowerCase().trim() : 'excel';
  
  console.log('exportData: Called with format', format, '-> processed as', exportFormat);
  
  // Validate format and provide clear error if invalid
  const validFormats = ['excel', 'xlsx', 'pdf', 'csv'];
  if (!validFormats.includes(exportFormat)) {
    console.error('exportData: Invalid format', exportFormat, 'Valid formats:', validFormats);
    return { success: false, error: `Invalid format: ${exportFormat}. Valid formats: ${validFormats.join(', ')}` };
  }
  
  switch (exportFormat) {
    case 'excel':
    case 'xlsx':
      console.log('exportData: Routing to Excel export');
      return exportToExcel(data, filename, title);
    case 'pdf':
      console.log('exportData: Routing to PDF export');
      return exportToPDF(data, filename, title, columns);
    case 'csv':
      console.log('exportData: Routing to CSV export');
      return exportToCSV(data, filename);
    default:
      console.error('exportData: Unsupported format', exportFormat);
      return { success: false, error: 'Unsupported format' };
  }
};

// User-specific export functions
export const exportUsers = (users, format = 'excel') => {
  const userData = users.map(user => ({
    'First Name': user.firstName || 'Unknown',
    'Last Name': user.lastName || 'User',
    'Email': user.email || 'No email',
    'Phone': user.phone || 'N/A',
    'Role': user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee',
    'Department': user.department || 'N/A',
    'Position': user.position || 'N/A',
    'Status': user.isActive ? 'Active' : 'Inactive',
    'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
    'Created Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'
  }));
  
  return exportData(userData, format, 'users', 'User Management Report', [
    { header: 'First Name', key: 'First Name' },
    { header: 'Last Name', key: 'Last Name' },
    { header: 'Email', key: 'Email' },
    { header: 'Phone', key: 'Phone' },
    { header: 'Role', key: 'Role' },
    { header: 'Department', key: 'Department' },
    { header: 'Position', key: 'Position' },
    { header: 'Status', key: 'Status' },
    { header: 'Last Login', key: 'Last Login' },
    { header: 'Created Date', key: 'Created Date' }
  ]);
};

// Sales-specific export functions
export const exportSales = (sales, format = 'excel') => {
  const salesData = sales.flatMap(sale => {
    // If sale has items array, create a row for each item
    if (sale.items && Array.isArray(sale.items)) {
      return sale.items.map(item => ({
        'Order Number': sale.orderNumber || 'N/A',
        'Customer Name': sale.customerName || sale.customerInfo?.name || 'Unknown',
        'Customer Address': sale.deliveryAddress ? 
          `${sale.deliveryAddress.street || ''}, ${sale.deliveryAddress.city || ''}, ${sale.deliveryAddress.state || ''}, ${sale.deliveryAddress.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : 'N/A',
        'Customer Phone': sale.customerInfo?.phone || 'N/A',
        'Product Name': item.productId?.name || 'Unknown',
        'Product SKU': item.productId?.sku || 'N/A',
        'Variant Name': item.variantName || 'N/A',
        'Quantity': item.quantity || 0,
        'Unit Price': item.unitPrice || 0,
        'Item Total': item.totalPrice || 0,
        'Status': sale.status ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1) : 'Pending',
        'Payment Status': sale.paymentStatus ? sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1) : 'Pending',
        'Order Date': sale.orderDate ? new Date(sale.orderDate).toLocaleDateString() : 'Unknown',
        'Expected Delivery': sale.expectedDeliveryDate ? new Date(sale.expectedDeliveryDate).toLocaleDateString() : 'Not set',
        'Notes': sale.notes || 'N/A',
        'Created By': sale.createdBy?.firstName ? `${sale.createdBy.firstName} ${sale.createdBy.lastName}` : 'Unknown',
        'Created Date': sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'Unknown'
      }));
    } else {
      // Fallback for single item sales (legacy format)
      return {
        'Order Number': sale.orderNumber || 'N/A',
        'Customer Name': sale.customerInfo?.name || sale.customerName || 'Unknown',
        'Customer Address': sale.deliveryAddress ? 
          `${sale.deliveryAddress.street || ''}, ${sale.deliveryAddress.city || ''}, ${sale.deliveryAddress.state || ''}, ${sale.deliveryAddress.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : 'N/A',
        'Customer Phone': sale.customerInfo?.phone || 'N/A',
        'Product Name': sale.productName || 'Unknown',
        'Product SKU': sale.productSKU || 'N/A',
        'Variant Name': sale.variantName || 'N/A',
        'Quantity': sale.quantity || 0,
        'Unit Price': sale.unitPrice || 0,
        'Item Total': sale.totalAmount || 0,
        'Status': sale.status ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1) : 'Pending',
        'Payment Status': sale.paymentStatus ? sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1) : 'Pending',
        'Order Date': sale.orderDate ? new Date(sale.orderDate).toLocaleDateString() : 'Unknown',
        'Expected Delivery': sale.expectedDeliveryDate ? new Date(sale.expectedDeliveryDate).toLocaleDateString() : 'Not set',
        'Notes': sale.notes || 'N/A',
        'Created By': sale.createdBy?.firstName ? `${sale.createdBy.firstName} ${sale.createdBy.lastName}` : 'Unknown',
        'Created Date': sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'Unknown'
      };
    }
  });
  
  return exportData(salesData, format, 'sales', 'Sales Orders Report', [
    { header: 'Order Number', key: 'Order Number' },
    { header: 'Customer Name', key: 'Customer Name' },
    { header: 'Customer Email', key: 'Customer Email' },
    { header: 'Customer Phone', key: 'Customer Phone' },
    { header: 'Product Name', key: 'Product Name' },
    { header: 'Product SKU', key: 'Product SKU' },
    { header: 'Variant Name', key: 'Variant Name' },
    { header: 'Quantity', key: 'Quantity' },
    { header: 'Unit Price', key: 'Unit Price' },
    { header: 'Item Total', key: 'Item Total' },
    { header: 'Order Total', key: 'Order Total' },
    { header: 'Status', key: 'Status' },
    { header: 'Payment Status', key: 'Payment Status' },
    { header: 'Order Date', key: 'Order Date' },
    { header: 'Expected Delivery', key: 'Expected Delivery' },
    { header: 'Actual Delivery', key: 'Actual Delivery' },
    { header: 'Delivery Address', key: 'Delivery Address' },
    { header: 'Notes', key: 'Notes' },
    { header: 'Created By', key: 'Created By' },
    { header: 'Created Date', key: 'Created Date' }
  ]);
};

// Purchase-specific export functions
export const exportPurchases = (purchases, format = 'excel') => {
  // Ensure purchases is an array
  if (!Array.isArray(purchases)) {
    console.error('exportPurchases: purchases is not an array:', purchases);
    return { success: false, error: 'Invalid purchases data' };
  }
  
  console.log('exportPurchases: Processing', purchases.length, 'purchases for', format, 'format');
  console.log('exportPurchases: Format type:', typeof format, 'Value:', format);
  console.log('Sample purchase data:', purchases[0]);
  
  const purchaseData = purchases.flatMap(purchase => {
    // If purchase has items array, create a row for each item
    if (purchase.items && Array.isArray(purchase.items)) {
      return purchase.items.map(item => ({
        'Purchase Number': purchase.purchaseNumber || 'N/A',
        'Supplier': purchase.supplierId?.name || purchase.supplierName || 'Unknown',
        'Product': item.productId?.name || item.productName || 'Unknown',
        'Product SKU': item.productId?.sku || item.productSKU || 'N/A',
        'Quantity': item.quantity || 0,
        'Unit Price': item.unitPrice || 0,
        'Item Total': item.totalPrice || (item.quantity * item.unitPrice) || 0,
        'Purchase Total': purchase.totalAmount || 0,
        'Status': purchase.status ? purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1) : 'Pending',
        'Payment Status': purchase.paymentStatus ? purchase.paymentStatus.charAt(0).toUpperCase() + purchase.paymentStatus.slice(1) : 'Pending',
        'Purchase Date': purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'Unknown',
        'Expected Delivery': purchase.expectedDeliveryDate ? new Date(purchase.expectedDeliveryDate).toLocaleDateString() : 'Not set',
        'Payment Method': purchase.paymentMethod ? purchase.paymentMethod.replace('_', ' ').toUpperCase() : 'Not specified',
        'Invoice Number': purchase.invoiceNumber || 'N/A',
        'Receipt Number': purchase.receiptNumber || 'N/A',
        'Notes': purchase.notes || '',
        'Created By': purchase.createdBy?.firstName ? `${purchase.createdBy.firstName} ${purchase.createdBy.lastName}` : 'Unknown'
      }));
    } else {
      // Fallback for single item purchases (legacy format)
      return {
        'Purchase Number': purchase.purchaseNumber || 'N/A',
        'Supplier': purchase.supplierId?.name || purchase.supplierName || 'Unknown',
        'Product': purchase.productName || 'Unknown',
        'Product SKU': purchase.productSKU || 'N/A',
        'Quantity': purchase.quantity || 0,
        'Unit Price': purchase.unitPrice || 0,
        'Item Total': purchase.totalCost || purchase.totalAmount || 0,
        'Purchase Total': purchase.totalAmount || purchase.totalCost || 0,
        'Status': purchase.status ? purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1) : 'Pending',
        'Payment Status': purchase.paymentStatus ? purchase.paymentStatus.charAt(0).toUpperCase() + purchase.paymentStatus.slice(1) : 'Pending',
        'Purchase Date': purchase.purchaseDate || purchase.orderDate ? new Date(purchase.purchaseDate || purchase.orderDate).toLocaleDateString() : 'Unknown',
        'Expected Delivery': purchase.expectedDeliveryDate ? new Date(purchase.expectedDeliveryDate).toLocaleDateString() : 'Not set',
        'Payment Method': purchase.paymentMethod ? purchase.paymentMethod.replace('_', ' ').toUpperCase() : 'Not specified',
        'Invoice Number': purchase.invoiceNumber || 'N/A',
        'Receipt Number': purchase.receiptNumber || 'N/A',
        'Notes': purchase.notes || '',
        'Created By': purchase.createdBy?.firstName ? `${purchase.createdBy.firstName} ${purchase.createdBy.lastName}` : 'Unknown'
      };
    }
  });
  
  console.log('exportPurchases: About to call exportData with format:', format);
  console.log('exportPurchases: Purchase data length:', purchaseData.length);
  
  const result = exportData(purchaseData, format, 'purchases', 'Purchase Orders Report', [
    { header: 'Purchase Number', key: 'Purchase Number' },
    { header: 'Supplier', key: 'Supplier' },
    { header: 'Product', key: 'Product' },
    { header: 'Product SKU', key: 'Product SKU' },
    { header: 'Quantity', key: 'Quantity' },
    { header: 'Unit Price', key: 'Unit Price' },
    { header: 'Item Total', key: 'Item Total' },
    { header: 'Purchase Total', key: 'Purchase Total' },
    { header: 'Status', key: 'Status' },
    { header: 'Payment Status', key: 'Payment Status' },
    { header: 'Purchase Date', key: 'Purchase Date' },
    { header: 'Expected Delivery', key: 'Expected Delivery' },
    { header: 'Payment Method', key: 'Payment Method' },
    { header: 'Invoice Number', key: 'Invoice Number' },
    { header: 'Receipt Number', key: 'Receipt Number' },
    { header: 'Notes', key: 'Notes' },
    { header: 'Created By', key: 'Created By' }
  ]);
  
  console.log('exportPurchases: Result from exportData:', result);
  return result;
};

// Product-specific export functions
export const exportProducts = (products, format = 'excel') => {
  const productData = products.map(product => ({
    'Product Name': product.name || 'Unknown',
    'SKU': product.sku || 'N/A',
    'Category': product.category || 'Uncategorized',
    'Unit': product.unit || 'pcs',
    'Description': product.description || 'No description',
    'Selling Price': product.sellingPrice || 0,
    'Has Variants': product.hasVariants ? 'Yes' : 'No',
    'Status': product.isActive ? 'Active' : 'Inactive',
    'Created Date': product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'
  }));
  
  return exportData(productData, format, 'products', 'Product Report', [
    { header: 'Product Name', key: 'Product Name' },
    { header: 'SKU', key: 'SKU' },
    { header: 'Category', key: 'Category' },
    { header: 'Unit', key: 'Unit' },
    { header: 'Description', key: 'Description' },
    { header: 'Selling Price', key: 'Selling Price' },
    { header: 'Has Variants', key: 'Has Variants' },
    { header: 'Status', key: 'Status' },
    { header: 'Created Date', key: 'Created Date' }
  ]);
};

// Warehouse-specific export functions
export const exportWarehouses = (warehouses, format = 'excel') => {
  const warehouseData = warehouses.map(warehouse => ({
    'Warehouse Name': warehouse.name || 'Unknown',
    'Location': warehouse.location || 'Unknown',
    'Capacity': warehouse.capacity || 0,
    'Current Stock': warehouse.currentStock || 0,
    'Available Capacity': (warehouse.capacity || 0) - (warehouse.currentStock || 0),
    'Manager': warehouse.managerName || 'No manager assigned',
    'Status': warehouse.isActive ? 'Active' : 'Inactive',
    'Created Date': warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString() : 'Unknown'
  }));
  
  return exportData(warehouseData, format, 'warehouses', 'Warehouse Report', [
    { header: 'Warehouse Name', key: 'Warehouse Name' },
    { header: 'Location', key: 'Location' },
    { header: 'Capacity', key: 'Capacity' },
    { header: 'Current Stock', key: 'Current Stock' },
    { header: 'Available Capacity', key: 'Available Capacity' },
    { header: 'Manager', key: 'Manager' },
    { header: 'Status', key: 'Status' },
    { header: 'Created Date', key: 'Created Date' }
  ]);
};

// Supplier-specific export functions
export const exportSuppliers = (suppliers, format = 'excel') => {
  const supplierData = suppliers.map(supplier => ({
    'Name': supplier.name || 'Unknown',
    'Company Name': supplier.companyName || '',
    'Email': supplier.email || 'No email',
    'Phone': supplier.phone || 'No phone',
    'Website': supplier.website || 'No website',
    'Payment Terms': supplier.paymentTerms || 'Net 30',
    'Credit Limit': supplier.creditLimit || 0,
    'Rating': supplier.rating || 0,
    'Status': supplier.status || 'Active',
    'Total Spent': supplier.totalSpent || 0,
    'Total Orders': supplier.totalPurchases || 0,
    'Last Purchase': supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : 'Never',
    'Created Date': supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : 'Unknown'
  }));
  
  return exportData(supplierData, format, 'suppliers', 'Supplier Report', [
    { header: 'Name', key: 'Name' },
    { header: 'Company Name', key: 'Company Name' },
    { header: 'Email', key: 'Email' },
    { header: 'Phone', key: 'Phone' },
    { header: 'Website', key: 'Website' },
    { header: 'Payment Terms', key: 'Payment Terms' },
    { header: 'Credit Limit', key: 'Credit Limit' },
    { header: 'Rating', key: 'Rating' },
    { header: 'Status', key: 'Status' },
    { header: 'Total Spent', key: 'Total Spent' },
    { header: 'Total Orders', key: 'Total Orders' },
    { header: 'Last Purchase', key: 'Last Purchase' },
    { header: 'Created Date', key: 'Created Date' }
  ]);
};

// Report-specific export functions
export const exportReports = (reportData, format = 'excel', reportType = 'report') => {
  return exportData(reportData, format, reportType, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`);
};
