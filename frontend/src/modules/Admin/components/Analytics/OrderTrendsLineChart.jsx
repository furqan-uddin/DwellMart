import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import {
  formatDate,
  filterByDateRange,
  getDateRange,
} from "../../utils/adminHelpers";
import { motion } from "framer-motion";

const OrderTrendsLineChart = ({ data, period = "month" }) => {
  const filteredData = useMemo(() => {
    const range = getDateRange(period);
    const filtered = filterByDateRange(data, range.start, range.end);
    return filtered.map((item) => ({
      ...item,
      dateLabel: formatDate(item.date, { month: "short", day: "numeric" }),
    }));
  }, [data, period]);

  const averageOrders = useMemo(() => {
    const total = filteredData.reduce((sum, item) => sum + item.orders, 0);
    return total / filteredData.length || 0;
  }, [filteredData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-200/50">
          <p className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium text-gray-600">
                    {entry.name}:
                  </span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: entry.color }}>
                  {entry.value} orders
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          Order Volume Trends
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          Daily order patterns and average baseline
        </p>
      </div>

      <div className="w-full overflow-x-auto scrollbar-admin">
        <ResponsiveContainer width="100%" height={350} minHeight={300}>
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={averageOrders}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Average",
                position: "right",
                fill: "#94a3b8",
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorOrders)"
              name="Orders"
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{
                r: 7,
                stroke: "#3b82f6",
                strokeWidth: 2,
                fill: "#fff",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default OrderTrendsLineChart;
