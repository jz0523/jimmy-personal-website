# Critic brief: the figurines on jimmy's personal site

Read this whole file before looking at a single screenshot. It is the memory of every review
round so far; do not re-litigate a decision listed in section 3 unless the screenshots show it
failing on its own terms.

## 1. What you are looking at

A single-page recruiting portfolio (Vite, GSAP ScrollTrigger, Lenis). Light paper ground
(#f4f4f1), ink text (#16171c), one cobalt accent (#2f55d4), the owner's own photos as the
identity anchors. Sections in order: Hero, Selected work (sticky card stack), Experience, About,
Off the clock (pinned horizontal photo strip), Research/awards/leadership (bento), Toolbox,
Contact (with a WebGL point field behind the right half).

This branch adds five poses of a 3D figurine of the owner (curly hair, navy Penn hoodie, khaki
trousers, white sneakers), placed as objects where the layout already had room:

| Pose | Where | Why |
| --- | --- | --- |
| Waving hello, sitting | Hero, bottom left of the photo cascade, in front of the prints | The greeter |
| Working on a laptop, sitting | Right end of the "Selected work" header row | The header's right half was empty |
| Presenting at a whiteboard, standing | Winner tile of the awards bento, bottom right under the seal | Pitching belongs with prizes |
| Holding the cat, racket beside, sitting | Top-right cell of the About photo grid | Beside the two photos of the cat |
| Waving goodbye with a suitcase, standing | Right column of Contact, in the point field | The send-off |

The goal the owner set: the figures must blend into the existing site, must not make it messy, and
the placement and the transitions between sections deserve special care. Judge those three things
first. Novelty is not a goal; restraint is.

## 2. Reference material

- `docs/reference/poses_sheet.jpg`: the five source renders the models were generated from.
- `docs/reference/blender_front.png`: the five GLBs rendered in Blender, front view, on their plinths.
- `docs/reference/video_sheet.jpg`: frames from the Xiaohongshu video that inspired the request
  (a different, louder site: models over giant background words). We deliberately did not copy its
  look; only the idea of a 3D IP character living in a resume site.

## 3. Accepted design decisions (do not reopen without evidence)

1. Five figures, five sections. Experience, Off the clock and Toolbox get none: Experience's sticky
   column already barely fits a 1080p viewport with two photos; Off the clock is a pinned strip;
   Toolbox is a wall of tiles.
2. The plinths under the figures are clipped away. The figure stands on the paper with a real
   contact shadow, like an object on the desk, not a collectible on a disk.
3. No giant background words, no dark panels, no glass cards behind the models. The page stays a
   quiet paper page; the figures are objects on it.
4. The photos remain the identity anchors. The hero figure sits in front of the prints and must not
   cover the portrait's face or the tennis photo's subject.
5. Motion is scroll-turn (about 30 degrees across the viewport), pointer look, a two-degree idle
   sway, an enter pop, and a click spin. No floating, no bobbing, no particles, no glow.
6. Site rules that already hold on `main`: zero em or en dashes in visible text, one eyebrow on the
   whole page, no duplicate statistics across sections, pills for interactive elements, 16px radius
   for containers and photo frames, 6px for chips.
7. Figures are decorative: `aria-hidden`, no captions, no labels under them.

Append new decisions here at the end of every round, with the measurement or reason.

## 4. Known tool limitations (do not report these as defects)

- Screenshots come from headless Chromium via Playwright (`tools/shoot.py`). There is no pointer,
  so the pointer-look is at rest, and the idle sway is frozen at whatever phase the frame caught.
- The enter pop is time-based; a shot taken too early can show a figure mid-scale. The script waits
  1.8 to 2.4 s after each scroll. If a figure looks small in one shot and normal in the walk shots,
  it is timing, not layout.
- Scripted `window.scrollTo` bypasses Lenis smoothing; ScrollTrigger scrub lag can leave the sticky
  card stack or the horizontal gallery a few pixels from where a real reader would see them.
- The dev server is at http://localhost:5199. The `bb-browser` CLI (real Chrome, Bash only, the MCP
  daemon does not start on this machine) can open it for a live look: `bb-browser open URL`,
  `bb-browser screenshot path.png`, `bb-browser eval "js"`.

## 5. What to look at

- `shots/desktop-hero.png`, `shots/desktop-laptop.png`, `shots/desktop-present.png`,
  `shots/desktop-cat.png`, `shots/desktop-farewell.png`: each figure centered in a 1440x900 viewport.
- `shots/desktop-walk-NN.png`: the whole page in viewport-sized steps, for the transitions between
  sections and anything the figures may crowd.
- `shots/mobile-*.png`: the same at 390x844.
- Source, read-only: `index.html` (slots are `.figure[data-figure]`), `src/styles.css` (the
  "Figures" block at the end holds all placement), `src/figures.ts` (rendering and motion; the
  `SPECS` table has per-pose yaw, fit and camera elevation).

Where an observation can be tied to geometry or a number (a slot overlapping a text block, a
figure whose height differs from its neighbor's by more than a third, a shadow that does not touch
the feet), tie it. "It feels off" is not actionable; "the laptop figure's head is 30 px above the
h2's cap height, so the header reads as two columns of unequal weight" is.

## 6. Output format (exactly this)

```
VERDICT: SATISFIED / NOT SATISFIED
SCORE: n/10
TOP ISSUES: numbered; each with the screenshot name, the region, and a concrete fix (move, resize,
            delete, recolor, change yaw). Blocking items only. If nothing blocks, say so.
NICE-TO-HAVES: cheap polish, clearly separated from the blockers.
WHAT ALREADY WORKS: things the next round must not break.
```

Score 8 or above with no blocking issue is SATISFIED. Be harsh on clutter, overlap, inconsistent
scale between figures, figures that read as pasted on rather than placed, and anything that makes
the existing design worse than it was without the figures.
