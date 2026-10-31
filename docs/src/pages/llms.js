import { NAV } from '../lib/nav.js'

const ORIGIN = 'https://pulseframework.dev'

// A plain-text index of the docs for language models (the llms.txt convention), generated from the
// navigation so it cannot list a page that is not there.
export default {
  route:       '/llms.txt',
  contentType: 'text/plain; charset=utf-8',
  render: () => [
    '# Pulse',
    '',
    '> A spec-first frontend framework. The spec is the source of truth: one plain object per page holds its data, state, mutations, actions and view.',
    '',
    'Agents: running `pulse` in a project starts an MCP server with the full guide (the `pulse://guide` resources) and tools such as `pulse_validate`. The pages below are the human-readable docs.',
    '',
    ...NAV.flatMap(({ section, items }) => [
      `## ${section}`,
      '',
      ...items.map(item => `- [${item.label}](${ORIGIN}${item.href})${item.note ? `: ${item.note}` : ''}`),
      '',
    ]),
  ].join('\n'),
}
