# Bitbucket MCP Server

MCP server that enables Claude Code to interact with Bitbucket via REST API v2.0 for pull request operations.

## Navigation

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Available Tools](#available-tools)
- [API Endpoints](#api-endpoints)
- [Response Optimization](#response-optimization)
- [Error Handling](#error-handling)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## Features

- Create, read, update pull requests
- Approve and merge PRs
- Add comments to PRs
- Get PR diffs
- List PRs with filters
- Automatic response filtering (~90% size reduction)

## Installation

```bash
cd bitbucket-mcp
npm install
npm run build
```

## Configuration

### Claude Code Configuration (Required)

The Bitbucket MCP is configured via `~/.claude.json`. Credentials must be hardcoded in the `env` object:

```json
{
  "mcpServers": {
    "bitbucket": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/bitbucket-mcp/dist/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-api-token-here",
        "BITBUCKET_EMAIL": "your-email@company.com"
      }
    }
  }
}
```

**Important:**
- ❌ Environment variable substitution (`${VAR}`) is NOT supported
- ✅ Use hardcoded values in the `env` object
- ✅ Configure globally (not per-project) to avoid override issues

### Local .env File (Fallback)

Create a `.env` file in the `bitbucket-mcp` directory:

```bash
BITBUCKET_API_TOKEN=your-api-token
BITBUCKET_EMAIL=your-email@company.com
```

**Note:** This is a fallback and only used if the Claude Code `env` object is empty.

## Authentication

### Creating a Bitbucket API Token

⚠️ **Important:** As of September 9, 2025, App Passwords are deprecated and replaced by API tokens.

1. Go to Bitbucket Settings → Personal settings → API tokens
2. Click "Create token"
3. Give it a descriptive name (e.g., "Claude Code MCP")
4. **Required scopes:**
   - ✅ `repository:read` - Read repository data
   - ✅ `pullrequest:read` - Read pull requests
   - ✅ `pullrequest:write` - Create/update/merge pull requests
5. Click "Create" and copy the generated token
6. **Note:** All existing app passwords will be disabled on June 9, 2026

### Authentication Method

**Critical:** Bitbucket API tokens use **HTTP Basic Authentication**, not Bearer tokens.

```typescript
// Authentication format
Authorization: Basic base64(email:api_token)
```

**Example:**
```bash
# Email: user@example.com
# Token: ATATT3xFf...
# Encoded: dXNlckBleGFtcGxlLmNvbTpBVEFUVDN4RmY...
# Header: Authorization: Basic dXNlckBleGFtcGxlLmNvbTpBVEFUVDN4RmY...
```

The MCP client automatically handles this encoding when provided with both `BITBUCKET_EMAIL` and `BITBUCKET_API_TOKEN`.

## Integration with Claude Code

The MCP is automatically configured globally and accessible from **any directory**.

You can verify the connection:

```bash
claude mcp list
```

You should see:
```
bitbucket: node /Users/.../bitbucket-mcp/dist/index.js - ✓ Connected
```

### Manual Setup (if needed)

If not already configured, add manually:

```bash
claude mcp add bitbucket -- node /path/to/bitbucket-mcp/dist/index.js
```

## Available Tools

### create_pr
Create a new pull request

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `title` (string): Pull request title
- `description` (string): Pull request description
- `sourceBranch` (string): Source branch name
- `destinationBranch` (string): Destination branch name

### get_pr
Get details of a specific pull request

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `prId` (number): Pull request ID

### list_prs
List pull requests in a repository

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `state` (string, optional): Filter by state (OPEN, MERGED, DECLINED, SUPERSEDED)

### update_pr
Update pull request title or description

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `prId` (number): Pull request ID
- `title` (string, optional): New title
- `description` (string, optional): New description

### approve_pr
Approve a pull request

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `prId` (number): Pull request ID

### merge_pr
Merge a pull request

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `prId` (number): Pull request ID
- `strategy` (string, optional): Merge strategy (merge_commit, squash, fast_forward)

### add_comment
Add a comment to a pull request

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `prId` (number): Pull request ID
- `content` (string): Comment content

### get_diff
Get the diff/changes for a pull request

**Parameters:**
- `workspace` (string): Bitbucket workspace slug
- `repoSlug` (string): Repository slug
- `prId` (number): Pull request ID

## API Endpoints

All tools interact with Bitbucket REST API v2.0:

| Tool | Method | Endpoint |
|------|--------|----------|
| `create_pr` | POST | `/repositories/{workspace}/{repo}/pullrequests` |
| `get_pr` | GET | `/repositories/{workspace}/{repo}/pullrequests/{id}` |
| `list_prs` | GET | `/repositories/{workspace}/{repo}/pullrequests?state={state}` |
| `update_pr` | PUT | `/repositories/{workspace}/{repo}/pullrequests/{id}` |
| `approve_pr` | POST | `/repositories/{workspace}/{repo}/pullrequests/{id}/approve` |
| `merge_pr` | POST | `/repositories/{workspace}/{repo}/pullrequests/{id}/merge` |
| `add_comment` | POST | `/repositories/{workspace}/{repo}/pullrequests/{id}/comments` |
| `get_diff` | GET | `/repositories/{workspace}/{repo}/pullrequests/{id}/diff` |

**Base URL:** `https://api.bitbucket.org/2.0`

## Response Optimization

To prevent token overflow in Claude Code, responses are automatically filtered and truncated:

### What's Filtered Out
- ❌ `participants` array (~10KB)
- ❌ `reviewers` array (~5KB)
- ❌ `rendered` HTML (~5KB)
- ❌ `summary` object (duplicate)
- ❌ `comment_count`, `task_count`, `merge_commit`, etc.

### What's Kept
- ✅ `id`, `title`, `state`
- ✅ `source` & `destination` branches
- ✅ `author` info
- ✅ `created_on`, `updated_on`
- ✅ `links.html.href`
- ✅ `description` (full text preserved)

### Size Reduction
```
Before: ~107,000 characters (includes all API metadata)
After:   ~10,000 characters (filtered to essential fields + full description)
Savings: ~90%
```

**Note:** Full PR descriptions are preserved. If you encounter token overflow with very large descriptions (>10K chars), the response will be saved to a file automatically.

## Usage Example

```bash
# Claude Code will automatically use these tools when you ask:
"Create a PR from feature-branch to main in my-workspace/my-repo with title 'Add new feature'"
"List all open PRs in my-workspace/my-repo"
"Approve PR #42 in my-workspace/my-repo"
```

## Error Handling

The server includes:
- Automatic retry logic (3 attempts)
- Exponential backoff
- Rate limit detection and handling
- Detailed error messages

## Technical Details

- **API Base URL**: https://api.bitbucket.org/2.0
- **Authentication**: HTTP Basic Authentication (email:token encoded as base64)
- **Rate Limit**: 1000 requests/hour per token
- **Retry Strategy**: Max 3 retries with exponential backoff
- **Response Format**: JSON (filtered to essential fields)
- **Description Limit**: 500 characters (configurable)
- **Transport**: stdio (standard input/output)
- **SDK**: @modelcontextprotocol/sdk

## Troubleshooting

### 401 Unauthorized Error

**Symptoms:**
```
Token is invalid, expired, or not supported for this endpoint.
```

**Common Causes:**
1. **Wrong authentication method** - Using Bearer instead of Basic
2. **Missing BITBUCKET_EMAIL** - Email is required for Basic auth
3. **Expired token** - API tokens can expire
4. **Insufficient scopes** - Token lacks `repository:read` permission

**Solution:**
1. Verify both credentials are set in `~/.claude.json`:
   ```json
   "env": {
     "BITBUCKET_API_TOKEN": "ATATT3xFf...",
     "BITBUCKET_EMAIL": "your-email@company.com"
   }
   ```
2. Restart Claude Code to reload MCP server
3. Test token with curl:
   ```bash
   curl -u "email:token" https://api.bitbucket.org/2.0/user
   ```

### Token Overflow / File Saved Error

**Symptoms:**
```
Error: result (120,481 characters) exceeds maximum allowed tokens.
Output has been saved to /Users/...
```

**Cause:** PR with very large description (>50K chars) or old server without filtering

**Solution:**
1. Ensure latest build with response filtering:
   ```bash
   cd bitbucket-mcp && npm run build
   ```
2. Restart Claude Code
3. If still occurs, the PR description is exceptionally large - use file-based access:
   ```bash
   # Read the saved file with jq
   cat /path/to/saved-file.txt | jq -r '.[0].text | fromjson | .description'
   ```

### Environment Variables Not Working

**Symptoms:** MCP server can't find credentials despite setting `export BITBUCKET_API_TOKEN`

**Cause:** Claude Code doesn't inherit shell environment variables

**Solution:**
- ❌ Don't use shell exports (`export VAR=value`)
- ❌ Don't use variable substitution (`"${VAR}"`)
- ✅ Hardcode values in `~/.claude.json` `env` object

### Project-Specific Config Override

**Symptoms:** Works in some projects but not others

**Cause:** Project-specific MCP config overrides global config

**Solution:**
1. Check `~/.claude.json` for project-specific configs:
   ```json
   "projects": {
     "/path/to/project": {
       "mcpServers": {
         "bitbucket": { "env": {} }  // ❌ Empty override
       }
     }
   }
   ```
2. Remove project-specific config or add credentials there too
3. Restart Claude Code

## License

MIT
