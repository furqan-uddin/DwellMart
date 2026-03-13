/**
 * Generates a unique order ID: ORD-{timestamp}-{random4}
 */
export const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
};
