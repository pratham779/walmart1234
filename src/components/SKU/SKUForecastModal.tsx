import React, { useState } from 'react';
import { X, TrendingUp, Globe, DollarSign, Package, Clock, Truck, AlertTriangle, CheckCircle, Leaf } from 'lucide-react';
import { SKU, Supplier } from '../../types';
import { mockTariffData, mockSuppliers, mockMarginData, mockLogisticsData, mockQualityData, mockCapacityData } from '../../data/mockData';
import TariffChart from '../Charts/TariffChart';
import ActionPill from '../Common/ActionPill';
import LoadingShimmer from '../Common/LoadingShimmer';
import { generateSourcingReportPDF } from '../../utils/exportUtils';

interface SKUForecastModalProps {
  sku: SKU;
  isOpen: boolean;
  onClose: () => void;
}

const SKUForecastModal: React.FC<SKUForecastModalProps> = ({ sku, isOpen, onClose }) => {
  const [tariffIncrease, setTariffIncrease] = useState(5);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alternatives'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const projectedLoss = (sku.spend * (tariffIncrease / 100)).toFixed(0);
  
  // Get relevant suppliers based on SKU type and filter for high-risk SKUs
  const relevantSuppliers = mockSuppliers.filter(supplier => {
    // Only show alternatives for high-risk SKUs (risk score >= 70)
    if (sku.totalRisk < 70) return false;
    
    if (sku.isDomestic) {
      return supplier.isDomestic || supplier.supplierType === 'nafta';
    }
    return true;
  }).sort((a, b) => {
    // Prioritize domestic, then NAFTA, then international
    if (a.isDomestic && !b.isDomestic) return -1;
    if (!a.isDomestic && b.isDomestic) return 1;
    if (a.supplierType === 'nafta' && b.supplierType === 'international') return -1;
    if (a.supplierType === 'international' && b.supplierType === 'nafta') return 1;
    return b.marginChange - a.marginChange; // Sort by highest margin improvement
  });

  // Get appropriate chart data based on origin
  const getChartData = () => {
    const origin = sku.origin.toLowerCase();
    if (origin.includes('china')) return mockTariffData.china || mockTariffData.china;
    if (origin.includes('vietnam')) return mockTariffData.vietnam || mockTariffData.china;
    if (origin.includes('bangladesh')) return mockTariffData.bangladesh || mockTariffData.china;
    if (origin.includes('south korea')) return mockTariffData.southkorea || mockTariffData.china;
    return mockTariffData.china; // Default
  };

  const getMarginColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSupplierTypeLabel = (type: string) => {
    switch (type) {
      case 'domestic': return 'Domestic';
      case 'nafta': return 'NAFTA/USMCA';
      case 'international': return 'International';
      default: return 'Other';
    }
  };

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case 'domestic': return 'bg-green-100 text-green-800';
      case 'nafta': return 'bg-blue-100 text-blue-800';
      case 'international': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const calculateAnnualSavings = (supplier: Supplier) => {
    const marginImprovement = supplier.marginChange / 100;
    return sku.spend * marginImprovement;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{sku.name}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
              <p className="text-sm text-gray-600">{sku.id} • {sku.origin}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                sku.isDomestic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {sku.isDomestic ? 'Domestic Sourcing' : 'International Sourcing'}
              </span>
              <span className="text-sm text-gray-600">
                Current Margin: <span className="font-medium text-green-600">{sku.currentMargin.toFixed(1)}%</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="self-end sm:self-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Current Analysis
            </button>
            <button
              onClick={() => setSelectedTab('alternatives')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'alternatives'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {sku.totalRisk >= 60 ? `Sourcing Alternatives (${relevantSuppliers.length})` : 'Sourcing Analysis'}
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-[500px]">
          {isLoading ? (
            <LoadingShimmer type="modal" />
          ) : (
          {selectedTab === 'overview' && (
            <>
              {/* Current Risk Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Annual Spend</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                    ${(sku.spend / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Total Risk Score</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{sku.totalRisk}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Current Action</span>
                  </div>
                  <div className="mt-2">
                    <ActionPill action={sku.action} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Current Margin</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{sku.currentMargin.toFixed(1)}%</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Primary Chart - Tariff/Margin History */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    {sku.isDomestic ? 'Margin History' : 'Tariff Rate History'}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <TariffChart 
                      data={sku.isDomestic ? mockMarginData.domestic : getChartData()} 
                      height={200}
                      title={sku.isDomestic ? 'Margin %' : 'Tariff Rate %'}
                      color={sku.isDomestic ? '#10b981' : '#0071ce'}
                    />
                  </div>
                </div>

                {/* Secondary Chart - Quality Score */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quality Score Trends</h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <TariffChart 
                      data={sku.isDomestic ? mockQualityData.domestic : mockQualityData.international} 
                      height={200}
                      title="Quality Score"
                      color="#8b5cf6"
                    />
                  </div>
                </div>

                {/* Third Chart - Logistics Cost */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Logistics Cost Trends</h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <TariffChart 
                      data={sku.isDomestic ? mockLogisticsData.domestic : mockLogisticsData.international} 
                      height={200}
                      title="Logistics Cost %"
                      color="#f59e0b"
                    />
                  </div>
                </div>

                {/* Fourth Chart - Supplier Capacity */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Supplier Capacity Utilization</h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <TariffChart 
                      data={sku.isDomestic ? mockCapacityData.domestic : mockCapacityData.international} 
                      height={200}
                      title="Capacity %"
                      color="#06b6d4"
                    />
                  </div>
                </div>
              </div>

              {/* Scenario Planning */}
              {!sku.isDomestic && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Scenario Planning</h3>
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                      <label className="text-sm font-medium text-gray-700">
                        Simulate Tariff Increase:
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={tariffIncrease}
                        onChange={(e) => setTariffIncrease(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold text-blue-700 w-12">
                        +{tariffIncrease}%
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">Projected Annual Loss</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                          ${(parseInt(projectedLoss) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">Margin Impact</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                          -{tariffIncrease.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedTab === 'alternatives' && (
            <div>
              {relevantSuppliers.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Alternative Sourcing Options</h3>
                    <span className="text-sm text-gray-600">
                      {relevantSuppliers.length} alternatives available
                    </span>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supplier Location
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Margin Impact
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Annual Savings
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tariff Rate
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transit Time
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quality Score
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sustainability
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {relevantSuppliers.map((supplier) => {
                            const annualSavings = calculateAnnualSavings(supplier);
                            return (
                              <tr
                                key={supplier.id}
                                className={supplier.isRecommended ? 'bg-green-50' : ''}
                              >
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {supplier.isRecommended && (
                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    )}
                                    <div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {supplier.country}
                                      </span>
                                      <p className="text-xs text-gray-500">{supplier.supplierName}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSupplierTypeColor(supplier.supplierType)}`}>
                                    {getSupplierTypeLabel(supplier.supplierType)}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${getMarginColor(supplier.marginChange)}`}>
                                    {supplier.marginChange > 0 ? '+' : ''}{supplier.marginChange.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${getMarginColor(annualSavings)}`}>
                                    {formatCurrency(annualSavings)}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {supplier.tariffRate.toFixed(1)}%
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">{supplier.transitDays} days</span>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${supplier.qualityScore}%` }}
                                      ></div>
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600">
                                      {supplier.qualityScore}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <Leaf className={`h-4 w-4 ${
                                      (supplier.sustainabilityScore || 75) >= 85 ? 'text-green-500' : 
                                      (supplier.sustainabilityScore || 75) >= 70 ? 'text-yellow-500' : 'text-red-500'
                                    }`} />
                                    <span className="text-sm text-gray-900">
                                      {supplier.sustainabilityScore || 75}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({supplier.carbonFootprint || '5.2'}t CO₂)
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-blue-900 mb-2">Sourcing Recommendations</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      {sku.isDomestic ? (
                        <p>• Current domestic sourcing is optimal with no tariff exposure and good margins</p>
                      ) : (
                        <>
                          <p>• Consider shifting to domestic suppliers to eliminate tariff risk and improve margins</p>
                          <p>• NAFTA suppliers offer a good balance of cost and reduced tariff exposure</p>
                          <p>• Monitor current international suppliers for further tariff increases</p>
                          <p>• Prioritize suppliers with high sustainability scores to meet environmental goals</p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-600 mb-2">Current Sourcing is Optimal</h3>
                  <p className="text-gray-600 mb-4">
                    This SKU has a low risk score ({sku.totalRisk}) and doesn't require alternative sourcing at this time.
                  </p>
                  <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-green-800">
                      <strong>Current Status:</strong> {sku.isDomestic ? 'Domestic sourcing' : 'Low-risk international sourcing'} 
                      with {sku.currentMargin.toFixed(1)}% margin and minimal supply chain risk.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={() => generateSourcingReportPDF(sku)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            Generate Sourcing Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SKUForecastModal;