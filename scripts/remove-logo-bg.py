"""Remove solid backgrounds from logo PNGs for transparent use in the app."""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("pip install pillow") from None

ROOT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "logos"


def remove_near_color(path: Path, out: Path, target: tuple[int, int, int], tolerance: int = 42) -> None:
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if (
                abs(r - target[0]) <= tolerance
                and abs(g - target[1]) <= tolerance
                and abs(b - target[2]) <= tolerance
            ):
                px[x, y] = (r, g, b, 0)
    img.save(out, "PNG", optimize=True)


def main() -> None:
    light_src = ROOT / "forex-plus-light-src.png"
    dark_src = ROOT / "forex-plus-dark-src.png"
    if light_src.exists():
        remove_near_color(light_src, ROOT / "forex-plus-light.png", (255, 255, 255), 40)
        print("Wrote", ROOT / "forex-plus-light.png")
    if dark_src.exists():
        # Dark navy background on image 1
        remove_near_color(dark_src, ROOT / "forex-plus-dark.png", (10, 15, 28), 55)
        print("Wrote", ROOT / "forex-plus-dark.png")


if __name__ == "__main__":
    main()
