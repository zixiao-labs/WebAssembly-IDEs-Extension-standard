# WebAssembly IDE Extension Standard

An open, IDE-agnostic standard for building secure, sandboxed IDE extensions using WebAssembly.

## Overview

This standard defines a common interface for IDE extensions compiled to WebAssembly, enabling:

- **Portability**: Write once, run in any IDE that implements the standard
- **Security**: Sandboxed execution with explicit permission grants
- **Performance**: Near-native execution speed with WebAssembly
- **Language Freedom**: Write extensions in any language that compiles to WASM (Rust, C/C++, Go, AssemblyScript, etc.)

## Design Principles

1. **Capability-Based Security**: Extensions declare required permissions; IDEs grant capabilities explicitly
2. **IDE Agnostic**: No assumptions about specific IDE implementations
3. **WASI Alignment**: Built on WASI 0.2+ and the Component Model
4. **Incremental Adoption**: IDEs can implement subsets of the standard
5. **Developer Experience**: Simple manifest format, clear documentation

## Repository Structure

```
├── spec/                    # Specification documents
│   └── 0.1/                 # Version 0.1 specification
│       ├── overview.md      # Standard overview
│       ├── manifest.md      # Manifest format specification
│       ├── permissions.md   # Permission model specification
│       ├── runtime.md       # Runtime requirements
│       ├── security.md      # Security model
│       └── conformance.md   # Conformance levels and testing
├── wit/                     # WIT interface definitions
│   ├── ide-extension.wit    # Main world definition
│   ├── core/                # Core interfaces (lifecycle, logging, events)
│   ├── editor/              # Editor interfaces
│   ├── workspace/           # Workspace interfaces
│   ├── ui/                  # UI interfaces
│   ├── language/            # Language feature interfaces
│   ├── network/             # Network interfaces (fetch, websocket, realtime)
│   └── collaboration/       # Collaboration interfaces (crdt, awareness, session)
├── schemas/                 # JSON Schemas
│   └── manifest.schema.json # Manifest validation schema
├── proposals/               # RFC proposals
│   ├── v1.0-rfc.md         # v1.0 stabilization proposal
│   └── zed-adoption-rfc.md # Zed adoption proposal
├── tests/                   # Conformance test suite
│   ├── conformance/        # Level-based tests (0-5)
│   ├── optional/           # Optional capability tests
│   ├── harness/            # Test infrastructure
│   └── fixtures/           # Test fixtures
└── examples/                # Example extensions
    └── hello-world/         # Minimal example
```

## Conformance Levels

IDEs can implement subsets of the standard progressively:

| Level | Name | Key Capabilities |
|-------|------|------------------|
| 0 | Minimal | Lifecycle, logging only |
| 1 | Basic | + Commands, notifications, storage, events |
| 2 | Editor | + Text editing, decorations |
| 3 | Workspace | + File system, project structure |
| 4 | Language | + Completions, diagnostics, navigation |
| 5 | Full | + Network, webviews, secrets |

See [spec/0.1/conformance.md](spec/0.1/conformance.md) for detailed requirements and testing procedures.

## Optional Capabilities

Beyond conformance levels, the standard defines optional capabilities for specialized features:

| Capability | Description | Interfaces |
|------------|-------------|------------|
| `collaboration` | Real-time multi-user editing | crdt, awareness, session |
| `realtime` | Pub/sub messaging channels | network/realtime |

Extensions declare optional capabilities in their manifest:

```json
{
  "optionalCapabilities": ["collaboration"]
}
```

This allows extensions to gracefully degrade when capabilities are unavailable.

## Quick Start

### For Extension Authors

1. Create an `extension.json` manifest:

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "runtime": "wasm32-wasi",
  "main": "extension.wasm",
  "permissions": [
    "ui:notifications"
  ]
}
```

2. Write your extension (example in Rust):

```rust
use ide_extension::prelude::*;

#[export]
fn activate(ctx: &ExtensionContext) {
    ctx.notifications().show_info("Hello from WASM!");
}
```

3. Build to WebAssembly:

```bash
cargo build --target wasm32-wasip2
```

### For IDE Implementers

1. Implement the host interfaces defined in `wit/`
2. Load extensions and parse their manifests
3. Prompt users for required permissions
4. Instantiate WASM modules with granted capabilities

## Specification Versions

| Version | Status | Notes |
|---------|--------|-------|
| 0.1     | Draft  | Initial specification |

## Reference Implementations

| IDE | Status | Repository | Notes |
|-----|--------|------------|-------|
| Logos | In Development | [zixiao-labs/logos](https://github.com/zixiao-labs/logos) | Reference implementation with full permission model |

### Logos Implementation

The Logos IDE implements this standard via `wasmExtensionService.ts`:

- **Permission checking**: Fine-grained capability-based access control
- **Host functions**: WIT interface implementations for WASM imports
- **Extension lifecycle**: Install, activate, deactivate, uninstall
- **IPC bridge**: `window.electronAPI.wasmExtensions.*` for renderer access

```typescript
// Example: List and activate a WASM extension
const extensions = await window.electronAPI.wasmExtensions.list()
for (const ext of extensions) {
  // Grant required permissions
  for (const perm of ext.permissions) {
    if (!perm.granted) {
      await window.electronAPI.wasmExtensions.grantPermission(ext.id, perm.permission)
    }
  }
  // Activate
  await window.electronAPI.wasmExtensions.activate(ext.id)
}
```

## Related Work

This standard is informed by:

- [VS Code WASM Extension Host](https://code.visualstudio.com/blogs/2024/05/08/wasm) - VS Code's WebAssembly work
- [WASI](https://wasi.dev/) - WebAssembly System Interface
- [Component Model](https://component-model.bytecodealliance.org/) - WebAssembly Component Model
- [WIT](https://component-model.bytecodealliance.org/design/wit.html) - WebAssembly Interface Types

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
