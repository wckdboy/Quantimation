// Sidecar subtitles stay editable and can be disabled in a video player.
export function subtitlesSrt(episode) {
  const stamp = (seconds) => {
    const n = Math.round(seconds * 1000);
    return `${String(Math.floor(n / 3600000)).padStart(2, "0")}:${String(Math.floor(n / 60000) % 60).padStart(2, "0")}:${String(Math.floor(n / 1000) % 60).padStart(2, "0")},${String(n % 1000).padStart(3, "0")}`;
  };
  const cues = [];
  let offset = 0;
  for (const scene of episode.scenes) {
    for (const line of scene.dialogue)
      cues.push({
        start: offset + line.at,
        end: offset + Math.min(scene.duration, line.at + line.duration),
        text: line.text.replace(/[<>]/g, "").replace(/\s+/g, " ").trim(),
      });
    offset += scene.duration;
  }
  return cues
    .sort((a, b) => a.start - b.start)
    .map(
      (c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`,
    )
    .join("\n");
}
