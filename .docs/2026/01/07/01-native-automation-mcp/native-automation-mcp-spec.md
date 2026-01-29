# Native Automation MCP Feature Spec

## Goal
Create an MCP server that enables Claude to control native macOS applications (Google Docs, Figma, etc.) using AppleScript and Accessibility APIs, allowing automation of desktop apps that cannot be controlled via Chrome DevTools Protocol.

## Requirements
- AppleScript execution for application control
- Accessibility API integration for element interaction  
- Application targeting by name or bundle ID
- UI element inspection and interaction
- Keyboard and mouse simulation
- Window management (focus, resize, position)
- Screen capture for application windows
- Error handling for permission denials

## Acceptance Criteria
- [ ] User can list running applications
- [ ] User can focus/activate a specific application
- [ ] User can click UI elements by accessibility label
- [ ] User can type text into focused application
- [ ] User can execute custom AppleScript commands
- [ ] User can take screenshot of specific app window
- [ ] User can read text content from UI elements
- [ ] Graceful error when Accessibility permissions denied
- [ ] MCP server registers with Claude Code successfully

## Implementation Approach
1. Create new MCP server module `native-automation-mcp`
2. Use `@jxa/run` for AppleScript/JXA execution in Node.js
3. Use `node-applescript` as fallback for pure AppleScript
4. Implement core tools: list_apps, focus_app, click_element, type_text, run_applescript, screenshot_app
5. Add accessibility permission check on startup
6. Register as MCP server with stdio transport

## Files to Modify
- **[NEW]** `native-automation-mcp/src/index.ts` - MCP server entry
- **[NEW]** `native-automation-mcp/src/native-client.ts` - AppleScript/Accessibility wrapper
- **[NEW]** `native-automation-mcp/src/accessibility.ts` - macOS Accessibility helpers
- **[NEW]** `native-automation-mcp/package.json` - Dependencies
- **[NEW]** `native-automation-mcp/tsconfig.json` - TypeScript config
- **[NEW]** `native-automation-mcp/README.md` - Documentation
- **[MODIFY]** `CLAUDE.md` - Add module documentation

## Technical Constraints
- **macOS only** - AppleScript and Accessibility APIs are macOS-specific
- **Accessibility permissions required** - User must grant in System Preferences
- **Node.js 18+** - For ESM and modern async/await
- **Single application focus** - Can only interact with one app at a time
- **UI element visibility** - Elements must be on-screen to interact

## Success Metrics
- Successfully control Google Docs desktop app
- Successfully control Figma desktop app  
- < 500ms latency for basic operations
- 0 crashes during normal operation
- Clear error messages for permission issues

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Accessibility permission denied | Check on startup, provide clear instructions |
| AppleScript execution failure | Wrap in try-catch, return actionable errors |
| UI element not found | Implement retry logic with timeout |
| Application not responding | Add timeout for all operations |
| Breaking changes in macOS | Pin to tested macOS versions in docs |

## Documentation Updates Required
- Update `CLAUDE.md` with new module documentation
- Create `native-automation-mcp/README.md` with setup guide
- Document Accessibility permission setup steps
- Add usage examples for common apps (Google Docs, Figma)

## Summary of Changes
Add new MCP server module for native macOS application automation using AppleScript and Accessibility APIs. This enables control of desktop apps that cannot be automated via CDP, including Google Docs, Figma, Slack, and other native applications. Requires explicit Accessibility permissions and is limited to macOS only.
