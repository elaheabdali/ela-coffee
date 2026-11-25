/**
 * Brand datasets — the single source of truth for every drink, section
 * and stat on the page (audit §1.1/§1.2, architecture §7).
 *
 * English copy is the reference site's (audit §1). Persian copy is written
 * professionally, not literally translated — marked TODO(review) where it
 * is a placeholder for the client's review.
 *
 * Prices are PLACEHOLDER Toman values from architecture §14 (the user
 * confirmed random/placeholder prices are fine); they must be replaced
 * with the client's real prices before delivery.
 *
 * Tasting notes: exactly 3 per drink, from this file only. The reference
 * showed 2 notes on 4 of 6 matcha cards vs 3 in the dialog (audit defect
 * §8.2) — that cannot happen here, because cards and dialogs read the
 * same array.
 *
 * Images: the supplied WebP re-exports are canonical (audit §5.1).
 * Matcha has no dedicated hero-scene files in the supplied set, so the
 * fruit scenes double as the matcha scenes and `tea.webp` stands in for
 * the Midori Original scene and the stone-grind step — both are flagged
 * PLACEHOLDER in the Phase 4 doc until the client supplies the real
 * matcha scenes.
 */

export type Brand = "ela" | "midori";

export interface Drink {
  /** Stable id, e.g. "ela-original". */
  id: string;
  brand: Brand;
  slug: string;
  nameEn: string;
  nameFa: string;
  /** Short hero label, e.g. "Original". */
  shortEn: string;
  shortFa: string;
  descriptionEn: string;
  descriptionFa: string;
  /** Placeholder Toman price (architecture §14). */
  priceToman: number;
  caffeineMg: number;
  /** Stat-box size, e.g. "16 oz iced". */
  size: string;
  /** Stat-box size in Persian, e.g. "۱۶ انس، سرد". */
  sizeFa: string;
  /** Exactly 3 tasting notes — the one source of truth. */
  notesEn: string[];
  notesFa: string[];
  /** Scene image under /images/scenes/. */
  image: string;
  /** In the reference's 4-of-6 hero button group (audit §8.8). */
  featured: boolean;
}

export interface Stat {
  valueEn: string;
  valueFa: string;
  labelEn: string;
  labelFa: string;
}

export interface ProcessStep {
  titleEn: string;
  titleFa: string;
  bodyEn: string;
  bodyFa: string;
  /** Step image, if the supplied set has one. */
  image?: string;
  /** True when the image is a stand-in, not the real step photo. */
  imagePlaceholder?: boolean;
}

export interface OriginCard {
  nameEn: string;
  nameFa: string;
  share: number;
  introEn: string;
  introFa: string;
  facts: { labelEn: string; labelFa: string; valueEn: string; valueFa: string }[];
}

export interface BrandData {
  brand: Brand;
  wordmark: "ela" | "midori";
  heroTitleEn: string;
  heroTitleFa: string;
  drinks: Drink[];
  story: {
    eyebrowEn: string;
    eyebrowFa: string;
    titleEn: string;
    titleFa: string;
    bodyEn: string[];
    bodyFa: string[];
    stats: Stat[];
    image: string;
    imageAltEn: string;
    imageAltFa: string;
  };
  menu: {
    titleEn: string;
    titleFa: string;
    introEn: string;
    introFa: string;
  };
  process: {
    eyebrowEn: string;
    eyebrowFa: string;
    titleEn: string;
    titleFa: string;
    steps: ProcessStep[];
  };
  origins: {
    eyebrowEn: string;
    eyebrowFa: string;
    titleEn: string;
    titleFa: string;
    introEn: string;
    introFa: string;
    cards: OriginCard[];
  };
  /** Marquee ticker items (drink names). */
  marqueeEn: string[];
  marqueeFa: string[];
  /** Floating ingredient cut-outs for the hero (transparent WebP, keyed from the blue-screen key art). */
  cutouts: { src: string; altEn: string; altFa: string }[];
  /** Customisation groups under "Make it yours". */
  makeItYours: { labelEn: string; labelFa: string; optionsEn: string[]; optionsFa: string[] }[];
}

const COFFEE_DRINKS: Drink[] = [
  {
    id: "ela-original",
    brand: "ela",
    slug: "original",
    nameEn: "Ela Original",
    nameFa: "الا اورجینال",
    shortEn: "Original",
    shortFa: "اورجینال",
    descriptionEn:
      "A double shot of our house espresso poured over ice and cold whole milk. Bold, smooth and quietly sweet.",
    descriptionFa:
      "دابل‌شات اسپرسوی خانگی روی یخ و شیر سرد. جسور، نرم و آرام شیرین. — TODO(review)",
    priceToman: 180_000,
    caffeineMg: 150,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Dark cocoa", "Toasted almond", "Brown sugar"],
    notesFa: ["کاکائوی تلخ", "بادام برشته", "شکر قهوه‌ای"],
    image: "/images/scenes/original.webp",
    featured: false,
  },
  {
    id: "ela-caramel",
    brand: "ela",
    slug: "caramel",
    nameEn: "Salted Caramel",
    nameFa: "کارامل نمکی",
    shortEn: "Caramel",
    shortFa: "کارامل",
    descriptionEn:
      "Slow-cooked caramel stirred into espresso and cold milk, finished with a pinch of flaky sea salt.",
    descriptionFa:
      "کاراملِ آرام‌پخته با اسپرسو و شیر سرد، با نمک دریایی. — TODO(review)",
    priceToman: 195_000,
    caffeineMg: 150,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Burnt sugar", "Butterscotch", "Sea salt"],
    notesFa: ["شکر سوخته", "کره و شکر قهوه‌ای", "نمک دریا"],
    image: "/images/scenes/caramel-latte.webp",
    featured: true,
  },
  {
    id: "ela-vanilla",
    brand: "ela",
    slug: "vanilla",
    nameEn: "Vanilla Cream",
    nameFa: "وانیل خامه‌ای",
    shortEn: "Vanilla",
    shortFa: "وانیل",
    descriptionEn:
      "Madagascar vanilla bean syrup swirled into a mellow espresso latte. Soft, round and creamy.",
    descriptionFa: "سیروپ دانهٔ وانیل ماداگاسکار در لاتهٔ ملایم. نرم، گرد و خامه‌ای. — TODO(review)",
    priceToman: 190_000,
    caffeineMg: 150,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Vanilla bean", "Fresh cream", "Wildflower honey"],
    notesFa: ["دانهٔ وانیل", "خامهٔ تازه", "عسل گل وحشی"],
    image: "/images/scenes/vanilla-latte.webp",
    featured: true,
  },
  {
    id: "ela-hazelnut",
    brand: "ela",
    slug: "hazelnut",
    nameEn: "Toasted Hazelnut",
    nameFa: "فندق برشته",
    shortEn: "Hazelnut",
    shortFa: "فندق",
    descriptionEn:
      "House-roasted hazelnut syrup stirred into espresso and cold milk. Nutty, toasty and smooth.",
    descriptionFa: "سیروپ فندقِ برشتهٔ خانگی با اسپرسو و شیر سرد. مغزی، برشته و نرم. — TODO(review)",
    priceToman: 195_000,
    caffeineMg: 150,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Roasted hazelnut", "Praline", "Milk chocolate"],
    notesFa: ["فندق برشته", "پرالین", "شکلات شیری"],
    image: "/images/scenes/hazelnut-latte.webp",
    featured: false,
  },
  {
    id: "ela-mocha",
    brand: "ela",
    slug: "mocha",
    nameEn: "Dark Mocha",
    nameFa: "موکای تلخ",
    shortEn: "Mocha",
    shortFa: "موکا",
    descriptionEn:
      "70% dark chocolate melted into a double shot and cold milk. Deep, rich and velvety.",
    descriptionFa:
      "شکلات تلخ ۷۰٪ ذوب‌شده در دابل‌شات و شیر سرد. عمیق، غنی و مخملی. — TODO(review)",
    priceToman: 205_000,
    caffeineMg: 150,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Dark chocolate", "Black cherry", "Cocoa nib"],
    notesFa: ["شکلات تلخ", "گیلاس سیاه", "دانهٔ کاکائو"],
    image: "/images/scenes/mocha-latte.webp",
    featured: true,
  },
  {
    id: "ela-cinnamon",
    brand: "ela",
    slug: "cinnamon",
    nameEn: "Brown Sugar Cinnamon",
    nameFa: "دارچین و شکر قهوه‌ای",
    shortEn: "Cinnamon",
    shortFa: "دارچین",
    descriptionEn:
      "Brown sugar syrup and Ceylon cinnamon shaken with espresso and cold milk. Warm, spiced and mellow.",
    descriptionFa:
      "سیروپ شکر قهوه‌ای و دارچین سیلان با اسپرسو و شیر سرد. گرم، ادویه‌دار و ملایم. — TODO(review)",
    priceToman: 195_000,
    caffeineMg: 150,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Molasses", "Ceylon cinnamon", "Toffee"],
    notesFa: ["ملاس", "دارچین سیلان", "تافی"],
    image: "/images/scenes/cinnamon-latte.webp",
    featured: true,
  },
];

const MATCHA_DRINKS: Drink[] = [
  {
    id: "midori-original",
    brand: "midori",
    slug: "original",
    nameEn: "Midori Original",
    nameFa: "میدوری اورجینال",
    shortEn: "Original",
    shortFa: "اورجینال",
    descriptionEn:
      "Ceremonial-grade matcha whisked smooth and poured over ice and cold whole milk. Bright, creamy and grassy-sweet.",
    descriptionFa:
      "ماچای تشریفاتیِ هم‌زده روی یخ و شیر سرد. روشن، خامه‌ای و سبزِ شیرین. — TODO(review)",
    priceToman: 195_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Stone-ground", "Fresh cream", "Wildflower honey"],
    notesFa: ["آسیاب‌سنگی", "خامهٔ تازه", "عسل گل وحشی"],
    // PLACEHOLDER: no Midori Original scene was supplied — tea.webp stands in.
    image: "/images/tea.webp",
    featured: false,
  },
  {
    id: "midori-blueberry",
    brand: "midori",
    slug: "blueberry",
    nameEn: "Wild Blueberry",
    nameFa: "بلوبری وحشی",
    shortEn: "Blueberry",
    shortFa: "بلوبری",
    descriptionEn:
      "Wild blueberries folded into whisked matcha and cold milk. Jammy, bright and a little tart.",
    descriptionFa: "بلوبری وحشی با ماچای هم‌زده و شیر سرد. مربایی، روشن و کمی ترش. — TODO(review)",
    priceToman: 210_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    // Single source of truth: the reference card showed only 2 notes here.
    notesEn: ["Wild blueberry", "Vanilla", "Green tea"],
    notesFa: ["بلوبری وحشی", "وانیل", "چای سبز"],
    image: "/images/scenes/blueberry.webp",
    featured: true,
  },
  {
    id: "midori-cherry",
    brand: "midori",
    slug: "cherry",
    nameEn: "Dark Cherry",
    nameFa: "گیلاس تلخ",
    shortEn: "Cherry",
    shortFa: "گیلاس",
    descriptionEn:
      "Dark cherry compote stirred into whisked matcha and cold milk. Deep, tart and quietly sweet.",
    descriptionFa: "کمپوت گیلاس تلخ با ماچای هم‌زده و شیر سرد. عمیق، ترش و آرام شیرین. — TODO(review)",
    priceToman: 210_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Dark cherry", "Wildflower honey", "Green tea"],
    notesFa: ["گیلاس تلخ", "عسل گل وحشی", "چای سبز"],
    image: "/images/scenes/cherry.webp",
    featured: true,
  },
  {
    id: "midori-coconut",
    brand: "midori",
    slug: "coconut",
    nameEn: "Coconut Cream",
    nameFa: "کرم نارگیل",
    shortEn: "Coconut",
    shortFa: "نارگیل",
    descriptionEn:
      "Toasted coconut and cream swirled into whisked matcha. Soft, tropical and smooth.",
    descriptionFa: "نارگیل برشته و خامه در ماچای هم‌زده. نرم، استوایی و لطیف. — TODO(review)",
    priceToman: 200_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Toasted coconut", "Fresh cream", "Vanilla"],
    notesFa: ["نارگیل برشته", "خامهٔ تازه", "وانیل"],
    image: "/images/scenes/coconut.webp",
    featured: false,
  },
  {
    id: "midori-blackberry",
    brand: "midori",
    slug: "blackberry",
    nameEn: "Blackberry Bramble",
    nameFa: "شاه‌توت",
    shortEn: "Blackberry",
    shortFa: "شاه‌توت",
    descriptionEn:
      "Ripe blackberry folded into whisked matcha and cold milk. Berry-bright and mellow.",
    descriptionFa: "شاه‌توت رسیده با ماچای هم‌زده و شیر سرد. توتیِ روشن و ملایم. — TODO(review)",
    priceToman: 210_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Blackberry", "Wildflower honey", "Green tea"],
    notesFa: ["شاه‌توت", "عسل گل وحشی", "چای سبز"],
    image: "/images/scenes/blackberry.webp",
    featured: true,
  },
  {
    id: "midori-strawberry",
    brand: "midori",
    slug: "strawberry",
    nameEn: "Strawberry Cloud",
    nameFa: "ابر توت‌فرنگی",
    shortEn: "Strawberry",
    shortFa: "توت‌فرنگی",
    descriptionEn:
      "Fresh strawberries whipped into whisked matcha and cold milk. Sweet, soft and pink.",
    descriptionFa: "توت‌فرنگی تازه با ماچای هم‌زده و شیر سرد. شیرین، نرم و صورتی. — TODO(review)",
    priceToman: 205_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Strawberry", "Vanilla", "Fresh cream"],
    notesFa: ["توت‌فرنگی", "وانیل", "خامهٔ تازه"],
    image: "/images/scenes/strawberry.webp",
    featured: true,
  },
];

const MAKE_IT_YOURS: BrandData["makeItYours"] = [
  {
    labelEn: "Milk",
    labelFa: "شیر",
    optionsEn: ["Whole", "Oat", "Almond"],
    optionsFa: ["کامل", "جو دوسر", "بادام"],
  },
  {
    labelEn: "Sweetness",
    labelFa: "شیرینی",
    optionsEn: ["Full", "Half", "Unsweetened"],
    optionsFa: ["کامل", "نصف", "بدون شکر"],
  },
  {
    labelEn: "Size",
    labelFa: "اندازه",
    optionsEn: ["12 oz", "16 oz", "20 oz"],
    optionsFa: ["۱۲ انس", "۱۶ انس", "۲۰ انس"],
  },
];

export const BRANDS: Record<Brand, BrandData> = {
  ela: {
    brand: "ela",
    wordmark: "ela",
    heroTitleEn: "Choose your coffee",
    heroTitleFa: "قهوه‌ات را انتخاب کن",
    drinks: COFFEE_DRINKS,
    story: {
      eyebrowEn: "Our story",
      eyebrowFa: "داستان ما",
      titleEn: "Ela starts black. The rest is up to you.",
      titleFa: "الا سیاه شروع می‌شود. بقیه‌اش با توست.",
      bodyEn: [
        "We started with one stubborn idea: a perfect black espresso is the foundation of every great iced latte. So we built everything around the shot.",
        "Then we make our flavors the slow way, every morning, from real caramel, real vanilla bean, toasted hazelnut and dark chocolate. No powders. No shortcuts.",
      ],
      bodyFa: [
        "از یک ایدهٔ سرسخت شروع کردیم: یک اسپرسوی سیاهِ بی‌نقص، پایهٔ هر آیس‌لاتهٔ عالی است. پس همه‌چیز را دور شات ساختیم. — TODO(review)",
        "بعد طعم‌ها را هر صبح، به روش کند و از کارامل واقعی، دانهٔ وانیل واقعی، فندق برشته و شکلات تلخ می‌سازیم. بدون پودر. بدون میان‌بر. — TODO(review)",
      ],
      stats: [
        { valueEn: "7 days", valueFa: "۷ روز", labelEn: "Every roast rests before we brew it", labelFa: "هر برشته پیش از دم‌آوری استراحت می‌کند" },
        { valueEn: "2", valueFa: "۲", labelEn: "Single origins, roasted every week", labelFa: "دو خاستگاه تک‌منبع، هفته‌ای یک‌بار برشته می‌شود" },
        { valueEn: "6", valueFa: "۶", labelEn: "Flavors made in house each morning", labelFa: "طعمِ ساخته‌شده در خانه، هر صبح" },
        { valueEn: "0", valueFa: "۰", labelEn: "Powders or artificial syrups", labelFa: "پودر یا سیروپ مصنوعی" },
      ],
      image: "/images/story/bean.webp",
      imageAltEn: "A single dark roasted coffee bean on cream",
      imageAltFa: "یک دانهٔ قهوهٔ تیره‌برشته روی زمینهٔ کرم",
    },
    menu: {
      titleEn: "Six iced lattes. One perfect shot.",
      titleFa: "شش آیس‌لاته. یک شات بی‌نقص.",
      introEn:
        "Every drink starts with a double shot of Ela espresso over ice and cold milk, then one of our house flavors.",
      introFa:
        "هر نوشیدنی با دابل‌شات اسپرسوی الا روی یخ و شیر سرد شروع می‌شود، بعد یک طعم خانگی. — TODO(review)",
    },
    process: {
      eyebrowEn: "How it's made",
      eyebrowFa: "طرز تهیه",
      titleEn: "From green bean to your cup in four careful steps.",
      titleFa: "از دانهٔ سبز تا فنجان تو، در چهار قدمِ دقیق.",
      steps: [
        {
          titleEn: "Roast",
          titleFa: "برشته",
          bodyEn:
            "Every Tuesday we roast small batches to a deep medium-dark, chasing cocoa sweetness without the bitterness.",
          bodyFa: "هر سه‌شنبه دسته‌های کوچک را تا تیره‌متوسطِ عمیق برشته می‌کنیم؛ به‌دنبال شیرینی کاکائو بدون تلخی. — TODO(review)",
          image: "/images/process/roast.webp",
        },
        {
          titleEn: "Rest",
          titleFa: "استراحت",
          bodyEn: "Fresh beans rest for seven days so the gases settle and every shot pulls smooth and balanced.",
          bodyFa: "دانه‌های تازه هفت روز استراحت می‌کنند تا گازها بنشینند و هر شات نرم و متعادل بیرون بیاید. — TODO(review)",
          image: "/images/process/rest.webp",
        },
        {
          titleEn: "Pull",
          titleFa: "عصاره‌گیری",
          bodyEn: "Each drink gets its own double shot, pulled to order with 18 grams in and 36 grams out.",
          bodyFa: "هر نوشیدنی دابل‌شاتِ خودش را دارد؛ به سفارش، با ۱۸ گرم ورودی و ۳۶ گرم خروجی. — TODO(review)",
          image: "/images/process/pull.webp",
        },
        {
          titleEn: "Pour",
          titleFa: "ریختن",
          bodyEn: "The shot meets ice, cold milk and a house-made flavor, then goes straight into your hand.",
          bodyFa: "شات با یخ، شیر سرد و طعم خانگی آشنا می‌شود و مستقیم به دستت می‌رسد. — TODO(review)",
          image: "/images/process/pour.webp",
        },
      ],
    },
    origins: {
      eyebrowEn: "Where it grows",
      eyebrowFa: "خاستگاه",
      titleEn: "Two origins, blended for depth.",
      titleFa: "دو خاستگاه، آمیخته برای عمق.",
      introEn:
        "Our house espresso pairs a chocolate-heavy Colombian with a bright, floral Ethiopian, so it holds its own against ice and milk.",
      introFa:
        "اسپرسوی خانگی ما کلمبیای شکلاتی را با اتیوپیِ روشن و گلی جفت می‌کند تا زیر یخ و شیر کم نیاورد. — TODO(review)",
      cards: [
        {
          nameEn: "Huila, Colombia",
          nameFa: "هویلا، کلمبیا",
          share: 60,
          introEn: "Grown around 1,700 meters on the Andean slopes of southern Colombia, this washed coffee gives the blend its chocolatey backbone.",
          introFa: "در ارتفاع حدود ۱٬۷۰۰ متریِ دامنهٔ آندِ جنوب کلمبیا رشد می‌کند؛ این قهوهٔ شسته، ستون شکلاتیِ ترکیب است. — TODO(review)",
          facts: [
            { labelEn: "Altitude", labelFa: "ارتفاع", valueEn: "1,700 m", valueFa: "۱٬۷۰۰ متر" },
            { labelEn: "Process", labelFa: "فرآوری", valueEn: "Washed", valueFa: "شسته" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Cocoa, red apple", valueFa: "کاکائو، سیب سرخ" },
          ],
        },
        {
          nameEn: "Sidama, Ethiopia",
          nameFa: "سیداما، اتیوپی",
          share: 40,
          introEn: "From smallholder farms near 2,000 meters, this natural process coffee adds a lift of jasmine and blueberry.",
          introFa: "از مزارع کوچک نزدیک ۲٬۰۰۰ متر؛ این قهوهٔ طبیعی، بلندیِ یاس و بلوبری اضافه می‌کند. — TODO(review)",
          facts: [
            { labelEn: "Altitude", labelFa: "ارتفاع", valueEn: "2,000 m", valueFa: "۲٬۰۰۰ متر" },
            { labelEn: "Process", labelFa: "فرآوری", valueEn: "Natural", valueFa: "طبیعی" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Jasmine, blueberry", valueFa: "یاس، بلوبری" },
          ],
        },
      ],
    },
    marqueeEn: COFFEE_DRINKS.map((d) => d.nameEn),
    marqueeFa: COFFEE_DRINKS.map((d) => d.nameFa),
    cutouts: [
      { src: "/images/cutouts/coffee-chocolate.webp", altEn: "Dark chocolate", altFa: "شکلات تلخ" },
      { src: "/images/cutouts/coffee-cinnamon.webp", altEn: "Cinnamon sticks", altFa: "چوب دارچین" },
      { src: "/images/cutouts/coffee-caramel.webp", altEn: "Salted caramel", altFa: "کارامل نمکی" },
      { src: "/images/cutouts/coffee-vanilla.webp", altEn: "Vanilla flower and pods", altFa: "گل و غلاف وانیل" },
    ],
    makeItYours: MAKE_IT_YOURS,
  },
  midori: {
    brand: "midori",
    wordmark: "midori",
    heroTitleEn: "Choose your matcha",
    heroTitleFa: "ماچا‌ات را انتخاب کن",
    drinks: MATCHA_DRINKS,
    story: {
      eyebrowEn: "Our story",
      eyebrowFa: "داستان ما",
      titleEn: "Midori means green. The rest is up to you.",
      titleFa: "میدوری یعنی سبز. بقیه‌اش با توست.",
      bodyEn: [
        "Our matcha comes from shaded tea gardens in Uji and Nishio, where the leaves grow slowly under cover and turn a deep, vivid green.",
        "Then we pair it with fresh fruit, coconut and vanilla, whisked with care every morning. No powders. No shortcuts.",
      ],
      bodyFa: [
        "ماچای ما از باغ‌های چایِ سایه‌دارِ اوجی و نیشیو می‌آید؛ برگ‌ها آرام زیر پوشش رشد می‌کنند و سبزِ عمیق و زنده می‌شوند. — TODO(review)",
        "بعد آن را با میوهٔ تازه، نارگیل و وانیل جفت می‌کنیم و هر صبح با دقت هم می‌زنیم. بدون پودر. بدون میان‌بر. — TODO(review)",
      ],
      stats: [
        { valueEn: "21 days", valueFa: "۲۱ روز", labelEn: "Every leaf is shaded before harvest", labelFa: "هر برگ پیش از برداشت سایه می‌بیند" },
        { valueEn: "2", valueFa: "۲", labelEn: "Gardens we source from", labelFa: "دو باغی که از آن‌ها می‌گیریم" },
        { valueEn: "6", valueFa: "۶", labelEn: "Flavors whisked fresh each morning", labelFa: "طعمِ تازه‌هم‌زده، هر صبح" },
        { valueEn: "0", valueFa: "۰", labelEn: "Added colours or powders", labelFa: "رنگ یا پودرِ افزوده" },
      ],
      image: "/images/tea.webp",
      imageAltEn: "Whisked matcha and tea leaves",
      imageAltFa: "ماچای هم‌زده و برگ چای",
    },
    menu: {
      titleEn: "Six iced matchas. One perfect whisk.",
      titleFa: "شش آیس‌ماچا. یک هم‌زدن بی‌نقص.",
      introEn:
        "Every drink starts with whisked ceremonial matcha over ice and cold milk, then one of our house flavors.",
      introFa:
        "هر نوشیدنی با ماچای تشریفاتیِ هم‌زده روی یخ و شیر سرد شروع می‌شود، بعد یک طعم خانگی. — TODO(review)",
    },
    process: {
      eyebrowEn: "How it's made",
      eyebrowFa: "طرز تهیه",
      titleEn: "From shaded leaf to your cup in four careful steps.",
      titleFa: "از برگِ سایه‌دار تا فنجان تو، در چهار قدمِ دقیق.",
      steps: [
        {
          titleEn: "Shade",
          titleFa: "سایه",
          bodyEn: "Tea bushes are shaded for up to 21 days before harvest, so the leaves grow tender and rich in flavor.",
          bodyFa: "بوته‌های چای تا ۲۱ روز پیش از برداشت سایه می‌بینند تا برگ‌ها لطیف و پرطعم رشد کنند. — TODO(review)",
          image: "/images/shade.webp",
        },
        {
          titleEn: "Stone-grind",
          titleFa: "آسیاب‌سنگی",
          bodyEn: "First-flush leaves are de-stemmed and ground slowly between granite stones into a bright green powder.",
          bodyFa: "برگ‌های برداشت اول ساقه‌زدایی می‌شوند و آرام بین سنگ‌های گرانیتی به پودر سبز روشن تبدیل می‌شوند. — TODO(review)",
          // PLACEHOLDER: no stone-grind photo was supplied — tea.webp stands in.
          image: "/images/tea.webp",
          imagePlaceholder: true,
        },
        {
          titleEn: "Whisk",
          titleFa: "هم‌زدن",
          bodyEn: "Each serving is whisked to order, two grams of matcha with hot water until it turns silky and smooth.",
          bodyFa: "هر وعده به سفارش هم‌زده می‌شود؛ دو گرم ماچا با آب داغ تا ابریشمی و نرم شود. — TODO(review)",
          image: "/images/whisk.webp",
        },
        {
          titleEn: "Pour",
          titleFa: "ریختن",
          bodyEn: "The whisked matcha meets ice, cold milk and a house-made flavor, then goes straight into your hand.",
          bodyFa: "ماچای هم‌زده با یخ، شیر سرد و طعم خانگی آشنا می‌شود و مستقیم به دستت می‌رسد. — TODO(review)",
          image: "/images/process/pour.webp",
        },
      ],
    },
    origins: {
      eyebrowEn: "Where it grows",
      eyebrowFa: "خاستگاه",
      titleEn: "Two gardens, blended for balance.",
      titleFa: "دو باغ، آمیخته برای تعادل.",
      introEn:
        "We pair a deep, savory Uji matcha with a brighter Nishio matcha, so the drink is smooth, grassy and never bitter.",
      introFa:
        "ماچای عمیق و خوش‌طعم اوجی را با ماچای روشن‌تر نیشیو جفت می‌کنیم تا نوشیدنی نرم، علفی و هرگز تلخ نباشد. — TODO(review)",
      cards: [
        {
          nameEn: "Uji, Kyoto",
          nameFa: "اوجی، کیوتو",
          share: 60,
          introEn: "A deep, savory matcha from Uji's shaded gardens, with a smooth, umami-rich finish.",
          introFa: "ماچای عمیق و خوش‌طعم از باغ‌های سایه‌دار اوجی، با پایانی نرم و سرشار از اومامی. — TODO(review)",
          facts: [
            { labelEn: "Shaded", labelFa: "سایه", valueEn: "21 days", valueFa: "۲۱ روز" },
            { labelEn: "Harvest", labelFa: "برداشت", valueEn: "First flush", valueFa: "برداشت اول" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Umami, seaweed", valueFa: "اومامی، جلبک" },
          ],
        },
        {
          nameEn: "Nishio, Aichi",
          nameFa: "نیشیو، آیچی",
          share: 40,
          introEn: "A brighter matcha from Nishio's flat tea fields, with gentle grassy notes and a clean, fresh finish.",
          introFa: "ماچای روشن‌تر از مزارع مسطح چای نیشیو، با نت‌های ملایم علفی و پایانی تمیز و تازه. — TODO(review)",
          facts: [
            { labelEn: "Shaded", labelFa: "سایه", valueEn: "20 days", valueFa: "۲۰ روز" },
            { labelEn: "Harvest", labelFa: "برداشت", valueEn: "First flush", valueFa: "برداشت اول" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Grass, green apple", valueFa: "علف، سیب سبز" },
          ],
        },
      ],
    },
    marqueeEn: MATCHA_DRINKS.map((d) => d.nameEn),
    marqueeFa: MATCHA_DRINKS.map((d) => d.nameFa),
    cutouts: [
      { src: "/images/cutouts/matcha-strawberry.webp", altEn: "Strawberry", altFa: "توت‌فرنگی" },
      { src: "/images/cutouts/matcha-blueberry.webp", altEn: "Blueberries", altFa: "بلوبری" },
      { src: "/images/cutouts/matcha-cherry.webp", altEn: "Dark cherries", altFa: "گیلاس تلخ" },
      { src: "/images/cutouts/matcha-coconut.webp", altEn: "Coconut", altFa: "نارگیل" },
    ],
    makeItYours: MAKE_IT_YOURS,
  },
};

/** All 12 drinks, coffee first then matcha. */
export const ALL_DRINKS: Drink[] = [...COFFEE_DRINKS, ...MATCHA_DRINKS];

/** Look a drink up by brand + id or slug. Returns undefined when unknown. */
export function getDrink(brand: Brand, idOrSlug: string): Drink | undefined {
  return BRANDS[brand].drinks.find((d) => d.id === idOrSlug || d.slug === idOrSlug);
}

export function getBrandData(brand: Brand): BrandData {
  return BRANDS[brand];
}
