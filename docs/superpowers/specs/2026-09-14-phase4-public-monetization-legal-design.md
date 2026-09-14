# Phase 4 — Public Homepage, Ad Monetization & Legal Compliance — Design

**Tarih:** 2026-09-14
**Durum:** Onaylandı (kullanıcı talebiyle otomatik onay — bkz. not aşağıda)

**Not:** Kullanıcı bu oturumda onay adımlarını atlayıp önerilen ayarların kabul edilmesini istedi. Bu doküman, master tasarımın (`2026-09-12-german-learning-platform-design.md`) 9-11. bölümlerinde tanımlanan ama henüz uygulanmamış kapsamı somutlaştırır; brainstorming diyaloğu yerine bu özet kendi kendine gözden geçirilip onaylanmıştır.

## 1. Kapsam

Master tasarımda planlanmış ama eksik olan üç alan:
- **Herkese açık ana sayfa** (`src/app/[locale]/page.tsx` şu an sadece bir başlık stub'ı)
- **Reklam altyapısı** — `cookieConsent` durumu zaten var (`src/lib/cookieConsent.ts`, `CookieConsentBanner`) ama hiçbir yerde kullanılmıyor; `<AdSlot>` bileşeni yok
- **Yasal sayfalar** — Gizlilik politikası ve kullanım şartları sayfaları yok
- **Temel SEO** — `sitemap.xml`, `robots.txt`, sayfa bazlı meta description yok; Google Analytics scaffold'u yok

**Kapsam dışı (sonraki faza bırakılıyor):** `/grammar/[topic]` herkese açık gramer referans sayfaları (çok dilli içerik yazımı gerektiren ayrı bir içerik fazı), Playwright E2E smoke test (yeni test altyapısı kurulumu gerektiriyor, mevcut Vitest/RTL kapsamının dışında). Bu ikisi ayrı fazlarda ele alınacak.

## 2. Yaklaşım

Tek makul yaklaşım: mevcut `cookieConsent` altyapısını kullanan, env değişkeniyle yapılandırılan, consent verilmeden hiçbir üçüncü taraf script'i yüklemeyen bileşenler eklemek. Gerçek bir AdSense/GA kimliği yoksa bileşenler sessizce hiçbir şey render etmez (placeholder değil — prod'da yanlışlıkla boş kutu göstermemek için).

## 3. Bileşenler

### 3.1 `<AdSlot placement="home" | "lessonList" | "exerciseResult" | "sidebar" | "vocabReview" />`
- `src/components/AdSlot.tsx`
- `getStoredConsent() !== 'accepted'` veya `process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID` tanımsızsa **null render eder**.
- Consent kabul edilmişse ve client ID varsa, Google AdSense `<ins class="adsbygoogle">` bloğunu render eder ve `next/script` ile `adsbygoogle.js`'i bir kez yükler.
- `placement` prop'u sadece test edilebilirlik ve gelecekte yerleşim bazlı slot ID'leri için ayırt edici; şimdilik tek bir `data-ad-slot` env değişkeni (`NEXT_PUBLIC_ADSENSE_SLOT_ID`) kullanılır.
- Consent durumu değiştiğinde (banner'da "Accept" tıklanınca) yeniden render olması gerekir → `useSyncExternalStore(subscribeToConsent, getStoredConsent, ...)` ile aynı `cookieConsent` altyapısı.

### 3.2 `<Analytics />`
- `src/components/Analytics.tsx`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` tanımlıysa ve consent `'accepted'` ise `next/script` ile GA4 gtag.js yükler.
- `LocaleLayout` içine `CookieConsentBanner`'ın yanına eklenir.

### 3.3 Yerleşimler (spec §9 ile birebir)
- Ana sayfa (`/`): hero altında bir `<AdSlot placement="home" />`
- `/learn/[level]` ünite/ders listesi altında: `<AdSlot placement="lessonList" />`
- Ders tamamlama özet ekranında (`ExerciseRunner` bitiş durumu): `<AdSlot placement="exerciseResult" />`
- `/dashboard`: kenar çubuğunda `<AdSlot placement="sidebar" />`
- `/vocab`: "review complete" ekranında `<AdSlot placement="vocabReview" />`
- Ders/egzersiz akışının **içine** reklam konmaz (spec gereği).

## 4. Herkese Açık Ana Sayfa

`src/app/[locale]/page.tsx` yeniden yazılır:
- Hero bölümü: ürün adı, kısa açıklama, "Kayıt ol" / "Giriş yap" CTA'ları (`next-intl` ile 3 dilde)
- Seviye kartları (A1 aktif, A2/B1/B2 "yakında" rozetiyle) — statik, DB sorgusu gerekmez (seviyeler sabit enum)
- `<AdSlot placement="home" />`
- Yeni `home` mesaj namespace'i (`messages/{de,en,tr}.json`)

## 5. Yasal Sayfalar

- `src/app/[locale]/(public)/privacy/page.tsx`, `.../terms/page.tsx`
- Statik, sunucu tarafında render edilen, 3 dilde genel (placeholder olmayan ama şablon niteliğinde — gerçek şirket/adres bilgisi kullanıcı tarafından sonra doldurulacak) GDPR-uyumlu metin: veri toplama (hesap verisi, ilerleme, cookie), üçüncü taraf servisler (AdSense, GA — consent'e bağlı), kullanıcı hakları, iletişim.
- `Footer.tsx` bu sayfalara link ekler.
- Bu sayfalar `(public)` route grubunda, auth gerektirmez.

## 6. SEO Temelleri

- `src/app/sitemap.ts` — Next.js native `MetadataRoute.Sitemap`; her locale için `/`, `/privacy`, `/terms`, `/login`, `/register` statik path'leri.
- `src/app/robots.ts` — `Allow: /`, `Disallow: /admin`, `/dashboard`, `/learn`, `/vocab` (kişiselleştirilmiş sayfalar indexlenmemeli), sitemap referansı.
- Ana sayfa için `generateMetadata` ile `description` eklenir (mevcut `LocaleLayout.generateMetadata`'daki `title` mantığına ek).

## 7. Veri Akışı / Hata Yönetimi

Yeni DB modeli veya API route yok — tamamen statik/istemci taraflı bileşenler ve sunucu render edilen sayfalar. Hata durumu yok (env değişkeni eksikse sessizce gizlenir, bu bir hata değil beklenen davranış).

## 8. Test Stratejisi

- `tests/unit/adSlot.test.tsx`: consent yokken/reddedilmişken null render; consent kabul + env ID varken `adsbygoogle` script'i render; env ID yokken consent kabul olsa bile null.
- `tests/unit/analytics.test.tsx`: aynı consent-gating mantığı.
- `tests/unit/homepage.test.tsx` veya `tests/integration/homepage.test.ts`: hero + seviye kartları + CTA linkleri render ediliyor.
- `tests/integration/legalPages.test.ts`: privacy/terms sayfaları 3 locale'de 200 dönüyor ve beklenen başlığı içeriyor.
- Mevcut `header.test.tsx` gibi testler footer'daki yeni linkler için güncellenmeyecek (Footer testi yoksa eklenmeyecek — mevcut kapsamda `Footer.test.tsx` yok, gerekirse eklenir).

## 9. Ortam Değişkenleri (yeni)

`.env.example`'a eklenir:
```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
NEXT_PUBLIC_ADSENSE_SLOT_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```
Boş bırakılırsa ilgili özellik prod'da da sessizce devre dışı kalır — bu kasıtlı (gerçek AdSense/GA hesabı açılana kadar).
