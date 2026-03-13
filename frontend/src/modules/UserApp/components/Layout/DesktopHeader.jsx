import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useUIStore } from "../../../../shared/store/useStore";
import { useWishlistStore } from "../../../../shared/store/wishlistStore";
import { useAuthStore } from "../../../../shared/store/authStore";
import { appLogo } from "../../../../data/logos";
import SearchBar from "../../../../shared/components/SearchBar";
import {
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiGrid,
  FiBell,
} from "react-icons/fi";
import { HiOutlineUserCircle } from "react-icons/hi";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserNotificationStore } from "../../store/userNotificationStore";

const DesktopHeader = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const unreadCount = useUserNotificationStore((state) => state.unreadCount);
  const ensureHydrated = useUserNotificationStore(
    (state) => state.ensureHydrated,
  );
  const toggleCart = useUIStore((state) => state.toggleCart);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    ensureHydrated();
  }, [ensureHydrated, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/home");
  };

  return (
    <header className="hidden md:block sticky top-0 z-[999] bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-12 lg:px-24 xl:px-40 h-20 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/home" className="flex-shrink-0 flex items-center gap-2">
          {appLogo.src ? (
            <img
              src={appLogo.src}
              alt={appLogo.alt}
              className="h-16 lg:h-18 xl:h-20 w-auto object-contain"
            />
          ) : (
            <span className="text-2xl font-bold text-primary-600">LOGO</span>
          )}
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            to="/home"
            className="text-gray-600 hover:text-primary-600 font-medium text-sm lg:text-base">
            Home
          </Link>
          <Link
            to="/categories"
            className="text-gray-600 hover:text-primary-600 font-medium text-sm lg:text-base flex items-center gap-1">
            <FiGrid /> Categories
          </Link>
          <Link
            to="/offers"
            className="text-gray-600 hover:text-primary-600 font-medium text-sm lg:text-base">
            Offers
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5">
          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
            <FiHeart className="text-2xl" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
            <FiShoppingBag className="text-2xl" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <Link
            to={isAuthenticated ? "/notifications" : "/login"}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
            <FiBell className="text-2xl" />
            {isAuthenticated && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 lg:p-1.5 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-200">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <HiOutlineUserCircle className="text-gray-600 text-3xl" />
                )}
                <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name || "User"}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-[60] min-w-[200px]">
                    <div className="px-3 py-2 border-b border-gray-200 mb-2">
                      <p className="font-semibold text-gray-800 text-sm">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left w-full">
                      <FiUser className="text-gray-500" />
                      <span className="text-gray-700 text-sm">Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left w-full">
                      <FiShoppingBag className="text-gray-500" />
                      <span className="text-gray-700 text-sm">Orders</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-left w-full text-red-600 mt-1">
                      <FiLogOut className="text-red-500" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
