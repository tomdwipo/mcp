# MCP Servers Project

## Project Overview

This project contains MCP (Model Context Protocol) servers that enable Claude Code to interact with various external services and tools.

## Module Documentation

### chrome-devtools-mcp
> **For detailed documentation, see:** [chrome-devtools-mcp/README.md](./chrome-devtools-mcp/README.md)

**Purpose:** MCP server bridging Claude Code to Chrome browser automation

**Key Features:**
- Screenshot capture
- Element clicking (selector/coordinates)
- Text input
- URL navigation
- JavaScript execution
- Page content extraction
- Tab management
- Scrolling and element waiting

**Quick Start:**
```bash
# 1. Start Chrome with debug port
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# 2. Add to Claude Code (configured globally)
claude mcp add chrome-devtools -- node ./chrome-devtools-mcp/dist/index.js
```

### bitbucket-mcp
> **For detailed documentation, see:** [bitbucket-mcp/README.md](./bitbucket-mcp/README.md)

**Purpose:** MCP server for Bitbucket REST API v2.0 - enables pull request management

**Key Features:**
- Create, read, update, delete pull requests
- Approve and merge PRs
- Add comments to PRs
- List PRs with filters
- Get PR diffs
- Automatic response filtering (~90% size reduction, full descriptions preserved)

**Authentication:** HTTP Basic Authentication (email:token)
- ⚠️ **App Passwords deprecated Sept 9, 2025** (disabled June 9, 2026)
- Requires `BITBUCKET_API_TOKEN` AND `BITBUCKET_EMAIL`
- Required scopes: `repository:read`, `pullrequest:read`, `pullrequest:write`
- **Critical:** Uses Basic auth (NOT Bearer tokens)

**Configuration:**
```json
// ~/.claude.json (hardcoded values required)
"bitbucket": {
  "env": {
    "BITBUCKET_API_TOKEN": "ATATT3xFf...",
    "BITBUCKET_EMAIL": "your-email@company.com"
  }
}
```

**Important Notes:**
- ❌ Shell environment variables NOT supported (`export` doesn't work)
- ❌ Variable substitution NOT supported (`${VAR}` doesn't work)
- ✅ Configure globally only (avoid project-specific overrides)
- ✅ Restart Claude Code after credential changes

**API Endpoints:**
- Base URL: `https://api.bitbucket.org/2.0`
- Rate Limit: 1000 requests/hour per token
- Retry Strategy: Max 3 retries with exponential backoff
- Response Size: ~10KB (filtered from ~100KB raw, preserves full descriptions)

## Project Structure

```
mcp/
├── CLAUDE.md                    # This file
├── chrome-devtools-mcp/         # Chrome browser automation
│   ├── README.md               # Detailed module docs
│   ├── src/
│   │   ├── index.ts            # MCP server entry
│   │   └── chrome-client.ts    # CDP connection manager
│   └── dist/                   # Compiled output
├── bitbucket-mcp/              # Bitbucket PR management
│   ├── README.md               # Detailed module docs
│   ├── src/
│   │   ├── index.ts            # MCP server entry
│   │   └── bitbucket-client.ts # REST API client
│   ├── dist/                   # Compiled output
│   └── .env                    # Local token (optional)
└── .docs/                      # Specifications and plans
```

## Technical Context

### MCP Protocol
- **Transport:** stdio (standard input/output)
- **SDK:** `@modelcontextprotocol/sdk`
- **Configuration:** Global (`~/.claude.json`) and per-project
- **Tool Invocation:** JSON-RPC style message passing

### chrome-devtools-mcp
- **Protocol:** Chrome DevTools Protocol (CDP) over WebSocket
- **Endpoint:** `localhost:9222`
- **Limitation:** Single client connection
- **Tools:** 15 browser automation commands

### bitbucket-mcp
- **Protocol:** REST API v2.0 over HTTPS
- **Endpoint:** `https://api.bitbucket.org/2.0`
- **Authentication:** HTTP Basic Authentication (base64-encoded email:token)
- **Tools:** 8 pull request management commands
- **Rate Limit:** 1000 requests/hour per token
- **Response Filtering:** ~90% size reduction (107KB → 10KB, preserves full descriptions)

## Global Configuration

Both MCP servers are configured globally in `~/.claude.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/chrome-devtools-mcp/dist/index.js"],
      "env": {}
    },
    "bitbucket": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/bitbucket-mcp/dist/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token-here",
        "BITBUCKET_EMAIL": "your-email@company.com"
      }
    }
  }
}
```

**Credential Management:**
- **Bitbucket MCP:** Credentials MUST be hardcoded in `~/.claude.json` `env` object
- **Chrome DevTools:** No credentials required (uses local Chrome instance)
- **Local .env files:** Fallback for development/testing only

## Coding Guidelines

1. Follow TypeScript strict mode
2. Use async/await for all async operations
3. Handle connection errors gracefully with retry logic
4. Provide actionable error messages with context
5. No comments in code except TODO comments
6. Environment variable validation at initialization

## Documentation References

- **chrome-devtools-mcp:** See [chrome-devtools-mcp/README.md](./chrome-devtools-mcp/README.md) for:
  - Available tools and parameters
  - CDP connection setup
  - Browser launch configuration
  - Scrolling strategies

- **bitbucket-mcp:** See [bitbucket-mcp/README.md](./bitbucket-mcp/README.md) for:
  - API token creation steps (with correct scopes)
  - HTTP Basic Authentication setup
  - Available tools and parameters
  - Response filtering details
  - Troubleshooting guide (401 errors, token overflow, etc.)
  - Configuration best practices

## Commit Message Format

Commits by: LAYER (not Claude)

## Deprecation Notices

⚠️ **Bitbucket App Passwords:**
- Deprecated: September 9, 2025
- Disabled: June 9, 2026
- Migration: Use API tokens with scopes instead
- See: [bitbucket-mcp/README.md](./bitbucket-mcp/README.md#creating-a-bitbucket-api-token)
