# Quantimation production format · version 1

Projects are JSON data, never executable scripts. The complete validator is `src/model.js`. For a working example, open `resources/The Last Stop.quantimation`.

An episode contains `version: 1`, `title`, `logline`, `genre`, `style`, `assets`, and `scenes`. IDs use letters, digits, underscores or hyphens. Unknown fields are discarded during validation. Colors must be hexadecimal, `transparent`, or `none`.

## Assets

Each asset has `id`, `name`, `description`, `kind`, `width`, `height`, and `shapes`. Kinds: `character`, `creature`, `prop`, `environment`, `effect`. Optional `voice: {"id":"am_fenrir","speed":1.05}` selects a neural voice and playback speed (0.6–1.5). Clothing and creature anatomy are composed from ordinary shapes/groups; there is no clothing simulation.

Shapes use local asset coordinates, starting at the top left. They draw in array order. Supported primitives:

| Type      | Geometry                                       |
| --------- | ---------------------------------------------- |
| `rect`    | `x`, `y`, `width`, `height`, optional `radius` |
| `ellipse` | Center `x`, `y`; radii `rx`, `ry`              |
| `polygon` | `points: [[x,y], ...]`                         |
| `path`    | SVG path commands in `path`                    |
| `line`    | `x`, `y`, `x2`, `y2`                           |
| `text`    | `x`, `y`, `text`, `fontSize`                   |
| `group`   | `x`, `y`, `children`                           |

Common appearance fields: `fill`, `stroke`, `strokeWidth`, `opacity`, `rotation`, `pivotX`, `pivotY`. Rotation is in degrees. A group translates its children after applying its rotation around its parent-space pivot. For predictable rigs, keep grouped limbs at x/y zero and use absolute local coordinates for their children and pivot.

Rig roles: `body`, `head`, `eye`, `pupil`, `mouth`, `leftBrow`, `rightBrow`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`, `decoration`. Eyes blink, brows and heads respond to acting beats, limbs swing or wave, and mouths deform according to speech amplitude. More complex anatomy is drawn through additional shapes and groups.

Limits: 500 total shapes per asset, nesting depth 8, 200 shapes per array, 10,000 path characters, asset dimensions up to 1920×1080. External images, HTML, JavaScript and remote asset URLs are not supported.

## Scenes

Each scene contains `id`, `name`, `description`, `duration` (1–180 seconds), `background`, optional `environment` asset ID, `camera`, `instances`, and `dialogue`.

The stage is **1280×720**. Environment artwork scales to fill it. Camera `x`, `y` identify its center; `zoom: 1`, `x: 640`, `y: 360` shows the full stage. `panX`, `panY` move the camera center by that amount over the scene. Zoom range: 0.5–3.

Camera also accepts `zoomEnd`, `rotation` (−30 to 30 degrees), and `perspective` (`eye`, `low`, `high`). Perspectives are stylized 2D projections. Zooming out or tilting can expose the stage boundary: author overscan or increase zoom to retain coverage.

Optional scene `shots` is an array of `{at, label, camera}`. `at` is scene-local seconds; it cuts to that camera. Its pan and zoom run until the next shot or scene end. The base scene camera applies before the first shot. Up to 60 shots per scene are accepted.

Instance example:

```json
{
  "id": "hero_entrance",
  "assetId": "hero",
  "x": 250,
  "y": 650,
  "scale": 1,
  "flip": false,
  "rotation": 0,
  "motion": "walk",
  "view": "front",
  "beats": [{ "at": 3, "duration": 2, "action": "shrug", "intensity": 1 }],
  "keyframes": [
    { "t": 0, "x": 250 },
    { "t": 6, "x": 700, "rotation": 0 },
    { "t": 10, "scale": 1.15 }
  ]
}
```

Instance position is the asset's **bottom center**. Supported motions: `still`, `idle`, `walk`, `wave`, `bounce`, `float`, `spin`. Each keyframe may set `x`, `y`, `rotation`, `scale`, and/or `opacity`. Missing properties interpolate independently. Smoothstep easing is deterministic. `walk` swings limbs; actual travel is directed by positional keyframes.

Views: `front`, `threeQuarter`, `profile`, `back`. These project an existing drawing, so use separate authored assets for materially different silhouettes. The dragon sample includes front and side-profile variants. Acting beats use `at`, `duration`, `action`, and `intensity`; actions are `point`, `shrug`, `recoil`, `laugh`, `nod`, `angry`, `surprised`, `smug`. Beats transform rig parts; they do not introduce new geometry.

Dialogue example:

```json
{
  "id": "line_1",
  "speaker": "hero",
  "text": "We made it.",
  "at": 1,
  "duration": 2
}
```

`speaker` is an asset ID or `narrator`. Line IDs are unique throughout the episode. `at` is scene-local seconds. Rendering speech replaces estimated duration with the actual audio length, pushes later overlapping lines forward, and expands scenes as needed. Keyframe times remain unchanged. The validator rejects invalid references or out-of-range values instead of executing or silently trusting model output.

## Named pose tracks

Give any movable shape or group a unique `id` within its asset and an explicit pivot. Instances can animate those nodes independently:

```json
{
  "tracks": [
    {
      "target": "forearm",
      "keyframes": [
        { "t": 0, "rotation": 0, "easing": "hold" },
        { "t": 1, "rotation": -12, "easing": "smooth" },
        { "t": 1.2, "rotation": 50 },
        { "t": 1.6, "rotation": 35, "easing": "hold" }
      ]
    }
  ]
}
```

`x`, `y` and `rotation` are additive local offsets. `scaleX`, `scaleY` and `opacity` multiply the existing shape transform. Easing belongs to the outgoing key and is `smooth`, `linear` or `hold`. Channels interpolate independently. Use a rest key at time zero, and design anticipation, contact, overshoot and recovery rather than endlessly moving every part. Tracks target existing IDs and reject duplicate targets/times. Maximum 80 tracks per instance and 120 keys per track. Group teeth and tongue inside the mouth group so mouth deformation retains their relationship.

## Sound cues

A scene can contain `sounds: [{"id":"tower_hit","type":"impact","at":6.2,"duration":0.9,"gain":0.3}]`. Supported procedural sounds: `impact`, `fire`, `whoosh`, `rumble`, `crackle`. Cues must fit inside the scene. They are generated locally and mixed on the same audio clock as dialogue. They are simple synthesized effects, not a recorded Foley library.

## Review

The `review_production` MCP tool detects technical/staging risks and returns exact sample times. `capture_frame` returns a rendered PNG for visual inspection. The desktop Review panel displays a contact sheet and links findings to the playhead. Export blocks unresolved technical errors after speech timing is measured, monitors frame stalls, and reports timing warnings. All exports still require creative review of their actual encoded picture and sound. See [QUALITY.md](QUALITY.md).

## Replacement drawings and base proportions

Groups may define variants as an array of named child-shape trees. Variant children share the asset's shape budget and unique-ID namespace. Pose keys may select a variant name or auto; unknown names are rejected. Mouth groups use auto for approximate text/amplitude speech selection; other groups use their default children. A complete mouth drawing includes lips, teeth, cavity and tongue as appropriate. Mouth variants are not stretched by the generic mouth transform.

Shapes also accept base scaleX and scaleY around their pivot, multiplied by keyed scales. Related rigs can share a joint vocabulary with different proportions. Character voice profiles accept optional providerVoice and instructions fields for compatible HTTP speech; local Kokoro uses id and speed. See STANDARDS.md.
