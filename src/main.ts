import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  siPython,
  siTypescript,
  siOpenjdk,
  siOcaml,
  siCplusplus,
  siHtml5,
  siOpengl,
  siLatex,
  siLanggraph,
  siPytorch,
  siTensorflow,
  siScikitlearn,
  siHuggingface,
  siLangchain,
  siRedis,
  siSupabase,
  siPostgresql,
  siDocker,
  siLinux,
  siGit,
  siPandas,
  siNumpy,
  siQgis,
  siThreedotjs,
  siReact,
  siFastapi,
  siWebgl,
  siBlender,
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

/* ---------- Hero headline rotation: four claims, each backed by a section below ---------- */
const HEADLINES: Array<[string, string, string]> = [
  ["I build AI systems", "for ", "real users."],
  ["I build worlds", "you can ", "walk into."],
  ["I turn research", "into ", "real products."],
  ["I ship software", "people ", "pay for."],
];
const lineInners = gsap.utils.toArray<HTMLElement>(".hero .line-inner");
function setHeadline(i: number) {
  const [a, b, c] = HEADLINES[i];
  lineInners[0].textContent = a;
  lineInners[1].textContent = b;
  const em = document.createElement("em");
  em.className = "accent";
  em.textContent = c;
  lineInners[1].appendChild(em);
}
let headlineIndex = 0;
let headlineTimer: gsap.core.Tween | null = null;
let heroInView = true;
function scheduleHeadline(delay = 4) {
  headlineTimer?.kill();
  if (prefersReduced || lineInners.length < 2) return;
  headlineTimer = gsap.delayedCall(delay, swapHeadline);
}
function swapHeadline() {
  if (document.hidden || !heroInView) return; // resumes from the visibility handlers
  const next = (headlineIndex + 1) % HEADLINES.length;
  gsap
    .timeline({
      onComplete: () => {
        headlineIndex = next;
        scheduleHeadline();
      },
    })
    .to(lineInners, { yPercent: -112, duration: 0.55, ease: "power3.in", stagger: 0.07 })
    .add(() => setHeadline(next))
    .fromTo(lineInners, { yPercent: 112 }, { yPercent: 0, duration: 0.95, ease: "power4.out", stagger: 0.09 });
}
if (!prefersReduced && lineInners.length === 2) {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleHeadline(1.5);
  });
  new IntersectionObserver(
    (entries) => {
      heroInView = entries[0].isIntersecting;
      if (heroInView) scheduleHeadline(1.5);
    },
    { threshold: 0.2 },
  ).observe(document.querySelector(".hero .h1")!);
}

/* ---------- Hero entrance: name -> claim -> proof -> action -> the person. Waits for the display font. ---------- */
if (prefersReduced) {
  gsap.set(".hero-anim", { visibility: "visible" });
} else {
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise<void>((r) => setTimeout(r, 800)),
  ]);
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power4.out" },
    onComplete: () => scheduleHeadline(3.2),
  });
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

/* ---------- Research and awards: seals keep turning, the winner's clock counts up, tenure bars fill ---------- */
const recognition = document.querySelector<HTMLElement>(".recognition");
if (recognition && !prefersReduced) {
  gsap.utils.toArray<SVGGElement>(".seal-spin").forEach((g, i) => {
    gsap.to(g, { rotation: i % 2 ? -360 : 360, transformOrigin: "50% 50%", duration: 70, ease: "none", repeat: -1 });
  });
  // On top of the slow spin, the scroll itself turns the rings.
  gsap.to(".seal-ring", {
    rotation: 110,
    ease: "none",
    scrollTrigger: { trigger: recognition, start: "top bottom", end: "bottom top", scrub: 0.8 },
  });
  const core = recognition.querySelector<HTMLElement>("[data-count]");
  if (core) {
    const target = Number(core.dataset.count || 0);
    const suffix = core.dataset.suffix || "";
    const state = { v: 0 };
    core.textContent = `0${suffix}`;
    ScrollTrigger.create({
      trigger: core,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(state, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => (core.textContent = `${Math.round(state.v)}${suffix}`),
        }),
    });
  }
  const fills = gsap.utils.toArray<HTMLElement>(".tenure-fill");
  if (fills.length) {
    gsap.set(fills, { scaleX: 0 });
    ScrollTrigger.create({
      trigger: ".tile-roster",
      start: "top 80%",
      once: true,
      onEnter: () => gsap.to(fills, { scaleX: 1, duration: 1.2, ease: "power3.out", stagger: 0.1 }),
    });
  }
}

/* ---------- Toolbox: brand marks inlined at build time, tiles pop in, then lean toward the pointer ---------- */
const ICONS: Record<string, { title: string; path: string }> = {
  python: siPython,
  typescript: siTypescript,
  java: siOpenjdk,
  ocaml: siOcaml,
  cplusplus: siCplusplus,
  html5: siHtml5,
  opengl: siOpengl,
  latex: siLatex,
  langgraph: siLanggraph,
  pytorch: siPytorch,
  tensorflow: siTensorflow,
  scikitlearn: siScikitlearn,
  huggingface: siHuggingface,
  langchain: siLangchain,
  redis: siRedis,
  supabase: siSupabase,
  postgresql: siPostgresql,
  docker: siDocker,
  linux: siLinux,
  git: siGit,
  pandas: siPandas,
  numpy: siNumpy,
  qgis: siQgis,
  threejs: siThreedotjs,
  react: siReact,
  fastapi: siFastapi,
  webgl: siWebgl,
  blender: siBlender,
};
const tools = gsap.utils.toArray<HTMLElement>(".tool");
const svgNS = "http://www.w3.org/2000/svg";
tools.forEach((el) => {
  const icon = ICONS[el.dataset.icon || ""];
  if (!icon) return;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", icon.path);
  svg.appendChild(path);
  el.prepend(svg);
});
const wallItems = gsap.utils.toArray<HTMLElement>(".tool-row h3, .tool");
if (prefersReduced) {
  tools.forEach((el) => el.classList.add("is-in"));
} else if (wallItems.length) {
  gsap.set(wallItems, { y: 14, opacity: 0, scale: 0.92 });
  ScrollTrigger.batch(wallItems, {
    start: "top 92%",
    once: true,
    onEnter: (els) =>
      gsap.to(els, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.6)",
        stagger: 0.03,
        overwrite: true,
        clearProps: "transform",
        onComplete: () => els.forEach((el) => el.classList.add("is-in")),
      }),
  });
}
const wall = document.getElementById("tool-wall");
if (wall && finePointer && !prefersReduced && tools.length) {
  let px = 0;
  let py = 0;
  let inside = false;
  let queued = false;
  const RADIUS = 220;
  const apply = () => {
    queued = false;
    for (const el of tools) {
      const r = el.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      const k = inside ? Math.max(0, 1 - Math.hypot(dx, dy) / RADIUS) : 0;
      el.style.setProperty("--lift", (k * k).toFixed(3));
    }
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };
  wall.addEventListener("mousemove", (e) => {
    px = e.clientX;
    py = e.clientY;
    inside = true;
    queue();
  });
  wall.addEventListener("mouseleave", () => {
    inside = false;
    queue();
  });
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
