import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingBag, FiHeart, FiShare2, FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';

const LongPressMenu = ({ isOpen, onClose, position, onAddToCart, onAddToWishlist, onShare, isInWishlist }) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      icon: FiShoppingBag,
      label: 'Add to Cart',
      onClick: () => {
        onAddToCart();
        onClose();
      },
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: FiHeart,
      label: isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist',
      onClick: () => {
        onAddToWishlist();
        onClose();
      },
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: FiShare2,
      label: 'Share',
      onClick: () => {
        onShare();
        onClose();
      },
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[10001]"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: position.y - 20 }}
            animate={{ opacity: 1, scale: 1, y: position.y }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 -translate-x-1/2 z-[10002] bg-white rounded-2xl shadow-2xl p-2 min-w-[200px]"
            style={{ top: `${position.y}px` }}
          >
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-gray-600">Quick Actions</span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="text-sm text-gray-600" />
              </button>
            </div>
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={item.onClick}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${item.bgColor} ${item.color} font-medium text-sm transition-colors hover:opacity-80`}
                  >
                    <Icon className="text-lg" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(menuContent, document.body);
};

export default LongPressMenu;

