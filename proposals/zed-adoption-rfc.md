# RFC: Adopt IDE Extension Standard for Zed Extensions

## Summary

This proposal suggests that Zed adopt the [IDE Extension Standard](https://github.com/example/ide-extension-standard) for its WebAssembly extension system. The standard defines a common interface for IDE extensions compiled to WebAssembly, enabling extension portability across multiple editors while maintaining security through capability-based sandboxing.

## Motivation

### Current State of Zed Extensions

Zed's extension system is already built on WebAssembly, which is forward-thinking. However:

1. **Limited API Surface**: The current extension API is minimal, restricting what extensions can do
2. **Zed-Specific Interfaces**: Extensions written for Zed cannot run elsewhere
3. **Ecosystem Size**: Compared to VS Code's ~50,000+ extensions, Zed's ecosystem is nascent
4. **Documentation Gaps**: Extension authors face a steep learning curve

### Why an Open Standard?

The IDE Extension Standard addresses these challenges:

1. **Portable Extensions**: Extensions targeting the standard work in any conformant IDE (Zed, Logos, potentially JetBrains Fleet, etc.)
2. **Well-Defined API**: Comprehensive WIT interface definitions covering editor, workspace, UI, language features, and network
3. **Security Model**: Fine-grained permission system already designed for WASM sandboxing
4. **Shared Ecosystem**: Multiple IDEs sharing an extension format creates a network effect

### Why Now?

- Zed's extension system is still evolving—adopting a standard now avoids technical debt
- The standard is at v0.1.0 (Draft)—Zed's input can shape its direction
- Multiple IDE projects are considering adoption, creating momentum

## Detailed Design

### Conformance Target

The standard defines 6 conformance levels (0-5). For Zed, we recommend:

**Phase 1: Level 3 (Workspace)**
- Core lifecycle, logging, context
- Commands and notifications
- Text editing and decorations
- File system access and project structure

This level covers ~80% of common extension use cases and aligns well with Zed's current capabilities.

**Phase 2: Level 4 (Language)**
- Add language server support (completions, diagnostics, hover, navigation)
- Enables rust-analyzer, pyright, and similar tools as WASM extensions

**Phase 3: Level 5 (Full)**
- Network access and webviews
- Enables AI assistants, cloud sync, remote collaboration extensions

### Technical Implementation

#### WIT Interface Adoption

The standard uses WebAssembly Interface Types (WIT) for API definitions. Zed would:

1. **Replace** Zed-specific WASM bindings with standard WIT interfaces
2. **Implement** host functions that fulfill WIT imports
3. **Expose** Zed's existing capabilities through standard interfaces

Example mapping:

| Standard Interface | Zed Equivalent |
|--------------------|----------------|
| `ui/commands` | `zed::register_command` |
| `workspace/filesystem` | `zed::worktree` operations |
| `language/completion` | Language server proxy |
| `ui/notifications` | `zed::notify` |

#### Permission Model

The standard's capability-based permission model maps naturally to WASM sandboxing:

```rust
// Zed host implementation (pseudocode)
fn bind_extension_imports(ext: &Extension, perms: &GrantedPermissions) -> WasmImports {
    WasmImports {
        "workspace:filesystem/read-file": if perms.has("workspace:read") {
            |path| ext.worktree.read_file(path)
        } else {
            |_| Err("Permission denied")
        },
        // ...
    }
}
```

#### Manifest Format

Extensions would use `extension.json` instead of `extension.toml`:

```json
{
  "name": "my-zed-extension",
  "version": "1.0.0",
  "runtime": "wasm32-wasi",
  "main": "extension.wasm",
  "standardVersion": "0.1.0",
  "conformanceLevel": 3,
  "permissions": [
    "workspace:read",
    "ui:commands"
  ],
  "activationEvents": ["workspaceContains:Cargo.toml"]
}
```

For backwards compatibility, Zed could support both formats during transition.

### Migration Path

#### For Zed

1. **Week 1-2**: Implement Level 0 (core interfaces) as proof-of-concept
2. **Week 3-4**: Add Level 1-2 (commands, notifications, editor)
3. **Week 5-6**: Add Level 3 (filesystem, project)—announce public beta
4. **Week 7-12**: Add Level 4 (language features)—production release
5. **Ongoing**: Maintain Zed-specific extensions alongside standard API

#### For Extension Authors

1. **New extensions**: Target the standard from day one
2. **Existing extensions**: Provide migration guide and shim layer
3. **Both**: Extensions can use standard interfaces plus Zed-specific extras

### Interoperability Benefits

With standard adoption, Zed users gain access to:

- **rust-analyzer-wasm**: Rust language support (if built against standard)
- **formatters**: Prettier, Black, rustfmt as portable WASM
- **linters**: ESLint, Clippy with unified interface
- **utilities**: Extensions from other conformant IDEs

### Conformance Testing

The standard includes a test suite. Zed would run:

```bash
ide-extension-test --level 3 --host ./zed
```

This validates that Zed correctly implements all Level 3 interfaces.

## Drawbacks

1. **Implementation Effort**: Significant work to replace existing bindings
2. **Standard Limitations**: Some Zed-specific features may not map cleanly
3. **Dependency**: Zed becomes partially dependent on external standard evolution
4. **Transition Period**: Must maintain compatibility with existing extensions

## Alternatives

### Option A: Enhance Zed-Specific API

Continue developing Zed's current extension API independently.

**Pros**: Full control, no external dependencies
**Cons**: No ecosystem sharing, duplicate effort, smaller extension pool

### Option B: Adopt VS Code Extension API

Make Zed compatible with VS Code extensions (like other editors have tried).

**Pros**: Massive existing ecosystem
**Cons**:
- VS Code API is JavaScript-based, not WASM-native
- Legal/licensing concerns with Microsoft's API
- Many VS Code-specific assumptions would not fit Zed

### Option C: Adopt IDE Extension Standard (This Proposal)

**Pros**:
- WASM-native design matches Zed's architecture
- Open, community-driven standard
- Clean capability-based security model
- Shared ecosystem with other modern IDEs

**Cons**:
- Standard is still draft (v0.1.0)
- Fewer existing extensions than VS Code

## Unresolved Questions

1. **Timeline**: What is Zed's release schedule for extension API changes?
2. **Zed-Specific Extensions**: How to handle features unique to Zed that aren't in the standard?
3. **Standard Governance**: Should Zed join the standard's governance body?
4. **Backwards Compatibility**: How long to support existing Zed extension format?

## Future Possibilities

1. **Cross-IDE Extensions**: Popular extensions work in Zed, Logos, and future adopters
2. **Extension Marketplace**: Shared marketplace infrastructure across conformant IDEs
3. **Tooling**: Shared build tools, SDK, and testing infrastructure
4. **Language Servers**: WASM-based language servers run everywhere

## References

- [IDE Extension Standard Specification](https://github.com/example/ide-extension-standard/spec/0.1)
- [Conformance Level Specification](https://github.com/example/ide-extension-standard/spec/0.1/conformance.md)
- [WIT Interface Definitions](https://github.com/example/ide-extension-standard/wit)
- [Zed Extension Documentation](https://zed.dev/docs/extensions)
- [WebAssembly Component Model](https://component-model.bytecodealliance.org/)

---

## Appendix: Interface Compatibility Analysis

### Level 3 Interface Mapping to Zed

| Standard Interface | Function | Zed Mapping | Difficulty |
|--------------------|----------|-------------|------------|
| `core/lifecycle` | `activate()`, `deactivate()` | Already exists | Easy |
| `core/logging` | `log-info()`, `log-error()` | Already exists | Easy |
| `core/context` | Extension metadata | Already exists | Easy |
| `core/storage` | Key-value storage | Needs implementation | Medium |
| `ui/commands` | `register-command()` | Already exists | Easy |
| `ui/notifications` | `show-info()`, `show-error()` | Needs implementation | Easy |
| `editor/text` | `get-text()`, `set-text()` | Buffer API exists | Medium |
| `editor/selection` | `get-selections()` | Cursor API exists | Medium |
| `editor/decorations` | `add-decoration()` | Highlight API exists | Medium |
| `workspace/filesystem` | `read-file()`, `write-file()` | Worktree API exists | Medium |
| `workspace/project` | Project metadata | Needs implementation | Easy |
| `ui/quickpick` | Selection dialogs | Picker API exists | Easy |
| `ui/menus` | Menu contributions | Needs implementation | Medium |

### Estimated Implementation Effort

| Level | New Code | Refactoring | Testing | Total |
|-------|----------|-------------|---------|-------|
| 0 (Minimal) | Low | Low | Low | ~1 week |
| 1 (Basic) | Low | Medium | Low | ~1 week |
| 2 (Editor) | Medium | Medium | Medium | ~2 weeks |
| 3 (Workspace) | Medium | Medium | Medium | ~2 weeks |
| 4 (Language) | High | High | High | ~4 weeks |
| 5 (Full) | High | Medium | High | ~4 weeks |

**Total to Level 3**: ~6 weeks
**Total to Level 5**: ~14 weeks
