import { useMemo } from 'react';
import { formatCurrency, formatDate, filterByDateRange, getDateRange } from '../../utils/adminHelpers';

const RevenueChart = ({ data, period = 'month' }) => {
  const filteredData = useMemo(() => {
    const range = getDateRange(period);
    return filterByDateRange(data, range.start, range.end);
  }, [data, period]);

  const maxRevenue = Math.max(...filteredData.map((d) => d.revenue), 1);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">Revenue Trend</h3>
      <div className="max-h-96 overflow-y-auto scrollbar-admin md:pr-2">
        <div className="space-y-3 sm:space-y-4">
          {filteredData.map((item, index) => {
            const percentage = (item.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="flex items-center gap-2 sm:gap-4">
                <div className="w-16 sm:w-20 text-xs text-gray-600 text-right flex-shrink-0">
                  {formatDate(item.date, { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-lg transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-3 text-xs font-semibold text-gray-700">
                      <span className="truncate">{formatCurrency(item.revenue)}</span>
                      <span className="ml-2 whitespace-nowrap">{item.orders} orders</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;

