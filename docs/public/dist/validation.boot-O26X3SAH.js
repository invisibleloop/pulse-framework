import{a as r}from"./runtime-QFURDKA2.js";import{a as s,b as l,c as n,d as c,e,g as t,h as o,i as u}from"./runtime-OFZXJMSU.js";import{a as i,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:f}=s("/validation"),d={route:"/validation",meta:{title:"Validation \u2014 Pulse Docs",description:"Declarative validation rules in Pulse \u2014 syntax, formats, dot-path notation, and error handling.",styles:["/docs.css"]},state:{},view:()=>l({currentHref:"/validation",prev:p,next:f,content:`
      ${n("Validation")}
      ${c("Validation rules are declared in the spec, co-located with the state they guard. When an action sets <code>validate: true</code>, Pulse enforces every rule before the async work runs. Invalid data cannot reach <code>run()</code>.")}

      ${e("declaring","Declaring validation rules")}
      <p>The <code>validation</code> field maps dot-path state keys to rule objects:</p>
      ${t(r(`export default {
  route: '/signup',
  state: {
    fields: { name: '', email: '', age: '', website: '' },
  },
  validation: {
    'fields.name':    { required: true, minLength: 2, maxLength: 100 },
    'fields.email':   { required: true, format: 'email' },
    'fields.age':     { required: true, min: 18, max: 120 },
    'fields.website': { format: 'url' },   // optional field, but must be valid URL if provided
  },
  // ...
}`,"js"))}

      ${e("rules","Available rules")}
      ${o(["Rule","Type","Description"],[["<code>required</code>","<code>boolean</code>","Field must be present and non-empty."],["<code>minLength</code>","<code>number</code>","String must be at least N characters."],["<code>maxLength</code>","<code>number</code>","String must be at most N characters."],["<code>min</code>","<code>number</code>","Numeric value must be \u2265 N."],["<code>max</code>","<code>number</code>","Numeric value must be \u2264 N."],["<code>pattern</code>","<code>RegExp | string</code>","Value must match the regular expression."],["<code>format</code>","<code>string</code>","Named format: <code>email</code>, <code>url</code>, or <code>numeric</code>."]])}

      ${e("formats","Named formats")}
      ${o(["Format","What it checks"],[["<code>email</code>","Basic email structure \u2014 must contain <code>@</code> and a domain."],["<code>url</code>","Must start with <code>http://</code> or <code>https://</code>."],["<code>numeric</code>","Must consist entirely of digit characters."]])}

      ${e("dot-paths","Dot-path notation")}
      <p>Validation keys are dot-paths into the current <code>state</code>, allowing nested fields to be validated without any special syntax:</p>
      ${t(r(`state: {
  billing: {
    address: { street: '', city: '', postcode: '' },
    card:    { number: '', expiry: '' },
  },
}

validation: {
  'billing.address.street':   { required: true },
  'billing.address.city':     { required: true },
  'billing.address.postcode': { required: true, pattern: /^[A-Z]{1,2}\\d[A-Z\\d]? \\d[A-Z]{2}$/i },
  'billing.card.number':      { required: true, format: 'numeric', minLength: 16, maxLength: 16 },
  'billing.card.expiry':      { required: true },
}`,"js"))}

      ${e("when-runs","When validation runs")}
      <p>Validation only runs when an action declares <code>validate: true</code>. The order is enforced by the framework:</p>
      <ol>
        <li><code>onStart</code> captures <code>FormData</code> values into state</li>
        <li>Validation reads those values from state using dot-paths</li>
        <li>If any rules fail, <code>onError</code> is called immediately \u2014 <code>run</code> is skipped</li>
      </ol>
      ${u("note","Validation reads from <strong>state</strong>, not from raw <code>FormData</code>. <code>onStart</code> must copy form values into state first \u2014 this is what makes them available to dot-path rules.")}

      ${e("error-structure","Error structure")}
      <p>When validation fails, the runtime throws an error object with a <code>validation</code> array:</p>
      ${t(r(`{
  message: 'Validation failed',
  validation: [
    { field: 'fields.email',   rule: 'format',   message: 'Must be a valid email address' },
    { field: 'fields.name',    rule: 'required',  message: 'Required' },
    { field: 'fields.age',     rule: 'min',       message: 'Must be at least 18' },
  ]
}`,"js"))}
      <p>In your action's <code>onError</code>, check for <code>err?.validation</code> to distinguish validation errors from other failures:</p>
      ${t(r(`onError: (state, err) => ({
  status: 'error',
  errors: err?.validation ?? [{ message: err.message }],
})`,"js"))}

      ${e("rendering","Rendering errors")}
      <p>The errors array maps to UI in the view \u2014 a global error list, or inline errors using the <code>field</code> property to place them next to each input:</p>
      ${t(r(`view: (state) => {
  const errFor = (field) => {
    const e = state.errors.find(e => e.field === field)
    return e ? \`<p class="field-error">\${e.message}</p>\` : ''
  }

  return \`
    <form data-action="submit">
      <label>
        Email
        <input name="email" type="email" value="\${state.fields.email}">
        \${errFor('fields.email')}
      </label>
      <label>
        Name
        <input name="name" type="text" value="\${state.fields.name}">
        \${errFor('fields.name')}
      </label>
      <button>Submit</button>
    </form>
  \`
}`,"js"))}

      ${e("optional-fields","Optional fields")}
      <p>Omit <code>required: true</code> for optional fields. Other rules (format, minLength, etc.) are only enforced when the field has a value \u2014 empty optional fields always pass:</p>
      ${t(r(`validation: {
  // website is optional, but must be a valid URL if provided
  'fields.website': { format: 'url' },
}`,"js"))}
    `})};var a=document.getElementById("pulse-root");a&&!a.dataset.pulseMounted&&(a.dataset.pulseMounted="1",i(d,a,window.__PULSE_SERVER__||{},{ssr:!0}),m(a,i));var q=d;export{q as default};
