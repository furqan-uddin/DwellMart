import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiCreditCard,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
  FiRefreshCw,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import Badge from '../../../../shared/components/Badge';
import DataTable from '../../components/DataTable';
import AnimatedSelect from '../../components/AnimatedSelect';
import ExportButton from '../../components/ExportButton';
import api from '../../../../shared/utils/api';

const VendorSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 15 });
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      const res = await api.get(`/admin/vendor-subscriptions?${params.toString()}`);
      const data = res.data?.data || res.data;
      setSubscriptions(data?.subscriptions || []);
      setPagination(data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Client-side search on the current page
  const filtered = subscriptions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const vendorName = (sub.vendorId?.storeName || sub.vendorId?.name || '').toLowerCase();
    const vendorEmail = (sub.vendorId?.email || '').toLowerCase();
    const planName = (sub.planId?.name || '').toLowerCase();
    return vendorName.includes(q) || vendorEmail.includes(q) || planName.includes(q);
  });

  // Summary stats from full page data
  const stats = {
    total: pagination.total,
    active: subscriptions.filter((s) => s.status === 'active' && new Date(s.endDate) > new Date()).length,
    expired: subscriptions.filter((s) => s.status === 'expired' || new Date(s.endDate) <= new Date()).length,
    pending: subscriptions.filter((s) => s.paymentStatus === 'pending').length,
  };

  const getDaysRemaining = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isSubActive = (sub) =>
    sub.status === 'active' &&
    sub.paymentStatus === 'completed' &&
    new Date(sub.endDate) > new Date();

  const statusBadge = (sub) => {
    if (isSubActive(sub)) return <Badge variant="success">Active</Badge>;
    if (sub.paymentStatus === 'pending') return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="error">Expired</Badge>;
  };

  const columns = [
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">
            {row.vendorId?.storeName || row.vendorId?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500">{row.vendorId?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{row.planId?.name || 'Unknown Plan'}</p>
          <p className="text-xs text-gray-500">
            {row.planId?.price != null ? `${row.planId.price} AED` : '—'} /{' '}
            {row.planId?.durationDays ? `${row.planId.durationDays} days` : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (_, row) =>
        row.startDate
          ? new Date(row.startDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '—',
    },
    {
      key: 'endDate',
      label: 'Expiry Date',
      sortable: true,
      render: (_, row) => {
        if (!row.endDate) return '—';
        const isExpired = new Date(row.endDate) <= new Date();
        return (
          <div>
            <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
              {new Date(row.endDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            {!isExpired && (
              <p className="text-xs text-green-600">{getDaysRemaining(row.endDate)} days left</p>
            )}
            {isExpired && <p className="text-xs text-red-500">Expired</p>}
          </div>
        );
      },
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      sortable: false,
      render: (_, row) => (
        <Badge
          variant={
            row.paymentStatus === 'completed'
              ? 'success'
              : row.paymentStatus === 'pending'
              ? 'warning'
              : 'error'
          }
        >
          {(row.paymentStatus || 'unknown').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (_, row) => statusBadge(row),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const vendorId =
          typeof row.vendorId === 'object' ? row.vendorId?._id : row.vendorId;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (vendorId) navigate(`/admin/vendors/${vendorId}`);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Vendor"
          >
            <FiEye />
          </button>
        );
      },
    },
  ];

  const statCards = [
    {
      label: 'Total Subscriptions',
      value: pagination.total,
      icon: FiCreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Now',
      value: stats.active,
      icon: FiCheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: FiXCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Pending Payment',
      value: stats.pending,
      icon: FiClock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Page header (mobile only — desktop header is in sidebar layout) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Vendor Subscriptions
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and track all vendor subscription plans
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors ml-auto"
        >
          <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`${card.color} text-lg`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading ? '—' : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full sm:min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vendor or plan..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <AnimatedSelect
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              className="w-full sm:w-auto min-w-[140px]"
            />

            <div className="w-full sm:w-auto">
              <ExportButton
                data={filtered}
                headers={[
                  { label: 'Vendor', accessor: (r) => r.vendorId?.storeName || r.vendorId?.name || '' },
                  { label: 'Email', accessor: (r) => r.vendorId?.email || '' },
                  { label: 'Plan', accessor: (r) => r.planId?.name || '' },
                  { label: 'Price (AED)', accessor: (r) => r.planId?.price ?? '' },
                  { label: 'Start Date', accessor: (r) => r.startDate ? new Date(r.startDate).toLocaleDateString() : '' },
                  { label: 'End Date', accessor: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString() : '' },
                  { label: 'Payment Status', accessor: (r) => r.paymentStatus || '' },
                  { label: 'Status', accessor: (r) => r.status || '' },
                ]}
                filename="vendor-subscriptions"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <DataTable
              data={filtered}
              columns={columns}
              pagination={false}
            />

            {/* Server-side pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={currentPage === pagination.pages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <FiUsers className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No subscriptions found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchQuery ? 'Try a different search term.' : 'Subscriptions will appear here once vendors sign up.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default VendorSubscriptions;
