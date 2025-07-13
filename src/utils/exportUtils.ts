import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SKU, Category, Supplier } from '../types';
import { mockSKUs, mockCategories, mockSuppliers } from '../data/mockData';

export const exportHighRiskSKUsToCSV = () => {
  const highRiskSKUs = mockSKUs.filter(sku => sku.totalRisk >= 80);
  
  const headers = [
    'SKU ID',
    'Product Name',
    'Category',
    'Origin Country',
    'Annual Spend ($M)',
    'Current Margin (%)',
    'Tariff Impact (%)',
    'Geo Risk Score',
    'Total Risk Score',
    'Recommended Action',
    'Current Supplier',
    'HS Code',
    'Domestic Available',
    'Potential Annual Loss ($M)'
  ];

  const csvData = highRiskSKUs.map(sku => [
    sku.id,
    `"${sku.name}"`,
    sku.category,
    sku.origin,
    (sku.spend / 1000000).toFixed(2),
    sku.currentMargin.toFixed(1),
    sku.tariffImpact.toFixed(1),
    sku.geoRisk,
    sku.totalRisk,
    sku.action,
    `"${sku.currentSupplier}"`,
    sku.hsCode,
    sku.domesticAvailable ? 'Yes' : 'No',
    ((sku.spend * sku.tariffImpact) / 100 / 1000000).toFixed(2)
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, 'walmart-high-risk-skus.csv');
};

export const exportCategoryAnalysisToCSV = () => {
  const headers = [
    'Category',
    'Risk Score',
    'Amount at Risk ($M)',
    'High Risk Countries',
    'Low Risk Countries',
    'Recommended Action',
    'SKU Count',
    'Avg Margin (%)',
    'Total Annual Spend ($M)'
  ];

  const csvData = mockCategories.map(category => {
    const categorySKUs = mockSKUs.filter(sku => sku.category === category.name);
    const totalSpend = categorySKUs.reduce((sum, sku) => sum + sku.spend, 0);
    const avgMargin = categorySKUs.reduce((sum, sku) => sum + sku.currentMargin, 0) / categorySKUs.length;

    return [
      category.name,
      category.riskScore,
      (category.amountAtRisk / 1000000).toFixed(2),
      `"${category.highRiskCountries.join(', ')}"`,
      `"${category.lowRiskCountries.join(', ')}"`,
      category.action,
      categorySKUs.length,
      avgMargin.toFixed(1),
      (totalSpend / 1000000).toFixed(2)
    ];
  });

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, 'walmart-category-analysis.csv');
};

export const exportSupplierAlternativesToCSV = () => {
  const headers = [
    'Supplier Name',
    'Country/Location',
    'Supplier Type',
    'Margin Change (%)',
    'Annual Savings ($M)',
    'Tariff Rate (%)',
    'Transit Days',
    'Quality Score',
    'Sustainability Score',
    'Logistics Score',
    'Cost Per Unit ($)',
    'Capacity',
    'Recommended'
  ];

  const csvData = mockSuppliers.map(supplier => [
    `"${supplier.supplierName}"`,
    `"${supplier.country}"`,
    supplier.supplierType,
    supplier.marginChange.toFixed(1),
    supplier.annualSavings ? (supplier.annualSavings / 1000000).toFixed(2) : '0',
    supplier.tariffRate.toFixed(1),
    supplier.transitDays,
    supplier.qualityScore,
    supplier.sustainabilityScore || 85,
    supplier.logisticsScore,
    supplier.costPerUnit.toFixed(2),
    supplier.capacity,
    supplier.isRecommended ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, 'walmart-supplier-alternatives.csv');
};

export const generateSourcingReportPDF = async (sku: SKU) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(0, 113, 206); // Walmart blue
  pdf.text('Walmart Sourcing Intelligence Report', 20, 25);
  
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`SKU Analysis: ${sku.name}`, 20, 40);
  
  // SKU Details
  pdf.setFontSize(12);
  pdf.text(`SKU ID: ${sku.id}`, 20, 55);
  pdf.text(`Category: ${sku.category}`, 20, 65);
  pdf.text(`Current Origin: ${sku.origin}`, 20, 75);
  pdf.text(`Annual Spend: $${(sku.spend / 1000000).toFixed(1)}M`, 20, 85);
  pdf.text(`Current Margin: ${sku.currentMargin.toFixed(1)}%`, 120, 55);
  pdf.text(`Risk Score: ${sku.totalRisk}`, 120, 65);
  pdf.text(`Tariff Impact: ${sku.tariffImpact}%`, 120, 75);
  pdf.text(`Recommended Action: ${sku.action.toUpperCase()}`, 120, 85);

  // Risk Assessment
  pdf.setFontSize(14);
  pdf.setTextColor(0, 113, 206);
  pdf.text('Risk Assessment', 20, 105);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  const riskText = `This SKU has a total risk score of ${sku.totalRisk}, which is considered ${
    sku.totalRisk >= 80 ? 'HIGH RISK' : sku.totalRisk >= 60 ? 'MEDIUM RISK' : 'LOW RISK'
  }. The primary risk factors include tariff exposure of ${sku.tariffImpact}% and geopolitical risk score of ${sku.geoRisk}.`;
  
  const splitRiskText = pdf.splitTextToSize(riskText, pageWidth - 40);
  pdf.text(splitRiskText, 20, 115);

  // Supplier Alternatives
  if (sku.totalRisk >= 60) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 113, 206);
    pdf.text('Recommended Supplier Alternatives', 20, 140);
    
    const alternatives = mockSuppliers
      .filter(s => s.isRecommended)
      .slice(0, 3)
      .sort((a, b) => b.marginChange - a.marginChange);

    let yPos = 150;
    alternatives.forEach((supplier, index) => {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${index + 1}. ${supplier.supplierName} (${supplier.country})`, 25, yPos);
      
      pdf.setFontSize(10);
      pdf.text(`• Margin Impact: ${supplier.marginChange > 0 ? '+' : ''}${supplier.marginChange.toFixed(1)}%`, 30, yPos + 8);
      pdf.text(`• Transit Time: ${supplier.transitDays} days`, 30, yPos + 16);
      pdf.text(`• Quality Score: ${supplier.qualityScore}`, 30, yPos + 24);
      pdf.text(`• Sustainability Score: ${supplier.sustainabilityScore || 85}`, 30, yPos + 32);
      
      yPos += 45;
    });
  }

  // Financial Impact
  pdf.setFontSize(14);
  pdf.setTextColor(0, 113, 206);
  pdf.text('Financial Impact Analysis', 20, yPos + 10);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  const potentialLoss = (sku.spend * sku.tariffImpact) / 100;
  pdf.text(`Current Annual Exposure: $${(potentialLoss / 1000000).toFixed(1)}M`, 25, yPos + 25);
  
  if (sku.totalRisk >= 60) {
    const bestAlternative = mockSuppliers.find(s => s.isRecommended);
    if (bestAlternative) {
      const savings = bestAlternative.annualSavings || 0;
      pdf.text(`Potential Annual Savings: $${(savings / 1000000).toFixed(1)}M`, 25, yPos + 35);
      pdf.text(`ROI Timeline: 6-12 months`, 25, yPos + 45);
    }
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Generated on ${new Date().toLocaleDateString()} | Walmart Sourcing Intelligence`, 20, pageHeight - 10);

  pdf.save(`walmart-sourcing-report-${sku.id}.pdf`);
};

export const generateExecutiveSummaryPDF = async () => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(0, 113, 206);
  pdf.text('Executive Summary', 20, 25);
  pdf.text('Sourcing Risk Assessment', 20, 35);
  
  // Key Metrics
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Key Performance Indicators', 20, 55);
  
  const highRiskSKUs = mockSKUs.filter(sku => sku.totalRisk >= 80);
  const totalAtRisk = mockCategories.reduce((sum, cat) => sum + cat.amountAtRisk, 0);
  
  pdf.setFontSize(12);
  pdf.text(`• Total SKUs Monitored: ${mockSKUs.length}`, 25, 70);
  pdf.text(`• High-Risk SKUs: ${highRiskSKUs.length} (${Math.round((highRiskSKUs.length / mockSKUs.length) * 100)}%)`, 25, 80);
  pdf.text(`• Total Exposure: $${(totalAtRisk / 1000000).toFixed(1)}M`, 25, 90);
  pdf.text(`• Categories Requiring Action: ${mockCategories.filter(c => c.action === 'shift').length}`, 25, 100);

  // Recommendations
  pdf.setFontSize(16);
  pdf.setTextColor(0, 113, 206);
  pdf.text('Strategic Recommendations', 20, 120);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const recommendations = [
    '1. Prioritize shifting high-risk Electronics and Apparel sourcing to domestic suppliers',
    '2. Implement quarterly risk assessment reviews for all international suppliers',
    '3. Develop strategic partnerships with NAFTA suppliers as intermediate risk option',
    '4. Invest in supply chain diversification to reduce single-country dependencies',
    '5. Focus on sustainability metrics to align with corporate environmental goals'
  ];
  
  let yPos = 135;
  recommendations.forEach(rec => {
    const splitText = pdf.splitTextToSize(rec, pageWidth - 40);
    pdf.text(splitText, 25, yPos);
    yPos += splitText.length * 7 + 5;
  });

  pdf.save('walmart-executive-summary.pdf');
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};