"""Screenshot every figurine slot at desktop and mobile widths for the critic loop.

Usage: python tools/shoot.py [out_dir] [desktop|mobile|both]
Requires the dev server on http://localhost:5199 (npx vite --port 5199).
"""
import asyncio
import os
import sys

from playwright.async_api import async_playwright

URL = "http://localhost:5199/"
OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
WHICH = sys.argv[2] if len(sys.argv) > 2 else "both"
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}


async def run(browser, name, w, h):
    ctx = await browser.new_context(
        viewport={"width": w, "height": h},
        device_scale_factor=1,
        is_mobile=(name == "mobile"),
        has_touch=(name == "mobile"),
    )
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on(
        "console",
        lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None,
    )
    await page.goto(URL, wait_until="load")
    await page.wait_for_timeout(1500)

    # Walk the page once so every slot requests its model, then wait for the loads.
    total = await page.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < total:
        await page.evaluate(f"window.scrollTo(0, {y})")
        await page.wait_for_timeout(120)
        y += int(h * 0.7)
    for _ in range(80):
        st = await page.evaluate("window.__figures ? window.__figures.state() : null")
        if st is None or st["loaded"] + st["failed"] >= st["total"]:
            break
        await page.wait_for_timeout(500)
    st = await page.evaluate("window.__figures ? window.__figures.state() : null")
    print(name, "figures:", st)

    keys = await page.evaluate("Array.from(document.querySelectorAll('.figure')).map(e => e.dataset.figure)")
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(2400)
    await page.screenshot(path=f"{OUT}/{name}-hero.png")
    for key in keys:
        if key == "wave":
            continue
        yy = await page.evaluate(
            """(key) => { const el = document.querySelector('.figure[data-figure="' + key + '"]');
                 const r = el.getBoundingClientRect();
                 return Math.max(0, window.scrollY + r.top - (innerHeight - r.height) / 2); }""",
            key,
        )
        await page.evaluate(f"window.scrollTo(0, {yy})")
        await page.wait_for_timeout(1800)
        await page.screenshot(path=f"{OUT}/{name}-{key}.png")

    # A walk down the page in viewport-sized steps, for context between the slots.
    total = await page.evaluate("document.documentElement.scrollHeight")
    y = 0
    i = 0
    while y < total:
        await page.evaluate(f"window.scrollTo(0, {y})")
        await page.wait_for_timeout(900)
        await page.screenshot(path=f"{OUT}/{name}-walk-{i:02d}.png")
        y += int(h * 0.85)
        i += 1
    print(name, "errors:", errors[:12] if errors else "none")
    await ctx.close()


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]
        )
        for name, (w, h) in VIEWPORTS.items():
            if WHICH != "both" and WHICH != name:
                continue
            await run(browser, name, w, h)
        await browser.close()


asyncio.run(main())
