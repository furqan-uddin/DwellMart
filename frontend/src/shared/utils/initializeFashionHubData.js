import { useOrderStore } from "../store/orderStore";
import { useCommissionStore } from "../store/commissionStore";
import { products } from "../../data/products";
import { getVendorById } from "../../data/vendors";
import whiteTShirtImg from "../../../data/products/white t shirt.png";
import blueJeansImg from "../../../data/products/blue jeans.png";
import leatherBagImg from "../../../data/products/leather bag.png";
import sunglassImg from "../../../data/products/sunglass.png";
import blazerImg from "../../../data/products/blazer.png";
import healsImg from "../../../data/products/heals.png";
import sweaterImg from "../../../data/products/sweater.png";
import leatherBootsImg from "../../../data/products/leather boots.png";
import gownImg from "../../../data/products/gown.png";
import shirtImg from "../../../data/products/shirt.png";
import necklessImg from "../../../data/products/neckless.png";
import winterScarfImg from "../../../data/products/winter scarf.png";
import beltImg from "../../../data/products/belt.png";
import summerDressImg from "../../../data/products/summer dress.png";
import denimJacketImg from "../../../data/products/denim jacket.png";

/**
 * Initialize dummy data for Fashion Hub vendor (vendorId: 1)
 * This function adds dummy orders, commissions, and ensures products exist
 */
export const initializeFashionHubData = () => {
  const orderStore = useOrderStore.getState();
  const commissionStore = useCommissionStore.getState();

  // Get existing orders to avoid duplicates
  const existingOrders = orderStore.orders || [];
  const existingOrderIds = new Set(existingOrders.map((o) => o.id));

  // Fashion Hub products (vendorId: 1)
  const fashionHubProducts = products.filter((p) => p.vendorId === 1);

  // Create dummy orders for Fashion Hub
  const dummyOrders = [
    {
      id: "ORD-FH-001",
      userId: null,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: "delivered",
      items: [
        {
          id: 1,
          productId: 1,
          name: "Classic White T-Shirt",
          quantity: 2,
          price: 24.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: whiteTShirtImg,
        },
        {
          id: 2,
          productId: 2,
          name: "Slim Fit Blue Jeans",
          quantity: 1,
          price: 79.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: blueJeansImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 1,
              productId: 1,
              name: "Classic White T-Shirt",
              quantity: 2,
              price: 24.99,
              image: whiteTShirtImg,
            },
            {
              id: 2,
              productId: 2,
              name: "Slim Fit Blue Jeans",
              quantity: 1,
              price: 79.99,
              image: blueJeansImg,
            },
          ],
          subtotal: 129.97,
          shipping: 5.0,
          tax: 10.4,
          discount: 0,
        },
      ],
      shippingAddress: {
        name: "John Doe",
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
        phone: "+1234567890",
      },
      paymentMethod: "card",
      subtotal: 129.97,
      shipping: 5.0,
      tax: 10.4,
      discount: 0,
      total: 145.37,
      trackingNumber: "TRKFH001",
      estimatedDelivery: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-002",
      userId: null,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      status: "delivered",
      items: [
        {
          id: 4,
          productId: 4,
          name: "Leather Crossbody Bag",
          quantity: 1,
          price: 89.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: leatherBagImg,
        },
        {
          id: 6,
          productId: 6,
          name: "Designer Sunglasses",
          quantity: 1,
          price: 125.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: sunglassImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 4,
              productId: 4,
              name: "Leather Crossbody Bag",
              quantity: 1,
              price: 89.99,
              image: leatherBagImg,
            },
            {
              id: 6,
              productId: 6,
              name: "Designer Sunglasses",
              quantity: 1,
              price: 125.99,
              image: sunglassImg,
            },
          ],
          subtotal: 215.98,
          shipping: 8.0,
          tax: 17.28,
          discount: 10.0,
        },
      ],
      shippingAddress: {
        name: "Jane Smith",
        street: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        country: "USA",
        phone: "+1234567891",
      },
      paymentMethod: "card",
      subtotal: 215.98,
      shipping: 8.0,
      tax: 17.28,
      discount: 10.0,
      total: 231.26,
      trackingNumber: "TRKFH002",
      estimatedDelivery: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-003",
      userId: null,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: "processing",
      items: [
        {
          id: 8,
          productId: 8,
          name: "Formal Blazer Jacket",
          quantity: 1,
          price: 149.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: blazerImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 8,
              productId: 8,
              name: "Formal Blazer Jacket",
              quantity: 1,
              price: 149.99,
              image: blazerImg,
            },
          ],
          subtotal: 149.99,
          shipping: 10.0,
          tax: 12.0,
          discount: 0,
        },
      ],
      shippingAddress: {
        name: "Bob Johnson",
        street: "789 Pine Road",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA",
        phone: "+1234567892",
      },
      paymentMethod: "card",
      subtotal: 149.99,
      shipping: 10.0,
      tax: 12.0,
      discount: 0,
      total: 171.99,
      trackingNumber: "TRKFH003",
      estimatedDelivery: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-004",
      userId: null,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      status: "shipped",
      items: [
        {
          id: 10,
          productId: 10,
          name: "High Heel Pumps",
          quantity: 1,
          price: 89.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: healsImg,
        },
        {
          id: 12,
          productId: 12,
          name: "Knit Cardigan Sweater",
          quantity: 1,
          price: 74.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: sweaterImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 10,
              productId: 10,
              name: "High Heel Pumps",
              quantity: 1,
              price: 89.99,
              image: healsImg,
            },
            {
              id: 12,
              productId: 12,
              name: "Knit Cardigan Sweater",
              quantity: 1,
              price: 74.99,
              image: sweaterImg,
            },
          ],
          subtotal: 164.98,
          shipping: 7.0,
          tax: 13.2,
          discount: 5.0,
        },
      ],
      shippingAddress: {
        name: "Alice Brown",
        street: "321 Elm Street",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        country: "USA",
        phone: "+1234567893",
      },
      paymentMethod: "card",
      subtotal: 164.98,
      shipping: 7.0,
      tax: 13.2,
      discount: 5.0,
      total: 180.18,
      trackingNumber: "TRKFH004",
      estimatedDelivery: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-005",
      userId: null,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      status: "delivered",
      items: [
        {
          id: 13,
          productId: 13,
          name: "Leather Ankle Boots",
          quantity: 1,
          price: 119.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: leatherBootsImg,
        },
        {
          id: 15,
          productId: 15,
          name: "Silk Evening Gown",
          quantity: 1,
          price: 189.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: gownImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 13,
              productId: 13,
              name: "Leather Ankle Boots",
              quantity: 1,
              price: 119.99,
              image: leatherBootsImg,
            },
            {
              id: 15,
              productId: 15,
              name: "Silk Evening Gown",
              quantity: 1,
              price: 189.99,
              image: gownImg,
            },
          ],
          subtotal: 309.98,
          shipping: 12.0,
          tax: 25.6,
          discount: 15.0,
        },
      ],
      shippingAddress: {
        name: "Charlie Wilson",
        street: "654 Maple Drive",
        city: "Phoenix",
        state: "AZ",
        zipCode: "85001",
        country: "USA",
        phone: "+1234567894",
      },
      paymentMethod: "card",
      subtotal: 309.98,
      shipping: 12.0,
      tax: 25.6,
      discount: 15.0,
      total: 332.58,
      trackingNumber: "TRKFH005",
      estimatedDelivery: new Date(
        Date.now() - 4 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-006",
      userId: null,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      status: "delivered",
      items: [
        {
          id: 16,
          productId: 16,
          name: "Casual Flannel Shirt",
          quantity: 2,
          price: 44.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: shirtImg,
        },
        {
          id: 18,
          productId: 18,
          name: "Statement Necklace",
          quantity: 1,
          price: 39.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: necklessImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 16,
              productId: 16,
              name: "Casual Flannel Shirt",
              quantity: 2,
              price: 44.99,
              image: shirtImg,
            },
            {
              id: 18,
              productId: 18,
              name: "Statement Necklace",
              quantity: 1,
              price: 39.99,
              image: necklessImg,
            },
          ],
          subtotal: 129.97,
          shipping: 5.0,
          tax: 10.4,
          discount: 0,
        },
      ],
      shippingAddress: {
        name: "Diana Prince",
        street: "987 Cedar Lane",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "USA",
        phone: "+1234567895",
      },
      paymentMethod: "card",
      subtotal: 129.97,
      shipping: 5.0,
      tax: 10.4,
      discount: 0,
      total: 145.37,
      trackingNumber: "TRKFH006",
      estimatedDelivery: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-007",
      userId: null,
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      status: "delivered",
      items: [
        {
          id: 7,
          productId: 7,
          name: "Wool Winter Scarf",
          quantity: 3,
          price: 34.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: winterScarfImg,
        },
        {
          id: 20,
          productId: 20,
          name: "Classic Leather Belt",
          quantity: 1,
          price: 34.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: beltImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 7,
              productId: 7,
              name: "Wool Winter Scarf",
              quantity: 3,
              price: 34.99,
              image: winterScarfImg,
            },
            {
              id: 20,
              productId: 20,
              name: "Classic Leather Belt",
              quantity: 1,
              price: 34.99,
              image: beltImg,
            },
          ],
          subtotal: 139.96,
          shipping: 6.0,
          tax: 11.2,
          discount: 0,
        },
      ],
      shippingAddress: {
        name: "Frank Miller",
        street: "147 Birch Court",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        country: "USA",
        phone: "+1234567896",
      },
      paymentMethod: "card",
      subtotal: 139.96,
      shipping: 6.0,
      tax: 11.2,
      discount: 0,
      total: 157.16,
      trackingNumber: "TRKFH007",
      estimatedDelivery: new Date(
        Date.now() - 9 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: "ORD-FH-008",
      userId: null,
      date: new Date().toISOString(), // Today
      status: "pending",
      items: [
        {
          id: 3,
          productId: 3,
          name: "Floral Summer Dress",
          quantity: 1,
          price: 59.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: summerDressImg,
        },
        {
          id: 9,
          productId: 9,
          name: "Denim Jacket",
          quantity: 1,
          price: 69.99,
          vendorId: 1,
          vendorName: "Fashion Hub",
          image: denimJacketImg,
        },
      ],
      vendorItems: [
        {
          vendorId: 1,
          vendorName: "Fashion Hub",
          items: [
            {
              id: 3,
              productId: 3,
              name: "Floral Summer Dress",
              quantity: 1,
              price: 59.99,
              image: summerDressImg,
            },
            {
              id: 9,
              productId: 9,
              name: "Denim Jacket",
              quantity: 1,
              price: 69.99,
              image: denimJacketImg,
            },
          ],
          subtotal: 129.98,
          shipping: 6.0,
          tax: 10.4,
          discount: 0,
        },
      ],
      shippingAddress: {
        name: "Grace Lee",
        street: "258 Spruce Avenue",
        city: "San Diego",
        state: "CA",
        zipCode: "92101",
        country: "USA",
        phone: "+1234567897",
      },
      paymentMethod: "card",
      subtotal: 129.98,
      shipping: 6.0,
      tax: 10.4,
      discount: 0,
      total: 146.38,
      trackingNumber: "TRKFH008",
      estimatedDelivery: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
  ];

  // Add orders that don't already exist
  const newOrders = dummyOrders.filter(
    (order) => !existingOrderIds.has(order.id)
  );

  if (newOrders.length > 0) {
    // Add orders using Zustand's set method
    useOrderStore.setState((state) => ({
      orders: [...state.orders, ...newOrders],
    }));

    // Record commissions for each new order
    const newCommissions = [];
    const newSettlements = [];
    const fashionHubVendor = getVendorById(1);
    const commissionRate = fashionHubVendor?.commissionRate || 10;

    newOrders.forEach((order) => {
      if (order.vendorItems && order.vendorItems.length > 0) {
        order.vendorItems.forEach((vendorItem) => {
          if (vendorItem.vendorId === 1) {
            // Calculate commission using vendor's commission rate
            const subtotal = vendorItem.subtotal;
            const commission = (subtotal * commissionRate) / 100;
            const vendorEarnings = subtotal - commission;

            // Create commission record
            const commissionRecord = {
              id: `COMM-${order.id}-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
              orderId: order.id,
              vendorId: 1,
              vendorName: "Fashion Hub",
              subtotal: subtotal,
              commission: commission,
              vendorEarnings: vendorEarnings,
              status: order.status === "delivered" ? "paid" : "pending",
              createdAt: order.date,
              paidAt: order.status === "delivered" ? order.date : null,
            };

            newCommissions.push(commissionRecord);

            // If paid, also create settlement record
            if (order.status === "delivered") {
              const settlement = {
                id: `SETTLE-${order.id}-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`,
                commissionId: commissionRecord.id,
                vendorId: 1,
                vendorName: "Fashion Hub",
                amount: vendorEarnings,
                paymentMethod: "bank_transfer",
                transactionId: `TXN-${order.id}`,
                notes: `Settlement for order ${order.id}`,
                createdAt: order.date,
              };

              newSettlements.push(settlement);
            }
          }
        });
      }
    });

    // Add commissions and settlements using Zustand's set method
    if (newCommissions.length > 0) {
      useCommissionStore.setState((state) => ({
        commissions: [...(state.commissions || []), ...newCommissions],
        settlements: [...(state.settlements || []), ...newSettlements],
      }));
    }
  }

  const finalOrderStore = useOrderStore.getState();
  const finalCommissionStore = useCommissionStore.getState();

  return {
    ordersAdded: newOrders.length,
    totalOrders: finalOrderStore.orders.length,
    commissionsAdded: (finalCommissionStore.commissions || []).filter(
      (c) => c.vendorId === 1
    ).length,
  };
};
