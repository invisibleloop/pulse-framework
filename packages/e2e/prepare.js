// Copies the framework stylesheet into the fixture app before a server starts. Plain node, so the
// suite runs the same on Linux, macOS and Windows (a shell `mkdir -p && cp` does not).
import fs from 'node:fs'

fs.mkdirSync(new URL('./fixture/public/', import.meta.url), { recursive: true })
fs.copyFileSync(new URL('../pulse/public/pulse-ui.css', import.meta.url), new URL('./fixture/public/pulse-ui.css', import.meta.url))
