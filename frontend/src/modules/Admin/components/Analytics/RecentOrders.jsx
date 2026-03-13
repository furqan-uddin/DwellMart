import { useState, useMemo } from 'react';
import { formatCurrency, formatDateTime, getStatusColor } from '../../utils/adminHelpers';
import Badge from '../../../../shared/components/Badge';
import { FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Pagination from '../Pagination';

const RecentOrders = ({ orders, onViewOrder }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Orders</h3>
      <div className="space-y-4">
        {paginatedOrders.map((order, index) => {
          // Support both real API shape and mock data shape
          const orderId = order.orderId || order.id || order._id;
          const customerName = order.userId?.name || order.customer?.name || 'Unknown';
          const orderDate = order.createdAt || order.date;
          const itemCount = Array.isArray(order.items) ? order.items.length : (typeof order.items === 'number' ? order.items : 0);
          return (
            <motion.div
              key={order._id || order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-800 truncate">{orderId}</h4>
                  <Badge variant={order.status}>{order.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{customerName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(orderDate)} • {itemCount} items
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <div className="text-right">
                  <p className="font-bold text-gray-800">{formatCurrency(order.total)}</p>
                </div>
                {onViewOrder && (
                  <button
                    onClick={() => onViewOrder(order)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiEye className="text-gray-600" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={orders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default RecentOrders;

