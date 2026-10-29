"""Bakes the alpine hill as seen through a rainy window, so the browser never
blurs a whole screen live (see bake-frost.py for the moonlight's):

  photo:   blur 6px CSS, saturate 1.05, with the  -> alps-glass.webp
           trees filled in behind (see below)
  trees:   each stand of trees cut from that      -> alps-trees-<n>.webp
           photo with a soft edge, to sway
  clouds:  clouds of fractal noise, shaded and    -> alps-cloud-<kind>.webp
           blurred to match, to sail across

The trees are cut by darkness, from the sharp photo: they're the darkest
thing on the hill. Behind them the photo is filled in with what's round
them, drawn inward, so a tree leaning in the wind uncovers grass and
hillside rather than a ghost of itself. Their boxes (in % of the photo)
must match ALPS_TREES in PhotoScene.tsx; the clouds are its CloudSail.

The photo box is about 1600 CSS px wide on a typical screen and the image is
3200 px, so 1 CSS px is about 2 image px. Needs numpy and Pillow:

  python scripts/bake-glass.py .          (everything)
  python scripts/bake-glass.py . clouds   (just the clouds)
"""
import sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

root = sys.argv[1]
parts = sys.argv[2:] or ["photo", "clouds"]
scenes = f"{root}/public/home/scenes"
src = Image.open(f"{scenes}/alps.webp").convert("RGB")
W, H = src.size
PX = W / 1600
BLUR = 6

# x0, y0, x1, y1 in % of the photo; and the darkness that counts as tree.
TREES = [
    (0, 48, 16.5, 66, 40),
    (23, 52, 39, 68.5, 40),
    (44.5, 53.5, 57.5, 71.5, 40),
    (56.5, 66.5, 65, 79.5, 40),
    (69.5, 62.5, 100, 84.5, 30),
]

def smear(a, radius):
    return np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(radius)), np.float32)


def pull(a, size):
    """A float array resized, one channel at a time."""
    chans = a if a.ndim == 3 else a[..., None]
    out = [np.asarray(Image.fromarray(np.ascontiguousarray(chans[..., c]), "F").resize(size, Image.BILINEAR)) for c in range(chans.shape[2])]
    return np.dstack(out) if a.ndim == 3 else out[0]


def fill_holes(img, keep):
    """Fills where `keep` is 0 with what's round it: averaged down to ever
    coarser copies, counting only what's kept, then each hole filled from
    the copy one level coarser on the way back up (push-pull)."""
    h, w = keep.shape
    if min(h, w) <= 4:
        return img
    size = (max(1, w // 2), max(1, h // 2))
    weight = pull(keep, size)
    small = pull(img * keep[..., None], size) / np.maximum(weight, 1e-6)[..., None]
    small = fill_holes(small, np.clip(weight * 4, 0, 1))
    up = pull(small, (w, h))
    return img * keep[..., None] + up * (1 - keep[..., None])


if "photo" in parts:
    glass = ImageEnhance.Color(src.filter(ImageFilter.GaussianBlur(BLUR * PX))).enhance(1.05)
    g = np.asarray(glass, np.float32)

    lum = np.asarray(src.convert("L"), np.float32)
    hole = np.zeros((H, W), np.float32)
    for n, (x0, y0, x1, y1, dark) in enumerate(TREES):
        box = tuple(round(v) for v in (x0 / 100 * W, y0 / 100 * H, x1 / 100 * W, y1 / 100 * H))
        tree = (lum[box[1] : box[3], box[0] : box[2]] < dark).astype(np.uint8) * 255
        # Grown a little past the trunks and needles, then softened, so the cut
        # takes the blurred halo round each tree along with it.
        mask = Image.fromarray(tree).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(5 * PX))
        m = np.asarray(mask, np.float32) / 255
        # Faded out towards the sides and top of the box, so its edge never shows.
        h, w = m.shape
        fx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / (0.15 * w), 0, 1)
        fy = np.clip(np.arange(h) / (0.12 * h), 0, 1)
        if x0 == 0:
            fx[: w // 2] = 1
        if x1 == 100:
            fx[w // 2 :] = 1
        m *= fy[:, None] * fx[None, :]
        rgba = np.dstack([g[box[1] : box[3], box[0] : box[2]].astype(np.uint8), (m * 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(f"{scenes}/alps-trees-{n}.webp", quality=88, method=6)
        # Only the trees' cores are filled in behind, so at rest, with the cut
        # over it, the photo looks as it did.
        core = np.clip((m - 0.3) / 0.6, 0, 1)
        region = hole[box[1] : box[3], box[0] : box[2]]
        np.maximum(region, core, out=region)

    # What's round the trees, drawn in to fill them.
    keep = 1 - hole
    out = fill_holes(g, keep)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(f"{scenes}/alps-glass.webp", quality=88, method=6)


def noise(w, h, seed, scale, octaves=6, stretch=1.0):
    """Fractal value noise, 0 to 1: grids of random values, each finer one
    smoothly upscaled and added at half the weight of the one before."""
    rng = np.random.default_rng(seed)
    total = np.zeros((h, w), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, int(w / scale * 2**o / stretch))
        gh = max(2, int(h / scale * 2**o))
        grid = (rng.random((gh, gw)) * 255).astype(np.uint8)
        layer = np.asarray(Image.fromarray(grid).resize((w, h), Image.BICUBIC), np.float32) / 255
        total += layer * amp
        norm += amp
        amp *= 0.5
    # Spread to a steady contrast, whatever the octaves added up to.
    total /= norm
    return np.clip((total - total.mean()) / total.std() * 0.18 + 0.5, 0, 1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def cloud(name, w, h, seed, scale, shape, density, lit, shade, shown, opacity=1.0, stretch=1.0):
    """A cloud: noise thresholded inside an outline, so its edge is ragged,
    lit white on top and shaded underneath where it's thickest. `shown` is
    about how wide it appears, in CSS px, so it can be blurred to match."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    u, v = x / w, y / h
    n = noise(w, h, seed, scale, stretch=stretch)
    # The outline only roughs it out; the noise heaps it up into billows and
    # tears its edges. Nothing reaches the edge of the image.
    border = smoothstep(0, 0.08, np.minimum(u, 1 - u)) * smoothstep(0, 0.1, np.minimum(v, 1 - v))
    body = smoothstep(*density, shape(u, v) * 0.7 + (n - 0.5) * 1.3) * border
    # Grey underneath and in the folds between billows, white where the sun
    # catches the tops.
    folds = np.clip((0.62 - n) * 2.2, 0, 1)
    under = np.clip(smoothstep(0.3, 1, v) * 0.8 + folds * 0.6, 0, 1) * body
    colour = np.array(lit, np.float32) * (1 - under[..., None]) + np.array(shade, np.float32) * under[..., None]
    rgba = np.dstack([colour, body * opacity * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    # Soft as the view behind the glass. Blurred premultiplied, so the edges
    # don't darken.
    r, gr, b, a = [np.asarray(c, np.float32) for c in im.split()]
    k = BLUR * w / shown
    pa = smear(a.astype(np.uint8), k)
    rgb = [smear((c * a / 255).astype(np.uint8), k) / np.maximum(pa / 255, 1e-3) for c in (r, gr, b)]
    out = np.dstack([np.clip(c, 0, 255) for c in rgb] + [pa]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(f"{scenes}/alps-cloud-{name}.webp", quality=90, method=6)


if "clouds" in parts:
    # A heaped cumulus: a flat base and a rounded, billowing top.
    cloud(
        "heap", 1100, 600, 3, 200,
        lambda u, v: np.clip(1 - ((u - 0.5) / 0.42) ** 2 - ((v - 0.86) / 0.72) ** 2, 0, 1) * smoothstep(0.92, 0.78, v),
        (0.32, 0.62), (255, 255, 255), (178, 190, 210), shown=380, opacity=0.72,
    )
    # A smaller puff, broken at the edges, thinner than the heap.
    cloud(
        "puff", 760, 400, 11, 130,
        lambda u, v: np.clip(1 - ((u - 0.5) / 0.4) ** 2 - ((v - 0.78) / 0.62) ** 2, 0, 1) * smoothstep(0.9, 0.74, v),
        (0.38, 0.68), (255, 255, 255), (186, 197, 215), shown=190, opacity=0.55,
    )
    # A long thin streak of high cloud, the noise drawn out sideways.
    cloud(
        "streak", 1600, 260, 17, 110,
        lambda u, v: np.clip(1 - ((u - 0.5) / 0.44) ** 2 - ((v - 0.5) / 0.36) ** 2, 0, 1),
        (0.22, 0.62), (250, 252, 255), (215, 225, 240), shown=640, opacity=0.6, stretch=4,
    )
    # Low cloud trailing along the valley: grey and ragged.
    cloud(
        "mist", 1600, 320, 23, 150,
        lambda u, v: np.clip(1 - ((u - 0.5) / 0.44) ** 2 - ((v - 0.55) / 0.38) ** 2, 0, 1),
        (0.35, 0.85), (226, 232, 238), (188, 198, 208), shown=560, opacity=0.28, stretch=3,
    )
print("baked")
