/**
 * Pulse — confirming a tool call that sends something out or changes the machine.
 *
 * `pulse_report_issue` publishes a public GitHub issue and `pulse_update` installs a package. The
 * tool descriptions tell the model to ask the user first, but a model-supplied `confirmed: true` is
 * only the model saying so. Two things make the gate real:
 *
 *   1. A server-held, single-use nonce. The preview step issues it; the confirming call must
 *      present it, for the same subject, within a short time. It cannot be forged or recomputed (the
 *      old id was a hash of the payload: anyone who could read the preview could mint it), cannot
 *      be reused, and a confirmation for one report cannot send another.
 *   2. Where the client supports MCP elicitation, the user is asked directly, through the client's
 *      own UI, not through the model. Without it the nonce still stops forged and replayed
 *      confirmations, but a model that calls preview and then confirm back to back is only stopped
 *      by whatever approval prompt the host puts in front of tool calls.
 */

import crypto from 'crypto'

/** In-memory, per server process. */
export function createApprovals({ ttlMs = 10 * 60_000, now = Date.now } = {}) {
  const pending = new Map()
  const prune = () => { for (const [id, p] of pending) if (now() - p.at > ttlMs) pending.delete(id) }
  return {
    /** A new nonce for `kind`, valid for exactly `subject`. */
    issue(kind, subject) {
      prune()
      const id = crypto.randomBytes(12).toString('base64url')
      pending.set(id, { kind, subject, at: now() })
      return id
    },
    /** True once, and only for the kind and subject the nonce was issued for. */
    consume(kind, id, subject) {
      prune()
      const p = typeof id === 'string' ? pending.get(id) : undefined
      if (!p) return false
      pending.delete(id)        // single use, whatever the outcome
      return p.kind === kind && p.subject === subject
    },
  }
}

/**
 * Ask the user directly. Resolves 'approved', 'declined', or 'unsupported' when the client does not
 * implement elicitation (the caller then falls back to the nonce alone).
 * @param {{ server: { getClientCapabilities?: Function, elicitInput?: Function } }} mcpServer
 */
export async function askUser(mcpServer, message) {
  const capabilities = mcpServer?.server?.getClientCapabilities?.()
  if (!capabilities?.elicitation) return 'unsupported'
  try {
    const answer = await mcpServer.server.elicitInput({
      message,
      requestedSchema: {
        type: 'object',
        properties: { approve: { type: 'boolean', title: 'Approve', description: 'Yes, go ahead exactly as described above' } },
        required: ['approve'],
      },
    })
    return answer?.action === 'accept' && answer.content?.approve === true ? 'approved' : 'declined'
  } catch {
    return 'declined'      // the client advertised elicitation but the request failed: do not proceed
  }
}
