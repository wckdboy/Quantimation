import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startControl } from "../electron/control.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("closing an older app preserves a newer app connection", async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "quantimation-test-"));
  const older = await startControl({ profile, dispatch: async () => ({}) });
  const newer = await startControl({ profile, dispatch: async () => ({}) });
  try {
    const before = await readFile(
      path.join(profile, "mcp-connection.json"),
      "utf8",
    );
    await older.close();
    assert.equal(
      await readFile(path.join(profile, "mcp-connection.json"), "utf8"),
      before,
    );
  } finally {
    await newer.close();
    await rm(profile, { recursive: true, force: true });
  }
});
test("local studio bridge requires token, rejects browser origins and preserves Unicode", async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "quantimation-test-"));
  const server = await startControl({
    profile,
    dispatch: async (command) => ({ echo: command }),
  });
  try {
    const connection = JSON.parse(
      await readFile(path.join(profile, "mcp-connection.json"), "utf8"),
    );
    const request = (headers, body = { action: "hello", text: "Dragon 🐲" }) =>
      fetch(connection.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
    assert.equal((await request({})).status, 403);
    assert.equal(
      (
        await request({
          Authorization: "Bearer " + connection.token,
          Origin: "https://untrusted.example",
        })
      ).status,
      403,
    );
    const valid = await request({
      Authorization: "Bearer " + connection.token,
    });
    assert.equal(valid.status, 200);
    assert.equal((await valid.json()).result.echo.text, "Dragon 🐲");
  } finally {
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});
test("MCP stdio client negotiates, discovers tools, invokes commands and reads format", async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "quantimation-test-"));
  const calls = [];
  const server = await startControl({
    profile,
    dispatch: async (command) => {
      calls.push(command);
      return { title: "Test production", received: command.action };
    },
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, "mcp/server.mjs"), "--profile", profile],
    stderr: "pipe",
  });
  const client = new Client({
    name: "quantimation-integration-test",
    version: "1.0.0",
  });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 21);
    assert.ok(tools.tools.some((t) => t.name === "set_camera_shots"));
    const result = await client.callTool({
      name: "get_project",
      arguments: { full: true },
    });
    assert.equal(JSON.parse(result.content[0].text).title, "Test production");
    assert.equal(calls[0].full, true);
    const resource = await client.readResource({
      uri: "quantimation://schema",
    });
    assert.match(resource.contents[0].text, /production format/);
    const invalid = await client.callTool({
      name: "playback",
      arguments: { operation: "execute arbitrary code" },
    });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
    await transport.close();
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});
