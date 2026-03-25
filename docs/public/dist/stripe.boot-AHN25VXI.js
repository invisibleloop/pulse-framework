import{a as t}from"./runtime-QFURDKA2.js";import{a as c,b as a,c as u,d as p,e as r,g as e,h as d,i as o}from"./runtime-OFZXJMSU.js";import{a as n,b as h}from"./runtime-B73WLANC.js";var{prev:l,next:m}=c("/stripe"),i={route:"/stripe",meta:{title:"Payments (Stripe) \u2014 Pulse Docs",description:"Integrating Stripe Checkout and webhooks with Pulse using actions, raw response specs, and server data fetchers.",styles:["/docs.css"]},state:{},view:()=>a({currentHref:"/stripe",prev:l,next:m,content:`
      ${u("Payments (Stripe)")}
      ${p("Pulse uses Stripe's hosted Checkout \u2014 no client-side Stripe JS required. Checkout sessions are created server-side in an action's <code>run</code> function. Stripe handles the payment UI entirely. Webhooks are verified and handled through a raw response spec.")}

      ${o("info","Pulse has no external client-side JS. Use Stripe's hosted Checkout page (redirect flow) rather than Stripe Elements, which requires loading Stripe's client library.")}

      ${r("setup","Setup")}
      ${e(t("npm install stripe","bash"))}
      ${e(t(`# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=http://localhost:3000`,"bash"))}

      ${r("checkout","Checkout action")}
      <p>Create a Stripe Checkout session in an action's <code>run</code> function and redirect the browser to it.</p>
      ${e(t(`// src/pages/pricing.js
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.APP_URL

export default {
  route: '/pricing',

  state: { status: 'idle' },

  view: (state) => \`
    <main id="main-content">
      <h1>Pricing</h1>
      <form data-action="checkout">
        <input type="hidden" name="priceId" value="price_xxxx">
        <button type="submit">
          \${state.status === 'loading' ? 'Redirecting\u2026' : 'Buy now'}
        </button>
      </form>
      \${state.status === 'error'
        ? '<p role="alert">Something went wrong. Please try again.</p>'
        : ''}
    </main>
  \`,

  actions: {
    checkout: {
      onStart: () => ({ status: 'loading' }),

      run: async (state, serverState, formData) => {
        const priceId = formData.get('priceId')

        const session = await stripe.checkout.sessions.create({
          mode:                'payment',
          line_items:          [{ price: priceId, quantity: 1 }],
          success_url:         \`\${APP_URL}/checkout/success?session={CHECKOUT_SESSION_ID}\`,
          cancel_url:          \`\${APP_URL}/checkout/cancel\`,
        })

        return { url: session.url }
      },

      onSuccess: (state, result) => {
        // Redirect to Stripe's hosted checkout page
        window.location.href = result.url
        return { status: 'redirecting' }
      },

      onError: () => ({ status: 'error' }),
    },
  },
}`,"js"))}

      ${r("success","Success and cancel pages")}
      ${e(t(`// src/pages/checkout/success.js
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default {
  route: '/checkout/success',
  meta: { title: 'Payment successful', styles: ['/app.css'] },

  server: {
    session: async (ctx) => {
      const { session } = ctx.query
      if (!session) return null
      return stripe.checkout.sessions.retrieve(session)
    },
  },

  state: {},
  view: (state, server) => \`
    <main id="main-content">
      <h1>Payment successful</h1>
      \${server.session
        ? \`<p>Thank you! Your order reference is <strong>\${server.session.id}</strong>.</p>\`
        : '<p>Thank you for your purchase.</p>'
      }
      <a href="/">Back to home</a>
    </main>
  \`,
}`,"js"))}

      ${e(t(`// src/pages/checkout/cancel.js
export default {
  route: '/checkout/cancel',
  meta: { title: 'Payment cancelled', styles: ['/app.css'] },
  state: {},
  view: () => \`
    <main id="main-content">
      <h1>Payment cancelled</h1>
      <p>No charge was made.</p>
      <a href="/pricing">Back to pricing</a>
    </main>
  \`,
}`,"js"))}

      ${r("webhooks","Webhook handler")}
      <p>Stripe sends signed POST requests to your webhook endpoint. Use a raw response spec to verify the signature and handle events. The raw body is required for signature verification \u2014 access it via <code>ctx.rawBody</code> if your server is configured to populate it, or read it from the request stream.</p>
      ${e(t(`// src/pages/webhooks/stripe.js
import Stripe from 'stripe'

const stripe         = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret  = process.env.STRIPE_WEBHOOK_SECRET

export default {
  route:       '/webhooks/stripe',
  contentType: 'application/json',

  server: {
    event: async (ctx) => {
      const sig  = ctx.headers['stripe-signature']
      const body = ctx.rawBody // raw Buffer \u2014 see note below

      try {
        return stripe.webhooks.constructEvent(body, sig, webhookSecret)
      } catch (err) {
        return { error: err.message }
      }
    },
  },

  render: (ctx, server) => {
    if (server.event.error) {
      ctx.setHeader('X-Webhook-Error', server.event.error)
      return JSON.stringify({ error: server.event.error })
    }

    const event = server.event

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      // fulfil the order...
    }

    if (event.type === 'customer.subscription.deleted') {
      // handle cancellation...
    }

    return JSON.stringify({ received: true })
  },
}`,"js"))}

      ${o("warning","Stripe signature verification requires the raw request body before JSON parsing. Configure your Pulse server with <code>onRequest</code> to capture <code>ctx.rawBody</code> for the webhook route, or use a dedicated webhook path handled before Pulse's request pipeline.")}

      ${r("reference","Pattern summary")}
      ${d(["Concern","Pulse primitive"],[["Initiate checkout","<code>action.run</code> \u2014 calls Stripe API server-side, returns checkout URL"],["Redirect to Stripe","<code>action.onSuccess</code> \u2014 sets <code>window.location.href</code>"],["Confirm payment","<code>spec.server</code> on success page \u2014 retrieves session from Stripe"],["Handle webhooks","Raw response spec with <code>render</code> returning JSON"],["Verify signature","<code>spec.server</code> fetcher using <code>stripe.webhooks.constructEvent</code>"]])}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",n(i,s,window.__PULSE_SERVER__||{},{ssr:!0}),h(s,n));var E=i;export{E as default};
