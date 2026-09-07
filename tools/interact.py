"""Drive the hero figurine with mouse moves, a click and a scroll, and clip six frames.

Usage: python tools/interact.py out_dir
Requires the dev server on http://localhost:5199. Tile the clips with ffmpeg hstack to review them at once.
"""
import asyncio, sys
from playwright.async_api import async_playwright
OUT = sys.argv[1]
CLIP = {"x": 740, "y": 470, "width": 300, "height": 320}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto("http://localhost:5199/", wait_until="load")
        for _ in range(60):
            st = await page.evaluate("window.__figures ? window.__figures.state() : null")
            if st and st["loaded"] >= 1:
                break
            await page.wait_for_timeout(250)
        await page.mouse.move(720, 450)
        await page.wait_for_timeout(2800)
        await page.screenshot(path=f"{OUT}/i1_rest.png", clip=CLIP)
        await page.mouse.move(60, 860, steps=8)
        await page.wait_for_timeout(1100)
        await page.screenshot(path=f"{OUT}/i2_left_bottom.png", clip=CLIP)
        await page.mouse.move(1400, 60, steps=8)
        await page.wait_for_timeout(1100)
        await page.screenshot(path=f"{OUT}/i3_right_top.png", clip=CLIP)
        await page.mouse.move(720, 450, steps=8)
        await page.wait_for_timeout(700)
        await page.click(".figure-hero")
        await page.wait_for_timeout(450)
        await page.screenshot(path=f"{OUT}/i4_spin_mid.png", clip=CLIP)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{OUT}/i5_spin_done.png", clip=CLIP)
        await page.hover(".figure-hero")
        await page.wait_for_timeout(180)
        await page.screenshot(path=f"{OUT}/i7_greet.png", clip=CLIP)
        await page.wait_for_timeout(1200)
        await page.mouse.move(720, 450, steps=4)
        await page.wait_for_timeout(600)
        await page.evaluate("window.scrollTo(0, 320)")
        await page.wait_for_timeout(1000)
        c2 = dict(CLIP); c2["y"] = CLIP["y"] - 320
        await page.screenshot(path=f"{OUT}/i6_scrolled.png", clip=c2)
        print("state", await page.evaluate("window.__figures.state()"), "errors", errs)
        await b.close()
asyncio.run(main())
