import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.opusvox.app',
  appName: 'OpusVox',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f0f0f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0f0f0f',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

// Live-reload server for development only.
// Never set server.url in production — the app must load from the bundled dist/.
// To enable: CAPACITOR_LIVERELOAD=true npx cap run android
if (process.env.CAPACITOR_LIVERELOAD === 'true') {
  const ip = process.env.CAPACITOR_SERVER_IP ?? 'localhost'
  ;(config as CapacitorConfig & { server: object }).server = {
    url: `http://${ip}:5173`,
    cleartext: true,
  }
}

export default config
