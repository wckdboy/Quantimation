#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const option = process.argv.indexOf("--profile");
const defaultProfile =
  process.platform === "win32"
    ? path.join(
        process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
        "Quantimation",
      )
    : process.platform === "darwin"
      ? path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "Quantimation",
        )
      : path.join(
          process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
          "Quantimation",
        );
const profile =
  option >= 0
    ? path.resolve(process.argv[option + 1])
    : process.env.QUANTIMATION_PROFILE || defaultProfile;
async function studio(action, args = {}) {
  let connection;
  try {
    connection = JSON.parse(
      await readFile(path.join(profile, "mcp-connection.json"), "utf8"),
    );
  } catch {
    throw new Error(
      "Open the Quantimation desktop app first. If using a custom profile, pass --profile /absolute/path.",
    );
  }
  const url = new URL(connection.url);
  if (
    url.hostname !== "127.0.0.1" ||
    url.protocol !== "http:" ||
    url.pathname !== "/command"
  )
    throw new Error("Invalid local studio connection.");
  const result = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...args }),
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  });
  const body = await result.json();
  if (!result.ok) throw new Error(body.error || "Studio command failed.");
  return body.result;
}
export function createMcpServer() {
  const server = new McpServer(
    { name: "quantimation-studio", version: "0.2.0" },
    {
      instructions:
        "Quantimation is a live 2D animation studio. Inspect the project before editing. All artwork and animation are declarative JSON. Use the production_format resource for shape and camera conventions. Mutations are validated and undoable. Model generation returns a job ID; poll get_generation sparingly. Export runs in real time and writes only to the app’s designated export directory.",
    },
  );
  const tool = (name, description, inputSchema, action, readOnly = false) =>
    server.registerTool(
      name,
      {
        description,
        inputSchema,
        annotations: {
          readOnlyHint: readOnly,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async (args) => {
        try {
          const result = await studio(action, args);
          if (action === "capture_frame")
            return {
              content: [
                { type: "image", data: result.data, mimeType: result.mimeType },
                {
                  type: "text",
                  text: JSON.stringify({
                    time: result.time,
                    note: result.note,
                  }),
                },
              ],
            };
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: error.message }],
          };
        }
      },
    );
  const object = z.record(z.string(), z.unknown());
  tool(
    "list_standards",
    "List reusable rigs, buildings, props, foliage, worlds and locally saved templates, plus editable palette parameters.",
    {},
    "list_standards",
    true,
  );
  tool(
    "get_standard",
    "Read a complete editable standard asset before adapting its existing geometry and rig. Start here rather than redrawing common objects.",
    { standardId: z.string(), parameters: object.optional() },
    "get_standard",
    true,
  );
  tool(
    "instantiate_standard",
    "Add a customized standard to the project. Does not overwrite an existing asset ID.",
    {
      standardId: z.string(),
      assetId: z.string(),
      name: z.string().optional(),
      parameters: object.optional(),
    },
    "instantiate_standard",
  );
  tool(
    "save_standard",
    "Save an existing project asset as a reusable local standard.",
    { assetId: z.string(), name: z.string().optional() },
    "save_standard",
  );
  tool(
    "review_production",
    "Run preflight checks for dialogue, camera coverage and acting risks; returns exact review times. Technical checks never certify artistic quality.",
    {},
    "review_production",
    true,
  );
  tool(
    "capture_frame",
    "Render a 720p PNG at an episode time for visual inspection. Inspect shots and extreme poses before export; still frames cannot approve motion or voice delivery.",
    { time: z.number().min(0), captions: z.boolean().default(true) },
    "capture_frame",
    true,
  );
  tool(
    "get_project",
    "Inspect current title, assets, scenes, playhead, render and export state. Set full to include all shape geometry.",
    { full: z.boolean().default(false) },
    "get_project",
    true,
  );
  tool(
    "get_scene",
    "Read one scene including instances, acting beats, dialogue and camera shot sequence.",
    { sceneId: z.string() },
    "get_scene",
    true,
  );
  tool(
    "get_asset",
    "Read a reusable asset including shapes, rig roles, clothing geometry and voice profile.",
    { assetId: z.string() },
    "get_asset",
    true,
  );
  tool(
    "replace_project",
    "Replace the episode with a complete validated version-1 production. Adds an undo checkpoint.",
    { project: object },
    "replace_project",
  );
  tool(
    "update_scene",
    "Replace a scene with a complete scene object. Inspect it first; preserve instances and dialogue you want to retain.",
    { sceneId: z.string(), scene: object },
    "update_scene",
  );
  tool(
    "upsert_asset",
    "Add or replace a reusable vector asset, including creatures, costumes, props, sets and effects.",
    { asset: object },
    "upsert_asset",
  );
  tool(
    "update_actor",
    "Update an existing instance. Patch fields can include x, y, scale, view, motion, keyframes and acting beats.",
    { sceneId: z.string(), instanceId: z.string(), patch: object },
    "update_actor",
  );
  tool(
    "set_camera_shots",
    "Set ordered camera shots. Each has at, label and camera with center, zoom/zoomEnd, pan, tilt and eye/low/high perspective.",
    { sceneId: z.string(), shots: z.array(object) },
    "set_shots",
  );
  tool(
    "playback",
    "Control playback or seek to an absolute episode time in seconds. Speech renders as needed.",
    {
      operation: z.enum(["play", "pause", "seek"]),
      time: z.number().min(0).optional(),
    },
    "playback",
  );
  tool(
    "start_episode",
    "Ask the app’s configured LLM to write and draw a new episode. Returns a generation job ID.",
    {
      prompt: z.string().min(5).max(12000),
      duration: z.number().min(15).max(300).default(60),
      style: z
        .string()
        .max(2000)
        .default(
          "Wicked colorful hand-drawn 2D cartoon with squiggly outlines, derpy anatomy and expressive acting.",
        ),
    },
    "start_episode",
  );
  tool(
    "start_asset",
    "Ask the configured LLM to create a new reusable asset. Returns a job ID.",
    {
      name: z.string().max(100),
      kind: z.enum(["character", "creature", "prop", "environment", "effect"]),
      description: z.string().max(4000),
      style: z.string().max(2000).optional(),
    },
    "start_asset",
  );
  tool(
    "get_generation",
    "Inspect a generation job and its latest progress.",
    { jobId: z.string() },
    "get_generation",
    true,
  );
  tool(
    "cancel_generation",
    "Cancel the active model generation.",
    {},
    "cancel_generation",
  );
  tool(
    "export_episode",
    "Start a 720p WebM export with speech and a removable SRT subtitle sidecar. Burned-in captions default off. Check get_project for completion and file path.",
    { captions: z.boolean().optional() },
    "export_episode",
  );
  tool("undo", "Undo the most recent project mutation.", {}, "undo");
  server.registerResource(
    "production_format",
    "quantimation://schema",
    {
      description: "Shape, rig, motion, voice and camera production format.",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "quantimation://schema",
          mimeType: "text/markdown",
          text: await readFile(
            path.join(
              path.dirname(fileURLToPath(import.meta.url)),
              "../docs/PRODUCTION_FORMAT.md",
            ),
            "utf8",
          ),
        },
      ],
    }),
  );
  return server;
}
const server = createMcpServer();
await server.connect(new StdioServerTransport());
