import { Translate } from '@google-cloud/translate/build/src/v2/index.js';
import dotenv from 'dotenv';

dotenv.config();

// We are using API Key authentication as requested
const translate = new Translate({
    key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY || 'dummy_key_for_now'
});

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

export const rtlLanguages = ['ar', 'he', 'ur', 'fa'];

export default translate;
