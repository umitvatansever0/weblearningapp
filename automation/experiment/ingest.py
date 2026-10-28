"""Append a metrics snapshot from raw Metricool analytics output.

usage: ingest.py tiktok_rows.json instagram_rows.json
  tiktok_rows.json    = Metricool getAnalyticsDataByMetrics output for
                        ["TKPO02","TKPO03","TKPO07","TKPO11","TKPO08","TKPO09","TKPO10"]
                        (time UTC, url, views, reach, likes, comments, shares)
  instagram_rows.json = output for ["IGRE02","IGRE06","IGRE23","IGRE11","IGRE10","IGRE07","IGRE21","IGRE12"]
                        (time UTC, url, views, reach, likes, comments, shares, saves)
Each row is matched to the experiment plan (local date + slot within ±25 min).
Writes metrics.csv (one row per post per snapshot) and refreshes LOG.md.
"""
import csv, json, sys, os, datetime as dt
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
TZ = ZoneInfo("Europe/Zurich")
plan = json.load(open(os.path.join(HERE, "plan.json")))
FIELDS = ["snapshot_utc", "platform", "posted_local", "date", "slot", "band", "url",
          "views", "reach", "likes", "comments", "shares", "saves"]
band_of = {t: b for b, ts in plan["bands"].items() for t in ts}

def rows(path):
    d = json.load(open(path))
    return d.get("rows", d) if isinstance(d, dict) else d

def num(v):
    try: return int(float(v))
    except (TypeError, ValueError): return 0

def match(ts_utc):
    t = dt.datetime.strptime(ts_utc[:14], "%Y%m%d%H%M%S").replace(tzinfo=dt.timezone.utc).astimezone(TZ)
    slots = plan["days"].get(t.date().isoformat())
    if not slots: return t, None
    for s in slots:
        h, m = map(int, s.split(":"))
        target = t.replace(hour=h, minute=m, second=0)
        if abs((t - target).total_seconds()) <= 25 * 60: return t, s
    return t, None

now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
out = []
for platform, path in (("tiktok", sys.argv[1]), ("instagram", sys.argv[2])):
    for r in rows(path):
        if not r or not r[0]: continue
        t, slot = match(str(r[0]))
        if slot is None: continue            # not an experiment post
        if platform == "tiktok":
            views, reach, likes, comments, shares, saves = num(r[2]), num(r[3]), num(r[4]), num(r[5]), num(r[6]), 0
        else:
            views, reach, likes, comments, shares, saves = num(r[2]), num(r[3]), num(r[4]), num(r[5]), num(r[6]), num(r[7])
        out.append(dict(snapshot_utc=now, platform=platform, posted_local=t.strftime("%Y-%m-%d %H:%M"),
                        date=t.date().isoformat(), slot=slot, band=band_of[slot], url=str(r[1]).split("?")[0],
                        views=views, reach=reach, likes=likes, comments=comments, shares=shares, saves=saves))

path = os.path.join(HERE, "metrics.csv")
new = not os.path.exists(path)
with open(path, "a", newline="") as f:
    w = csv.DictWriter(f, FIELDS)
    if new: w.writeheader()
    w.writerows(out)
print(f"appended {len(out)} rows at {now}")
os.system(f"{sys.executable} {os.path.join(HERE, 'analyze.py')} --log")
