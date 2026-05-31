/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('🔴 GLOBAL ERROR:', error.message);
  console.error('🔴 STACK:', error.stack);
  console.error('🔴 IS FATAL:', isFatal);
});

AppRegistry.registerComponent(appName, () => App);
