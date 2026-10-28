# Visual review with local and cloud models

Recommended architecture: a separate reviewer inspects rendered evidence, writes localized findings, then a director proposes bounded edits. Do not let the generator certify its own work from scene data alone.

This integration is a design recommendation. Quantimation currently supplies technical review, frame capture and actual playback/export. It does **not** connect a vision model or automatically repair visual findings.

1. Keep an approved reference pack: character model sheets, mouth and expression sheets, extreme poses, environment perspective and palette. Judge consistency against these references and the intended deliberately awkward aesthetic. Smoothness or symmetry alone is not a quality target.
2. At asset creation, inspect full-body silhouettes and enlarged faces. At blocking, inspect every camera cut and extreme pose. At animation, inspect short ordered sequences around contacts, gestures, blinks, mouth changes and effects. After export, inspect decoded frames from the actual file.
3. Run deterministic checks cheaply on every frame: non-finite transforms, offstage actors, unexpected blank frames, stationary runs, render gaps and audio clipping. Use known node IDs and camera transforms to distinguish intentional holds, occlusion and stylized squiggles from mistakes.
4. Use a local visual model for repeated checks. Qwen3-VL through Ollama is a candidate to benchmark on this machine, starting with a size that fits available memory; 8B is a possible starting point, not a proven optimum. Compare ordered frames with explicit timestamps, plus full-resolution face/hand crops. Do not assume tiny contact sheets preserve enough facial detail.
5. Escalate uncertain or important shots to a cloud video-capable reviewer. Gemini's documented video workflow supports audio/video and timestamps. Its default one-frame-per-second sampling can miss animation errors; request denser samples around action. A proposed starting policy is sparse whole-shot review plus 8–12 fps event windows, with every encoded frame available for exact contact and flicker checks.
6. Require structured findings: shot ID, time span, affected node/region, observed evidence, expected behavior, severity, proposed fix and confidence. Model confidence is not a calibrated probability. Require evidence for an issue, never an unsupported global quality score.
7. Apply at most a small number of repair attempts, render the changed range again and compare with the same references. Escalate conflicting findings or non-improving edits for human review. A person still decides style appeal, comedy timing and whether the cut is ready.

Calibrate the reviewer using examples of approved intentional uneven lines and rejected defects: detached wrists, mouth/teeth disagreement, sliding feet, inconsistent silhouettes, perspective errors and speech cutoffs. Measure false alarms as well as missed defects before using the system to block exports. Audio delivery needs audio-capable review and human listening; images alone cannot judge it.

Keep the generator's provider and reviewer's provider configurable separately. Cache reviews by project/render/reference/model/rubric hashes and only re-review changed shots. Record latency and cost. Offer local-only operation; cloud review sends the selected media and references to that provider.

Sources: [Ollama Qwen3-VL](https://ollama.com/library/qwen3-vl), [Gemini video understanding](https://ai.google.dev/gemini-api/docs/video-understanding).
