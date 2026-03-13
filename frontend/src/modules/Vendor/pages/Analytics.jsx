import { useState, useMemo, useEffect } from "react";
import {
  FiBarChart2,
  FiTrendingUp,
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
} from "react-icons/fi";
import { motion } from "framer-motion";
import RevenueLineChart from "../../Admin/components/Analytics/RevenueLineChart";
import SalesBarChart from "../../Admin/components/Analytics/SalesBarChart";
import OrderStatusPieChart from "../../Admin/components/Analytics/OrderStatusPieChart";
import RevenueVsOrdersChart from "../../Admin/components/Analytics/RevenueVsOrdersChart";
import TimePeriodFilter from "../../Admin/components/Analytics/TimePeriodFilter";
import ExportButton from "../../Admin/components/ExportButton";
import { formatPrice } from "../../../shared/utils/helpers";
import { filterByDateRange, getDateRange } from "../../Admin/utils/adminHelpers";
import { useVendorAuthStore } from "../store/vendorAuthStore";
import { getVendorAnalyticsOverview } from "../services/vendorService";

const Analytics = () => {
  const { vendor } = useVendorAuthStore();
  const [period, setPeriod] = useState("month");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingEarnings: 0,
    totalOrders: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const vendorId = vendor?.id || vendor?._id;

  useEffect(() => {
    if (!vendorId) {
      setAnalyticsData([]);
      setStatusData([]);
      setSummary({
        totalRevenue: 0,
        pendingEarnings: 0,
        totalOrders: 0,
        totalProducts: 0,
      });
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getVendorAnalyticsOverview({ period });
        const data = res?.data ?? res;

        const timeseries = Array.isArray(data?.timeseries) ? data.timeseries : [];
        setAnalyticsData(timeseries);
        setStatusData(Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []);
        setSummary({
          totalRevenue: data?.summary?.totalRevenue ?? 0,
          pendingEarnings: data?.summary?.pendingEarnings ?? 0,
          totalOrders: data?.summary?.totalOrders ?? 0,
          totalProducts: data?.summary?.totalProducts ?? 0,
        });
      } catch {
        setAnalyticsData([]);
        setStatusData([]);
        setSummary({
          totalRevenue: 0,
          pendingEarnings: 0,
          totalOrders: 0,
          totalProducts: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vendorId, period]);

  const exportData = useMemo(() => {
    const range = getDateRange(period);
    return filterByDateRange(analyticsData, range.start, range.end);
  }, [analyticsData, period]);

  const analyticsSummary = useMemo(() => {
    const recentRevenue = analyticsData.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
    const previousRevenue = analyticsData
      .slice(-14, -7)
      .reduce((sum, d) => sum + d.revenue, 0);

    const revenueChange =
      previousRevenue > 0
        ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
        : recentRevenue > 0
          ? 100
          : 0;

    const recentOrders = analyticsData.slice(-7).reduce((sum, d) => sum + d.orders, 0);
    const previousOrders = analyticsData
      .slice(-14, -7)
      .reduce((sum, d) => sum + d.orders, 0);

    const ordersChange =
      previousOrders > 0
        ? (((recentOrders - previousOrders) / previousOrders) * 100).toFixed(1)
        : recentOrders > 0
          ? 100
          : 0;

    return {
      ...summary,
      revenueChange: parseFloat(revenueChange),
      ordersChange: parseFloat(ordersChange),
    };
  }, [analyticsData, summary]);

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view analytics</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <p className="text-gray-500 text-center">Loading analytics...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Analytics & Reports
          </h1>
          <p className="text-gray-600">Your store performance and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <TimePeriodFilter selectedPeriod={period} onPeriodChange={setPeriod} />
          <ExportButton
            data={exportData}
            headers={[
              { label: "Date", accessor: (row) => row.date },
              { label: "Revenue", accessor: (row) => formatPrice(row.revenue) },
              { label: "Orders", accessor: (row) => row.orders },
            ]}
            filename="vendor-analytics-report"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <FiDollarSign className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatPrice(analyticsSummary.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <FiTrendingUp className="text-green-600" />
            <span className="text-sm text-green-600">
              {analyticsSummary.revenueChange}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Orders</p>
            <FiShoppingBag className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {analyticsSummary.totalOrders}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <FiTrendingUp className="text-green-600" />
            <span className="text-sm text-green-600">
              {analyticsSummary.ordersChange}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Products</p>
            <FiPackage className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {analyticsSummary.totalProducts}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Earnings</p>
            <FiBarChart2 className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatPrice(analyticsSummary.pendingEarnings)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Awaiting settlement</p>
        </div>
      </div>

      {analyticsData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueLineChart data={analyticsData} period={period} />
            <SalesBarChart data={analyticsData} period={period} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueVsOrdersChart data={analyticsData} period={period} />
            <OrderStatusPieChart data={statusData} />
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <FiBarChart2 className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No analytics data available</p>
          <p className="text-sm text-gray-400">
            Analytics will appear here once you start receiving orders
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Analytics;
