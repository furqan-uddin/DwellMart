import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import * as TranslationService from '../services/translationService';

export const usePageTranslation = (staticTexts = [], sourceLang = 'en') => {
    const { language: targetLang, isChangingLanguage } = useLanguage();
    const [translations, setTranslations] = useState({});
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchTranslations = async () => {
            if (!staticTexts || staticTexts.length === 0) return;
            if (targetLang === sourceLang) {
                const mapping = {};
                staticTexts.forEach(t => mapping[t] = t);
                if (isMounted) setTranslations(mapping);
                return;
            }

            setIsTranslating(true);
            try {
                // translateBatch already handles resolving to cache first before hitting API
                const results = await TranslationService.translateBatch(staticTexts, targetLang, sourceLang);
                if (isMounted) {
                    const newMapping = {};
                    staticTexts.forEach((text, i) => {
                        newMapping[text] = results[i];
                    });
                    setTranslations(newMapping);
                }
            } catch (error) {
                console.error("Page translation error:", error);
            } finally {
                if (isMounted) setIsTranslating(false);
            }
        };

        fetchTranslations();

        return () => {
             isMounted = false;
        };
    }, [targetLang, sourceLang, isChangingLanguage, JSON.stringify(staticTexts)]);

    const getTranslatedText = useCallback((text) => {
        // Return translated if exists, else return original
        return translations[text] || text;
    }, [translations]);

    return { getTranslatedText, isTranslating, translations };
};
