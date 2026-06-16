'use strict'

const fp = require('fastify-plugin')
const { Server } = require('socket.io')
const { resolveServer } = require('./lib/server')
const {
  isSocketIOServer,
  isSocketIONamespace,
  validateOptions
} = require('./lib/utils')
const {
  FST_SOCKET_IO_DECORATOR_ALREADY_PRESENT,
  FST_SOCKET_IO_ROOT_DECORATOR_ALREADY_PRESENT,
  FST_SOCKET_IO_MISSING_JWT_PLUGIN
} = require('./lib/errors')

async function fastifySocketIO (fastify, opts) {
  /* c8 ignore next */
  const options = opts || {}
  const {
    namespace,
    hook = 'onClose',
    decorate = 'io',
    rootDecorator = 'socketIO',
    server,
    connectionHandler,
    middlewares,
    namespaces,
    preClose,
    connectionStateRecovery,
    jwtAuth,
    ...ioOptions
  } = options

  validateOptions(decorate, rootDecorator, hook, namespace)

  if (fastify.hasDecorator(decorate)) {
    throw new FST_SOCKET_IO_DECORATOR_ALREADY_PRESENT(decorate)
  }

  if (fastify.hasDecorator(rootDecorator)) {
    throw new FST_SOCKET_IO_ROOT_DECORATOR_ALREADY_PRESENT(rootDecorator)
  }

  const httpServer = resolveServer(fastify, server)

  if (connectionStateRecovery) {
    ioOptions.connectionStateRecovery = typeof connectionStateRecovery === 'object' ? connectionStateRecovery : {}
  }

  const io = new Server(httpServer, ioOptions)

  if (jwtAuth) {
    if (!fastify.jwt) {
      throw new FST_SOCKET_IO_MISSING_JWT_PLUGIN()
    }
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')
        if (!token) {
          return next(new Error('Authentication token missing'))
        }
        const decoded = fastify.jwt.verify(token)
        socket.data.user = decoded
        next()
      } catch (err) {
        next(err)
      }
    })
  }

  if (Array.isArray(middlewares)) {
    for (const middleware of middlewares) {
      io.use(middleware)
    }
  }

  if (namespaces && typeof namespaces === 'object') {
    for (const [name, config] of Object.entries(namespaces)) {
      const nsp = io.of(name)
      if (Array.isArray(config.middlewares)) {
        for (const middleware of config.middlewares) {
          nsp.use(middleware)
        }
      }
      if (typeof config.connectionHandler === 'function') {
        nsp.on('connection', config.connectionHandler)
      }
    }
  }

  if (typeof connectionHandler === 'function') {
    io.on('connection', connectionHandler)
  }

  const decoratedValue = namespace ? io.of(namespace) : io

  fastify.decorate(decorate, decoratedValue)
  fastify.decorate(rootDecorator, io)

  if (hook === 'onClose') {
    fastify.addHook('onClose', async function () {
      if (typeof preClose === 'function') {
        await preClose(io, fastify)
      }
      await io.close()
    })
  }
}

module.exports = fp(fastifySocketIO, {
  fastify: '5.x',
  name: '@ananay-nag/fastify-socket-io'
})
module.exports.default = fastifySocketIO
module.exports.fastifySocketIO = fastifySocketIO
module.exports.isSocketIOServer = isSocketIOServer
module.exports.isSocketIONamespace = isSocketIONamespace
