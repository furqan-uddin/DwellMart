const DB_NAME = 'dwellmart_translation_db';
const STORE_NAME = 'translations';
const DB_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class TranslationCache {
    constructor() {
        this.db = null;
        this.initPromise = this.initDB();
    }

    async initDB() {
        if (typeof window === 'undefined') return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                resolve(null); // Fail gracefully, fallback to memory or none
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };
        });
    }

    async getCache(key) {
        await this.initPromise;
        if (!this.db) {
            // Fallback to localStorage
            try {
                const item = localStorage.getItem(`trans_${key}`);
                if (item) {
                    const parsed = JSON.parse(item);
                    if (Date.now() - parsed.timestamp < CACHE_TTL) {
                        return parsed.value;
                    }
                    localStorage.removeItem(`trans_${key}`);
                }
            } catch (e) { }
            return null;
        }

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result && (Date.now() - result.timestamp < CACHE_TTL)) {
                        resolve(result.value);
                    } else if (result) {
                        // Expired
                        this.deleteCache(key);
                        resolve(null);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => resolve(null);
            } catch(error) {
                resolve(null);
            }
        });
    }

    async setCache(key, value, originalText) {
        // Never cache translations where translation === original
        if (value === originalText) return;
        
        await this.initPromise;
        const entry = { key, value, timestamp: Date.now() };

        if (!this.db) {
            try {
                localStorage.setItem(`trans_${key}`, JSON.stringify(entry));
            } catch (e) {
                // Quota exceeded or LS disabled
            }
            return;
        }

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(entry);

                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
            } catch(e) {
                resolve();
            }
        });
    }

    async deleteCache(key) {
        if (!this.db) {
            localStorage.removeItem(`trans_${key}`);
            return;
        }
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(key);
            transaction.oncomplete = () => resolve();
        });
    }
}

export const translationCache = new TranslationCache();
