/**
 * Pulse — show untrusted text inside a Markdown code fence it cannot close.
 *
 * Text from a page, a spec or a file reaches the agent inside tool output. In a fixed ``` fence,
 * a "```" in that text ends the fence and what follows reads as the tool's own words. The fence
 * here is longer than any run of backticks inside the text, so it cannot be closed from within.
 */

/**
 * @param {unknown} value
 * @param {string} [lang] - info string after the opening fence ('js', 'html', 'text')
 * @returns {string}
 */
export function fenced(value, lang = 'text') {
  const text = String(value ?? '')
  const longest = Math.max(0, ...(text.match(/`+/g) || []).map(run => run.length))
  const fence = '`'.repeat(Math.max(3, longest + 1))
  return `${fence}${lang}\n${text}\n${fence}`
}
