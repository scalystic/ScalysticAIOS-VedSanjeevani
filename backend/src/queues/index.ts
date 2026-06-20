import { Queue } from 'bullmq'
import { bullConnection } from '../lib/redis'

const connection = bullConnection

export const exampleQueue = new Queue('example', { connection })

// Add more queues here as features grow
// export const emailQueue = new Queue('email', { connection })
// export const aiQueue = new Queue('ai', { connection })
