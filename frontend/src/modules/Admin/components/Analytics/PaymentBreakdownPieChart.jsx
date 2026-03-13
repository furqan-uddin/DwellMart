import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "../../utils/adminHelpers";
import { motion } from "framer-motion";

const PaymentBreakdownPieChart = ({ paymentData }) => {
  const chartData = useMemo(() => {
    const colors = [
      { fill: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" }, // Blue
      { fill: "#10b981", glow: "rgba(16, 185, 129, 0.3)" }, // Green
      { fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)" }, // Orange
      { fill: "#8b5cf6", glow: "rgba(139, 92, 246, 0.3)" }, // Purple
      { fill: "#ec4899", glow: "rgba(236, 72, 153, 0.3)" }, // Pink
    ];

    return Object.entries(paymentData).map(([method, data], index) => ({
      name:
        method.charAt(0).toUpperCase() +
        method.slice(1).replace(/([A-Z])/g, " $1"),
      value: data.total,
      count: data.count,
      color: colors[index % colors.length].fill,
      glow: colors[index % colors.length].glow,
    }));
  }, [paymentData]);

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalAmount) * 100).toFixed(1);
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-200/50">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {data.name}
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: data.payload.color }}>
            {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {percentage}% • {data.payload.count} transactions
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-bold drop-shadow-lg">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          Payment Method Distribution
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          Breakdown by payment type
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350} minHeight={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  filter: `drop-shadow(0 0 8px ${entry.glow})`,
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={50}
            iconType="circle"
            formatter={(value, entry) => (
              <span
                style={{
                  color: entry.color,
                  fontSize: "12px",
                  fontWeight: 500,
                }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {chartData.map((item, index) => {
          const percentage = ((item.value / totalAmount) * 100).toFixed(1);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {item.name}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-gray-500">{percentage}%</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PaymentBreakdownPieChart;
