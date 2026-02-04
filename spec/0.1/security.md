# Security Model Specification

**Version:** 0.1.0

## Overview

Security is a fundamental design principle of this standard. Extensions run in a sandboxed WebAssembly environment with capability-based access control.

## Threat Model

### Threats Addressed

| Threat | Mitigation |
|--------|------------|
| Malicious Extension | Sandboxed execution, permissions |
| Data Exfiltration | Network permissions, scoped access |
| Privilege Escalation | No native code, capability model |
| Supply Chain Attack | Package signing, integrity checks |
| Denial of Service | Resource limits, timeouts |

### Out of Scope

- Vulnerabilities in the WASM runtime itself
- Social engineering attacks
- Physical access attacks
- Host IDE vulnerabilities

## Sandbox Model

### WebAssembly Sandbox

Extensions run in the WASM sandbox which provides:

1. **Memory Isolation**: Linear memory is private to each instance
2. **No System Calls**: Direct syscalls impossible
3. **Controlled Imports**: Only host-provided functions available
4. **Deterministic Execution**: Same inputs produce same outputs

```
┌─────────────────────────────────────────────────────────┐
│                    Host Process                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              WASM Runtime (Sandbox)              │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │           Extension Instance             │    │   │
│  │  │  ┌───────────────┐  ┌───────────────┐   │    │   │
│  │  │  │ Linear Memory │  │   Globals     │   │    │   │
│  │  │  └───────────────┘  └───────────────┘   │    │   │
│  │  │           │                              │    │   │
│  │  │           ▼ (imports)                    │    │   │
│  │  └───────────┼──────────────────────────────┘    │   │
│  │              │                                    │   │
│  │  ┌───────────▼──────────────────────────────┐   │   │
│  │  │      Capability-Gated Host Functions      │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │              Host Implementation                  │  │
│  │  (File System, Network, UI, etc.)                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Capability Model

Access to resources is controlled by capabilities:

```
Permission Grant → Capability Token → Resource Access
```

1. User grants permission during installation
2. Host creates capability for the extension
3. Extension's imports are bound to capability-checked functions
4. Each API call verified against capabilities

## Permission Enforcement

### Import Binding

When loading an extension, the host:

1. Parses the manifest's permissions
2. For each WIT import, checks required permission
3. Binds permitted imports to real implementations
4. Binds denied imports to error-returning stubs

```rust
// Pseudocode for host implementation
fn bind_imports(extension: &Extension) -> ImportObject {
    let perms = extension.permissions();

    ImportObject {
        "workspace:filesystem/read-file": if perms.has("workspace:read") {
            real_read_file
        } else {
            |_| Err("Permission denied: workspace:read")
        },
        // ... other imports
    }
}
```

### Runtime Checks

Even with bound imports, hosts perform runtime validation:

- File paths checked against workspace boundaries
- Network URLs checked against domain patterns
- Resource limits enforced per operation

## Data Protection

### Workspace Boundaries

Extensions cannot access files outside:
- Granted workspace folders
- Extension's own storage directory
- Temporary directories created by host

Path traversal attacks are prevented:

```
Request: read_file("../../../etc/passwd")
Result: Error("Path outside workspace")
```

### Sensitive Data

Hosts should redact sensitive data:

- Environment variables (except allowlisted)
- System paths (abstracted to workspace-relative)
- User credentials (use secret storage API)

### Memory Safety

WASM provides memory safety, but hosts must also:

- Validate all data crossing the boundary
- Limit buffer sizes for inputs
- Sanitize outputs before display

## Network Security

### Domain Restrictions

Network permissions specify allowed domains:

```json
{
  "permissions": ["network:fetch:api.github.com"]
}
```

The host enforces:
- Only HTTPS connections (HTTP blocked)
- Only specified domains (subdomain wildcards supported)
- Request/response size limits

### No Ambient Authority

Extensions cannot:
- Access cookies from the host
- Inherit host's network credentials
- Make requests as the user

### Content Security

For webviews, strict CSP is enforced:

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

## Supply Chain Security

### Package Integrity

Extension packages should:

1. Be signed by publisher
2. Include content hashes
3. Be verified before installation

```json
{
  "integrity": {
    "algorithm": "sha256",
    "hash": "abc123...",
    "signature": "...",
    "publicKey": "..."
  }
}
```

### Dependency Verification

If extensions depend on other WASM modules:

- Each module must be listed in manifest
- Each module hash verified
- No dynamic loading of unlisted modules

### Update Security

Updates must:
- Come from same publisher
- Not escalate permissions without user approval
- Be reversible (keep previous version)

## Audit and Monitoring

### Logging

Hosts should log:

| Event | Data |
|-------|------|
| Extension Load | ID, version, permissions |
| Permission Use | Which API, parameters (sanitized) |
| Network Request | Domain, method, response code |
| File Access | Path (relative), operation |
| Errors | Stack trace, context |

### Anomaly Detection

Hosts may monitor for:

- Excessive API calls (rate limiting)
- Unusual file access patterns
- Large data transfers
- Repeated errors

### User Reporting

Provide users with:
- Activity log per extension
- Data access summary
- Network request log
- "Report extension" button

## Incident Response

### Malicious Extension Detected

1. **Disable**: Immediately disable the extension
2. **Notify**: Alert user and IDE vendor
3. **Revoke**: Remove from extension marketplace
4. **Audit**: Check for data compromise
5. **Recover**: Restore from backup if needed

### Vulnerability Discovered

1. **Assess**: Determine severity and scope
2. **Patch**: Update standard/runtime
3. **Notify**: Inform implementers
4. **Update**: Push updates to users
