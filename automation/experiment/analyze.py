"""Analyse the posting-time experiment.

usage: analyze.py --log      refresh LOG.md (running summary, used after every snapshot)
       analyze.py --final    write REPORT.md and print the 3 recommended times
       analyze.py --apply    like --final, and also write them to ../schedule.json as final_times

Method (fair to every slot even though the account grows during the month):
  * take the latest snapshot of every post;
  * per platform and per day, divide each post's views by the mean views of that day's posts
    -> "relative views" (1.00 = average for that day). Same for engagement rate
    (likes + comments + shares + saves) / views;
  * slot score = 0.7 * mean relative views + 0.3 * mean relative engagement, averaged over TikTok and Instagram;
  * pick the 3 best slots that are at least 2 hours apart.
"""
import csv, json, os, sys, statistics as st
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open(os.path.join(HERE, "plan.json")))
ALL_SLOTS = [t for ts in plan["bands"].values() for t in ts]

def load():
    p = os.path.join(HERE, "metrics.csv")
    if not os.path.exists(p): return []
    latest = {}
    for r in csv.DictReader(open(p)):
        k = (r["platform"], r["url"])
        if k not in latest or r["snapshot_utc"] >= latest[k]["snapshot_utc"]: latest[k] = r
    for r in latest.values():
        for f in ("views", "reach", "likes", "comments", "shares", "saves"): r[f] = int(r[f])
        r["eng"] = (r["likes"] + r["comments"] + r["shares"] + r["saves"]) / r["views"] if r["views"] else 0.0
    return list(latest.values())

def scores(posts):
    byday = defaultdict(list)
    for p in posts: byday[(p["platform"], p["date"])].append(p)
    rel = defaultdict(lambda: defaultdict(list))      # slot -> platform -> [(rv, re)]
    for (plat, _), ps in byday.items():
        if len(ps) < 2: continue                        # need at least 2 posts that day to compare
        mv = st.mean(p["views"] for p in ps) or 1
        me = st.mean(p["eng"] for p in ps) or 0
        for p in ps:
            rel[p["slot"]][plat].append((p["views"] / mv, (p["eng"] / me) if me else 1.0))
    res = {}
    for s in ALL_SLOTS:
        per = {}
        for plat in ("tiktok", "instagram"):
            xs = rel[s][plat]
            if xs: per[plat] = (st.mean(a for a, _ in xs), st.mean(b for _, b in xs), len(xs))
        if per:
            sc = st.mean(0.7 * v + 0.3 * e for v, e, _ in per.values())
            res[s] = dict(score=sc, n=sum(n for *_, n in per.values()), **{f"{k}": v for k, v in per.items()})
    return res

def raw_table(posts):
    agg = defaultdict(lambda: defaultdict(list))
    for p in posts: agg[p["slot"]][p["platform"]].append(p)
    return agg

def pick(res, k=3, gap=120):
    mins = lambda t: int(t[:2]) * 60 + int(t[3:])
    chosen = []
    for s in sorted(res, key=lambda s: -res[s]["score"]):
        if res[s]["n"] < 6: continue                     # too few data points to trust
        if all(abs(mins(s) - mins(c)) >= gap for c in chosen): chosen.append(s)
        if len(chosen) == k: break
    return sorted(chosen, key=mins)

def table(res, posts):
    agg = raw_table(posts)
    lines = ["| Time | Score | TikTok rel. views | IG rel. views | Avg TikTok views | Avg IG views | Avg eng. rate | Posts |",
             "|---|---|---|---|---|---|---|---|"]
    for s in sorted(ALL_SLOTS, key=lambda s: -res.get(s, {"score": -1})["score"]):
        r = res.get(s)
        if not r:
            lines.append(f"| {s} | – | – | – | – | – | – | 0 |"); continue
        tt = agg[s]["tiktok"]; ig = agg[s]["instagram"]
        avg = lambda xs, f: "%.0f" % st.mean(x[f] for x in xs) if xs else "–"
        relv = lambda k: "%.2f" % r[k][0] if k in r else "–"
        er = [x["eng"] for x in tt + ig]
        eng = "%.1f%%" % (st.mean(er) * 100) if er else "–"
        lines.append(f"| {s} | {r['score']:.2f} | {relv('tiktok')} | {relv('instagram')} | "
                     f"{avg(tt, 'views')} | {avg(ig, 'views')} | {eng} | {len(tt) + len(ig)} |")
    return "\n".join(lines)

if __name__ == "__main__":
    posts = load(); res = scores(posts)
    days = sorted({p["date"] for p in posts})
    head = (f"Posts measured: {len(posts)} (TikTok {sum(p['platform']=='tiktok' for p in posts)}, "
            f"Instagram {sum(p['platform']=='instagram' for p in posts)}) over {len(days)} days "
            f"({days[0] if days else '–'} → {days[-1] if days else '–'}).")
    if "--log" in sys.argv:
        open(os.path.join(HERE, "LOG.md"), "w").write(
            "# Posting-time experiment — running log\n\nScore 1.00 = average for that day. Higher is better.\n\n"
            f"{head}\n\n{table(res, posts)}\n\nCurrent leaders (≥ 2 h apart, ≥ 6 data points): {', '.join(pick(res)) or 'not enough data yet'}\n")
        print(head)
    if "--final" in sys.argv or "--apply" in sys.argv:
        best = pick(res)
        if len(best) < 3:   # fall back: fill with the next best slots that respect the gap, ignoring the n>=6 rule
            mins = lambda t: int(t[:2]) * 60 + int(t[3:])
            for s in sorted(res, key=lambda s: -res[s]["score"]):
                if len(best) == 3: break
                if all(abs(mins(s) - mins(c)) >= 120 for c in best): best.append(s)
            best = sorted(best, key=mins)
        spread = (max(r["score"] for r in res.values()) - min(r["score"] for r in res.values())) if res else 0
        open(os.path.join(HERE, "REPORT.md"), "w").write(
            f"# Posting-time experiment — final report\n\n{head}\n\n{table(res, posts)}\n\n"
            f"**Chosen times (Europe/Zurich): {', '.join(best)}**\n\n"
            f"Score spread between best and worst slot: {spread:.2f} "
            f"({'clear difference' if spread >= 0.3 else 'small difference — timing matters little for this account so far'}).\n")
        print("BEST", json.dumps(best))
        if "--apply" in sys.argv:
            sp = os.path.join(os.path.dirname(HERE), "schedule.json")
            s = json.load(open(sp)); s["final_times"] = best
            json.dump(s, open(sp, "w"), indent=2); print("applied to schedule.json")
