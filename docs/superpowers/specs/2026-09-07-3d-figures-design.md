# 3D figurines on the personal site: design

Date: 2026-09-07. Branch: `feat/3d-character`.

## What this adds

Five Tripo-generated poses of a figurine of Jimmy (curly hair, navy Penn hoodie, khaki trousers,
white sneakers) join the existing single-page site as 3D objects placed where the layout already
has room. The GLBs are static meshes (no rig, no animation clips), so the motion is the kind the
reference video uses: camera and turntable motion driven by scroll and pointer, not limb animation.

## Where each pose lives, and why

| Pose | Slot | Reason |
| --- | --- | --- |
| Waving hello (sitting) | Hero, bottom left of the photo cascade, in front of the prints | The greeter; that corner of the cascade is empty today |
| Working on a laptop (sitting) | Right end of the "Selected work" header row | The header's right half is empty; the figure sits on the lede's baseline |
| Presenting at a whiteboard (standing) | Winner tile of the awards bento, bottom right under the seal | Pitching and presenting belong with prizes and leadership |
| Holding the cat, racket beside (sitting) | Empty top-right cell of the About photo grid | Next to the two photos of Bubu |
| Waving goodbye with a suitcase (standing) | Right column of Contact, standing in the point field | The last thing on the page is a send-off |

Experience, Off the clock and Toolbox get no figure. Experience already carries two photos in a
sticky column that barely fits a 1080p viewport; Off the clock is a pinned horizontal strip; Toolbox
is a wall of tiles. Adding objects there would crowd the page.

## Rendering

- One fixed, transparent canvas (`.figures-canvas`, z-index 50: above the page, below the grain
  overlay, the mobile menu and the nav) and one WebGL context.
- Each slot (`.figure[data-figure]`, an empty div in the normal layout with an aspect ratio) owns a
  scene, a perspective camera, a directional key light with a shadow map, a shadow-catcher plane
  (`ShadowMaterial`) and the model. Each frame, every on-screen slot is rendered into its own
  viewport and scissor rect read from `getBoundingClientRect()`. Off-screen slots are skipped.
  This is the three.js "multiple elements" pattern.
- Lighting: `RoomEnvironment` PMREM for ambient, one key light for shading and a soft contact
  shadow on the paper. Neutral tone mapping, sRGB output.
- The plinth under each pose is clipped away with a world-space clipping plane at y = 0 (the model
  is lowered by the plinth height first), so the figure stands directly on the page with its own
  shadow instead of on a grey disk. The height of each plinth top was measured per model in Blender.
- Assets: `public/models/{wave,laptop,present,cat,farewell}.glb`, optimized with gltf-transform
  (1K WebP textures, meshopt compression). Loaded lazily by an IntersectionObserver; on desktop the
  remaining models prefetch in page order after the first one lands. A failed load hides its slot.

## Motion and interaction

- Scroll: as a slot travels through the viewport its figure turns about 30 degrees on its base
  (ScrollTrigger progress, no tweens, fully reversible).
- Pointer (fine pointers only): the figure turns up to about 17 degrees toward the cursor and the
  camera dips or rises slightly, so it appears to look at you. The hero greeter tracks the cursor
  much more (about 40 degrees, a stronger tilt, a small lean toward the cursor, faster response) and
  pops and rocks once when the pointer reaches it, so it reads as waving at you wherever you are.
- Idle: a two-degree sway, so the object reads as alive without floating.
- Enter: the first time a figure is on screen with its model loaded it scales in from zero with a
  short turn (`back.out`), the hero one waiting 0.9 s for the headline and prints to land first.
- Click or tap: one full spin.
- `prefers-reduced-motion`: figures render but hold still; only the click spin remains.

## Fallbacks

- No WebGL, or renderer construction fails: `html.no-figures` hides every slot and the layouts
  collapse to what they are on `main` today.
- A single GLB failing to load hides just its slot.
- Touch devices: no pointer look; loads on approach only (no prefetch); tap still spins.

## Files

- `src/figures.ts`: everything above, exported as `mountFigures()`.
- `src/main.ts`: mounts it after the other sections' animations, exposes `__figures` and `__lenis`
  for the screenshot tool.
- `index.html`: five slot divs; the Work header, the winner tile, the About photo grid and the
  Contact block gain a grid cell for their figure.
- `src/styles.css`: the canvas, the slots, per-section placement, mobile collapse.
- `tools/shoot.py`: Playwright screenshots at desktop and mobile widths for the critic loop.
- `docs/critic-brief.md`: the brief every critic round reads first.

## Verification

- `npm run build` type-checks and bundles.
- `tools/shoot.py` produces screenshots of every slot at 1440x900 and 390x844 with zero page
  errors, and reports `loaded === total` from `window.__figures.state()`.
- A critic agent with no context reviews the screenshots against `docs/critic-brief.md` until it
  reports SATISFIED; the final round uses a fresh critic.
