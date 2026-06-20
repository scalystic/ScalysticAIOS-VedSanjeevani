import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

const swaggerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'VedSanjeevani API',
        description: 'VedSanjeevani AIOS Backend API',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { deepLinking: false },
  })
})

export default swaggerPlugin
