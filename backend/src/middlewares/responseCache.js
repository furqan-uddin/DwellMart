const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_MAX_ENTRIES = 500;

const cacheStore = new Map();

const getNow = () => Date.now();

const pruneExpiredEntries = (now = getNow()) => {
    for (const [key, entry] of cacheStore.entries()) {
        if (!entry || entry.expiresAt <= now) {
            cacheStore.delete(key);
        }
    }
};

const enforceMaxEntries = (maxEntries) => {
    while (cacheStore.size > maxEntries) {
        const oldestKey = cacheStore.keys().next().value;
        if (!oldestKey) break;
        cacheStore.delete(oldestKey);
    }
};

const buildDefaultCacheKey = (req) => req.originalUrl || req.url;

export const cacheResponse = ({
    ttlSeconds = DEFAULT_TTL_SECONDS,
    maxEntries = DEFAULT_MAX_ENTRIES,
    keyBuilder = buildDefaultCacheKey,
} = {}) => {
    const ttlMs = Math.max(1, Number(ttlSeconds) || DEFAULT_TTL_SECONDS) * 1000;
    const limit = Math.max(1, Number(maxEntries) || DEFAULT_MAX_ENTRIES);

    return (req, res, next) => {
        if (req.method !== 'GET') return next();

        const cacheKey = keyBuilder(req);
        if (!cacheKey) return next();

        const now = getNow();
        const cached = cacheStore.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            res.setHeader('x-cache', 'HIT');
            return res.status(cached.statusCode).json(cached.body);
        }

        if (cached) {
            cacheStore.delete(cacheKey);
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const responseNow = getNow();
                pruneExpiredEntries(responseNow);
                cacheStore.set(cacheKey, {
                    statusCode: res.statusCode,
                    body,
                    expiresAt: responseNow + ttlMs,
                });
                enforceMaxEntries(limit);
            }
            res.setHeader('x-cache', 'MISS');
            return originalJson(body);
        };

        next();
    };
};

export const clearResponseCache = () => {
    cacheStore.clear();
};
