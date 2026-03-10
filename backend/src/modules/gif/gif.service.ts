import HttpError from "../../shared/errors/httpError.js";

type GiphyItem = {
  id: string;
  title: string;
  images?: {
    fixed_width?: { url?: string };
    original?: { url?: string };
    preview_gif?: { url?: string };
  };
};

type GiphySearchResponse = {
  data?: GiphyItem[];
  pagination?: {
    total_count?: number;
    count?: number;
    offset?: number;
  };
};

export type GifSearchItem = {
  id: string;
  title: string;
  previewUrl: string;
  gifUrl: string;
};

export type GifSearchResult = {
  items: GifSearchItem[];
  nextOffset: number | null;
};

export async function searchGifs(
  query: string,
  limit: number,
  offset: number,
): Promise<GifSearchResult> {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "GIPHY_API_KEY is not configured");
  }

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new HttpError(502, "Failed to reach GIF provider");
  }

  if (!response.ok) {
    throw new HttpError(502, "GIF provider returned an error");
  }

  const payload = (await response.json()) as GiphySearchResponse;
  const rawItems = payload.data ?? [];

  const items = rawItems
    .map((item) => {
      const gifUrl = item.images?.original?.url;
      const previewUrl =
        item.images?.fixed_width?.url ?? item.images?.preview_gif?.url ?? gifUrl;

      if (!gifUrl || !previewUrl) return null;

      return {
        id: item.id,
        title: item.title || "GIF",
        previewUrl,
        gifUrl,
      };
    })
    .filter((item): item is GifSearchItem => item !== null);

  const nextOffset =
    typeof payload.pagination?.offset === "number" &&
    typeof payload.pagination?.count === "number"
      ? payload.pagination.offset + payload.pagination.count
      : null;

  return { items, nextOffset };
}
