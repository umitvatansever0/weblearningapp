# Phase 8 — B2 Full Curriculum Design

**Tarih:** 2026-09-16
**Durum:** Onaylandı

## 1. Amaç ve Kapsam

Master tasarım dokümanının hedeflediği "B2 seviyesi tam içerikle" durumuna ulaşmak. Şu anda B2 seviyesinde tek bir ünite (Passiv) ve 1 ders bulunuyor; A1 daha önce (Phase 5) 12 üniteye genişletildi, A2 ve B1 aynı ölçekte paralel fazlarda genişletiliyor (bu faz onlara dokunmuyor). Bu faz **sadece B2**'yi 12 üniteye, ünite başına 4 derse genişletir. C1/C2'nin aynı ölçekte doldurulması ayrı, sonraki fazlardır.

## 2. Müfredat Taslağı

12 ünite × 4 ders = 48 ders. Goethe-Institut B2 müfredatına yakın, artan zorluk sırasına göre:

1. **Wiederholung & Passiv** *(mevcut, +3 ders)* — Vorgangspassiv im Präsens (mevcut), Vorgangspassiv im Präteritum, Zustandspassiv, Passiv im Perfekt
2. **Konjunktiv I (formelle indirekte Rede)** — Konjunktiv-I-Formen (regelmäßige Verben), Konjunktiv I von sein/haben/Modalverben, Ersatzform mit "würde", indirekte Fragen/Aufforderungen
3. **Passiv mit Modalverben** — Präsens (muss gemacht werden), Präteritum (musste gemacht werden), Negation im Passiv mit Modalverben, Wiederholung
4. **Partizipialattribute** — Partizip I als Adjektiv, Partizip II als Adjektiv, erweiterte Partizipialattribute, Umwandlung zu Relativsätzen
5. **Nominalisierung** — Verben zu Nomen (-ung), Adjektive zu Nomen (-heit/-keit), Infinitiv als Nomen, Nominalisierung in formellen Texten
6. **Komplexe Konnektoren** — dennoch/trotzdem, gleichwohl, insofern (als), zumal
7. **Funktionsverbgefüge** — in Frage stellen/zur Verfügung stehen, Anwendung finden/Rücksicht nehmen, zum Ausdruck bringen/in Betracht ziehen, Wiederholung
8. **Textkohärenz** — Personalpronomen als Verweiswörter, Demonstrativpronomen als Verweis, Konnektoren zur Textverknüpfung, Verweiswörter (dabei/dazu/damit)
9. **Konjunktiv II der Vergangenheit** — Bildung mit "hätte" + Partizip II, Bildung mit "wäre" + Partizip II, irreale Bedingungssätze der Vergangenheit, Wiederholung
10. **Passiversatzformen** — "sich lassen" + Infinitiv, man-Konstruktion, sein + zu + Infinitiv, Vergleich der Passiversatzformen
11. **Relativsätze mit Präpositionen** — Präposition + Relativpronomen (Akkusativ), Präposition + Relativpronomen (Dativ), "was"/"wo(r)+Präposition", Wiederholung
12. **Redewiedergabe & formelle Stilmittel** — Redewiedergabe mit Konjunktiv I, Nominalstil vs. Verbalstil, formelle Konnektoren in Berichten, Wiederholung Gesamtkurs B2

Her ünite bir öncekinin üzerine inşa edilir (örn. Konjunktiv I'den önce Passiv temeli, Passiversatzformen'den önce "sich lassen"in temelini oluşturan Passiv mit Modalverben, Relativsätze mit Präpositionen'den önce temel Relativsatz bilgisi varsayılır — B1'de işlenmiştir).

## 3. İçerik Kuralları (Her Ders İçin)

Mevcut Passiv ünitesindeki desenle ve Phase 5/A1 desenle birebir aynı:

- **Açıklama:** `explanationDe` / `explanationEn` / `explanationTr` — 1-3 cümlelik gramer açıklaması, örnek Almanca cümle içerir. Almanca örnekler her zaman Almanca kalır; sadece açıklama metni çevrilir.
- **Egzersizler:** Ders başına tam olarak 2 egzersiz, mevcut 5 tipten (MULTIPLE_CHOICE, FILL_IN_BLANK, MATCHING, SENTENCE_ORDER, SHORT_ANSWER) karışık seçilir.
- **MATCHING kısıtı:** Her MATCHING egzersizinde `data.rights` dizisi `data.lefts` ile pozisyonel olarak hizalanmamalıdır (`rights[i]` hiçbir `i` için `lefts[i]`'nin doğru eşleşmesi olmamalı) — öğrencinin Almanca bilmeden "aynı satırı seçerek" doğru cevaba ulaşmasını önlemek için. `correctAnswer.pairs` string eşitliğiyle eşleşir, pozisyona göre değil.
- **Kelime Kartları:** Ders başına tam olarak 2 `VocabWord`, `word` + `translationEn` + `translationTr` + `exampleSentence`. Dosyanın hiçbir yerinde (tüm seviyeler dahil) aynı `word` + aynı çeviriler + aynı örnek cümleyle tekrar eden bir kelime kartı olmayacak.
- **Ton/Stil:** B2 seviyesine uygun, biraz daha karmaşık ve resmi cümle yapıları; mevcut Passiv dersiyle aynı üslup.

## 4. Teknik Yaklaşım

- Tüm yeni içerik `prisma/seed.ts` dosyasına eklenir — mevcut tek-kaynak deseni korunur (ayrı dosyalara bölme yok).
- Script'in "FK-safe delete + re-create" davranışı değişmez; her çalıştırmada B2 içeriği tamamen yeniden oluşturulur.
- Mevcut `b2Unit`/`b2Lesson` (order: 1) 4 derse genişletilir; yeni değişkenler `b2Unit2`...`b2Unit12` ve ilgili ders değişkenleri, `a1*`/`a2*`/`b1*` değişken adlarıyla asla çakışmayacak şekilde `b2` önekiyle eklenir.
- Yeni üniteler `levelId: b2.id`, artan `order` (2–12) ile `// --- C1: Indirekte Rede (1 sample lesson) ---` yorum satırından hemen önce eklenir; bu satır değiştirilmez (kararlı ekleme noktası).
- `tests/integration/seedContent.test.ts` ve `tests/integration/learn.test.ts` güncellenir: A1'e özgü mevcut testler değiştirilmeden, B2'ye özgü yeni ve ayrı test blokları eklenir (örn. "has 12 B2 units with four lessons each").
- Diğer seviyelere (A1/A2/B1/C1/C2) dokunulmaz; onlara ait mevcut testler değişmeden geçmeli. A2/B1 aynı anda paralel worktree'lerde genişletiliyor olsa da bu iş tamamen izole (ayrı Postgres şeması) olduğundan çakışma riski yok.
- Mevcut `npx vitest run` ve `npx eslint .` her üniteden sonra temiz olmalı.

## 5. Kapsam Dışı

- A1/A2/B1/C1/C2 içeriğinin genişletilmesi (ayrı fazlar; A2/B1 şu anda paralel çalışıyor).
- Admin panel üzerinden manuel içerik girişi (bu faz `seed.ts` üzerinden gidiyor).
- Yeni egzersiz tipleri veya veri modeli değişiklikleri.
