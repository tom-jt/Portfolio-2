"""Bakes the moonlight scene's blur into images, so the browser never blurs a
whole screen live. Mirrors what PhotoScene's CSS used to do:

  photo:  blur 3px CSS, saturate 1.1                  -> moonlight-glass.webp
  frost:  a copy blurred 8px CSS, brightness 1.1,     -> moonlight-frost.webp
          saturate 0.8, seen through an elliptical       (with transparency, so
          edge mask (clear to 42%, 0.55 at 68%,           it can sit over the
          solid from 92%), and a pale edge tint           snow, as frost on the
          rgb(225 238 255 / 0.16) from 48% outwards       glass does)

The frost's grain isn't baked: baked into a 2000 px photo it goes soft on a
sharp screen, so it stays a tile drawn at the screen's own resolution
(frost-grain.png, the old SVG noise rendered at 2x).

The photo box is about 1600 CSS px wide on a typical screen and the image is
2000 px, so 1 CSS px is about 1.25 image px. Needs numpy and Pillow:

  python scripts/bake-frost.py .
"""
import sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

root = sys.argv[1]
scenes = f"{root}/public/home/scenes"
src = Image.open(f"{scenes}/moonlight.webp").convert("RGB")
W, H = src.size
PX = 1.25


def ramp(t, stops):
    xs, ys = zip(*stops)
    return np.interp(t, xs, ys)


# Distance along a farthest-corner ellipse at the centre, as a CSS radial
# gradient measures it: 0 in the middle, 1 at the corners.
y, x = np.mgrid[0:H, 0:W]
t = np.sqrt(
    ((x + 0.5 - W / 2) / (W / 2 * np.sqrt(2))) ** 2
    + ((y + 0.5 - H / 2) / (H / 2 * np.sqrt(2))) ** 2
)

photo = ImageEnhance.Color(src.filter(ImageFilter.GaussianBlur(3 * PX))).enhance(1.1)
photo.save(f"{scenes}/moonlight-glass.webp", quality=88, method=6)

frost = src.filter(ImageFilter.GaussianBlur(8 * PX))
frost = ImageEnhance.Color(ImageEnhance.Brightness(frost).enhance(1.1)).enhance(0.8)
edge = ramp(t, [(0, 0), (0.42, 0), (0.68, 0.55), (0.92, 1), (2, 1)])[..., None]
tint_a = ramp(t, [(0, 0), (0.48, 0), (1, 0.16), (2, 0.16)])[..., None]
tint = np.array([225, 238, 255], np.float32) / 255

# Frost over the photo, then the tint over that, as one layer: colour and
# alpha such that drawing it over the photo gives what the two did.
fr = np.asarray(frost, np.float32) / 255
alpha = 1 - (1 - edge) * (1 - tint_a)
colour = (fr * edge * (1 - tint_a) + tint * tint_a) / np.maximum(alpha, 1e-6)
rgba = np.concatenate([np.clip(colour, 0, 1), alpha], axis=2)
Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").save(
    f"{scenes}/moonlight-frost.webp", quality=88, method=6
)
print("baked")
