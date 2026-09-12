# Faz 2 — Alıştırma Motoru + Çok Seviyeli Örnek İçerik Tasarım Dokümanı

**Tarih:** 2026-09-12
**Durum:** Onaylandı
**Bağlı olduğu doküman:** `docs/superpowers/specs/2026-09-12-german-learning-platform-design.md` (genel platform tasarımı)
**Bağlı olduğu plan:** `docs/superpowers/plans/2026-09-12-phase1-foundation.md` (Faz 1, tamamlandı)

## 1. Amaç ve Kapsam

Faz 1'de kurulan temel (kimlik doğrulama, DE/EN/TR routing, header/footer, kayıt/giriş) üzerine, kullanıcıların gerçekten Almanca öğrenip alıştırma çözebileceği **alıştırma motorunu** ve bunu kanıtlayan **çok seviyeli örnek içeriği** ekler.

**Bu fazın sonunda:** Giriş yapmış bir kullanıcı `/learn` altında seviyeleri (A1-C2) görür, bir üniteye girer, dersleri okur, 5 farklı tipte alıştırma çözer, anında doğru/yanlış geri bildirimi alır ve ilerlemesi kaydedilir.

**Seviye kapsamı genişletildi:** Genel platform tasarımı A1-B2 öngörüyordu; kullanıcı talebiyle veri modeli **A1-C2 (6 CEFR seviyesi)** destekleyecek şekilde genişletildi. Bu, motorun seviyeden bağımsız çalışmasını sağlamak için ucuz bir genişleme (enum'a 2 değer eklemek); tüm seviyelerin tam müfredatını yazmak bu fazın kapsamında değildir (bkz. Bölüm 4).

## 2. Faz 1'den Miras Alınanlar

- `User` modeli, `role` alanı (`USER`/`ADMIN`) — ileride admin panel içerik yönetimi için hazır
- NextAuth session (`session.user.id`, `session.user.role`) — sayfa/route koruması için kullanılacak
- `@/i18n/navigation` (`Link`, `useRouter`, `usePathname`), `@/i18n/routing` (`routing`) — yeni `/learn` sayfaları da bu yapıyı kullanır
- `messages/{de,en,tr}.json` + anahtar tutarlılık testi — yeni `learn` namespace'i eklenecek, mevcut test bunu otomatik doğrular
- `src/app/[locale]/layout.tsx` (Header/Footer/Providers/CookieConsentBanner) değişmeden kalır

## 3. Veri Modeli

`prisma/schema.prisma`'ya eklenecek modeller:

```prisma
enum LevelCode {
  A1
  A2
  B1
  B2
  C1
  C2
}

enum ExerciseType {
  MULTIPLE_CHOICE
  FILL_IN_BLANK
  MATCHING
  SENTENCE_ORDER
  SHORT_ANSWER
}

model Level {
  id    String    @id @default(cuid())
  code  LevelCode @unique
  order Int
  units Unit[]
}

model Unit {
  id      String @id @default(cuid())
  levelId String
  level   Level  @relation(fields: [levelId], references: [id])
  order   Int
  titleDe String
  titleEn String
  titleTr String
  lessons Lesson[]
}

model Lesson {
  id            String @id @default(cuid())
  unitId        String
  unit          Unit   @relation(fields: [unitId], references: [id])
  order         Int
  grammarTopic  String
  explanationDe String
  explanationEn String
  explanationTr String
  exercises     Exercise[]
  progress      UserProgress[]
}

model Exercise {
  id            String       @id @default(cuid())
  lessonId      String
  lesson        Lesson       @relation(fields: [lessonId], references: [id])
  order         Int
  type          ExerciseType
  data          Json
  correctAnswer Json
  explanation   String
}

model UserProgress {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  lessonId      String
  lesson        Lesson   @relation(fields: [lessonId], references: [id])
  completed     Boolean  @default(false)
  score         Int      @default(0)
  lastAttemptAt DateTime @default(now())

  @@unique([userId, lessonId])
}
```

`User` modeline `progress UserProgress[]` ilişkisi eklenir. `Exercise.data`/`correctAnswer` tipe göre farklı şekiller alır (bkz. Bölüm 5); bu şekiller uygulama katmanında (`src/types/exercise.ts`) TypeScript discriminated union + Zod ile tipli/doğrulanır, veritabanı seviyesinde serbest JSON kalır.

**Neden `correctAnswer` ayrı bir kolon:** Ders/ünite sayfaları sunucu bileşeninde Prisma ile doğrudan okunur, ama `correctAnswer` hiçbir zaman istemciye gönderilmez — sadece `POST /api/exercises/[id]/submit` sunucu tarafında kullanılır. Bu, kullanıcının tarayıcı DevTools'tan doğru cevabı görmesini engeller.

## 4. İçerik Planı (bu fazda gerçekten yazılacak)

| Seviye | Ünite | Ders sayısı | Not |
|---|---|---|---|
| A1 | "Tanışma" | 3 (Merhaba deme, Kendini tanıtma, Sayılar 1-10) | Her derste 2-3 alıştırma, 5 tipin karışımı |
| A2 | 1 örnek ünite | 1 örnek ders | Gerçek gramer konusu + 2 alıştırma |
| B1 | 1 örnek ünite | 1 örnek ders | Gerçek gramer konusu + 2 alıştırma |
| B2 | 1 örnek ünite | 1 örnek ders | Gerçek gramer konusu + 2 alıştırma |
| C1 | 1 örnek ünite | 1 örnek ders | Gerçek gramer konusu + 2 alıştırma |
| C2 | 1 örnek ünite | 1 örnek ders | Gerçek gramer konusu + 2 alıştırma |

Toplam: 6 ünite, 8 ders, ~20 alıştırma. Tüm açıklamalar `explanationDe/En/Tr` kolonlarında yazılır; Almanca örnek cümleler her zaman Almanca kalır (genel tasarımın çift katmanlı çok dillilik kuralı). İçerik, koda gömülü değil, `prisma/seed.ts` seed script'i ile veritabanına yüklenir — bu, admin panelinin geleceği fazda aynı tabloları CRUD ile yönetmesine engel olmaz.

**Kapsam dışı (sonraki içerik fazına ait):** A2-C2 seviyelerinin geri kalan tüm üniteleri/dersleri. Bu fazın amacı motoru her seviyede gerçek içerikle kanıtlamak, seviyeleri doldurmak değil.

## 5. Alıştırma Motoru Mimarisi

**Ortak arayüz:** `<ExerciseRunner exercises={SanitizedExercise[]} lessonId={string} />` (client component). `SanitizedExercise` = `Exercise` eksi `correctAnswer`. İç durumda mevcut alıştırma indeksini ve toplam skoru tutar; her tipe özel alt bileşene yönlendirir:

- `MultipleChoiceExercise` — `data: { prompt: string; options: string[] }`
- `FillInBlankExercise` — `data: { sentence: string }` (`___` boşluk yer tutucusu)
- `MatchingExercise` — `data: { pairs: { left: string; right: string }[] }` (karıştırılmış gösterilir)
- `SentenceOrderExercise` — `data: { words: string[] }` (karıştırılmış gösterilir)
- `ShortAnswerExercise` — `data: { prompt: string }`

Her alt bileşen `onAnswer(answer)` çağırır; `ExerciseRunner` bunu `POST /api/exercises/[id]/submit` ile sunucuya gönderir, dönen `{ correct, correctAnswer, explanation }`'ı gösterir, "Sonraki" butonuyla ilerler. Son alıştırmadan sonra `POST /api/lessons/[id]/complete` çağrılır ve özet ekranı (doğru/yanlış sayısı, skor) gösterilir.

**Cevap kontrol mantığı:** `src/lib/exerciseChecking.ts` içinde saf fonksiyon `checkAnswer(type, correctAnswer, userAnswer): { correct: boolean }`, sadece bu API route'unda kullanılır — birim testlerle tam kapsanır. Boşluk doldurma ve kısa cevap için umlaut-toleranslı normalizasyon (küçük harfe çevirme, boşluk kırpma, `ü`↔`ue`, `ö`↔`oe`, `ä`↔`ae`, `ß`↔`ss` eşdeğerliği) uygulanır; `correctAnswer` bu tipler için kabul edilen varyantların listesidir.

**Telaffuz:** Almanca metin gösterilen her yerde 🔊 butonu, `window.speechSynthesis` (varsa) ile `de-DE` sesini okutur; API tarayıcıda yoksa buton sessizce render edilmez (özellik algılama, hata fırlatmaz).

## 6. Sayfalar & Rotalar

Tümü `src/app/[locale]/learn/` altında, **giriş yapmış kullanıcı gerektirir** (bkz. Bölüm 8):

- `/learn` — seviye listesi (A1-C2), her biri o seviyedeki ünite sayısını gösterir
- `/learn/[level]` — o seviyedeki üniteler ve dersler, kullanıcının `UserProgress`'ine göre tamamlanma durumu işaretlenir
- `/learn/[level]/[unit]/[lesson]` — ders açıklaması + `<ExerciseRunner>` + özet ekranı

Bu sayfalar sunucu bileşenidir, içerik doğrudan Prisma ile okunur (ayrı bir GET API'sine gerek yok — sadece mutasyonlar API route'u kullanır, Faz 1'deki register/login deseniyle tutarlı).

## 7. API Uç Noktaları

- `POST /api/exercises/[exerciseId]/submit` — body `{ answer }`, döner `{ correct, correctAnswer, explanation }`. Oturum kontrolü yapılır (401 döner giriş yoksa).
- `POST /api/lessons/[lessonId]/complete` — body `{ score }`, `UserProgress` upsert eder (`@@unique([userId, lessonId])` üzerinden), döner `{ completed: true, score }`.

## 8. Erişim Kontrolü

`/learn` altındaki sayfalar `getServerSession(authOptions)` ile kontrol edilir; oturum yoksa `/[locale]/login`'e yönlendirilir. API route'ları da aynı kontrolü yapar, oturumsuz istekte `401` döner. Herkese açık SEO gramer referans sayfaları (`(public)` route grubu) genel tasarımda ayrı bir faza (SEO/legal) ait — bu fazda eklenmez.

## 9. Yeni Çeviri Anahtarları

`messages/{de,en,tr}.json`'a yeni `learn` namespace'i eklenir (örn. `levelsTitle`, `continue`, `checkAnswer`, `correct`, `incorrect`, `nextExercise`, `lessonComplete`, `score`) — mevcut `tests/unit/messages.test.ts` anahtar tutarlılık testi bunu otomatik doğrular, ek işlem gerekmez.

## 10. Test Stratejisi

- **Birim testler:** `checkAnswer` fonksiyonu, 5 tipin her biri için doğru/yanlış/kenar durumlar (özellikle umlaut normalizasyonu)
- **Bileşen testleri:** `ExerciseRunner` her `type` için doğru alt bileşeni render ediyor, cevap gönderiminin doğru şekli tetiklediği
- **Entegrasyon testleri:** `submit` route'u doğru/yanlış döner ve `correctAnswer`'ı ilk yüklemede asla sızdırmaz; `complete` route'u `UserProgress`'i doğru upsert eder; oturumsuz istekler 401 alır
- **Manuel doğrulama:** Gerçek tarayıcıda giriş yapıp A1 ünitesini (3 ders) baştan sona çözme; A2/B1/B2/C1/C2'den birer örnek dersi de kontrol etme

## 11. Kapsam Dışı (Sonraki Fazlara Ait)

- XP/streak/rozet (oyunlaştırma — ayrı faz)
- Kelime tekrarı/SM-2 kart sistemi (ayrı faz)
- Admin panelinden içerik CRUD (içerik şimdilik seed script ile yüklenir)
- Herkese açık SEO gramer referans sayfaları, reklamlar (ayrı faz)
- A2-C2'nin tam müfredatı (bu fazda sadece birer örnek ders var)
