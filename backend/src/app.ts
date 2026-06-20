import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { env } from './config/env'
import prismaPlugin from './plugins/prisma'
import swaggerPlugin from './plugins/swagger'
import clerkPlugin from './plugins/clerk'
import routes from './routes'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  })

  await app.register(helmet)
  await app.register(cors, { origin: true })

  await app.register(swaggerPlugin)
  await app.register(prismaPlugin)
  await app.register(clerkPlugin)

  await app.register(routes)

  return app
}
