import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getVendorProfile,
  getVendorProducts as fetchVendorProducts,
} from "../services/vendorService";

export const useVendorStore = create(
  persist(
    (set, get) => ({
      vendors: [],
      selectedVendor: null,
      productsByVendor: {},
      isLoading: false,

      initialize: async () => {
        set({ isLoading: true });
        try {
          const response = await getVendorProfile();
          const profile = response?.data ?? response;
          const vendor = profile?.id || profile?._id ? profile : null;
          set({
            vendors: vendor ? [{ ...vendor, id: vendor.id || vendor._id }] : [],
            selectedVendor: vendor
              ? { ...vendor, id: vendor.id || vendor._id }
              : null,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      getAllVendors: () => get().vendors,

      getVendor: async (id) => {
        const vendor = get().vendors.find((v) => String(v.id) === String(id));
        set({ selectedVendor: vendor || null });
        return vendor || null;
      },

      getApprovedVendors: () =>
        get().vendors.filter((v) => v.status === "approved"),

      getVendorsByStatus: (status) =>
        get().vendors.filter((v) => v.status === status),

      getVendorProducts: (vendorId) => {
        const key = String(vendorId || "");
        const cached = get().productsByVendor[key];
        if (cached) return cached;

        if (key) {
          (async () => {
            try {
              const response = await fetchVendorProducts({ limit: 500 });
              const data = response?.data ?? response;
              const products = data?.products || [];
              set((state) => ({
                productsByVendor: {
                  ...state.productsByVendor,
                  [key]: products,
                },
              }));
            } catch {
              set((state) => ({
                productsByVendor: {
                  ...state.productsByVendor,
                  [key]: [],
                },
              }));
            }
          })();
        }

        return [];
      },

      getVendorStats: (vendorId) => {
        const products = get().getVendorProducts(vendorId);
        const totalProducts = products.length;
        const inStockProducts = products.filter(
          (p) => (p.stockQuantity || 0) > (p.lowStockThreshold || 10)
        ).length;
        const lowStockProducts = products.filter((p) => {
          const qty = p.stockQuantity || 0;
          const threshold = p.lowStockThreshold || 10;
          return qty > 0 && qty <= threshold;
        }).length;
        const outOfStockProducts = products.filter(
          (p) => (p.stockQuantity || 0) <= 0
        ).length;

        return {
          totalProducts,
          inStockProducts,
          lowStockProducts,
          outOfStockProducts,
          totalSales: 0,
          totalEarnings: 0,
          rating: 0,
          reviewCount: 0,
        };
      },

      updateVendorStatus: async () => false,
      updateCommissionRate: async () => false,

      addVendor: () => null,

      updateVendorProfile: (vendorId, profileData) => {
        set((state) => ({
          vendors: state.vendors.map((v) =>
            String(v.id) === String(vendorId) ? { ...v, ...profileData } : v
          ),
          selectedVendor:
            state.selectedVendor &&
            String(state.selectedVendor.id) === String(vendorId)
              ? { ...state.selectedVendor, ...profileData }
              : state.selectedVendor,
        }));
      },

      setSelectedVendor: (vendorId) => {
        const vendor = get().vendors.find((v) => String(v.id) === String(vendorId));
        set({ selectedVendor: vendor || null });
      },

      clearSelectedVendor: () => {
        set({ selectedVendor: null });
      },
    }),
    {
      name: "vendor-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vendors: state.vendors,
        selectedVendor: state.selectedVendor,
        productsByVendor: state.productsByVendor,
      }),
    }
  )
);
