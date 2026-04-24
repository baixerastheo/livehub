import { uploadMessageImage } from "../message.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchFormData: jest.fn(),
}));

import { fetchFormData } from "@/src/lib/apiClient";
const mockFetchFormData = fetchFormData as jest.MockedFunction<typeof fetchFormData>;

beforeEach(() => {
  mockFetchFormData.mockReset();
});

describe("uploadMessageImage", () => {
  it("calls POST /messages/image", async () => {
    mockFetchFormData.mockResolvedValue({ url: "https://example.com/img.jpg" });
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await uploadMessageImage(file);
    expect(mockFetchFormData).toHaveBeenCalledWith(
      "/messages/image",
      expect.any(FormData),
    );
  });

  it("appends the file under the 'file' field", async () => {
    mockFetchFormData.mockResolvedValue({ url: "https://example.com/img.jpg" });
    const file = new File(["img"], "photo.png", { type: "image/png" });
    await uploadMessageImage(file);
    const formData = mockFetchFormData.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(file);
  });

  it("returns the upload response with url", async () => {
    const response = { url: "https://example.com/img.webp" };
    mockFetchFormData.mockResolvedValue(response);
    const file = new File(["img"], "photo.webp", { type: "image/webp" });
    expect(await uploadMessageImage(file)).toEqual(response);
  });
});
