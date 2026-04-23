import translate, { languageCodeMap } from '../config/googleCloud.js';

// Simple in-memory Cache with basic TTL
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map();

// Helper to auto-cleanup expired entries periodically to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }
}, 60 * 60 * 1000); // Check every hour

const getCacheKey = (text, targetLang, sourceLang) => {
    return `${sourceLang}_${targetLang}_${Buffer.from(text).toString('base64')}`;
};

// Retry wrapper with exponential backoff
const withRetry = async (fn, retries = 3) => {
    const delays = [1000, 2000, 4000];
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error) {
            // If rate limited or quota exceeded
            if (error.code === 429 || error.code === 403) {
                if (attempt === retries - 1) throw error; // throw on last attempt
                await new Promise(resolve => setTimeout(resolve, delays[attempt]));
                attempt++;
            } else {
                throw error; // throw immediately on other errors (like invalid auth)
            }
        }
    }
};

/**
 * Translate a single text string.
 */
export const translateText = async (text, targetLang, sourceLang = 'en') => {
    if (!text || typeof text !== 'string' || !text.trim()) return text;
    if (targetLang === sourceLang) return text;
    
    // Check normalize
    const target = languageCodeMap[targetLang] || targetLang;
    const source = languageCodeMap[sourceLang] || sourceLang;

    const cacheKey = getCacheKey(text, target, source);
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.translatedText;
        }
    }

    try {
        const [translation] = await withRetry(() => translate.translate(text, {
            from: source,
            to: target
        }));
        
        // Never cache translations that equal original text (might be an API error mask)
        // Wait, some words are identical in different languages. We might want to be careful.
        // But prompt explicitly says "Never cache translations that equal original text"
        if (translation !== text) {
            cache.set(cacheKey, {
                translatedText: translation,
                timestamp: Date.now()
            });
        }
        
        return translation;
    } catch (error) {
        console.error('Translation Error[translateText]:', error.message);
        return text; // Graceful fallback
    }
};

/**
 * Translate an array of text strings. Max 100 texts.
 */
export const translateBatch = async (texts, targetLang, sourceLang = 'en') => {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    
    const target = languageCodeMap[targetLang] || targetLang;
    const source = languageCodeMap[sourceLang] || sourceLang;
    
    const results = new Array(texts.length).fill(null);
    const toTranslate = [];
    const indexMap = [];

    // Check cache first
    texts.forEach((text, i) => {
        if (!text || typeof text !== 'string' || !text.trim()) {
            results[i] = text;
            return;
        }

        const cacheKey = getCacheKey(text, target, source);
        if (cache.has(cacheKey) && Date.now() - cache.get(cacheKey).timestamp < CACHE_TTL) {
            results[i] = cache.get(cacheKey).translatedText;
        } else {
            toTranslate.push(text);
            indexMap.push(i);
        }
    });

    if (toTranslate.length === 0) {
        return results;
    }

    try {
        const [translations] = await withRetry(() => translate.translate(toTranslate, {
            from: source,
            to: target
        }));

        const translatedArray = Array.isArray(translations) ? translations : [translations];

        translatedArray.forEach((translation, i) => {
            const originalIndex = indexMap[i];
            const originalText = toTranslate[i];
            
            results[originalIndex] = translation;

            if (translation !== originalText) {
                const cacheKey = getCacheKey(originalText, target, source);
                cache.set(cacheKey, {
                    translatedText: translation,
                    timestamp: Date.now()
                });
            }
        });

    } catch (error) {
        console.error('Translation Error[translateBatch]:', error.message);
        // Fallback to original texts for failed translations
        toTranslate.forEach((text, i) => {
            results[indexMap[i]] = text;
        });
    }

    return results;
};

/**
 * Translate specific properties of an object.
 */
export const translateObject = async (obj, targetLang, sourceLang = 'en', keysToTranslate = []) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (!keysToTranslate.length) return obj;

    const newObj = { ...obj };
    const textsToTranslate = [];
    const keyMap = [];

    keysToTranslate.forEach(key => {
        if (newObj[key] !== undefined && newObj[key] !== null) {
            textsToTranslate.push(String(newObj[key]));
            keyMap.push(key);
        }
    });

    if (textsToTranslate.length === 0) return newObj;

    const translatedArray = await translateBatch(textsToTranslate, targetLang, sourceLang);

    keyMap.forEach((key, i) => {
        newObj[key] = translatedArray[i];
    });

    return newObj;
};
