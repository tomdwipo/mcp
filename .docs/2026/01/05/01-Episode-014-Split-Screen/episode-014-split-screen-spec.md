# Episode 014: Split-Screen Feature Spec

## Episode 014: Split-Screen Feature Spec

### Goal
Implement a split-screen comparison video format for Episode 014: Chair Dips to effectively demonstrate correct vs. incorrect form, reducing injury risk for viewers.

### Requirements
- **FFmpeg Pipeline Update**: Modify `export-video.js` to support side-by-side (`hstack`) video compositing.
- **Transcript Schema Update**: Extend `transcript-video.json` to allow defining two video sources (`video_left`, `video_right`) and two labels (`label_left`, `label_right`) for specific segments.
- **Visual Design**: Create a clear visual separator and distinctive "Correct" (Green) vs "Incorrect" (Red) text overlays.
- **Stock Footage**: Source matched pairs of clips (or crop/edit existing ones) to show contrast.
- **Fallback**: Maintain support for standard full-screen segments for Intro/Outro.

### Acceptance Criteria
- [x] `transcript-video.json` supports optional `split_screen: true` property.
- [x] `export-video.js` handles `hstack` filter when `split_screen` is true.
- [x] Comparison segments show "❌ SALAH" and "✅ BENAR" labels clearly.
- [x] Video exports successfully with mixed full-screen and split-screen segments.
- [x] Audio sync remains accurate during split-screen segments.
- [x] Final video output resolution remains 1920x1080.

### Implementation Approach
1.  **Data Structure**: Add `layout: "split"` to transcript segments.
2.  **Asset Logic**: If layout is split, `download-videos.js` must ensure both clips are available.
3.  **Compositing Logic**:
    -   Standard: `[video] [overlay] overlay`
    -   Split: `[video_left] [video_right] hstack=inputs=2 [overlay] overlay`
4.  **Resizing**: Ensure input videos are resized/cropped to 960x1080 before hstacking to fit 1920x1080.

### Files to Modify
- `monetisasi/youtube/season-02-core-mobility/episode-014-chair-dips/transcript-video.json` (New schema)
- `monetisasi/youtube/season-02-core-mobility/episode-014-chair-dips/export-video.js` (Logic update)
- `monetisasi/youtube/season-02-core-mobility/episode-014-chair-dips/kinetic-video-v2.html` (Preview update - optional but recommended)

### Technical Constraints
- **Pexels Aspect Ratios**: Stock videos vary. Mismatched aspect ratios in `hstack` cause FFmpeg errors.
- **Solution**: Force scale/crop filter `scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080` for split inputs.

### Success Metrics
- Successful render of Episode 014 with >3 split-screen segments.
- Visual clarity of the comparison (text readable, action visible).

### Risk Mitigation
- **Risk**: FFmpeg complex filter syntax errors.
- **Mitigation**: Test the `hstack` command on two sample clips first before integrating into the full loop.

### Documentation Updates Required
- Update `youtube/README.md` with "Split-Screen" pipeline documentation.

### Summary of Changes
Introducing a sophisticated "Split-Screen" capability to the video generation pipeline to enable high-value educational comparisons, starting with Chair Dips.
