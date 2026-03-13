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
  Legend,
} from "recharts";
import { formatDate, formatCurrency } from "../../utils/adminHelpers";
import { motion } from "framer-motion";

const RefundTrendsChart = ({ refundData, period = "month" }) => {
  const chartData = useMemo(() => {
    // Group refunds by date
    const grouped = {};
    refundData.forEach((refund) => {
      const date = new Date(refund.requestedDate).toISOString().split("T")[0];
      if (!grouped[date]) {
        grouped[date] = {
          date,
          totalAmount: 0,
          count: 0,
          completed: 0,
          pending: 0,
        };
      }
      grouped[date].totalAmount += refund.amount;
      grouped[date].count += 1;
      if (refund.status === "completed") {
        grouped[date].completed += 1;
      } else {
        grouped[date].pending += 1;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        ...item,
        dateLabel: formatDate(item.date, { month: "short", day: "numeric" }),
      }));
  }, [refundData]);

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
                  {entry.name.includes("Amount")
                    ? formatCurrency(entry.value)
                    : entry.value}
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
          Refund Trends
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          Refund patterns and processing status
        </p>
      </div>

      <div className="w-full overflow-x-auto scrollbar-admin">
        <ResponsiveContainer width="100%" height={350} minHeight={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient
                id="colorRefundAmount"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
              dataKey="totalAmount"
              stroke="#ef4444"
              strokeWidth={3}
              fill="url(#colorRefundAmount)"
              name="Refund Amount"
              dot={{ fill: "#ef4444", r: 4 }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorCompleted)"
              name="Completed"
              dot={{ fill: "#10b981", r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="pending"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#colorPending)"
              name="Pending"
              dot={{ fill: "#f59e0b", r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RefundTrendsChart;
