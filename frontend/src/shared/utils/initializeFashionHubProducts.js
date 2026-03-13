import { products as initialProducts } from "../../data/products";
import blazerImg from "../../../data/products/blazer.png";
import shirtImg from "../../../data/products/shirt.png";
import leatherBagImg from "../../../data/products/leather bag.png";
import athlaticShoesImg from "../../../data/products/athlatic shoes.png";
import blueJeansImg from "../../../data/products/blue jeans.png";
import necklessImg from "../../../data/products/neckless.png";
import sunglassImg from "../../../data/products/sunglass.png";
import maxiImg from "../../../data/products/maxi.png";
import healsImg from "../../../data/products/heals.png";
import winterScarfImg from "../../../data/products/winter scarf.png";

/**
 * Initialize dummy products for Fashion Hub vendor (vendorId: 1)
 * This function adds additional dummy products to the manage products page
 */
export const initializeFashionHubProducts = () => {
  // Get existing products from localStorage or initial products
  const savedProducts = localStorage.getItem("admin-products");
  const existingProducts = savedProducts
    ? JSON.parse(savedProducts)
    : initialProducts;

  // Get existing product IDs to avoid duplicates
  const existingProductIds = new Set(existingProducts.map((p) => p.id));

  // Find the highest product ID to continue from
  const maxId = Math.max(...existingProducts.map((p) => p.id || 0), 0);

  // Create dummy products for Fashion Hub (vendorId: 1)
  const dummyProducts = [
    {
      id: maxId + 1,
      name: "Elegant Black Blazer",
      unit: "Piece",
      price: 159.99,
      originalPrice: 199.99,
      image: blazerImg,
      images: [blazerImg],
      categoryId: 1, // Clothing
      brandId: 1, // Zara
      stock: "in_stock",
      stockQuantity: 42,
      rating: 4.6,
      reviewCount: 156,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: true,
      isNewArrival: false,
      isFeatured: true,
      description:
        "Classic black blazer perfect for formal occasions. Tailored fit with premium fabric.",
      tags: ["formal", "blazer", "black", "professional"],
    },
    {
      id: maxId + 2,
      name: "Casual Striped Polo Shirt",
      unit: "Piece",
      price: 39.99,
      originalPrice: 49.99,
      image: shirtImg,
      images: [shirtImg],
      categoryId: 1, // Clothing
      brandId: 2, // Forever 21
      stock: "in_stock",
      stockQuantity: 78,
      rating: 4.4,
      reviewCount: 203,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: false,
      isNewArrival: true,
      description:
        "Comfortable striped polo shirt for casual wear. Available in multiple colors.",
      tags: ["casual", "polo", "striped", "comfortable"],
    },
    {
      id: maxId + 3,
      name: "Designer Leather Handbag",
      unit: "Piece",
      price: 149.99,
      originalPrice: 199.99,
      image: leatherBagImg,
      images: [leatherBagImg],
      categoryId: 3, // Bags
      brandId: 1, // Zara
      stock: "in_stock",
      stockQuantity: 25,
      rating: 4.8,
      reviewCount: 189,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: true,
      isNewArrival: false,
      description:
        "Premium leather handbag with spacious interior. Perfect for daily use.",
      tags: ["handbag", "leather", "designer", "premium"],
    },
    {
      id: maxId + 4,
      name: "Comfortable Running Shoes",
      unit: "Pair",
      price: 89.99,
      originalPrice: 119.99,
      image: athlaticShoesImg,
      images: [athlaticShoesImg],
      categoryId: 2, // Footwear
      brandId: 3, // Puma
      stock: "in_stock",
      stockQuantity: 56,
      rating: 4.5,
      reviewCount: 312,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: false,
      isNewArrival: true,
      description:
        "Lightweight running shoes with excellent cushioning. Perfect for jogging and workouts.",
      tags: ["running", "sports", "comfortable", "athletic"],
    },
    {
      id: maxId + 5,
      name: "Classic Denim Shorts",
      unit: "Piece",
      price: 44.99,
      originalPrice: 59.99,
      image: blueJeansImg,
      images: [blueJeansImg],
      categoryId: 1, // Clothing
      brandId: 4, // Levi's
      stock: "in_stock",
      stockQuantity: 91,
      rating: 4.3,
      reviewCount: 145,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: true,
      isNewArrival: false,
      description:
        "Classic denim shorts with perfect fit. Great for summer casual wear.",
      tags: ["denim", "shorts", "casual", "summer"],
    },
    {
      id: maxId + 6,
      name: "Elegant Pearl Necklace",
      unit: "Piece",
      price: 79.99,
      originalPrice: 99.99,
      image: necklessImg,
      images: [necklessImg],
      categoryId: 4, // Jewelry
      brandId: null,
      stock: "in_stock",
      stockQuantity: 18,
      rating: 4.7,
      reviewCount: 98,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: false,
      isNewArrival: true,
      description:
        "Beautiful pearl necklace that adds elegance to any outfit. Perfect for special occasions.",
      tags: ["pearl", "necklace", "elegant", "jewelry"],
    },
    {
      id: maxId + 7,
      name: "Wool Blend Winter Coat",
      unit: "Piece",
      price: 199.99,
      originalPrice: 249.99,
      image: blazerImg,
      images: [blazerImg],
      categoryId: 1, // Clothing
      brandId: 5, // Tommy Hilfiger
      stock: "low_stock",
      stockQuantity: 7,
      rating: 4.6,
      reviewCount: 167,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: true,
      isNewArrival: false,
      description:
        "Warm and stylish winter coat with wool blend. Keeps you cozy in cold weather.",
      tags: ["winter", "coat", "wool", "warm"],
    },
    {
      id: maxId + 8,
      name: "Stylish Canvas Backpack",
      unit: "Piece",
      price: 54.99,
      originalPrice: 69.99,
      image: leatherBagImg,
      images: [leatherBagImg],
      categoryId: 3, // Bags
      brandId: 2, // Forever 21
      stock: "in_stock",
      stockQuantity: 63,
      rating: 4.4,
      reviewCount: 234,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: false,
      isNewArrival: true,
      description:
        "Durable canvas backpack with multiple compartments. Perfect for school or travel.",
      tags: ["backpack", "canvas", "durable", "travel"],
    },
    {
      id: maxId + 9,
      name: "Classic Aviator Sunglasses",
      unit: "Piece",
      price: 69.99,
      originalPrice: 89.99,
      image: sunglassImg,
      images: [sunglassImg],
      categoryId: 5, // Accessories
      brandId: null,
      stock: "in_stock",
      stockQuantity: 34,
      rating: 4.5,
      reviewCount: 178,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: true,
      isNewArrival: false,
      description:
        "Classic aviator style sunglasses with UV protection. Timeless design.",
      tags: ["sunglasses", "aviator", "UV protection", "classic"],
    },
    {
      id: maxId + 10,
      name: "Floral Print Maxi Skirt",
      unit: "Piece",
      price: 64.99,
      originalPrice: 79.99,
      image: maxiImg,
      images: [maxiImg],
      categoryId: 1, // Clothing
      brandId: 7, // Biba
      stock: "in_stock",
      stockQuantity: 52,
      rating: 4.6,
      reviewCount: 201,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: false,
      isNewArrival: true,
      description:
        "Beautiful floral print maxi skirt. Flowy and comfortable for any occasion.",
      tags: ["maxi", "skirt", "floral", "flowy"],
    },
    {
      id: maxId + 11,
      name: "Leather Ankle Strap Heels",
      unit: "Pair",
      price: 94.99,
      originalPrice: 129.99,
      image: healsImg,
      images: [healsImg],
      categoryId: 2, // Footwear
      brandId: 1, // Zara
      stock: "in_stock",
      stockQuantity: 28,
      rating: 4.5,
      reviewCount: 156,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: true,
      isNewArrival: false,
      description:
        "Elegant ankle strap heels perfect for evening events. Comfortable and stylish.",
      tags: ["heels", "ankle strap", "leather", "elegant"],
    },
    {
      id: maxId + 12,
      name: "Knit Beanie Hat",
      unit: "Piece",
      price: 24.99,
      originalPrice: 34.99,
      image: winterScarfImg,
      images: [winterScarfImg],
      categoryId: 5, // Accessories
      brandId: null,
      stock: "in_stock",
      stockQuantity: 87,
      rating: 4.3,
      reviewCount: 112,
      vendorId: 1,
      vendorName: "Fashion Hub",
      flashSale: false,
      isNewArrival: true,
      description:
        "Warm knit beanie hat for winter. Soft and comfortable material.",
      tags: ["beanie", "hat", "winter", "knit"],
    },
  ];

  // Filter out products that already exist
  const newProducts = dummyProducts.filter(
    (product) => !existingProductIds.has(product.id)
  );

  if (newProducts.length > 0) {
    // Add new products to existing products
    const updatedProducts = [...existingProducts, ...newProducts];

    // Save to localStorage
    localStorage.setItem("admin-products", JSON.stringify(updatedProducts));

    return {
      productsAdded: newProducts.length,
      totalProducts: updatedProducts.filter((p) => p.vendorId === 1).length,
    };
  }

  return {
    productsAdded: 0,
    totalProducts: existingProducts.filter((p) => p.vendorId === 1).length,
  };
};
