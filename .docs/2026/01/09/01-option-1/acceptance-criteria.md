# Bitbucket MCP Server - Acceptance Criteria

## Feature Overview
MCP server enabling Claude Code to interact with Bitbucket REST API v2.0 for pull request management operations.

## Build & Compilation

### AC-1: TypeScript Compilation ✅
**Status:** PASSED
- [x] Project builds without TypeScript errors
- [x] `npm run build` executes successfully
- [x] Output generated in `dist/` directory
- [x] All source maps generated (.js.map files)
- [x] Type declarations generated (.d.ts files)

**Verification:**
```bash
npm run build
# Result: Build completed with exit code 0
# Files generated: index.js, bitbucket-client.js + maps & declarations
```

### AC-2: TypeScript Strict Mode ✅
**Status:** PASSED
- [x] `strict: true` in tsconfig.json
- [x] No type errors in codebase
- [x] All function parameters typed
- [x] All return types explicit or inferred

## Code Structure

### AC-3: Project Architecture ✅
**Status:** PASSED
- [x] BitbucketClient class in `src/bitbucket-client.ts`
- [x] MCP server in `src/index.ts`
- [x] Proper separation of concerns
- [x] Follows existing chrome-devtools-mcp patterns
- [x] No comments except TODOs (none required)

### AC-4: BitbucketClient Implementation ✅
**Status:** PASSED (Updated for API Tokens)
- [x] Constructor validates BITBUCKET_API_TOKEN
- [x] Bearer Token authentication implemented
- [x] Private `request()` method with retry logic
- [x] 8 public methods for PR operations:
  - createPR()
  - getPR()
  - listPRs()
  - updatePR()
  - approvePR()
  - mergePR()
  - addComment()
  - getDiff()
- [x] Singleton instance exported
- [x] No username required (simpler auth)

## MCP Server Tools

### AC-5: Tool Definitions ✅
**Status:** PASSED
- [x] 8 tools defined in ListToolsRequestSchema handler
- [x] Each tool has proper inputSchema
- [x] Required parameters marked correctly
- [x] Optional parameters documented
- [x] Descriptive tool descriptions

**Tools:**
1. create_pr - Create new PR
2. get_pr - Get PR details
3. list_prs - List PRs with filters
4. update_pr - Update PR metadata
5. approve_pr - Approve PR
6. merge_pr - Merge PR with strategy
7. add_comment - Add comment to PR
8. get_diff - Get PR diff

### AC-6: Tool Implementation ✅
**Status:** PASSED
- [x] CallToolRequestSchema handler implemented
- [x] Switch statement handles all 8 tools
- [x] Proper parameter extraction
- [x] Calls BitbucketClient methods
- [x] Returns structured responses
- [x] JSON formatting for data responses

## Error Handling

### AC-7: Retry & Rate Limiting ✅
**Status:** PASSED
- [x] MAX_RETRIES set to 3
- [x] Exponential backoff implemented
- [x] HTTP 429 rate limit detection
- [x] Retry-After header parsing
- [x] Proper error propagation

### AC-8: Error Messages ✅
**Status:** PASSED
- [x] Authentication errors descriptive
- [x] HTTP errors include status codes
- [x] API errors include response text
- [x] isError flag set in tool responses
- [x] User-friendly error formatting

## Configuration

### AC-9: Environment Variables ✅
**Status:** PASSED (Updated for API Tokens)
- [x] BITBUCKET_API_TOKEN required
- [x] Validation in constructor
- [x] Clear error message if missing with help URL
- [x] Documented in README
- [x] .env.example file created
- [x] ⚠️ **Migration:** App Passwords deprecated Sept 9, 2025

### AC-10: Package Configuration ✅
**Status:** PASSED
- [x] package.json with correct dependencies
- [x] "type": "module" for ES modules
- [x] bin entry point defined
- [x] build and start scripts
- [x] Node.js version requirement (>=18.0.0)

## Documentation

### AC-11: README Completeness ✅
**Status:** PASSED
- [x] Installation instructions
- [x] Configuration steps
- [x] Environment variable setup
- [x] Claude Code integration guide
- [x] All 8 tools documented with parameters
- [x] Usage examples
- [x] Error handling description

### AC-12: Specification Documents ✅
**Status:** PASSED
- [x] option-1-spec.md created
- [x] option-1-implementation-plan.md created
- [x] Architecture documented
- [x] API endpoints listed
- [x] Data models defined

## Integration

### AC-13: MCP Protocol Compliance ✅
**Status:** PASSED
- [x] Server uses @modelcontextprotocol/sdk
- [x] StdioServerTransport configured
- [x] ListToolsRequestSchema handler
- [x] CallToolRequestSchema handler
- [x] Proper server initialization

### AC-14: Claude Code Compatibility ✅
**Status:** PASSED
- [x] Shebang line in index.ts
- [x] Executable entry point
- [x] Stdio transport for IPC
- [x] Integration command documented

## Success Metrics Summary

| Category | Criteria | Status |
|----------|----------|--------|
| Build | TypeScript compilation | ✅ PASSED |
| Build | Strict mode compliance | ✅ PASSED |
| Code | Project architecture | ✅ PASSED |
| Code | BitbucketClient implementation | ✅ PASSED |
| MCP | Tool definitions | ✅ PASSED |
| MCP | Tool implementation | ✅ PASSED |
| Error | Retry & rate limiting | ✅ PASSED |
| Error | Error messages | ✅ PASSED |
| Config | Environment variables | ✅ PASSED |
| Config | Package configuration | ✅ PASSED |
| Docs | README completeness | ✅ PASSED |
| Docs | Specification documents | ✅ PASSED |
| Integration | MCP protocol compliance | ✅ PASSED |
| Integration | Claude Code compatibility | ✅ PASSED |

## Overall Status: ✅ ALL CRITERIA PASSED

**Total Criteria:** 14/14 passed
**Build Status:** Success (exit code 0)
**TypeScript Errors:** 0
**Files Generated:** 10 (JS, maps, declarations)
**LOC Implemented:** ~450 lines across 2 source files

## API Token Migration ⚠️

**Update Applied:** September 9, 2025
- ✅ Switched from App Passwords to API Tokens
- ✅ Changed authentication from Basic Auth to Bearer Token
- ✅ Simplified credential management (no username required)
- ✅ Updated all documentation and code
- ✅ Environment variable changed: `BITBUCKET_API_TOKEN`

**Breaking Changes:**
- Old: `BITBUCKET_USERNAME` + `BITBUCKET_APP_PASSWORD`
- New: `BITBUCKET_API_TOKEN` only
- Migration deadline: June 9, 2026

## Next Steps

### 1. Set Your API Token
```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export BITBUCKET_API_TOKEN="your-token-here"

# Or set it temporarily for testing
export BITBUCKET_API_TOKEN="your-token-here"
```

### 2. Add to Claude Code
```bash
claude mcp add bitbucket -- node /Users/tommy-amarbank/Documents/startup/mcp/bitbucket-mcp/dist/index.js
```

### 3. Test with Actual Repository
- Create a test PR
- List PRs in your workspace
- Approve and merge PRs
- Monitor rate limits during usage

### 4. Verify Token Scopes
Ensure your token has:
- `pullrequest:write` - For PR operations
- `repository:read` - For reading repo data
