// Shared by the pool page and its client components. Only the fields the
// screen shows cross to the browser.

export const CATEGORIES = ["eat", "coffee", "drink", "shop", "records", "books", "see", "stay"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  eat: "Eat",
  coffee: "Coffee",
  drink: "Drink",
  shop: "Shop",
  records: "Records",
  books: "Books",
  see: "See",
  stay: "Stay",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  eat: "#e4572e",
  coffee: "#8a5a44",
  drink: "#7b2cbf",
  shop: "#2a9d8f",
  records: "#e0a100",
  books: "#4c9a2a",
  see: "#d6336c",
  stay: "#495057",
};

export const UNSORTED_COLOR = "#adb5bd";

export type PoolSave = {
  id: string;
  name: string;
  city: string | null;
  category: Category | null;
  status: "want" | "been";
  via: string | null;
  why: string | null;
  addedBy: string;
  lat: number;
  lng: number;
  moved: boolean;
  tripIds: string[];
};

// What a map pin needs; anything with these fields can go on a map.
export type MapPin = Pick<PoolSave, "id" | "lat" | "lng" | "category">;

export type TripOption = { id: string; name: string };
