import { searchGifs, fetchTrendingGifs, fetchGifById } from "../gifs";
import type { Gif } from "../gifs.types";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

const gif1: Gif = { id: "gif-1" } as Gif;
const gif2: Gif = { id: "gif-2" } as Gif;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("extractGifList via searchGifs / fetchTrendingGifs", () => {
  it("handles direct array response", async () => {
    mockFetchJson.mockResolvedValue([gif1, gif2]);
    expect(await searchGifs("cat")).toEqual([gif1, gif2]);
  });

  it("handles { data: Gif[] } response", async () => {
    mockFetchJson.mockResolvedValue({ data: [gif1, gif2] });
    expect(await searchGifs("cat")).toEqual([gif1, gif2]);
  });

  it("handles { results: Gif[] } response", async () => {
    mockFetchJson.mockResolvedValue({ results: [gif1, gif2] });
    expect(await searchGifs("cat")).toEqual([gif1, gif2]);
  });

  it("handles double-nested { data: { data: Gif[] } } response", async () => {
    mockFetchJson.mockResolvedValue({ data: { data: [gif1] } });
    expect(await searchGifs("cat")).toEqual([gif1]);
  });

  it("handles double-nested { data: { results: Gif[] } } response", async () => {
    mockFetchJson.mockResolvedValue({ data: { results: [gif1] } });
    expect(await searchGifs("cat")).toEqual([gif1]);
  });

  it("handles double-nested { results: { data: Gif[] } } response", async () => {
    mockFetchJson.mockResolvedValue({ results: { data: [gif1] } });
    expect(await fetchTrendingGifs()).toEqual([gif1]);
  });

  it("handles double-nested { results: { results: Gif[] } } response", async () => {
    mockFetchJson.mockResolvedValue({ results: { results: [gif2] } });
    expect(await fetchTrendingGifs()).toEqual([gif2]);
  });

  it("returns empty array for undefined payload", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    expect(await searchGifs("cat")).toEqual([]);
  });

  it("returns empty array for unknown shape", async () => {
    mockFetchJson.mockResolvedValue({ result: true });
    expect(await fetchTrendingGifs()).toEqual([]);
  });

  it("encodes the search query in the URL", async () => {
    mockFetchJson.mockResolvedValue([]);
    await searchGifs("cute cats");
    expect(mockFetchJson).toHaveBeenCalledWith("/gifs/search?q=cute%20cats", {
      method: "GET",
    });
  });
});

describe("extractGif via fetchGifById", () => {
  it("returns the gif directly when it has an id field", async () => {
    mockFetchJson.mockResolvedValue(gif1);
    const result = await fetchGifById("gif-1");
    expect(result).toEqual(gif1);
  });

  it("unwraps { data: Gif } response", async () => {
    mockFetchJson.mockResolvedValue({ data: gif1 });
    const result = await fetchGifById("gif-1");
    expect(result).toEqual(gif1);
  });

  it("throws when payload is undefined", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await expect(fetchGifById("missing")).rejects.toThrow("GIF introuvable");
  });

  it("encodes the gif id in the url", async () => {
    mockFetchJson.mockResolvedValue(gif1);
    await fetchGifById("abc/123");
    expect(mockFetchJson).toHaveBeenCalledWith("/gifs/abc%2F123", {
      method: "GET",
    });
  });
});
