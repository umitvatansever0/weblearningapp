"""Original German-style background music (synthesized, royalty-free), different every day.
usage: music.py out.wav duration quiz_start seg think n [seed]
Style is picked from the seed: polka (Oktoberfest), schlager, volksmusik (alpine), berlin (electronic).
Tempo, key and melody also vary with the seed. Quiz SFX: tick each second, chime on reveal."""
import numpy as np, wave, sys

SR = 44100
OUT, DUR = sys.argv[1], float(sys.argv[2])
SEED = int(sys.argv[7]) if len(sys.argv) > 7 else 3
N = int(SR * DUR)
x = np.zeros(N)
rng = np.random.default_rng(SEED)
STYLES = ["polka", "schlager", "volksmusik", "berlin"]
DAY = SEED // 10000 if SEED > 10**9 else SEED   # YYYYMMDD from seed YYYYMMDDHHMM
STYLE = STYLES[DAY % 4]                        # changes every day
KEY = [0, 2, -3, 5, -2, 3, -5][(SEED // 7) % 7]

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(sig, at, g=1.0):
    s = int(at * SR)
    if s >= N or s < 0: return
    e = min(N, s + len(sig)); x[s:e] += sig[:e - s] * g
def env(n, a=0.01, r=0.1):
    e = np.ones(n); a = min(int(a * SR), n // 2); r = min(int(r * SR), n - a)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e
def t_(d): return np.arange(int(d * SR)) / SR

# ---- instruments ----
def accordion(f, d):      # reedy, two slightly detuned reeds + vibrato
    t = t_(d); v = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t)
    s = sum((1 / k) * np.sign(np.sin(2 * np.pi * f * k * t * v)) * 0.3 + (1 / k) * np.sin(2 * np.pi * f * 1.004 * k * t) for k in (1, 2, 3))
    return s * env(len(t), 0.02, 0.05) * 0.35
def tuba(f, d):
    t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3) * env(len(t), 0.01, 0.05)
def brass(f, d):
    t = t_(d); s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7)); return s * env(len(t), 0.03, 0.08) * 0.3
def piano(f, d):
    t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 3.5) * env(len(t), 0.005, 0.1)
def zither(f, d):
    t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 5) * env(len(t), 0.002, 0.05)
def synth(f, d):
    t = t_(d); s = 2 * ((f * t) % 1) - 1; s = np.convolve(s, np.ones(8) / 8, "same"); return s * env(len(t), 0.005, 0.05) * 0.4
def kick(g=1.0):
    t = t_(0.22); return np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-t * 25)) / SR) * np.exp(-t * 10) * g
def snare():
    t = t_(0.15); return rng.normal(0, 1, len(t)) * np.exp(-t * 25) * 0.6
def hat():
    t = t_(0.04); return np.diff(rng.normal(0, 1, len(t) + 1)) * np.exp(-t * 90) * 0.5
def pad(fs, d):
    t = t_(d); return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(len(t), 0.2, 0.3)

# I - IV - V - I  /  I - V - vi - IV  (major key, + KEY)
PROGS = [[0, 5, 7, 0], [0, 7, 9, 5], [0, 5, 0, 7]]
prog = PROGS[SEED % 3]
def triad(root): return [root, root + 4, root + 7] if root not in (9, 2, 4) else [root, root + 3, root + 7]
BASE = 60 + KEY

if STYLE == "polka":        # 2/4 oom-pah, accordion melody
    BPM = [118, 124, 128][SEED % 3]; B = 60 / BPM
    for bar in range(int(DUR / (2 * B)) + 1):
        st = bar * 2 * B; r = prog[(bar // 2) % 4]; ch = triad(r)
        add(tuba(hz(BASE - 24 + r), B * 0.9), st, 0.5)
        add(tuba(hz(BASE - 24 + r + 7), B * 0.9), st + B, 0.45)
        for k in (0.5, 1.5):
            for m in ch: add(accordion(hz(BASE + m), B * 0.35), st + k * B, 0.12)
        mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]
        for i, m in enumerate(mel):
            if rng.random() < 0.85: add(accordion(hz(BASE + m), B * 0.45), st + i * B / 2, 0.16)
        add(kick(0.5), st); add(snare(), st + B, 0.12)
elif STYLE == "schlager":   # 4/4 disco-fox, piano + brass stabs
    BPM = [122, 128, 132][SEED % 3]; B = 60 / BPM
    for bar in range(int(DUR / (4 * B)) + 1):
        st = bar * 4 * B; r = prog[bar % 4]; ch = triad(r)
        add(pad([hz(BASE + m) for m in ch], 4 * B), st, 0.08)
        for k in range(4):
            add(kick(0.55), st + k * B); add(hat(), st + k * B + B / 2, 0.25)
            if k in (1, 3): add(snare(), st + k * B, 0.15)
            add(tuba(hz(BASE - 24 + r + (0 if k % 2 == 0 else 7)), B * 0.5), st + k * B, 0.3)
        for k in (0.5, 2.5):
            for m in ch: add(brass(hz(BASE + m), B * 0.4), st + k * B, 0.08)
        mel = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[2], ch[1] + 12, ch[2] + 12]
        for i, m in enumerate(mel):
            if rng.random() < 0.8: add(piano(hz(BASE + m), B), st + i * B / 2, 0.15)
elif STYLE == "volksmusik":  # 3/4 alpine waltz, zither + accordion
    BPM = [96, 104, 112][SEED % 3]; B = 60 / BPM
    for bar in range(int(DUR / (3 * B)) + 1):
        st = bar * 3 * B; r = prog[(bar // 2) % 4]; ch = triad(r)
        add(tuba(hz(BASE - 24 + r), B), st, 0.45)
        for k in (1, 2):
            for m in ch: add(accordion(hz(BASE + m), B * 0.5), st + k * B, 0.09)
        mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24]
        for i, m in enumerate(mel):
            if rng.random() < 0.8: add(zither(hz(BASE + m), B), st + i * B / 2, 0.18)
else:                       # berlin: minimal electronic
    BPM = [118, 122, 126][SEED % 3]; B = 60 / BPM
    for bar in range(int(DUR / (4 * B)) + 1):
        st = bar * 4 * B; r = prog[bar % 4]; ch = triad(r)
        add(pad([hz(BASE - 12 + m) for m in ch], 4 * B), st, 0.10)
        for k in range(4):
            add(kick(0.6), st + k * B)
            for h in range(2): add(hat(), st + k * B + h * B / 2 + B / 4, 0.2)
            if k in (1, 3): add(snare(), st + k * B, 0.1)
        arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2], ch[1]]
        for i, m in enumerate(arp): add(synth(hz(BASE + m), B * 0.45), st + i * B / 2, 0.12)
        for i in range(8): add(synth(hz(BASE - 24 + r), B * 0.4), st + i * B / 2, 0.12)

if len(sys.argv) > 6:   # quiz SFX
    q0, seg, think, n = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
    t = t_(0.05); tick = np.sin(2 * np.pi * 2000 * t) * np.exp(-t * 90)
    t2 = t_(0.8); chime = sum(np.sin(2 * np.pi * f * t2) for f in (1046.5, 1318.5, 1568.0)) / 3 * np.exp(-t2 * 5)
    peak = np.abs(x).max() or 1
    for k in range(n):
        for s in range(int(think)): add(tick * peak, q0 + k * seg + s, 0.5)
        add(chime * peak, q0 + k * seg + think, 0.7)

fi, fo = int(0.5 * SR), int(2.5 * SR)
x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
x = x / (np.abs(x).max() or 1) * 0.62
st = np.stack([x, np.roll(x, 90)], 1)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print("music ok", DUR, "style", STYLE, "bpm", BPM, "key", KEY)
