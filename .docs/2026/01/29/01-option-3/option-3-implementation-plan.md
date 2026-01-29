# Option 3 Implementation Plan

## Overview
Implement background initialization for Chrome DevTools MCP server.

## Implementation Steps

### Step 1: Add Initialization State to ChromeClient
**File:** `chrome-devtools-mcp/src/chrome-client.ts`

Add private properties for initialization tracking:
```typescript
private initializationPromise: Promise<void> | null = null;
private initializationState: 'not_started' | 'in_progress' | 'ready' | 'failed' = 'not_started';
private initializationError: Error | null = null;
```

Add initialization status interface:
```typescript
export interface InitializationStatus {
  state: 'not_started' | 'in_progress' | 'ready' | 'failed';
  chromeRunning: boolean;
  connected: boolean;
  error?: string;
}
```

### Step 2: Implement initialize() Method
**File:** `chrome-devtools-mcp/src/chrome-client.ts`

Add method to start background initialization:
```typescript
async initialize(): Promise<void> {
  if (this.initializationPromise) {
    return this.initializationPromise;
  }

  this.initializationState = 'in_progress';
  this.initializationPromise = (async () => {
    try {
      await this.ensureChromeRunning();
      await this.connect();
      this.initializationState = 'ready';
    } catch (error) {
      this.initializationState = 'failed';
      this.initializationError = error instanceof Error ? error : new Error(String(error));
    }
  })();

  return this.initializationPromise;
}
```

### Step 3: Implement ensureInitialized() Method
**File:** `chrome-devtools-mcp/src/chrome-client.ts`

Add method to wait for initialization:
```typescript
private async ensureInitialized(): Promise<void> {
  if (this.initializationState === 'ready') {
    return;
  }

  if (this.initializationState === 'failed') {
    throw this.initializationError || new Error('Initialization failed');
  }

  if (this.initializationPromise) {
    await this.initializationPromise;
    return;
  }

  await this.initialize();
}
```

### Step 4: Implement getInitializationStatus() Method
**File:** `chrome-devtools-mcp/src/chrome-client.ts`

Add method to get current status:
```typescript
getInitializationStatus(): InitializationStatus {
  const chromeRunning = this.client !== null;
  return {
    state: this.initializationState,
    chromeRunning,
    connected: chromeRunning,
    error: this.initializationError?.message,
  };
}
```

### Step 5: Update ensureConnected() to Use ensureInitialized()
**File:** `chrome-devtools-mcp/src/chrome-client.ts`

Modify existing ensureConnected method:
```typescript
async ensureConnected(): Promise<Client> {
  await this.ensureInitialized();

  if (!this.client) {
    throw new Error('Client not initialized after initialization completed');
  }

  return this.client;
}
```

### Step 6: Add status Tool to MCP Server
**File:** `chrome-devtools-mcp/src/index.ts`

Add status tool to tools list:
```typescript
{
  name: "status",
  description: "Get Chrome connection and initialization status",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
}
```

Add handler in CallToolRequestSchema:
```typescript
case "status": {
  const status = chromeClient.getInitializationStatus();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(status, null, 2),
      },
    ],
  };
}
```

### Step 7: Call initialize() in main()
**File:** `chrome-devtools-mcp/src/index.ts`

Update main function:
```typescript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  chromeClient.initialize().catch((error) => {
    console.error("Chrome initialization failed:", error);
  });
}
```

### Step 8: Update connect() Method to Skip ensureChromeRunning()
**File:** `chrome-devtools-mcp/src/chrome-client.ts`

The connect() method is called from initialize(), so remove the ensureChromeRunning() call:
- Remove line 52: `await this.ensureChromeRunning();`
- This is now handled by initialize()

### Step 9: Build and Test
Run build to compile TypeScript:
```bash
cd chrome-devtools-mcp && npm run build
```

### Step 10: Update Acceptance Criteria
Create/update acceptance-criteria.md with success metrics.

## Order of Changes
1. chrome-client.ts: Add state properties and interface
2. chrome-client.ts: Add initialize() method
3. chrome-client.ts: Add ensureInitialized() method
4. chrome-client.ts: Add getInitializationStatus() method
5. chrome-client.ts: Update ensureConnected()
6. chrome-client.ts: Update connect() method
7. index.ts: Add status tool
8. index.ts: Update main() to call initialize()
9. Build and verify
10. Create acceptance criteria
