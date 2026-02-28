# Specification

## Summary
**Goal:** Redesign the Squadron Radio frontend to be minimalist and fully fit within a single mobile viewport, while repurposing the radar widget as a functional playback state indicator.

**Planned changes:**
- Remove all decorative UI elements: scanlines, GaugeWidget, grid overlays, corner bracket decorations, and vignette effects from HUDLayout
- Strip forced military jargon labels ("TACTICAL", "MISSION BRIEFING", "INTEL REPORT", etc.) from all components
- Retain dark color palette and subtle aviation-themed language only for functional elements (app title, button labels, station status)
- Ensure the full app (header, now-playing, search, station list, favorites) fits within a single mobile viewport (375×812px) without scrolling
- Repurpose RadarWidget as a compact (~80×80px) functional state indicator showing: slow sweep when idle/searching, faster sweep or active blip when loading/playing, and static/dimmed state when stopped or in error
- Position the radar widget compactly (e.g., small corner element or inline in the now-playing area) so it does not dominate the layout

**User-visible outcome:** Users see a clean, minimal dark UI that fits entirely on a mobile screen without scrolling, with a small radar indicator providing at-a-glance feedback about the current playback state.
