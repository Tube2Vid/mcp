import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Tube2VidClient } from "@tube2vid/sdk";
import { createServer } from "./server.js";

async function connect(fetchImpl: typeof fetch) {
  const server = createServer(new Tube2VidClient({ baseUrl: "https://example.test", apiKey: "tv_live_x", fetch: fetchImpl }));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return client;
}

test("lists the download tools", async () => {
  const client = await connect((async () => new Response("unused", { status: 500 })) as typeof fetch);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), [
    "get_account_usage",
    "get_download_link",
    "get_job_status",
    "get_platform_health",
    "list_supported_platforms",
    "submit_download_job"
  ]);
});

test("submit_download_job posts to /v1/jobs with the key and defaults", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const client = await connect((async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ jobId: "j1", status: "queued", platform: "youtube", estimatedCredits: 1 }), {
      headers: { "content-type": "application/json" }
    });
  }) as typeof fetch);
  const result = await client.callTool({ name: "submit_download_job", arguments: { url: "https://youtu.be/x" } });
  assert.equal(calls[0]?.url, "https://example.test/v1/jobs");
  assert.equal((calls[0]?.init?.headers as Record<string, string>).authorization, "Bearer tv_live_x");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { url: "https://youtu.be/x", mode: "auto", format: "mp4", quality: "best" });
  assert.match((result.content as { text: string }[])[0]!.text, /"jobId": "j1"/);
});
