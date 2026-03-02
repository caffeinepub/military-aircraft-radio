# Specification

## Summary
**Goal:** Add cycling slogans with fade transitions to the Globe tab and fix the perpetual loading bug in the Stations tab.

**Planned changes:**
- Add the same anti-subscription slogan cycling (with fade transitions) to the GlobeView tab, reusing the shared logic from NowPlayingPanel and FullscreenOverlay, positioned so it does not obstruct globe interaction
- Fix the Stations tab perpetual loading state so it resolves to either a populated station list or a clear error/empty state, with retry or fallback handling if the fetch fails

**User-visible outcome:** Users see rotating slogans in the Globe tab matching the existing behavior, and the Stations tab no longer gets stuck in an infinite loading spinner.
