import logoImage from "../../data/logos/ChatGPT Image Dec 2, 2025, 03_01_19 PM.png";

export const vendors = [
  {
    id: 1,
    name: "Fashion Hub",
    email: "fashionhub@example.com",
    phone: "+1234567890",
    storeName: "Fashion Hub Store",
    storeLogo: logoImage,
    storeDescription: "Your one-stop shop for trendy fashion and accessories",
    status: "approved", // pending, approved, suspended
    commissionRate: 10, // percentage
    joinDate: "2024-01-15",
    address: {
      street: "123 Fashion Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
    documents: {
      businessLicense: "/documents/business-license-1.pdf",
      taxId: "TAX-123456",
    },
    rating: 4.5,
    reviewCount: 128,
    totalProducts: 45,
    totalSales: 1250,
    totalEarnings: 11250.0,
    isVerified: true,
  },
  {
    id: 2,
    name: "Tech Gear Pro",
    email: "techgear@example.com",
    phone: "+1234567891",
    storeName: "Tech Gear Pro",
    storeLogo: logoImage,
    storeDescription: "Latest tech gadgets and electronics",
    status: "approved",
    commissionRate: 12,
    joinDate: "2024-02-01",
    address: {
      street: "456 Tech Avenue",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "USA",
    },
    documents: {
      businessLicense: "/documents/business-license-2.pdf",
      taxId: "TAX-234567",
    },
    rating: 4.7,
    reviewCount: 234,
    totalProducts: 78,
    totalSales: 2100,
    totalEarnings: 18480.0,
    isVerified: true,
  },
  {
    id: 3,
    name: "Home Essentials",
    email: "homeessentials@example.com",
    phone: "+1234567892",
    storeName: "Home Essentials",
    storeLogo: logoImage,
    storeDescription: "Everything you need for your home",
    status: "approved",
    commissionRate: 8,
    joinDate: "2024-02-15",
    address: {
      street: "789 Home Lane",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
    },
    documents: {
      businessLicense: "/documents/business-license-3.pdf",
      taxId: "TAX-345678",
    },
    rating: 4.3,
    reviewCount: 89,
    totalProducts: 32,
    totalSales: 890,
    totalEarnings: 7120.0,
    isVerified: true,
  },
  {
    id: 4,
    name: "Sports Zone",
    email: "sportszone@example.com",
    phone: "+1234567893",
    storeName: "Sports Zone",
    storeLogo: logoImage,
    storeDescription: "Premium sports and fitness equipment",
    status: "pending",
    commissionRate: 10,
    joinDate: "2024-03-01",
    address: {
      street: "321 Sports Boulevard",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA",
    },
    documents: {
      businessLicense: "/documents/business-license-4.pdf",
      taxId: "TAX-456789",
    },
    rating: 0,
    reviewCount: 0,
    totalProducts: 0,
    totalSales: 0,
    totalEarnings: 0,
    isVerified: false,
  },
  {
    id: 5,
    name: "Beauty Boutique",
    email: "beautyboutique@example.com",
    phone: "+1234567894",
    storeName: "Beauty Boutique",
    storeLogo: logoImage,
    storeDescription: "Premium beauty and skincare products",
    status: "suspended",
    commissionRate: 15,
    joinDate: "2024-01-20",
    address: {
      street: "654 Beauty Street",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA",
    },
    documents: {
      businessLicense: "/documents/business-license-5.pdf",
      taxId: "TAX-567890",
    },
    rating: 3.8,
    reviewCount: 45,
    totalProducts: 12,
    totalSales: 320,
    totalEarnings: 2720.0,
    isVerified: true,
    suspensionReason: "Policy violation",
  },
];

const normalizeId = (value) => String(value ?? "").trim();

// Get vendor by ID
export const getVendorById = (id) => {
  const targetId = normalizeId(id);
  return vendors.find((v) => normalizeId(v.id) === targetId);
};

// Get vendors by status
export const getVendorsByStatus = (status) => {
  return vendors.filter((v) => v.status === status);
};

// Get approved vendors only
export const getApprovedVendors = () => {
  return vendors.filter((v) => v.status === "approved");
};

// Get vendor products (will be used with products data)
export const getVendorProducts = (vendorId) => {
  // This will be used in conjunction with products.js
  // Products will have vendorId field
  return [];
};

// Get vendor orders (will be used with orders data)
export const getVendorOrders = (vendorId) => {
  // This will be used in conjunction with orderStore.js
  // Orders will have vendorItems array
  return [];
};
