# MCP Servers

[Model Context Protocol](https://modelcontextprotocol.io) servers that enable [Claude Code](https://claude.ai/code) to interact with external services and tools.

## Overview

This project provides independent MCP servers that bridge Claude Code to:

| Server | Purpose | Tools | Status |
|--------|---------|-------|--------|
| **chrome-devtools-mcp** | Browser automation via Chrome DevTools Protocol | 15 | ✅ Stable |
| **bitbucket-mcp** | Pull request management via Bitbucket REST API v2 | 8 | ✅ Stable |
| **figma-mcp** | Design file access via Figma REST API | 4 | ✅ Stable |

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Claude Code CLI
- Chrome browser (for chrome-devtools-mcp)
- Figma account (for figma-mcp)

### Installation

```bash
# Clone the repository
git clone https://github.com/tomdwipo/mcp.git
cd mcp

# Install dependencies
npm install
```

### Build

```bash
# Build all servers
npm run build

# Or build individually
cd chrome-devtools-mcp && npm run build
cd bitbucket-mcp && npm run build
cd figma-mcp && npm run build
```

## Configuration

Add servers to `~/.claude.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp/chrome-devtools-mcp/dist/index.js"],
      "env": {}
    },
    "bitbucket": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp/bitbucket-mcp/dist/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token-here",
        "BITBUCKET_EMAIL": "your-email@company.com"
      }
    },
    "figma": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp/figma-mcp/dist/index.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your-token-here"
      }
    }
  }
}
```

### Chrome DevTools Setup

```bash
# Launch Chrome with debugging port
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### Bitbucket API Token

Create an API token at https://bitbucket.org/account/settings/app-passwords/ with scopes:
- `repository:read`
- `pullrequest:read`
- `pullrequest:write`

### Figma Access Token

Create a personal access token at https://www.figma.com/developer/personal-access-tokens

## Project Structure

```
mcp/
├── chrome-devtools-mcp/    # Browser automation
│   ├── src/
│   │   ├── index.ts        # MCP server
│   │   └── chrome-client.ts
│   └── dist/
├── bitbucket-mcp/          # PR management
│   ├── src/
│   │   ├── index.ts        # MCP server
│   │   └── bitbucket-client.ts
│   └── dist/
├── figma-mcp/              # Design access
│   ├── src/
│   │   ├── index.ts        # MCP server
│   │   └── figma-client.ts
│   └── dist/
└── .docs/c4/               # C4 architecture docs
```

## Documentation

| Document | Description |
|----------|-------------|
| [chrome-devtools-mcp/README.md](./chrome-devtools-mcp/README.md) | Browser automation details |
| [bitbucket-mcp/README.md](./bitbucket-mcp/README.md) | PR management details |
| [figma-mcp/README.md](./figma-mcp/README.md) | Design file access details |
| [.docs/c4/](./.docs/c4/) | C4 architecture diagrams |
| [CLAUDE.md](./CLAUDE.md) | Project documentation for Claude Code |

## Available Tools

### chrome-devtools-mcp (15 tools)

- `launch_chrome` - Launch Chrome with debug port
- `screenshot` - Capture screenshot (base64 PNG)
- `click` - Click element or coordinates
- `type` - Type text into element
- `navigate` - Navigate to URL
- `evaluate` - Execute JavaScript
- `get_content` - Get page text/HTML
- `list_tabs` - List all tabs
- `switch_tab` - Switch to tab
- `scroll` - Smart scroll (wheel + DOM)
- `mouse_move` - Move mouse
- `drag_and_drop` - Drag from A to B
- `smart_type` - Type with modifiers
- `wait_for` - Wait for element
- `canvas_zoom` - Zoom on canvas apps

### bitbucket-mcp (8 tools)

- `create_pr` - Create pull request
- `get_pr` - Get PR details
- `list_prs` - List PRs with filters
- `update_pr` - Update PR metadata
- `approve_pr` - Approve PR
- `merge_pr` - Merge PR
- `add_comment` - Add comment
- `get_diff` - Get PR diff

### figma-mcp (4 tools)

- `get_file` - Get file document structure
- `get_file_nodes` - Get specific nodes by IDs
- `get_image_render` - Export nodes as images
- `get_components` - Get all components

## Technical Details

### MCP Protocol

- **Transport:** stdio (standard input/output)
- **SDK:** `@modelcontextprotocol/sdk`
- **Communication:** JSON-RPC style message passing

### chrome-devtools-mcp

- **Protocol:** Chrome DevTools Protocol (CDP) over WebSocket
- **Endpoint:** `localhost:9222`
- **Library:** `chrome-remote-interface`

### bitbucket-mcp

- **Protocol:** REST API v2.0 over HTTPS
- **Endpoint:** `https://api.bitbucket.org/2.0`
- **Authentication:** HTTP Basic Auth
- **Rate Limit:** 1000 requests/hour

### figma-mcp

- **Protocol:** REST API v1 over HTTPS
- **Endpoint:** `https://api.figma.com/v1`
- **Authentication:** Personal Access Token
- **Rate Limit:** Handles 429 with retry

## Development

```bash
# Watch mode for development
npm run dev

# Run tests (when available)
npm test

# Lint code
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

Made with ❤️ for [Claude Code](https://claude.ai/code)
