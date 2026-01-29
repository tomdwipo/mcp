# figma-mcp Architecture

C4 architecture documentation for the Figma MCP server.

## Level 1: System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Code                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MCP Client Layer                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │   Chrome    │  │  Bitbucket  │  │     Figma       │  │  │
│  │  │   MCP       │  │    MCP      │  │     MCP         │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │  │
│  └─────────┼────────────────┼─────────────────┼─────────────┘  │
└────────────┼────────────────┼─────────────────┼────────────────┘
             │                │                 │
             │                │                 │
┌────────────┘           ┌────┘                 │
│                          │                    │
│  ┌─────────────────┐    │    ┌──────────────────────────────┐
│  │    Chrome       │    │    │         Figma API            │
│  │  (localhost:    │    │    │  api.figma.com/v1            │
│  │   9222)         │    │    │  - Files                     │
│  └─────────────────┘    │    │  - Images                    │
│                         │    │  - Components                │
│  ┌─────────────────┐    │    └──────────────────────────────┘
│  │   Bitbucket     │    │
│  │     API         │    │
│  │  api.bitbucket  │    │
│  │     .org        │    │
│  └─────────────────┘    │
```

### External Entities

| Entity | Description | Interaction |
|--------|-------------|-------------|
| **Claude Code** | AI coding assistant | Initiates requests via MCP |
| **Figma API** | Figma REST API v1 | Provides design file data |

## Level 2: Container

```
┌──────────────────────────────────────────────────────────────────┐
│                         Claude Code                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    figma-mcp Process                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              MCP Server (stdio)                      │  │  │
│  │  │  ┌───────────────┐  ┌─────────────────────────┐     │  │  │
│  │  │  │  Tool Router  │──│  figma-client.ts        │     │  │  │
│  │  │  └───────────────┘  │  - HTTP client          │     │  │  │
│  │  │                     │  - Retry logic          │     │  │  │
│  │  │                     │  - Response filtering   │     │  │  │
│  │  │                     └───────────┬─────────────┘     │  │  │
│  │  └─────────────────────────────────┼─────────────────────┘  │  │
│  └────────────────────────────────────┼────────────────────────┘  │
└─────────────────────────────────────────┼──────────────────────────┘
                                          │
                                          │ HTTPS
                                          │
                           ┌──────────────┴──────────────┐
                           │     Figma REST API v1       │
                           │  api.figma.com/v1           │
                           │  - GET /files/{key}         │
                           │  - GET /files/{key}/nodes   │
                           │  - GET /images/{key}        │
                           │  - GET /files/{key}/components│
                           └─────────────────────────────┘
```

### Container Details

| Container | Technology | Responsibilities |
|-----------|------------|------------------|
| **MCP Server** | TypeScript, Node.js, stdio | Exposes tools, handles requests |
| **Figma Client** | node-fetch, native fetch | API communication, retry logic |
| **Figma API** | HTTPS REST API | Design file access |

## Level 3: Component

```
┌─────────────────────────────────────────────────────────────────┐
│                         figma-mcp Server                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    index.ts (MCP Server)                 │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         ListToolsRequestSchema                   │    │   │
│  │  │  - get_file                                      │    │   │
│  │  │  - get_file_nodes                                │    │   │
│  │  │  - get_image_render                              │    │   │
│  │  │  - get_components                                │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         CallToolRequestSchema                    │    │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │    │   │
│  │  │  │get_file   │  │get_nodes  │  │get_images   │  │    │   │
│  │  │  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │    │   │
│  │  └────────┼───────────────┼────────────────┼─────────┘    │   │
│  └───────────┼───────────────┼────────────────┼──────────────┘   │
│              │               │                │                    │
│              └───────────────┴────────────────┘                    │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────┐    │   │
│  │                  figma-client.ts                         │    │   │
│  │  ┌─────────────────────────────────────────────────┐    │    │   │
│  │  │           FigmaClient Class                      │    │    │   │
│  │  │  ┌──────────────┐  ┌─────────────────────────┐  │    │    │   │
│  │  │  │  request<T>  │  │   filterNodeData()      │  │    │    │   │
│  │  │  │  - retry     │  │   filterFileData()      │  │    │    │   │
│  │  │  │  - 429 handle│  │                         │  │    │    │   │
│  │  │  └──────────────┘  └─────────────────────────┘  │    │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Details

| Component | Responsibilities |
|-----------|-----------------|
| **MCP Server** | Tool registration, request routing, response formatting |
| **Tool Router** | Maps tool names to client methods |
| **FigmaClient** | HTTP communication, authentication, retry logic |
| **Response Filter** | Reduces payload size (depth limiting, node filtering) |

## Level 4: Code

### File Structure

```
figma-mcp/
├── src/
│   ├── index.ts           # MCP server, tool definitions
│   └── figma-client.ts    # Figma API client
├── dist/
│   ├── index.js
│   └── figma-client.js
├── package.json
└── tsconfig.json
```

### Tool Definitions

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `get_file` | `GET /files/{key}` | Get file document structure |
| `get_file_nodes` | `GET /files/{key}/nodes` | Get specific nodes |
| `get_image_render` | `GET /images/{key}` | Export as images |
| `get_components` | `GET /files/{key}/components` | Get all components |

### Key Functions

```typescript
// figma-client.ts
class FigmaClient {
  private async request<T>(endpoint, options): Promise<T>
  private filterNodeData(node: any, depth: number): any
  private filterFileData(file: any): FigmaFile

  async getFile(key: string, version?: string, depth?: number)
  async getFileNodes(key: string, ids: string[], version?: string, depth?: number)
  async getImageRender(key: string, ids: string[], options?: ImageRenderOptions)
  async getComponents(key: string, since?: string)
}
```

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/files/{key}` | GET | Get file metadata and document tree |
| `/files/{key}/nodes` | GET | Get specific nodes by IDs |
| `/images/{key}` | GET | Get image export URLs |
| `/files/{key}/components` | GET | Get component metadata |

### Data Flow

```
1. Claude Code calls tool (e.g., "get_file")
   ↓
2. MCP Server receives CallToolRequest
   ↓
3. FigmaClient.request() makes HTTPS call
   ↓
4. Figma API returns JSON
   ↓
5. Response filtered (depth limiting, node filtering)
   ↓
6. Formatted as MCP text response
   ↓
7. Claude Code receives result
```

### Authentication

```typescript
// X-Figma-Token header
headers: {
  "X-Figma-Token": this.authHeader
}
```

### Error Handling

| Error Type | Handling |
|------------|----------|
| HTTP 429 | Exponential backoff retry (max 3) |
| Network errors | Retry with delay (max 3) |
| 404 | Propagated as error (file/node not found) |
| 401 | Propagated as error (invalid token) |
