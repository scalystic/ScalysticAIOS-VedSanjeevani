import Redis from 'ioredis'
import { env } from '../config/env'

// Shared Redis client for general use (caching, pub/sub, etc.)
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
})

// Dedicated connection for BullMQ — must have maxRetriesPerRequest: null
export const bullConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
})

redis.on('error', (err) => console.error('[redis] error', err))
bullConnection.on('error', (err) => console.error('[bull-redis] error', err))
