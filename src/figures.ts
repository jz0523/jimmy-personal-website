/*
  Five poses of one figurine, each drawn into the rect of a `.figure[data-figure]` slot.
  One fixed, transparent canvas and one WebGL context serve every slot: each slot owns a
  scene, a camera, a key light and a shadow catcher, and is rendered with a scissor so
  nothing outside its rect is touched. Slots that are off screen cost nothing.

  Motion: scrolling turns the figure on its base (like turning a figurine on a desk), the
  pointer makes it look toward the cursor, and a click spins it once. Under reduced motion
  the figures still render, but hold still.
*/
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Spec = {
  file: string;
  /** Top of the plinth, as a fraction of the model height. Everything below it is clipped away. */
  base: number;
  /** Resting turn in radians. Positive turns the figure's front toward screen right. */
  yaw: number;
  /** Fraction of the slot height the figure fills. */
  fit: number;
  /** Camera elevation above the figure's mid-height, radians. */
  elev: number;
};

// Plinth heights were measured in Blender from the largest up-facing face area near the floor.
const SPECS: Record<string, Spec> = {
  wave: { file: "models/wave.glb", base: 0.064, yaw: 0.12, fit: 0.9, elev: 0.16 },
  laptop: { file: "models/laptop.glb", base: 0.087, yaw: -0.4, fit: 0.9, elev: 0.22 },
  present: { file: "models/present.glb", base: 0.048, yaw: 0.3, fit: 0.92, elev: 0.14 },
  cat: { file: "models/cat.glb", base: 0.072, yaw: -0.18, fit: 0.9, elev: 0.17 },
  farewell: { file: "models/farewell.glb", base: 0.051, yaw: 0.25, fit: 0.92, elev: 0.12 },
};

/** A radial falloff for the contact blob under each figure. */
function makeBlobTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(22, 23, 28, 0.6)");
  grad.addColorStop(0.45, "rgba(22, 23, 28, 0.22)");
  grad.addColorStop(1, "rgba(22, 23, 28, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const FOV = 26;
const SCROLL_TURN = -0.55; // radians of turn across the slot's trip through the viewport
const LOOK_TURN = 0.3; // how far the figure turns toward the pointer
const LOOK_TILT = 0.09; // how far the camera drops or rises with the pointer
const SWAY = 0.035; // idle sway amplitude

type Slot = {
  key: string;
  el: HTMLElement;
  spec: Spec;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  blob: THREE.Mesh;
  model: THREE.Object3D | null;
  footprint: number;
  requested: boolean;
  progress: number;
  intro: number;
  introPlayed: boolean;
  spin: number;
  look: number;
  lookTarget: number;
  tilt: number;
  tiltTarget: number;
  phase: number;
  delay: number;
  last: string;
};

export type FiguresHandle = {
  state(): { total: number; loaded: number; failed: number };
};

export function mountFigures(opts: { reduced: boolean; finePointer: boolean }): FiguresHandle | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(".figure[data-figure]")).filter(
    (el) => SPECS[el.dataset.figure || ""],
  );
  if (!els.length) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "figures-canvas";
  canvas.setAttribute("aria-hidden", "true");
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  document.body.appendChild(canvas);
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  // Keeps y >= 0.0005 in world space: the plinth ends up below zero and disappears.
  const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.0005);
  const blobTex = makeBlobTexture();
  const blobGeo = new THREE.PlaneGeometry(1, 1);

  const slots: Slot[] = els.map((el, i) => {
    const key = el.dataset.figure!;
    const spec = SPECS[key];
    const scene = new THREE.Scene();
    scene.environment = env;
    scene.environmentIntensity = 0.85;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20);
    const root = new THREE.Group();
    scene.add(root);
    const light = new THREE.DirectionalLight(0xffffff, 2.4);
    light.position.set(1.4, 3.2, 2.2);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    const sc = light.shadow.camera;
    sc.left = -0.9;
    sc.right = 0.9;
    sc.top = 0.9;
    sc.bottom = -0.9;
    sc.near = 0.5;
    sc.far = 8;
    light.shadow.bias = -0.0003;
    light.shadow.normalBias = 0.03;
    light.shadow.radius = 7;
    light.shadow.blurSamples = 12;
    scene.add(light, light.target);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.ShadowMaterial({ color: 0x16171c, opacity: 0.13 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    // A soft contact blob under the footprint keeps the figure seated on the paper where the key light's shadow falls away.
    const blob = new THREE.Mesh(
      blobGeo,
      new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.32, toneMapped: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.0008;
    blob.renderOrder = -1;
    root.add(blob);
    return {
      key,
      el,
      spec,
      scene,
      camera,
      root,
      blob,
      model: null,
      footprint: 0.7,
      requested: false,
      progress: 0.5,
      intro: opts.reduced ? 1 : 0,
      introPlayed: false,
      spin: 0,
      look: 0,
      lookTarget: 0,
      tilt: 0,
      tiltTarget: 0,
      phase: i * 1.7,
      delay: Number(el.dataset.delay || 0),
      last: "",
    };
  });

  /* ---------- Loading: what is near loads first; the rest follows in page order ---------- */
  let loaded = 0;
  let failed = 0;
  const queue: Slot[] = [];
  let busy = false;
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
  const eager = !window.matchMedia("(max-width: 900px)").matches && !saveData;

  function attach(s: Slot, obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const k = 1 / size.y;
    obj.scale.setScalar(k);
    obj.position.set(-((box.min.x + box.max.x) / 2) * k, -box.min.y * k - s.spec.base, -((box.min.z + box.max.z) / 2) * k);
    s.footprint = Math.max(size.x, size.z) * k;
    s.blob.scale.set(size.x * k * 1.25, size.z * k * 1.25, 1);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        mat.clippingPlanes = [clip];
        mat.clipShadows = true;
      }
    });
    s.root.add(obj);
    s.model = obj;
    s.el.classList.add("is-ready");
  }

  function pump() {
    if (busy) return;
    const s = queue.shift();
    if (!s) return;
    busy = true;
    loader.load(
      s.spec.file,
      (gltf) => {
        attach(s, gltf.scene);
        loaded++;
        busy = false;
        if (eager && loaded === 1) slots.forEach((o) => request(o, false));
        pump();
      },
      undefined,
      () => {
        failed++;
        s.el.classList.add("is-missing");
        busy = false;
        pump();
      },
    );
  }

  function request(s: Slot, urgent: boolean) {
    if (s.requested) return;
    s.requested = true;
    if (urgent) queue.unshift(s);
    else queue.push(s);
    pump();
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const s = slots.find((x) => x.el === e.target);
        if (s) request(s, true);
      }
    },
    { rootMargin: "50% 0px 50% 0px" },
  );
  slots.forEach((s) => io.observe(s.el));

  /* ---------- Inputs: scroll progress, pointer, click ---------- */
  slots.forEach((s) => {
    ScrollTrigger.create({
      trigger: s.el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => (s.progress = self.progress),
      onRefresh: (self) => (s.progress = self.progress),
    });
    s.el.addEventListener("click", () => {
      if (!s.model) return;
      gsap.to(s, { spin: `+=${Math.PI * 2}`, duration: 1.4, ease: "power3.inOut" });
    });
  });

  let px = -1;
  let py = -1;
  if (opts.finePointer && !opts.reduced) {
    window.addEventListener(
      "pointermove",
      (e) => {
        px = e.clientX;
        py = e.clientY;
      },
      { passive: true },
    );
    document.documentElement.addEventListener("mouseleave", () => {
      px = -1;
      py = -1;
    });
  }

  function playIntro(s: Slot) {
    s.introPlayed = true;
    if (opts.reduced) {
      s.intro = 1;
      return;
    }
    gsap.to(s, { intro: 1, duration: 1.15, delay: s.delay, ease: "back.out(1.35)" });
  }

  /* ---------- Frame: only slots on screen are placed and drawn ---------- */
  let cw = 0;
  let ch = 0;
  let lastTime = 0;
  const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  function frame(time: number) {
    const dt = Math.min(0.05, lastTime ? time - lastTime : 0.016);
    lastTime = time;
    if (document.hidden) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let dirty = false;
    if (vw !== cw || vh !== ch) {
      cw = vw;
      ch = vh;
      renderer.setSize(vw, vh, false);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      dirty = true;
    }
    const visible: Array<{ s: Slot; r: DOMRect }> = [];
    for (const s of slots) {
      if (!s.model) continue;
      const r = s.el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= vh || r.width < 4 || r.height < 4) {
        if (s.last) {
          s.last = "";
          dirty = true;
        }
        continue;
      }
      if (!s.introPlayed) playIntro(s);

      if (px >= 0) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.45;
        s.lookTarget = THREE.MathUtils.clamp((px - cx) / (vw * 0.5), -1, 1) * LOOK_TURN;
        s.tiltTarget = THREE.MathUtils.clamp((py - cy) / (vh * 0.5), -1, 1) * LOOK_TILT;
      } else {
        s.lookTarget = 0;
        s.tiltTarget = 0;
      }
      const k = 1 - Math.exp(-dt * 5);
      s.look += (s.lookTarget - s.look) * k;
      s.tilt += (s.tiltTarget - s.tilt) * k;

      const sway = opts.reduced ? 0 : Math.sin(time * 0.7 + s.phase) * SWAY;
      const scrollTurn = opts.reduced ? 0 : (s.progress - 0.5) * SCROLL_TURN;
      const yaw = s.spec.yaw + scrollTurn + s.look + sway + s.spin + (1 - s.intro) * -1.2;
      const scale = Math.max(0.001, s.intro);
      s.root.rotation.y = yaw;
      s.root.scale.setScalar(scale);

      const aspect = r.width / r.height;
      const h = 1 - s.spec.base;
      const d = Math.max(h / s.spec.fit / 2 / halfTan, s.footprint / s.spec.fit / 2 / (halfTan * aspect));
      const el = s.spec.elev - s.tilt;
      const ty = h * 0.5;
      s.camera.aspect = aspect;
      s.camera.updateProjectionMatrix();
      s.camera.position.set(0, ty + d * Math.sin(el), d * Math.cos(el));
      s.camera.lookAt(0, ty, 0);

      const sig = `${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0},${yaw.toFixed(3)},${scale.toFixed(3)},${s.tilt.toFixed(3)}`;
      if (sig !== s.last) {
        s.last = sig;
        dirty = true;
      }
      visible.push({ s, r });
    }
    if (!dirty) return;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const { s, r } of visible) {
      const x = r.left;
      const y = vh - r.bottom;
      renderer.setViewport(x, y, r.width, r.height);
      renderer.setScissor(x, y, r.width, r.height);
      renderer.render(s.scene, s.camera);
    }
  }
  gsap.ticker.add(frame);
  canvas.addEventListener("webglcontextrestored", () => {
    slots.forEach((s) => (s.last = ""));
    cw = 0;
  });

  return { state: () => ({ total: slots.length, loaded, failed }) };
}
