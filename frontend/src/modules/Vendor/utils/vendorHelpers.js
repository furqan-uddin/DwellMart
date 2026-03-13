import { products } from 'data/products';
import { getVendorById } from 'data/vendors';

/**
 * Get products by vendor ID
 */
export const getProductsByVendor = (vendorId) => {
  return products.filter((p) => p.vendorId === parseInt(vendorId));
};

/**
 * Get vendor name by vendor ID
 */
export const getVendorName = (vendorId) => {
  const vendor = getVendorById(vendorId);
  return vendor ? vendor.storeName || vendor.name : 'Unknown Vendor';
};

/**
 * Group cart items by vendor
 */
export const groupCartItemsByVendor = (cartItems) => {
  const vendorGroups = {};
  
  cartItems.forEach((item) => {
    const vendorId = item.vendorId || 1; // Default vendor if not specified
    const vendorName = item.vendorName || getVendorName(vendorId);
    
    if (!vendorGroups[vendorId]) {
      vendorGroups[vendorId] = {
        vendorId,
        vendorName,
        items: [],
        subtotal: 0,
      };
    }
    
    const itemSubtotal = item.price * item.quantity;
    vendorGroups[vendorId].items.push(item);
    vendorGroups[vendorId].subtotal += itemSubtotal;
  });
  
  return Object.values(vendorGroups);
};

/**
 * Calculate shipping per vendor
 */
export const calculateShippingPerVendor = (vendorGroups, totalShipping) => {
  const vendorCount = vendorGroups.length;
  if (vendorCount === 0) return [];
  
  // Split shipping equally among vendors
  const shippingPerVendor = totalShipping / vendorCount;
  
  return vendorGroups.map((group) => ({
    ...group,
    shipping: shippingPerVendor,
  }));
};

/**
 * Check if product belongs to vendor
 */
export const isProductFromVendor = (productId, vendorId) => {
  const product = products.find((p) => p.id === parseInt(productId));
  return product && product.vendorId === parseInt(vendorId);
};

/**
 * Get vendor info for a product
 */
export const getProductVendorInfo = (productId) => {
  const product = products.find((p) => p.id === parseInt(productId));
  if (!product || !product.vendorId) return null;
  
  const vendor = getVendorById(product.vendorId);
  return vendor ? {
    id: vendor.id,
    name: vendor.name,
    storeName: vendor.storeName,
    storeLogo: vendor.storeLogo,
    rating: vendor.rating,
    reviewCount: vendor.reviewCount,
  } : null;
};

/**
 * Format vendor status for display
 */
export const formatVendorStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pending Approval', color: 'yellow' },
    approved: { label: 'Approved', color: 'green' },
    suspended: { label: 'Suspended', color: 'red' },
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

/**
 * Check if vendor is approved
 */
export const isVendorApproved = (vendorId) => {
  const vendor = getVendorById(vendorId);
  return vendor && vendor.status === 'approved';
};

