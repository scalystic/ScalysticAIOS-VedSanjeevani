import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { clerkPlugin } from '@clerk/fastify'
import { env } from '../config/env'

const clerkAuthPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(clerkPlugin, {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  })
})

export default clerkAuthPlugin
