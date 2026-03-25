import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { fileUpload } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/file-upload')

export default {
  route: '/components/file-upload',
  meta: {
    title: 'File Upload — Pulse Docs',
    description: 'Drag-and-drop file upload zone component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: { fileName: '', fileSize: '' },
  mutations: {
    setFile: (state, e) => {
      const file = e.target.files[0]
      return file
        ? { fileName: file.name, fileSize: (file.size / 1024).toFixed(1) + ' KB' }
        : { fileName: '', fileSize: '' }
    },
  },
  view: (state) => renderComponentPage({
    currentHref: '/components/file-upload',
    prev,
    next,
    name: 'fileUpload',
    description: 'Drag-and-drop upload zone with a hidden <code>&lt;input type="file"&gt;</code>. Clicking or dropping files opens the picker. Requires <code>pulse-ui.js</code> for drag highlighting and click-to-open behaviour.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${demo(
        fileUpload({ name: 'file', label: 'Upload file', hint: 'PNG, JPG, PDF up to 10 MB', event: 'change:setFile' }) +
        (state.fileName ? `<p class="u-mt-3 u-text-sm">Selected: <strong>${state.fileName}</strong> (${state.fileSize})</p>` : ''),
        `fileUpload({ name: 'file', label: 'Upload file', hint: 'PNG, JPG, PDF up to 10 MB', event: 'change:setFile' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="accept">Accepted file types</h2>
      ${demo(
        fileUpload({ name: 'avatar', label: 'Profile photo', accept: 'image/*', hint: 'PNG or JPG' }),
        `fileUpload({ name: 'avatar', label: 'Profile photo', accept: 'image/*', hint: 'PNG or JPG' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="multiple">Multiple files</h2>
      ${demo(
        fileUpload({ name: 'docs', label: 'Attachments', multiple: true, hint: 'Select one or more files' }),
        `fileUpload({ name: 'docs', label: 'Attachments', multiple: true, hint: 'Select one or more files' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="error">Error state</h2>
      ${demo(
        fileUpload({ name: 'file', label: 'Upload file', error: 'File must be under 10 MB' }),
        `fileUpload({ name: 'file', label: 'Upload file', error: 'File must be under 10 MB' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${demo(
        fileUpload({ name: 'file', label: 'Upload file', disabled: true, hint: 'Uploads are currently unavailable' }),
        `fileUpload({ name: 'file', label: 'Upload file', disabled: true, hint: 'Uploads are currently unavailable' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="with-action">Reading the file in an action</h2>
      <p class="u-mb-4 u-text-sm u-color-muted">Use the component inside a <code>&lt;form data-action="..."&gt;</code>. The file is available in FormData under <code>name</code>.</p>
      ${demo(
        fileUpload({ name: 'attachment', label: 'Attachment', accept: '.pdf,.doc,.docx', required: true }),
        `// view
\`<form data-action="upload" class="u-flex u-flex-col u-gap-4">
  \${fileUpload({ name: 'attachment', label: 'Attachment', accept: '.pdf,.doc,.docx', required: true })}
  \${button({ label: 'Upload', type: 'submit', variant: 'primary' })}
</form>\`

// action
upload: {
  onStart: (state) => ({ status: 'loading' }),
  run: async (state, serverState, formData) => {
    const file = formData.get('attachment') // File object
    // process file...
  },
  onSuccess: (state) => ({ status: 'success' }),
  onError:   (state, err) => ({ status: 'error', message: err.message }),
}`,
        { col: true }
      )}

      <h2 class="doc-h2" id="with-mutation">Live file name via mutation</h2>
      <p class="u-mb-4 u-text-sm u-color-muted">Use <code>event: 'change:mutationName'</code> to capture the selected filename in state immediately — without a form submission.</p>
      ${demo(
        fileUpload({ name: 'photo', label: 'Photo', event: 'change:setFile', accept: 'image/*' }),
        `// state
{ fileName: '' }

// mutation — e.target.files[0] gives the File object
setFile: (state, e) => ({ fileName: e.target.files[0]?.name ?? '' })

// view
fileUpload({ name: 'photo', label: 'Photo', accept: 'image/*', event: 'change:setFile' })
\${state.fileName ? \`<p class="u-mt-2 u-text-sm">\${state.fileName}</p>\` : ''}`,
        { col: true }
      )}

      ${callout('note', 'The file object itself cannot be stored in Pulse state — state must be serialisable. Store the filename or a preview URL (via <code>URL.createObjectURL</code>) instead, and upload the file in an action via FormData.')}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>name</code>',     'string',  '—',     'Field name — file available in FormData under this key'],
          ['<code>label</code>',    'string',  '—',     'Visible label text'],
          ['<code>hint</code>',     'string',  '—',     'Helper text, e.g. accepted types and max size'],
          ['<code>error</code>',    'string',  '—',     'Validation error message'],
          ['<code>accept</code>',   'string',  '—',     'Accepted MIME types or extensions, e.g. <code>image/*</code> or <code>.pdf,.docx</code>'],
          ['<code>multiple</code>', 'boolean', 'false', 'Allow selecting multiple files'],
          ['<code>required</code>', 'boolean', 'false', ''],
          ['<code>disabled</code>', 'boolean', 'false', ''],
          ['<code>event</code>',    'string',  '—',     'data-event on the input — use <code>change:mutationName</code> to capture file selection in state'],
          ['<code>id</code>',       'string',  '—',     'Override the generated <code>id</code>'],
          ['<code>class</code>',    'string',  '—',     ''],
        ]
      )}
    `,
  }),
}
