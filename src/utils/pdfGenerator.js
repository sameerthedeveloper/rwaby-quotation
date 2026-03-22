import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  
  // Custom Arabic-supported font might be needed later, using standard for now.
  // Colors
  const blueColor = [0, 112, 192];
  const redColor = [255, 0, 0];
  const blackColor = [0, 0, 0];

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  
  const title = "RWABY ALWLJH ALMTHDH LIMITED PARTNERSHIP";
  // Center title
  const titleWidth = doc.getTextWidth(title);
  const startX = (doc.internal.pageSize.width - titleWidth) / 2;
  doc.text(title, startX, 20);
  
  // Underline
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.5);
  doc.line(startX, 22, startX + titleWidth, 22);

  // Company Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  
  doc.text("CR-No : 1277152", 14, 32);
  doc.text("P.O.Box : 21", 14, 38);
  doc.text("P.C.No  : 111", 14, 44);
  doc.text("Amarath, Muscat, Sultanate Of Oman", 14, 50);

  // --- Quotation Title and Date ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const quoteText = "QUOTATION";
  const quoteWidth = doc.getTextWidth(quoteText);
  doc.text(quoteText, (doc.internal.pageSize.width - quoteWidth) / 2, 65);

  const creationDate = quotation.createdAt ? (quotation.createdAt.toDate ? quotation.createdAt.toDate() : new Date(quotation.createdAt)) : new Date();
  const formattedDate = format(creationDate, 'dd/MM/yyyy');
  doc.setFontSize(11);
  doc.text(`Date : ${formattedDate}`, 160, 65);

  // --- Customer Info Table ---
  const infoTableY = 75;
  
  // Prepare Customer Display Info
  const cName = quotation.Customer?.customerName || '';
  const cPhone = quotation.Customer?.phone || '';
  const refNo = quotation.id ? quotation.id.substring(0, 8).toUpperCase() : `Q-${format(creationDate, 'yyyyMMdd')}`;

  autoTable(doc, {
    startY: infoTableY,
    theme: 'grid',
    head: [],
    body: [
      [{ content: 'Tel No', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: '79147356/95131922', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: 'Company Name', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: `; ${cName}`, styles: { fontStyle: 'bold', textColor: blueColor } }],
      [{ content: 'E-mail', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: 'rwabyfabrications@gmail.com', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: 'Mobile No', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: `; ${cPhone}`, styles: { fontStyle: 'bold', textColor: blueColor } }],
      [{ content: 'VAT-IN', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: '1100470353', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: 'VAT-IN', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: '; ', styles: { fontStyle: 'bold', textColor: blueColor } }],
      [{ content: 'Ref No -', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: refNo, styles: { fontStyle: 'bold', textColor: redColor } }, { content: 'E-MAIL', styles: { fontStyle: 'bold', textColor: blueColor } }, { content: '; ', styles: { fontStyle: 'bold', textColor: blueColor } }],
    ],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 60 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [180, 180, 180],
      lineWidth: 0.2
    },
    margin: { left: 14, right: 14 }
  });

  // --- Main Items Table ---
  // If workshop mode, we don't have detailed line items mapped out in the same way, but let's build standard rows from the form data
  
  const mType = quotation.Material?.materialType || '';
  const mThick = quotation.Material?.thickness || '';
  let productDescription = `Fabrication Work\n`;
  if (mType) productDescription += `Material: ${mType} ${mThick ? `(${mThick} thk)` : ''}\n`;
  
  const grandTotal = Number(quotation.Totals?.grandTotal) || 0;
  const tableData = [];
  let itemCounter = 1;

  if (quotation.WorkshopCost?.costBreakdown) {
    const breakdown = quotation.WorkshopCost.costBreakdown;
    
    // Add main fabrication item
    tableData.push([
      (itemCounter++).toString().padStart(2, '0'),
      productDescription,
      '1',
      (Number(quotation.WorkshopCost.workshopTotal) || 0).toFixed(3),
      (Number(quotation.WorkshopCost.workshopTotal) || 0).toFixed(3),
      'As per DWG'
    ]);

    // Add Detailed Breakdown if in workshop mode
    // Note: We only show the ones that aren't "hidden" OR we show them with ***
    const overheads = ['machine', 'rent', 'electricity'];
    
    Object.entries(breakdown).forEach(([key, val]) => {
      if (val && val.total > 0 && key !== 'operations') {
        const isHidden = overheads.includes(key);
        const label = key.toUpperCase();
        tableData.push([
          '',
          `   > ${label} ${val.hours ? `(${val.hours} hrs)` : ''}`,
          val.amount || '1',
          isHidden ? '***' : (val.total / (val.amount || 1)).toFixed(3),
          isHidden ? '***' : val.total.toFixed(3),
          ''
        ]);
      }
    });

    if (breakdown.operations) {
      Object.entries(breakdown.operations).forEach(([key, val]) => {
        if (val.total > 0) {
          tableData.push([
            '',
            `   > ${key.toUpperCase()} (${val.hours} hrs)`,
            '1',
            (val.total).toFixed(3),
            (val.total).toFixed(3),
            ''
          ]);
        }
      });
    }
  } else {
    // Manual Mode
    tableData.push([
      (itemCounter++).toString().padStart(2, '0'),
      productDescription,
      '1',
      (grandTotal - (Number(quotation.ExtraTotal) || 0)).toFixed(3),
      (grandTotal - (Number(quotation.ExtraTotal) || 0)).toFixed(3),
      'As per DWG'
    ]);

    if (quotation.Cutting?.numberOfCuts > 0) {
      tableData.push(['', `   > CUTTING (${quotation.Cutting.numberOfCuts} cuts)`, '1', (Number(quotation.Cutting.ratePerCut) || 0).toFixed(3), (Number(quotation.Cutting.totalCutting) || 0).toFixed(3), '']);
    }
    if (quotation.Bending?.numberOfBends > 0) {
      tableData.push(['', `   > BENDING (${quotation.Bending.numberOfBends} bends)`, '1', (Number(quotation.Bending.ratePerBend) || 0).toFixed(3), (Number(quotation.Bending.totalBending) || 0).toFixed(3), '']);
    }
  }
  
  // Extra Costs
  if (quotation.ExtraCosts && quotation.ExtraCosts.length > 0) {
    quotation.ExtraCosts.forEach(cost => {
      tableData.push([
        (itemCounter++).toString().padStart(2, '0'),
        cost.description || 'Other Cost',
        '1',
        (Number(cost.amount) || 0).toFixed(3),
        (Number(cost.amount) || 0).toFixed(3),
        ''
      ]);
    });
  } else if (Number(quotation.ExtraTotal) > 0) {
     // Fallback for migrated data
     tableData.push([
      (itemCounter++).toString().padStart(2, '0'),
      'Other Charges',
      '1',
      (Number(quotation.ExtraTotal)).toFixed(3),
      (Number(quotation.ExtraTotal)).toFixed(3),
      ''
    ]);
  }

  // Footer rows inside the table body using colSpan
  const paddingRow = [{ content: 'Amount in Words :', colSpan: 4, styles: { fontStyle: 'bold' } }, { content: 'Amt.', styles: { fontStyle: 'bold' } }, { content: grandTotal.toFixed(3), styles: { fontStyle: 'bold' } }, { content: '' }];
  
  // Let's assume VAT is 5% calculated on the total for display
  const calculatedVat = grandTotal * 0.05;
  const grandTotalWithVat = grandTotal + calculatedVat;

  const vatRow = [{ content: 'TBD Rial Only', colSpan: 4, rowSpan: 3, styles: { fontStyle: 'italic', halign: 'center', valign: 'middle' } }, { content: 'VAT 5%', styles: { fontStyle: 'bold' } }, { content: calculatedVat.toFixed(3), styles: { fontStyle: 'bold' } }, { content: '' }];
  const discountRow = [{ content: 'Discount', styles: { fontStyle: 'bold' } }, { content: '0.000', styles: { fontStyle: 'bold' } }, { content: '' }];
  const netAmtRow = [{ content: 'Net Amt.', styles: { fontStyle: 'bold' } }, { content: grandTotalWithVat.toFixed(3), styles: { fontStyle: 'bold' } }, { content: '' }];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    theme: 'grid',
    head: [['Nos', 'Product Description', 'Qty', 'U.Price', 'Price R.o', 'Model Of Picture']],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: blackColor,
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    body: [
      ...tableData,
      paddingRow,
      vatRow,
      discountRow,
      netAmtRow
    ],
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 10 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: blackColor
    },
    didParseCell: function(data) {
       // Customize specific footer rows borders and text align if needed
       if (data.row.index >= tableData.length && data.section === 'body') {
           if (data.column.index === 0 && data.row.index > tableData.length) {
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
           }
       }
    }
  });

  const currentY = doc.lastAutoTable.finalY + 10;

  // --- Terms and Conditions ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Terms and Conditions", 14, currentY);
  
  doc.setDrawColor(0,0,0);
  doc.setLineWidth(0.3);
  doc.line(14, currentY + 1, 52, currentY + 1);

  doc.text("PAYMENT :", 20, currentY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("70 % advance balance 30% on completion of work", 42, currentY + 8);

  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY :", 20, currentY + 14);
  doc.setFont("helvetica", "normal");
  doc.text("30 working days", 43, currentY + 14);

  doc.setFont("helvetica", "bold");
  doc.text("VALIDITY :", 20, currentY + 20);
  doc.setFont("helvetica", "normal");
  doc.text("10 days from the date of the quotation", 41, currentY + 20);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.text("TRANSPORT:", 20, currentY + 26);
  doc.text("The Prices Quoted are included Transport", 45, currentY + 26);

  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  doc.text("Warranty:", 14, currentY + 34);
  doc.setFont("helvetica", "bold");
  doc.text("1 Year against defective manufacture of parts. Guarantee covers FREE labor charges due to", 14, currentY + 41);
  doc.text("defective manufacture. Guarantee shall not apply if damages occur due to fire, misuse,", 14, currentY + 47);
  doc.text("breakage, power fluctuation or attempted repair by unauthorized personnel.", 14, currentY + 53);

  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.text("*Notices: Prices are subject to change without prior notice.", 14, currentY + 61);

  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  doc.setFontSize(9);
  doc.text("Please don't hesitate to call us for further information. We will be glad to assist you.", 14, currentY + 73);
  doc.text("We look forward to have a successful business venture with you in the coming days.", 14, currentY + 79);

  doc.setFontSize(10);
  doc.text("Best Regards", 16, currentY + 95);
  doc.text("RWABY ALWLJH ALMTHDH LIMITED PARTNERSHIP", 14, currentY + 115);

  const cleanName = (quotation.Customer?.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Quotation_${cleanName}.pdf`);
};
