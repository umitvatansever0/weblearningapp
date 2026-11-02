# DeutschStep daily video runbook

Owner: Ümit (deutschstep.com). **Since 2026-11-02: ONE video per day, published automatically through Metricool
(brand / blogId 7639950, timezone Europe/Zurich) to TikTok @deutschstep.com ONLY, at 08:00. Do NOT post to Instagram.**
The owner does not want to be asked anything — no Higgsfield forms, no approvals.

Note: Metricool's free plan publishes 20 posts per calendar month; with TikTok only that is ~20 days; it resets on the 1st. Still schedule every day; if Metricool reports
"account limit", just report it in one line — do not try other platforms.

### Daily run (07:20)
- Pull. Make ONE video for slot 0800 (steps below), commit + push.
- Schedule ONE TikTok post with Metricool `createScheduledPost` at today 08:00 (if already past, now + 3 min):
  - TikTok: providers `[{"network":"tiktok"}]`, `text` = `tiktok_text`, `tiktokData.title` = `tiktok_title`,
    PUBLIC_TO_EVERYONE, comments/duet/stitch enabled, `autoAddMusic` false, `isAigc` false.
  - Captions from `automation/out/<name>.captions.json`; `media` = [raw.githubusercontent.com URL of the video].
- Report: the 5 items and the Metricool post id (or the error).

Video format (do not change without the owner asking): learn **5** German verbs (7 s each — the owner wants viewers
to have time to read: meaning, grammar tag, example sentence + English translation appear one after another) →
"QUIZ TIME" → 5 multiple-choice questions "Which verb means …?" (5 s countdown with ticks, then 2 s answer reveal) →
score + deutschstep.com call to action. deutschstep.com is always visible (gold header link, framed brand label at
the bottom with a gentle shine, "More examples → deutschstep.com" on every learn card). Faint drifting flowers,
leaves and butterflies plus a row of swaying tulips decorate the background. All on-screen text is English/German,
**never Turkish**. Music is original German-style (polka, schlager, volksmusik or Berlin electronic — rotates daily via automation/music.py; never use copyrighted songs). Total length ≈ 80 s.

## Steps for one video

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
3. **Write** `automation/content/deutschstep_YYYYMMDD_HHMM.json` (HHMM = publish time, e.g. 1000). 
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
7. **Publish** as described in "Daily run".

## If something fails
- Metricool tools unavailable / not authorised → render and push the video anyway, do not post anywhere else,
  and report that Metricool needs re-authorising in claude.ai connector settings.
- Never post Turkish text, never delete earlier posts, never touch the `master` branch.
