import fastify from 'fastify'
import fastifySocketIO from '..'
import { expectType } from 'tsd'
import { Server } from 'socket.io'

const app = fastify()

app.register(fastifySocketIO)

app.ready(err => {
  expectType<Server>(app.io)
  expectType<Server>(app.socketIO)
})

const app2 = fastify()

app2.register(fastifySocketIO, {
  decorator: 'custom',
  path: '/custom',
  cors: {
    origin: '*'
  }
})
