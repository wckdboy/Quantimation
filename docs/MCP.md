# Quantimation Studio MCP

The MCP server gives a standard language model direct, structured control of the running desktop studio. It does not need an LLM API key for manual scene/asset authoring: the MCP client’s own model can draw assets and direct shots by supplying project data. The `start_episode` and `start_asset` convenience tools use the separate model configured in Studio settings.

## Connect

1. Clone this repository and run `npm ci`.
2. Open Quantimation (`npm start` or the desktop build).
3. Add this stdio server to your MCP client, replacing the absolute path:

```json
{
  "mcpServers": {
    "quantimation": {
      "command": "node",
      "args": ["/absolute/path/to/Quantimation/mcp/server.mjs"]
    }
  }
}
```

On Windows, use forward slashes in JSON paths, for example `C:/Projects/Quantimation/mcp/server.mjs`. Start manually with `npm run mcp`; it waits for a client's JSON-RPC requests on stdin. Do not type ordinary chat into that process.

The default app profile is `%APPDATA%/Quantimation` on Windows, `~/Library/Application Support/Quantimation` on macOS, or `$XDG_CONFIG_HOME/Quantimation` (otherwise `~/.config/Quantimation`) on Linux. For a custom desktop profile, set `QUANTIMATION_PROFILE` when launching the app and add `"--profile", "/same/absolute/profile"` to the MCP arguments.

## Tools

| Tool                | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `get_project`       | Project summary or complete geometry; playback, render and export state  |
| `get_scene`         | Read shot sequence, actors, animation and dialogue                       |
| `get_asset`         | Read editable geometry, rig and voice profile                            |
| `replace_project`   | Load a complete validated production, with undo                          |
| `update_scene`      | Replace one scene                                                        |
| `upsert_asset`      | Add or replace a character, creature, clothing/prop asset, set or effect |
| `update_actor`      | Change placement, view, motion, keyframes and acting beats               |
| `set_camera_shots`  | Set cuts, pans, zooms, tilts and stylized perspectives                   |
| `playback`          | Play, pause or seek                                                      |
| `start_episode`     | Start an asynchronous LLM-directed episode job                           |
| `start_asset`       | Start an asynchronous LLM asset-design job                               |
| `get_generation`    | Read generation status/progress                                          |
| `cancel_generation` | Cancel the active model job                                              |
| `export_episode`    | Start an audiovisual WebM export                                         |
| `undo`              | Undo a project edit                                                      |

The `quantimation://schema` resource describes the production format. Inspect a project before editing. Preserve IDs when changing assets already referenced by scenes. Changes are validated and stored as undoable edits; raw code is never evaluated.

Example directing request for your MCP client:

> Inspect my dragon episode. Add a two-second reaction close-up before the last punchline, give the dragon a smug head tilt and a shrug, and preview that scene. Keep the existing dialogue and other scenes intact.

For a new production without a separate model connection:

> Read the production format. Create a short original fantasy cartoon with new shape-based assets, expressive rig roles, three scenes, dialogue and at least two camera shots per scene. Load it into Quantimation, preview it, then export.

Generation is asynchronous; use the returned job ID with `get_generation` rather than starting duplicate jobs. Export is real-time. Poll `get_project` for `exporting` and `lastExport`. Completed exports go to `Documents/Quantimation/Exports` with timestamped filenames. MCP does not accept arbitrary output filesystem paths.

## Local access boundary

The app binds only to `127.0.0.1` on a random port. A fresh random bearer token is written to the user profile with mode `0600` where supported. The stdio server reads this file; the token is never printed in protocol output. Browser-origin requests and unauthenticated requests are rejected. The HTTP command surface accepts only named studio actions and has a 10 MB limit. The app checks renderer IPC senders and validates mutations against the production schema.

Any local process with access to your profile/token can control the studio. Register this MCP server only with clients you trust, and retain the client's own tool-approval policy. It is not a remote collaboration/authentication server. Do not expose its loopback endpoint through a tunnel. Closing the app removes the discovery file and invalidates the running connection.

## Review before delivery

Use `review_production` to get staging findings and time samples, then `capture_frame` to receive actual PNG frames. Inspect every shot and extreme pose before an expensive export. Review playback and speech separately. Neither a contact sheet nor passing automated checks certifies creative quality. Exports return `reviewRequired: true`, render statistics and warnings through `get_project.lastExport`.

The studio exposes 27 tools. Besides the editing tools above, agents can `apply_pose`, `solve_ik`, `lipsync_line` (Rhubarb when `wavPath` is set), `onion_skin`, `motion_report` and `render_master` (offline 1080p/4K). Named pose tracks and procedural sound cues are documented in the production format.

## Reusable standards

Four additional tools bring the total to 21: list_standards, get_standard, instantiate_standard, and save_standard. They expose 18 built-in templates plus your saved library. See STANDARDS.md for the cast, node names and parameters. export_episode accepts an optional captions boolean; it defaults false and saves removable SRT subtitles beside the video.

