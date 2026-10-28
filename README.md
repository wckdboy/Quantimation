# Quantimation

**A desktop animation studio directed by a language model.**

Turn a premise into an editable animated episode: screenplay, environments, characters, creatures, props, camera shots, movement, dialogue, and spoken audio. A standard LLM writes structured production data. Quantimation's own 2D vector renderer draws every frame; there is no text-to-video model in the pipeline.

Built for **macOS, Linux, and Windows** with Electron. The included *The Last Stop* episode works without a model connection, including offline synthesized speech and video export.

## Run locally

Install [Node.js 24 LTS](https://nodejs.org/) and Git, then:

```sh
git clone https://github.com/wckdboy/Quantimation.git
cd Quantimation
npm ci
npm start
```

The installation downloads Electron from its official distribution. On Linux, Electron needs a normal graphical desktop session and its usual system libraries. Built-in speech is bundled; installing a system speech package is optional.

## Connect a director

Open **Studio settings** using the gear in the lower left.

### Local model

1. Run [Ollama](https://ollama.com/) and install an instruction-following model of your choice. Larger models generally produce more coherent stories and better vector geometry.
2. Choose **Ollama**, with `http://localhost:11434` as the base URL.
3. Select **Save & test connection**, choose an installed model name, and save settings.

[LM Studio](https://lmstudio.ai/) and other local servers work through **OpenAI-compatible API**, typically at `http://localhost:1234/v1`. Use the server's actual model identifier.

### Cloud model

Choose **OpenAI-compatible API**, enter the provider's HTTPS base URL ending in `/v1` if required, model identifier, and API key. The endpoint must implement `/chat/completions` with JSON object responses. `/models` is used for the connection test. Some providers require adapters or different parameters and are not supported by this first release.

API keys stay in the Electron main process. They are encrypted with Electron safeStorage when a secure OS backend is available; otherwise they remain session-only. They are never included in project files or the repository. The configured model receives your prompt, story, and asset descriptions. The app does not run code returned by the model.

## Make an episode

1. Describe the story. Include genre, setting, cast, tone, action, and desired visual style. The initial sci-fi cartoon preset is optional; fantasy, graphic novel, minimalist and storybook directions are included.
2. Choose the target length and art direction, then **Generate episode**.
3. The director writes a story, dialogue, shots and motion cues. Each asset is designed as a new vector shape tree, validated and assembled into scenes.
4. Speech is rendered, measured, and placed on the timeline without overlapping lines. Scenes expand if the spoken audio needs more time.
5. Play the episode and revise the screenplay, camera, staging, assets or keyframes.
6. **Export episode** produces a 1280×720 WebM with speech and optional captions. Export takes approximately the episode's duration; it is a real-time recording of the custom renderer.

The app supports any narrative genre within its 2D drawing vocabulary. It is not limited to a fixed cast, environment, or creature type. Results still depend on the model's ability to compose usable shape data and direction.

## Speech

| Engine | Requirements | Output |
| --- | --- | --- |
| Built-in offline | None beyond the app | Basic eSpeak-based synthetic speech; per-character pitch variation |
| Operating system | Windows SAPI, macOS `say`, or Linux `espeak-ng` | Installed system voice |
| HTTP speech API | A compatible local or cloud `/audio/speech` endpoint | Neural speech, including compatible Kokoro servers |

For HTTP speech, configure the base URL, model and voice ID. The provider must return WAV audio for `response_format: "wav"`. The API receives dialogue text. Built-in speech runs in a worker thread and is cached locally. Mouth opening follows the rendered audio amplitude, rather than guessing purely from text.

## Editing and projects

- **Scene cards:** select a scene and use *Edit scene* for its camera, environment, direction and duration.
- **Asset library:** select an asset to change placement, scale, movement and orientation. Assets can be reused across scenes.
- **Imagine something new:** ask the LLM for another character, creature, prop, environment or effect, or import asset JSON without a model.
- **Shape & rig editor:** edit vector geometry and animation roles directly.
- **Motion keyframes:** animate `x`, `y`, `rotation`, `scale`, and `opacity` with eased interpolation.
- **Screenplay:** edit spoken text, speakers and start times. Voices regenerate on the next playback.
- **Save project:** creates a portable `.quantimation` JSON file. Speech is regenerated/cached separately. The current project also autosaves locally.
- **Undo:** keeps the last 35 edits during the current session.

Shortcuts: **Space** play/pause, **Ctrl/Cmd+S** save, **Ctrl/Cmd+Z** undo.

An example project is in [`resources/The Last Stop.quantimation`](resources/The%20Last%20Stop.quantimation).

## Architecture

```text
Premise + art direction
        ↓
LLM director → screenplay + scene plan + asset briefs
        ↓
LLM asset designer → vector shape trees + rig roles
        ↓
Validation → bounded, editable episode JSON
        ↓
Speech synthesis → WAV clips → automatic timing adjustment
        ↓
Canvas renderer + keyframes + audio-driven mouths
        ↓
Web Audio mixer + MediaRecorder → WebM episode
```

`src/model.js` validates and normalizes all model/imported data. `src/renderer.js` renders the same data for preview, thumbnails and export. `electron/director.mjs` implements the provider adapters, staged asset creation and one repair attempt on invalid output. `electron/speech.mjs` provides bundled, native and HTTP speech. The renderer has no Node access; a narrow, sender-checked IPC bridge handles files, model requests and secrets.

See [the production format](docs/PRODUCTION_FORMAT.md) for the schema and animation conventions.

## Build and test

```sh
npm test
npm run package       # Unpacked app for the current OS
npm run dist          # Installer/distribution for the current OS
```

Build on the target OS. Platform shortcuts are `dist:win`, `dist:mac`, and `dist:linux`. GitHub Actions runs tests and builds Windows NSIS, macOS DMG (Intel and Apple Silicon), and Linux AppImage/DEB artifacts on their respective runners. Download artifacts from a successful Actions run.

The project does not include signing/notarization certificates. Distribution signing is a separate release step; macOS/Windows may warn about unsigned builds. Do not mistake build configuration for verification on every operating system. Local validation is recorded in [VALIDATION.md](VALIDATION.md), and the actual CI run is authoritative for other platforms.

## Current limits

This is a working **v0.1 prototype**, not a broadcast production system. The default voice is robotic. Animation uses procedural rig roles and interpolated transforms, with amplitude-based mouth movement; there is no phoneme/viseme model, full inverse kinematics, 3D engine, generated music, Foley, or automatic sound effects. HTTP speech currently uses one configured neural voice; built-in voices vary pitch by character. Lip sync is approximate.

Generation targets short episodes (3–8 scenes, up to 12 newly designed assets). Requested duration is approximate and may expand after speech rendering. The editor accepts up to 100 scenes, 80 assets, and two hours total, but extended productions require further authoring and performance testing. Drawings are simple vector assets; they do not guarantee exact reproduction of any commercial show's artwork or production quality.

Model/API usage may have provider costs. No model weights, cloud keys or private user data are shipped. Cancel stops pending model requests; already completed provider requests may still be billable.

## License

GPL-3.0-or-later. The bundled speech dependency `mespeak` (which incorporates eSpeak/speak.js) is GPL-licensed. Dependency source is available through the locked npm package and its [upstream repository](https://github.com/mikolalysenko/mespeak). See [THIRD_PARTY.md](THIRD_PARTY.md) and [LICENSE](LICENSE). Original sample artwork and story are included under the project license.

