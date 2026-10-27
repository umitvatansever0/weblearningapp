# DeutschStep daily video runbook

Owner: Ümit (deutschstep.com). Three runs per day publish one video each to **TikTok @deutschstep.com** and
**Instagram @deutschstepcom** through Metricool (brand / blogId **7639950**, timezone **Europe/Zurich**).

Video format (do not change without the owner asking): learn 10 German verbs (3.2 s each, meaning, grammar tag,
example sentence + English translation) → "QUIZ TIME" → 10 multiple-choice questions "Which verb means …?"
(5 s countdown with ticks, then 2 s answer reveal) → score + deutschstep.com call to action. All on-screen text is
English/German, **never Turkish**. Music is original and varies with the seed.

## Steps for one run

1. **Branch.** Work in a clone of `umitvatansever0/weblearningapp`, branch `social-media-assets`
   (orphan branch, not the website code). Pull first.
2. **Pick 10 verbs** at the level for the slot (default **B1**):
   - Not in `automation/used_verbs.json` (check every entry, case-insensitive, including `sich …` forms).
   - Prefer verbs from the site's own curriculum: `git show origin/master:src/course/<level>/…` (folders
     `src/course/a1 … c2`), then the Goethe/telc word list for that level.
   - Mix types (regular, separable, inseparable, reflexive, with preposition). Avoid near-synonyms in one video
     (the quiz options must be clearly distinct in meaning).
   - Everything must be correct German. Example sentences: short (≤ 7 words ideal), natural, everyday. Mark the verb
     forms to highlight with `*…*`. Give an accurate English translation.
   - `tag`: short grammar note, e.g. `separable · hat hergestellt`, `reflexive · für + Akk`, `ist gefahren`.
3. **Write** `automation/content/deutschstep_YYYYMMDD_HHMM.json` (HHMM = publish slot, e.g. 0900):
   `{"level": "B1", "seed": YYYYMMDDHHMM as int, "hook": "<optional one-line hook>", "verbs": [10 × {verb, en, tag, example, translation}]}`.
   Vary the `hook` between runs (e.g. "10 B1 verbs every German learner needs", "Can you remember all 10?").
   Keep `en` short (≤ 22 characters) so it fits on one line.
4. **Render:** `automation/make_video.sh automation/content/<name>.json` (~2 min). Needs ffmpeg, Pillow, numpy and
   the Inter font at `/usr/share/fonts/opentype/inter/`.
5. **Check:** open (Read) the preview PNGs in `automation/out/` — no text running off the screen, no overlaps,
   correct answer marked green. If a verb or example is too long, shorten it and re-render.
6. **Commit and push** `videos/<name>.mp4`, the content JSON and the updated `used_verbs.json`
   (append `{date, slot, level, verbs}`). Do **not** commit `automation/out/`. Verify the raw URL returns HTTP 200:
   `https://raw.githubusercontent.com/umitvatansever0/weblearningapp/social-media-assets/videos/<name>.mp4`
7. **Publish** with Metricool `createScheduledPost` — two posts, both at the slot time (if the slot time is already
   past, use now + 3 minutes):
   - TikTok: providers `[{"network":"tiktok"}]`, `text` = `tiktok_text`, `tiktokData.title` = `tiktok_title`,
     PUBLIC_TO_EVERYONE, comments/duet/stitch enabled, `autoAddMusic` false, `isAigc` false.
   - Instagram: providers `[{"network":"instagram"}]`, `text` = `instagram_text`,
     `firstCommentText` = `instagram_first_comment`, `instagramData` = `{"type":"REEL","showReelOnFeed":true,"isAiGenerated":false}`.
   - Captions come from `automation/out/<name>.captions.json`. `media` = [raw URL].
8. **Report** in one short message: the 10 verbs, both post ids, scheduled time, any problem.

## If something fails
- Metricool tools unavailable / not authorised → render and push the video anyway, do **not** post anywhere else,
  and report that Metricool needs re-authorising in claude.ai connector settings.
- Never post Turkish text, never delete earlier posts, never touch the `master` branch.
