import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiDollarSign,
  FiClock,
  FiPackage,
} from "react-icons/fi";
import { motion } from "framer-motion";
import Badge from "../../../shared/components/Badge";
import DataTable from "../../Admin/components/DataTable";
import { formatPrice } from "../../../shared/utils/helpers";
import { useVendorAuthStore } from "../store/vendorAuthStore";
import { getVendorCustomerById } from "../services/vendorService";
import toast from "react-hot-toast";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendor } = useVendorAuthStore();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  const vendorId = vendor?.id || vendor?._id;

  useEffect(() => {
    if (!vendorId) return;

    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        const res = await getVendorCustomerById(id, { page, limit: 10 });
        const data = res?.data ?? res;
        if (!data?.id) {
          toast.error("Customer not found");
          navigate("/vendor/customers");
          return;
        }

        setCustomer({
          id: data.id,
          name: data.name || "Guest Customer",
          email: data.email || "",
          phone: data.phone || "",
          orders: data.orders || 0,
          totalSpent: data.totalSpent || 0,
          lastOrderDate: data.lastOrderDate || null,
        });
        setOrders(Array.isArray(data.orderHistory) ? data.orderHistory : []);
        setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      } catch {
        toast.error("Failed to load customer details");
        navigate("/vendor/customers");
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [id, vendorId, navigate, page]);

  const getStatusBadge = (status) => {
    const normalized = (status || "").toLowerCase();
    const statusConfig = {
      delivered: { variant: "delivered", label: "Delivered" },
      shipped: { variant: "shipped", label: "Shipped" },
      processing: { variant: "pending", label: "Processing" },
      pending: { variant: "pending", label: "Pending" },
      cancelled: { variant: "cancelled", label: "Cancelled" },
      canceled: { variant: "cancelled", label: "Cancelled" },
    };
    const config = statusConfig[normalized] || {
      variant: "pending",
      label: status || "Pending",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const orderColumns = [
    {
      key: "orderId",
      label: "Order ID",
      sortable: true,
      render: (_, row) => (
        <span className="font-semibold text-gray-800">
          {row.orderId ?? row._id}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.createdAt ?? row.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (_, row) => {
        const vendorItem = row.vendorItems?.find(
          (vi) => vi.vendorId?.toString() === vendorId?.toString()
        );
        return (
          <span className="text-sm text-gray-600">
            {vendorItem?.items?.length || 0} item(s)
          </span>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (_, row) => {
        const vendorItem = row.vendorItems?.find(
          (vi) => vi.vendorId?.toString() === vendorId?.toString()
        );
        return (
          <span className="font-semibold text-gray-800">
            {formatPrice(vendorItem?.subtotal || vendorItem?.vendorEarnings || 0)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const vendorStatus = row.vendorItems?.find(
          (vi) => vi.vendorId?.toString() === vendorId?.toString()
        )?.status;
        return getStatusBadge(vendorStatus || row.status);
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/vendor/orders/${row.orderId ?? row._id}`)}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          View Details
        </button>
      ),
    },
  ];

  if (isLoading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: FiShoppingBag,
      label: "Total Orders",
      value: customer.orders,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      icon: FiDollarSign,
      label: "Total Spent",
      value: formatPrice(customer.totalSpent),
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      icon: FiClock,
      label: "Last Order",
      value: customer.lastOrderDate
        ? new Date(customer.lastOrderDate).toLocaleDateString()
        : "N/A",
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {customer.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Customer Details</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
            <FiPackage className="text-primary-600 text-2xl" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {customer.name}
            </h2>
            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiMail className="text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiPhone className="text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white text-xl" />
              </div>
            </div>
            <h3 className={`${stat.textColor} text-sm font-medium mb-1`}>
              {stat.label}
            </h3>
            <p className={`${stat.textColor} text-2xl font-bold`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Order History</h2>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-4">
            <DataTable
              data={orders}
              columns={orderColumns}
              pagination={false}
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
              <p>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} / {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerDetail;
