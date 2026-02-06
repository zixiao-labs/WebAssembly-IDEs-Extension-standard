# Permission Model Specification

**Version:** 0.1.0

## Overview

The permission model provides fine-grained control over extension capabilities. Extensions declare required permissions in their manifest, and users must approve them before the extension can be activated.

## Design Principles

1. **Explicit**: Extensions cannot access capabilities without declared permissions
2. **Least Privilege**: Extensions should request only necessary permissions
3. **User Control**: Users can review and revoke permissions
4. **Granular**: Permissions can be scoped to specific resources

## Permission Format

Permissions follow a hierarchical namespace format:

```
<category>:<scope>[:<qualifier>]
```

Examples:
- `workspace:read` - Read workspace files
- `network:fetch:api.github.com` - Fetch from specific domain
- `ui:*` - All UI permissions

## Permission Categories

### Core Permissions

Always available, no permission needed:
- `core:lifecycle` - Activation/deactivation
- `core:logging` - Logging
- `core:context` - Extension context

Requires permission:
| Permission | Description |
|------------|-------------|
| `storage:local` | Workspace-scoped storage |
| `storage:global` | Global storage across workspaces |
| `storage:secrets` | Secure credential storage |

### Editor Permissions

| Permission | Description |
|------------|-------------|
| `editor:read` | Read document content |
| `editor:write` | Modify document content |
| `editor:selection` | Read/modify selections |
| `editor:decorations` | Add visual decorations |
| `editor:*` | All editor permissions |

### Workspace Permissions

| Permission | Description |
|------------|-------------|
| `workspace:read` | Read files in workspace |
| `workspace:write` | Write files in workspace |
| `workspace:config` | Read configuration |
| `workspace:write-config` | Modify configuration |
| `workspace:*` | All workspace permissions |

### UI Permissions

| Permission | Description |
|------------|-------------|
| `ui:notifications` | Show notifications |
| `ui:commands` | Register commands |
| `ui:menus` | Contribute to menus |
| `ui:quickpick` | Show quick pick dialogs |
| `ui:webview` | Create webview panels |
| `ui:*` | All UI permissions |

### Language Permissions

| Permission | Description |
|------------|-------------|
| `language:completion` | Provide completions |
| `language:diagnostics` | Report diagnostics |
| `language:hover` | Provide hover info |
| `language:definition` | Provide navigation |
| `language:symbols` | Provide symbols |
| `language:*` | All language permissions |

### Network Permissions

| Permission | Description |
|------------|-------------|
| `network:fetch` | HTTP requests (any domain) |
| `network:fetch:<pattern>` | HTTP to specific domains |
| `network:websocket` | WebSocket connections (any) |
| `network:websocket:<pattern>` | WebSocket to specific hosts |
| `network:realtime` | Realtime pub/sub connections |
| `network:realtime:<pattern>` | Realtime to specific servers |

Domain patterns support:
- Exact match: `api.github.com`
- Subdomain wildcard: `*.github.com`
- Any domain: `*` (requires `network:fetch` or `network:websocket`)

### Core Events Permission

| Permission | Description |
|------------|-------------|
| `core:events` | Subscribe to IDE events (file changes, configuration, theme) |

This is a low-risk permission typically auto-granted as it only allows reading event notifications.

### Collaboration Permissions (Optional Capability)

Collaboration permissions enable real-time collaborative editing features. These are part of the **collaboration** optional capability and require explicit user consent.

| Permission | Description |
|------------|-------------|
| `collaboration:session` | Create, join, and manage collaboration sessions |
| `collaboration:crdt` | Access CRDT document operations for conflict-free editing |
| `collaboration:awareness` | Share and receive cursor positions and presence info |
| `collaboration:*` | All collaboration permissions |

**Note:** Collaboration is an optional capability, not part of the standard conformance levels. IDEs may or may not implement these interfaces.

## Permission Escalation

Extensions can request additional permissions at runtime:

```wit
// In core/context.wit
request-permission: func(permission: string) -> result<bool, string>;
```

The IDE will prompt the user. If denied, the function returns `false`.

## Permission Bundles

Common permission sets can be referenced by name:

| Bundle | Included Permissions |
|--------|---------------------|
| `bundle:language-server` | `workspace:read`, `language:*` |
| `bundle:formatter` | `editor:read`, `editor:write` |
| `bundle:linter` | `workspace:read`, `language:diagnostics` |
| `bundle:collaboration` | `collaboration:*`, `network:realtime`, `core:events` |
| `bundle:ai-assistant` | `editor:read`, `editor:write`, `network:fetch`, `ui:*` |

## Risk Levels

Permissions are categorized by risk:

### Low Risk (Auto-approvable)
- `ui:notifications`
- `ui:commands`
- `language:hover`
- `language:completion`
- `core:events`

### Medium Risk (User Prompt)
- `workspace:read`
- `editor:read`
- `editor:write`
- `storage:*`
- `collaboration:awareness`

### High Risk (Explicit Warning)
- `workspace:write`
- `network:fetch`
- `network:websocket`
- `ui:webview`
- `collaboration:session`
- `collaboration:crdt`

### Dangerous (Strong Warning)
- `network:fetch:*` (any domain)
- `network:realtime` (persistent connections)
- Combined `network` + `workspace:write`
- Combined `collaboration:*` + `network:*`

## User Interface Guidelines

IDEs should:

1. **Group permissions** by category in approval dialogs
2. **Explain implications** of each permission
3. **Highlight dangerous** combinations
4. **Allow granular** approval/denial
5. **Provide revocation** UI in settings

Example approval dialog:

```
┌─────────────────────────────────────────────────────────┐
│  "my-extension" requests the following permissions:     │
│                                                         │
│  📁 Workspace                                           │
│  ├ ☑ Read files in workspace                           │
│  └ ☑ Write files in workspace                          │
│                                                         │
│  🌐 Network                                             │
│  └ ☑ Connect to api.github.com                         │
│                                                         │
│  ⚠️  This extension can modify your files and          │
│     connect to the internet.                           │
│                                                         │
│  [Deny]                              [Allow Selected]  │
└─────────────────────────────────────────────────────────┘
```

## Permission Inheritance

Child scopes inherit from parent:
- `workspace:*` includes `workspace:read` and `workspace:write`
- `editor:*` includes all editor permissions

## Security Considerations

1. **No implicit permissions**: Even "safe" operations require explicit grants
2. **No permission persistence**: Permissions can be revoked at any time
3. **Audit logging**: IDEs should log permission usage for sensitive operations
4. **Scope limitation**: File access is always limited to workspace boundaries
