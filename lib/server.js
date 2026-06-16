'use strict'

function resolveServer (fastify, providedServer) {
  if (providedServer) return providedServer
  if (fastify.server) return fastify.server
  throw new Error('Unable to resolve HTTP server instance for Socket.IO')
}

module.exports = { resolveServer }
