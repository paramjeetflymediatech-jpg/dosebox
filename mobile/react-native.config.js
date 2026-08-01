const { bundleCommand, startCommand } = require('@react-native/community-cli-plugin');
const cliPlatformAndroid = require('@react-native-community/cli-platform-android');
const cliPlatformIos = require('@react-native-community/cli-platform-ios');

module.exports = {
  commands: [bundleCommand, startCommand],
  platforms: {
    android: {
      linkConfig: cliPlatformAndroid.linkConfig,
      projectConfig: cliPlatformAndroid.projectConfig,
      dependencyConfig: cliPlatformAndroid.dependencyConfig,
    },
    ios: {
      linkConfig: cliPlatformIos.linkConfig,
      projectConfig: cliPlatformIos.projectConfig,
      dependencyConfig: cliPlatformIos.dependencyConfig,
    },
  },
  project: {
    android: {
      packageName: 'com.doseboxmobile',
      sourceDir: './android',
    },
  },
};
