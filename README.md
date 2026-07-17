# Doctor WOYZ Browser Gemini

Simple browser-only Doctor WOYZ clone.

This version is just a static website. It has no backend proxy, account system,
database, or access gate. Gemini transcription and generation run
directly from the browser with the API key entered by the user in Settings.

## Security Warning

The Gemini API key is stored in the user's browser `localStorage` and sent
directly from the page to Gemini.

That key is not truly secret. Anyone with access to the browser profile, device
storage, developer tools, or a compromised page/session may be able to read or
misuse it. This version trades security for simplicity and speed.

Do not commit a Gemini API key to this repository. Enter it only in the website
Settings panel.

## Features

- Ambient visit note mode
- Review dictation
- Visit note dictation
- Prescription generation
- Medical certificate generation
- Print and copy behavior
- Doctor credentials stored locally for prescription/certificate output
- Browser-saved Gemini API key with save, remove, and show/hide controls

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

## Files

The whole app is intentionally only three files:

```text
index.html
browser-gemini.js
README.md
```

## Privacy And Clinical Use

This app sends recorded audio directly from the browser to Gemini using the
user-provided API key. Do not use identifiable patient data until privacy,
consent, data-processing, and regulatory requirements have been reviewed for
the intended clinical setting.
