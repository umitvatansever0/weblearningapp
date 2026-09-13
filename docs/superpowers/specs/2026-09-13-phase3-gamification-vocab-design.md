# Faz 3 — Oyunlaştırma + Kelime Tekrarı (SM-2) Tasarım Dokümanı

**Tarih:** 2026-09-13
**Durum:** Onaylandı
**Bağlı olduğu doküman:** `docs/superpowers/specs/2026-09-12-german-learning-platform-design.md` (genel platform tasarımı, Bölüm 7)
**Bağlı olduğu plan:** `docs/superpowers/plans/2026-09-12-phase2-exercise-engine.md` (Faz 2, tamamlandı ve merge edildi)

## 1. Amaç ve Kapsam

Faz 2'de kurulan alıştırma motoru üzerine, kullanıcıyı geri getiren iki sistemi ekler: **oyunlaştırma** (streak, XP, rozetler) ve **kelime tekrarı** (SM-2 spaced-repetition ile `/vocab` sayfası). Genel tasarımın Bölüm 7'sindeki "Oyunlaştırma & Kelime Tekrarı" bölümünü uygular.

**Bu fazın sonunda:** Bir ders tamamlandığında kullanıcının streak'i ve XP'si güncellenir, dersteki kelimeler otomatik olarak kelime kartı destesine eklenir, uygun kilometre taşlarında rozet kazanılır. `/dashboard` sayfası streak/XP/rozetleri gösterir. `/vocab` sayfası günün tekrar kartlarını flashcard + 4 butonlu (Tekrar/Zor/İyi/Kolay) arayüzle sunar.

## 2. Faz 2'den Miras Alınanlar

- `User` modeli — bu fazda `streak`, `lastActivityDate`, `xp` alanları eklenir
- `Lesson` modeli — `VocabWord` bu modele FK ile bağlanır
- `POST /api/lessons/[lessonId]/complete` route'u — bu fazda ders tamamlama sonrası ödül mantığını (streak/XP/kelime kartı/rozet) tetikleyecek şekilde genişletilir; mevcut `UserProgress` upsert davranışı değişmez
- `@/i18n/navigation`, `@/i18n/routing`, `messages/{de,en,tr}.json` + anahtar tutarlılık testi — aynı desen devam eder
- `src/app/[locale]/layout.tsx` (Header/Footer/Providers/CookieConsentBanner) değişmeden kalır

## 3. Veri Modeli

`prisma/schema.prisma`'ya eklenecek/değişecek:

```prisma
model User {
  // ...mevcut alanlar değişmeden kalır...
  streak           Int       @default(0)
  lastActivityDate DateTime? // UTC gün başlangıcı olarak saklanır (saat/dakika sıfırlanmış)
  xp               Int       @default(0)
  vocabCards       UserVocabCard[]
  badges           UserBadge[]
}

model VocabWord {
  id               String @id @default(cuid())
  lessonId         String
  lesson           Lesson @relation(fields: [lessonId], references: [id])
  word             String // Almanca terim, her zaman Almanca kalır
  translationEn    String
  translationTr    String
  exampleSentence  String
  cards            UserVocabCard[]
}

model UserVocabCard {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id])
  vocabWordId    String
  vocabWord      VocabWord @relation(fields: [vocabWordId], references: [id])
  easeFactor     Float     @default(2.5)
  interval       Int       @default(0) // gün cinsinden
  repetitions    Int       @default(0)
  dueDate        DateTime  @default(now())
  lastReviewedAt DateTime?

  @@unique([userId, vocabWordId])
}

model Badge {
  id          String @id @default(cuid())
  code        String @unique // örn. "first_lesson", "streak_7"
  titleDe     String
  titleEn     String
  titleTr     String
  users       UserBadge[]
}

model UserBadge {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  badgeId  String
  badge    Badge    @relation(fields: [badgeId], references: [id])
  earnedAt DateTime @default(now())

  @@unique([userId, badgeId])
}
```

`Lesson` modeline `vocabWords VocabWord[]` ilişkisi eklenir. Tüm yeni alanlar/tablolar eklentiseldir (additive); mevcut Faz 1/2 tablolarında hiçbir alan silinmez veya tipi değişmez — migration `prisma migrate dev` ile güvenle uygulanabilir.

## 4. Streak & XP Mantığı

**Tetikleyici:** `POST /api/lessons/[lessonId]/complete` route'u, mevcut `UserProgress` upsert'ünden hemen sonra `src/lib/gamification.ts`'teki `applyLessonCompletionRewards(userId, lessonId, score, totalExercises)` fonksiyonunu çağırır. Bu fonksiyon route'tan bağımsız, saf/test edilebilir bir modüldür (Faz 2'deki `exerciseChecking.ts` deseniyle tutarlı).

**Streak kuralı:**
- Bugünün UTC tarihi (`YYYY-MM-DD`, saat bilgisi olmadan) ile `user.lastActivityDate` karşılaştırılır.
- Aynı gün ikinci bir ders tamamlanırsa: streak değişmez (günde bir kez sayılır).
- Bir önceki gün aktivite varsa: `streak += 1`.
- Bir önceki günden daha eski (veya hiç) aktivite varsa: `streak = 1` (sıfırlanıp yeniden başlar).
- `lastActivityDate` her ders tamamlamada bugünün UTC tarihine güncellenir.

**XP kuralı:** `xp += score * 10` (her doğru cevap 10 XP; `score` zaten `ExerciseRunner`'ın sunucuya gönderdiği doğru-cevap-sayısıdır, Faz 2 Task 6'dan miras). Yanlış cevaplar XP kazandırmaz.

**Günlük hedef:** Dashboard'da sabit 50 XP'lik günlük hedefe karşı ilerleme çubuğu gösterilir (kullanıcı tarafından özelleştirilemez — bu fazın kapsamı dışında, `dailyGoal` alanı şimdilik eklenmez).

## 5. Kelime Tekrarı Sistemi (SM-2)

**Kart oluşturma:** `applyLessonCompletionRewards` ayrıca, tamamlanan dersin `vocabWords`'ünü okur ve her biri için kullanıcıya ait `UserVocabCard` yoksa oluşturur (`easeFactor=2.5, interval=0, repetitions=0, dueDate=now()`) — `@@unique([userId, vocabWordId])` sayesinde tekrar tamamlamada yinelenen kart oluşmaz.

**İçerik:** Faz 2'de seed edilen 8 dersin (A1'in 3 dersi + A2-C2'nin birer örnek dersi) her birine 2-3 `VocabWord` eklenir (toplam ~18-20 kelime), `prisma/seed.ts` genişletilerek.

**SM-2 değerlendirme:** `POST /api/vocab/[cardId]/review`, body `{ grade: 'again' | 'hard' | 'good' | 'easy' }`. Saf fonksiyon `src/lib/spacedRepetition.ts`'teki `applySM2Grade(card, grade): { easeFactor, interval, repetitions, dueDate }`:

```
again: repetitions = 0
       interval = 1
       easeFactor = max(1.3, easeFactor - 0.2)

hard:  repetitions += 1
       interval = repetitions == 1 ? 1 : ceil(interval * 1.2)
       easeFactor = max(1.3, easeFactor - 0.15)

good:  repetitions += 1
       interval = repetitions == 1 ? 1 : (repetitions == 2 ? 6 : ceil(interval * easeFactor))
       easeFactor unchanged

easy:  repetitions += 1
       interval = repetitions == 1 ? 4 : (repetitions == 2 ? 10 : ceil(interval * easeFactor * 1.3))
       easeFactor = easeFactor + 0.15
```

`dueDate = now() + interval gün`. Route, oturumu kontrol eder, kartın giriş yapmış kullanıcıya ait olduğunu doğrular (401/404), günceller ve yeni kart durumunu döner.

**Rozet:** İlk kelime tekrarı tamamlandığında (`first_vocab_review`) rozet kazandırma mantığı da bu route'ta tetiklenir (bkz. Bölüm 6).

## 6. Rozetler

Küçük, küratörlü set — `prisma/seed.ts` ile önceden yüklenir, kontrol mantığı `src/lib/gamification.ts`'te `checkAndAwardBadges(userId)`:

| `code` | Kazanma koşulu |
|---|---|
| `first_lesson` | İlk `UserProgress.completed=true` kaydı |
| `streak_3` | `streak >= 3` |
| `streak_7` | `streak >= 7` |
| `first_vocab_review` | İlk `UserVocabCard.lastReviewedAt` doluşu |
| `a1_complete` | A1 seviyesindeki tüm derslerin tamamlanmış olması |
| `xp_100` | `xp >= 100` |

Rozet kontrolü hem ders tamamlama hem kelime tekrarı sonrası çağrılır (idempotent — `@@unique([userId, badgeId])` sayesinde tekrar kazanma denemesi sessizce yok sayılır).

## 7. Sayfalar & Rotalar

`giriş yapmış kullanıcı gerektirir` (Faz 2'deki `/learn` deseniyle aynı auth kontrolü):

- `/dashboard` — streak sayacı, XP + günlük hedef ilerleme çubuğu, kazanılan rozetler listesi
- `/vocab` — günün tekrar kartları (`dueDate <= now()`); hiç kart yoksa "bugün tekrar yok" mesajı; flashcard: Almanca kelime gösterilir → kullanıcı çevirir → cevap+örnek cümle açılır → 4 buton (Tekrar/Zor/İyi/Kolay) ile derecelendirir → sıradaki karta geçer

Sayfalar sunucu bileşenidir; kart/rozet listesi doğrudan Prisma ile okunur, sadece derecelendirme mutasyonu (`/api/vocab/[cardId]/review`) client-side fetch kullanır (Faz 2'deki `ExerciseRunner` deseniyle tutarlı).

## 8. API Uç Noktaları

- `POST /api/lessons/[lessonId]/complete` — **değişiklik**: mevcut davranış (UserProgress upsert, `{completed, score}` dönüşü) aynen korunur, ek olarak `applyLessonCompletionRewards` çağrılır (yan etki, response şeklini değiştirmez)
- `POST /api/vocab/[cardId]/review` — **yeni**: body `{ grade }`, döner `{ interval, dueDate }`. Oturum kontrolü (401), kart sahiplik kontrolü (404 başka kullanıcının kartıysa)

## 9. Yeni Çeviri Anahtarları

`messages/{de,en,tr}.json`'a yeni `dashboard` ve `vocab` namespace'leri eklenir (örn. `dashboard.streak`, `dashboard.xp`, `dashboard.dailyGoal`, `dashboard.badges`, `vocab.reviewDue`, `vocab.noReviewsToday`, `vocab.showAnswer`, `vocab.again`, `vocab.hard`, `vocab.good`, `vocab.easy`) + her rozetin `titleDe/En/Tr`'si zaten `Badge` tablosunda saklandığından ayrı çeviri anahtarı gerekmez.

## 10. Test Stratejisi

- **Birim testler:** `applySM2Grade` — 4 derece için, farklı `repetitions` durumlarında (ilk tekrar, ikinci tekrar, sonraki tekrarlar) doğru `interval`/`easeFactor` hesaplandığını doğrular; `easeFactor` alt sınırı (1.3) test edilir. Streak hesaplama mantığı — aynı gün/ardışık gün/atlanmış gün senaryoları.
- **Entegrasyon testleri:** `applyLessonCompletionRewards` — gerçek DB'ye karşı, streak/XP güncellemesi + vocab kart oluşturma + rozet kazanma birlikte doğrulanır; ikinci kez aynı dersin tamamlanmasında kart/rozet yinelenmediği kontrol edilir. `POST /api/vocab/[cardId]/review` — oturumsuz 401, başkasının kartında 404, geçerli derecelendirmede doğru yeni durum.
- **Manuel doğrulama:** Gerçek tarayıcıda bir ders tamamlanır → streak/XP arttığı, ilk rozetin kazanıldığı, kelime kartlarının `/vocab`'da göründüğü kontrol edilir; bir kart derecelendirilir → tekrar `/vocab`'a gidildiğinde kartın günün listesinden kalktığı doğrulanır.

## 11. Kapsam Dışı (Sonraki Fazlara Ait)

- `dailyGoal` kullanıcı özelleştirmesi (şimdilik sabit 50 XP)
- Admin panelinden Badge/VocabWord CRUD (içerik şimdilik seed script ile yüklenir)
- Herkese açık SEO gramer referans sayfaları, reklamlar (ayrı faz)
- A2-C2'nin tam müfredatı ve bunlara ait ek kelime kartları
- Liderlik tablosu (leaderboard) veya sosyal özellikler (genel tasarımda yok)
