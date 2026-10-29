# Third-party software

The lockfile records exact dependencies and transitive versions. Principal components:

- **Electron** — MIT. https://github.com/electron/electron. Includes Chromium and Node.js notices retained in desktop distributions.
- **electron-builder** — MIT. https://github.com/electron-userland/electron-builder. Development packaging tool.
- **Model Context Protocol TypeScript SDK** — MIT. https://github.com/modelcontextprotocol/typescript-sdk.
- **Zod** — MIT. https://github.com/colinhacks/zod.
- **Kokoro.js** — Apache-2.0. https://github.com/hexgrad/kokoro. Local neural speech integration.
- **Transformers.js** — Apache-2.0. https://github.com/huggingface/transformers.js.
- **ONNX Runtime** — MIT. https://github.com/microsoft/onnxruntime. Native CPU inference libraries.
- **phonemizer.js** — Apache-2.0 wrapper; includes eSpeak NG components under their upstream GPL license. https://github.com/xenova/phonemizer.js and https://github.com/espeak-ng/espeak-ng. Dependency distributions retain their notices.
- **meSpeak / mespeak 2.0.2** — GPL. https://github.com/mikolalysenko/mespeak. Bundled fallback speech based on meSpeak, speak.js and eSpeak. Exact source archive: https://registry.npmjs.org/mespeak/-/mespeak-2.0.2.tgz.
- **Rhubarb Lip Sync** — MIT. https://github.com/DanielSWolf/rhubarb-lip-sync. Not bundled. `scripts/render-broadcast-demo.mjs` calls a local `rhubarb` binary (PocketSphinx models beside the executable) and maps shapes A–H and X onto mouth drawings.
- **@napi-rs/canvas** — MIT. Used for the offline PNG/MP4 master. https://github.com/Brooooooklyn/canvas.

Neural model and voice assets are downloaded on first use from https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX. Consult that model card and the upstream Kokoro distribution for model licensing and attribution. Model weights are not bundled in this repository. The eight demo WAV files were synthesized locally with that model and the `am_fenrir` voice; they are not recordings or clones of a television actor.

Quantimation's source, original demo art and dialogue are available at https://github.com/wckdboy/Quantimation under GPL-3.0-or-later. `npm ci` obtains locked dependency sources. Cloud credentials and private user projects are excluded from distributions.
