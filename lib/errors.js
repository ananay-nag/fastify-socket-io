'use strict'

const createError = require('@fastify/error')

const FST_SOCKET_IO_DECORATOR_ALREADY_PRESENT = createError(
  'FST_SOCKET_IO_DECORATOR_ALREADY_PRESENT',
  "Fastify decorator '%s' already exists",
  500
)

const FST_SOCKET_IO_ROOT_DECORATOR_ALREADY_PRESENT = createError(
  'FST_SOCKET_IO_ROOT_DECORATOR_ALREADY_PRESENT',
  "Fastify decorator '%s' already exists",
  500
)

const FST_SOCKET_IO_INVALID_HOOK = createError(
  'FST_SOCKET_IO_INVALID_HOOK',
  "Invalid hook option '%s'. Supported values are 'onClose' and false",
  500
)

const FST_SOCKET_IO_INVALID_NAMESPACE = createError(
  'FST_SOCKET_IO_INVALID_NAMESPACE',
  'The namespace option must be a string starting with /',
  500
)

const FST_SOCKET_IO_INVALID_DECORATOR = createError(
  'FST_SOCKET_IO_INVALID_DECORATOR',
  'The decorate option must be a non-empty string',
  500
)

const FST_SOCKET_IO_INVALID_ROOT_DECORATOR = createError(
  'FST_SOCKET_IO_INVALID_ROOT_DECORATOR',
  'The rootDecorator option must be a non-empty string',
  500
)

const FST_SOCKET_IO_SAME_DECORATORS = createError(
  'FST_SOCKET_IO_SAME_DECORATORS',
  'decorate and rootDecorator must be different values',
  500
)

const FST_SOCKET_IO_MISSING_JWT_PLUGIN = createError(
  'FST_SOCKET_IO_MISSING_JWT_PLUGIN',
  'jwtAuth option requires @fastify/jwt to be registered on the fastify instance',
  500
)

module.exports = {
  FST_SOCKET_IO_DECORATOR_ALREADY_PRESENT,
  FST_SOCKET_IO_ROOT_DECORATOR_ALREADY_PRESENT,
  FST_SOCKET_IO_INVALID_HOOK,
  FST_SOCKET_IO_INVALID_NAMESPACE,
  FST_SOCKET_IO_INVALID_DECORATOR,
  FST_SOCKET_IO_INVALID_ROOT_DECORATOR,
  FST_SOCKET_IO_SAME_DECORATORS,
  FST_SOCKET_IO_MISSING_JWT_PLUGIN
}
