import React from 'react';
import useCurrency from '../hooks/useCurrency';

/**
 * Component to display a formatted price with automatic currency conversion
 * 
 * @param {number} amount - The amount in base currency (INR)
 * @param {string} className - Optional CSS classes
 */
const Price = ({ amount, className = '', prefix = '', suffix = '' }) => {
    const { formatPrice } = useCurrency();

    if (amount === undefined || amount === null) return null;

    return (
        <span className={className}>
            {prefix}{formatPrice(amount)}{suffix}
        </span>
    );
};

export default Price;
