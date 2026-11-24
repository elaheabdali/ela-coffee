# فاز ۶ — بک‌اند، داده و وضعیت زنده (Backend, Data & Real-time)

> این سند گزارش آموزشی فاز ۶ پروژهٔ ela-coffee است؛ فازی که صفحهٔ فاز ۵
> را از یک ویترینِ صرفاً نمایشی به یک فروشگاهِ واقعاً کارا تبدیل کرد:
> منو از API می‌آید، سبد واقعاً سفارش ثبت می‌کند، خبرنامه و رزرو و تماس
> به سرور می‌رسند، و وضعیت سفارش به‌صورت زنده دنبال می‌شود. گزارش
> فازهای قبل را دست نزنید؛ این سند فقط فاز ۶ را توضیح می‌دهد.

## ۱. خلاصهٔ فاز ۶

در پایان این فاز، سایت یک بک‌اند کامل دارد — اما با یک تفاوت مهم نسبت
به پروژه‌های معمولی: **هنوز هیچ دیتابیسی در این محیط نیست.** نه حساب
Neon ساخته شده، نه `DATABASE_URL`ای وجود دارد، و قرار هم نیست در چت
از شما رمز یا رشتهٔ اتصال بخواهیم. پس همه‌چیز طوری ساخته شد که **دو
حالته** کار کند:

| حالت | چه اتفاقی می‌افتد |
| --- | --- |
| `DATABASE_URL` تنظیم شده | Prisma به Postgres واقعی (Neon) وصل می‌شود؛ همه‌چیز در دیتابیس ذخیره می‌شود |
| `DATABASE_URL` خالی (وضعیت فعلی) | برنامه از همان ۱۲ نوشیدنیِ فایل seed استفاده می‌کند و سفارش/رزرو/خبرنامه را در یک حافظهٔ موقتِ داخل سرور نگه می‌دارد که با هر ری‌استارت پاک می‌شود |

هر جایی که از حالت دوم استفاده می‌شود، با کامنت در کد و با توضیح در
این سند مشخص شده است. **حالت دوم فقط برای توسعه و نمایش است و هرگز
رفتار نهایی (production) نیست** — بخش ۳ را بخوانید.

چیزهایی که در این فاز اضافه شد:

- **Prisma + دیتابیس** — مدل داده (بخش ۲)، مایگریشن SQL، و اسکریپت seed که ۱۲ نوشیدنی را از همان فایل `flavours.ts` می‌خواند (بدون تکثیر داده).
- **هفت مسیر API** — منو، خبرنامه، رزرو، سفارش، خواندن سفارش، رویدادهای زندهٔ سفارش (SSE) و تماس (بخش ۴).
- **پرداخت** — یک واسط به‌نام `PaymentPort` با دو پیاده‌سازی: Mock (پیش‌فرض، بدون شبکه، بدون پول واقعی) و Zarinpal sandbox (بخش ۶).
- **وضعیت زنده** — هوک `useOrderStatus` با SSE و سقوط به polling، و کامپوننت `OrderStatus` با چهار قدم RECEIVED تا DONE (بخش ۵).
- **اتصال فرانت‌اند** — منو با TanStack Query، سبد با قدم واقعیِ تسویه، خبرنامه با POST واقعی، فرم رزرو و فرم تماس (بخش ۷).
- **تست‌ها** — ۱۸۵ تست در ۲۶ فایل، همه بدون دیتابیس زنده (بخش ۸).

## ۲. مدل داده — Prisma

اسکیما دقیقاً مطابق معماری (§۷) در `apps/web/prisma/schema.prisma`
نوشته شده است. شش جدول:

| جدول | ستون‌های اصلی | توضیح |
| --- | --- | --- |
| `Drink` | `id` ،`brand` (KURO/MIDORI)، `slug` ،`nameFa` ،`nameEn` ،`priceToman` (Int)، `caffeineMg` ،`notesFa` ،`notesEn` ،`image` ،`sort` | ۱۲ نوشیدنی؛ قیمت همیشه تومان و عدد صحیح |
| `Order` | `status` (RECEIVED/PREPARING/READY/DONE)، `customerName` ،`phone` ،`totalToman` ،`payment` (PENDING/PAID/FAILED)، `paymentAuthority` ،`idempotencyKey` (یکتا) | سفارش + وضعیت پرداخت + کلید یکتاسازی |
| `OrderItem` | `orderId` ،`drinkId` ،`qty` ،`priceToman` | هر ردیف سفارش؛ قیمتِ لحظهٔ خرید در همان ردیف ذخیره می‌شود |
| `Reservation` | `name` ،`phone` ،`date` ،`guests` ،`status` (PENDING/CONFIRMED/CANCELLED) | رزرو میز |
| `NewsletterSubscriber` | `email` (یکتا)، `locale` | عضو خبرنامه |
| `ContactMessage` | `name` ،`contact` ،`message` | پیام تماس (اضافه‌تر از معماری، برای فرم تماس) |

دو نکتهٔ مهم دربارهٔ اسکیما:

- **`priceToman` عدد صحیح است** — قیمت‌ها همیشه تومان‌اند، هرگز اعشاری نیستند. موقع پرداخت زرین‌پال، تومان به ریال تبدیل می‌شود (×۱۰)؛ بخش ۶.
- **قیمت را مشتری نمی‌فرستد** — در `POST /api/orders` بدنه فقط `drinkId` و `qty` دارد؛ جمع کل را **سرور** از روی قیمت‌های لایهٔ داده حساب می‌کند. اگر کسی total جعلی بفرستد، نادیده گرفته می‌شود (تستش هم هست: total جعلیِ ۱ تومان → جمع واقعی ۳۹۰٬۰۰۰ تومان).

### مایگریشن و seed

مایگریشن در `apps/web/prisma/migrations/20261124190000_init/` است و
۶ جدول را می‌سازد. چون در این محیط دیتابیسی نبود، SQL آن **آفلاین**
تولید شد:

```bash
pnpm --filter web exec prisma migrate diff --from-empty --to-schema-datamodel --script
```

یعنی فایل `migration.sql` آماده و قابل بررسی است، اما `prisma migrate
dev` هنوز روی یک دیتابیس واقعی اجرا نشده — اولین باری که `DATABASE_URL`
را تنظیم می‌کنید باید اجرا شود (بخش ۹). فایل `migration_lock.toml`
هم کنار آن هست تا `prisma migrate deploy` بداند provider چیست
(`postgresql`).

اسکریپت seed (`apps/web/prisma/seed.ts`) ۱۲ نوشیدنی را از
`src/data/flavours.ts` ایمپورت می‌کند — **تک‌منبعِ حقیقت**: داده دو جا
نوشته نمی‌شود؛ اگر قیمت یا توضیحی عوض شود، فقط یک جا عوض می‌شود.

```bash
pnpm seed            # از ریشهٔ پروژه
pnpm --filter web db:seed
```

### یک مشکل محیطی و راه‌حلش (برای ثبت)

دانلود موتورهای Prisma با دانلودکنندهٔ خودِ CLI از پشتِ پروکسیِ این
محیط با خطای `ECONNRESET` می‌شکست، اما `curl` کار می‌کرد. موتورها
(`schema-engine` و `libquery_engine` برای `debian-openssl-3.0.x`،
نسخهٔ `c2990dca…`) با `curl` داخل پوشهٔ `@prisma/engines` و پوشهٔ
`prisma` در `node_modules` دانلود شدند و بعد `prisma generate` موفق
شد. این فایل‌ها در `node_modules` هستند و با نصبِ تازه از بین می‌روند؛
اگر روی ماشین دیگری همین خطا را دیدید، همین راه‌حل را تکرار کنید.

## ۳. حالت fallback — وقتی دیتابیس نیست

ایده ساده است: **لایهٔ داده (`apps/web/src/lib/store.ts`) یک درگاه
واحد است.** همهٔ مسیرهای API فقط با همین درگاه حرف می‌زنند و نمی‌دانند
پشتش Prisma است یا حافظهٔ موقت:

```ts
// apps/web/src/lib/db.ts
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
```

- اگر `DATABASE_URL` تنظیم شده باشد، `db.ts` یک PrismaClient
  تکی (singleton، امن برای hot-reload در حالت dev) می‌سازد و `store.ts`
  با آن کار می‌کند.
- اگر نباشد، `store.ts` از `memory-store.ts` استفاده می‌کند: همان ۱۲
  نوشیدنی از فایل seed، و سفارش‌ها/رزروها/اعضای خبرنامه/پیام‌ها در یک
  Map داخل حافظهٔ پروسهٔ Node نگه داشته می‌شوند.

| موضوع | حالت دیتابیس | حالت fallback |
| --- | --- | --- |
| منو | `SELECT` از جدول `Drink` | همان ۱۲ نوشیدنی از `flavours.ts` |
| سفارش جدید | ردیف در `Order` + `OrderItem` | رکورد در Map حافظه |
| رزرو / خبرنامه / تماس | ردیف در جدول مربوطه | رکورد در Map حافظه |
| بعد از ری‌استارت سرور | داده‌ها می‌مانند | **همه‌چیز پاک می‌شود** |
| چند نمونهٔ سرور (scale) | یک دیتابیس مشترک | هر نمونه حافظهٔ خودش را دارد |

به همین دلیل fallback فقط برای توسعه و نمایش است. در کد، هر تابع
fallback با کامنت مشخص شده و در `.env.example` هم نوشته شده که خالی
بودن `DATABASE_URL` یعنی همین حالت. وقتی Neon را راه انداختید (بخش ۹)،
بدون تغییر کد، همه‌چیز خودبه‌خود به دیتابیس واقعی می‌رود.

## ۴. مسیرهای API

همهٔ مسیرها Route Handlerهای App Router در `apps/web/src/app/api/`‌اند.
اعتبارسنجی با Zod انجام می‌شود و اسکیماها (`apps/web/src/lib/schemas.ts`)
بین سرور و کلاینت مشترک‌اند — یعنی همان قانونی که فرم در مرورگر
اعمال می‌کند، سرور هم اعمال می‌کند. خطاها همیشه JSON با شکل
`{ "error": { "code": "...", "message": "..." } }` هستند و **stack
trace هرگز به کلاینت نمی‌رسد.**

محدودیت نرخ (rate limit) یک سطل توکنِ داخل حافظه است، برای هر IP جدا:
خبرنامه و تماس **۵ درخواست در دقیقه**، سفارش و رزرو **۱۰ درخواست در
دقیقه**. این محدودیت فقط داخل یک نمونهٔ سرور کار می‌کند؛ اگر سایت چند
نمونه شود، به یک فروشگاه مشترک (مثل Redis) نیاز دارد — این یک قدمِ
بعدی است، نه یک سرویس مسدودشده.

### `GET /api/menu`

منوی کامل، هر دو برند، مرتب‌شده. چون پروژه `cacheComponents` را فعال
کرده، کانفیگ قدیمیِ `revalidate = 300` مجاز نیست؛ قصدِ «هر ۳۰۰ ثانیه
تازه شود» با هدر `Cache-Control: public, s-maxage=300,
stale-while-revalidate=60` (کش CDN) و با `connection()` در هندلر حفظ
شده — `connection()` مسیر را از prerender زمانِ بیلد بیرون می‌کشد تا
منو در زمان درخواست خوانده شود و قیمت‌های دیتابیس برنده شوند.

```bash
curl http://localhost:3000/api/menu
```

```json
{
  "drinks": [
    {
      "id": "kuro-original",
      "brand": "kuro",
      "slug": "original",
      "nameFa": "اورجینال",
      "nameEn": "Kuro Original",
      "priceToman": 180000,
      "caffeineMg": 180,
      "notesFa": "…",
      "notesEn": "…",
      "image": "/images/kuro-original.webp",
      "sort": 0
    }
  ]
}
```

### `POST /api/newsletter`

بدنه: `{ "email": "taster@example.com" }` و یک فیلد مخفی honeypot به‌نام
`website` که کاربر واقعی هرگز نمی‌بیند و پر نمی‌کند.

- ایمیل نامعتبر → `400 VALIDATION_ERROR`
- عضویت موفق → `200 { "ok": true }`
- ایمیل تکراری → **همان** `200 { "ok": true }` — از روی پاسخ نمی‌شود فهمید ایمیل قبلاً عضو بوده یا نه (عدم افشای وجود).
- honeypot پر شده (ربات) → همان `200 { "ok": true }`، اما **هیچ‌چیز
  ثبت نمی‌شود**. توجه: اسکیمای Zod عمداً honeypot پر را قبول می‌کند؛
  اگر Zod آن را رد می‌کرد، به‌جای ۲۰۰ ساکت، ۴۰۰ برمی‌گشت و ربات
  می‌فهمید که لو رفته است.

```bash
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"taster@example.com"}'
```

### `POST /api/reservations` و `GET /api/reservations?id=…`

بدنهٔ ساخت رزرو: `{ "name" ،"phone" (موبایل ایرانی 09xx یا +98) ،"date" (آینده) ،"guests" (۱ تا ۱۲) }`.

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"name":"نگار","phone":"09123456789","date":"2030-06-15T19:00:00.000Z","guests":4}'
# → 201 { "reservation": { "id": "…", "status": "PENDING", … } }

curl "http://localhost:3000/api/reservations?id=<id>"
# → 200 { "reservation": { … } } ؛ شناسهٔ ناشناخته → 404
```

### `POST /api/orders`

مهم‌ترین مسیر. بدنه فقط آیتم‌ها، نام و موبایل است — **بدون total**:

```json
{
  "items": [{ "drinkId": "kuro-caramel", "qty": 2 }],
  "customerName": "نگار",
  "phone": "09123456789"
}
```

- سرور قیمت هر نوشیدنی را از لایهٔ داده می‌خواند و جمع را حساب می‌کند (۲ × ۱۹۵٬۰۰۰ = ۳۹۰٬۰۰۰ تومان).
- `drinkId` ناشناخته → `400 UNKNOWN_DRINK`؛ موبایل نامعتبر → `400`.
- هدر `Idempotency-Key`: اگر همان کلید دوباره فرستاده شود، **همان
  سفارش اول** برگردانده می‌شود (`200` با `"idempotent": true`) و سفارش
  دوم ساخته نمی‌شود. این جلوی سفارشِ دوتاییِ ناشی از دابل‌کلیک یا
  retry شبکه را می‌گیرد. فرانت‌اند برای هر ثبت، یک کلید تازه با
  `crypto.randomUUID()` می‌سازد.
- سفارش با وضعیت `RECEIVED` و پرداخت `PENDING` ساخته می‌شود؛ بعد پرداخت
  Mock ساخته و همان‌جا تأیید می‌شود، پس پرداخت `PAID` می‌شود (بخش ۶).
  در حالت زرین‌پال، پرداخت تا بازگشت واقعی از درگاه `PENDING` می‌ماند.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Idempotency-Key: test-1" \
  -d '{"items":[{"drinkId":"kuro-caramel","qty":2}],"customerName":"نگار","phone":"09123456789"}'
# → 201 { "order": { "id": "…", "status": "RECEIVED", "totalToman": 390000,
#        "payment": "PAID", "paymentAuthority": "mock_…_…" },
#        "payment": { "verified": true, "refId": "mock-ref-…" } }
```

### `GET /api/orders/[id]`

سفارش با آیتم‌ها و وضعیتش:

```bash
curl http://localhost:3000/api/orders/<id>
# → 200 { "order": { "id": "…", "status": "RECEIVED", "items": […],
#        "totalToman": 390000, "payment": "PAID", … } }
# شناسهٔ ناشناخته → 404
```

### `GET /api/orders/[id]/events` — SSE

رویدادهای Server-Sent Events با `Content-Type: text/event-stream`:

- بلافاصله بعد از وصل‌شدن، وضعیت فعلی فرستاده می‌شود:
  `data: {"status":"RECEIVED"}`
- هر ۵ ثانیه وضعیت از لایهٔ داده خوانده می‌شود و اگر عوض شده باشد،
  رویداد تازه می‌آید: `data: {"status":"PREPARING"}`
- هر ۲۵ ثانیه یک heartbeat به‌شکل `: ping` می‌آید تا اتصال زنده بماند.
- اتصال تمیز بسته می‌شود (قطع‌شدن کلاینت، تایمرها را پاک می‌کند).

توجه: روی Vercel این مسیر یک فانکشنِ کوتاه‌عمر است و اتصالِ خیلی
طولانی نگه داشته نمی‌شود؛ برای همین کلاینت همیشه یک راهِ دوم دارد
(بخش ۵).

### `POST /api/contact`

بدنه: `{ "name" ،"contact" (ایمیل یا موبایل ایرانی) ،"message" }`،
با honeypot و rate limit مثل خبرنامه. موفق → `200 { "ok": true }`.

## ۵. وضعیت زنده — SSE در برابر polling

ساده بگوییم: دو راه برای «تازه نگه‌داشتن» وضعیت سفارش هست:

| | SSE (راه اول) | Polling (راه دوم) |
| --- | --- | --- |
| ایده | سرور یک اتصال باز نگه می‌دارد و هر وقت وضعیت عوض شد، خودش خبر می‌دهد | مرورگر هر چند ثانیه خودش می‌پرسد «وضعیت چی شد؟» |
| مصرف | کم — فقط وقتی تغییری هست، داده می‌آید | بیشتر — پرس‌وجوی تکراری حتی وقتی هیچ تغییری نیست |
| نقطه‌ضعف | بعضی هاست‌ها (مثل Vercel serverless) اتصال طولانی را قطع می‌کنند | همیشه کار می‌کند، ولی با تأخیر چندثانیه‌ای |

هوک `useOrderStatus` (`apps/web/src/hooks/useOrderStatus.ts`) هر دو را
بلد است و جابه‌جایی بین‌شان برای کاربر نامرئی است:

1. اول یک `fetch` به `GET /api/orders/[id]` می‌زند تا صفحه بلافاصله چیزی برای نشان‌دادن داشته باشد.
2. بعد `EventSource` به `/api/orders/[id]/events` باز می‌کند. هر پیام، وضعیت را به‌روز می‌کند.
3. اگر خطا بخورد، با backoff نمایی دوباره وصل می‌شود: ۱ ثانیه، ۲، ۴، ۸، تا سقف ۳۰ ثانیه.
4. اگر ۶۰ ثانیه هیچ رویدادی نیاید (اتصال مرده)، بی‌صدا می‌رود سراغ polling: هر ۱۰ ثانیه `GET /api/orders/[id]`، با backoff تا سقف ۶۰ ثانیه.
5. وقتی وضعیت به `DONE` رسید، polling متوقف می‌شود. با unmount کامپوننت هم همهٔ تایمرها و اتصال پاک می‌شوند.

کامپوننت `OrderStatus` (`apps/web/src/components/OrderStatus.tsx`)
چهار قدم را نشان می‌دهد — **RECEIVED → PREPARING → READY → DONE** —
با برچسب فارسی/انگلیسی، آیتم‌ها، جمع کل و وضعیت پرداخت.

## ۶. پرداخت — PaymentPort و Mock / Zarinpal

پرداخت پشت یک واسط (interface) پنهان شده است
(`apps/web/src/lib/payments/port.ts`):

```ts
interface PaymentPort {
  createPayment(order: OrderDTO): Promise<{ authority: string; url: string }>;
  verifyPayment(authority: string, amountToman: number): Promise<{ verified: boolean; refId?: string }>;
}
```

دو پیاده‌سازی دارد و **کد سفارش فقط واسط را می‌بیند** — عوض‌کردن
درگاه پرداخت یعنی عوض‌کردن یک خط در متغیر محیطی، نه بازنویسی سفارش:

| پیاده‌سازی | کی فعال است | چه می‌کند |
| --- | --- | --- |
| `MockPayment` | پیش‌فرض (`PAYMENT_PROVIDER=mock`) | یک authority جعلی می‌سازد (`mock_<orderId>_<random>`)، با کمی تأخیر شبیه‌سازی‌شده تأییدش می‌کند. **هیچ تماس شبکه‌ای نمی‌کند و هیچ پول واقعی جابه‌جا نمی‌شود.** |
| `ZarinpalPayment` | فقط با `PAYMENT_PROVIDER=zarinpal` + `ZARINPAL_MERCHANT_ID` | همان واسط، ولی علیه REST سندباکس زرین‌پال. مبلغ را **تومان → ریال** تبدیل می‌کند (×۱۰) چون زرین‌پال ریال می‌خواهد. |

سه قانون که در کد و این سند قفل شده‌اند:

1. **اطلاعات کارت هرگز به برنامه نمی‌رسد** — نه ذخیره می‌شود، نه لاگ می‌شود، نه فرستاده می‌شود. پرداخت همیشه در صفحهٔ درگاه انجام می‌شود.
2. **مبلغ همیشه از سرور می‌آید** — مبلغی که به درگاه داده می‌شود، همان `totalToman`ای است که سرور حساب کرده، نه چیزی که کلاینت فرستاده.
3. **در حالت mock هیچ پول واقعی نیست** — حتی اگر کسی اشتباهی `PAYMENT_PROVIDER` را عوض کند، بدون merchant ID واقعی، `ZarinpalPayment` ساخته نمی‌شود (خطا می‌دهد).

وضعیت پرداخت در حالت mock: سفارش ساخته می‌شود → authority ساخته و
ذخیره می‌شود → تأیید شبیه‌سازی می‌شود → `PAID`. در حالت زرین‌پال:
سفارش ساخته می‌شود → authority واقعی ساخته می‌شود → پرداخت تا بازگشت
از درگاه (`callback`) در حالت `PENDING` می‌ماند. **callback زرین‌پال
در نسخهٔ اول ساخته نشده** و جزو کارهای بعدی است (بخش ۱۰).

## ۷. اتصال فرانت‌اند — دیگر هیچ ثبتِ نمایشی نیست

| جا | قبل (فاز ۵) | حالا (فاز ۶) |
| --- | --- | --- |
| منو (`MenuSection`) | دادهٔ استاتیک | TanStack Query به `/api/menu`؛ دادهٔ استاتیک `placeholderData` است تا صفحه بلافاصله رندر شود و قیمت/توضیح سرور در refetch برنده شود. نکتهٔ پیاده‌سازی: `initialData` استفاده نشد، چون TanStack هنگام رندر `Date.now()` صدا می‌زند و Next 16 در prerender آن را ممنوع کرده است؛ `placeholderData` این مشکل را ندارد و fetch واقعی بعد از mount انجام می‌شود |
| سبد (`BagDrawer`) | فقط لیست محلی | سه قدم: سبد → تسویه (نام + موبایل، RHF+Zod) → رهگیری زندهٔ سفارش (`OrderStatus`). بعد از ثبت موفق، سبد خالی می‌شود |
| خبرنامه (`JoinList`) | موفقیت محلی، بدون POST | POST واقعی به `/api/newsletter`؛ موفقیت فقط با ۲۰۰ واقعی؛ خطای سرور به زبان صفحه نشان داده می‌شود |
| رزرو (`ReservationForm`) | نبود | فرم تازه در بخش Join، زیر فرم خبرنامه: نام، موبایل، تاریخ‌وساعت (datetime-local)، تعداد مهمان با Stepper (۱ تا ۱۲)، پیام موفقیت با تاریخ جلالی |
| تماس (`ContactForm`) | نبود | فرم تازه و جمع‌وجور در ناحیهٔ فوتر (`SiteFooter`): نام، ایمیل یا موبایل، پیام |

همهٔ پیام‌های اعتبارسنجی به زبان صفحه‌اند: فرم‌ها همان اسکیمای
مشترک سرور را با `zodResolver` خودمان می‌گیرند و پیام هر فیلد را از
دیکشنری صفحه جایگزین می‌کنند (فضاهای نام تازه: `checkout` ،`order` ،
`reservation` ،`contact` + `join.serverError` — هر دو زبان ۱۰۴ کلید
قبلی را دارند و تست برابری دیکشنری این را قفل می‌کند).

`QueryProvider` (`apps/web/src/components/QueryProvider.tsx`) تازه
اضافه شد و صفحه را دربرمی‌گیرد؛ قبلاً هیچ QueryClientProviderای نبود.

## ۸. فایل‌های این فاز

| فایل | کار |
| --- | --- |
| `apps/web/prisma/schema.prisma` | مدل داده (بخش ۲) |
| `apps/web/prisma/migrations/20261124190000_init/migration.sql` + `migration_lock.toml` | مایگریشن آفلاین (۶ جدول) |
| `apps/web/prisma/seed.ts` | seed ۱۲ نوشیدنی از `flavours.ts` |
| `apps/web/src/lib/db.ts` | PrismaClient تکی + `hasDatabase()` |
| `apps/web/src/lib/memory-store.ts` | حافظهٔ موقت fallback + `resetMemoryStore()` برای تست |
| `apps/web/src/lib/store.ts` | درگاه داده: `getDrinks` ،`getDrink` ،`createOrder` ،`getOrder` ،`updateOrderStatus` ،`updateOrderPayment` ،`getOrderByIdempotencyKey` ،`createReservation` ،`getReservation` ،`subscribeNewsletter` ،`createContactMessage` |
| `apps/web/src/lib/schemas.ts` | اسکیماهای مشترک Zod (خبرنامه، رزرو، سفارش، تماس) + honeypot |
| `apps/web/src/lib/rate-limit.ts` | سطل توکن داخل حافظه، به‌ازای IP |
| `apps/web/src/lib/api-errors.ts` | خطاهای JSON بدون stack trace |
| `apps/web/src/lib/form-resolver.ts` | Zod → RHF با پیام‌های ترجمه‌شدهٔ هر فیلد |
| `apps/web/src/lib/payments/port.ts` | `PaymentPort` + `MockPayment` + `ZarinpalPayment` + کارخانهٔ انتخاب |
| `apps/web/src/app/api/menu/route.ts` | `GET /api/menu` |
| `apps/web/src/app/api/newsletter/route.ts` | `POST /api/newsletter` |
| `apps/web/src/app/api/reservations/route.ts` | `POST` + `GET /api/reservations` |
| `apps/web/src/app/api/orders/route.ts` | `POST /api/orders` |
| `apps/web/src/app/api/orders/[id]/route.ts` | `GET /api/orders/[id]` |
| `apps/web/src/app/api/orders/[id]/events/route.ts` | `GET` SSE |
| `apps/web/src/app/api/contact/route.ts` | `POST /api/contact` |
| `apps/web/src/hooks/useOrderStatus.ts` | SSE + polling fallback |
| `apps/web/src/components/OrderStatus.tsx` | چهار قدم وضعیت سفارش |
| `apps/web/src/components/QueryProvider.tsx` | TanStack Query provider |
| `apps/web/src/components/ReservationForm.tsx` ، `ContactForm.tsx` | فرم‌های تازه |
| `apps/web/src/components/BagDrawer.tsx` ، `MenuSection.tsx` ، `JoinList.tsx` ، `SiteFooter.tsx` ، `apps/web/src/app/[locale]/page.tsx` | اتصال فرانت‌اند به API |
| `packages/i18n/src/fa.ts` ، `en.ts` | فضاهای نام `checkout` ،`order` ،`reservation` ،`contact` |
| `apps/web/src/lib/api.test.ts` ، `payments.test.ts` ، `hooks/useOrderStatus.test.tsx` ، `components/forms.test.tsx` (جدید) + به‌روزرسانی `bag.test.tsx` ، `sections.test.tsx` ، `page.test.tsx` ، `header.test.tsx` | تست‌ها (بخش ۸) |
| `.env.example` (ریشهٔ پروژه) | `DATABASE_URL` ،`PAYMENT_PROVIDER` ،`ZARINPAL_MERCHANT_ID` با توضیح |

### تست‌ها

۱۸۵ تست در ۲۶ فایل — همه **بدون دیتابیس زنده** (حالت fallback).
تست‌های تازهٔ این فاز:

- منو: ۱۲ نوشیدنی، هر دو برند.
- خبرنامه: ایمیل نامعتبر → ۴۰۰؛ عضویت و تکراری → همان ۲۰۰؛ honeypot پر → ۲۰۰ و بدون ثبت؛ ۶ درخواست سریع → ششمی ۴۲۹.
- رزرو: موبایل نامعتبر و تاریخ گذشته → ۴۰۰؛ ساخت و خواندن با `id`؛ شناسهٔ ناشناخته → ۴۰۴.
- سفارش: total جعلی نادیده گرفته می‌شود (سرور برنده است)؛ `drinkId` ناشناخته → ۴۰۰؛ همان `Idempotency-Key` → همان سفارش؛ خواندن با `id` و ۴۰۴.
- SSE: هدر `text/event-stream` و اولین رویداد `{"status":"RECEIVED"}`؛ تغییر وضعیت → رویداد تازه؛ سفارش ناشناخته → ۴۰۴.
- پرداخت: round-trip ساخت + تأیید Mock بدون هیچ تماس شبکه‌ای؛ زرین‌پال بدون merchant ID خطا می‌دهد؛ provider ناشناخته خطا می‌دهد.
- هوک: بدون EventSource → polling و توقف در DONE؛ با EventSource جعلی → پیام‌ها وضعیت را عوض می‌کنند.
- فرم‌ها: رزرو و تماس — خطای اعتبارسنجی بدون POST، و موفقیت با POST واقعی (mock شده).

دو باگ واقعی را همین تست‌ها گرفتند و اصلاح شدند: اول، اسکیمای
honeypot مقدار پر را رد می‌کرد و به‌جای ۲۰۰ ساکت، ۴۰۰ برمی‌گرداند؛
دوم، تست قدیمیِ سبد که «تسویه نباید وجود داشته باشد» را قفل می‌کرد،
چون تسویه حالا دقیقاً هدفِ فاز است. دو باگ دیگر را بیلد گرفت:
اول، کانفیگ‌های `dynamic = "force-dynamic"` و `revalidate` با
`cacheComponents` ناسازگار بودند — حذف شدند و برای `/api/menu` از
`connection()` استفاده شد (بخش ۴)؛ دوم، `useQuery` در `MenuSection`
هنگام prerender `Date.now()` صدا می‌زد و Next 16 آن را خطا می‌دانست —
با `placeholderData` به‌جای `initialData` حل شد (بخش ۷).

## ۹. راه‌اندازی Neon — قدم‌به‌قدم (کاری که شما باید بکنید)

تا اینجا همه‌چیز در حالت fallback کار می‌کند. برای اینکه داده‌ها واقعی
و ماندگار شوند، یک پروژهٔ رایگان Neon بسازید. **هیچ رمز یا رشتهٔ اتصالی
را در چت نفرستید** — فقط این قدم‌ها را روی ماشین خودتان انجام دهید:

**قدم ۱ — ساخت پروژه**

1. به neon.tech بروید و با حساب GitHub یا ایمیل وارد شوید.
2. دکمهٔ ساخت پروژهٔ تازه (New Project) را بزنید.
3. نام پروژه را مثلاً `ela-coffee` بگذارید و منطقه (Region) را نزدیک‌ترین گزینه به کاربران انتخاب کنید (برای ایران معمولاً اروپا).
4. نسخهٔ Postgres پیش‌فرض را همان‌طور که هست رها کنید و پروژه را بسازید.

**قدم ۲ — برداشتن رشتهٔ اتصال**

1. در داشبورد پروژه، بخش Connection Details را باز کنید.
2. رشتهٔ اتصال (Connection string) را کپی کنید — شکلی شبیه این دارد (مقادیر، مالِ خودِ شماست):
   `postgresql://<user>:<password>@<host>/<database>?sslmode=require`
3. این رشته مثل رمز عبور است: **هرگز آن را commit نکنید و برای کسی نفرستید.**

**قدم ۳ — گذاشتن در پروژه**

1. در ریشهٔ پروژه، از روی `.env.example` یک فایل `apps/web/.env.local` بسازید.
2. خط `DATABASE_URL` را با رشتهٔ خودتان پر کنید:
   `DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"`
3. `PAYMENT_PROVIDER` را همان `"mock"` رها کنید مگر اینکه بخواهید سندباکس زرین‌پال را تست کنید (بخش ۱۰).

**قدم ۴ — ساخت جدول‌ها و seed**

از ریشهٔ پروژه:

```bash
pnpm --filter web db:generate   # ساخت Prisma Client (اگر لازم شد)
pnpm --filter web db:migrate    # اجرای مایگریشن روی Neon — یا:
pnpm exec prisma migrate deploy --schema apps/web/prisma/schema.prisma
pnpm seed                       # ریختن ۱۲ نوشیدنی در جدول Drink
```

بعد از این، سرور توسعه را ری‌استارت کنید (`pnpm dev`) و یک سفارش
ثبت کنید — این بار در داشبورد Neon جدول `Order` را می‌بینید که پر شده
است. اگر `DATABASE_URL` را خالی بگذارید، برنامه بی‌صدا برمی‌گردد به
حالت fallback؛ پس برای مطمئن‌شدن، یک بار با `DATABASE_URL` تنظیم‌شده
سفارش ثبت کنید و در Neon چک کنید.

## ۱۰. چیزهایی که هنوز از شما / مشتری لازم است

| مورد | چرا لازم است | وضعیت |
| --- | --- | --- |
| پروژهٔ رایگان Neon + `DATABASE_URL` در `apps/web/.env.local` | ماندگارشدن سفارش/رزرو/خبرنامه (بخش ۹) | باز — با fallback کار می‌کند |
| Merchant ID سندباکس زرین‌پال | تست واقعیِ درگاه در حالت `zarinpal`؛ بدون آن فقط Mock کار می‌کند | باز — برای تست سندباکس |
| قیمت‌های واقعی هر نوشیدنی (تومان) | قیمت‌های فعلی جایگزین‌اند (معماری §۱۴) و قبل از تحویل باید عوض شوند | باز — از فاز ۱ |
| شمارهٔ تماس و هندل‌های واقعی فوتر | هنوز placeholder هستند | باز — از فاز ۵ |
| بررسی ۳۲ ترجمهٔ فارسیِ `TODO(review)` | ترجمه‌های فاز ۴ و ۵ هنوز تأیید شما را می‌خواهند | باز — از فاز ۴/۵ |
| مدرک لایسنس قالب | پوشش حقوقی استفاده از عکس‌ها و فونت‌ها | باز — از فاز ۰ |
| callback زرین‌پال | بعد از پرداخت واقعی در درگاه، سرور باید برگشت را تأیید کند؛ در نسخهٔ اول ساخته نشده | قدم بعدی (فاز ۷ به‌بعد نیست، ولی پیش از پول واقعی لازم است) |

## ۱۱. تأیید نهایی فاز ۶

| بررسی | نتیجه |
| --- | --- |
| `pnpm install --frozen-lockfile` | موفق |
| `pnpm typecheck` | موفق |
| `pnpm lint` | موفق (۰ خطا، ۱ هشدارِ اطلاعاتی دربارهٔ `watch` در React Compiler که مانع نیست) |
| `pnpm test` | **۱۸۵ تست در ۲۶ فایل، همه موفق** — بدون دیتابیس زنده |
| `pnpm build` | موفق — ۱۳ صفحهٔ استاتیک، هر ۷ مسیر API به‌صورت ƒ (Dynamic): `/api/menu` ،`/api/newsletter` ،`/api/reservations` ،`/api/orders` ،`/api/orders/[id]` ،`/api/orders/[id]/events` ،`/api/contact` |
| تست زندهٔ API با dev server | `GET /api/menu` ۲۰۰ (۱۲ نوشیدنی)؛ `POST /api/newsletter` ۲۰۰ و تکراری همان ۲۰۰؛ `POST /api/reservations` با رزرو PENDING؛ `POST /api/contact` ۲۰۰؛ `POST /api/orders` ۲۰۱ با totalToman واقعی ۳۹۰٬۰۰۰ (total جعلیِ ۱ نادیده گرفته شد)، payment PAID و authority موک؛ همان Idempotency-Key → همان سفارش با `idempotent: true`؛ `GET /api/orders/[id]` ۲۰۰؛ `GET /api/orders/[id]/events` استریم `data: {"status":"RECEIVED"}`؛ نوشیدنی ناشناخته → `UNKNOWN_DRINK`؛ صفحه‌های `/fa` و `/en` هر دو ۲۰۰ |

تغییرات این فاز stage شده و commit نشده‌اند تا شما بازبینی کنید.
فاز بعدی (۷ — سخت‌افزاری امنیتی) فقط با تأیید شما شروع می‌شود.
