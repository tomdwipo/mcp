# figma-mcp

MCP server for Figma REST API - enables Claude Code to read design files, components, variables, and Dev Mode resources.

## Features

- Read Figma file structure and nodes
- Export nodes as images (JPG, PNG, SVG, PDF)
- Access components (including library components)

## Installation

```bash
npm install
npm run build
```

## Configuration

### Creating a Figma Access Token

1. Go to [Figma Developer Settings](https://www.figma.com/developer/personal-access-tokens)
2. Click "Generate new personal access token"
3. Give it a descriptive name (e.g., "Claude Code MCP")
4. Copy the token

### Setting Up the Environment Variable

**IMPORTANT:** Figma MCP requires the `FIGMA_ACCESS_TOKEN` to be configured globally in Claude Code's settings.

The token must be hardcoded in `~/.claude.json`:

```json
{
  "mcpServers": {
    "figma": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/figma-mcp/dist/index.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your-token-here"
      }
    }
  }
}
```

**Notes:**
- Shell environment variables (`export FIGMA_ACCESS_TOKEN=...`) are NOT supported
- Variable substitution (`${FIGMA_ACCESS_TOKEN}`) does NOT work
- The token must be hardcoded as a string value
- Restart Claude Code after updating the configuration

### Optional: Local .env File

For testing, you can create a `.env` file in the figma-mcp directory:

```bash
cp .env.example .env
# Edit .env and add your token
```

This is only for local development and will NOT work when Claude Code runs the MCP server.

## Available Tools

### get_file

Get a Figma file's document structure.

**Parameters:**
- `key` (required): Figma file key from URL
- `version` (optional): Specific version to retrieve
- `depth` (optional): Depth of node tree to retrieve

**Example:**
```
File URL: https://www.figma.com/file/abc123/My-Design
File key: abc123
```

### get_file_nodes

Get specific nodes from a Figma file by their IDs.

**Parameters:**
- `key` (required): Figma file key
- `ids` (required): Array of node IDs to retrieve
- `version` (optional): Specific version to retrieve
- `depth` (optional): Depth of node tree to retrieve

### get_image_render

Export nodes from a Figma file as images.

**Parameters:**
- `key` (required): Figma file key
- `ids` (required): Array of node IDs to export
- `format` (optional): Image format (jpg, png, svg, pdf)
- `scale` (optional): Image scale factor (default: 1)
- `svgExportId` (optional): SVG export identifier

### get_components

Get all components from a Figma file.

**Parameters:**
- `key` (required): Figma file key
- `since` (optional): Timestamp to get components modified after

## API Endpoints

Base URL: `https://api.figma.com/v1`

- GET `/files/:key` - Get file
- GET `/files/:key/nodes` - Get file nodes
- GET `/images/:key` - Get image exports
- GET `/files/:key/components` - Get components

## Future Enhancements

### Removed Tools (Available in Figma API)

The following tools are available in Figma's API but were removed from this MCP server. They can be re-added when needed:

| Tool | API Endpoint | Description |
|------|--------------|-------------|
| `get_local_components` | `/files/{key}/local_components` | Get components defined within this file only (not from libraries) |
| `get_variables` | `/files/{key}/variables` | Get design variables (design tokens) |
| `get_variable_collections` | `/files/{key}/variable_collections` | Get variable collections with modes |
| `get_dev_resources` | `/files/{key}/dev_resources` | Get Dev Mode attachments (links, code snippets) |
| `get_text_events` | `/teams/{teamId}/text_events` | Get historical text content changes |

**Why removed:** These endpoints return 404 when files don't have these specific features enabled. The implementation code exists in `src/figma-client.ts` (lines 320-414) and can be restored when a use case arises.

### Not Yet Implemented

The following tools are documented for future implementation:

#### Comments
- `get_comments` - List comments on a file
- `post_comment` - Add a comment to a file
- `delete_comment` - Delete a comment

#### Webhooks
- `create_webhook` - Create a webhook
- `list_webhooks` - List webhooks
- `delete_webhook` - Delete a webhook

#### Projects
- `get_team_projects` - List team projects
- `create_project` - Create a project

#### Versions
- `get_file_versions` - Get version history
- `create_version` - Create a version

#### Users
- `get_me` - Get current user info
- `get_user` - Get user info

#### Branches
- `get_branches` - List branches
- `create_branch` - Create a branch

#### Libraries
- `get_library_analytics` - Get usage metrics

## Error Handling

The server includes retry logic for:
- Rate limiting (HTTP 429)
- Network errors
- Server errors (5xx)

Max retries: 3 with exponential backoff.

## License

MIT
