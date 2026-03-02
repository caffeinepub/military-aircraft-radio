# Specification

## Summary
**Goal:** Make the globe background solid black to match the app's dark theme, and ensure all stations (including the currently playing one) are always displayed as markers on the globe.

**Planned changes:**
- Set the Three.js scene background to black (`#000000`) in both `GlobeView` and `FullscreenGlobe` components
- Set any canvas or container wrapper background behind the globe to black as well
- Ensure the currently playing station is always added as a marker on the globe, even if it was not returned in the fetched station list
- Increase the station fetch limit to the maximum supported (up to 500) to minimize missing entries

**User-visible outcome:** The globe now has a black background consistent with the rest of the app, and all stations with valid coordinates — including the currently playing station — appear as markers on the globe.
