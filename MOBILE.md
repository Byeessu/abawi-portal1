# ABAWI Mobile — Déploiement App Native (Capacitor)

## Prérequis
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

## Initialisation
```bash
npx cap init "ABAWI" "com.abawi.app" --web-dir=dist
```

## Android
```bash
npx cap add android
npm run build && npx cap sync android
npx cap open android
# Android Studio → Build → Generate Signed Bundle → Google Play
```

## iOS (Mac requis)
```bash
npx cap add ios
npm run build && npx cap sync ios
npx cap open ios
# Xcode → Product → Archive → Distribute App → App Store Connect
```

## capacitor.config.json
```json
{
  "appId": "com.abawi.app",
  "appName": "ABAWI",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#070B0F",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "Dark",
      "backgroundColor": "#070B0F"
    }
  }
}
```

## PWA (déjà configurée)
Le site est déjà une PWA installable :
- manifest.json → public/manifest.json
- Service Worker → public/sw.js
- Icônes SVG → public/icons/

L'utilisateur peut installer l'app directement depuis Chrome/Safari
sans passer par les stores.
