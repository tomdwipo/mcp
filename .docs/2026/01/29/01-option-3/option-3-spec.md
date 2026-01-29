# Option 3 Spec: Background Initialization for Chrome DevTools MCP

## Problem
The Chrome DevTools MCP server fails to connect because Chrome is not running with the debugging port enabled when Claude Code performs its initial health check. The current implementation only initializes Chrome lazily when a tool is called, which is too late.

## Solution
Implement background initialization that launches Chrome asynchronously without blocking the MCP server startup. Tools will wait for initialization to complete before executing.

## Requirements

### Functional Requirements
- FR1: MCP server starts immediately without waiting for Chrome
- FR2: Chrome launch begins in background on server start
- FR3: All tools wait for initialization to complete before executing
- FR4: If Chrome is already running with debug port, skip launch
- FR5: Provide initialization status to users

### Non-Functional Requirements
- NFR1: MCP startup time < 100ms
- NFR2: Chrome ready within 3 seconds of MCP start
- NFR3: No race conditions between initialization and tool calls
- NFR4: Graceful degradation if Chrome fails to launch

## Technical Design

### State Machine
```
                    [START]
                      |
                      v
              [INITIALIZING]
                      |
          +-----------+-----------+
          |                       |
          v                       v
    [READY]                [FAILED]
          |                       |
          +-------+-------+-------+
                  |
               [TOOLS]
```

### API Changes

#### ChromeClient Class
```typescript
class ChromeClient {
  private initializationPromise: Promise<void> | null = null;
  private initializationState: 'not_started' | 'in_progress' | 'ready' | 'failed';
  private initializationError: Error | null = null;

  initialize(): Promise<void>
  ensureInitialized(): Promise<void>
  getInitializationStatus(): InitializationStatus
}
```

#### InitializationStatus
```typescript
interface InitializationStatus {
  state: 'not_started' | 'in_progress' | 'ready' | 'failed';
  chromeRunning: boolean;
  connected: boolean;
  error?: string;
}
```

### Flow Diagram
```
MCP Start
    |
    +-> main() calls chromeClient.initialize()
    |       |
    |       v
    |   [Async Chrome Launch]
    |       |
    |       v
    +-> server.connect() (immediate)
            |
            v
        [MCP Ready]
            |
            v
        Tool Called
            |
            +-> ensureInitialized()
            |       |
            |       v
            +-> [Wait for init if needed]
            |       |
            |       v
            +-> Execute Tool
```

## Edge Cases
1. **Tool called before init completes**: Tool waits for initialization
2. **Chrome already running**: Skip launch, just connect
3. **Chrome launch fails**: Set failed state, return error on tool calls
4. **Multiple tools called simultaneously**: All await same initialization promise
5. **Init fails mid-flight**: State reflected in getInitializationStatus()
