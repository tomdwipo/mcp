# Chrome DevTools MCP Server Feature Spec

## Goal
Create a custom MCP (Model Context Protocol) server that connects to an existing Chrome browser via Chrome DevTools Protocol (CDP), enabling Claude Code to control, inspect, and interact with web pages in the user's already-running Chrome instance on macOS.

## Requirements
- Connect to Chrome running with `--remote-debugging-port=9222`
- Screenshot capture of active tab or specific tab
- Click elements by coordinates or CSS selector
- Type text into focused elements
- Navigate to URLs
- Execute JavaScript in page context
- Get page content/DOM for analysis
- List all open tabs
- Switch between tabs
- Scroll page up/down/to element
- Wait for element to appear

## Acceptance Criteria
- [ ] MCP server can be added to Claude Code via `claude mcp add`
- [ ] Server connects to Chrome on localhost:9222
- [ ] `screenshot` tool captures current tab and returns base64 image
- [ ] `click` tool clicks element by selector or coordinates
- [ ] `type` tool inputs text into active element
- [ ] `navigate` tool opens URL in current tab
- [ ] `evaluate` tool executes JavaScript and returns result
- [ ] `get_content` tool returns page text/HTML for analysis
- [ ] `list_tabs` tool shows all open tabs with titles and URLs
- [ ] `switch_tab` tool activates a specific tab
- [ ] `scroll` tool scrolls page in specified direction
- [ ] `wait_for` tool waits for selector to appear
- [ ] Graceful error handling when Chrome not running
- [ ] Works on macOS with standard Chrome installation

## Implementation Approach
1. Create Node.js project with MCP SDK (`@anthropic-ai/sdk` or `@modelcontextprotocol/sdk`)
2. Use `chrome-remote-interface` npm package for CDP connection
3. Implement each tool as MCP tool handler
4. Package as executable npm package
5. Test locally with Claude Code
6. Document installation and usage

### Project Structure
```
chrome-devtools-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── chrome-client.ts  # CDP connection manager
│   └── tools/
│       ├── screenshot.ts
│       ├── click.ts
│       ├── type.ts
│       ├── navigate.ts
│       ├── evaluate.ts
│       ├── get-content.ts
│       ├── list-tabs.ts
│       ├── switch-tab.ts
│       ├── scroll.ts
│       └── wait-for.ts
└── README.md
```

### MCP Tool Definitions
```typescript
// screenshot - Capture current tab
{ name: "screenshot", description: "Take screenshot of current tab" }

// click - Click element
{ name: "click", description: "Click element by selector or coordinates",
  inputSchema: { selector?: string, x?: number, y?: number } }

// type - Type text
{ name: "type", description: "Type text into focused element",
  inputSchema: { text: string, selector?: string } }

// navigate - Go to URL
{ name: "navigate", description: "Navigate to URL",
  inputSchema: { url: string } }

// evaluate - Run JavaScript
{ name: "evaluate", description: "Execute JavaScript in page",
  inputSchema: { script: string } }

// get_content - Get page content
{ name: "get_content", description: "Get page text or HTML",
  inputSchema: { format: "text" | "html" } }

// list_tabs - List all tabs
{ name: "list_tabs", description: "List all open Chrome tabs" }

// switch_tab - Switch to tab
{ name: "switch_tab", description: "Switch to specific tab",
  inputSchema: { tabId: string } }

// scroll - Scroll page
{ name: "scroll", description: "Scroll page",
  inputSchema: { direction: "up"|"down"|"left"|"right", amount?: number } }

// wait_for - Wait for element
{ name: "wait_for", description: "Wait for element to appear",
  inputSchema: { selector: string, timeout?: number } }
```

## Files to Modify
- New project: `~/chrome-devtools-mcp/` (outside Android project)
- Claude Code config: `~/.claude/mcp.json` (add server entry)

## Technical Constraints
- Requires Chrome launched with `--remote-debugging-port=9222`
- Only works with Chromium-based browsers (Chrome, Edge, Brave)
- Screenshots return base64 PNG (may be large)
- CDP connection is single-client (one controller at a time)
- Node.js 18+ required for MCP SDK
- macOS specific Chrome path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

## Success Metrics
- Claude Code can successfully connect to running Chrome
- Screenshot + analyze + click workflow completes in < 5 seconds
- Zero crashes during normal operation
- Clear error messages when Chrome not available

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Chrome not running with debug port | Clear error message + instructions |
| Tab closed during operation | Reconnect logic + error handling |
| Large screenshot size | Compress/resize option |
| Security concerns | Local-only connection (localhost) |
| CDP API changes | Pin chrome-remote-interface version |

## Documentation Updates Required
- README.md with installation instructions
- Chrome launch command for macOS
- Claude Code MCP configuration example
- Usage examples for each tool
- Troubleshooting guide

## Summary of Changes
Create a new standalone Node.js MCP server project that bridges Claude Code with Chrome DevTools Protocol. This enables Claude to see and interact with web pages in the user's existing Chrome browser, providing capabilities for web research, form filling, testing, and automation tasks directly from Claude Code CLI.
