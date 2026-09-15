"""Clip the opening's cobalt columns at six points of their arrival and withdrawal, for the critic loop.

Usage: python tools/intro_frame.py [out_dir]
Requires the dev server on http://localhost:5199 (npx vite --port 5199).

The six points are chosen by how much of the panel the columns cover, not by elapsed time, so an
accelerating ease cannot hide its worst state between two samples.

Writes <out_dir>/<viewport>-frame-N_<what>.png (the lockup cropped to the frame plus a margin,
enlarged 2x so the hairline is legible), <viewport>-frame-sheet.png (the six tiled) and
<viewport>-full-closed.png (the closed frame on the whole sheet, for the composition). The
timeline is paused and seeked, so these are exact states, not samples of a recording. The page is
captured at device scale 1: at 2 the two WebGL canvases stall for minutes under software GL.
"""
import os
import sys

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

URL = "http://localhost:5199/"
OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
ARGS = ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]
BOX = """() => {
  const f = document.querySelector('.intro-cols').getBoundingClientRect();
  return [f.left, f.top, f.width, f.height].map(Math.round);
}"""


def sheet(files, out, cols=3, scale=0.5):
    ims = [Image.open(f).convert("RGB") for f in files]
    w, h = ims[0].size
    tw, th = int(w * scale), int(h * scale)
    rows = (len(ims) + cols - 1) // cols
    img = Image.new("RGB", (cols * tw, rows * (th + 18)), "white")
    d = ImageDraw.Draw(img)
    for i, (im, f) in enumerate(zip(ims, files)):
        x, y = (i % cols) * tw, (i // cols) * (th + 18)
        img.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 18))
        d.text((x + 4, y + 2), os.path.basename(f), fill="black")
    img.save(out)


DRAWN = """t => {
  window.__intro.time(t);
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
  return cover();
}"""


def seek_to_drawn(page, t_lo, t_hi, target):
    """The time between t_lo and t_hi at which the given fraction of the frame is on the page."""
    lo, hi = min(t_lo, t_hi), max(t_lo, t_hi)
    rising = page.evaluate(DRAWN, hi) > page.evaluate(DRAWN, lo)
    for _ in range(24):
        mid = (lo + hi) / 2
        drawn = page.evaluate(DRAWN, mid)
        if (drawn < target) == rising:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def run(browser, name, w, h):
    ctx = browser.new_context(
        viewport={"width": w, "height": h}, is_mobile=(name == "mobile"), has_touch=(name == "mobile")
    )
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_function("window.__intro && window.__intro.time() > 0.2")
    # A bare "window.__intro.pause()" returns the timeline, and serializing that graph crashes the renderer.
    page.evaluate("() => { window.__intro.pause(); }")
    labels = page.evaluate(
        "() => { const l = window.__intro.labels; return { drawing: l.drawing, framed: l.framed, retrace: l.retrace, flight: l.flight }; }"
    )
    draw = labels["framed"] - labels["drawing"]
    undraw = labels["flight"] - labels["retrace"]
    # Sample by how much line is on the page, not by elapsed time: under an accelerating ease the
    # two are far apart, and the states that read worst are the ones no equal-time sample lands on.
    steps = [
        ("0_draw25", seek_to_drawn(page, labels["drawing"], labels["framed"], 0.25)),
        ("1_draw60", seek_to_drawn(page, labels["drawing"], labels["framed"], 0.60)),
        ("2_closed", labels["framed"]),
        # Stop just short of the flight label: seeking onto it fires the callback that takes the name
        # out of the flow, which collapses the lockup and every box measured afterwards.
        ("3_undraw40", seek_to_drawn(page, labels["flight"] - 0.002, labels["retrace"], 0.60)),
        ("4_undraw80", seek_to_drawn(page, labels["flight"] - 0.002, labels["retrace"], 0.20)),
        ("5_flight", labels["flight"]),
    ]
    page.evaluate("t => { window.__intro.time(t); }", labels["framed"])
    x, y, bw, bh = page.evaluate(BOX)
    clip = {"x": max(0, x - 30), "y": max(0, y - 30), "width": min(w, bw + 60), "height": bh + 60}
    # The closed panel on the whole sheet, for the composition. Taken before the steps: the last step
    # seeks onto the flight label, whose callback takes the name out of the flow for good.
    page.wait_for_timeout(60)
    page.screenshot(path=f"{OUT}/{name}-full-closed.png")
    files = []
    for label, t in steps:
        page.evaluate("t => { window.__intro.time(t); }", t)
        page.wait_for_timeout(60)
        f = f"{OUT}/{name}-frame-{label}.png"
        page.screenshot(path=f, clip=clip)
        im = Image.open(f)
        im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(f)
        files.append(f)
    sheet(files, f"{OUT}/{name}-frame-sheet.png", scale=0.5 if name == "desktop" else 0.8)
    print(
        name, "frame box:", [bw, bh],
        "| draw", round(draw, 3), "s | shut", round(labels["retrace"] - labels["framed"], 3),
        "s | retrace", round(undraw, 3), "s",
    )
    ctx.close()


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(args=ARGS)
        run(browser, "desktop", 1440, 900)
        run(browser, "mobile", 390, 844)
        browser.close()


main()
