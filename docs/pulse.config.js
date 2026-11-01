// The docs site lives inside the framework's repository and imports the UI components by a relative
// path, so the build cannot find their source to scan. Rendering the pages at build time finds the
// class names those components write. (An installed project does not need this.)
export default {
  css: { renderPages: true },
}
