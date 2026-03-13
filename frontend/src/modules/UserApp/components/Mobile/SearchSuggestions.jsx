import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiClock } from 'react-icons/fi';
import { getCatalogProducts } from '../../data/catalogData';
import api from '../../../../shared/utils/api';

const SearchSuggestions = ({
  query,
  isOpen,
  onSelect,
  onClose,
  recentSearches = [],
  onDeleteRecent,
  onClearRecent,
}) => {
  const panelRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const trimmedQuery = String(query || '').trim();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      if (!isOpen || !trimmedQuery) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get('/products', {
          params: { q: trimmedQuery, page: 1, limit: 5, sort: 'newest' },
        });
        const payload = response?.data ?? response;
        const products = Array.isArray(payload?.products) ? payload.products : [];
        if (cancelled) return;
        setSuggestions(
          products.map((product) => ({
            id: product?._id || product?.id,
            name: product?.name || '',
            image: product?.image || product?.images?.[0] || '',
            price: Number(product?.price) || 0,
          }))
        );
      } catch {
        if (cancelled) return;
        const fallback = getCatalogProducts()
          .filter((product) =>
            String(product?.name || '').toLowerCase().includes(trimmedQuery.toLowerCase())
          )
          .slice(0, 5);
        setSuggestions(fallback);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, trimmedQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && trimmedQuery.length === 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-gray-600">Recent Searches</span>
                <button
                  onClick={() => {
                    if (onClearRecent) {
                      onClearRecent();
                    }
                  }}
                  className="text-xs text-primary-600 font-medium"
                >
                  Clear All
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(search)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <FiClock className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-700 flex-1">{search}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecent(index);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <FiX className="text-gray-500 text-xs" />
                  </button>
                </motion.button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {trimmedQuery.length > 0 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-gray-600">Suggestions</span>
              </div>
              {suggestions.map((product, index) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(product.name)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <FiSearch className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-700">{product.name}</span>
                </motion.button>
              ))}
            </div>
          )}

          {suggestions.length === 0 && recentSearches.length === 0 && trimmedQuery.length > 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No suggestions found</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchSuggestions;

