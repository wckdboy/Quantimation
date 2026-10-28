# Reusable standards and the Quantumania family

Open **Assets → +** to choose a template, change its colors and add it to the project. Pick the asset to edit its shapes and rig. **Save as reusable standard** keeps a validated copy in this device's library. Saving a project includes all assets used in it; the personal standards library itself is local to the app profile.

There are 18 built-in standards: five original Quark family members, a creature performance rig, a human rig, crooked building, tree, alien plant, moon, ringed planet, rock, crate, portal, street, forest and deep space. They are editable vector trees, not flattened pictures. Space has a deterministic layout seed; forest has a density control. The palette uses hex colors. Existing productions remain unchanged when a new template is instantiated.

The app's director receives the standard catalog and can request an appropriate base. The design pass then edits that existing tree while preserving useful joints and drawings. Saved custom standards are also offered when generating from the app. A model can still invent new geometry when a template does not fit.

## Original cast

| Character | Role | Design | Local voice |
| --- | --- | --- | --- |
| Dr. Oona Quark | Reckless quantum engineer and grandmother | Tall, narrow, uneven silver crest, brass hearing implant, split plum coat | bf_emma, 0.94 |
| Pip Quark | Reluctant grandson and field assistant | Shorter, freckled, unruly brown hair, rust vest | am_puck, 1.11 |
| Mara Quark | Mother and orbital salvage captain | Dark asymmetric bob, coral workwear, utility belt | af_nicole, 1.02 |
| Bram Quark | Father and interplanetary insurance salesman | Broad silhouette, jowls, olive cardigan, crooked tie | bm_george, 0.97 |
| Zig Quark | Older sister and illegal reality remixer | Lean silhouette, purple fringe, teal jacket, ring earring | af_heart, 1.08 |

These are original characters. Their pose sheets and performance test are development assets, not a claim of completed television animation.

## Rig conventions

Common nodes: `character_root`, `torso`, `head`, `jaw`, `mouth`, `nose`, `hair`, `cheeks`, `eye_left/right`, `pupil_left/right`, `lid_left/right`, `brow_left/right`, `left/right_upper_arm`, `left/right_forearm`, `left/right_hand`, `left/right_thigh`, `left/right_shin`, `left/right_foot`. Oona also has separate coat panels; Bram has a tie.

**Pose & face controls** in the selected asset inspector adds a key to a named node at the selected scene time. Keys support rotation, local translation, hold/smooth/linear interpolation and drawing selection. Scale and opacity channels remain available in production JSON/MCP. This is forward kinematics: the forearm inherits shoulder movement, and the hand inherits both. There is no automatic inverse kinematics or collision solver.

Mouth drawings: `closed`, `open`, `wide`, `round`, `teeth`, `smirk`, `snarl`, `frown`, `grin`. Each includes complete lip, cavity, tooth and tongue geometry as appropriate. `auto` selects approximate speech shapes using text position and audio amplitude; it is not phoneme-aligned lip sync. Hands have `relaxed`, `point`, `fist`, `spread`. Named variants are validated against the target group.

`src/family.js` includes reusable neutral, smug, shocked, angry and talking pose tracks. `resources/Quantumania - Family.quantimation` is an editable audition project. Open it from **Examples → Quantumania family**. Eleven cached voice clips cover the dragon and family demos for offline playback.

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
