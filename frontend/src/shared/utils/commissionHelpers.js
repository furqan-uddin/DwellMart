import { getVendorById } from '../../data/vendors';

/**
 * Calculate commission for a single item
 * @param {number} vendorId - Vendor ID
 * @param {number} itemPrice - Price per item
 * @param {number} quantity - Quantity
 * @returns {Object} Commission breakdown
 */
export const calculateItemCommission = (vendorId, itemPrice, quantity) => {
  const vendor = getVendorById(vendorId);
  if (!vendor) {
    return {
      subtotal: 0,
      commissionRate: 0,
      commission: 0,
      vendorEarnings: 0,
    };
  }

  const subtotal = itemPrice * quantity;
  const commissionRate = vendor.commissionRate || 10; // Default 10%
  const commission = (subtotal * commissionRate) / 100;
  const vendorEarnings = subtotal - commission;

  return {
    subtotal,
    commissionRate,
    commission,
    vendorEarnings,
  };
};

/**
 * Calculate commission for multiple items grouped by vendor
 * @param {Array} items - Array of items with vendorId, price, quantity
 * @returns {Array} Vendor groups with commission breakdown
 */
export const calculateOrderCommissions = (items) => {
  const vendorGroups = {};

  items.forEach((item) => {
    const vendorId = item.vendorId || 1;
    const vendorName = item.vendorName || 'Unknown Vendor';

    if (!vendorGroups[vendorId]) {
      vendorGroups[vendorId] = {
        vendorId,
        vendorName,
        items: [],
        subtotal: 0,
        commission: 0,
        vendorEarnings: 0,
      };
    }

    const commissionData = calculateItemCommission(
      vendorId,
      item.price,
      item.quantity
    );

    vendorGroups[vendorId].items.push({
      ...item,
      ...commissionData,
    });

    vendorGroups[vendorId].subtotal += commissionData.subtotal;
    vendorGroups[vendorId].commission += commissionData.commission;
    vendorGroups[vendorId].vendorEarnings += commissionData.vendorEarnings;
  });

  return Object.values(vendorGroups);
};

/**
 * Format commission amount for display
 * @param {number} amount - Commission amount
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} Formatted amount
 */
export const formatCommission = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate total commission from vendor groups
 * @param {Array} vendorGroups - Array of vendor groups with commission
 * @returns {number} Total commission
 */
export const getTotalCommission = (vendorGroups) => {
  return vendorGroups.reduce((total, group) => total + (group.commission || 0), 0);
};

/**
 * Calculate total vendor earnings from vendor groups
 * @param {Array} vendorGroups - Array of vendor groups with vendorEarnings
 * @returns {number} Total vendor earnings
 */
export const getTotalVendorEarnings = (vendorGroups) => {
  return vendorGroups.reduce((total, group) => total + (group.vendorEarnings || 0), 0);
};

/**
 * Get commission rate for a vendor
 * @param {number} vendorId - Vendor ID
 * @returns {number} Commission rate percentage
 */
export const getVendorCommissionRate = (vendorId) => {
  const vendor = getVendorById(vendorId);
  return vendor ? (vendor.commissionRate || 10) : 10;
};

