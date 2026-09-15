# Critic brief: the opening animation on jimmy's personal site

Read this whole file before looking at a single frame. It is the memory of every review round so
far; do not re-litigate a decision listed in section 3 unless the frames show it failing on its own
terms.

## 1. What you are looking at

A single-page recruiting portfolio (Vite, GSAP ScrollTrigger, Lenis). Light paper ground
(#f4f4f1), ink text (#16171c), one cobalt accent (#2f55d4), the owner's own photos as the identity
anchors, and five small 3D figurines placed as objects on the page. The hero already has an entrance:
eyebrow fades up, two headline lines rise out of a mask, then the sub, the buttons, three tilted
photo prints landing back to front, and a waving figurine popping in at the bottom left of the
prints.

This branch adds an opening that plays once per session before that entrance. The brief the owner
set: a welcoming opening or visual effect on arrival, matching the site's theme, not exaggerated,
transitioning seamlessly into the page.

The design (full spec: `docs/superpowers/specs/2026-09-14-opening-animation-design.md`):

1. First paint is the empty paper sheet. The nav is hidden.
2. A greeting, "Hello, I'm", fades up in Geist Mono (sentence case, grey), and the name "Jimmy
   Zhong" rises out of a line mask in Bricolage Grotesque at the headline size, centred.
3. Seven cobalt columns rise behind the two of them in alternating directions, odd ones down from
   the top and even ones up from the bottom, 55 ms apart from left to right, until they close into
   one panel with the site's 16 px radius. Where a column covers the lockup its letters are white:
   each column carries its own white copy of the lockup clipped to its shape, with the ink original
   underneath, so the colour change follows the column edges exactly.
4. The panel holds for a beat, then the columns withdraw the way they came, left to right, and are
   gone, leaving the ink lockup on paper.
5. The name travels to the nav wordmark's slot in the top-left corner, shrinking as it goes, while
   the greeting settles out. Its font axes tween from the headline's setting to the wordmark's, so
   the frame it lands on is pixel-identical to the real wordmark, which replaces it on that frame.
6. While the name is still in flight, the existing hero entrance starts: the eyebrow and headline
   rise into the centre the name is leaving.
7. On landing the nav links fade in, scrolling is released, the overlay is removed.

There is no curtain, no wipe, no full-screen panel, no counter, no progress bar. The one block of
colour is the lockup-sized cobalt panel of decisions 25 to 28, gone before the name leaves. The
cover has no background of its own: the page under it is blank paper until the hero entrance plays,
so the headline is seen rising while the name is still in flight.

Timing from the moment the display font is ready: greeting 0 to 0.45 s, name 0.05 to 0.85 s,
columns arriving 0.32 to 1.01 s, panel shut 1.01 to 1.23 s, columns withdrawing 1.23 to 1.74 s,
flight 1.74 to 2.54 s, hero entrance from 2.19 s. About 2.54 s to handoff: 1.85 s with no
decoration, 2.25 s with the drawn frame it replaces. The owner asked for the decoration knowing it
costs time, so judge the pacing, not the total against the old numbers.

Judge, in this order: (a) does it read as a welcome and match the quiet editorial theme, (b) is it
restrained enough (the owner's words: "should not be super exaggerated"), (c) is the handoff into
the hero seamless (no empty beat, no jump, no colour change, nothing appearing twice), (d) timing:
too long, too short, dead air, (e) the gates: no replay on revisit, nothing under reduced motion or
a deep link.

## 2. What to look at

- `shots/intro-v/desktop-sheet.png` and `shots/intro-v/mobile-sheet.png`: frames cut every 150 ms
  from a video recording of a fresh visit, from navigation through the settled hero, tiled oldest
  first, 1440x900 and 390x844. The individual frames are beside them at full size
  (`shots/intro-v/<viewport>-intro-NN_<ms>ms.png`) if a detail needs a closer look.
- `shots/intro-v/desktop-landing.png`, `shots/intro-v/mobile-landing.png`: the nav corner at 3x,
  the last frame of the flight above the first frame after the swap. They should be
  indistinguishable.
- `shots/frame/desktop-frame-sheet.png` and `shots/frame/mobile-frame-sheet.png`: the columns at
  six points of their arrival and withdrawal, chosen by how much of the panel they cover rather than
  by elapsed time (the timeline is paused and seeked, so these are states, not samples), cropped to
  the lockup and enlarged. File names give the coverage at each state: `0_in25`, `1_in60`, `2_panel`, `3_out60`,
  `4_out20` and `5_flight`.
  `shots/frame/<viewport>-full-closed.png` is the closed panel on the whole sheet.
- `shots/intro-v/desktop-revisit.png`, `-reduced.png`, `-hash.png` (and the mobile set): a reload
  in the same session, a reduced-motion visitor, a deep link to `/#work`. None may show the cover.
- Source, read-only: `index.html` (the `#intro` block and the inline head script that decides
  whether it plays), `src/intro.ts` (the whole choreography), `src/styles.css` (the "Opening" block
  at the end), `src/main.ts` (the hero entrance timeline it hands off to).

## 3. Accepted design decisions (do not reopen without evidence)

1. No full-screen panel, wipe or colour change (the lockup-sized cobalt panel of decisions 25 to 28
   is the owner's own exception, asked for on 2026-09-15). A dark or cobalt full-screen panel is the loudest thing possible
   on a light site whose accent is used sparingly; the sources the design drew on put the ceiling for
   a decorative opening near two seconds and warn against covers that hide the page for effect.
2. No counter or progress bar. Nothing on the page takes long enough to count (self-hosted fonts,
   lazy models), and a counter running on a timer is fake progress.
3. The name becomes the wordmark. The opening's one element ends up as a permanent part of the page
   instead of being thrown away; that is what makes the handoff a mechanism rather than an effect.
4. The greeting is mono sentence case, not an eyebrow: the page keeps its one-eyebrow rule.
5. Plays once per session (sessionStorage), never on a deep link, never under reduced motion, never
   without JS. A click or key press during the opening runs it at 4x to the end; nothing is skipped.
6. The page is `inert` and scrolling is held (`lenis.stop()`) while the cover is up; both are
   released on landing.
7. The hero headline's rotation (four claims) waits for the entrance to complete; it used to be
   scheduled from an IntersectionObserver at load and fired mid-entrance once the entrance was
   delayed by the opening.
8. Figurines that come on screen during the opening wait for it before popping in, so the greeter
   does not appear fully formed the instant the overlay goes.
9. Site rules that already hold on `main`: zero em or en dashes in visible text, one eyebrow on the
   whole page, no duplicate statistics, pills for interactive elements, 16px radius for containers.
10. The cover has no background. Round 1 measured the hero rising on time but behind a paper-coloured
    cover (line 1 at 46% risen, eyebrow at 0.85 opacity under the cover mid-flight), so it hard-cut in
    at the landing, three-quarters risen. Everything under the cover is already invisible (nav hidden
    by class, hero elements at their pre-entrance states, figurines waiting), so the cover needs no
    paint of its own. `tools/intro_check.py` now asserts the cover is transparent mid-flight and the
    first headline line is rising.
11. Beat and flight ease. Round 1 measured 0.6 to 0.75 s of zero-change frames after the name had
    settled. The flight label moved from 1.25 to 1.05 s, the name's rise from 0.9 to 0.8 s, and the
    flight ease from `power3.inOut` to `power2.inOut` so motion is visible in the first frames. The
    hero starts at flight + 0.45 s (was 0.35) so the shrinking flyer has cleared the eyebrow's line
    before the eyebrow begins to fade in.
12. The greeting is 0.95 rem with 22 px below it (was 0.86 rem, 18 px), so it reads as one lockup with
    the name instead of a whisper above it.
13. The remaining hold of about 0.45 s (two to three zero-change frames at 150 ms, from the name's
    settling to the flight's first visible motion) is the reading beat, accepted in round 2. The
    greeting is legible from about 0.3 s and the name from about 0.45 s after the opening starts.
14. On mobile the shrinking flyer crosses the eyebrow's line at about flight + 0.52 s with the eyebrow
    at or below 0.14 opacity; on desktop the two never intersect. Accepted as invisible in round 2.
15. GSAP lag smoothing is on for the duration of the opening (500 ms threshold, 33 ms adjusted) and
    off again at the landing, as `main.ts` sets it for Lenis. Scrolling is held throughout, so there
    is nothing to desynchronise, and a long frame (one headless run in four showed a 550 ms shader
    compile while the first figurine model landed) pauses the flight instead of jumping the name.
16. The greeting's exit starts 0.18 s before the flight and lasts 0.3 s, so it is at zero opacity by
    flight + 0.12 s. Round 3 measured the flyer's box first touching the greeting's line at
    flight + 0.20 s on desktop and covering it from + 0.25 to + 0.30 s while the greeting was still at
    0.64 to 0.37 opacity (its exit used to start on the flight label with `power2.in`): about 100 ms
    of grey mono text printed over the moving name. With the tighter phone gap of decision 18 the
    boxes touch at + 0.17 s there, hence the 0.18 s lead rather than the 0.12 s first tried.
    `tools/intro_check.py` now sweeps the first 0.4 s of the flight at 1/60 s and reports the worst
    opacity times overlap, which must be 0 at both widths. Guard: on phones the margin is 30 ms (the
    greeting at zero at + 0.12 s, the text boxes touching at + 0.15 s). Tightening the phone gap
    below 14 px or shortening the 0.18 s lead brings the collision back; do not trade one for the
    other. Round 4 confirmed the sweep reports it (score about 1100 to 1200) if the lead is removed.
19. The decoration the owner asked for on 2026-09-15 is a hairline rounded rectangle, not a circle,
    a glow or a fill: a 1 px stroke in ink at 0.34 alpha with the site's 16 px container radius,
    21 to 34 px of horizontal padding and 15 to 26 px of vertical padding around the lockup. It reads
    as a name on a plate, which is what the page is: an introduction. No accent colour, since the
    accent is spent on the hero headline seconds later. Round 5 measured the first build's 1.5 px at
    0.26 alpha as 2.2 times the ink of the heaviest rule on the site, straddling the pixel grid at
    device ratio 1 (the owner's own Chrome) where every other rule is crisp; 1 px at 0.34 holds the
    same presence on one row. The horizontal floor went 18 to 21 px because on phones the side gaps
    measured 3 px tighter than the top and bottom.
20. It draws clockwise from the top left over 0.5 s, holds shut for 0.22 s, and retraces
    counterclockwise over 0.36 s, ending exactly as the flight begins. Both use `power2.inOut`: a
    symmetric ease is its own reverse, so the pen leaves as gently as it arrived. Round 5 measured
    the first build's `power2.in` retrace leaving at its maximum velocity, 221 px in its last frame
    against the draw's 123 px peak, with 45 percent of the frame gone in the last 50 ms; it now
    peaks at 171 px mid-retrace and its last frame removes nothing.
21. Nothing about the frame is measured in JavaScript. The rect is `width="100%" height="100%"` in
    an svg with no `viewBox`, so it tracks the lockup's box at any viewport, and `pathLength="1000"`
    normalises its path length, so one dash offset from 1000 to 0 draws it and back to 1000 retraces
    it whatever its real perimeter is (1319 px on a laptop, 735 on a phone). The first build measured
    once inside `fontsReady`, which races `document.fonts.ready` against an 800 ms timer, and froze a
    pixel `viewBox`: round 5 showed a late font swap stretching that frozen box by 1.115 and turning
    the 16 px corners into ellipses. The svg still needs explicit width and height rather than
    `inset`, since a replaced element with insets alone stays at its 300 by 150 intrinsic size.
22. The two faces the opening uses, Bricolage Grotesque latin and Geist Mono latin, are preloaded in
    `index.html`. All six faces are `font-display: swap` and `document.fonts.ready` waits on all of
    them, so before this the 800 ms timer winning the race was a normal cold-visit outcome and the
    opening started against fallback metrics.
23. The hairline renders across two device rows at device ratio 1 and that is settled, not a defect
    to chase. The lockup is centred, so its box lands on a fractional position (top 357.77, left
    475.56 at 1440 wide) and no geometry change can guarantee a crisp row; insetting the rect again
    would only move which two rows share the ink. At 1 px and 0.34 alpha the total is 74 units
    against a crisp row's 75, down from 86 in the first build, so it is quieter and correct in
    weight; it simply has no dark core. Round 6 measured it and recommended closing the thread.
24. `pathLength` on a `rect` is SVG 2 (Chrome 88, Firefox 97, Safari 14). If an engine ignored it,
    a dash array of 1000 against a real perimeter of 1319 would draw about three quarters of the
    frame and stop, never closing: a silent hard failure. The opening checks that the attribute was
    honoured and hides the frame if it was not, so such a visitor gets the opening without its
    decoration rather than a broken one.
25. On 2026-09-15 the owner replaced the drawn frame. Decisions 19, 20, 21, 23 and 24 describe that
    frame and are kept as history only; 22 (the font preloads) and the lesson of 20 (a symmetric
    ease for anything that undoes itself) still apply. The owner turned down brush strokes as too
    artistic and asked for "blue columns appearing alternatively behind the name", as more
    professional. The details they approved: alternating direction (odd columns from the top, even
    from the bottom) with a slight left-to-right stagger; the columns closing into one solid panel;
    reaching just behind the lockup, the size the frame was; solid cobalt with white letters rather
    than a light tint with ink letters; seven columns.
26. White on cobalt without a colour tween: each column is a slice of the panel carrying a white copy
    of the whole lockup shifted by the column's own offset, clipped by the column's `clip-path`. The
    ink original stays underneath, so wherever a column is the letters are white and wherever it is
    not they are ink, edge for edge, at every moment of the arrival and withdrawal. The copies are
    built in `src/intro.ts` from the originals' text and move in the same tweens as the originals
    (the greeting's fade, the name's rise, the greeting's exit). White is 5.9 to 1 on cobalt; the
    greeting's copy is white at 0.8 alpha, the name's is solid.
27. Columns open and close with `clip-path: inset()` rather than `scaleY`, so the white copies inside
    them are revealed, never squashed. Each column is one pixel wider than a seventh of the panel so
    no paper shows between neighbours, and each copy's offset subtracts that pixel back out so the
    seven copies line up exactly. The panel's 16 px radius and `overflow: hidden` round the outer
    corners of the first and last columns.
28. Each column arrives over 0.36 s and leaves over 0.3 s, both `power2.inOut` (decision 20), with
    staggers of 55 ms in and 35 ms out, in the same left-to-right order both ways, so the withdrawal
    reads as the arrival played back rather than a new movement. The panel is shut for 0.22 s. The
    last column finishes leaving on the flight label.
29. Round 7 notes taken. The in-stagger went from 40 to 55 ms: at 40 ms on a 0.36 s ease neighbours
    were only 11% apart in progress, so for about 100 ms alternate edges crossed at the name's
    mid-height and cut it into a checkerboard of white and ink, which read as a glitch rather than
    a wave. It costs 0.09 s. The greeting's white copy went from 0.8 to 0.65 alpha: at 15 px mono a
    column edge through its x-height left half-white, half-grey letters that looked busy, where the
    name's split reads well. The timeline labels are `cols-in`, `panel` and `cols-out`, and the tools
    report coverage from 0 to 1, so nothing still suggests the frame.

Append new decisions here at the end of every round, with the measurement or reason.
17. The wordmark's hit area is a pseudo-element 8 px above and below and 6 px either side of the
    one-em box (which the flyer measures and which stays as it is), so the home link's target is back
    above 24 px tall after decision 3 shrank its box from 27 to 17 px.
18. Lag smoothing stays on past the landing until the hero entrance completes (about 1.2 s later),
    since the landing frame is the busiest of the sequence and nothing is scroll-linked before then.
    The greeting's gap to the name is `clamp(14px, 1.6vw, 22px)`, so the lockup keeps about half an
    em of the name at both widths instead of loosening to three quarters on phones.

Append new decisions here at the end of every round, with the measurement or reason.

## 4. Known tool limitations (do not report these as defects)

- `tools/intro_frame.py` pauses and seeks the timeline instead of sampling a recording, so its six
  frames are exact. It picks them by how much of the frame is drawn rather than by elapsed time,
  since under an accelerating ease the two are far apart and an equal-time sample can miss the state
  that reads worst. It captures at device scale 1 and enlarges: at device scale 2 the page's two
  WebGL canvases stall headless Chromium for minutes under software GL.
- Two traps that have cost time in this repo, in case you write your own probe: evaluating a bare
  expression that returns the GSAP timeline (`page.evaluate("window.__intro.pause()")`) crashes the
  renderer when Playwright tries to serialise the animation graph, so wrap seeks in a function that
  returns nothing or a small object; and seeking exactly onto the `flight` label fires the callback
  that takes the name out of the flow, which collapses the lockup and every box measured afterwards.
- Frames are cut from a screencast recording of headless Chromium (`tools/intro_shoot.py`), so they
  do not stall the page, but the screencast emits frames irregularly and a cut frame can repeat the
  previous one by up to about 100 ms. Treat any single-frame oddity as suspect and look at its
  neighbours. The exact landing frame is verified separately by `tools/intro_check.py`, which pauses
  the timeline on the last frame of the flight and measures the flyer's box against the wordmark's
  (all four offsets are currently 0.0 px at both viewports).
- The recording begins before navigation, so the first few frames are the browser's blank white
  page before first paint (up to about 450 ms on the dev server). Not the site.
- Module evaluation and font readiness on the dev server are slower than in production, so the
  whole sequence sits 300 to 700 ms later in the frame names than it would for a visitor.
- There is no pointer, so nothing in the frames reflects the hover states or the greeter's cursor
  tracking.
- The dev server is at http://localhost:5199. The `bb-browser` CLI (real Chrome, Bash only) can
  open it for a live look: `bb-browser open URL`, `bb-browser screenshot path.png`. Clear
  `sessionStorage` (or open a fresh tab) to see the opening again.

## 5. Output format (exactly this)

```
VERDICT: SATISFIED / NOT SATISFIED
SCORE: n/10
TOP ISSUES: numbered; each with the frame or file name, the region, and a concrete fix (retime,
            move, resize, delete, recolor, reorder). Blocking items only. If nothing blocks, say so.
NICE-TO-HAVES: cheap polish, clearly separated from the blockers.
WHAT ALREADY WORKS: things the next round must not break.
```

Score 8 or above with no blocking issue is SATISFIED. Be harsh on anything that reads as a
generic preloader, on dead air, on any frame where the page looks broken or half-drawn, on a
handoff that jumps, and on anything that makes the existing hero entrance worse than it was
without the opening. "It feels slow" is not actionable; "the name holds still from 1.1 s to 1.75 s,
650 ms of nothing, cut the beat to 200 ms" is.

## 6. Round history

- Round 1 (fresh critic, on the screenshot-timed frames and its own video re-shoot): 6/10, NOT
  SATISFIED. Blockers: the hero entrance ran behind the paper-coloured cover and hard-cut in at the
  landing; a 0.6 to 0.75 s static hold. Both addressed in decisions 10 and 11; the nice-to-haves
  (greeting size, a seam check in the tool) taken as decision 12 and in `tools/intro_check.py`.
- Round 2 (same critic, verification, on its own video re-shoot and two timeline-locked probes):
  8/10, SATISFIED, no blockers. Blocker 1 verified: cover transparent at every sampled flight time,
  line 1 63% risen and eyebrow at 0.90 on the landing frame, changed-pixel counts across the
  handoff a continuous ramp (66k, 121k, 167k, 136k, 71k) instead of a zero then a 184k spike.
  Blocker 2 verified: hold down to about 0.45 s, accepted as the reading beat (decision 13). The
  graze at flight + 0.45 measured clean on desktop and invisible on mobile (decision 14). One
  nice-to-have taken as decision 15 (lag smoothing during the opening); the other (flight label
  0.95 instead of 1.05) declined, the beat is the reading time.
- Round 3 (fresh critic, acceptance, on its own re-shoot, a CSS diff against the commit before the
  branch, and a timeline-locked probe): 7/10, NOT SATISFIED. New eyes caught what two rounds had
  stopped seeing: the name flew through the still-visible greeting for about 100 ms. Addressed in
  decision 16 and guarded by the new sweep in `tools/intro_check.py`. The three nice-to-haves
  (wordmark hit area, smoothing until the hero completes, the mobile lockup gap) taken as decisions
  17 and 18. Confirmed by the same critic: first paint reads as a fade-in, the lockup is optically
  centred at both widths, the settled page is identical to `main` except the wordmark's box.
- Round 4 (same fresh critic, verification, on its own re-shoot and a timeline-locked probe): 9/10,
  SATISFIED, no blockers. Greeting at zero 50 ms before the boxes touch on desktop and 30 ms on
  phones; opacity times overlap 0 at every step; the sweep proven to catch the regression. Nothing
  on the round-3 list regressed. Nice-to-haves taken: `tools/intro_check.py` exits 1 on any failed
  check, and the phone-margin guard is written into decision 16.
- Round 5 (fresh critic, on the frame the owner asked for on 2026-09-15, with its own velocity sweep
  at 1/60 s and a font-swap probe): 7/10, NOT SATISFIED. Blockers: the retrace left at its maximum
  velocity and read as the frame being yanked off rather than the pen backing out; and the frame was
  measured once against a font race it can lose, so a late swap stretched its frozen `viewBox`.
  Addressed in decisions 20 and 21, the second by removing the measurement altogether. All four
  nice-to-haves taken: the earlier draw start (decision 20), the 1 px stroke and the phone padding
  (decision 19), and distance-based sampling in `tools/intro_frame.py`. Confirmed by the same critic:
  the padding, the idea and the restraint, the mechanism being a genuine reverse, the legibility of
  the draw, and that the decoration replaced dead air rather than adding to it, so the added 0.4 s
  earns itself.
- Round 6 (same fresh critic, verification, on its own velocity sweep, font-swap probe and preload
  check): 9/10, SATISFIED, no blockers. The retrace's last frame now removes 2.6 px and then nothing,
  peaking at 166 px mid-retrace against the draw's 123 px at its own midpoint, the two delta
  sequences the same shape with the retrace compressed 0.72x in time. The font-swap probe took the
  svg from 489 to 545 px with the rect tracking it exactly, circular corners and a uniform stroke,
  and confirmed that normalising the dash space deletes the failure class rather than patching it.
  Mobile padding came out tighter than desktop's at a 1.5 px spread. Three nice-to-haves taken as
  decisions 23 and 24 and in `tools/intro_frame.py`; the fourth, the hairline sharing two device
  rows, was measured and closed by the critic itself.
- 2026-09-15, after round 6: the owner replaced the drawn frame with cobalt columns (decisions 25 to
  28), on a new branch, `feat/opening-columns`. Rounds from here on judge the columns.
- Round 7 (fresh critic, on the columns, with a seam probe at six widths and a copy-alignment probe):
  8/10, SATISFIED, no blockers. No paper at any seam (worst 7 on a sum-of-RGB scale where paper is
  about 500), white copies within 0.08 px of the ink, hard square white/ink edges, coverage 0 at the
  flight, all four gates green. Nice-to-haves taken as decision 29 (stagger, greeting copy alpha,
  labels) and in the stale wording of decision 1 and section 1. Not taken: starting the first and
  last columns 20 ms later to hide one-frame corner slivers (harmless), and starting the flight
  60 to 80 ms earlier (it would reorder the panel's withdrawal against the name leaving the flow).
