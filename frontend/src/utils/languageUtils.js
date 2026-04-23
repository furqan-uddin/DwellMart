export const languageCodeMap = {
    // English
    en: 'en',
    // RTL Languages
    ar: 'ar',
    he: 'he',
    ur: 'ur',
    fa: 'fa',
    // Other common languages
    es: 'es',
    fr: 'fr',
    de: 'de',
    hi: 'hi',
    zh: 'zh-CN',
    ja: 'ja',
    ru: 'ru',
    pt: 'pt'
};

export const normalizeLanguageCode = (locale) => {
    if (!locale) return 'en';
    const base = locale.split('-')[0].toLowerCase();
    
    // Specifically handle zh-CN / zh-TW if needed, otherwise fallback to map
    if (locale.toLowerCase() === 'zh-cn') return 'zh-CN';
    if (locale.toLowerCase() === 'zh-tw') return 'zh-TW';
    
    return languageCodeMap[base] || languageCodeMap[locale] || 'en';
};

export const isRTL = (langCode) => {
    const code = normalizeLanguageCode(langCode);
    return ['ar', 'he', 'ur', 'fa'].includes(code);
};

export const getCacheKeyParams = (text, targetLang, sourceLang = 'en') => {
    const target = normalizeLanguageCode(targetLang);
    const source = normalizeLanguageCode(sourceLang);
    return `${source}_${target}_${btoa(unescape(encodeURIComponent(text)))}`; // Safe base64 encoding
};
