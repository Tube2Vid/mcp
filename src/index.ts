import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const apiBaseUrl = process.env.TUBE2VID_API_URL ?? "http://localhost:8000";
const apiKey = process.env.TUBE2VID_API_KEY ?? "";

const port = Number(process.env.PORT ?? 8000);
const transportMode = process.env.MCP_TRANSPORT ?? "stdio";

function createServer() {
  const server = new McpServer({
    name: "tube2vid",
    version: "1.0.0"
  });

  server.tool(
    "list_supported_platforms",
    "List Tube2Vid supported platforms and capabilities.",
    {},
    async () => jsonToolResponse(await apiGet("/v1/platforms"))
  );

  server.tool(
    "get_platform_health",
    "Get live platform health and provider status.",
    {},
    async () => jsonToolResponse(await apiGet("/v1/platforms/health"))
  );

  server.tool(
    "get_account_usage",
    "Get current credit balance and usage summary.",
    {},
    async () => jsonToolResponse(await apiGet("/v1/usage"))
  );

  server.tool(
    "submit_download_job",
    "Submit a media download job.",
    {
      url: z.string().url(),
      mode: z.enum(["auto", "video", "audio", "gallery"]).default("auto"),
      format: z.string().default("mp4"),
      quality: z.string().default("best")
    },
    async (input) => jsonToolResponse(await apiPost("/v1/jobs", input))
  );

  server.tool(
    "get_job_status",
    "Get status for a submitted Tube2Vid job.",
    {
      jobId: z.string()
    },
    async ({ jobId }) => jsonToolResponse(await apiGet(`/v1/jobs/${jobId}`))
  );

  return server;
}

if (transportMode === "http") {
  const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedHosts: ["tube2vid.com", "www.tube2vid.com", "localhost", "127.0.0.1"]
  });

  app.post("/mcp", async (request: any, response: any) => {
    const server = createServer();
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
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function apiGet(path: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: authHeaders() });
  return response.json();
}

async function apiPost(path: string, body: unknown) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

function authHeaders(): Record<string, string> {
  return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
}

function jsonToolResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}
