# Episode 014: Split-Screen Implementation Plan

## Goal
Enable side-by-side video comparison for Episode 014: Chair Dips to visually demonstrate correct vs. incorrect form.

## Phase 1: Directory & Config Setup
- [ ] Create `season-02-core-mobility/episode-014-chair-dips/` structure.
- [ ] Create `package.json` (copy from prev episode).
- [ ] Create `shorts-config.json` (placeholder).
- [ ] Install/Link dependencies.

## Phase 2: Schema & Data
- [ ] Create `transcript-video.json` with new schema support (`layout: "split"`, `video_left`, `video_right`).
- [ ] Define segments: Intro (Full), Tutorial (Split), Common Mistakes (Split), Outro (Full).

## Phase 3: Asset Pipeline
- [ ] Update `download-videos.js` to handle `video_left` and `video_right` properties.
- [ ] Download 10+ clips (including matched pairs for split-screen).

## Phase 4: Core Logic (FFmpeg & Puppeteer)
- [ ] Update `export-video.js`:
    - [ ] Add logic to check `segment.layout === 'split'`.
    - [ ] Implement FFmpeg `hstack` filter complex generation.
    - [ ] Ensure `scale=960:1080` and `crop` for split inputs to avoid aspect ratio errors.
- [ ] Update `kinetic-video-v2.html` (Optional but recommended for overlays): 
    - [ ] Add CSS classes for split layout (if used for text positioning).
    - [ ] *Decision*: We will stick to centered text for simplicity in V1, or basic "Left/Right" labels if time permits. The Spec mentions "X SALAH" and "BENAR" labels. We can handle this via Puppeteer or just simple overlay text. Let's aim for Puppeteer text updates if possible, or keep it center overlay for now. *Correction*: Spec says "Create a clear visual separator and distinctive Correct/Incorrect text overlays". We'll modify HTML to support this.

## Phase 5: Execution & Verification
- [ ] Generate Audio.
- [ ] Run `node export-video.js`.
- [ ] Verify output `episode-014-chair-dips.mp4`.
