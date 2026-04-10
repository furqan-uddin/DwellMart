const INDIA_ALIASES = new Set(['india', 'in', 'ind', 'bharat']);

export const normalizeCountry = (country = '') =>
    String(country || '')
        .trim()
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, ' ');

export const getGatewayForCountry = (country = '') =>
    INDIA_ALIASES.has(normalizeCountry(country)) ? 'razorpay' : 'stripe';

export default getGatewayForCountry;
