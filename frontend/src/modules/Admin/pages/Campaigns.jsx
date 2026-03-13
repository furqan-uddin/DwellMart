import { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiEyeOff, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useCampaignStore } from '../../../shared/store/campaignStore';
import CampaignForm from '../components/Campaigns/CampaignForm';
import ExportButton from '../components/ExportButton';
import Pagination from '../components/Pagination';
import Badge from '../../../shared/components/Badge';
import AnimatedSelect from '../components/AnimatedSelect';
import { formatDateTime } from '../utils/adminHelpers';
import toast from 'react-hot-toast';

const Campaigns = () => {
  const {
    campaigns,
    isLoading,
    fetchCampaigns,
    deleteCampaign,
    toggleCampaignStatus,
  } = useCampaignStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !searchQuery ||
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (campaign.description &&
          campaign.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || campaign.type === selectedType;

      const now = new Date();
      const isActive = campaign.isActive &&
        new Date(campaign.startDate) <= now &&
        new Date(campaign.endDate) >= now;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && isActive) ||
        (selectedStatus === 'inactive' && !isActive) ||
        (selectedStatus === 'upcoming' && new Date(campaign.startDate) > now) ||
        (selectedStatus === 'ended' && new Date(campaign.endDate) < now);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [campaigns, searchQuery, selectedType, selectedStatus]);

  // Pagination
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCampaigns.slice(startIndex, endIndex);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedStatus]);

  const handleCreate = () => {
    setEditingCampaign(null);
    setShowForm(true);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    if (!campaign.isActive) return 'inactive';
    if (new Date(campaign.startDate) > now) return 'upcoming';
    if (new Date(campaign.endDate) < now) return 'ended';
    return 'active';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'error',
      upcoming: 'warning',
      ended: 'error',
    };
    return colors[status] || 'error';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Campaigns</h1>
          <p className="text-gray-600">Manage promotional campaigns and offers</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold"
        >
          <FiPlus />
          Create Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type Filter */}
          <AnimatedSelect
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'flash_sale', label: 'Flash Sale' },
              { value: 'daily_deal', label: 'Daily Deal' },
              { value: 'special_offer', label: 'Special Offer' },
            ]}
            className="min-w-[140px]"
          />

          {/* Status Filter */}
          <AnimatedSelect
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="min-w-[140px]"
          />

          {/* Export Button */}
          <ExportButton
            data={filteredCampaigns}
            headers={[
              { label: 'ID', accessor: (row) => row._id },
              { label: 'Name', accessor: (row) => row.name },
              { label: 'Type', accessor: (row) => row.type },
              { label: 'Discount', accessor: (row) => `${row.discountValue}${row.discountType === 'percentage' ? '%' : ''}` },
              { label: 'Start Date', accessor: (row) => formatDateTime(row.startDate) },
              { label: 'End Date', accessor: (row) => formatDateTime(row.endDate) },
              { label: 'Status', accessor: (row) => getCampaignStatus(row) },
            ]}
            filename="campaigns"
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-6">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No campaigns found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCampaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                return (
                  <div
                    key={campaign._id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{campaign.name}</h3>
                        <Badge variant={getStatusColor(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      <button
                        onClick={() => toggleCampaignStatus(campaign._id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={campaign.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {campaign.isActive ? <FiEye /> : <FiEyeOff />}
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold text-gray-800">
                          {campaign.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-semibold text-primary-600">
                          {campaign.discountValue}
                          {campaign.discountType === 'percentage' ? '%' : ' $'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Products:</span>
                        <span className="font-semibold text-gray-800">
                          {campaign.productIds.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FiCalendar />
                        <span>{formatDateTime(campaign.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FiCalendar />
                        <span>{formatDateTime(campaign.endDate)}</span>
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FiEdit />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCampaigns.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Campaign Form Modal */}
      {showForm && (
        <CampaignForm
          campaign={editingCampaign}
          onClose={handleFormClose}
          onSave={() => {
            fetchCampaigns();
          }}
        />
      )}
    </motion.div>
  );
};

export default Campaigns;

