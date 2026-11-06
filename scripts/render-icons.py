"""Icônes PNG de l'enquête. Pillow est nécessaire pour relancer le script."""

from PIL import Image, ImageDraw

PINE = (20, 61, 54)
CREAM = (243, 239, 230)
LEAF = (31, 122, 98)


def draw_icon(size: int, maskable: bool) -> Image.Image:
    image = Image.new("RGB", (size, size), PINE)
    draw = ImageDraw.Draw(image)
    scale = 0.30 if maskable else 0.36
    radius = size * scale
    center = size / 2
    draw.ellipse((center - radius, center - radius, center + radius, center + radius), fill=CREAM)
    pin = size * (0.078 if maskable else 0.095)
    px = center
    py = center - pin * 0.35
    draw.ellipse((px - pin, py - pin, px + pin, py + pin), fill=LEAF)
    draw.polygon(
        [(px - pin * 0.86, py + pin * 0.15), (px + pin * 0.86, py + pin * 0.15), (px, py + pin * 2.15)],
        fill=LEAF,
    )
    dot = pin * 0.38
    draw.ellipse((px - dot, py - dot, px + dot, py + dot), fill=CREAM)
    return image


def main() -> None:
    targets = {
        "public/app-icon-192.png": (192, False),
        "public/app-icon-512.png": (512, False),
        "public/app-icon-maskable-192.png": (192, True),
        "public/app-icon-maskable-512.png": (512, True),
        "public/apple-touch-icon.png": (180, False),
    }
    for path, (size, maskable) in targets.items():
        draw_icon(size, maskable).save(path, "PNG")


if __name__ == "__main__":
    main()
