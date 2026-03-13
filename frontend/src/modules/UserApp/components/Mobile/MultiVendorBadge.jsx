import { FiShoppingBag } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MultiVendorBadge = ({ vendorCount = 50, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full font-semibold ${sizeClasses[size]}`}
    >
      <FiShoppingBag className="text-[10px]" />
      <span>{vendorCount}+ Vendors</span>
    </motion.div>
  );
};

export default MultiVendorBadge;

