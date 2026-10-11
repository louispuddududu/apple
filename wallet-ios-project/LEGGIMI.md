# Wallet Demo: da HTML a IPA (da Windows, senza Mac)

## 1. Costruire l'IPA (gratis, nel cloud)
1. Crea un account su github.com e un nuovo repository (anche privato).
2. Carica TUTTO il contenuto di questa cartella: "Add file → Upload files".
   Controlla che esista il percorso `.github/workflows/build-ios.yml`.
   Se non compare, usa "Add file → Create new file", scrivi quel percorso
   e incolla il contenuto del file.
3. Vai su **Actions → Build unsigned IPA → Run workflow**.
4. Dopo qualche minuto (circa 5-10) apri l'esecuzione e scarica
   l'artefatto **WalletDemo-ipa** (zip). Estrailo: dentro c'è `WalletDemo.ipa`.

## 2. Installarlo sull'iPhone con Sideloadly
1. Installa iTunes e iCloud dal sito apple.com (non dal Microsoft Store).
2. Installa Sideloadly (sideloadly.io), collega l'iPhone con il cavo e tocca "Autorizza".
3. Trascina `WalletDemo.ipa` in Sideloadly, inserisci il tuo Apple ID, premi Start.
4. Sull'iPhone: Impostazioni → Privacy e sicurezza → Modalità sviluppatore (attiva e riavvia).
5. Impostazioni → Generali → VPN e gestione dispositivo → autorizza il tuo Apple ID.

Con l'Apple ID gratuito l'app scade dopo 7 giorni: si rifirma con Sideloadly
(o usa AltStore per il rinnovo automatico).

## Note
- Dati, Face ID, NFC e pagamento sono simulati. Le carte restano salvate sul telefono.
- Nell'app, il pagamento simulato si apre da Impostazioni → "Simula pagamento".
- Non ho potuto provare la build: se il workflow dà errore, mandami il log.
