import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TmlMartLogo from '../assets/logo.png';

const ReceiptGenerator = {
  generatePurchaseReceipt: (purchase, supplier) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors - Updated to match TML Mart logo (dark blue)
    const primaryColor = '#0c1c3d'; // Dark navy blue from logo (header color)
    const secondaryColor = '#1e3a8a'; // Slightly lighter blue
    const accentColor = '#3b82f6'; // Bright blue for highlights
    const textColor = '#1f2937';
    const lightGray = '#f3f4f6';
    const darkBlue = '#0f172a'; // Very dark blue
    
    // Dark Blue Header Bar (matching logo color) with white logo
    const headerBarY = 0;
    const headerHeight = 26;
    doc.setFillColor(primaryColor); // Dark blue matching logo
    doc.rect(0, headerBarY, pageWidth, headerHeight, 'F');
    
    // Add white logo on dark blue header (left side)
    const logoSize = 22;
    const logoX = 15;
    const logoY = 1.5;
    
    // Add logo image (will appear white on dark blue background)
    doc.addImage(TmlMartLogo, 'PNG', logoX, logoY, logoSize, logoSize);
    
    // Company name in white on header (right side)
    doc.setFontSize(15);
    doc.setTextColor('white');
    doc.setFont('helvetica', 'bold');
    doc.text('TML MART - The Mother Land', pageWidth - 15, headerBarY + 16, { align: 'right' });
    
    // Company Details (Top Left) - below header
    const companyY = 35;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TML MART', 15, companyY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text('The Mother Land (TML)', 15, companyY + 7);
    
    doc.setFontSize(9);
    doc.text('123 Business District', 15, companyY + 14);
    doc.text('Karachi, Pakistan', 15, companyY + 21);
    doc.text('Phone: +92 31 1234567', 15, companyY + 28);
    doc.text('Email: info@tmlmart.com', 15, companyY + 35);
    
    // Receipt Header (Center) - below header
    const headerY = 35;
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT', pageWidth / 2, headerY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text(`Receipt #: ${purchase.receiptNumber || 'N/A'}`, pageWidth - 15, headerY + 10, { align: 'right' });
    doc.text(`Receipt Date: ${new Date(purchase.purchaseDate).toLocaleDateString()}`, pageWidth - 15, headerY + 17, { align: 'right' });
    doc.text(`Purchase #: ${purchase.purchaseNumber}`, pageWidth - 15, headerY + 24, { align: 'right' });
    doc.text(`Payment Method: ${purchase.paymentMethod?.toUpperCase() || 'CASH'}`, pageWidth - 15, headerY + 31, { align: 'right' });
    
    // Supplier Information (Left side)
    const supplierY = companyY + 50;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SUPPLIER INFORMATION', 15, supplierY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text(`Name: ${supplier?.name || 'N/A'}`, 15, supplierY + 8);
    doc.text(`Code: ${supplier?.supplierCode || 'N/A'}`, 15, supplierY + 15);
    doc.text(`Phone: ${supplier?.phone || 'N/A'}`, 15, supplierY + 22);
    doc.text(`Email: ${supplier?.email || 'N/A'}`, 15, supplierY + 29);
    
    // Items Table
    const tableY = supplierY + 45;
    
    // Calculate total quantity
    const totalQuantity = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const tableData = purchase.items.map((item, index) => [
      index + 1,
      item.productId?.name || 'Unknown Product',
      item.variantName || 'N/A',
      item.quantity,
      `PKR ${item.unitPrice.toFixed(2)}`,
      `PKR ${item.totalPrice.toFixed(2)}`
    ]);
    
    // Add total quantity row
    tableData.push({
      content: [
        '',
        '',
        'TOTAL QUANTITY:',
        totalQuantity,
        'TOTAL AMOUNT:',
        `PKR ${purchase.totalAmount.toFixed(2)}`
      ],
      styles: {
        fillColor: secondaryColor,
        textColor: 'white',
        fontStyle: 'bold'
      }
    });
    
    autoTable(doc, {
      startY: tableY,
      head: [['#', 'Product', 'Variant', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 'white',
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'left' },
        1: { cellWidth: 60, halign: 'left' },
        2: { cellWidth: 35, halign: 'left' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });
    
    // Payment Summary - RIGHT ALIGNED (like sample)
    const finalTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : tableY + 100;
    const summaryY = finalTableY + 10;
    
    // Payment breakdown - Right aligned
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    
    const subtotal = purchase.totalAmount || 0;
    const tax = purchase.taxAmount || 0;
    const discount = purchase.discountAmount || 0;
    const advance = purchase.advancePayment || 0;
    const remaining = purchase.remainingPayment || 0;
    const final = subtotal + tax - discount;
    
    // Payment details right-aligned
    const rightMargin = pageWidth - 15;
    let currentY = summaryY;
    
    doc.text('Subtotal:', rightMargin - 60, currentY);
    doc.text(`PKR ${subtotal.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
    currentY += 7;
    
    if (tax > 0) {
      doc.text('Tax Amount:', rightMargin - 60, currentY);
      doc.text(`PKR ${tax.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
    }
    
    if (discount > 0) {
      doc.text('Discount:', rightMargin - 60, currentY);
      doc.text(`-PKR ${discount.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
    }
    
    // Total line with background
    currentY += 3;
    doc.setFillColor('#fbbf24');
    doc.rect(rightMargin - 60, currentY - 4, 60, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor);
    doc.text('Total:', rightMargin - 60, currentY);
    doc.text(`PKR ${final.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
    currentY += 10;
    
    // Partial Payment Details
    if (advance > 0) {
      currentY += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('PAYMENT DETAILS', rightMargin, currentY, { align: 'right' });
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      
      doc.text('Advance Payment:', rightMargin - 60, currentY);
      doc.text(`PKR ${advance.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
      
      doc.text('Remaining Payment:', rightMargin - 60, currentY);
      doc.text(`PKR ${remaining.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
      
      doc.text('Total Amount:', rightMargin - 60, currentY);
      doc.text(`PKR ${final.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 10;
      
      // Payment status
      doc.setFontSize(10);
      doc.setTextColor(advance === final ? '#10b981' : '#fbbf24');
      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${advance === final ? 'FULLY PAID ✓' : 'PARTIAL PAYMENT'}`, rightMargin, currentY, { align: 'right' });
    }
    
    // Terms and Conditions (Left side)
    const termsY = finalTableY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('TERMS AND CONDITIONS', 15, termsY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text('Payment is due within 14 days of receipt', 15, termsY + 8);
    doc.text('All checks to be made out to TML MART', 15, termsY + 15);
    doc.text('Thank you for your business!', 15, termsY + 22);
    
    // Notes (Left side)
    if (purchase.notes) {
      const notesY = termsY + 35;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('NOTES:', 15, notesY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.setFontSize(9);
      doc.text(purchase.notes, 15, notesY + 7);
    }
    
    // Footer - Left aligned
    const footerY = pageHeight - 30;
    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: +92 31 1234567', 15, footerY);
    doc.text('Email: info@tmlmart.com', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Web: www.tmlmart.com', pageWidth - 15, footerY, { align: 'right' });
    
    return doc;
  },
  
  generateInvoice: (purchase, supplier) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors - Updated to match TML Mart logo (dark blue)
    const primaryColor = '#0c1c3d'; // Dark navy blue from logo (header color)
    const secondaryColor = '#1e3a8a'; // Slightly lighter blue
    const accentColor = '#3b82f6'; // Bright blue for highlights
    const textColor = '#1f2937';
    const lightGray = '#f3f4f6';
    const darkBlue = '#0f172a'; // Very dark blue
    
    // Dark Blue Header Bar (matching logo color) with white logo
    const headerBarY = 0;
    const headerHeight = 25;
    doc.setFillColor(primaryColor); // Dark blue matching logo
    doc.rect(0, headerBarY, pageWidth, headerHeight, 'F');
    
    // Add white logo on dark blue header (left side)
    const logoSize = 22;
    const logoX = 15;
    const logoY = 1.5;
    
    // Add logo image (will appear white on dark blue background)
    doc.addImage(TmlMartLogo, 'PNG', logoX, logoY, logoSize, logoSize);
    
    // Company name in white on header (right side)
    doc.setFontSize(15);
    doc.setTextColor('white');
    doc.setFont('helvetica', 'bold');
    doc.text('TML MART - The Mother Land', pageWidth - 15, headerBarY + 16, { align: 'right' });
    
    // Company Details (Top Left) - below header
    const companyY = 35;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TML MART', 15, companyY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text('The Mother Land (TML)', 15, companyY + 7);
    
    doc.setFontSize(9);
    doc.text('123 Business District', 15, companyY + 14);
    doc.text('Karachi, Pakistan', 15, companyY + 21);
    doc.text('Phone: +92 31 1234567', 15, companyY + 28);
    doc.text('Email: info@tmlmart.com', 15, companyY + 35);
    
    // Invoice Header (Right side) - below header
    const headerY = 30;
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, headerY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text(`Invoice No: ${purchase.invoiceNumber || 'N/A'}`, pageWidth - 15, headerY + 10, { align: 'right' });
    doc.text(`Date: ${new Date(purchase.purchaseDate).toLocaleDateString()}`, pageWidth - 15, headerY + 17, { align: 'right' });
    doc.text(`Purchase #: ${purchase.purchaseNumber}`, pageWidth - 15, headerY + 24, { align: 'right' });
    doc.text(`Due Date: ${purchase.expectedDeliveryDate ? new Date(purchase.expectedDeliveryDate).toLocaleDateString() : 'N/A'}`, pageWidth - 15, headerY + 31, { align: 'right' });
    
    // Supplier Information (Left side)
    const supplierY = companyY + 50;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SUPPLIER INFORMATION', 15, supplierY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text(`Name: ${supplier?.name || 'N/A'}`, 15, supplierY + 8);
    doc.text(`Code: ${supplier?.supplierCode || 'N/A'}`, 15, supplierY + 15);
    doc.text(`Phone: ${supplier?.phone || 'N/A'}`, 15, supplierY + 22);
    doc.text(`Email: ${supplier?.email || 'N/A'}`, 15, supplierY + 29);
    
    // Items Table (same as receipt)
    const tableY = supplierY + 45;
    
    // Calculate total quantity
    const totalQuantity = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const tableData = purchase.items.map((item, index) => [
      index + 1,
      item.productId?.name || 'Unknown Product',
      item.variantName || 'N/A',
      item.quantity,
      `PKR ${item.unitPrice.toFixed(2)}`,
      `PKR ${item.totalPrice.toFixed(2)}`
    ]);
    
    // Add total quantity row
    tableData.push({
      content: [
        '',
        '',
        'TOTAL QUANTITY:',
        totalQuantity,
        'TOTAL AMOUNT:',
        `PKR ${purchase.totalAmount.toFixed(2)}`
      ],
      styles: {
        fillColor: secondaryColor,
        textColor: 'white',
        fontStyle: 'bold'
      }
    });
    
    autoTable(doc, {
      startY: tableY,
      head: [['#', 'Product', 'Variant', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 'white',
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'left' },
        1: { cellWidth: 60, halign: 'left' },
        2: { cellWidth: 35, halign: 'left' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });
    
    // Payment Summary - RIGHT ALIGNED (like receipt)
    const finalTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : tableY + 100;
    const summaryY = finalTableY + 10;
    
    // Payment breakdown - Right aligned
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    
    const subtotal = purchase.totalAmount || 0;
    const tax = purchase.taxAmount || 0;
    const discount = purchase.discountAmount || 0;
    const advance = purchase.advancePayment || 0;
    const remaining = purchase.remainingPayment || 0;
    const final = subtotal + tax - discount;
    
    // Payment details right-aligned
    const rightMargin = pageWidth - 15;
    let currentY = summaryY;
    
    doc.text('Subtotal:', rightMargin - 60, currentY);
    doc.text(`PKR ${subtotal.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
    currentY += 7;
    
    if (tax > 0) {
      doc.text('Tax Amount:', rightMargin - 60, currentY);
      doc.text(`PKR ${tax.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
    }
    
    if (discount > 0) {
      doc.text('Discount:', rightMargin - 60, currentY);
      doc.text(`-PKR ${discount.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
    }
    
    // Total line with background
    currentY += 3;
    doc.setFillColor('#fbbf24');
    doc.rect(rightMargin - 60, currentY - 4, 60, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor);
    doc.text('Total:', rightMargin - 60, currentY);
    doc.text(`PKR ${final.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
    currentY += 10;
    
    // Partial Payment Details
    if (advance > 0) {
      currentY += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('PAYMENT DETAILS', rightMargin, currentY, { align: 'right' });
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      
      doc.text('Advance Payment:', rightMargin - 60, currentY);
      doc.text(`PKR ${advance.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
      
      doc.text('Remaining Payment:', rightMargin - 60, currentY);
      doc.text(`PKR ${remaining.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 7;
      
      doc.text('Total Amount:', rightMargin - 60, currentY);
      doc.text(`PKR ${final.toFixed(2)}`, rightMargin, currentY, { align: 'right' });
      currentY += 10;
      
      // Payment status
      doc.setFontSize(10);
      doc.setTextColor(advance === final ? '#10b981' : '#fbbf24');
      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${advance === final ? 'FULLY PAID ✓' : 'PARTIAL PAYMENT'}`, rightMargin, currentY, { align: 'right' });
    }
    
    // Terms and Conditions (Left side)
    const termsY = finalTableY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('TERMS AND CONDITIONS', 15, termsY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text('Payment is due within 14 days of receipt', 15, termsY + 8);
    doc.text('All checks to be made out to TML MART', 15, termsY + 15);
    doc.text('Thank you for your business!', 15, termsY + 22);
    
    // Notes (Left side)
    if (purchase.notes) {
      const notesY = termsY + 35;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('NOTES:', 15, notesY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.setFontSize(9);
      doc.text(purchase.notes, 15, notesY + 7);
    }
    
    // Footer - Left aligned
    const footerY = pageHeight - 30;
    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: +92 31 1234567', 15, footerY);
    doc.text('Email: info@tmlmart.com', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Web: www.tmlmart.com', pageWidth - 15, footerY, { align: 'right' });
    
    return doc;
  }
};

export default ReceiptGenerator;
