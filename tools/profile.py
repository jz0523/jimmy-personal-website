"""Check that no figurine's shadow is cut by its slot or by the render margin.

Reads shots/<view>-rects.json (written by tools/shoot.py). A scissor cut can only happen on the
boundary of the render rect, which is the slot plus its margin (PAD in src/figures.ts), and before
the margin existed it happened on the slot's own edge. So for each figure shot this measures the
mean darkness of the rows and columns within 3 px of those four lines (slot bottom, margin bottom,
slot left, margin left) and reports the largest single-step change.

A page edge that happens to sit on one of those lines (a card top, a photo frame) would step too,
so every step is compared with the same line measured in a reference band outside the render rect,
where the figure cannot draw. A step that the reference band shares is content, not a cut.

Usage: python tools/profile.py [desktop|mobile] [shots_dir]
"""
import json
import sys

from PIL import Image

VIEW = sys.argv[1] if len(sys.argv) > 1 else "desktop"
OUT = sys.argv[2] if len(sys.argv) > 2 else "shots"
PAD_X, PAD_TOP, PAD_BOTTOM = 0.22, 0.12, 0.22
LIMIT = 20
REACH = 3
BAND = 48


def darkness(px, x, y):
    return 255 - px[x, y]


def row_step(px, W, H, y_line, x0, x1):
    x0, x1 = max(0, x0), min(W, x1)
    if x1 - x0 < 4:
        return (y_line, 0.0)
    rows = {}
    for y in range(max(0, y_line - REACH), min(H, y_line + REACH + 1)):
        rows[y] = sum(darkness(px, x, y) for x in range(x0, x1)) / (x1 - x0)
    ys = sorted(rows)
    if len(ys) < 2:
        return (y_line, 0.0)  # the line is off the screenshot; nothing to cut
    return max(((ys[i], abs(rows[ys[i]] - rows[ys[i + 1]])) for i in range(len(ys) - 1)), key=lambda t: t[1])


def col_step(px, W, H, x_line, y0, y1):
    y0, y1 = max(0, y0), min(H, y1)
    if y1 - y0 < 4:
        return (x_line, 0.0)
    cols = {}
    for x in range(max(0, x_line - REACH), min(W, x_line + REACH + 1)):
        cols[x] = sum(darkness(px, x, y) for y in range(y0, y1)) / (y1 - y0)
    xs = sorted(cols)
    if len(xs) < 2:
        return (x_line, 0.0)
    return max(((xs[i], abs(cols[xs[i]] - cols[xs[i + 1]])) for i in range(len(xs) - 1)), key=lambda t: t[1])


rects = json.load(open(f"{OUT}/{VIEW}-rects.json", encoding="utf-8"))
worst = 0.0
for key, (left, top, width, height) in rects.items():
    name = "hero" if key == "wave" else key
    im = Image.open(f"{OUT}/{VIEW}-{name}.png").convert("L")
    W, H = im.size
    px = im.load()
    l, t, w, h = int(left), int(top), int(width), int(height)
    ml, mr = int(left - width * PAD_X), int(left + width * (1 + PAD_X))
    mt, mb = int(top - height * PAD_TOP), int(top + height * (1 + PAD_BOTTOM))
    y0, y1 = t + int(h * 0.4), t + h

    lines = [
        ("slot bottom", "row", t + h),
        ("margin bottom", "row", mb),
        ("slot left", "col", l),
        ("margin left", "col", ml),
    ]
    for label, kind, pos in lines:
        if kind == "row":
            at, step = row_step(px, W, H, pos, l, l + w)
            ref = max(row_step(px, W, H, pos, ml - BAND, ml - 6)[1], row_step(px, W, H, pos, mr + 6, mr + BAND)[1])
        else:
            at, step = col_step(px, W, H, pos, y0, y1)
            # A frame or card edge runs through the slot's upper rows too, where no shadow can be.
            ref = max(
                col_step(px, W, H, pos, mt - BAND, mt - 6)[1],
                col_step(px, W, H, pos, mb + 6, mb + BAND)[1],
                col_step(px, W, H, pos, t, t + int(h * 0.4))[1],
            )
        content = step > LIMIT and ref >= step * 0.5
        cut = step > LIMIT and not content
        if cut:
            worst = max(worst, step)
        note = "  <-- CUT" if cut else ("  (page edge, reference band steps too)" if content else "")
        print(f"{VIEW} {name:9s} {label:14s} at {at:4d}  step {step:5.1f}  ref {ref:5.1f}{note}")
print("WORST CUT", round(worst, 1), "PASS" if worst <= LIMIT else "FAIL")
