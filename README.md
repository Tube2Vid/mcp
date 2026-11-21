# Tube2Vid MCP Server

[![CI](https://github.com/Tube2Vid/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Tube2Vid/mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@tube2vid/mcp.svg)](https://www.npmjs.com/package/@tube2vid/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A YouTube, TikTok and Instagram video downloader for AI agents. `@tube2vid/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets Claude Desktop, Claude Code, Cursor and any other MCP client download video, audio and images from YouTube, TikTok, Instagram, X, Reddit and 1,800+ other sites through the [Tube2Vid download API](https://tube2vid.com). Ask "save this TikTok as MP4" or "get the audio of this YouTube video as MP3" and the model queues the job, waits for it and hands back a download link.

## Tools

| Tool | What it does | Needs a key |
| --- | --- | --- |
| `list_supported_platforms` | First-class platforms and their capabilities | no |
| `get_platform_health` | Live per-platform status | no |
| `get_account_usage` | Credit balance and job counts | yes |
| `submit_download_job` | Queue a download (`url`, `mode`, `format`, `quality`) | yes |
| `get_job_status` | Progress and result of a job | yes |
| `get_download_link` | Short-lived direct link to a finished file | yes |

## Setup

[Get an API key](https://tube2vid.com/pricing) with the `jobs:write`, `jobs:read` and `usage:read` scopes (the defaults). Use a separate key for MCP so you can revoke it on its own. Needs Node 18.17+.

### Claude Desktop

Add this to `claude_desktop_config.json` (Settings, Developer, Edit Config):

```json
{
  "mcpServers": {
    "tube2vid": {
      "command": "npx",
      "args": ["-y", "@tube2vid/mcp"],
      "env": { "TUBE2VID_API_KEY": "tv_live_..." }
    }
  }
}
```

### Claude Code

```bash
claude mcp add tube2vid --env TUBE2VID_API_KEY=tv_live_... -- npx -y @tube2vid/mcp
```

### Cursor

Add this to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project):

```json
{
  "mcpServers": {
    "tube2vid": {
      "command": "npx",
      "args": ["-y", "@tube2vid/mcp"],
      "env": { "TUBE2VID_API_KEY": "tv_live_..." }
    }
  }
}
```

### Any other client

Run `npx -y @tube2vid/mcp` (or `npm install -g @tube2vid/mcp`, then `tube2vid-mcp`) as a stdio server. The server is also listed in the [MCP registry](https://registry.modelcontextprotocol.io) as `io.github.Tube2Vid/mcp`.

## Configuration

| Variable | Default | |
| --- | --- | --- |
| `TUBE2VID_API_KEY` | none | Your `tv_live_...` key |
| `TUBE2VID_API_URL` | `https://tube2vid.com` | API origin |
| `MCP_TRANSPORT` | `stdio` | `http` serves Streamable HTTP on `POST /mcp` instead |
| `PORT` | `8000` | Port for `http` mode |

In `http` mode every caller shares the one configured key, so only expose it to clients you trust.

## Links

- [Tube2Vid](https://tube2vid.com): the online video downloader behind these tools
- [API documentation](https://tube2vid.com/docs) and the [OpenAPI spec](https://github.com/Tube2Vid/api)
- [Pricing and API keys](https://tube2vid.com/pricing)
- [Live platform status](https://tube2vid.com/status)
- Built on the [Tube2Vid TypeScript SDK](https://github.com/Tube2Vid/sdk); there is also a [`tube2vid` CLI](https://github.com/Tube2Vid/cli)

SDKs in other languages: [TypeScript](https://github.com/Tube2Vid/sdk), [Python](https://github.com/Tube2Vid/sdk-python), [Go](https://github.com/Tube2Vid/sdk-go), [Java](https://github.com/Tube2Vid/sdk-java), [C#](https://github.com/Tube2Vid/sdk-dotnet), [PHP](https://github.com/Tube2Vid/sdk-php), [Ruby](https://github.com/Tube2Vid/sdk-ruby), [Rust](https://github.com/Tube2Vid/sdk-rust), [Swift](https://github.com/Tube2Vid/sdk-swift).

## Develop

```bash
npm install
npm test        # in-memory MCP client against a fake API
npm run dev     # stdio, from source
npm run build   # compiles to dist/
```

When you bump the version, update `package.json` and both versions in `server.json` together; the release workflow checks that they match the tag.

## License

[MIT](LICENSE), Copyright (c) 2026 Tube2Vid.
