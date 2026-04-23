import { useEffect, useState } from "react";
import { FiHeart, FiArrowLeft, FiGrid, FiList } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MobileLayout from "../components/Layout/MobileLayout";
import SwipeableWishlistItem from "../components/Mobile/SwipeableWishlistItem";
import WishlistGridItem from "../components/Mobile/WishlistGridItem";
import { useWishlistStore } from "../../../shared/store/wishlistStore";
import { useCartStore } from "../../../shared/store/useStore";
import { useAuthStore } from "../../../shared/store/authStore";
import toast from "react-hot-toast";
import PageTransition from '../../../shared/components/PageTransition';
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";

const MobileWishlist = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem, moveToCart, clearWishlist, fetchWishlist, isLoading } = useWishlistStore();
  const { addItem } = useCartStore();
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  const { getTranslatedText: t } = usePageTranslation([
    "My Wishlist", "item", "items", "saved", "Clear All", "Loading wishlist...",
    "Your wishlist is empty", "Start adding items you love!", "Continue Shopping",
    "Moved to cart!", "Removed from wishlist", "Wishlist cleared",
    "Are you sure you want to clear your wishlist?", "Undo", "Item restored"
  ]);
  const { translateArray } = useDynamicTranslation();
  const [translatedItems, setTranslatedItems] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist().catch(() => null);
    }
  }, [isAuthenticated, fetchWishlist]);

  useEffect(() => {
    if (items.length === 0) {
      setTranslatedItems([]);
      return;
    }
    translateArray(items, ['name', 'description', 'unit']).then(setTranslatedItems);
  }, [items, translateArray]);

  const handleMoveToCart = (item) => {
    const wishlistItem = moveToCart(item.id);
    if (wishlistItem) {
      addItem({
        ...wishlistItem,
        quantity: 1,
      });
      toast.success(t("Moved to cart!"));
    }
  };

  const handleRemove = (id) => {
    removeItem(id);
    toast.success(t("Removed from wishlist"));
  };

  const handleClearAll = () => {
    if (window.confirm(t("Are you sure you want to clear your wishlist?"))) {
      clearWishlist();
      toast.success(t("Wishlist cleared"));
    }
  };

  return (
    <PageTransition>
      <MobileLayout showBottomNav={true} showCartBar={true}>
        <div className="w-full pb-24">
            {/* Header */}
            <div className="px-4 py-4 bg-white border-b border-gray-200 sticky top-1 z-40 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                  <FiArrowLeft className="text-xl text-gray-700" />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-800 truncate">
                    {t('My Wishlist')}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {items.length} {items.length === 1 ? t("item") : t("items")} {t('saved')}
                  </p>
                </div>
                {items.length > 0 && (
                  <div className="flex items-center gap-2">
                    {/* View Toggle Buttons */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded transition-colors ${viewMode === "list"
                          ? "bg-white text-primary-600 shadow-sm"
                          : "text-gray-600"
                          }`}>
                        <FiList className="text-lg" />
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded transition-colors ${viewMode === "grid"
                          ? "bg-white text-primary-600 shadow-sm"
                          : "text-gray-600"
                          }`}>
                        <FiGrid className="text-lg" />
                      </button>
                    </div>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-600 font-semibold px-2 py-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      {t('Clear All')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">{t('Loading wishlist...')}</p>
                </div>
              ) : items.length === 0 ? (
                <EmptyWishlistState t={t} />
              ) : (
                <WishlistItems
                  items={translatedItems.length > 0 ? translatedItems : items}
                  viewMode={viewMode}
                  onMoveToCart={handleMoveToCart}
                  onRemove={handleRemove}
                />
              )}
            </div>
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

// Empty State Component
const EmptyWishlistState = ({ t }) => (
  <div className="text-center py-12">
    <FiHeart className="text-6xl text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-gray-800 mb-2">
      {t('Your wishlist is empty')}
    </h3>
    <p className="text-gray-600 mb-6">{t('Start adding items you love!')}</p>
    <Link
      to="/home"
      className="gradient-green text-white px-6 py-3 rounded-xl font-semibold inline-block">
      {t('Continue Shopping')}
    </Link>
  </div>
);

// Wishlist Items Component
const WishlistItems = ({ items, viewMode, onMoveToCart, onRemove }) => {
  if (viewMode === "grid") {
    return (
      <AnimatePresence>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {items.map((item, index) => (
            <WishlistGridItem
              key={item.id}
              item={item}
              index={index}
              onMoveToCart={onMoveToCart}
              onRemove={onRemove}
            />
          ))}
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {items.map((item, index) => (
          <SwipeableWishlistItem
            key={item.id}
            item={item}
            index={index}
            onMoveToCart={onMoveToCart}
            onRemove={onRemove}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default MobileWishlist;
