# Deprecation Analysis

## Overview
This document tracks deprecated technologies, APIs, and patterns across the MCP project. Regular updates ensure timely migrations and prevent breaking changes.

**Last Updated:** 2026-01-09

---

## Active Deprecations

### 1. Bitbucket App Passwords → API Tokens

**Status:** ⚠️ **CRITICAL - Action Required**

| Detail | Information |
|--------|-------------|
| **Deprecated Date** | September 9, 2025 |
| **Disable Date** | June 9, 2026 |
| **Affected Module** | `bitbucket-mcp` |
| **Impact** | HIGH - All authentication will fail after June 2026 |
| **Migration Status** | ✅ COMPLETED |

**What Changed:**
- **Old:** HTTP Basic Auth with username + app password
- **New:** Bearer Token with OAuth scopes

**Migration Steps Completed:**
1. ✅ Updated `bitbucket-client.ts` to use Bearer tokens
2. ✅ Changed env var from `BITBUCKET_USERNAME` + `BITBUCKET_APP_PASSWORD` to `BITBUCKET_API_TOKEN`
3. ✅ Updated all documentation (README, CLAUDE.md, specs)
4. ✅ Configured global environment variable in `~/.zshrc`
5. ✅ Tested authentication with new API token
6. ✅ Rebuilt and deployed new version

**Authentication Code Changes:**
```typescript
// OLD (Deprecated)
this.username = process.env.BITBUCKET_USERNAME || "";
this.appPassword = process.env.BITBUCKET_APP_PASSWORD || "";
this.authHeader = "Basic " + Buffer.from(`${this.username}:${this.appPassword}`).toString("base64");

// NEW (Current)
this.apiToken = process.env.BITBUCKET_API_TOKEN || "";
this.authHeader = `Bearer ${this.apiToken}`;
```

**Documentation References:**
- [bitbucket-mcp/README.md](./bitbucket-mcp/README.md#creating-a-bitbucket-api-token)
- [CLAUDE.md - Deprecation Notices](./CLAUDE.md#deprecation-notices)
- [.docs/2026/01/09/01-option-1/option-1-spec.md](. docs/2026/01/09/01-option-1/option-1-spec.md)

**Token Scopes Required:**
- `pullrequest:write` - For creating, updating, and merging PRs
- `repository:read` - For reading repository information

**Verification:**
```bash
# Check connection status
claude mcp list
# Should show: bitbucket: ... - ✓ Connected

# Test API call
# Ask Claude: "List all PRs in workspace/repo"
```

---

## Superseded Specifications

### bitbucket-mcp Authentication Specs

**Superseded Spec:**
- File: `.docs/2026/01/09/01-option-1/option-1-spec.md` (original version)
- Date: 2026-01-09 (initial)
- Authentication: App Passwords (Basic Auth)

**Current Spec:**
- File: `.docs/2026/01/09/01-option-1/option-1-spec.md` (updated)
- Date: 2026-01-09 (revised)
- Authentication: API Tokens (Bearer Token)

**Key Differences:**
| Aspect | Superseded | Current |
|--------|------------|---------|
| Auth Method | HTTP Basic Auth | Bearer Token |
| Credentials | Username + Password | Token only |
| Env Variables | 2 variables | 1 variable |
| Header Format | `Authorization: Basic <base64>` | `Authorization: Bearer <token>` |
| Security | Full account access | Scoped permissions |

---

## Monitoring & Prevention

### Deprecation Detection Strategy

1. **Monthly API Changelog Review**
   - Check Bitbucket Cloud changelog
   - Review Atlassian developer updates
   - Monitor `@modelcontextprotocol/sdk` releases

2. **Automated Checks**
   - Environment variable validation at startup
   - Error message patterns for deprecated endpoints
   - Version compatibility checks

3. **Documentation Updates**
   - Update this file when deprecations announced
   - Link to migration guides
   - Set calendar reminders for disable dates

### Next Review Date

**Scheduled:** February 9, 2026
- Check Bitbucket API v2.0 deprecation notices
- Review MCP SDK breaking changes
- Verify all tokens have correct scopes

---

## Migration Checklist Template

When handling future deprecations:

- [ ] Identify affected modules
- [ ] Research replacement API/technology
- [ ] Update implementation code
- [ ] Update environment variables
- [ ] Update documentation (README, CLAUDE.md, specs)
- [ ] Test new implementation
- [ ] Deploy and verify
- [ ] Update this DEPRECATION_ANALYSIS.md
- [ ] Set calendar reminder for disable date
- [ ] Communicate to team/users

---

## Historical Deprecations

### None
This is the first tracked deprecation for the MCP project.

---

## References

- [Bitbucket API Tokens Documentation](https://support.atlassian.com/bitbucket-cloud/docs/api-tokens/)
- [Bitbucket App Passwords Deprecation Notice](https://developer.atlassian.com/cloud/bitbucket/deprecation-notice-basic-auth-api-and-app-passwords/)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)

---

**Document Status:** Up to date as of 2026-01-09
**Next Review:** 2026-02-09
