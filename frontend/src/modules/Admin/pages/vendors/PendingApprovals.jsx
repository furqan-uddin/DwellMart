import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import DataTable from "../../components/DataTable";
import Badge from "../../../../shared/components/Badge";
import ConfirmModal from "../../components/ConfirmModal";
import { useVendorStore } from "../../store/vendorStore";
import toast from "react-hot-toast";

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { vendors, updateVendorStatus, initialize } = useVendorStore();

  useEffect(() => {
    initialize();
  }, [initialize]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'approve', 'reject'
    vendorId: null,
    vendorName: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const pendingVendors = useMemo(() => {
    let filtered = vendors.filter((v) => v.status === "pending");

    if (searchQuery) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [vendors, searchQuery]);

  const columns = [
    {
      key: "id",
      label: "ID",
      sortable: true,
    },
    {
      key: "storeName",
      label: "Store Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          {row.storeLogo && (
            <img
              src={row.storeLogo}
              alt={value}
              className="w-10 h-10 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div>
            <span className="font-medium text-gray-800">
              {value || row.name}
            </span>
            <p className="text-xs text-gray-500">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (value) => <span className="text-sm text-gray-700">{value}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-700">{value || "N/A"}</span>
      ),
    },
    {
      key: "joinDate",
      label: "Registration Date",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-700">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/vendors/${row.id}`);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details">
            <FiEye />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionModal({
                isOpen: true,
                type: "approve",
                vendorId: row.id,
                vendorName: row.storeName || row.name,
              });
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Approve Vendor">
            <FiCheckCircle />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionModal({
                isOpen: true,
                type: "reject",
                vendorId: row.id,
                vendorName: row.storeName || row.name,
              });
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Reject Vendor">
            <FiXCircle />
          </button>
        </div>
      ),
    },
  ];

  const handleApprove = async () => {
    const success = await updateVendorStatus(actionModal.vendorId, "approved");
    if (success) {
      toast.success("Vendor approved successfully");
      setActionModal({
        isOpen: false,
        type: null,
        vendorId: null,
        vendorName: null,
      });
    } else {
      toast.error("Failed to approve vendor");
    }
  };

  const handleReject = async () => {
    const success = await updateVendorStatus(
      actionModal.vendorId,
      "rejected",
      rejectReason.trim()
    );
    if (success) {
      toast.success("Vendor registration rejected");
      setActionModal({
        isOpen: false,
        type: null,
        vendorId: null,
        vendorName: null,
      });
      setRejectReason("");
    } else {
      toast.error("Failed to reject vendor");
    }
  };

  const getModalContent = () => {
    if (actionModal.type === "approve") {
      return {
        title: "Approve Vendor?",
        message: `Are you sure you want to approve "${actionModal.vendorName}"? They will be able to start selling on the platform.`,
        confirmText: "Approve",
        onConfirm: handleApprove,
        type: "success",
      };
    } else if (actionModal.type === "reject") {
        return {
          title: "Reject Vendor Registration?",
          message: `Are you sure you want to reject "${actionModal.vendorName}"? This action cannot be undone.`,
          confirmText: "Reject",
          onConfirm: handleReject,
          type: "danger",
          customContent: (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rejection Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Provide a reason for rejection..."
              />
            </div>
          ),
        };
    }
    return null;
  };

  const modalContent = getModalContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Pending Approvals
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and approve pending vendor registrations
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {/* Search */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending vendors..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* DataTable */}
        {pendingVendors.length > 0 ? (
          <DataTable
            data={pendingVendors}
            columns={columns}
            pagination={true}
            itemsPerPage={10}
            onRowClick={(row) => navigate(`/admin/vendors/${row.id}`)}
          />
        ) : (
          <div className="text-center py-12">
            <FiCheckCircle className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No pending approvals</p>
            <p className="text-sm text-gray-400">
              All vendor registrations have been reviewed
            </p>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {modalContent && (
        <ConfirmModal
          isOpen={actionModal.isOpen}
          onClose={() =>
            {
              setActionModal({
                isOpen: false,
                type: null,
                vendorId: null,
                vendorName: null,
              });
              setRejectReason("");
            }
          }
          onConfirm={modalContent.onConfirm}
          title={modalContent.title}
          message={modalContent.message}
          confirmText={modalContent.confirmText}
          cancelText="Cancel"
          type={modalContent.type}
          customContent={modalContent.customContent}
        />
      )}
    </motion.div>
  );
};

export default PendingApprovals;
