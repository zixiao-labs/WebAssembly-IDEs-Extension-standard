# Conformance Level Specification

**Version:** 0.1.0
**Status:** Draft

## Overview

Not all IDEs need to implement the full standard. This document defines progressive conformance levels that allow IDEs to incrementally adopt the standard while maintaining interoperability.

## Design Principles

1. **Progressive Enhancement**: Each level builds on the previous
2. **Practical Value**: Each level provides meaningful extension capabilities
3. **Clear Boundaries**: Unambiguous requirements for each level
4. **Testable**: Conformance can be verified with automated tests

## Conformance Levels

### Level 0: Minimal

**Target Use Case**: Proof-of-concept, testing WASM runtime integration

The minimal level provides only the core infrastructure for running extensions. Extensions at this level can log, access context metadata, and respond to lifecycle events, but cannot interact with the IDE meaningfully.

#### Required Interfaces

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `core/extension` | `wit/core/extension.wit` | `activate()`, `deactivate()` exports |
| `core/lifecycle` | `wit/core/lifecycle.wit` | Lifecycle events and status |
| `core/logging` | `wit/core/logging.wit` | Logging (trace, debug, info, warn, error) |
| `core/context` | `wit/core/context.wit` | Extension metadata, permission queries |

#### Required Runtime

- WebAssembly 1.0 (MVP)
- WASI Preview 1 or 2
- Component Model support
- Memory limits: 1 MB minimum, 16 MB default

#### Target World

```wit
world extension-minimal {
    import ide-extension:core/lifecycle@0.1.0;
    import ide-extension:core/logging@0.1.0;
    import ide-extension:core/context@0.1.0;
    export ide-extension:core/extension@0.1.0;
}
```

#### Example Extensions

- Health check / diagnostic extensions
- License validators
- Telemetry reporters

---

### Level 1: Basic

**Target Use Case**: Simple utility extensions, command-line tools exposed to IDE

The basic level adds user interaction through commands and notifications. Extensions can register commands, show messages, and perform simple UI interactions.

#### Required Interfaces

All of Level 0, plus:

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `ui/commands` | `wit/ui/commands.wit` | Command registration and execution |
| `ui/notifications` | `wit/ui/notifications.wit` | Info, warning, error notifications |
| `core/storage` | `wit/core/storage.wit` | Key-value persistence |
| `core/events` | `wit/core/events.wit` | IDE event subscriptions |

#### Required Permissions Support

- `ui:commands`
- `ui:notifications`
- `storage:local`
- `storage:global`
- `core:events`

#### Required Runtime

All of Level 0, plus:

- Activation events: `onStartup`, `onCommand:<id>`
- Command handler timeout: 30 seconds

#### Example Extensions

- Keyboard shortcuts / keymaps
- Simple calculators
- Note-taking extensions
- Configuration generators

---

### Level 2: Editor

**Target Use Case**: Text manipulation, formatters, simple refactoring tools

The editor level adds document manipulation capabilities. Extensions can read and modify text, manage selections, and add visual decorations.

#### Required Interfaces

All of Level 1, plus:

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `editor/text` | `wit/editor/text.wit` | Document content read/write |
| `editor/selection` | `wit/editor/selection.wit` | Selection management |
| `editor/decorations` | `wit/editor/decorations.wit` | Visual decorations, highlights |

#### Required Permissions Support

All of Level 1, plus:

- `editor:read`
- `editor:write`
- `editor:selection`
- `editor:decorations`
- `editor:*` (wildcard)

#### Required Runtime

All of Level 1, plus:

- Activation events: `onLanguage:<id>`, `onFileOpen:<glob>`
- Active document tracking
- Decoration lifecycle management

#### Example Extensions

- Code formatters (Prettier, Black)
- Simple refactoring tools
- Text manipulation (sort lines, transform case)
- Bracket highlighters

---

### Level 3: Workspace

**Target Use Case**: Project-aware extensions, file operations, build tools

The workspace level adds file system access and project awareness. Extensions can read/write files, watch for changes, and understand project structure.

#### Required Interfaces

All of Level 2, plus:

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `workspace/filesystem` | `wit/workspace/filesystem.wit` | File operations, watchers |
| `workspace/project` | `wit/workspace/project.wit` | Project metadata, configuration |
| `ui/quickpick` | `wit/ui/quickpick.wit` | Quick selection dialogs |
| `ui/menus` | `wit/ui/menus.wit` | Menu contributions |

#### Required Permissions Support

All of Level 2, plus:

- `workspace:read`
- `workspace:write`
- `workspace:config`
- `workspace:*` (wildcard)
- `ui:quickpick`
- `ui:menus`

#### Required Runtime

All of Level 2, plus:

- Activation events: `workspaceContains:<glob>`
- File watcher support
- Multi-root workspace support (optional)
- Maximum 100 file handles per extension

#### Example Extensions

- File explorers / managers
- Build tool integrations
- Dependency managers
- Project templates
- Search/replace across files

---

### Level 4: Language

**Target Use Case**: Language servers, code intelligence, IDE tooling

The language level adds full language server capabilities. Extensions can provide completions, diagnostics, hover information, navigation, and symbols.

#### Required Interfaces

All of Level 3, plus:

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `language/completion` | `wit/language/completion.wit` | Code completion |
| `language/diagnostics` | `wit/language/diagnostics.wit` | Errors, warnings, hints |
| `language/hover` | `wit/language/hover.wit` | Hover information |
| `language/definition` | `wit/language/definition.wit` | Go-to-definition, references |
| `language/symbols` | `wit/language/symbols.wit` | Document/workspace symbols |
| `language/language-server` | `wit/language/language-server.wit` | Language server interface |

#### Required Permissions Support

All of Level 3, plus:

- `language:completion`
- `language:diagnostics`
- `language:hover`
- `language:definition`
- `language:symbols`
- `language:*` (wildcard)
- `bundle:language-server` (permission bundle)

#### Required Runtime

All of Level 3, plus:

- Completion provider timeout: 2 seconds
- Hover provider timeout: 500 ms
- Concurrent language feature requests
- Incremental document sync

#### Target World

```wit
world language-server {
    import ide-extension:core/lifecycle@0.1.0;
    import ide-extension:core/logging@0.1.0;
    import ide-extension:core/context@0.1.0;
    import ide-extension:workspace/filesystem@0.1.0;
    import ide-extension:language/completion@0.1.0;
    import ide-extension:language/diagnostics@0.1.0;
    import ide-extension:language/hover@0.1.0;
    import ide-extension:language/definition@0.1.0;
    import ide-extension:language/symbols@0.1.0;
    export ide-extension:core/extension@0.1.0;
    export ide-extension:language/language-server@0.1.0;
}
```

#### Example Extensions

- Language servers (rust-analyzer, pyright, typescript)
- Linters (ESLint, Clippy)
- Documentation providers
- Symbol navigators

---

### Level 5: Full

**Target Use Case**: Complete IDE extension platform, unrestricted extensions

The full level implements all interfaces, including network access and advanced UI features.

#### Required Interfaces

All of Level 4, plus:

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `network/fetch` | `wit/network/fetch.wit` | HTTP requests |
| `network/websocket` | `wit/network/websocket.wit` | WebSocket connections |
| `ui/webview` | `wit/ui/webview.wit` | Custom HTML/CSS/JS panels |

#### Required Permissions Support

All of Level 4, plus:

- `network:fetch`
- `network:fetch:<domain>`
- `network:websocket`
- `network:websocket:<host>`
- `ui:webview`
- `storage:secrets`

#### Required Runtime

All of Level 4, plus:

- Maximum 10 concurrent HTTP requests
- Maximum 5 concurrent WebSocket connections
- Webview CSP enforcement
- Secret storage (encrypted)
- HTTPS-only network access

#### Example Extensions

- AI coding assistants
- Cloud sync
- Remote collaboration
- Custom UI panels
- API clients (GitHub, Jira, etc.)

---

## Conformance Matrix

| Interface Category | L0 | L1 | L2 | L3 | L4 | L5 |
|--------------------|:--:|:--:|:--:|:--:|:--:|:--:|
| `core/extension` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `core/lifecycle` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `core/logging` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `core/context` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `core/events` | | ✓ | ✓ | ✓ | ✓ | ✓ |
| `core/storage` | | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ui/commands` | | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ui/notifications` | | ✓ | ✓ | ✓ | ✓ | ✓ |
| `editor/text` | | | ✓ | ✓ | ✓ | ✓ |
| `editor/selection` | | | ✓ | ✓ | ✓ | ✓ |
| `editor/decorations` | | | ✓ | ✓ | ✓ | ✓ |
| `workspace/filesystem` | | | | ✓ | ✓ | ✓ |
| `workspace/project` | | | | ✓ | ✓ | ✓ |
| `ui/quickpick` | | | | ✓ | ✓ | ✓ |
| `ui/menus` | | | | ✓ | ✓ | ✓ |
| `language/completion` | | | | | ✓ | ✓ |
| `language/diagnostics` | | | | | ✓ | ✓ |
| `language/hover` | | | | | ✓ | ✓ |
| `language/definition` | | | | | ✓ | ✓ |
| `language/symbols` | | | | | ✓ | ✓ |
| `language/language-server` | | | | | ✓ | ✓ |
| `network/fetch` | | | | | | ✓ |
| `network/websocket` | | | | | | ✓ |
| `network/realtime` | | | | | | ✓ |
| `ui/webview` | | | | | | ✓ |

---

## Optional Capabilities

In addition to the conformance levels, the standard defines **optional capabilities** that IDEs may implement independently of their conformance level. These are specialized feature sets that not every IDE needs.

### Why Optional Capabilities?

Some features are valuable but not universally needed:
- **Collaboration**: Real-time collaborative editing requires significant infrastructure
- **Realtime**: Persistent connections for live updates
- **AI**: Integration with AI/LLM services

By making these optional, IDEs can:
1. Implement conformance levels without blocking on specialized features
2. Add optional capabilities based on their target use cases
3. Allow extensions to gracefully degrade when capabilities are unavailable

### Collaboration Capability

**Status:** Optional (not required for any conformance level)

The collaboration capability enables real-time multi-user editing features:

| Interface | WIT File | Description |
|-----------|----------|-------------|
| `collaboration/crdt` | `wit/collaboration/crdt.wit` | Conflict-free document operations |
| `collaboration/awareness` | `wit/collaboration/awareness.wit` | Cursor/presence synchronization |
| `collaboration/session` | `wit/collaboration/session.wit` | Session management |
| `network/realtime` | `wit/network/realtime.wit` | Pub/sub messaging channels |

**Required Permissions:**
- `collaboration:session` - Create/join sessions
- `collaboration:crdt` - CRDT document operations
- `collaboration:awareness` - Presence information
- `network:realtime` - Realtime connections

**Target World:**

```wit
world collaboration-extension {
    import ide-extension:core/lifecycle@0.1.0;
    import ide-extension:core/logging@0.1.0;
    import ide-extension:core/context@0.1.0;
    import ide-extension:core/events@0.1.0;
    import ide-extension:editor/text@0.1.0;
    import ide-extension:editor/selection@0.1.0;
    import ide-extension:network/realtime@0.1.0;
    import ide-extension:collaboration/crdt@0.1.0;
    import ide-extension:collaboration/awareness@0.1.0;
    import ide-extension:collaboration/session@0.1.0;
    export ide-extension:core/extension@0.1.0;
}
```

**Example Extensions:**
- Live Share / collaborative editing
- Pair programming tools
- Real-time code review
- Teaching/mentoring environments

### Declaring Optional Capabilities

Extensions declare optional capabilities in their manifest:

```json
{
  "name": "my-collab-extension",
  "version": "1.0.0",
  "runtime": "wasm32-wasi",
  "main": "extension.wasm",
  "standardVersion": "0.1.0",
  "conformanceLevel": 2,
  "optionalCapabilities": ["collaboration"],
  "permissions": [
    "collaboration:session",
    "collaboration:crdt",
    "collaboration:awareness",
    "network:realtime"
  ]
}
```

IDEs report their supported capabilities:

```json
{
  "ideExtensionStandard": {
    "version": "0.1.0",
    "conformanceLevel": 4,
    "optionalCapabilities": ["collaboration", "ai"]
  }
}
```

### Graceful Degradation

Extensions using optional capabilities should:

1. **Check availability** at activation:
```rust
if !ctx.has_capability("collaboration") {
    // Fall back to single-user mode
    return Ok(());
}
```

2. **Provide fallback behavior** when capabilities are missing

3. **Document requirements** clearly in extension description

---

## Declaring Conformance

### IDE Manifest

IDEs should declare their conformance level in their extension host metadata:

```json
{
  "ideExtensionStandard": {
    "version": "0.1.0",
    "conformanceLevel": 4,
    "conformanceName": "Language"
  }
}
```

### Extension Requirements

Extensions can declare minimum conformance requirements in their manifest:

```json
{
  "engines": {
    "ide-extension-standard": ">=0.1.0",
    "conformanceLevel": 3
  }
}
```

If an IDE's conformance level is lower than the extension's requirement, the IDE should:

1. Warn the user that some features may not work
2. Disable unavailable interfaces gracefully
3. Optionally refuse to install the extension

### Partial Conformance

IDEs may implement interfaces beyond their declared level. For example, an IDE at Level 3 might also implement `network/fetch` for specific use cases. Such extensions should be declared:

```json
{
  "ideExtensionStandard": {
    "version": "0.1.0",
    "conformanceLevel": 3,
    "additionalInterfaces": [
      "network/fetch"
    ]
  }
}
```

## Conformance Testing

### Test Suite Structure

The conformance test suite is organized by level:

```
tests/
├── level-0-minimal/
│   ├── lifecycle.test.wasm
│   ├── logging.test.wasm
│   └── context.test.wasm
├── level-1-basic/
│   ├── commands.test.wasm
│   ├── notifications.test.wasm
│   └── storage.test.wasm
├── level-2-editor/
│   └── ...
├── level-3-workspace/
│   └── ...
├── level-4-language/
│   └── ...
└── level-5-full/
    └── ...
```

### Test Categories

| Category | Description |
|----------|-------------|
| **Interface** | Each WIT function is callable and returns expected types |
| **Permission** | Permission enforcement works correctly |
| **Resource** | Resource limits are enforced |
| **Timeout** | Operations respect timeout limits |
| **Error** | Error handling matches specification |

### Running Tests

```bash
# Test all levels up to and including level 3
ide-extension-test --level 3 --host ./my-ide

# Test specific interface
ide-extension-test --interface workspace/filesystem --host ./my-ide

# Verbose output
ide-extension-test --level 4 --host ./my-ide --verbose
```

### Test Report

```
IDE Extension Standard Conformance Report
=========================================
IDE: My IDE v1.0.0
Standard Version: 0.1.0
Test Date: 2026-02-05

Level 0 (Minimal): PASS (4/4)
  ✓ core/extension
  ✓ core/lifecycle
  ✓ core/logging
  ✓ core/context

Level 1 (Basic): PASS (3/3)
  ✓ ui/commands
  ✓ ui/notifications
  ✓ core/storage

Level 2 (Editor): PASS (3/3)
  ✓ editor/text
  ✓ editor/selection
  ✓ editor/decorations

Level 3 (Workspace): PASS (4/4)
  ✓ workspace/filesystem
  ✓ workspace/project
  ✓ ui/quickpick
  ✓ ui/menus

Level 4 (Language): PARTIAL (5/6)
  ✓ language/completion
  ✓ language/diagnostics
  ✓ language/hover
  ✓ language/definition
  ✓ language/symbols
  ✗ language/language-server (2 failures)
    - export-capabilities: timeout exceeded
    - handle-request: invalid response format

RESULT: Level 3 Conformance (Workspace)
```

## Migration Path

### For IDE Implementers

1. **Start with Level 0**: Get the WASM runtime integrated
2. **Progress incrementally**: Each level unlocks more extension types
3. **Test frequently**: Run conformance tests at each level
4. **Document gaps**: Clearly communicate which level you support

### Recommended Implementation Order

1. **Week 1-2**: Level 0 - WASM runtime, lifecycle, logging
2. **Week 3-4**: Level 1 - Commands, notifications, storage
3. **Week 5-6**: Level 2 - Editor text manipulation
4. **Week 7-8**: Level 3 - Filesystem, project structure
5. **Week 9-12**: Level 4 - Language features
6. **Week 13+**: Level 5 - Network, webviews

### For Extension Authors

1. **Target the lowest level** that supports your features
2. **Declare requirements** in your manifest
3. **Degrade gracefully** when optional features unavailable
4. **Test on multiple IDEs** at different conformance levels

## Branding and Badges

Compliant IDEs may display conformance badges:

| Level | Badge | Label |
|-------|-------|-------|
| 0 | 🔧 | IDE Extension Standard: Minimal |
| 1 | ⚡ | IDE Extension Standard: Basic |
| 2 | ✏️ | IDE Extension Standard: Editor |
| 3 | 📁 | IDE Extension Standard: Workspace |
| 4 | 🧠 | IDE Extension Standard: Language |
| 5 | 🌐 | IDE Extension Standard: Full |

Badge assets and usage guidelines are available in the `/branding` directory.

## Appendix: Quick Reference

### Level Summary

| Level | Name | Key Capabilities |
|-------|------|------------------|
| 0 | Minimal | Lifecycle, logging only |
| 1 | Basic | + Commands, notifications, storage |
| 2 | Editor | + Text editing, decorations |
| 3 | Workspace | + File system, project structure |
| 4 | Language | + Completions, diagnostics, navigation |
| 5 | Full | + Network, webviews, secrets |

### Permission Bundles by Level

| Level | Suggested Bundles |
|-------|-------------------|
| 2 | `bundle:formatter` |
| 3 | `bundle:linter` |
| 4 | `bundle:language-server` |

### Typical IDE Targets

| IDE Type | Recommended Level |
|----------|-------------------|
| Simple text editors | Level 2 |
| Code editors (Zed, Sublime) | Level 3-4 |
| Full IDEs (VS Code, JetBrains) | Level 4-5 |
| Specialized tools | Level 1-2 |
