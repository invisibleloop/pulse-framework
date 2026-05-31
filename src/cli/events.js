/**
 * Pulse CLI — shared event bus
 *
 * Decouples the HTTP server (which emits events) from the TUI renderer
 * (which consumes them). Also used by the logger in non-TUI mode.
 */

import { EventEmitter } from 'events'

export const bus = new EventEmitter()
bus.setMaxListeners(100)

// Event catalogue (for reference — not enforced):
//
//   request    { id, method, pathname, status, ms }
//   reload     { label }          — specs hot-reloaded
//   error      { msg, err? }      — server/spec error
//   info       { msg }
//   warn       { msg }
//   shutdown   { forced }
