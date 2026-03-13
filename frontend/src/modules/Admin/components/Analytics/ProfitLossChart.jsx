import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { formatDate, formatCurrency } from "../../utils/adminHelpers";
import { motion } from "framer-motion";

const ProfitLossChart = ({ data, period = "month" }) => {
  const chartData = useMemo(() => {
    return data.map((item) => {
      const revenue = item.revenue || 0;
      const discount = item.discount || 0;
      const tax = item.tax || 0;
      const shipping = item.delivery || 0;
      const grossProfit = revenue - discount;
      const netProfit = revenue - (discount + tax + shipping);

      return {
        date: item.date,
        dateLabel: formatDate(item.date, { month: "short", day: "numeric" }),
        revenue,
        discount,
        tax,
        shipping,
        grossProfit,
        netProfit,
        totalExpenses: discount + tax + shipping,
      };
    });
  }, [data]);

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
                  {formatCurrency(entry.value)}
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
          Profit & Loss Trends
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          Financial performance over time
        </p>
      </div>

      <div className="w-full overflow-x-auto scrollbar-admin">
        <ResponsiveContainer width="100%" height={350} minHeight={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#colorRevenue)"
              name="Revenue"
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="totalExpenses"
              stroke="#ef4444"
              strokeWidth={3}
              fill="url(#colorExpenses)"
              name="Total Expenses"
              dot={{ fill: "#ef4444", r: 4 }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="netProfit"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorProfit)"
              name="Net Profit"
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ProfitLossChart;
