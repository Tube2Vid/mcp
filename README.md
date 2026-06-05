# Tube2Vid MCP

Standalone Model Context Protocol server for Tube2Vid.

## Features

- list supported platforms
- read live platform health
- read account usage
- submit jobs
- poll job status

## Run

```bash
npm install
npm run dev
```

Environment:

- `TUBE2VID_API_URL`
- `TUBE2VID_API_KEY`
- `MCP_TRANSPORT` (`stdio` or `http`)
- `PORT` for HTTP mode
