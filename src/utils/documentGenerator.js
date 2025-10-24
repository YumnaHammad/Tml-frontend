import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Generate PDF Invoice/Receipt
export const generateDocumentPDF = (documentData, type = 'invoice') => {
  try {
    const doc = new jsPDF();
    const { purchase, documentNumber, generatedDate } = documentData;
    
    console.log('Generating PDF for:', type, documentNumber);
    
    // Document title
    const title = type === 'invoice' ? 'PURCHASE INVOICE' : 'PAYMENT RECEIPT';
    
    // ============================================
    // MODERN GRADIENT HEADER WITH SYSTEM LOGO
    // ============================================
    
    // Gradient background (dark blue to light blue)
    doc.setFillColor(30, 64, 175); // Dark blue
    doc.rect(0, 0, 210, 45, 'F');
    
    // System Icon/Logo - Modern square with inventory icon
    doc.setFillColor(255, 255, 255); // White background for icon
    doc.roundedRect(15, 10, 25, 25, 3, 3, 'F');
    
    // Draw inventory icon (boxes symbol)
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(2);
    // Box 1
    doc.rect(19, 14, 7, 7, 'S');
    // Box 2
    doc.rect(29, 14, 7, 7, 'S');
    // Box 3
    doc.rect(19, 24, 7, 7, 'S');
    // Box 4
    doc.rect(29, 24, 7, 7, 'S');
    
    // Company Name - Modern Typography
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('INVENTORY MANAGEMENT SYSTEM', 45, 22);
    
    // Tagline
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Professional Inventory Solutions', 45, 29);
    
    // Document Type Badge - Right side
    doc.setFillColor(16, 185, 129); // Green
    doc.roundedRect(155, 12, 40, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const titleText = type === 'invoice' ? 'INVOICE' : 'RECEIPT';
    doc.text(titleText, 175 - (doc.getTextWidth(titleText) / 2), 20);
    
    // Contact Info - Bottom of header
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('📍 123 Business Street, City, State 12345', 15, 39);
    doc.text('📞 +1 (555) 123-4567', 105, 39);
    doc.text('✉ info@company.com', 155, 39);
    
    // ============================================
    // DOCUMENT INFORMATION SECTION
    // ============================================
    
    doc.setTextColor(0, 0, 0);
    
    // Left Column - Invoice Details in a Box
    doc.setFillColor(241, 245, 249); // Light gray background
    doc.roundedRect(14, 52, 90, 26, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 65, 85); // Dark gray
    doc.text('PURCHASE', 18, 58);
    doc.setFontSize(16);
    doc.text('INVOICE', 18, 65);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Invoice #: ${String(documentNumber || 'N/A')}`, 18, 72);
    doc.text(`Invoice date: ${new Date(generatedDate).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })}`, 18, 76);
    
    // Right Column - Order Details in a Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(108, 52, 88, 26, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Order Details', 112, 58);
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Order #: ${String(purchase.purchaseNumber || 'N/A')}`, 112, 64);
    doc.text(`Order date: ${new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })}`, 112, 70);
    doc.text(`Payment: ${purchase.paymentMethod ? String(purchase.paymentMethod).replace('_', ' ').toUpperCase() : 'Cash'}`, 112, 76);
    
    // ============================================
    // BILLING INFORMATION
    // ============================================
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 64, 175); // Blue
    doc.text('Bill To:', 14, 90);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(String(purchase.supplierId?.name || 'Unknown Supplier'), 14, 97);
    
    // Handle address properly
    let addressText = 'No Address';
    if (purchase.supplierId?.address) {
      if (typeof purchase.supplierId.address === 'object') {
        addressText = Object.values(purchase.supplierId.address).filter(v => v).join(', ');
      } else {
        addressText = String(purchase.supplierId.address);
      }
    }
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`No: ${purchase.supplierId?.supplierCode || 'N/A'}`, 14, 103);
    doc.text(`📍 ${addressText}`, 14, 109);
    doc.text(`📞 ${String(purchase.supplierId?.phone || 'N/A')}`, 14, 115);
    doc.text(`✉ ${String(purchase.supplierId?.email || 'N/A')}`, 14, 121);
    
    // ============================================
    // ITEMS TABLE - MODERN STYLING
    // ============================================
    
    const tableData = purchase.items.map((item, index) => {
      const productName = String(item.productId?.name || 'Unknown Product');
      const variantName = item.variantName ? ` - ${item.variantName}` : '';
      const fullProductName = `${productName}${variantName}`;
      
      return [
        index + 1,
        fullProductName,
        String(item.productId?.sku || 'N/A'),
        item.quantity,
        `PKR ${parseFloat(item.unitPrice || 0).toFixed(2)}`,
        `PKR ${parseFloat(item.totalPrice || 0).toFixed(2)}`
      ];
    });
    
    try {
      autoTable(doc, {
        head: [['QTY', 'Description', 'Unit Price', 'Amount']],
        body: tableData.map(row => [row[3], row[1], row[4], row[5]]), // Reorder columns
        startY: 130,
        styles: {
          fontSize: 10,
          cellPadding: 8,
          lineColor: [226, 232, 240], // Light gray lines
          lineWidth: 0.5,
          textColor: [51, 65, 85],
          halign: 'left',
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [30, 64, 175], // Modern blue header
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'center',
          cellPadding: 10
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Light gray for alternate rows
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, // QTY
          1: { cellWidth: 85, halign: 'left' },   // Description
          2: { cellWidth: 35, halign: 'right' },  // Unit Price
          3: { cellWidth: 37, halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] }   // Amount
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        didDrawPage: function (data) {
          // Optional: Add page numbers if needed
        }
      });
    } catch (tableError) {
      console.warn('AutoTable failed, using fallback method:', tableError);
      // Fallback: Simple text-based table
      let yPos = 130;
      doc.setFontSize(10);
      doc.text('#', 14, yPos);
      doc.text('Product Name', 30, yPos);
      doc.text('SKU', 100, yPos);
      doc.text('Qty', 130, yPos);
      doc.text('Unit Price', 150, yPos);
      doc.text('Total', 180, yPos);
      
      yPos += 10;
      tableData.forEach((row, index) => {
        doc.text(String(index + 1), 14, yPos);
        doc.text(String(row[1]), 30, yPos);
        doc.text(String(row[2]), 100, yPos);
        doc.text(String(row[3]), 130, yPos);
        doc.text(String(row[4]), 150, yPos);
        doc.text(String(row[5]), 180, yPos);
        yPos += 8;
      });
    }
    
    // ============================================
    // SUMMARY SECTION - MODERN CARD DESIGN
    // ============================================
    
    const tableHeight = doc.lastAutoTable ? doc.lastAutoTable.finalY : 160;
    const summaryY = tableHeight + 15;
    
    // Summary Box with gradient
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.roundedRect(120, summaryY - 5, 76, 50, 3, 3, 'F');
    
    // Add subtle border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(120, summaryY - 5, 76, 50, 3, 3, 'S');
    
    doc.setTextColor(71, 85, 105); // Gray
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    let currentY = summaryY + 2;
    
    // Subtotal
    doc.text('Subtotal', 124, currentY);
    doc.text(`PKR ${parseFloat(purchase.totalAmount || 0).toFixed(2)}`, 192, currentY, { align: 'right' });
    
    // Tax (if applicable)
    if (parseFloat(purchase.taxAmount || 0) > 0) {
      currentY += 7;
      doc.text('Sales Tax', 124, currentY);
      doc.text(`PKR ${parseFloat(purchase.taxAmount || 0).toFixed(2)}`, 192, currentY, { align: 'right' });
    }
    
    // Discount (if applicable)
    if (parseFloat(purchase.discountAmount || 0) > 0) {
      currentY += 7;
      doc.text('Discount', 124, currentY);
      doc.setTextColor(220, 38, 38); // Red for discount
      doc.text(`-PKR ${parseFloat(purchase.discountAmount || 0).toFixed(2)}`, 192, currentY, { align: 'right' });
      doc.setTextColor(71, 85, 105); // Reset color
    }
    
    // Separator line with gradient effect
    currentY += 9;
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(1.5);
    doc.line(124, currentY, 192, currentY);
    
    // Total - Bold and prominent with colored background
    currentY += 8;
    doc.setFillColor(30, 64, 175); // Blue background
    doc.roundedRect(124, currentY - 5, 68, 10, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total (PKR)', 128, currentY + 2);
    doc.setFontSize(13);
    doc.text(`PKR ${parseFloat(purchase.finalAmount || purchase.totalAmount || 0).toFixed(2)}`, 188, currentY + 2, { align: 'right' });
    
    doc.setTextColor(0, 0, 0); // Reset text color
    
    // ============================================
    // NOTES & PAYMENT STATUS
    // ============================================
    
    if (purchase.notes) {
      const notesY = summaryY + 55;
      
      // Notes box
      doc.setFillColor(254, 249, 195); // Light yellow
      doc.roundedRect(14, notesY - 5, 100, 20, 2, 2, 'F');
      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, notesY - 5, 100, 20, 2, 2, 'S');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(146, 64, 14); // Brown
      doc.text('📝 Notes:', 18, notesY + 1);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(120, 53, 15);
      doc.setFontSize(8);
      
      const notesText = String(purchase.notes);
      const splitNotes = doc.splitTextToSize(notesText, 92);
      doc.text(splitNotes, 18, notesY + 7);
    }
    
    // Payment Status Badge for receipts
    if (type === 'receipt') {
      const paymentY = summaryY + 55;
      
      // Paid badge
      doc.setFillColor(220, 252, 231); // Light green
      doc.roundedRect(118, paymentY - 5, 78, 14, 2, 2, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.roundedRect(118, paymentY - 5, 78, 14, 2, 2, 'S');
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(22, 101, 52); // Dark green
      doc.text('✓ PAYMENT CONFIRMED', 122, paymentY + 2);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Paid on: ${new Date(purchase.paymentDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}`, 122, paymentY + 7);
    }
    
    // ============================================
    // PROFESSIONAL FOOTER
    // ============================================
    
    const footerY = doc.internal.pageSize.height - 35;
    
    // Footer background
    doc.setFillColor(241, 245, 249);
    doc.rect(0, footerY - 8, 210, 50, 'F');
    
    // Top border line
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(1.5);
    doc.line(0, footerY - 8, 210, footerY - 8);
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    // Thank you message - centered
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    const thankYouText = 'Thank you for your purchase! We value your business.';
    const thankYouWidth = doc.getTextWidth(thankYouText);
    doc.text(thankYouText, (210 - thankYouWidth) / 2, footerY);
    
    // Terms and conditions
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('Please retain this invoice for your records. All sales are final after 30 days.', 14, footerY + 6);
    doc.text('For questions or support, contact us at info@company.com or +1 (555) 123-4567', 14, footerY + 11);
    
    // Generation timestamp - right aligned
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    const genText = `Generated on: ${new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
    const genWidth = doc.getTextWidth(genText);
    doc.text(genText, 196 - genWidth, footerY + 16);
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${type}_${purchase.purchaseNumber}_${timestamp}.pdf`;
    
    // Save the file
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

// Generate Excel Invoice/Receipt
export const generateDocumentExcel = (documentData, type = 'invoice') => {
  try {
    // Import XLSX dynamically
    import('xlsx').then(XLSX => {
      const { purchase, documentNumber, generatedDate } = documentData;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Document info sheet
      const infoData = [
        ['Document Type', type === 'invoice' ? 'PURCHASE INVOICE' : 'PAYMENT RECEIPT'],
        ['Document Number', documentNumber],
        ['Generated Date', new Date(generatedDate).toLocaleDateString()],
        ['Purchase Number', purchase.purchaseNumber],
        ['Purchase Date', new Date(purchase.purchaseDate).toLocaleDateString()],
        ['Supplier', purchase.supplierId?.name || 'Unknown'],
        ['Payment Method', purchase.paymentMethod ? purchase.paymentMethod.replace('_', ' ').toUpperCase() : 'Not Specified'],
        ['Payment Status', purchase.paymentStatus?.toUpperCase() || 'PENDING'],
        ['Total Amount', `PKR ${(purchase.finalAmount || purchase.totalAmount).toFixed(2)}`],
        ['', ''],
        ['Items:', ''],
      ];
      
      const infoWs = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, infoWs, 'Document Info');
      
      // Items sheet
      const itemsData = [
        ['#', 'Product Name', 'SKU', 'Quantity', 'Unit Price', 'Total Price']
      ];
      
      purchase.items.forEach((item, index) => {
        itemsData.push([
          index + 1,
          item.productId?.name || 'Unknown Product',
          item.productId?.sku || 'N/A',
          item.quantity,
          item.unitPrice,
          item.totalPrice
        ]);
      });
      
      const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, itemsWs, 'Items');
      
      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${type}_${purchase.purchaseNumber}_${timestamp}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      return { success: true, filename };
    });
    
    return { success: true, filename: 'Generating...' };
  } catch (error) {
    console.error('Excel generation error:', error);
    return { success: false, error: error.message };
  }
};

// Simple PDF generator without autoTable (fallback)
export const generateSimplePDF = (documentData, type = 'invoice') => {
  try {
    const doc = new jsPDF();
    const { purchase, documentNumber, generatedDate } = documentData;
    
    console.log('Generating simple PDF for:', type, documentNumber);
    
    // Document title
    const title = type === 'invoice' ? 'PURCHASE INVOICE' : 'PAYMENT RECEIPT';
    
    // Professional Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('INVENTORY MANAGEMENT SYSTEM', 14, 18);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(title, 14, 28);
    
    doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Document No: ${String(documentNumber || 'N/A')}`, 14, 40);
    doc.text(`Date: ${new Date(generatedDate).toLocaleDateString()}`, 14, 46);
    
    // Purchase Details
    doc.setFont(undefined, 'bold');
    doc.text('Purchase Details:', 14, 60);
    doc.setFont(undefined, 'normal');
    doc.text(`Purchase Number: ${String(purchase.purchaseNumber || 'N/A')}`, 14, 70);
    doc.text(`Purchase Date: ${new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString()}`, 14, 76);
    doc.text(`Supplier: ${String(purchase.supplierId?.name || 'Unknown')}`, 14, 82);
    doc.text(`Payment Method: ${purchase.paymentMethod ? String(purchase.paymentMethod).replace('_', ' ').toUpperCase() : 'Not Specified'}`, 14, 88);
    
    // Items List
    doc.setFont(undefined, 'bold');
    doc.text('Items:', 14, 104);
    doc.setFont(undefined, 'normal');
    
    let yPos = 114;
    purchase.items.forEach((item, index) => {
      const itemText = `${index + 1}. ${String(item.productId?.name || 'Unknown Product')} (${String(item.productId?.sku || 'N/A')}) - Qty: ${item.quantity} - PKR ${parseFloat(item.totalPrice || 0).toFixed(2)}`;
      doc.text(itemText, 14, yPos);
      yPos += 8;
    });
    
    // Summary
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Summary:', 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 10;
    doc.text(`Subtotal: PKR ${parseFloat(purchase.totalAmount || 0).toFixed(2)}`, 14, yPos);
    
    if (parseFloat(purchase.taxAmount || 0) > 0) {
      yPos += 8;
      doc.text(`Tax: PKR ${parseFloat(purchase.taxAmount || 0).toFixed(2)}`, 14, yPos);
    }
    
    if (parseFloat(purchase.discountAmount || 0) > 0) {
      yPos += 8;
      doc.text(`Discount: -PKR ${parseFloat(purchase.discountAmount || 0).toFixed(2)}`, 14, yPos);
    }
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: PKR ${parseFloat(purchase.finalAmount || purchase.totalAmount || 0).toFixed(2)}`, 14, yPos);
    
    // Payment Status
    if (type === 'receipt') {
      yPos += 15;
      doc.setFont(undefined, 'bold');
      doc.text('Payment Status: PAID', 14, yPos);
      doc.text(`Payment Date: ${new Date(purchase.paymentDate).toLocaleDateString()}`, 14, yPos + 8);
    }
    
    // Notes
    if (purchase.notes) {
      yPos += 20;
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', 14, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(String(purchase.notes), 14, yPos + 8);
    }
    
    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 14, footerY);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 120, footerY);
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${type}_${purchase.purchaseNumber}_${timestamp}.pdf`;
    
    // Save the file
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Simple PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

// Main document generator
export const generateDocument = async (documentData, format = 'pdf', type = 'invoice') => {
  console.log('Generating document:', { type, format, documentData });
  
  switch (format.toLowerCase()) {
    case 'pdf':
      // Try the advanced PDF first, fallback to simple if it fails
      try {
        return generateDocumentPDF(documentData, type);
      } catch (error) {
        console.warn('Advanced PDF failed, using simple PDF:', error);
        return generateSimplePDF(documentData, type);
      }
    case 'excel':
    case 'xlsx':
      return generateDocumentExcel(documentData, type);
    default:
      return { success: false, error: 'Unsupported format' };
  }
};
