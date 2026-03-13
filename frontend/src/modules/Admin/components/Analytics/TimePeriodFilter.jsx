import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';

const TimePeriodFilter = ({ onPeriodChange, selectedPeriod = 'month' }) => {
  const periods = [
    { value: 'today', label: 'Today', shortLabel: 'Today' },
    { value: 'week', label: 'This Week', shortLabel: 'Week' },
    { value: 'month', label: 'This Month', shortLabel: 'Month' },
    { value: 'year', label: 'This Year', shortLabel: 'Year' },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
      <FiCalendar className="text-gray-500 text-base sm:text-lg flex-shrink-0" />
      <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 rounded-lg p-0.5 sm:p-1 flex-1 sm:flex-initial overflow-x-auto scrollbar-hide">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedPeriod === period.value
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="sm:hidden">{period.shortLabel}</span>
            <span className="hidden sm:inline">{period.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimePeriodFilter;

