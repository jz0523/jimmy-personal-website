/*
  The opening: a greeting and the owner's name on the paper, then the name travels to its seat in
  the nav (where it is the wordmark for the rest of the visit) while the hero headline rises into
  the space it left. No curtain, no wipe, no counter: the page is one sheet throughout. The cover has
  no background of its own; the page under it is blank paper until the hero entrance plays, which
  starts while the name is still in flight, in view.

  The inline script in the head decides whether it plays (html.intro-active) or not (html.no-intro:
  seen this session, deep link, reduced motion, no JS). Either way the hero entrance ends up playing.
*/
import gsap from "gsap";
import type Lenis from "lenis";

const KEY = "jz-intro";
const FLIGHT = 0.8; // seconds the name is in the air
const HERO_AT = 0.45; // seconds into the flight when the hero entrance starts; by then the flyer is above the eyebrow's line

export function playOpening(hero: gsap.core.Timeline, fontsReady: Promise<unknown>, lenis: Lenis | null): void {
  const html = document.documentElement;
  const root = document.getElementById("intro");
  const greet = root?.querySelector<HTMLElement>(".intro-greet");
  const mask = root?.querySelector<HTMLElement>(".intro-name");
  const name = root?.querySelector<HTMLElement>(".intro-name-inner");
  const nav = document.getElementById("nav");
  const wordmark = nav?.querySelector<HTMLElement>(".wordmark");
  if (!html.classList.contains("intro-active") || !root || !greet || !mask || !name || !nav || !wordmark) {
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
    .fromTo(greet, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0)
    .fromTo(name, { yPercent: 112 }, { yPercent: 0, duration: 0.8, ease: "power4.out" }, 0.05)
    .add("flight", 1.05) // the name has settled at 0.85; a beat, then it goes
    // The greeting is gone before the rising flyer reaches its line (their boxes touch 0.17 s into the
    // flight on phones, 0.2 s on desktop; the greeting is at zero 0.12 s in).
    .to(greet, { y: 8, opacity: 0, duration: 0.3, ease: "power2.in" }, "flight-=0.18")
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
