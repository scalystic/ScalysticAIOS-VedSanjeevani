import { FastifyPluginAsync } from 'fastify'
import healthRoutes from './health'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(healthRoutes, { prefix: '/api/v1' })
}

export default routes
