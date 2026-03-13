import whiteTShirtImg from "../../data/products/white t shirt.png";
import blueJeansImg from "../../data/products/blue jeans.png";
import summerDressImg from "../../data/products/summer dress.png";
import leatherBagImg from "../../data/products/leather bag.png";
import sneakersImg from "../../data/products/sneakers.png";
import sunglassImg from "../../data/products/sunglass.png";
import winterScarfImg from "../../data/products/winter scarf.png";
import blazerImg from "../../data/products/blazer.png";
import denimJacketImg from "../../data/products/denim jacket.png";
import healsImg from "../../data/products/heals.png";
import trackPantsImg from "../../data/products/track pants.png";
import sweaterImg from "../../data/products/sweater.png";
import leatherBootsImg from "../../data/products/leather boots.png";
import stylishWatchImg from "../../data/products/stylish watch.png";
import gownImg from "../../data/products/gown.png";
import shirtImg from "../../data/products/shirt.png";
import maxiImg from "../../data/products/maxi.png";
import necklessImg from "../../data/products/neckless.png";
import athlaticShoesImg from "../../data/products/athlatic shoes.png";
import beltImg from "../../data/products/belt.png";

export const products = [
  {
    id: 1,
    name: "Classic White T-Shirt",
    unit: "Piece",
    price: 24.99,
    originalPrice: 29.99,
    image: whiteTShirtImg,
    images: [whiteTShirtImg, whiteTShirtImg, whiteTShirtImg],
    variants: {
      sizes: ["S", "M", "L", "XL"],
      prices: {
        S: 24.99,
        M: 24.99,
        L: 26.99,
        XL: 26.99,
      },
      defaultVariant: { size: "M" },
    },
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 45,
    rating: 4.5,
    reviewCount: 128,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 1,
  },
  {
    id: 2,
    name: "Slim Fit Blue Jeans",
    unit: "Piece",
    price: 79.99,
    originalPrice: 89.99,
    image: blueJeansImg,
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 120,
    rating: 4.2,
    reviewCount: 89,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 4,
  },
  {
    id: 3,
    name: "Floral Summer Dress",
    unit: "Piece",
    price: 59.99,
    image: summerDressImg,
    flashSale: false,
    stock: "low_stock",
    stockQuantity: 8,
    rating: 4.0,
    reviewCount: 45,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 2,
  },
  {
    id: 4,
    name: "Leather Crossbody Bag",
    unit: "Piece",
    price: 89.99,
    originalPrice: 119.99,
    image: leatherBagImg,
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 65,
    rating: 4.7,
    reviewCount: 156,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 6,
  },
  {
    id: 5,
    name: "Casual Canvas Sneakers",
    unit: "Pair",
    price: 49.99,
    image: sneakersImg,
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 30,
    rating: 4.3,
    reviewCount: 72,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
    brandId: 3,
  },
  {
    id: 6,
    name: "Designer Sunglasses",
    unit: "Piece",
    price: 125.99,
    originalPrice: 179.99,
    image: sunglassImg,
    images: [sunglassImg, sunglassImg, sunglassImg],
    variants: {
      colors: ["Black", "Brown", "Tortoise", "Silver"],
      prices: {
        Black: 125.99,
        Brown: 129.99,
        Tortoise: 135.99,
        Silver: 139.99,
      },
      defaultVariant: { color: "Black" },
    },
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 15,
    rating: 4.8,
    reviewCount: 234,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 5,
  },
  {
    id: 7,
    name: "Wool Winter Scarf",
    unit: "Piece",
    price: 34.99,
    image: winterScarfImg,
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 200,
    rating: 4.1,
    reviewCount: 112,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 8,
    name: "Formal Blazer Jacket",
    unit: "Piece",
    price: 149.99,
    originalPrice: 199.99,
    image: blazerImg,
    flashSale: true,
    stock: "low_stock",
    stockQuantity: 5,
    rating: 4.6,
    reviewCount: 98,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 9,
    name: "Denim Jacket",
    unit: "Piece",
    price: 69.99,
    image: denimJacketImg,
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 85,
    rating: 4.4,
    reviewCount: 67,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 10,
    name: "High Heel Pumps",
    unit: "Pair",
    price: 89.99,
    originalPrice: 129.99,
    image: healsImg,
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 55,
    rating: 4.5,
    reviewCount: 143,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 11,
    name: "Sporty Track Pants",
    unit: "Piece",
    price: 54.99,
    originalPrice: 69.99,
    image: trackPantsImg,
    images: [trackPantsImg, trackPantsImg],
    variants: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      prices: {
        S: 54.99,
        M: 54.99,
        L: 56.99,
        XL: 56.99,
        XXL: 59.99,
      },
      defaultVariant: { size: "M" },
    },
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 42,
    rating: 4.3,
    reviewCount: 189,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 12,
    name: "Knit Cardigan Sweater",
    unit: "Piece",
    price: 74.99,
    originalPrice: 99.99,
    image: sweaterImg,
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 78,
    rating: 4.6,
    reviewCount: 201,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 13,
    name: "Leather Ankle Boots",
    unit: "Pair",
    price: 119.99,
    image: leatherBootsImg,
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 95,
    rating: 4.4,
    reviewCount: 167,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 14,
    name: "Designer Wristwatch",
    unit: "Piece",
    price: 249.99,
    originalPrice: 349.99,
    image: stylishWatchImg,
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 150,
    rating: 4.7,
    reviewCount: 278,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 15,
    name: "Silk Evening Gown",
    unit: "Piece",
    price: 189.99,
    image: gownImg,
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 28,
    rating: 4.2,
    reviewCount: 94,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 16,
    name: "Casual Flannel Shirt",
    unit: "Piece",
    price: 44.99,
    originalPrice: 59.99,
    image: shirtImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 60,
    rating: 4.5,
    reviewCount: 145,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 17,
    name: "Boho Maxi Skirt",
    unit: "Piece",
    price: 64.99,
    originalPrice: 79.99,
    image: maxiImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 88,
    rating: 4.6,
    reviewCount: 192,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 18,
    name: "Statement Necklace",
    unit: "Piece",
    price: 39.99,
    originalPrice: 49.99,
    image: necklessImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 35,
    rating: 4.8,
    reviewCount: 256,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 19,
    name: "Athletic Running Shoes",
    unit: "Pair",
    price: 94.99,
    originalPrice: 129.99,
    image: athlaticShoesImg,
    flashSale: true,
    isNewArrival: true,
    stock: "low_stock",
    stockQuantity: 12,
    rating: 4.4,
    reviewCount: 178,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 20,
    name: "Classic Leather Belt",
    unit: "Piece",
    price: 34.99,
    originalPrice: 49.99,
    image: beltImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 52,
    rating: 4.5,
    reviewCount: 134,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
];

export const getMostPopular = () => products.slice(0, 10);
export const getTrending = () => products.slice(10, 15);
export const getFlashSale = () => products.filter((p) => p.flashSale);
export const getProductById = (id) =>
  products.find((p) => p.id === parseInt(id));

// Get all products with offers (discounted products)
export const getOffers = () => {
  return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
};

// Get daily deals (time-limited offers, can be subset of flash sale or special products)
export const getDailyDeals = () => {
  // For now, return a mix of flash sale products and products with good discounts
  const flashSaleProducts = products.filter((p) => p.flashSale);
  const discountedProducts = products.filter(
    (p) => p.originalPrice && p.originalPrice > p.price && !p.flashSale
  );
  // Combine and return unique products
  const allDeals = [...flashSaleProducts, ...discountedProducts.slice(0, 5)];
  return allDeals.filter(
    (p, index, self) => index === self.findIndex((t) => t.id === p.id)
  );
};

// Get similar/recommended products
export const getSimilarProducts = (currentProductId, limit = 6) => {
  const currentProduct = getProductById(currentProductId);
  if (!currentProduct) return [];

  // Filter out current product
  let similar = products.filter((p) => p.id !== currentProduct.id);

  // Try to find products in similar price range (±30%)
  const priceRange = {
    min: currentProduct.price * 0.7,
    max: currentProduct.price * 1.3,
  };

  // First, try to get products in similar price range
  let priceSimilar = similar.filter(
    (p) => p.price >= priceRange.min && p.price <= priceRange.max
  );

  // If we have enough products in price range, use them
  if (priceSimilar.length >= limit) {
    // Shuffle and take limit
    return priceSimilar.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  // Otherwise, mix price-similar with other products
  const remaining = limit - priceSimilar.length;
  const otherProducts = similar
    .filter((p) => !priceSimilar.some((ps) => ps.id === p.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, remaining);

  return [...priceSimilar, ...otherProducts].slice(0, limit);
};

// Get new arrivals (products marked as new)
export const getNewArrivals = (limit = 8) => {
  return products.filter((p) => p.isNewArrival).slice(0, limit);
};

export const getAllNewArrivals = () => products.filter((p) => p.isNewArrival);

// Get recommended products based on user behavior
export const getRecommendedProducts = (limit = 6) => {
  // Try to get wishlist and cart data from localStorage
  let wishlistItems = [];
  let cartItems = [];

  try {
    const wishlistStorage = localStorage.getItem("wishlist-storage");
    if (wishlistStorage) {
      const parsed = JSON.parse(wishlistStorage);
      wishlistItems = parsed.state?.items || [];
    }

    const cartStorage = localStorage.getItem("cart-storage");
    if (cartStorage) {
      const parsed = JSON.parse(cartStorage);
      cartItems = parsed.state?.items || [];
    }
  } catch (error) {
    // If localStorage access fails, continue with empty arrays
  }

  let recommended = [];
  const usedIds = new Set();

  // 1. Get products similar to wishlist items
  if (wishlistItems.length > 0) {
    wishlistItems.forEach((item) => {
      const similar = getSimilarProducts(item.id, 2);
      similar.forEach((product) => {
        if (
          !usedIds.has(product.id) &&
          !wishlistItems.some((w) => w.id === product.id)
        ) {
          recommended.push(product);
          usedIds.add(product.id);
        }
      });
    });
  }

  // 2. Get products similar to cart items
  if (cartItems.length > 0) {
    cartItems.forEach((item) => {
      const similar = getSimilarProducts(item.id, 2);
      similar.forEach((product) => {
        if (
          !usedIds.has(product.id) &&
          !cartItems.some((c) => c.id === product.id)
        ) {
          recommended.push(product);
          usedIds.add(product.id);
        }
      });
    });
  }

  // 3. Fill remaining slots with trending products
  const trending = getTrending();
  trending.forEach((product) => {
    if (recommended.length < limit && !usedIds.has(product.id)) {
      recommended.push(product);
      usedIds.add(product.id);
    }
  });

  // 4. Fill remaining slots with popular products
  if (recommended.length < limit) {
    const popular = getMostPopular();
    popular.forEach((product) => {
      if (recommended.length < limit && !usedIds.has(product.id)) {
        recommended.push(product);
        usedIds.add(product.id);
      }
    });
  }

  // 5. If still not enough, add any remaining products
  if (recommended.length < limit) {
    products.forEach((product) => {
      if (recommended.length < limit && !usedIds.has(product.id)) {
        recommended.push(product);
        usedIds.add(product.id);
      }
    });
  }

  // Return products in their determined priority order (wishlist -> cart -> trending -> popular)
  // No random shuffle to maintain stability across renders
  return recommended.slice(0, limit);
};

// Get all products
export const getAllProducts = () => products;

export const getProductsByBrand = (brandId) => {
  return products.filter((p) => p.brandId === parseInt(brandId));
};

export const getProductsByVendor = (vendorId) => {
  const targetId = String(vendorId ?? "").trim();
  return products.filter((p) => String(p.vendorId ?? "").trim() === targetId);
};
