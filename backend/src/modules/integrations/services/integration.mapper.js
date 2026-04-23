import { normalizeToInternationalPhone } from '../utils/phoneFormatter.js';

const PAYMENT_MODE_MAP = {
    cod: 'COD',
    cash: 'COD',
    card: 'CARD',
    bank: 'BANK',
    wallet: 'WALLET',
    upi: 'UPI',
};

const resolvePaymentMode = (paymentMethod = '') => {
    const normalized = String(paymentMethod || '').trim().toLowerCase();
    return PAYMENT_MODE_MAP[normalized] || normalized.toUpperCase() || 'UNKNOWN';
};

export const mapOrderHeaderForPartner = (order) => {
    const shippingAddress = order?.shippingAddress || {};
    const country = String(shippingAddress.country || '').trim();
    const province = String(shippingAddress.state || '').trim();
    const rawPhone =
        String(shippingAddress.phone || '').trim() ||
        String(order?.guestInfo?.phone || '').trim();
    const normalizedPhone = normalizeToInternationalPhone(rawPhone, country);

    return {
        orderId: String(order?.orderId || ''),
        orderDate: order?.createdAt || null,
        customerName:
            String(shippingAddress.name || '').trim() ||
            String(order?.guestInfo?.name || '').trim() ||
            'Customer',
        phone: normalizedPhone,
        mobile: normalizedPhone,
        paymentMode: resolvePaymentMode(order?.paymentMethod),
        shippingAddress: {
            addressLine1: String(shippingAddress.address || '').trim(),
            addressLine2: String(shippingAddress.city || '').trim(),
            province,
            country,
            postalCode: String(shippingAddress.zipCode || '').trim(),
        },
        country,
        province,
    };
};

export const mapOrderItemsForPartner = ({ order, productCodeByProductId = new Map() }) => {
    const orderId = String(order?.orderId || '');
    return (order?.items || [])
        .map((item) => {
            const productId = String(item?.productId || '');
            const fallbackCode = productCodeByProductId.get(productId) || productId;
            return {
                orderId,
                itemCode: String(fallbackCode || ''),
                qty: Number(item?.quantity || 0),
            };
        })
        .filter((item) => item.itemCode && item.qty > 0);
};
