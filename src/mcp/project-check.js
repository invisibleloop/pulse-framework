/**
 * Pulse project detection — guards the MCP server against use in foreign projects.
 *
 * When the Pulse MCP server is registered globally in an agent host (Claude Code,
 * Copilot, Cursor…), it spawns in every workspace. An agent working in a React or
 * Rails repo then sees 25 inviting pulse_* tools and may start driving them against
 * a project that has nothing to do with Pulse. Every tool/resource handler checks
 * isPulseProject() first and refuses with a clear back-off message when the
 * workspace is not a Pulse project.
 */

import fs   from 'node:fs'
import path from 'node:path'

/**
 * True when `root` is a Pulse project (or a directory it is safe to treat as one).
 *
 * Markers, any one of which qualifies:
 *  - package.json depends on @invisibleloop/pulse (dependencies or devDependencies)
 *  - package.json IS @invisibleloop/pulse (the framework repo itself)
 *  - node_modules/@invisibleloop/pulse exists (covers npm link)
 *  - pulse.config.js / pulse.config.json exists
 *  - public/pulse-ui.css exists (scaffolded Pulse asset — covers sub-projects
 *    without their own package.json, e.g. a docs/ site driven via --root)
 *  - the directory is empty or near-empty (a fresh workspace the `pulse` CLI
 *    is about to scaffold — blocking here would break new-project creation)
 *
 * @param {string} root - absolute project root
 * @returns {boolean}
 */
export function isPulseProject(root) {
  try {
    // package.json markers
    const pkgPath = path.join(root, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg.name === '@invisibleloop/pulse') return true
        if (pkg.dependencies?.['@invisibleloop/pulse'])    return true
        if (pkg.devDependencies?.['@invisibleloop/pulse']) return true
      } catch { /* malformed package.json — fall through to other markers */ }
    }

    // Installed or npm-linked package
    if (fs.existsSync(path.join(root, 'node_modules', '@invisibleloop', 'pulse'))) return true

    // Pulse config file
    if (fs.existsSync(path.join(root, 'pulse.config.js')))   return true
    if (fs.existsSync(path.join(root, 'pulse.config.json'))) return true

    // Scaffolded Pulse asset — covers package.json-less sub-projects (docs/, examples/)
    if (fs.existsSync(path.join(root, 'public', 'pulse-ui.css'))) return true

    // Fresh/empty workspace — the `pulse` CLI scaffolds here; allow so the
    // new-project flow keeps working. "Near-empty" = nothing but dotfiles/README.
    const entries = fs.existsSync(root) ? fs.readdirSync(root) : []
    const meaningful = entries.filter(e => !e.startsWith('.') && e.toLowerCase() !== 'readme.md')
    if (meaningful.length === 0) return true

    return false
  } catch {
    // Detection must never crash the server — fail open (treat as Pulse project)
    // rather than breaking a legitimate session over an fs error.
    return true
  }
}

/**
 * Build the refusal message returned by every tool when the workspace is not a
 * Pulse project. Addressed to the agent: back off, use the project's own stack.
 *
 * @param {string} root
 * @returns {string}
 */
export function notPulseProjectMessage(root) {
  return [
    `⛔ NOT A PULSE PROJECT — Pulse MCP tools are disabled in this workspace.`,
    ``,
    `No Pulse markers were found in ${root} (no @invisibleloop/pulse dependency, no pulse.config, no Pulse assets). This workspace appears to use a different stack.`,
    ``,
    `Do NOT use Pulse tools, components, or spec patterns here, and do not retry this call — use the project's own framework and tooling instead.`,
    ``,
    `If the user actually wants a Pulse project: run the \`pulse\` CLI in an empty directory to scaffold one, or \`npm install @invisibleloop/pulse\` in this project. The tools activate automatically once a marker exists.`,
  ].join('\n')
}
