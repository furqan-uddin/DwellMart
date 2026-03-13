import { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { deleteCustomerAddress, getCustomerAddresses } from '../../services/adminService';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadAddresses = async () => {
        try {
          const response = await getCustomerAddresses({
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery || undefined,
          });
          const rows = (response?.data?.addresses || []).map((addr) => ({
            ...addr,
            id: addr._id || addr.id,
            customerId: addr.customerId || addr.userId,
          }));
          setAddresses(rows);
          setPagination(response?.data?.pagination || {
            total: rows.length,
            page: 1,
            limit: itemsPerPage,
            pages: 1,
          });
        } catch (error) {
          setAddresses([]);
        }
      };
      loadAddresses();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, searchQuery]);

  const handleDelete = async () => {
    const addressToDelete = addresses.find((a) => String(a.id) === String(deleteModal.id));
    if (!addressToDelete?.customerId || !addressToDelete?.id) {
      toast.error('Unable to delete address');
      setDeleteModal({ isOpen: false, id: null });
      return;
    }

    try {
      await deleteCustomerAddress(addressToDelete.customerId, addressToDelete.id);
      setAddresses((prev) =>
        prev.filter((address) => String(address.id) !== String(deleteModal.id))
      );
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, Number(prev.total || 0) - 1),
      }));
      toast.success('Address deleted');
    } catch (error) {
      // Error toast is handled by api interceptor
    } finally {
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const columns = [
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-start gap-2">
          <FiMapPin className="text-gray-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">
              {row.city}, {row.state} {row.zipCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {value || 'Home'}
        </span>
      ),
    },
    {
      key: 'isDefault',
      label: 'Default',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeleteModal({ isOpen: true, id: row.id })}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Customer Addresses</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage customer shipping addresses</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, address, or city..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <DataTable
          data={addresses}
          columns={columns}
          pagination={false}
        />
        <Pagination
          currentPage={pagination.page || currentPage}
          totalPages={pagination.pages || 0}
          totalItems={pagination.total || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Address?"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </motion.div>
  );
};

export default Addresses;

