# Specification

## Summary
**Goal:** Remove an unintended image appearing in fullscreen mode and hide conflicting text in the globe/global view.

**Planned changes:**
- Remove the random/unintended image rendered inside the fullscreen overlay component so it no longer appears when the app enters fullscreen mode
- Hide the text content inside the GlobeView component when globe mode is active to prevent it from overlapping with the AppHeader top bar

**User-visible outcome:** Fullscreen mode displays only intentional elements, and the globe view no longer shows conflicting text that overlaps with the top bar.
