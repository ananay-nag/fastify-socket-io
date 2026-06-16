'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Fastify = require('fastify')
const { io: Client } = require('socket.io-client')
const plugin = require('../index')

test('decorates fastify with io and socketIO', async function () {
  const app = Fastify()

  await app.register(plugin)
  await app.ready()

  assert.ok(app.io)
  assert.ok(app.socketIO)
  assert.equal(app.io, app.socketIO)
  assert.equal(typeof app.io.of, 'function')

  await app.close()
})

test('supports namespace decoration', async function () {
  const app = Fastify()

  await app.register(plugin, { namespace: '/chat' })
  await app.ready()

  assert.ok(app.io)
  assert.ok(app.socketIO)
  assert.notEqual(app.io, app.socketIO)
  assert.equal(app.io.name, '/chat')

  await app.close()
})

test('supports custom decorator names', async function () {
  const app = Fastify()

  await app.register(plugin, {
    decorate: 'ws',
    rootDecorator: 'ioRoot'
  })
  await app.ready()

  assert.ok(app.ws)
  assert.ok(app.ioRoot)
  assert.equal(app.ws, app.ioRoot)

  await app.close()
})

test('throws when decorator already exists', async function () {
  const app = Fastify()
  app.decorate('io', {})

  await assert.rejects(async function () {
    await app.register(plugin)
    await app.ready()
  })

  await app.close()
})

test('throws when root decorator already exists', async function () {
  const app = Fastify()
  app.decorate('socketIO', {})

  await assert.rejects(async function () {
    await app.register(plugin)
    await app.ready()
  })

  await app.close()
})

test('throws for invalid namespace', async function () {
  const app = Fastify()

  await assert.rejects(async function () {
    await app.register(plugin, { namespace: 'chat' })
    await app.ready()
  })

  await app.close()
})

test('throws for invalid hook', async function () {
  const app = Fastify()

  await assert.rejects(async function () {
    await app.register(plugin, { hook: 'onReady' })
    await app.ready()
  })

  await app.close()
})

test('throws when decorate and rootDecorator are equal', async function () {
  const app = Fastify()

  await assert.rejects(async function () {
    await app.register(plugin, {
      decorate: 'io',
      rootDecorator: 'io'
    })
    await app.ready()
  })

  await app.close()
})

test('runs connectionHandler for client connection', async function () {
  const app = Fastify()
  let connected = false

  await app.register(plugin, {
    connectionHandler (socket) {
      connected = true
      socket.emit('welcome', { ok: true })
    }
  })

  await app.listen({ port: 0, host: '127.0.0.1' })
  const port = app.server.address().port

  const payload = await new Promise((resolve, reject) => {
    const client = new Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket']
    })

    client.on('welcome', function (data) {
      client.close()
      resolve(data)
    })

    client.on('connect_error', reject)
  })

  assert.equal(connected, true)
  assert.deepEqual(payload, { ok: true })

  await app.close()
})

test('applies root middlewares before connectionHandler', async function () {
  const app = Fastify()
  let middlewareRan = false

  await app.register(plugin, {
    middlewares: [function (socket, next) {
      socket.data.authenticated = true
      middlewareRan = true
      next()
    }],
    connectionHandler (socket) {
      socket.emit('state', { authenticated: socket.data.authenticated })
    }
  })

  await app.listen({ port: 0, host: '127.0.0.1' })
  const port = app.server.address().port

  const payload = await new Promise((resolve, reject) => {
    const client = new Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket']
    })

    client.on('state', function (data) {
      client.close()
      resolve(data)
    })

    client.on('connect_error', reject)
  })

  assert.equal(middlewareRan, true)
  assert.deepEqual(payload, { authenticated: true })

  await app.close()
})

test('supports namespace registrations with middleware and handler', async function () {
  const app = Fastify()

  await app.register(plugin, {
    namespaces: {
      '/room': {
        middlewares: [function (socket, next) {
          socket.data.roomReady = true
          next()
        }],
        connectionHandler (socket) {
          socket.emit('room:ready', { roomReady: socket.data.roomReady })
        }
      }
    }
  })

  await app.listen({ port: 0, host: '127.0.0.1' })
  const port = app.server.address().port

  const payload = await new Promise((resolve, reject) => {
    const client = new Client(`http://127.0.0.1:${port}/room`, {
      transports: ['websocket']
    })

    client.on('room:ready', function (data) {
      client.close()
      resolve(data)
    })

    client.on('connect_error', reject)
  })

  assert.deepEqual(payload, { roomReady: true })

  await app.close()
})

test('calls preClose hook before socket server shutdown', async function () {
  const app = Fastify()
  let preCloseCalled = false

  await app.register(plugin, {
    preClose: async function (io, fastify) {
      preCloseCalled = true
      assert.ok(io)
      assert.ok(fastify)
    }
  })

  await app.ready()
  await app.close()

  assert.equal(preCloseCalled, true)
})

test('supports disabling onClose hook', async function () {
  const app = Fastify()

  await app.register(plugin, { hook: false })
  await app.ready()

  assert.ok(app.io)
  assert.ok(app.socketIO)

  await app.close()
})

test('isSocketIOServer and isSocketIONamespace utilities', async function () {
  const app = Fastify()
  await app.register(plugin, { namespace: '/chat' })
  await app.ready()

  assert.equal(plugin.isSocketIOServer(app.socketIO), true)
  assert.equal(plugin.isSocketIONamespace(app.socketIO), false)

  assert.equal(plugin.isSocketIOServer(app.io), false)
  assert.equal(plugin.isSocketIONamespace(app.io), true)

  assert.equal(plugin.isSocketIOServer({}), false)
  assert.equal(plugin.isSocketIONamespace({}), false)

  await app.close()
})

test('throws if unable to resolve HTTP server', async function () {
  const { resolveServer } = require('../lib/server')
  assert.throws(
    () => resolveServer({}, null),
    new Error('Unable to resolve HTTP server instance for Socket.IO')
  )
})

test('throws for invalid decorator name', async function () {
  const app = Fastify()
  await assert.rejects(async function () {
    await app.register(plugin, { decorate: '' })
    await app.ready()
  })
  await app.close()
})

test('throws for invalid root decorator name', async function () {
  const app = Fastify()
  await assert.rejects(async function () {
    await app.register(plugin, { rootDecorator: '' })
    await app.ready()
  })
  await app.close()
})

test('configures connectionStateRecovery properly', async function () {
  const app = Fastify()

  await app.register(plugin, { connectionStateRecovery: true })
  await app.ready()

  assert.deepEqual(app.socketIO.opts.connectionStateRecovery, {
    maxDisconnectionDuration: 120000,
    skipMiddlewares: true
  })

  await app.close()
})

test('throws if jwtAuth is enabled but @fastify/jwt is missing', async function () {
  const app = Fastify()

  await assert.rejects(async function () {
    await app.register(plugin, { jwtAuth: true })
    await app.ready()
  }, { code: 'FST_SOCKET_IO_MISSING_JWT_PLUGIN' })

  await app.close()
})

test('jwtAuth rejects missing token', async function () {
  const app = Fastify()
  app.decorate('jwt', { verify: () => ({ id: 1 }) })

  await app.register(plugin, { jwtAuth: true })
  await app.listen({ port: 0, host: '127.0.0.1' })
  const port = app.server.address().port

  const err = await new Promise((resolve) => {
    const client = new Client(`http://127.0.0.1:${port}`, { transports: ['websocket'] })
    client.on('connect_error', resolve)
  })

  assert.equal(err.message, 'Authentication token missing')

  await app.close()
})

test('jwtAuth rejects invalid token (catch block)', async function () {
  const app = Fastify()
  app.decorate('jwt', { verify: () => { throw new Error('jwt malformed') } })

  await app.register(plugin, { jwtAuth: true })
  await app.listen({ port: 0, host: '127.0.0.1' })
  const port = app.server.address().port

  const err = await new Promise((resolve) => {
    const client = new Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      auth: { token: 'invalid' }
    })
    client.on('connect_error', resolve)
  })

  assert.equal(err.message, 'jwt malformed')

  await app.close()
})

test('jwtAuth accepts valid token', async function () {
  const app = Fastify()
  app.decorate('jwt', {
    verify: (token) => {
      if (token === 'valid') return { user: 'Ananay' }
      throw new Error('Invalid token')
    }
  })

  let authenticatedUser = null

  await app.register(plugin, {
    jwtAuth: true,
    connectionHandler (socket) {
      authenticatedUser = socket.data.user
      socket.emit('auth:success')
    }
  })

  await app.listen({ port: 0, host: '127.0.0.1' })
  const port = app.server.address().port

  await new Promise((resolve, reject) => {
    const client = new Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      auth: { token: 'valid' }
    })
    client.on('auth:success', () => {
      client.close()
      resolve()
    })
    client.on('connect_error', reject)
  })

  assert.deepEqual(authenticatedUser, { user: 'Ananay' })

  await app.close()
})
