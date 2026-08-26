export type Product = {
  /** URL slug, e.g. /product/snake-eyes-runner */
  slug: string;
  name: string;
  /** The die face (1-6) that lands on this shoe in the roll widget. */
  face: number;
  /** Price in US cents. */
  price: number;
  tagline: string;
  description: string;
  colorway: string;
  drop: string;
  sizes: number[];
  /** Two-stop gradient used for the product art panel. */
  gradient: [string, string];
  accent: string;
};

export const products: Product[] = [
  {
    slug: "snake-eyes-runner",
    name: "Snake Eyes Runner",
    face: 1,
    price: 14800,
    tagline: "The long-shot daily trainer.",
    description:
      "One pip, all upside. The Snake Eyes Runner pairs a knit upper with a rolled foam midsole that keeps its bounce past the mile you meant to stop at. Reflective heel counter, gum outsole, and a tongue tag stamped with a single lonely pip.",
    colorway: "Bone / Ember Red",
    drop: "8mm",
    sizes: [7, 8, 9, 10, 11, 12, 13],
    gradient: ["#e1483c", "#7c1d2b"],
    accent: "#e1483c",
  },
  {
    slug: "deuce-trainer",
    name: "Deuce Trainer",
    face: 2,
    price: 12600,
    tagline: "Two pips, twice the grip.",
    description:
      "Built flat and wide for lifting days. A dense rubber slab under the heel, a canvas upper that breaks in like an old jacket, and enough toe splay to actually stand your ground. Pairs well with heavy things.",
    colorway: "Slate / Chalk",
    drop: "4mm",
    sizes: [6, 7, 8, 9, 10, 11, 12, 13],
    gradient: ["#4f6b8a", "#1d2a3a"],
    accent: "#7aa2d0",
  },
  {
    slug: "trey-court-low",
    name: "Trey Court Low",
    face: 3,
    price: 11900,
    tagline: "Three from downtown.",
    description:
      "A low-cut court shoe with a herringbone outsole that squeaks on purpose. Suede overlays at the toe, a padded collar that stays put, and a heel pull loop for the times you are already late to the game.",
    colorway: "Court Green / Bone",
    drop: "6mm",
    sizes: [7, 8, 9, 10, 11, 12],
    gradient: ["#2f7d5a", "#0f3527"],
    accent: "#4ec08a",
  },
  {
    slug: "hard-four-hiker",
    name: "Hard Four Hiker",
    face: 4,
    price: 18400,
    tagline: "The hard way, on purpose.",
    description:
      "Waxed canvas and full-grain leather over a lugged outsole with 5mm teeth. Gusseted tongue keeps the scree out, and the whole thing resoles instead of retiring. Made for the trail that does not switchback.",
    colorway: "Field Tan / Umber",
    drop: "10mm",
    sizes: [7, 8, 9, 10, 11, 12, 13, 14],
    gradient: ["#b5813f", "#4a2c15"],
    accent: "#e0a45c",
  },
  {
    slug: "fever-five-slip-on",
    name: "Fever Five Slip-On",
    face: 5,
    price: 9800,
    tagline: "No laces, no hesitation.",
    description:
      "Elastic goring, a collapsible heel, and a cork footbed that molds to you in about a week. The one you keep by the door for the trip you decided on ninety seconds ago.",
    colorway: "Midnight / Gold",
    drop: "6mm",
    sizes: [6, 7, 8, 9, 10, 11, 12],
    gradient: ["#6b4fa8", "#241540"],
    accent: "#b08ce8",
  },
  {
    slug: "boxcars-high-top",
    name: "Boxcars High-Top",
    face: 6,
    price: 16500,
    tagline: "Double six. Roll it and walk.",
    description:
      "The full-height statement of the line. Tumbled leather up to the ankle, six brass eyelets a side, and a vulcanized sole with a gold foxing stripe. Heavy in the hand, weightless once laced.",
    colorway: "Onyx / Brass",
    drop: "8mm",
    sizes: [7, 8, 9, 10, 11, 12, 13],
    gradient: ["#c9a227", "#2b2205"],
    accent: "#d8a24a",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductByFace(face: number): Product | undefined {
  return products.find((product) => product.face === face);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
