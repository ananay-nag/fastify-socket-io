'use strict'

const {
  FST_SOCKET_IO_INVALID_HOOK,
  FST_SOCKET_IO_INVALID_NAMESPACE,
  FST_SOCKET_IO_INVALID_DECORATOR,
  FST_SOCKET_IO_INVALID_ROOT_DECORATOR,
  FST_SOCKET_IO_SAME_DECORATORS
} = require('./errors')

function isSocketIOServer (value) {
  return Boolean(value) && typeof value.of === 'function' && typeof value.close === 'function'
}

function isSocketIONamespace (value) {
  return Boolean(value) && typeof value.emit === 'function' && typeof value.server !== 'undefined'
}

function validateOptions (decorate, rootDecorator, hook, namespace) {
  if (typeof decorate !== 'string' || decorate.length === 0) {
    throw new FST_SOCKET_IO_INVALID_DECORATOR()
  }

  if (typeof rootDecorator !== 'string' || rootDecorator.length === 0) {
    throw new FST_SOCKET_IO_INVALID_ROOT_DECORATOR()
  }

  if (hook !== 'onClose' && hook !== false) {
    throw new FST_SOCKET_IO_INVALID_HOOK(hook)
  }

  if (namespace !== undefined && (typeof namespace !== 'string' || namespace[0] !== '/')) {
    throw new FST_SOCKET_IO_INVALID_NAMESPACE()
  }

  if (decorate === rootDecorator) {
    throw new FST_SOCKET_IO_SAME_DECORATORS()
  }
}

module.exports = {
  isSocketIOServer,
  isSocketIONamespace,
  validateOptions
}
