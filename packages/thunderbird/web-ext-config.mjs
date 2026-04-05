/** @type {import('web-ext').WebExtRunOptions} */
export default {
  sourceDir: '.',
  artifactsDir: '../../artifacts/thunderbird',
  target: ['thunderbird-desktop'],
  firefox: '/Applications/Thunderbird.app/Contents/MacOS/thunderbird-bin',
  firefoxProfile: '../../profiles/thunderbird-dev',
  keepProfileChanges: true,
};
