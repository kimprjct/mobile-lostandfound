const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add support for web-specific file extensions
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'web.js',
  'web.jsx',
  'web.ts',
  'web.tsx',
];

// Add support for additional asset types
defaultConfig.resolver.assetExts = [
  ...defaultConfig.resolver.assetExts,
  'cjs',
  'pem',
  'woff2',
];

module.exports = defaultConfig; 