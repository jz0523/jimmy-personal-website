"""Capture the opening animation as a real-time frame sequence, for the critic loop.

Usage: python tools/intro_shoot.py [out_dir] [desktop|mobile|both]
Requires the dev server on http://localhost:5199 (npx vite --port 5199), or set SITE_URL to another
origin (the preview server, say). Needs ffmpeg on PATH.

The opening is recorded as video (Playwright's screencast, which does not stall the page the way a
screenshot does) and frames are cut from it every 150 ms, so what a frame shows is what a visitor
saw at that moment. Writes, per viewport:
  <name>-intro-NN_<ms>ms.png   frames from navigation start through the settled hero (fresh session);
                               <ms> is the time since the recording began, which is a few dozen ms
                               before navigation
  <name>-sheet.png             the same frames tiled, oldest first
  <name>-revisit.png           a reload in the same session: the opening must not replay
  <name>-reduced.png           prefers-reduced-motion: the opening must be skipped
  <name>-hash.png              landing on /#work: the opening must be skipped
"""
import asyncio
import glob
import os
import shutil
import subprocess
import sys
import time

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

URL = os.environ.get("SITE_URL", "http://localhost:5199/")
OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
WHICH = sys.argv[2] if len(sys.argv) > 2 else "both"
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}
STEP_MS = 150
SPAN_MS = 4500
ARGS = ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]


def sheet(files, out, cols, scale):
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
        if m.type in ("error", "warning") and "WebGLProgram" not in m.text and "_vercel/insights" not in m.text
        else None,
    )


def cut_frames(video, name, w, h):
    for old in glob.glob(f"{OUT}/{name}-intro-*.png"):
        os.remove(old)
    tmp = f"{OUT}/{name}-tmp-%03d.png"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-vf", f"fps=1000/{STEP_MS},scale={w}:{h}",
         "-frames:v", str(SPAN_MS // STEP_MS + 1), tmp],
        check=True,
    )
    files = []
    for i, f in enumerate(sorted(glob.glob(f"{OUT}/{name}-tmp-*.png"))):
        dst = f"{OUT}/{name}-intro-{i:02d}_{i * STEP_MS}ms.png"
        os.replace(f, dst)
        files.append(dst)
    return files


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

    # Fresh session, recorded: the opening plays.
    vdir = f"{OUT}/video-{name}"
    shutil.rmtree(vdir, ignore_errors=True)
    ctx = await browser.new_context(**base, record_video_dir=vdir, record_video_size={"width": w, "height": h})
    page = await ctx.new_page()
    watch(page, errors)
    await page.goto(URL, wait_until="load")
    await page.wait_for_timeout(SPAN_MS + 300)
    state = await page.evaluate("document.documentElement.className")
    scrollable = await page.evaluate("getComputedStyle(document.documentElement).overflow")
    print(name, "html class after intro:", state, "| html overflow:", scrollable)

    # Same session, reload: no replay.
    t0 = time.perf_counter()
    await page.reload(wait_until="commit")
    await page.wait_for_timeout(max(0, 350 - (time.perf_counter() - t0) * 1000))
    await page.screenshot(path=f"{OUT}/{name}-revisit.png")
    video = page.video
    await ctx.close()
    files = cut_frames(await video.path(), name, w, h)
    sheet(files, f"{OUT}/{name}-sheet.png", cols=6, scale=0.22 if name == "desktop" else 0.3)
    shutil.rmtree(vdir, ignore_errors=True)

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
