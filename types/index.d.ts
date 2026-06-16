import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import { Namespace, Server, ServerOptions, Socket, DefaultEventsMap } from 'socket.io'
import { Server as HttpServer } from 'node:http'
import { Server as HttpsServer } from 'node:https'
import { Http2SecureServer, Http2Server } from 'node:http2'

type SupportedServer = HttpServer | HttpsServer | Http2Server | Http2SecureServer
type SocketIOMiddleware = (socket: Socket, next: (err?: Error) => void) => void

export interface NamespaceRegistration<
  ListenEvents = DefaultEventsMap,
  EmitEvents = ListenEvents,
  ServerSideEvents = DefaultEventsMap,
  SocketData = any
> {
  middlewares?: SocketIOMiddleware[]
  connectionHandler?: (socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>) => void
}

export interface FastifySocketIOOptions<
  ListenEvents = DefaultEventsMap,
  EmitEvents = ListenEvents,
  ServerSideEvents = DefaultEventsMap,
  SocketData = any
> extends Partial<ServerOptions> {
  namespace?: string
  hook?: 'onClose' | false
  decorate?: string
  rootDecorator?: string
  server?: SupportedServer
  middlewares?: SocketIOMiddleware[]
  namespaces?: Record<string, NamespaceRegistration<ListenEvents, EmitEvents, ServerSideEvents, SocketData>>
  connectionHandler?: (socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>) => void
  preClose?: (io: Server<ListenEvents, EmitEvents, ServerSideEvents, SocketData>, fastify: FastifyInstance) => Promise<void> | void
  connectionStateRecovery?: boolean | object
  jwtAuth?: boolean
}

declare module 'fastify' {
  interface FastifyInstance {
    io: Server | Namespace
    socketIO: Server
  }
}

declare const plugin: FastifyPluginAsync<FastifySocketIOOptions>
export default plugin
export declare function fastifySocketIO<
  ListenEvents = DefaultEventsMap,
  EmitEvents = ListenEvents,
  ServerSideEvents = DefaultEventsMap,
  SocketData = any
>(fastify: FastifyInstance, opts: FastifySocketIOOptions<ListenEvents, EmitEvents, ServerSideEvents, SocketData>): Promise<void>
export declare function isSocketIOServer(value: unknown): value is Server
export declare function isSocketIONamespace(value: unknown): value is Namespace