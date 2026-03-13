import Product from '../models/Product.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Validate and deduct stock for order items
 * @param {Array} items - [{ productId, quantity }]
 * @returns {Array} enriched items with product data
 */
export const validateAndDeductStock = async (items) => {
    const enriched = [];

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);
        if (product.stock === 'out_of_stock') throw new ApiError(400, `${product.name} is out of stock.`);
        if (product.stockQuantity < item.quantity) throw new ApiError(400, `Only ${product.stockQuantity} units of ${product.name} available.`);

        product.stockQuantity -= item.quantity;
        if (product.stockQuantity <= 0) product.stock = 'out_of_stock';
        else if (product.stockQuantity <= product.lowStockThreshold) product.stock = 'low_stock';
        else product.stock = 'in_stock';
        await product.save();

        enriched.push({ ...item, product });
    }

    return enriched;
};

/**
 * Restore stock when an order is cancelled
 */
export const restoreStock = async (items) => {
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        product.stockQuantity += item.quantity;
        if (product.stockQuantity > 0) product.stock = product.stockQuantity <= product.lowStockThreshold ? 'low_stock' : 'in_stock';
        await product.save();
    }
};
