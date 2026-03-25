import{a as e,b as m}from"./runtime-ZJ4FXT5O.js";import{ob as t}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s,h as n,i as r}from"./runtime-L2HNXIHW.js";import{a as i,b as d}from"./runtime-B73WLANC.js";var{prev:u,next:f}=s("/components/file-upload"),c={route:"/components/file-upload",meta:{title:"File Upload \u2014 Pulse Docs",description:"Drag-and-drop file upload zone component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{fileName:"",fileSize:""},mutations:{setFile:(o,p)=>{let l=p.target.files[0];return l?{fileName:l.name,fileSize:(l.size/1024).toFixed(1)+" KB"}:{fileName:"",fileSize:""}}},view:o=>m({currentHref:"/components/file-upload",prev:u,next:f,name:"fileUpload",description:'Drag-and-drop upload zone with a hidden <code>&lt;input type="file"&gt;</code>. Clicking or dropping files opens the picker. Requires <code>pulse-ui.js</code> for drag highlighting and click-to-open behaviour.',content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${e(t({name:"file",label:"Upload file",hint:"PNG, JPG, PDF up to 10 MB",event:"change:setFile"})+(o.fileName?`<p class="u-mt-3 u-text-sm">Selected: <strong>${o.fileName}</strong> (${o.fileSize})</p>`:""),"fileUpload({ name: 'file', label: 'Upload file', hint: 'PNG, JPG, PDF up to 10 MB', event: 'change:setFile' })",{col:!0})}

      <h2 class="doc-h2" id="accept">Accepted file types</h2>
      ${e(t({name:"avatar",label:"Profile photo",accept:"image/*",hint:"PNG or JPG"}),"fileUpload({ name: 'avatar', label: 'Profile photo', accept: 'image/*', hint: 'PNG or JPG' })",{col:!0})}

      <h2 class="doc-h2" id="multiple">Multiple files</h2>
      ${e(t({name:"docs",label:"Attachments",multiple:!0,hint:"Select one or more files"}),"fileUpload({ name: 'docs', label: 'Attachments', multiple: true, hint: 'Select one or more files' })",{col:!0})}

      <h2 class="doc-h2" id="error">Error state</h2>
      ${e(t({name:"file",label:"Upload file",error:"File must be under 10 MB"}),"fileUpload({ name: 'file', label: 'Upload file', error: 'File must be under 10 MB' })",{col:!0})}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${e(t({name:"file",label:"Upload file",disabled:!0,hint:"Uploads are currently unavailable"}),"fileUpload({ name: 'file', label: 'Upload file', disabled: true, hint: 'Uploads are currently unavailable' })",{col:!0})}

      <h2 class="doc-h2" id="with-action">Reading the file in an action</h2>
      <p class="u-mb-4 u-text-sm u-color-muted">Use the component inside a <code>&lt;form data-action="..."&gt;</code>. The file is available in FormData under <code>name</code>.</p>
      ${e(t({name:"attachment",label:"Attachment",accept:".pdf,.doc,.docx",required:!0}),`// view
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
}`,{col:!0})}

      <h2 class="doc-h2" id="with-mutation">Live file name via mutation</h2>
      <p class="u-mb-4 u-text-sm u-color-muted">Use <code>event: 'change:mutationName'</code> to capture the selected filename in state immediately \u2014 without a form submission.</p>
      ${e(t({name:"photo",label:"Photo",event:"change:setFile",accept:"image/*"}),`// state
{ fileName: '' }

// mutation \u2014 e.target.files[0] gives the File object
setFile: (state, e) => ({ fileName: e.target.files[0]?.name ?? '' })

// view
fileUpload({ name: 'photo', label: 'Photo', accept: 'image/*', event: 'change:setFile' })
\${state.fileName ? \`<p class="u-mt-2 u-text-sm">\${state.fileName}</p>\` : ''}`,{col:!0})}

      ${r("note","The file object itself cannot be stored in Pulse state \u2014 state must be serialisable. Store the filename or a preview URL (via <code>URL.createObjectURL</code>) instead, and upload the file in an action via FormData.")}

      ${n(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014","Field name \u2014 file available in FormData under this key"],["<code>label</code>","string","\u2014","Visible label text"],["<code>hint</code>","string","\u2014","Helper text, e.g. accepted types and max size"],["<code>error</code>","string","\u2014","Validation error message"],["<code>accept</code>","string","\u2014","Accepted MIME types or extensions, e.g. <code>image/*</code> or <code>.pdf,.docx</code>"],["<code>multiple</code>","boolean","false","Allow selecting multiple files"],["<code>required</code>","boolean","false",""],["<code>disabled</code>","boolean","false",""],["<code>event</code>","string","\u2014","data-event on the input \u2014 use <code>change:mutationName</code> to capture file selection in state"],["<code>id</code>","string","\u2014","Override the generated <code>id</code>"],["<code>class</code>","string","\u2014",""]])}
    `})};var a=document.getElementById("pulse-root");a&&!a.dataset.pulseMounted&&(a.dataset.pulseMounted="1",i(c,a,window.__PULSE_SERVER__||{},{ssr:!0}),d(a,i));var N=c;export{N as default};
