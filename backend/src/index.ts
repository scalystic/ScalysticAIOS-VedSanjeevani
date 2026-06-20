import { buildApp } from './app'
import { env } from './config/env'
import { startWorkers, stopWorkers } from './workers'

async function main() {
  const app = await buildApp()

  startWorkers()

  const shutdown = async () => {
    app.log.info('shutting down...')
    await Promise.all([app.close(), stopWorkers()])
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
