import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

export const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
};

export const setCache = async (key, value, expireTime = 3600) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', expireTime);
        return true;
    } catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
};

export const deleteCache = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Redis delete error:', error);
        return false;
    }
};

export default redis; 