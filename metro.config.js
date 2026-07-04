const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Anthropic SDK ships Node-only credential helpers that dynamically
// import node:* builtins (fs, path, os). Those code paths never execute in
// React Native (we always construct the client with an explicit apiKey),
// but Metro resolves imports statically and would fail the bundle. Stub
// every node: builtin to an empty module.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'empty' };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
