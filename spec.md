# Specification

## Summary
**Goal:** Replace the PWA icon with a user-provided image and remove the yellow pulsing dot from the Globe tab.

**Planned changes:**
- Download the user-provided image and save it as the PWA icon asset in `frontend/public/`
- Update `manifest.json` icon entries (256px and 512px) to reference the new image
- Remove previously generated PWA icon assets from `manifest.json` and `frontend/index.html`
- Remove the yellow pulsing dot/animated marker from the `GlobeView.tsx` component

**User-visible outcome:** The app installs with the user's custom PWA icon, and the Globe tab no longer shows a yellow pulsing dot on the 3D globe.
