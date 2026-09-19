# Phase 7 — B1 Full Curriculum Design

**Tarih:** 2026-09-16
**Durum:** Onaylandı

## 1. Amaç ve Kapsam

Master tasarım dokümanının hedeflediği "B1 seviyesi tam içerikle" durumuna ulaşmak. Şu anda B1 seviyesinde tek bir ünite (Nebensätze) ve 1 ders bulunuyor; A1 zaten Phase 5'te 12 üniteye genişletildi. A2/B2/C1/C2 her biri tek bir örnek ünite/ders içeriyor (bu faz onları değiştirmiyor — A2/B2 aynı ölçekte doldurulması paralel, ayrı fazlardır ve bu worktree'den bağımsız yürütülüyor). Bu faz **sadece B1**'i 12 üniteye, ünite başına 4 derse genişletir.

## 2. Müfredat Taslağı

12 ünite × 4 ders = 48 ders. B1 seviyesi (Goethe-Institut "Zertifikat Deutsch B1" müfredatına yakın), artan zorluk sırasına göre, A1/A2'nin üzerine inşa edilir:

1. **Wiederholung & Nebensätze** *(mevcut, +3 ders)* — Nebensätze mit "weil" (mevcut), Nebensätze mit "dass", Nebensätze mit "wenn", Wiederholung (weil/dass/wenn karışık)
2. **Konjunktiv II** — würde + Infinitiv, wäre (sein), hätte (haben), Höfliche Bitten & Wünsche
3. **Passiv im Präsens und Präteritum** — Passiv Präsens, Passiv Präteritum, Passiv mit Modalverben, Wiederholung
4. **Relativsätze** — Relativpronomen Nominativ, Relativpronomen Akkusativ, Relativsätze mit Präpositionen, Übung
5. **Genitiv** — Genitiv-Artikel, Genitivpräpositionen (wegen/trotz/während), Possessiv mit Genitiv, Übung
6. **Plusquamperfekt** — Bildung mit "hatte", Bildung mit "war", Plusquamperfekt mit "nachdem", Übung
7. **Doppelkonjunktionen** — je...desto, sowohl...als auch, weder...noch, Übung
8. **Infinitiv mit "zu"** — Infinitiv mit "zu" nach Verben, "um...zu", "ohne...zu", Übung
9. **Adjektivdeklination komplett** — Nominativ/Akkusativ, Dativ, alle Artikeltypen (bestimmt/unbestimmt/ohne Artikel), Übung
10. **Nebensätze mit "obwohl", "während", "nachdem"** — obwohl, während, nachdem, Wiederholung
11. **Konnektoren** — trotzdem, deshalb, außerdem, allerdings
12. **Indirekte Rede & Nomen-Verb-Verbindungen** — Indirekte Rede (Grundlagen), Nomen-Verb-Verbindungen, Wiederholung Indirekte Rede, Abschlusswiederholung B1

Her ünite bir öncekinin üzerine inşa edilir (örn. Relativsätze'den önce Nebensätze, Plusquamperfekt'ten önce Perfekt/Präteritum bilgisi).

## 3. İçerik Kuralları (Her Ders İçin)

Mevcut A1 deseninin (Phase 5) ve B1 örnek dersinin (Nebensätze mit weil) birebir aynısı:

- **Açıklama:** `explanationDe` / `explanationEn` / `explanationTr` — 1-3 cümlelik gramer açıklaması, örnek Almanca cümle içerir. Almanca örnekler her zaman Almanca kalır; sadece açıklama metni çevrilir.
- **Egzersizler:** Ders başına tam olarak 2 egzersiz, mevcut 5 tipten (MULTIPLE_CHOICE, FILL_IN_BLANK, MATCHING, SENTENCE_ORDER, SHORT_ANSWER) karışık seçilir.
- **Kelime Kartları:** Ders başına tam olarak 2 `VocabWord`, `word` + `translationEn` + `translationTr` + `exampleSentence`. Hiçbir kelime (aynı word+translations+exampleSentence) dosyanın başka hiçbir yerinde (A1'in tüm üniteleri, diğer seviyelerin örnek dersleri dahil) tekrarlanamaz.
- **MATCHING egzersizleri:** `data.rights` dizisi `data.lefts` ile pozisyonel olarak hizalanamaz (Phase 5'in son incelemesinde bulunan kritik hata — bkz. plan dokümanı). `correctAnswer.pairs` string eşleşmesiyle çalışır, dizi pozisyonuyla değil.
- **SENTENCE_ORDER:** `data.words` tokenleri her zaman tek kelime, asla çok kelimeli öbek olmamalı.
- **FILL_IN_BLANK/SHORT_ANSWER:** `accepted` dizisi sadece kanonik (umlaut içeren) yazımı içerir yeterlidir (checker her iki tarafı da normalize eder); ancak doğal bir kabul edilen ifade virgül gibi bir noktalama içeriyorsa ve öğrenci makul şekilde atlayabilecekse, noktalama içermeyen bir varyant da eklenir.
- **Ton/Stil:** B1 seviyesine uygun, orta karmaşıklıkta cümleler; mevcut Nebensätze dersiyle aynı üslup.

## 4. Teknik Yaklaşım

- Tüm yeni içerik `prisma/seed.ts` dosyasına eklenir — mevcut tek-kaynak deseni korunur.
- Script'in "FK-safe delete + re-create" davranışı değişmez; her çalıştırmada B1 içeriği tamamen yeniden oluşturulur.
- Mevcut `b1Unit`/`b1Lesson` (order: 1) 4 derse genişletilir (order 2-4 eklenir). Yeni tüm değişkenler `b1` öneki taşır (`b1Unit2`, `b1Unit2Lesson1`, vb.) ve dosyadaki hiçbir `a1*`/`a2*` değişken adıyla çakışmaz.
- Yeni üniteler (2-12) `// --- B2: Passiv (1 sample lesson) ---` anchor yorumundan hemen önce, `levelId: b1.id` ve artan `order` (2-12) ile eklenir. Bu yorum satırı değiştirilmez — B2/C1/C2 kapsam dışıdır.
- `tests/integration/seedContent.test.ts` ve `tests/integration/learn.test.ts` güncellenir: A1'e paralel, B1 için "has 12 B1 units with four lessons each" gibi ayrı, yeni test blokları eklenir (mevcut A1 testleri değiştirilmez — paralel worktree'lerdeki A2/B2 çalışmalarıyla merge çakışmasını azaltmak için).
- Diğer seviyelere (A1 sabit, A2/B2/C1/C2) dokunulmaz.
- Mevcut `npx vitest run` ve `npx eslint .` her adımdan sonra temiz olmalı.

## 5. Kapsam Dışı

- A2/B2/C1/C2 içeriğinin genişletilmesi (paralel, ayrı worktree'lerde yürütülen fazlar).
- Admin panel üzerinden manuel içerik girişi (bu faz `seed.ts` üzerinden gidiyor).
- Yeni egzersiz tipleri veya veri modeli değişiklikleri.
