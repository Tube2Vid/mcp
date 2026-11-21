import type { Tube2VidClient } from "@tube2vid/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createRequire } from "node:module";
import { z } from "zod";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

export function createServer(client: Tube2VidClient) {
  const server = new McpServer({
    name: "tube2vid",
    version
  });

  server.tool(
    "list_supported_platforms",
    "List Tube2Vid supported platforms and capabilities.",
    {},
    async () => jsonToolResponse(await client.listPlatforms())
  );

  server.tool(
    "get_platform_health",
    "Get live platform health and provider status.",
    {},
    async () => jsonToolResponse(await client.getPlatformHealth())
  );

  server.tool(
    "get_account_usage",
    "Get current credit balance and usage summary.",
    {},
    async () => jsonToolResponse(await client.getUsage())
  );

  server.tool(
    "submit_download_job",
    "Submit a media download job. Poll get_job_status until it is completed, then call get_download_link.",
    {
      url: z.string().url(),
      mode: z.enum(["auto", "video", "audio", "gallery"]).default("auto"),
      format: z.string().default("mp4"),
      quality: z.string().default("best")
    },
    async (input) => jsonToolResponse(await client.submitAuthenticatedJob(input))
  );

  server.tool(
    "get_job_status",
    "Get status for a submitted Tube2Vid job.",
    {
      jobId: z.string()
    },
    async ({ jobId }) => jsonToolResponse(await client.getJobStatus(jobId))
  );

  server.tool(
    "get_download_link",
    "Get a short-lived direct link to a completed job's file.",
    {
      jobId: z.string()
    },
    async ({ jobId }) => jsonToolResponse({ jobId, url: await client.getDownloadLink(jobId) })
  );

  return server;
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
