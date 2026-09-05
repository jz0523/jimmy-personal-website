import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  siPython,
  siTypescript,
  siOcaml,
  siCplusplus,
  siPostgresql,
  siThreedotjs,
  siLangchain,
  siLanggraph,
  siFastapi,
  siSupabase,
  siAnthropic,
  siClaude,
  siReact,
  siNextdotjs,
  siDocker,
  siGit,
  siGithub,
  siJupyter,
  siBlender,
  siVite,
} from "simple-icons";
import { mountField } from "./field";

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* ---------- Smooth scroll (off under reduced motion) ---------- */
let lenis: Lenis | null = null;
if (!prefersReduced) {
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(hash: string) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: hash === "#top" ? 0 : -72, duration: 1.2 });
  else el.scrollIntoView({ behavior: "auto" });
}

/* ---------- Mobile menu: one button toggles open and closed ---------- */
const menu = document.getElementById("menu")!;
const menuBtn = document.getElementById("menu-btn")!;
const labelOpen = menuBtn.querySelector<HTMLElement>("[data-open]")!;
const labelClose = menuBtn.querySelector<HTMLElement>("[data-close]")!;
function setMenu(open: boolean) {
  menu.classList.toggle("is-open", open);
  menu.setAttribute("aria-hidden", String(!open));
  menuBtn.setAttribute("aria-expanded", String(open));
  labelOpen.hidden = open;
  labelClose.hidden = !open;
  if (open) lenis?.stop();
  else lenis?.start();
}
menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href") || "";
    if (hash.length < 2) return;
    e.preventDefault();
    setMenu(false);
    scrollToTarget(hash);
    history.replaceState(null, "", hash);
  });
});

/* ---------- Nav surface appears once the hero starts leaving (and stays at page end) ---------- */
const nav = document.getElementById("nav")!;
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => nav.classList.toggle("is-scrolled", self.scroll() > 24),
  onRefresh: (self) => nav.classList.toggle("is-scrolled", self.scroll() > 24),
});

/* ---------- Hero photo cascade: set the resting tilt of each print ---------- */
const prints = gsap.utils.toArray<HTMLElement>(".ph");
prints.forEach((el) => gsap.set(el, { rotation: Number(el.dataset.rot || 0) }));

/* ---------- Hero entrance: name -> claim -> proof -> action -> the person. Waits for the display font. ---------- */
if (prefersReduced) {
  gsap.set(".hero-anim", { visibility: "visible" });
} else {
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise<void>((r) => setTimeout(r, 800)),
  ]);
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
  tl.from(".hero .eyebrow", { y: 14, opacity: 0, duration: 0.8 }, 0.05)
    .from(".hero .line-inner", { yPercent: 112, duration: 1.25, stagger: 0.1 }, 0.1)
    .from(".hero-sub", { y: 18, opacity: 0, duration: 0.9 }, 0.55)
    .from(".hero-ctas > *", { y: 14, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.7);
  // Prints land back to front, each settling into its tilt.
  prints.forEach((el, i) => {
    const rot = Number(el.dataset.rot || 0);
    tl.from(
      el,
      { y: 56, opacity: 0, rotation: rot + (rot === 0 ? 3 : rot * 1.6), duration: 1.3, ease: "power4.out" },
      0.25 + i * 0.14,
    );
  });
  gsap.set(".hero-anim", { visibility: "visible" });
  fontsReady.then(() => tl.play());
}

/* ---------- Hero depth: prints drift a few pixels with the pointer, back layers more than front ---------- */
if (finePointer && !prefersReduced && prints.length) {
  const hero = document.querySelector<HTMLElement>(".hero")!;
  const movers = prints.map((el) => ({
    xTo: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
    yTo: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
    depth: el.classList.contains("ph-front") ? 6 : 14,
  }));
  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    movers.forEach((m) => {
      m.xTo(nx * m.depth);
      m.yTo(ny * m.depth);
    });
  });
  hero.addEventListener("mouseleave", () => movers.forEach((m) => (m.xTo(0), m.yTo(0))));
}

/* ---------- Section reveals: content enters as the reader reaches it ---------- */
const reveals = gsap.utils.toArray<HTMLElement>(".reveal");
if (!prefersReduced && reveals.length) {
  gsap.set(reveals, { y: 26, opacity: 0 });
  ScrollTrigger.batch(reveals, {
    start: "top 88%",
    once: true,
    onEnter: (els) =>
      gsap.to(els, { y: 0, opacity: 1, duration: 0.95, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---------- Work: sticky stack. Each project holds the frame until the next one arrives. ---------- */
const mm = gsap.matchMedia();
mm.add(
  { desktop: "(min-width: 901px)", noReduce: "(prefers-reduced-motion: no-preference)" },
  (ctx) => {
    const { desktop, noReduce } = ctx.conditions as { desktop: boolean; noReduce: boolean };
    if (!desktop || !noReduce) return;
    const cards = gsap.utils.toArray<HTMLElement>(".card");
    const TOP = 88;
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      const inner = card.querySelector<HTMLElement>(".card-inner")!;
      ScrollTrigger.create({
        trigger: card,
        start: `top ${TOP}px`,
        endTrigger: cards[cards.length - 1],
        end: `top ${TOP}px`,
        pin: true,
        pinSpacing: false,
      });
      // The card stays opaque; a scrim (CSS variable) dims it so the arriving card reads on top.
      gsap.to(inner, {
        scale: 0.93,
        "--dim": 0.72,
        ease: "none",
        scrollTrigger: {
          trigger: cards[i + 1],
          start: "top bottom",
          end: `top ${TOP}px`,
          scrub: true,
        },
      });
    });
  },
);

/* ---------- Experience: the rail fills as the timeline is read ---------- */
if (!prefersReduced) {
  gsap.to(".exp-rail-fill", {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: ".exp-list", start: "top 72%", end: "bottom 72%", scrub: 0.4 },
  });
}

/* ---------- Off the clock: the page holds while the photo strip walks past ---------- */
mm.add(
  { desktop: "(min-width: 901px)", noReduce: "(prefers-reduced-motion: no-preference)" },
  (ctx) => {
    const { desktop, noReduce } = ctx.conditions as { desktop: boolean; noReduce: boolean };
    if (!desktop || !noReduce) return;
    const section = document.querySelector<HTMLElement>(".offclock");
    const track = document.querySelector<HTMLElement>(".gallery-track");
    if (!section || !track) return;
    const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    // The pan distance depends on the prints' rendered widths; re-measure once they have decoded.
    Promise.all(Array.from(track.querySelectorAll("img")).map((img) => img.decode().catch(() => undefined))).then(() =>
      ScrollTrigger.refresh(),
    );
  },
);

/* ---------- Toolbox marquee: real brand marks, inlined at build time ---------- */
const LOGOS = [
  siPython,
  siTypescript,
  siOcaml,
  siCplusplus,
  siPostgresql,
  siThreedotjs,
  siLangchain,
  siLanggraph,
  siFastapi,
  siSupabase,
  siAnthropic,
  siClaude,
  siReact,
  siNextdotjs,
  siDocker,
  siGit,
  siGithub,
  siJupyter,
  siBlender,
  siVite,
];
const track = document.getElementById("marquee-track");
if (track) {
  const svgNS = "http://www.w3.org/2000/svg";
  const frag = document.createDocumentFragment();
  for (let rep = 0; rep < 2; rep++) {
    for (const icon of LOGOS) {
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", icon.title);
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", icon.path);
      svg.appendChild(path);
      frag.appendChild(svg);
    }
  }
  track.appendChild(frag);
}

/* ---------- Contact: the point field, in ink and cobalt on paper ---------- */
const canvas = document.getElementById("field") as HTMLCanvasElement | null;
if (canvas) {
  const handle = mountField(canvas, {
    reduced: prefersReduced,
    accent: [0.184, 0.333, 0.831],
    low: [0.78, 0.79, 0.84],
    hi: [0.2, 0.21, 0.26],
    alpha: 0.85,
  });
  if (!handle) canvas.remove();
}

/* ---------- Magnetic CTAs: feedback that the button is live ---------- */
if (finePointer && !prefersReduced) {
  document.querySelectorAll<HTMLElement>(".magnetic").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
    });
    el.addEventListener("mouseleave", () => {
      xTo(0);
      yTo(0);
    });
    el.addEventListener("pointerdown", () => gsap.to(el, { scale: 0.96, duration: 0.15, ease: "power2.out" }));
    const release = () => gsap.to(el, { scale: 1, duration: 0.35, ease: "power3.out" });
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  });
}

/* ---------- Keep trigger positions honest after fonts and images land ---------- */
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
