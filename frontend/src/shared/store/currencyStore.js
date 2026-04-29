import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const useCurrencyStore = create(
    persist(
        (set, get) => ({
            selectedCurrency: 'INR',
            currencies: [
                { code: 'INR', symbol: '₹', rate: 1, name: 'Indian Rupee', locale: 'en-IN' }
            ],
            isLoading: false,
            error: null,

            setCurrency: (code) => {
                set({ selectedCurrency: code });
            },

            fetchCurrencies: async () => {
                set({ isLoading: true });
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/currencies`);
                    if (response.data.success) {
                        set({ 
                            currencies: response.data.data, 
                            isLoading: false 
                        });
                        
                        // Ensure selected currency still exists in the fetched list, otherwise default to INR
                        const { selectedCurrency } = get();
                        const exists = response.data.data.find(c => c.code === selectedCurrency);
                        if (!exists) {
                            set({ selectedCurrency: 'INR' });
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch currencies:', error);
                    set({ error: 'Failed to load currencies', isLoading: false });
                }
            },

            getCurrencyDetails: () => {
                const { currencies, selectedCurrency } = get();
                return currencies.find(c => c.code === selectedCurrency) || currencies[0];
            }
        }),
        {
            name: 'dwell-mart-currency',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ selectedCurrency: state.selectedCurrency }),
        }
    )
);

export default useCurrencyStore;
