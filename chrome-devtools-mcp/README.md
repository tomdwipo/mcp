# Chrome DevTools MCP Server

An MCP (Model Context Protocol) server that connects Claude Code to Chrome browser via Chrome DevTools Protocol (CDP). This enables Claude to see, navigate, and interact with web pages in your running Chrome instance.

## Navigation

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup](#setup)
- [Available Tools](#available-tools)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)

## Prerequisites

- Node.js 18+
- Chrome/Chromium browser
- macOS (tested on macOS)

## Installation

```bash
cd chrome-devtools-mcp
npm install
npm run build
```

## Setup

### 1. Launch Chrome with Remote Debugging

Chrome must be started with the remote debugging port enabled:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

Or create an alias in your shell profile:
```bash
alias chrome-debug='/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222'
```

### 2. Add to Claude Code

Add the server to your Claude Code MCP configuration:

```bash
claude mcp add chrome-devtools -- node /path/to/chrome-devtools-mcp/dist/index.js
```

Or manually edit `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "node",
      "args": ["/path/to/chrome-devtools-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `launch_chrome` | Launch Chrome with debugging port. Supports existing profiles or fresh temporary profile |
| `screenshot` | Capture current tab as PNG image |
| `click` | Click element by CSS selector or coordinates |
| `type` | Type text into focused or specified element |
| `navigate` | Navigate to a URL |
| `evaluate` | Execute JavaScript in page context |
| `get_content` | Get page text or HTML content |
| `list_tabs` | List all open Chrome tabs |
| `switch_tab` | Switch to a specific tab |
| `scroll` | Smart scroll with fallback chain (wheel event → DOM detection) |
| `wait_for` | Wait for element to appear |
| `mouse_move` | Move mouse to specific X,Y (hover effects) |
| `drag_and_drop` | Drag element from Start(X,Y) to End(X,Y) |
| `smart_type` | Send raw keys + modifiers (e.g. Cmd+C) |
| `canvas_zoom` | Zoom in/out on canvas apps (Figma, Miro) via Ctrl+scroll |

## Usage Examples

### Launch Chrome with Profile

Launch Chrome with your existing profile (keeps login sessions, bookmarks, etc.):
```
launch_chrome(url: "https://google.com", profile: "Profile 1")
```

Common profile directories:
| Profile | Description |
|---------|-------------|
| `Default` | Main Chrome profile |
| `Profile 1` | Second profile |
| `Profile 2` | Third profile, etc. |

To find your profile name, check `~/Library/Application Support/Google/Chrome/` on macOS.

Launch with fresh temporary profile (no login, clean state):
```
launch_chrome(url: "https://google.com")
```

### Take a screenshot
```
Use the screenshot tool to see what's on the page
```

### Navigate and interact
```
Navigate to https://example.com, then click the "More information" link
```

### Fill out a form
```
Type "hello@example.com" into the email input field (selector: input[type="email"])
```

### Execute JavaScript
```
Use evaluate to get document.title
```

### Get page content for analysis
```
Get the text content of the page
```

### Scrolling (Smart Fallback)
The `scroll` tool automatically tries multiple strategies:
```
scroll(direction: "down", amount: 300)
```
1. First tries **wheel event** (works for canvas apps)
2. Falls back to **DOM detection** (for web apps like Slack, Notion)
3. Final fallback to **window.scrollBy**

### Canvas App Control (Google Docs, Figma)
For apps that don't use standard HTML elements:
1. **Take Screenshot**: Use `screenshot` to see the UI.
2. **Estimate Coords**: Determine X,Y coordinates of your target.
3. **Interact**:
   ```
   mouse_move(x: 100, y: 200) -- Hover
   click(x: 100, y: 200)      -- Click
   smart_type(key: "A", modifiers: ["Cmd"]) -- Select All
   smart_type(key: "Hello")   -- Type text
   ```

### Canvas Zoom (Figma, Miro)
For zooming in/out on canvas-based design tools:
```
canvas_zoom(zoomIn: true, amount: 100)   -- Zoom in
canvas_zoom(zoomIn: false, amount: 100)  -- Zoom out
```
Uses Ctrl+scroll gesture which is standard for canvas apps.

## API Reference

### CDP Endpoint
- **Host:** `localhost`
- **Port:** `9222`
- **Protocol:** WebSocket (Chrome DevTools Protocol)

### MCP Tools Input Schema

| Tool | Required Params | Optional Params |
|------|-----------------|-----------------|
| `launch_chrome` | - | `url`, `profile` |
| `screenshot` | - | - |
| `click` | - | `selector`, `x`, `y` |
| `type` | `text` | `selector` |
| `navigate` | `url` | - |
| `evaluate` | `script` | - |
| `get_content` | `format` (text/html) | - |
| `list_tabs` | - | - |
| `switch_tab` | `tabId` | - |
| `scroll` | `direction` | `amount` |
| `wait_for` | `selector` | `timeout` |
| `mouse_move` | `x`, `y` | - |
| `drag_and_drop` | `startX`, `startY`, `endX`, `endY` | - |
| `smart_type` | `key` | `modifiers` |
| `canvas_zoom` | - | `zoomIn`, `amount` |

## Troubleshooting

### "Cannot connect to Chrome"
- Ensure Chrome is running with `--remote-debugging-port=9222`
- Check that nothing else is using port 9222
- Verify Chrome is accessible at http://localhost:9222

### "Element not found"
- Use `screenshot` to verify the page state
- Check the CSS selector is correct
- Use `wait_for` if element loads dynamically

### Large screenshots
- Screenshots are PNG base64 encoded
- Consider using `evaluate` to check state instead when screenshots aren't needed

## Technical Details

- Connects via WebSocket to Chrome DevTools Protocol
- Uses `chrome-remote-interface` npm package
- Single client connection (one controller at a time)
- Local-only connections for security

## License

MIT
