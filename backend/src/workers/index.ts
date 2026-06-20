import { Worker, Job } from 'bullmq'
import { bullConnection } from '../lib/redis'

const connection = bullConnection

const exampleWorker = new Worker(
  'example',
  async (job: Job) => {
    console.log(`[worker] processing job ${job.id}`, job.data)
    // TODO: implement job logic
  },
  { connection }
)

exampleWorker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`)
})

exampleWorker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err)
})

export function startWorkers() {
  console.log('[workers] started')
}

export function stopWorkers() {
  return Promise.all([exampleWorker.close()])
}
