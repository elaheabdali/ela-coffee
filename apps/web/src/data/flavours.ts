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
 * fruit scenes double as the matcha scenes — except Midori Original,
 * whose real scene photo was supplied after launch
 * (`/images/scenes/matcha-original.webp`). Only the stone-grind step
 * still stands in with `tea.webp` (flagged PLACEHOLDER, with
 * `imagePlaceholder: true`) until the client supplies the real photo.
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
  /**
   * Sprite-sheet cell for the menu-card thumbnail (fix batch 7):
   * percent offsets of the 390% × 260% inner span inside the 56px
   * tile — one of (-15|-145|-275, -15|-145) per the reference markup.
   * Keyed by drink, not by index, so reordering never remaps a tile.
   */
  sprite: { x: number; y: number };
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
  /** Region name — the card h3 (reference: "Huila", "Uji"). */
  nameEn: string;
  nameFa: string;
  /** Country/region line under the h3 (reference: "Colombia", "Kyoto, Japan"). */
  regionEn: string;
  regionFa: string;
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
    /** Floating badge card over the story image (reference markup). */
    badge: { valueEn: string; valueFa: string; captionEn: string; captionFa: string };
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
  /**
   * Ingredient sprite sheet for the menu-card thumbnails (fix batch 7).
   * ela: /images/ingredients.webp — the reference's own cream sheet,
   * verified cell-for-cell against the reference's ingredients.jpg.
   * midori: /images/ingredients-v2-key.webp — the supplied v2 key art:
   * the same 6 matcha ingredients in the same 3×2 layout (verified by
   * per-cell hue match after masking the background), photographed on
   * the blue keying screen instead of cream, so the thumbnail cells
   * show a blue background where the reference shows cream.
   */
  spriteSheet: string;
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
    notesFa: ["کاکائوی تلخ — TODO(review)", "بادام برشته — TODO(review)", "شکر قهوه‌ای — TODO(review)"],
    image: "/images/scenes/original.webp",
    sprite: { x: -15, y: -15 },
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
    notesFa: ["شکر سوخته — TODO(review)", "کره و شکر قهوه‌ای — TODO(review)", "نمک دریا — TODO(review)"],
    image: "/images/scenes/caramel-latte.webp",
    sprite: { x: -145, y: -15 },
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
    notesFa: ["دانهٔ وانیل — TODO(review)", "خامهٔ تازه — TODO(review)", "عسل گل وحشی — TODO(review)"],
    image: "/images/scenes/vanilla-latte.webp",
    sprite: { x: -275, y: -15 },
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
    notesFa: ["فندق برشته — TODO(review)", "پرالین — TODO(review)", "شکلات شیری — TODO(review)"],
    image: "/images/scenes/hazelnut-latte.webp",
    sprite: { x: -15, y: -145 },
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
    notesFa: ["شکلات تلخ — TODO(review)", "گیلاس سیاه — TODO(review)", "دانهٔ کاکائو — TODO(review)"],
    image: "/images/scenes/mocha-latte.webp",
    sprite: { x: -145, y: -145 },
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
    notesFa: ["ملاس — TODO(review)", "دارچین سیلان — TODO(review)", "تافی — TODO(review)"],
    image: "/images/scenes/cinnamon-latte.webp",
    sprite: { x: -275, y: -145 },
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
      "Ceremonial grade matcha whisked to order and poured over ice and cold milk. Grassy, sweet and silky.",
    descriptionFa:
      "ماچای درجهٔ تشریفاتی که به سفارش هم زده و روی یخ و شیر سرد ریخته می‌شود. علفی، شیرین و ابریشمی. — TODO(review)",
    priceToman: 195_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Fresh grass", "Sweet cream", "Umami"],
    notesFa: ["علف تازه — TODO(review)", "خامهٔ شیرین — TODO(review)", "اومامی — TODO(review)"],
    image: "/images/scenes/matcha-original.webp",
    sprite: { x: -15, y: -15 },
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
      "Wild blueberry compote stirred into cold milk under a layer of whisked matcha. Mellow and berry sweet.",
    descriptionFa: "کمپوت بلوبری وحشی در شیر سرد، زیر لایه‌ای از ماچای هم‌زده. ملایم و شیرینِ توتی. — TODO(review)",
    priceToman: 210_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    // Single source of truth: the reference card showed only 2 notes here.
    notesEn: ["Wild blueberry", "Vanilla", "Green tea"],
    notesFa: ["بلوبری وحشی — TODO(review)", "وانیل — TODO(review)", "چای سبز — TODO(review)"],
    image: "/images/scenes/blueberry.webp",
    sprite: { x: -275, y: -15 },
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
      "Dark cherry syrup and a pinch of sakura salt beneath whisked matcha and cold milk.",
    descriptionFa: "سیروپ گیلاس تلخ و کمی نمک ساکورا، زیر ماچای هم‌زده و شیر سرد. — TODO(review)",
    priceToman: 210_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Dark cherry", "Sakura", "Almond"],
    notesFa: ["گیلاس تلخ — TODO(review)", "ساکورا — TODO(review)", "بادام — TODO(review)"],
    image: "/images/scenes/cherry.webp",
    sprite: { x: -145, y: -145 },
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
      "Toasted coconut milk and a touch of cane sugar make this our creamiest, softest matcha.",
    descriptionFa: "شیر نارگیل برشته و کمی شکر نیشکر، این را خامه‌ای‌ترین و نرم‌ترین ماچای ما می‌کند. — TODO(review)",
    priceToman: 200_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Toasted coconut", "Cane sugar", "Matcha"],
    notesFa: ["نارگیل برشته — TODO(review)", "شکر نیشکر — TODO(review)", "ماچا — TODO(review)"],
    image: "/images/scenes/coconut.webp",
    sprite: { x: -275, y: -145 },
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
      "Tart blackberries muddled with wildflower honey, layered under matcha and oat milk.",
    descriptionFa: "شاه‌توت‌های ترش که با عسل گل وحشی له شده‌اند، لایه‌به‌لایه زیر ماچا و شیر جو دوسر. — TODO(review)",
    priceToman: 210_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Blackberry", "Wildflower honey", "Green tea"],
    notesFa: ["شاه‌توت — TODO(review)", "عسل گل وحشی — TODO(review)", "چای سبز — TODO(review)"],
    image: "/images/scenes/blackberry.webp",
    sprite: { x: -15, y: -145 },
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
      "Crushed ripe strawberries and cold milk under a layer of whisked matcha. Bright, jammy and soft.",
    descriptionFa: "توت‌فرنگی‌های رسیدهٔ له‌شده و شیر سرد، زیر لایه‌ای از ماچای هم‌زده. روشن، مربایی و نرم. — TODO(review)",
    priceToman: 205_000,
    caffeineMg: 70,
    size: "16 oz iced",
    sizeFa: "۱۶ انس، سرد",
    notesEn: ["Ripe strawberry", "Cream", "Green tea"],
    notesFa: ["توت‌فرنگی رسیده — TODO(review)", "خامه — TODO(review)", "چای سبز — TODO(review)"],
    image: "/images/scenes/strawberry.webp",
    sprite: { x: -145, y: -15 },
    featured: true,
  },
];

const MAKE_IT_YOURS_SWEETNESS: BrandData["makeItYours"][number] = {
  labelEn: "Sweetness",
  labelFa: "شیرینی",
  optionsEn: ["Full", "Half", "Unsweetened"],
  optionsFa: ["کامل", "نصف", "بدون شکر"],
};

const MAKE_IT_YOURS_SIZE: BrandData["makeItYours"][number] = {
  labelEn: "Size",
  labelFa: "اندازه",
  optionsEn: ["12 oz", "16 oz", "20 oz"],
  optionsFa: ["۱۲ انس", "۱۶ انس", "۲۰ انس"],
};

/** Milk differs per brand (reference menu markup): coffee offers Almond, matcha offers Coconut. */
const MAKE_IT_YOURS_ELA: BrandData["makeItYours"] = [
  {
    labelEn: "Milk",
    labelFa: "شیر",
    optionsEn: ["Whole", "Oat", "Almond"],
    optionsFa: ["کامل", "جو دوسر", "بادام"],
  },
  MAKE_IT_YOURS_SWEETNESS,
  MAKE_IT_YOURS_SIZE,
];

const MAKE_IT_YOURS_MIDORI: BrandData["makeItYours"] = [
  {
    labelEn: "Milk",
    labelFa: "شیر",
    optionsEn: ["Whole", "Oat", "Coconut"],
    optionsFa: ["کامل", "جو دوسر", "نارگیل"],
  },
  MAKE_IT_YOURS_SWEETNESS,
  MAKE_IT_YOURS_SIZE,
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
        "We started with one stubborn idea: a perfect black espresso is the foundation of every great iced latte. So we roast two single origin coffees in small batches and pull every shot to order.",
        "Then we make our flavors the slow way, every morning, from real caramel, real vanilla bean, toasted hazelnuts and dark chocolate. Pick one above, or keep it classic. Either way, it starts black.",
      ],
      bodyFa: [
        "از یک ایدهٔ سرسخت شروع کردیم: یک اسپرسوی سیاهِ بی‌نقص، پایهٔ هر آیس‌لاتهٔ عالی است. پس دو قهوهٔ تک‌خاستگاه را در دسته‌های کوچک برشته می‌کنیم و هر شات را به سفارش می‌گیریم. — TODO(review)",
        "بعد طعم‌ها را هر صبح، به روش کند، از کارامل واقعی، دانهٔ وانیل واقعی، فندق برشته و شکلات تلخ می‌سازیم. یکی را بالا انتخاب کن، یا کلاسیک بمان. به‌هرحال، سیاه شروع می‌شود. — TODO(review)",
      ],
      badge: {
        valueEn: "7 days",
        valueFa: "۷ روز",
        captionEn: "Every roast rests before we brew it",
        captionFa: "هر برشته پیش از دم‌آوری استراحت می‌کند",
      },
      stats: [
        { valueEn: "2", valueFa: "۲", labelEn: "Single origins, roasted every week", labelFa: "دو خاستگاه تک‌منبع، هفته‌ای یک‌بار برشته می‌شود" },
        { valueEn: "6", valueFa: "۶", labelEn: "Flavors made in house each morning", labelFa: "طعمِ ساخته‌شده در خانه، هر صبح" },
        { valueEn: "0", valueFa: "۰", labelEn: "Powders or artificial syrups", labelFa: "پودر یا سیروپ مصنوعی" },
      ],
      image: "/images/story/bean.webp",
      imageAltEn: "A single dark roasted coffee bean",
      imageAltFa: "یک دانهٔ قهوهٔ تیره‌برشته",
    },
    menu: {
      titleEn: "Six iced lattes. One perfect shot.",
      titleFa: "شش آیس‌لاته. یک شات بی‌نقص.",
      introEn:
        "Every drink starts with a double shot of Ela espresso over ice and cold milk, then one of our house-made flavors.",
      introFa:
        "هر نوشیدنی با دابل‌شات اسپرسوی الا روی یخ و شیر سرد شروع می‌شود، بعد یکی از طعم‌های خانگیِ ما. — TODO(review)",
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
        "Our house espresso pairs a chocolate-heavy Colombian with a bright, floral Ethiopian, so it holds its own under milk, ice and every flavor on the menu.",
      introFa:
        "اسپرسوی خانگی ما کلمبیای شکلاتیِ سنگین را با اتیوپیِ روشن و گلی جفت می‌کند تا زیر شیر، یخ و هر طعمی در منو کم نیاورد. — TODO(review)",
      cards: [
        {
          nameEn: "Huila",
          nameFa: "هویلا",
          regionEn: "Colombia",
          regionFa: "کلمبیا",
          share: 60,
          introEn: "Grown around 1,700 meters on the Andean slopes of southern Colombia, this washed coffee gives the blend its cocoa backbone and a long caramel finish.",
          introFa: "در ارتفاع حدود ۱٬۷۰۰ متریِ دامنهٔ آندِ جنوب کلمبیا رشد می‌کند؛ این قهوهٔ شسته ستون کاکائوییِ ترکیب را می‌سازد و پایانی طولانی از کارامل دارد. — TODO(review)",
          facts: [
            { labelEn: "Altitude", labelFa: "ارتفاع", valueEn: "1,700 m", valueFa: "۱٬۷۰۰ متر" },
            { labelEn: "Process", labelFa: "فرآوری", valueEn: "Washed", valueFa: "شسته" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Cocoa, red apple", valueFa: "کاکائو، سیب سرخ" },
          ],
        },
        {
          nameEn: "Sidama",
          nameFa: "سیداما",
          regionEn: "Ethiopia",
          regionFa: "اتیوپی",
          share: 40,
          introEn: "From smallholder farms near 2,000 meters, this natural process coffee adds a lift of jasmine and blueberry that keeps every latte bright.",
          introFa: "از مزارع کوچک نزدیک ۲٬۰۰۰ متر؛ این قهوهٔ طبیعی، بلندیِ یاس و بلوبری می‌افزاید که هر لاته را روشن نگه می‌دارد. — TODO(review)",
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
    spriteSheet: "/images/ingredients.webp",
    makeItYours: MAKE_IT_YOURS_ELA,
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
      titleEn: "Midori means green. We take that seriously.",
      titleFa: "میدوری یعنی سبز. ما این را جدی می‌گیریم. — TODO(review)",
      bodyEn: [
        "Our matcha comes from shaded tea gardens in Uji and Nishio, stone-milled into a fine, vivid powder just weeks before it reaches the counter.",
        "We whisk every cup to order and pair it with real fruit, never syrup from a bottle. Pick a flavor above, or keep it pure. Either way, it starts green.",
      ],
      bodyFa: [
        "ماچای ما از باغ‌های چایِ سایه‌دارِ اوجی و نیشیو می‌آید؛ با آسیاب‌سنگی به پودری ریز و زنده تبدیل می‌شود، فقط چند هفته پیش از رسیدن به پیشخوان. — TODO(review)",
        "هر فنجان را به سفارش هم می‌زنیم و با میوهٔ واقعی جفت می‌کنیم، هرگز سیروپِ بطری. یک طعم را بالا انتخاب کن، یا خالص نگهش دار. به‌هرحال، سبز شروع می‌شود. — TODO(review)",
      ],
      badge: {
        valueEn: "21 days",
        valueFa: "۲۱ روز",
        captionEn: "Our tea grows in shade before harvest",
        captionFa: "چای ما پیش از برداشت در سایه رشد می‌کند. — TODO(review)",
      },
      stats: [
        { valueEn: "2", valueFa: "۲", labelEn: "Tea gardens in Japan we source from", labelFa: "باغ‌های چای ژاپن که از آن‌ها می‌گیریم. — TODO(review)" },
        { valueEn: "6", valueFa: "۶", labelEn: "Fruit pairings made fresh each morning", labelFa: "جفت‌های میوه‌ای که هر صبح تازه آماده می‌شوند. — TODO(review)" },
        { valueEn: "0", valueFa: "۰", labelEn: "Added colors or powdered mixes", labelFa: "رنگِ افزوده یا مخلوطِ پودری. — TODO(review)" },
      ],
      image: "/images/tea.webp",
      imageAltEn: "A cup of green tea on a saucer beside a sprig of leaves",
      imageAltFa: "یک فنجان چای سبز روی نعلبکی کنار یک شاخه برگ",
    },
    menu: {
      titleEn: "Six iced matchas. One perfect whisk.",
      titleFa: "شش آیس‌ماچا. یک هم‌زدن بی‌نقص.",
      introEn:
        "Every drink starts with ceremonial matcha whisked to order over ice and cold milk, then one of our fresh fruit pairings.",
      introFa:
        "هر نوشیدنی با ماچای تشریفاتیِ هم‌زده به سفارش روی یخ و شیر سرد شروع می‌شود، بعد یکی از ترکیب‌های میوه‌ای تازهٔ ما. — TODO(review)",
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
        "We pair a deep, savory Uji matcha with a brighter Nishio harvest, so every drink stays vivid under milk, ice and fruit.",
      introFa:
        "ماچای عمیق و خوش‌طعم اوجی را با برداشت روشن‌تر نیشیو جفت می‌کنیم تا هر نوشیدنی زیر شیر، یخ و میوه زنده بماند. — TODO(review)",
      cards: [
        {
          nameEn: "Uji",
          nameFa: "اوجی",
          regionEn: "Kyoto, Japan",
          regionFa: "کیوتو، ژاپن",
          share: 60,
          introEn: "Grown in the misty hills south of Kyoto, where tea has been shaded and stone-milled for centuries, Uji matcha gives the blend its deep umami and creamy body.",
          introFa: "در تپه‌های مه‌آلود جنوب کیوتو رشد می‌کند، جایی که چای قرن‌هاست در سایه می‌ماند و با آسیاب‌سنگی پودر می‌شود؛ ماچای اوجی عمق اومامی و بدنهٔ خامه‌ایِ ترکیب را می‌سازد. — TODO(review)",
          facts: [
            { labelEn: "Harvest", labelFa: "برداشت", valueEn: "First flush", valueFa: "برداشت اول" },
            { labelEn: "Shading", labelFa: "سایه", valueEn: "21 days", valueFa: "۲۱ روز" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Umami, sweet grass", valueFa: "اومامی، علف شیرین — TODO(review)" },
          ],
        },
        {
          nameEn: "Nishio",
          nameFa: "نیشیو",
          regionEn: "Aichi, Japan",
          regionFa: "آیچی، ژاپن",
          share: 40,
          introEn: "From the river plains of Aichi, Nishio matcha adds a bright jade color and a clean, lightly floral finish that stays vivid under fruit.",
          introFa: "از دشت‌های رودخانه‌ای آیچی؛ ماچای نیشیو رنگ یشمیِ روشن و پایانی تمیز و کمی گلی می‌افزاید که زیر میوه زنده می‌ماند. — TODO(review)",
          facts: [
            { labelEn: "Harvest", labelFa: "برداشت", valueEn: "First flush", valueFa: "برداشت اول" },
            { labelEn: "Shading", labelFa: "سایه", valueEn: "20 days", valueFa: "۲۰ روز" },
            { labelEn: "Notes", labelFa: "نت‌ها", valueEn: "Floral, sweet pea", valueFa: "گلی، نخود شیرین — TODO(review)" },
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
    // Cream-background sheet keyed from the blue-key art (see
    // fix7-check/key-v2-cream.py): the supplied v2-key.jpg is the same
    // 6 ingredients on a blue screen, while the reference sheet is on
    // cream. The blue sheet would render bright-blue thumbnails.
    spriteSheet: "/images/ingredients-v2.webp",
    makeItYours: MAKE_IT_YOURS_MIDORI,
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
