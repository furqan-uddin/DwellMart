import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import * as TranslationService from '../services/translationService';

export const useDynamicTranslation = (config = {}) => {
    const { language: currentTarget } = useLanguage();
    const sourceLang = config.sourceLang || 'en';
    const targetLang = config.targetLang || currentTarget;

    const [isTranslating, setIsTranslating] = useState(false);

    const translate = useCallback(async (text) => {
        setIsTranslating(true);
        try {
            return await TranslationService.translateText(text, targetLang, sourceLang);
        } finally {
            setIsTranslating(false);
        }
    }, [targetLang, sourceLang]);

    const translateBatch = useCallback(async (texts) => {
        setIsTranslating(true);
        try {
            return await TranslationService.translateBatch(texts, targetLang, sourceLang);
        } finally {
            setIsTranslating(false);
        }
    }, [targetLang, sourceLang]);

    const translateObject = useCallback(async (obj, keys) => {
        setIsTranslating(true);
        try {
            return await TranslationService.translateObject(obj, targetLang, sourceLang, keys);
        } finally {
            setIsTranslating(false);
        }
    }, [targetLang, sourceLang]);

    const translateArray = useCallback(async (items, keys) => {
        if (!Array.isArray(items) || items.length === 0) return items;
        setIsTranslating(true);
        try {
            return await Promise.all(items.map(item => TranslationService.translateObject(item, targetLang, sourceLang, keys)));
        } finally {
            setIsTranslating(false);
        }
    }, [targetLang, sourceLang]);

    return { 
        translateText: translate, 
        t: translate,
        translateBatch, 
        translateObject,
        translateArray,
        isTranslating 
    };
};
