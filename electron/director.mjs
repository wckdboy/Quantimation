import { validateEpisode, validateAsset, parseJSON } from "../src/model.js";
import { auditProduction } from "../src/quality.js";
import { STANDARDS, instantiateStandard } from "../src/standards.js";

export function endpoint(config, suffix) {
  const u = new URL(config.baseUrl);
  if (u.username || u.password)
    throw new Error("Keep credentials in the API key field.");
  if (
    u.protocol !== "https:" &&
    !(
      u.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
    )
  )
    throw new Error("Use HTTPS for remote models, or HTTP for a local model.");
  u.search = "";
  u.hash = "";
  u.pathname = u.pathname.replace(/\/$/, "") + suffix;
  return u.toString();
}
export async function completion(config, system, user, signal) {
  const ollama = config.provider === "ollama";
  const url = endpoint(config, ollama ? "/api/chat" : "/chat/completions");
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    stream: false,
    ...(ollama
      ? { format: "json", options: { temperature: 0.7, num_predict: 12000 } }
      : { response_format: { type: "json_object" } }),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(240000)]),
    redirect: "error",
  });
  if (!res.ok)
    throw new Error(
      `Model request failed (${res.status}). Check the endpoint, model name, and API key.`,
    );
  const raw = await res.text();
  if (raw.length > 5000000) throw new Error("Model response exceeds 5 MB.");
  const json = JSON.parse(raw);
  const text = ollama
    ? json.message?.content
    : json.choices?.[0]?.message?.content;
  if (!text) throw new Error("The model returned no content.");
  return parseJSON(text);
}
const PLAN = `You are an animation writer and director. Create a complete original short episode from the user's idea, in ANY requested genre: comedy, drama, fantasy, science, horror, documentary, children, abstract, etc. Invent the necessary environments, humans, creatures, props and effects; never force a preset cast or sci-fi story. The episode will be rendered with a programmable 2D vector studio. Output JSON only, using this exact shape:
{"version":1,"title":"title","logline":"synopsis","genre":"genre","style":"visual art direction","assets":[{"id":"unique_id","name":"name","kind":"character|creature|prop|environment|effect","description":"DETAILED appearance, colors, body topology, identity and visual design","width":260,"height":420}],"scenes":[{"id":"scene1","name":"scene name","description":"shot direction","duration":15,"environment":"asset_id","background":"#123456","camera":{"zoom":1,"x":640,"y":360,"panX":0,"panY":0},"instances":[{"id":"actor1","assetId":"asset_id","x":400,"y":620,"scale":1,"flip":false,"motion":"idle","keyframes":[{"t":0,"x":200},{"t":10,"x":500}]}],"dialogue":[{"id":"line1","speaker":"asset_id or narrator","text":"actual spoken line","at":0.5,"duration":4}]}]}.
The stage is 1280x720. Environments are 1280x720. All other assets use LOCAL coordinates starting at top left; an instance x,y is its BOTTOM CENTER on the stage. Scale sizes appropriately. Keep faces readable. Place characters around x=360/850,y=640. Motion values: idle, walk, wave, bounce, float, spin, still. Keyframes interpolate position, rotation, scale, opacity. Invent compositions, not just talking heads. Give each scene an environment and relevant visible actors. Characters must visibly move; include entrance, reaction, or physical action keyframes. Dialogue is spoken, so allow 2.3 words per second plus gaps. No overlapping dialogue. Every dialogue ID must be unique across all scenes. Use 3–8 scenes and 3–9 assets total. Each scene maximum 180 seconds. Match requested length approximately. Dialogue should have a beginning, escalation and ending. Narration may use speaker 'narrator'. Empty dialogue is allowed for silent episodes. All colors must be HEX. JSON only.`;
const DESIGN = `You are a 2D vector character and set designer. Build the requested asset as a JSON shape tree, consistent with the supplied art direction. Be inventive: any object, creature, person, environment or abstract form can be drawn. Return ONLY {"id":...,"name":...,"kind":...,"description":...,"width":...,"height":...,"shapes":[...]}. Preserve the requested id, kind, width and height.
Shapes are drawn in array order, back to front. Allowed shape types:
rect: {type:'rect',x,y,width,height,radius,fill,stroke,strokeWidth}; ellipse: {type:'ellipse',x,y,rx,ry,fill,stroke,strokeWidth} with CENTER x/y; polygon: {type:'polygon',points:[[x,y],...],fill,stroke,strokeWidth}; path: {type:'path',path:'M... C... Z',fill,stroke,strokeWidth}; line: {type:'line',x,y,x2,y2,stroke,strokeWidth}; text: {type:'text',x,y,text,fontSize,fill}; group: {type:'group',x,y,pivotX,pivotY,rotation,role,children:[...]}.
Optional role on any shape: body, head, eye, pupil, mouth, leftArm, rightArm, leftLeg, rightLeg, decoration. The engine uses these roles to animate limbs, blink eyes and sync mouths to speech. Use independent grouped limbs with shoulder/hip pivotX,pivotY for walk and wave. A mouth should be a dark ellipse, role mouth. Eyes should be separate groups role eye, containing white ellipse and dark pupil. Characters and creatures need an expressive face with visible eyes and mouth. Extra appendages are allowed. Use 15–70 thoughtful shapes. Head, silhouette, clothes and anatomy must fit requested identity. Environments need depth: distant scenery, middle structures, foreground floor; use 25–90 shapes. Use SVG paths for organic silhouettes. No external images, URLs, scripts, gradients or CSS. Colors must be hex strings or 'transparent'. Use outline stroke '#1b2530' and strokeWidth 3 unless the requested art style specifies otherwise. Coordinates within the asset width/height. JSON only, double quotes.`;
const PERFORMANCE = `\nPerformance and camera requirements: give scenes 2-4 shots using shots:[{at:0,label:'Wide',camera:{zoom:1.1,zoomEnd:1.2,x:640,y:360,panX:0,panY:0,rotation:0,perspective:'eye'}}]. Shots cut at at (seconds); each shot can pan and zoom. Perspective values eye, low, high. Tilt rotation -15 to15 degrees; keep zoom >=1.15 when tilted. Vary establishing, two-shot, reaction close-up and exit shots. Instances support view:'front'|'threeQuarter'|'profile'|'back' (stylized projections). Prefer independently designed profile/back asset variants when silhouette accuracy matters. Add beats:[{at:1,duration:2,action:'point',intensity:1}] for acting: point, shrug, recoil, laugh, nod, angry, surprised, smug. Use multiple expressive beats in every dialogue scene and actual position keyframes, not just idle bobbing. Assign each speaking asset a stable voice:{id:'am_fenrir',speed:1.05}; IDs: af_bella,af_heart,af_nicole,am_fenrir,am_michael,am_puck,bm_george,bf_emma; speed .75-1.25. Punctuation, pauses and sentence rhythm should drive lively delivery. Draw distinct clothing, expressive eyebrows, asymmetric mouths, odd proportions, and reusable props when requested. Effects can use opacity keyframes to appear exactly on action beats. For abrupt appearance, hold opacity0 until just before the intended time then switch to1. Never imply motion, effects or a camera change that has no corresponding data.`;
export async function directEpisode(
  config,
  request,
  signal,
  onProgress = () => {},
) {
  const savedStandards = (request.standards || [])
    .slice(0, 60)
    .map(validateAsset);
  const catalog = [
    ...STANDARDS,
    ...savedStandards.map((a) => ({
      id: "custom_" + a.id,
      name: a.name,
      kind: a.kind,
      description: a.description,
    })),
  ];
  const { standards: _templates, ...storyRequest } = request;
  onProgress({
    phase: "Writing the episode",
    detail: "Story, dialogue, shots and motion cues",
    progress: 5,
  });
  let plan = await completion(
    config,
    PLAN +
      PERFORMANCE +
      `\nReusable standards: ${JSON.stringify(catalog)}. Prefer an appropriate standard instead of starting from an empty shape tree. Add standardId and optional parameters (hex palette: ink,skin,foliage,wood,stone,accent,light,sky,shadow; seed 0-100000; density 2-10) to each asset brief. Use these as editable starting geometry, never force an unsuitable template. Omit standardId when a new design is needed.`,
    JSON.stringify(storyRequest),
    signal,
  );
  if (
    !Array.isArray(plan.assets) ||
    !plan.assets.length ||
    plan.assets.length > 12
  )
    throw new Error(
      "The director must provide between 1 and 12 asset briefs. Try a simpler prompt.",
    );
  const assets = [];
  for (let i = 0; i < plan.assets.length; i++) {
    const brief = plan.assets[i];
    onProgress({
      phase: `Designing ${brief.name}`,
      detail: `Asset ${i + 1} of ${plan.assets.length} · ${brief.kind}`,
      progress: 15 + (i / plan.assets.length) * 70,
    });
    assets.push(
      await designAsset(
        config,
        {
          ...brief,
          style: plan.style,
          template: savedStandards.find(
            (a) => "custom_" + a.id === brief.standardId,
          ),
        },
        signal,
      ),
    );
  }
  plan.assets = assets;
  onProgress({
    phase: "Directing the performance",
    detail:
      "Checking the designed rigs, pose timing, shot motivation and sound cues",
    progress: 85,
  });
  const rig = (nodes) =>
    nodes.flatMap(({ id, role, pivotX, pivotY, children, variants }) => [
      ...(id
        ? [{ id, role, pivotX, pivotY, variants: variants?.map((v) => v.name) }]
        : []),
      ...rig(children || []),
      ...(variants || []).flatMap((v) => rig(v.children)),
    ]);
  const compact = {
    ...plan,
    assets: assets.map(({ shapes, ...asset }) => ({
      ...asset,
      nodes: rig(shapes),
    })),
  };
  const performance = await completion(
    config,
    PLAN +
      PERFORMANCE +
      `\nYou are now the animation supervisor reviewing a draft AFTER the assets have been designed. Return ONLY {"scenes":[complete revised scenes]}. Preserve the story, dialogue and valid asset IDs. Available named nodes are supplied for each asset. Add instance.tracks:[{target:'existing_node_id',keyframes:[{t:0,rotation:0,easing:'hold'},{t:1,rotation:10,easing:'smooth'},{t:1.2,rotation:-15},{t:1.5,rotation:0}]}]. Pose keys support additive x/y/rotation and multiplicative scaleX/scaleY/opacity. Their transforms act around each node's pivot. Easing on the outgoing key is hold, linear or smooth. Make each pose readable: anticipation, action, contact and recovery. Hold poses; avoid perpetual idle wobble and sliding planted feet. Prefer meaningful cuts and holds over constant zooms. Stage each gag so cause and consequence can be read. Sounds: [{id:'impact1',type:'impact|fire|whoosh|rumble|crackle',at:5,duration:.8,gain:.3}], within the scene. Check speaker visibility, speech cutoffs and gaps. This is a DATA review, not a claim to have seen the rendered frames. The app will require a rendered review afterward.`,
    JSON.stringify(compact),
    signal,
  );
  if (!Array.isArray(performance.scenes))
    throw new Error("The animation supervisor returned no scene timeline.");
  plan.scenes = performance.scenes;
  onProgress({
    phase: "Checking the production",
    detail: "Validating asset references and animation cues",
    progress: 90,
  });
  try {
    const valid = validateEpisode(plan);
    const review = auditProduction(valid);
    onProgress({
      phase: "Draft ready for visual review",
      detail: `${review.issues.length} staging findings. Inspect rendered poses, playback and speech before delivery.`,
      progress: 98,
    });
    return valid;
  } catch (error) {
    // Repair only the compact timeline; keep the already validated artwork unchanged.
    const compact = {
      ...plan,
      assets: assets.map(({ shapes, ...rest }) => rest),
    };
    const repaired = await completion(
      config,
      PLAN + PERFORMANCE,
      `Repair this plan. Error: ${error.message}\n${JSON.stringify(compact)}\nPreserve the exact asset IDs and asset list.`,
      signal,
    );
    repaired.assets = assets;
    return validateEpisode(repaired);
  }
}
export async function designAsset(config, brief, signal) {
  const template = brief.template
    ? validateAsset({ ...brief.template, id: brief.id, name: brief.name })
    : brief.standardId
      ? instantiateStandard(brief.standardId, {
          id: brief.id,
          name: brief.name,
          parameters: brief.parameters || {},
        })
      : null;
  const input = template
    ? { ...brief, width: template.width, height: template.height, template }
    : brief;
  const guidance =
    DESIGN +
    `\nBuild an animation-ready rig. Give movable groups unique id fields such as head, jaw, upper_arm, forearm, hand, wing, tail and coat; use pivots at actual joints. IDs use letters, digits, underscores or hyphens. Group related mouth, teeth and tongue geometry with role mouth and an explicit mouth pivot. Eyebrows may use leftBrow/rightBrow roles. When the art direction asks for intentionally crude adult cartooning, make the awkwardness deliberate: asymmetric silhouettes, controlled organic contours, sharp expression, restrained wear and clear value separation. Avoid a cute stock mascot, geometric placeholder houses, random jitter or detail that obscures posing. Environments need coherent overlapping perspective and negative space around the acting area. The result will be reviewed in rendered frames, not just counted for shapes.`;
  const reusableGuidance =
    guidance +
    `\nIf a template is supplied, EDIT its existing shape tree, retaining useful node IDs, pivots, mouth variants and structure. Return a complete modified asset; do not replace it with a generic placeholder. Use template dimensions. For speaking rigs use a role:mouth group with id, children:[], and variants:[{name:'closed',children:[...]},{name:'open',children:[...]},{name:'wide',children:[...]},{name:'round',children:[...]},{name:'teeth',children:[...]},{name:'smirk',children:[...]},{name:'snarl',children:[...]}]. Each variant contains the entire lip/jaw/teeth/tongue drawing in the same coordinates. Use asymmetric authored contours and distinct expressions. Total shapes, including all variants, must remain under 500. Variant names can be selected in pose keys using variant:'smirk' or 'auto' for speech. All shape IDs must be unique across the whole asset including variants.`;
  let value = await completion(
    config,
    reusableGuidance,
    JSON.stringify(input),
    signal,
  );
  value = {
    ...value,
    id: brief.id,
    kind: brief.kind,
    ...(brief.voice ? { voice: brief.voice } : {}),
  };
  try {
    return validateAsset(value);
  } catch (error) {
    value = await completion(
      config,
      reusableGuidance,
      `Repair this asset. Error: ${error.message}\n${JSON.stringify(value)}`,
      signal,
    );
    return validateAsset({
      ...value,
      id: brief.id,
      kind: brief.kind,
      ...(brief.voice ? { voice: brief.voice } : {}),
    });
  }
}
