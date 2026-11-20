# EFM Lite

App web (da aggiungere alla schermata Home del telefono) per gestire **gare e convocazioni**
di Easy Football Manager dal telefono.

- Si apre con l'account Google e con il PIN dell'app del PC.
- I dati arrivano da Google Drive (`EFM_lite.efm`, cifrato con il PIN) e restano **solo in memoria**:
  sul telefono non viene salvato nulla.
- Le gare create o modificate tornano al PC come file cifrati `EFM_dal_telefono_*.efm`.
- Report "Lista convocati" in immagine, da condividere su WhatsApp.

Componenti inclusi: libsodium.js (ISC, `lib/`), caratteri Barlow (OFL, `fonts/`).
