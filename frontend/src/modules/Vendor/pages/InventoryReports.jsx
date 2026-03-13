import { useEffect, useMemo, useState } from "react";
import { FiBarChart, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import DataTable from "../../Admin/components/DataTable";
import ExportButton from "../../Admin/components/ExportButton";
import { formatPrice } from "../../../shared/utils/helpers";
import { useVendorAuthStore } from "../store/vendorAuthStore";
import { getVendorInventoryReport } from "../services/vendorService";

const InventoryReports = () => {
  const { vendor } = useVendorAuthStore();
  const [inventoryData, setInventoryData] = useState([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    totalUnitsSold: 0,
    lowStockItems: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const vendorId = vendor?.id || vendor?._id;

  useEffect(() => {
    if (!vendorId) {
      setInventoryData([]);
      setSummary({
        totalProducts: 0,
        totalStockValue: 0,
        totalUnitsSold: 0,
        lowStockItems: 0,
      });
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getVendorInventoryReport({ lowStockOnly });
        const data = res?.data ?? res;
        setInventoryData(Array.isArray(data?.rows) ? data.rows : []);
        setSummary({
          totalProducts: data?.summary?.totalProducts ?? 0,
          totalStockValue: data?.summary?.totalStockValue ?? 0,
          totalUnitsSold: data?.summary?.totalUnitsSold ?? 0,
          lowStockItems: data?.summary?.lowStockItems ?? 0,
        });
      } catch {
        setInventoryData([]);
        setSummary({
          totalProducts: 0,
          totalStockValue: 0,
          totalUnitsSold: 0,
          lowStockItems: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vendorId, lowStockOnly]);

  const totalProducts = useMemo(
    () => summary.totalProducts || inventoryData.length,
    [summary.totalProducts, inventoryData.length]
  );
  const totalStockValue = summary.totalStockValue || 0;
  const totalSold = summary.totalUnitsSold || 0;
  const lowStockCount = summary.lowStockItems || 0;

  const columns = [
    { key: "name", label: "Product", sortable: true },
    {
      key: "currentStock",
      label: "Current Stock",
      sortable: true,
      render: (value) => (
        <span className={value < 10 ? "text-red-600 font-semibold" : "text-gray-800"}>
          {value}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (value) => formatPrice(value),
    },
    {
      key: "stockValue",
      label: "Stock Value",
      sortable: true,
      render: (value) => formatPrice(value),
    },
    { key: "sold", label: "Units Sold", sortable: true },
  ];

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view reports</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FiBarChart className="text-primary-600" />
          Inventory Reports
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          View inventory analysis and stock reports
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total Products</p>
          <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total Stock Value</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatPrice(totalStockValue)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Units Sold</p>
          <p className="text-2xl font-bold text-gray-800">{totalSold}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <FiAlertCircle className="text-red-600" />
            Low Stock Items
          </p>
          <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setLowStockOnly((prev) => !prev)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto ${
              lowStockOnly
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            {lowStockOnly ? "Showing Low Stock Only" : "Show Low Stock Only"}
          </button>
          <ExportButton
            data={inventoryData}
            headers={[
              { label: "Product", accessor: (row) => row.name },
              { label: "Current Stock", accessor: (row) => row.currentStock },
              { label: "Price", accessor: (row) => formatPrice(row.price) },
              { label: "Stock Value", accessor: (row) => formatPrice(row.stockValue) },
              { label: "Units Sold", accessor: (row) => row.sold },
            ]}
            filename="vendor-inventory-report"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-center">Loading inventory report...</p>
        </div>
      ) : (
        <DataTable data={inventoryData} columns={columns} pagination={true} itemsPerPage={10} />
      )}
    </motion.div>
  );
};

export default InventoryReports;
