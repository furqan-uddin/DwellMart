import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiMapPin,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiX,
} from "react-icons/fi";
import { motion } from "framer-motion";
import Badge from "../../../../shared/components/Badge";
import { formatPrice } from "../../../../shared/utils/helpers";
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import { getAllVendorOrders } from "../../services/vendorService";

const OrderTracking = () => {
  const navigate = useNavigate();
  const { vendor } = useVendorAuthStore();
  const [vendorOrders, setVendorOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const vendorId = vendor?.id;

  useEffect(() => {
    if (!vendorId) {
      setVendorOrders([]);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getAllVendorOrders({ limit: 100 });
        setVendorOrders(data?.orders ?? []);
      } catch {
        setVendorOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [vendorId]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return vendorOrders;
    const q = searchQuery.toLowerCase();
    return vendorOrders.filter((order) =>
      String(order.orderId ?? order._id ?? "")
        .toLowerCase()
        .includes(q) ||
      String(order.trackingNumber ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [vendorOrders, searchQuery]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <FiClock className="text-yellow-600" />;
      case "processing":
        return <FiPackage className="text-indigo-600" />;
      case "shipped":
        return <FiTruck className="text-cyan-600" />;
      case "delivered":
        return <FiCheckCircle className="text-green-600" />;
      case "cancelled":
      case "canceled":
        return <FiX className="text-red-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-indigo-100 text-indigo-800";
      case "shipped":
        return "bg-cyan-100 text-cyan-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVendorOrderData = (order) => {
    const vendorItem = order.vendorItems?.find(
      (vi) => vi.vendorId?.toString() === vendorId?.toString()
    );
    if (vendorItem) {
      return {
        itemCount: vendorItem.items?.length || 0,
        subtotal: vendorItem.subtotal || 0,
      };
    }

    const vendorItems =
      order.items?.filter(
        (item) => item.vendorId?.toString() === vendorId?.toString()
      ) || [];
    return {
      itemCount: vendorItems.length,
      subtotal: vendorItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      ),
    };
  };

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to track orders</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Order Tracking
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track the status of your orders
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Tracking Number..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const vendorData = getVendorOrderData(order);
            const orderId = order.orderId ?? order._id;
            const orderStatus =
              order.vendorItems?.find(
                (vi) => vi.vendorId?.toString() === vendorId?.toString()
              )?.status ?? order.status;

            return (
              <motion.div
                key={orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/vendor/orders/${orderId}`)}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(
                          orderStatus
                        )}`}
                      >
                        {getStatusIcon(orderStatus)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{orderId}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            order.createdAt ?? order.date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Items: </span>
                        <span className="font-semibold text-gray-800">
                          {vendorData.itemCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount: </span>
                        <span className="font-semibold text-gray-800">
                          {formatPrice(vendorData.subtotal)}
                        </span>
                      </div>
                      {order.trackingNumber && (
                        <div>
                          <span className="text-gray-600">Tracking: </span>
                          <span className="font-semibold text-gray-800">
                            {order.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        orderStatus === "delivered"
                          ? "success"
                          : orderStatus === "pending"
                          ? "warning"
                          : orderStatus === "cancelled" ||
                            orderStatus === "canceled"
                          ? "error"
                          : "info"
                      }
                    >
                      {orderStatus?.toUpperCase() || "N/A"}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vendor/orders/${orderId}`);
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <FiMapPin className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No orders found</p>
            <p className="text-sm text-gray-400">
              {searchQuery
                ? "Try a different search term"
                : "Orders containing your products will appear here"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderTracking;
