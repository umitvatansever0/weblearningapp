# DeutschStep daily video runbook

Owner: Ümit (deutschstep.com). Every day **three videos** are published to **TikTok @deutschstep.com** and
**Instagram @deutschstepcom** through Metricool (brand / blogId **7639950**, timezone **Europe/Zurich**).

## Publish times (posting-time experiment, 2026-10-29 → 2026-11-27)
The owner wants to learn which times get the most views and engagement, then post at those times for good.
- **Today's 3 times:** if today's date is in `experiment/plan.json` → use `days[<date>]` (one morning, one midday,
  one evening slot, rotated over 12 candidate times). Otherwise use `schedule.json` → `final_times`; if that is
  still null, use `default_times`.
- **One producer run per day (05:40)** makes all three videos and schedules all six posts (3 × TikTok + 3 ×
  Instagram) at exactly those times. Video `slot` HHMM = the publish time, e.g. `deutschstep_20261029_1000`.
- After scheduling, append one line per video to `experiment/posts.csv`
  (`date,slot,band,video,tiktok_post_id,instagram_post_id,verbs` — verbs joined with `;`).
- Never change `experiment/plan.json`. Times that were already in the past are skipped (do not post them late,
  that would spoil the comparison) — note it in the report.

### Daily metrics snapshot (23:20)
1. Metricool `getAnalyticsDataByMetrics` (brandId 7639950), from = experiment start (2026-10-29T00:00:00+01:00), to = now:
   - TikTok → save the raw JSON output to `/tmp/tt.json`, metrics
     `["TKPO02","TKPO03","TKPO07","TKPO11","TKPO08","TKPO09","TKPO10"]`
   - Instagram → `/tmp/ig.json`, metrics `["IGRE02","IGRE06","IGRE23","IGRE11","IGRE10","IGRE07","IGRE21","IGRE12"]`
   (write the tool output to the files exactly as returned, `{"rows": [...]}`).
2. `python3 automation/experiment/ingest.py /tmp/tt.json /tmp/ig.json` → appends to `experiment/metrics.csv` and
   refreshes `experiment/LOG.md`.
3. Commit + push (`metrics.csv`, `LOG.md`). Report the current leaders from LOG.md in two lines.

### Final decision (once, 2026-11-30)
1. Take a last snapshot exactly as above.
2. `python3 automation/experiment/analyze.py --apply` → writes `experiment/REPORT.md` and sets
   `schedule.json` → `final_times` (3 best times, ≥ 2 h apart, each with ≥ 6 data points).
3. Commit + push. From the next day on, the producer uses `final_times` every day.
4. Report the chosen times and the score table in plain words (Turkish is fine in the report message,
   but never in videos or captions).

Video format (do not change without the owner asking): learn **5** German verbs (7 s each — the owner wants viewers
to have time to read: meaning, grammar tag, example sentence + English translation appear one after another) →
"QUIZ TIME" → 5 multiple-choice questions "Which verb means …?" (5 s countdown with ticks, then 2 s answer reveal) →
score + deutschstep.com call to action. deutschstep.com is always visible (gold header link, framed brand label at
the bottom with a gentle shine, "More examples → deutschstep.com" on every learn card). Faint drifting flowers,
leaves and butterflies plus a row of swaying tulips decorate the background. All on-screen text is English/German,
**never Turkish**. Music is original and varies with the seed. Total length ≈ 80 s.

## Steps for one video (repeat 3 times in the producer run)

1. **Branch.** Work in a clone of `umitvatansever0/weblearningapp`, branch `social-media-assets`
   (orphan branch, not the website code). Pull first.
2. **Pick exactly 5 items**, following the owner's content order (move to the next stage only when the current one
   has no clearly-fitting unused items left; mention every stage change in the report):
   1. **B1 verbs** — `"kind": "verbs"`, `"level": "B1"` (current stage).
   2. **B1 verbs with fixed prepositions** (the owner calls them "phrasal verbs"), e.g. *warten auf*, *sich freuen
      über*, *teilnehmen an*, *abhängen von* — `"kind": "prep_verbs"`, `"level": "B1"`. `tag` shows the
      preposition + case, e.g. `auf + Akk · hat gewartet`.
   3. **A2 verbs** — `"kind": "verbs"`, `"level": "A2"`.
   4. **Nouns, everyday objects and adjectives** — `"kind": "nouns"` (always with article: `"verb": "der Schlüssel"`,
      `tag` = `der · die Schlüssel`) or `"kind": "adjectives"` (`tag` e.g. `opposite: kalt`). Keep one kind per
      video. Start at A2, then B1.
   The JSON field is still called `verbs` for every kind. Rules for all kinds:
   - Not in `automation/used_verbs.json` (check every entry, case-insensitive, including `sich …` forms; a
     verb + preposition counts as new only if that combination was never shown). Log nouns/adjectives there too.
   - Prefer verbs from the site's own curriculum: `git show origin/master:src/course/<level>/…` (folders
     `src/course/a1 … c2`), then the Goethe/telc word list for that level.
   - Mix types (regular, separable, inseparable, reflexive, with preposition). Avoid near-synonyms in one video
     (the quiz options must be clearly distinct in meaning).
   - Everything must be correct German. Example sentences: short (≤ 7 words ideal), natural, everyday. Mark the verb
     forms to highlight with `*…*`. Give an accurate English translation.
   - `tag`: short grammar note, e.g. `separable · hat hergestellt`, `reflexive · für + Akk`, `ist gefahren`.
3. **Write** `automation/content/deutschstep_YYYYMMDD_HHMM.json` (HHMM = publish time, e.g. 1000). The 3 videos of a day must use 15 different verbs:
   `{"level": "B1", "kind": "verbs", "seed": YYYYMMDDHHMM as int, "hook": "<optional one-line hook>", "verbs": [5 × {verb, en, tag, example, translation}]}`.
   Vary the `hook` between runs (e.g. "5 B1 verbs every German learner needs", "Can you remember all 5?").
   Keep `en` short (≤ 22 characters) so it fits on one line.
4. **Render:** `automation/make_video.sh automation/content/<name>.json` (~2 min). Needs ffmpeg, Pillow, numpy and
   the Inter font at `/usr/share/fonts/opentype/inter/`.
5. **Check:** open (Read) the preview PNGs in `automation/out/` — no text running off the screen, no overlaps,
   correct answer marked green. If a verb or example is too long, shorten it and re-render.
6. **Commit and push** `videos/<name>.mp4`, the content JSON and the updated `used_verbs.json`
   (append `{date, slot, level, verbs}`). Do **not** commit `automation/out/`. Verify the raw URL returns HTTP 200:
   `https://raw.githubusercontent.com/umitvatansever0/weblearningapp/social-media-assets/videos/<name>.mp4`
7. **Publish** with Metricool `createScheduledPost` — two posts per video, both at that video's publish time
   (skip a time that is already past during the experiment; outside the experiment use now + 3 minutes):
   - TikTok: providers `[{"network":"tiktok"}]`, `text` = `tiktok_text`, `tiktokData.title` = `tiktok_title`,
     PUBLIC_TO_EVERYONE, comments/duet/stitch enabled, `autoAddMusic` false, `isAigc` false.
   - Instagram: providers `[{"network":"instagram"}]`, `text` = `instagram_text`,
     `firstCommentText` = `instagram_first_comment`, `instagramData` = `{"type":"REEL","showReelOnFeed":true,"isAiGenerated":false}`.
   - Captions come from `automation/out/<name>.captions.json`. `media` = [raw URL].
8. **Record + report:** append to `experiment/posts.csv` (during the experiment), commit + push, then report in one short message: per video the time, the 5 verbs and both post ids, plus any problem.

## If something fails
- Metricool tools unavailable / not authorised → render and push the video anyway, do **not** post anywhere else,
  and report that Metricool needs re-authorising in claude.ai connector settings.
- Never post Turkish text, never delete earlier posts, never touch the `master` branch.
