# Implementation Plan - Enhanced Browser Control

# Goal Description
Upgrade the `chrome-devtools-mcp` service to support hardware-level input simulation (CDP Input domain). This will allow full control over canvas-based applications like Google Docs and Figma, which do not expose standard DOM elements for interaction. We will implement precise mouse control (move, drag), raw keyboard injection (shortcuts, modifier keys), and improved screenshot capabilities.

## User Review Required
> [!IMPORTANT]
> The `drag_and_drop` tool requires a sequence of mouse events. We will implement linear interpolation for mouse movement to simulate human-like drag speed, which is often required for apps to register the drag event properly.

> [!WARNING]
> Coordinate-based interactions (X, Y) effectively bypass standard DOM element checks. The user/agent is responsible for ensuring the coordinates are correct (likely visually derived from a previous `screenshot`).

## Proposed Changes

### Chrome DevTools MCP

#### [MODIFY] [chrome-client.ts](file:///Users/tommy-amarbank/Documents/startup/mcp/chrome-devtools-mcp/src/chrome-client.ts)
- Update `ChromeClient` class to include new low-level input methods:
    - `mouseMove(x, y)`: Dispatch `Input.dispatchMouseEvent` with type `mouseMoved`.
    - `drag(startX, startY, endX, endY)`: Dispatch `mousePressed`, interpolated `mouseMoved` events, and `mouseReleased`.
    - `sendKey(key, modifiers)`: Dispatch `Input.dispatchKeyEvent` (keyDown/keyUp) with support for modifiers (Command, Control, Shift, Alt).
    - `navigate` (Update): Ensure it waits for `Page.loadEventFired`.

#### [MODIFY] [index.ts](file:///Users/tommy-amarbank/Documents/startup/mcp/chrome-devtools-mcp/src/index.ts)
- Register new tools in the MCP server:
    - `mouse_move`: Moves the mouse to specific coordinates.
    - `drag_and_drop`: Performs a drag operation from (x1, y1) to (x2, y2).
    - `smart_type`: Types text or sends keys with modifiers (e.g., "Enter", "Cmd+C").
- Update existing tools:
    - `click`: Ensure it supports pure (x, y) usage without selector robustly (already supported, but verify implementation).

#### [MODIFY] [README.md](file:///Users/tommy-amarbank/Documents/startup/mcp/chrome-devtools-mcp/README.md)
- Add "Canvas Application Control" section.
- Document the new tools and their parameters.
- Add examples for "Copy Paste in Docs" and "Moving objects in Figma".

## Verification Plan

### Automated Tests
- We will build the project using `npm run build` to ensure type safety.
- Since we don't have a full E2E test suite with a running Chrome instance in CI, verification will rely on Manual Verification steps once the user runs the server.

### Manual Verification
1.  **Launch Chrome**: Run Chrome with `--remote-debugging-port=9222`.
2.  **Start Server**: Run the updated MCP server.
3.  **Test Google Docs**:
    -   Navigate to a new Google Doc.
    -   Use `smart_type` to type "Hello World".
    -   Use `smart_type` with "Cmd+A" to select all text.
    -   Use `smart_type` with "Backspace" to clear the doc.
4.  **Test Figma (or Paint App)**:
    -   Open a drawing app (e.g., excalidraw.com).
    -   Use `drag_and_drop` to draw a line or move an object.
5.  **Test Mouse Move**:
    -   Use `mouse_move` to hover over a button and verify the hover state triggers.
