# Quantimation

**A desktop 2D animation studio directed by a language model.**

A prompt becomes a screenplay, newly drawn vector assets, staging, camera shots, motion and spoken dialogue. Quantimation draws each frame with its own programmable renderer. It does not use a text-to-video model.

Built with Electron for **Windows, macOS and Linux**. This is a working v0.2 prototype; broadcast animation quality remains a development goal.

## Included episode

**Dragon: A Burning Talent** is a 30-second original cartoon about Sir Scorch, a smug dragon with terrible jokes and catastrophic stage presence. Three scenes with motivated camera cuts cover a cheerful city, a fire-breathing profile, a collapsing clock tower and the smoking aftermath. The character has wobbly outlines, star-dot eyes, expressive eyebrows, wings and layered clothing.

The episode and its six neural dialogue clips are bundled, so the demo plays and exports offline. Open `resources/Dragon - A Burning Talent.quantimation` or choose the demo in the studio. The older _The Last Stop_ example is also included.

## Run

Install Node.js 24 and Git:

```sh
git clone https://github.com/wckdboy/Quantimation.git
cd Quantimation
npm ci
npm start
```

The installation downloads Electron. A graphical desktop is required. On Linux, set `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` before installation to skip optional GPU libraries: the included neural speech engine uses the CPU. CI already sets this flag.

## Direct from an LLM through MCP

Quantimation exposes **21 studio tools** for reading and editing projects, designing assets, directing actor motion and camera shots, playback, generation jobs, undo and audiovisual export. The MCP client's own model can author a complete production without a separate model API connection.

With the app open, register this stdio server in your MCP client:

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

Use forward slashes for Windows JSON paths. See [MCP setup and tools](docs/MCP.md) and the [production format](docs/PRODUCTION_FORMAT.md). The MCP connection is local and authenticated; it does not expose a remote studio server.

## Generate from the app

Open **Studio settings** with the gear in the lower left. Choose an Ollama model at `http://localhost:11434`, or an OpenAI-compatible endpoint and its actual model identifier. Compatible servers must support `/chat/completions` with JSON object responses and `/models` for the connection test. Remote endpoints require HTTPS. Some providers need adapters and are not supported.

Enter a premise, choose the target length and art direction, then select **Generate episode**. The director plans the story and designs each new asset as a validated shape tree. Speech is rendered and measured; later lines and scene durations adjust to prevent overlapping dialogue. You can revise the result before exporting.

The model receives your prompt, story and asset descriptions. API keys stay in the main process and are encrypted with the OS key store when available; otherwise they remain session-only. Projects contain no API keys. No executable model output is evaluated. Provider charges depend on your own account.

## Studio controls

- **Camera:** cuts, independent shot pans and zooms, Dutch angles, stylized high/low perspectives, and a camera timeline track.
- **Acting:** motion keyframes, points, shrugs, recoils, laughs, nods, angry/surprised/smug beats, eyebrow movement, blinking and audio-driven mouths.
- **Views:** front, three-quarter, profile and back projections. For accurate alternate silhouettes, author separate view assets, as the dragon demo does.
- **Assets:** new characters, creatures, environments, props, clothing layers and effects composed from editable vector primitives and rig groups. Reuse them across scenes.
- **Editing:** screenplay, shape/rig JSON, shot sequence, staging, voice profiles and undo. **Imagine something new** designs an additional asset with your configured model.
- **Projects:** portable `.quantimation` JSON, local autosave and 35 session undo steps. Audio is cached separately.
- **Export:** 1280×720 WebM with mixed speech and optional captions. Export records in real time; keep the app open for the episode's duration.

Shortcuts: **Space** play/pause, **Ctrl/Cmd+S** save, **Ctrl/Cmd+Z** undo.

## Voices

| Engine                 | Behavior                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local neural (default) | Kokoro CPU synthesis with per-character voice ID and speed. First new dialogue downloads roughly 90 MB of model data; subsequent synthesis uses the local cache. |
| Built-in basic         | Bundled meSpeak/eSpeak speech, requiring no model download. More robotic, with character pitch variation.                                                        |
| Operating system       | Windows SAPI, macOS `say`, or Linux `espeak-ng`, if available.                                                                                                   |
| HTTP speech            | A compatible `/audio/speech` endpoint returning WAV. Configure its base URL, model and voice.                                                                    |

The dragon's prerecorded neural clips need no network. New local neural speech downloads public model/voice assets but does not send dialogue to a synthesis service. HTTP speech sends dialogue to the configured provider. There is no voice cloning or exact actor imitation. Mouth drawings follow audio amplitude and approximate text timing; this is not phoneme-aligned lip sync.

## Production review

Open **Review** for technical findings and rendered pose samples before export. The LLM directs named joints in a separate performance pass after designing assets. Export measures frame stalls and remains a review cut. MCP tools `review_production` and `capture_frame` let a directing agent inspect actual frames. Creative quality is never inferred from a passing test or a successful encode. See [QUALITY.md](docs/QUALITY.md).

## Architecture

```text
Prompt → LLM story plan → LLM vector assets → strict production validation
                                                   ↓
MCP client → editable project, actors and shots → custom Canvas renderer
                                                   +
                          speech synthesis → measured timeline → WebM
```

`src/model.js` validates production data. `src/renderer.js` shares drawing logic between the stage, thumbnails and export. `electron/director.mjs` handles provider requests and one repair attempt. Neural speech runs in a worker. The sandboxed renderer has no Node access and uses a narrow sender-checked IPC bridge. The stdio MCP server controls a token-protected loopback service.

## Build and test

```sh
npm test
npm run package       # Unpacked app for the current OS
npm run dist          # Installer for the current OS
npm run demo:voices   # Regenerate the demo's neural dialogue
```

Build on the target OS. GitHub Actions tests and builds Windows NSIS, macOS Intel/Apple Silicon DMG, and Linux AppImage/DEB packages. Download artifacts from a successful Actions run. Signing and notarization certificates are not included. See [VALIDATION.md](VALIDATION.md) for actual checks and remaining verification.

## Scope and limits

The drawing vocabulary supports many story genres and original casts, but it does not promise infinite capacity or television production quality. Automatic generation currently targets 3–8 scenes and up to 12 newly designed assets. Requested duration is approximate. The format accepts up to 100 scenes, 80 assets and two hours; large productions need performance testing and additional authoring.

This is procedural 2D animation with rig roles, eased transforms and stylized camera/view projections. There is no full inverse kinematics, true 3D rotation, automatic cloth simulation, phoneme lip sync, music or recorded Foley. Asset quality and story coherence depend on the directing model. Further art direction and animation work are needed for broadcast results.

## License

GPL-3.0-or-later. Original sample art and stories use the project license. See [LICENSE](LICENSE) and [THIRD_PARTY.md](THIRD_PARTY.md) for dependencies and source links.

## Reusable cast and worlds

The original Quantumania family includes five articulated character rigs with nine mouth drawings, four hand poses, different silhouettes and cached voice auditions. Open Examples to load the cast. Assets → + offers 18 editable standards, including buildings, plants, worlds and environments. Save your modifications as reusable standards. See [Standards and cast](docs/STANDARDS.md).

Exports save removable SRT subtitles alongside the video. Burned-in captions default off. See [Visual review architecture](docs/VISION_REVIEW.md) for the proposed local/cloud inspection workflow; a vision reviewer is not connected yet.

