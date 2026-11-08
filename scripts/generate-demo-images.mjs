/**
 * Generates placeholder SVG artwork for demo products, categories, occasions
 * and partners into /public/demo. Re-run with `npm run demo:images`.
 * Real imagery is uploaded through the admin dashboard (Stage 5).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "public", "demo");
mkdirSync(out, { recursive: true });

const palettes = {
  green: ["#dde8dc", "#2e5a3e"],
  peach: ["#f8e2d3", "#b9663f"],
  gold: ["#ead9b4", "#8a6410"],
  ivory: ["#f1ebdf", "#4e7d5c"],
};

// Simple, honest glyphs — these are stand-ins, not product photos.
const glyphs = {
  flower: `<circle cx="100" cy="92" r="16" fill="${"{fg}"}"/><g fill="none" stroke="{fg}" stroke-width="7" stroke-linecap="round"><path d="M100 112v48"/><path d="M100 140c-14 0-22-8-28-18"/><path d="M100 150c14 0 22-8 28-18"/></g><g fill="{fg}" opacity=".55"><circle cx="78" cy="78" r="12"/><circle cx="122" cy="78" r="12"/><circle cx="78" cy="106" r="12"/><circle cx="122" cy="106" r="12"/></g>`,
  cake: `<rect x="50" y="104" width="100" height="44" rx="8" fill="{fg}"/><rect x="60" y="80" width="80" height="30" rx="8" fill="{fg}" opacity=".7"/><rect x="96" y="56" width="8" height="26" rx="3" fill="{fg}"/><circle cx="100" cy="52" r="6" fill="#b9663f"/>`,
  chocolate: `<g fill="{fg}"><rect x="54" y="78" width="26" height="26" rx="5"/><rect x="87" y="78" width="26" height="26" rx="5"/><rect x="120" y="78" width="26" height="26" rx="5"/><rect x="54" y="111" width="26" height="26" rx="5" opacity=".7"/><rect x="87" y="111" width="26" height="26" rx="5" opacity=".7"/><rect x="120" y="111" width="26" height="26" rx="5" opacity=".7"/></g>`,
  balloon: `<g fill="{fg}"><ellipse cx="84" cy="80" rx="22" ry="28"/><ellipse cx="120" cy="92" rx="22" ry="28" opacity=".7"/></g><g fill="none" stroke="{fg}" stroke-width="3" stroke-linecap="round"><path d="M84 108c6 14-6 26 4 44"/><path d="M120 120c-6 14 6 26-4 40"/></g>`,
  plant: `<rect x="72" y="120" width="56" height="36" rx="6" fill="{fg}"/><g fill="none" stroke="{fg}" stroke-width="7" stroke-linecap="round"><path d="M100 120V70"/><path d="M100 96c-18 0-30-10-34-26 18 0 30 10 34 26z" fill="{fg}" opacity=".7"/><path d="M100 84c18 0 30-10 34-26-18 0-30 10-34 26z" fill="{fg}" opacity=".7"/></g>`,
  basket: `<path d="M48 92h104l-10 56H58z" fill="{fg}"/><path d="M66 92c0-26 14-40 34-40s34 14 34 40" fill="none" stroke="{fg}" stroke-width="7"/><g fill="{fg}" opacity=".6"><circle cx="80" cy="84" r="9"/><circle cx="104" cy="78" r="9"/><circle cx="126" cy="86" r="9"/></g>`,
  card: `<rect x="40" y="62" width="120" height="76" rx="12" fill="{fg}"/><rect x="40" y="80" width="120" height="14" fill="#1e2420" opacity=".25"/><rect x="54" y="108" width="52" height="8" rx="4" fill="#fff" opacity=".7"/>`,
  ribbon: `<rect x="56" y="86" width="88" height="66" rx="10" fill="{fg}"/><rect x="94" y="86" width="12" height="66" fill="#fff" opacity=".5"/><rect x="56" y="112" width="88" height="12" fill="#fff" opacity=".5"/><path d="M100 86c-16-28-40-20-28-4s28 4 28 4zm0 0c16-28 40-20 28-4s-28 4-28 4z" fill="{fg}"/>`,
  dates: `<g fill="{fg}"><ellipse cx="74" cy="104" rx="14" ry="22" transform="rotate(-20 74 104)"/><ellipse cx="104" cy="98" rx="14" ry="22"/><ellipse cx="132" cy="106" rx="14" ry="22" transform="rotate(20 132 106)"/></g>`,
  tree: `<rect x="86" y="124" width="28" height="30" rx="4" fill="{fg}"/><path d="M100 36 60 112h80z" fill="{fg}" opacity=".75"/><path d="M100 60 72 112h56z" fill="{fg}"/>`,
  number: `<text x="100" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="92" font-weight="600" fill="{fg}">7</text>`,
  baby: `<circle cx="100" cy="92" r="30" fill="{fg}" opacity=".8"/><rect x="60" y="118" width="80" height="34" rx="14" fill="{fg}"/>`,
  star: `<path d="M100 44l16 34 37 5-27 26 7 37-33-18-33 18 7-37-27-26 37-5z" fill="{fg}"/>`,
  moon: `<path d="M118 48a48 48 0 1 0 30 84 40 40 0 1 1-30-84z" fill="{fg}"/>`,
  heart: `<path d="M100 150s-50-30-50-66a26 26 0 0 1 50-10 26 26 0 0 1 50 10c0 36-50 66-50 66z" fill="{fg}"/>`,
  cap: `<path d="M100 60l60 24-60 24-60-24z" fill="{fg}"/><path d="M66 94v26c0 10 68 10 68 0V94" fill="none" stroke="{fg}" stroke-width="7"/>`,
  leaf: `<path d="M60 140C60 90 100 60 148 56c-4 48-34 88-88 84z" fill="{fg}"/><path d="M64 136l76-72" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`,
  store: `<rect x="48" y="86" width="104" height="62" rx="6" fill="{fg}"/><path d="M44 86l10-30h92l10 30z" fill="{fg}" opacity=".7"/><rect x="88" y="110" width="24" height="38" rx="3" fill="#fff" opacity=".6"/>`,
};

function svg({ glyph, palette, label, wide }) {
  const [bg, fg] = palettes[palette];
  const w = wide ? 320 : 200;
  const body = glyphs[glyph].replaceAll("{fg}", fg);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 200" role="img" aria-label="${label} (placeholder)">
<rect width="${w}" height="200" fill="${bg}"/>
<g transform="translate(${(w - 200) / 2} 0)">${body}</g>
<text x="${w - 10}" y="190" text-anchor="end" font-family="system-ui,sans-serif" font-size="11" fill="${fg}" opacity=".75">demo placeholder</text>
</svg>`;
}

const files = [
  ["soft-peony-bouquet", "flower", "peach", "Peony bouquet"],
  ["white-rose-arrangement", "flower", "ivory", "White roses"],
  ["sunflower-bunch", "flower", "gold", "Sunflowers"],
  ["chocolate-celebration-cake", "cake", "peach", "Chocolate cake"],
  ["pistachio-cream-cake", "cake", "green", "Pistachio cake"],
  ["assorted-chocolate-box", "chocolate", "gold", "Chocolate box"],
  ["chocolate-dipped-dates", "dates", "peach", "Chocolate dates"],
  ["helium-balloon-bunch", "balloon", "peach", "Balloons"],
  ["number-balloon-set", "number", "gold", "Number balloons"],
  ["small-olive-tree", "tree", "green", "Olive tree"],
  ["jasmine-plant", "plant", "green", "Jasmine plant"],
  ["sweets-and-nuts-basket", "basket", "gold", "Sweets basket"],
  ["new-baby-basket", "baby", "ivory", "Baby basket"],
  ["demo-market-syria-gift-card", "card", "green", "Demo Market gift card", true],
  ["demo-department-store-iraq-gift-card", "card", "gold", "Demo Department Store gift card", true],
  ["demo-grocery-partner-syria-gift-card", "card", "peach", "Demo Grocery Partner gift card", true],
  ["cat-flowers", "flower", "peach", "Flowers"],
  ["cat-cakes", "cake", "ivory", "Cakes"],
  ["cat-chocolates", "chocolate", "gold", "Chocolates"],
  ["cat-balloons", "balloon", "peach", "Balloons"],
  ["cat-plants", "leaf", "green", "Plants"],
  ["cat-baskets", "basket", "gold", "Gift baskets"],
  ["cat-giftcards", "card", "green", "Gift cards"],
  ["occ-birthday", "cake", "peach", "Birthday"],
  ["occ-eid", "moon", "gold", "Eid"],
  ["occ-new-baby", "baby", "ivory", "New baby"],
  ["occ-anniversary", "heart", "peach", "Anniversary"],
  ["occ-graduation", "cap", "green", "Graduation"],
  ["occ-get-well", "leaf", "green", "Get well"],
  ["occ-just-because", "ribbon", "gold", "Just because"],
  ["partner-demo-market", "store", "green", "Demo Market"],
  ["partner-demo-dept", "store", "gold", "Demo Department Store"],
  ["partner-demo-grocery", "store", "peach", "Demo Grocery Partner"],
];

for (const [name, glyph, palette, label, wide] of files) {
  writeFileSync(join(out, `${name}.svg`), svg({ glyph, palette, label, wide }));
}
console.log(`Wrote ${files.length} placeholder SVGs to public/demo`);
