#!/usr/bin/env node
import { DEFAULT_BASE_URL, Tube2VidClient } from "@tube2vid/sdk";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const client = new Tube2VidClient({
  baseUrl: process.env.TUBE2VID_API_URL || DEFAULT_BASE_URL,
  apiKey: process.env.TUBE2VID_API_KEY
});

const port = Number(process.env.PORT ?? 8000);
const transportMode = process.env.MCP_TRANSPORT ?? "stdio";

if (transportMode === "http") {
  const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedHosts: ["tube2vid.com", "www.tube2vid.com", "localhost", "127.0.0.1"]
  });

  app.post("/mcp", async (request: any, response: any) => {
    const server = createServer(client);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null
        });
      }
    } finally {
      response.on("close", () => {
        transport.close();
        server.close();
      });
    }
  });

  app.get("/mcp", (_request: any, response: any) => {
    response.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null
    });
  });

  app.listen(port, "0.0.0.0", (error?: Error) => {
    if (error) {
      console.error("Failed to start Tube2Vid MCP server", error);
      process.exit(1);
    }
    console.log(`Tube2Vid MCP Streamable HTTP listening on ${port}`);
  });
} else {
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
