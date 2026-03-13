import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { useWishlistStore } from "../../../../shared/store/wishlistStore";
import { useCartStore } from "../../../../shared/store/useStore";
import {
  formatPrice,
  getPlaceholderImage,
} from "../../../../shared/utils/helpers";
import toast from "react-hot-toast";
import LazyImage from "../../../../shared/components/LazyImage";
import useSwipeGesture from "../../hooks/useSwipeGesture";

const SwipeableWishlistItem = ({ item, index, onMoveToCart, onRemove }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);
  const deletedItemRef = useRef(null);
  const { addItem: addToWishlist } = useWishlistStore();
  const { items: cartItems, removeItem: removeFromCart } = useCartStore();
  const isInCart = cartItems ? cartItems.some((i) => i.id === item.id) : false;

  const handleRemoveFromCart = (e) => {
    if (e) e.stopPropagation();
    removeFromCart(item.id);
    toast.success("Removed from cart!");
  };

  const handleSwipeRight = () => {
    setIsDeleted(true);
    deletedItemRef.current = { ...item };
    onRemove(item.id);
    toast.success("Removed from wishlist", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: () => {
          if (deletedItemRef.current) {
            addToWishlist(deletedItemRef.current);
            setIsDeleted(false);
            deletedItemRef.current = null;
            toast.success("Item restored");
          }
        },
      },
    });
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    threshold: 100,
  });

  useEffect(() => {
    if (swipeHandlers.swipeState.isSwiping) {
      setSwipeOffset(Math.max(0, swipeHandlers.swipeState.offset));
    } else if (!swipeHandlers.swipeState.isSwiping && swipeOffset < 100) {
      setSwipeOffset(0);
    }
  }, [
    swipeHandlers.swipeState.isSwiping,
    swipeHandlers.swipeState.offset,
    swipeOffset,
  ]);

  if (isDeleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, x: swipeOffset }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="glass-card rounded-2xl p-4 mb-3 relative"
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}>
      {/* Delete Background */}
      {swipeOffset > 0 && (
        <div className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end pr-4">
          <FiTrash2 className="text-white text-xl" />
        </div>
      )}

      <div className="flex gap-4 relative z-10">
        {/* Product Image */}
        <Link to={`/product/${item.id}`} className="flex-shrink-0">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
            <LazyImage
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = getPlaceholderImage(200, 200, "Product");
              }}
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/product/${item.id}`}>
            <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">
              {item.name}
            </h3>
          </Link>
          <p className="text-lg font-bold text-primary-600 mb-3">
            {formatPrice(item.price)}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isInCart ? (
              <button
                onClick={handleRemoveFromCart}
                className="flex-1 py-2 sm:py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap border border-red-100 transition-all">
                <FiTrash2 className="text-sm sm:text-base" />
                Remove
              </button>
            ) : (
              <button
                onClick={() => onMoveToCart(item)}
                className="flex-1 py-2 sm:py-2.5 gradient-green text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap hover:shadow-glow-green transition-all">
                <FiShoppingBag className="text-sm sm:text-base" />
                Add to Cart
              </button>
            )}
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 sm:p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
              <FiTrash2 className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeableWishlistItem;
