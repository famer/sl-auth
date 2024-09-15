// db/redis.js
const Redis = require('ioredis');
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const redis = new Redis({
    host: REDIS_HOST
}); // Настройте параметры подключения по необходимости

module.exports = redis;
