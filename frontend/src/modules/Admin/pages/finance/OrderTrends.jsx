import { useState, useEffect, useMemo } from "react";
import { FiTrendingUp, FiCalendar } from "react-icons/fi";
import { motion } from "framer-motion";
import OrderTrendsLineChart from "../../components/Analytics/OrderTrendsLineChart";
import AnimatedSelect from "../../components/AnimatedSelect";

import { useAnalyticsStore } from "../../../../shared/store/analyticsStore";

const getRangeForPeriod = (period) => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let startDate = new Date(endDate);

  if (period === 'week') {
    startDate.setDate(endDate.getDate() - 6);
  } else if (period === 'month') {
    startDate.setDate(endDate.getDate() - 29);
  } else {
    startDate.setFullYear(endDate.getFullYear() - 1);
    startDate.setDate(endDate.getDate() + 1);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const OrderTrends = () => {
  const [period, setPeriod] = useState("month");
  const [isPageLoading, setIsPageLoading] = useState(false);
  const { revenueData, fetchRevenueData } = useAnalyticsStore();

  useEffect(() => {
    const periodMap = {
      week: 'daily',
      month: 'daily',
      year: 'monthly'
    };
    const range = getRangeForPeriod(period);
    let mounted = true;

    const run = async () => {
      setIsPageLoading(true);
      try {
        await fetchRevenueData(periodMap[period] || 'monthly', range);
      } finally {
        if (mounted) setIsPageLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [period, fetchRevenueData]);

  const orderTrends = useMemo(() => {
    if (!revenueData) return [];
    return revenueData.map((day) => ({
      date: day._id,
      orders: day.orders || 0,
    }));
  }, [revenueData]);

  const totalOrders = orderTrends.reduce((sum, day) => sum + day.orders, 0);
  const averageOrders =
    orderTrends.length > 0 ? totalOrders / orderTrends.length : 0;
  const maxOrders = Math.max(...orderTrends.map((d) => d.orders), 0);

  if (isPageLoading && orderTrends.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Order Trends
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Analyze order patterns and trends
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Orders</p>
            <FiCalendar className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Average Daily Orders</p>
            <FiTrendingUp className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {averageOrders.toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Peak Orders</p>
            <FiTrendingUp className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{maxOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            Order Trends Chart
          </h3>
          <AnimatedSelect
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: "week", label: "Last 7 Days" },
              { value: "month", label: "Last 30 Days" },
              { value: "year", label: "Last Year" },
            ]}
            className="min-w-[140px]"
          />
        </div>
        <OrderTrendsLineChart data={orderTrends} period={period} />
      </div>
    </motion.div>
  );
};

export default OrderTrends;
