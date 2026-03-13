import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiSearch, FiEye, FiMessageSquare, FiSend, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../../components/DataTable';
import Badge from '../../../../shared/components/Badge';
import AnimatedSelect from '../../components/AnimatedSelect';
import { useSupportStore } from '../../../../shared/store/supportStore';
import { formatDateTime } from '../../utils/adminHelpers';

const Tickets = () => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const { tickets, isLoading, fetchTickets, addReply, pagination } = useSupportStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets({
      search: searchQuery,
      status: statusFilter === 'all' ? undefined : statusFilter
    });
  }, [searchQuery, statusFilter, fetchTickets]);

  const handleViewTicket = async (ticketRow) => {
    setSelectedTicket(ticketRow);
    const updated = await useSupportStore.getState().fetchTicketById(ticketRow.id);
    if (updated) setSelectedTicket(updated);
  };

  const handleReply = async () => {
    const message = replyMessage.trim();
    if (!message) return;
    const success = await addReply(selectedTicket.id, message);
    if (success) {
      setReplyMessage('');
      // Refresh selected ticket detail if needed, or just stay as is
      // For simplicity, we just clear the input
      const updated = await useSupportStore.getState().fetchTicketById(selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'error',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'id',
      label: 'Ticket ID',
      sortable: true,
      render: (value) => <span className="font-semibold text-gray-800 text-xs">{value}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.customer?.name || 'Anonymous'}</p>
          <p className="text-xs text-gray-500">{row.customer?.email}</p>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: false,
      render: (value) => <p className="text-sm text-gray-800 max-w-xs truncate">{value}</p>,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <Badge variant={getStatusColor(value)}>{value?.replace('_', ' ') || 'unknown'}</Badge>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => formatDateTime(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => handleViewTicket(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FiEye />
        </button>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Support Tickets</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage customer support tickets</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <AnimatedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <DataTable
          data={tickets}
          columns={columns}
          pagination={true}
          itemsPerPage={pagination.limit}
        />
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 bg-black/50 z-[10000]"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[10000] flex ${isAppRoute ? 'items-start pt-[10px]' : 'items-end'} sm:items-center justify-center p-4 pointer-events-none`}
            >
              <motion.div
                variants={{
                  hidden: {
                    y: isAppRoute ? '-100%' : '100%',
                    scale: 0.95,
                    opacity: 0
                  },
                  visible: {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: 'spring',
                      damping: 22,
                      stiffness: 350,
                      mass: 0.7
                    }
                  },
                  exit: {
                    y: isAppRoute ? '-100%' : '100%',
                    scale: 0.95,
                    opacity: 0,
                    transition: {
                      type: 'spring',
                      damping: 30,
                      stiffness: 400
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className={`bg-white ${isAppRoute ? 'rounded-b-3xl' : 'rounded-t-3xl'} sm:rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col`}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-lg font-bold text-gray-800">#{selectedTicket.id} - {selectedTicket.subject}</h3>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="font-semibold text-gray-800">{selectedTicket.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-semibold text-gray-800">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Priority</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge variant={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status?.replace('_', ' ') || 'unknown'}
                      </Badge>
                    </div>
                  </div>

                  {/* Message History */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <FiMessageSquare /> Conversation
                    </h4>
                    <div className="space-y-3">
                      {selectedTicket.messages?.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.senderType === 'admin' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.senderType === 'admin'
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">
                            {msg.senderType.toUpperCase()} | {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                        <p className="text-center text-gray-400 text-xs py-4">No messages yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply Section */}
                {selectedTicket.status !== 'closed' && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex-shrink-0">
                    <div className="relative">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your response..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                        rows="3"
                      />
                      <button
                        onClick={handleReply}
                        disabled={!replyMessage.trim() || isLoading}
                        className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        <FiSend />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tickets;
