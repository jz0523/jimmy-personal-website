"""Capture the opening animation as a frame sequence, for the critic loop.

Usage: python tools/intro_shoot.py [out_dir] [desktop|mobile|both]
Requires the dev server on http://localhost:5199 (npx vite --port 5199).

Writes, per viewport:
  <name>-intro-NN_<ms>.png   frames from first paint through the hero entrance (fresh session);
                             <ms> is the real elapsed time when the capture began
  <name>-sheet.png           the same frames tiled, oldest first
  <name>-revisit.png         a reload in the same session: the opening must not replay
  <name>-reduced.png         prefers-reduced-motion: the opening must be skipped
  <name>-hash.png            landing on /#work: the opening must be skipped
"""
import asyncio
import os
import sys
import time

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

URL = "http://localhost:5199/"
OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
WHICH = sys.argv[2] if len(sys.argv) > 2 else "both"
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}
TIMES = [0, 120, 250, 400, 550, 700, 850, 1000, 1150, 1300, 1450, 1600, 1800, 2000, 2300, 2600, 3000, 3600, 4400]
ARGS = ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]


def sheet(files, out, cols=5, scale=0.3):
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


def watch(page, errors):
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on(
        "console",
        lambda m: errors.append(f"console.{m.type}: {m.text[:160]}")
        if m.type in ("error", "warning") and "WebGLProgram" not in m.text
        else None,
    )


async def run(browser, name, w, h):
    mobile = name == "mobile"
    base = dict(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
    errors = []

    # Warm the dev server's module transforms so the timed run measures the page, not Vite.
    ctx = await browser.new_context(**base)
    page = await ctx.new_page()
    await page.goto(URL, wait_until="load")
    await page.wait_for_timeout(1500)
    await ctx.close()

    # Fresh session: the opening plays.
    ctx = await browser.new_context(**base)
    page = await ctx.new_page()
    watch(page, errors)
    t0 = time.perf_counter()
    await page.goto(URL, wait_until="commit")
    files = []
    for i, t in enumerate(TIMES):
        now = (time.perf_counter() - t0) * 1000
        if t > now:
            await page.wait_for_timeout(t - now)
        # The name carries the real elapsed time; a screenshot itself costs 50 to 300 ms, so targets drift.
        ms = int((time.perf_counter() - t0) * 1000)
        f = f"{OUT}/{name}-intro-{i:02d}_{ms}ms.png"
        await page.screenshot(path=f)
        files.append(f)
    sheet(files, f"{OUT}/{name}-sheet.png")
    state = await page.evaluate("document.documentElement.className")
    scrollable = await page.evaluate("getComputedStyle(document.documentElement).overflow")
    print(name, "html class after intro:", state, "| html overflow:", scrollable)

    # Same session, reload: no replay.
    t0 = time.perf_counter()
    await page.reload(wait_until="commit")
    await page.wait_for_timeout(max(0, 350 - (time.perf_counter() - t0) * 1000))
    await page.screenshot(path=f"{OUT}/{name}-revisit.png")
    await ctx.close()

    # Reduced motion: skipped entirely.
    ctx = await browser.new_context(**base, reduced_motion="reduce")
    page = await ctx.new_page()
    watch(page, errors)
    t0 = time.perf_counter()
    await page.goto(URL, wait_until="commit")
    await page.wait_for_timeout(max(0, 350 - (time.perf_counter() - t0) * 1000))
    await page.screenshot(path=f"{OUT}/{name}-reduced.png")
    await ctx.close()

    # Deep link: skipped, page lands on the section.
    ctx = await browser.new_context(**base)
    page = await ctx.new_page()
    watch(page, errors)
    await page.goto(URL + "#work", wait_until="load")
    await page.wait_for_timeout(1200)
    await page.screenshot(path=f"{OUT}/{name}-hash.png")
    await ctx.close()

    print(name, "errors:", errors[:12] if errors else "none")


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=ARGS)
        for name, (w, h) in VIEWPORTS.items():
            if WHICH != "both" and WHICH != name:
                continue
            await run(browser, name, w, h)
        await browser.close()


asyncio.run(main())
