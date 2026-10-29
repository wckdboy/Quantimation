# Reusable standards and the Lind house cast

Open **Assets → +** to choose a template, change its colors and add it to the project. Pick the asset to edit its shapes and rig. **Save as reusable standard** keeps a validated copy in this device's library. Saving a project includes all assets used in it; the personal standards library itself is local to the app profile.

Built-in standards include Dot Lind, Teo Lind and Gloam, a creature performance rig, a human rig based on Dot, buildings, plants, worlds, the Coil Shed, Silt Market, Dot's kitchen, and a reality seam (the old swirl portal is gone). The Quark family generator has been removed. Standards are editable vector trees, not flattened pictures. Space has a deterministic layout seed; forest has a density control. The palette uses hex colors. Existing productions remain unchanged when a new template is instantiated.

The app's director receives the standard catalog and can request an appropriate base. The design pass then edits that existing tree while preserving useful joints and drawings. Saved custom standards are also offered when generating from the app. A model can still invent new geometry when a template does not fit.

## Original cast

| Character | Role | Design | Local voice |
| --- | --- | --- | --- |
| Dot Lind | Claims adjuster | Rounded-rectangle head, blunt bob, slate blazer, cream shirt. No glasses. | af_nicole, 0.96 |
| Teo Lind | Dot's brother, appliance repair | Capsule head, curl crown, beard, olive overalls | am_puck, 1.05 |
| Gloam | Lodger and bookkeeper | Dome-to-pear body, brown vest, no brows | bm_george, 0.9 |

The Quark family generator has been removed. These three are the reference cast. Their drawings follow `quantimation-art/BIBLE.md`. They are not a claim of finished broadcast animation.

## Rig conventions

Common nodes: `head`, `jaw`, `mouth`, `nose`, `hair`, `eye_left/right`, `pupil_left/right`, `brow_left/right`, `left/right_upper_arm`, `left/right_forearm`, `left/right_hand`, `left/right_thigh`, `left/right_shin`. Front, three-quarter, profile and back are separate drawings.

**Pose & face controls** in the selected asset inspector adds a key to a named node at the selected scene time. Keys support rotation, local translation, hold/smooth/linear interpolation and drawing selection. Scale and opacity channels remain available in production JSON/MCP. This is forward kinematics: the forearm inherits shoulder movement, and the hand inherits both. There is no automatic inverse kinematics or collision solver.

Mouth drawings on the leads are the Rhubarb set `A` through `H` plus `X`. Hands have `relaxed`, `point`, `fist`, `spread` and `hold`. Named variants are validated against the target group.

Pose tracks for neutral, smug, shocked, angry and talking live in `src/rig.js`. Open **Examples** for the Lind lineup. The Page Four demo is rendered by `scripts/render-broadcast-demo.mjs`.

## MCP workflow

1. `list_standards` finds built-in and saved templates.
2. `get_standard` returns the full editable tree.
3. `instantiate_standard` inserts a new named copy with palette parameters.
4. Use `upsert_asset` and scene edits to customize geometry and pose tracks.
5. `save_standard` stores the result for future episodes.
6. Inspect with `capture_frame` and `review_production`; review actual playback before delivery.

## Voice customization

Each character stores a local voice ID and speed. Advanced **Custom voice provider** fields store a provider-specific voice ID and performance direction. These are sent only when HTTP speech is selected. Instructions require a provider that supports an `instructions` field; leave them empty otherwise. The local Kokoro engine does not implement natural-language emotion direction or actor voice cloning. Changing voice settings invalidates the character's speech cache.

## Subtitles

Captions start off. **CC** toggles them in preview; the review dialog controls burned-in captions for export. Burned-in text is small, outlined and has no large speaker box. A separate `.srt` file is saved beside every dialogue export so subtitles can remain editable and removable in compatible players. Leave burned-in captions off for a clean master. MCP `export_episode` accepts `captions: false` (default).
