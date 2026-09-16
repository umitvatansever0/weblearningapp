# Phase 6 — A2 Full Curriculum Design

**Tarih:** 2026-09-16
**Durum:** Onaylandı

## 1. Amaç ve Kapsam

Phase 5, A1 seviyesini 12 üniteye/48 derse genişletmişti. Bu faz aynı ölçeklendirmeyi **sadece A2**'ye uygular: şu anda A2'de tek bir ünite (Vergangenheit) ve 1 ders bulunuyor; bu faz onu 12 üniteye, ünite başına 4 derse (toplam 48 ders) genişletir. B1/B2/C1/C2 her biri tek bir örnek ünite/ders içermeye devam eder (bu faz onlara dokunmaz) — B1'in aynı ölçekte doldurulması eşzamanlı, bağımsız bir faz (Phase 7) tarafından yürütülüyor.

## 2. Müfredat Taslağı

12 ünite × 4 ders = 48 ders. Goethe-Institut "Start Deutsch 2" / A2 müfredatına yakın, artan zorluk sırasına göre:

1. **Wiederholung & Alltag** *(mevcut "Vergangenheit" ünitesi, +3 ders)* — Perfekt mit "haben" (mevcut), Perfekt mit "sein", Zeitangaben der Vergangenheit, Wiederholung: Alltag erzählen
2. **Perfekt Vertiefung** — haben oder sein (Regeln), Partizip II unregelmäßiger Verben, trennbare Verben im Perfekt, nicht-trennbare & "-ieren"-Verben im Perfekt
3. **Komparativ & Superlativ** — Komparativ (regelmäßig), Komparativ mit Umlaut, Superlativ mit "am ...sten", unregelmäßige Formen (gut/viel/gern)
4. **Nebensätze mit "dass" und "weil"** — dass-Sätze, weil-Sätze, dass vs. weil, Verben mit "dass" (glauben, denken, wissen, hoffen)
5. **Nebensätze mit "wenn"** — wenn (zeitlich/wiederholt), wenn (Bedingung), wenn vs. wann, Haupt-/Nebensatz-Kombination
6. **Indirekte Fragesätze** — indirekte Ja/Nein-Fragen mit "ob", indirekte W-Fragen, einleitende Ausdrücke, direkte→indirekte Umwandlung
7. **Präteritum der Modalverben und "sein"/"haben"** — Präteritum sein/haben, Präteritum der Modalverben, "mochte"/"sollte", Präteritum vs. Perfekt
8. **Wechselpräpositionen Vertiefung** — Überblick (Wo? = Dativ), Wohin? = Akkusativ, Wo vs. Wohin Kontrast, feste Ausdrücke (warten auf, sich freuen auf)
9. **Adjektivdeklination** — Nominativ mit bestimmtem Artikel, Akkusativ mit bestimmtem Artikel, feminin/neutral/Plural, Übung
10. **Reflexive Verben** — Reflexivpronomen (Akkusativ), häufige reflexive Verben, Reflexivpronomen im Dativ, Übung im Alltag
11. **Zukunft mit "werden"** — Futur-I-Bildung, Futur I für Vorhersagen, Futur I vs. Präsens mit Zeitangabe, Übung: Pläne
12. **Beruf & Bewerbung** — Berufe (Wortschatz), über den Beruf sprechen, Lebenslauf/Bewerbung (Wortschatz), im Vorstellungsgespräch

Her ünite bir öncekinin üzerine inşa edilir (örn. Perfekt Vertiefung'den önce temel Perfekt; Adjektivdeklination'den önce Wechselpräpositionen'in Akkusativ/Dativ ayrımı; Zukunft'tan önce Präteritum ile zaman kavramları oturur).

## 3. İçerik Kuralları (Her Ders İçin)

Mevcut A2 "Vergangenheit" dersindeki ve Phase 5'in A1 desenindeki ile birebir aynı:

- **Açıklama:** `explanationDe` / `explanationEn` / `explanationTr` — 1-3 cümlelik gramer açıklaması, örnek Almanca cümle içerir. Almanca örnekler her zaman Almanca kalır; sadece açıklama metni çevrilir.
- **Egzersizler:** Ders başına tam 2 egzersiz, mevcut 5 tipten (MULTIPLE_CHOICE, FILL_IN_BLANK, MATCHING, SENTENCE_ORDER, SHORT_ANSWER) karışık seçilir. `SENTENCE_ORDER` `data.words` her zaman tek kelimelerden oluşur (çok kelimeli öbekler yok). Her `MATCHING` egzersizinde `data.rights` dizisi `data.lefts` ile pozisyonel olarak hizalı OLMAMALI (Phase 5'in son incelemesinde bulunan gerçek bir hatanın tekrarını önlemek için) — `correctAnswer.pairs` string eşleşmesiyle çalışır, dizi pozisyonuyla değil.
- **Kelime Kartları:** Ders başına tam 2 `VocabWord`, `word` + `translationEn` + `translationTr` + `exampleSentence`. Hiçbir kelime (word + tüm çeviriler + örnek cümle birebir aynı olacak şekilde) dosyanın başka hiçbir yerinde tekrar etmemeli.
- **Ton/Stil:** A2 seviyesine uygun, A1'den biraz daha karmaşık cümleler; mevcut "Vergangenheit" dersiyle aynı üslup.

## 4. Teknik Yaklaşım

- Tüm yeni içerik `prisma/seed.ts` dosyasına eklenir — mevcut tek-kaynak deseni korunur.
- Mevcut `a2Unit`/`a2Lesson` (order: 1) değişkenleri korunur; sadece 3 yeni ders (order 2-4) eklenir. Yeni eklenen her şey `a2` önekli değişken adları kullanır (`a2Unit2`, `a2Unit2Lesson1`, vb.) — hiçbir `a1*` değişken adıyla çakışmaz.
- Yeni üniteler (2-12), `// --- B1: Nebensätze (1 sample lesson) ---` yorum satırından hemen önce eklenir; bu yorum satırı değişmeden kalır (Phase 7'nin B1 çalışması için de sabit bir çapa noktası).
- Script'in "FK-safe delete + re-create" davranışı değişmez; her çalıştırmada tüm içerik (A1-C2) yeniden oluşturulur.
- `tests/integration/seedContent.test.ts` ve `tests/integration/learn.test.ts` dosyalarına A2'ye özgü yeni test blokları eklenir (mevcut A1 odaklı testlerin gövdesi değiştirilmez — B1 track'i aynı dosyalarda paralel çalışıyor, metinsel çakışmayı önlemek için).
- Mevcut `npx vitest run` ve `npx eslint .` her adımdan sonra temiz olmalı.

## 5. Kapsam Dışı

- B1/B2/C1/C2 içeriğinin genişletilmesi (B1 ayrı, eşzamanlı bir faz; B2/C1/C2 sonraki fazlar).
- Admin panel üzerinden manuel içerik girişi (bu faz `seed.ts` üzerinden gidiyor; admin panel CRUD zaten var).
- Yeni egzersiz tipleri veya veri modeli değişiklikleri.
