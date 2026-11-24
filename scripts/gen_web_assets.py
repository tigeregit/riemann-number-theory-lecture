#!/usr/bin/env python3
"""Generate transparent PNG figures for the web lecture from tex/data/*.dat.

Run from the repo root:  python3 scripts/gen_web_assets.py
Uses only the Python standard library + Pillow (no matplotlib needed).
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "web", "assets")
os.makedirs(OUT, exist_ok=True)
S = 2  # supersampling for antialiasing


def canvas(w, h):
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def sc(d, pts, color, width=2, dash=None):
    """Draw a polyline given (x, y) in canvas coordinates (already scaled)."""
    p = [(int(x * S), int(y * S)) for x, y in pts]
    if not dash:
        d.line(p, fill=color, width=width * S, joint="curve")
        return
    # simple dashed polyline
    on = True
    for (x0, y0), (x1, y1) in zip(p, p[1:]):
        length = math.hypot(x1 - x0, y1 - y0)
        if length == 0:
            continue
        n = max(1, int(length / (dash * S)))
        for i in range(n):
            if on:
                a = i / n
                b = min(1, (i + 0.55) / n)
                d.line([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a),
                        (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)],
                       fill=color, width=width * S)
            on = not on


def axes(d, box, color=(130, 135, 150, 190)):
    x0, y0, x1, y1 = box
    d.line([(x0 * S, y1 * S), (x1 * S, y1 * S)], fill=color, width=S)
    d.line([(x0 * S, y0 * S), (x0 * S, y1 * S)], fill=color, width=S)


def prime_density():
    W, H = 900, 420
    im, d = canvas(W, H)
    box = (62, 22, W - 18, H - 40)
    data = []
    for line in open(os.path.join(ROOT, "tex", "data", "pi_li.dat")):
        if line.startswith("#"):
            continue
        x, pi, li, xl = line.split()
        data.append((int(x), int(pi), float(li), float(xl)))
    xmax, ymax = 100000, 10000
    X = lambda x: box[0] + (box[2] - box[0]) * x / xmax
    Y = lambda y: box[3] - (box[3] - box[1]) * y / ymax
    for gx in range(0, xmax + 1, 20000):
        d.line([(X(gx) * S, box[1] * S), (X(gx) * S, box[3] * S)],
               fill=(120, 125, 140, 55), width=S)
    for gy in range(0, ymax + 1, 2000):
        d.line([(box[0] * S, Y(gy) * S), (box[2] * S, Y(gy) * S)],
               fill=(120, 125, 140, 55), width=S)
    axes(d, box)
    sc(d, [(X(x), Y(pi)) for x, pi, _, _ in data], (59, 130, 246, 255), 3)
    sc(d, [(X(x), Y(li)) for x, _, li, _ in data], (239, 68, 68, 235), 2, dash=9)
    sc(d, [(X(x), Y(xl)) for x, _, _, xl in data], (16, 185, 129, 220), 2, dash=3)
    for x in (0, 20000, 40000, 60000, 80000, 100000):
        d.text((X(x) * S - 10, (box[3] + 8) * S), str(x // 1000) + "k",
               fill=(140, 145, 160, 220))
    for y in (0, 2000, 4000, 6000, 8000, 10000):
        d.text(((box[0] - 34) * S, (Y(y) - 6) * S), str(y),
               fill=(140, 145, 160, 220))
    im.resize((W, H), Image.LANCZOS).save(os.path.join(OUT, "prime-density.png"))


def zeta_real():
    W, H = 900, 420
    im, d = canvas(W, H)
    box = (62, 22, W - 18, H - 40)
    pts_left, pts_right = [], []
    for line in open(os.path.join(ROOT, "tex", "data", "zeta_real.dat")):
        if line.startswith("#"):
            continue
        s, z = map(float, line.split())
        (pts_left if s < 1 else pts_right).append((s, z))
    xmin, xmax, ymin, ymax = -4, 4, -3, 5
    X = lambda x: box[0] + (box[2] - box[0]) * (x - xmin) / (xmax - xmin)
    Y = lambda y: box[3] - (box[3] - box[1]) * (y - ymin) / (ymax - ymin)
    for gx in range(-4, 5):
        d.line([(X(gx) * S, box[1] * S), (X(gx) * S, box[3] * S)],
               fill=(120, 125, 140, 55), width=S)
    for gy in range(-2, 6):
        d.line([(box[0] * S, Y(gy) * S), (box[2] * S, Y(gy) * S)],
               fill=(120, 125, 140, 55), width=S)
    axes(d, box)
    d.line([(X(1) * S, box[1] * S), (X(1) * S, box[3] * S)],
           fill=(239, 68, 68, 170), width=2 * S)
    for x in range(-4, 5):
        d.text((X(x) * S - 4, (box[3] + 8) * S), str(x),
               fill=(140, 145, 160, 220))
    for y in range(-2, 6):
        d.text(((box[0] - 30) * S, (Y(y) - 6) * S), str(y),
               fill=(140, 145, 160, 220))
    sc(d, [(X(s), Y(min(max(z, ymin), ymax))) for s, z in pts_left],
       (59, 130, 246, 255), 3)
    sc(d, [(X(s), Y(min(max(z, ymin), ymax))) for s, z in pts_right],
       (59, 130, 246, 255), 3)
    for n in (-2, -4):
        d.ellipse([(X(n) * S - 4, Y(0) * S - 4), (X(n) * S + 4, Y(0) * S + 4)],
                  fill=(239, 68, 68, 255))
    d.ellipse([(X(0) * S - 4, Y(-0.5) * S - 4), (X(0) * S + 4, Y(-0.5) * S + 4)],
              fill=(245, 158, 11, 255))
    im.resize((W, H), Image.LANCZOS).save(os.path.join(OUT, "zeta-real.png"))


if __name__ == "__main__":
    prime_density()
    zeta_real()
    print("wrote", os.listdir(OUT))
