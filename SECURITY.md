# Security policy

## Supported versions

There is no release yet. Milestone M0 is a local development scaffold.

## Current security posture (M0)

- The MCP server has **no authentication**. Configuration refuses to bind to any address
  other than loopback (`127.0.0.1`, `localhost`, `::1`).
- Host and Origin header checks protect the local endpoint against DNS rebinding.
- JSON request bodies are limited to 64 KB. Tool inputs are bounded and validated.
- Tool errors return a generic message. Logs record only the error name.
- The server stores no user data.

Do not expose the M0 server on a public network. For ChatGPT developer testing, use a
private tunnel and add only the tunnel hostname to `MCP_ALLOWED_HOSTS`.

## Report a vulnerability

The security contact is **not set yet** (open decision in `PROGRESS.md`). When the GitHub
repository exists, use GitHub private vulnerability reporting for it. Do not open a public
issue for a vulnerability.
