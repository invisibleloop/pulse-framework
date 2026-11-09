/**
 * Pulse — checks for WebMCP tool forms.
 *
 * WebMCP lets a page offer a form to an AI agent as a tool. The agent reads the tool's name,
 * description and parameters from the HTML, so a wrong or missing value here is a tool the agent
 * cannot use, or one it uses without the right information. This works on rendered HTML, because a
 * component can build the form.
 *
 * The attributes are `toolname`, `tooldescription`, `toolautosubmit` (on the <form>) and
 * `toolparamdescription` (on a field). The rules follow the WebMCP spec draft and Chrome's
 * declarative API page: a tool needs both a name and a description, and a name is 1 to 128 ASCII
 * letters, digits, `_`, `-` or `.`.
 */

const NAME_RULE = /^[A-Za-z0-9_.-]{1,128}$/

/** Read the attributes of one opening tag. A boolean attribute has the value ''. Names are lower-cased. */
function attributesOf(tag) {
  const attrs = {}
  const body = tag.replace(/^<\s*[a-zA-Z0-9-]+/, '').replace(/\/?>$/, '')
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let m
  while ((m = re.exec(body))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  return attrs
}

const NOT_A_PARAMETER = new Set(['hidden', 'submit', 'button', 'reset', 'image'])

/**
 * Find the problems with the WebMCP tool forms in rendered HTML.
 * Returns [] when the HTML has no tool form. Each problem is { level: 'error' | 'warn', message }.
 */
export function webMcpFormProblems(html) {
  const problems = []
  if (typeof html !== 'string' || !/\btool(?:name|description|autosubmit)\b/i.test(html)) return problems

  const seen = new Map()
  const formRe = /<form\b[^>]*>/gi
  let m
  while ((m = formRe.exec(html))) {
    const attrs = attributesOf(m[0])
    const hasName = 'toolname' in attrs
    const hasDesc = 'tooldescription' in attrs
    if (!hasName && !hasDesc && !('toolautosubmit' in attrs)) continue

    const label = hasName ? `\`${attrs.toolname}\`` : 'a form'
    if (hasName !== hasDesc) {
      problems.push({ level: 'error', message: `Form ${label} has \`${hasName ? 'toolname' : 'tooldescription'}\` but not \`${hasName ? 'tooldescription' : 'toolname'}\` — a tool needs both, or the browser does not register it` })
    }
    if (!hasName && !hasDesc) {
      problems.push({ level: 'error', message: '`toolautosubmit` on a form with no `toolname` and `tooldescription` — it does nothing' })
      continue
    }
    if (hasName) {
      if (!NAME_RULE.test(attrs.toolname)) {
        problems.push({ level: 'error', message: `\`toolname="${attrs.toolname}"\` is not a valid tool name — use 1 to 128 ASCII letters, digits, \`_\`, \`-\` or \`.\`` })
      } else if (seen.has(attrs.toolname)) {
        problems.push({ level: 'error', message: `Two forms use \`toolname="${attrs.toolname}"\` — a tool name must be unique on the page` })
      }
      seen.set(attrs.toolname, true)
    }
    if (hasDesc && attrs.tooldescription.trim() === '') {
      problems.push({ level: 'error', message: `Form ${label} has an empty \`tooldescription\` — the agent chooses a tool from this text, so say what the form does` })
    }

    const end = html.indexOf('</form>', m.index)
    const inner = html.slice(m.index + m[0].length, end === -1 ? html.length : end)

    const method = (attrs.method || 'get').toLowerCase()
    if ('toolautosubmit' in attrs && method !== 'get') {
      problems.push({ level: 'warn', message: `Form ${label} has \`toolautosubmit\` and method ${method.toUpperCase()} — an agent can submit it without the user clicking Submit. Keep it only if the action is safe to run unattended; otherwise remove \`toolautosubmit\` so the user confirms` })
    }

    const labelRanges = [...inner.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)].map(x => [x.index, x.index + x[0].length])
    const labelFor = new Set([...inner.matchAll(/<label\b[^>]*\bfor\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)].map(x => x[1] ?? x[2] ?? x[3]))
    const undescribed = []
    for (const c of inner.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)) {
      const a = attributesOf(c[0])
      if (NOT_A_PARAMETER.has((a.type || '').toLowerCase()) || !a.name) continue
      const described = ('toolparamdescription' in a && a.toolparamdescription.trim() !== '')
        || a['aria-label'] || a['aria-description'] || a['aria-labelledby']
        || (a.id && labelFor.has(a.id))
        || labelRanges.some(([s, e]) => c.index >= s && c.index < e)
      if (!described) undescribed.push(a.name)
    }
    if (undescribed.length) {
      problems.push({ level: 'warn', message: `Form ${label}: field${undescribed.length > 1 ? 's' : ''} ${undescribed.map(n => `\`${n}\``).join(', ')} ${undescribed.length > 1 ? 'have' : 'has'} no description — add \`toolparamdescription\`, or a \`<label>\`. The agent reads it to fill the field` })
    }
  }
  return problems
}

/** Number of forms that are WebMCP tools in rendered HTML. */
export function webMcpToolCount(html) {
  if (typeof html !== 'string') return 0
  return [...html.matchAll(/<form\b[^>]*>/gi)].filter(m => { const a = attributesOf(m[0]); return 'toolname' in a && 'tooldescription' in a }).length
}
