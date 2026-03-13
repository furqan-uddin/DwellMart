import { useState, useEffect } from "react";
import {
  FiSearch,
  FiDollarSign,
  FiCheckCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import Badge from "../../../../shared/components/Badge";
import AnimatedSelect from "../../components/AnimatedSelect";
import { formatCurrency } from "../../utils/adminHelpers";
import { settleCash as settleCashApi, getAllDeliveryBoys } from "../../services/adminService";

const CashCollection = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending collection
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [isSettlingId, setIsSettlingId] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchPage = async () => {
        try {
          const response = await getAllDeliveryBoys({
            search: searchQuery || undefined,
            page: currentPage,
            limit: itemsPerPage,
          });
          const rows = (response?.data?.deliveryBoys || []).map((boy) => ({
            ...boy,
            id: boy.id || boy._id,
            cashInHand: Number(boy.cashInHand ?? boy.stats?.cashInHand ?? 0),
            totalDeliveries: Number(boy.totalDeliveries ?? boy.stats?.totalDeliveries ?? 0),
            cashCollected: Number(boy.cashCollected || 0),
          }));
          setDeliveryBoys(rows);
          setPagination(response?.data?.pagination || {
            total: rows.length,
            page: 1,
            limit: itemsPerPage,
            pages: 1,
          });
        } catch {
          setDeliveryBoys([]);
        }
      };
      fetchPage();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const boysWithCash = deliveryBoys.filter(boy => {
    const hasCash = (boy.cashInHand || 0) > 0;
    if (statusFilter === 'pending') return hasCash;
    if (statusFilter === 'settled') return !hasCash;
    return true;
  });

  const totalCollected = boysWithCash.reduce((sum, boy) => sum + Number(boy.cashCollected || 0), 0);
  const totalPending = boysWithCash.reduce((sum, boy) => sum + Number(boy.cashInHand || 0), 0);

  const handleSettleCash = async (row) => {
    if (!row?.id || Number(row.cashInHand || 0) <= 0) return;
    setIsSettlingId(row.id);
    try {
      await settleCashApi(row.id);
      const response = await getAllDeliveryBoys({
        search: searchQuery || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      const rows = (response?.data?.deliveryBoys || []).map((boy) => ({
        ...boy,
        id: boy.id || boy._id,
        cashInHand: Number(boy.cashInHand ?? boy.stats?.cashInHand ?? 0),
        totalDeliveries: Number(boy.totalDeliveries ?? boy.stats?.totalDeliveries ?? 0),
        cashCollected: Number(boy.cashCollected || 0),
      }));
      setDeliveryBoys(rows);
      setPagination(response?.data?.pagination || pagination);
    } finally {
      setIsSettlingId(null);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Delivery Boy",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
            {value.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{row.phone}</p>
          </div>
        </div>
      )
    },
    {
      key: "cashInHand",
      label: "Cash In Hand",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <FiDollarSign className="text-green-600" />
          <span className="font-bold text-gray-800">{formatCurrency(value || 0)}</span>
        </div>
      ),
    },
    {
      key: "totalDeliveries",
      label: "Deliveries",
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) =>
        row.cashInHand > 0 ? (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
            disabled={isSettlingId === row.id}
            onClick={() => handleSettleCash(row)}>
            <FiCheckCircle />
            {isSettlingId === row.id ? 'Settling...' : 'Settle Cash'}
          </button>
        ) : (
          <Badge variant="success">Settled</Badge>
        ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Cash Collection
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track cash on delivery collections
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Collected (Lifetime)</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCollected)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Pending Collection</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalPending)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <AnimatedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All Delivery Boys" },
              { value: "pending", label: "Pending Collection" },
              { value: "settled", label: "Settled" },
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <DataTable
          data={boysWithCash}
          columns={columns}
          pagination={false}
        />
        <Pagination
          currentPage={pagination.page || currentPage}
          totalPages={pagination.pages || 1}
          totalItems={pagination.total || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </div>
    </motion.div>
  );
};

export default CashCollection;
