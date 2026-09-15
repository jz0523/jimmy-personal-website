# Opening animation: design

Date: 2026-09-14. Branch: `feat/opening-animation`.

## What this adds

A short welcome that plays once, on the first visit of a session, before the hero entrance, and
hands off into it without a visible seam. The page is paper; the opening is set on the same paper.
There is no curtain, no wipe, no colour panel, no counter. The visitor reads a greeting and the
owner's name in the centre of the sheet, the name then travels to its seat in the top-left corner
(where it is the site's wordmark for the rest of the visit) and, while it is still in flight, the
hero headline rises into the space it left. The opening ends where the existing hero entrance
begins, so the two read as one motion.

## Research

A survey of how well-regarded portfolio and agency sites open (Codrops case studies from 2025 and
2026, GSAP and Lenis documentation, Nielsen Norman Group, Smashing Magazine, Awwwards, Josh Comeau,
web.dev) turned up ten recurring patterns and a consistent set of rules. The ones that shaped this
design:

- Duration. Nielsen Norman Group's one-second limit keeps the visitor's flow of thought intact;
  the practitioners' ceiling for a decorative opening is "a second, at most two", with the exit
  itself in the 200 to 400 ms range. A full-screen cover hides the largest contentful paint for its
  whole duration, so it should stay under two seconds and be skippable.
  (nngroup.com/articles/response-times-3-important-limits, 21st.dev/blog/react-preloader-components)
- Once per session. "A cover on every navigation turns a site into a slideshow"; the accepted
  pattern is a sessionStorage flag checked before first paint.
- Reduced motion. Skip the cover and reveal immediately; fades are safe, scaling and travel are
  the parts that move. (joshwcomeau.com/react/prefers-reduced-motion, css-tricks.com/nuking-motion-with-prefers-reduced-motion)
- Real progress or none. A counter animating to 100 on a timer is decoration; wait only for the
  specific thing that would look wrong without it (here, the display font), never for everything.
- The reveal ends where the hero begins. The strongest examples make the opening's last frame the
  hero's first frame, or make an opening element become a page element (Flip), and start the hero
  tweens while the cover is still moving so the two read as one gesture.
  (tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio, gsap.com/docs/v3/Plugins/Flip)
- Accessibility. `inert` on the covered content while the cover is up, `aria-hidden` on the
  decorative cover, no programmatic focus moves afterward. (web.dev/articles/inert)
- Lenis. Hold scrolling with `stop()` and release with `start()`; the site's own
  `.lenis-stopped` rule sets `overflow: hidden`. Remove the overlay from the DOM when done so it
  cannot intercept clicks.

Patterns the survey found that clash with this site's theme and were not considered further:
coloured slider panels, full-screen video, scramble or glitch text, particle fields, long counters,
blur filters over large areas, anything that replays on every navigation.

## Why this pattern

Constraints set by the owner: match the theme, do not exaggerate, transition seamlessly.

The site's theme is quiet and editorial: paper ground (#f4f4f1), ink text, one cobalt accent, the
owner's photos as identity anchors, motion that behaves like objects on a desk. The candidates were
weighed against that:

| Pattern | Verdict |
| --- | --- |
| Curtain or wipe (a full-bleed ink or cobalt panel slides away) | A dark or saturated full-screen panel is the loudest thing on a light site, and the accent is used sparingly everywhere else. A paper sheet lifting over paper is invisible unless given an edge shadow, which is an effect for its own sake. Rejected. |
| Progress counter (0 to 100, a bar) | Nothing here takes long enough to count; the fonts are self-hosted and the models load lazily. A fake counter is the pattern the sources warn against. Rejected. |
| Portrait zoom (the front print starts full-bleed and shrinks into its slot) | On theme, since the photos carry the identity, but a full-screen face on first paint is the exaggerated version of that idea, and it competes with the figurine's pop. Runner-up. |
| No opening at all (the existing entrance is the welcome) | The quietest option and the best for paint metrics, but it does not add the welcome the owner asked for. Kept as the behaviour for every case where the opening does not play. |
| Greeting and wordmark handoff (this design) | Typographic, on the paper, one element that ends up as a permanent part of the page. The handoff is the mechanism, not an effect layered on top. Chosen. |

## Choreography

Times are seconds after the display font is ready (the existing hero entrance already waits on
`document.fonts.ready` with an 800 ms cap; the opening shares that gate).

| Time | What happens | How |
| --- | --- | --- |
| 0.00 | The greeting "Hello, I'm" fades up. | y 12 to 0, opacity 0 to 1, 0.45 s, `power3.out`. Geist Mono at 0.95 rem, sentence case, `--text-2`, `clamp(14px, 1.6vw, 22px)` above the name. Not an eyebrow: the page keeps its one-eyebrow rule. |
| 0.05 | The name "Jimmy Zhong" rises out of a line mask. | `yPercent` 112 to 0, 0.8 s, `power4.out`, the same mask mechanics as the hero headline. Bricolage Grotesque, opsz 96, weight 500, the `h1` size. |
| 0.37 | A hairline frame draws itself clockwise around the lockup, starting at the top left, as the name finishes rising. | `strokeDashoffset` 1000 to 0, 0.5 s, `power2.inOut`. See "The frame" below. |
| 0.87 | The frame is shut. The one still moment of the opening: a name on a plate. | 0.22 s. |
| 1.09 | The frame retraces the way it came, counterclockwise, and is gone as the flight begins. | `strokeDashoffset` back to 1000, 0.36 s, `power2.inOut`: a symmetric ease is its own reverse, so the pen leaves as gently as it arrived. |
| 1.27 | The greeting settles down and out, gone before the rising name reaches its line. | y 0 to 8, opacity 1 to 0, 0.3 s, `power2.in`. The flyer's box first touches the greeting's line 0.17 s into the flight on phones and 0.2 s on desktop; the greeting is at zero 0.12 s in. |
| 1.45 | The name travels to the nav wordmark's slot. | A hand-computed fit (see below), 0.8 s, `power2.inOut` (motion visible in the first frames). |
| 1.90 | The hero entrance starts while the name is still in flight, in view. By now the shrinking flyer is above the eyebrow's line, so the two never overlap. | The existing hero timeline `play()`s here, so the eyebrow and headline rise into the centre as the name leaves it. |
| 2.25 | The name lands. On that frame it is swapped for the real wordmark, the nav links and menu button fade in, the cover is removed, `inert` and scrolling are released. | `autoAlpha` swap; nav children y 8 to 0, opacity 0 to 1, 0.5 s, stagger 0.05; `lenis.start()`; `html.intro-active` removed. |
| 2.25 onward | The hero entrance continues as it does today: sub, buttons, prints landing back to front, the greeter figurine popping in 0.9 s after its model is on screen. | Unchanged. |

About 2.25 s from font-ready to handoff, three and a half to a settled hero. Without the frame it was
1.85 s; the owner asked for the decoration on 2026-09-15 knowing it costs time, and the stillness did
not grow with it, since the frame is moving through most of what used to be the reading beat.

### The frame

An `svg` with one `rect`, absolutely positioned around the lockup and sized with explicit width and
height (an `svg` is a replaced element, so `inset` alone leaves it at its 300 by 150 intrinsic size).
Nothing about it is measured in JavaScript:

- The rect is `width="100%" height="100%"` in an svg with no `viewBox`, so one user unit is one
  pixel and the rect tracks the lockup's box at any viewport, at any moment, including a late font
  swap that changes the name's width mid-gesture.
- `pathLength="1000"` normalises its path length, so `stroke-dasharray: 1000` with
  `stroke-dashoffset` from 1000 to 0 draws it and back to 1000 retraces it, whatever its real
  perimeter is (1319 px on a laptop, 735 on a phone). The rect starts undrawn from CSS alone, so
  nothing flashes before the timeline reaches it.
- The stroke straddles the box edge rather than being inset by half its width, which is why the svg
  is `overflow: visible`. At 34 px of padding the half pixel outside is immaterial.
- `pathLength` on a `rect` is SVG 2 (Chrome 88, Firefox 97, Safari 14). An engine that ignored it
  would draw about three quarters of the frame and stop, so the opening checks that the attribute
  was honoured and hides the frame if it was not: that visitor gets the opening without its
  decoration rather than a broken one.

A rect's own path starts just right of its top left corner and runs clockwise, so the whole gesture
is one property. Putting the dash offset back walks the pen backwards along the line it drew, which
is the reverse the owner asked for, rather than a second lap or a fade. Both halves use
`power2.inOut`, which is its own reverse: an accelerating ease on the retrace ended at maximum
velocity and read as the frame being snatched away.

It is 1 px of ink at 0.34 alpha with the site's 16 px container radius, matching the one-pixel rules
used everywhere else on the page. No accent colour: the accent is spent on the hero headline seconds
later. The lockup is centred, so the frame's box lands on a fractional position and the hairline
shares two device rows at device ratio 1 whatever its width; 1 px at 0.34 puts 74 ink units there
against a crisp row's 75, so the weight is right even though it has no dark core.

### The seam

- The cover has no background of its own. The page under it is blank paper until the hero entrance
  plays (the nav is hidden by class, the hero's elements sit at their pre-entrance states), so the
  cover is only the greeting and the name, and the headline is seen rising while the name is still in
  flight. A first version painted the cover in `--bg`; the in-page log showed the hero rising on
  time but behind it, so it only appeared at the landing.
- The nav is hidden (`visibility`) until the name lands, so the landing is the first frame the
  wordmark exists.
- The hero timeline overlaps the flight by 0.45 s, so the eye is never looking at an empty sheet
  between the two.
- The hero headline's rotation used to be scheduled from an IntersectionObserver at page load and
  would have fired mid-entrance once the entrance was delayed; it now waits for the entrance's
  completion (a latent race on `main` as well).
- A figurine whose slot is on screen during the opening waits for it before popping in, so the
  greeter does not appear fully formed the instant the overlay goes.

## When it does not play

All of these fall through to today's behaviour (nav visible at first paint, hero entrance plays):

1. `prefers-reduced-motion: reduce`: the inline head script marks `html.no-intro`, CSS hides the
   overlay (`display: none`) as a second guard, JS never builds the timeline. The hero entrance is
   already static under reduced motion.
2. Already seen this session: the same inline script reads `sessionStorage["jz-intro"]` before
   first paint, so the overlay never flashes. The key is written the moment the opening starts, so a
   reload mid-opening also skips it. Session scope, not local storage: a visitor who comes back
   tomorrow gets the welcome again.
3. A deep link (`location.hash` is non-empty): the visitor asked for a section, not a welcome.
4. No JS: the overlay is hidden under `html.no-js`, the page renders as today.

A pointer down or a key press during the opening runs it at 4x speed to the end. Nothing is
skipped, the visitor just gets there sooner.

## Accessibility and performance

- The overlay is `aria-hidden="true"`; its text duplicates the wordmark and the page title.
- `main`, the nav and the mobile menu are `inert` while the cover is up. Scrolling is held with
  `lenis.stop()` and released on landing. Without Lenis (reduced motion) the opening does not play,
  so there is no second path to maintain.
- GSAP lag smoothing, which `main.ts` turns off so Lenis and ScrollTrigger stay in step, is on from
  the start of the opening until the hero entrance completes, about 1.2 s after the landing. Nothing
  is scroll-linked before then, and a long frame (a shader compile when the first figurine model
  lands, the landing frame itself, which removes the cover, lifts `inert`, starts Lenis and fades the
  nav in) pauses the motion for that frame instead of jumping it.
- The wordmark's box is one em tall for the fit, which is under the 24 px touch minimum; a
  pseudo-element extends the link's hit area 8 px above and below and 6 px either side without
  changing the measured box.
- Nothing waits on images or models. The overlay is text on a colour, so the largest contentful
  paint is the name and happens as soon as the font is ready.
- Layout: the overlay is `position: fixed`, so it causes no shift when removed. The mask keeps a
  fixed height when the flyer leaves the flow, so the greeting does not jump.
- Mobile runs the same choreography with the same sizes the hero already uses at that width.

## Files

- `index.html`: the overlay markup as the first child of `body` (the frame's svg, greeting, masked
  name), the session, deep-link and reduced-motion gate in the existing inline head script, and a
  preload for the two faces the opening uses, so the font race that gates its start is rarely lost.
- `src/styles.css`: the wordmark measures as one em; an "Opening" block at the end (overlay,
  greeting, name mask, nav hidden while active, reduced-motion and no-intro rules).
- `src/intro.ts`: `playOpening(hero, fontsReady, lenis)` builds and runs the timeline and resolves
  the skip conditions; exposes the timeline as `window.__intro` for the check tool.
- `src/main.ts`: builds the hero timeline (as today) and passes it to `playOpening` instead of
  playing it directly; the headline rotation waits for the entrance to complete.
- `src/figures.ts`: a figure's enter pop waits while `html.intro-active` is set.
- `tools/intro_shoot.py`: a video recording of the opening at 1440x900 and 390x844 cut into frames
  every 150 ms (screenshots stall the page, and with GSAP's lag smoothing off the animation jumps
  between them), tiled, plus the revisit, reduced-motion and deep-link cases.
- `tools/intro_check.py`: the frame (fully drawn at its label, fully retraced when the flight
  begins), the greeting's exit (a 1/60 s sweep of the first 0.4 s of the flight, worst opacity times
  overlap must be 0), the seam (cover transparent and the headline rising mid-flight), landing
  precision (box offsets on the last frame of the flight) and a 3x crop of the swap. Exits 1 on any
  failure.
- `tools/intro_frame.py`: the frame at six exact points of its draw and retrace, by pausing and
  seeking the timeline rather than sampling a recording.
- `docs/intro-critic-brief.md`: the brief for the critic rounds.
- `README.md`: the new tools and file.

## Verification

- `npm run build` type-checks and bundles.
- `python tools/intro_shoot.py shots/intro-v` runs with zero page errors and shows: the greeting
  and name centred, the name in flight, the headline rising during the flight, the wordmark in place
  after landing, and the settled hero identical to `main`. The revisit, reduced-motion and deep-link
  shots show no cover. After the opening, `html` carries neither `intro-active` nor `lenis-stopped`
  and its overflow is visible.
- `python tools/intro_check.py shots/intro-v` reports a frame that is shut at its label and fully
  retraced at the flight, a greeting overlap score of 0, a transparent cover with the first headline
  line rising mid-flight, and box offsets of 0 px at the landing, at both viewports, and exits 0.
- `python tools/intro_frame.py shots/frame` shows the frame drawing clockwise from the top left,
  shut around the lockup, retracing counterclockwise, and absent when the flight begins.
- A critic agent reviews the frame sheets against `docs/intro-critic-brief.md`; the loop runs until
  it scores 8 or above with no blocking issue.
