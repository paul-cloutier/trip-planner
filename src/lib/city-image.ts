import "server-only";

import { z } from "zod";

// A picture for a city, taken from the lead image of its Wikipedia article
// (the images are Wikimedia Commons, mostly CC-licensed; credit Wikipedia where
// they show). The host is fixed here and the city only ever lands in a query
// value, never in the host or path. Nothing about us is sent, just a city name.
const WIKIPEDIA = "https://en.wikipedia.org/w/api.php";
const MONTH = 60 * 60 * 24 * 30;

const response = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          thumbnail: z
            .object({ source: z.url().refine((u) => {
              const { protocol, hostname } = new URL(u);
              return protocol === "https:" && hostname.endsWith(".wikimedia.org");
            }) })
            .optional(),
        }),
      ),
    })
    .optional(),
});

export async function cityImage(city: string): Promise<string | null> {
  const url = new URL(WIKIPEDIA);
  url.search = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "1000",
    redirects: "1",
    titles: city,
    format: "json",
  }).toString();

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: MONTH },
    });
    if (!res.ok) return null;
    const parsed = response.safeParse(await res.json());
    if (!parsed.success) return null;
    const pages = Object.values(parsed.data.query?.pages ?? {});
    return pages[0]?.thumbnail?.source ?? null;
  } catch (error) {
    console.error("cityImage failed", error instanceof Error ? error.name : "unknown");
    return null;
  }
}
