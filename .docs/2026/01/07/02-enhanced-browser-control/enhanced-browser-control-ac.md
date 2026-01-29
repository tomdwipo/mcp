# Acceptance Criteria - Enhanced Browser Control

## Goal
Verify the "Hardware Mimicry" capabilities of the `chrome-devtools-mcp` server, ensuring it can control canvas-based applications like Google Docs and Figma.

## Test Scenarios

### 1. Smart Typing (Canvas Text Input)
- [ ] **Setup**: Open a blank Google Doc (or a text area in any web app). Focus the document area (manually or via `click`).
- [ ] **Action**: Call `smart_type` with `key: "Hello World"`.
- [ ] **Verify**: "Hello World" appears in the document.
- [ ] **Action**: Call `smart_type` with `key: "A"`, `modifiers: ["Cmd"]` (or "Ctrl" on Windows/Linux).
- [ ] **Verify**: All text is selected.
- [ ] **Action**: Call `smart_type` with `key: "Backspace"`.
- [ ] **Verify**: Text is deleted.

### 2. Drag and Drop (Canvas Movement)
- [ ] **Setup**: Open a drawing app (e.g., excalidraw.com).
- [ ] **Action**: Identify start coordinates (X1, Y1) and end coordinates (X2, Y2) of a blank space.
- [ ] **Action**: Call `drag_and_drop` from (X1, Y1) to (X2, Y2).
- [ ] **Verify**: A line is drawn or a selection box appears (depending on active tool).

### 3. Mouse Movement (Hover)
- [ ] **Setup**: Find a button with a hover state (change color/show tooltip) on any website.
- [ ] **Action**: Call `mouse_move` to the coordinates of that button.
- [ ] **Verify**: The button's hover state is triggered.

### 4. Coordinate Clicking
- [ ] **Setup**: Identify a clickable element's coordinates.
- [ ] **Action**: Call `click` using only `x` and `y` properties.
- [ ] **Verify**: The element is clicked (e.g., navigation occurs, menu opens).

### 5. Stability
- [ ] **Verify**: No crash when sending invalid keys or coordinates out of bounds (should return error or do nothing).
- [ ] **Verify**: Existing tools (`screenshot`, `navigate`) still work as expected.
