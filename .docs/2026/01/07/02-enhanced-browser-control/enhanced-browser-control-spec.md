# Enhanced Browser Control Feature Spec

## Goal
Upgrade `chrome-devtools-mcp` to support low-level input simulation (Hardware Mimicry) to reliably control canvas-based applications like Google Docs and Figma, enabling interactions that standard DOM-based tools cannot handle.

## Requirements
- **Low-Level Key Injection**: Ability to send raw keyboard events (keydown, keyup, char) including modifier keys (Ctrl, Cmd, Shift, Alt).
- **Precise Mouse Control**: specific tools for `mouse_move` (hover), `mouse_down`, `mouse_up`, and `drag`.
- **Coordinate-based Interaction**: All tools (click, drag, type) must support (x, y) coordinates for canvas targeting.
- **Scroll Screenshot**: Ability to capture screenshots of specific viewports or full scrolling pages to assist in visual navigation.
- **Wait Mechanism**: Enhanced waiting strategies (time-based) since DOM selectors won't work on Canvas.

## Acceptance Criteria
- [ ] User can type text into a Google Doc (canvas) using `smart_type`
- [ ] User can drag and drop an element in Figma (canvas) using `drag_and_drop`
- [ ] User can Send keyboard shortcuts (e.g., `Cmd+A`, `Cmd+C`) to the browser
- [ ] User can move mouse to specific (x,y) coordinates to trigger hover effects
- [ ] User can click at specific (x,y) coordinates without a selector
- [ ] User can capture a screenshot after scrolling to specific position

## Implementation Approach
1.  **Extend `ChromeClient`**: Add new methods mapping directly to `Input.dispatchKeyEvent` and `Input.dispatchMouseEvent` from CDP.
2.  **Implement `smart_type`**: Create a tool that accepts text and optional modifiers, translating them into a sequence of raw key events.
3.  **Implement `drag_and_drop`**: Create a tool that sequences `mousePressed`, `mouseMoved` (trajectory), and `mouseReleased`.
4.  **Implement `mouse_move`**: Expose raw mouse movement for hover states.
5.  **Enhance `screenshot`**: Add parameters for clip/viewport matching current scroll position.

## Files to Modify
- **[MODIFY]** `chrome-devtools-mcp/src/index.ts` - Register new tools (`smart_type`, `drag_and_drop`, `mouse_move`, `mouse_click_coords`).
- **[MODIFY]** `chrome-devtools-mcp/src/chrome-client.ts` - Implement low-level CDP input logic.
- **[MODIFY]** `chrome-devtools-mcp/README.md` - Document new tools and Canvas-app usage strategies.

## Technical Constraints
- **Coordinate Dependency**: Users/Agents must know *where* to click (X,Y). This often requires a preceding `screenshot` tool call to identify coordinates.
- **Latency**: "Hardware mimicry" (sending sequences of events) is slower than JS injection but more reliable for Canvas.
- **OS Differences**: Key modifiers (Cmd vs Ctrl) differ by OS, need to handle loosely or strictly based on the host OS.

## Success Metrics
- 100% success rate in typing "Hello World" into a blank Google Doc.
- Ability to move a Figma rectangle from point A to point B.
- No regression in existing DOM-based tools.

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Coordinates change on resize | Advise maximizing window; provide tool to get viewport size |
| Typing too fast for app | Implement configurable delay between keystrokes |
| Modifier keys sticking | Ensure `keyUp` is always sent, even on error |

## Documentation Updates Required
- Add "Canvas Application Control" section to README.
- Provide example workflow for "Typing in Google Docs" (Screenshot -> Estimate Coords -> Click -> Type).
- Listing of supported Key definitions.

## Summary of Changes
Enhance the Chrome DevTools MCP server with human-like hardware input simulation. This introduces precise mouse movements, drag-and-drop, and raw keyboard injection, effectively bypassing the limitations of DOM-based automation for canvas-heavy applications like Google Docs and Figma.
