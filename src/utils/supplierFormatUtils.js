// Supplier Format Utilities
export const SUPPLIER_FORMAT_DEFAULTS = {
  displayFormat: {
    view: 'table',
    columns: {
      name: { visible: true, width: 'auto', order: 1 },
      companyName: { visible: true, width: 'auto', order: 2 },
      email: { visible: true, width: 'auto', order: 3 },
      phone: { visible: true, width: 'auto', order: 4 },
      totalSpent: { visible: true, width: 'auto', order: 5 },
      rating: { visible: true, width: 'auto', order: 6 },
      status: { visible: true, width: 'auto', order: 7 },
      actions: { visible: true, width: 'auto', order: 8 }
    },
    showAvatar: true,
    showQuickActions: true,
    compactMode: false
  },
  exportFormat: {
    defaultFormat: 'excel',
    includeFields: {
      basicInfo: true,
      contactInfo: true,
      addressInfo: true,
      businessInfo: true,
      financialInfo: true,
      performanceMetrics: true,
      customFields: false
    },
    dateFormat: 'MM/DD/YYYY',
    currencyFormat: 'PKR',
    numberFormat: 'en-US'
  },
  importFormat: {
    defaultFormat: 'excel',
    requiredFields: ['name', 'email'],
    optionalFields: ['companyName', 'phone', 'website'],
    validationRules: {
      emailValidation: true,
      phoneValidation: true,
      duplicateCheck: true
    },
    autoMapping: true,
    skipEmptyRows: true
  },
  dataFormatting: {
    phoneFormat: 'international',
    addressFormat: 'full',
    currencyDisplay: 'symbol',
    dateDisplay: 'short',
    numberDisplay: 'formatted'
  },
  customFields: {
    enabled: false,
    fields: []
  }
};

// Load format settings from localStorage
export const loadFormatSettings = () => {
  try {
    const saved = localStorage.getItem('supplierFormatSettings');
    if (saved) {
      return { ...SUPPLIER_FORMAT_DEFAULTS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading format settings:', error);
  }
  return SUPPLIER_FORMAT_DEFAULTS;
};

// Save format settings to localStorage
export const saveFormatSettings = (settings) => {
  try {
    localStorage.setItem('supplierFormatSettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving format settings:', error);
    return false;
  }
};

// Format phone number based on settings
export const formatPhoneNumber = (phone, format = 'international') => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  switch (format) {
    case 'international':
      if (cleaned.startsWith('92')) {
        return `+${cleaned}`;
      } else if (cleaned.startsWith('0')) {
        return `+92${cleaned.substring(1)}`;
      }
      return `+92${cleaned}`;
    case 'national':
      if (cleaned.startsWith('92')) {
        return `0${cleaned.substring(2)}`;
      }
      return cleaned.startsWith('0') ? cleaned : `0${cleaned}`;
    default:
      return phone;
  }
};

// Format address based on settings
export const formatAddress = (address, format = 'full') => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
    address.postalCode
  ].filter(Boolean);
  
  switch (format) {
    case 'full':
      return parts.join(', ');
    case 'compact':
      return [address.city, address.state, address.country].filter(Boolean).join(', ');
    default:
      return parts.join(', ');
  }
};

// Format currency based on settings
export const formatCurrency = (amount, currency = 'PKR', display = 'symbol') => {
  if (amount === null || amount === undefined) return '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'PKR' ? 'USD' : currency, // Fallback for PKR
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  let formatted = formatter.format(amount);
  
  switch (display) {
    case 'symbol':
      return formatted.replace('$', 'PKR ');
    case 'code':
      return `${amount.toLocaleString()} ${currency}`;
    case 'name':
      return `${amount.toLocaleString()} Pakistani Rupees`;
    default:
      return formatted;
  }
};

// Format date based on settings
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US');
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    default:
      return dateObj.toLocaleDateString('en-US');
  }
};

// Format number based on settings
export const formatNumber = (number, format = 'formatted') => {
  if (number === null || number === undefined) return '';
  
  switch (format) {
    case 'formatted':
      return number.toLocaleString('en-US');
    case 'raw':
      return number.toString();
    default:
      return number.toLocaleString('en-US');
  }
};

// Apply format settings to supplier data
export const applyFormatSettings = (supplier, settings) => {
  if (!supplier || !settings) return supplier;
  
  const formatted = { ...supplier };
  
  // Format phone number
  if (supplier.phone) {
    formatted.phone = formatPhoneNumber(
      supplier.phone, 
      settings.dataFormatting?.phoneFormat
    );
  }
  
  // Format address
  if (supplier.address) {
    formatted.address = {
      ...supplier.address,
      formatted: formatAddress(
        supplier.address, 
        settings.dataFormatting?.addressFormat
      )
    };
  }
  
  // Format currency values
  if (supplier.totalSpent !== undefined) {
    formatted.totalSpentFormatted = formatCurrency(
      supplier.totalSpent,
      settings.exportFormat?.currencyFormat,
      settings.dataFormatting?.currencyDisplay
    );
  }
  
  if (supplier.creditLimit !== undefined) {
    formatted.creditLimitFormatted = formatCurrency(
      supplier.creditLimit,
      settings.exportFormat?.currencyFormat,
      settings.dataFormatting?.currencyDisplay
    );
  }
  
  // Format dates
  if (supplier.createdAt) {
    formatted.createdAtFormatted = formatDate(
      supplier.createdAt,
      settings.dataFormatting?.dateDisplay
    );
  }
  
  if (supplier.lastPurchaseDate) {
    formatted.lastPurchaseDateFormatted = formatDate(
      supplier.lastPurchaseDate,
      settings.dataFormatting?.dateDisplay
    );
  }
  
  // Format numbers
  if (supplier.totalPurchases !== undefined) {
    formatted.totalPurchasesFormatted = formatNumber(
      supplier.totalPurchases,
      settings.dataFormatting?.numberDisplay
    );
  }
  
  return formatted;
};

// Get visible columns based on format settings
export const getVisibleColumns = (settings) => {
  if (!settings?.displayFormat?.columns) return [];
  
  return Object.entries(settings.displayFormat.columns)
    .filter(([_, config]) => config.visible)
    .sort(([_, a], [__, b]) => a.order - b.order)
    .map(([key, _]) => key);
};

// Filter supplier data for export based on format settings
export const filterSupplierForExport = (supplier, settings) => {
  if (!supplier || !settings?.exportFormat) return supplier;
  
  const filtered = {};
  const includeFields = settings.exportFormat.includeFields;
  
  // Basic info
  if (includeFields.basicInfo) {
    filtered.name = supplier.name;
    filtered.companyName = supplier.companyName;
    filtered.email = supplier.email;
    filtered.phone = supplier.phone;
    filtered.website = supplier.website;
  }
  
  // Contact info
  if (includeFields.contactInfo && supplier.contactPerson) {
    filtered.contactPerson = supplier.contactPerson;
  }
  
  // Address info
  if (includeFields.addressInfo && supplier.address) {
    filtered.address = supplier.address;
  }
  
  // Business info
  if (includeFields.businessInfo) {
    filtered.paymentTerms = supplier.paymentTerms;
    filtered.taxId = supplier.taxId;
    filtered.businessLicense = supplier.businessLicense;
    filtered.registrationNumber = supplier.registrationNumber;
  }
  
  // Financial info
  if (includeFields.financialInfo) {
    filtered.creditLimit = supplier.creditLimit;
    filtered.currentBalance = supplier.currentBalance;
    filtered.totalPurchases = supplier.totalPurchases;
    filtered.totalSpent = supplier.totalSpent;
    filtered.averageOrderValue = supplier.averageOrderValue;
  }
  
  // Performance metrics
  if (includeFields.performanceMetrics) {
    filtered.rating = supplier.rating;
    filtered.deliveryTime = supplier.deliveryTime;
    filtered.qualityRating = supplier.qualityRating;
    filtered.status = supplier.status;
    filtered.isPreferred = supplier.isPreferred;
  }
  
  // Custom fields
  if (includeFields.customFields && supplier.customFields) {
    filtered.customFields = supplier.customFields;
  }
  
  return filtered;
};

// Validate supplier data for import
export const validateSupplierImport = (supplier, settings) => {
  if (!supplier || !settings?.importFormat) {
    return { isValid: false, errors: ['Invalid data'] };
  }
  
  const errors = [];
  const requiredFields = settings.importFormat.requiredFields || [];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!supplier[field] || supplier[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Email validation
  if (settings.importFormat.validationRules?.emailValidation && supplier.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supplier.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Phone validation
  if (settings.importFormat.validationRules?.phoneValidation && supplier.phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(supplier.phone)) {
      errors.push('Invalid phone format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate export data based on format settings
export const generateExportData = (suppliers, settings) => {
  if (!suppliers || !settings?.exportFormat) return [];
  
  return suppliers.map(supplier => {
    const filtered = filterSupplierForExport(supplier, settings);
    return applyFormatSettings(filtered, settings);
  });
};

// Get column configuration for table display
export const getColumnConfig = (settings) => {
  if (!settings?.displayFormat?.columns) return {};
  
  const columns = {};
  Object.entries(settings.displayFormat.columns).forEach(([key, config]) => {
    if (config.visible) {
      columns[key] = {
        ...config,
        width: config.width === 'auto' ? undefined : config.width
      };
    }
  });
  
  return columns;
};

// Create export headers based on format settings
export const createExportHeaders = (settings) => {
  if (!settings?.exportFormat) return {};
  
  const headers = {};
  const includeFields = settings.exportFormat.includeFields;
  
  if (includeFields.basicInfo) {
    headers.name = 'Supplier Name';
    headers.companyName = 'Company Name';
    headers.email = 'Email';
    headers.phone = 'Phone';
    headers.website = 'Website';
  }
  
  if (includeFields.contactInfo) {
    headers.contactPerson = 'Contact Person';
  }
  
  if (includeFields.addressInfo) {
    headers.address = 'Address';
  }
  
  if (includeFields.businessInfo) {
    headers.paymentTerms = 'Payment Terms';
    headers.taxId = 'Tax ID';
    headers.businessLicense = 'Business License';
  }
  
  if (includeFields.financialInfo) {
    headers.creditLimit = 'Credit Limit';
    headers.totalSpent = 'Total Spent';
    headers.totalPurchases = 'Total Purchases';
  }
  
  if (includeFields.performanceMetrics) {
    headers.rating = 'Rating';
    headers.status = 'Status';
    headers.isPreferred = 'Preferred';
  }
  
  return headers;
};
