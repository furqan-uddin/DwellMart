const COUNTRY_DIAL_CODES = {
    india: '91',
    uae: '971',
    'united arab emirates': '971',
    usa: '1',
    'united states': '1',
    'united states of america': '1',
    canada: '1',
    uk: '44',
    'united kingdom': '44',
    saudiarabia: '966',
    'saudi arabia': '966',
    qatar: '974',
    oman: '968',
    kuwait: '965',
    bahrain: '973',
    pakistan: '92',
    bangladesh: '880',
    nepal: '977',
    singapore: '65',
    australia: '61',
    germany: '49',
    france: '33',
};

const normalizeCountryKey = (country = '') =>
    String(country || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

const inferDialCode = (country = '') => {
    const direct = COUNTRY_DIAL_CODES[normalizeCountryKey(country)];
    if (direct) return direct;

    const compact = normalizeCountryKey(country).replace(/\s+/g, '');
    return COUNTRY_DIAL_CODES[compact] || '';
};

const cleanDigits = (value = '') => String(value || '').replace(/[^\d+]/g, '');

export const normalizeToInternationalPhone = (rawPhone, country = '') => {
    const cleaned = cleanDigits(rawPhone);
    if (!cleaned) return '';

    if (cleaned.startsWith('+')) {
        const digits = cleaned.slice(1).replace(/\D/g, '');
        return digits ? `+${digits}` : '';
    }

    if (cleaned.startsWith('00')) {
        const digits = cleaned.slice(2).replace(/\D/g, '');
        return digits ? `+${digits}` : '';
    }

    const digitsOnly = cleaned.replace(/\D/g, '');
    if (!digitsOnly) return '';

    const inferredDialCode = inferDialCode(country);
    if (inferredDialCode) {
        const local = digitsOnly.startsWith(inferredDialCode)
            ? digitsOnly
            : digitsOnly.replace(/^0+/, '');
        return `+${local.startsWith(inferredDialCode) ? local : `${inferredDialCode}${local}`}`;
    }

    return `+${digitsOnly}`;
};
