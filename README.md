# Setup (Windows)

Se compare un errore su "worklets": `npx expo install react-native-worklets`


1. `npx create-expo-app@latest wallet --template blank-typescript`
2. Copia dentro il progetto: `App.tsx`, `app.json`, `eas.json` e la cartella `src/` (sovrascrivendo).
3. `npx expo install expo-linear-gradient expo-haptics expo-blur expo-sensors react-native-reanimated react-native-gesture-handler react-native-safe-area-context @expo/vector-icons`
4. In `tsconfig.json` verifica `"strict": true`.
5. `npx expo start` e apri con Expo Go sull'iPhone.
6. Cambia `bundleIdentifier` in `app.json`.
Build .ipa: `npx eas build --platform ios --profile preview` (oppure `expo prebuild` + Xcode sul Mac).

## Dipendenze per il dettaglio carta (QR code)
`npx expo install react-native-svg` e poi `npm install react-native-qrcode-svg`

## Face ID vero
`npx expo install expo-local-authentication`
Funziona solo in una build (development build o .ipa), non in Expo Go.

## Notifiche vere
`npx expo install expo-notifications`
