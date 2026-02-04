# Runtime Requirements Specification

**Version:** 0.1.0

## Overview

This document specifies the requirements for IDE hosts implementing the standard, including WASM runtime configuration, resource limits, and execution model.

## WebAssembly Runtime

### Required Support

IDEs must support:

- **WebAssembly 1.0** (MVP)
- **WASI Preview 2** (or preview 1 with adapter)
- **Component Model** for interface definitions

### Recommended Support

- **WASM Threads** (for CPU-intensive extensions)
- **WASM SIMD** (for performance)
- **Exception Handling** (for language support)

## Memory Model

### Limits

| Resource | Minimum | Default | Maximum |
|----------|---------|---------|---------|
| Linear Memory | 1 MB | 16 MB | 256 MB |
| Stack Size | 64 KB | 1 MB | 8 MB |
| Table Size | 1000 | 10000 | 100000 |

IDEs may allow users to configure these limits per-extension.

### Memory Growth

- Extensions can grow memory up to the maximum limit
- Growth is synchronous within the WASM module
- Host may deny growth if system memory is constrained

## Execution Model

### Threading

Extensions run in a **single-threaded** environment by default:

```
┌─────────────────────────────────────────┐
│           Extension Host                │
│  ┌─────────────────────────────────┐    │
│  │        Event Loop               │    │
│  │   ┌───────┐    ┌───────┐        │    │
│  │   │ Ext 1 │    │ Ext 2 │  ...   │    │
│  │   └───────┘    └───────┘        │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

With thread support, extensions may spawn workers:

```
┌─────────────────────────────────────────┐
│           Extension Host                │
│  ┌─────────────────────────────────┐    │
│  │   Main Thread (Event Loop)      │    │
│  │   ┌───────┐                     │    │
│  │   │ Ext 1 │──────┐              │    │
│  │   └───────┘      │              │    │
│  └──────────────────┼──────────────┘    │
│  ┌──────────────────┼──────────────┐    │
│  │   Worker Pool    ▼              │    │
│  │   ┌─────────┐  ┌─────────┐      │    │
│  │   │Worker 1 │  │Worker 2 │      │    │
│  │   └─────────┘  └─────────┘      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Event Handling

The host dispatches events to extensions:

1. Host receives event (e.g., file change, command)
2. Host serializes event data per WIT interface
3. Host calls extension's event handler
4. Extension processes and returns result
5. Host deserializes result

### Timeouts

| Operation | Default Timeout | Configurable |
|-----------|-----------------|--------------|
| Activation | 10 seconds | Yes |
| Deactivation | 5 seconds | Yes |
| Command Handler | 30 seconds | Yes |
| Completion Provider | 2 seconds | Yes |
| Hover Provider | 500 ms | Yes |
| File Watcher Callback | 1 second | No |

Extensions exceeding timeouts may be:
1. Warned (first occurrence)
2. Terminated (repeated violations)
3. Disabled (persistent issues)

## Error Handling

### Extension Errors

When an extension throws or traps:

1. Host catches the error
2. Host logs the error with extension context
3. Host returns appropriate error to caller
4. Extension remains active (unless repeated failures)

### Host Errors

When the host cannot fulfill a request:

1. Host returns error result through WIT interface
2. Error message includes actionable information
3. Extension decides how to handle

### Panic Recovery

If an extension panics (WASM trap):

1. Host terminates the extension instance
2. Host notifies user of the crash
3. Host may attempt restart (with backoff)

## Resource Management

### File Handles

- Maximum open file handles: 100 per extension
- Handles auto-close on deactivation
- Host may close idle handles

### Network Connections

- Maximum concurrent HTTP requests: 10
- Maximum concurrent WebSocket connections: 5
- Connections auto-close on deactivation

### Timers

Extensions do not have direct timer access. Instead:
- Use activation events for scheduled work
- Request host-managed timeouts
- Respond to file watch events

## Isolation

### Extension Isolation

Each extension runs in its own WASM instance:

- Separate memory space
- No shared state between extensions
- No direct inter-extension calls

### Workspace Isolation

Extensions are scoped to their workspace:

- File access limited to workspace folders
- No access to files outside workspace
- No access to other users' data

## Host API Implementation

### Synchronous vs Asynchronous

WIT interfaces are synchronous. For async operations:

1. Extension calls sync API
2. Host blocks extension thread
3. Host performs async operation
4. Host resumes extension with result

This matches WASI's sync model while allowing hosts to use async internally.

### Caching

Hosts may cache:

- Compiled WASM modules
- Extension metadata
- Permission decisions

Hosts must invalidate caches when:

- Extension is updated
- Permissions change
- User requests refresh
