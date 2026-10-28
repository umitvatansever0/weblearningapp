"""DeutschStep — learn 10 B1 verbs, then a 10-question quiz (5s think + 2s answer)."""
import subprocess, sys, math, json
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
FD = "/usr/share/fonts/opentype/inter/"
_fc = {}
def F(w, s):
    if (w, s) not in _fc: _fc[(w, s)] = ImageFont.truetype(FD + f"Inter-{w}.otf", s)
    return _fc[(w, s)]

BG_TOP, BG_BOT = (12, 17, 31), (19, 27, 48)
GOLD, RED = (255, 206, 0), (221, 0, 0)
WHITE, GRAY, MUTED = (255, 255, 255), (203, 208, 216), (132, 142, 162)
CARD, LINE, OPT = (27, 36, 59), (50, 61, 90), (33, 44, 71)
GREEN, GREEN_D = (34, 197, 94), (20, 83, 45)
TEAL = (45, 212, 191)
L, R = 90, W - 90

import random

def _tokens(sentence):
    """'Ich bin *aufgewachsen*.' -> [("Ich bin ",0),("aufgewachsen",1),(".",0)]"""
    out = []
    for k, part in enumerate(sentence.split("*")):
        if part: out.append((part, k % 2))
    return out

def load_content(path):
    c = json.load(open(path, encoding="utf-8"))
    verbs = c["verbs"]
    N = len(verbs)
    assert 4 <= N <= 10, "need 4-10 verbs"
    V = [(v["verb"], v["en"], v["tag"], _tokens(v["example"]), v["translation"]) for v in verbs]
    rng = random.Random(c.get("seed", 1))
    order = list(range(N)); rng.shuffle(order)
    QZ = []
    for qi, vi in enumerate(order):
        ok = qi % 4                                   # balanced A/B/C/D
        others = [j for j in range(N) if j != vi]; rng.shuffle(others)
        opts = [V[j][0] for j in others[:3]]
        opts.insert(ok, V[vi][0])
        QZ.append((V[vi][1], opts, ok))
    rng.shuffle(QZ)                                    # keep answers from being a pattern
    return c.get("level", "B1"), V, QZ

LEVEL, V, QZ = "B1", [], []
# content "kind" -> (plural shown on screen, question word). Default: verbs.
KINDS = {"verbs": ("verbs", "verb"), "prep_verbs": ("verbs + prepositions", "verb"),
         "nouns": ("nouns", "word"), "adjectives": ("adjectives", "word"), "words": ("words", "word")}
KIND = "verbs"
def kind_words(): return KINDS.get(KIND, KINDS["verbs"])
LET = "ABCD"

T_INTRO, LEARN, QINTRO, THINK, SHOW = 3.0, 7.0, 2.6, 5.0, 2.0
SEG = THINK + SHOW
def set_timing(n):
    """Learn section: 7 s per verb (was 3.2 s) so viewers can read it calmly."""
    global NV, T_QINTRO, T_QUIZ, T_OUTRO, END
    NV = n
    T_QINTRO = T_INTRO + LEARN * n
    T_QUIZ = T_QINTRO + QINTRO
    T_OUTRO = T_QUIZ + SEG * n
    END = T_OUTRO + 5.0
set_timing(5)

def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def mix(a, b, k): return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))

def build_base():
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H): d.line([(0, y), (W, y)], fill=mix(BG_TOP, BG_BOT, math.sin(math.pi * y / H)))
    glow = Image.new("L", (W, H), 0); gd = ImageDraw.Draw(glow)
    for r in range(560, 0, -8):
        gd.ellipse([140 - r, 1700 - r, 140 + r, 1700 + r], fill=int(16 * (1 - r / 560)))
    im = Image.composite(Image.new("RGB", (W, H), TEAL), im, glow)
    d = ImageDraw.Draw(im)
    for i, c in enumerate([(0, 0, 0), RED, GOLD]): d.rectangle([0, i * 8, W, i * 8 + 8], fill=c)
    d.text((L, 74), "Deutsch", font=F("ExtraBold", 46), fill=WHITE)
    d.text((L + d.textlength("Deutsch", font=F("ExtraBold", 46)), 74), "Step", font=F("ExtraBold", 46), fill=GOLD)
    d.text((R, 86), "deutschstep.com", font=F("Bold", 32), fill=GOLD, anchor="ra")
    d.line([(L, 150), (R, 150)], fill=LINE, width=2)
    return im.convert("RGBA")
BASE = build_base()


# ---------- decorations: drifting flowers / leaves / butterflies + meadow ----------
def _sprite(kind, size, color, ss=4):
    S = size * ss; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = S / 2
    if kind == "flower":
        pr = S * 0.22
        for k in range(5):
            a = 2 * math.pi * k / 5; px, py = c + math.cos(a) * S * 0.2, c + math.sin(a) * S * 0.2
            d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=color + (255,))
        d.ellipse([c - S * .11, c - S * .11, c + S * .11, c + S * .11], fill=(255, 236, 160, 255))
    elif kind == "leaf":
        d.ellipse([c - S * .16, c - S * .42, c + S * .16, c + S * .42], fill=color + (255,))
        d.line([(c, c - S * .38), (c, c + S * .45)], fill=(255, 255, 255, 110), width=max(2, S // 40))
    elif kind == "butterfly":
        for sx in (-1, 1):
            x0, x1 = sorted([c, c + sx * S * .42]); d.ellipse([x0, c - S * .40, x1, c + S * .02], fill=color + (255,))
            x0, x1 = sorted([c, c + sx * S * .30]); d.ellipse([x0, c - S * .02, x1, c + S * .30], fill=color + (230,))
        d.rounded_rectangle([c - S * .03, c - S * .30, c + S * .03, c + S * .28], S // 30, fill=(30, 30, 40, 255))
    elif kind == "tulip":
        d.line([(c, S * .45), (c, S)], fill=(52, 168, 110, 255), width=max(3, S // 28))
        d.ellipse([c - S * .1, S * .62, c + S * .12, S * .72], fill=(52, 168, 110, 255))
        d.pieslice([c - S * .2, S * .05, c + S * .2, S * .5], 0, 180, fill=color + (255,))
        d.polygon([(c - S * .2, S * .28), (c - S * .12, S * .06), (c, S * .22), (c + S * .12, S * .06), (c + S * .2, S * .28)], fill=color + (255,))
    return im.resize((size, size), Image.LANCZOS)

PINK, PEACH, LILAC, LEAFC = (255, 143, 171), (255, 183, 122), (186, 160, 255), (74, 201, 140)
_SPR = {}
def sprite(kind, size, color):
    k = (kind, size, color)
    if k not in _SPR: _SPR[k] = _sprite(kind, size, color)
    return _SPR[k]

import random as _r
_g = _r.Random(7)
DRIFT = []   # floating elements, very faint so they never compete with text
for k in range(14):
    kind = ["flower", "leaf", "flower", "leaf", "butterfly"][k % 5]
    DRIFT.append(dict(kind=kind, size=_g.choice([46, 56, 70]), color=_g.choice([PINK, PEACH, LILAC, GOLD]) if kind != "leaf" else _g.choice([LEAFC, TEAL]),
                      x=_g.uniform(0, W), y=_g.uniform(0, H), vy=_g.uniform(-38, -18), sway=_g.uniform(20, 55),
                      ph=_g.uniform(0, 6.3), spin=_g.uniform(-40, 40), alpha=_g.uniform(0.22, 0.32)))
MEADOW = [dict(x=40 + k * 82 + _g.uniform(-14, 14), size=_g.choice([110, 130, 150]), color=_g.choice([PINK, PEACH, LILAC, GOLD]),
               ph=_g.uniform(0, 6.3)) for k in range(13)]

def _paste(im, spr, cx, cy, alpha, angle=0, sx=1.0):
    if sx != 1.0:
        spr = spr.resize((max(2, int(spr.width * abs(sx))), spr.height), Image.BILINEAR)
    if angle: spr = spr.rotate(angle, resample=Image.BICUBIC, expand=True)
    if alpha < 1: spr = spr.copy(); spr.putalpha(spr.getchannel("A").point(lambda v: int(v * alpha)))
    x, y = int(cx - spr.width / 2), int(cy - spr.height / 2)
    if x > W or y > H or x + spr.width < 0 or y + spr.height < 0: return
    im.alpha_composite(spr, (max(0, x), max(0, y)), (max(0, -x), max(0, -y)))

def decor(cv, t):
    for p in DRIFT:
        y = (p["y"] + p["vy"] * t) % (H + 200) - 100
        x = p["x"] + math.sin(t * 0.8 + p["ph"]) * p["sway"]
        if p["kind"] == "butterfly":
            _paste(cv.im, sprite("butterfly", p["size"], p["color"]), x, y, p["alpha"] + 0.06, 8 * math.sin(t * 2 + p["ph"]),
                   0.35 + 0.65 * abs(math.sin(t * 7 + p["ph"])))
        else:
            _paste(cv.im, sprite(p["kind"], p["size"], p["color"]), x, y, p["alpha"], (p["spin"] * t) % 360)
    for m in MEADOW:   # swaying tulips along the bottom edge
        _paste(cv.im, sprite("tulip", m["size"], m["color"]), m["x"], H - m["size"] * 0.42, 0.55, 6 * math.sin(t * 1.4 + m["ph"]))
    bx = (t * 95) % (W + 400) - 200    # one butterfly crossing above the meadow
    _paste(cv.im, sprite("butterfly", 64, PINK), bx, 1745 + 25 * math.sin(t * 2.3), 0.85, 10 * math.sin(t * 3),
           0.3 + 0.7 * abs(math.sin(t * 9)))

# ---------- brand pill: always visible, gentle shine every 4 s ----------
PILL_H, PILL_Y = 112, 1555
PILL_W = int(118 + ImageDraw.Draw(Image.new("L", (1, 1))).textlength("deutschstep.com", font=F("ExtraBold", 50)) + 64)
def _pill():
    im = Image.new("RGBA", (PILL_W, PILL_H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, PILL_W - 1, PILL_H - 1], PILL_H // 2, fill=(20, 27, 46, 235), outline=GOLD, width=4)
    cx, cy, r = 70, PILL_H // 2, 26          # globe icon
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=4)
    d.ellipse([cx - r * .45, cy - r, cx + r * .45, cy + r], outline=GOLD, width=3)
    d.line([(cx - r, cy), (cx + r, cy)], fill=GOLD, width=3)
    d.text((118, cy - 18), "deutschstep.com", font=F("ExtraBold", 50), fill=WHITE, anchor="lm")
    d.text((118, cy + 26), "Free German lessons · A1–C2", font=F("SemiBold", 26), fill=GOLD, anchor="lm")
    return im
PILL = None
def brand_pill(cv, t):
    global PILL
    if PILL is None: PILL = _pill()
    k = ease(t / 0.6)
    p = PILL
    ph = (t % 4.0) / 4.0
    if ph < 0.35:                            # shine sweep
        sx = int(-200 + (PILL_W + 400) * ph / 0.35)
        band = Image.new("L", (PILL_W, PILL_H), 0); bd = ImageDraw.Draw(band)
        bd.polygon([(sx, 0), (sx + 70, 0), (sx + 20, PILL_H), (sx - 50, PILL_H)], fill=38)
        shine = Image.new("RGBA", (PILL_W, PILL_H), (255, 255, 255, 0))
        shine.putalpha(Image.composite(band, Image.new("L", band.size, 0), p.getchannel("A")))
        p = p.copy(); p.alpha_composite(shine)
    _paste(cv.im, p, W / 2, PILL_Y + PILL_H / 2 + (1 - k) * 30, k)

class Canvas:
    def __init__(self): self.im = BASE.copy()
    def layer(self, fn, alpha=1.0):
        if alpha <= 0.01: return
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fn(ImageDraw.Draw(lay))
        if alpha < 0.999: lay.putalpha(lay.getchannel("A").point(lambda v: int(v * alpha)))
        self.im.alpha_composite(lay)

def chip(d, x, y, text, fill, color, font, h=54):
    w = d.textlength(text, font=font) + 44
    d.rounded_rectangle([x, y, x + w, y + h], h // 2, fill=fill)
    d.text((x + w / 2, y + h / 2), text, font=font, fill=color, anchor="mm"); return w

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

def bar(d, n, idx, frac, label, col):
    gap = 8; sw = (R - L - gap * (n - 1)) / n
    for k in range(n):
        x0 = L + k * (sw + gap)
        d.rounded_rectangle([x0, 180, x0 + sw, 190], 5, fill=LINE)
        f = 1 if k < idx else (frac if k == idx else 0)
        if f > 0: d.rounded_rectangle([x0, 180, x0 + max(10, sw * f), 190], 5, fill=col)

# ---------- scenes ----------
def intro(cv, t):
    out = 1 - ease((t - 2.65) / 0.35); a = ease(t / 0.5)
    def draw(d):
        y = (1 - a) * 50
        chip(d, L, 400 + y, f"LEVEL {LEVEL}", GOLD, BG_TOP, F("ExtraBold", 30))
        d.text((L, 500 + y), f"Learn {NV} {kind_words()[0] if KIND != 'prep_verbs' else 'verbs'}.", font=F("Black", 100), fill=WHITE)
        d.text((L, 615 + y), "Then take", font=F("Black", 100), fill=WHITE)
        d.text((L, 730 + y), "the quiz.", font=F("Black", 100), fill=GOLD)
    cv.layer(draw, a * out)
    b = ease((t - 0.7) / 0.5)
    def draw2(d):
        rows = [("1", f"Learn: {NV} {LEVEL} {kind_words()[0]}"), ("2", "Quiz: 5 seconds per question"), ("3", "Comment your score")]
        for i, (k, v) in enumerate(rows):
            y = 940 + i * 110
            d.rounded_rectangle([L, y, L + 80, y + 80], 22, fill=CARD, outline=LINE, width=2)
            d.text((L + 40, y + 40), k, font=F("ExtraBold", 38), fill=GOLD, anchor="mm")
            d.text((L + 115, y + 40), v, font=F("SemiBold", 44), fill=GRAY, anchor="lm")
    cv.layer(draw2, b * out)

def learn(cv, i, t):
    verb, en, tag, ex, tr = V[i]
    a = ease(t / 0.35); out = 1 - ease((t - (LEARN - 0.3)) / 0.3)
    dx = (1 - a) * 90 - (1 - out) * 90; al = a * out
    cv.layer(lambda d: bar(d, len(V), i, min(1, t / LEARN), "", TEAL))
    def draw(d):
        d.text((L + dx, 236), f"LEARN  ·  {i + 1:02d} / {len(V)}", font=F("Bold", 32), fill=TEAL)
        size = 112
        while d.textlength(verb, font=F("Black", size)) > R - L: size -= 6
        d.text((L + dx, 300), verb, font=F("Black", size), fill=WHITE)
    cv.layer(draw, al)
    m = ease((t - 0.5) / 0.45) * out
    def meaning(d):
        d.text((L + dx, 450 + (1 - m) * 20), en, font=F("SemiBold", 62), fill=GOLD)
        chip(d, L + dx, 555, tag, CARD, GRAY, F("SemiBold", 32), 58)
    cv.layer(meaning, m)
    e = ease((t - 1.3) / 0.5) * out
    def card(d):
        d.rounded_rectangle([L + dx, 680, R + dx, 1240], 34, fill=CARD, outline=LINE, width=2)
        d.rounded_rectangle([L + dx, 680, L + 10 + dx, 1240], 5, fill=TEAL)
        d.text((R - 40 + dx, 1200), "More examples → deutschstep.com", font=F("SemiBold", 28), fill=GOLD, anchor="rm")
        d.text((L + 50 + dx, 720), "EXAMPLE", font=F("Bold", 28), fill=MUTED)
        font = F("Bold", 60); y = 775
        for ln in rich_lines(d, ex, font, R - L - 100):
            x = L + 50 + dx
            for w_, hl in ln:
                d.text((x, y), w_, font=font, fill=GOLD if hl else WHITE); x += d.textlength(w_, font=font)
            y += 80
        return y
    cv.layer(card, e)
    tk = ease((t - 2.4) / 0.5) * out
    def trans(d):
        font = F("Bold", 60); y = 775 + 80 * len(rich_lines(d, ex, font, R - L - 100)) + 25
        f2 = F("Medium", 44)
        for ln in rich_lines(d, [(tr, 0)], f2, R - L - 100):
            d.text((L + 50 + dx, y), "".join(w for w, _ in ln), font=f2, fill=GRAY); y += 58
    cv.layer(trans, tk)

def quiz_intro(cv, t):
    a = ease(t / 0.4); out = 1 - ease((t - (QINTRO - 0.3)) / 0.3)
    pulse = 1 + 0.03 * math.sin(t * 8)
    def draw(d):
        d.text((W / 2, 650), "QUIZ TIME", font=F("Black", int(140 * pulse)), fill=GOLD, anchor="mm")
        d.text((W / 2, 790), f"Which {kind_words()[1]} means…?", font=F("SemiBold", 56), fill=WHITE, anchor="mm")
        d.text((W / 2, 880), "5 seconds per question", font=F("Medium", 44), fill=GRAY, anchor="mm")
    cv.layer(draw, a * out)

def ring(d, cx, cy, r, frac, label, col):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CARD, outline=LINE, width=9)
    if frac > 0: d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + 360 * frac, fill=col, width=9)
    d.text((cx, cy), label, font=F("ExtraBold", 50), fill=col, anchor="mm")

def question(cv, i, t):
    en, opts, ok = QZ[i]
    a = ease(t / 0.35); out = 1 - ease((t - (SEG - 0.2)) / 0.2); dy = (1 - a) * 40
    reveal = t >= THINK; rk = ease((t - THINK) / 0.25) if reveal else 0
    cv.layer(lambda d: bar(d, len(QZ), i, min(1, t / SEG), "", GOLD))
    def top(d):
        d.text((L, 236 + dy), f"QUESTION {i + 1:02d} / {len(QZ)}", font=F("Bold", 32), fill=GOLD)
        d.text((L, 300 + dy), f"Which {kind_words()[1]} means…", font=F("Medium", 46), fill=GRAY)
        size = 92
        while d.textlength(f"“{en}”", font=F("Black", size)) > R - L - 160: size -= 6
        d.text((L, 370 + dy), f"“{en}”", font=F("Black", size), fill=WHITE)
    cv.layer(top, a * out)
    def options(d):
        for j, o in enumerate(opts):
            k = ease((t - 0.25 - j * 0.08) / 0.3)
            if k <= 0: continue
            y = 560 + j * 160 + (1 - k) * 30
            fill, edge, txt, badge = OPT, LINE, WHITE, LINE
            if reveal:
                if j == ok: fill, edge, badge = mix(OPT, GREEN_D, rk), mix(LINE, GREEN, rk), mix(LINE, GREEN, rk)
                else: txt, fill = mix(WHITE, MUTED, rk), mix(OPT, (24, 31, 51), rk)
            d.rounded_rectangle([L, y, R, y + 132], 32, fill=fill, outline=edge, width=3)
            d.ellipse([L + 30, y + 31, L + 100, y + 101], fill=badge)
            d.text((L + 65, y + 66), "✓" if (reveal and j == ok and rk > .5) else LET[j], font=F("ExtraBold", 38), fill=WHITE, anchor="mm")
            d.text((L + 135, y + 66), o, font=F("Bold", 54), fill=txt, anchor="lm")
    cv.layer(options, a * out)
    def timer(d):
        cx, cy = R - 66, 420 + dy
        if not reveal:
            left = THINK - t; ring(d, cx, cy, 62, left / THINK, str(max(1, math.ceil(left))), GOLD)
        else:
            d.ellipse([cx - 62, cy - 62, cx + 62, cy + 62], fill=GREEN)
            d.text((cx, cy), "✓", font=F("ExtraBold", 58), fill=WHITE, anchor="mm")
    cv.layer(timer, a * out)
    if reveal:  # answer line under options
        verb = opts[ok]; ex = next(v for v in V if v[0] == verb)[4]
        cv.layer(lambda d: d.text((W / 2, 1230), ex, font=F("Medium", 42), fill=GRAY, anchor="mm"), rk * out)

def outro(cv, t):
    a = ease(t / 0.5)
    def draw(d):
        y = (1 - a) * 40
        d.text((W / 2, 420 + y), "What's your score?", font=F("Black", 82), fill=WHITE, anchor="mm")
        d.text((W / 2, 530 + y), "Write it in the comments", font=F("SemiBold", 50), fill=GOLD, anchor="mm")
    cv.layer(draw, a)
    b = ease((t - 0.5) / 0.5)
    def score(d):
        mid = math.ceil(NV * 0.6)
        for k, (s, lab) in enumerate([(str(NV), "Excellent!"), (f"{mid}–{NV - 1}", "Great job"), (f"0–{mid - 1}", "Watch it again")]):
            y = 630 + k * 96
            d.rounded_rectangle([L + 60, y, R - 60, y + 80], 24, fill=CARD, outline=LINE, width=2)
            d.text((L + 110, y + 40), s, font=F("ExtraBold", 40), fill=GOLD, anchor="lm")
            d.text((R - 110, y + 40), lab, font=F("SemiBold", 40), fill=GRAY, anchor="rm")
    cv.layer(score, b)
    c = ease((t - 1.0) / 0.5)
    def cta(d):
        y = (1 - c) * 30
        d.rounded_rectangle([L, 980 + y, R, 1290 + y], 40, fill=GOLD)
        d.text((W / 2, 1055 + y), "Learn German for free", font=F("SemiBold", 44), fill=BG_TOP, anchor="mm")
        d.text((W / 2, 1150 + y), "deutschstep.com", font=F("Black", 96), fill=BG_TOP, anchor="mm")
        d.text((W / 2, 1235 + y), "A1–C2 lessons · Exercises · Placement test", font=F("Medium", 32), fill=BG_TOP, anchor="mm")
    cv.layer(cta, c)
    e = ease((t - 1.5) / 0.5)
    cv.layer(lambda d: d.text((W / 2, 1390), "Follow for more German quizzes", font=F("SemiBold", 44), fill=WHITE, anchor="mm"), e)

def frame(t):
    cv = Canvas()
    decor(cv, t)
    if t < T_INTRO: intro(cv, t)
    elif t < T_QINTRO:
        i = int((t - T_INTRO) // LEARN); learn(cv, i, t - T_INTRO - i * LEARN)
    elif t < T_QUIZ: quiz_intro(cv, t - T_QINTRO)
    elif t < T_OUTRO:
        i = int((t - T_QUIZ) // SEG); question(cv, i, t - T_QUIZ - i * SEG)
    else: outro(cv, t - T_OUTRO)
    if t < T_OUTRO: brand_pill(cv, t)
    return cv.im.convert("RGB")

if __name__ == "__main__":
    # usage: render.py --timing content.json   |   render.py content.json out.mp4 music.wav
    if sys.argv[1] == "--timing":
        _, V, QZ = load_content(sys.argv[2]); set_timing(len(V))
        print(json.dumps(dict(end=END, quiz_start=T_QUIZ, seg=SEG, think=THINK, n=len(V)))); sys.exit()
    LEVEL, V, QZ = load_content(sys.argv[1]); set_timing(len(V))
    KIND = json.load(open(sys.argv[1], encoding="utf-8")).get("kind", "verbs")
    OUT, MUSIC = sys.argv[2], sys.argv[3]
    n = int(END * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", MUSIC, "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest",
        "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
    snaps = {int(x * FPS) for x in (2.2, T_INTRO + 0.9, T_INTRO + 5.0, T_INTRO + 3 * LEARN + 5.0, T_QINTRO + 1.3,
                                    T_QUIZ + 2.5, T_QUIZ + 2 * SEG + 5.8, END - 1)}
    for k in range(n):
        fr = frame(k / FPS); ff.stdin.write(fr.tobytes())
        if k in snaps: fr.save(OUT.replace(".mp4", f"_f{k:04d}.png"))
    ff.stdin.close(); ff.wait()
    if ff.returncode: sys.exit("ffmpeg failed")
    print("ok", n, END)
