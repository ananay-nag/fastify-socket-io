# @ananay-nag/fastify-socket-io

Fastify plugin for integrating Socket.IO with a Fastify server.

This plugin follows Fastify's plugin model based on `register`, encapsulation, decorators, and lifecycle hooks, and it uses `fastify-plugin` metadata for compatibility and naming.
Socket.IO exposes server options such as `path`, `serveClient`, `adapter`, `connectTimeout`, `pingTimeout`, `pingInterval`, `maxHttpBufferSize`, `transports`, `perMessageDeflate`, `httpCompression`, `cors`, `cookie`, and `allowEIO3`, and this plugin forwards those options to the underlying `Server` instance.

## Install

```bash
npm i @ananay-nag/fastify-socket-io socket.io
```

## Usage

```js
const fastify = require('fastify')()

fastify.register(require('@ananay-nag/fastify-socket-io'), {
  cors: {
    origin: ['https://example.com'],
    credentials: true
  },
  connectionHandler (socket) {
    socket.emit('hello', 'world')
  }
})

fastify.listen({ port: 3000 })
```

## Features

- Decorates Fastify with `fastify.io` and `fastify.socketIO`.
- Supports custom decorator names.
- Supports namespace decoration and eager namespace registration.
- Supports root and namespace Socket.IO middlewares.
- Supports graceful shutdown through `onClose`.
- **Connection State Recovery**: Temporarily stores messages when a client disconnects and restores them upon reconnection.
- **Fastify JWT Authentication Hook**: Natively validates tokens using `@fastify/jwt` globally before standard middlewares.
- **Strongly Typed Events (TypeScript)**: Strictly type events for emission, listening, server-side, and Socket data using built-in generics.
- Includes TypeScript declarations and integration tests.

## Advanced Usage

### JWT Authentication

Integrates flawlessly with `@fastify/jwt`. When `jwtAuth` is enabled, the plugin will look for the JWT in the Socket.IO `auth.token` payload or `Authorization: Bearer <token>` header, and attach the verified payload to `socket.data.user`.

```js
const fastify = require('fastify')()

fastify.register(require('@fastify/jwt'), { secret: 'supersecret' })

fastify.register(require('@ananay-nag/fastify-socket-io'), {
  jwtAuth: true,
  connectionHandler (socket) {
    fastify.log.info('Authenticated user:', socket.data.user)
  }
})
```

### Connection State Recovery

Easily enable Socket.IO's [Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery).

```js
fastify.register(require('@ananay-nag/fastify-socket-io'), {
  connectionStateRecovery: true // uses optimal defaults
})
```

### Strongly Typed Events (TypeScript)

Full intellisense and compiler safety for your sockets.

```typescript
import Fastify from 'fastify'
import fastifySocketIO from '@ananay-nag/fastify-socket-io'

interface ClientToServerEvents {
  hello: () => void;
}

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  user: { id: string };
}

const fastify = Fastify()

// fastify.io is strictly typed based on these generics!
fastify.register(fastifySocketIO<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>)
```

## License

MIT
