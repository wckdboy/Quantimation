import { dragonEpisode as demoEpisode } from "./dragon.js";
import {
  validateEpisode,
  validateAsset,
  duration,
  locate,
  activeShot,
  KINDS,
  MOTIONS,
} from "./model.js";
import { renderFrame, renderAsset, renderOnionSkin } from "./renderer.js";
import { applyIk, applyLipsync, applyPose, reportMotion } from "./directing.js";
import { auditProduction, summarizeRender } from "./quality.js";
import { soundBuffer } from "./sound.js";
import { subtitlesSrt } from "./captions.js";
import { castShowcase } from "./cast.js";
import { poseAt } from "./pose.js";
import { STANDARDS, STYLE_KIT, instantiateStandard } from "./standards.js";
const $ = (id) => document.getElementById(id),
  bridge = window.quantimation;
const icons = {
  folder: "M3 6h6l2 2h10v12H3z",
  save: "M5 3h12l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8",
  export: "M12 16V3 M7 8l5-5 5 5 M4 14v6h16v-6",
  clapper: "M3 9h18v12H3z M3 9l-1-5 18-3 1 5z M7 3l3 5 M14 2l3 5",
  shapes:
    "M7 3l5 8H2z M14 3h7v7h-7z M5 15h7v7H5z M21 18a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  script: "M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 8c0-4 7-4 7 0 0 3-4 2-4 6 M12 18h.01",
  sparkles: "M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z",
  waveform: "M3 9v6 M7 5v14 M11 2v20 M15 6v12 M19 4v16 M23 10v4",
  timeline: "M3 4h18v4H3z M3 12h8v8H3z M15 12h6v8h-6z",
  sliders: "M4 3v18 M12 3v18 M20 3v18 M1 8h6 M9 16h6 M17 7h6",
  undo: "M8 4L3 9l5 5 M3 9h10a7 7 0 0 1 0 14",
  restart: "M4 4v16 M20 4L7 12l13 8z",
  play: "M7 4l14 8-14 8z",
  pause: "M7 4h3v16H7z M15 4h3v16h-3z",
  volume: "M3 9h4l5-4v14l-5-4H3z M16 8c3 2 3 6 0 8 M19 5c5 4 5 10 0 14",
  mute: "M3 9h4l5-4v14l-5-4H3z M17 8l6 8 M23 8l-6 8",
  plus: "M12 4v16 M4 12h16",
  close: "M6 6l12 12 M6 18L18 6",
};
const svg = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.sparkles}"/></svg>`;
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", svg(el.dataset.icon));
    el.removeAttribute("data-icon");
  });
}
hydrateIcons();
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (t) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
let episode = demoEpisode(),
  time = 0,
  sceneIndex = 0,
  playing = false,
  selectedAsset = null,
  filter = "all",
  captioned = false,
  muted = false,
  busy = false,
  exporting = false,
  modified = false;
let history = [],
  audioContext,
  mix,
  audioDestination,
  audioBuffers = new Map(),
  sources = [],
  playStart = 0,
  playOffset = 0,
  toastTimer,
  recorder,
  exportCancelled = false,
  lastExport = null,
  renderFrames = [],
  renderFault = null;
let customStandards = [];
let onion = {
  enabled: false,
  before: 2,
  after: 2,
  opacity: 0.45,
  prev: "#6eb6ff",
  next: "#ff9d4a",
  trails: true,
};
try {
  customStandards = JSON.parse(
    localStorage.getItem("quantimation-standards") || "[]",
  )
    .slice(0, 60)
    .map(validateAsset);
} catch {}
function standardCatalog() {
  return [
    ...STANDARDS,
    ...customStandards.map((a) => ({
      id: "custom_" + a.id,
      name: a.name,
      kind: a.kind,
      description: a.description,
    })),
  ];
}
function standardAsset(standardId, options = {}) {
  if (standardId.startsWith("custom_")) {
    const template = customStandards.find(
      (a) => "custom_" + a.id === standardId,
    );
    if (!template) throw new Error("Standard not found.");
    return validateAsset({
      ...structuredClone(template),
      id: options.id || "standard_asset",
      name: options.name || template.name,
    });
  }
  return instantiateStandard(standardId, options);
}
try {
  const saved = localStorage.getItem("quantimation-autosave-v2");
  if (saved) {
    episode = validateEpisode(JSON.parse(saved));
    modified = true;
  }
} catch {}
function toast(message, error = false) {
  $("toast").textContent = String(message).replace(
    /^Error invoking remote method '[^']+': (Error: )?/,
    "",
  );
  $("toast").style.borderColor = error ? "#c38676" : "#71775e";
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 6500);
}
function requireDesktop() {
  if (!bridge) {
    toast(
      "Launch the desktop application with npm start to use this feature.",
      true,
    );
    return false;
  }
  return true;
}
function checkpoint() {
  history.push(JSON.stringify(episode));
  if (history.length > 35) history.shift();
}
function persist() {
  modified = true;
  try {
    localStorage.setItem("quantimation-autosave-v2", JSON.stringify(episode));
    $("savedStatus").textContent = "Saved on this device";
  } catch {
    $("savedStatus").textContent = "Use Save project to keep changes";
  }
  $("demoTag").hidden = true;
}
function applyEdit(fn) {
  pause();
  checkpoint();
  try {
    fn();
    episode = validateEpisode(episode);
    persist();
    renderUI();
    return true;
  } catch (e) {
    episode = JSON.parse(history.pop());
    toast(e.message, true);
    return false;
  }
}
function currentScene() {
  return episode.scenes[sceneIndex];
}
function seek(t) {
  if (exporting) return;
  const was = playing;
  pause();
  time = Math.max(0, Math.min(duration(episode), t));
  sceneIndex = locate(episode, time).index;
  renderUI();
  if (was) startPlayback();
}
function selectScene(index) {
  const t = episode.scenes.slice(0, index).reduce((n, s) => n + s.duration, 0);
  seek(t);
}
function stageOptions() {
  return {
    captions: captioned,
    selected: exporting
      ? null
      : currentScene().instances.find((p) => p.assetId === selectedAsset)?.id,
    amplitude: (id, t) => {
      const entry = audioBuffers.get(id),
        line = currentScene().dialogue.find((d) => d.id === id);
      if (!entry || !line) return undefined;
      const samples = entry.buffer.getChannelData(0),
        start = Math.floor((t - line.at) * entry.buffer.sampleRate);
      let sum = 0;
      for (let i = 0; i < 160; i++) sum += (samples[start + i] || 0) ** 2;
      return Math.min(1, Math.sqrt(sum / 160) * 7);
    },
  };
}
function draw() {
  const hit = locate(episode, time);
  sceneIndex = hit.index;
  if (onion.enabled && !exporting)
    renderOnionSkin($("stage"), episode, time, {
      ...stageOptions(),
      captions: false,
      before: onion.before,
      after: onion.after,
      opacity: onion.opacity,
      prevTint: onion.prev,
      nextTint: onion.next,
      trails: onion.trails,
    });
  else renderFrame($("stage"), episode, time, stageOptions());
  $("scrubber").value = time;
  $("timecode").innerHTML =
    `${fmt(time)} <span>/ ${fmt(duration(episode))}</span>`;
  $("playhead").style.left = `${(time / duration(episode)) * 100}%`;
  $("shotLabel").textContent =
    `SCENE ${String(sceneIndex + 1).padStart(2, "0")} / ${activeShot(currentScene(), hit.time).label.toUpperCase()}`;
  document
    .querySelectorAll(".scene-card")
    .forEach((e, i) => e.classList.toggle("active", i === sceneIndex));
}
function renderUI() {
  time = Math.min(time, duration(episode));
  sceneIndex = locate(episode, time).index;
  $("projectName").textContent = episode.title;
  $("sceneCount").textContent =
    `${episode.scenes.length} scenes · ${episode.genre}`;
  $("assetCount").textContent = `${episode.assets.length} reusable assets`;
  $("boardCount").textContent = `${episode.scenes.length} scenes`;
  $("durationLabel").textContent = `${fmt(duration(episode))} runtime`;
  $("scrubber").max = duration(episode);
  $("undo").disabled = !history.length;
  $("storyboard").innerHTML = episode.scenes
    .map(
      (s, i) =>
        `<button class="scene-card ${i === sceneIndex ? "active" : ""}" data-scene="${i}" aria-label="Scene ${i + 1}: ${esc(s.name)}"><canvas width="320" height="180"></canvas><div class="scene-info"><div class="scene-meta"><span>SCENE ${String(i + 1).padStart(2, "0")}</span><span>${fmt(s.duration)}</span></div><span class="scene-name">${esc(s.name)}</span></div></button>`,
    )
    .join("");
  let offset = 0;
  document.querySelectorAll(".scene-card").forEach((button, i) => {
    renderFrame(
      button.querySelector("canvas"),
      episode,
      offset + Math.min(4, episode.scenes[i].duration * 0.4),
      { captions: false },
    );
    offset += episode.scenes[i].duration;
    button.onclick = () => selectScene(i);
  });
  const total = duration(episode);
  $("pictureTrack").innerHTML = episode.scenes
    .map(
      (s, i) =>
        `<button data-scene="${i}" style="flex:${s.duration}" title="${esc(s.name)}">${String(i + 1).padStart(2, "0")} ${esc(s.name)}</button>`,
    )
    .join("");
  $("pictureTrack")
    .querySelectorAll("button")
    .forEach((b) => (b.onclick = () => selectScene(+b.dataset.scene)));
  offset = 0;
  let lines = "";
  for (const s of episode.scenes) {
    for (const d of s.dialogue)
      lines += `<span style="left:${((offset + d.at) / total) * 100}%;width:${(Math.min(d.duration, s.duration - d.at) / total) * 100}%" title="${esc(d.text)}"></span>`;
    offset += s.duration;
  }
  $("dialogueTrack").innerHTML = lines;
  $("motionTrack").innerHTML = episode.scenes
    .map(
      (s) =>
        `<div style="flex:${s.duration}">◇ ${esc(s.instances.some((p) => p.tracks.length) ? s.instances.reduce((n, p) => n + p.tracks.length, 0) + " pose tracks" : [...new Set(s.instances.map((p) => p.motion))].join(" · "))}</div>`,
    )
    .join("");
  renderCameraTrack();
  renderLibrary();
  renderSelection();
  draw();
}
function renderLibrary() {
  const items = episode.assets.filter(
    (a) =>
      filter === "all" ||
      (filter === "cast" && ["character", "creature"].includes(a.kind)) ||
      filter === a.kind,
  );
  $("assetLibrary").innerHTML = items
    .map(
      (a) =>
        `<button class="asset-card ${a.kind === "environment" ? "environment" : ""} ${selectedAsset === a.id ? "selected" : ""}" data-asset="${a.id}" aria-label="Select ${esc(a.name)}"><canvas width="320" height="${a.kind === "environment" ? 180 : 320}"></canvas><strong>${esc(a.name)}</strong><small>${a.kind}</small></button>`,
    )
    .join("");
  $("assetLibrary")
    .querySelectorAll("button")
    .forEach((b) => {
      renderAsset(
        b.querySelector("canvas"),
        episode.assets.find((a) => a.id === b.dataset.asset),
      );
      b.onclick = () => {
        selectedAsset = b.dataset.asset;
        renderLibrary();
        renderSelection();
        draw();
      };
    });
}
function renderCameraTrack() {
  const total = duration(episode);
  let start = 0,
    html = "";
  for (const s of episode.scenes) {
    const shots = s.shots.length ? s.shots : [{ at: 0, label: "Wide" }];
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i],
        length = (shots[i + 1]?.at ?? s.duration) - shot.at;
      html += `<button style="left:${((start + shot.at) / total) * 100}%;width:${(length / total) * 100}%" data-time="${start + shot.at}" title="${esc(shot.label)}">◇ ${esc(shot.label)}</button>`;
    }
    start += s.duration;
  }
  $("cameraTrack").innerHTML = html;
  $("cameraTrack")
    .querySelectorAll("button")
    .forEach((b) => (b.onclick = () => seek(+b.dataset.time)));
}
function renderSelection() {
  const a = episode.assets.find((a) => a.id === selectedAsset);
  document.querySelector(".inspector").classList.toggle("has-selection", !!a);
  if (!a) {
    $("selection").innerHTML = "";
    return;
  }
  const p = currentScene().instances.find((p) => p.assetId === a.id);
  $("selection").innerHTML =
    `<h3>${esc(a.name)}</h3><p>${esc(a.description)}</p>${p ? `<div class="row"><label>X position<input id="assetX" type="number" value="${p.x}" min="-1920" max="3840"></label><label>Y position<input id="assetY" type="number" value="${p.y}" min="-1080" max="2160"></label></div><div class="row"><label>Scale<input id="assetScale" type="number" value="${p.scale}" step="0.05" min=".01" max="10"></label><label>Movement<select id="assetMotion">${MOTIONS.map((m) => `<option ${m === p.motion ? "selected" : ""}>${m}</option>`).join("")}</select></label></div><label>Character view<select id="assetView">${["front", "threeQuarter", "profile", "back"].map((v) => `<option value="${v}" ${p.view === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><button id="flipAsset" class="button">Flip character</button><button id="keyframes" class="button">Edit motion keyframes</button>` : `<button id="addToScene" class="button primary">${a.kind === "environment" ? "Use as scene environment" : "Add to this scene"}</button>`}<label>Neural voice<select id="assetVoice">${["af_bella", "af_heart", "af_nicole", "am_fenrir", "am_michael", "am_puck", "bm_george", "bf_emma"].map((v) => `<option value="${v}" ${a.voice?.id === v ? "selected" : ""}>${v.replace(/_/g, " ")}</option>`).join("")}</select></label><label>Delivery speed<input id="voiceSpeed" type="number" step=".05" min=".6" max="1.5" value="${a.voice?.speed || 1}"></label><button id="editAssetJson" class="button">Edit shapes & rig</button>`;
  if (p) {
    const poseButton = document.createElement("button");
    poseButton.className = "button";
    poseButton.textContent = "Pose & face controls";
    poseButton.onclick = () => poseModal(a, p);
    $("selection").append(poseButton);
    for (const [id, key] of [
      ["assetX", "x"],
      ["assetY", "y"],
      ["assetScale", "scale"],
      ["assetMotion", "motion"],
      ["assetView", "view"],
    ])
      $(id).onchange = () =>
        applyEdit(() => {
          p[key] = ["motion", "view"].includes(key)
            ? $(id).value
            : Number($(id).value);
        });
    $("flipAsset").onclick = () => applyEdit(() => (p.flip = !p.flip));
    $("keyframes").onclick = () =>
      jsonEditor(
        "Motion keyframes",
        p.keyframes,
        (value) => {
          p.keyframes = value;
        },
        'Animate position, scale, rotation and opacity. Times are in seconds within this scene. Example: [{"t":0,"x":200},{"t":8,"x":800}].',
      );
  } else
    $("addToScene").onclick = () =>
      applyEdit(() => {
        if (a.kind === "environment") currentScene().environment = a.id;
        else
          currentScene().instances.push({
            id: `instance_${Date.now()}`,
            assetId: a.id,
            x: 640,
            y: 650,
            scale: 1,
            motion: "idle",
            flip: false,
            keyframes: [],
          });
      });
  $("assetVoice").onchange = () =>
    applyEdit(() => {
      a.voice = {
        ...a.voice,
        id: $("assetVoice").value,
        speed: +$("voiceSpeed").value,
      };
      audioBuffers.clear();
    });
  $("voiceSpeed").onchange = $("assetVoice").onchange;
  if (["character", "creature"].includes(a.kind)) {
    const advanced = document.createElement("details");
    advanced.innerHTML = `<summary>Custom voice provider</summary><label>Provider voice ID<input id="providerVoice" maxlength="120" value="${esc(a.voice?.providerVoice || "")}" placeholder="Use the studio default"></label><label>Performance direction<textarea id="voiceInstructions" maxlength="800" placeholder="Dry, impatient; pause before the punchline">${esc(a.voice?.instructions || "")}</textarea></label><p>Used by HTTP speech. Direction requires a provider that accepts instructions. Local voices use the voice and speed above.</p>`;
    $("selection").append(advanced);
    const updateVoice = () =>
      applyEdit(() => {
        a.voice = {
          ...a.voice,
          id: a.voice?.id || "af_bella",
          speed: a.voice?.speed || 1,
          providerVoice: $("providerVoice").value,
          instructions: $("voiceInstructions").value,
        };
        audioBuffers.clear();
      });
    $("providerVoice").onchange = updateVoice;
    $("voiceInstructions").onchange = updateVoice;
  } else {
    $("assetVoice").closest("label").hidden = true;
    $("voiceSpeed").closest("label").hidden = true;
  }
  const saveStandard = document.createElement("button");
  saveStandard.className = "button";
  saveStandard.textContent = "Save as reusable standard";
  saveStandard.onclick = () => {
    customStandards = customStandards.filter((x) => x.id !== a.id);
    customStandards.push(validateAsset(a));
    try {
      localStorage.setItem(
        "quantimation-standards",
        JSON.stringify(customStandards),
      );
      toast("Saved to your reusable standards.");
    } catch {
      toast("Standard storage is full. Save the asset JSON instead.", true);
    }
  };
  $("selection").append(saveStandard);
  $("editAssetJson").onclick = () =>
    jsonEditor(
      "Shape & rig editor",
      a,
      (value) => {
        episode.assets[episode.assets.findIndex((x) => x.id === a.id)] =
          validateAsset(value);
      },
      "Vector shapes are editable data. Use the eye, mouth, arm and leg roles to connect artwork to the animation rig.",
    );
}
function modal(title, html) {
  pause();
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = html;
  if (!$("modal").open) $("modal").showModal();
}
function closeModal() {
  $("modal").close();
}
function qualityModal() {
  const review = auditProduction(episode, audioBuffers);
  const samples = review.samples
    .filter(
      (_, i) => i % Math.max(1, Math.ceil(review.samples.length / 12)) === 0,
    )
    .slice(0, 12);
  modal(
    "Production review · draft",
    `<p class="tip-box">${esc(review.note)}</p><div class="quality-summary"><strong>${review.status === "blocked" ? "Fix blocking issues before rendering" : "Creative review required"}</strong><span>${review.issues.length} technical or staging findings</span></div><p>Inspect the silhouette and set perspective, then play the cut to judge weight, held poses, voice acting and joke timing. A contact sheet cannot approve motion or delivery.</p><div class="quality-frames">${samples.map((s, i) => `<button class="quality-frame" data-review-time="${s.time}"><canvas id="reviewFrame${i}" width="480" height="270"></canvas><span>${fmt(s.time)} · ${esc(s.label)}</span></button>`).join("")}</div><div class="quality-issues">${review.issues.length ? review.issues.map((i) => `<button class="quality-issue ${i.severity}" data-review-time="${i.time}"><b>${i.severity.toUpperCase()} · ${fmt(i.time)}</b><span>${esc(i.message)}</span></button>`).join("") : "<p>No automated findings. Creative quality is still unreviewed.</p>"}</div>${lastExport?.render ? `<p>Last render: ${lastExport.render.frames} preview frames; largest frame gap ${lastExport.render.maxFrameGapMs} ms. ${esc(lastExport.render.warnings.join(" "))}</p>` : ""}<div class="modal-actions"><button id="reviewPlay" class="button">Play from start</button><button id="reviewExport" class="button primary" ${review.status === "blocked" ? "disabled" : ""}>Render review cut</button></div>`,
  );
  samples.forEach((s, i) =>
    renderFrame($("reviewFrame" + i), episode, s.time, { captions: true }),
  );
  document.querySelectorAll("[data-review-time]").forEach(
    (b) =>
      (b.onclick = () => {
        closeModal();
        seek(+b.dataset.reviewTime);
      }),
  );
  $("reviewPlay").onclick = () => {
    closeModal();
    seek(0);
    togglePlay();
  };
  $("reviewExport").onclick = () => {
    closeModal();
    exportVideo(false);
  };
  const captionOption = document.createElement("label");
  captionOption.className = "caption-export-option";
  captionOption.innerHTML = `<input type="checkbox" ${captioned ? "checked" : ""}> Include captions in the exported video`;
  captionOption.querySelector("input").onchange = (event) => {
    captioned = event.target.checked;
    $("captions").classList.toggle("active", captioned);
    $("captions").setAttribute("aria-pressed", captioned);
    draw();
  };
  $("modalBody").querySelector(".modal-actions").before(captionOption);
}
function progress(title, detail, value = 0) {
  $("progressTitle").textContent = title;
  $("progressDetail").textContent = detail;
  $("progressBar").value = value;
  if (!$("progressDialog").open) $("progressDialog").showModal();
}
function endProgress() {
  busy = false;
  $("progressDialog").close();
}
function setupAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
    mix = audioContext.createGain();
    mix.connect(audioContext.destination);
    audioDestination = audioContext.createMediaStreamDestination();
    mix.connect(audioDestination);
  }
  return audioContext;
}
async function prepareSpeech() {
  if (!requireDesktop())
    throw new Error("Speech rendering is available in the desktop app.");
  setupAudio();
  const all = episode.scenes.flatMap((s) => s.dialogue),
    pending = all.filter(
      (d) => audioBuffers.get(d.id)?.signature !== speechSignature(d),
    );
  if (!pending.length) return;
  busy = true;
  let cancelled = false;
  const cancel = () => (cancelled = true);
  $("cancelProgress").onclick = cancel;
  try {
    for (let i = 0; i < pending.length; i++) {
      if (cancelled) throw new Error("Speech rendering cancelled.");
      const d = pending[i];
      progress(
        "Giving your cast a voice",
        `Rendering line ${i + 1} of ${pending.length}`,
        (i / pending.length) * 100,
      );
      const base64 = await bridge.speech({
        text: d.text,
        speaker: d.speaker,
        voice: episode.assets.find((a) => a.id === d.speaker)?.voice,
      });
      if (cancelled) throw new Error("Speech rendering cancelled.");
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const buffer = await audioContext.decodeAudioData(bytes.buffer);
      audioBuffers.set(d.id, {
        text: d.text,
        signature: speechSignature(d),
        buffer,
      });
    }
    checkpoint();
    for (const s of episode.scenes) {
      let cursor = 0;
      for (const d of [...s.dialogue].sort((a, b) => a.at - b.at)) {
        d.at = Math.max(d.at, cursor);
        d.duration = audioBuffers.get(d.id).buffer.duration;
        cursor = d.at + d.duration + 0.35;
      }
      s.duration = Math.max(s.duration, cursor + 0.5);
    }
    episode = validateEpisode(episode);
    persist();
    $("audioState").textContent = `${all.length} spoken lines · ready`;
    renderUI();
  } finally {
    endProgress();
  }
}
function speechSignature(d) {
  return JSON.stringify([
    d.text,
    d.speaker,
    episode.assets.find((a) => a.id === d.speaker)?.voice,
  ]);
}
function stopSources() {
  for (const s of sources) {
    try {
      s.stop();
    } catch {}
  }
  sources = [];
}
function scheduleAudio(from) {
  stopSources();
  if (!audioContext) return;
  let offset = 0;
  for (const scene of episode.scenes) {
    for (const line of scene.dialogue) {
      const buffer = audioBuffers.get(line.id)?.buffer;
      if (!buffer) continue;
      const at = offset + line.at,
        elapsed = Math.max(0, from - at);
      if (elapsed >= buffer.duration) continue;
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(mix);
      source.start(audioContext.currentTime + Math.max(0, at - from), elapsed);
      sources.push(source);
    }
    for (const cue of scene.sounds || []) {
      const at = offset + cue.at,
        elapsed = Math.max(0, from - at);
      if (elapsed >= cue.duration) continue;
      const source = audioContext.createBufferSource();
      source.buffer = soundBuffer(audioContext, cue);
      source.connect(mix);
      source.start(audioContext.currentTime + Math.max(0, at - from), elapsed);
      sources.push(source);
    }
    offset += scene.duration;
  }
}
function startPlayback() {
  setupAudio();
  audioContext.resume();
  if (time >= duration(episode) - 0.01) time = 0;
  playOffset = time;
  playStart = audioContext.currentTime;
  playing = true;
  $("play").innerHTML = svg("pause");
  $("play").setAttribute("aria-label", "Pause episode");
  scheduleAudio(time);
}
function pause() {
  if (playing) {
    time = Math.min(
      duration(episode),
      playOffset + audioContext.currentTime - playStart,
    );
    playing = false;
  }
  stopSources();
  $("play").innerHTML = svg("play");
  $("play").setAttribute("aria-label", "Play episode");
}
async function togglePlay() {
  if (exporting || busy) return;
  if (playing) {
    pause();
    return;
  }
  try {
    await prepareSpeech();
    startPlayback();
  } catch (e) {
    toast(e.message, true);
  }
}
function tick() {
  if (playing) {
    time = Math.min(
      duration(episode),
      playOffset + audioContext.currentTime - playStart,
    );
    try {
      draw();
      if (exporting) {
        const now = performance.now();
        if (renderFrames.length && now - renderFrames.at(-1) > 2000)
          throw new Error(
            "Render stalled for over two seconds. Review the scene before retrying.",
          );
        renderFrames.push(now);
      }
    } catch (error) {
      renderFault = error.message;
      pause();
      if (recorder?.state === "recording") recorder.stop();
      toast(error.message, true);
    }
    if (time >= duration(episode)) {
      pause();
      if (exporting && recorder?.state === "recording") recorder.stop();
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
async function exportVideo(automatic = false) {
  if (busy || exporting || !requireDesktop()) return;
  pause();
  lastExport = { status: "rendering" };
  try {
    await prepareSpeech();
    const review = auditProduction(episode, audioBuffers);
    if (review.status === "blocked")
      throw new Error(
        review.issues
          .filter((i) => i.severity === "error")
          .map((i) => i.message)
          .join(" "),
      );
    await audioContext.resume();
    busy = true;
    exporting = true;
    exportCancelled = false;
    renderFrames = [];
    renderFault = null;
    time = 0;
    draw();
    const stream = $("stage").captureStream(30);
    for (const track of audioDestination.stream.getAudioTracks())
      stream.addTrack(track);
    const mime = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ].find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime) throw new Error("This runtime cannot encode WebM.");
    const chunks = [];
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 6000000,
      audioBitsPerSecond: 128000,
    });
    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = resolve;
      recorder.onerror = (e) =>
        reject(new Error(e.error?.message || "Video encoding failed."));
    });
    $("cancelProgress").onclick = () => {
      exportCancelled = true;
      pause();
      if (recorder.state === "recording") recorder.stop();
    };
    progress(
      "Rendering a review cut",
      "Watching frame timing while rendering. The encoded cut still needs visual and audio review.",
      0,
    );
    const update = setInterval(
      () => ($("progressBar").value = (time / duration(episode)) * 100),
      300,
    );
    try {
      mix.gain.value = 1;
      recorder.start(1000);
      startPlayback();
      await done;
    } finally {
      clearInterval(update);
      pause();
      stream.getVideoTracks().forEach((t) => t.stop());
      mix.gain.value = muted ? 0 : 1;
    }
    if (renderFault) throw new Error(renderFault);
    if (!exportCancelled) {
      const data = new Uint8Array(
        await new Blob(chunks, { type: "video/webm" }).arrayBuffer(),
      );
      endProgress();
      const file = await bridge.saveVideo(
        data,
        episode.title,
        automatic === true,
        subtitlesSrt(episode),
      );
      if (file) {
        lastExport = {
          file,
          subtitles: episode.scenes.some((s) => s.dialogue.length)
            ? file.replace(/\.[^/.]+$/, "") + ".srt"
            : null,
          status: "complete",
          reviewRequired: true,
          quality: review,
          render: summarizeRender(renderFrames, duration(episode)),
          at: new Date().toISOString(),
        };
        toast(
          "Review cut exported. Inspect its motion and listen to the dialogue before delivery.",
        );
      } else lastExport = { status: "cancelled" };
    } else lastExport = { status: "cancelled" };
  } catch (e) {
    lastExport = { status: "failed", error: e.message };
    toast(e.message, true);
  } finally {
    exporting = false;
    recorder = null;
    endProgress();
    renderUI();
  }
}
async function generateEpisode() {
  if (busy || !requireDesktop()) return;
  const prompt = $("prompt").value.trim();
  if (prompt.length < 5) {
    toast("Give your director a little more to work with.", true);
    return;
  }
  pause();
  busy = true;
  progress("Meeting your director", "Preparing the episode brief…", 2);
  $("cancelProgress").onclick = () => bridge.cancel();
  try {
    const result = await bridge.generate({
      prompt,
      duration: +$("length").value,
      style: $("style").value,
      standards: customStandards,
    });
    checkpoint();
    episode = validateEpisode(result);
    time = 0;
    selectedAsset = null;
    audioBuffers.clear();
    persist();
    renderUI();
    endProgress();
    await prepareSpeech();
    qualityModal();
  } catch (e) {
    toast(e.message, true);
  } finally {
    endProgress();
  }
}
async function settingsModal() {
  if (!requireDesktop()) return;
  const cfg = await bridge.settings();
  modal(
    "Studio settings",
    `<p>Connect a standard language model to write and direct. All artwork is rendered locally by Quantimation.</p><div class="dialog-section"><h3>Language model</h3><label>Provider<select id="provider"><option value="ollama" ${cfg.provider === "ollama" ? "selected" : ""}>Ollama · local models</option><option value="compatible" ${cfg.provider === "compatible" ? "selected" : ""}>OpenAI-compatible API · local or cloud</option></select></label><label>Base URL<input id="baseUrl" value="${esc(cfg.baseUrl)}" placeholder="http://localhost:11434"></label><div class="modal-row"><label>Model name<input id="model" value="${esc(cfg.model)}" list="modelList" placeholder="Your installed model name"><datalist id="modelList"></datalist></label><label>API key (optional)<input id="apiKey" type="password" autocomplete="off" placeholder="${cfg.hasApiKey ? "Key saved · leave blank to keep" : "Not needed for local Ollama"}"></label></div><button id="testConnection" class="button small">Save & test connection</button><p id="connectionResult" class="inline-status"></p></div><div class="dialog-section"><h3>Speech engine</h3><p>Local neural voices use Kokoro on your CPU. The first new line downloads about 90 MB of model data from Hugging Face; speech then works offline. The dragon showcase already includes neural speech.</p><label>Voice provider<select id="ttsProvider"><option value="neural" ${cfg.ttsProvider === "neural" ? "selected" : ""}>Local neural voices · Kokoro</option><option value="builtin" ${cfg.ttsProvider === "builtin" ? "selected" : ""}>Built-in offline voice · robotic</option><option value="system" ${cfg.ttsProvider === "system" ? "selected" : ""}>Operating system voice</option><option value="http" ${cfg.ttsProvider === "http" ? "selected" : ""}>HTTP speech API · Kokoro or compatible</option></select></label><div id="systemFields"><label>System voice / built-in language (optional)<input id="systemVoice" value="${esc(cfg.systemVoice)}" placeholder="Default English voice"></label></div><div id="httpFields"><label>Speech base URL<input id="ttsUrl" value="${esc(cfg.ttsUrl)}"></label><div class="modal-row"><label>Speech model<input id="ttsModel" value="${esc(cfg.ttsModel)}"></label><label>Voice ID<input id="ttsVoice" value="${esc(cfg.ttsVoice)}"></label></div><label>Speech API key (optional)<input id="ttsKey" type="password" autocomplete="off" placeholder="${cfg.hasTtsKey ? "Key saved · leave blank to keep" : "Optional"}"></label></div></div><p>API keys stay in the desktop process. Storage: ${esc(cfg.keyPersistence)}. Project files never contain keys. Prompts and asset designs go only to the model endpoint you configure; dialogue goes to your speech endpoint when HTTP speech is selected.</p><div class="modal-actions"><button id="saveSettings" class="button primary">Save settings</button></div>`,
  );
  const fields = [
    "provider",
    "baseUrl",
    "model",
    "ttsProvider",
    "ttsUrl",
    "ttsModel",
    "ttsVoice",
    "systemVoice",
  ];
  const value = () => {
    const v = Object.fromEntries(fields.map((k) => [k, $(k).value]));
    for (const k of ["apiKey", "ttsKey"]) if ($(k).value) v[k] = $(k).value;
    return v;
  };
  const showSpeech = () => {
    $("httpFields").hidden = $("ttsProvider").value !== "http";
    $("systemFields").hidden = ["http", "neural"].includes(
      $("ttsProvider").value,
    );
  };
  showSpeech();
  $("ttsProvider").onchange = showSpeech;
  $("provider").onchange = () => {
    $("baseUrl").value =
      $("provider").value === "ollama"
        ? "http://localhost:11434"
        : "http://localhost:1234/v1";
  };
  $("saveSettings").onclick = async () => {
    try {
      const v = await bridge.saveSettings(value());
      audioBuffers.clear();
      updateConnection(v);
      closeModal();
      toast("Studio settings saved.");
    } catch (e) {
      toast(e.message, true);
    }
  };
  $("testConnection").onclick = async () => {
    const b = $("testConnection");
    b.disabled = true;
    $("connectionResult").textContent = "Connecting…";
    try {
      const cfg = await bridge.saveSettings(value());
      updateConnection(cfg);
      const result = await bridge.testConnection();
      $("modelList").innerHTML = result.models
        .map((m) => `<option value="${esc(m)}">`)
        .join("");
      if (!$("model").value && result.models.length)
        $("model").value = result.models[0];
      $("connectionResult").textContent =
        `Connected. ${result.models.length} model(s) available. Choose one and save settings.`;
    } catch (e) {
      $("connectionResult").textContent = e.message;
    } finally {
      b.disabled = false;
    }
  };
}
function updateConnection(cfg) {
  $("modelStatus").textContent = cfg.model
    ? `${cfg.provider === "ollama" ? "Local" : "API"} · ${cfg.model}`
    : "Connect your LLM";
}
function jsonEditor(title, value, accept, help) {
  modal(
    title,
    `<p>${esc(help)}</p><textarea id="json" class="code-editor" spellcheck="false">${esc(JSON.stringify(value, null, 2))}</textarea><p id="jsonError" class="error-message"></p><div class="modal-actions"><button id="applyJSON" class="button primary">Apply changes</button></div>`,
  );
  $("applyJSON").onclick = () => {
    try {
      const value = JSON.parse($("json").value);
      const before = JSON.stringify(episode);
      try {
        accept(value);
        const validated = validateEpisode(episode);
        episode = JSON.parse(before);
        checkpoint();
        episode = validated;
        persist();
        renderUI();
        closeModal();
      } catch (error) {
        episode = JSON.parse(before);
        throw error;
      }
    } catch (e) {
      $("jsonError").textContent = e.message;
    }
  };
}
function sceneModal() {
  const s = currentScene();
  modal(
    `Scene ${sceneIndex + 1}: ${s.name}`,
    `<label>Scene title<input id="sceneName" value="${esc(s.name)}"></label><label>Direction<textarea id="sceneDescription">${esc(s.description)}</textarea></label><div class="modal-row"><label>Duration (seconds)<input id="sceneDuration" type="number" min="1" max="180" value="${s.duration}"></label><label>Environment<select id="sceneEnvironment">${episode.assets
      .filter((a) => a.kind === "environment")
      .map(
        (a) =>
          `<option value="${a.id}" ${s.environment === a.id ? "selected" : ""}>${esc(a.name)}</option>`,
      )
      .join(
        "",
      )}</select></label></div><div class="modal-row"><label>Camera zoom<input id="cameraZoom" type="number" min=".5" max="3" step=".05" value="${s.camera.zoom}"></label><label>Camera X<input id="cameraX" type="number" value="${s.camera.x}"></label><label>Camera Y<input id="cameraY" type="number" value="${s.camera.y}"></label></div><div class="modal-row"><label>Pan X over scene<input id="panX" type="number" value="${s.camera.panX}"></label><label>Pan Y over scene<input id="panY" type="number" value="${s.camera.panY}"></label></div><div class="modal-actions"><button id="sceneJSON" class="button">Advanced scene JSON</button><button id="saveScene" class="button primary">Save scene</button></div>`,
  );
  $("sceneJSON").onclick = () =>
    jsonEditor(
      "Scene data",
      s,
      (v) => (episode.scenes[sceneIndex] = v),
      "Edit instances, keyframes, dialogue, timing and camera settings.",
    );
  $("saveScene").onclick = () => {
    const before = JSON.stringify(episode);
    try {
      s.name = $("sceneName").value;
      s.description = $("sceneDescription").value;
      s.duration = +$("sceneDuration").value;
      s.environment = $("sceneEnvironment").value;
      for (const [id, key] of [
        ["cameraZoom", "zoom"],
        ["cameraX", "x"],
        ["cameraY", "y"],
        ["panX", "panX"],
        ["panY", "panY"],
      ])
        s.camera[key] = +$(id).value;
      const valid = validateEpisode(episode);
      episode = JSON.parse(before);
      checkpoint();
      episode = valid;
      persist();
      renderUI();
      closeModal();
    } catch (e) {
      episode = JSON.parse(before);
      toast(e.message, true);
    }
  };
}
function scriptModal() {
  modal(
    "The screenplay",
    `<p>${esc(episode.logline)}</p>${episode.scenes
      .map(
        (s, i) =>
          `<section class="script-scene"><h3>${String(i + 1).padStart(2, "0")} · ${esc(s.name)}</h3>${
            s.dialogue
              .map(
                (d) =>
                  `<div class="speech-line"><div class="modal-row"><label>Speaker<select data-speaker="${d.id}"><option value="narrator" ${d.speaker === "narrator" ? "selected" : ""}>Narrator</option>${episode.assets
                    .filter((a) => a.kind !== "environment")
                    .map(
                      (a) =>
                        `<option value="${a.id}" ${a.id === d.speaker ? "selected" : ""}>${esc(a.name)}</option>`,
                    )
                    .join(
                      "",
                    )}</select></label><label>Start time (s)<input type="number" min="0" step=".1" data-at="${d.id}" value="${d.at.toFixed(2)}"></label></div><textarea data-dialogue="${d.id}" maxlength="1600">${esc(d.text)}</textarea></div>`,
              )
              .join("") ||
            "<p>Silent scene. Add dialogue in Advanced scene JSON.</p>"
          }</section>`,
      )
      .join(
        "",
      )}<div class="modal-actions"><button id="saveScript" class="button primary">Save screenplay</button></div>`,
  );
  $("saveScript").onclick = () => {
    const before = JSON.stringify(episode);
    try {
      for (const d of episode.scenes.flatMap((s) => s.dialogue)) {
        d.text = document.querySelector(`[data-dialogue="${d.id}"]`).value;
        d.speaker = document.querySelector(`[data-speaker="${d.id}"]`).value;
        d.at = +document.querySelector(`[data-at="${d.id}"]`).value;
      }
      const valid = validateEpisode(episode);
      episode = JSON.parse(before);
      checkpoint();
      episode = valid;
      audioBuffers.clear();
      persist();
      renderUI();
      closeModal();
      toast("Screenplay saved. Voices will update on the next playback.");
    } catch (e) {
      episode = JSON.parse(before);
      toast(e.message, true);
    }
  };
}
function customAssetModal() {
  modal(
    "Imagine something new",
    `<p>Create a character, creature, environment, prop, or effect. Your LLM designs the shapes; the studio makes them move.</p><div class="modal-row"><label>Name<input id="newAssetName" placeholder="The clockwork whale" maxlength="100"></label><label>Type<select id="newAssetKind">${KINDS.map((k) => `<option value="${k}">${k[0].toUpperCase() + k.slice(1)}</option>`).join("")}</select></label></div><label>Describe the asset<textarea id="newAssetDescription" maxlength="4000" placeholder="A gentle mechanical whale with brass plates, tiny wings and a glowing glass belly…"></textarea></label><div class="modal-actions"><button id="assetFromJSON" class="button">Import asset JSON</button><button id="generateAsset" class="button primary">Generate asset</button></div>`,
  );
  $("assetFromJSON").onclick = () =>
    jsonEditor(
      "Import an asset",
      {
        id: `asset_${Date.now()}`,
        name: "New asset",
        kind: "prop",
        description: "An editable object",
        width: 200,
        height: 200,
        shapes: [
          {
            type: "ellipse",
            x: 100,
            y: 100,
            rx: 70,
            ry: 70,
            fill: "#e6edb2",
            stroke: "#223039",
            strokeWidth: 4,
          },
        ],
      },
      (v) => {
        const asset = validateAsset(v);
        episode.assets.push(asset);
        selectedAsset = asset.id;
      },
      "Paste a vector asset to add it to your library. No model connection is needed.",
    );
  $("generateAsset").onclick = async () => {
    if (!requireDesktop()) return;
    const brief = {
      name: $("newAssetName").value,
      kind: $("newAssetKind").value,
      description: $("newAssetDescription").value,
      style: episode.style,
    };
    if (!brief.description.trim()) {
      toast("Describe what you want to create.", true);
      return;
    }
    closeModal();
    busy = true;
    progress(
      `Designing ${brief.name || "your asset"}`,
      "Drawing editable shapes and animation roles…",
      30,
    );
    $("cancelProgress").onclick = () => bridge.cancel();
    try {
      const a = await bridge.createAsset(brief);
      checkpoint();
      episode.assets.push(validateAsset(a));
      selectedAsset = a.id;
      persist();
      filter = "all";
      renderUI();
      toast("New asset ready. Add it to any scene from the inspector.");
    } catch (e) {
      toast(e.message, true);
    } finally {
      endProgress();
    }
  };
}
function newAssetModal() {
  modal(
    "Create an asset",
    `<div class="standard-layout"><div><label>Start from a standard<select id="standardChoice">${standardCatalog()
      .map((s) => `<option value="${s.id}">${esc(s.name)}</option>`)
      .join(
        "",
      )}</select></label><p id="standardDescription"></p><label>Asset name<input id="standardName" maxlength="100" placeholder="Use the standard’s name"></label><div class="standard-colors">${["ink", "skin", "foliage", "wood", "accent", "light"].map((k) => `<label>${k}<input type="color" data-kit-color="${k}" value="${STYLE_KIT[k]}"></label>`).join("")}</div><details><summary>Variation</summary><label>Seed<input id="standardSeed" type="number" value="1" min="0" max="100000"></label><label>Forest density<input id="standardDensity" type="number" value="6" min="2" max="10"></label></details></div><canvas id="standardPreview" width="420" height="420"></canvas></div><p class="tip-box">Standards are editable shape trees and rigs. Customize one, then save it as a reusable standard in the asset inspector.</p><div class="modal-actions"><button id="customAsset" class="button">Generate with an LLM</button><button id="insertStandard" class="button primary">Add to assets</button></div>`,
  );
  const options = () => ({
    id: "asset_" + Date.now(),
    name: $("standardName").value || undefined,
    parameters: {
      ...Object.fromEntries(
        [...document.querySelectorAll("[data-kit-color]")].map((i) => [
          i.dataset.kitColor,
          i.value,
        ]),
      ),
      seed: +$("standardSeed").value,
      density: +$("standardDensity").value,
    },
  });
  const preview = () => {
    try {
      const a = standardAsset($("standardChoice").value, options());
      $("standardDescription").textContent = a.description;
      renderAsset($("standardPreview"), a);
    } catch (e) {
      toast(e.message, true);
    }
  };
  const chooseStandard = () => {
    const standard = standardCatalog().find(
      (s) => s.id === $("standardChoice").value,
    );
    const family =
      standard.id.startsWith("family_") || standard.id === "human_rig";
    document.querySelectorAll("[data-kit-color]").forEach((input) => {
      const k = input.dataset.kitColor;
      input.value = standard.defaultParameters?.[k] || STYLE_KIT[k];
      input.closest("label").hidden =
        standard.id.startsWith("custom_") ||
        (family && !["ink", "skin", "accent"].includes(k));
    });
    $("standardSeed").closest("label").hidden = standard.id !== "space";
    $("standardDensity").closest("label").hidden = standard.id !== "forest";
    $("standardSeed").closest("details").hidden = !["space", "forest"].includes(
      standard.id,
    );
    preview();
  };
  $("standardChoice").onchange = chooseStandard;
  document
    .querySelectorAll("[data-kit-color],#standardSeed,#standardDensity")
    .forEach((el) => (el.oninput = preview));
  $("customAsset").onclick = customAssetModal;
  $("insertStandard").onclick = () => {
    try {
      const a = standardAsset($("standardChoice").value, options());
      applyEdit(() => {
        episode.assets.push(a);
        selectedAsset = a.id;
      });
      closeModal();
      $("assetsNav").click();
    } catch (e) {
      toast(e.message, true);
    }
  };
  chooseStandard();
}
function poseModal(asset, instance) {
  const nodes = [];
  const collect = (items) =>
    items.forEach((n) => {
      if (n.id) nodes.push(n);
      collect(n.children || []);
    });
  collect(asset.shapes);
  if (!nodes.length)
    return toast("Add named rig groups in Edit shapes & rig first.", true);
  const at = Math.max(
    0,
    Math.min(currentScene().duration, locate(episode, time).time),
  );
  modal(
    "Pose & face",
    `<p>Place a pose key on a named joint or switch a mouth or hand drawing.</p><label>Rig part<select id="poseTarget">${nodes.map((n) => `<option value="${n.id}">${esc(n.id.replace(/_/g, " "))}</option>`).join("")}</select></label><div class="row"><label>Scene time<input id="poseTime" type="number" min="0" max="${currentScene().duration}" step=".05" value="${at.toFixed(2)}"></label><label>Rotation °<input id="poseRotation" type="number" min="-180" max="180" value="0"></label></div><div class="row"><label>Local X<input id="poseX" type="number" value="0"></label><label>Local Y<input id="poseY" type="number" value="0"></label></div><label id="poseVariantLabel">Drawing<select id="poseVariant"></select></label><label>Transition to next key<select id="poseEasing"><option value="smooth">Smooth</option><option value="hold">Hold</option><option value="linear">Linear</option></select></label><div class="modal-actions"><button id="applyPose" class="button primary">Set pose key</button></div>`,
  );
  const read = () => {
    const n = nodes.find((n) => n.id === $("poseTarget").value),
      current = poseAt(
        instance.tracks.find((t) => t.target === n.id),
        +$("poseTime").value,
      );
    $("poseRotation").value = +current.rotation.toFixed(2);
    $("poseX").value = +current.x.toFixed(2);
    $("poseY").value = +current.y.toFixed(2);
    $("poseVariantLabel").hidden = !n.variants;
    $("poseVariant").innerHTML = n.variants
      ? `<option value="auto">Automatic / default</option>` +
        n.variants
          .map(
            (v) =>
              `<option value="${v.name}" ${current.variant === v.name ? "selected" : ""}>${v.name}</option>`,
          )
          .join("")
      : "";
  };
  $("poseTarget").onchange = read;
  $("poseTime").onchange = read;
  $("applyPose").onclick = () => {
    const target = $("poseTarget").value,
      node = nodes.find((n) => n.id === target),
      t = +$("poseTime").value;
    const key = {
      t,
      rotation: +$("poseRotation").value,
      x: +$("poseX").value,
      y: +$("poseY").value,
      easing: $("poseEasing").value,
      ...(node.variants ? { variant: $("poseVariant").value } : {}),
    };
    try {
      applyEdit(() => {
        let track = instance.tracks.find((t) => t.target === target);
        if (!track) {
          track = { target, keyframes: [] };
          instance.tracks.push(track);
        }
        const existing = track.keyframes.find((k) => k.t === t);
        if (existing) Object.assign(existing, key);
        else track.keyframes.push(key);
      });
      closeModal();
      draw();
      toast("Pose key added.");
    } catch (e) {
      toast(e.message, true);
    }
  };
  read();
}
$("closeModal").onclick = closeModal;
$("settings").onclick = settingsModal;
$("connection").onclick = settingsModal;
$("generate").onclick = generateEpisode;
$("play").onclick = togglePlay;
$("restart").onclick = () => seek(0);
$("scrubber").oninput = () => seek(+$("scrubber").value);
$("export").onclick = qualityModal;
const readOnion = () => {
  onion = {
    enabled: $("onionEnabled").checked,
    before: Number($("onionBefore").value),
    after: Number($("onionAfter").value),
    opacity: Number($("onionOpacity").value),
    prev: $("onionPrev").value,
    next: $("onionNext").value,
    trails: $("onionTrails").checked,
  };
  draw();
};
for (const id of [
  "onionEnabled",
  "onionBefore",
  "onionAfter",
  "onionOpacity",
  "onionPrev",
  "onionNext",
  "onionTrails",
])
  $(id).addEventListener("input", readOnion);
$("reviewProduction").onclick = qualityModal;
$("renderSpeech").onclick = async () => {
  if (busy) return;
  pause();
  try {
    await prepareSpeech();
    toast("All dialogue is rendered and synchronized.");
  } catch (e) {
    toast(e.message, true);
  }
};
$("mute").onclick = () => {
  muted = !muted;
  setupAudio();
  mix.gain.value = muted ? 0 : 1;
  $("mute").innerHTML = svg(muted ? "mute" : "volume");
  $("mute").setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio");
};
$("captions").onclick = () => {
  captioned = !captioned;
  $("captions").classList.toggle("active", captioned);
  $("captions").setAttribute("aria-pressed", captioned);
  draw();
};
$("undo").onclick = () => {
  if (!history.length) return;
  pause();
  episode = validateEpisode(JSON.parse(history.pop()));
  audioBuffers.clear();
  persist();
  renderUI();
};
$("saveProject").onclick = async () => {
  if (!requireDesktop()) return;
  try {
    if (await bridge.saveProject(episode)) toast("Project saved.");
  } catch (e) {
    toast(e.message, true);
  }
};
$("openProject").onclick = async () => {
  if (!requireDesktop()) return;
  pause();
  try {
    const value = await bridge.openProject();
    if (value) {
      checkpoint();
      episode = value;
      time = 0;
      selectedAsset = null;
      audioBuffers.clear();
      persist();
      renderUI();
      toast("Project opened.");
    }
  } catch (e) {
    toast(e.message, true);
  }
};
$("rename").onclick = () => {
  modal(
    "Name your episode",
    `<label>Episode title<input id="newTitle" value="${esc(episode.title)}" maxlength="160"></label><label>Logline<textarea id="newLogline" maxlength="1600">${esc(episode.logline)}</textarea></label><div class="modal-actions"><button id="saveTitle" class="button primary">Save</button></div>`,
  );
  $("saveTitle").onclick = () => {
    if (!$("newTitle").value.trim()) {
      toast("Enter a title.", true);
      return;
    }
    applyEdit(() => {
      episode.title = $("newTitle").value;
      episode.logline = $("newLogline").value;
    });
    closeModal();
  };
};
$("scriptNav").onclick = scriptModal;
$("screenplayTab").onclick = scriptModal;
$("previewTab").onclick = () => draw();
$("studioNav").onclick = () =>
  document.querySelector(".editor").scrollTo({ top: 0, behavior: "smooth" });
$("assetsNav").onclick = () => {
  $("assetLibrary").scrollIntoView({ behavior: "smooth" });
  toast("Choose an asset to edit its appearance, motion or scene placement.");
};
$("editScene").onclick = sceneModal;
$("newAsset").onclick = newAssetModal;
$("createAsset").onclick = newAssetModal;
document.querySelectorAll("[data-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((x) => x.classList.toggle("active", x === b));
      renderLibrary();
    }),
);
$("prompt").oninput = () =>
  ($("promptCount").textContent = $("prompt").value.length);
$("prompt").oninput();
$("help").onclick = () =>
  modal(
    "Your idea, frame by frame",
    `<p>Quantimation is a programmable 2D animation studio for Windows, macOS and Linux. A standard LLM writes the screenplay, designs new vector artwork and supplies animation cues. No text-to-video service is used.</p><div class="dialog-section"><h3>1. Connect a director</h3><p>Use Studio settings to connect an installed Ollama model, LM Studio, or an OpenAI-compatible API. Use the provider’s exact model name. Test the connection, choose a model, and save.</p><h3>2. Give it a premise</h3><p>Any genre, setting, cast or creature. Generation writes the story, designs each asset, validates the scene graph, then renders speech.</p><h3>3. Direct the details</h3><p>Click a scene to edit its camera and duration. Click an asset to adjust position, movement and scale. Edit dialogue in Screenplay. Shape and keyframe editors expose the complete animation data.</p><h3>4. Export your episode</h3><p>Export produces a 720p WebM file with speech and optional captions. Rendering runs in real time. Local neural voices are the default. The showcase includes pre-rendered neural dialogue; new lines download the Kokoro model once, then synthesize on your CPU.</p></div><p class="tip-box">Space: play / pause · Ctrl/Cmd + S: save · Ctrl/Cmd + Z: undo. Projects autosave on this device. Save a .quantimation file to move between machines.</p><p>Version 0.2 · Original procedural artwork. This is a prototype animation engine; scene and acting quality depend on the model and the shape vocabulary. Named pose tracks and timed procedural sound cues are supported. Long-form production, music, recorded Foley and phoneme-level lip sync need further work.</p>`,
  );
document.addEventListener("keydown", (e) => {
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
    $("modal").open ||
    $("progressDialog").open
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    $("saveProject").click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    $("undo").click();
  }
});
$("progressDialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  $("cancelProgress").click();
});
if (bridge) {
  bridge.onProgress((p) => progress(p.phase, p.detail, p.progress));
  bridge
    .settings()
    .then(updateConnection)
    .catch((e) => toast(e.message, true));
}
function cameraPreset(name) {
  const s = currentScene(),
    p =
      s.instances.find((p) => p.assetId === selectedAsset) ||
      s.instances.find((p) =>
        episode.assets.some(
          (a) =>
            a.id === p.assetId && ["character", "creature"].includes(a.kind),
        ),
      );
  const local = locate(episode, time).time;
  let camera = {
    zoom: 1,
    zoomEnd: 1,
    x: 640,
    y: 360,
    panX: 0,
    panY: 0,
    rotation: 0,
    perspective: "eye",
  };
  if (name === "close")
    camera = {
      ...camera,
      zoom: 1.75,
      zoomEnd: 1.9,
      x: Math.min(1280, Math.max(0, p?.x || 640)),
      y: 360,
    };
  if (name === "dutch")
    camera = { ...camera, zoom: 1.15, zoomEnd: 1.2, rotation: -8 };
  if (name === "high")
    camera = { ...camera, zoom: 1.2, zoomEnd: 1.3, perspective: "high" };
  applyEdit(() => {
    const at = Math.round(local * 100) / 100;
    s.shots = s.shots.filter((shot) => Math.abs(shot.at - at) > 0.1);
    s.shots.push({
      at,
      label: {
        wide: "Wide shot",
        close: "Close-up",
        dutch: "Dutch angle",
        high: "Bird’s eye",
      }[name],
      camera,
    });
  });
  toast("Camera shot added at the playhead.");
}
async function mcpModal() {
  const cfg = bridge ? await bridge.settings() : {};
  modal(
    "Direct with MCP",
    `<div class="mcp-banner">${cfg.mcpReady ? "● Local studio bridge is ready" : "Open the desktop app to activate the local bridge"}<br>27 tools · onion skin · lip sync · offline master · production review</div><p>Connect your LLM client to Quantimation’s stdio MCP server. The client can create characters and props, write dialogue, direct poses, build camera sequences and export episodes. It can author scene data directly without a separate model API key.</p><label>Client configuration<textarea class="code-editor" style="height:160px;min-height:160px" readonly>${esc(JSON.stringify({ mcpServers: { quantimation: { command: "node", args: ["/absolute/path/to/Quantimation/mcp/server.mjs"] } } }, null, 2))}</textarea></label><p>Clone the public Quantimation repository, run npm ci, then replace the path above with your checkout’s MCP server file. Keep this desktop app open. Full setup and tool reference: docs/MCP.md in the repository.</p><p class="tip-box">Try: “Inspect the episode, add a reaction close-up before the punchline, give the dragon a shrug, and preview that scene.”</p><p>Connection credentials stay in your local profile. No remote service or public port is opened.</p>`,
  );
}
const mcpButton = document.createElement("button");
mcpButton.className = "button subtle mcp-icon";
mcpButton.textContent = "◇ MCP";
mcpButton.title = "Connect an LLM with MCP";
mcpButton.onclick = mcpModal;
document.querySelector(".top-actions").prepend(mcpButton);
$("cameraWide").onclick = () => cameraPreset("wide");
$("cameraClose").onclick = () => cameraPreset("close");
$("cameraDutch").onclick = () => cameraPreset("dutch");
$("cameraHigh").onclick = () => cameraPreset("high");
$("cameraTimeline").onclick = () => {
  const s = currentScene();
  jsonEditor(
    "Camera shot sequence",
    s.shots || [],
    (value) => (s.shots = value),
    "Each shot cuts at its “at” time in seconds. Camera fields: x, y, zoom, zoomEnd, panX, panY, rotation (degrees), perspective (eye, low, high). Different shots can zoom or pan independently.",
  );
};
if (bridge?.onMcpRequest)
  bridge.onMcpRequest(async ({ id, command: c }) => {
    try {
      const scene = () => {
        const s = episode.scenes.find((s) => s.id === c.sceneId);
        if (!s) throw new Error("Scene not found.");
        return s;
      };
      let result;
      const mutation = (fn) => {
        if (exporting || busy)
          throw new Error(
            "Wait for the active render or generation to finish.",
          );
        pause();
        const before = JSON.stringify(episode);
        let detail = null;
        try {
          detail = fn() || null;
          const valid = validateEpisode(episode);
          episode = JSON.parse(before);
          checkpoint();
          episode = valid;
          audioBuffers.clear();
          persist();
          renderUI();
        } catch (error) {
          episode = JSON.parse(before);
          throw error;
        }
        return {
          updated: true,
          title: episode.title,
          ...(detail && typeof detail === "object" ? detail : {}),
        };
      };
      if (c.action === "get_project")
        result = {
          title: episode.title,
          playing,
          rendering: busy,
          exporting,
          time,
          duration: duration(episode),
          lastExport,
          quality: auditProduction(episode, audioBuffers),
          project: c.full
            ? episode
            : {
                ...episode,
                assets: episode.assets.map(({ shapes, ...a }) => a),
              },
        };
      else if (c.action === "list_standards")
        result = {
          standards: standardCatalog(),
          parameters: STYLE_KIT,
          variation: { seed: "integer 0–100000", density: "integer 2–10" },
        };
      else if (c.action === "get_standard")
        result = standardAsset(c.standardId, {
          parameters: c.parameters || {},
        });
      else if (c.action === "instantiate_standard")
        result = mutation(() => {
          if (episode.assets.some((a) => a.id === c.assetId))
            throw new Error("Asset ID already exists.");
          const a = standardAsset(c.standardId, {
            id: c.assetId,
            name: c.name,
            parameters: c.parameters || {},
          });
          episode.assets.push(a);
          selectedAsset = a.id;
        });
      else if (c.action === "save_standard") {
        const a = episode.assets.find((a) => a.id === c.assetId);
        if (!a) throw new Error("Asset not found.");
        customStandards = customStandards.filter((x) => x.id !== a.id);
        customStandards.push(validateAsset({ ...a, name: c.name || a.name }));
        localStorage.setItem(
          "quantimation-standards",
          JSON.stringify(customStandards),
        );
        result = { saved: true, standardId: "custom_" + a.id };
      } else if (c.action === "review_production")
        result = auditProduction(episode, audioBuffers);
      else if (c.action === "capture_frame") {
        const at = Math.max(
          0,
          Math.min(duration(episode), Number(c.time) || 0),
        );
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        renderFrame(canvas, episode, at, { captions: c.captions !== false });
        result = {
          time: at,
          mimeType: "image/png",
          data: canvas.toDataURL("image/png").split(",")[1],
          note: "Rendered pose sample. Review playback and speech separately.",
        };
      } else if (c.action === "get_scene") result = scene();
      else if (c.action === "get_asset") {
        result = episode.assets.find((a) => a.id === c.assetId);
        if (!result) throw new Error("Asset not found.");
      } else if (c.action === "generation_failed") {
        endProgress();
        toast(c.message, true);
        result = { acknowledged: true };
      } else if (c.action === "replace_project") {
        endProgress();
        result = mutation(() => {
          episode = validateEpisode(c.project);
          time = 0;
          selectedAsset = null;
        });
        toast("Project updated by MCP.");
      } else if (c.action === "upsert_asset") {
        endProgress();
        result = mutation(() => {
          const a = validateAsset(c.asset),
            i = episode.assets.findIndex((x) => x.id === a.id);
          if (i < 0) episode.assets.push(a);
          else episode.assets[i] = a;
        });
      } else if (c.action === "update_scene")
        result = mutation(() => {
          const s = scene();
          episode.scenes[episode.scenes.indexOf(s)] = {
            ...c.scene,
            id: c.sceneId,
          };
        });
      else if (c.action === "update_actor")
        result = mutation(() => {
          const p = scene().instances.find((p) => p.id === c.instanceId);
          if (!p) throw new Error("Actor instance not found.");
          Object.assign(p, c.patch, { id: c.instanceId });
        });
      else if (c.action === "set_shots")
        result = mutation(() => (scene().shots = c.shots));
      else if (c.action === "playback") {
        if (c.operation === "pause") pause();
        else if (c.operation === "seek") seek(Number(c.time) || 0);
        else if (c.operation === "play" && !playing) {
          togglePlay();
        }
        result = { playing, time };
      } else if (c.action === "apply_pose")
        result = mutation(() => {
          applyPose(episode, c);
        });
      else if (c.action === "solve_ik")
        result = mutation(() => {
          applyIk(episode, c);
        });
      else if (c.action === "lipsync_line")
        result = mutation(() => {
          if (c.lipsyncFallback)
            throw new Error(`Rhubarb lip sync failed: ${c.lipsyncFallback}`);
          const applied = applyLipsync(episode, {
            sceneId: c.sceneId,
            lineId: c.lineId,
            cues: c.cues,
          });
          return { engine: applied.engine, cueCount: applied.shapes.length };
        });
      else if (c.action === "onion_skin") {
        const at = Math.max(0, Math.min(duration(episode), Number(c.time) || 0));
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const onionResult = renderOnionSkin(canvas, episode, at, {
          captions: false,
          before: c.before ?? 2,
          after: c.after ?? 2,
          opacity: c.opacity ?? 0.45,
          prevTint: c.prevTint || "#6eb6ff",
          nextTint: c.nextTint || "#ff9d4a",
          trails: c.trails !== false,
        });
        result = {
          time: at,
          frames: onionResult.frames,
          mimeType: "image/png",
          data: canvas.toDataURL("image/png").split(",")[1],
          note: "Onion-skin composite. Past frames are blue, future frames are orange, trails mark head, hands and pupils.",
        };
      } else if (c.action === "motion_report")
        result = reportMotion(episode, {
          sceneId: c.sceneId,
          instanceId: c.instanceId,
        });
      else if (c.action === "render_master") {
        if (!bridge.exportMaster)
          throw new Error(
            "Offline master export is available from the desktop app and scripts/render-broadcast-demo.mjs.",
          );
        result = await bridge.exportMaster({
          episode,
          height: c.height || 1080,
          fps: c.fps || 24,
          captions: c.captions === true,
          title: episode.title,
        });
      } else if (c.action === "export_episode") {
        if (busy || exporting) throw new Error("Studio is busy.");
        captioned = c.captions === true;
        $("captions").classList.toggle("active", captioned);
        $("captions").setAttribute("aria-pressed", captioned);
        lastExport = { status: "rendering" };
        exportVideo(true);
        result = { started: true };
      } else if (c.action === "undo") {
        $("undo").click();
        result = { updated: true };
      } else throw new Error("Unsupported studio command.");
      await bridge.mcpRespond(id, { result });
    } catch (error) {
      await bridge.mcpRespond(id, { error: error.message });
    }
  });
renderUI();
if (modified) $("demoTag").hidden = true;

function setupWorkspace() {
  const rail = document.querySelector(".rail"),
    editor = document.querySelector(".editor");
  const tools = document.createElement("aside");
  tools.className = "tool-panel";
  rail.after(tools);
  const scenes = document.createElement("section");
  scenes.className = "scene-panel";
  scenes.append(document.querySelector(".storyboard-heading"), $("storyboard"));
  const creator = document.querySelector(".director-panel"),
    assets = document.querySelector(".inspector");
  tools.append(scenes, assets, creator);
  const create = document.createElement("button");
  create.className = "rail-button";
  create.id = "createNav";
  create.title = "Create an episode";
  create.innerHTML = svg("sparkles") + "<span>Create</span>";
  $("assetsNav").after(create);
  for (const [id, label] of [
    ["studioNav", "Scenes"],
    ["assetsNav", "Assets"],
    ["scriptNav", "Script"],
    ["settings", "Settings"],
    ["help", "Help"],
  ])
    $(id).insertAdjacentHTML("beforeend", `<span>${label}</span>`);
  mcpButton.className = "rail-button";
  mcpButton.innerHTML = svg("sliders") + "<span>MCP</span>";
  rail.insertBefore(mcpButton, $("help"));
  const panels = { scenes, assets, create: creator };
  const show = (name) => {
    for (const [key, panel] of Object.entries(panels))
      panel.hidden = key !== name;
    for (const [id, key] of [
      ["studioNav", "scenes"],
      ["assetsNav", "assets"],
      ["createNav", "create"],
    ]) {
      const active = key === name;
      $(id).classList.toggle("active", active);
      $(id).setAttribute("aria-pressed", active);
    }
  };
  $("studioNav").onclick = () => show("scenes");
  $("assetsNav").onclick = () => show("assets");
  create.onclick = () => show("create");
  const back = document.createElement("button");
  back.className = "button subtle back-assets";
  back.textContent = "← Back to assets";
  back.onclick = () => {
    selectedAsset = null;
    renderSelection();
    renderLibrary();
    draw();
  };
  assets.insertBefore(back, $("selection"));
  const details = document.createElement("details");
  details.className = "production-details";
  details.innerHTML = "<summary>Project details</summary>";
  for (const node of [
    ...creator.querySelectorAll(".section-heading,.production-step"),
  ])
    details.append(node);
  creator.append(details);
  creator.querySelector(".director-note")?.remove();
  assets.querySelector(".inspector-bottom")?.remove();
  creator.querySelector(".panel-title")?.remove();
  creator.querySelector(".divider")?.remove();
  $("toggleCamera").onclick = () => {
    const open = editor.classList.toggle("camera-open");
    $("toggleCamera").setAttribute("aria-expanded", open);
  };
  $("captions").classList.toggle("active", captioned);
  $("captions").setAttribute("aria-pressed", captioned);
  $("captions").setAttribute(
    "aria-label",
    "Toggle captions in preview and export",
  );
  show("scenes");
}
setupWorkspace();
const examplesButton = document.createElement("button");
examplesButton.className = "button subtle";
examplesButton.textContent = "Examples";
$("saveProject").before(examplesButton);
examplesButton.onclick = () => {
  if (busy || exporting) return;
  modal(
    "Example productions",
    `<p>Load an editable production. Your current project remains available through Undo.</p><div class="modal-actions"><button id="exampleDragon" class="button">Dragon review cut</button><button id="exampleFamily" class="button primary">Dot, Teo and Gloam</button></div>`,
  );
  const open = (make) => {
    applyEdit(() => {
      episode = make();
      time = 0;
      sceneIndex = 0;
      selectedAsset = null;
      audioBuffers.clear();
    });
    closeModal();
    $("studioNav").click();
  };
  $("exampleDragon").onclick = () => open(demoEpisode);
  $("exampleFamily").onclick = () => open(castShowcase);
};
