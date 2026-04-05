/** @type {import('web-ext').WebExtRunOptions} */
export default {
  sourceDir: '.',
  artifactsDir: '../../artifacts/firefox',
  firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
  firefoxProfile: '../../profiles/firefox-dev',
  keepProfileChanges: true,
  startUrl: ['about:debugging#/runtime/this-firefox'],
  watchFiles: ['background.js'],
};
