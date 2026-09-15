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

There is no curtain, no wipe, no colour panel, no counter, no progress bar. The overlay is the same
paper as the page and sits under the grain layer, so nothing changes colour at any point.

Timing from the moment the display font is ready: greeting 0 to 0.5 s, name 0.05 to 0.95 s, beat,
flight 1.25 to 2.05 s, hero entrance from 1.6 s. About two seconds to handoff.

Judge, in this order: (a) does it read as a welcome and match the quiet editorial theme, (b) is it
restrained enough (the owner's words: "should not be super exaggerated"), (c) is the handoff into
the hero seamless (no empty beat, no jump, no colour change, nothing appearing twice), (d) timing:
too long, too short, dead air, (e) the gates: no replay on revisit, nothing under reduced motion or
a deep link.

## 2. What to look at

- `shots/intro/desktop-sheet.png` and `shots/intro/mobile-sheet.png`: the frames from first paint
  through the settled hero, tiled oldest first, 1440x900 and 390x844. Each frame's name carries the
  real elapsed milliseconds since navigation began. The individual frames are beside them at full
  size (`shots/intro/<viewport>-intro-NN_<ms>ms.png`) if a detail needs a closer look.
- `shots/intro/desktop-landing.png`, `shots/intro/mobile-landing.png`: the nav corner at 3x, the
  last frame of the flight above the first frame after the swap. They should be indistinguishable.
- `shots/intro/desktop-revisit.png`, `-reduced.png`, `-hash.png` (and the mobile set): a reload in
  the same session, a reduced-motion visitor, a deep link to `/#work`. None may show the overlay.
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

Append new decisions here at the end of every round, with the measurement or reason.

## 4. Known tool limitations (do not report these as defects)

- Frames come from headless Chromium via Playwright (`tools/intro_shoot.py`). A screenshot costs 50
  to 300 ms, so frames are 120 to 300 ms apart and the exact landing frame is rarely caught; the
  landing is verified separately by `tools/intro_check.py`, which pauses the timeline on the last
  frame of the flight and measures the flyer's box against the wordmark's (all four offsets are
  currently 0.0 px at both viewports).
- The first frame (about 300 ms) is taken during the navigation commit and can show a partially
  painted page; judge the sequence from the second frame on.
- Font readiness on the dev server is slower than in production, so the whole sequence sits 300 to
  500 ms later in the frame names than it would for a visitor.
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

(Appended as rounds complete.)
