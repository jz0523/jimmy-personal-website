"""Four checks on the opening, at both viewports.

0. The columns: they must cover the whole panel at the `panel` label and be fully withdrawn when
   the flight begins, so the decoration never overlaps the name's journey to the nav.
1. The greeting's exit: stepping the timeline from the flight's start to 0.4 s in at 1/60 s, the
   greeting must have zero opacity whenever its box and the flyer's box intersect (the name must not
   fly through visible text). Reports the worst step as opacity x overlap area.
2. The seam: 0.5 s into the flight the cover must be transparent and the hero's first headline line
   must already be rising (translateY under 100% of its height), so the handoff happens in view.
3. Landing precision: the flyer's box must match the wordmark's on the last frame of the flight.

Usage: python tools/intro_check.py [out_dir]
Requires the dev server on http://localhost:5199. Writes <out_dir>/<name>-landing.png: the nav corner at 3x,
the frame before the swap above the frame after it. Prints the worst greeting overlap, the seam values and
the box offsets in px; a non-zero overlap score, a cover with alpha, a line still at or below 100%, or an
offset over 1 px is a defect, and the script exits 1 so it can gate a commit.
"""
import asyncio
import sys

from PIL import Image
from playwright.async_api import async_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
ARGS = ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]
FRAME = """() => {
  const tl = window.__intro; tl.pause();
  const cover = () => {
    const cols = Array.from(document.querySelectorAll('.intro-col'));
    if (!cols.length) return 0;
    let sum = 0;
    for (const c of cols) {
      const v = (getComputedStyle(c).clipPath.match(/-?[\\d.]+(?=%)/g) || []).map(Number);
      const [t, , b] = v.length === 4 ? v : v.length === 3 ? v : v.length === 2 ? [v[0], v[1], v[0]] : [v[0] || 0, 0, v[0] || 0];
      sum += Math.max(0, 100 - t - b) / 100;
    }
    return sum / cols.length;
  };
  tl.time(tl.labels.panel);
  const closed = { coverage: +cover().toFixed(3) };
  tl.time(tl.labels.flight - 0.001); // just short of the label, whose callback takes the panel away
  return { closed, atFlight: { coverage: +cover().toFixed(3) } };
}"""
SWEEP = """() => {
  const tl = window.__intro; tl.pause();
  const g = document.querySelector('.intro-greet'), n = document.querySelector('.intro-name-inner');
  let worst = { t: 0, opacity: 0, overlap: 0, score: 0 };
  for (let i = 0; i <= 24; i++) {
    const d = i / 60;
    tl.time(tl.labels.flight + d);
    const a = g.getBoundingClientRect(), b = n.getBoundingClientRect();
    const op = parseFloat(getComputedStyle(g).opacity);
    const dy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const dx = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const score = op * dy * dx;
    if (score > worst.score) worst = { t: +d.toFixed(3), opacity: +op.toFixed(2), overlap: Math.round(dy * dx), score: Math.round(score) };
  }
  return worst;
}"""
SEAM = """() => {
  const tl = window.__intro; tl.pause();
  tl.time(tl.labels.flight + 0.5); // callbacks fire on the way: prepare() and the hero's play()
  const cover = getComputedStyle(document.getElementById('intro')).backgroundColor;
  const line = document.querySelector('.hero .line-inner');
  const m = new DOMMatrixReadOnly(getComputedStyle(line).transform);
  return { cover, lineRisePct: Math.round(100 - (m.m42 / line.getBoundingClientRect().height) * 100) };
}"""
MEASURE = """() => {
  const tl = window.__intro; tl.pause();
  const end = tl.labels.flight + 0.8;
  tl.time(end - 0.0001);
  const a = document.querySelector('.intro-name-inner').getBoundingClientRect();
  const b = document.querySelector('.wordmark').getBoundingClientRect();
  const cs = getComputedStyle(document.querySelector('.intro-name-inner'));
  return { dl: a.left - b.left, dt: a.top - b.top, dw: a.width - b.width, dh: a.height - b.height,
           flyer: [a.left, a.top, a.width, a.height], wordmark: [b.left, b.top, b.width, b.height],
           weight: cs.fontWeight, fvs: cs.fontVariationSettings, ls: cs.letterSpacing };
}"""


FAILURES = []


async def run(browser, name, w, h):
    mobile = name == "mobile"
    ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=3, is_mobile=mobile, has_touch=mobile)
    page = await ctx.new_page()
    await page.goto("http://localhost:5199/", wait_until="load")
    await page.wait_for_function("window.__intro && window.__intro.time() > 0.2")
    frame = await page.evaluate(FRAME)
    print(name, "columns:", frame)
    if frame["closed"]["coverage"] < 0.999:
        FAILURES.append(f"{name}: the columns do not cover the panel at its label ({frame['closed']})")
    if frame["atFlight"]["coverage"] > 0.001:
        FAILURES.append(f"{name}: the columns have not withdrawn when the flight begins ({frame['atFlight']})")
    sweep = await page.evaluate(SWEEP)
    print(name, "greeting worst overlap:", sweep)
    if sweep["score"] > 0:
        FAILURES.append(f"{name}: the name flies through the visible greeting (score {sweep['score']})")
    seam = await page.evaluate(SEAM)
    await page.wait_for_timeout(400)  # the hero runs in real time once its play() has fired; its line tween begins at 0.1 s
    seam["lineRisePct"] = await page.evaluate("""() => { const line = document.querySelector('.hero .line-inner');
      const m = new DOMMatrixReadOnly(getComputedStyle(line).transform);
      return Math.round(100 - (m.m42 / line.getBoundingClientRect().height) * 100); }""")
    print(name, "seam:", seam)
    if seam["cover"] != "rgba(0, 0, 0, 0)":
        FAILURES.append(f"{name}: the cover paints a background mid-flight ({seam['cover']})")
    if seam["lineRisePct"] <= 0:
        FAILURES.append(f"{name}: the headline is not rising mid-flight ({seam['lineRisePct']}%)")
    m = await page.evaluate(MEASURE)
    print(name, {k: (round(v, 2) if isinstance(v, float) else v) for k, v in m.items()})
    if max(abs(m[k]) for k in ("dl", "dt", "dw", "dh")) > 1:
        FAILURES.append(f"{name}: the landing is off by more than 1 px")
    clip = {"x": 0, "y": 0, "width": min(w, 360), "height": 64}
    await page.screenshot(path=f"{OUT}/{name}-before.png", clip=clip)
    await page.evaluate("window.__intro.time(window.__intro.labels.flight + 0.8 + 0.001)")
    await page.wait_for_timeout(50)
    await page.screenshot(path=f"{OUT}/{name}-after.png", clip=clip)
    a = Image.open(f"{OUT}/{name}-before.png")
    b = Image.open(f"{OUT}/{name}-after.png")
    img = Image.new("RGB", (a.width, a.height * 2 + 6), "red")
    img.paste(a, (0, 0))
    img.paste(b, (0, a.height + 6))
    img.save(f"{OUT}/{name}-landing.png")
    await ctx.close()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=ARGS)
        await run(browser, "desktop", 1440, 900)
        await run(browser, "mobile", 390, 844)
        await browser.close()
    if FAILURES:
        print("FAILED:", *FAILURES, sep="\n  ")
        sys.exit(1)
    print("all checks passed")


asyncio.run(main())
