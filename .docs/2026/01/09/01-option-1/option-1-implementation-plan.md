# Bitbucket REST API MCP Server - Implementation Plan

## Phase 1: Project Setup

### Step 1.1: Create Directory Structure
```bash
mkdir -p bitbucket-mcp/src
cd bitbucket-mcp
```

### Step 1.2: Create package.json
Dependencies:
- @modelcontextprotocol/sdk
- node-fetch (for HTTP requests)
- TypeScript and type definitions

### Step 1.3: Create tsconfig.json
Configure TypeScript with:
- target: ES2022
- module: Node16
- strict: true
- esModuleInterop: true

## Phase 2: Implement BitbucketClient

### Step 2.1: Create bitbucket-client.ts
**Location:** `bitbucket-mcp/src/bitbucket-client.ts`

**Components:**
1. Constants (API_BASE_URL, MAX_RETRIES, etc.)
2. Interfaces (PullRequest, Branch, User, etc.)
3. BitbucketClient class with methods:
   - constructor() - Initialize with credentials
   - authenticate() - Test authentication
   - createPR() - Create pull request
   - getPR() - Get PR details
   - listPRs() - List PRs with filters
   - updatePR() - Update PR
   - approvePR() - Approve PR
   - mergePR() - Merge PR
   - addComment() - Add comment
   - getDiff() - Get diff

**Implementation Details:**

#### Before (No file exists)
```typescript
// File doesn't exist yet
```

#### After
```typescript
import fetch from 'node-fetch';

const API_BASE_URL = 'https://api.bitbucket.org/2.0';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  source: { branch: { name: string } };
  destination: { branch: { name: string } };
}

export class BitbucketClient {
  private apiToken: string;
  private authHeader: string;

  constructor() {
    this.apiToken = process.env.BITBUCKET_API_TOKEN || '';

    if (!this.apiToken) {
      throw new Error('BITBUCKET_API_TOKEN environment variable is required');
    }

    this.authHeader = `Bearer ${this.apiToken}`;
  }

  async createPR(params: CreatePRParams): Promise<PullRequest> { }
  async getPR(workspace: string, repoSlug: string, prId: number): Promise<PullRequest> { }
  async listPRs(workspace: string, repoSlug: string, state?: string): Promise<PullRequest[]> { }
  async updatePR(workspace: string, repoSlug: string, prId: number, updates: UpdatePRParams): Promise<PullRequest> { }
  async approvePR(workspace: string, repoSlug: string, prId: number): Promise<void> { }
  async mergePR(workspace: string, repoSlug: string, prId: number, strategy?: string): Promise<void> { }
  async addComment(workspace: string, repoSlug: string, prId: number, content: string): Promise<void> { }
  async getDiff(workspace: string, repoSlug: string, prId: number): Promise<string> { }
}
```

### Step 2.2: Implement HTTP Request Helper
Add private method `request()` for all API calls with:
- Retry logic
- Error handling
- Rate limit detection

## Phase 3: Implement MCP Server

### Step 3.1: Create index.ts
**Location:** `bitbucket-mcp/src/index.ts`

**Components:**
1. Import MCP SDK
2. Create Server instance
3. Define 8 tools (create_pr, get_pr, list_prs, etc.)
4. Implement CallToolRequestSchema handler
5. Setup stdio transport
6. Error handling

**Implementation Details:**

#### Before (No file exists)
```typescript
// File doesn't exist yet
```

#### After
```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { bitbucketClient } from "./bitbucket-client.js";

const server = new Server(
  {
    name: "bitbucket-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_pr",
        description: "Create a new pull request",
        inputSchema: { /* ... */ }
      },
      // ... 7 more tools
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_pr": { /* ... */ }
      case "get_pr": { /* ... */ }
      // ... handle all tools
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

## Phase 4: Configuration Files

### Step 4.1: Create package.json
```json
{
  "name": "bitbucket-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": { "bitbucket-mcp": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "node-fetch": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

### Step 4.2: Create tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Step 4.3: Create README.md
Documentation with:
- Installation instructions
- Configuration steps
- Usage examples
- Available tools

## Phase 5: Build and Test

### Step 5.1: Install Dependencies
```bash
cd bitbucket-mcp
npm install
```

### Step 5.2: Build Project
```bash
npm run build
```

### Step 5.3: Verify Build Output
Check `dist/` directory contains:
- index.js
- bitbucket-client.js

## Phase 6: Acceptance Criteria

Create AC document verifying:
1. ✅ Project builds without errors
2. ✅ All 8 tools defined in MCP server
3. ✅ BitbucketClient handles authentication
4. ✅ Error handling implemented
5. ✅ TypeScript strict mode passes
6. ✅ Proper MCP server structure
7. ✅ README with setup instructions

## Timeline
- Phase 1: 5 minutes
- Phase 2: 20 minutes
- Phase 3: 20 minutes
- Phase 4: 10 minutes
- Phase 5: 5 minutes
- Phase 6: 5 minutes

**Total: ~65 minutes**

## Notes
- No comments in code except TODOs
- Follow existing chrome-devtools-mcp patterns
- Use async/await for all API calls
- Proper error messages for users
