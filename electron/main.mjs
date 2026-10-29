import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  safeStorage,
  protocol,
  net,
  session,
  Menu,
} from "electron";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateEpisode, validateAsset, KINDS } from "../src/model.js";
import { directEpisode, designAsset, endpoint } from "./director.mjs";
import { synthesize } from "./speech.mjs";
import { stopNeuralSpeech } from "./neural-speech.mjs";
import { startControl } from "./control.mjs";
import { exportMaster } from "./export-master.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
app.setName("Quantimation");
app.setPath(
  "userData",
  process.env.QUANTIMATION_PROFILE
    ? path.resolve(process.env.QUANTIMATION_PROFILE)
    : path.join(app.getPath("appData"), "Quantimation"),
);
protocol.registerSchemesAsPrivileged([
  {
    scheme: "quantimation",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);
const defaults = {
  provider: "ollama",
  baseUrl: "http://localhost:11434",
  model: "",
  apiKey: "",
  ttsProvider: "neural",
  ttsUrl: "http://localhost:8880/v1",
  ttsModel: "kokoro",
  ttsVoice: "af_heart",
  ttsKey: "",
  systemVoice: "",
};
let settings = { ...defaults },
  window,
  generation = null,
  control = null;
const rendererRequests = new Map(),
  jobs = new Map();
const encrypted = () =>
  safeStorage.isEncryptionAvailable() &&
  (process.platform !== "linux" ||
    safeStorage.getSelectedStorageBackend() !== "basic_text");
async function loadSettings() {
  try {
    const raw = JSON.parse(
      await readFile(
        path.join(app.getPath("userData"), "settings.json"),
        "utf8",
      ),
    );
    for (const k of Object.keys(defaults))
      if (typeof raw[k] === "string") settings[k] = raw[k];
    for (const k of ["apiKey", "ttsKey"])
      settings[k] =
        raw[`${k}Encrypted`] && encrypted()
          ? safeStorage.decryptString(
              Buffer.from(raw[`${k}Encrypted`], "base64"),
            )
          : "";
  } catch {}
}
async function persistSettings() {
  const out = { ...settings };
  for (const k of ["apiKey", "ttsKey"]) {
    delete out[k];
    if (settings[k] && encrypted())
      out[`${k}Encrypted`] = safeStorage
        .encryptString(settings[k])
        .toString("base64");
  }
  const target = path.join(app.getPath("userData"), "settings.json");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target + ".tmp", JSON.stringify(out, null, 2));
  await rename(target + ".tmp", target);
}
const publicSettings = () => ({
  ...settings,
  apiKey: undefined,
  ttsKey: undefined,
  hasApiKey: !!settings.apiKey,
  hasTtsKey: !!settings.ttsKey,
  keyPersistence: encrypted() ? "encrypted" : "session only",
  platform: process.platform,
  mcpReady: !!control,
  profile: app.getPath("userData"),
});
function handle(name, fn) {
  ipcMain.handle(name, async (event, ...args) => {
    if (
      event.sender !== window?.webContents ||
      event.senderFrame?.url !== "quantimation://studio/index.html"
    )
      throw new Error("Unauthorized sender.");
    return fn(...args);
  });
}
async function generate(fn) {
  if (generation) throw new Error("A generation is already running.");
  generation = new AbortController();
  try {
    return await fn(generation.signal);
  } finally {
    generation = null;
  }
}
handle("settings:get", () => publicSettings());
handle("mcp:response", (id, response) => {
  const pending = rendererRequests.get(id);
  if (!pending) return;
  clearTimeout(pending.timer);
  rendererRequests.delete(id);
  response?.error
    ? pending.reject(new Error(response.error))
    : pending.resolve(response?.result);
});
function rendererCall(command) {
  return new Promise((resolve, reject) => {
    if (!window || window.isDestroyed()) {
      reject(new Error("Studio window is closed."));
      return;
    }
    const id = randomUUID();
    const timer = setTimeout(() => {
      rendererRequests.delete(id);
      reject(
        new Error(
          "The studio did not respond. Close any native file dialog and try again.",
        ),
      );
    }, 25000);
    rendererRequests.set(id, { resolve, reject, timer });
    window.webContents.send("mcp:request", { id, command });
  });
}
async function dispatch(command) {
  if (command.action === "get_generation") {
    const job = jobs.get(command.jobId);
    if (!job) throw new Error("Unknown generation job.");
    return job;
  }
  if (command.action === "cancel_generation") {
    generation?.abort();
    return { cancelled: true };
  }
  if (command.action === "start_episode" || command.action === "start_asset") {
    if (generation) throw new Error("A generation is already active.");
    if (!settings.model)
      throw new Error("Configure a language model in Studio settings.");
    const id = randomUUID(),
      job = { id, status: "running", progress: null };
    jobs.set(id, job);
    if (jobs.size > 20) jobs.delete(jobs.keys().next().value);
    if (command.action === "start_episode") {
      if (
        typeof command.prompt !== "string" ||
        command.prompt.length > 12000 ||
        command.prompt.length < 5
      )
        throw new Error("Invalid episode prompt.");
      generate((signal) =>
        directEpisode(
          settings,
          {
            prompt: command.prompt,
            duration: Number(command.duration) || 60,
            style: String(command.style || "Expressive cartoon").slice(0, 2000),
          },
          signal,
          (p) => {
            job.progress = p;
            window.webContents.send("generation:progress", p);
          },
        ),
      )
        .then(async (result) => {
          await rendererCall({ action: "replace_project", project: result });
          job.status = "complete";
          job.title = result.title;
        })
        .catch(async (error) => {
          job.status = "failed";
          job.error = error.message;
          await rendererCall({
            action: "generation_failed",
            message: error.message,
          }).catch(() => {});
        });
    } else {
      if (
        !KINDS.includes(command.kind) ||
        typeof command.description !== "string" ||
        command.description.length > 4000
      )
        throw new Error("Invalid asset brief.");
      generate((signal) =>
        designAsset(
          settings,
          {
            id: "asset_" + Date.now(),
            name: String(command.name || "New asset").slice(0, 100),
            kind: command.kind,
            description: command.description,
            style: String(command.style || "Expressive cartoon").slice(0, 2000),
            width: command.kind === "environment" ? 1280 : 400,
            height: command.kind === "environment" ? 720 : 500,
          },
          signal,
        ),
      )
        .then(async (asset) => {
          await rendererCall({ action: "upsert_asset", asset });
          job.status = "complete";
          job.assetId = asset.id;
        })
        .catch((error) => {
          job.status = "failed";
          job.error = error.message;
        });
    }
    return { jobId: id, status: "running" };
  }
  if (
    ![
      "get_project",
      "get_scene",
      "get_asset",
      "review_production",
      "capture_frame",
      "list_standards",
      "get_standard",
      "instantiate_standard",
      "save_standard",
      "replace_project",
      "update_scene",
      "upsert_asset",
      "update_actor",
      "set_shots",
      "playback",
      "export_episode",
      "apply_pose",
      "solve_ik",
      "lipsync_line",
      "onion_skin",
      "motion_report",
      "set_gesture",
      "inbetween_drawings",
      "check_scale",
      "check_model",
      "render_master",
      "undo",
    ].includes(command.action)
  )
    throw new Error("Unknown studio action.");
  if (command.action === "replace_project")
    command.project = validateEpisode(command.project);
  if (command.action === "upsert_asset")
    command.asset = validateAsset(command.asset);
  return rendererCall(command);
}
handle("settings:set", async (value) => {
  if (!value || typeof value !== "object") throw new Error("Invalid settings.");
  const next = { ...settings };
  for (const k of Object.keys(defaults))
    if (value[k] !== undefined) {
      if (typeof value[k] !== "string" || value[k].length > 2000)
        throw new Error("Invalid settings field.");
      next[k] = value[k].trim();
    }
  if (
    !["ollama", "compatible"].includes(next.provider) ||
    !["neural", "builtin", "system", "http"].includes(next.ttsProvider)
  )
    throw new Error("Unknown provider.");
  endpoint(next, "");
  if (next.ttsProvider === "http") endpoint({ baseUrl: next.ttsUrl }, "");
  if (next.baseUrl !== settings.baseUrl && value.apiKey === undefined)
    next.apiKey = "";
  if (next.ttsUrl !== settings.ttsUrl && value.ttsKey === undefined)
    next.ttsKey = "";
  settings = next;
  await persistSettings();
  return publicSettings();
});
handle("model:test", async () => {
  const res = await fetch(
    endpoint(
      settings,
      settings.provider === "ollama" ? "/api/tags" : "/models",
    ),
    {
      headers: settings.apiKey
        ? { Authorization: `Bearer ${settings.apiKey}` }
        : {},
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    },
  );
  if (!res.ok) throw new Error(`Connection failed (${res.status}).`);
  const data = await res.json();
  return {
    models: (data.models || data.data || [])
      .map((m) => m.name || m.id)
      .filter(Boolean),
  };
});
handle("episode:generate", (request) => {
  if (!settings.model)
    throw new Error("Choose a model in Studio settings first.");
  if (
    !request ||
    typeof request.prompt !== "string" ||
    request.prompt.length < 5 ||
    request.prompt.length > 12000
  )
    throw new Error("Enter an episode idea between 5 and 12,000 characters.");
  return generate((signal) =>
    directEpisode(
      settings,
      {
        prompt: request.prompt,
        duration: Number(request.duration) || 60,
        style: String(request.style || "Flat cartoon").slice(0, 2000),
        standards: Array.isArray(request.standards)
          ? request.standards.slice(0, 60).map(validateAsset)
          : [],
      },
      signal,
      (p) => window.webContents.send("generation:progress", p),
    ),
  );
});
handle("asset:generate", (brief) => {
  if (!settings.model)
    throw new Error("Choose a model in Studio settings first.");
  if (
    !brief ||
    !KINDS.includes(brief.kind) ||
    typeof brief.description !== "string" ||
    brief.description.length > 4000 ||
    !brief.description.trim()
  )
    throw new Error("Describe the asset and choose its type.");
  return generate((signal) =>
    designAsset(
      settings,
      {
        id: `asset_${Date.now()}`,
        name: String(brief.name || "New asset").slice(0, 100),
        kind: brief.kind,
        description: brief.description,
        width: brief.kind === "environment" ? 1280 : 300,
        height: brief.kind === "environment" ? 720 : 420,
        style: String(brief.style || "Flat cartoon").slice(0, 2000),
      },
      signal,
    ),
  );
});
handle("generation:cancel", () => generation?.abort());
handle("speech:render", async (request) => {
  const text = typeof request === "string" ? request : request?.text;
  if (typeof text !== "string" || text.length > 1600)
    throw new Error("Speech text is too long.");
  const speaker =
    typeof request?.speaker === "string"
      ? request.speaker.slice(0, 80)
      : "narrator";
  const pitch =
    38 + ([...speaker].reduce((n, c) => n + c.charCodeAt(0), 0) % 28);
  const voiceId =
    typeof request?.voice?.id === "string"
      ? request.voice.id.slice(0, 60)
      : "af_bella";
  const voiceSpeed =
    typeof request?.voice?.speed === "number"
      ? Math.max(0.6, Math.min(1.5, request.voice.speed))
      : 1;
  const providerVoice =
    typeof request?.voice?.providerVoice === "string"
      ? request.voice.providerVoice.slice(0, 120)
      : "";
  const instructions =
    typeof request?.voice?.instructions === "string"
      ? request.voice.instructions.slice(0, 800)
      : "";
  if (settings.ttsProvider === "neural") {
    try {
      const index = JSON.parse(
        await readFile(
          path.join(root, "resources/demo-audio/index.json"),
          "utf8",
        ),
      );
      const clip = index.find(
        (c) =>
          c.text === text &&
          c.voiceId === voiceId &&
          c.voiceSpeed === voiceSpeed,
      );
      if (clip)
        return (
          await readFile(path.join(root, "resources/demo-audio", clip.file))
        ).toString("base64");
    } catch {}
  }
  const hash = createHash("sha256")
    .update(
      JSON.stringify([
        text,
        pitch,
        voiceId,
        voiceSpeed,
        providerVoice,
        instructions,
        settings.ttsProvider,
        settings.ttsUrl,
        settings.ttsModel,
        settings.ttsVoice,
        settings.systemVoice,
      ]),
    )
    .digest("hex");
  const dir = path.join(app.getPath("userData"), "speech-cache");
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, hash + ".wav");
  try {
    return (await readFile(target)).toString("base64");
  } catch {}
  const bytes = await synthesize(
    text,
    {
      ...settings,
      pitch,
      voiceId,
      voiceSpeed,
      providerVoice,
      voiceInstructions: instructions,
      neuralCache: path.join(app.getPath("userData"), "models"),
    },
    undefined,
    (p) =>
      window.webContents.send("generation:progress", {
        phase: "Preparing neural voices",
        detail: `Downloading ${p.file} · ${p.percent}% · runs locally after download`,
        progress: p.percent,
      }),
  );
  await writeFile(target, bytes);
  return bytes.toString("base64");
});
handle("project:save", async (value) => {
  const episode = validateEpisode(value);
  const result = await dialog.showSaveDialog(window, {
    defaultPath: episode.title.replace(/[^a-zA-Z0-9 -]/g, "") + ".quantimation",
    filters: [{ name: "Quantimation project", extensions: ["quantimation"] }],
  });
  if (result.canceled) return null;
  await writeFile(result.filePath, JSON.stringify(episode, null, 2));
  return result.filePath;
});
handle("project:open", async () => {
  const result = await dialog.showOpenDialog(window, {
    properties: ["openFile"],
    filters: [
      { name: "Quantimation project", extensions: ["quantimation", "json"] },
    ],
  });
  if (result.canceled) return null;
  const data = await readFile(result.filePaths[0], "utf8");
  if (data.length > 10000000) throw new Error("Project exceeds 10 MB.");
  return validateEpisode(JSON.parse(data));
});
handle(
  "video:save",
  async (bytes, title, automatic = false, subtitles = "") => {
    if (!(bytes instanceof Uint8Array) || bytes.length > 500000000)
      throw new Error("Invalid or oversized video.");
    if (typeof subtitles !== "string" || subtitles.length > 1000000)
      throw new Error("Invalid subtitles.");
    const save = async (file) => {
      await writeFile(file, Buffer.from(bytes));
      if (subtitles)
        await writeFile(
          file.replace(/\.[^/.]+$/, "") + ".srt",
          subtitles,
          "utf8",
        );
      return file;
    };
    if (automatic === true) {
      const dir = path.join(
        app.getPath("documents"),
        "Quantimation",
        "Exports",
      );
      await mkdir(dir, { recursive: true });
      const file = path.join(
        dir,
        String(title)
          .replace(/[^a-zA-Z0-9 -]/g, "")
          .slice(0, 100) +
          "-" +
          Date.now() +
          ".webm",
      );
      return save(file);
    }
    const result = await dialog.showSaveDialog(window, {
      defaultPath: String(title).replace(/[^a-zA-Z0-9 -]/g, "") + ".webm",
      filters: [{ name: "WebM video with audio", extensions: ["webm"] }],
    });
    if (result.canceled) return null;
    return save(result.filePath);
  },
);
handle("master:export", async (request) => {
  if (!request || typeof request !== "object") throw new Error("Invalid master request.");
  const episode = validateEpisode(request.episode);
  const height = [720, 1080, 2160].includes(request.height) ? request.height : 1080;
  const fps = Math.min(30, Math.max(12, Math.round(Number(request.fps) || 24)));
  return exportMaster(episode, {
    height,
    fps,
    captions: request.captions === true,
    title: episode.title,
    dir: path.join(app.getPath("documents"), "Quantimation", "Masters"),
  });
});
app
  .whenReady()
  .then(async () => {
    await loadSettings();
    protocol.handle("quantimation", (request) => {
      const url = new URL(request.url);
      if (url.host !== "studio")
        return new Response("Not found", { status: 404 });
      let relative;
      try {
        relative = decodeURIComponent(url.pathname);
      } catch {
        return new Response("Bad URL", { status: 400 });
      }
      const target = path.resolve(root, "src", "." + relative);
      const src = path.resolve(root, "src");
      if (!target.startsWith(src + path.sep))
        return new Response("Not found", { status: 404 });
      return net.fetch(pathToFileURL(target).toString());
    });
    session.defaultSession.setPermissionRequestHandler(
      (_wc, _permission, callback) => callback(false),
    );
    function createWindow() {
      window = new BrowserWindow({
        width: 1500,
        height: 980,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: "#121317",
        title: "Quantimation",
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(root, "electron/preload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          backgroundThrottling: false,
        },
      });
      window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      window.webContents.on("will-navigate", (event, url) => {
        if (url !== "quantimation://studio/index.html") event.preventDefault();
      });
      window.loadURL("quantimation://studio/index.html");
    }
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
        {
          label: "Edit",
          submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "selectAll" },
          ],
        },
        {
          label: "View",
          submenu: [
            { role: "reload" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { role: "togglefullscreen" },
          ],
        },
      ]),
    );
    createWindow();
    control = await startControl({
      profile: app.getPath("userData"),
      dispatch,
    });
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    app.on("window-all-closed", () => {
      generation?.abort();
      if (process.platform !== "darwin") app.quit();
    });
    app.on("before-quit", () => {
      stopNeuralSpeech();
      control?.close();
    });
  })
  .catch((error) => {
    dialog.showErrorBox("Quantimation could not start", error.message);
    app.quit();
  });
