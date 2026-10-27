"""Upbeat marimba-pop loop (original, synthesized). Different feel from the lo-fi track:
118 BPM, A major (A-E-F#m-D), marimba plucks, claps, shaker. Optional quiz SFX.
usage: music.py out.wav duration quiz_start seg think n [seed]
The seed changes tempo, key, chord progression and lead sound so every video sounds different."""
import numpy as np, wave, sys

SR = 44100
OUT, DUR = sys.argv[1], float(sys.argv[2])
N = int(SR * DUR)
x = np.zeros(N)
SEED = int(sys.argv[7]) if len(sys.argv) > 7 else 3
rng = np.random.default_rng(SEED)
BPM = [104, 110, 118, 124, 96][SEED % 5]; B = 60 / BPM; BAR = 4 * B
SHIFT = [0, 2, -3, 5, -2, 3, -5][SEED % 7]
LEAD_DECAY = [7, 4, 10][SEED % 3]

def hz(m): return 440 * 2 ** ((m - 69) / 12)

def add(sig, at, gain=1.0):
    s = int(at * SR)
    if s >= N: return
    e = min(N, s + len(sig)); x[s:e] += sig[:e - s] * gain

def marimba(f, dur=0.5):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2*np.pi*f*t) * np.exp(-t*LEAD_DECAY) + 0.35*np.sin(2*np.pi*4*f*t) * np.exp(-t*30)
            + 0.1*np.sin(2*np.pi*10*f*t) * np.exp(-t*60))

def pad(fs, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.3)
    return sum(np.sin(2*np.pi*f*t) + 0.2*np.sin(2*np.pi*2.003*f*t) for f in fs) / len(fs) * env

def kick():
    t = np.arange(int(0.22*SR)) / SR
    return np.sin(2*np.pi*np.cumsum(55 + 120*np.exp(-t*25))/SR) * np.exp(-t*10)

def clap():
    t = np.arange(int(0.15*SR)) / SR
    n = rng.normal(0, 1, len(t)); env = np.exp(-t*30) * (1 + 0.6*np.sin(2*np.pi*90*t))
    return np.convolve(n, [0.25]*4, "same") * env

def shaker():
    t = np.arange(int(0.04*SR)) / SR
    return np.diff(rng.normal(0, 1, len(t) + 1)) * np.exp(-t*80)

PROGS = [([[57, 61, 64], [52, 56, 59], [54, 57, 61], [50, 54, 57]], [33, 28, 30, 26]),   # I V vi IV
         ([[57, 61, 64], [54, 57, 61], [50, 54, 57], [52, 56, 59]], [33, 30, 26, 28]),   # I vi IV V
         ([[54, 57, 61], [50, 54, 57], [57, 61, 64], [52, 56, 59]], [30, 26, 33, 28])]   # vi IV I V
chords, bass = PROGS[SEED % 3]
chords = [[m + SHIFT for m in c] for c in chords]; bass = [b + SHIFT for b in bass]
mel_pat = [0, 2, 1, 2, 0, 2, 1, 3]
for b in range(int(DUR / BAR) + 1):
    st = b * BAR; ch = chords[b % 4]
    add(pad([hz(m) for m in ch], BAR), st, 0.10)
    for k in range(4):
        add(marimba(hz(bass[b % 4] + 12), 0.4), st + k * B, 0.25)
    notes = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24]
    for i, p in enumerate(mel_pat):
        if not (b % 2 and i in (5, 7)):
            add(marimba(hz(notes[p])), st + i * B / 2, 0.16)
    for k in range(4):
        add(kick(), st + k * B, 0.45)
        if k in (1, 3): add(clap(), st + k * B, 0.22)
        for h in range(4): add(shaker(), st + k * B + h * B / 4, 0.05 + 0.03 * (h % 2))

if len(sys.argv) > 6:   # quiz SFX: soft tick each second, bright chime on reveal
    q0, seg, think, n = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
    t = np.arange(int(0.05*SR)) / SR; tick = np.sin(2*np.pi*2000*t) * np.exp(-t*90)
    t2 = np.arange(int(0.8*SR)) / SR
    chime = sum(np.sin(2*np.pi*f*t2) for f in (1046.5, 1318.5, 1568.0)) / 3 * np.exp(-t2*5)
    for k in range(n):
        for s in range(int(think)): add(tick, q0 + k*seg + s, 0.5)
        add(chime, q0 + k*seg + think, 0.7)

fi, fo = int(0.5*SR), int(2.5*SR)
x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
x = x / np.abs(x).max() * 0.62
st = np.stack([x, np.roll(x, 90)], 1)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print("music ok", DUR, "bpm", BPM, "shift", SHIFT)
