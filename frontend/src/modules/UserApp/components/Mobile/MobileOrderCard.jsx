import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight, FiCalendar, FiShoppingBag } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import { formatPrice } from '../../../../shared/utils/helpers';
import { motion } from 'framer-motion';
import { formatVariantLabel } from '../../../../shared/utils/variant';
import { usePageTranslation } from "../../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../../hooks/useDynamicTranslation";
import { useState, useEffect } from "react";

const MobileOrderCard = ({ order }) => {
  const { getTranslatedText: t } = usePageTranslation([
    "Order",
    "Items",
    "item",
    "items",
    "Variant",
    "variant selections",
    "Total",
    "View Details",
    "Vendor",
    "Vendors",
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
  ]);

  const { translateArray } = useDynamicTranslation();
  const [translatedVariantLabels, setTranslatedVariantLabels] = useState([]);

  useEffect(() => {
    const translateVariants = async () => {
      const rawLabels = Array.isArray(order?.items)
        ? order.items.map((item) => formatVariantLabel(item?.variant)).filter(Boolean)
        : [];
      if (rawLabels.length > 0) {
        const translated = await translateArray(rawLabels.map(l => ({ name: l })), ['name']);
        setTranslatedVariantLabels(translated.map(item => item.name));
      }
    };
    translateVariants();
  }, [order, translateArray]);

  const variantLabels = translatedVariantLabels.length > 0
    ? translatedVariantLabels
    : (Array.isArray(order?.items)
      ? order.items.map((item) => formatVariantLabel(item?.variant)).filter(Boolean)
      : []);

  const variantSummary = variantLabels.length === 1
    ? variantLabels[0]
    : variantLabels.length > 1
      ? `${variantLabels.length} ${t("variant selections")}`
      : '';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 mb-4"
    >
      <Link to={`/orders/${order.id}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center flex-shrink-0">
              <FiPackage className="text-white text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">{t('Order')} #{order.id}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <FiCalendar className="text-xs" />
                {new Date(order.date || order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <FiChevronRight className="text-gray-400 text-xl" />
        </div>

        <div className="space-y-2 mb-3">
          {/* Vendor Count */}
          {order.vendorItems && order.vendorItems.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-primary-50 rounded-lg mb-2">
              <FiShoppingBag className="text-primary-600 text-xs" />
              <span className="text-xs font-semibold text-primary-700">
                {order.vendorItems.length} {order.vendorItems.length === 1 ? t('Vendor') : t('Vendors')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('Items')}</span>
            <span className="text-sm font-semibold text-gray-800">
              {order.items?.length || 0} {(order.items?.length || 0) === 1 ? t('item') : t('items')}
            </span>
          </div>
          {variantSummary && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('Variant')}</span>
              <span className="text-xs font-semibold text-gray-700 text-right max-w-[62%] truncate">
                {variantSummary}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <MdCurrencyRupee className="text-xs" />
              {t('Total')}
            </span>
            <span className="text-base font-bold text-primary-600">
              {formatPrice(order.total || order.amount || 0)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
              order.status
            )}`}
          >
            {t(order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase() : 'Pending')}
          </span>
          <span className="text-xs text-gray-500">{t('View Details')}</span>
        </div>
      </Link>
    </motion.div>
  );
};

export default MobileOrderCard;

