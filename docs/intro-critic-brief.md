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
3. A beat.
4. The name travels to the nav wordmark's slot in the top-left corner, shrinking as it goes, while
   the greeting settles out. Its font axes tween from the headline's setting to the wordmark's, so
   the frame it lands on is pixel-identical to the real wordmark, which replaces it on that frame.
5. While the name is still in flight, the existing hero entrance starts: the eyebrow and headline
   rise into the centre the name is leaving.
6. On landing the nav links fade in, scrolling is released, the overlay is removed.

There is no curtain, no wipe, no colour panel, no counter, no progress bar. The cover has no
background of its own: the page under it is blank paper until the hero entrance plays, so the
headline is seen rising while the name is still in flight, and nothing changes colour at any point.

Timing from the moment the display font is ready: greeting 0 to 0.45 s, name 0.05 to 0.85 s, beat,
flight 1.05 to 1.85 s, hero entrance from 1.5 s. Under two seconds to handoff.

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
- `shots/intro-v/desktop-revisit.png`, `-reduced.png`, `-hash.png` (and the mobile set): a reload
  in the same session, a reduced-motion visitor, a deep link to `/#work`. None may show the cover.
- Source, read-only: `index.html` (the `#intro` block and the inline head script that decides
  whether it plays), `src/intro.ts` (the whole choreography), `src/styles.css` (the "Opening" block
  at the end), `src/main.ts` (the hero entrance timeline it hands off to).

## 3. Accepted design decisions (do not reopen without evidence)

1. No panel, wipe or colour change. A dark or cobalt full-screen panel is the loudest thing possible
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

Append new decisions here at the end of every round, with the measurement or reason.

## 4. Known tool limitations (do not report these as defects)

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
