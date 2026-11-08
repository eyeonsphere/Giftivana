/**
 * DEMO DATA — Stage 2 only.
 *
 * Everything in this file is placeholder content. Partners are fictional,
 * cities are demo destinations (not confirmed coverage), and prices are
 * illustrative. In Stage 3 this file becomes supabase/seed.sql and the
 * functions in src/lib/catalog read from the database instead.
 *
 * IDs are stable strings so links and tests are deterministic.
 */
import type {
  Category,
  City,
  Country,
  Currency,
  DeliverySettings,
  GiftCardDenomination,
  GiftCardDetails,
  Occasion,
  Partner,
  PartnerLocation,
  Product,
  ProductAvailability,
  ProductImage,
  ProductVariant,
} from "@/types/domain";

/* ---------- Money & geography ---------- */

export const currencies: Currency[] = [
  { code: "USD", name: "US dollar", minorUnitExponent: 2, symbol: "$", isChargeCurrency: true, isFaceCurrency: false },
  { code: "SYP", name: "Syrian pound", minorUnitExponent: 0, symbol: "£S", isChargeCurrency: false, isFaceCurrency: true },
  { code: "IQD", name: "Iraqi dinar", minorUnitExponent: 0, symbol: "ع.د", isChargeCurrency: false, isFaceCurrency: true },
];

export const countries: Country[] = [
  { code: "SY", name: "Syria", isDestination: true, isOrigin: false, defaultTimezone: "Asia/Damascus", isActive: true },
  { code: "IQ", name: "Iraq", isDestination: true, isOrigin: false, defaultTimezone: "Asia/Baghdad", isActive: true },
  { code: "US", name: "United States", isDestination: false, isOrigin: true, defaultTimezone: "America/New_York", isActive: true },
  { code: "GB", name: "United Kingdom", isDestination: false, isOrigin: true, defaultTimezone: "Europe/London", isActive: true },
  { code: "DE", name: "Germany", isDestination: false, isOrigin: true, defaultTimezone: "Europe/Berlin", isActive: true },
  { code: "SE", name: "Sweden", isDestination: false, isOrigin: true, defaultTimezone: "Europe/Stockholm", isActive: true },
  { code: "CA", name: "Canada", isDestination: false, isOrigin: true, defaultTimezone: "America/Toronto", isActive: true },
  { code: "AU", name: "Australia", isDestination: false, isOrigin: true, defaultTimezone: "Australia/Sydney", isActive: true },
  { code: "AE", name: "United Arab Emirates", isDestination: false, isOrigin: true, defaultTimezone: "Asia/Dubai", isActive: true },
];

export const cities: City[] = [
  { id: "city_damascus", countryCode: "SY", name: "Damascus", slug: "damascus", timezone: "Asia/Damascus", isActive: true, sortOrder: 1 },
  { id: "city_aleppo", countryCode: "SY", name: "Aleppo", slug: "aleppo", timezone: "Asia/Damascus", isActive: true, sortOrder: 2 },
  { id: "city_homs", countryCode: "SY", name: "Homs", slug: "homs", timezone: "Asia/Damascus", isActive: true, sortOrder: 3 },
  { id: "city_hama", countryCode: "SY", name: "Hama", slug: "hama", timezone: "Asia/Damascus", isActive: true, sortOrder: 4 },
  { id: "city_latakia", countryCode: "SY", name: "Latakia", slug: "latakia", timezone: "Asia/Damascus", isActive: true, sortOrder: 5 },
  { id: "city_tartus", countryCode: "SY", name: "Tartus", slug: "tartus", timezone: "Asia/Damascus", isActive: true, sortOrder: 6 },
  { id: "city_baghdad", countryCode: "IQ", name: "Baghdad", slug: "baghdad", timezone: "Asia/Baghdad", isActive: true, sortOrder: 1 },
  { id: "city_mosul", countryCode: "IQ", name: "Mosul", slug: "mosul", timezone: "Asia/Baghdad", isActive: true, sortOrder: 2 },
  { id: "city_basra", countryCode: "IQ", name: "Basra", slug: "basra", timezone: "Asia/Baghdad", isActive: true, sortOrder: 3 },
  { id: "city_kirkuk", countryCode: "IQ", name: "Kirkuk", slug: "kirkuk", timezone: "Asia/Baghdad", isActive: true, sortOrder: 4 },
  { id: "city_najaf", countryCode: "IQ", name: "Najaf", slug: "najaf", timezone: "Asia/Baghdad", isActive: true, sortOrder: 5 },
  { id: "city_karbala", countryCode: "IQ", name: "Karbala", slug: "karbala", timezone: "Asia/Baghdad", isActive: true, sortOrder: 6 },
  { id: "city_sulaymaniyah", countryCode: "IQ", name: "Sulaymaniyah", slug: "sulaymaniyah", timezone: "Asia/Baghdad", isActive: true, sortOrder: 7 },
  { id: "city_nasiriyah", countryCode: "IQ", name: "Nasiriyah", slug: "nasiriyah", timezone: "Asia/Baghdad", isActive: true, sortOrder: 8 },
  { id: "city_amarah", countryCode: "IQ", name: "Amarah", slug: "amarah", timezone: "Asia/Baghdad", isActive: true, sortOrder: 9 },
];

export const deliverySettings: DeliverySettings[] = cities.map((c) => ({
  cityId: c.id,
  // Demo values. Damascus and Baghdad: 2-day lead; other cities: 3-day lead until local partners confirm.
  minLeadDays: c.id === "city_damascus" || c.id === "city_baghdad" ? 2 : 3,
  maxAdvanceDays: 45,
  cutoffTime: "14:00",
  blackoutDates: [],
  deliveryDays: [0, 1, 2, 3, 4, 6],
}));

/* ---------- Taxonomy ---------- */

export const categories: Category[] = [
  {
    id: "cat_flowers",
    slug: "flowers",
    name: "Flowers",
    description: "Fresh bouquets arranged locally on the day.",
    productType: "physical",
    sortOrder: 1,
    isActive: true,
    imagePath: "/demo/cat-flowers.svg",
  },
  {
    id: "cat_cakes",
    slug: "cakes",
    name: "Cakes",
    description: "Baked by a local partner and delivered the same day.",
    productType: "physical",
    sortOrder: 2,
    isActive: true,
    imagePath: "/demo/cat-cakes.svg",
  },
  {
    id: "cat_chocolates",
    slug: "chocolates",
    name: "Chocolates",
    description: "Boxes and assortments for sharing.",
    productType: "physical",
    sortOrder: 3,
    isActive: true,
    imagePath: "/demo/cat-chocolates.svg",
  },
  {
    id: "cat_balloons",
    slug: "balloons",
    name: "Balloons",
    description: "Helium bunches and number balloons.",
    productType: "physical",
    sortOrder: 4,
    isActive: true,
    imagePath: "/demo/cat-balloons.svg",
  },
  {
    id: "cat_plants",
    slug: "plants",
    name: "Plants",
    description: "Potted plants that keep saying hello.",
    productType: "physical",
    sortOrder: 5,
    isActive: true,
    imagePath: "/demo/cat-plants.svg",
  },
  {
    id: "cat_baskets",
    slug: "gift-baskets",
    name: "Gift baskets",
    description: "Curated hampers with sweets, nuts and treats.",
    productType: "physical",
    sortOrder: 6,
    isActive: true,
    imagePath: "/demo/cat-baskets.svg",
  },
  {
    id: "cat_giftcards",
    slug: "gift-cards",
    name: "Store gift cards",
    description: "Let them choose at a store they already know.",
    productType: "gift_card",
    sortOrder: 7,
    isActive: true,
    imagePath: "/demo/cat-giftcards.svg",
  },
];

export const occasions: Occasion[] = [
  {
    id: "occ_birthday",
    slug: "birthday",
    name: "Birthday",
    description: "Cake, balloons, and the message you'd say in person.",
    isActive: true,
    imagePath: "/demo/occ-birthday.svg",
  },
  { id: "occ_eid", slug: "eid", name: "Eid", description: "Sweets and gifts for the holiday table.", isActive: true, imagePath: "/demo/occ-eid.svg" },
  {
    id: "occ_new_baby",
    slug: "new-baby",
    name: "New baby",
    description: "A warm welcome for the newest family member.",
    isActive: true,
    imagePath: "/demo/occ-new-baby.svg",
  },
  {
    id: "occ_anniversary",
    slug: "anniversary",
    name: "Anniversary",
    description: "Flowers and chocolates for the two of them.",
    isActive: true,
    imagePath: "/demo/occ-anniversary.svg",
  },
  {
    id: "occ_graduation",
    slug: "graduation",
    name: "Graduation",
    description: "Mark the milestone from wherever you are.",
    isActive: true,
    imagePath: "/demo/occ-graduation.svg",
  },
  {
    id: "occ_get_well",
    slug: "get-well",
    name: "Get well",
    description: "Something gentle for a hard week.",
    isActive: true,
    imagePath: "/demo/occ-get-well.svg",
  },
  {
    id: "occ_just_because",
    slug: "just-because",
    name: "Just because",
    description: "No occasion needed.",
    isActive: true,
    imagePath: "/demo/occ-just-because.svg",
  },
];

/* ---------- Partners (fictional) ---------- */

export const partners: Partner[] = [
  {
    id: "partner_demo_market_sy",
    slug: "demo-market-syria",
    name: "Demo Market — Syria",
    description: "A fictional supermarket used to demonstrate gift cards. Replace with a real partner from the admin dashboard.",
    logoPath: "/demo/partner-demo-market.svg",
    storeCategory: "supermarket",
    countryCode: "SY",
    status: "active",
    isDemo: true,
    supportedFulfillmentMethods: ["manual", "physical_card"],
  },
  {
    id: "partner_demo_dept_iq",
    slug: "demo-department-store-iraq",
    name: "Demo Department Store — Iraq",
    description: "A fictional department store used to demonstrate gift cards. Replace with a real partner from the admin dashboard.",
    logoPath: "/demo/partner-demo-dept.svg",
    storeCategory: "department",
    countryCode: "IQ",
    status: "active",
    isDemo: true,
    supportedFulfillmentMethods: ["manual"],
  },
  {
    id: "partner_demo_grocery_sy",
    slug: "demo-grocery-partner-syria",
    name: "Demo Grocery Partner — Syria",
    description: "A fictional grocery chain used to demonstrate gift cards. Replace with a real partner from the admin dashboard.",
    logoPath: "/demo/partner-demo-grocery.svg",
    storeCategory: "grocery",
    countryCode: "SY",
    status: "active",
    isDemo: true,
    supportedFulfillmentMethods: ["manual", "digital_code"],
  },
];

export const partnerLocations: PartnerLocation[] = [
  { id: "loc_dm_1", partnerId: "partner_demo_market_sy", cityId: "city_damascus", label: "Demo Market — Mezzeh (placeholder)", isActive: true },
  { id: "loc_dm_2", partnerId: "partner_demo_market_sy", cityId: "city_damascus", label: "Demo Market — Old City (placeholder)", isActive: true },
  { id: "loc_dd_1", partnerId: "partner_demo_dept_iq", cityId: "city_baghdad", label: "Demo Department Store — Karrada (placeholder)", isActive: true },
  {
    id: "loc_dg_1",
    partnerId: "partner_demo_grocery_sy",
    cityId: "city_damascus",
    label: "Demo Grocery — all Damascus branches (placeholder)",
    isActive: true,
  },
];

/* ---------- Products ---------- */

type Seed = {
  product: Omit<Product, "status" | "isDemo" | "productType" | "partnerId"> & Partial<Pick<Product, "productType" | "partnerId">>;
  variants?: Array<{ name: string; priceMinor: number; isDefault?: boolean }>;
  cities: Array<{ cityId: string; leadTimeDays?: number }>;
  alt: string;
};

const seeds: Seed[] = [
  {
    product: {
      id: "p_peony_bouquet",
      slug: "soft-peony-bouquet",
      categoryId: "cat_flowers",
      name: "Soft peony bouquet",
      shortDescription: "Peonies and eucalyptus, wrapped in kraft paper.",
      description:
        "A loose, garden-style bouquet of peonies with eucalyptus and seasonal greenery. Arranged locally on the morning of delivery so it arrives fresh. Stem count varies by size.",
      isFeatured: true,
      basePriceMinor: 4500,
      currency: "USD",
      occasionIds: ["occ_anniversary", "occ_just_because", "occ_birthday"],
    },
    variants: [
      { name: "Small (10 stems)", priceMinor: 4500, isDefault: true },
      { name: "Medium (18 stems)", priceMinor: 6500 },
      { name: "Large (28 stems)", priceMinor: 9000 },
    ],
    cities: [
      { cityId: "city_damascus", leadTimeDays: 2 },
      { cityId: "city_baghdad", leadTimeDays: 2 },
    ],
    alt: "Illustration of a peony bouquet in kraft paper",
  },
  {
    product: {
      id: "p_white_roses",
      slug: "white-rose-arrangement",
      categoryId: "cat_flowers",
      name: "White rose arrangement",
      shortDescription: "Twelve white roses in a low ceramic vase.",
      description: "Classic white roses arranged in a reusable ceramic vase. A calm choice for condolences, new homes, or anyone who prefers understatement.",
      isFeatured: false,
      basePriceMinor: 5500,
      currency: "USD",
      occasionIds: ["occ_get_well", "occ_just_because"],
    },
    cities: [{ cityId: "city_damascus", leadTimeDays: 2 }],
    alt: "Illustration of white roses in a ceramic vase",
  },
  {
    product: {
      id: "p_sunflowers",
      slug: "sunflower-bunch",
      categoryId: "cat_flowers",
      name: "Sunflower bunch",
      shortDescription: "Bright sunflowers tied with twine.",
      description: "A cheerful bunch of sunflowers, hand-tied. Good for someone who needs a lift or a reason to smile at the door.",
      isFeatured: false,
      basePriceMinor: 3500,
      currency: "USD",
      occasionIds: ["occ_get_well", "occ_birthday", "occ_just_because"],
    },
    cities: [{ cityId: "city_baghdad", leadTimeDays: 2 }],
    alt: "Illustration of a bunch of sunflowers",
  },
  {
    product: {
      id: "p_choc_cake",
      slug: "chocolate-celebration-cake",
      categoryId: "cat_cakes",
      name: "Chocolate celebration cake",
      shortDescription: "Rich layered chocolate cake with ganache.",
      description:
        "A three-layer chocolate sponge with dark ganache, baked by a local partner bakery on the day of delivery. Add a short message to be piped on top at checkout.",
      isFeatured: true,
      basePriceMinor: 3800,
      currency: "USD",
      occasionIds: ["occ_birthday", "occ_graduation", "occ_anniversary"],
    },
    variants: [
      { name: "1 kg (serves 6–8)", priceMinor: 3800, isDefault: true },
      { name: "2 kg (serves 12–16)", priceMinor: 6800 },
    ],
    cities: [
      { cityId: "city_damascus", leadTimeDays: 2 },
      { cityId: "city_baghdad", leadTimeDays: 3 },
    ],
    alt: "Illustration of a layered chocolate cake",
  },
  {
    product: {
      id: "p_pistachio_cake",
      slug: "pistachio-cream-cake",
      categoryId: "cat_cakes",
      name: "Pistachio cream cake",
      shortDescription: "Light sponge with pistachio cream and rose.",
      description: "A soft vanilla sponge layered with pistachio cream and finished with crushed pistachio and dried rose. A favourite for Eid tables.",
      isFeatured: false,
      basePriceMinor: 4200,
      currency: "USD",
      occasionIds: ["occ_eid", "occ_birthday"],
    },
    variants: [
      { name: "1 kg", priceMinor: 4200, isDefault: true },
      { name: "2 kg", priceMinor: 7600 },
    ],
    cities: [{ cityId: "city_damascus", leadTimeDays: 2 }],
    alt: "Illustration of a pistachio cream cake",
  },
  {
    product: {
      id: "p_assorted_choc",
      slug: "assorted-chocolate-box",
      categoryId: "cat_chocolates",
      name: "Assorted chocolate box",
      shortDescription: "Milk, dark and filled chocolates in a gift box.",
      description:
        "A mixed box of milk, dark and filled chocolates from a local chocolatier, in a ribboned gift box. Keeps well for sharing over several days.",
      isFeatured: true,
      basePriceMinor: 2800,
      currency: "USD",
      occasionIds: ["occ_eid", "occ_anniversary", "occ_just_because", "occ_get_well"],
    },
    variants: [
      { name: "24 pieces", priceMinor: 2800, isDefault: true },
      { name: "48 pieces", priceMinor: 5000 },
    ],
    cities: [
      { cityId: "city_damascus", leadTimeDays: 1 },
      { cityId: "city_baghdad", leadTimeDays: 1 },
    ],
    alt: "Illustration of an open box of assorted chocolates",
  },
  {
    product: {
      id: "p_dates_choc",
      slug: "chocolate-dipped-dates",
      categoryId: "cat_chocolates",
      name: "Chocolate-dipped dates",
      shortDescription: "Medjool dates in dark chocolate with almonds.",
      description: "Plump dates stuffed with almond and dipped in dark chocolate. Arrives in a wooden presentation box.",
      isFeatured: false,
      basePriceMinor: 3200,
      currency: "USD",
      occasionIds: ["occ_eid", "occ_just_because"],
    },
    cities: [{ cityId: "city_baghdad", leadTimeDays: 1 }],
    alt: "Illustration of chocolate-dipped dates in a box",
  },
  {
    product: {
      id: "p_balloon_bunch",
      slug: "helium-balloon-bunch",
      categoryId: "cat_balloons",
      name: "Helium balloon bunch",
      shortDescription: "Six latex balloons on ribbons with a weight.",
      description: "Six helium balloons in a colour theme of your choosing, tied with ribbon to a weighted base. Delivered inflated and ready to surprise.",
      isFeatured: false,
      basePriceMinor: 1800,
      currency: "USD",
      occasionIds: ["occ_birthday", "occ_graduation", "occ_new_baby"],
    },
    variants: [
      { name: "Pastel mix", priceMinor: 1800, isDefault: true },
      { name: "Gold & white", priceMinor: 1800 },
      { name: "Bright mix", priceMinor: 1800 },
    ],
    cities: [
      { cityId: "city_damascus", leadTimeDays: 1 },
      { cityId: "city_baghdad", leadTimeDays: 1 },
    ],
    alt: "Illustration of a bunch of helium balloons",
  },
  {
    product: {
      id: "p_number_balloon",
      slug: "number-balloon-set",
      categoryId: "cat_balloons",
      name: "Number balloon set",
      shortDescription: "Large foil number balloons for any age.",
      description: "Foil number balloons, about 85 cm tall, inflated with helium. Tell us the number at checkout in your gift note.",
      isFeatured: false,
      basePriceMinor: 2200,
      currency: "USD",
      occasionIds: ["occ_birthday", "occ_anniversary"],
    },
    cities: [{ cityId: "city_damascus", leadTimeDays: 2 }],
    alt: "Illustration of foil number balloons",
  },
  {
    product: {
      id: "p_olive_tree",
      slug: "small-olive-tree",
      categoryId: "cat_plants",
      name: "Small olive tree",
      shortDescription: "A potted olive sapling in a terracotta pot.",
      description: "A young olive tree in a terracotta pot, about 60 cm tall. A gift that stays. Comes with simple care notes in Arabic and English.",
      isFeatured: true,
      basePriceMinor: 4000,
      currency: "USD",
      occasionIds: ["occ_just_because", "occ_new_baby", "occ_graduation"],
    },
    cities: [{ cityId: "city_damascus", leadTimeDays: 3 }],
    alt: "Illustration of a small olive tree in a terracotta pot",
  },
  {
    product: {
      id: "p_jasmine",
      slug: "jasmine-plant",
      categoryId: "cat_plants",
      name: "Jasmine plant",
      shortDescription: "A climbing jasmine in a ceramic pot.",
      description: "A fragrant jasmine in a glazed ceramic pot, with a small trellis. Damascus's own flower, for a balcony or windowsill.",
      isFeatured: false,
      basePriceMinor: 3400,
      currency: "USD",
      occasionIds: ["occ_just_because", "occ_get_well"],
    },
    cities: [
      { cityId: "city_damascus", leadTimeDays: 3 },
      { cityId: "city_baghdad", leadTimeDays: 4 },
    ],
    alt: "Illustration of a jasmine plant in a glazed pot",
  },
  {
    product: {
      id: "p_sweets_basket",
      slug: "sweets-and-nuts-basket",
      categoryId: "cat_baskets",
      name: "Sweets and nuts basket",
      shortDescription: "Baklava, ma'amoul and mixed nuts.",
      description:
        "A woven basket with baklava, ma'amoul, roasted mixed nuts and dried apricots, wrapped in cellophane with a ribbon. Enough to put out for guests.",
      isFeatured: true,
      basePriceMinor: 5200,
      currency: "USD",
      occasionIds: ["occ_eid", "occ_new_baby", "occ_graduation", "occ_just_because"],
    },
    variants: [
      { name: "Standard", priceMinor: 5200, isDefault: true },
      { name: "Generous", priceMinor: 8200 },
    ],
    cities: [
      { cityId: "city_damascus", leadTimeDays: 2 },
      { cityId: "city_baghdad", leadTimeDays: 2 },
    ],
    alt: "Illustration of a woven basket of sweets and nuts",
  },
  {
    product: {
      id: "p_new_baby_basket",
      slug: "new-baby-basket",
      categoryId: "cat_baskets",
      name: "New baby basket",
      shortDescription: "Soft blanket, muslin cloths and a small toy.",
      description: "A basket for new parents: a cotton blanket, two muslin cloths, a plush toy and a box of chocolates for the grown-ups. Neutral colours.",
      isFeatured: false,
      basePriceMinor: 6000,
      currency: "USD",
      occasionIds: ["occ_new_baby"],
    },
    cities: [{ cityId: "city_baghdad", leadTimeDays: 3 }],
    alt: "Illustration of a baby gift basket with a blanket and toy",
  },
  /* ----- Gift cards (fictional partners) ----- */
  {
    product: {
      id: "gc_demo_market",
      slug: "demo-market-syria-gift-card",
      productType: "gift_card",
      partnerId: "partner_demo_market_sy",
      categoryId: "cat_giftcards",
      name: "Demo Market gift card",
      shortDescription: "Groceries and household essentials at a fictional Syrian supermarket.",
      description:
        "A store gift card for Demo Market, a fictional supermarket chain used as a placeholder. The recipient can spend it on groceries, household goods and fresh food at participating branches.",
      isFeatured: true,
      basePriceMinor: 2500,
      currency: "USD",
      occasionIds: ["occ_eid", "occ_just_because", "occ_new_baby"],
    },
    cities: [{ cityId: "city_damascus" }],
    alt: "Placeholder gift card design for Demo Market",
  },
  {
    product: {
      id: "gc_demo_dept",
      slug: "demo-department-store-iraq-gift-card",
      productType: "gift_card",
      partnerId: "partner_demo_dept_iq",
      categoryId: "cat_giftcards",
      name: "Demo Department Store gift card",
      shortDescription: "Clothing, home and electronics at a fictional Baghdad department store.",
      description:
        "A store gift card for Demo Department Store, a fictional retailer used as a placeholder. Redeemable in store for clothing, homeware and electronics.",
      isFeatured: true,
      basePriceMinor: 5000,
      currency: "USD",
      occasionIds: ["occ_birthday", "occ_graduation", "occ_anniversary"],
    },
    cities: [{ cityId: "city_baghdad" }],
    alt: "Placeholder gift card design for Demo Department Store",
  },
  {
    product: {
      id: "gc_demo_grocery",
      slug: "demo-grocery-partner-syria-gift-card",
      productType: "gift_card",
      partnerId: "partner_demo_grocery_sy",
      categoryId: "cat_giftcards",
      name: "Demo Grocery Partner gift card",
      shortDescription: "Everyday groceries at a fictional neighbourhood chain.",
      description: "A store gift card for Demo Grocery Partner, a fictional grocery chain used as a placeholder. Covers everyday shopping at any branch.",
      isFeatured: false,
      basePriceMinor: 2500,
      currency: "USD",
      occasionIds: ["occ_just_because", "occ_get_well"],
    },
    cities: [{ cityId: "city_damascus" }],
    alt: "Placeholder gift card design for Demo Grocery Partner",
  },
];

export const products: Product[] = seeds.map(({ product }) => ({
  productType: "physical",
  partnerId: null,
  status: "active",
  isDemo: true,
  ...product,
}));

export const productImages: ProductImage[] = seeds.map(({ product, alt }) => ({
  id: `img_${product.id}`,
  productId: product.id,
  path: `/demo/${product.slug}.svg`,
  alt,
  sortOrder: 0,
}));

export const productVariants: ProductVariant[] = seeds.flatMap(({ product, variants }) =>
  (variants ?? []).map((v, i) => ({
    id: `var_${product.id}_${i}`,
    productId: product.id,
    name: v.name,
    sku: `${product.slug}-${i}`.toUpperCase(),
    priceMinor: v.priceMinor,
    currency: product.currency,
    isDefault: v.isDefault ?? i === 0,
    isActive: true,
  })),
);

const hubs: Record<string, string> = { SY: "city_damascus", IQ: "city_baghdad" };
const cityIdsByCountry = (code: string) => cities.filter((c) => c.countryCode === code).map((c) => c.id);

export const productAvailability: ProductAvailability[] = seeds.flatMap(({ product, cities: cs }) =>
  cs.flatMap((c) => {
    const base: ProductAvailability = { productId: product.id, cityId: c.cityId, isAvailable: true, leadTimeDays: c.leadTimeDays };
    // Demo rule: a physical gift deliverable in a country's hub city (Damascus, Baghdad) is also deliverable
    // in that country's other demo cities, one day slower. Gift cards stay limited to the cities their partner lists.
    const country = Object.keys(hubs).find((k) => hubs[k] === c.cityId);
    if (product.productType !== "gift_card" && country) {
      const others = cityIdsByCountry(country)
        .filter((id) => id !== c.cityId)
        .map<ProductAvailability>((id) => ({ productId: product.id, cityId: id, isAvailable: true, leadTimeDays: (c.leadTimeDays ?? 2) + 1 }));
      return [base, ...others];
    }
    return [base];
  }),
);

/* ---------- Gift-card details ---------- */

const defaultTerms =
  "DRAFT — placeholder terms for demonstration. Gift cards are issued by the partner store and subject to the store's own terms. Giftivana arranges purchase and delivery only. Cards are not redeemable for cash and cannot be reloaded. These terms require legal review before launch.";

export const giftCardDetails: GiftCardDetails[] = [
  {
    productId: "gc_demo_market",
    faceCurrency: "SYP",
    defaultFulfillmentMethod: "manual",
    allowedFulfillmentMethods: ["manual", "physical_card"],
    redemptionInstructions:
      "Present the card at the checkout of any participating Demo Market branch. The cashier scans the card and deducts the purchase from its balance. The remaining balance stays on the card.",
    terms: defaultTerms,
    termsVersion: 1,
    expiryMonths: 12,
    restrictions: "Cannot be used for tobacco, phone credit, or to buy other gift cards. Balance cannot be withdrawn as cash.",
    deliveryTimingNote: "Arranged by the Giftivana team within 2–3 working days of payment confirmation, or on your chosen delivery date if later.",
    acceptedLocationIds: ["loc_dm_1", "loc_dm_2"],
  },
  {
    productId: "gc_demo_dept",
    faceCurrency: "IQD",
    defaultFulfillmentMethod: "manual",
    allowedFulfillmentMethods: ["manual"],
    redemptionInstructions:
      "Present the card at any till in the Demo Department Store. Partial redemption is supported; the remaining balance is printed on the receipt.",
    terms: defaultTerms,
    termsVersion: 1,
    expiryMonths: null,
    restrictions: "In-store only. Not valid for online purchases or on items already discounted more than 50%.",
    deliveryTimingNote: "Arranged by the Giftivana team within 3 working days of payment confirmation, or on your chosen delivery date if later.",
    acceptedLocationIds: ["loc_dd_1"],
  },
  {
    productId: "gc_demo_grocery",
    faceCurrency: "SYP",
    defaultFulfillmentMethod: "manual",
    allowedFulfillmentMethods: ["manual", "digital_code"],
    redemptionInstructions:
      "Show the code (printed or on a phone) to the cashier at any Demo Grocery Partner branch. The code can be used across several visits until the balance is spent.",
    terms: defaultTerms,
    termsVersion: 1,
    expiryMonths: 6,
    restrictions: "Not valid for phone top-ups or utility payments made in store.",
    deliveryTimingNote:
      "Arranged by the Giftivana team within 2 working days of payment confirmation. Digital codes, where offered, are sent only after the partner issues them.",
    acceptedLocationIds: ["loc_dg_1"],
  },
];

export const giftCardDenominations: GiftCardDenomination[] = [
  // Demo Market — face value in SYP (0 decimals), charge in USD cents. No conversion implied.
  {
    id: "den_dm_1",
    productId: "gc_demo_market",
    faceValueMinor: 250000,
    faceCurrency: "SYP",
    chargePriceMinor: 2500,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "den_dm_2",
    productId: "gc_demo_market",
    faceValueMinor: 500000,
    faceCurrency: "SYP",
    chargePriceMinor: 4800,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "den_dm_3",
    productId: "gc_demo_market",
    faceValueMinor: 1000000,
    faceCurrency: "SYP",
    chargePriceMinor: 9400,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 3,
  },
  // Demo Department Store — face value in IQD.
  {
    id: "den_dd_1",
    productId: "gc_demo_dept",
    faceValueMinor: 50000,
    faceCurrency: "IQD",
    chargePriceMinor: 5000,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "den_dd_2",
    productId: "gc_demo_dept",
    faceValueMinor: 100000,
    faceCurrency: "IQD",
    chargePriceMinor: 9500,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "den_dd_3",
    productId: "gc_demo_dept",
    faceValueMinor: 200000,
    faceCurrency: "IQD",
    chargePriceMinor: 18500,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 3,
  },
  // Demo Grocery — face value in SYP.
  {
    id: "den_dg_1",
    productId: "gc_demo_grocery",
    faceValueMinor: 250000,
    faceCurrency: "SYP",
    chargePriceMinor: 2500,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "den_dg_2",
    productId: "gc_demo_grocery",
    faceValueMinor: 500000,
    faceCurrency: "SYP",
    chargePriceMinor: 4800,
    chargeCurrency: "USD",
    isActive: true,
    sortOrder: 2,
  },
];
