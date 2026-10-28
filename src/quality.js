import { activeShot, interpolate } from "./model.js";
const flatten = (nodes) =>
  nodes.flatMap((n) => [n, ...flatten(n.children || [])]);

// Check the visible stage by undoing the exact camera transform used by the renderer.
export function cameraExposesStage(scene, t) {
  const shot = activeShot(scene, t),
    c = shot.camera,
    u = shot.progress;
  const zoom = c.zoom + (c.zoomEnd - c.zoom) * u * u * (3 - 2 * u),
    a = (-c.rotation * Math.PI) / 180;
  return [
    [0, 0],
    [1280, 0],
    [0, 720],
    [1280, 720],
  ].some(([x, y]) => {
    x -= 640;
    y -= 360;
    const rx = (x * Math.cos(a) - y * Math.sin(a)) / zoom;
    y = (x * Math.sin(a) + y * Math.cos(a)) / zoom;
    x = rx;
    if (c.perspective === "low") {
      y = (y + 15) / 1.08;
      x += 0.075 * y;
    }
    if (c.perspective === "high") {
      y = (y - 35) / 0.82;
      x -= 0.04 * y;
    }
    x += c.x + c.panX * u;
    y += c.y + c.panY * u;
    return x < -3 || x > 1283 || y < -3 || y > 723;
  });
}
export function reviewSamples(episode) {
  let offset = 0;
  const samples = [];
  for (const scene of episode.scenes) {
    const times = new Set([
      0.1,
      scene.duration / 2,
      Math.max(0.1, scene.duration - 0.15),
    ]);
    for (const shot of scene.shots)
      times.add(Math.min(scene.duration - 0.05, shot.at + 0.1));
    for (const line of scene.dialogue)
      times.add(Math.min(scene.duration - 0.05, line.at + line.duration / 2));
    for (const t of [...times].sort((a, b) => a - b))
      samples.push({ sceneId: scene.id, label: scene.name, time: offset + t });
    offset += scene.duration;
  }
  return samples;
}
export function auditProduction(episode, audio = new Map()) {
  const issues = [];
  const add = (severity, code, message, scene, time = 0) =>
    issues.push({ severity, code, message, sceneId: scene?.id, time });
  let offset = 0;
  for (const scene of episode.scenes) {
    const lines = [...scene.dialogue].sort((a, b) => a.at - b.at);
    let end = 0;
    for (const line of lines) {
      const at = offset + line.at;
      if (line.at < end - 0.02)
        add(
          "error",
          "overlapping-dialogue",
          "Dialogue overlaps. Render speech and retime the exchange.",
          scene,
          at,
        );
      if (line.at + line.duration > scene.duration + 0.02)
        add(
          "error",
          "cutoff-dialogue",
          "A line runs beyond the scene cut.",
          scene,
          at,
        );
      end = Math.max(end, line.at + line.duration);
      if (line.speaker !== "narrator") {
        const actors = scene.instances.filter(
          (p) => p.assetId === line.speaker,
        );
        const visible = actors.some(
          (p) => interpolate(p, line.at + line.duration / 2).opacity > 0.1,
        );
        if (!visible)
          add(
            "warning",
            "offscreen-speaker",
            "This speaker is not visible during the line. Confirm an intentional off-screen delivery.",
            scene,
            at,
          );
        const asset = episode.assets.find((a) => a.id === line.speaker);
        if (asset && !flatten(asset.shapes).some((n) => n.role === "mouth"))
          add(
            "warning",
            "unrigged-mouth",
            "Speaking artwork has no mouth rig. Lip animation will be absent.",
            scene,
            at,
          );
      }
      const clip = audio.get(line.id)?.buffer;
      if (clip) {
        const pcm = clip.getChannelData(0);
        let sum = 0,
          clipped = 0;
        for (let i = 0; i < pcm.length; i += 4) {
          sum += pcm[i] ** 2;
          if (Math.abs(pcm[i]) >= 0.99) clipped++;
        }
        const n = Math.ceil(pcm.length / 4);
        if (Math.sqrt(sum / n) < 0.001)
          add(
            "error",
            "silent-dialogue",
            "Rendered dialogue is effectively silent.",
            scene,
            at,
          );
        if (clipped / n > 0.01)
          add(
            "warning",
            "clipped-dialogue",
            "Speech has sustained clipping. Check its gain or regenerate it.",
            scene,
            at,
          );
      }
    }
    const longestGap = Math.max(
      lines[0]?.at || 0,
      ...lines.slice(1).map((l, i) => l.at - lines[i].at - lines[i].duration),
      lines.length ? scene.duration - end : 0,
    );
    if (lines.length && longestGap > 3)
      add(
        "warning",
        "dead-air",
        "More than three seconds without dialogue. Check that physical action earns the pause.",
        scene,
        offset,
      );
    const cast = scene.instances.filter((p) =>
      ["creature", "character"].includes(
        episode.assets.find((a) => a.id === p.assetId)?.kind,
      ),
    );
    if (cast.length && cast.every((p) => !p.tracks?.length))
      add(
        "warning",
        "generic-acting",
        "The cast has no keyed local poses. Generic whole-body motion may read as stiff cutouts.",
        scene,
        offset,
      );
    if (scene.environment) {
      const times = new Set([
        0,
        scene.duration - 0.001,
        ...scene.shots.flatMap((s) => [s.at, Math.max(0, s.at - 0.01)]),
      ]);
      const exposed = [...times].find((t) => cameraExposesStage(scene, t));
      if (exposed !== undefined)
        add(
          "warning",
          "camera-coverage",
          "This camera can expose the edge of the set. Inspect the rendered frame or author overscan.",
          scene,
          offset + exposed,
        );
    }
    offset += scene.duration;
  }
  return {
    status: issues.some((i) => i.severity === "error") ? "blocked" : "draft",
    artisticQuality: "unreviewed",
    issues,
    samples: reviewSamples(episode),
    reviewRequired: [
      "Silhouette, intentional linework and coherent set perspective",
      "Anticipation, contact, weight and held poses in playback",
      "Voice acting, pauses, punchline and action timing",
      "Actual encoded video, not only the storyboard",
    ],
    note: "These checks detect technical and staging risks. They do not certify drawing, animation or performance quality.",
  };
}
export function summarizeRender(timestamps, duration) {
  const gaps = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  const maxGap = gaps.reduce((max, gap) => Math.max(max, gap), 0);
  const fps = timestamps.length / Math.max(0.001, duration);
  return {
    frames: timestamps.length,
    averagePreviewFps: Math.round(fps * 10) / 10,
    maxFrameGapMs: Math.round(maxGap),
    warnings: [
      ...(fps < 25
        ? [
            "Preview drawing fell below 25 fps; inspect the encoded motion for dropped frames.",
          ]
        : []),
      ...(maxGap > 150
        ? [
            "A rendering stall exceeded 150 ms; inspect that cut before delivery.",
          ]
        : []),
    ],
  };
}
