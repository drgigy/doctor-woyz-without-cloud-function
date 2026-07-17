# Doctor WOYZ Without Cloud Function

Browser-only Gemini API clone of Doctor WOYZ.

This clone preserves the Doctor WOYZ static UI and recording flows, but Gemini
processing is performed directly from the frontend. It does not call the
Firebase Cloud Function for transcription or generation.

## Security Warning

This version stores the Gemini API key in the user's browser `localStorage` and
sends it directly from the website to the Gemini API.

That key is not truly secret. Anyone with access to the browser profile, device
storage, developer tools, or a compromised page/session may be able to read or
misuse it. This clone trades the stronger security of the Cloud Function +
Secret Manager design for simpler setup and faster iteration.

Do not commit a Gemini API key to this repository. Enter it only in the website
Settings panel.

## What Changed From The Secure Edition

- Added `browser-gemini.js`, derived from the previous Cloud Function prompt,
  JSON schemas, model fallback order, Gemini 2.5 Flash settings, temperature
  `0`, dynamic thinking budget `-1`, and frontend post-processing helpers.
- Replaced the `generateVisitNoteHttp` Cloud Function call in `index.html` with
  a direct frontend Gemini API call.
- Added a Gemini API key field in Settings with save, remove, and show/hide
  controls.
- Stores the key only in local browser storage under
  `doctor_woyz_browser_gemini_api_key`.
- Updated `sw.js` so the new browser module is cached with the app shell.

## Kept From The Current App

- Ambient mode
- Review dictation
- Visit note dictation
- Prescription generation
- Medical certificate generation
- Print and copy behavior
- Doctor credentials stored locally for prescription/certificate output
- Firebase Auth + Firestore device approval/admin files, available as an
  optional gate

Firebase approval is disabled by default in `index.html` with
`REQUIRE_FIREBASE_DEVICE_APPROVAL = false`. Set it to `true` if you want to
restore the approval gate. Gemini processing itself no longer depends on
Firebase Cloud Functions or Secret Manager.

## Run Locally

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/
```

In Settings, paste a Gemini API key and select **Save Key** before recording.

## Files To Publish On GitHub Pages

Publish the repository root as a static site. Required app files include:

```text
index.html
browser-gemini.js
main.html
admin.html
manifest.webmanifest
sw.js
offline.html
icon-192.png
icon-512.png
icon-maskable-512.png
firestore.rules
firebase.json
README.md
```

## Privacy And Clinical Use

This app sends recorded audio directly from the browser to Gemini using the
user-provided API key. Do not use identifiable patient data until privacy,
consent, data-processing, and regulatory requirements have been reviewed for
the intended clinical setting.
