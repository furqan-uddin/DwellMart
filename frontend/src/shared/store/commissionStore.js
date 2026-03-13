import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getVendorById } from '../../data/vendors';

export const useCommissionStore = create(
  persist(
    (set, get) => ({
      commissions: [],
      settlements: [],

      // Calculate commission for an order item
      calculateCommission: (vendorId, itemPrice, quantity) => {
        const vendor = getVendorById(vendorId);
        if (!vendor) return 0;

        const subtotal = itemPrice * quantity;
        const commissionRate = vendor.commissionRate || 10; // Default 10%
        const commission = (subtotal * commissionRate) / 100;
        const vendorEarnings = subtotal - commission;

        return {
          subtotal,
          commissionRate,
          commission,
          vendorEarnings,
        };
      },

      // Calculate commission for multiple items (order)
      calculateOrderCommission: (orderItems) => {
        // Group items by vendor
        const vendorGroups = {};

        orderItems.forEach((item) => {
          const vendorId = item.vendorId;
          if (!vendorGroups[vendorId]) {
            vendorGroups[vendorId] = {
              vendorId,
              vendorName: item.vendorName || 'Unknown Vendor',
              items: [],
              subtotal: 0,
              commission: 0,
              vendorEarnings: 0,
            };
          }

          const commissionData = get().calculateCommission(
            vendorId,
            item.price,
            item.quantity
          );

          vendorGroups[vendorId].items.push({
            ...item,
            ...commissionData,
          });

          vendorGroups[vendorId].subtotal += commissionData.subtotal;
          vendorGroups[vendorId].commission += commissionData.commission;
          vendorGroups[vendorId].vendorEarnings += commissionData.vendorEarnings;
        });

        return Object.values(vendorGroups);
      },

      // Record commission for an order
      recordCommission: (orderId, vendorItems) => {
        const commissionRecords = vendorItems.map((vendorItem) => ({
          id: `COMM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          orderId,
          vendorId: vendorItem.vendorId,
          vendorName: vendorItem.vendorName,
          subtotal: vendorItem.subtotal,
          commission: vendorItem.commission,
          vendorEarnings: vendorItem.vendorEarnings,
          status: 'pending', // pending, paid, cancelled
          createdAt: new Date().toISOString(),
          paidAt: null,
        }));

        set((state) => ({
          commissions: [...state.commissions, ...commissionRecords],
        }));

        return commissionRecords;
      },

      // Get commissions for a vendor
      getVendorCommissions: (vendorId, status = null) => {
        const state = get();
        let vendorCommissions = state.commissions.filter(
          (c) => String(c.vendorId) === String(vendorId)
        );

        if (status) {
          vendorCommissions = vendorCommissions.filter((c) => c.status === status);
        }

        return vendorCommissions;
      },

      // Get vendor earnings summary
      getVendorEarningsSummary: (vendorId) => {
        const commissions = get().getVendorCommissions(vendorId);

        const summary = {
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          totalCommission: 0,
          totalOrders: 0,
        };

        commissions.forEach((commission) => {
          summary.totalEarnings += commission.vendorEarnings;
          summary.totalCommission += commission.commission;
          summary.totalOrders += 1;

          if (commission.status === 'pending') {
            summary.pendingEarnings += commission.vendorEarnings;
          } else if (commission.status === 'paid') {
            summary.paidEarnings += commission.vendorEarnings;
          }
        });

        return summary;
      },

      // Mark commission as paid (settlement)
      markCommissionAsPaid: (commissionId, settlementData = {}) => {
        set((state) => ({
          commissions: state.commissions.map((c) =>
            c.id === commissionId
              ? {
                ...c,
                status: 'paid',
                paidAt: new Date().toISOString(),
                ...settlementData,
              }
              : c
          ),
        }));

        // Record settlement
        const commission = get().commissions.find((c) => c.id === commissionId);
        if (commission) {
          const settlement = {
            id: `SETTLE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            commissionId,
            vendorId: commission.vendorId,
            vendorName: commission.vendorName,
            amount: commission.vendorEarnings,
            paymentMethod: settlementData.paymentMethod || 'bank_transfer',
            transactionId: settlementData.transactionId || null,
            notes: settlementData.notes || '',
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            settlements: [...state.settlements, settlement],
          }));

          return settlement;
        }
      },

      // Get settlement history for a vendor
      getVendorSettlements: (vendorId) => {
        return get().settlements.filter(
          (s) => String(s.vendorId) === String(vendorId)
        );
      },

      // Get all pending commissions (admin view)
      getAllPendingCommissions: () => {
        return get().commissions.filter((c) => c.status === 'pending');
      },

      // Get commission by ID
      getCommission: (commissionId) => {
        return get().commissions.find((c) => c.id === commissionId);
      },
    }),
    {
      name: 'commission-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

