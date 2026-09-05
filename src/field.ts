/*
  Contact backdrop: a WebGL point field shaped like a slowly drifting coastline.
  ~19k points, one draw call, height from value noise in the vertex shader.
  Points near "sea level" pick up the page accent, the way a shoreline contour
  would on a risk map. The pointer lifts the surface where it hovers.
*/

type Vec3 = [number, number, number];

const VERT = `
attribute vec2 aPos;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uDpr;
uniform mat4 uProj;
uniform mat4 uView;
varying float vH;
varying float vDepth;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = aPos;
  float t = uTime * 0.05;
  float h = fbm(p * 1.9 + vec2(t, t * 0.55)) - 0.48;
  h += 0.04 * sin(p.x * 5.0 + uTime * 0.7 + p.y * 2.0);
  float d = distance(p, uMouse);
  h += uMouseStrength * 0.22 * exp(-d * d * 14.0);
  vH = h;
  vec4 world = vec4(p.x * 2.0, h * 0.55, p.y * 2.3, 1.0);
  vec4 view = uView * world;
  vDepth = -view.z;
  gl_Position = uProj * view;
  gl_PointSize = uDpr * (2.0 + 1.1 * clamp(h * 2.0, 0.0, 1.0)) * (3.8 / vDepth);
}
`;

const FRAG = `
precision mediump float;
uniform vec3 uAccent;
uniform vec3 uLow;
uniform vec3 uHi;
uniform float uAlpha;
varying float vH;
varying float vDepth;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c);
  if (r > 0.25) discard;
  float soft = smoothstep(0.25, 0.1, r);
  vec3 col = mix(uLow, uHi, smoothstep(-0.18, 0.34, vH));
  float band = smoothstep(0.035, 0.0, abs(vH - 0.04));
  col = mix(col, uAccent, band * 0.95);
  float fog = smoothstep(8.5, 2.4, vDepth);
  float a = uAlpha * soft * (0.36 + 0.64 * fog) * (0.55 + 0.45 * smoothstep(-0.3, 0.2, vH));
  gl_FragColor = vec4(col * a, a);
}
`;

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}
function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function lookAt(eye: Vec3, center: Vec3, up: Vec3) {
  const f = normalize([center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]]);
  const s = normalize(cross(f, up));
  const u = cross(s, f);
  const m = new Float32Array(16);
  m[0] = s[0]; m[4] = s[1]; m[8] = s[2];
  m[1] = u[0]; m[5] = u[1]; m[9] = u[2];
  m[2] = -f[0]; m[6] = -f[1]; m[10] = -f[2];
  m[12] = -dot(s, eye);
  m[13] = -dot(u, eye);
  m[14] = dot(f, eye);
  m[15] = 1;
  return { m, s, u, f };
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export interface FieldHandle {
  destroy(): void;
}

export interface FieldOptions {
  reduced: boolean;
  accent: Vec3;
  low: Vec3;
  hi: Vec3;
  alpha?: number;
}

export function mountField(canvas: HTMLCanvasElement, opts: FieldOptions): FieldHandle | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // Grid of points in [-1, 1]^2
  const NX = 170;
  const NY = 112;
  const pts = new Float32Array(NX * NY * 2);
  let k = 0;
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      pts[k++] = (i / (NX - 1)) * 2 - 1;
      pts[k++] = (j / (NY - 1)) * 2 - 1;
    }
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {
    time: gl.getUniformLocation(prog, "uTime"),
    mouse: gl.getUniformLocation(prog, "uMouse"),
    mouseStrength: gl.getUniformLocation(prog, "uMouseStrength"),
    dpr: gl.getUniformLocation(prog, "uDpr"),
    proj: gl.getUniformLocation(prog, "uProj"),
    view: gl.getUniformLocation(prog, "uView"),
    accent: gl.getUniformLocation(prog, "uAccent"),
    low: gl.getUniformLocation(prog, "uLow"),
    hi: gl.getUniformLocation(prog, "uHi"),
    alpha: gl.getUniformLocation(prog, "uAlpha"),
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.uniform3f(u.accent, opts.accent[0], opts.accent[1], opts.accent[2]);
  gl.uniform3f(u.low, opts.low[0], opts.low[1], opts.low[2]);
  gl.uniform3f(u.hi, opts.hi[0], opts.hi[1], opts.hi[2]);
  gl.uniform1f(u.alpha, opts.alpha ?? 1);

  const FOV = (38 * Math.PI) / 180;
  const eye: Vec3 = [0.15, 1.45, 2.9];
  const center: Vec3 = [0, 0.02, -0.4];
  const cam = lookAt(eye, center, [0, 1, 0]);
  gl.uniformMatrix4fv(u.view, false, cam.m);

  let dpr = 1;
  let aspect = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    aspect = W / H;
    gl!.viewport(0, 0, W, H);
    gl!.uniformMatrix4fv(u.proj, false, perspective(FOV, aspect, 0.1, 20));
    gl!.uniform1f(u.dpr, dpr);
  }

  // Pointer, mapped onto the y = 0 plane
  const mouse = { x: 99, y: 99, tx: 99, ty: 99, s: 0, ts: 0 };
  function pointerToPlane(clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((clientY - r.top) / r.height) * 2 - 1);
    const t = Math.tan(FOV / 2);
    const dv: Vec3 = [nx * t * aspect, ny * t, 1];
    const dir = normalize([
      cam.s[0] * dv[0] + cam.u[0] * dv[1] + cam.f[0] * dv[2],
      cam.s[1] * dv[0] + cam.u[1] * dv[1] + cam.f[1] * dv[2],
      cam.s[2] * dv[0] + cam.u[2] * dv[1] + cam.f[2] * dv[2],
    ]);
    if (dir[1] >= 0) return null;
    const tt = -eye[1] / dir[1];
    const x = eye[0] + dir[0] * tt;
    const z = eye[2] + dir[2] * tt;
    return [x / 2.0, z / 2.3] as const;
  }
  const onMove = (e: PointerEvent) => {
    const p = pointerToPlane(e.clientX, e.clientY);
    if (!p) return;
    mouse.tx = p[0];
    mouse.ty = p[1];
    mouse.ts = 1;
  };
  const onLeave = () => {
    mouse.ts = 0;
  };
  if (!opts.reduced) {
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
  }

  let raf = 0;
  let running = false;
  let start = performance.now();
  function frame(now: number) {
    const t = (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.s += (mouse.ts - mouse.s) * 0.08;
    gl!.uniform1f(u.time, t);
    gl!.uniform2f(u.mouse, mouse.x, mouse.y);
    gl!.uniform1f(u.mouseStrength, mouse.s);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.POINTS, 0, NX * NY);
    if (running) raf = requestAnimationFrame(frame);
  }
  function play() {
    if (running || opts.reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (opts.reduced) frame(start + 4000);
  });
  ro.observe(canvas);
  resize();

  if (opts.reduced) {
    frame(start + 4000);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? play() : pause()));
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
  }

  return {
    destroy() {
      pause();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    },
  };
}
