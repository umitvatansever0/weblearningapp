# DeutschStep daily video runbook

Owner: Ümit (deutschstep.com). **Since 2026-10-30 videos go to TikTok only (@deutschstep.com), through the
Higgsfield TikTok connector (connector_id `af429de6-3648-4b8b-88df-2d7b1b4d8ce1`). Do NOT post through Metricool**
(its free plan allows only 20 posts a month and was used up) and do not post to Instagram.

TikTok requires the owner to approve every post in Higgsfield's publish form, so posting is split:

### A. Producer run (05:40) — make today's 3 videos, do not post
- Times for the 3 videos: `schedule.json` → `daily_times` (currently 09:00, 14:30, 17:00).
- For each time make one video (steps below), commit + push.
- After pushing, get the commit SHA (`git rev-parse HEAD`) and import each video into Higgsfield with
  `media_import_url` using the jsDelivr URL
  `https://cdn.jsdelivr.net/gh/umitvatansever0/weblearningapp@<SHA>/videos/<name>.mp4` (type video).
  (raw.githubusercontent.com does NOT work — it is served as octet-stream.)
- Append one line per video to `automation/tiktok_queue.csv`:
  `date,time,video,media_id,hf_url,title,status` with `hf_url` =
  `https://d2ol7oe51mr4n9.cloudfront.net/user_3EzqnDmRRXCjAWhzkDsHCYXphAb/<media_id>.mp4`,
  `title` = `tiktok_hf_title` from the captions JSON, `status` = `ready`. Commit + push.

### B. Posting runs (09:00, 14:30, 17:00) — open the TikTok form
- Pull, find today's row in `tiktok_queue.csv` for this time with status `ready`.
- Call `tiktok_prepare_publish` (connector above, mode DIRECT_POST, media_type VIDEO, video_url = hf_url,
  title = title). Do not prefill privacy or other choices; the owner fills the form. Never call tiktok_publish.
- Set the row's status to `form_opened`, commit + push. Tell the owner in one short Turkish line that the form
  is ready and he only needs to press Post.
- If the row is missing (producer failed), say so; do not make a video in this run.

The posting-time experiment and Metricool analytics are paused (posting time now depends on when the owner
approves, so times cannot be compared fairly).

Video format (do not change without the owner asking): learn **5** German verbs (7 s each — the owner wants viewers
to have time to read: meaning, grammar tag, example sentence + English translation appear one after another) →
"QUIZ TIME" → 5 multiple-choice questions "Which verb means …?" (5 s countdown with ticks, then 2 s answer reveal) →
score + deutschstep.com call to action. deutschstep.com is always visible (gold header link, framed brand label at
the bottom with a gentle shine, "More examples → deutschstep.com" on every learn card). Faint drifting flowers,
leaves and butterflies plus a row of swaying tulips decorate the background. All on-screen text is English/German,
**never Turkish**. Music is original and varies with the seed. Total length ≈ 80 s.

## Steps for one video (repeat 3 times in the producer run A)

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
7. **Do not publish here.** Posting happens in the posting runs (section B).
8. **Report:** per video the time, the 5 items and the Higgsfield media_id, plus any problem.

## If something fails
- Higgsfield tools unavailable → render and push the videos anyway and say Higgsfield needs reconnecting in
  claude.ai connector settings. TikTok account in `error` state → say it needs `tiktok_reconnect`.
- Never post Turkish text, never delete earlier posts, never touch the `master` branch.
