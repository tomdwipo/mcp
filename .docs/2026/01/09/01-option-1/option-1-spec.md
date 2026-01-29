# Bitbucket REST API MCP Server - Specification

## Overview
MCP server that enables Claude Code to interact with Bitbucket via REST API v2.0 for pull request operations.

## Philosophy
Direct API communication beats browser automation for structured operations.

## Architecture

### Module Structure
```
bitbucket-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   └── bitbucket-client.ts # Bitbucket API client
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

#### BitbucketClient Class
Manages all Bitbucket API interactions with:
- Authentication handling (App Passwords/OAuth)
- HTTP client (node-fetch)
- Error handling and retries
- Rate limiting

#### MCP Tools
1. **create_pr** - Create new pull request
2. **get_pr** - Get PR details
3. **list_prs** - List pull requests (with filters)
4. **update_pr** - Update PR metadata
5. **approve_pr** - Approve a pull request
6. **merge_pr** - Merge pull request
7. **add_comment** - Add comment to PR
8. **get_diff** - Get PR diff/changes

## Authentication

### API Token (Primary Method)
⚠️ **As of September 9, 2025:** App Passwords are deprecated. Use API tokens with scopes.

- Bearer Token authentication
- Stored in environment variable:
  - `BITBUCKET_API_TOKEN`
- Required scopes:
  - `pullrequest:write` - For creating, updating, and merging PRs
  - `repository:read` - For reading repository information

### Migration Notice
- All existing app passwords will be disabled on June 9, 2026
- No username required with API tokens
- Simpler authentication flow

## API Endpoints

Base URL: `https://api.bitbucket.org/2.0`

### Pull Requests
- GET `/repositories/{workspace}/{repo_slug}/pullrequests`
- POST `/repositories/{workspace}/{repo_slug}/pullrequests`
- GET `/repositories/{workspace}/{repo_slug}/pullrequests/{pr_id}`
- PUT `/repositories/{workspace}/{repo_slug}/pullrequests/{pr_id}`
- POST `/repositories/{workspace}/{repo_slug}/pullrequests/{pr_id}/approve`
- POST `/repositories/{workspace}/{repo_slug}/pullrequests/{pr_id}/merge`
- GET `/repositories/{workspace}/{repo_slug}/pullrequests/{pr_id}/diff`
- POST `/repositories/{workspace}/{repo_slug}/pullrequests/{pr_id}/comments`

## Data Models

### Pull Request
```typescript
interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  source: Branch;
  destination: Branch;
  author: User;
  created_on: string;
  updated_on: string;
}
```

### Branch
```typescript
interface Branch {
  name: string;
  repository?: Repository;
}
```

## Error Handling

### HTTP Status Codes
- 401: Authentication failed
- 403: Insufficient permissions
- 404: Resource not found
- 409: Conflict (e.g., already merged)
- 429: Rate limit exceeded

### Retry Strategy
- Max 3 retries
- Exponential backoff (1s, 2s, 4s)
- Only retry on 5xx errors and rate limits

## Rate Limiting
- Bitbucket API: 1000 requests/hour per user
- Client tracks rate limit headers
- Automatic throttling when approaching limit

## Dependencies
- `@modelcontextprotocol/sdk`: ^1.0.0
- `node-fetch`: ^3.3.0
- `@types/node`: ^20.10.0
- `typescript`: ^5.3.0

## Configuration
Environment variables:
- `BITBUCKET_API_TOKEN` (required)
- `BITBUCKET_WORKSPACE` (optional default)
- `BITBUCKET_API_URL` (optional, defaults to https://api.bitbucket.org/2.0)

## Integration with Claude Code
```bash
# Add to Claude Code
claude mcp add bitbucket -- node ./bitbucket-mcp/dist/index.js

# Environment setup
export BITBUCKET_API_TOKEN="your-api-token"
```

## Success Criteria
1. Successfully authenticate with Bitbucket API
2. Create, read, update PRs via API
3. Handle errors gracefully with helpful messages
4. Respect rate limits
5. Return structured JSON responses
6. TypeScript strict mode compliance
7. Build successfully with no errors
