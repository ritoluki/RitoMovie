/**
 * Simple in-memory cache with TTL support
 * Perfect for caching API responses from TMDB and PhimAPI
 * 
 * For production with multiple instances, consider using Redis
 */

interface CacheEntry<T> {
    value: T;
    expiry: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    keys: string[];
}

class MemoryCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private hits: number = 0;
    private misses: number = 0;
    private readonly maxSize: number;
    private readonly defaultTTL: number;

    /**
     * @param maxSize Maximum number of entries (default: 1000)
     * @param defaultTTL Default TTL in milliseconds (default: 5 minutes)
     */
    constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;

        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }

    /**
     * Get a value from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.value as T;
    }

    /**
     * Set a value in cache with optional TTL
     */
    set<T>(key: string, value: T, ttl?: number): void {
        // LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + (ttl ?? this.defaultTTL),
        });
    }

    /**
     * Get value from cache or fetch and cache it
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await fetcher();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Delete a specific key
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Delete all keys matching a pattern
     */
    deletePattern(pattern: string): number {
        const regex = new RegExp(pattern);
        let deleted = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deleted++;
            }
        }

        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Get hit ratio
     */
    getHitRatio(): number {
        const total = this.hits + this.misses;
        return total === 0 ? 0 : this.hits / total;
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Get remaining TTL for a key in milliseconds
     */
    getTTL(key: string): number | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        const remaining = entry.expiry - Date.now();
        return remaining > 0 ? remaining : null;
    }
}

// TTL constants
export const CACHE_TTL = {
    SHORT: 2 * 60 * 1000,        // 2 minutes - for frequently changing data
    MEDIUM: 5 * 60 * 1000,       // 5 minutes - default for API responses
    LONG: 15 * 60 * 1000,        // 15 minutes - for stable data
    HOUR: 60 * 60 * 1000,        // 1 hour - for rarely changing data
    DAY: 24 * 60 * 60 * 1000,    // 24 hours - for static data like genres
};

// Create singleton instances for different purposes
export const apiCache = new MemoryCache(500, CACHE_TTL.MEDIUM);     // For external API responses
export const homeCache = new MemoryCache(50, CACHE_TTL.MEDIUM);     // For home page batch data

export default MemoryCache;
