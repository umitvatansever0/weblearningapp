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

out = {
    "tiktok_title": f"{hook} 🇩🇪 What's your score? 👇"[:150],
    "tiktok_text": f"{hook} 🇩🇪\n5 seconds per question. What's your score? Comment below 👇\nFree A1–C2 lessons: deutschstep.com\n\n{tags_tt}",
    "instagram_text": f"{hook} 🇩🇪\n\n{lines}\n\n5 seconds per question. What's your score? Comment below 👇\nSave this for later 📌\n\nFree A1–C2 lessons + placement test: deutschstep.com (link in bio)\n\n{tags_ig}",
    "instagram_first_comment": "What's your score? Comment it 👇 Free German lessons: deutschstep.com",
}
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(json.dumps(out, ensure_ascii=False, indent=2))
