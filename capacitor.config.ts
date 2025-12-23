import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onenightdrink.app',
  appName: 'OneNightDrink',
  webDir: 'dist',
  server: {
    url: 'https://www.one-night-drink.com',
    cleartext: true,
    allowNavigation: [
      'https://www.one-night-drink.com',
      'https://one-night-drink.com',
      'https://*.one-night-drink.com'
    ]
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
