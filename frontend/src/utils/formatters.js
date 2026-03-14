/**
 * Utility functions for formatting data in the frontend.
 */

/**
 * Formats a number as a currency string based on system settings.
 * @param {number} amount - The numeric amount to format.
 * @param {string} currencyCode - The currency code (e.g., 'SAR', 'USD').
 * @param {string} currencySymbol - The symbol to display (if any).
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount, currencyCode = 'SAR', currencySymbol = 'ر.س') => {
    const value = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    
    // In many RTL cases like Arabic, the symbol comes after the number
    // We can handle this based on language too, but let's keep it simple for now.
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currencySymbol}`;
};

/**
 * Alias for formatCurrency specifically for product prices.
 */
export const formatPrice = formatCurrency;

/**
 * Formats a date string.
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
};
