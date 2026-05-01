import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useUIStore } from "../../../../shared/store/useStore";
import { useWishlistStore } from "../../../../shared/store/wishlistStore";
import { useAuthStore } from "../../../../shared/store/authStore";
import { appLogo } from "../../../../data/logos";
import SearchBar from "../../../../shared/components/SearchBar";
import LanguageSelector from "../../../../shared/components/LanguageSelector";
import CurrencySelector from "../../../../shared/components/CurrencySelector";
import { usePageTranslation } from "../../../../hooks/usePageTranslation";
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

const DesktopHeader = ({ hideSellButton = false }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const unreadCount = useUserNotificationStore((state) => state.unreadCount);
  const { getTranslatedText: t } = usePageTranslation(["Home", "Shop", "Categories", "Offers", "Track Order", "Sell On DwellMart", "Profile", "Orders", "Logout", "Login"]);
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
    <header className="hidden md:block sticky top-0 z-[999] bg-black shadow-lg border-b border-gray-800 overflow-visible">
      <div className="max-w-[1920px] mx-auto px-4 md:px-5 lg:px-8 xl:px-12 h-20 flex items-center gap-3 lg:gap-4 xl:gap-6">
        {/* Logo */}
        <Link to="/home" className="flex-shrink-0 flex items-center gap-2 overflow-visible relative z-20">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              opacity: { duration: 0.6 },
              y: { duration: 0.6, type: "spring", stiffness: 100 }
            }}
            className="flex items-center overflow-visible"
          >
            {appLogo.src ? (
              <img
                src={appLogo.src}
                alt={appLogo.alt}
                className="h-32 lg:h-40 xl:h-48 w-auto max-w-[260px] lg:max-w-[320px] xl:max-w-[380px] object-contain transition-all drop-shadow-lg scale-[1.35]"
              />
            ) : (
              <span className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 bg-clip-text text-transparent drop-shadow-sm">Dwell Mart</span>
            )}
          </motion.div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex min-w-0 items-center gap-2 lg:gap-3 xl:gap-4 whitespace-nowrap mr-auto">
          <Link
            to="/home"
            className="text-gray-300 hover:text-primary-400 font-medium text-xs lg:text-sm xl:text-[15px] transition-colors">
            {t("Home")}
          </Link>
          <Link
            to="/shop"
            className="text-gray-300 hover:text-primary-400 font-medium text-xs lg:text-sm xl:text-[15px] flex items-center gap-1 transition-colors">
            <FiShoppingBag className="md:hidden lg:inline-block" /> {t("Shop")}
          </Link>
          <Link
            to="/categories"
            className="text-gray-300 hover:text-primary-400 font-medium text-xs lg:text-sm xl:text-[15px] flex items-center gap-1 transition-colors">
            <FiGrid /> {t("Categories")}
          </Link>
          <Link
            to="/offers"
            className="text-gray-300 hover:text-primary-400 font-medium text-xs lg:text-sm xl:text-[15px] transition-colors">
            {t("Offers")}
          </Link>
          <Link
            to={isAuthenticated ? "/orders" : "/login"}
            className="text-gray-300 hover:text-primary-400 font-medium text-xs lg:text-sm xl:text-[15px] transition-colors">
            {t("Track Order")}
          </Link>
          {!hideSellButton && (
            <Link
              to="/sell-on-dwellmart"
              className="ml-1 rounded-lg border border-[#ffc101]/40 bg-[#ffc101]/12 px-2.5 lg:px-3 xl:px-4 py-2 text-[11px] lg:text-xs xl:text-sm font-semibold text-[#ffc101] transition-all hover:bg-[#ffc101] hover:text-black">
              {t("Sell On DwellMart")}
            </Link>
          )}
        </nav>

        {/* Right Section: Search and Actions */}
        <div className="flex-1 flex items-center justify-end min-w-0 ml-[44px] lg:ml-[68px] xl:ml-[84px]">
          {/* Search Bar Wrapper */}
          <div className="relative flex items-center mr-1 lg:mr-2 ml-2 sm:ml-4 lg:ml-6 group/search peer/search">
            {/* Spacer to reserve space for the Search Bar when closed */}
            <div className="w-[40px] shrink-0 pointer-events-none transition-all duration-500"></div>

            {/* Search Bar - Absolutely positioned overlay expanding to the right */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[40px] transition-all duration-500 ease-in-out group-focus-within/search:w-[280px] md:group-focus-within/search:w-[350px] lg:group-focus-within/search:w-[450px] xl:group-focus-within/search:w-[500px] 2xl:group-focus-within/search:w-[600px] z-[60] [&_input]:!h-[40px] [&_input]:!py-0 [&_input]:!rounded-full [&_input]:!px-0 group-focus-within/search:[&_input]:!pl-12 group-focus-within/search:[&_input]:!pr-4 [&_input]:!text-transparent [&_input]:placeholder:!text-transparent group-focus-within/search:[&_input]:!text-gray-700 group-focus-within/search:[&_input]:placeholder:!text-gray-400 [&_svg]:!left-1/2 [&_svg]:!-translate-x-1/2 group-focus-within/search:[&_svg]:!left-4 group-focus-within/search:[&_svg]:!translate-x-0">
              <SearchBar />
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5 lg:gap-2 xl:gap-3 transition-all duration-500 peer-focus-within/search:opacity-0 peer-focus-within/search:translate-x-4 peer-focus-within/search:pointer-events-none">
          <div className="flex items-center gap-2 mr-2">
            <LanguageSelector variant="desktop" />
            <CurrencySelector variant="desktop" />
          </div>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2 text-gray-300 hover:text-primary-400 transition-colors">
            <FiHeart className="text-lg lg:text-xl xl:text-2xl" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative p-2 text-gray-300 hover:text-primary-400 transition-colors">
            <FiShoppingBag className="text-lg lg:text-xl xl:text-2xl" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <Link
            to={isAuthenticated ? "/notifications" : "/login"}
            className="relative p-2 text-gray-300 hover:text-primary-400 transition-colors">
            <FiBell className="text-lg lg:text-xl xl:text-2xl" />
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
                className="flex items-center gap-2 p-1 lg:p-1.5 hover:bg-gray-800 rounded-full transition-all border border-transparent hover:border-gray-700">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <HiOutlineUserCircle className="text-gray-300 text-[26px] lg:text-[28px] xl:text-3xl" />
                )}
                <span className="text-xs lg:text-sm font-medium text-gray-200 max-w-[72px] lg:max-w-[84px] xl:max-w-[96px] truncate">
                  {user?.name || "User"}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 bg-gray-900 rounded-xl shadow-xl border border-gray-800 p-2 z-[60] min-w-[200px]">
                    <div className="px-3 py-2 border-b border-gray-800 mb-2">
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
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-left w-full">
                      <FiUser className="text-gray-400" />
                      <span className="text-gray-200 text-sm">{t("Profile")}</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-left w-full">
                      <FiShoppingBag className="text-gray-400" />
                      <span className="text-gray-200 text-sm">{t("Orders")}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-left w-full text-red-600 mt-1">
                      <FiLogOut className="text-red-500" />
                      <span className="text-sm">{t("Logout")}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 lg:px-3.5 xl:px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200 text-xs lg:text-sm xl:text-base whitespace-nowrap">
              {t("Login")}
            </Link>
          )}
        </div>
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;

