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
- `docs/reference/blender_front.jpg`: the five GLBs rendered in Blender, front view, on their plinths.
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
   sway, an enter pop, and a click spin. No floating, no bobbing, no particles, no glow. The hero
   greeter is the exception the owner asked for (and asked twice to make more obvious): it turns up
   to about 57 degrees toward a cursor on its left (the copy and the buttons) and 43 degrees toward
   one on its right (beyond that the waving hand covers the face), reaches full turn three quarters
   of the way to the viewport edge, leans a few pixels toward the cursor, and pops and rocks once when
   the pointer reaches it. Vertically the camera orbits instead of the model (the plinth cut is
   horizontal, so pitching the mesh would expose the plinth or float the base): the camera drops to
   about 2 degrees below level when the cursor is above the greeter so it appears to look up, and
   rises to about 37 degrees when the cursor is below. The other four keep the quiet 17-degree look
   with a 5-degree orbit.
6. Site rules that already hold on `main`: zero em or en dashes in visible text, one eyebrow on the
   whole page, no duplicate statistics across sections, pills for interactive elements, 16px radius
   for containers and photo frames, 6px for chips.
7. Figures are decorative: `aria-hidden`, no captions, no labels under them.

8. Figure scale is unified on head width: about 100 to 105 px at 1440 wide. Round 1 measured
   77 to 148 px across the five; the work slot went from 300 to 210 px wide, the contact slot from
   360 to 285 px, the winner tile slot from 250 to 270 px. Mobile: work 150 px, contact 200 px, and
   the winner tile gives the figure column 1.4 fr against the seal's 1 fr.
9. The winner tile uses one arrangement at every width: the label, then the claim across the full
   tile, then the seal bottom left and the presenter bottom right.
10. Shadows are VSM (radius 7) at 0.13 opacity plus a soft radial contact blob under each footprint,
    to match the ambient drop shadows on the photo frames. Round 1 read the hard PCF wedges as a
    second lighting language.
11. The whiteboard's base plate in present.glb was plinth-coloured; it is now the stand's grey
    (recoloured in Blender, re-exported, re-optimized). The clip height for `present` stays 0.048
    because raising it would cut the sneaker soles.

12. After round 2 the presenter's slot cap went from 270 to 300 px (its head was 85 px against
    100 to 104 for the others because it shares the slot with the whiteboard), and the mobile sizes
    were trimmed to hero 44%, work 140 px, contact 185 px so the mobile head spread falls from 1.5x
    to about 1.3x.

13. The render rect is the slot plus a margin (22% of the width each side, 12% above, 22% below)
    and the camera frustum is extended over it with `setViewOffset`, so the figure keeps its size and
    place inside the slot while its shadow fades out on the paper. `fit` dropped by 0.04 everywhere.
    Round 3 measured single-row darkness cliffs of 39 to 72 at every slot's bottom edge; the gate is
    now `tools/profile.py` (largest single-row or single-column step at the slot and margin edges
    must be 20 or less).
14. Framing uses the bounding box itself. (Round 3 briefly used 1.08x to keep the whiteboard's plate
    clear of the slot's side; round 4 showed the 22% side margin of decision 13 already covers the
    overhang, and the factor had shrunk the width-limited poses by 11%, undoing decision 12.)
15. The key light sits at about 68 degrees so the cast shadow tucks under the figure; the contact blob
    (1.1x the footprint) carries the grounding. This aligns the figures' shadows with the photo
    frames' centered ambient shadows.

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

## 7. Round history

- Round 1 (fresh critic): 7/10, NOT SATISFIED. Blockers: the plinth-coloured plate under the
  whiteboard; figure scale spread of 1.9x. Both addressed in decisions 8 and 11.
- Round 2 (same critic, verification): 8/10, SATISFIED, no blockers. Head widths at 1440 measured
  104 / 103 / 85 / 100 / 104 px. Nice-to-haves applied as decision 12.
- Round 3 (fresh critic, acceptance): 7/10, NOT YET. New eyes caught what two rounds had stopped
  seeing: every shadow was scissored flat at the slot's bottom edge, and the whiteboard's plate was
  cut at the slot's left edge. Addressed in decisions 13 to 15; verified by `tools/profile.py`.
- Round 4 (same fresh critic, verification): 8/10, SHIP IT, no blockers. Slot-bottom steps now 12
  or less everywhere, the plate's overhang intact, the margin does not tint neighbours. One
  nice-to-have taken: the 1.08x framing factor removed (decision 14 rewritten), verified by
  measurement rather than another round.
