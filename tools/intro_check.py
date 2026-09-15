"""Landing precision for the opening: the flyer's box must match the wordmark's on the last frame of the flight.

Usage: python tools/intro_check.py [out_dir]
Requires the dev server on http://localhost:5199. Writes <out_dir>/<name>-landing.png: the nav corner at 3x,
the frame before the swap above the frame after it. Prints the box offsets in px; anything over 1 px is a defect.
"""
import asyncio
import sys

from PIL import Image
from playwright.async_api import async_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
ARGS = ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]
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


async def run(browser, name, w, h):
    mobile = name == "mobile"
    ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=3, is_mobile=mobile, has_touch=mobile)
    page = await ctx.new_page()
    await page.goto("http://localhost:5199/", wait_until="load")
    await page.wait_for_function("window.__intro && window.__intro.time() > 0.2")
    m = await page.evaluate(MEASURE)
    print(name, {k: (round(v, 2) if isinstance(v, float) else v) for k, v in m.items()})
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


asyncio.run(main())
