# Acceptance Criteria: Background Initialization for Chrome DevTools MCP

## Success Metrics

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | MCP server starts within 100ms | Time from process start to `server.connect()` completion < 100ms |
| AC2 | Chrome launch begins immediately on startup | `initialize()` is called in `main()` without awaiting |
| AC3 | Tools wait for initialization before executing | `ensureInitialized()` is called in `ensureConnected()` |
| AC4 | Status tool returns current initialization state | `status` tool returns valid `InitializationStatus` |
| AC5 | No race conditions between init and tool calls | Multiple simultaneous tool calls all await same initialization promise |
| AC6 | Graceful degradation on Chrome launch failure | Failed state reflected in status and subsequent tool calls |
| AC7 | Chrome ready within 3 seconds of MCP start | Initialization completes within 3 seconds when Chrome not running |

## Test Cases

### TC1: Normal Startup
**Given:** Chrome is not running
**When:** MCP server starts
**Then:**
- Server connects immediately (< 100ms)
- Chrome launch begins in background
- Status returns `in_progress` immediately
- Status returns `ready` within 3 seconds

### TC2: Chrome Already Running
**Given:** Chrome is running with debug port 9222
**When:** MCP server starts
**Then:**
- Server connects immediately (< 100ms)
- Chrome launch is skipped
- Status returns `ready` immediately

### TC3: Tool Called Before Init Completes
**Given:** MCP server started, Chrome still initializing
**When:** User calls any tool (e.g., `screenshot`)
**Then:**
- Tool waits for initialization to complete
- Tool executes successfully after init
- Status returns `ready` after tool completes

### TC4: Chrome Launch Fails
**Given:** Chrome binary is not available
**When:** MCP server starts
**Then:**
- Server connects successfully
- Status returns `failed` with error message
- Tool calls return descriptive error

### TC5: Status Tool
**Given:** MCP server is running
**When:** User calls `status` tool
**Then:** Returns JSON with:
- `state`: one of `not_started`, `in_progress`, `ready`, `failed`
- `chromeRunning`: boolean
- `connected`: boolean
- `error`: string (if failed)

### TC6: Concurrent Tool Calls
**Given:** MCP server started, Chrome still initializing
**When:** Multiple tools called simultaneously
**Then:**
- All tools wait for same initialization promise
- No duplicate Chrome launches
- All tools execute successfully after init

## Definition of Done

- [x] All acceptance criteria met
- [x] TypeScript compilation succeeds without errors
- [x] No existing functionality broken
- [x] Documentation updated (spec and implementation plan)
