# Almanca Öğrenme Platformu — Tasarım Dokümanı

**Tarih:** 2026-09-12
**Durum:** Onaylandı

## 1. Amaç ve Kapsam

Herkese açık, çok kullanıcılı bir Almanca öğrenme web sitesi. Kullanıcılar kayıt olup A1'den B2'ye kadar CEFR seviyelerinde gramer konuları öğrenir ve alıştırmalar yapar. Arayüz ve içerik açıklamaları Almanca, İngilizce ve Türkçe olarak sunulur. Gelir modeli başlangıçta Google AdSense reklamları; mimari ileride premium abonelik eklemeye açık tasarlanır.

**İlk aşamada:** Platform altyapısı (mimari, kimlik doğrulama, çok dillilik, alıştırma motoru, ilerleme takibi, oyunlaştırma, admin paneli) uçtan uca kurulur ve **A1 seviyesi tam içerikle** doldurulur. A2/B1/B2 aynı altyapıya, admin paneli üzerinden kod değişikliği gerekmeden kademeli olarak eklenecek şekilde tasarlanır.

## 2. Hedef Kullanıcı

İnternet üzerinden herkese açık, kayıt olabilen çok kullanıcılı bir ürün. Kullanıcı hesabı, sunucu tarafında saklanan ilerleme takibi ve rol bazlı erişim (normal kullanıcı / admin) gerekir.

## 3. Genel Mimari & Teknoloji Stack'i

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Veritabanı:** PostgreSQL + Prisma ORM
- **Kimlik doğrulama:** NextAuth.js (email/şifre; isteğe bağlı Google OAuth)
- **Stil:** Tailwind CSS
- **Arayüz çevirisi:** next-intl (DE/EN/TR)
- **Deploy:** Vercel + yönetilen Postgres (Neon/Supabase gibi ücretsiz katmanlı bir sağlayıcı)

**Neden bu stack:** Tek kod tabanında hem SEO'ya uygun sunucu-render edilen herkese açık sayfalar (organik trafik reklam geliri için kritik) hem de dinamik uygulama katmanı (dashboard, alıştırmalar) mümkün olur. Prisma + Postgres, çok dilli içerik ve ilişkisel ilerleme verisini temiz modellemeye uygundur.

**Route grupları:**
- `(public)` — Ana sayfa, seviye tanıtımları, gramer referans sayfaları (`/grammar/[topic]`) — herkese açık, indexlenebilir
- `(auth)` — Kayıt, giriş, şifre sıfırlama
- `(app)` — `/learn/[level]/[unit]/[lesson]`, `/vocab` (kelime tekrarı), `/dashboard` (ilerleme/streak/XP)
- `(admin)` — İçerik yönetim paneli (sadece `role: ADMIN`)

Mimari her zaman genişlemeye açık tutulur: yeni seviyeler, yeni egzersiz tipleri, yeni diller veya premium katman gibi eklemeler mevcut yapıyı bozmadan yapılabilmelidir.

## 4. İçerik Modeli & Çok Dillilik

**Hiyerarşi:** `Level (A1/A2/B1/B2) → Unit (örn. "Tanışma") → Lesson (gramer konusu + kelime + egzersizler)`. Seviyeler/üniteler zorla kilitlenmez; kullanıcı serbestçe gezebilir, ancak önerilen sıra vurgulanır.

**İki katmanlı çok dillilik:**
1. **Arayüz dili** — next-intl ile DE/EN/TR arasında anlık geçiş; tercih kullanıcı profiline kaydedilir.
2. **İçerik dili** — Gramer açıklamaları ve çeviriler için ilgili tabloda `explanationDe` / `explanationEn` / `explanationTr` gibi doğrudan kolonlar kullanılır (ayrı bir `Translation` tablosu yerine). Almanca örnek cümleler her zaman Almanca kalır; sadece açıklama metni kullanıcının seçtiği dilde gösterilir.

Bu yaklaşım mevcut kapsam (A1: ~10-15 ünite) için admin panelini ve sorguları basit tutar. 4. bir dil eklenmesi gerekirse ayrı çeviri tablosuna geçiş kolaydır.

## 5. Veri Modeli (Taslak)

- `User` (id, email, passwordHash, name, role, uiLanguage, streak, xp, dailyGoal, plan, createdAt)
- `Level` (code: A1/A2/B1/B2, order)
- `Unit` (levelId, order, titleDe/En/Tr)
- `Lesson` (unitId, order, explanationDe/En/Tr, grammarTopic)
- `Exercise` (lessonId, type, data JSON, correctAnswer, explanation)
- `VocabWord` (word, translationDe/En/Tr, exampleSentence)
- `UserProgress` (userId, lessonId, completed, score, lastAttemptAt)
- `UserVocabCard` (userId, wordId, easeFactor, interval, repetitions, dueDate) — SM-2 alanları
- `Badge` / `UserBadge`

## 6. Alıştırma Motoru

**Desteklenen tipler** (tek `Exercise` modeli, `type` alanı ile ayrılır, `data` JSON kolonunda tipe özel içerik):
- Çoktan seçmeli
- Boşluk doldurma (serbest metin, umlaut toleranslı normalizasyon — örn. "ü"/"ue")
- Eşleştirme
- Cümle sıralama
- Kısa yazılı cevap (esnek karşılaştırma, küçük yazım hatalarına tolerans)

**Ortak arayüz:** Tek bir `<ExerciseRunner>` bileşeni `type` alanına göre doğru alt bileşeni render eder; tüm tipler `submit(answer) → {correct, correctAnswer, explanation}` arayüzünü paylaşır. Yeni bir egzersiz tipi (ör. ileride telaffuz kontrolü) mevcut sistemi bozmadan eklenebilir.

**Geri bildirim:** Her cevaptan sonra anında doğru/yanlış + kısa gramer açıklaması. Ders sonunda özet ekranı (doğru/yanlış sayısı, kazanılan XP).

**Telaffuz/dinleme:** Her Almanca kelime/cümle yanında 🔊 butonu, tarayıcının yerleşik Web Speech API'si (`SpeechSynthesis`, de-DE sesi) ile okutulur. Ekstra ses dosyası depolama gerekmez.

## 7. Oyunlaştırma & Kelime Tekrarı

- **Streak:** Günlük en az bir ders/tekrar tamamlanınca sayaç artar, kaçırılırsa sıfırlanır.
- **XP:** Her tamamlanan egzersiz/ders doğruluk oranına göre XP kazandırır; seviye ilerleme çubuğu XP'ye dayalıdır.
- **Rozetler:** Kilometre taşları için (ör. "İlk dersini tamamladın", "7 günlük seri", "A1'i bitirdin").
- **Günlük hedef:** Kullanıcı belirler (20/50/100 XP), dashboard'da ilerleme gösterilir.
- **Kelime Kartı Sistemi:** Derste geçen kelimeler otomatik `UserVocabCard`'a eklenir. **SM-2 algoritması** ile kullanıcının "Tekrar/Zor/İyi/Kolay" geri bildirimine göre bir sonraki tekrar tarihi hesaplanır. `/vocab` sayfasında günün tekrar listesi gösterilir.

## 8. Admin Paneli

`/admin` altında, sadece `role: ADMIN` kullanıcılar için:
- Level/Unit/Lesson/Exercise/Vocab CRUD arayüzü (kod deploy etmeden içerik eklenip güncellenebilir — A2/B1/B2 doldurulurken kritik)
- Kullanıcı listesi (rol atama, hesap devre dışı bırakma)
- Basit istatistik özeti (kayıtlı kullanıcı sayısı, tamamlanan ders sayısı)

## 9. Reklam & Monetizasyon

- Google AdSense, **yoğun yerleşim**: ana sayfa, ders listesi sayfaları, egzersiz sonuç ekranı, kenar çubuğu, kelime tekrarı sayfası. Ders/egzersiz **akışının içine** reklam konmaz (öğrenme akışı bölünmez), ama sonuç ekranlarında ve liste sayfalarında sık gösterilir.
- Tüm reklam alanları tek bir `<AdSlot placement="..." />` bileşeni üzerinden yönetilir. Bu, ileride "premium kullanıcıya reklamsız deneyim" eklemeyi tek bir `if (user.plan !== 'premium')` kontrolüne indirger.
- **Şimdilik ücretsiz + reklam gelirli**; premium abonelik (ör. reklamsız + B1/B2 erişimi) mimaride yer ayrılmış olarak ileride eklenir (Stripe entegrasyonu bu aşamada kapsam dışı).

## 10. Yasal Uyumluluk

- Çerez onay banner'ı (cookie consent) — reklam/analitik script'leri yalnızca kullanıcı onayından sonra yüklenir (GDPR gereği, AB/Almanya kullanıcı kitlesi nedeniyle zorunlu).
- Gizlilik politikası, kullanım şartları sayfaları (DE/EN/TR).

## 11. SEO

- Gramer referans sayfaları herkese açık ve sunucu tarafında render edilir, arama motorlarınca indexlenebilir.
- Dil bazlı meta title/description, `sitemap.xml`, Google Analytics entegrasyonu.

## 12. Test Stratejisi

- **Birim testleri:** SM-2 hesaplaması, egzersiz doğru/yanlış kontrol mantığı (özellikle boşluk doldurma/kısa cevap normalizasyonu), XP/streak hesaplama.
- **Bileşen testleri:** `ExerciseRunner`'ın her egzersiz tipini doğru render ettiği ve cevap gönderiminin çalıştığı.
- **E2E smoke test (Playwright):** Kayıt ol → giriş yap → bir ders tamamla → ilerlemenin dashboard'da göründüğünü doğrula.

## 13. Kapsam Dışı (Bu Aşamada)

- Ödeme/Stripe entegrasyonu (mimaride yer ayrılır, şimdilik uygulanmaz)
- A2/B1/B2 içeriği (altyapı hazır olacak, içerik admin panelinden kademeli eklenecek)
- Gerçek zamanlı telaffuz analizi/konuşma tanıma (şimdilik sadece TTS dinleme var, kullanıcının konuşmasını değerlendirme yok)
- Topluluk/forum özellikleri
