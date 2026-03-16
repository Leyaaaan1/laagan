const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },
    resolver: {
        sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
        assetExts: ['png', 'jpg', 'ttf'],
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);