# Posting-time experiment (2026-10-29 → 2026-11-27)

Goal: find the 3 publish times (Europe/Zurich) that bring the most views and engagement on TikTok and Instagram,
then post at those times permanently.

- 12 candidate times in 3 bands — morning 07:00 / 08:30 / 10:00 / 11:00, midday 12:00 / 13:30 / 15:00 / 16:00,
  evening 17:30 / 18:30 / 20:00 / 21:30 (based on Metricool's TikTok audience-activity curve, which peaks around
  10:00, 12:00 and 18:00).
- Each day uses one time from each band (`plan.json`), so every time is tested 7–8 times on different weekdays.
- `metrics.csv` gets a daily snapshot of every experiment post; `LOG.md` shows the running ranking;
  `REPORT.md` is written on 2026-11-30 together with `../schedule.json` → `final_times`.
- Scoring: each post is compared with the other posts **of the same day** (relative views and relative engagement
  rate), so the account's growth during the month does not favour later dates. Score = 0.7 × relative views +
  0.3 × relative engagement, averaged over both platforms.
- Limits: ~15 posts per time over a month is a small sample; content (verbs, hook) also varies. If the best and
  worst slots differ by less than 0.3, timing matters little for this account and the report says so.
