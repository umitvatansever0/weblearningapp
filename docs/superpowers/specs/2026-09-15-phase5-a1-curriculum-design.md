# Phase 5 — A1 Full Curriculum Design

**Tarih:** 2026-09-15
**Durum:** Onaylandı

## 1. Amaç ve Kapsam

Master tasarım dokümanının hedeflediği "A1 seviyesi tam içerikle" durumuna ulaşmak. Şu anda A1 seviyesinde tek bir ünite (Begrüßung) ve 3 ders bulunuyor; A2/B1/B2/C1/C2 her biri tek bir örnek ünite/ders içeriyor (bu faz onları değiştirmiyor). Bu faz **sadece A1**'i 12 üniteye, ünite başına 4 derse genişletir. A2/B1/B2'nin aynı ölçekte doldurulması ayrı, sonraki fazlardır.

## 2. Müfredat Taslağı

12 ünite × 4 ders = 48 ders. Goethe-Institut "Start Deutsch 1" A1 müfredatına yakın, artan zorluk sırasına göre:

1. **Begrüßung & Vorstellung** *(mevcut, +1 ders)* — Begrüßungsformen, Verb "sein", Zahlen 1–10, *Sich vorstellen (Name/Herkunft)*
2. **Artikel & Nomen** — bestimmter/unbestimmter Artikel, Genus (der/die/das), Plural, Verneinung mit "kein"
3. **Personalpronomen & Präsens** — Personalpronomen, regelmäßige Verben, Verb "haben", W-Fragen
4. **Familie & Possessivpronomen** — Familienmitglieder, Possessivartikel (mein/dein…), Ja/Nein-Fragen, Wiederholung
5. **Zahlen, Uhrzeit & Alltag** — Zahlen 11–100, Uhrzeit, Wochentage, Tagesablauf
6. **Akkusativ** — Akkusativ-Artikel, Akkusativ-Pronomen, Verben mit Akkusativ, Verneinung mit "nicht"
7. **Modalverben** — können/müssen/wollen, möchten/dürfen, Satzstruktur, Bestellungen ("Ich möchte…")
8. **Trennbare Verben & Alltag** — trennbare Verben, Satzstellung, Tagesablauf-Sätze, Übung
9. **Dativ & Präpositionen** — Dativ-Artikel, Präpositionen mit Dativ, Wechselpräpositionen (intro), Wohnung/Zimmer
10. **Essen & Einkaufen** — Lebensmittel, "Ich hätte gern", Mengenangaben, Im Restaurant
11. **Perfekt (Einführung)** — Perfekt mit "haben", Perfekt mit "sein", Partizip II, Übung
12. **Imperativ & Wegbeschreibung** — Imperativ (du/ihr/Sie), Wegbeschreibung, Richtungspräpositionen, Übung

Her ünite bir öncekinin üzerine inşa edilir (örn. Akkusativ'den önce artikel/genus, Perfekt'ten önce Präsens).

## 3. İçerik Kuralları (Her Ders İçin)

Mevcut Begrüßung ünitesindeki desenle birebir aynı:

- **Açıklama:** `explanationDe` / `explanationEn` / `explanationTr` — 1-3 cümlelik gramer açıklaması, örnek Almanca cümle içerir. Almanca örnekler her zaman Almanca kalır; sadece açıklama metni çevrilir.
- **Egzersizler:** Ders başına 2-3 egzersiz, mevcut 5 tipten (MULTIPLE_CHOICE, FILL_IN_BLANK, MATCHING, SENTENCE_ORDER, SHORT_ANSWER) karışık seçilir — art arda aynı ünitede tekrarlanmayacak şekilde çeşitlendirilir. Toplamda 48 derste tüm 5 tip defalarca kullanılmış olacak.
- **Kelime Kartları:** Ders başına 2 `VocabWord`, `word` + `translationEn` + `translationTr` + `exampleSentence`.
- **Ton/Stil:** Kısa, A1 seviyesine uygun basit cümleler; mevcut Begrüßung dersleriyle aynı üslup.

## 4. Teknik Yaklaşım

- Tüm yeni içerik `prisma/seed.ts` dosyasına eklenir — mevcut tek-kaynak deseni korunur (ayrı dosyalara bölme yok; dosya büyüse de mevcut yapıyla tutarlılık tercih edildi).
- Script'in "FK-safe delete + re-create" davranışı değişmez; her çalıştırmada A1 içeriği tamamen yeniden oluşturulur.
- `tests/integration/seedContent.test.ts` güncellenir: "has one A1 unit with three lessons" testi "has 12 A1 units with four lessons each" olarak değiştirilir (toplam 48 ders, her ünite 4 ders).
- Diğer seviyelere (A2-C2) dokunulmaz; onlara ait mevcut testler ("has at least one lesson for every level above A1") değişmeden geçmeli.
- Mevcut `npx vitest run` ve `npx eslint .` her adımdan sonra temiz olmalı.

## 5. Kapsam Dışı

- A2/B1/B2/C1/C2 içeriğinin genişletilmesi (ayrı, sonraki fazlar).
- Admin panel üzerinden manuel içerik girişi (bu faz `seed.ts` üzerinden gidiyor; admin panel CRUD zaten var ve gelecekte kullanılabilir).
- Yeni egzersiz tipleri veya veri modeli değişiklikleri.
