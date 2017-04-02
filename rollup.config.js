const path = require('path');

const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonJs = require('rollup-plugin-commonjs');
const rollupPluginJson = require('rollup-plugin-json');

module.exports = {
  entry: path.join(__dirname, 'index.js'),
  plugins: [
    rollupPluginNodeResolve({
      main: true,
      preferBuiltins: false,
    }),
    rollupPluginCommonJs(),
    rollupPluginJson(),
  ],
  moduleName: 'creaturejs',
  format: 'iife',
  useStrict: false,
};
