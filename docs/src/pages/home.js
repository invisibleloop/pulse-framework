import fs from 'fs'

const html = fs.readFileSync('/Users/andy.stubbs/Downloads/pulse_design/Pulse Homepage.dc.html', 'utf8')

export default {
  route: '/',
  contentType: 'text/html; charset=utf-8',
  render: () => html,
}
