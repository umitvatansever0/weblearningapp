"""Build TikTok + Instagram captions from a content JSON. usage: captions.py content.json out.json"""
import json, sys

c = json.load(open(sys.argv[1], encoding="utf-8"))
lvl = c.get("level", "B1")
kind = c.get("kind", "verbs")
noun = {"verbs": "verbs", "prep_verbs": "verbs with prepositions", "nouns": "nouns",
        "adjectives": "adjectives", "words": "words"}.get(kind, "verbs")
tag_kind = {"verbs": "#germanverbs", "prep_verbs": "#germanverbs", "nouns": "#germanvocabulary",
            "adjectives": "#germanvocabulary", "words": "#germanvocabulary"}.get(kind, "#germanverbs")
hook = c.get("hook", f"Learn {len(c['verbs'])} {lvl} German {noun}, then take the quiz")
tags_tt = f"#learngerman #germanquiz #german{lvl.lower()} #deutschlernen {tag_kind} #{lvl.lower()}deutsch #studygerman #languagelearning #deutschstep #fyp"
tags_ig = f"#learngerman #germanquiz #german{lvl.lower()} #deutschlernen {tag_kind} #{lvl.lower()}deutsch #studygerman #germangrammar #deutschstep #reels"
lines = "\n".join(f"{i + 1}. {v['verb']}: {v['en']}" for i, v in enumerate(c["verbs"]))

# Emotional, comment-driving TikTok descriptions (English, never Turkish). One is picked per day from the seed so
# followers don't see the same text twice in a row. Each ends with ONE clear, easy reason to comment.
first = c["verbs"][0]["verb"]
CTAS = [
    ("Learning German can feel lonely. It's not. 🤍",
     "So many of us are on this road together — some days you get 5/5, some days 1/5, and both count.\n"
     "👇 Drop your score below. No judgment, only Mut machen (encouragement)."),
    ("Remember the first time someone answered you in German and you understood? 🥹",
     "That feeling comes from days like this one — 5 small words at a time.\n"
     "👇 Tell us: which word from today will you actually use this week?"),
    ("Be honest… did one of these words make you freeze? 😅",
     "We've all been there. That's exactly the word worth learning today.\n"
     "👇 Comment the word that got you — let's see which one beats the most people."),
    ("Your future self in Germany will thank you for these 80 seconds. 🇩🇪",
     "Every expert was once a beginner who didn't give up.\n"
     "👇 Write \"Ich schaffe das!\" (I can do this!) if you're not giving up either."),
    ("Quick check-in: how long have you been learning German? ⏳",
     "Some of us just started, some have been at it for years — we're all still learning.\n"
     "👇 Comment your score AND how long you've been learning. Let's motivate each other."),
    ("Nobody tells you how good it feels when German finally clicks. ✨",
     "Today might be that day. Take the quiz without looking at the answers.\n"
     "👇 Score in the comments — the honest ones are the best ones."),
    (f"If you got \"{first}\" right, you're already further than you think. 💪",
     "Learning a language is hard, and you're doing it anyway. That deserves respect.\n"
     "👇 What's the hardest part of German for you? Grammar, words or speaking?"),
    ("Who else is learning German for someone or something they love? ❤️",
     "A partner, a job, a new home, a dream… every word brings you closer.\n"
     "👇 Tell us your reason in the comments — your story might motivate someone else today."),
]
cta_head, cta_body = CTAS[(c.get("seed", 0) // 10000) % len(CTAS)]

out = {
    "tiktok_title": f"{cta_head} {hook} 🇩🇪"[:150],
    "tiktok_text": f"{cta_head}\n\n{hook} 🇩🇪 — 5 seconds per question.\n{cta_body}\n\n"
                   f"📚 Free A1–C2 lessons: deutschstep.com\n\n{tags_tt}",
    "instagram_text": f"{hook} 🇩🇪\n\n{lines}\n\n5 seconds per question. What's your score? Comment below 👇\nSave this for later 📌\n\nFree A1–C2 lessons + placement test: deutschstep.com (link in bio)\n\n{tags_ig}",
    "instagram_first_comment": "What's your score? Comment it 👇 Free German lessons: deutschstep.com",
}
# Higgsfield TikTok publishing sends only the title (max 150 chars): keep the site and as many hashtags as fit
hf = f"{hook} 🇩🇪 What's your score? 👇 deutschstep.com"
for t in ["#learngerman", "#deutschlernen", tag_kind, f"#german{lvl.lower()}", "#studygerman", "#fyp"]:
    if len(hf) + 1 + len(t) <= 150: hf += " " + t
out["tiktok_hf_title"] = hf
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(json.dumps(out, ensure_ascii=False, indent=2))
