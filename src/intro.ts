/*
  The opening: a greeting and the owner's name on the paper, then the name travels to its seat in
  the nav (where it is the wordmark for the rest of the visit) while the hero headline rises into
  the space it left. No curtain, no wipe, no counter: the page is one sheet throughout. The cover has
  no background of its own; the page under it is blank paper until the hero entrance plays, which
  starts while the name is still in flight, in view.

  One piece of decoration: cobalt columns rise behind the lockup in alternating directions, odd ones
  down from the top and even ones up from the bottom, a little apart in time from left to right,
  until they close into one panel. Where a column covers the lockup its letters are white, because
  each column carries its own white copy of the lockup clipped to its shape; the ink original sits
  underneath. The panel holds for a beat, then the columns withdraw the way they came and are gone
  before the flight.

  The inline script in the head decides whether it plays (html.intro-active) or not (html.no-intro:
  seen this session, deep link, reduced motion, no JS). Either way the hero entrance ends up playing.
*/
import gsap from "gsap";
import type Lenis from "lenis";

const KEY = "jz-intro";
const FLIGHT = 0.8; // seconds the name is in the air
const HERO_AT = 0.45; // seconds into the flight when the hero entrance starts; by then the flyer is above the eyebrow's line

// The columns. They start as the name finishes rising, and the flight begins as the last one leaves.
const COLS = 7;
const COLS_AT = 0.32;
const IN_EACH = 0.36;
const IN_STAGGER = 0.055; // at 40 ms neighbours were 11% apart and their passing edges cut the name into a checkerboard
const HOLD = 0.22; // the one still moment: the name on a closed cobalt panel
const OUT_EACH = 0.3;
const OUT_STAGGER = 0.035;
const COVER_IN = IN_EACH + IN_STAGGER * (COLS - 1);
const COVER_OUT = OUT_EACH + OUT_STAGGER * (COLS - 1);
const FLIGHT_AT = COLS_AT + COVER_IN + HOLD + COVER_OUT;
const OPEN = "inset(0% 0% 0% 0%)";
// Odd columns (index 0, 2, ...) grow down from the top; even ones grow up from the bottom.
const shut = (i: number) => (i % 2 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)");

export function playOpening(hero: gsap.core.Timeline, fontsReady: Promise<unknown>, lenis: Lenis | null): void {
  const html = document.documentElement;
  const root = document.getElementById("intro");
  const stack = root?.querySelector<HTMLElement>(".intro-stack");
  const greet = root?.querySelector<HTMLElement>(".intro-greet");
  const mask = root?.querySelector<HTMLElement>(".intro-name");
  const name = root?.querySelector<HTMLElement>(".intro-name-inner");
  const nav = document.getElementById("nav");
  const wordmark = nav?.querySelector<HTMLElement>(".wordmark");
  if (!html.classList.contains("intro-active") || !root || !stack || !greet || !mask || !name || !nav || !wordmark) {
    html.classList.remove("intro-active");
    root?.remove();
    fontsReady.then(() => hero.play());
    return;
  }
  try {
    sessionStorage.setItem(KEY, "1"); // written now, so a reload mid-opening lands on the plain page
  } catch {
    /* storage blocked: the opening simply plays on every load */
  }

  /* Build the columns. Each is a slice of one panel and carries a white copy of the whole lockup,
     shifted left by its own offset so the copies line up into one lockup across the panel. The
     copies are made from the originals' text, so the lockup's words live in index.html only. */
  const panel = document.createElement("div");
  panel.className = "intro-cols";
  panel.style.setProperty("--n", String(COLS));
  const cols: HTMLElement[] = [];
  const greetCopies: HTMLElement[] = [];
  const nameCopies: HTMLElement[] = [];
  for (let i = 0; i < COLS; i++) {
    const col = document.createElement("div");
    col.className = "intro-col";
    col.style.setProperty("--i", String(i));
    const copy = document.createElement("div");
    copy.className = "intro-col-copy";
    const g = document.createElement("p");
    g.className = "intro-greet-copy";
    g.textContent = greet.textContent;
    const m = document.createElement("p");
    m.className = "intro-name-copy";
    const n = document.createElement("span");
    n.className = "intro-name-inner-copy";
    n.textContent = name.textContent;
    m.appendChild(n);
    copy.append(g, m);
    col.appendChild(copy);
    panel.appendChild(col);
    cols.push(col);
    greetCopies.push(g);
    nameCopies.push(n);
  }
  stack.appendChild(panel); // after the ink lockup, so it paints over it
  const greets = [greet, ...greetCopies];
  const names = [name, ...nameCopies];

  const navRest = Array.from(nav.querySelectorAll<HTMLElement>(".nav-links a, .menu-btn"));
  // While the cover is up the page is neither focusable nor clickable, and scrolling is held.
  const covered = Array.from(document.querySelectorAll<HTMLElement>("main, #nav, #menu"));
  covered.forEach((el) => (el.inert = true));
  lenis?.stop();
  // main.ts turns lag smoothing off so Lenis and ScrollTrigger stay in step. Scrolling is held for the
  // whole opening, so it can be on here: a long frame (a shader compile, a decode) pauses the flight
  // for that frame instead of jumping the name most of the way to the nav.
  gsap.ticker.lagSmoothing(500, 33);

  // Measured when the flight begins, so the landing is exact at whatever size the viewport is then.
  let dx = 0;
  let dy = 0;
  let k = 1;
  function prepare() {
    const a = name!.getBoundingClientRect();
    const b = wordmark!.getBoundingClientRect();
    dx = b.left - a.left;
    dy = b.top - a.top;
    k = b.height / a.height; // both boxes are one em tall, so this is the font-size ratio
    // Out of the flow before the font axes change its width, or the centred line would re-centre it mid-flight.
    gsap.set(name!, { position: "fixed", left: a.left, top: a.top, margin: 0, transformOrigin: "0 0" });
    gsap.set(mask!, { overflow: "visible" });
  }
  function land() {
    // Same frame: the flyer goes, the real wordmark appears in the spot it just reached.
    gsap.set(name!, { autoAlpha: 0 });
    html.classList.remove("intro-active");
    root!.remove();
    covered.forEach((el) => (el.inert = false));
    // Smoothing stays on until the hero has settled: this frame is the busiest of the sequence (the
    // cover goes, inert lifts, Lenis starts, the nav fades in) and nothing is scroll-linked yet.
    hero.then(() => gsap.ticker.lagSmoothing(0));
    gsap.fromTo(navRest, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.05, clearProps: "all" });
    lenis?.start();
  }

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  tl.set([greet, name], { visibility: "visible" }, 0)
    // The white copies move with the originals, so the lockup reads as one wherever a column is.
    .fromTo(greets, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0)
    .fromTo(names, { yPercent: 112 }, { yPercent: 0, duration: 0.8, ease: "power4.out" }, 0.05)
    // The columns close into a panel, hold, then withdraw the way they came. power2.inOut is its own
    // reverse, so each column leaves as gently as it arrived.
    .add("cols-in", COLS_AT)
    .fromTo(
      cols,
      { clipPath: (i: number) => shut(i) },
      { clipPath: OPEN, duration: IN_EACH, ease: "power2.inOut", stagger: IN_STAGGER },
      "cols-in",
    )
    .add("panel", COLS_AT + COVER_IN)
    .add("cols-out", `panel+=${HOLD}`)
    .to(
      cols,
      { clipPath: (i: number) => shut(i), duration: OUT_EACH, ease: "power2.inOut", stagger: OUT_STAGGER },
      "cols-out",
    )
    .add("flight", FLIGHT_AT) // the last column's last frame is the flight's first
    // The greeting is gone before the rising flyer reaches its line (their boxes touch 0.17 s into the
    // flight on phones, 0.2 s on desktop; the greeting is at zero 0.12 s in).
    .to(greets, { y: 8, opacity: 0, duration: 0.3, ease: "power2.in" }, "flight-=0.18")
    .add(prepare, "flight")
    .to(
      name,
      {
        x: () => dx,
        y: () => dy,
        scale: () => k,
        // The flyer is set like the headline it shares the stage with; it lands set like the wordmark.
        fontWeight: 600,
        fontVariationSettings: '"opsz" 24',
        letterSpacing: "-0.02em",
        duration: FLIGHT,
        ease: "power2.inOut", // visible motion within the first frames; power3 sat still for a fifth of a second
      },
      "flight",
    )
    .add(() => hero.play(), `flight+=${HERO_AT}`)
    .add(land, `flight+=${FLIGHT}`);

  // A click or a key press during the opening runs it to the end at four times the speed.
  const hurry = () => tl.timeScale(4);
  window.addEventListener("pointerdown", hurry, { once: true });
  window.addEventListener("keydown", hurry, { once: true });
  tl.eventCallback("onComplete", () => {
    window.removeEventListener("pointerdown", hurry);
    window.removeEventListener("keydown", hurry);
  });

  (window as unknown as { __intro?: gsap.core.Timeline }).__intro = tl; // read by tools/intro_check.py
  fontsReady.then(() => tl.play());
}
