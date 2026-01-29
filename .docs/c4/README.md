# C4 Architecture Documentation

This directory contains C4 architecture diagrams for the MCP Servers project.

## Overview

The project consists of independent MCP (Model Context Protocol) servers that enable Claude Code to interact with external services.

## Documents

| Document | Description |
|----------|-------------|
| [chrome-devtools-mcp.md](./chrome-devtools-mcp.md) | Browser automation via Chrome DevTools Protocol |
| [bitbucket-mcp.md](./bitbucket-mcp.md) | Pull request management via Bitbucket REST API |
| [figma-mcp.md](./figma-mcp.md) | Design file access via Figma REST API |

## C4 Levels

Each document covers all four C4 model levels:

1. **System Context** - How the MCP server fits into the broader system
2. **Container** - The MCP server process and its boundaries
3. **Component** - Internal classes and their interactions
4. **Code** - File structure and key implementation details

## Diagram Formats

Each document includes both:
- **ASCII diagrams** - Terminal compatible, always readable
- **Mermaid diagrams** - GitHub renders natively, more visual
