# IDE Extension Standard - Overview

**Version:** 0.1.0 (Draft)
**Status:** Draft
**Last Updated:** 2026-02-04

## Introduction

The IDE Extension Standard defines a common interface for IDE extensions compiled to WebAssembly. This standard enables extension authors to write extensions once and run them in any IDE that implements the standard, while providing a secure, sandboxed execution environment.

## Goals

1. **Portability**: Extensions should work across different IDEs without modification
2. **Security**: Extensions run in a sandbox with explicit, user-granted permissions
3. **Performance**: Near-native execution through WebAssembly
4. **Language Agnostic**: Support any language that compiles to WebAssembly

## Non-Goals

1. **Full API Compatibility**: This is not a compatibility layer for VS Code extensions
2. **Runtime Interoperability**: Extensions from different standards cannot directly interact
3. **Native Code Execution**: No escape hatches to run native code

## Architecture

### Component Model

The standard is built on the [WebAssembly Component Model](https://component-model.bytecodealliance.org/) and [WASI](https://wasi.dev/). Extensions are WASM components that:

1. **Import** host-provided interfaces for IDE functionality
2. **Export** required interfaces (e.g., `activate`, `deactivate`)
3. **Declare** required permissions in their manifest

```
┌─────────────────────────────────────────────────────────┐
│                      IDE Host                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Extension Runtime                     │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │         WASM Sandbox                     │    │    │
│  │  │  ┌───────────────────────────────────┐  │    │    │
│  │  │  │        Extension (WASM)           │  │    │    │
│  │  │  │                                    │  │    │    │
│  │  │  │  exports: activate, deactivate    │  │    │    │
│  │  │  │  imports: ui, editor, workspace   │  │    │    │
│  │  │  └───────────────────────────────────┘  │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  │              ↑ WIT Interfaces ↓                  │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │         Host Implementation              │    │    │
│  │  │  (IDE-specific adapter layer)           │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Interface Categories

| Category | Description | Example Interfaces |
|----------|-------------|-------------------|
| Core | Always available | lifecycle, logging, context |
| Editor | Text manipulation | text, selection, decorations |
| Workspace | File system access | filesystem, project |
| UI | User interface | notifications, commands, menus |
| Language | Language features | completion, diagnostics, hover |
| Network | Network access | fetch, websocket |

### Permission Model

Extensions must declare required permissions in their manifest. The IDE prompts users to grant permissions before activation. See [permissions.md](permissions.md) for details.

```json
{
  "permissions": [
    "workspace:read",
    "ui:notifications",
    "network:fetch:api.example.com"
  ]
}
```

## Extension Lifecycle

1. **Installation**: User installs extension package
2. **Permission Grant**: IDE presents required permissions; user approves
3. **Activation**: IDE calls `activate()` based on activation events
4. **Operation**: Extension responds to events and API calls
5. **Deactivation**: IDE calls `deactivate()` before shutdown or disable

```
Install → Grant Permissions → Activate → Operate → Deactivate
                                  ↑         │
                                  └─────────┘
                                  (re-activate)
```

## Versioning

The standard uses semantic versioning:

- **Major**: Breaking changes to interfaces
- **Minor**: New interfaces or optional features
- **Patch**: Bug fixes and clarifications

IDEs declare which version(s) they implement. Extensions declare the minimum version they require.

## Conformance Levels

IDEs can implement subsets of the standard:

| Level | Required Interfaces |
|-------|---------------------|
| Minimal | core/* |
| Basic | core/*, ui/notifications, ui/commands |
| Standard | All above + editor/*, workspace/* |
| Full | All interfaces |

## Related Specifications

- [manifest.md](manifest.md) - Extension manifest format
- [permissions.md](permissions.md) - Permission model
- [runtime.md](runtime.md) - Runtime requirements
- [security.md](security.md) - Security model

## Comparison with VS Code WASM

Microsoft's VS Code WASM work focuses on running WASM within VS Code extensions. This standard differs in:

| Aspect | VS Code WASM | This Standard |
|--------|--------------|---------------|
| Scope | VS Code only | IDE-agnostic |
| Model | WASM within JS extension | Pure WASM extension |
| Permissions | Extension-level | Fine-grained capability |
| Target | Language servers | All extension types |

This standard can complement VS Code's work by providing an interoperable layer for cross-IDE extensions.
