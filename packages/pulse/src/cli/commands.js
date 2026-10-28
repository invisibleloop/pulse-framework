/**
 * Pulse — slash commands for the agent.
 *
 * Two sets live in the package:
 *   src/agent/commands/           the built-ins (/pulse-dev, /verify, ...). Every project gets them,
 *                                 and `pulse update` and `pulse dev` keep them current.
 *   src/agent/optional-commands/  commands that depend on a third-party service or credentials.
 *                                 Never scaffolded. A project opts in with `pulse add-command <name>`;
 *                                 after that `pulse update` and `pulse dev` refresh it like the rest.
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const BUILT_IN = fileURLToPath(new URL('../agent/commands', import.meta.url))
const OPTIONAL = fileURLToPath(new URL('../agent/optional-commands', import.meta.url))

const markdownFiles = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')) : []

/** Names (without .md) of the optional commands this version of Pulse offers. */
export function optionalCommandNames() {
  return markdownFiles(OPTIONAL).map(f => f.replace(/\.md$/, ''))
}

/**
 * The commands to copy into a project's .claude/commands/: every built-in, plus each optional one
 * the project already has (that is how a project opts in, see addCommand).
 * @returns {{ file: string, src: string }[]}
 */
export function commandsToSync(projectRoot) {
  const dst = path.join(projectRoot, '.claude', 'commands')
  return [
    ...markdownFiles(BUILT_IN).map(file => ({ file, src: path.join(BUILT_IN, file) })),
    ...markdownFiles(OPTIONAL)
      .filter(file => fs.existsSync(path.join(dst, file)))
      .map(file => ({ file, src: path.join(OPTIONAL, file) })),
  ]
}

/**
 * Opt a project in to an optional command. Returns the path written; throws for an unknown name.
 */
export function addCommand(projectRoot, name) {
  const available = optionalCommandNames()
  if (!available.includes(name)) {
    throw new Error(`Unknown command "${name}". Optional commands: ${available.join(', ') || '(none)'}.`)
  }
  const dst = path.join(projectRoot, '.claude', 'commands', `${name}.md`)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.copyFileSync(path.join(OPTIONAL, `${name}.md`), dst)
  return dst
}
