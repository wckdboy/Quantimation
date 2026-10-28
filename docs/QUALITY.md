# Production quality review

A working renderer does not prove a good episode. Quantimation distinguishes validated data, render health and creative review. There is no automatic "broadcast quality" score.

## Before animation

Review the premise, joke or dramatic beat, silhouette, expression, costume, palette and environment perspective. For deliberately crude cartoons, the awkwardness should be authored: coherent proportions, readable poses and intentional uneven contours. More shapes or random wobble do not establish quality.

The LLM builds named movable nodes first. A separate performance pass then directs those real joints with holds, anticipation, contact and recovery. It also checks shot motivation and action timing. This pass receives production data; it does not pretend to have seen the images.

## Before export

Open **Review**, or use `review_production` and `capture_frame` over MCP. Inspect each shot and the extreme poses. Play the entire scene with sound: still frames cannot reveal sliding feet, disconnected limbs, repetitive gestures, pauses that drag or flat delivery.

Automatic checks report overlapping or cut-off dialogue, effectively silent/clipping audio after synthesis, missing visible speakers or mouth rigs, generic acting, long dialogue gaps and potential camera coverage gaps. Warnings identify places to review; offscreen speech or a long pause may be intentional. Blocking errors must be fixed before export.

## During rendering

The app records preview-frame intervals, stops on drawing exceptions or stalls longer than two seconds, and reports low drawing rate or frame gaps over 150 ms. These are preview render-health measurements, not a decoded video frame count. An encoder success remains a review cut.

## After rendering

Inspect the actual exported video with audio. Check first/last frames, every cut, mouth shapes, pose continuity, impact contact, clipping, frame pacing and intelligibility. Ensure a punchline's action happens at the intended moment. Revise and render again if needed. The app cannot automatically judge humor, style fidelity, appealing drawing or a convincing performance. The local neural voice engine has limited acting control; more demanding delivery needs a suitable speech provider or further voice-production tools.

Exports report `reviewRequired: true` with technical findings and render statistics through `get_project.lastExport`. The UI and MCP never equate passing tests or encoding a file with creative approval.
