import { useMemo } from 'react';
import { formatDate, filterByDateRange, getDateRange } from '../../utils/adminHelpers';

const SalesChart = ({ data, period = 'month' }) => {
  const filteredData = useMemo(() => {
    const range = getDateRange(period);
    return filterByDateRange(data, range.start, range.end);
  }, [data, period]);

  const maxOrders = Math.max(...filteredData.map((d) => d.orders), 1);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Sales Volume</h3>
      <div className="grid grid-cols-7 gap-2">
        {filteredData.slice(-7).map((item, index) => {
          const percentage = (item.orders / maxOrders) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg transition-all duration-500"
                  style={{ height: `${percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 text-center">
                {formatDate(item.date, { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs font-semibold text-gray-800">{item.orders}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesChart;

