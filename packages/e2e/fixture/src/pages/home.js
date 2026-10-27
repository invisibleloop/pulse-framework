export default {
  route: '/',
  meta: { title: 'Home', description: 'E2E fixture', theme: 'light', styles: ['/pulse-ui.css'] },
  state: { count: 0, note: '', status: 'idle' },
  mutations: {
    inc: (s) => ({ count: s.count + 1 }),
  },
  actions: {
    save: {
      onStart:   () => ({ status: 'saving' }),
      run:       async () => ({ ok: true }),
      onSuccess: () => ({ status: 'saved' }),
      onError:   () => ({ status: 'error' }),
    },
  },
  view: (s) => `<a href="#main-content" class="pulse-skip-link">Skip to main content</a>
  <main id="main-content">
    <h1>Home</h1>
    <nav>
      <a id="to-here" href="#details">Details on this page</a>
      <a id="to-about" href="/about">About</a>
      <a id="to-about-part" href="/about#part-two">About, part two</a>
      <a id="to-static" href="/static">Static page</a>
    </nav>
    <button id="inc" data-event="inc">count ${s.count}</button>
    <form id="save-form" data-action="save">
      <textarea id="note" name="note" data-preserve rows="3"></textarea>
      <button id="save" type="submit">Save</button>
      <p id="status">${s.status}</p>
    </form>
    <div style="height:2400px">spacer</div>
    <h2 id="details" tabindex="-1">Details</h2>
    <div style="height:2400px">spacer</div>
  </main>`,
}
