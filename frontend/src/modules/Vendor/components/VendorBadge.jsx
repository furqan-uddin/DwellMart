import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiShoppingBag, FiCheckCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import LazyImage from "../../../shared/components/LazyImage";

const VendorBadge = ({
  vendor,
  showVerified = true,
  size = "sm",
  showLogo = true,
  disableLink = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobileApp = location.pathname.startsWith("/app");
  const vendorLink = isMobileApp
    ? `/app/vendor/${vendor?.id}`
    : `/vendor/${vendor?.id}`;

  if (!vendor) return null;

  const sizeClasses = {
    sm: "text-[9px] px-2 py-1",
    md: "text-xs px-2.5 py-1.5",
    lg: "text-sm px-3 py-2",
  };

  const logoSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const vendorName = vendor.storeName || vendor.vendorName || vendor.name;

  const handleClick = (e) => {
    if (disableLink) {
      e.preventDefault();
      e.stopPropagation();
      navigate(vendorLink);
    } else {
      e.stopPropagation();
    }
  };

  const badgeContent = (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 ${sizeClasses[size]}`}>
      {/* Vendor Logo */}
      {showLogo && (vendor.storeLogo || vendor.logo) ? (
        <div
          className={`${logoSizeClasses[size]} rounded-full overflow-hidden bg-white border border-primary-200 flex-shrink-0`}>
          <LazyImage
            src={vendor.storeLogo || vendor.logo}
            alt={vendorName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      ) : (
        <FiShoppingBag
          className={`text-primary-600 ${
            size === "sm"
              ? "text-[10px]"
              : size === "md"
              ? "text-xs"
              : "text-sm"
          }`}
        />
      )}

      <span className="font-bold truncate max-w-[100px]">{vendorName}</span>

      {showVerified && vendor.isVerified && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
          <FiCheckCircle
            className={`text-accent-600 ${
              size === "sm"
                ? "text-[10px]"
                : size === "md"
                ? "text-xs"
                : "text-sm"
            }`}
            title="Verified Vendor"
          />
        </motion.div>
      )}
    </motion.div>
  );

  const className =
    "inline-flex items-center gap-1.5 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 text-primary-700 rounded-lg transition-all duration-300 border border-primary-200/50 shadow-sm hover:shadow-md";

  if (disableLink) {
    return (
      <div onClick={handleClick} className={`${className} cursor-pointer`}>
        {badgeContent}
      </div>
    );
  }

  return (
    <Link to={vendorLink} onClick={handleClick} className={className}>
      {badgeContent}
    </Link>
  );
};

export default VendorBadge;
