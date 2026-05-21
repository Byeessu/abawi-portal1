import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'sn.abawi.portal',
  appName: 'ABAWI Portal',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    url: 'https://abawi.app',
    cleartext: false,
  },

  android: {
    backgroundColor: '#070B0F',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#070B0F',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#070B0F',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'Dark',
      backgroundColor: '#070B0F',
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
}

export default config
