"""DeutschStep — learn 5 words, then a quiz (5 s think + 2 s answer). Alpine theme (since 2026-11-02):
sunny Alpine landscape background, wooden sign boards, navy text with red highlights, an icon (Twemoji) for every
word, big "deutschstep.com" header with a German-flag brush stroke, "Lerne Deutsch mit deutschstep.com!" banner.
usage: render.py --timing content.json | render.py content.json out.mp4 music.wav
"""
import subprocess, sys, math, json, os, io, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
TWEMOJI = os.environ.get("TWEMOJI_DIR", os.path.join(HERE, "assets", "twemoji"))
POP = "/usr/share/fonts/truetype/google-fonts/Poppins-{}.ttf"
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
KALAM = os.path.join(HERE, "assets", "fonts", "kalam-latin-700-normal.woff")
_fc = {}
def F(w, s):
    """w: Bold, Medium, Regular, Italic, BoldItalic, MediumItalic, Black, Hand"""
    k = (w, s)
    if k not in _fc:
        if w == "Hand": p = KALAM
        elif w == "Black": p = INTER.format("Black")
        else: p = POP.format(w)
        if not os.path.exists(p): p = INTER.format({"Italic": "Medium", "BoldItalic": "Bold", "MediumItalic": "Medium"}.get(w, "Bold"))
        _fc[k] = ImageFont.truetype(p, s)
    return _fc[k]

NAVY, RED, DRED = (22, 28, 58), (205, 22, 30), (160, 10, 20)
GOLD, BLACK, WHITE = (255, 206, 0), (20, 20, 20), (255, 255, 255)
INK2 = (60, 62, 80)                     # secondary text on wood
GREEN, GREEN_L = (34, 160, 70), (205, 240, 200)
BRASS, BRASS_D = (196, 150, 60), (130, 92, 30)
L, R = 70, W - 70
LET = "ABCD"

# ---------------- content ----------------
def _tokens(sentence):
    out = []
    for k, part in enumerate(sentence.split("*")):
        if part: out.append((part, k % 2))
    return out

def load_content(path):
    c = json.load(open(path, encoding="utf-8"))
    items = c["verbs"]; N = len(items)
    assert 4 <= N <= 10, "need 4-10 items"
    V = [dict(verb=v["verb"], en=v["en"], tag=v["tag"], ex=_tokens(v["example"]), tr=v["translation"],
              emoji=v.get("emoji", "")) for v in items]
    rng = random.Random(c.get("seed", 1))
    order = list(range(N)); rng.shuffle(order)
    QZ = []
    for qi, vi in enumerate(order):
        ok = qi % 4
        others = [j for j in range(N) if j != vi]; rng.shuffle(others)
        opts = [V[j]["verb"] for j in others[:3]]; opts.insert(ok, V[vi]["verb"])
        QZ.append((V[vi]["en"], opts, ok, vi))
    rng.shuffle(QZ)
    return c.get("level", "B1"), c.get("kind", "verbs"), V, QZ

LEVEL, KIND, V, QZ = "B1", "verbs", [], []
KINDS = {"verbs": ("verbs", "verb"), "prep_verbs": ("verbs", "verb"), "nouns": ("nouns", "word"),
         "adjectives": ("adjectives", "word"), "words": ("words", "word")}
def kw(): return KINDS.get(KIND, KINDS["verbs"])

T_INTRO, LEARN, QINTRO, THINK, SHOW = 4.0, 7.0, 2.6, 5.0, 2.0
SEG = THINK + SHOW
def set_timing(n):
    global NV, T_QINTRO, T_QUIZ, T_OUTRO, END
    NV = n; T_QINTRO = T_INTRO + LEARN * n; T_QUIZ = T_QINTRO + QINTRO
    T_OUTRO = T_QUIZ + SEG * n; END = T_OUTRO + 5.0
set_timing(5)

def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def mix(a, b, k): return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))

# ---------------- icons ----------------
_ICON = {}
def icon(emoji, size):
    k = (emoji, size)
    if k in _ICON: return _ICON[k]
    im = None
    if emoji:
        cps = [f"{ord(ch):x}" for ch in emoji]
        for name in ("-".join(cps), "-".join(c for c in cps if c != "fe0f")):
            p = os.path.join(TWEMOJI, name + ".svg")
            if os.path.exists(p):
                try:
                    import cairosvg
                    im = Image.open(io.BytesIO(cairosvg.svg2png(url=p, output_width=size, output_height=size))).convert("RGBA")
                except Exception:
                    im = None
                break
    _ICON[k] = im
    return im

# ---------------- background: sunny Alpine landscape ----------------
def _mountains(d, base, peaks, col, snow, rng):
    pts = [(-50, H)]
    for x, y in peaks: pts.append((x, y))
    pts += [(W + 50, base), (W + 50, H)]
    d.polygon(pts, fill=col)
    for i in range(1, len(peaks) - 1):
        x, y = peaks[i]
        if y < base - 220:
            lx, ly = peaks[i - 1]; rx, ry = peaks[i + 1]
            k = 0.22 + rng.random() * 0.1
            a = (x + (lx - x) * k, y + (ly - y) * k); b = (x + (rx - x) * k, y + (ry - y) * k)
            mid1 = ((a[0] + x) / 2 - 10, (a[1] + b[1]) / 2 + 25); mid2 = ((b[0] + x) / 2 + 8, (a[1] + b[1]) / 2 + 10)
            d.polygon([a, (x, y), b, mid2, ((a[0] + b[0]) / 2, max(a[1], b[1]) - 5), mid1], fill=snow)

def _pine(d, x, y, h, col):
    w = h * 0.42
    for k in range(4):
        yy = y - h + k * h * 0.22; ww = w * (0.45 + k * 0.2)
        d.polygon([(x, yy), (x - ww / 2, yy + h * 0.33), (x + ww / 2, yy + h * 0.33)], fill=col)
    d.rectangle([x - h * 0.03, y - h * 0.05, x + h * 0.03, y + h * 0.05], fill=(70, 45, 25))

def build_bg():
    rng = random.Random(11)
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        k = min(1, y / 1000)
        d.line([(0, y), (W, y)], fill=mix((40, 120, 215), (170, 215, 248), k))
    # sun
    glow = Image.new("L", (W, H), 0); g = ImageDraw.Draw(glow)
    for r in range(520, 0, -6): g.ellipse([130 - r, 330 - r, 130 + r, 330 + r], fill=int(150 * (1 - r / 520) ** 2))
    im = Image.composite(Image.new("RGB", (W, H), (255, 250, 220)), im, glow)
    d = ImageDraw.Draw(im)
    d.ellipse([130 - 70, 330 - 70, 130 + 70, 330 + 70], fill=(255, 253, 235))
    # far range
    far = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(far)
    pk = [(-50, 860), (90, 700), (210, 780), (360, 560), (470, 690), (600, 520), (730, 650), (860, 540), (980, 660), (1130, 600)]
    _mountains(fd, 900, pk, (150, 172, 205), (245, 248, 252), rng)
    im.paste(far.filter(ImageFilter.GaussianBlur(1.5)), (0, 0), far.filter(ImageFilter.GaussianBlur(1.5)))
    near = Image.new("RGBA", (W, H), (0, 0, 0, 0)); nd = ImageDraw.Draw(near)
    pk2 = [(-50, 1010), (120, 820), (300, 930), (430, 760), (560, 900), (700, 800), (830, 920), (960, 780), (1130, 900)]
    _mountains(nd, 1050, pk2, (95, 118, 150), (238, 243, 250), rng)
    im.paste(near, (0, 0), near)
    d = ImageDraw.Draw(im)
    # forest band
    for x in range(-20, W + 40, 26):
        _pine(d, x + rng.uniform(-8, 8), 1130 + rng.uniform(-15, 15), rng.uniform(120, 170), (36, 92, 58))
    # lake (left) + meadow
    d.polygon([(-10, 1150), (560, 1140), (720, 1200), (620, 1330), (-10, 1360)], fill=(52, 160, 190))
    for i in range(14):
        y = 1170 + i * 12; d.line([(20 + i * 9, y), (480 - i * 15, y)], fill=(120, 205, 225), width=2)
    for y in range(1250, H):
        k = (y - 1250) / (H - 1250)
        d.line([(0, y), (W, y)], fill=mix((120, 190, 80), (60, 140, 45), k))
    d.polygon([(-10, 1360), (620, 1330), (720, 1200), (W + 10, 1180), (W + 10, 1300), (-10, 1420)], fill=(110, 182, 72))
    for _ in range(170):   # meadow flowers
        x = rng.uniform(0, W); y = rng.uniform(1330, H); r = rng.uniform(4, 9) * (0.6 + (y - 1330) / 900)
        d.ellipse([x - r, y - r, x + r, y + r], fill=rng.choice([(230, 40, 50), (250, 120, 170), (255, 255, 255), (255, 210, 40), (190, 120, 230)]))
    # chalet (right)
    cx, cy = 905, 1250
    d.rectangle([cx - 140, cy - 150, cx + 160, cy + 30], fill=(150, 92, 48))
    for yy in range(cy - 150, cy + 30, 18): d.line([(cx - 140, yy), (cx + 160, yy)], fill=(120, 72, 36), width=2)
    d.polygon([(cx - 175, cy - 140), (cx + 10, cy - 250), (cx + 195, cy - 140)], fill=(95, 55, 30))
    for wx in (cx - 100, cx - 20, cx + 60):
        d.rectangle([wx, cy - 115, wx + 50, cy - 65], fill=(250, 240, 210)); d.rectangle([wx + 23, cy - 115, wx + 27, cy - 65], fill=(120, 72, 36))
        for k in range(6):
            d.ellipse([wx - 4 + k * 10, cy - 66, wx + 8 + k * 10, cy - 54], fill=rng.choice([(230, 40, 60), (250, 120, 170), (255, 80, 80)]))
    d.rectangle([cx + 112, cy - 360, cx + 118, cy - 140], fill=(200, 200, 200))         # flag pole
    for i, c in enumerate([BLACK, (221, 0, 0), GOLD]): d.rectangle([cx + 118, cy - 355 + i * 22, cx + 208, cy - 333 + i * 22], fill=c)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    # soft light veil behind the content column so the wooden boards pop
    veil = Image.new("L", (W, H), 0); v = ImageDraw.Draw(veil)
    v.rounded_rectangle([30, 270, W - 30, 1520], 60, fill=60)
    veil = veil.filter(ImageFilter.GaussianBlur(40))
    im = Image.composite(Image.new("RGB", (W, H), (255, 255, 255)), im, veil)
    return im.convert("RGBA")

# ---------------- brush strokes, header, footer ----------------
def brush(w, h, colors, seed=1):
    rng = random.Random(seed)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    band = h / len(colors)
    for i, c in enumerate(colors):
        y0 = i * band
        for k in range(40):
            yy = y0 + rng.uniform(0, band); th = rng.uniform(band * 0.3, band * 0.7)
            x0 = rng.uniform(0, w * 0.06); x1 = w - rng.uniform(0, w * 0.08)
            d.line([(x0, yy), (x1, yy + rng.uniform(-3, 3))], fill=c + (255,), width=int(th))
    return im.filter(ImageFilter.GaussianBlur(0.8))

def text_outline(d, xy, t, font, fill, outline=WHITE, w=6, anchor="mm"):
    d.text(xy, t, font=font, fill=fill, anchor=anchor, stroke_width=w, stroke_fill=outline)

def build_overlay():
    """Static header + footer drawn on top of the scene (not animated)."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    # header brand
    f = F("Bold", 104); a = "deutschstep"; b = ".com"
    wa = d.textlength(a, font=f); wb = d.textlength(b, font=f); x0 = (W - wa - wb) / 2
    br = brush(620, 54, [BLACK, (221, 0, 0), GOLD], 3).rotate(2, expand=True, resample=Image.BICUBIC)
    ov.alpha_composite(br, (int(W / 2 - br.width / 2), 190))
    d.text((x0, 140), a, font=f, fill=NAVY, anchor="ls", stroke_width=7, stroke_fill=WHITE)
    d.text((x0 + wa, 140), b, font=f, fill=RED, anchor="ls", stroke_width=7, stroke_fill=WHITE)
    # footer banner
    bn = brush(900, 120, [BLACK, (221, 0, 0), GOLD], 5).rotate(-2, expand=True, resample=Image.BICUBIC)
    ov.alpha_composite(bn, (int(W / 2 - bn.width / 2), 1545))
    d.text((W / 2, 1610), "Lerne Deutsch mit deutschstep.com!", font=F("Hand", 62), fill=WHITE, anchor="mm",
           stroke_width=3, stroke_fill=(60, 20, 20))
    return ov

# ---------------- wooden boards ----------------
_WOOD = {}
def wood(w, h, tint=None):
    k = (w, h, tint)
    if k in _WOOD: return _WOOD[k]
    rng = random.Random(w * 7 + h)
    pad = 24
    im = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("L", im.size, 0); ImageDraw.Draw(sh).rounded_rectangle([pad + 4, pad + 10, pad + w + 4, pad + h + 10], 30, fill=120)
    im.paste((40, 25, 10, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(10)))
    board = Image.new("RGBA", (w, h)); bd = ImageDraw.Draw(board)
    top, bot = (247, 233, 200), (232, 208, 160)
    if tint: top, bot = mix(top, tint, 0.55), mix(bot, tint, 0.55)
    for y in range(h): bd.line([(0, y), (w, y)], fill=mix(top, bot, y / h) + (255,))
    grain = Image.new("RGBA", (w, h), (0, 0, 0, 0)); gd = ImageDraw.Draw(grain)
    for _ in range(int(h / 9)):      # grain (drawn on its own layer, then blended)
        y = rng.uniform(0, h); amp = rng.uniform(1, 4); ph = rng.uniform(0, 6); per = rng.uniform(60, 140)
        pts = [(x, y + amp * math.sin(x / per + ph)) for x in range(0, w + 10, 10)]
        gd.line(pts, fill=(160, 115, 60, rng.randint(25, 55)), width=rng.choice([1, 2]))
    board.alpha_composite(grain)
    mask = Image.new("L", (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], 26, fill=255)
    im.paste(board, (pad, pad), mask)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([pad, pad, pad + w - 1, pad + h - 1], 26, outline=(185, 140, 85), width=4)
    d.rounded_rectangle([pad + 5, pad + 5, pad + w - 6, pad + h - 6], 22, outline=(255, 248, 228), width=2)
    for nx, ny in ((pad + 22, pad + 22), (pad + w - 22, pad + 22), (pad + 22, pad + h - 22), (pad + w - 22, pad + h - 22)):
        d.ellipse([nx - 9, ny - 9, nx + 9, ny + 9], fill=BRASS, outline=BRASS_D, width=2)
        d.ellipse([nx - 4, ny - 5, nx + 1, ny], fill=(250, 225, 160))
    _WOOD[k] = (im, pad)
    return im, pad

def board(cv, x, y, w, h, alpha=1.0, tint=None, dy=0):
    im, pad = wood(w, h, tint)
    cv.paste(im, x - pad, y - pad + dy, alpha)

def sticker(cv, emoji, cx, cy, size, alpha=1.0, dy=0):
    """White round sticker with the word's icon (like the reference image)."""
    ic = icon(emoji, int(size * 0.72))
    if ic is None: return
    s = Image.new("RGBA", (size + 30, size + 30), (0, 0, 0, 0)); d = ImageDraw.Draw(s)
    sh = Image.new("L", s.size, 0); ImageDraw.Draw(sh).ellipse([12, 18, size + 18, size + 24], fill=110)
    s.paste((40, 25, 10, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(6)))
    d.ellipse([15, 15, size + 15, size + 15], fill=WHITE, outline=(220, 200, 160), width=4)
    s.alpha_composite(ic, (15 + (size - ic.width) // 2, 15 + (size - ic.height) // 2))
    cv.paste(s, int(cx - s.width / 2), int(cy - s.height / 2 + dy), alpha)

# ---------------- canvas ----------------
BG = None; OV = None
class Canvas:
    def __init__(self, t):
        self.im = BG.copy()
        decor(self, t)
    def paste(self, im, x, y, alpha=1.0):
        if alpha <= 0.01: return
        if alpha < 0.999:
            im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
        x, y = int(x), int(y)
        if x >= W or y >= H or x + im.width <= 0 or y + im.height <= 0: return
        self.im.alpha_composite(im, (max(0, x), max(0, y)), (max(0, -x), max(0, -y)))
    def layer(self, fn, alpha=1.0):
        if alpha <= 0.01: return
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fn(ImageDraw.Draw(lay))
        self.paste(lay, 0, 0, alpha)

# light animation: drifting clouds + butterflies
_CLOUD = None
def cloud_sprite():
    global _CLOUD
    if _CLOUD is None:
        c = Image.new("RGBA", (420, 160), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
        for x, y, r in ((90, 100, 55), (160, 80, 70), (240, 90, 62), (310, 105, 48), (200, 115, 60)):
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 235))
        _CLOUD = c.filter(ImageFilter.GaussianBlur(5))
    return _CLOUD

def butterfly(size, color, flap):
    s = size * 3; im = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = s / 2
    for sx in (-1, 1):
        x0, x1 = sorted([c, c + sx * s * .42]); d.ellipse([x0, c - s * .40, x1, c + s * .02], fill=color + (255,))
        x0, x1 = sorted([c, c + sx * s * .30]); d.ellipse([x0, c - s * .02, x1, c + s * .30], fill=color + (230,))
    d.rounded_rectangle([c - s * .03, c - s * .30, c + s * .03, c + s * .28], 3, fill=(40, 30, 30, 255))
    im = im.resize((size, size), Image.LANCZOS)
    return im.resize((max(2, int(size * flap)), size), Image.BILINEAR)

def decor(cv, t):
    cl = cloud_sprite()
    for x0, y0, sp, sc in ((-200, 430, 14, 1.0), (500, 300, 9, 0.75), (900, 520, 11, 0.9)):
        x = (x0 + t * sp) % (W + 500) - 400
        c = cl if sc == 1.0 else cl.resize((int(cl.width * sc), int(cl.height * sc)))
        cv.paste(c, x, y0, 0.9)
    for i, (col, y0, sp) in enumerate((((240, 90, 140), 1700, 70), ((255, 170, 40), 1760, 55))):
        x = (t * sp + i * 500) % (W + 300) - 150
        cv.paste(butterfly(60, col, 0.3 + 0.7 * abs(math.sin(t * 9 + i))), x, y0 + 20 * math.sin(t * 2 + i), 1.0)

# ---------------- text helpers ----------------
def rich_lines(d, tokens, font, maxw):
    words = []
    for txt, hl in tokens:
        parts = txt.split(" ")
        for i, p in enumerate(parts):
            if p: words.append((p, hl))
            if i < len(parts) - 1: words.append((" ", None))
    lines, cur, cw = [], [], 0
    for w_, hl in words:
        ww = d.textlength(w_, font=font)
        if hl is not None and cur and cw + ww > maxw:
            while cur and cur[-1][1] is None: cur.pop()
            lines.append(cur); cur, cw = [], 0
        if hl is None and not cur: continue
        cur.append((w_, hl)); cw += ww
    if cur: lines.append(cur)
    return lines

def fit(d, text, style, size, maxw, minsize=40):
    while size > minsize and d.textlength(text, font=F(style, size)) > maxw: size -= 4
    return F(style, size)

def chip(d, x, y, text, fill, color, font, h=58):
    w = d.textlength(text, font=font) + 44
    d.rounded_rectangle([x, y, x + w, y + h], h // 2, fill=fill)
    d.text((x + w / 2, y + h / 2), text, font=font, fill=color, anchor="mm"); return w

def progress(d, n, idx, frac, col):
    gap = 10; sw = (R - L - 40 - gap * (n - 1)) / n; x0 = L + 20
    for k in range(n):
        x = x0 + k * (sw + gap)
        d.rounded_rectangle([x, 282, x + sw, 294], 6, fill=(255, 255, 255, 200), outline=(150, 120, 80), width=1)
        f = 1 if k < idx else (frac if k == idx else 0)
        if f > 0: d.rounded_rectangle([x, 282, x + max(12, sw * f), 294], 6, fill=col)

# ---------------- scenes ----------------
def intro(cv, t):
    out = 1 - ease((t - (T_INTRO - 0.35)) / 0.35)
    a = ease(t / 0.5)
    board(cv, L, 300, R - L, 300, a * out, dy=(1 - a) * 40)
    def head(d):
        y = 300 + (1 - a) * 40
        chip(d, L + 40, y + 34, f"LEVEL {LEVEL}  ·  QUIZ", RED, WHITE, F("Bold", 30))
        d.text((L + 40, y + 115), f"Learn {NV} {kw()[0]}.", font=F("Bold", 80), fill=NAVY)
        d.text((L + 40, y + 200), "Then take the quiz!", font=F("Bold", 64), fill=RED)
    cv.layer(head, a * out)
    for i, v in enumerate(V):           # little preview planks with icon + word
        k = ease((t - 0.5 - i * 0.18) / 0.4) * out
        y = 650 + i * 160
        board(cv, L + 40, y, R - L - 80, 130, k)
        sticker(cv, v["emoji"], L + 115, y + 65, 110, k)
        cv.layer(lambda d, v=v, y=y: (d.text((L + 195, y + 48), v["verb"], font=fit(d, v["verb"], "Bold", 52, R - L - 250), fill=NAVY, anchor="lm"),
                                       d.text((L + 195, y + 100), v["en"], font=F("Italic", 36), fill=RED, anchor="lm")), k)

def learn(cv, i, t):
    v = V[i]
    a = ease(t / 0.4); out = 1 - ease((t - (LEARN - 0.3)) / 0.3); al = a * out
    dx = (1 - a) * 80 - (1 - out) * 80
    cv.layer(lambda d: progress(d, len(V), i, min(1, t / LEARN), RED))
    board(cv, L + dx, 310, R - L, 330, al)
    sticker(cv, v["emoji"], L + 150 + dx, 475, 210, al)
    def top(d):
        d.text((L + 280 + dx, 360), f"{kw()[1].upper()} {i + 1} / {len(V)}", font=F("Bold", 30), fill=RED)
        d.text((L + 280 + dx, 455), v["verb"], font=fit(d, v["verb"], "Bold", 84, R - L - 320), fill=NAVY, anchor="lm")
    cv.layer(top, al)
    m = ease((t - 0.5) / 0.45) * out
    def meaning(d):
        d.text((L + 280 + dx, 545), v["en"], font=fit(d, v["en"], "BoldItalic", 56, R - L - 320), fill=RED, anchor="lm")
    cv.layer(meaning, m)
    tg = ease((t - 0.9) / 0.4) * out
    board(cv, L + 60 + dx, 680, R - L - 120, 100, tg)
    cv.layer(lambda d: d.text((W / 2 + dx, 730), v["tag"], font=fit(d, v["tag"], "Medium", 40, R - L - 200), fill=INK2, anchor="mm"), tg)
    e = ease((t - 1.3) / 0.5) * out
    board(cv, L + dx, 830, R - L, 470, e)
    def ex(d):
        d.text((L + 50 + dx, 880), "EXAMPLE", font=F("Bold", 28), fill=RED)
        font = F("Bold", 58); y = 935
        for ln in rich_lines(d, v["ex"], font, R - L - 100):
            x = L + 50 + dx
            for w_, hl in ln:
                d.text((x, y), w_, font=font, fill=RED if hl else NAVY); x += d.textlength(w_, font=font)
            y += 80
        d.text((R - 40 + dx, 1262), "More examples on deutschstep.com", font=F("Bold", 28), fill=DRED, anchor="rm")
    cv.layer(ex, e)
    tk = ease((t - 2.4) / 0.5) * out
    def trans(d):
        font = F("Bold", 58); y = 935 + 80 * len(rich_lines(d, v["ex"], font, R - L - 100)) + 20
        for ln in rich_lines(d, [(v["tr"], 0)], F("Italic", 44), R - L - 100):
            d.text((L + 50 + dx, y), "".join(w for w, _ in ln), font=F("Italic", 44), fill=INK2); y += 58
    cv.layer(trans, tk)

def quiz_intro(cv, t):
    a = ease(t / 0.4); out = 1 - ease((t - (QINTRO - 0.3)) / 0.3)
    board(cv, L, 560, R - L, 420, a * out, dy=(1 - a) * 40)
    pulse = 1 + 0.03 * math.sin(t * 8)
    def draw(d):
        d.text((W / 2, 700), "QUIZ TIME!", font=F("Bold", int(120 * pulse)), fill=RED, anchor="mm")
        d.text((W / 2, 830), f"Which {kw()[1]} means…?", font=F("Bold", 54), fill=NAVY, anchor="mm")
        d.text((W / 2, 905), "5 seconds per question", font=F("Italic", 40), fill=INK2, anchor="mm")
    cv.layer(draw, a * out)

def question(cv, i, t):
    en, opts, ok, vi = QZ[i]
    a = ease(t / 0.35); out = 1 - ease((t - (SEG - 0.2)) / 0.2); al = a * out; dy = (1 - a) * 30
    reveal = t >= THINK; rk = ease((t - THINK) / 0.25) if reveal else 0
    cv.layer(lambda d: progress(d, len(QZ), i, min(1, t / SEG), RED))
    board(cv, L, 300, R - L, 270, al, dy=dy)
    def top(d):
        d.text((L + 45, 350 + dy), f"QUESTION {i + 1} / {len(QZ)}", font=F("Bold", 30), fill=RED)
        d.text((L + 45, 400 + dy), f"Which {kw()[1]} means…", font=F("Medium", 44), fill=INK2)
        d.text((L + 45, 470 + dy), f"“{en}”", font=fit(d, f"“{en}”", "Bold", 76, R - L - 260), fill=RED)
        cx, cy = R - 95, 440 + dy
        if not reveal:
            left = THINK - t; fr = left / THINK
            d.ellipse([cx - 66, cy - 66, cx + 66, cy + 66], fill=WHITE, outline=(200, 170, 120), width=8)
            d.arc([cx - 66, cy - 66, cx + 66, cy + 66], -90, -90 + 360 * fr, fill=RED, width=10)
            d.text((cx, cy), str(max(1, math.ceil(left))), font=F("Bold", 58), fill=RED, anchor="mm")
        else:
            d.ellipse([cx - 66, cy - 66, cx + 66, cy + 66], fill=GREEN)
            d.text((cx, cy), "✓", font=F("Black", 70), fill=WHITE, anchor="mm")
    cv.layer(top, al)
    for j, o in enumerate(opts):
        k = ease((t - 0.25 - j * 0.08) / 0.3) * out
        if k <= 0: continue
        y = 615 + j * 165 + (1 - k) * 25
        good = reveal and j == ok
        fade = 1 - 0.5 * rk if (reveal and j != ok) else 1
        board(cv, L, int(y), R - L, 135, k * fade, tint=(170, 230, 160) if good and rk > 0.5 else None)
        def opt(d, j=j, o=o, y=y, good=good):
            bx, by = L + 75, y + 67
            d.ellipse([bx - 38, by - 38, bx + 38, by + 38], fill=GREEN if good else BRASS, outline=BRASS_D if not good else (20, 110, 40), width=3)
            d.text((bx, by), "✓" if good and rk > .5 else LET[j], font=F("Black", 40) if good and rk > .5 else F("Bold", 40), fill=WHITE, anchor="mm")
            d.text((L + 140, by), o, font=fit(d, o, "Bold", 56, R - L - 180), fill=NAVY, anchor="lm")
        cv.layer(opt, k * fade)
    if reveal:
        tr = V[vi]["tr"]
        board(cv, L + 40, 1290, R - L - 80, 110, rk * out)
        cv.layer(lambda d: d.text((W / 2, 1345), tr, font=fit(d, tr, "Italic", 42, R - L - 140), fill=INK2, anchor="mm"), rk * out)

def outro(cv, t):
    a = ease(t / 0.5)
    board(cv, L, 300, R - L, 560, a, dy=(1 - a) * 30)
    mid = math.ceil(NV * 0.6)
    def draw(d):
        y = (1 - a) * 30
        d.text((W / 2, 390 + y), "What's your score?", font=F("Bold", 76), fill=NAVY, anchor="mm")
        d.text((W / 2, 470 + y), "Write it in the comments 👇".replace(" 👇", ""), font=F("Italic", 46), fill=RED, anchor="mm")
        for k, (s, lab) in enumerate([(str(NV), "Ausgezeichnet!"), (f"{mid}–{NV - 1}", "Sehr gut!"), (f"0–{mid - 1}", "Watch it again")]):
            yy = 540 + k * 95 + y
            d.rounded_rectangle([L + 70, yy, R - 70, yy + 78], 22, fill=(255, 250, 238), outline=(200, 165, 110), width=2)
            d.text((L + 110, yy + 39), s, font=F("Bold", 42), fill=RED, anchor="lm")
            d.text((R - 110, yy + 39), lab, font=F("Bold", 40), fill=NAVY, anchor="rm")
    cv.layer(draw, a)
    c = ease((t - 0.8) / 0.5)
    board(cv, L, 920, R - L, 330, c, tint=(255, 120, 110), dy=(1 - c) * 30)
    def cta(d):
        y = (1 - c) * 30
        d.text((W / 2, 1000 + y), "Learn German for free", font=F("Bold", 46), fill=WHITE, anchor="mm", stroke_width=3, stroke_fill=DRED)
        d.text((W / 2, 1090 + y), "deutschstep.com", font=F("Bold", 96), fill=WHITE, anchor="mm", stroke_width=5, stroke_fill=DRED)
        d.text((W / 2, 1180 + y), "A1–C2 lessons · Exercises · Placement test", font=F("Medium", 34), fill=WHITE, anchor="mm", stroke_width=2, stroke_fill=DRED)
    cv.layer(cta, c)
    e = ease((t - 1.4) / 0.5)
    board(cv, L + 120, 1300, R - L - 240, 100, e)
    cv.layer(lambda d: d.text((W / 2, 1350), "Follow for more German quizzes", font=F("Bold", 38), fill=NAVY, anchor="mm"), e)

def frame(t):
    cv = Canvas(t)
    if t < T_INTRO: intro(cv, t)
    elif t < T_QINTRO:
        i = int((t - T_INTRO) // LEARN); learn(cv, i, t - T_INTRO - i * LEARN)
    elif t < T_QUIZ: quiz_intro(cv, t - T_QINTRO)
    elif t < T_OUTRO:
        i = int((t - T_QUIZ) // SEG); question(cv, i, t - T_QUIZ - i * SEG)
    else: outro(cv, t - T_OUTRO)
    cv.im.alpha_composite(OV)
    return cv.im.convert("RGB")

def setup(path):
    global LEVEL, KIND, V, QZ, BG, OV
    LEVEL, KIND, V, QZ = load_content(path); set_timing(len(V))
    BG = build_bg(); OV = build_overlay()

if __name__ == "__main__":
    if sys.argv[1] == "--timing":
        _, _, V, _ = load_content(sys.argv[2]); set_timing(len(V))
        print(json.dumps(dict(end=END, quiz_start=T_QUIZ, seg=SEG, think=THINK, n=len(V)))); sys.exit()
    setup(sys.argv[1])
    missing = [v["verb"] for v in V if icon(v["emoji"], 64) is None]
    if missing: print("WARNING: no icon for", missing, file=sys.stderr)
    OUT, MUSIC = sys.argv[2], sys.argv[3]
    n = int(END * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", MUSIC, "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest",
        "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
    snaps = {int(x * FPS) for x in (3.0, T_INTRO + 0.9, T_INTRO + 5.0, T_INTRO + 3 * LEARN + 5.0, T_QINTRO + 1.3,
                                    T_QUIZ + 2.5, T_QUIZ + 2 * SEG + 5.8, END - 1)}
    for k in range(n):
        fr = frame(k / FPS); ff.stdin.write(fr.tobytes())
        if k in snaps: fr.save(OUT.replace(".mp4", f"_f{k:04d}.png"))
    ff.stdin.close(); ff.wait()
    if ff.returncode: sys.exit("ffmpeg failed")
    print("ok", n, END)
